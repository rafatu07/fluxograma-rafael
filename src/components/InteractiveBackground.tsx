import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  depth: number;
  radius: number;
  gold: boolean;
  twinkle: boolean;
  phase: number;
};

export function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mouse = { x: -10_000, y: -10_000, active: false };
    let particles: Particle[] = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let running = true;
    let reduced = motionQuery.matches;
    let linkDistance = 148;
    let mouseRadius = 130;

    const seed = () => {
      const compact = width < 768;
      linkDistance = compact ? 108 : 156;
      mouseRadius = compact ? 100 : 136;
      const count = Math.min(
        compact ? 34 : 70,
        Math.max(compact ? 22 : 42, Math.round((width * height) / (compact ? 42_000 : 24_000))),
      );
      particles = Array.from({ length: count }, () => {
        const depth = Math.random() < 0.4 ? 0.58 : 1;
        const speed = (depth === 1 ? 0.18 : 0.08) * (0.7 + Math.random() * 0.7);
        const angle = Math.random() * Math.PI * 2;
        const gold = Math.random() < 0.14;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          depth,
          radius: gold ? 1.6 : depth === 1 ? 1.5 : 1.1,
          gold,
          twinkle: Math.random() < 0.45,
          phase: Math.random() * Math.PI * 2,
        };
      });
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      if (reduced) draw(0);
    };

    const draw = (now: number) => {
      context.clearRect(0, 0, width, height);

      const points = particles.map((particle) => {
        let x = particle.x;
        let y = particle.y;
        if (!reduced && mouse.active) {
          const dx = particle.x - mouse.x;
          const dy = particle.y - mouse.y;
          const distance = Math.hypot(dx, dy);
          if (distance < mouseRadius && distance > 0) {
            const force = (1 - distance / mouseRadius) * 9 * particle.depth;
            x += (dx / distance) * force;
            y += (dy / distance) * force;
          }
        }
        const pulse =
          particle.twinkle && !reduced
            ? 0.62 + 0.38 * Math.sin(now * 0.0011 + particle.phase)
            : 1;
        return { x, y, particle, pulse };
      });

      for (let i = 0; i < points.length; i += 1) {
        for (let j = i + 1; j < points.length; j += 1) {
          const first = points[i];
          const second = points[j];
          const dx = first.x - second.x;
          const dy = first.y - second.y;
          const distance = Math.hypot(dx, dy);
          if (distance >= linkDistance) continue;
          const depth = Math.min(first.particle.depth, second.particle.depth);
          let alpha = (1 - distance / linkDistance) * 0.34 * depth;
          const nearMouse =
            mouse.active &&
            (Math.hypot(first.x - mouse.x, first.y - mouse.y) < mouseRadius ||
              Math.hypot(second.x - mouse.x, second.y - mouse.y) < mouseRadius);
          if (nearMouse) alpha = Math.min(0.55, alpha + 0.14);
          const goldLine = first.particle.gold || second.particle.gold;
          context.strokeStyle = goldLine
            ? `rgba(217, 164, 65, ${alpha * 0.75})`
            : `rgba(37, 99, 235, ${alpha})`;
          context.lineWidth = goldLine ? 0.8 : 0.75;
          context.beginPath();
          context.moveTo(first.x, first.y);
          context.lineTo(second.x, second.y);
          context.stroke();
        }
      }

      if (!reduced && mouse.active) {
        for (const point of points) {
          const dx = point.x - mouse.x;
          const dy = point.y - mouse.y;
          const distance = Math.hypot(dx, dy);
          if (distance >= 112) continue;
          context.strokeStyle = `rgba(22, 59, 92, ${(1 - distance / 112) * 0.28})`;
          context.lineWidth = 0.7;
          context.beginPath();
          context.moveTo(point.x, point.y);
          context.lineTo(mouse.x, mouse.y);
          context.stroke();
        }
      }

      for (const point of points) {
        const alpha = (point.particle.gold ? 0.42 : 0.28 + point.particle.depth * 0.24) * point.pulse;
        context.fillStyle = point.particle.gold
          ? `rgba(217, 164, 65, ${alpha})`
          : `rgba(22, 59, 92, ${alpha})`;
        context.beginPath();
        context.arc(point.x, point.y, point.particle.radius, 0, Math.PI * 2);
        context.fill();
        if (point.particle.twinkle && point.pulse > 0.85) {
          context.fillStyle = point.particle.gold
            ? `rgba(243, 201, 105, ${0.35 * point.pulse})`
            : `rgba(96, 165, 250, ${0.35 * point.pulse})`;
          context.beginPath();
          context.arc(point.x, point.y, point.particle.radius + 1.3, 0, Math.PI * 2);
          context.fill();
        }
      }
    };

    const tick = (now: number) => {
      if (!running || reduced || document.hidden) return;
      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        if (particle.x < -24) particle.x = width + 24;
        if (particle.x > width + 24) particle.x = -24;
        if (particle.y < -24) particle.y = height + 24;
        if (particle.y > height + 24) particle.y = -24;
      }
      draw(now);
      frame = window.requestAnimationFrame(tick);
    };

    const onPointerMove = (event: PointerEvent) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
      mouse.active = true;
    };

    const onPointerLeave = () => {
      mouse.active = false;
    };

    const onVisibility = () => {
      if (document.hidden || reduced) {
        window.cancelAnimationFrame(frame);
        return;
      }
      if (running) frame = window.requestAnimationFrame(tick);
    };

    const onMotionChange = () => {
      reduced = motionQuery.matches;
      window.cancelAnimationFrame(frame);
      mouse.active = false;
      if (reduced) {
        window.removeEventListener("pointermove", onPointerMove);
        draw(0);
        return;
      }
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      frame = window.requestAnimationFrame(tick);
    };

    resize();
    if (reduced) {
      draw(0);
    } else {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      frame = window.requestAnimationFrame(tick);
    }

    window.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    motionQuery.addEventListener("change", onMotionChange);

    return () => {
      running = false;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      motionQuery.removeEventListener("change", onMotionChange);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <div className="absolute inset-0 bg-paper" />
      <div className="grid-texture absolute inset-0" />
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
