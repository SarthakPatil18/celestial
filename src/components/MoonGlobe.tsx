import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Html, Line, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { SITES, type Site } from "../data/sites";

const R = 1.34;
const frameRotation = new THREE.Euler(-1, 0.05, 0);

const sitePoint = (site: Site, radius = R) => {
  const lat = THREE.MathUtils.degToRad(site.lat);
  const lon = THREE.MathUtils.degToRad(site.lon);
  return new THREE.Vector3(
    radius * Math.cos(lat) * Math.cos(lon),
    radius * Math.sin(lat),
    radius * Math.cos(lat) * Math.sin(lon),
  );
};

function localSkyDirection(site: Site, elevation: number, azimuth: number) {
  const lat = THREE.MathUtils.degToRad(site.lat);
  const lon = THREE.MathUtils.degToRad(site.lon);
  const el = THREE.MathUtils.degToRad(elevation);
  const az = THREE.MathUtils.degToRad(azimuth);
  const normal = new THREE.Vector3(
    Math.cos(lat) * Math.cos(lon),
    Math.sin(lat),
    Math.cos(lat) * Math.sin(lon),
  );
  const east = new THREE.Vector3(-Math.sin(lon), 0, Math.cos(lon));
  const north = new THREE.Vector3(
    -Math.sin(lat) * Math.cos(lon),
    Math.cos(lat),
    -Math.sin(lat) * Math.sin(lon),
  );
  return normal
    .multiplyScalar(Math.sin(el))
    .addScaledVector(north, Math.cos(el) * Math.cos(az))
    .addScaledVector(east, Math.cos(el) * Math.sin(az))
    .normalize()
    .applyEuler(frameRotation);
}

function LunarTrekPolarCap({ visible }: { visible: boolean }) {
  const [trekTex, setTrekTex] = useState<THREE.CanvasTexture | null>(null);
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    let cancelled = false;
    const tileSize = 256;
    const grid = 4; // 4x4 zoom-2 WMTS mosaic from NASA Lunar Trek South Pole endpoint
    const canvas = document.createElement("canvas");
    canvas.width = tileSize * grid;
    canvas.height = tileSize * grid;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let loaded = 0;
    for (let row = 0; row < grid; row++) {
      for (let col = 0; col < grid; col++) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = `https://trek.nasa.gov/tiles/Moon/SP/LRO_WAC_Mosaic_SPole60_100mp/1.0.0/default/default028mm/2/${row}/${col}.jpg`;
        img.onload = () => {
          if (cancelled) return;
          ctx.drawImage(img, col * tileSize, row * tileSize, tileSize, tileSize);
          loaded++;
          if (loaded === 1 || loaded === grid * grid) {
            const tex = new THREE.CanvasTexture(canvas);
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.anisotropy = gl.capabilities.getMaxAnisotropy();
            tex.needsUpdate = true;
            setTrekTex(tex);
          }
        };
      }
    }
    return () => {
      cancelled = true;
    };
  }, [gl]);

  if (!trekTex || !visible) return null;

  // Polar cap covering 80°S to 90°S (thetaStart = 170°, thetaLength = 10°)
  return (
    <mesh>
      <sphereGeometry
        args={[
          R + 0.0025,
          128,
          32,
          0,
          Math.PI * 2,
          THREE.MathUtils.degToRad(170),
          THREE.MathUtils.degToRad(10),
        ]}
      />
      <meshStandardMaterial
        map={trekTex}
        transparent
        opacity={0.72}
        roughness={0.94}
        depthWrite={false}
      />
    </mesh>
  );
}

function MoonSurface({
  relief,
  illumination,
  onFocus,
}: {
  relief: boolean;
  illumination: boolean;
  onFocus: (point: THREE.Vector3) => void;
}) {
  const [albedo, elevation, normal] = useLoader(THREE.TextureLoader, [
    "/textures/lunar-albedo-8k.jpg",
    "/textures/lunar-elevation-16ppd.png",
    "/textures/lunar-normal-lola.png",
  ]);
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    albedo.colorSpace = THREE.SRGBColorSpace;
    elevation.colorSpace = THREE.NoColorSpace;
    normal.colorSpace = THREE.NoColorSpace;
    for (const map of [albedo, elevation, normal]) {
      map.anisotropy = gl.capabilities.getMaxAnisotropy();
      map.generateMipmaps = true;
      map.minFilter = THREE.LinearMipmapLinearFilter;
      map.magFilter = THREE.LinearFilter;
      map.needsUpdate = true;
    }
  }, [albedo, elevation, normal, gl]);

  return (
    <mesh
      castShadow
      receiveShadow
      onDoubleClick={(e) => {
        e.stopPropagation();
        onFocus(e.point);
      }}
    >
      <sphereGeometry args={[R, 384, 256]} />
      <meshStandardMaterial
        map={albedo}
        normalMap={relief ? normal : null}
        normalScale={new THREE.Vector2(0.42, 0.42)}
        displacementMap={relief ? elevation : null}
        displacementScale={relief ? 0.01517 : 0}
        displacementBias={relief ? -0.00693 : 0}
        color={illumination ? "#fff" : "#f4f3f0"}
        roughness={0.96}
      />
    </mesh>
  );
}

