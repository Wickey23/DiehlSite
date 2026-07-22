"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei/core/Environment.js";
import { OrbitControls } from "@react-three/drei/core/OrbitControls.js";
import { RoundedBox } from "@react-three/drei/core/RoundedBox.js";
import * as THREE from "three";
import { AccessoryPlacement } from "./modelRegistry";

type PlaceholderProfile = "cabover" | "conventional" | "highway";
type ViewPreset = "front" | "rear" | "left" | "right" | "top" | "three-quarter";

const cameraPresets: Record<ViewPreset, [number, number, number]> = {
  front: [0, 1.35, 7.4],
  rear: [0, 1.35, -7.4],
  left: [-7.4, 1.35, 0],
  right: [7.4, 1.35, 0],
  top: [0, 8.2, 0.01],
  "three-quarter": [4.8, 2.7, 6.4]
};

function PlaceholderCamera({ preset, interior }: { preset: ViewPreset; interior: boolean }) {
  const { camera, controls } = useThree();
  useEffect(() => {
    if (interior) return;
    const target = new THREE.Vector3(0, .75, 0);
    camera.position.fromArray(cameraPresets[preset]);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    const orbit = controls as { target?: THREE.Vector3; update?: () => void } | null;
    orbit?.target?.copy(target);
    orbit?.update?.();
  }, [camera, controls, interior, preset]);
  return null;
}

function Wheel({ position }: { position: [number, number, number] }) {
  return <group position={position} rotation={[0, 0, Math.PI / 2]}>
    <mesh castShadow><cylinderGeometry args={[0.37, 0.37, 0.24, 28]}/><meshStandardMaterial color="#20272b" roughness={.82}/></mesh>
    <mesh position={[0, .125, 0]}><cylinderGeometry args={[0.18, 0.18, .025, 20]}/><meshStandardMaterial color="#aab4b9" metalness={.65} roughness={.3}/></mesh>
  </group>;
}

function GenericBody({ body, lengthScale }: { body: string; lengthScale: number }) {
  if (body === "Tractor") return <group position={[0, .57, -.95]}><mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.48, .48, .12, 28]}/><meshStandardMaterial color="#65737b" metalness={.5} roughness={.42}/></mesh></group>;
  if (body === "Rollback") return <group position={[0,.84,-1.12 - (lengthScale - 1) * 1.3]} rotation={[-.05,0,0]} scale={[1,1,lengthScale]}><RoundedBox args={[2.02,.16,2.9]} radius={.04}><meshStandardMaterial color="#7b8991" metalness={.42} roughness={.45}/></RoundedBox><mesh position={[0,.12,-1.25]}><boxGeometry args={[1.86,.18,.32]}/><meshStandardMaterial color="#65747c"/></mesh></group>;
  if (body === "Utility Body") return <group position={[0,.88,-1.1 - (lengthScale - 1) * 1.2]} scale={[1,1,lengthScale]}><RoundedBox args={[2.0,.65,2.65]} radius={.07}><meshStandardMaterial color="#aeb8bd" metalness={.12} roughness={.55}/></RoundedBox><mesh position={[0,.44,0]}><boxGeometry args={[.72,.28,2.35]}/><meshStandardMaterial color="#7c8a91" roughness={.58}/></mesh></group>;
  if (body === "Crane") return <group position={[0,.82,-1.12 - (lengthScale - 1) * 1.25]} scale={[1,1,lengthScale]}><RoundedBox args={[2.02,.36,2.72]} radius={.06}><meshStandardMaterial color="#88969d" metalness={.25} roughness={.48}/></RoundedBox><group position={[0,1.06,-.55]} rotation={[0,0,-.22]}><mesh><boxGeometry args={[.28,1.8,.32]}/><meshStandardMaterial color="#596970" metalness={.35} roughness={.38}/></mesh><mesh position={[0,.78,.58]} rotation={[Math.PI/2,0,0]}><boxGeometry args={[.22,.25,1.3]}/><meshStandardMaterial color="#596970" metalness={.35} roughness={.38}/></mesh></group></group>;
  if (body.includes("Flatbed") || body.includes("Stake")) return <group position={[0, .77, -1.15 - (lengthScale - 1) * 1.25]} scale={[1,1,lengthScale]}><RoundedBox args={[2.05, .16, 2.75]} radius={.04}><meshStandardMaterial color="#819099" metalness={.3} roughness={.55}/></RoundedBox>{body.includes("Stake") && <><mesh position={[-.92,.55,0]}><boxGeometry args={[.08,.95,2.65]}/><meshStandardMaterial color="#71818a"/></mesh><mesh position={[.92,.55,0]}><boxGeometry args={[.08,.95,2.65]}/><meshStandardMaterial color="#71818a"/></mesh></>}</group>;
  if (body.includes("Vacuum") || body.includes("Tank")) return <group position={[0,1.34,-1.13]} rotation={[0,0,Math.PI/2]}><mesh castShadow><cylinderGeometry args={[.78,.78,2.55,32]}/><meshStandardMaterial color="#aeb8bc" metalness={.38} roughness={.38}/></mesh></group>;
  const dump = body.includes("Dump");
  const refuse = body.includes("Refuse");
  const mixer = body.includes("Mixer");
  if (mixer) return <group position={[0,1.35,-1.05]} rotation={[Math.PI/2,0,0]}><mesh castShadow rotation={[0,0,-.18]}><cylinderGeometry args={[.54,.82,2.15,28]}/><meshStandardMaterial color="#aab5ba" metalness={.25} roughness={.48}/></mesh></group>;
  return <RoundedBox position={[0,1.55,-1.12 - (lengthScale - 1) * 1.25]} scale={[1,1,lengthScale]} args={[1.85, dump ? 1.35 : refuse ? 1.65 : 1.85, 2.65]} radius={dump ? .08 : .12} castShadow>
    <meshStandardMaterial color={dump ? "#8d9aa1" : "#b6c0c4"} metalness={.16} roughness={.58}/>
  </RoundedBox>;
}

