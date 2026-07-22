"use client";

import { ChangeEvent, createElement, useMemo, useRef, useState } from "react";
import ModularTruckViewer, { DEFAULT_ISUZU_BODY_MOUNT, TruckMountConfig } from "./ModularTruckViewer";
import InteriorCabViewer from "./InteriorCabViewer";
import { AccessoryPlacement, AccessorySlotConfig, AssemblyMountRecord, AttachmentPointConfig, hasAttachmentGeometry, hasCompleteMeasurements, InteriorCameraConfig, ModelAssetRecord, RealScaleConfig } from "./modelRegistry";

type VectorKey = "position" | "rotation" | "scale";

type ViewerMaterial = {
  name?: string;
  pbrMetallicRoughness?: {
    setBaseColorFactor?: (color: [number, number, number, number]) => void;
  };
};

type MaterialPickerViewer = HTMLElement & {
  model?: { materials?: ViewerMaterial[] };
  materialFromPoint?: (clientX: number, clientY: number) => ViewerMaterial | null;
};

type ImportDraft = {
  id: string;
  fileName: string;
  objectUrl: string;
  size: number;
  targetId: string;
  confidence: number;
  source: "individual" | "zip";
  error?: string;
};

const axes = ["X", "Y", "Z"] as const;
const freightlinerDumpTargets = [
  { id: "unassigned", name: "Unassigned upload" },
  { id: "m2-106", name: "M2 106 Plus" },
  { id: "m2-112", name: "M2 112 Plus" },
  { id: "108sd", name: "108SD Plus" },
  { id: "114sd", name: "114SD Plus" }
];
const westernStarDumpTargets = [
  { id: "unassigned", name: "Unassigned upload" },
  { id: "47x", name: "47X" },
  { id: "49x", name: "49X" },
  { id: "49x-power", name: "49X Power Hood" }
];

function completeTruckTargets(asset: ModelAssetRecord) {
  if (asset.brandId === "freightliner") return freightlinerDumpTargets;
  if (asset.brandId === "western-star") return westernStarDumpTargets;
  return null;
}

function cloneMount(mount: TruckMountConfig): TruckMountConfig {
  return {
    position: [...mount.position],
    rotation: [...mount.rotation],
    scale: [...mount.scale]
  };
}

function normalizedWords(value: string) {
  return value.toLowerCase().replace(/\.glb$/i, "").replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter((word) => word.length > 1 && !["model", "truck", "asset", "final"].includes(word));
}

function suggestAsset(fileName: string, assets: ModelAssetRecord[]) {
  const words = normalizedWords(fileName);
  const inferredKind: ModelAssetRecord["kind"] = words.includes("interior") ? "interior" : words.includes("body") || words.includes("box") || words.includes("dump") || words.includes("tank") ? "body" : words.includes("complete") ? "complete" : "exterior";
  let best = { id: "", score: 0 };
  for (const asset of assets) {
    const targetWords = new Set(normalizedWords(`${asset.id} ${asset.brandName} ${asset.modelName} ${asset.variant} ${asset.kind}`));
    const overlap = words.filter((word) => targetWords.has(word)).length;
    const kindBonus = asset.kind === inferredKind ? 2 : 0;
    const score = Math.round(Math.min(98, ((overlap + kindBonus) / Math.max(3, words.length + 1)) * 100));
    if (score > best.score) best = { id: asset.id, score };
  }
  return best;
}

async function zipGlbDrafts(file: File, assets: ModelAssetRecord[]): Promise<ImportDraft[]> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const drafts: ImportDraft[] = [];
  let offset = 0;
  while (offset + 46 <= bytes.length) {
    if (view.getUint32(offset, true) !== 0x02014b50) { offset += 1; continue; }
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const name = new TextDecoder().decode(bytes.slice(offset + 46, offset + 46 + nameLength));
    if (/\.glb$/i.test(name) && localOffset + 30 <= bytes.length && view.getUint32(localOffset, true) === 0x04034b50) {
      const localNameLength = view.getUint16(localOffset + 26, true);
      const localExtraLength = view.getUint16(localOffset + 28, true);
      const start = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = bytes.slice(start, start + compressedSize);
      try {
        let glbBytes: Uint8Array;
        if (method === 0) glbBytes = compressed;
        else if (method === 8 && typeof DecompressionStream !== "undefined") {
          const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("deflate-raw" as CompressionFormat));
          glbBytes = new Uint8Array(await new Response(stream).arrayBuffer());
        } else throw new Error(`ZIP compression method ${method} is not supported by this browser`);
        if (glbBytes.byteLength < 12 || new TextDecoder().decode(glbBytes.slice(0, 4)) !== "glTF") throw new Error("The extracted file is not a complete GLB");
        const declared = new DataView(glbBytes.buffer, glbBytes.byteOffset, glbBytes.byteLength).getUint32(8, true);
        if (declared !== glbBytes.byteLength) throw new Error(`Incomplete GLB: expected ${declared.toLocaleString()} bytes, found ${glbBytes.byteLength.toLocaleString()}`);
        const match = suggestAsset(name, assets);
        const blobBuffer = new Uint8Array(glbBytes).buffer as ArrayBuffer;
        drafts.push({ id: `${file.name}:${offset}`, fileName: name.split("/").pop() || name, objectUrl: URL.createObjectURL(new Blob([blobBuffer], { type: "model/gltf-binary" })), size: uncompressedSize, targetId: match.id, confidence: match.score, source: "zip" });
      } catch (error) {
        drafts.push({ id: `${file.name}:${offset}`, fileName: name.split("/").pop() || name, objectUrl: "", size: uncompressedSize, targetId: "", confidence: 0, source: "zip", error: error instanceof Error ? error.message : "Could not extract this GLB" });
      }
    }
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return drafts;
}

