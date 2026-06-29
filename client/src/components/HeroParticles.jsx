import React, { useRef, useEffect } from 'react';

export default function HeroParticles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];
    let orbs = [];
    let gridPhase = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      canvas.width = parent.offsetWidth;
      canvas.height = parent.offsetHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    // Particle class — tiny golden dots drifting upward
    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + Math.random() * 40;
        this.size = Math.random() * 2 + 0.5;
        this.speedY = -(Math.random() * 0.4 + 0.15);
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.5 + 0.2;
        this.fadeSpeed = Math.random() * 0.002 + 0.001;
        // Gold hue range: warm amber to pale gold
        const hue = 35 + Math.random() * 20;
        const sat = 80 + Math.random() * 20;
        const light = 55 + Math.random() * 20;
        this.color = `hsla(${hue}, ${sat}%, ${light}%,`;
      }
      update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.opacity -= this.fadeSpeed;
        if (this.opacity <= 0 || this.y < -10) {
          this.reset();
        }
      }
      draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color + this.opacity + ')';
        ctx.fill();
      }
    }

    // Ambient glow orb — large soft circles that drift slowly
    class Orb {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.radius = 80 + Math.random() * 180;
        this.vx = (Math.random() - 0.5) * 0.2;
        this.vy = (Math.random() - 0.5) * 0.15;
        this.baseOpacity = 0.04 + Math.random() * 0.02;
        this.phase = Math.random() * Math.PI * 2;
        this.phaseSpeed = 0.003 + Math.random() * 0.005;
        // Alternate between gold and cool blue-slate tint
        this.isGold = Math.random() > 0.4;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.phase += this.phaseSpeed;

        // Bounce at edges with padding
        if (this.x < -this.radius) this.x = canvas.width + this.radius;
        if (this.x > canvas.width + this.radius) this.x = -this.radius;
        if (this.y < -this.radius) this.y = canvas.height + this.radius;
        if (this.y > canvas.height + this.radius) this.y = -this.radius;
      }
      draw(ctx) {
        const pulse = this.baseOpacity + Math.sin(this.phase) * 0.015;
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        if (this.isGold) {
          gradient.addColorStop(0, `rgba(247, 181, 0, ${pulse * 1.5})`);
          gradient.addColorStop(0.5, `rgba(217, 119, 6, ${pulse * 0.6})`);
          gradient.addColorStop(1, `rgba(247, 181, 0, 0)`);
        } else {
          gradient.addColorStop(0, `rgba(247, 181, 0, ${pulse})`);
          gradient.addColorStop(0.5, `rgba(217, 119, 6, ${pulse * 0.5})`);
          gradient.addColorStop(1, `rgba(247, 181, 0, 0)`);
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
      }
    }

    // Initialize particles and orbs
    const particleCount = Math.min(Math.floor(canvas.width * 0.08), 60);
    for (let i = 0; i < particleCount; i++) {
      const p = new Particle();
      p.y = Math.random() * canvas.height; // Spread initial positions
      particles.push(p);
    }
    for (let i = 0; i < 4; i++) {
      orbs.push(new Orb());
    }

    // Draw subtle animated grid
    function drawGrid(ctx, phase) {
      const spacing = 60;
      const lineOpacity = 0.04 + Math.sin(phase) * 0.02;
      ctx.strokeStyle = `rgba(247, 181, 0, ${lineOpacity})`;
      ctx.lineWidth = 0.5;

      // Vertical lines
      for (let x = 0; x < canvas.width; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      // Horizontal lines
      for (let y = 0; y < canvas.height; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }

    // Animation loop
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      gridPhase += 0.008;
      drawGrid(ctx, gridPhase);

      // Draw orbs (behind particles)
      for (const orb of orbs) {
        orb.update();
        orb.draw(ctx);
      }

      // Draw particles
      for (const p of particles) {
        p.update();
        p.draw(ctx);
      }

      animationId = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}
