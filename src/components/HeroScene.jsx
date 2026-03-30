import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import PixelReadout from "./PixelReadout.jsx";

const DT = 0.0038;
const SIGMA = 10;
const RHO = 28;
const BETA = 8 / 3;
const RESET_AT = 34;
const TRAIL_LENGTH = 1500;
const FRAME_MS = 34;

const integrateLorenz = (point) => {
  const dx = SIGMA * (point.y - point.x);
  const dy = point.x * (RHO - point.z) - point.y;
  const dz = point.x * point.y - BETA * point.z;

  return {
    x: point.x + dx * DT,
    y: point.y + dy * DT,
    z: point.z + dz * DT,
  };
};

const createSeedPair = () => {
  const pair = {
    a: { x: 0.12, y: 0, z: 0 },
    b: { x: 0.1209, y: 0.0007, z: 0.0002 },
    time: 0,
  };

  for (let step = 0; step < 1200; step += 1) {
    pair.a = integrateLorenz(pair.a);
    pair.b = integrateLorenz(pair.b);
  }

  pair.time = 0;
  return pair;
};

const formatSimTime = (value) => `t=${value.toFixed(1).padStart(5, "0")}`;

export default function HeroScene() {
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const [simTime, setSimTime] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;

    if (!canvas || !stage) {
      return undefined;
    }

    const context = canvas.getContext("2d");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let width = 0;
    let height = 0;
    let animationFrame = 0;
    let readoutTimer = 0;
    let lastFrame = 0;
    let sim = createSeedPair();
    let trailA = [];
    let trailB = [];

    const mapPoint = (point) => {
      const scale = Math.min(width / 41, height / 27.8);
      const centeredZ = point.z - 25.5;

      return {
        px: width * 0.5 + point.x * scale * 0.56,
        py: height * 0.55 - centeredZ * scale * 0.78,
      };
    };

    const seedTrails = () => {
      trailA = [];
      trailB = [];
      sim = createSeedPair();

      for (let step = 0; step < 1480; step += 1) {
        sim.a = integrateLorenz(sim.a);
        sim.b = integrateLorenz(sim.b);
        trailA.push(sim.a);
        trailB.push(sim.b);
      }

      sim.time = 0;
      setSimTime(0);
    };

    const drawBackground = () => {
      context.clearRect(0, 0, width, height);

      const centerGlow = context.createRadialGradient(
        width * 0.5,
        height * 0.21,
        width * 0.015,
        width * 0.5,
        height * 0.21,
        width * 0.12,
      );
      centerGlow.addColorStop(0, "rgba(255, 250, 244, 0.52)");
      centerGlow.addColorStop(1, "rgba(255, 250, 244, 0)");
      context.fillStyle = centerGlow;
      context.fillRect(0, 0, width, height);
    };

    const drawTrail = (trail, color, glowColor) => {
      if (trail.length < 2) {
        return;
      }

      context.save();
      context.lineCap = "round";
      context.lineJoin = "round";

      for (let index = 1; index < trail.length; index += 1) {
        const from = mapPoint(trail[index - 1]);
        const to = mapPoint(trail[index]);
        const progress = index / (trail.length - 1);
        const opacity = 0.03 + progress * 0.58;

        context.strokeStyle = glowColor.replace("{alpha}", (opacity * 0.5).toFixed(3));
        context.lineWidth = 1.8;
        context.beginPath();
        context.moveTo(from.px, from.py);
        context.lineTo(to.px, to.py);
        context.stroke();

        context.strokeStyle = color.replace("{alpha}", opacity.toFixed(3));
        context.lineWidth = 0.92;
        context.beginPath();
        context.moveTo(from.px, from.py);
        context.lineTo(to.px, to.py);
        context.stroke();
      }

      context.restore();
    };

    const drawEndpoints = () => {
      const latestA = mapPoint(trailA[trailA.length - 1]);
      const latestB = mapPoint(trailB[trailB.length - 1]);

      context.save();
      context.shadowBlur = 7;
      context.shadowColor = "rgba(197, 102, 75, 0.22)";
      context.fillStyle = "#c56e53";
      context.beginPath();
      context.arc(latestA.px, latestA.py, 2.2, 0, Math.PI * 2);
      context.fill();

      context.shadowColor = "rgba(101, 121, 173, 0.22)";
      context.fillStyle = "#6980ac";
      context.beginPath();
      context.arc(latestB.px, latestB.py, 2.2, 0, Math.PI * 2);
      context.fill();
      context.restore();
    };

    const render = () => {
      drawBackground();
      drawTrail(trailA, "rgba(197, 102, 75, {alpha})", "rgba(197, 102, 75, {alpha})");
      drawTrail(trailB, "rgba(101, 121, 173, {alpha})", "rgba(101, 121, 173, {alpha})");
      drawEndpoints();
    };

    const advanceSimulation = () => {
      for (let step = 0; step < 2; step += 1) {
        sim.a = integrateLorenz(sim.a);
        sim.b = integrateLorenz(sim.b);
        sim.time += DT;

        trailA.push(sim.a);
        trailB.push(sim.b);

        if (trailA.length > TRAIL_LENGTH) {
          trailA.shift();
          trailB.shift();
        }
      }
    };

    const renderStatic = () => {
      seedTrails();

      for (let step = 0; step < 420; step += 1) {
        advanceSimulation();
      }

      render();
      setSimTime(RESET_AT);
    };

    const animate = (now) => {
      if (now - lastFrame >= FRAME_MS) {
        lastFrame = now;
        advanceSimulation();
        render();

        if (sim.time >= RESET_AT) {
          seedTrails();
        }
      }

      animationFrame = window.requestAnimationFrame(animate);
    };

    const resize = (entries) => {
      const bounds = entries?.[0]?.contentRect ?? stage.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      seedTrails();

      if (reduceMotion.matches) {
        renderStatic();
      } else {
        render();
      }
    };

    const syncReadout = () => {
      setSimTime(sim.time);
      readoutTimer = window.setTimeout(syncReadout, 140);
    };

    const updateMotionMode = () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }

      if (readoutTimer) {
        window.clearTimeout(readoutTimer);
        readoutTimer = 0;
      }

      if (reduceMotion.matches) {
        renderStatic();
      } else {
        lastFrame = 0;
        render();
        animationFrame = window.requestAnimationFrame(animate);
        syncReadout();
      }
    };

    const resetParallax = () => {
      stage.style.setProperty("--hero-tilt-x", "0deg");
      stage.style.setProperty("--hero-tilt-y", "0deg");
      stage.style.setProperty("--hero-shift-x", "0px");
      stage.style.setProperty("--hero-shift-y", "0px");
    };

    const onPointerMove = (event) => {
      const bounds = stage.getBoundingClientRect();
      const px = (event.clientX - bounds.left) / bounds.width;
      const py = (event.clientY - bounds.top) / bounds.height;
      const offsetX = px - 0.5;
      const offsetY = py - 0.5;
      stage.style.setProperty("--hero-tilt-x", `${(-offsetY * 1.7).toFixed(2)}deg`);
      stage.style.setProperty("--hero-tilt-y", `${(offsetX * 2).toFixed(2)}deg`);
      stage.style.setProperty("--hero-shift-x", `${(offsetX * 4).toFixed(2)}px`);
      stage.style.setProperty("--hero-shift-y", `${(offsetY * 3).toFixed(2)}px`);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);
    resize();
    updateMotionMode();

    if (!reduceMotion.matches) {
      stage.addEventListener("pointermove", onPointerMove);
      stage.addEventListener("pointerleave", resetParallax);
    }

    const onReduceMotionChange = () => {
      resize();
      updateMotionMode();
      resetParallax();
    };

    reduceMotion.addEventListener("change", onReduceMotionChange);

    return () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
      if (readoutTimer) {
        window.clearTimeout(readoutTimer);
      }
      resizeObserver.disconnect();
      reduceMotion.removeEventListener("change", onReduceMotionChange);
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerleave", resetParallax);
    };
  }, []);

  return (
    <motion.div
      className="lorenz-stage"
      ref={stageRef}
      initial={{ opacity: 0, y: 10, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      aria-label="Animated Lorenz attractor study showing two nearby trajectories slowly diverging over time"
      role="img"
    >
      <canvas className="lorenz-canvas" ref={canvasRef} aria-hidden="true"></canvas>
      <PixelReadout label="Lorenz" value={formatSimTime(simTime)} />
    </motion.div>
  );
}