export default function AlignmentAdmin({ mount, onChange, assemblyMounts, onAssemblyMountsChange, assets, onAssetsChange, dimensions, onDimensionsChange, attachments, onAttachmentsChange, interiorCamera, onInteriorCameraChange, accessorySlots, onAccessorySlotsChange, onBack }: { mount: TruckMountConfig; onChange: (mount: TruckMountConfig) => void; assemblyMounts: AssemblyMountRecord[]; onAssemblyMountsChange: (profiles: AssemblyMountRecord[]) => void; assets: ModelAssetRecord[]; onAssetsChange: (assets: ModelAssetRecord[]) => void; dimensions: RealScaleConfig; onDimensionsChange: (dimensions: RealScaleConfig) => void; attachments: AttachmentPointConfig; onAttachmentsChange: (attachments: AttachmentPointConfig) => void; interiorCamera: InteriorCameraConfig; onInteriorCameraChange: (config: InteriorCameraConfig) => void; accessorySlots: AccessorySlotConfig[]; onAccessorySlotsChange: (slots: AccessorySlotConfig[]) => void; onBack: () => void }) {
  const [message, setMessage] = useState("Changes auto-save in this browser");
  const [toast, setToast] = useState<{ text: string; kind: "success" | "error" } | null>(null);
  const [tab, setTab] = useState<"uploads" | "models" | "alignment" | "scale" | "attachments" | "interior">("uploads");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = (text: string, kind: "success" | "error" = "success") => {
    setToast({ text, kind });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4200);
  };

  const updateAxis = (group: VectorKey, index: number, shownValue: number) => {
    const next = cloneMount(mount);
    next[group][index] = group === "rotation" ? THREE_DEG_TO_RAD(shownValue) : shownValue;
    onChange(next);
    setMessage("Saved globally");
  };

  const exportSettings = () => {
    const file = new Blob([JSON.stringify({ version: 4, mount, assemblyMounts, dimensions, attachments, interiorCamera, accessorySlots, assets }, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = "isuzu-dry-van-mount-settings.json";
    anchor.click();
    URL.revokeObjectURL(href);
    setMessage("Settings exported");
    notify("3D Admin settings exported successfully.");
  };

  const importSettings = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const next = parsed.mount as TruckMountConfig;
      if (!next?.position || !next?.rotation || !next?.scale || next.position.length !== 3 || next.rotation.length !== 3 || next.scale.length !== 3) throw new Error("Invalid mount file");
      onChange(cloneMount(next));
      if (Array.isArray(parsed.assets)) onAssetsChange(parsed.assets);
      if (parsed.dimensions?.chassis && parsed.dimensions?.body) onDimensionsChange(parsed.dimensions);
      if (parsed.attachments?.frontAxle && parsed.attachments?.rearAxle) onAttachmentsChange(parsed.attachments);
      if (parsed.interiorCamera?.eyePosition && parsed.interiorCamera?.modelPosition) onInteriorCameraChange(parsed.interiorCamera);
      if (Array.isArray(parsed.accessorySlots)) onAccessorySlotsChange(parsed.accessorySlots);
      if (Array.isArray(parsed.assemblyMounts)) onAssemblyMountsChange(parsed.assemblyMounts);
      setMessage("Imported and saved globally");
      notify("Settings imported and applied successfully.");
    } catch {
      setMessage("That file is not a valid mount configuration");
      notify("That file is not a valid 3D Admin configuration.", "error");
    }
    event.target.value = "";
  };

  return (
    <section className="alignment-page">
      <div className="alignment-head">
        <div><span className="eyebrow dark">DIEHL&apos;S 3D ADMIN</span><h1>3D model operations</h1><p>Manage required assets, flag missing models, apply verified dimensions, and align modular bodies without showing customers fabricated matches.</p></div>
        <button className="button primary" onClick={onBack}>Back to builder</button>
      </div>

      <nav className="admin-tabs" aria-label="3D administration sections"><button className={tab === "uploads" ? "active" : ""} onClick={() => setTab("uploads")}>Upload models</button><button className={tab === "models" ? "active" : ""} onClick={() => setTab("models")}>Model library <span>{assets.filter((asset) => asset.status === "missing").length} missing</span></button><button className={tab === "alignment" ? "active" : ""} onClick={() => setTab("alignment")}>Body alignment</button><button className={tab === "attachments" ? "active" : ""} onClick={() => setTab("attachments")}>Attachment points <span>{hasAttachmentGeometry(attachments) ? "Active" : "Setup"}</span></button><button className={tab === "interior" ? "active" : ""} onClick={() => setTab("interior")}>Interior camera <span>{interiorCamera.verified ? "Verified" : "Setup"}</span></button><button className={tab === "scale" ? "active" : ""} onClick={() => setTab("scale")}>Real-life scale <span>{dimensions.enabled ? "Active" : "Unverified"}</span></button></nav>

      {tab === "uploads" ? <AssetUploadPanel assets={assets} onChange={onAssetsChange} onOpenLibrary={() => setTab("models")} onNotify={notify}/> : tab === "models" ? <ModelLibraryPanel assets={assets} onChange={onAssetsChange}/> : tab === "scale" ? <ScalePanel dimensions={dimensions} onChange={onDimensionsChange} mount={mount} onMountChange={onChange} onNotify={notify}/> : tab === "attachments" ? <AttachmentPointsPanel mount={mount} dimensions={dimensions} attachments={attachments} onChange={onAttachmentsChange} slots={accessorySlots} onSlotsChange={onAccessorySlotsChange}/> : tab === "interior" ? <InteriorCameraPanel assets={assets} config={interiorCamera} onChange={onInteriorCameraChange}/> : <BodyAlignmentPanel assets={assets} onAssetsChange={onAssetsChange} profiles={assemblyMounts} onChange={onAssemblyMountsChange} dimensions={dimensions} attachments={attachments} onExport={exportSettings} onImport={() => fileRef.current?.click()} message={message}/>}
      <input ref={fileRef} type="file" accept="application/json,.json" onChange={importSettings} hidden/>
      {toast && <div className={`admin-toast ${toast.kind}`} role="status" aria-live="polite"><span>{toast.kind === "success" ? "✓" : "!"}</span><div><strong>{toast.kind === "success" ? "Done" : "Action needed"}</strong><small>{toast.text}</small></div><button onClick={() => setToast(null)} aria-label="Dismiss confirmation">×</button></div>}
    </section>
  );
}

function AssetThumbnail({ asset, onMaterialsFound }: { asset: ModelAssetRecord; onMaterialsFound?: (names: string[]) => void }) {
  const available = asset.status !== "missing" && Boolean(asset.file);
  return <div className={`asset-thumbnail ${available ? "available" : "missing"}`} title={available ? `${asset.brandName} ${asset.modelName} · ${asset.variant}` : "No GLB assigned"}>
    {available ? createElement("model-viewer", {
      key: asset.file,
      src: asset.file,
      alt: `${asset.brandName} ${asset.modelName} ${asset.variant} preview`,
      loading: "lazy",
      reveal: "auto",
      "camera-orbit": "35deg 70deg auto",
      "field-of-view": "32deg",
      "environment-image": "neutral",
      exposure: "1.1",
      "shadow-intensity": "0.8",
      "interaction-prompt": "none",
      onLoad: (event: { currentTarget: HTMLElement & { model?: { materials?: Array<{ name?: string }> } } }) => {
        const names = Array.from(new Set((event.currentTarget.model?.materials || []).map((material) => material.name || "").filter(Boolean)));
        onMaterialsFound?.(names);
      }
    }) : <><span>＋</span><small>Missing</small></>}
    {available && <em className={asset.status}>{asset.status === "exact" ? "Exact" : "Reference"}</em>}
  </div>;
}

