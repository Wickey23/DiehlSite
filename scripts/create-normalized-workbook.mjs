#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import XLSX from "xlsx";

const REQUIRED_SHEETS = [
  "DB_Customers",
  "DB_Units",
  "DB_InService",
  "DB_WarrantyCoverage",
  "DB_Contacts",
  "DB_ActivityLog",
  "DB_FieldMapping",
  "DB_DataQuality",
  "DB_Dashboard",
];

const RAW_TRACE_FIELDS = ["Raw_Source_Sheet", "Raw_Source_Row"];

const TABLE_HEADERS = {
  DB_Customers: [
    "Customer_ID",
    "Customer_Name",
    "Account_Number",
    "Billing_Address",
    "City",
    "State",
    "Postal_Code",
    "Primary_Phone",
    "Primary_Email",
    ...RAW_TRACE_FIELDS,
  ],
  DB_Units: [
    "VIN",
    "Unit_Number",
    "Stock_Number",
    "Year",
    "Make",
    "Model",
    "Trim",
    "Body_Type",
    "Engine",
    "Transmission",
    "Current_Mileage",
    "Customer_ID",
    ...RAW_TRACE_FIELDS,
  ],
  DB_InService: [
    "VIN",
    "In_Service_Date",
    "In_Service_Mileage",
    "Selling_Dealer",
    "Delivery_Date",
    "Customer_ID",
    ...RAW_TRACE_FIELDS,
  ],
  DB_WarrantyCoverage: [
    "VIN",
    "Warranty_Status",
    "Warranty_Type",
    "Warranty_Start_Date",
    "Warranty_End_Date",
    "Warranty_Mileage_Limit",
    "Warranty_Notes",
    ...RAW_TRACE_FIELDS,
  ],
  DB_Contacts: [
    "Customer_ID",
    "VIN",
    "Contact_Name",
    "Contact_Role",
    "Phone",
    "Email",
    ...RAW_TRACE_FIELDS,
  ],
  DB_ActivityLog: [
    "VIN",
    "Customer_ID",
    "Activity_Date",
    "Activity_Type",
    "Activity_Notes",
    "Assigned_To",
    ...RAW_TRACE_FIELDS,
  ],
};

