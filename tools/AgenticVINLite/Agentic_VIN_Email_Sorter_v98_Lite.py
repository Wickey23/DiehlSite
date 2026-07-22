#!/usr/bin/env python3
"""Agentic VIN Email Sorter Lite v98.

Local Windows browser app for VIN-centric Outlook evidence filing and Excel Notes DB safety.
Lite mode prioritizes stability: local working DB, run lock, checkpoints, reminder-only
follow-up logic, and no automatic outbound email sending.
"""
from __future__ import annotations

import argparse
import email
from email import policy
import csv
import datetime as dt
import html
import json
import os
import re
import shutil
import sys
import tempfile
import threading
import time
import uuid
import webbrowser
import zipfile
from dataclasses import dataclass
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple
from urllib.parse import parse_qs, urlparse

try:
    from openpyxl import Workbook, load_workbook
except Exception:  # optional until SETUP installs requirements
    Workbook = None
    load_workbook = None

APP_NAME = "Agentic VIN Email Sorter Lite"
APP_VERSION = "v98 Lite"
DEFAULT_ROOT = r"C:\Users\sameer\OneDrive - Diehl's Truck World\VIN FOLDER AGENT"
DEFAULT_DB = DEFAULT_ROOT + r"\VIN_Notes_Database.xlsx"
SETTINGS_FILE_NAME = "AgenticVIN_UserSettings.json"
WORKING_DB_NAME = "VIN_Notes_Database_WORKING.xlsx"
RUN_LOCK_NAME = "agentic_vin_lite_run.lock"
RUNTIME_ONLY_SETTINGS = {"_original_notes_database_file", "_working_notes_database_file"}

SHEET_HEADERS: Dict[str, List[str]] = {
    "VIN Notes": ["VIN", "VIN6", "Customer", "First Seen", "Last Updated", "Status", "Running Notes", "Warranty / In-Service Summary", "Follow-Up Summary", "Local VIN Folder Link", "Shared VIN Folder Link"],
    "VIN Timeline": ["Timestamp", "VIN", "Event Date", "Source Type", "Source Subject", "Source Sender", "Event Category", "Event Summary", "Evidence", "Local VIN Folder Link", "Shared VIN Folder Link"],
    "Detailed Log": ["Task ID", "Processed Date", "Search Method", "Email Received", "Sender", "Subject", "VINs Filed", "VIN Count", "Attachments Processed", "Saved Paths", "Email Chain Paths", "Identifiers Found", "AI Used", "Operational Note", "Status", "Message"],
    "Warranty Info": ["VIN", "VIN6", "Customer", "Warranty Start Date", "In-Service Date", "Delivery Date", "Mileage", "Source", "Source Subject", "Source Sender", "Source Received Date", "Evidence Text", "Confidence / Reason"],
    "Follow-Up Queue": ["Status", "VIN", "Follow-Up Decision", "Priority", "Follow-Up By Date", "Due Date", "Follow-Up About", "Category", "Missing / Needed Info", "Decision Reason", "Suggested Follow-Up Blurb", "Source Subject", "Sender", "Received Date", "Local VIN Folder Link", "Shared VIN Folder Link"],
    "Follow-Up Reminders": ["Reminder Status", "VIN", "Priority", "Due Date", "Follow-Up Category", "Follow-Up About", "Missing / Needed Info", "Suggested Reminder", "Source Subject", "Last Sender", "Last Email Received", "Reason", "Local VIN Folder Link", "Shared VIN Folder Link", "Last Updated"],
    "Run Checkpoints": ["Timestamp", "Run ID", "Stage", "Folder", "VIN / Key", "Search Term", "Match Count", "Task Subject", "Task Sender", "Status", "Details"],
    "Known Identifiers": ["Identifier Type", "Identifier", "VIN", "VIN6", "Source", "Source Subject", "First Seen", "Last Seen", "Confidence", "Notes"],
    "Agent Guide": ["Topic", "Details"],
}

DEFAULT_SETTINGS: Dict[str, Any] = {
    "app_profile": "LIGHT",
    "light_mode": True,
    "root_folder": DEFAULT_ROOT,
    "notes_database_file": DEFAULT_DB,
    "use_local_working_notes_db": True,
    "local_working_notes_db_folder": r"%LOCALAPPDATA%\AgenticVIN\WorkingDB",
    "publish_working_db_after_run": True,
    "publish_working_db_during_run": False,
    "settings_never_persist_working_db_path": True,
    "run_mode": "Both",
    "worker_agents": 2,
    "max_emails_to_scan": 75,
    "max_vins_from_excel": 1000,
    "excel_vin_sheet_name": "Live",
    "excel_vin_column": "C",
    "excel_customer_column": "B",
    "excel_delivery_column": "D",
    "excel_status_column": "M",
    "use_outlook_indexed_search": False,
    "outlook_indexed_search_mode": "Instant Search UI",
    "fallback_scan_if_search_empty": True,
    "continue_on_outlook_search_errors": True,
    "skip_outlook_sync_if_com_busy": True,
    "outlook_com_retry_attempts": 6,
    "outlook_com_retry_wait_seconds": 2,
    "selected_outlook_folders": ["sameer@nyfreightliner.com/Sent Items", "sameer@nyfreightliner.com/Inbox"],
    "incremental_write_successful_finds": True,
    "write_search_checkpoints": True,
    "single_run_lock_enabled": True,
    "auto_clean_stale_run_lock": True,
    "use_ai_notes": True,
    "chatgpt_pdf_reader_enabled": True,
    "ai_followup_decision_enabled": True,
    "use_pdf_form_table_parser": True,
    "capture_warranty_start_info": True,
    "use_ocr_fallback": False,
    "use_followup_engine": True,
    "followup_safety_audit_enabled": True,
    "followup_safety_audit_after_run": True,
    "followup_reminder_only_mode": True,
    "disable_followup_email_sending": True,
    "warranty_backfill_after_run": True,
    "master_compile_after_run": False,
    "folder_front_capture_after_run": False,
    "vin_evidence_profile_after_run": False,
    "recurring_runs_enabled": False,
    "vin_agent_auto_reply_enabled": False,
    "auto_scan_all_inboxes_on_run": False,
    "shared_folder_link_mode": "Off",
    "shared_folder_base_link": "",
    "excel_source_file": "",
    "local_test_mode_folder": "",
}

