import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useReducedMotion } from "framer-motion";
import { createBranchCurve } from "./circuitPath";
import BugCrawler from "./BugCrawler";

const BARK = "#6b4a2f";
const BARK_DARK = "#4a3220";
const LEAF = "#3f7d4e";
const LEAF_HI = "#5aa06a";

/** The branch the bug crawls on — a tapered-looking bark tube with a few twigs. */
function Branch() {
  const curve = useMemo(() => createBranchCurve(), []);
  const geometry = useMemo(() => new THREE.TubeGeometry(curve, 220, 0.24, 12, false), [curve]);

  const barkMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: BARK,
        roughness: 0.95,
        metalness: 0.0,
        flatShading: true,
      }),
    []
  );

  // a couple of small offshoot twigs
  const twigs = useMemo(() => {
    const made = [];
    [0.32, 0.66].forEach((t) => {
      const p = curve.getPointAt(t);
      const tan = curve.getTangentAt(t);
      const dir = new THREE.Vector3(-tan.y, tan.x, 0.4).normalize();
      const end = p.clone().add(dir.clone().multiplyScalar(1.1));
      const twig = new THREE.CatmullRomCurve3([
        p.clone(),
        p.clone().add(dir.clone().multiplyScalar(0.5)).add(new THREE.Vector3(0, 0.1, 0)),
        end,
      ]);
      made.push({ geo: new THREE.TubeGeometry(twig, 40, 0.07, 8, false), end });
    });
    return made;
  }, [curve]);

  return (
    <group>
      <mesh geometry={geometry} material={barkMat} castShadow receiveShadow />
      {twigs.map((tw, i) => (
        <group key={i}>
          <mesh geometry={tw.geo} material={barkMat} castShadow />
          <LeafCluster position={tw.end.toArray()} />
        </group>
      ))}
    </group>
  );
}

/** A small bunch of leaves. */
function LeafCluster({ position }) {
  const leafMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: LEAF,
        roughness: 0.8,
        emissive: new THREE.Color(LEAF_HI),
        emissiveIntensity: 0.06,
        side: THREE.DoubleSide,
        flatShading: true,
      }),
    []
  );

  const leaves = useMemo(
    () =>
      Array.from({ length: 5 }).map(() => ({
        pos: [(Math.random() - 0.5) * 0.5, (Math.random() - 0.2) * 0.5, (Math.random() - 0.5) * 0.5],
        rot: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
        scale: 0.18 + Math.random() * 0.12,
      })),
    []
  );

  return (
    <group position={position}>
      {leaves.map((l, i) => (
        <mesh key={i} position={l.pos} rotation={l.rot} scale={[l.scale, l.scale * 1.6, l.scale]} material={leafMat}>
          <icosahedronGeometry args={[1, 0]} />
        </mesh>
      ))}
    </group>
  );
}

/** Drifting dust motes / pollen in the light — subtle depth. */
function Motes() {
  const ref = useRef();
  const motes = useMemo(
    () =>
      Array.from({ length: 14 }).map(() => ({
        pos: [(Math.random() - 0.5) * 14, (Math.random() - 0.5) * 8, -2 - Math.random() * 3],
        scale: 0.02 + Math.random() * 0.03,
        speed: 0.1 + Math.random() * 0.2,
      })),
    []
  );
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.children.forEach((m, i) => {
      m.position.y += Math.sin(state.clock.elapsedTime * motes[i].speed + i) * 0.0015;
    });
  });
  return (
    <group ref={ref}>
      {motes.map((m, i) => (
        <mesh key={i} position={m.pos} scale={m.scale}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshBasicMaterial color="#d8c9a8" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function CameraRig({ reduced }) {
  const { camera, pointer, size } = useThree();
  const isTablet = size.width < 1024;
  
  useFrame(() => {
    if (reduced) return;
    const targetZ = isTablet ? 12 : 9;
    camera.position.x += (pointer.x * 0.7 - camera.position.x) * 0.04;
    camera.position.y += (pointer.y * 0.4 - camera.position.y) * 0.04;
    camera.position.z += (targetZ - camera.position.z) * 0.04;
    camera.lookAt(0, isTablet ? -0.6 : 0, 0);
  });
  return null;
}

function SceneContents({ reduced }) {
  const { size } = useThree();
  const isTablet = size.width < 1024;

  const yOffset = isTablet ? -0.6 : 0;
  const scale = isTablet ? 0.85 : 1.0;

  return (
    <group position={[0, yOffset, 0]} scale={[scale, scale, scale]}>
      <hemisphereLight args={["#fff7e6", "#5a4632", 0.7]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 6]} intensity={1.3} color="#fff4dd" />
      <directionalLight position={[-6, 2, 4]} intensity={0.35} color="#bcd4ff" />
      <Branch />
      <Motes />
      <BugCrawler frozen={reduced} />
      <CameraRig reduced={reduced} />
    </group>
  );
}

export default function HeroScene() {
  const reduced = useReducedMotion();
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 9], fov: 38 }}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0 }}
      onCreated={({ gl }) => gl.setClearColor("#000000", 0)}
      onError={() => setFailed(true)}
    >
      <Suspense fallback={null}>
        <SceneContents reduced={!!reduced} />
      </Suspense>
    </Canvas>
  );
}