function PlaceholderAccessory({ placement, rearAxleZ, bodyFollowZ, cabOver }: { placement: AccessoryPlacement; rearAxleZ: number; bodyFollowZ: number; cabOver: boolean }) {
  const positions: Record<string, [number, number, number]> = {
    "frame-left": [-1.05, .68, -.15 + bodyFollowZ],
    "frame-right": [1.05, .68, -.15 + bodyFollowZ],
    "cab-roof": [0, 2.55, cabOver ? 1.62 : 1.05],
    "body-roof-front": [0, 2.58, .05 + bodyFollowZ],
    "body-left": [-1.02, 1.45, -.8 + bodyFollowZ],
    "body-right": [1.02, 1.45, -.8 + bodyFollowZ],
    "body-top": [0, 2.65, -1 + bodyFollowZ],
    "body-rear": [0, 1.12, rearAxleZ - .75],
    "rear-frame": [0, .55, rearAxleZ - .82],
    "front-frame": [0, .7, cabOver ? 2.35 : 2.55],
    "body-outrigger": [0, .55, -.5 + bodyFollowZ]
  };
  const position = positions[placement.slotId];
  if (!position) return null;
  const material = <meshStandardMaterial color="#d99a19" emissive="#6b4300" emissiveIntensity={.15} transparent opacity={.82}/>;
  if (placement.accessory === "Tool storage") return <mesh position={position}><boxGeometry args={[.42,.28,.5]}/>{material}</mesh>;
  if (placement.accessory === "Lift gate") return <mesh position={position}><boxGeometry args={[1.55,.72,.1]}/>{material}</mesh>;
  if (placement.accessory === "Amber beacon package") return <mesh position={position}><cylinderGeometry args={[.11,.14,.18,18]}/>{material}</mesh>;
  return <mesh position={position}><boxGeometry args={[.4,.12,.1]}/>{material}</mesh>;
}

function ExteriorPlaceholder({ profile, body, bodyLengthFt, wheelbaseIn, accessoryPlacements, paintColor }: { profile: PlaceholderProfile; body: string; bodyLengthFt?: number; wheelbaseIn?: number; accessoryPlacements?: AccessoryPlacement[]; paintColor: string }) {
  const cabOver = profile === "cabover";
  const highway = profile === "highway";
  const lengthScale = THREE.MathUtils.clamp((bodyLengthFt || 16) / 16, .68, 1.55);
  const frontAxleZ = cabOver ? 1.42 : 1.7;
  const baseRearAxleZ = -1.65 - (lengthScale - 1) * 2.2;
  const baseAxleDistance = frontAxleZ - baseRearAxleZ;
  const wheelbaseRatio = THREE.MathUtils.clamp((wheelbaseIn || 176) / 176, .62, 1.72);
  const rearAxleZ = frontAxleZ - baseAxleDistance * wheelbaseRatio;
  const frameLength = frontAxleZ - rearAxleZ + 1.45;
  const frameCenterZ = (frontAxleZ + rearAxleZ) / 2 - .12;
  const bodyFollowZ = (rearAxleZ - baseRearAxleZ) * .52;
  return <group position={[0,-.48,0]}>
    <mesh position={[0,.57,frameCenterZ]} castShadow><boxGeometry args={[1.05,.18,frameLength]}/><meshStandardMaterial color="#4f5e66" metalness={.45} roughness={.4}/></mesh>
    <group position={[0,0,bodyFollowZ]}><GenericBody body={body} lengthScale={lengthScale}/></group>
    {cabOver ? <RoundedBox position={[0,1.45,1.65]} args={[1.75,1.95,1.2]} radius={.18} castShadow><meshStandardMaterial color={paintColor} metalness={.08} roughness={.52}/></RoundedBox> : <>
      <RoundedBox position={[0,1.5,.95]} args={[1.7,1.85,1.35]} radius={.18} castShadow><meshStandardMaterial color={paintColor} metalness={.08} roughness={.52}/></RoundedBox>
      <RoundedBox position={[0,1.04,2.02]} args={[1.55,.72,1.2]} radius={.22} castShadow><meshStandardMaterial color={paintColor} metalness={.1} roughness={.5}/></RoundedBox>
      {highway && <RoundedBox position={[0,1.6,-.02]} args={[1.72,2.05,.75]} radius={.17}><meshStandardMaterial color={paintColor} roughness={.5}/></RoundedBox>}
    </>}
    <mesh position={[0,1.72,cabOver ? 2.26 : 1.64]} rotation={[cabOver ? 0 : -.2,0,0]}><boxGeometry args={[1.42,.56,.025]}/><meshStandardMaterial color="#496573" metalness={.15} roughness={.25}/></mesh>
    <Wheel position={[-.91,.46,frontAxleZ]}/><Wheel position={[.91,.46,frontAxleZ]}/>
    <Wheel position={[-.91,.46,rearAxleZ]}/><Wheel position={[.91,.46,rearAxleZ]}/>
    {(accessoryPlacements || []).map((placement) => <PlaceholderAccessory key={`${placement.accessory}-${placement.slotId}`} placement={placement} rearAxleZ={rearAxleZ} bodyFollowZ={bodyFollowZ} cabOver={cabOver}/>)}
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,.08,0]} receiveShadow><planeGeometry args={[10,10]}/><shadowMaterial transparent opacity={.16}/></mesh>
  </group>;
}