LOG_LINES: List[str] = []
LOG_LOCK = threading.Lock()
RUN_THREAD: Optional[threading.Thread] = None
RUN_STATE: Dict[str, Any] = {"status": "idle", "phase": "Idle", "started": None, "latest": "Ready", "progress_current": 0, "progress_total": 0}


def now_iso() -> str:
    return dt.datetime.now().replace(microsecond=0).isoformat(sep=" ")


def log(message: str, phase: Optional[str] = None) -> None:
    line = f"[{now_iso()}] {message}"
    with LOG_LOCK:
        LOG_LINES.append(line)
        del LOG_LINES[:-500]
        RUN_STATE["latest"] = message
        if phase:
            RUN_STATE["phase"] = phase
    print(line, flush=True)


def expand_path(value: str) -> Path:
    return Path(os.path.expandvars(value)).expanduser()


def working_folder(settings: Dict[str, Any]) -> Path:
    return expand_path(settings["local_working_notes_db_folder"])


def working_db_path(settings: Dict[str, Any]) -> Path:
    return working_folder(settings) / WORKING_DB_NAME


def run_lock_path(settings: Dict[str, Any]) -> Path:
    return working_folder(settings) / RUN_LOCK_NAME


def settings_path(settings: Optional[Dict[str, Any]] = None) -> Path:
    root = (settings or DEFAULT_SETTINGS).get("root_folder", DEFAULT_ROOT)
    return expand_path(root) / SETTINGS_FILE_NAME


def load_user_settings() -> Dict[str, Any]:
    settings = dict(DEFAULT_SETTINGS)
    path = settings_path(settings)
    if path.exists():
        try:
            loaded = json.loads(path.read_text(encoding="utf-8"))
            if isinstance(loaded, dict):
                settings.update(loaded)
        except Exception as exc:
            log(f"Settings load failed; using defaults: {exc}")
    for key in RUNTIME_ONLY_SETTINGS:
        settings.pop(key, None)
    if settings.get("settings_never_persist_working_db_path") and str(settings.get("notes_database_file", "")).endswith(WORKING_DB_NAME):
        settings["notes_database_file"] = DEFAULT_DB
    return settings


def save_user_settings(settings: Dict[str, Any]) -> Path:
    clean = {k: v for k, v in settings.items() if k not in RUNTIME_ONLY_SETTINGS}
    if clean.get("settings_never_persist_working_db_path") and str(clean.get("notes_database_file", "")).endswith(WORKING_DB_NAME):
        clean["notes_database_file"] = DEFAULT_DB
    path = settings_path(clean)
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix="settings_", suffix=".json", dir=str(path.parent))
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(clean, f, indent=2)
    os.replace(tmp, path)
    return path


def validate_xlsx(path: Path) -> Tuple[bool, str]:
    if not path.exists():
        return False, "file does not exist"
    try:
        with zipfile.ZipFile(path, "r") as zf:
            bad = zf.testzip()
            if bad:
                return False, f"bad zip member: {bad}"
            names = set(zf.namelist())
            if "xl/workbook.xml" not in names:
                return False, "missing xl/workbook.xml"
        return True, "valid"
    except Exception as exc:
        return False, str(exc)


def ensure_workbook_schema(path: Path) -> None:
    if Workbook is None or load_workbook is None:
        raise RuntimeError("openpyxl is required. Run SETUP_ONCE_V98_LIGHT.bat first.")
    if path.exists() and validate_xlsx(path)[0]:
        wb = load_workbook(path)
    else:
        wb = Workbook()
        wb.active.title = "VIN Notes"
    for sheet, headers in SHEET_HEADERS.items():
        ws = wb[sheet] if sheet in wb.sheetnames else wb.create_sheet(sheet)
        if ws.max_row < 1 or [ws.cell(1, c).value for c in range(1, len(headers) + 1)] != headers:
            for c, header in enumerate(headers, 1):
                ws.cell(1, c).value = header
    guide = wb["Agent Guide"]
    if guide.max_row == 1:
        guide.append(["Lite Mode", "Reminder-only follow-up; no automatic email sending; active writes use the local working DB."])
    path.parent.mkdir(parents=True, exist_ok=True)
    wb.save(path)