function CabMaterialPicker({ asset, onClose, onSave }: { asset: ModelAssetRecord; onClose: () => void; onSave: (paintMaterials: string) => void }) {
  const initial = (asset.paintMaterials || "").split(",").map((name) => name.trim()).filter(Boolean);
  const [selected, setSelected] = useState<string[]>(initial);
  const [materialNames, setMaterialNames] = useState<string[]>([]);
  const [message, setMessage] = useState("Click a painted section of the cab. Dragging still rotates the truck.");
  const [allowWholeMaterial, setAllowWholeMaterial] = useState(false);
  const [viewerRevision, setViewerRevision] = useState(0);
  const viewerRef = useRef<MaterialPickerViewer | null>(null);
  const pointerStart = useRef<[number, number] | null>(null);
  const monolithic = materialNames.length === 1;

  const handleLoad = (event: { currentTarget: MaterialPickerViewer }) => {
    viewerRef.current = event.currentTarget;
    const materials = event.currentTarget.model?.materials || [];
    const names = Array.from(new Set(materials.map((material) => material.name || "").filter(Boolean)));
    setMaterialNames(names);
    materials.forEach((material) => {
      if (material.name && initial.includes(material.name)) material.pbrMetallicRoughness?.setBaseColorFactor?.([0.88, 0.66, 0.075, 1]);
    });
    setMessage(names.length === 1 ? "This GLB has one material for the entire truck. Test it before saving." : "Click every cab-painted surface that should change color.");
  };

  const pickMaterial = (event: { clientX: number; clientY: number }) => {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start || Math.hypot(event.clientX - start[0], event.clientY - start[1]) > 6) return;
    const material = viewerRef.current?.materialFromPoint?.(event.clientX, event.clientY);
    if (!material) return setMessage("No model surface was found there. Click directly on the cab paint.");
    if (!material.name) return setMessage("That surface uses an unnamed material and cannot be saved safely.");
    material.pbrMetallicRoughness?.setBaseColorFactor?.([0.88, 0.66, 0.075, 1]);
    setSelected((current) => current.includes(material.name!) ? current : [...current, material.name!]);
    setMessage(`Selected ${material.name}. Yellow shows every surface controlled by it.`);
  };

  const resetPreview = () => {
    setSelected(initial);
    setAllowWholeMaterial(false);
    setViewerRevision((current) => current + 1);
    setMessage("Preview reset. Click a cab-painted surface to select it again.");
  };

  const canSave = selected.length > 0 && (!monolithic || allowWholeMaterial);

  return <div className="cab-picker-backdrop" role="dialog" aria-modal="true" aria-label={`Select cab paint for ${asset.brandName} ${asset.modelName}`}>
    <section className="cab-picker-panel">
      <header><div><span className="eyebrow dark">VISUAL MATERIAL PICKER</span><h2>Select the cab paint</h2><p>{asset.brandName} {asset.modelName} · {asset.variant}</p></div><button onClick={onClose} aria-label="Close cab material picker">×</button></header>
      <div className="cab-picker-layout">
        <div className="cab-picker-viewer">
          {createElement("model-viewer", {
            key: `${asset.file}-${viewerRevision}`,
            src: asset.file,
            alt: `${asset.brandName} ${asset.modelName} cab material selection`,
            "camera-controls": true,
            "environment-image": "neutral",
            "shadow-intensity": "1.1",
            exposure: "1.08",
            "camera-orbit": "35deg 70deg auto",
            "field-of-view": "28deg",
            "interaction-prompt": "none",
            onLoad: handleLoad,
            onPointerDown: (event: { clientX: number; clientY: number }) => { pointerStart.current = [event.clientX, event.clientY]; },
            onPointerUp: pickMaterial
          })}
          <div className="cab-picker-hint"><span>＋</span><strong>Click cab paint</strong><small>Drag to rotate · scroll to zoom</small></div>
        </div>
        <aside className="cab-picker-controls">
          <div className="cab-picker-status"><span>{materialNames.length}</span><div><strong>Named materials detected</strong><small>{message}</small></div></div>
          {monolithic && <div className="cab-picker-warning"><strong>⚠ One-material GLB</strong><p>The cab, body, glass, wheels, and equipment may all share this material. If the whole truck turns yellow, the GLB must be separated in Blender for a cab-only color change.</p></div>}
          <div className="cab-picker-selected"><span>SELECTED CAB MATERIALS</span>{selected.length ? <div>{selected.map((name) => <button key={name} title="Remove from cab paint selection" onClick={() => setSelected((current) => current.filter((item) => item !== name))}>{name}<b>×</b></button>)}</div> : <p>Nothing selected yet. Click the painted cab surface in the viewer.</p>}</div>
          {monolithic && selected.length > 0 && <label className="whole-material-confirm"><input type="checkbox" checked={allowWholeMaterial} onChange={(event) => setAllowWholeMaterial(event.target.checked)}/><span><strong>Allow this whole-material target</strong><small>I understand it may recolor the entire truck, not only the cab.</small></span></label>}
          <div className="cab-picker-actions"><button className="button ghost" onClick={resetPreview}>Reset preview</button><button className="button ghost" onClick={onClose}>Cancel</button><button className="button primary" disabled={!canSave} onClick={() => onSave(selected.join(", "))}>Save cab selection</button></div>
        </aside>
      </div>
    </section>
  </div>;
}