function InteriorPlaceholder() {
  return <group position={[0,-.45,-.4]}>
    <RoundedBox position={[0,.75,-.9]} args={[2.4,.7,.72]} radius={.12}><meshStandardMaterial color="#4d5b63" roughness={.65}/></RoundedBox>
    <RoundedBox position={[-.67,.62,.35]} args={[.72,1.2,.72]} radius={.16}><meshStandardMaterial color="#78858b" roughness={.78}/></RoundedBox>
    <RoundedBox position={[.67,.62,.35]} args={[.72,1.2,.72]} radius={.16}><meshStandardMaterial color="#78858b" roughness={.78}/></RoundedBox>
    <mesh position={[-.68,.92,-.47]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.33,.055,12,32]}/><meshStandardMaterial color="#222b30" roughness={.72}/></mesh>
    <mesh position={[0,1.68,-1.25]} rotation={[-.2,0,0]}><boxGeometry args={[2.35,.85,.06]}/><meshStandardMaterial color="#69808c" transparent opacity={.42}/></mesh>
  </group>;
}

export default function PlaceholderTruckViewer({ brandId, body = "Cab & Chassis", bodyLengthFt, wheelbaseIn, accessoryPlacements, color = "#d6dcde", interior = false, compact = false, thumbnail = false }: { brandId: string; body?: string; bodyLengthFt?: number; wheelbaseIn?: number; accessoryPlacements?: AccessoryPlacement[]; color?: string; interior?: boolean; compact?: boolean; thumbnail?: boolean }) {
  const profile: PlaceholderProfile = brandId === "isuzu" ? "cabover" : body === "Tractor" ? "highway" : "conventional";
  const rootRef = useRef<HTMLDivElement>(null);
  const [preset, setPreset] = useState<ViewPreset>("three-quarter");
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const handleView = (event: Event) => {
      const requested = (event as CustomEvent<{ preset?: ViewPreset }>).detail?.preset;
      if (requested && requested in cameraPresets) setPreset(requested);
    };
    root.addEventListener("dtw-print-view", handleView);
    return () => root.removeEventListener("dtw-print-view", handleView);
  }, []);
  return <div className="placeholder-truck-viewer" ref={rootRef}>
    <Canvas shadows dpr={thumbnail ? 1 : [1,1.45]} camera={{ position: interior ? [0,1.1,3.1] : [4.6,2.8,6.4], fov: interior ? 48 : 31 }} gl={{ antialias:true, toneMapping:THREE.ACESFilmicToneMapping }}>
      <ambientLight intensity={1.6}/><directionalLight position={[4,7,5]} intensity={3.2} castShadow/>
      {interior ? <InteriorPlaceholder/> : <ExteriorPlaceholder profile={profile} body={body} bodyLengthFt={bodyLengthFt} wheelbaseIn={wheelbaseIn} accessoryPlacements={accessoryPlacements} paintColor={color}/>}
      {!thumbnail && <PlaceholderCamera preset={preset} interior={interior}/>}
      {!thumbnail && <Environment preset="warehouse" environmentIntensity={.6}/>}
      {!thumbnail && <OrbitControls makeDefault autoRotate={!interior} autoRotateSpeed={1.25} enablePan={false} enableDamping dampingFactor={.075} rotateSpeed={.65} zoomSpeed={.8} minDistance={interior ? 1.5 : 4.4} maxDistance={interior ? 5 : 10} target={interior ? [0,.75,-.5] : [0,.75,0]}/>}
    </Canvas>
    {!compact && !thumbnail && <div className="placeholder-watermark"><b>CONCEPT PLACEHOLDER</b><span>Generic geometry · not the actual truck</span></div>}
  </div>;
}