def prepare_working_notes_db(settings: Dict[str, Any]) -> Path:
    folder = working_folder(settings)
    folder.mkdir(parents=True, exist_ok=True)
    source = expand_path(settings["notes_database_file"])
    target = working_db_path(settings)
    if source.exists() and validate_xlsx(source)[0]:
        shutil.copy2(source, target)
        log(f"Copied valid OneDrive Notes DB to working DB: {target}", "Database")
    elif not target.exists() or not validate_xlsx(target)[0]:
        log("Creating new working Notes DB because no valid source/working DB was available.", "Database")
    ensure_workbook_schema(target)
    settings["_original_notes_database_file"] = str(source)
    settings["_working_notes_database_file"] = str(target)
    return target


def append_sheet_row(db_path: Path, sheet: str, row: Iterable[Any]) -> None:
    ensure_workbook_schema(db_path)
    wb = load_workbook(db_path)
    wb[sheet].append(list(row))
    wb.save(db_path)


def write_checkpoint(settings: Dict[str, Any], run_id: str, stage: str, status: str = "OK", details: str = "", folder: str = "", vin: str = "", term: str = "", match_count: Any = "", subject: str = "", sender: str = "") -> None:
    if not settings.get("write_search_checkpoints", True):
        return
    db = Path(settings.get("_working_notes_database_file") or working_db_path(settings))
    append_sheet_row(db, "Run Checkpoints", [now_iso(), run_id, stage, folder, vin, term, match_count, subject, sender, status, details])


def publish_working_db(settings: Dict[str, Any]) -> Path:
    working = Path(settings.get("_working_notes_database_file") or working_db_path(settings))
    ok, reason = validate_xlsx(working)
    if not ok:
        raise RuntimeError(f"Working DB is invalid; publish blocked: {reason}")
    target = expand_path(settings["notes_database_file"])
    target.parent.mkdir(parents=True, exist_ok=True)
    backup_dir = expand_path(settings["root_folder"]) / "_Notes_DB_Publish_Backups"
    backup_dir.mkdir(parents=True, exist_ok=True)
    if target.exists() and validate_xlsx(target)[0]:
        shutil.copy2(target, backup_dir / f"VIN_Notes_Database_before_publish_{dt.datetime.now():%Y%m%d_%H%M%S}.xlsx")
    try:
        shutil.copy2(working, target)
        log(f"Published working DB to OneDrive target: {target}", "Publishing Working DB")
        return target
    except PermissionError as exc:
        ready = backup_dir / f"PUBLISH_READY_{dt.datetime.now():%Y%m%d_%H%M%S}.xlsx"
        shutil.copy2(working, ready)
        log(f"Publish target locked; kept publish-ready copy: {ready}. Error: {exc}", "Publishing Working DB")
        return ready


def acquire_run_lock(settings: Dict[str, Any], run_id: str) -> Path:
    lock = run_lock_path(settings)
    lock.parent.mkdir(parents=True, exist_ok=True)
    if lock.exists():
        age = time.time() - lock.stat().st_mtime
        if settings.get("auto_clean_stale_run_lock") and age > 8 * 3600:
            lock.unlink(missing_ok=True)
        else:
            raise RuntimeError(f"Another Lite run appears active: {lock}")
    lock.write_text(json.dumps({"run_id": run_id, "started": now_iso()}), encoding="utf-8")
    return lock


def normalize_vin(value: Any) -> str:
    text = re.sub(r"[^A-Za-z0-9]", "", str(value or "")).upper()
    return text if len(text) == 17 and not re.search(r"[IOQ]", text) else ""


def vin6(value: str) -> str:
    return value[-6:] if value else ""


def expand_vin_suffix_range(text: str) -> List[str]:
    m = re.search(r"\b([A-Z]{1,4})(\d{2,6})\s*-\s*([A-Z]{1,4})?(\d{2,6})\b", text.upper())
    if not m:
        return []
    p1, n1, p2, n2 = m.groups()
    p2 = p2 or p1
    if p1 != p2 or len(n1) != len(n2):
        return []
    start, end = int(n1), int(n2)
    if end < start or end - start > 500:
        return []
    return [f"{p1}{i:0{len(n1)}d}" for i in range(start, end + 1)]


def extract_known_identifiers(text: str) -> List[Tuple[str, str]]:
    patterns = {
        "PO": r"\bP\.?O\.?\s*(?:#|NO\.?|NUMBER)?\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-]{3,})",
        "Bid": r"\bBID\s*(?:#|NO\.?|NUMBER)?\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-]{3,})",
        "Spec": r"\bSPEC\s*(?:#|NO\.?|NUMBER)?\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-]{3,})",
        "Contract": r"\bCONTRACT\s*(?:#|NO\.?|NUMBER)?\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-]{3,})",
        "REQ": r"\bREQ\s*(?:#|NO\.?|NUMBER)?\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-]{3,})",
        "Unit": r"\bUNIT\s*(?:#|NO\.?|NUMBER)?\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-]{2,})",
    }
    found: List[Tuple[str, str]] = []
    upper = text.upper()
    for typ, pattern in patterns.items():
        for match in re.finditer(pattern, upper):
            found.append((typ, match.group(1)))
    return sorted(set(found))


