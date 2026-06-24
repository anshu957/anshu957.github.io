import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import PixelReadout from "./PixelReadout.jsx";

const SIGMA = 10;
const RHO = 28;
const BETA = 8 / 3;
const DT = 0.0058;
const HISTORY_LENGTH = 92;
const CURVE_POINTS = 220;
const FRAME_MS = 1000 / 45;
const RESET_AFTER = 40;
const PALETTES = [
  {
    tail: new THREE.Color("#d9d1c6"),
    head: new THREE.Color("#b7604b"),
    glow: new THREE.Color("#d59c63"),
    phase: 0,
  },
  {
    tail: new THREE.Color("#d8d2cc"),
    head: new THREE.Color("#4f6885"),
    glow: new THREE.Color("#9fb6c8"),
    phase: Math.PI * 0.64,
  },
];

function integrateLorenz(point) {
  const dx = SIGMA * (point.y - point.x);
  const dy = point.x * (RHO - point.z) - point.y;
  const dz = point.x * point.y - BETA * point.z;

  return {
    x: point.x + dx * DT,
    y: point.y + dy * DT,
    z: point.z + dz * DT,
  };
}

function mapLorenz(point) {
  return new THREE.Vector3(
    (point.x / 24) * 13.2,
    ((point.z - 24) / 26) * 9.8,
    (point.y / 30) * 4.4,
  );
}

function clonePoint(point) {
  return new THREE.Vector3(point.x, point.y, point.z);
}

function createSeedPair() {
  let primary = { x: 0.1, y: 0.02, z: 18.6 };
  let secondary = { x: 0.10006, y: 0.02003, z: 18.60005 };

  for (let step = 0; step < 1500; step += 1) {
    primary = integrateLorenz(primary);
    secondary = integrateLorenz(secondary);
  }

  const historyA = [];
  const historyB = [];

  while (historyA.length < HISTORY_LENGTH || historyB.length < HISTORY_LENGTH) {
    for (let iter = 0; iter < 3; iter += 1) {
      primary = integrateLorenz(primary);
      secondary = integrateLorenz(secondary);
    }

    historyA.push(mapLorenz(primary));
    historyB.push(mapLorenz(secondary));
  }

  return {
    primary,
    secondary,
    historyA,
    historyB,
    elapsed: 0,
  };
}

function buildRibbonPoints(history, elapsed, amplitude, phase) {
  const curve = new THREE.CatmullRomCurve3(history, false, "centripetal", 0.42);
  const sampled = curve.getSpacedPoints(CURVE_POINTS - 1);

  return sampled.map((point, index, points) => {
    const progress = index / Math.max(1, points.length - 1);
    const prev = points[Math.max(0, index - 1)];
    const next = points[Math.min(points.length - 1, index + 1)];
    const tangent = clonePoint(next).sub(prev);

    if (tangent.lengthSq() < 1e-8) {
      tangent.set(1, 0, 0);
    }

    tangent.normalize();

    const normal = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize();
    const wiggle =
      Math.sin(elapsed * 0.82 + progress * 12.4 + phase) *
      amplitude *
      (0.18 + progress * progress * 0.92);
    const lift =
      Math.cos(elapsed * 0.54 + progress * 9.6 + phase) *
      amplitude *
      0.42 *
      Math.pow(progress, 1.35);

    return clonePoint(point)
      .addScaledVector(normal, wiggle)
      .add(new THREE.Vector3(0, 0, lift));
  });
}

function updateGeometry(geometry, points, palette) {
  const position = geometry.getAttribute("position");
  const color = geometry.getAttribute("color");

  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    const progress = index / Math.max(1, points.length - 1);
    const mix = Math.pow(progress, 1.22);
    const tone = palette.tail.clone().lerp(palette.head, mix);

    if (progress > 0.82) {
      tone.lerp(palette.glow, (progress - 0.82) / 0.18);
    }

    position.setXYZ(index, point.x, point.y, point.z);
    color.setXYZ(index, tone.r, tone.g, tone.b);
  }

  position.needsUpdate = true;
  color.needsUpdate = true;
  geometry.computeBoundingSphere();
}

