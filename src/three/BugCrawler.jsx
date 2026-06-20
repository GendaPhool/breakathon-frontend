import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createBranchCurve } from "./circuitPath";

// ---- palette -----------------------------------------------------------
// Real ladybird cuticle is never pure red/black — it carries a warm,
// slightly desaturated cast and a lacquered gloss. Pure #ff0000 / #000000
// reads as plastic under any lighting, so we pull both toward neutral.
const RED = "#cf2418";
const RED_DEEP = "#7a1410";
const BLACK = "#1a160f"; // warm near-black cuticle, not flat black
const CREAM = "#f0e7d0";

// Shell ellipsoid half-extents (length x, height y, width z), centered at SHELL_Y.
const A = 0.46; // length semi-axis
const H = 0.27; // height semi-axis
const C = 0.4; // overall width semi-axis (used for spot placement bounds)
const SHELL_Y = 0.12;

// Each wing cover (elytron) is its own small dome, offset from the body
// midline — this is what gives a ladybug its "twin shell" silhouette
// instead of one continuous loaf. They overlap slightly at z=0 so the
// seam ridge sits in a real fold rather than floating over a flat seam.
const ELY_OFFSET_Z = 0.13;
const ELY_C = 0.27;

/** Height of the actual rendered twin-dome surface at a given (x, z). */
function elytronY(x, z) {
  const cz = z >= 0 ? ELY_OFFSET_Z : -ELY_OFFSET_Z;
  const dz = z - cz;
  const k = 1 - (x / A) ** 2 - (dz / ELY_C) ** 2;
  return SHELL_Y + H * Math.sqrt(Math.max(0, k));
}

// Seven-spot layout: one shared "scutellar" spot at the front where both
// elytra meet, plus three per side (shoulder / mid / rear) — the classic
// Coccinella septempunctata arrangement, mirrored across z.
const CENTER_SPOT = { x: 0.22, z: 0, r: 0.05 };
const SIDE_SPOTS = [
  { x: 0.17, z: 0.12, r: 0.052 }, // shoulder, near the head
  { x: -0.04, z: 0.3, r: 0.06 }, // widest point of the wing
  { x: -0.29, z: 0.17, r: 0.046 }, // near the rear tip
];

/** One jointed leg: hip swings the whole leg, knee bends during the lift. */
function Leg({ position, side, tiltY = 0, legRef, kneeRef, legMat, clawMat }) {
  return (
    <group ref={legRef} position={position} rotation={[0, tiltY, 0]}>
      {/* femur */}
      <mesh material={legMat} position={[0, -0.035, side * 0.07]} rotation={[side * 0.75, 0, 0]}>
        <cylinderGeometry args={[0.013, 0.01, 0.13, 8]} />
      </mesh>
      {/* knee joint — this group is what bends to lift the foot */}
      <group ref={kneeRef} position={[0, -0.1, side * 0.135]}>
        <mesh material={legMat} position={[0, -0.005, 0]}>
          <sphereGeometry args={[0.011, 6, 6]} />
        </mesh>
        {/* tibia */}
        <mesh material={legMat} position={[0, -0.06, side * 0.04]} rotation={[side * -0.35, 0, 0]}>
          <cylinderGeometry args={[0.009, 0.005, 0.12, 8]} />
        </mesh>
        {/* tarsus */}
        <mesh material={legMat} position={[0, -0.112, side * 0.07]}>
          <sphereGeometry args={[0.008, 6, 6]} />
        </mesh>
        {/* two tiny tarsal claws */}
        <mesh material={clawMat} position={[0.007, -0.122, side * 0.078]} rotation={[0, 0, 0.55]}>
          <coneGeometry args={[0.0035, 0.016, 5]} />
        </mesh>
        <mesh material={clawMat} position={[-0.007, -0.122, side * 0.078]} rotation={[0, 0, -0.55]}>
          <coneGeometry args={[0.0035, 0.016, 5]} />
        </mesh>
      </group>
    </group>
  );
}