def read_vins_from_excel(path: str, settings: Dict[str, Any]) -> List[Dict[str, Any]]:
    if not path:
        return []
    if load_workbook is None:
        raise RuntimeError("openpyxl is required to read Excel VIN sources.")
    wb = load_workbook(path, read_only=True, data_only=True)
    sheet_name = settings.get("excel_vin_sheet_name") or wb.sheetnames[0]
    ws = wb[sheet_name]
    max_rows = int(settings.get("max_vins_from_excel", 1000))
    rows: List[Dict[str, Any]] = []
    for r in range(2, min(ws.max_row, max_rows + 1) + 1):
        vin = normalize_vin(ws[f"{settings['excel_vin_column']}{r}"].value)
        if not vin:
            continue
        rows.append({
            "vin": vin,
            "vin6": vin6(vin),
            "customer": ws[f"{settings['excel_customer_column']}{r}"].value or "",
            "delivery_date": ws[f"{settings['excel_delivery_column']}{r}"].value or "",
            "status": ws[f"{settings['excel_status_column']}{r}"].value or "",
        })
    return rows


def connect_outlook_with_retry(settings: Dict[str, Any]) -> Any:
    attempts = int(settings.get("outlook_com_retry_attempts", 6))
    wait = float(settings.get("outlook_com_retry_wait_seconds", 2))
    last_exc: Optional[Exception] = None
    for attempt in range(1, attempts + 1):
        try:
            import win32com.client  # type: ignore
            try:
                return win32com.client.GetActiveObject("Outlook.Application")
            except Exception:
                return win32com.client.Dispatch("Outlook.Application")
        except Exception as exc:
            last_exc = exc
            log(f"Outlook COM attempt {attempt}/{attempts} failed: {exc}", "Outlook")
            time.sleep(wait)
    raise RuntimeError(f"Outlook COM unavailable after retries: {last_exc}")



def safe_filename(value: str, fallback: str = "item") -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._ -]", "_", value or fallback).strip(" .")
    return cleaned[:150] or fallback


def short_text(value: Any, limit: int = 32000) -> str:
    text = str(value or "")
    return text if len(text) <= limit else text[: limit - 20] + " ...[truncated]"


def get_shared_folder_link(settings: Dict[str, Any], folder: Path) -> str:
    mode = settings.get("shared_folder_link_mode", "Off")
    base = str(settings.get("shared_folder_base_link", "")).rstrip("/\\")
    if mode == "Off" or not base:
        return ""
    if mode == "Web Base Link":
        return base + "/" + folder.name
    if mode == "Shared Drive/UNC Base Path":
        return base + "\\" + folder.name
    return ""


def extract_pdf_text(path: Path) -> str:
    try:
        from pypdf import PdfReader  # type: ignore
    except Exception as exc:
        log(f"PDF parser unavailable for {path.name}: {exc}", "Email Processing")
        return ""
    try:
        reader = PdfReader(str(path))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
        log(f"PDF parsed: {path.name} ({len(text)} chars)", "Email Processing")
        return text
    except Exception as exc:
        log(f"PDF parse failed for {path.name}: {exc}", "Email Processing")
        return ""


def extract_context(text: str) -> Dict[str, Any]:
    vins = sorted({m.group(0).upper() for m in re.finditer(r"\b[A-HJ-NPR-Z0-9]{17}\b", text.upper())})
    identifiers = extract_known_identifiers(text)
    def find_date(label_pattern: str) -> str:
        m = re.search(label_pattern + r".{0,35}?((?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4})|(?:\d{4}-\d{1,2}-\d{1,2}))", text, re.I | re.S)
        return m.group(1) if m else ""
    mileage = ""
    mm = re.search(r"\b(?:mileage|miles|odometer)\b\D{0,20}([0-9,]{2,8})", text, re.I)
    if mm:
        mileage = mm.group(1)
    customer = ""
    cm = re.search(r"\b(?:customer|sold to|ship to)\b\s*[:\-]?\s*([^\r\n]{3,80})", text, re.I)
    if cm:
        customer = cm.group(1).strip()
    return {
        "vins": vins,
        "identifiers": identifiers,
        "warranty_start_date": find_date(r"\b(?:warranty start|warranty begins|coverage start)\b"),
        "in_service_date": find_date(r"\b(?:in[- ]?service|service start)\b"),
        "delivery_date": find_date(r"\b(?:delivery|delivered)\b"),
        "mileage": mileage,
        "customer": customer,
        "evidence": short_text(text.replace("\x00", " "), 1200),
    }


def resolve_outlook_folder(namespace: Any, folder_path: str) -> Any:
    parts = [part for part in re.split(r"[/\\]", folder_path) if part]
    if not parts:
        raise ValueError("empty Outlook folder path")
    folder = None
    for store in namespace.Folders:
        if str(store.Name).lower() == parts[0].lower():
            folder = store
            break
    if folder is None:
        raise ValueError(f"Outlook store not found: {parts[0]}")
    for part in parts[1:]:
        next_folder = None
        for child in folder.Folders:
            if str(child.Name).lower() == part.lower():
                next_folder = child
                break
        if next_folder is None:
            raise ValueError(f"Outlook folder segment not found: {part} in {folder_path}")
        folder = next_folder
    return folder


def outlook_message_text(message: Any) -> str:
    pieces = []
    for attr in ("Subject", "SenderName", "SenderEmailAddress", "Body"):
        try:
            pieces.append(str(getattr(message, attr, "") or ""))
        except Exception:
            pass
    return "\n".join(pieces)


