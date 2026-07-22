export type AssetStatus = "exact" | "reference" | "missing";
export type AssetKind = "exterior" | "interior" | "body" | "complete";
export type CompatibilityStatus = "verified" | "review" | "incompatible" | "not-applicable";
export type BodySizingMode = "locked" | "uniform-reference" | "stretch-zones-verified";

export type ModelAssetRecord = {
  id: string;
  brandId: string;
  brandName: string;
  modelId: string;
  modelName: string;
  kind: AssetKind;
  variant: string;
  status: AssetStatus;
  compatibility: CompatibilityStatus;
  file: string;
  /** Comma-separated, exact GLB material names that may receive the selected cab paint. */
  paintMaterials?: string;
  nominalLengthFt?: number;
  bodySizingMode?: BodySizingMode;
  note: string;
};

export type MeasuredDimensions = {
  lengthIn: number | null;
  widthIn: number | null;
  heightIn: number | null;
};

export type RealScaleConfig = {
  enabled: boolean;
  verified: boolean;
  source: string;
  targetAssetId: string;
  targetBodyAssetId: string;
  chassis: MeasuredDimensions;
  body: MeasuredDimensions;
};

export type AttachmentAxis = "x" | "y" | "z";

export type AttachmentPointConfig = {
  enabled: boolean;
  verified: boolean;
  baseWheelbaseIn: number | null;
  axis: AttachmentAxis;
  direction: 1 | -1;
  frontAxle: [number, number, number];
  rearAxle: [number, number, number];
  bodyMount: [number, number, number];
  rearAxleNodeNames: string;
  frameStretchNodeNames: string;
  bodyFollowRatio: number;
};

export type InteriorCameraConfig = {
  eyePosition: [number, number, number];
  yawDeg: number;
  pitchDeg: number;
  modelPosition: [number, number, number];
  modelRotation: [number, number, number];
  modelScale: number;
  verified: boolean;
};

export type AccessorySlotConfig = {
  id: string;
  label: string;
  position: [number, number, number];
  rotation: [number, number, number];
  compatibleAccessories: string[];
  wheelbaseFollowRatio: number;
  verified: boolean;
};

export type AccessoryPlacement = {
  accessory: string;
  slotId: string;
};

export type AssemblyMountRecord = {
  id: string;
  chassisAssetId: string;
  bodyAssetId: string;
  bodyVariantId: string;
  mount: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  };
};

export const DEFAULT_REAL_SCALE: RealScaleConfig = {
  enabled: false,
  verified: false,
  source: "",
  targetAssetId: "",
  targetBodyAssetId: "",
  chassis: { lengthIn: null, widthIn: null, heightIn: null },
  body: { lengthIn: null, widthIn: null, heightIn: null }
};

export const DEFAULT_ATTACHMENT_POINTS: AttachmentPointConfig = {
  enabled: false,
  verified: false,
  baseWheelbaseIn: 176,
  axis: "z",
  direction: -1,
  frontAxle: [0, 0, 0.32],
  rearAxle: [0, 0, -0.32],
  bodyMount: [0, 0.1, -0.17],
  rearAxleNodeNames: "",
  frameStretchNodeNames: "",
  bodyFollowRatio: 0.5
};

export const DEFAULT_INTERIOR_CAMERA: InteriorCameraConfig = {
  eyePosition: [-0.18, 0.33, 0.12],
  yawDeg: 0,
  pitchDeg: -4,
  modelPosition: [0, 0, 0],
  modelRotation: [0, 0, 0],
  modelScale: 1,
  verified: false
};

