"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei/core/Environment.js";
import { useGLTF } from "@react-three/drei/core/Gltf.js";
import * as THREE from "three";
import { InteriorCameraConfig } from "./modelRegistry";

type LookPreset = { yaw: number; pitch: number; revision: number };

function cloneForInterior(scene: THREE.Group) {
  const cloned = scene.clone(true);
  cloned.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const prepare = (material: THREE.Material) => {
      const copy = material.clone();
      copy.side = THREE.DoubleSide;
      copy.needsUpdate = true;
      return copy;
    };
    object.material = Array.isArray(object.material) ? object.material.map(prepare) : prepare(object.material);
    object.castShadow = true;
    object.receiveShadow = true;
  });
  return cloned;
}

function FirstPersonLook({ config, preset }: { config: InteriorCameraConfig; preset: LookPreset }) {
  const { camera, gl } = useThree();
  const yaw = useRef(THREE.MathUtils.degToRad(config.yawDeg));
  const pitch = useRef(THREE.MathUtils.degToRad(config.pitchDeg));
  const drag = useRef<{ x: number; y: number; pointerId: number } | null>(null);

  useEffect(() => {
    camera.position.set(...config.eyePosition);
    camera.rotation.order = "YXZ";
    yaw.current = THREE.MathUtils.degToRad(preset.yaw);
    pitch.current = THREE.MathUtils.degToRad(preset.pitch);
    camera.rotation.set(pitch.current, yaw.current, 0);
    camera.updateProjectionMatrix();
  }, [camera, config.eyePosition, preset]);

  useEffect(() => {
    const canvas = gl.domElement;
    const apply = () => camera.rotation.set(pitch.current, yaw.current, 0);
    const down = (event: PointerEvent) => {
      drag.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
      canvas.setPointerCapture?.(event.pointerId);
      canvas.style.cursor = "grabbing";
    };
    const move = (event: PointerEvent) => {
      if (!drag.current || drag.current.pointerId !== event.pointerId) return;
      const dx = event.clientX - drag.current.x;
      const dy = event.clientY - drag.current.y;
      drag.current.x = event.clientX;
      drag.current.y = event.clientY;
      yaw.current -= dx * 0.0042;
      pitch.current = THREE.MathUtils.clamp(pitch.current - dy * 0.0036, THREE.MathUtils.degToRad(-68), THREE.MathUtils.degToRad(62));
      apply();
    };
    const up = (event: PointerEvent) => {
      if (drag.current?.pointerId !== event.pointerId) return;
      drag.current = null;
      canvas.releasePointerCapture?.(event.pointerId);
      canvas.style.cursor = "grab";
    };
    canvas.style.cursor = "grab";
    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
    };
  }, [camera, gl]);

  return null;
}

function InteriorScene({ src, config, preset }: { src: string; config: InteriorCameraConfig; preset: LookPreset }) {
  const file = useGLTF(src);
  const scene = useMemo(() => cloneForInterior(file.scene), [file.scene]);
  return <>
    <FirstPersonLook config={config} preset={preset}/>
    <primitive
      object={scene}
      position={config.modelPosition}
      rotation={config.modelRotation.map(THREE.MathUtils.degToRad) as [number, number, number]}
      scale={config.modelScale}
    />
  </>;
}

function LoadingInterior() {
  return <mesh position={[0, 0.18, -0.4]}><boxGeometry args={[0.8, 0.35, 0.3]}/><meshStandardMaterial color="#667781" roughness={0.75}/></mesh>;
}

export default function InteriorCabViewer({ src, config, admin = false }: { src: string; config: InteriorCameraConfig; admin?: boolean }) {
  const [preset, setPreset] = useState<LookPreset>({ yaw: config.yawDeg, pitch: config.pitchDeg, revision: 0 });
  const look = (offsetYaw: number, offsetPitch = 0) => setPreset({ yaw: config.yawDeg + offsetYaw, pitch: config.pitchDeg + offsetPitch, revision: Date.now() });

  return <div className={admin ? "interior-cab-viewer admin" : "interior-cab-viewer"}>
    <Canvas
      dpr={[1, 1.6]}
      camera={{ position: config.eyePosition, fov: 68, near: 0.003, far: 100 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, preserveDrawingBuffer: true }}
    >
      <color attach="background" args={["#17232b"]}/>
      <ambientLight intensity={1.5}/>
      <directionalLight position={[0, 2, 1]} intensity={2.2}/>
      <pointLight position={[0, 0.6, 0]} intensity={1.2}/>
      <Suspense fallback={<LoadingInterior/>}>
        <InteriorScene src={src} config={config} preset={preset}/>
        <Environment preset="warehouse" environmentIntensity={0.55}/>
      </Suspense>
    </Canvas>
    <div className="interior-view-presets" aria-label="Interior view direction">
      <button onClick={() => look(-62)}>Left</button>
      <button onClick={() => look(0)}>Dashboard</button>
      <button onClick={() => look(62)}>Right</button>
      <button onClick={() => look(165)}>Rear</button>
    </div>
    <div className="driver-eye-badge"><span>◎</span><div><strong>Driver eye point</strong><small>Drag to look around · position stays seated</small></div></div>
    {!config.verified && <div className="interior-unverified">Reference eye point · calibrate in 3D Admin</div>}
  </div>;
}
