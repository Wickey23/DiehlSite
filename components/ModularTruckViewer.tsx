"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei/core/Environment.js";
import { Line } from "@react-three/drei/core/Line.js";
import { OrbitControls } from "@react-three/drei/core/OrbitControls.js";
import { useGLTF } from "@react-three/drei/core/Gltf.js";
import { Html } from "@react-three/drei/web/Html.js";
import * as THREE from "three";
import { AccessoryPlacement, AccessorySlotConfig, AssetStatus, AttachmentPointConfig, BodySizingMode, hasAttachmentGeometry, hasCompleteMeasurements, RealScaleConfig } from "./modelRegistry";

export type TruckMountConfig = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
};

export const DEFAULT_ISUZU_BODY_MOUNT: TruckMountConfig = {
  position: [0, 0.1, -0.17] as [number, number, number],
  rotation: [0, 0, 0] as [number, number, number],
  scale: [0.88, 0.72, 0.68] as [number, number, number]
};

type ViewPreset = "front" | "left" | "right" | "rear" | "top" | "three-quarter";

export type TruckMeasurementLabels = {
  overall: string;
  wheelbase: string;
  bodyLength: string;
  width: string;
  height: string;
  verified: boolean;
};

function CameraPreset({ preset, measured }: { preset: ViewPreset; measured: boolean }) {
  const { camera, controls } = useThree();
  useEffect(() => {
    const positions: Record<ViewPreset, [number, number, number]> = measured ? {
      front: [0, 3.2, 12], left: [-12, 3.2, 0], right: [12, 3.2, 0], rear: [0, 3.2, -12], top: [0, 14, -0.19], "three-quarter": [8, 4.8, 9]
    } : {
      front: [0, 0.45, 1.65], left: [-1.65, 0.45, 0], right: [1.65, 0.45, 0], rear: [0, 0.45, -1.65], top: [0, 2.15, -0.025], "three-quarter": [1.25, 0.72, 1.45]
    };
    const target: [number, number, number] = measured ? [0, 1.5, -0.2] : [0, 0.18, -0.03];
    camera.position.set(...positions[preset]);
    camera.lookAt(...target);
    const orbit = controls as { target?: THREE.Vector3; update?: () => void } | null;
    orbit?.target?.set(...target);
    orbit?.update?.();
  }, [camera, controls, measured, preset]);
  return null;
}

const CHASSIS_BOUNDS = { width: 0.4493865967, height: 0.3794555962, length: 0.9834899902 };
const BODY_BOUNDS = { width: 0.5142211914, height: 0.5348205566, length: 0.9783935547 };
const INCH_TO_METER = 0.0254;

const ISUZU_NRR_EV_CAB_PAINT_BOUNDS = {
  min: new THREE.Vector3(-0.235, 0.105, 0.14),
  max: new THREE.Vector3(0.235, 0.395, 0.505)
};

