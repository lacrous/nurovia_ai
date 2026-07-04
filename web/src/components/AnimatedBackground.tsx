import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const canvasEl = canvas;
    const ctxEl = ctx;

    let animationId: number;
    let particles: Particle[] = [];
    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const isDark = () => window.document.documentElement.classList.contains("dark");

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvasEl.width = width * dpr;
      canvasEl.height = height * dpr;
      canvasEl.style.width = `${width}px`;
      canvasEl.style.height = `${height}px`;
      ctxEl.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles();
    }

    function initParticles() {
      const count = Math.min(Math.floor((width * height) / 22000), 70);
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        size: Math.random() * 1.4 + 0.4,
        alpha: Math.random() * 0.35 + 0.15,
      }));
    }

    function readAccentRgb(): string {
      const v = window.getComputedStyle(window.document.documentElement)
        .getPropertyValue("--accent-rgb")
        .trim();
      // Fall back to default gold if not yet defined.
      return v || "212 175 55";
    }

    function draw() {
      try {
        drawFrame();
      } catch (err) {
        // Canvas errors must NEVER kill the app — log and stop the loop.
        console.warn("[AnimatedBackground] draw failed, disabling canvas:", err);
        cancelAnimationFrame(animationId);
        canvasEl.style.display = "none";
        return;
      }
      animationId = requestAnimationFrame(draw);
    }

    function drawFrame() {
      ctxEl.clearRect(0, 0, width, height);
      const dark = isDark();
      const accentRgb = readAccentRgb();
      const fg = dark ? "216, 218, 222" : "30, 34, 42";

      // Sanity check the css var resolved to something usable.
      // If not, fall back to gold so canvas never crashes.
      const safeRgb = /^(\d+)\s+(\d+)\s+(\d+)$/.test(accentRgb) ? accentRgb : "212 175 55";

      // Subtle vignette
      const gradient = ctxEl.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.8);
      gradient.addColorStop(0, `rgba(${safeRgb}, ${dark ? 0.03 : 0.04})`);
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctxEl.fillStyle = gradient;
      ctxEl.fillRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctxEl.beginPath();
        ctxEl.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctxEl.fillStyle = `rgba(${safeRgb.replace(/\s+/g, ", ")}, ${p.alpha})`;
        ctxEl.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctxEl.beginPath();
            ctxEl.moveTo(p.x, p.y);
            ctxEl.lineTo(q.x, q.y);
            ctxEl.strokeStyle = `rgba(${fg}, ${0.08 * (1 - dist / 120)})`;
            ctxEl.lineWidth = 0.5;
            ctxEl.stroke();
          }
        }
      }

    }

    resize();
    draw();
    window.addEventListener("resize", resize);
    const observer = new MutationObserver(draw);
    observer.observe(window.document.documentElement, { attributes: true, attributeFilter: ["class", "data-accent", "data-accent-custom"] });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
    />
  );
}
