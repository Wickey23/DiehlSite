export type SizingConfidence = "oem" | "planning" | "unavailable";

export type TruckSizingResult = {
  confidence: SizingConfidence;
  source: string;
  wheelbaseIn: number | null;
  cabToAxleIn: number | null;
  cabToEndFrameIn: number | null;
  backOfCabIn: number | null;
  chassisOverallLengthIn: number | null;
  chassisOverallWidthIn: number | null;
  chassisOverallHeightIn: number | null;
  bodyMinFt: number | null;
  bodyMaxFt: number | null;
  requestedBodyLengthFt: number | null;
  completedOverallLengthIn: number | null;
  bodyLengthFit: "fits-oem-envelope" | "outside-oem-envelope" | "not-checked";
};

type OemRow = {
  wheelbaseIn: number;
  cabToAxleIn: number;
  cabToEndFrameIn: number;
  backOfCabIn: number;
  overallLengthIn: number;
  overallHeightIn: number;
  bodyMinFt: number;
  bodyMaxFt: number;
};

const GAS_STANDARD: OemRow[] = [
  [109, 86.5, 129.6, 7.7, 200.5, 90, 10, 12],
  [132.5, 110, 153.1, 7.7, 224, 92.4, 12, 14],
  [150, 127.5, 170.6, 7.7, 241.5, 92.4, 16, 18],
  [176, 153.5, 196.6, 7.7, 267.5, 92.4, 18, 20],
  [200, 177.5, 220.6, 7.7, 291.5, 92.4, 22, 22],
  [212, 189.5, 232.6, 7.7, 303.5, 92.4, 24, 24]
].map(([wheelbaseIn, cabToAxleIn, cabToEndFrameIn, backOfCabIn, overallLengthIn, overallHeightIn, bodyMinFt, bodyMaxFt]) => ({ wheelbaseIn, cabToAxleIn, cabToEndFrameIn, backOfCabIn, overallLengthIn, overallHeightIn, bodyMinFt, bodyMaxFt }));

const GAS_CREW: OemRow[] = [
  [150, 88.5, 131.6, 5, 241.5, 92.4, 12, 12],
  [176, 114.5, 157.6, 5, 267.5, 92.4, 16, 16],
  [200, 138.5, 181.6, 5, 291.5, 92.4, 18, 18],
  [212, 150.5, 193.6, 5, 303.5, 92.4, 20, 20]
].map(([wheelbaseIn, cabToAxleIn, cabToEndFrameIn, backOfCabIn, overallLengthIn, overallHeightIn, bodyMinFt, bodyMaxFt]) => ({ wheelbaseIn, cabToAxleIn, cabToEndFrameIn, backOfCabIn, overallLengthIn, overallHeightIn, bodyMinFt, bodyMaxFt }));

const DIESEL_STANDARD: OemRow[] = [
  [109, 86.5, 129.6, 7.7, 195.7, 92.9, 10, 12],
  [132.5, 110, 153.1, 7.7, 219.2, 92.9, 12, 14],
  [150, 127.5, 170.6, 7.7, 236.7, 92.9, 16, 18],
  [176, 153.5, 196.6, 7.7, 262.7, 92.9, 18, 20],
  [200, 177.5, 220.6, 7.7, 286.7, 92.9, 22, 22],
  [212, 189.5, 232.6, 7.7, 298.7, 92.9, 24, 24]
].map(([wheelbaseIn, cabToAxleIn, cabToEndFrameIn, backOfCabIn, overallLengthIn, overallHeightIn, bodyMinFt, bodyMaxFt]) => ({ wheelbaseIn, cabToAxleIn, cabToEndFrameIn, backOfCabIn, overallLengthIn, overallHeightIn, bodyMinFt, bodyMaxFt }));