function AssetUploadPanel({ assets, onChange, onOpenLibrary, onNotify }: { assets: ModelAssetRecord[]; onChange: (assets: ModelAssetRecord[]) => void; onOpenLibrary: () => void; onNotify: (text: string, kind?: "success" | "error") => void }) {
  const [drafts, setDrafts] = useState<ImportDraft[]>([]);
  const [activeId, setActiveId] = useState("");
  const [busy, setBusy] = useState(false);
  const [publishKey, setPublishKey] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState("");
  const individualRef = useRef<HTMLInputElement | null>(null);
  const zipRef = useRef<HTMLInputElement | null>(null);
  const active = drafts.find((draft) => draft.id === activeId) || drafts[0];
  const ready = drafts.filter((draft) => draft.targetId && draft.objectUrl && !draft.error);
  const unresolved = drafts.filter((draft) => !draft.targetId || draft.error);
  const targetGroups = useMemo(() => ["isuzu", "freightliner", "western-star"].map((brandId) => ({ brandId, label: brandId === "western-star" ? "Western Star" : brandId[0].toUpperCase() + brandId.slice(1), assets: assets.filter((asset) => asset.brandId === brandId) })), [assets]);

  const addIndividual = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).filter((file) => /\.glb$/i.test(file.name));
    const next = await Promise.all(files.map(async (file, index) => {
      const bytes = new Uint8Array(await file.arrayBuffer());
      let error = "";
      if (bytes.byteLength < 12 || new TextDecoder().decode(bytes.slice(0, 4)) !== "glTF") error = "This is not a valid binary GLB file.";
      else {
        const declared = new DataView(bytes.buffer).getUint32(8, true);
        if (declared !== bytes.byteLength) error = `Incomplete GLB: expected ${declared.toLocaleString()} bytes, found ${bytes.byteLength.toLocaleString()}.`;
      }
      const match = suggestAsset(file.name, assets);
      return { id: `${file.name}:${file.lastModified}:${index}`, fileName: file.name, objectUrl: error ? "" : URL.createObjectURL(file), size: file.size, targetId: error ? "" : match.id, confidence: error ? 0 : match.score, source: "individual" as const, error: error || undefined };
    }));
    setDrafts((current) => [...current, ...next]);
    setActiveId(next[0]?.id || "");
    event.target.value = "";
  };

  const addZip = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const next = await zipGlbDrafts(file, assets);
      setDrafts((current) => [...current, ...next]);
      setActiveId(next[0]?.id || "");
    } catch {
      setDrafts((current) => [...current, { id: `${file.name}:error`, fileName: file.name, objectUrl: "", size: file.size, targetId: "", confidence: 0, source: "zip", error: "The ZIP could not be read. Re-export it with standard ZIP compression." }]);
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  };

  const updateDraft = (id: string, patch: Partial<ImportDraft>) => setDrafts((current) => current.map((draft) => draft.id === id ? { ...draft, ...patch } : draft));
  const removeDraft = (id: string) => setDrafts((current) => {
    const draft = current.find((item) => item.id === id);
    if (draft?.objectUrl) URL.revokeObjectURL(draft.objectUrl);
    const next = current.filter((item) => item.id !== id);
    setActiveId(next[0]?.id || "");
    return next;
  });
  const applyReviewed = () => {
    if (!ready.length || unresolved.length) return;
    onChange(assets.map((asset) => {
      const draft = ready.find((item) => item.targetId === asset.id);
      return draft ? { ...asset, file: draft.objectUrl, status: "reference" as const, note: `Session preview from ${draft.fileName}. Export/publish this asset before production; browser uploads are not committed to GitHub.` } : asset;
    }));
    setPublishMessage(`${ready.length} model${ready.length === 1 ? "" : "s"} applied to this browser session only.`);
    onNotify(`${ready.length} model${ready.length === 1 ? "" : "s"} applied for this session. Publish to GitHub to make the change permanent.`);
  };
  const publishReviewed = async () => {
    if (!ready.length || unresolved.length || !publishKey.trim()) return;
    setPublishing(true);
    setPublishMessage(`Publishing 0 of ${ready.length}…`);
    let nextAssets = [...assets];
    try {
      for (let index = 0; index < ready.length; index += 1) {
        const draft = ready[index];
        const target = nextAssets.find((asset) => asset.id === draft.targetId);
        if (!target) throw new Error(`The destination for ${draft.fileName} no longer exists.`);
        const response = await fetch(draft.objectUrl);
        if (!response.ok) throw new Error(`The browser preview for ${draft.fileName} is no longer available.`);
        const blob = await response.blob();
        const form = new FormData();
        form.append("file", new File([blob], draft.fileName, { type: "model/gltf-binary" }));
        form.append("asset", JSON.stringify({ ...target, status: "reference", note: `Published from reviewed upload ${draft.fileName}. Exact geometry, scale and materials still require 3D Admin verification.` }));
        setPublishMessage(`Publishing ${index + 1} of ${ready.length}: ${draft.fileName}`);
        const result = await fetch("/api/models/publish", { method: "POST", headers: { "x-model-publish-key": publishKey.trim() }, body: form });
        const payload = await result.json().catch(() => ({}));
        if (!result.ok) throw new Error(payload.error || `GitHub rejected ${draft.fileName}.`);
        nextAssets = nextAssets.map((asset) => asset.id === target.id ? { ...asset, file: payload.publicPath, status: "reference" as const, note: `Published permanently to GitHub from ${draft.fileName}. Verification is still required before marking exact.` } : asset);
      }
      onChange(nextAssets);
      setPublishMessage(`${ready.length} model${ready.length === 1 ? "" : "s"} committed to GitHub. The deployed site will use them after its next build.`);
      onNotify(`${ready.length} model${ready.length === 1 ? "" : "s"} committed to GitHub successfully.`);
    } catch (error) {
      const failure = error instanceof Error ? error.message : "The models could not be published.";
      setPublishMessage(failure);
      onNotify(failure, "error");
    } finally {
      setPublishing(false);
    }
  };

  return <div className="upload-studio">
    <section className="upload-command-panel">
      <div><span className="eyebrow dark">MODEL INTAKE</span><h2>Add one model or import a complete ZIP</h2><p>Filenames suggest the destination. Nothing is applied until every file is reviewed.</p></div>
      <div className="upload-methods"><button onClick={() => individualRef.current?.click()}><span>＋</span><strong>Individual GLB</strong><small>Choose one or several models</small></button><button onClick={() => zipRef.current?.click()}><span>ZIP</span><strong>Mass import</strong><small>Match every GLB by filename</small></button></div>
      <input ref={individualRef} type="file" accept=".glb,model/gltf-binary" multiple hidden onChange={addIndividual}/><input ref={zipRef} type="file" accept=".zip,application/zip" hidden onChange={addZip}/>
      <div className="upload-storage-truth"><span>!</span><div><strong>Uploads start as session previews</strong><p>They do not save to GitHub automatically. Publish the reviewed files through the site&apos;s durable asset workflow before treating them as permanent.</p></div></div>
      <label className="github-publish-setup"><span>Publisher key</span><input type="password" autoComplete="off" value={publishKey} onChange={(event) => setPublishKey(event.target.value)} placeholder="Enter the server-configured key"/><small>This is a separate admin key—not a GitHub token. The token stays private on the server.</small></label>
      <button className="button ghost full" onClick={onOpenLibrary}>Open complete model library</button>
    </section>
    <section className="upload-preview-panel">
      {active?.objectUrl ? createElement("model-viewer", { key: active.objectUrl, src: active.objectUrl, alt: `${active.fileName} import preview`, "camera-controls": true, "auto-rotate": true, "environment-image": "neutral", "shadow-intensity": "1.1", exposure: "1.08", "camera-orbit": "35deg 70deg auto", "field-of-view": "30deg" }) : <div className="upload-preview-empty"><span>{busy ? "…" : "3D"}</span><strong>{busy ? "Reading ZIP models" : active?.error || "Choose a GLB or ZIP to begin"}</strong><small>{active?.error ? "This file will not be applied." : "The selected model will appear here for inspection."}</small></div>}
      {active && <div className="upload-preview-name"><span>{active.source === "zip" ? "ZIP IMPORT" : "INDIVIDUAL UPLOAD"}</span><strong>{active.fileName}</strong><small>{(active.size / 1048576).toFixed(1)} MB · Session preview</small></div>}
    </section>
    <aside className="upload-review-panel">
      <header><div><span>REVIEW QUEUE</span><strong>{drafts.length} model{drafts.length === 1 ? "" : "s"}</strong></div><b>{unresolved.length ? `${unresolved.length} need attention` : drafts.length ? "Ready to apply" : "Waiting"}</b></header>
      <div className="upload-review-list">{drafts.length ? drafts.map((draft, index) => <article key={draft.id} className={`${draft.id === active?.id ? "active" : ""}${draft.error ? " error" : ""}`} onClick={() => setActiveId(draft.id)}><div className="upload-review-index">{draft.error ? "!" : index + 1}</div><div><strong>{draft.fileName}</strong><small>{draft.error || (draft.targetId ? `${draft.confidence}% filename match confidence` : "Choose a destination")}</small><label><span>Destination</span><select value={draft.targetId} disabled={Boolean(draft.error)} onClick={(event) => event.stopPropagation()} onChange={(event) => updateDraft(draft.id, { targetId: event.target.value, confidence: event.target.value === draft.targetId ? draft.confidence : 100 })}><option value="">Choose destination…</option>{targetGroups.map((group) => <optgroup key={group.brandId} label={group.label}>{group.assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.modelName} · {asset.kind} · {asset.variant}</option>)}</optgroup>)}</select></label></div><button aria-label={`Remove ${draft.fileName}`} onClick={(event) => { event.stopPropagation(); removeDraft(draft.id); }}>×</button></article>) : <div className="upload-queue-empty"><strong>No models staged</strong><span>Upload an individual GLB or a ZIP package.</span></div>}</div>
      <footer><div><span>Storage state</span><strong>{publishMessage || "Session preview"}</strong><small>{publishMessage ? "GitHub publication creates a durable repository commit." : "Publish required for permanent customer use"}</small></div><div className="upload-publish-actions"><button className="button ghost full" disabled={publishing || !ready.length || Boolean(unresolved.length)} onClick={applyReviewed}>Use this session</button><button className="button primary full" disabled={publishing || !publishKey.trim() || !ready.length || Boolean(unresolved.length)} onClick={publishReviewed}>{publishing ? "Publishing…" : `Publish ${ready.length || "reviewed"} to GitHub`}</button></div></footer>
    </aside>
  </div>;
}