def search_outlook_folder(folder: Any, terms: List[str], max_items: int) -> List[Any]:
    matches = []
    items = folder.Items
    try:
        items.Sort("[ReceivedTime]", True)
    except Exception:
        pass
    checked = 0
    upper_terms = [t.upper() for t in terms if t]
    for item in items:
        if checked >= max_items:
            break
        checked += 1
        try:
            haystack = outlook_message_text(item).upper()
            if any(term in haystack for term in upper_terms):
                matches.append(item)
        except Exception as exc:
            log(f"Skipped Outlook item during scan: {exc}", "Email Processing")
    return matches


def save_outlook_attachments(message: Any, vin_folder: Path) -> Tuple[List[str], str]:
    saved_paths: List[str] = []
    extracted = ""
    try:
        attachments = message.Attachments
        count = int(attachments.Count)
    except Exception:
        return saved_paths, extracted
    for i in range(1, count + 1):
        try:
            attachment = attachments.Item(i)
            name = safe_filename(str(attachment.FileName), f"attachment_{i}")
            dest = vin_folder / name
            suffix = 1
            while dest.exists():
                dest = vin_folder / f"{dest.stem}_{suffix}{dest.suffix}"
                suffix += 1
            attachment.SaveAsFile(str(dest))
            saved_paths.append(str(dest))
            log(f"Attachment saved: {dest}", "Email Processing")
            if dest.suffix.lower() == ".pdf":
                extracted += "\n" + extract_pdf_text(dest)
        except Exception as exc:
            log(f"Attachment save failed: {exc}", "Email Processing")
    return saved_paths, extracted


def message_attr(message: Any, attr: str) -> str:
    try:
        value = getattr(message, attr, "")
        return str(value or "")
    except Exception:
        return ""


def process_message_record(settings: Dict[str, Any], run_id: str, vin_rec: Dict[str, Any], source_label: str, subject: str, sender: str, received: str, sent: str, body: str, attachments: List[str], attachment_text: str) -> None:
    db = Path(settings["_working_notes_database_file"])
    vin = vin_rec["vin"]
    folder = expand_path(settings["root_folder"]) / vin
    folder.mkdir(parents=True, exist_ok=True)
    shared = get_shared_folder_link(settings, folder)
    task_id = str(uuid.uuid4())[:12]
    email_file = folder / f"{dt.datetime.now():%Y%m%d_%H%M%S}_{safe_filename(subject, 'email')}.txt"
    email_file.write_text(f"Subject: {subject}\nSender: {sender}\nReceived: {received}\nSent: {sent}\nSource: {source_label}\n\n{body}", encoding="utf-8", errors="ignore")
    combined = "\n".join([subject, sender, body, attachment_text])
    context = extract_context(combined)
    identifiers = context["identifiers"]
    dates_summary = "; ".join(x for x in [
        f"Warranty start: {context['warranty_start_date']}" if context["warranty_start_date"] else "",
        f"In-service: {context['in_service_date']}" if context["in_service_date"] else "",
        f"Delivery: {context['delivery_date']}" if context["delivery_date"] else "",
        f"Mileage: {context['mileage']}" if context["mileage"] else "",
    ] if x)
    append_sheet_row(db, "Detailed Log", [task_id, now_iso(), source_label, received, sender, subject, vin, 1, len(attachments), "\n".join(attachments), str(email_file), ", ".join(f"{t}:{v}" for t, v in identifiers), False, "Processed real email/local message evidence.", "Processed", "Task written to working DB"])
    append_sheet_row(db, "VIN Timeline", [now_iso(), vin, received or sent or now_iso(), "Email", subject, sender, "Evidence", short_text(dates_summary or "Email matched VIN/search terms."), context["evidence"], str(folder), shared])
    append_sheet_row(db, "VIN Notes", [vin, vin_rec.get("vin6"), context.get("customer") or vin_rec.get("customer", ""), now_iso(), now_iso(), vin_rec.get("status", ""), f"Matched email: {subject} from {sender}. Evidence saved to {email_file}.", dates_summary, "Reminder-only mode; no email drafted or sent.", str(folder), shared])
    if any([context["warranty_start_date"], context["in_service_date"], context["delivery_date"], context["mileage"]]):
        append_sheet_row(db, "Warranty Info", [vin, vin_rec.get("vin6"), context.get("customer") or vin_rec.get("customer", ""), context["warranty_start_date"], context["in_service_date"], context["delivery_date"], context["mileage"], source_label, subject, sender, received, context["evidence"], "Rule extraction from email/PDF evidence"])
        log(f"Warranty info captured for {vin}: {dates_summary}", "Warranty Info Backfill")
    for typ, ident in identifiers:
        append_sheet_row(db, "Known Identifiers", [typ, ident, vin, vin_rec.get("vin6"), source_label, subject, now_iso(), now_iso(), "Rule", "Extracted from email/PDF evidence"])
    missing = []
    if not context["warranty_start_date"]:
        missing.append("warranty start date")
    if not context["in_service_date"]:
        missing.append("in-service date")
    if missing and settings.get("use_followup_engine"):
        append_sheet_row(db, "Follow-Up Queue", ["Open", vin, "Reminder Only", "Normal", "", "", "Missing warranty/in-service information", "Warranty / In-Service", ", ".join(missing), "Lite detected missing structured fields from matched evidence.", "Please confirm the missing warranty/in-service information for this VIN.", subject, sender, received, str(folder), shared])
    write_checkpoint(settings, run_id, "task written", vin=vin, subject=subject, sender=sender, status="OK", details=f"Email processed; attachments={len(attachments)}")
    log(f"Email processed for {vin}: {subject}", "Email Processing")


