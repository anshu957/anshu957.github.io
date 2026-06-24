import { useEffect, useRef } from "react";

export default function BifurcationCanvas() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const W = (canvas.width = canvas.offsetWidth);
    const H = (canvas.height = canvas.offsetHeight);
    ctx.clearRect(0, 0, W, H);

    const dark = document.documentElement.classList.contains("dark");
    const col = dark ? "rgba(220,200,160,0.18)" : "rgba(43,33,28,0.13)";

    const rMin = 2.6, rMax = 4.0, steps = 600, settle = 200, iter = 120;
    for (let i = 0; i < steps; i++) {
      const r = rMin + (rMax - rMin) * (i / steps);
      let x = 0.5;
      for (let j = 0; j < settle; j++) x = r * x * (1 - x);
      for (let j = 0; j < iter; j++) {
        x = r * x * (1 - x);
        const px = Math.round((i / steps) * W);
        const py = Math.round((1 - x) * H);
        ctx.fillStyle = col;
        ctx.fillRect(px, py, 1, 1);
      }
    }
  }, []);

  return (
    <canvas
      ref={ref}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    />
  );
}