function ModelLibraryPanel({ assets, onChange }: { assets: ModelAssetRecord[]; onChange: (assets: ModelAssetRecord[]) => void }) {
  const [filter, setFilter] = useState("all");
  const [detectedMaterials, setDetectedMaterials] = useState<Record<string, string[]>>({});
  const [pickerAssetId, setPickerAssetId] = useState<string | null>(null);
  const update = (id: string, patch: Partial<ModelAssetRecord>) => onChange(assets.map((asset) => asset.id === id ? { ...asset, ...patch } : asset));
  const shown = assets.filter((asset) => filter === "all" || asset.status === filter || asset.brandId === filter || asset.kind === filter);
  const exact = assets.filter((asset) => asset.status === "exact").length;
  const reference = assets.filter((asset) => asset.status === "reference").length;
  const missing = assets.filter((asset) => asset.status === "missing").length;
  const pickerAsset = assets.find((asset) => asset.id === pickerAssetId);

  return <div className="model-library">
    <div className="library-summary"><article><span>Exact assets</span><strong>{exact}</strong><small>Verified model-specific GLBs</small></article><article><span>Reference only</span><strong>{reference}</strong><small>Visible with a warning</small></article><article className="danger"><span>Missing assets</span><strong>{missing}</strong><small>Never substituted silently</small></article><article><span>Total requirements</span><strong>{assets.length}</strong><small>Exterior, interior and bodies</small></article></div>
    <div className="library-toolbar"><div><h2>Model requirement registry</h2><p>Missing records are flagged in the customer builder. “Reference” never appears as an exact match.</p></div><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All requirements</option><option value="missing">Missing only</option><option value="reference">Reference only</option><option value="exact">Exact only</option><option value="isuzu">Isuzu</option><option value="freightliner">Freightliner</option><option value="western-star">Western Star</option><option value="exterior">Exterior</option><option value="interior">Interior</option><option value="body">Modular bodies</option><option value="complete">Complete trucks</option></select></div>
    <div className="library-table-wrap"><table className="library-table"><thead><tr><th>Preview</th><th>Truck / target</th><th>Required model</th><th>Model status</th><th>Compatibility</th><th>GLB path</th><th>Cab paint materials</th><th>Verification note</th></tr></thead><tbody>{shown.map((asset) => { const targets = asset.kind === "complete" ? completeTruckTargets(asset) : null; return <tr key={asset.id} className={`asset-${asset.status}`}><td><AssetThumbnail asset={asset} onMaterialsFound={(names) => setDetectedMaterials((current) => current[asset.id]?.join("|") === names.join("|") ? current : { ...current, [asset.id]: names })}/></td><td>{targets ? <div className="asset-target-picker"><strong>{asset.brandName}</strong><select value={asset.modelId} onChange={(event) => { const target = targets.find((item) => item.id === event.target.value)!; update(asset.id, { modelId: target.id, modelName: target.name }); }}><option value="unassigned">Choose exact chassis…</option>{targets.slice(1).map((target) => <option key={target.id} value={target.id}>{target.name}</option>)}</select><small>{asset.modelId === "unassigned" ? "Not shown to customers until assigned" : `Assigned to ${asset.modelName}`}</small></div> : <><strong>{asset.brandName} {asset.modelName}</strong><small>{asset.modelId}</small></>}</td><td><strong>{asset.kind === "complete" ? "Complete truck" : asset.kind}</strong><small>{asset.variant}</small></td><td><select value={asset.status} onChange={(event) => update(asset.id, { status: event.target.value as ModelAssetRecord["status"] })}><option value="missing">Missing</option><option value="reference">Reference</option><option value="exact">Exact verified</option></select></td><td>{asset.kind === "body" || asset.kind === "complete" ? <select value={asset.compatibility} onChange={(event) => update(asset.id, { compatibility: event.target.value as ModelAssetRecord["compatibility"] })}><option value="review">Engineering review</option><option value="verified">Verified compatible</option><option value="incompatible">Incompatible</option></select> : <span className="not-applicable">Not applicable</span>}</td><td><input value={asset.file} placeholder="No file assigned" onChange={(event) => update(asset.id, { file: event.target.value })}/></td><td><div className="paint-map-cell"><input value={asset.paintMaterials || ""} disabled={asset.kind === "interior" || asset.kind === "body"} placeholder={asset.kind === "interior" || asset.kind === "body" ? "Not used" : "CabPaint, HoodPaint"} title="Exact material names from the GLB, separated by commas" onChange={(event) => update(asset.id, { paintMaterials: event.target.value })}/>{asset.kind !== "interior" && asset.kind !== "body" && <button disabled={asset.status === "missing" || !asset.file} onClick={() => setPickerAssetId(asset.id)}>◎ Select cab on model</button>}{detectedMaterials[asset.id]?.length ? <small className="field-hint" title={detectedMaterials[asset.id].join(", ")}>Detected: {detectedMaterials[asset.id].slice(0, 3).join(", ")}{detectedMaterials[asset.id].length > 3 ? ` +${detectedMaterials[asset.id].length - 3}` : ""}</small> : <small className="field-hint">Exact GLB names only</small>}</div></td><td><input value={asset.note} placeholder={asset.status === "missing" ? "Model still required" : "State what was verified"} onChange={(event) => update(asset.id, { note: event.target.value })}/></td></tr>; })}</tbody></table></div>
    {pickerAsset && <CabMaterialPicker asset={pickerAsset} onClose={() => setPickerAssetId(null)} onSave={(paintMaterials) => { update(pickerAsset.id, { paintMaterials }); setPickerAssetId(null); }}/>}
  </div>;
}