export const DEFAULT_ACCESSORY_SLOTS: AccessorySlotConfig[] = [
  { id: "frame-left", label: "Left frame rail", position: [-0.48, 0.12, -0.15], rotation: [0, 0, 0], compatibleAccessories: ["Tool storage", "Underbody toolboxes", "Topside toolboxes", "Refrigeration battery pack"], wheelbaseFollowRatio: 0.45, verified: false },
  { id: "frame-right", label: "Right frame rail", position: [0.48, 0.12, -0.15], rotation: [0, 0, 0], compatibleAccessories: ["Tool storage", "Underbody toolboxes", "Topside toolboxes", "Refrigeration battery pack"], wheelbaseFollowRatio: 0.45, verified: false },
  { id: "cab-roof", label: "Cab roof", position: [0, 0.48, 0.34], rotation: [0, 0, 0], compatibleAccessories: ["LED work lights", "Work lights", "Scene lighting", "Amber beacon package", "Beacon lights", "Emergency light bar", "Roof fairing", "Full-height roof fairing"], wheelbaseFollowRatio: 0, verified: false },
  { id: "body-roof-front", label: "Body roof · front", position: [0, 0.58, -0.05], rotation: [0, 0, 0], compatibleAccessories: ["Reefer condenser", "Roof fairing", "LED work lights"], wheelbaseFollowRatio: .25, verified: false },
  { id: "body-left", label: "Body · streetside", position: [-0.55, .25, -.25], rotation: [0, 0, 0], compatibleAccessories: ["Side access door", "Ladder rack", "Custom wrap / logo", "Reflective striping"], wheelbaseFollowRatio: .55, verified: false },
  { id: "body-right", label: "Body · curbside", position: [.55, .25, -.25], rotation: [0, 0, 0], compatibleAccessories: ["Side access door", "Ladder rack", "Custom wrap / logo", "Reflective striping"], wheelbaseFollowRatio: .55, verified: false },
  { id: "body-top", label: "Body top / rack rail", position: [0, .62, -.28], rotation: [0, 0, 0], compatibleAccessories: ["Headache rack", "Ladder rack", "Removable stake racks", "Landscape mesh sides", "Dump tarp", "Safety equipment rack"], wheelbaseFollowRatio: .55, verified: false },
  { id: "body-rear", label: "Body rear", position: [0, 0.28, -0.58], rotation: [0, 0, 0], compatibleAccessories: ["LED work lights", "Work lights", "Lift gate", "Hydraulic tuckaway liftgate", "Rail-style liftgate", "Cantilever liftgate", "Walk ramp", "Roll-up rear door", "Double swing / barn doors", "Double-swing barn doors", "Dock / ICC bumper", "Dock bumper", "ICC underride guard", "Backup camera", "Reverse proximity sensors", "Rollback wheel lift", "Winch / cable", "Winch and cable", "Reflective striping"], wheelbaseFollowRatio: 1, verified: false },
  { id: "rear-frame", label: "Rear frame / hitch", position: [0, .08, -.64], rotation: [0, 0, 0], compatibleAccessories: ["Trailer hitch / receiver", "Salt / sand spreader"], wheelbaseFollowRatio: 1, verified: false },
  { id: "front-frame", label: "Front frame / bumper", position: [0, .12, .55], rotation: [0, 0, 0], compatibleAccessories: ["Snowplow", "Snow-plow prep"], wheelbaseFollowRatio: 0, verified: false },
  { id: "body-outrigger", label: "Body subframe / outriggers", position: [0, .08, -.15], rotation: [0, 0, 0], compatibleAccessories: ["Crane outriggers"], wheelbaseFollowRatio: .5, verified: false }
];

export function hasAttachmentGeometry(config: AttachmentPointConfig) {
  return Boolean(
    config.enabled &&
    config.verified &&
    config.baseWheelbaseIn &&
    config.baseWheelbaseIn > 0 &&
    config.rearAxleNodeNames.trim() &&
    config.frameStretchNodeNames.trim()
  );
}

export function hasCompleteMeasurements(config: RealScaleConfig) {
  return [config.chassis.lengthIn, config.chassis.widthIn, config.chassis.heightIn, config.body.lengthIn, config.body.widthIn, config.body.heightIn].every((value) => typeof value === "number" && value > 0);
}