const FIELD_RULES = [
  { table: "DB_Units", field: "VIN", patterns: [/^vin$/i, /vehicle\s*identification/i], rule: "Trim whitespace, uppercase, preserve as DB_Units primary key." },
  { table: "DB_Units", field: "Unit_Number", patterns: [/unit\s*(#|no|num|number|id)?$/i, /^unit$/i], rule: "Trim whitespace." },
  { table: "DB_Units", field: "Stock_Number", patterns: [/stock/i, /inventory\s*(#|no|num|number|id)?/i], rule: "Trim whitespace." },
  { table: "DB_Units", field: "Year", patterns: [/^year$/i, /model\s*year/i], rule: "Normalize to numeric year when possible." },
  { table: "DB_Units", field: "Make", patterns: [/^make$/i, /manufacturer/i], rule: "Trim whitespace." },
  { table: "DB_Units", field: "Model", patterns: [/^model$/i], rule: "Trim whitespace." },
  { table: "DB_Units", field: "Trim", patterns: [/^trim$/i, /series/i], rule: "Trim whitespace." },
  { table: "DB_Units", field: "Body_Type", patterns: [/body/i, /vehicle\s*type/i, /chassis/i], rule: "Trim whitespace." },
  { table: "DB_Units", field: "Engine", patterns: [/engine/i, /motor/i], rule: "Trim whitespace." },
  { table: "DB_Units", field: "Transmission", patterns: [/transmission/i, /^trans$/i], rule: "Trim whitespace." },
  { table: "DB_Units", field: "Current_Mileage", patterns: [/mileage$/i, /^miles$/i, /odometer/i, /current\s*mileage/i], rule: "Normalize to number when possible." },

  { table: "DB_Customers", field: "Customer_Name", patterns: [/customer\s*name/i, /^customer$/i, /account\s*name/i, /client\s*name/i, /^name$/i], rule: "Trim whitespace. Customer_ID is derived from account number or normalized name." },
  { table: "DB_Customers", field: "Account_Number", patterns: [/account\s*(#|no|num|number|id)?/i, /customer\s*(#|no|num|number|id)/i, /client\s*(#|no|num|number|id)/i], rule: "Trim whitespace." },
  { table: "DB_Customers", field: "Billing_Address", patterns: [/address/i, /street/i], rule: "Trim whitespace." },
  { table: "DB_Customers", field: "City", patterns: [/^city$/i], rule: "Trim whitespace." },
  { table: "DB_Customers", field: "State", patterns: [/^state$/i, /province/i], rule: "Trim whitespace." },
  { table: "DB_Customers", field: "Postal_Code", patterns: [/zip/i, /postal/i], rule: "Trim whitespace." },
  { table: "DB_Customers", field: "Primary_Phone", patterns: [/primary\s*phone/i, /customer\s*phone/i, /^phone$/i, /telephone/i], rule: "Trim whitespace; preserve formatting." },
  { table: "DB_Customers", field: "Primary_Email", patterns: [/primary\s*email/i, /customer\s*email/i, /^email$/i, /e-mail/i], rule: "Trim whitespace; lowercase." },

  { table: "DB_InService", field: "In_Service_Date", patterns: [/in.?service\s*date/i, /service\s*start/i, /warranty\s*start/i], rule: "Preserve date value; format as yyyy-mm-dd where possible." },
  { table: "DB_InService", field: "In_Service_Mileage", patterns: [/in.?service\s*mileage/i, /delivery\s*mileage/i, /mileage\s*at\s*service/i], rule: "Normalize to number when possible." },
  { table: "DB_InService", field: "Selling_Dealer", patterns: [/selling\s*dealer/i, /dealer/i], rule: "Trim whitespace." },
  { table: "DB_InService", field: "Delivery_Date", patterns: [/delivery\s*date/i, /sold\s*date/i, /sale\s*date/i], rule: "Preserve date value; format as yyyy-mm-dd where possible." },

  { table: "DB_WarrantyCoverage", field: "Warranty_Status", patterns: [/warranty\s*status/i, /coverage\s*status/i, /^status$/i], rule: "Trim whitespace and preserve source status label." },
  { table: "DB_WarrantyCoverage", field: "Warranty_Type", patterns: [/warranty\s*type/i, /coverage\s*type/i, /plan/i], rule: "Trim whitespace." },
  { table: "DB_WarrantyCoverage", field: "Warranty_Start_Date", patterns: [/warranty\s*start/i, /coverage\s*start/i], rule: "Preserve date value; format as yyyy-mm-dd where possible." },
  { table: "DB_WarrantyCoverage", field: "Warranty_End_Date", patterns: [/warranty\s*end/i, /warranty\s*exp/i, /coverage\s*end/i, /expiration/i], rule: "Preserve date value; format as yyyy-mm-dd where possible." },
  { table: "DB_WarrantyCoverage", field: "Warranty_Mileage_Limit", patterns: [/warranty\s*mileage/i, /mileage\s*limit/i], rule: "Normalize to number when possible." },
  { table: "DB_WarrantyCoverage", field: "Warranty_Notes", patterns: [/warranty\s*notes/i, /coverage\s*notes/i], rule: "Trim whitespace." },

  { table: "DB_Contacts", field: "Contact_Name", patterns: [/contact\s*name/i, /primary\s*contact/i], rule: "Trim whitespace." },
  { table: "DB_Contacts", field: "Contact_Role", patterns: [/contact\s*role/i, /contact\s*title/i, /^role$/i, /^title$/i], rule: "Trim whitespace." },
  { table: "DB_Contacts", field: "Phone", patterns: [/contact\s*phone/i, /mobile/i, /cell/i], rule: "Trim whitespace; preserve formatting." },
  { table: "DB_Contacts", field: "Email", patterns: [/contact\s*email/i], rule: "Trim whitespace; lowercase." },

  { table: "DB_ActivityLog", field: "Activity_Date", patterns: [/activity\s*date/i, /last\s*contact/i, /last\s*service/i, /created\s*date/i, /updated\s*date/i], rule: "Preserve date value; format as yyyy-mm-dd where possible." },
  { table: "DB_ActivityLog", field: "Activity_Type", patterns: [/activity\s*type/i, /event\s*type/i, /interaction\s*type/i], rule: "Trim whitespace." },
  { table: "DB_ActivityLog", field: "Activity_Notes", patterns: [/notes?$/i, /comments?/i, /remarks?/i, /description/i], rule: "Trim whitespace; preserve full note text." },
  { table: "DB_ActivityLog", field: "Assigned_To", patterns: [/assigned\s*to/i, /owner/i, /sales\s*rep/i, /advisor/i], rule: "Trim whitespace." },
];

function usage() {
  console.error("Usage: npm run normalize:workbook -- <input.xlsx> [output.xlsx]");
}

function normalizeHeader(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function cellText(value) {
  if (value === undefined || value === null) return "";
  if (value instanceof Date) return XLSX.SSF.format("yyyy-mm-dd", value);
  return String(value).trim();
}

function slug(value) {
  return cellText(value).toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function makeCustomerId(row, columnMap) {
  const account = getMappedValue(row, columnMap, "DB_Customers", "Account_Number");
  if (cellText(account)) return `ACCT_${slug(account)}`;
  const customer = getMappedValue(row, columnMap, "DB_Customers", "Customer_Name");
  if (cellText(customer)) return `CUST_${slug(customer)}`;
  return "";
}

function matchRule(header) {
  return FIELD_RULES.find((rule) => rule.patterns.some((pattern) => pattern.test(header)));
}

function transformValue(value, field) {
  if (value === undefined || value === null) return "";
  const text = cellText(value);
  if (!text) return "";
  if (field === "VIN") return text.toUpperCase().replace(/\s+/g, "");
  if (field.includes("Email")) return text.toLowerCase();
  if (["Year", "Current_Mileage", "In_Service_Mileage", "Warranty_Mileage_Limit"].includes(field)) {
    const number = Number(String(value).replace(/[^0-9.-]+/g, ""));
    return Number.isFinite(number) && String(value).match(/\d/) ? number : text;
  }
  return value instanceof Date ? XLSX.SSF.format("yyyy-mm-dd", value) : text;
}

function getMappedValue(row, columnMap, table, field) {
  const mappedHeader = Object.entries(columnMap).find(([, target]) => target.table === table && target.field === field)?.[0];
  if (!mappedHeader) return "";
  return transformValue(row[mappedHeader], field);
}

function appendUnique(rows, row, keyFields) {
  const key = keyFields.map((field) => cellText(row[field]).toUpperCase()).join("|");
  if (!key.replace(/\|/g, "")) return;
  if (rows.some((existing) => keyFields.map((field) => cellText(existing[field]).toUpperCase()).join("|") === key)) return;
  rows.push(row);
}

function collectRawSheet(workbook, sheetName) {
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });
  const aoa = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "", raw: false });
  const headers = (aoa[0] || []).map(normalizeHeader).filter(Boolean);
  return { rows, headers };
}

function buildDatabase(workbook, rawSheetNames) {
  const dbRows = Object.fromEntries(Object.keys(TABLE_HEADERS).map((sheet) => [sheet, []]));
  const fieldMappingRows = [];
  const unmappedRecordRows = [];

  for (const sheetName of rawSheetNames) {
    const { rows, headers } = collectRawSheet(workbook, sheetName);
    const columnMap = {};

    for (const header of headers) {
      const rule = matchRule(header);
      if (rule) {
        columnMap[header] = { table: rule.table, field: rule.field, rule: rule.rule, notes: "Mapped by normalized header pattern." };
      } else {
        columnMap[header] = {
          table: "Raw source only",
          field: "preserved in raw source only",
          rule: "No normalized field match; value remains preserved in the untouched raw sheet.",
          notes: "Review before adding new normalized field.",
        };
      }
      fieldMappingRows.push({
        "Original Sheet": sheetName,
        "Original Column": header,
        "New Table": columnMap[header].table,
        "New Field": columnMap[header].field,
        "Transformation Rule": columnMap[header].rule,
        Notes: columnMap[header].notes,
      });
    }

    rows.forEach((row, index) => {
      const excelRowNumber = index + 2;
      const trace = { Raw_Source_Sheet: sheetName, Raw_Source_Row: excelRowNumber };
      const vin = getMappedValue(row, columnMap, "DB_Units", "VIN");
      const customerId = makeCustomerId(row, columnMap);
      const customerName = getMappedValue(row, columnMap, "DB_Customers", "Customer_Name");

      const unit = {
        VIN: vin,
        Unit_Number: getMappedValue(row, columnMap, "DB_Units", "Unit_Number"),
        Stock_Number: getMappedValue(row, columnMap, "DB_Units", "Stock_Number"),
        Year: getMappedValue(row, columnMap, "DB_Units", "Year"),
        Make: getMappedValue(row, columnMap, "DB_Units", "Make"),
        Model: getMappedValue(row, columnMap, "DB_Units", "Model"),
        Trim: getMappedValue(row, columnMap, "DB_Units", "Trim"),
        Body_Type: getMappedValue(row, columnMap, "DB_Units", "Body_Type"),
        Engine: getMappedValue(row, columnMap, "DB_Units", "Engine"),
        Transmission: getMappedValue(row, columnMap, "DB_Units", "Transmission"),
        Current_Mileage: getMappedValue(row, columnMap, "DB_Units", "Current_Mileage"),
        Customer_ID: customerId,
        ...trace,
      };
      if (Object.values(unit).some((value) => cellText(value))) {
        dbRows.DB_Units.push(unit);
      }

      const customer = {
        Customer_ID: customerId,
        Customer_Name: customerName,
        Account_Number: getMappedValue(row, columnMap, "DB_Customers", "Account_Number"),
        Billing_Address: getMappedValue(row, columnMap, "DB_Customers", "Billing_Address"),
        City: getMappedValue(row, columnMap, "DB_Customers", "City"),
        State: getMappedValue(row, columnMap, "DB_Customers", "State"),
        Postal_Code: getMappedValue(row, columnMap, "DB_Customers", "Postal_Code"),
        Primary_Phone: getMappedValue(row, columnMap, "DB_Customers", "Primary_Phone"),
        Primary_Email: getMappedValue(row, columnMap, "DB_Customers", "Primary_Email"),
        ...trace,
      };
      appendUnique(dbRows.DB_Customers, customer, ["Customer_ID"]);

      const inService = {
        VIN: vin,
        In_Service_Date: getMappedValue(row, columnMap, "DB_InService", "In_Service_Date"),
        In_Service_Mileage: getMappedValue(row, columnMap, "DB_InService", "In_Service_Mileage") || unit.Current_Mileage,
        Selling_Dealer: getMappedValue(row, columnMap, "DB_InService", "Selling_Dealer"),
        Delivery_Date: getMappedValue(row, columnMap, "DB_InService", "Delivery_Date"),
        Customer_ID: customerId,
        ...trace,
      };
      appendUnique(dbRows.DB_InService, inService, ["VIN", "Raw_Source_Sheet", "Raw_Source_Row"]);

      const warranty = {
        VIN: vin,
        Warranty_Status: getMappedValue(row, columnMap, "DB_WarrantyCoverage", "Warranty_Status"),
        Warranty_Type: getMappedValue(row, columnMap, "DB_WarrantyCoverage", "Warranty_Type"),
        Warranty_Start_Date: getMappedValue(row, columnMap, "DB_WarrantyCoverage", "Warranty_Start_Date"),
        Warranty_End_Date: getMappedValue(row, columnMap, "DB_WarrantyCoverage", "Warranty_End_Date"),
        Warranty_Mileage_Limit: getMappedValue(row, columnMap, "DB_WarrantyCoverage", "Warranty_Mileage_Limit"),
        Warranty_Notes: getMappedValue(row, columnMap, "DB_WarrantyCoverage", "Warranty_Notes"),
        ...trace,
      };
      appendUnique(dbRows.DB_WarrantyCoverage, warranty, ["VIN", "Raw_Source_Sheet", "Raw_Source_Row"]);

      const contact = {
        Customer_ID: customerId,
        VIN: vin,
        Contact_Name: getMappedValue(row, columnMap, "DB_Contacts", "Contact_Name") || customerName,
        Contact_Role: getMappedValue(row, columnMap, "DB_Contacts", "Contact_Role"),
        Phone: getMappedValue(row, columnMap, "DB_Contacts", "Phone") || customer.Primary_Phone,
        Email: getMappedValue(row, columnMap, "DB_Contacts", "Email") || customer.Primary_Email,
        ...trace,
      };
      appendUnique(dbRows.DB_Contacts, contact, ["Customer_ID", "VIN", "Contact_Name", "Phone", "Email"]);

      const activity = {
        VIN: vin,
        Customer_ID: customerId,
        Activity_Date: getMappedValue(row, columnMap, "DB_ActivityLog", "Activity_Date"),
        Activity_Type: getMappedValue(row, columnMap, "DB_ActivityLog", "Activity_Type"),
        Activity_Notes: getMappedValue(row, columnMap, "DB_ActivityLog", "Activity_Notes"),
        Assigned_To: getMappedValue(row, columnMap, "DB_ActivityLog", "Assigned_To"),
        ...trace,
      };
      appendUnique(dbRows.DB_ActivityLog, activity, ["VIN", "Customer_ID", "Activity_Date", "Activity_Type", "Activity_Notes"]);

      if (!vin && !customerId) {
        unmappedRecordRows.push({ Raw_Source_Sheet: sheetName, Raw_Source_Row: excelRowNumber });
      }
    });
  }

  return { dbRows, fieldMappingRows, unmappedRecordRows };
}

function aoaSheet(rows) {
  return XLSX.utils.aoa_to_sheet(rows);
}

function jsonSheet(rows, headers) {
  return XLSX.utils.json_to_sheet(rows.length ? rows : [Object.fromEntries(headers.map((h) => [h, ""]))], { header: headers });
}

function addAutoFilter(ws, headers, rowCount) {
  ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(rowCount, 1), c: headers.length - 1 } }) };
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };
}

function replaceOrAppendSheet(workbook, sheetName, worksheet) {
  const existingIndex = workbook.SheetNames.indexOf(sheetName);
  if (existingIndex >= 0) {
    workbook.SheetNames.splice(existingIndex, 1);
    delete workbook.Sheets[sheetName];
  }
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
}

function makeDataQualitySheet(dbRows, unmappedRecordRows) {
  const headers = ["Check", "VIN", "Customer_ID", "Raw_Source_Sheet", "Raw_Source_Row", "Issue", "Formula_Check"];
  const rows = [headers];
  let formulaRow = 2;
  const pushIssue = (record, issue, formula) => {
    rows.push([
      issue,
      record.VIN || "",
      record.Customer_ID || "",
      record.Raw_Source_Sheet || "",
      record.Raw_Source_Row || "",
      issue,
      { f: formula(formulaRow) },
    ]);
    formulaRow += 1;
  };

  dbRows.DB_Units.forEach((unit) => {
    if (!cellText(unit.VIN)) pushIssue(unit, "missing VIN", (r) => `B${r}=""`);
    if (cellText(unit.VIN) && cellText(unit.VIN).length !== 17) pushIssue(unit, "invalid VIN length", (r) => `LEN(B${r})<>17`);
    if (cellText(unit.VIN) && dbRows.DB_Units.filter((other) => cellText(other.VIN).toUpperCase() === cellText(unit.VIN).toUpperCase()).length > 1) {
      pushIssue(unit, "duplicate VIN", (r) => `COUNTIF(DB_Units!A:A,B${r})>1`);
    }
    if (!cellText(unit.Customer_ID)) pushIssue(unit, "missing customer", (r) => `C${r}=""`);
    if (!cellText(unit.Current_Mileage)) pushIssue(unit, "missing mileage", (r) => `COUNTIFS(DB_Units!A:A,B${r},DB_Units!K:K,"")>0`);
  });

  dbRows.DB_InService.forEach((record) => {
    if (!cellText(record.In_Service_Date)) pushIssue(record, "missing in-service date", (r) => `COUNTIFS(DB_InService!A:A,B${r},DB_InService!B:B,"")>0`);
  });

  dbRows.DB_WarrantyCoverage.forEach((record) => {
    if (!cellText(record.Warranty_Status)) pushIssue(record, "missing warranty status", (r) => `COUNTIFS(DB_WarrantyCoverage!A:A,B${r},DB_WarrantyCoverage!B:B,"")>0`);
  });

  unmappedRecordRows.forEach((record) => pushIssue(record, "records that could not be mapped", (r) => `AND(B${r}="",C${r}="")`));

  if (rows.length === 1) rows.push(["No data quality issues found", "", "", "", "", "", { f: "TRUE" }]);
  return aoaSheet(rows);
}

function makeDashboardSheet() {
  return aoaSheet([
    ["Metric", "Formula", "Notes"],
    ["Total Units", { f: "MAX(COUNTA(DB_Units!A:A)-1,0)" }, "VIN is the DB_Units primary key."],
    ["Total Customers", { f: "MAX(COUNTA(DB_Customers!A:A)-1,0)" }, "Derived from account number or customer name."],
    ["Units Missing VIN", { f: 'COUNTIF(DB_DataQuality!A:A,"missing VIN")' }, "Source rows remain untouched."],
    ["Duplicate VIN Issues", { f: 'COUNTIF(DB_DataQuality!A:A,"duplicate VIN")' }, "Review duplicate primary keys."],
    ["Invalid VIN Length Issues", { f: 'COUNTIF(DB_DataQuality!A:A,"invalid VIN length")' }, "VIN should be 17 characters."],
    ["Missing Customer Issues", { f: 'COUNTIF(DB_DataQuality!A:A,"missing customer")' }, "Rows without normalized customer linkage."],
    ["Missing In-Service Date Issues", { f: 'COUNTIF(DB_DataQuality!A:A,"missing in-service date")' }, "Coverage timing audit."],
    ["Missing Mileage Issues", { f: 'COUNTIF(DB_DataQuality!A:A,"missing mileage")' }, "Mileage audit."],
    ["Missing Warranty Status Issues", { f: 'COUNTIF(DB_DataQuality!A:A,"missing warranty status")' }, "Warranty coverage audit."],
    ["Unmapped Records", { f: 'COUNTIF(DB_DataQuality!A:A,"records that could not be mapped")' }, "Rows with neither VIN nor customer mapping."],
    ["Field Mapping Rows", { f: "MAX(COUNTA(DB_FieldMapping!A:A)-1,0)" }, "Every original column should be represented here."],
  ]);
}

function main() {
  const [, , inputArg, outputArg] = process.argv;
  if (!inputArg) {
    usage();
    process.exit(1);
  }
  const inputPath = path.resolve(inputArg);
  if (!fs.existsSync(inputPath)) {
    console.error(`Input workbook not found: ${inputPath}`);
    process.exit(1);
  }
  const outputPath = path.resolve(outputArg || inputPath.replace(/\.(xlsx|xlsm|xls)$/i, "_normalized.xlsx"));
  const workbook = XLSX.readFile(inputPath, { cellDates: true });
  const rawSheetNames = workbook.SheetNames.filter((name) => !REQUIRED_SHEETS.includes(name));
  const { dbRows, fieldMappingRows, unmappedRecordRows } = buildDatabase(workbook, rawSheetNames);

  const fieldMappingHeaders = ["Original Sheet", "Original Column", "New Table", "New Field", "Transformation Rule", "Notes"];
  replaceOrAppendSheet(workbook, "DB_FieldMapping", jsonSheet(fieldMappingRows, fieldMappingHeaders));

  for (const [sheetName, headers] of Object.entries(TABLE_HEADERS)) {
    const worksheet = jsonSheet(dbRows[sheetName], headers);
    addAutoFilter(worksheet, headers, dbRows[sheetName].length);
    replaceOrAppendSheet(workbook, sheetName, worksheet);
  }

  const dqSheet = makeDataQualitySheet(dbRows, unmappedRecordRows);
  addAutoFilter(dqSheet, ["Check", "VIN", "Customer_ID", "Raw_Source_Sheet", "Raw_Source_Row", "Issue", "Formula_Check"], Math.max(1, XLSX.utils.sheet_to_json(dqSheet, { header: 1 }).length - 1));
  replaceOrAppendSheet(workbook, "DB_DataQuality", dqSheet);

  const dashboardSheet = makeDashboardSheet();
  replaceOrAppendSheet(workbook, "DB_Dashboard", dashboardSheet);

  XLSX.writeFile(workbook, outputPath, { bookType: "xlsx" });
  console.log(`Created normalized workbook: ${outputPath}`);
  console.log(`Raw sheets preserved: ${rawSheetNames.join(", ") || "none"}`);
  console.log(`Added/updated sheets: ${REQUIRED_SHEETS.join(", ")}`);
}

main();
