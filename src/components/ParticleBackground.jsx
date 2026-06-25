import { useEffect, useRef } from 'react';

export default function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animId;
    let particles = [];
    let running = true;

    // ── Respect prefers-reduced-motion ─────────────────────────────────────
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    // ── Mobile: cut particle density and connection range ──────────────────
    const isMobile = () => window.innerWidth < 768;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    class Particle {
      constructor() { this.reset(); }

      reset() {
        this.x      = Math.random() * canvas.width;
        this.y      = Math.random() * canvas.height;
        this.size   = Math.random() * 1.5 + 0.4;
        this.speedX = (Math.random() - 0.5) * (isMobile() ? 0.2 : 0.3);
        this.speedY = (Math.random() - 0.5) * (isMobile() ? 0.2 : 0.3);
        this.opacity = Math.random() * 0.5 + 0.1;
        this.color  = Math.random() > 0.5
          ? `rgba(57, 255, 20, ${this.opacity})`
          : `rgba(0, 229, 255, ${this.opacity})`;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
          this.reset();
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    }

    const init = () => {
      particles = [];
      // Mobile: ~50% fewer particles; hard cap at 80 mobile / 120 desktop
      const area  = canvas.width * canvas.height;
      const divisor = isMobile() ? 20000 : 12000;
      const cap   = isMobile() ? 60 : 120;
      const count = Math.min(Math.floor(area / divisor), cap);
      for (let i = 0; i < count; i++) particles.push(new Particle());
    };

    // ── Connection range: smaller on mobile for perf ───────────────────────
    const CONNECTION_RANGE    = isMobile() ? 80 : 120;
    const CONNECTION_RANGE_SQ = CONNECTION_RANGE * CONNECTION_RANGE;

    const drawConnections = () => {
      const len = particles.length;
      for (let i = 0; i < len; i++) {
        for (let j = i + 1; j < len; j++) {
          const dx   = particles[i].x - particles[j].x;
          const dy   = particles[i].y - particles[j].y;
          const distSq = dx * dx + dy * dy;
          if (distSq < CONNECTION_RANGE_SQ) {
            const opacity = (1 - Math.sqrt(distSq) / CONNECTION_RANGE) * 0.12;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0, 229, 255, ${opacity})`;
            ctx.lineWidth   = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      drawConnections();
      animId = requestAnimationFrame(animate);
    };

    // ── Pause when the tab is hidden to save battery ───────────────────────
    const handleVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(animId);
      } else {
        running = true;
        animate();
      }
    };

    // ── Throttled resize ───────────────────────────────────────────────────
    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { resize(); init(); }, 200);
    };

    resize();
    init();
    animate();

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('resize', handleResize);

    return () => {
      running = false;
      cancelAnimationFrame(animId);
      clearTimeout(resizeTimer);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.6,
      }}
    />
  );
}