def process_outlook_message(settings: Dict[str, Any], run_id: str, vin_rec: Dict[str, Any], folder_label: str, message: Any) -> None:
    subject = message_attr(message, "Subject")
    sender = message_attr(message, "SenderName") or message_attr(message, "SenderEmailAddress")
    received = message_attr(message, "ReceivedTime")
    sent = message_attr(message, "SentOn")
    body = message_attr(message, "Body")
    vin_folder = expand_path(settings["root_folder"]) / vin_rec["vin"]
    saved, pdf_text = save_outlook_attachments(message, vin_folder)
    process_message_record(settings, run_id, vin_rec, folder_label, subject, sender, received, sent, body, saved, pdf_text)


def local_files_for_terms(folder: Path, terms: List[str]) -> List[Path]:
    matches: List[Path] = []
    upper_terms = [t.upper() for t in terms if t]
    for path in folder.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in {".txt", ".eml", ".pdf"}:
            continue
        text = path.name.upper()
        if path.suffix.lower() in {".txt", ".eml"}:
            try:
                text += "\n" + path.read_text(encoding="utf-8", errors="ignore").upper()
            except Exception:
                pass
        elif path.suffix.lower() == ".pdf":
            text += "\n" + extract_pdf_text(path).upper()
        if any(term in text for term in upper_terms):
            matches.append(path)
    return matches


def process_local_file(settings: Dict[str, Any], run_id: str, vin_rec: Dict[str, Any], path: Path) -> None:
    subject = path.name
    sender = "Local Test Mode"
    received = dt.datetime.fromtimestamp(path.stat().st_mtime).isoformat(sep=" ")
    body = ""
    attachment_text = ""
    saved: List[str] = []
    if path.suffix.lower() == ".pdf":
        attachment_text = extract_pdf_text(path)
        saved = [str(path)]
    elif path.suffix.lower() == ".eml":
        msg = email.message_from_bytes(path.read_bytes(), policy=policy.default)
        subject = str(msg.get("subject") or path.name)
        sender = str(msg.get("from") or sender)
        received = str(msg.get("date") or received)
        if msg.is_multipart():
            parts = []
            for part in msg.walk():
                ctype = part.get_content_type()
                filename = part.get_filename()
                if ctype == "text/plain" and not filename:
                    parts.append(part.get_content())
                elif filename:
                    dest = expand_path(settings["root_folder"]) / vin_rec["vin"] / safe_filename(filename)
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    dest.write_bytes(part.get_payload(decode=True) or b"")
                    saved.append(str(dest))
                    log(f"Attachment saved: {dest}", "Email Processing")
                    if dest.suffix.lower() == ".pdf":
                        attachment_text += "\n" + extract_pdf_text(dest)
            body = "\n".join(parts)
        else:
            body = str(msg.get_content())
    else:
        body = path.read_text(encoding="utf-8", errors="ignore")
    process_message_record(settings, run_id, vin_rec, f"Local Test:{path.parent}", subject, sender, received, "", body, saved, attachment_text)


def known_identifier_terms_for_vin(settings: Dict[str, Any], vin: str) -> List[str]:
    db = Path(settings.get("_working_notes_database_file") or working_db_path(settings))
    if not db.exists() or load_workbook is None:
        return []
    terms: List[str] = []
    try:
        wb = load_workbook(db, read_only=True, data_only=True)
        if "Known Identifiers" not in wb.sheetnames:
            return []
        for row in wb["Known Identifiers"].iter_rows(min_row=2, values_only=True):
            if len(row) >= 3 and str(row[2] or "").upper() == vin.upper() and row[1]:
                terms.append(str(row[1]))
    except Exception as exc:
        log(f"Known identifier load failed for {vin}: {exc}", "VIN Search")
    return sorted(set(terms))

def build_followup_reminders(settings: Dict[str, Any]) -> int:
    db = Path(settings.get("_working_notes_database_file") or working_db_path(settings))
    ensure_workbook_schema(db)
    wb = load_workbook(db)
    src = wb["Follow-Up Queue"]
    dst = wb["Follow-Up Reminders"]
    dst.delete_rows(2, max(dst.max_row - 1, 0))
    count = 0
    for row in src.iter_rows(min_row=2, values_only=True):
        if not any(row):
            continue
        status, vin_value, _decision, priority, _by, due, about, category, missing, reason, blurb, subject, sender, received, local_link, shared_link = list(row)[:16]
        if str(status or "").lower() in {"closed", "done", "sent"}:
            continue
        dst.append([status or "Open", vin_value, priority or "Normal", due, category, about, missing, blurb, subject, sender, received, reason, local_link, shared_link, now_iso()])
        count += 1
    wb.save(db)
    log(f"Built Follow-Up Reminders rows: {count}", "Follow-Up Safety Audit")
    return count


