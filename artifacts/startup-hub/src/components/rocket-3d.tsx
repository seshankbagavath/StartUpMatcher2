import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, Environment } from "@react-three/drei";
import * as THREE from "three";

// ─── Fin geometry (extruded swept delta-wing) ────────────────────────
function createFinGeo(): THREE.BufferGeometry {
  // Shape lives in XY plane; x = radial outward, y = vertical along rocket
  // After rotation around Y axis, x→radial, z→tangential (thin fin direction)
  const shape = new THREE.Shape();
  shape.moveTo(0.98, 0.6);    // top root at body surface
  shape.lineTo(2.9, -2.2);    // swept outer tip
  shape.lineTo(0.98, -3.0);   // bottom root at body surface
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.1,
    bevelEnabled: true,
    bevelThickness: 0.022,
    bevelSize: 0.022,
    bevelSegments: 2,
  });
  // Center thickness so fin is symmetric around its attachment plane
  geo.translate(0, 0, -0.05);
  return geo;
}

// ─── Camera rig ──────────────────────────────────────────────────────
// Lives inside Canvas so it has access to useFrame / state.camera
function CameraRig({
  scrollRef,
}: {
  scrollRef: React.MutableRefObject<number>;
}) {
  useFrame((state, delta) => {
    const p = scrollRef.current;

    // Phase 1 (0-25%): dramatic zoom-in from far
    const zoomT = Math.min(1, p / 0.25);
    const ez = 1 - Math.pow(1 - zoomT, 3); // easeOutCubic
    const targetZ = THREE.MathUtils.lerp(28, 9.5, ez);
    const targetX = THREE.MathUtils.lerp(0, 2.8, ez);
    const targetYBase = THREE.MathUtils.lerp(2.5, 0.5, ez);

    // Phase 3 (38-83%): camera follows rocket upward at ~40% speed
    const liftT = Math.max(0, Math.min(1, (p - 0.38) / 0.45));
    const lift = liftT * liftT; // ease-in acceleration
    const rocketH = lift * 42;
    const targetY = targetYBase + rocketH * 0.42;

    // Smooth lerp toward targets every frame
    state.camera.position.x += (targetX - state.camera.position.x) * Math.min(1, delta * 2.2);
    state.camera.position.y += (targetY - state.camera.position.y) * Math.min(1, delta * 2.8);
    state.camera.position.z += (targetZ - state.camera.position.z) * Math.min(1, delta * 1.8);

    // Always look slightly above rocket center for dramatic angle
    state.camera.lookAt(0.2, rocketH * 0.7, 0);
  });
  return null;
}

// ─── Rocket mesh ─────────────────────────────────────────────────────