export default function BugCrawler({ frozen = false }) {
  const group = useRef();
  const legRefs = useRef([]);
  const kneeRefs = useRef([]);
  const elytraRefs = useRef([]);
  const innerWingsRefs = useRef([]);
  const tRef = useRef(0);

  const curve = useMemo(() => createBranchCurve(), []);
  const BRANCH_RADIUS = 0.24;
  const LOOP_SECONDS = 12; // decreased speed for a more realistic crawl

  // ---- materials ---------------------------------------------------------
  const shellMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: RED,
        roughness: 0.16, // low roughness = the lacquered gloss real elytra have
        metalness: 0.06,
        emissive: new THREE.Color(RED_DEEP),
        emissiveIntensity: 0.05,
      }),
    []
  );
  const blackGlossMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: BLACK, roughness: 0.25, metalness: 0.1 }),
    []
  );
  const legMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: BLACK, roughness: 0.55, metalness: 0.05 }),
    []
  );
  const clawMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#0d0b08", roughness: 0.4 }),
    []
  );
  const creamMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: CREAM, roughness: 0.5 }),
    []
  );
  const eyeMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#070605", roughness: 0.08, metalness: 0.1 }),
    []
  );
  const wingMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ebdcb9",
        transparent: true,
        opacity: 0.65,
        roughness: 0.1,
        metalness: 0.3,
        side: THREE.DoubleSide,
      }),
    []
  );

  // Seam ridge: a tube that actually follows the dome height along the
  // centerline, instead of a flat box hovering over a curved surface.
  const seamGeometry = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 12; i++) {
      const x = THREE.MathUtils.lerp(-A * 0.82, A * 0.72, i / 12);
      pts.push(new THREE.Vector3(x, elytronY(x, 0) + 0.004, 0));
    }
    const seamCurve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(seamCurve, 24, 0.013, 6, false);
  }, []);

  const _p = useMemo(() => new THREE.Vector3(), []);
  const _t = useMemo(() => new THREE.Vector3(), []);
  const seamRef = useRef();

  useFrame((state, delta) => {
    if (!group.current) return;
    const time = state.clock.elapsedTime;

    if (!frozen) tRef.current = (tRef.current + delta / LOOP_SECONDS) % 1;
    const t = tRef.current;

    // Animation phases timeline:
    let walkSpeed = 11;
    let legAmplitude = 1.0;
    let openProgress = 0;
    let isFlapping = false;
    const flyOffset = new THREE.Vector3(0, 0, 0);
    let pitchOffset = 0;
    let rollOffset = 0;
    let yawOffset = 0;

    let cT = t; // curve progress

    if (t < 0.65) {
      // Phase 1: Normal Crawl along curve from 0.0 to 0.65
      cT = (t / 0.65) * 0.65;
      walkSpeed = 11;
      legAmplitude = 1.0;
      openProgress = 0.0;
    } else if (t < 0.73) {
      // Phase 2: Decelerate to a complete stop at t = 0.65 (close to the leaf)
      const p = (t - 0.65) / 0.08; // 0 to 1
      cT = 0.65;
      walkSpeed = 11 * (1 - p);
      legAmplitude = 1.0 - p;
      openProgress = 0.0;
    } else if (t < 0.81) {
      // Phase 3: Wing Opening Phase (stationary, elytra swing open)
      const p = (t - 0.73) / 0.08; // 0 to 1
      cT = 0.65;
      walkSpeed = 0;
      legAmplitude = 0;
      openProgress = p; // elytra rotation goes from 0 to 1
    } else if (t < 0.94) {
      // Phase 4: Fly Away! Takeoff and fly off-screen to the right and up
      const p = (t - 0.81) / 0.13; // 0 to 1
      cT = 0.65 + p * 0.15; // move slightly forward along the branch direction as well
      walkSpeed = 0;
      legAmplitude = 0;
      openProgress = 1.0;
      isFlapping = true;

      // Ease-in curve for flight takeoff path
      const easeP = p * p; // cubic or quadratic ease-in
      flyOffset.x = easeP * 3.5;
      flyOffset.y = easeP * 1.5;
      flyOffset.z = easeP * -0.8;

      // Banking/tilting angles
      pitchOffset = easeP * 0.35;
      rollOffset = -easeP * 0.15;
    } else {
      // Phase 5: Off-screen Reset (t >= 0.94)
      // Keep the bug off-screen by maintaining the final flight position / offset
      const p = (t - 0.94) / 0.06; // 0 to 1
      cT = 0.65 + 0.15; // keep it at the end of the branch path
      walkSpeed = 11;
      legAmplitude = 0;
      openProgress = 1.0 - p; // wings close smoothly while off-screen
      isFlapping = false;

      // Keep it positioned far off-screen
      flyOffset.x = 3.5;
      flyOffset.y = 1.5;
      flyOffset.z = -0.8;
      
      pitchOffset = 0.35 * (1 - p); // return tilt to 0
      rollOffset = -0.15 * (1 - p);
    }

    // Get point and tangent on curve
    curve.getPointAt(cT, _p);
    curve.getTangentAt(cT, _t);

    const nx = -_t.y;
    const ny = _t.x;
    const nlen = Math.hypot(nx, ny) || 1;
    const off = BRANCH_RADIUS + 0.05;

    // Base position on branch plus fly offset
    group.current.position.set(
      _p.x + (nx / nlen) * off + flyOffset.x,
      _p.y + (ny / nlen) * off + flyOffset.y,
      _p.z + flyOffset.z
    );

    // Rotation using Euler angles (pitch, yaw, roll)
    group.current.rotation.x = rollOffset;
    group.current.rotation.y = yawOffset;
    group.current.rotation.z = Math.atan2(_t.y, _t.x) + pitchOffset;

    if (!frozen) {
      // Legs walk cycle or flight dangle
      legRefs.current.forEach((leg, i) => {
        if (!leg) return;
        const { tripod, baseY } = leg.userData;
        const phase = tripod === 0 ? 0 : Math.PI;

        let legRotX = 0;
        let legPosY = baseY;
        let kneeRotX = 0;

        if (legAmplitude > 0) {
          const w = Math.sin(time * walkSpeed + phase + (i % 3) * 0.15);
          legRotX = w * 0.32 * legAmplitude;
          legPosY = baseY + Math.max(0, w) * 0.018 * legAmplitude;
          kneeRotX = Math.max(0, w) * 0.55 * legAmplitude;
        } else {
          // Flight dangle: slow sway in the wind
          const sway = Math.sin(time * 6 + i) * 0.04;
          legRotX = 0.2 + sway;
          legPosY = baseY - 0.01;
          kneeRotX = 0.45 + sway * 0.5;
        }

        leg.rotation.x = legRotX;
        leg.position.y = legPosY;
        
        const knee = kneeRefs.current[i];
        if (knee) knee.rotation.x = kneeRotX;
      });

      // Elytra pivot rotations
      elytraRefs.current.forEach((elytra, idx) => {
        if (!elytra) return;
        const sgn = idx === 0 ? 1 : -1;
        elytra.rotation.y = sgn * openProgress * 0.72; // swing out
        elytra.rotation.x = -sgn * openProgress * 0.42; // tilt up
        elytra.rotation.z = -openProgress * 0.38; // lift outer edge
      });

      // Inner flight wings unfolding and flapping
      innerWingsRefs.current.forEach((wing, idx) => {
        if (!wing) return;
        const sgn = idx === 0 ? 1 : -1;
        
        // Scale and rotation for unfolding
        wing.scale.setScalar(openProgress);
        wing.rotation.y = -sgn * openProgress * 0.45;

        if (isFlapping) {
          // Symmetrical flapping
          wing.rotation.x = Math.sin(time * 95) * 0.55 * sgn;
        } else {
          wing.rotation.x = 0;
        }
      });

      // Hide or scale down the seam ridge as wings open
      if (seamRef.current) {
        seamRef.current.scale.setScalar(1 - openProgress);
      }

      // Add a tiny body jitter/oscillation during flight or crawl
      if (isFlapping) {
        group.current.position.y += Math.sin(time * 95) * 0.012; // high speed flight vibration
      } else {
        group.current.position.y += Math.sin(time * 22) * 0.004;
      }
    }
  });

  // pair index 0 = front (near head), 2 = rear (near tail tip)
  const legPairs = [
    { x: 0.19, tiltY: -0.22 }, // front legs angle slightly forward
    { x: -0.02, tiltY: 0 }, // mid legs straight down
    { x: -0.23, tiltY: 0.22 }, // hind legs angle slightly backward
  ];

  return (
    <group ref={group}>
      {/* ---- left & right wing covers (elytra), each its own small dome ---- */}
      {[1, -1].map((sgn, i) => {
        const hingeZ = sgn * 0.06;
        const elytronYRel = (x, z) => elytronY(x, z) - SHELL_Y;
        
        return (
          <group
            key={sgn}
            ref={(el) => {
              elytraRefs.current[i] = el;
            }}
            position={[0.3, SHELL_Y, hingeZ]}
          >
            {/* The wing cover dome */}
            <mesh
              material={shellMat}
              position={[-0.3, 0, sgn * ELY_OFFSET_Z - hingeZ]}
              scale={[A, H, ELY_C]}
            >
              {/* upper hemisphere only — the underside is never seen */}
              <sphereGeometry args={[1, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>

            {/* Center spot half inside this wing cover */}
            <mesh
              material={blackGlossMat}
              position={[CENTER_SPOT.x - 0.3, elytronYRel(CENTER_SPOT.x, 0) - 0.015, -hingeZ]}
              scale={[1, 0.4, 1]}
            >
              <sphereGeometry args={[CENTER_SPOT.r, 12, 10]} />
            </mesh>

            {/* Side spots for this wing cover */}
            {SIDE_SPOTS.map((s, idx) => (
              <mesh
                key={idx}
                material={blackGlossMat}
                position={[s.x - 0.3, elytronYRel(s.x, s.z * sgn) - 0.015, sgn * (s.z - 0.06)]}
                scale={[1, 0.4, 1]}
              >
                <sphereGeometry args={[s.r, 12, 10]} />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* belly — closes the body underneath the elytra */}
      <mesh material={blackGlossMat} position={[0, 0.06, 0]} scale={[A * 0.94, 0.14, C * 0.9]}>
        <sphereGeometry args={[1, 20, 10]} />
      </mesh>

      {/* seam ridge between the two wing covers */}
      <mesh ref={seamRef} material={blackGlossMat} geometry={seamGeometry} />

      {/* ---- inner flight wings, hidden when closed, flap during flight ---- */}
      {[1, -1].map((sgn, i) => (
        <group
          key={`wing-${sgn}`}
          ref={(el) => {
            innerWingsRefs.current[i] = el;
          }}
          position={[0.1, SHELL_Y, sgn * 0.05]}
          scale={[0, 0, 0]}
        >
          <mesh
            material={wingMat}
            position={[-0.25, 0, sgn * 0.25]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[0.5, 0.6]} />
          </mesh>
        </group>
      ))}

      {/* small scutellum where the elytra meet at the front */}
      <mesh
        material={blackGlossMat}
        position={[0.34, elytronY(0.34, 0) + 0.005, 0]}
        scale={[1, 0.4, 0.7]}
      >
        <sphereGeometry args={[0.045, 10, 8]} />
      </mesh>

      {/* small dark abdomen tip peeking past the rear of the elytra */}
      <mesh material={blackGlossMat} position={[-0.49, SHELL_Y - 0.04, 0]} scale={[0.6, 0.5, 0.7]}>
        <sphereGeometry args={[0.05, 10, 8]} />
      </mesh>

      {/* pronotum — the black collar behind the head, wider than the head itself */}
      <mesh material={blackGlossMat} position={[0.42, SHELL_Y + 0.02, 0]} scale={[0.55, 0.5, 1.1]}>
        <sphereGeometry args={[0.2, 20, 16]} />
      </mesh>
      {/* twin cream patches on the pronotum, just behind the eyes */}
      {[-1, 1].map((s) => (
        <mesh key={s} material={creamMat} position={[0.46, SHELL_Y + 0.06, 0.13 * s]} scale={[1, 0.5, 1]}>
          <sphereGeometry args={[0.035, 10, 8]} />
        </mesh>
      ))}

      {/* head, mostly tucked under the pronotum */}
      <mesh material={blackGlossMat} position={[0.56, SHELL_Y - 0.02, 0]} scale={[0.6, 0.55, 0.85]}>
        <sphereGeometry args={[0.14, 16, 14]} />
      </mesh>
      {/* compound eyes */}
      {[-1, 1].map((s) => (
        <mesh key={`e${s}`} material={eyeMat} position={[0.62, SHELL_Y + 0.02, 0.075 * s]} scale={[0.9, 1, 0.7]}>
          <sphereGeometry args={[0.028, 10, 8]} />
        </mesh>
      ))}
      {/* tiny mandible nub */}
      <mesh material={blackGlossMat} position={[0.66, SHELL_Y - 0.05, 0]}>
        <sphereGeometry args={[0.02, 8, 6]} />
      </mesh>

      {/* antennae — short, two segments, clubbed tip */}
      {[-1, 1].map((s) => (
        <group key={`a${s}`} position={[0.6, SHELL_Y + 0.07, 0.06 * s]} rotation={[0, 0, s * -0.7]}>
          <mesh material={legMat} position={[0.05, 0.03, 0.02 * s]} rotation={[0, 0, -0.7]}>
            <cylinderGeometry args={[0.006, 0.005, 0.09, 6]} />
          </mesh>
          <mesh material={legMat} position={[0.1, 0.08, 0.04 * s]} rotation={[0, 0, -1.1]}>
            <cylinderGeometry args={[0.005, 0.004, 0.06, 6]} />
          </mesh>
          <mesh material={blackGlossMat} position={[0.125, 0.105, 0.045 * s]}>
            <sphereGeometry args={[0.011, 8, 8]} />
          </mesh>
        </group>
      ))}

      {/* legs — three pairs, tripod gait */}
      {legPairs.map((pair, p) =>
        [-1, 1].map((side) => {
          const idx = p * 2 + (side === 1 ? 1 : 0);
          const tripod = (p + (side === 1 ? 1 : 0)) % 2;
          return (
            <Leg
              key={idx}
              position={[pair.x, -0.02, 0]}
              side={side}
              tiltY={pair.tiltY}
              legMat={legMat}
              clawMat={clawMat}
              legRef={(el) => {
                legRefs.current[idx] = el;
                if (el) el.userData = { tripod, baseY: -0.02 };
              }}
              kneeRef={(el) => {
                kneeRefs.current[idx] = el;
              }}
            />
          );
        })
      )}
    </group>
  );
}