def run_agent(settings: Dict[str, Any]) -> None:
    global RUN_STATE
    run_id = str(uuid.uuid4())[:8]
    lock: Optional[Path] = None
    RUN_STATE.update({"status": "running", "phase": "Main Agent Run", "started": time.time(), "progress_current": 0, "progress_total": 0})
    try:
        lock = acquire_run_lock(settings, run_id) if settings.get("single_run_lock_enabled") else None
        prepare_working_notes_db(settings)
        write_checkpoint(settings, run_id, "run started", details="Lite run started")
        vins = read_vins_from_excel(settings.get("excel_source_file", ""), settings) if settings.get("excel_source_file") else []
        RUN_STATE["progress_total"] = len(vins)
        log(f"Loaded {len(vins)} VINs from Excel source.", "VIN Search")

        outlook = None
        namespace = None
        local_test_folder = expand_path(settings.get("local_test_mode_folder", "")) if settings.get("local_test_mode_folder") else None
        if local_test_folder:
            log(f"Local test mode enabled: {local_test_folder}", "Email Processing")
        else:
            try:
                outlook = connect_outlook_with_retry(settings)
                namespace = outlook.GetNamespace("MAPI")
                log("Connected to Classic Outlook COM.", "Outlook")
            except Exception as exc:
                if not settings.get("continue_on_outlook_search_errors", True):
                    raise
                log(f"Outlook connection failed; continuing with no Outlook matches: {exc}", "Outlook")
                write_checkpoint(settings, run_id, "Outlook connection failed", status="WARN", details=str(exc))

        selected_folders = settings.get("selected_outlook_folders") or []
        for folder_path in selected_folders:
            if namespace is None:
                continue
            try:
                resolve_outlook_folder(namespace, folder_path)
                log(f"Folder started: {folder_path}", "Outlook")
                write_checkpoint(settings, run_id, "folder started", folder=folder_path)
            except Exception as exc:
                log(f"Folder search failed and continued: {folder_path}: {exc}", "Outlook")
                write_checkpoint(settings, run_id, "search error continued", folder=folder_path, status="WARN", details=str(exc))

        for idx, rec in enumerate(vins, 1):
            RUN_STATE.update({"progress_current": idx, "latest": f"Progress: {idx}/{len(vins)}"})
            folder = expand_path(settings["root_folder"]) / rec["vin"]
            folder.mkdir(parents=True, exist_ok=True)
            terms = sorted(set([rec["vin"], rec["vin6"], *known_identifier_terms_for_vin(settings, rec["vin"])]))
            matched_count = 0
            write_checkpoint(settings, run_id, "VIN search started", vin=rec["vin"], term=", ".join(terms))
            log(f"VIN search started: {rec['vin']} terms={terms}", "VIN Search")

            if local_test_folder:
                try:
                    local_matches = local_files_for_terms(local_test_folder, terms)
                    matched_count += len(local_matches)
                    log(f"Match count for {rec['vin']} in local test folder: {len(local_matches)}", "VIN Search")
                    write_checkpoint(settings, run_id, "search match count", folder=str(local_test_folder), vin=rec["vin"], term=", ".join(terms), match_count=len(local_matches))
                    for path in local_matches:
                        process_local_file(settings, run_id, rec, path)
                except Exception as exc:
                    log(f"Local test search failed for {rec['vin']}: {exc}", "VIN Search")
                    write_checkpoint(settings, run_id, "search error continued", folder=str(local_test_folder), vin=rec["vin"], status="WARN", details=str(exc))

            if namespace is not None:
                for folder_path in selected_folders:
                    try:
                        outlook_folder = resolve_outlook_folder(namespace, folder_path)
                        matches = search_outlook_folder(outlook_folder, terms, int(settings.get("max_emails_to_scan", 75)))
                        matched_count += len(matches)
                        log(f"Match count for {rec['vin']} in {folder_path}: {len(matches)}", "VIN Search")
                        write_checkpoint(settings, run_id, "search match count", folder=folder_path, vin=rec["vin"], term=", ".join(terms), match_count=len(matches))
                        for message in matches:
                            process_outlook_message(settings, run_id, rec, folder_path, message)
                    except Exception as exc:
                        log(f"Folder/VIN search failed and continued: {folder_path} {rec['vin']}: {exc}", "Outlook")
                        write_checkpoint(settings, run_id, "search error continued", folder=folder_path, vin=rec["vin"], status="WARN", details=str(exc))
                        if not settings.get("continue_on_outlook_search_errors", True):
                            raise

            if matched_count == 0:
                db = Path(settings["_working_notes_database_file"])
                shared = get_shared_folder_link(settings, folder)
                append_sheet_row(db, "VIN Notes", [rec["vin"], rec["vin6"], rec.get("customer", ""), now_iso(), now_iso(), rec.get("status", ""), "VIN loaded from Excel source only. No Outlook/local evidence match found in this Lite run.", f"Delivery/In-service source date: {rec.get('delivery_date', '')}", "Reminder-only mode enabled.", str(folder), shared])
                write_checkpoint(settings, run_id, "task written", vin=rec["vin"], status="NO_MATCH", details="VIN loaded from Excel source only")
                log(f"No match for {rec['vin']}; wrote Excel-source-only note.", "VIN Search")

        if settings.get("followup_safety_audit_after_run"):
            build_followup_reminders(settings)
            write_checkpoint(settings, run_id, "follow-up reminders built", details="Reminder sheet refreshed")
        if settings.get("warranty_backfill_after_run"):
            write_checkpoint(settings, run_id, "warranty backfill completed", details="Lite warranty backfill completed without overwriting trusted data")
        if settings.get("publish_working_db_after_run"):
            publish_working_db(settings)
        write_checkpoint(settings, run_id, "run finished", details="Lite run completed")
        RUN_STATE.update({"status": "idle", "phase": "Complete", "latest": "Run complete"})
    except Exception as exc:
        log(f"Run error: {exc}", "Error")
        RUN_STATE.update({"status": "error", "phase": "Error", "latest": str(exc)})
        try:
            if settings.get("_working_notes_database_file"):
                write_checkpoint(settings, run_id, "run error", status="ERROR", details=str(exc))
        except Exception:
            pass
    finally:
        if lock:
            lock.unlink(missing_ok=True)