function addCabPaintMask(material: THREE.Material, color: string) {
  const paint = new THREE.Color(color);
  const copy = material as THREE.Material & { color?: THREE.Color };
  // The source GLB has one material for the whole truck. Keep that material
  // white so the original wheels, glass and chassis texture is not multiplied
  // by the selected paint color. The shader below tints only cab-region pixels.
  copy.color?.set(0xffffff);
  copy.onBeforeCompile = (shader) => {
    shader.uniforms.dtwCabPaint = { value: paint };
    shader.uniforms.dtwCabMin = { value: ISUZU_NRR_EV_CAB_PAINT_BOUNDS.min };
    shader.uniforms.dtwCabMax = { value: ISUZU_NRR_EV_CAB_PAINT_BOUNDS.max };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vDtwCabPosition;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvDtwCabPosition = position;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform vec3 dtwCabPaint;\nuniform vec3 dtwCabMin;\nuniform vec3 dtwCabMax;\nvarying vec3 vDtwCabPosition;"
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        float dtwInsideCab =
          step(dtwCabMin.x, vDtwCabPosition.x) * step(vDtwCabPosition.x, dtwCabMax.x) *
          step(dtwCabMin.y, vDtwCabPosition.y) * step(vDtwCabPosition.y, dtwCabMax.y) *
          step(dtwCabMin.z, vDtwCabPosition.z) * step(vDtwCabPosition.z, dtwCabMax.z);
        float dtwHigh = max(max(diffuseColor.r, diffuseColor.g), diffuseColor.b);
        float dtwLow = min(min(diffuseColor.r, diffuseColor.g), diffuseColor.b);
        float dtwNeutral = 1.0 - smoothstep(0.10, 0.32, dtwHigh - dtwLow);
        float dtwPaintedPixel = dtwInsideCab * dtwNeutral * smoothstep(0.42, 0.78, dtwHigh);
        float dtwTextureShade = clamp(dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722)), 0.0, 1.0);
        vec3 dtwTintedPaint = dtwCabPaint * mix(0.52, 1.08, dtwTextureShade);
        diffuseColor.rgb = mix(diffuseColor.rgb, dtwTintedPaint, dtwPaintedPixel);`
      );
  };
  copy.customProgramCacheKey = () => `dtw-isuzu-cab-mask-${color}`;
  copy.needsUpdate = true;
}

function cloneWithPaint(scene: THREE.Group, color?: string, paintMaterials?: string, cabPaintMask = false) {
  const cloned = scene.clone(true);
  const names = new Set((paintMaterials || "").split(",").map((name) => name.trim()).filter(Boolean));
  cloned.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const recolor = (material: THREE.Material) => {
      const copy = material.clone() as THREE.Material & { color?: THREE.Color };
      if (color && names.has(material.name)) {
        if (cabPaintMask) addCabPaintMask(copy, color);
        else copy.color?.set(color);
      }
      return copy;
    };
    object.material = Array.isArray(object.material) ? object.material.map(recolor) : recolor(object.material);
  });
  return cloned;
}

function isBareBody(body: string) {
  const value = body.toLowerCase();
  return value === "cab & chassis" || value === "bare cab and chassis" || value.includes("straight-truck chassis");
}

function ConceptBody({ body, position, rotation, size, color = "#d9dee1" }: { body: string; position: [number, number, number]; rotation: [number, number, number]; size: [number, number, number]; color?: string }) {
  if (isBareBody(body)) return null;
  const value = body.toLowerCase();
  const [width, height, length] = size;
  const shell = <meshStandardMaterial color={color} metalness={0.16} roughness={0.55} transparent opacity={0.9}/>;
  const dark = <meshStandardMaterial color="#66757d" metalness={0.32} roughness={0.46} transparent opacity={0.92}/>;
  const accent = <meshStandardMaterial color="#d99a19" metalness={0.16} roughness={0.48} transparent opacity={0.86}/>;
  const deckHeight = Math.max(height * 0.1, 0.035);

  if (value.includes("tractor") || value.includes("fifth wheel") || value.includes("trailer-connector")) {
    return <group position={position} rotation={rotation}>
      <mesh position={[0, deckHeight * 1.25, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[Math.min(width, length) * 0.32, Math.min(width, length) * 0.32, deckHeight, 28]}/>{dark}</mesh>
      <mesh position={[0, deckHeight * 0.9, -length * 0.2]} castShadow><boxGeometry args={[width * 0.7, deckHeight, length * 0.42]}/>{dark}</mesh>
    </group>;
  }

  if (value.includes("rollback") || value.includes("car carrier") || value.includes("transporter") || value.includes("equipment hauler") || value.includes("transport deck")) {
    return <group position={position} rotation={rotation}>
      <mesh position={[0, deckHeight * 1.1, 0]} rotation={[-0.035, 0, 0]} castShadow><boxGeometry args={[width, deckHeight, length]}/>{dark}</mesh>
      <mesh position={[0, deckHeight * 2.1, -length * 0.43]} castShadow><boxGeometry args={[width * 0.78, deckHeight * 1.4, length * 0.12]}/>{accent}</mesh>
    </group>;
  }

  if (value.includes("flatbed") || value.includes("platform") || value.includes("stake") || value.includes("landscape rack") || value.includes("drop-side") || value.includes("dovetail") || value.includes("beavertail") || value.includes("lumber") || value.includes("pipe transport")) {
    const stake = value.includes("stake") || value.includes("rack") || value.includes("landscape");
    return <group position={position} rotation={rotation}>
      <mesh position={[0, deckHeight * 1.15, 0]} castShadow><boxGeometry args={[width, deckHeight, length]}/>{dark}</mesh>
      {stake && <>
        <mesh position={[-width * 0.47, height * 0.38, 0]} castShadow><boxGeometry args={[deckHeight, height * 0.72, length * 0.96]}/>{shell}</mesh>
        <mesh position={[width * 0.47, height * 0.38, 0]} castShadow><boxGeometry args={[deckHeight, height * 0.72, length * 0.96]}/>{shell}</mesh>
      </>}
    </group>;
  }

  if (value.includes("tank") || value.includes("vacuum") || value.includes("propane") || value.includes("fuel-delivery") || value.includes("water-hauling") || value.includes("sprayer") || value.includes("septic")) {
    const radius = Math.min(width * 0.46, height * 0.46);
    return <group position={position} rotation={rotation}>
      <mesh position={[0, radius + deckHeight, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[radius, radius, length * 0.9, 30]}/>{shell}</mesh>
      <mesh position={[0, deckHeight * 0.8, 0]} castShadow><boxGeometry args={[width * 0.72, deckHeight, length]}/>{dark}</mesh>
    </group>;
  }

  if (value.includes("mixer") || value.includes("concrete pump")) {
    const radius = Math.min(width * 0.42, height * 0.42);
    return <group position={position} rotation={rotation}>
      <mesh position={[0, radius + deckHeight, 0]} rotation={[Math.PI / 2, 0, -0.16]} castShadow><cylinderGeometry args={[radius * 0.72, radius, length * 0.72, 28]}/>{shell}</mesh>
      <mesh position={[0, deckHeight, 0]} castShadow><boxGeometry args={[width * 0.72, deckHeight, length]}/>{dark}</mesh>
    </group>;
  }

  if (value.includes("crane") || value.includes("aerial") || value.includes("bucket") || value.includes("tree-trimming") || value.includes("sign-service")) {
    return <group position={position} rotation={rotation}>
      <mesh position={[0, height * 0.22, 0]} castShadow><boxGeometry args={[width, height * 0.42, length]}/>{shell}</mesh>
      <group position={[0, height * 0.75, -length * 0.12]} rotation={[0, 0, -0.18]}>
        <mesh castShadow><boxGeometry args={[width * 0.12, height * 1.15, width * 0.14]}/>{accent}</mesh>
        <mesh position={[0, height * 0.5, length * 0.18]} rotation={[Math.PI / 2, 0, 0]} castShadow><boxGeometry args={[width * 0.1, width * 0.12, length * 0.55]}/>{accent}</mesh>
      </group>
    </group>;
  }

  if (value.includes("hooklift") || value.includes("roll-off") || value.includes("container carrier") || value.includes("swap-body")) {
    return <group position={position} rotation={rotation}>
      <mesh position={[0, deckHeight, 0]} castShadow><boxGeometry args={[width * 0.78, deckHeight, length]}/>{dark}</mesh>
      <mesh position={[0, height * 0.35, -length * 0.05]} castShadow><boxGeometry args={[width * 0.9, height * 0.58, length * 0.78]}/>{shell}</mesh>
      <mesh position={[0, height * 0.72, length * 0.34]} rotation={[0.38, 0, 0]} castShadow><boxGeometry args={[width * 0.1, height * 0.85, width * 0.1]}/>{accent}</mesh>
    </group>;
  }

  const dump = value.includes("dump") || value.includes("grain") || value.includes("asphalt hot box") || value.includes("debris") || value.includes("brush-collection");
  const utility = value.includes("utility") || value.includes("service body") || value.includes("mechanics") || value.includes("workshop") || value.includes("welding") || value.includes("electrician") || value.includes("plumbing") || value.includes("hvac") || value.includes("line-service") || value.includes("tire-service");
  const refuse = value.includes("refuse") || value.includes("garbage") || value.includes("recycling") || value.includes("waste") || value.includes("compactor");
  const passenger = value.includes("bus") || value.includes("paratransit") || value.includes("crew-transport") || value.includes("ambulance") || value.includes("medical") || value.includes("command") || value.includes("communications");
  const mobileBusiness = value.includes("food truck") || value.includes("mobile kitchen") || value.includes("mobile retail") || value.includes("mobile office") || value.includes("mobile bank") || value.includes("mobile laboratory") || value.includes("mobile classroom") || value.includes("mobile pet") || value.includes("billboard") || value.includes("led-display");
  const boxHeight = dump ? height * 0.72 : utility ? height * 0.62 : refuse ? height * 0.94 : height;

  return <group position={position} rotation={rotation}>
    <mesh position={[0, boxHeight / 2, 0]} castShadow><boxGeometry args={[width, boxHeight, length]}/>{dump ? dark : shell}</mesh>
    {utility && <mesh position={[0, boxHeight * 0.72, 0]} castShadow><boxGeometry args={[width * 0.42, boxHeight * 0.34, length * 0.88]}/>{dark}</mesh>}
    {(passenger || mobileBusiness) && <mesh position={[width * 0.501, boxHeight * 0.58, 0]} castShadow><boxGeometry args={[deckHeight * 0.45, boxHeight * 0.25, length * 0.72]}/><meshStandardMaterial color="#496573" metalness={0.12} roughness={0.28} transparent opacity={0.78}/></mesh>}
    {refuse && <mesh position={[0, boxHeight * 0.75, -length * 0.43]} castShadow><boxGeometry args={[width * 0.86, boxHeight * 0.38, length * 0.12]}/>{accent}</mesh>}
  </group>;
}

function AccessoryMarker({ accessory, position, rotation }: { accessory: string; position: [number, number, number]; rotation: [number, number, number] }) {
  const material = <meshStandardMaterial color="#d99a19" emissive="#6b4300" emissiveIntensity={0.18} metalness={0.25} roughness={0.42} transparent opacity={0.78}/>;
  if (accessory === "Tool storage") return <mesh position={position} rotation={rotation} castShadow><boxGeometry args={[0.3, 0.18, 0.3]}/>{material}</mesh>;
  if (accessory === "Amber beacon package") return <mesh position={position} rotation={rotation} castShadow><cylinderGeometry args={[0.07, 0.09, 0.11, 18]}/>{material}</mesh>;
  if (accessory === "Lift gate") return <mesh position={position} rotation={rotation} castShadow><boxGeometry args={[0.56, 0.36, 0.05]}/>{material}</mesh>;
  if (accessory === "LED work lights") return <group position={position} rotation={rotation}><mesh position={[-0.13, 0, 0]}><boxGeometry args={[0.11, 0.07, 0.05]}/>{material}</mesh><mesh position={[0.13, 0, 0]}><boxGeometry args={[0.11, 0.07, 0.05]}/>{material}</mesh></group>;
  return <mesh position={position} rotation={rotation}><sphereGeometry args={[0.08, 18, 12]}/>{material}</mesh>;
}

function TruckAssembly({ body, showBody, showConceptBody, mount, dimensions, assetId, bodyAssetId, attachments, wheelbaseIn, bodyLengthFt, nominalBodyLengthFt, bodySizingMode, accessorySlots, accessoryPlacements, chassisSrc, bodySrc, color, paintMaterials, bodyColor, bodyPaintMaterials, onGeometryStatus }: { body: string; showBody: boolean; showConceptBody: boolean; mount: TruckMountConfig; dimensions?: RealScaleConfig; assetId: string; bodyAssetId: string; attachments?: AttachmentPointConfig; wheelbaseIn?: number; bodyLengthFt?: number; nominalBodyLengthFt?: number; bodySizingMode?: BodySizingMode; accessorySlots?: AccessorySlotConfig[]; accessoryPlacements?: AccessoryPlacement[]; chassisSrc: string; bodySrc: string; color?: string; paintMaterials?: string; bodyColor?: string; bodyPaintMaterials?: string; onGeometryStatus: (active: boolean) => void }) {
  const chassisFile = useGLTF(chassisSrc);
  const bodyFile = useGLTF(bodySrc);
  const measured = Boolean(dimensions?.enabled && dimensions.verified && dimensions.targetAssetId === assetId && dimensions.targetBodyAssetId === bodyAssetId && hasCompleteMeasurements(dimensions));
  const chassisScale = measured ? [
    dimensions!.chassis.widthIn! * INCH_TO_METER / CHASSIS_BOUNDS.width,
    dimensions!.chassis.heightIn! * INCH_TO_METER / CHASSIS_BOUNDS.height,
    dimensions!.chassis.lengthIn! * INCH_TO_METER / CHASSIS_BOUNDS.length
  ] as [number, number, number] : [1, 1, 1] as [number, number, number];
  const measuredBodyScale = measured ? [
    dimensions!.body.widthIn! * INCH_TO_METER / BODY_BOUNDS.width,
    dimensions!.body.heightIn! * INCH_TO_METER / BODY_BOUNDS.height,
    dimensions!.body.lengthIn! * INCH_TO_METER / BODY_BOUNDS.length
  ] : [1, 1, 1];
  const assetLengthRatio = bodySizingMode && bodySizingMode !== "locked" && bodyLengthFt && nominalBodyLengthFt ? bodyLengthFt / nominalBodyLengthFt : 1;
  const conceptLengthRatio = showConceptBody && bodyLengthFt ? bodyLengthFt / 16 : 1;
  const visualLengthRatio = showConceptBody ? conceptLengthRatio : assetLengthRatio;
  const baseBodyScale = (measured ? measuredBodyScale.map((value, index) => value * mount.scale[index]) : [...mount.scale]) as [number, number, number];
  const bodyScale = [...baseBodyScale] as [number, number, number];
  bodyScale[2] *= assetLengthRatio;
  const prepared = useMemo(() => {
    const scene = cloneWithPaint(chassisFile.scene, color, paintMaterials, assetId === "isuzu:nrr-ev:exterior");
    if (!attachments || !wheelbaseIn || !hasAttachmentGeometry(attachments)) return { scene, active: false, deltaLocal: 0, axisIndex: 2 };
    const axisIndex = attachments.axis === "x" ? 0 : attachments.axis === "y" ? 1 : 2;
    const rearNames = new Set(attachments.rearAxleNodeNames.split(",").map((name) => name.trim()).filter(Boolean));
    const frameNames = new Set(attachments.frameStretchNodeNames.split(",").map((name) => name.trim()).filter(Boolean));
    const rearNodes: THREE.Object3D[] = [];
    const frameNodes: THREE.Object3D[] = [];
    scene.traverse((object) => {
      if (rearNames.has(object.name)) rearNodes.push(object);
      if (frameNames.has(object.name)) frameNodes.push(object);
    });
    const active = rearNodes.length > 0 && frameNodes.length > 0;
    if (!active) return { scene, active: false, deltaLocal: 0, axisIndex };
    const deltaIn = wheelbaseIn - attachments.baseWheelbaseIn!;
    const baseScale = chassisScale[axisIndex] || 1;
    const normalizedAxisLength = axisIndex === 0 ? CHASSIS_BOUNDS.width : axisIndex === 1 ? CHASSIS_BOUNDS.height : CHASSIS_BOUNDS.length;
    const deltaLocal = measured ? deltaIn * INCH_TO_METER / baseScale : deltaIn / attachments.baseWheelbaseIn! * normalizedAxisLength;
    const signedDelta = deltaLocal * attachments.direction;
    rearNodes.forEach((node) => { node.position.setComponent(axisIndex, node.position.getComponent(axisIndex) + signedDelta); });
    frameNodes.forEach((node) => {
      const nextWheelbase = attachments.baseWheelbaseIn! + deltaIn;
      node.scale.setComponent(axisIndex, node.scale.getComponent(axisIndex) * nextWheelbase / attachments.baseWheelbaseIn!);
      node.position.setComponent(axisIndex, node.position.getComponent(axisIndex) + signedDelta / 2);
    });
    return { scene, active: true, deltaLocal: signedDelta, axisIndex };
  }, [attachments, chassisFile.scene, chassisScale, color, measured, paintMaterials, wheelbaseIn]);
  const dryVanBody = useMemo(() => cloneWithPaint(bodyFile.scene, bodyColor, bodyPaintMaterials), [bodyColor, bodyFile.scene, bodyPaintMaterials]);
  useEffect(() => onGeometryStatus(prepared.active), [onGeometryStatus, prepared.active]);
  const anchorOffset = attachments ? attachments.bodyMount.map((value, index) => value - [0, 0.1, -0.17][index]) : [0, 0, 0];
  const bodyPosition = mount.position.map((value, index) => value + anchorOffset[index] + (prepared.active && index === prepared.axisIndex ? prepared.deltaLocal * (attachments?.bodyFollowRatio ?? 0.5) : 0)) as [number, number, number];
  if (visualLengthRatio !== 1) bodyPosition[2] -= BODY_BOUNDS.length * baseBodyScale[2] * (visualLengthRatio - 1) / 2;
  const conceptBodySize: [number, number, number] = [
    BODY_BOUNDS.width * baseBodyScale[0],
    BODY_BOUNDS.height * baseBodyScale[1],
    BODY_BOUNDS.length * baseBodyScale[2] * conceptLengthRatio
  ];

  return (
    <group position={[0, 0, 0]}>
      <primitive object={prepared.scene} scale={chassisScale}/>
      <group scale={chassisScale}>
        {(accessoryPlacements || []).map((placement) => {
          const slot = accessorySlots?.find((item) => item.id === placement.slotId);
          if (!slot || !slot.compatibleAccessories.includes(placement.accessory)) return null;
          const position = slot.position.map((value, index) => value + (prepared.active && index === prepared.axisIndex ? prepared.deltaLocal * slot.wheelbaseFollowRatio : 0)) as [number, number, number];
          return <AccessoryMarker key={`${placement.accessory}-${placement.slotId}`} accessory={placement.accessory} position={position} rotation={slot.rotation.map(THREE.MathUtils.degToRad) as [number, number, number]}/>;
        })}
      </group>
      {showBody && (
        <primitive
          object={dryVanBody}
          position={bodyPosition}
          rotation={mount.rotation}
          scale={bodyScale}
        />
      )}
      {showConceptBody && <ConceptBody body={body} position={bodyPosition} rotation={mount.rotation} size={conceptBodySize} color={bodyColor}/>}
    </group>
  );
}

function LoadingTruck() {
  return (
    <mesh position={[0, 0.18, 0]}>
      <boxGeometry args={[0.8, 0.28, 0.95]}/>
      <meshStandardMaterial color="#d9e0e4" roughness={0.8}/>
    </mesh>
  );
}

function DimensionLine({ start, end, label, value, className = "" }: { start: [number, number, number]; end: [number, number, number]; label: string; value: string; className?: string }) {
  const midpoint: [number, number, number] = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
    (start[2] + end[2]) / 2
  ];
  const direction = new THREE.Vector3(...end).sub(new THREE.Vector3(...start)).normalize();
  const tick = Math.max(new THREE.Vector3(...end).distanceTo(new THREE.Vector3(...start)) * 0.035, 0.018);
  const vertical = Math.abs(direction.y) > 0.7;
  const tickOffset: [number, number, number] = vertical ? [tick, 0, 0] : [0, tick, 0];

  return <group>
    <Line points={[start, end]} color="#e98a1d" lineWidth={1.8}/>
    <Line points={[[start[0] - tickOffset[0], start[1] - tickOffset[1], start[2] - tickOffset[2]], [start[0] + tickOffset[0], start[1] + tickOffset[1], start[2] + tickOffset[2]]]} color="#e98a1d" lineWidth={1.8}/>
    <Line points={[[end[0] - tickOffset[0], end[1] - tickOffset[1], end[2] - tickOffset[2]], [end[0] + tickOffset[0], end[1] + tickOffset[1], end[2] + tickOffset[2]]]} color="#e98a1d" lineWidth={1.8}/>
    <Html position={midpoint} center zIndexRange={[18, 10]} className={`scene-measure-anchor ${className}`}>
      <div className="scene-measure-label"><span>{label}</span><strong>{value}</strong></div>
    </Html>
  </group>;
}

function TruckMeasurements({ labels, measured, mount, bodyLengthFt, nominalBodyLengthFt }: { labels: TruckMeasurementLabels; measured: boolean; mount: TruckMountConfig; bodyLengthFt?: number; nominalBodyLengthFt?: number }) {
  const scale = measured ? {
    width: 2.6,
    height: 3.35,
    zMin: -4.05,
    zMax: 3.45
  } : {
    width: Math.max(CHASSIS_BOUNDS.width, BODY_BOUNDS.width * mount.scale[0]),
    height: Math.max(CHASSIS_BOUNDS.height, mount.position[1] + BODY_BOUNDS.height * mount.scale[1]),
    zMin: Math.min(-CHASSIS_BOUNDS.length / 2, mount.position[2] - BODY_BOUNDS.length * mount.scale[2] * ((bodyLengthFt || nominalBodyLengthFt || 16) / (nominalBodyLengthFt || 16)) / 2),
    zMax: Math.max(CHASSIS_BOUNDS.length / 2, mount.position[2] + BODY_BOUNDS.length * mount.scale[2] / 2)
  };
  const padding = measured ? 0.34 : 0.065;
  const xEdge = scale.width / 2;
  const lengthX = -xEdge - padding;
  const bodyStart = Math.max(scale.zMin, mount.position[2] - (scale.zMax - scale.zMin) * 0.38);
  const bodyEnd = Math.min(scale.zMax, mount.position[2] + (scale.zMax - scale.zMin) * 0.2);
  const wheelbaseLength = (scale.zMax - scale.zMin) * 0.55;
  const wheelbaseCenter = scale.zMin + (scale.zMax - scale.zMin) * 0.49;
  const cabWidthEdge = measured ? 2.6 / 2 : CHASSIS_BOUNDS.width / 2;
  const cabHeight = measured ? 3.35 : CHASSIS_BOUNDS.height;

  return <group renderOrder={10}>
    <DimensionLine className="overall" start={[lengthX, padding, scale.zMin]} end={[lengthX, padding, scale.zMax]} label="Overall length" value={labels.overall}/>
    <DimensionLine className="body" start={[xEdge + padding * 0.65, scale.height + padding, bodyStart]} end={[xEdge + padding * 0.65, scale.height + padding, bodyEnd]} label="Body length" value={labels.bodyLength}/>
    <DimensionLine className="wheelbase" start={[0, padding * 0.3, wheelbaseCenter - wheelbaseLength / 2]} end={[0, padding * 0.3, wheelbaseCenter + wheelbaseLength / 2]} label="Wheelbase" value={labels.wheelbase}/>
    <DimensionLine className="width" start={[-cabWidthEdge, padding * 0.55, scale.zMax + padding]} end={[cabWidthEdge, padding * 0.55, scale.zMax + padding]} label="Cab width" value={labels.width}/>
    <DimensionLine className="height" start={[cabWidthEdge + padding, 0, scale.zMax * .72]} end={[cabWidthEdge + padding, cabHeight, scale.zMax * .72]} label="Cab height" value={labels.height}/>
  </group>;
}

export default function ModularTruckViewer({ body, bodyAssetStatus = "reference", mount = DEFAULT_ISUZU_BODY_MOUNT, dimensions, measurementLabels, assetId = "isuzu:nrr-ev:exterior", bodyAssetId = "isuzu:shared-body:Standard dry box / van body", attachments, wheelbaseIn, bodyLengthFt, nominalBodyLengthFt, bodySizingMode, accessorySlots, accessoryPlacements, chassisSrc = "/models/isuzu-nrr-ev-cab-chassis.glb", bodySrc = "/models/isuzu-dry-van-body.glb", color, paintMaterials, bodyColor, bodyPaintMaterials, forceShowBody = false, admin = false, hero = false, showFullscreen = true }: { body: string; bodyAssetStatus?: AssetStatus; mount?: TruckMountConfig; dimensions?: RealScaleConfig; measurementLabels?: TruckMeasurementLabels; assetId?: string; bodyAssetId?: string; attachments?: AttachmentPointConfig; wheelbaseIn?: number; bodyLengthFt?: number; nominalBodyLengthFt?: number; bodySizingMode?: BodySizingMode; accessorySlots?: AccessorySlotConfig[]; accessoryPlacements?: AccessoryPlacement[]; chassisSrc?: string; bodySrc?: string; color?: string; paintMaterials?: string; bodyColor?: string; bodyPaintMaterials?: string; forceShowBody?: boolean; admin?: boolean; hero?: boolean; showFullscreen?: boolean }) {
  const showBody = forceShowBody || (!isBareBody(body) && bodyAssetStatus !== "missing");
  const showConceptBody = !showBody && !isBareBody(body) && bodyAssetStatus === "missing";
  const mountedBody = showBody || showConceptBody;
  const measured = Boolean(dimensions?.enabled && dimensions.verified && dimensions.targetAssetId === assetId && dimensions.targetBodyAssetId === bodyAssetId && hasCompleteMeasurements(dimensions));
  const [viewPreset, setViewPreset] = useState<ViewPreset>("three-quarter");
  const [fullscreen, setFullscreen] = useState(false);
  const [geometryActive, setGeometryActive] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const update = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const handlePrintView = (event: Event) => {
      const next = (event as CustomEvent<{ preset?: ViewPreset }>).detail?.preset;
      if (next) setViewPreset(next);
    };
    root.addEventListener("dtw-print-view", handlePrintView);
    return () => root.removeEventListener("dtw-print-view", handlePrintView);
  }, []);

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) return document.exitFullscreen();
    const target = admin ? rootRef.current?.closest(".alignment-layout") : rootRef.current;
    await (target as HTMLElement | null)?.requestFullscreen?.();
  };

  return (
    <div className="modular-truck-viewer" ref={rootRef}>
      <Canvas
        shadows
        dpr={[1, 1.65]}
        camera={{ position: measured ? [8, 4.8, 9] : [1.25, 0.72, 1.45], fov: 28, near: 0.01, far: 100 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, preserveDrawingBuffer: true }}
      >
        {!hero && <color attach="background" args={["#edf1f3"]}/>}
        <CameraPreset preset={viewPreset} measured={measured}/>
        <ambientLight intensity={1.5}/>
        <directionalLight position={[2.4, 4, 2.2]} intensity={3.2} castShadow shadow-mapSize={[1024, 1024]}/>
        <Suspense fallback={<LoadingTruck/>}>
          <TruckAssembly body={body} showBody={showBody} showConceptBody={showConceptBody} mount={mount} dimensions={dimensions} assetId={assetId} bodyAssetId={bodyAssetId} attachments={attachments} wheelbaseIn={wheelbaseIn} bodyLengthFt={bodyLengthFt} nominalBodyLengthFt={nominalBodyLengthFt} bodySizingMode={bodySizingMode} accessorySlots={accessorySlots} accessoryPlacements={accessoryPlacements} chassisSrc={chassisSrc} bodySrc={bodySrc} color={color} paintMaterials={paintMaterials} bodyColor={bodyColor} bodyPaintMaterials={bodyPaintMaterials} onGeometryStatus={setGeometryActive}/>
          {measurementLabels && <TruckMeasurements labels={measurementLabels} measured={measured} mount={mount} bodyLengthFt={bodyLengthFt} nominalBodyLengthFt={nominalBodyLengthFt}/>}
          <Environment preset="warehouse" environmentIntensity={0.75}/>
        </Suspense>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} receiveShadow>
          <planeGeometry args={[8, 8]}/>
          <shadowMaterial transparent opacity={0.18}/>
        </mesh>
        <OrbitControls
          makeDefault
          autoRotate={!admin}
          autoRotateSpeed={1.25}
          target={measured ? [0, 1.5, -0.2] : [0, 0.18, -0.03]}
          minDistance={measured ? 4 : 1.1}
          maxDistance={measured ? 24 : 4}
          minPolarAngle={0}
          maxPolarAngle={Math.PI * 0.49}
          enablePan={false}
          enableDamping
          dampingFactor={0.075}
          rotateSpeed={0.65}
          zoomSpeed={0.8}
        />
      </Canvas>
      {!hero && !admin && <div className="modular-view-controls"><button onClick={() => setViewPreset("front")}>Front</button><button onClick={() => setViewPreset("left")}>Left</button><button onClick={() => setViewPreset("right")}>Right</button><button onClick={() => setViewPreset("rear")}>Rear</button><button onClick={() => setViewPreset("top")}>Top</button><button onClick={() => setViewPreset("three-quarter")}>3/4</button></div>}
      {!hero && showFullscreen && <button className="viewer-fullscreen" onClick={toggleFullscreen} aria-label={fullscreen ? "Exit fullscreen" : "Open fullscreen"}>{fullscreen ? "↙ Exit fullscreen" : "⛶ Fullscreen"}</button>}
      {!hero && <div className={mountedBody ? showConceptBody ? "module-status mounted concept" : "module-status mounted" : "module-status"}>
        <span>{mountedBody ? showConceptBody ? "◇" : "✓" : "+"}</span>
        <div><strong>{admin ? "Live alignment preview" : showConceptBody ? `${bodyLengthFt || 16}′ ${body} concept mounted` : showBody ? `${bodyLengthFt || nominalBodyLengthFt || 16}′ ${body} mounted` : "Cab & chassis view"}</strong><small>{showConceptBody ? "Parametric envelope preview · length extends rearward without stretching the cab; exact body GLB and upfitter engineering still required" : bodySizingMode === "uniform-reference" && bodyLengthFt !== nominalBodyLengthFt ? "Length-scaled reference · exact size-specific GLB still required" : geometryActive ? `Wheelbase geometry active · ${wheelbaseIn} in` : attachments?.enabled ? "Wheelbase recorded · GLB node mapping is incomplete" : measured ? "Verified measurements applied in meters" : admin ? "Scale is unverified until measurements are entered" : showBody ? "Separate body GLB attached in real time" : "Select a modeled body to attach it"}</small></div>
      </div>}
    </div>
  );
}

useGLTF.preload("/models/isuzu-nrr-ev-cab-chassis.glb");
useGLTF.preload("/models/isuzu-dry-van-body.glb");