function resizeScene(container, renderer, camera) {
  const width = container.clientWidth;
  const height = container.clientHeight;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height, false);
  camera.aspect = width / Math.max(height, 1);
  camera.updateProjectionMatrix();
}

function formatTime(value) {
  return `t=${value.toFixed(1).padStart(5, "0")}`;
}

export default function HeroScene() {
  const stageRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const [timeLabel, setTimeLabel] = useState("t=000.0");

  useEffect(() => {
    const container = stageRef.current;

    if (!container) {
      return undefined;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
    camera.position.set(0, 0.1, 41);

    let renderer;

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      setTimeLabel("t=static");
      return undefined;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.className = "lorenz-canvas";
    container.appendChild(renderer.domElement);
    container.dataset.ready = "true";

    const root = new THREE.Group();
    root.position.set(0, -0.4, 0);
    scene.add(root);

    const fillLight = new THREE.AmbientLight(0xf6efe6, 0.8);
    scene.add(fillLight);

    const sideLight = new THREE.DirectionalLight(0xd4b78e, 0.5);
    sideLight.position.set(-6, 5, 8);
    scene.add(sideLight);

    const lines = PALETTES.map((palette) => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(CURVE_POINTS * 3), 3),
      );
      geometry.setAttribute(
        "color",
        new THREE.BufferAttribute(new Float32Array(CURVE_POINTS * 3), 3),
      );

      const line = new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({
          vertexColors: true,
          transparent: true,
          opacity: 0.96,
        }),
      );

      const glow = new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({
          color: palette.glow,
          transparent: true,
          opacity: 0.13,
        }),
      );

      glow.scale.setScalar(1.012);
      root.add(glow);
      root.add(line);

      return { geometry, line, glow, palette };
    });

    const headGeometry = new THREE.SphereGeometry(0.18, 20, 20);
    const heads = PALETTES.map((palette) => {
      const mesh = new THREE.Mesh(
        headGeometry,
        new THREE.MeshBasicMaterial({
          color: palette.head,
          transparent: true,
          opacity: 0.82,
        }),
      );

      root.add(mesh);
      return mesh;
    });

    let system = createSeedPair();
    let pointerTargetX = 0;
    let pointerTargetY = 0;
    let renderTime = 0;
    let liveTime = system.elapsed;
    let frameHandle = 0;
    let lastFrame = 0;
    let lastReadout = -1;

    const renderSystem = (elapsed, motionEnabled) => {
      const separation = mapLorenz(system.primary).distanceTo(mapLorenz(system.secondary));
      const wiggleStrength = THREE.MathUtils.clamp(0.16 + separation * 0.034, 0.18, 0.56);
      const ribbons = [
        buildRibbonPoints(system.historyA, elapsed, wiggleStrength, PALETTES[0].phase),
        buildRibbonPoints(system.historyB, elapsed, wiggleStrength * 0.94, PALETTES[1].phase),
      ];

      ribbons.forEach((points, index) => {
        const entry = lines[index];
        updateGeometry(entry.geometry, points, entry.palette);

        const head = points[points.length - 1];
        heads[index].position.copy(head);
        heads[index].scale.setScalar(motionEnabled ? 1 : 0.92);
      });

      root.rotation.y = THREE.MathUtils.lerp(root.rotation.y, pointerTargetX * 0.16, 0.075);
      root.rotation.x = THREE.MathUtils.lerp(root.rotation.x, pointerTargetY * -0.09, 0.075);
      root.position.x = THREE.MathUtils.lerp(root.position.x, pointerTargetX * 0.8, 0.08);
      root.position.y = THREE.MathUtils.lerp(root.position.y, -0.4 + pointerTargetY * 0.35, 0.08);

      renderer.render(scene, camera);
    };

    const advanceSystem = () => {
      for (let step = 0; step < 2; step += 1) {
        system.primary = integrateLorenz(system.primary);
        system.secondary = integrateLorenz(system.secondary);
        system.historyA.push(mapLorenz(system.primary));
        system.historyB.push(mapLorenz(system.secondary));
      }

      while (system.historyA.length > HISTORY_LENGTH) {
        system.historyA.shift();
      }

      while (system.historyB.length > HISTORY_LENGTH) {
        system.historyB.shift();
      }

      liveTime += DT * 16;

      if (liveTime > RESET_AFTER) {
        system = createSeedPair();
        liveTime = system.elapsed;
      }
    };

    const handlePointerMove = (event) => {
      const bounds = container.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / Math.max(bounds.width, 1);
      const y = (event.clientY - bounds.top) / Math.max(bounds.height, 1);
      pointerTargetX = (x - 0.5) * 2;
      pointerTargetY = (y - 0.5) * 2;
    };

    const handlePointerLeave = () => {
      pointerTargetX = 0;
      pointerTargetY = 0;
    };

    const handleResize = () => resizeScene(container, renderer, camera);

    resizeScene(container, renderer, camera);

    if (prefersReducedMotion) {
      renderTime = 7.5;
      setTimeLabel(formatTime(renderTime));
      renderSystem(renderTime, false);
    } else {
      container.addEventListener("pointermove", handlePointerMove);
      container.addEventListener("pointerleave", handlePointerLeave);

      const tick = (now) => {
        if (now - lastFrame < FRAME_MS) {
          frameHandle = window.requestAnimationFrame(tick);
          return;
        }

        const delta = Math.min((now - lastFrame) / 1000 || FRAME_MS / 1000, 0.04);
        lastFrame = now;
        renderTime += delta;
        advanceSystem();
        renderSystem(renderTime, true);

        const rounded = Math.floor(liveTime * 10);

        if (rounded !== lastReadout) {
          lastReadout = rounded;
          setTimeLabel(formatTime(liveTime));
        }

        frameHandle = window.requestAnimationFrame(tick);
      };

      frameHandle = window.requestAnimationFrame(tick);
      window.addEventListener("resize", handleResize);
    }

    if (prefersReducedMotion) {
      window.addEventListener("resize", handleResize);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
      window.cancelAnimationFrame(frameHandle);

      heads.forEach((mesh) => {
        mesh.material.dispose();
      });

      lines.forEach(({ geometry, line, glow }) => {
        geometry.dispose();
        line.material.dispose();
        glow.material.dispose();
      });

      renderer.dispose();
      headGeometry.dispose();
      renderer.domElement.remove();
      delete container.dataset.ready;
    };
  }, [prefersReducedMotion]);

  return (
    <div
      ref={stageRef}
      className="lorenz-stage"
      role="img"
      aria-label="Animated chaos study rendered as two smooth wiggle-like trajectories in a nonlinear phase field."
    >
      <svg
        className="hero-scene-fallback"
        viewBox="0 0 100 82"
        aria-hidden="true"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="chaosWarm" x1="0%" x2="100%" y1="30%" y2="60%">
            <stop offset="0%" stopColor="#cebcae" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#b7604b" stopOpacity="0.62" />
          </linearGradient>
          <linearGradient id="chaosCool" x1="100%" x2="0%" y1="20%" y2="70%">
            <stop offset="0%" stopColor="#cfc8bf" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#4f6885" stopOpacity="0.56" />
          </linearGradient>
        </defs>
        <path
          d="M45.5 12.5C34.5 15.5 23 28 22.5 42.5C22 55 29.5 67 40.5 69.5C49.5 71.5 56 63.5 55.5 52.5C54.5 33 37 31.5 32 44.5C28 54.5 34.5 64.5 44 64C58 63 60.5 45.5 54.5 30.5C50.5 20.5 45.5 14.5 45.5 12.5Z"
          fill="none"
          stroke="url(#chaosWarm)"
          strokeWidth="1.15"
          strokeLinecap="round"
        />
        <path
          d="M54.5 12.8C65.5 15.8 77 28.2 77.4 42.6C77.8 56.2 70 67.5 59.2 69.6C49.8 71.4 44 63.4 44.4 52.2C45.2 33.2 63 31.8 68.1 44.6C72.1 54.4 65.3 64.1 56 63.8C42 63.3 39.7 45.4 45.6 30.6C49.2 21.4 53.6 15.2 54.5 12.8Z"
          fill="none"
          stroke="url(#chaosCool)"
          strokeWidth="1.08"
          strokeLinecap="round"
        />
      </svg>
      <PixelReadout label="phase" value={timeLabel} />
    </div>
  );
}