const DIESEL_CREW: OemRow[] = [
  [150, 88.5, 131.6, 5.3, 236.7, 92.4, 12, 12],
  [176, 114.5, 157.6, 5.3, 262.7, 92.9, 16, 16]
].map(([wheelbaseIn, cabToAxleIn, cabToEndFrameIn, backOfCabIn, overallLengthIn, overallHeightIn, bodyMinFt, bodyMaxFt]) => ({ wheelbaseIn, cabToAxleIn, cabToEndFrameIn, backOfCabIn, overallLengthIn, overallHeightIn, bodyMinFt, bodyMaxFt }));

const NRR_EV: OemRow[] = GAS_STANDARD.filter((row) => [132.5, 150, 176].includes(row.wheelbaseIn));

const GAS_MODELS = new Set(["npr-gas", "npr-hd-gas", "nqr-gas", "nrr-gas"]);
const DIESEL_MODELS = new Set(["npr-hd-diesel", "npr-xd", "nrr-derate-diesel", "nrr"]);

function parseWheelbase(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function rowsFor(modelId: string, cab: string) {
  if (modelId === "nrr-ev") return NRR_EV;
  const crew = cab.toLowerCase().includes("crew");
  if (GAS_MODELS.has(modelId)) return crew ? GAS_CREW : GAS_STANDARD;
  if (DIESEL_MODELS.has(modelId)) return crew ? DIESEL_CREW : DIESEL_STANDARD;
  return null;
}

export function getTruckSizing(brandId: string, modelId: string, cab: string, wheelbase: string, requestedBodyLengthFt?: number): TruckSizingResult {
  const wheelbaseIn = parseWheelbase(wheelbase);
  const rows = brandId === "isuzu" ? rowsFor(modelId, cab) : null;
  const row = rows && wheelbaseIn !== null ? rows.find((candidate) => candidate.wheelbaseIn === wheelbaseIn) : undefined;
  const requested = typeof requestedBodyLengthFt === "number" && requestedBodyLengthFt > 0 ? requestedBodyLengthFt : null;

  if (!row) {
    return {
      confidence: "unavailable", source: "Exact OEM configuration data required", wheelbaseIn,
      cabToAxleIn: null, cabToEndFrameIn: null, backOfCabIn: null,
      chassisOverallLengthIn: null, chassisOverallWidthIn: null, chassisOverallHeightIn: null,
      bodyMinFt: null, bodyMaxFt: null, requestedBodyLengthFt: requested,
      completedOverallLengthIn: null, bodyLengthFit: "not-checked"
    };
  }

  const frontToBackOfCab = row.overallLengthIn - row.cabToEndFrameIn;
  const completedOverallLengthIn = requested === null ? null : frontToBackOfCab + row.backOfCabIn + requested * 12;
  const fits = requested === null ? "not-checked" : requested >= row.bodyMinFt && requested <= row.bodyMaxFt ? "fits-oem-envelope" : "outside-oem-envelope";

  return {
    confidence: "oem",
    source: modelId === "nrr-ev" ? "Isuzu 2026 NRR EV specifications" : GAS_MODELS.has(modelId) ? "Isuzu 2026 N-Series Gas specifications" : "Isuzu 2026 N-Series Diesel specifications",
    wheelbaseIn: row.wheelbaseIn,
    cabToAxleIn: row.cabToAxleIn,
    cabToEndFrameIn: row.cabToEndFrameIn,
    backOfCabIn: row.backOfCabIn,
    chassisOverallLengthIn: row.overallLengthIn,
    chassisOverallWidthIn: 81.3,
    chassisOverallHeightIn: row.overallHeightIn,
    bodyMinFt: row.bodyMinFt,
    bodyMaxFt: row.bodyMaxFt,
    requestedBodyLengthFt: requested,
    completedOverallLengthIn,
    bodyLengthFit: fits
  };
}

export function formatInches(value: number | null) {
  if (value === null) return "Pending";
  return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)} in`;
}

export function formatFeetAndInches(value: number | null) {
  if (value === null) return "Pending";
  const rounded = Math.round(value);
  const feet = Math.floor(rounded / 12);
  const inches = rounded % 12;
  return `${feet} ft ${inches} in`;
}