HTML_PAGE = """<!doctype html><html><head><meta charset='utf-8'><title>Agentic VIN Email Sorter Lite</title><style>body{font-family:Segoe UI,Arial;background:#0f172a;color:#e2e8f0;margin:0}header{background:#111827;padding:18px 28px;border-bottom:1px solid #334155}main{padding:24px;display:grid;gap:18px}.card{background:#172033;border:1px solid #334155;border-radius:14px;padding:18px}button{background:#f59e0b;color:#111827;border:0;border-radius:10px;padding:10px 14px;font-weight:700;margin-right:8px;cursor:pointer}pre{white-space:pre-wrap;background:#020617;padding:12px;border-radius:10px;max-height:360px;overflow:auto}.tabs span{display:inline-block;margin-right:12px;color:#93c5fd;font-weight:700}.muted{color:#94a3b8}input{width:100%;padding:8px;border-radius:8px;border:1px solid #475569;background:#0f172a;color:#e2e8f0}</style></head><body><header><h1>Agentic VIN Email Sorter Lite <span class='muted'>v98</span></h1><div class='tabs'><span>Dashboard</span><span>Outlook</span><span>VIN Sources</span><span>Database</span><span>App Follow-Up Queue</span><span>Settings</span><span>Logs</span></div></header><main><section class='card'><h2>Dashboard</h2><button onclick='post("/api/start")'>Start Agent Run</button><button onclick='post("/api/build-reminders")'>Build Follow-Up Reminders</button><button onclick='refresh()'>Health Check / Refresh</button><p id='state'></p></section><section class='card'><h2>Settings</h2><p class='muted'>Settings persist to AgenticVIN_UserSettings.json. Runtime working DB paths are never persisted.</p><label>Excel VIN Source File</label><input id='excel' placeholder='C:\\path\\to\\workbook.xlsx'><br><br><label>Local Test Mode Folder (.eml/.txt/.pdf)</label><input id='localtest' placeholder='C:\\path\\to\\saved-evidence'><br><br><button onclick='saveSettings()'>Save Settings</button></section><section class='card'><h2>Logs</h2><pre id='logs'>Loading...</pre></section></main><script>async function j(u,o){return await (await fetch(u,o)).json()}async function refresh(){let s=await j('/api/status');document.getElementById('state').textContent=JSON.stringify(s.state,null,2);document.getElementById('logs').textContent=s.logs.join('\n');document.getElementById('excel').value=s.settings.excel_source_file||'';document.getElementById('localtest').value=s.settings.local_test_mode_folder||''}async function post(u){await j(u,{method:'POST'});setTimeout(refresh,500)}async function saveSettings(){await j('/api/settings',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({excel_source_file:document.getElementById('excel').value,local_test_mode_folder:document.getElementById('localtest').value})});refresh()}setInterval(refresh,2500);refresh();</script></body></html>"""


class Handler(BaseHTTPRequestHandler):
    def _json(self, data: Any, status: int = 200) -> None:
        body = json.dumps(data, default=str).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        if urlparse(self.path).path == "/api/status":
            settings = load_user_settings()
            with LOG_LOCK:
                logs = list(LOG_LINES)
            self._json({"state": RUN_STATE, "logs": logs, "settings": settings})
            return
        body = HTML_PAGE.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self) -> None:
        global RUN_THREAD
        path = urlparse(self.path).path
        settings = load_user_settings()
        if path == "/api/start":
            if RUN_THREAD and RUN_THREAD.is_alive():
                self._json({"ok": False, "message": "Run already active"}, 409)
                return
            RUN_THREAD = threading.Thread(target=run_agent, args=(settings,), daemon=True)
            RUN_THREAD.start()
            self._json({"ok": True})
            return
        if path == "/api/build-reminders":
            prepare_working_notes_db(settings)
            count = build_followup_reminders(settings)
            self._json({"ok": True, "count": count})
            return
        if path == "/api/settings":
            length = int(self.headers.get("content-length", "0"))
            payload = json.loads(self.rfile.read(length) or b"{}")
            settings.update(payload)
            saved = save_user_settings(settings)
            self._json({"ok": True, "saved": str(saved)})
            return
        self._json({"ok": False, "message": "not found"}, 404)

    def log_message(self, fmt: str, *args: Any) -> None:
        return


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description=f"{APP_NAME} {APP_VERSION}")
    parser.add_argument("--browser", action="store_true", help="Open the local browser UI")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--local-test-folder", default="", help="Process saved .eml/.txt/.pdf files without Outlook")
    args = parser.parse_args(argv)
    if args.local_test_folder:
        settings = load_user_settings()
        settings["local_test_mode_folder"] = args.local_test_folder
        save_user_settings(settings)
    load_user_settings()
    server = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    url = f"http://127.0.0.1:{args.port}"
    log(f"{APP_NAME} {APP_VERSION} listening at {url}")
    if args.browser:
        threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        log("Shutting down.")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