function BodyAlignmentPanel({ assets, onAssetsChange, profiles, onChange, dimensions, attachments, onExport, onImport, message }: { assets: ModelAssetRecord[]; onAssetsChange:(assets:ModelAssetRecord[])=>void; profiles: AssemblyMountRecord[]; onChange:(profiles:AssemblyMountRecord[])=>void; dimensions:RealScaleConfig; attachments:AttachmentPointConfig; onExport:()=>void; onImport:()=>void; message:string }) {
  const chassisAssets = assets.filter((asset) => asset.kind === "exterior" && asset.status !== "missing" && asset.file);
  const bodyAssets = assets.filter((asset) => asset.kind === "body" && asset.status !== "missing" && asset.file);
  const [chassisId,setChassisId] = useState(chassisAssets[0]?.id || "");
  const [bodyId,setBodyId] = useState(bodyAssets[0]?.id || "");
  const chassis = chassisAssets.find((asset) => asset.id === chassisId) || chassisAssets[0];
  const body = bodyAssets.find((asset) => asset.id === bodyId) || bodyAssets[0];
  const [requestedLength,setRequestedLength] = useState(body?.nominalLengthFt || 16);
  const profileId = `${chassis?.id || "none"}::${body?.id || "none"}::default`;
  const profile = profiles.find((item) => item.id === profileId);
  const current = profile?.mount || DEFAULT_ISUZU_BODY_MOUNT;
  const saveMount = (next:TruckMountConfig) => {
    const record:AssemblyMountRecord = { id:profileId,chassisAssetId:chassis!.id,bodyAssetId:body!.id,bodyVariantId:"default",mount:cloneMount(next) };
    onChange([...profiles.filter((item) => item.id !== profileId),record]);
  };
  const updateAxis = (group:VectorKey,index:number,value:number) => {
    const next=cloneMount(current);
    next[group][index]=group === "rotation" ? THREE_DEG_TO_RAD(value) : value;
    saveMount(next);
  };
  const updateBodyAsset = (patch:Partial<ModelAssetRecord>) => onAssetsChange(assets.map((asset) => asset.id === body.id ? {...asset,...patch} : asset));
  if (!chassis || !body) return <div className="alignment-empty"><span>!</span><h2>Two modular assets are required</h2><p>Add at least one cab-and-chassis GLB and one separate body GLB in Model library.</p></div>;
  const scalingAllowed = body.bodySizingMode && body.bodySizingMode !== "locked" && body.nominalLengthFt;
  return <div className="alignment-layout">
    <div className="alignment-preview"><ModularTruckViewer body={body.variant} mount={current} dimensions={dimensions} assetId={chassis.id} bodyAssetId={body.id} attachments={attachments} bodyLengthFt={requestedLength} nominalBodyLengthFt={body.nominalLengthFt} bodySizingMode={body.bodySizingMode} chassisSrc={chassis.file} bodySrc={body.file} forceShowBody admin/></div>
    <aside className="alignment-controls">
      <div className="autosave-status"><span>●</span><div><strong>{message}</strong><small>Saved for this chassis + body pair only</small></div></div>
      <div className="assembly-selectors"><label><span>Chassis asset</span><select value={chassis.id} onChange={(event) => setChassisId(event.target.value)}>{chassisAssets.map((asset) => <option key={asset.id} value={asset.id}>{asset.brandName} · {asset.modelName}</option>)}</select></label><label><span>Body asset</span><select value={body.id} onChange={(event) => { const next=bodyAssets.find((asset)=>asset.id===event.target.value); setBodyId(event.target.value); setRequestedLength(next?.nominalLengthFt || 16); }}>{bodyAssets.map((asset) => <option key={asset.id} value={asset.id}>{asset.brandName} · {asset.variant}</option>)}</select></label></div>
      <div className={scalingAllowed ? "body-sizing-status reference" : "body-sizing-status locked"}><strong>{scalingAllowed ? body.bodySizingMode === "uniform-reference" ? "Reference length scaling enabled" : "Verified stretch-zone scaling" : "Body length is locked"}</strong><p>{scalingAllowed ? "Front mount remains anchored while the body length changes. Uniform scaling is not exact production geometry." : "Upload a size-specific GLB or configure a stretch-safe body asset before changing length."}</p></div>
      <div className="admin-field-row"><label className="admin-field"><span>Asset nominal length</span><div><input type="number" min="1" max="60" step=".1" value={body.nominalLengthFt ?? ""} onChange={(event)=>updateBodyAsset({nominalLengthFt:event.target.value ? Number(event.target.value) : undefined})}/><small>ft</small></div></label><label className="admin-field"><span>Length behavior</span><select value={body.bodySizingMode || "locked"} onChange={(event)=>updateBodyAsset({bodySizingMode:event.target.value as ModelAssetRecord["bodySizingMode"]})}><option value="locked">Locked / size-specific GLB</option><option value="uniform-reference">Uniform reference only</option></select></label></div>
      <label className="admin-field"><span>Preview requested body length</span><div><input type="number" min="6" max="40" step="1" value={requestedLength} disabled={!scalingAllowed} onChange={(event) => setRequestedLength(Number(event.target.value))}/><small>ft</small></div></label>
      <ControlGroup title="Position" unit={dimensions.enabled ? "meters" : "scene units"} values={current.position} min={dimensions.enabled ? -10 : -2} max={dimensions.enabled ? 10 : 2} step={.005} onChange={(index,value)=>updateAxis("position",index,value)}/>
      <ControlGroup title="Rotation" unit="degrees" values={current.rotation.map(RAD_TO_DEG) as [number,number,number]} min={-180} max={180} step={1} onChange={(index,value)=>updateAxis("rotation",index,value)}/>
      <ControlGroup title="Fine scale" unit="multiplier" values={current.scale} min={.05} max={4} step={.01} onChange={(index,value)=>updateAxis("scale",index,value)}/>
      <div className="alignment-actions"><button className="button ghost" onClick={()=>saveMount(DEFAULT_ISUZU_BODY_MOUNT)}>Reset this pair</button><button className="button ghost" onClick={onExport}>Export all JSON</button><button className="button ghost" onClick={onImport}>Import JSON</button></div>
      <div className="mount-readout"><span>Assembly profile</span><pre>{JSON.stringify({chassisAssetId:chassis.id,bodyAssetId:body.id,requestedLengthFt:requestedLength,mount:current},null,2)}</pre></div>
    </aside>
  </div>;
}

