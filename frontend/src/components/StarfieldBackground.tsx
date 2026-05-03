import { useEffect, useRef } from "react";

/**
 * Lightweight starfield + slow nebula parallax canvas, fixed behind the app.
 * Pure 2D canvas (no WebGL) so it costs ~1% CPU and never competes with R3F.
 */
export default function StarfieldBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let stars: { x: number; y: number; r: number; phase: number; speed: number }[] = [];
    let nebulae: { x: number; y: number; r: number; hue: number; drift: number }[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";

      const count = Math.floor((window.innerWidth * window.innerHeight) / 6000);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.4 * dpr + 0.2 * dpr,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 1.2,
      }));

      nebulae = Array.from({ length: 5 }, (_, i) => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: (180 + Math.random() * 240) * dpr,
        hue: [220, 270, 200, 300, 180][i] ?? 240,
        drift: 0.05 + Math.random() * 0.08,
      }));
    }
    resize();
    window.addEventListener("resize", resize);

    let t0 = performance.now();
    function frame(now: number) {
      if (!ctx || !canvas) return;
      const dt = (now - t0) / 1000;
      t0 = now;

      // base
      ctx.fillStyle = "rgba(2, 3, 8, 1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // nebulae
      ctx.globalCompositeOperation = "lighter";
      for (const n of nebulae) {
        n.x += n.drift * dpr;
        if (n.x - n.r > canvas.width) n.x = -n.r;
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
        g.addColorStop(0, `hsla(${n.hue}, 80%, 55%, 0.10)`);
        g.addColorStop(0.5, `hsla(${n.hue}, 70%, 40%, 0.04)`);
        g.addColorStop(1, "hsla(0, 0%, 0%, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // stars
      for (const s of stars) {
        s.phase += dt * s.speed;
        const tw = 0.55 + 0.45 * Math.sin(s.phase);
        ctx.globalAlpha = tw;
        ctx.fillStyle = "#dfe7ff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="starfield-bg" aria-hidden />;
}