function RocketScene({
  scrollRef,
}: {
  scrollRef: React.MutableRefObject<number>;
}) {
  const rocketRef = useRef<THREE.Group>(null);
  const flameRef = useRef<THREE.Group>(null);
  const engLightRef = useRef<THREE.PointLight>(null);
  const flameLightRef = useRef<THREE.PointLight>(null);
  const smokeMat = useRef<THREE.PointsMaterial | null>(null);
  const padGlowRef = useRef<THREE.MeshStandardMaterial | null>(null);

  // ── Geometry
  const finGeo = useMemo(createFinGeo, []);

  const smokeGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = 700;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const spread = Math.pow(t, 0.55) * 3.2;
      const angle = Math.random() * Math.PI * 2;
      pos[i * 3 + 0] = Math.cos(angle) * spread * (0.4 + Math.random() * 0.6);
      pos[i * 3 + 1] = -(t * 38 + 5);
      pos[i * 3 + 2] = Math.sin(angle) * spread * (0.4 + Math.random() * 0.6);
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return geo;
  }, []);

  // ── Materials (all memoized, never re-created)
  const bodyMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#dce8f8"),
        metalness: 0.92,
        roughness: 0.08,
        clearcoat: 1.0,
        clearcoatRoughness: 0.06,
        envMapIntensity: 1.4,
      }),
    []
  );

  const darkMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#0d1928"),
        metalness: 0.88,
        roughness: 0.24,
        envMapIntensity: 0.8,
      }),
    []
  );

  const cyanMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#00c8e0"),
        emissive: new THREE.Color("#009eb8"),
        emissiveIntensity: 0.8,
        metalness: 0.4,
        roughness: 0.2,
      }),
    []
  );

  const glassMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#40d8ff"),
        metalness: 0,
        roughness: 0,
        transmission: 0.8,
        thickness: 0.4,
        transparent: true,
        opacity: 0.88,
        envMapIntensity: 1.5,
      }),
    []
  );

  const smkMat = useMemo(() => {
    const m = new THREE.PointsMaterial({
      size: 0.28,
      color: new THREE.Color("#c0d0e0"),
      transparent: true,
      opacity: 0,
      sizeAttenuation: true,
      depthWrite: false,
    });
    smokeMat.current = m;
    return m;
  }, []);

  const padMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#1a2535"),
      metalness: 0.5,
      roughness: 0.6,
      emissive: new THREE.Color("#ff6600"),
      emissiveIntensity: 0,
    });
    padGlowRef.current = m;
    return m;
  }, []);

  // ── Animation loop
  useFrame(() => {
    const p = scrollRef.current;
    if (!rocketRef.current || !flameRef.current) return;

    const ignition = Math.max(0, Math.min(1, (p - 0.27) / 0.10));
    const liftT = Math.max(0, Math.min(1, (p - 0.38) / 0.45));
    const lift = liftT * liftT;
    const rocketH = lift * 42;

    // Rocket position
    rocketRef.current.position.y = rocketH;

    // Slight vibration during ignition
    const t = performance.now() * 0.001;
    rocketRef.current.rotation.z =
      Math.sin(t * 1.1) * 0.014 * ignition * (1 - lift * 0.7);

    // Flame
    const flickH = 1 + Math.sin(t * 44) * 0.08 + Math.sin(t * 73) * 0.045 + Math.sin(t * 19) * 0.03;
    const flickW = 1 + Math.sin(t * 31) * 0.06 + Math.sin(t * 67) * 0.035;
    flameRef.current.visible = ignition > 0.005;
    if (ignition > 0) {
      const scaleY = ignition * (1 + lift * 0.85) * flickH;
      const scaleXZ = ignition * flickW;
      flameRef.current.scale.set(scaleXZ, scaleY, scaleXZ);
    }

    // Engine lights
    if (engLightRef.current) {
      engLightRef.current.intensity = ignition * 7;
    }
    if (flameLightRef.current) {
      const flickL = 1 + Math.sin(t * 57) * 0.18 + Math.sin(t * 83) * 0.1;
      flameLightRef.current.intensity = ignition * 5.5 * flickL;
    }

    // Smoke trail
    if (smokeMat.current) {
      smokeMat.current.opacity = Math.max(0, Math.min(0.78, (p - 0.38) / 0.12));
    }

    // Launch pad heat glow
    if (padGlowRef.current) {
      padGlowRef.current.emissiveIntensity = ignition * 0.5 * (1 - lift);
    }
  });

  const FIN_ANGLES = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3];

  return (
    <>
      {/* ── LAUNCHPAD ── */}
      <mesh position={[0, -5.5, 0]} receiveShadow material={padMat}>
        <cylinderGeometry args={[5.5, 6, 0.5, 32]} />
      </mesh>
      {/* Launchpad cyan trim ring */}
      <mesh position={[0, -5.24, 0]}>
        <torusGeometry args={[4.5, 0.07, 8, 64]} />
        <meshStandardMaterial
          color="#00c8e0"
          emissive="#00c8e0"
          emissiveIntensity={0.35}
        />
      </mesh>
      {/* Support columns */}
      {[0, 60, 120, 180, 240, 300].map((deg, i) => {
        const r = (deg * Math.PI) / 180;
        return (
          <mesh
            key={i}
            position={[Math.sin(r) * 3.5, -4.7, Math.cos(r) * 3.5]}
          >
            <boxGeometry args={[0.22, 1.7, 0.22]} />
            <meshStandardMaterial color="#0c1520" metalness={0.7} roughness={0.3} />
          </mesh>
        );
      })}

      {/* ── SMOKE TRAIL (world space, stays behind as rocket rises) ── */}
      <points geometry={smokeGeo} material={smkMat} />

      {/* ── ROCKET GROUP (moves vertically on liftoff) ── */}
      <group ref={rocketRef}>
        {/* ── MAIN BODY ── */}
        <mesh castShadow material={bodyMat}>
          <cylinderGeometry args={[1, 1, 6, 48]} />
        </mesh>

        {/* Nose cone */}
        <mesh position={[0, 5.35, 0]} castShadow material={bodyMat}>
          <coneGeometry args={[1, 4.6, 48]} />
        </mesh>

        {/* Interstage separation ring */}
        <mesh position={[0, 3.17, 0]} material={darkMat}>
          <cylinderGeometry args={[1.022, 1.022, 0.3, 48]} />
        </mesh>

        {/* ── PAYLOAD SECTION (dark mid-band) ── */}
        <mesh position={[0, -1.2, 0]} material={darkMat}>
          <cylinderGeometry args={[1.008, 1.008, 1.4, 48]} />
        </mesh>

        {/* ── BRAND STRIPES (cyan torus rings) ── */}
        <mesh position={[0, -0.5, 0]} material={cyanMat}>
          <torusGeometry args={[1.014, 0.06, 8, 64]} />
        </mesh>
        <mesh position={[0, -1.9, 0]} material={cyanMat}>
          <torusGeometry args={[1.014, 0.046, 8, 64]} />
        </mesh>

        {/* ── WINDOW PORTHOLE ── */}
        <mesh position={[0, 1.3, 0.99]} material={glassMat}>
          <sphereGeometry args={[0.3, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        </mesh>
        {/* Window bezel */}
        <mesh position={[0, 1.3, 0.99]} material={cyanMat}>
          <torusGeometry args={[0.32, 0.042, 8, 32]} />
        </mesh>

        {/* ── FINS (3 × delta, ExtrudeGeometry) ── */}
        {FIN_ANGLES.map((angle, i) => (
          <mesh
            key={i}
            geometry={finGeo}
            material={darkMat}
            rotation={[0, angle, 0]}
            castShadow
          />
        ))}

        {/* ── ENGINE ASSEMBLY ── */}
        {/* Nozzle fairing (cone flaring outward) */}
        <mesh
          position={[0, -4.35, 0]}
          rotation={[Math.PI, 0, 0]}
          material={darkMat}
          castShadow
        >
          <cylinderGeometry args={[0.42, 1.18, 1.7, 32]} />
        </mesh>
        {/* Nozzle throat detail */}
        <mesh position={[0, -3.56, 0]} material={darkMat}>
          <cylinderGeometry args={[0.41, 0.43, 0.12, 24]} />
        </mesh>
        {/* Engine skirt */}
        <mesh position={[0, -3.1, 0]} material={darkMat}>
          <cylinderGeometry args={[1.005, 1.005, 0.22, 48]} />
        </mesh>

        {/* ── ENGINE LIGHTS ── */}
        <pointLight
          ref={engLightRef}
          position={[0, -4.9, 0]}
          color="#80eeff"
          intensity={0}
          distance={18}
          decay={2}
        />
        <pointLight
          ref={flameLightRef}
          position={[0, -7, 0]}
          color="#ff8800"
          intensity={0}
          distance={32}
          decay={1.8}
        />

        {/* ── FLAME (scale driven by scroll via useFrame) ── */}
        <group ref={flameRef} position={[0, -5.35, 0]} visible={false}>
          {/* Outer wide shock-diamond plume */}
          <mesh>
            <coneGeometry args={[1.3, 7, 16]} />
            <meshBasicMaterial
              color="#ff1100"
              transparent
              opacity={0.12}
              side={THREE.BackSide}
              depthWrite={false}
            />
          </mesh>
          {/* Main orange exhaust */}
          <mesh>
            <coneGeometry args={[0.88, 6, 16]} />
            <meshBasicMaterial
              color="#ff5500"
              transparent
              opacity={0.32}
              depthWrite={false}
            />
          </mesh>
          {/* Bright yellow inner */}
          <mesh>
            <coneGeometry args={[0.52, 5, 12]} />
            <meshBasicMaterial
              color="#ffbb00"
              transparent
              opacity={0.58}
              depthWrite={false}
            />
          </mesh>
          {/* Hot white core */}
          <mesh>
            <coneGeometry args={[0.24, 3.8, 10]} />
            <meshBasicMaterial
              color="#ffff88"
              transparent
              opacity={0.82}
              depthWrite={false}
            />
          </mesh>
          {/* Absolute bright tip */}
          <mesh>
            <coneGeometry args={[0.09, 2.2, 8]} />
            <meshBasicMaterial color="#ffffff" depthWrite={false} />
          </mesh>
          {/* Nozzle exit disc */}
          <mesh position={[0, 3.2, 0]}>
            <circleGeometry args={[0.42, 24]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.95} />
          </mesh>
        </group>
      </group>
    </>
  );
}

// ─── Public export ───────────────────────────────────────────────────

export function Rocket3D({
  scrollRef,
}: {
  scrollRef: React.MutableRefObject<number>;
}) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 2.5, 28], fov: 40 }}
      gl={{ antialias: true, alpha: false }}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      {/* Scene background + fog */}
      <color attach="background" args={["#020810"]} />
      <fog attach="fog" args={["#020810", 40, 100]} />

      {/* Lighting */}
      <ambientLight intensity={0.14} color="#182840" />
      <directionalLight
        position={[-9, 16, 7]}
        intensity={2.6}
        color="#c8dcf5"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      {/* Subtle fill from opposite side */}
      <directionalLight position={[7, -3, 5]} intensity={0.4} color="#1a3060" />

      {/* Image-based lighting (loads HDR from CDN — reflects on metallic surfaces) */}
      <Environment preset="dawn" background={false} />

      {/* Drei starfield */}
      <Stars
        radius={90}
        depth={60}
        count={4000}
        factor={3.5}
        saturation={0}
        fade
        speed={0.4}
      />

      {/* Camera controller */}
      <CameraRig scrollRef={scrollRef} />

      {/* Rocket + scene geometry */}
      <RocketScene scrollRef={scrollRef} />
    </Canvas>
  );
}