function AttachmentPointsPanel({ mount, dimensions, attachments, onChange, slots, onSlotsChange }: { mount: TruckMountConfig; dimensions: RealScaleConfig; attachments: AttachmentPointConfig; onChange: (config: AttachmentPointConfig) => void; slots: AccessorySlotConfig[]; onSlotsChange: (slots: AccessorySlotConfig[]) => void }) {
  const [previewWheelbase, setPreviewWheelbase] = useState(attachments.baseWheelbaseIn || 176);
  const previewPlacements: AccessoryPlacement[] = slots.flatMap((slot) => slot.compatibleAccessories[0] ? [{ accessory: slot.compatibleAccessories[0], slotId: slot.id }] : []);
  const updateVector = (key: "frontAxle" | "rearAxle" | "bodyMount", index: number, value: number) => {
    const next = [...attachments[key]] as [number, number, number];
    next[index] = value;
    onChange({ ...attachments, enabled: false, [key]: next });
  };
  const updateSlot = (id: string, patch: Partial<AccessorySlotConfig>) => onSlotsChange(slots.map((slot) => slot.id === id ? { ...slot, ...patch } : slot));
  const nodeMappingReady = Boolean(attachments.baseWheelbaseIn && attachments.rearAxleNodeNames.trim() && attachments.frameStretchNodeNames.trim());

  return <div className="attachment-admin-layout">
    <div className="attachment-preview-card">
      <div className="attachment-preview-head"><div><span className="eyebrow dark">LIVE WHEELBASE TEST</span><h2>{previewWheelbase} in wheelbase</h2><p>Front axle remains fixed; mapped rear axle and frame nodes move along the selected axis.</p></div><select value={previewWheelbase} onChange={(event) => setPreviewWheelbase(Number(event.target.value))}>{[109,132.5,150,176,200,212].map((value) => <option key={value} value={value}>{value} in</option>)}</select></div>
      <div className="attachment-preview"><ModularTruckViewer body="Dry Van Box" mount={mount} dimensions={dimensions} attachments={attachments} wheelbaseIn={previewWheelbase} accessorySlots={slots} accessoryPlacements={previewPlacements} admin/></div>
      <div className={hasAttachmentGeometry(attachments) ? "attachment-truth active" : "attachment-truth"}><strong>{hasAttachmentGeometry(attachments) ? "Verified node mapping enabled" : "Current one-piece GLB cannot change wheelbase safely"}</strong><p>{hasAttachmentGeometry(attachments) ? "Mapped axle, frame, body, and equipment locations follow the selected wheelbase." : "Do not stretch the entire truck. Export separate rear-axle and frame nodes, then enter their exact GLB node names here."}</p></div>
    </div>
    <aside className="attachment-controls-card">
      <h3>Wheelbase geometry map</h3>
      <label className="admin-field"><span>Base wheelbase</span><div><input type="number" min="1" step="0.1" value={attachments.baseWheelbaseIn ?? ""} onChange={(event) => onChange({ ...attachments, enabled:false, baseWheelbaseIn: event.target.value ? Number(event.target.value) : null })}/><small>in</small></div></label>
      <div className="admin-field-row"><label className="admin-field"><span>Length axis</span><select value={attachments.axis} onChange={(event) => onChange({ ...attachments, enabled:false, axis:event.target.value as AttachmentPointConfig["axis"] })}><option value="x">X</option><option value="y">Y</option><option value="z">Z</option></select></label><label className="admin-field"><span>Rear direction</span><select value={attachments.direction} onChange={(event) => onChange({ ...attachments, enabled:false, direction:Number(event.target.value) as 1 | -1 })}><option value={-1}>Negative</option><option value={1}>Positive</option></select></label></div>
      <label className="admin-field"><span>Rear axle node names</span><input value={attachments.rearAxleNodeNames} placeholder="RearAxle_L, RearAxle_R" onChange={(event) => onChange({ ...attachments, enabled:false, rearAxleNodeNames:event.target.value })}/><small>Exact comma-separated GLB node names</small></label>
      <label className="admin-field"><span>Frame stretch node names</span><input value={attachments.frameStretchNodeNames} placeholder="FrameRails" onChange={(event) => onChange({ ...attachments, enabled:false, frameStretchNodeNames:event.target.value })}/><small>Only frame sections designed to lengthen</small></label>
      <ControlGroup title="Front axle anchor" unit={dimensions.enabled ? "meters" : "scene units"} values={attachments.frontAxle} min={-10} max={10} step={.005} onChange={(index,value) => updateVector("frontAxle",index,value)}/>
      <ControlGroup title="Rear axle anchor" unit={dimensions.enabled ? "meters" : "scene units"} values={attachments.rearAxle} min={-10} max={10} step={.005} onChange={(index,value) => updateVector("rearAxle",index,value)}/>
      <ControlGroup title="Body attachment anchor" unit={dimensions.enabled ? "meters" : "scene units"} values={attachments.bodyMount} min={-10} max={10} step={.005} onChange={(index,value) => updateVector("bodyMount",index,value)}/>
      <label className="verification-check"><input type="checkbox" checked={attachments.verified} onChange={(event) => onChange({ ...attachments, enabled:false, verified:event.target.checked })}/><span><strong>I verified the node names and anchor points.</strong><small>Customer visuals stay labeled as planning references until this is checked.</small></span></label>
      <button className="button primary full" disabled={!nodeMappingReady || !attachments.verified} onClick={() => onChange({ ...attachments, enabled:true })}>Enable wheelbase geometry</button>
      <h3 className="slot-heading">Customer equipment slots</h3>
      <p className="slot-intro">Customers can only place equipment in compatible locations. Orange geometry is a planning marker until an exact accessory GLB is assigned.</p>
      <div className="slot-list">{slots.map((slot) => <article key={slot.id}><div><strong>{slot.label}</strong><small>{slot.id}</small></div><label><span>Compatible equipment</span><input value={slot.compatibleAccessories.join(", ")} onChange={(event) => updateSlot(slot.id,{ compatibleAccessories:event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })}/></label><label><span>Wheelbase follow</span><input type="number" min="0" max="1" step=".05" value={slot.wheelbaseFollowRatio} onChange={(event) => updateSlot(slot.id,{ wheelbaseFollowRatio:Number(event.target.value) })}/></label><ControlGroup title="Slot position" unit={dimensions.enabled ? "meters" : "scene units"} values={slot.position} min={-10} max={10} step={.005} onChange={(index,value) => { const position=[...slot.position] as [number,number,number]; position[index]=value; updateSlot(slot.id,{position,verified:false}); }}/><label className="slot-verified"><input type="checkbox" checked={slot.verified} onChange={(event) => updateSlot(slot.id,{verified:event.target.checked})}/><span>Position verified</span></label></article>)}</div>
    </aside>
  </div>;
}