function SiteMarker({
  site,
  selected,
  onSelect,
}: {
  site: Site;
  selected: boolean;
  onSelect: () => void;
}) {
  const [hover, setHover] = useState(false);
  const dot = useRef<THREE.Mesh>(null);
  const pos = useMemo(() => sitePoint(site, R + 0.018).applyEuler(frameRotation), [site]);
  const normal = useMemo(() => pos.clone().normalize(), [pos]);

  useFrame(({ clock }, delta) => {
    if (dot.current) {
      const s = selected ? 1.3 + Math.sin(clock.elapsedTime * 2.4) * 0.08 : hover ? 1.3 : 1;
      dot.current.scale.lerp(new THREE.Vector3(s, s, s), 1 - Math.exp(-9 * delta));
    }
  });

  return (
    <group
      position={pos.toArray()}
      quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = "";
      }}
    >
      <mesh ref={dot}>
        <sphereGeometry args={[0.03, 16, 12]} />
        <meshBasicMaterial color={selected || hover ? "#a1f8ff" : "#61cbdc"} />
      </mesh>
      <mesh>
        <ringGeometry args={[selected ? 0.054 : 0.044, selected ? 0.063 : 0.05, 32]} />
        <meshBasicMaterial
          color="#65d8e8"
          transparent
          opacity={selected ? 0.78 : 0.34}
          side={THREE.DoubleSide}
        />
      </mesh>
      {(selected || hover) && (
        <Html distanceFactor={8} position={[0.08, 0.09, 0.02]} center occlude>
          <div className="moon-marker-tip">
            <b>{site.name}</b>
            <span>
              {Math.abs(site.lat).toFixed(2)}° S · {Math.abs(site.lon).toFixed(2)}° E
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}

function Earth({ position }: { position: THREE.Vector3 }) {
  const [albedo] = useLoader(THREE.TextureLoader, ["/textures/earth-blue-marble-clouds.png"]);
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    albedo.colorSpace = THREE.SRGBColorSpace;
    albedo.generateMipmaps = true;
    albedo.minFilter = THREE.LinearMipmapLinearFilter;
    albedo.magFilter = THREE.LinearFilter;
    albedo.anisotropy = gl.capabilities.getMaxAnisotropy();
    albedo.needsUpdate = true;
  }, [albedo, gl]);

  return (
    <group position={position.toArray()}>
      <mesh>
        <sphereGeometry args={[0.105, 48, 32]} />
        <meshStandardMaterial map={albedo} roughness={0.92} />
      </mesh>
      <mesh scale={1.08}>
        <sphereGeometry args={[0.105, 36, 28]} />
        <meshBasicMaterial color="#78b9d1" transparent opacity={0.07} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

function Stars() {
  const pos = useMemo(() => {
    let seed = 54421;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const a = new Float32Array(1500 * 3);
    for (let i = 0; i < 1500; i++) {
      const r = 10 + rnd() * 18;
      const t = rnd() * Math.PI * 2;
      const p = Math.acos(2 * rnd() - 1);
      a[i * 3] = r * Math.sin(p) * Math.cos(t);
      a[i * 3 + 1] = r * Math.cos(p);
      a[i * 3 + 2] = r * Math.sin(p) * Math.sin(t);
    }
    return a;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pos, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#d0dbe5"
        size={0.018}
        sizeAttenuation
        transparent
        opacity={0.58}
        depthWrite={false}
      />
    </points>
  );
}

function Scene({
  site,
  sunElev,
  sunAz,
  earthElev,
  earthAz,
  relief,
  illumination,
  showEarth,
  cameraCommand,
  focusPoint,
  onFocusPoint,
  onSelect,
}: {
  site: Site;
  sunElev: number;
  sunAz: number;
  earthElev: number;
  earthAz: number;
  relief: boolean;
  illumination: boolean;
  showEarth: boolean;
  cameraCommand: { mode: "focus" | "reset"; id: number } | null;
  focusPoint: THREE.Vector3 | null;
  onFocusPoint: (point: THREE.Vector3) => void;
  onSelect: (id: string) => void;
}) {
  const controls = useRef<any>(null);
  const cam = useThree((s) => s.camera);
  const tween = useRef<{
    from: THREE.Vector3;
    to: THREE.Vector3;
    fromTarget: THREE.Vector3;
    toTarget: THREE.Vector3;
    time: number;
  } | null>(null);

  const sunDir = useMemo(() => localSkyDirection(site, sunElev, sunAz), [site, sunElev, sunAz]);
  const earthDir = useMemo(() => localSkyDirection(site, earthElev, earthAz), [site, earthElev, earthAz]);
  const selectedPos = useMemo(() => sitePoint(site).applyEuler(frameRotation), [site]);

  useEffect(() => {
    if (!cameraCommand) return;
    const target = cameraCommand.mode === "focus" ? selectedPos.clone() : new THREE.Vector3();
    const to =
      cameraCommand.mode === "focus"
        ? target.clone().add(target.clone().normalize().multiplyScalar(2.5))
        : new THREE.Vector3(0, 0.05, 5.3);
    tween.current = {
      from: cam.position.clone(),
      to,
      fromTarget: controls.current?.target.clone() ?? new THREE.Vector3(),
      toTarget: target,
      time: performance.now(),
    };
  }, [cameraCommand?.id, cam, selectedPos]);

  useEffect(() => {
    if (focusPoint) {
      const target = focusPoint.clone();
      tween.current = {
        from: cam.position.clone(),
        to: target.clone().add(target.clone().normalize().multiplyScalar(2.5)),
        fromTarget: controls.current?.target.clone() ?? new THREE.Vector3(),
        toTarget: target,
        time: performance.now(),
      };
    }
  }, [focusPoint, cam]);

  useFrame(() => {
    if (!tween.current) return;
    const t = Math.min(1, (performance.now() - tween.current.time) / 680);
    const e = t * t * (3 - 2 * t);
    cam.position.lerpVectors(tween.current.from, tween.current.to, e);
    controls.current?.target.lerpVectors(tween.current.fromTarget, tween.current.toTarget, e);
    controls.current?.update();
    if (t === 1) tween.current = null;
  });

  const earthPosition = earthDir.clone().multiplyScalar(3.8);

  return (
    <>
      <color attach="background" args={["#040609"]} />
      <Stars />
      <ambientLight intensity={illumination ? 0.11 : 0.17} color="#aab6c2" />
      <hemisphereLight args={["#a8bbcf", "#111318", 0.08]} />
      <directionalLight
        position={sunDir.clone().multiplyScalar(8).toArray()}
        intensity={2.3}
        color="#fff4df"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <group rotation={[-1, 0.05, 0]}>
        <MoonSurface relief={relief} illumination={illumination} onFocus={onFocusPoint} />
        <LunarTrekPolarCap visible={illumination} />
        {SITES.map((s) => (
          <SiteMarker
            key={s.id}
            site={s}
            selected={s.id === site.id}
            onSelect={() => onSelect(s.id)}
          />
        ))}
      </group>
      {showEarth && earthElev > -4 && (
        <>
          <Line
            points={[selectedPos, earthPosition]}
            color="#56c9dc"
            lineWidth={1}
            dashed
            dashSize={0.06}
            gapSize={0.035}
            transparent
            opacity={0.55}
          />
          <Earth position={earthPosition} />
        </>
      )}
      <OrbitControls
        ref={controls}
        makeDefault
        enableDamping
        dampingFactor={0.065}
        enablePan
        enableRotate
        enableZoom
        minDistance={1.8}
        maxDistance={7}
        rotateSpeed={0.48}
        zoomSpeed={0.55}
        onStart={() => {
          tween.current = null;
        }}
      />
    </>
  );
}

export interface MoonGlobeProps {
  site: Site;
  sunElev: number;
  sunAz: number;
  earthElev: number;
  earthAz: number;
  relief: boolean;
  illumination: boolean;
  showEarth: boolean;
  cameraCommand: { mode: "focus" | "reset"; id: number } | null;
  onSelect: (id: string) => void;
}

export function MoonGlobe(props: MoonGlobeProps) {
  const [focusPoint, setFocusPoint] = useState<THREE.Vector3 | null>(null);
  return (
    <Canvas
      className="celestial-moon-canvas"
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.05, 5.3], fov: 36, near: 0.1, far: 100 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      shadows
    >
      <Suspense fallback={null}>
        <Scene {...props} focusPoint={focusPoint} onFocusPoint={setFocusPoint} />
      </Suspense>
    </Canvas>
  );
}