function InteriorCameraPanel({ assets, config, onChange }: { assets: ModelAssetRecord[]; config: InteriorCameraConfig; onChange: (config: InteriorCameraConfig) => void }) {
  const interiorAsset = assets.find((asset) => asset.kind === "interior" && asset.status !== "missing" && asset.file);
  const updateVector = (key: "eyePosition" | "modelPosition" | "modelRotation", index: number, value: number) => {
    const next = [...config[key]] as [number,number,number];
    next[index] = value;
    onChange({ ...config, verified:false, [key]:next });
  };
  return <div className="interior-admin-layout">
    <div className="interior-admin-preview">{interiorAsset ? <InteriorCabViewer src={interiorAsset.file} config={config} admin/> : <div className="interior-admin-missing"><span>!</span><h2>Interior GLB required</h2><p>Add an interior model in Model library before calibrating the driver eye point.</p></div>}</div>
    <aside className="interior-admin-controls"><span className="eyebrow dark">FIRST-PERSON CAB SETUP</span><h2>Place the driver, not an orbit camera</h2><p>The camera stays at the seated eye point while mouse or touch movement changes only the direction of view.</p>
      <ControlGroup title="Driver eye position" unit="GLB scene units" values={config.eyePosition} min={-2} max={2} step={.005} onChange={(index,value) => updateVector("eyePosition",index,value)}/>
      <div className="admin-field-row"><label className="admin-field"><span>Forward yaw</span><div><input type="number" min="-360" max="360" step="1" value={config.yawDeg} onChange={(event) => onChange({ ...config,verified:false,yawDeg:Number(event.target.value) })}/><small>deg</small></div></label><label className="admin-field"><span>Resting pitch</span><div><input type="number" min="-68" max="62" step="1" value={config.pitchDeg} onChange={(event) => onChange({ ...config,verified:false,pitchDeg:Number(event.target.value) })}/><small>deg</small></div></label></div>
      <ControlGroup title="Interior model position" unit="GLB scene units" values={config.modelPosition} min={-2} max={2} step={.005} onChange={(index,value) => updateVector("modelPosition",index,value)}/>
      <ControlGroup title="Interior model rotation" unit="degrees" values={config.modelRotation} min={-180} max={180} step={1} onChange={(index,value) => updateVector("modelRotation",index,value)}/>
      <label className="admin-field"><span>Interior model scale</span><input type="number" min=".05" max="10" step=".01" value={config.modelScale} onChange={(event) => onChange({ ...config,verified:false,modelScale:Number(event.target.value) })}/></label>
      <label className="verification-check"><input type="checkbox" checked={config.verified} onChange={(event) => onChange({ ...config,verified:event.target.checked })}/><span><strong>I verified the eye point from the driver seat.</strong><small>Confirm the windshield, dashboard, mirrors, pedals, and head clearance before publishing.</small></span></label>
    </aside>
  </div>;
}

function ScalePanel({ dimensions, onChange, mount, onMountChange, onNotify }: { dimensions: RealScaleConfig; onChange: (dimensions: RealScaleConfig) => void; mount: TruckMountConfig; onMountChange: (mount: TruckMountConfig) => void; onNotify: (text: string, kind?: "success" | "error") => void }) {
  const complete = hasCompleteMeasurements(dimensions) && Boolean(dimensions.targetAssetId.trim()) && Boolean(dimensions.targetBodyAssetId.trim());
  const updateDimension = (part: "chassis" | "body", key: "lengthIn" | "widthIn" | "heightIn", value: string) => onChange({ ...dimensions, enabled: false, [part]: { ...dimensions[part], [key]: value === "" ? null : Number(value) } });
  const apply = () => {
    if (!complete || !dimensions.verified) return;
    onChange({ ...dimensions, enabled: true });
    onMountChange({ ...cloneMount(mount), scale: [1, 1, 1] });
    onNotify("Verified real-life scale applied to the selected chassis and body assets.");
  };

  return <div className="scale-panel">
    <div className={dimensions.enabled ? "scale-status active" : "scale-status"}><span>{dimensions.enabled ? "✓" : "!"}</span><div><strong>{dimensions.enabled ? "Real-life scaling is active" : "Scale is unverified"}</strong><p>{dimensions.enabled ? "Three.js scene units are meters and dimensions below drive the GLB scale." : "The uploaded Tripo files were normalized independently. Enter measured dimensions before claiming exact scale."}</p></div></div>
    <label className="dimension-source"><span>Exact target asset ID</span><input value={dimensions.targetAssetId} placeholder="Example: isuzu:nrr-ev:exterior" onChange={(event) => onChange({ ...dimensions, enabled:false, verified:false, targetAssetId:event.target.value })}/></label>
    <label className="dimension-source"><span>Exact body asset ID</span><input value={dimensions.targetBodyAssetId} placeholder="Example: isuzu:shared-body:Standard dry box / van body" onChange={(event) => onChange({ ...dimensions, enabled:false, verified:false, targetBodyAssetId:event.target.value })}/></label>
    <div className="dimension-grid"><DimensionCard title="Selected cab and chassis asset" values={dimensions.chassis} onChange={(key, value) => updateDimension("chassis", key, value)}/><DimensionCard title="Selected body asset" values={dimensions.body} onChange={(key, value) => updateDimension("body", key, value)}/></div>
    <label className="dimension-source"><span>Measurement source</span><input value={dimensions.source} placeholder="Example: body builder drawing, OEM dimension sheet, physical measurement" onChange={(event) => onChange({ ...dimensions, enabled: false, source: event.target.value })}/></label>
    <label className="verification-check"><input type="checkbox" checked={dimensions.verified} onChange={(event) => onChange({ ...dimensions, enabled: false, verified: event.target.checked })}/><span><strong>I verified these measurements against a reliable source.</strong><small>The system will not label the model exact until this is checked and every dimension is present.</small></span></label>
    <div className="scale-actions"><button className="button primary" disabled={!complete || !dimensions.verified} onClick={apply}>Apply measured scale</button><button className="button ghost" onClick={() => { onChange({ ...dimensions, enabled: false }); onNotify("Real-life scale disabled. The viewer is back in planning mode."); }}>Disable real scale</button></div>
    <p className="scale-formula">Scaling formula: real dimension in inches × 0.0254 ÷ measured GLB bounding-box dimension. Measurements apply only to the named target asset; the earlier NQR dimensions are not reused for the uploaded NRR EV.</p>
  </div>;
}

function DimensionCard({ title, values, onChange }: { title: string; values: RealScaleConfig["chassis"]; onChange: (key: "lengthIn" | "widthIn" | "heightIn", value: string) => void }) {
  return <article className="dimension-card"><h3>{title}</h3><p>Enter full exterior dimensions in inches.</p>{(["lengthIn", "widthIn", "heightIn"] as const).map((key) => <label key={key}><span>{key.replace("In", "")}</span><div><input type="number" min="0" step="0.01" value={values[key] ?? ""} onChange={(event) => onChange(key, event.target.value)}/><small>in</small></div></label>)}</article>;
}

function ControlGroup({ title, unit, values, min, max, step, onChange }: { title: string; unit: string; values: [number, number, number]; min: number; max: number; step: number; onChange: (index: number, value: number) => void }) {
  return (
    <div className="control-group">
      <div className="control-title"><strong>{title}</strong><small>{unit}</small></div>
      {axes.map((axis, index) => <label className="axis-control" key={axis}><b>{axis}</b><input type="range" min={min} max={max} step={step} value={values[index]} onChange={(event) => onChange(index, Number(event.target.value))}/><input type="number" min={min} max={max} step={step} value={Number(values[index].toFixed(3))} onChange={(event) => onChange(index, Number(event.target.value))}/></label>)}
    </div>
  );
}

function RAD_TO_DEG(value: number) { return value * 180 / Math.PI; }
function THREE_DEG_TO_RAD(value: number) { return value * Math.PI / 180; }
