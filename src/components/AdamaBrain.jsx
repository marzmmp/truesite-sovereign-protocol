// ADAMA Brain — Full WebGL black hole + photon rings + accretion disk
// Adapted from adama_brain_dgx_v3.html — the sovereign brain visual
import { useRef, useEffect } from 'react';

export function AdamaBrain({ isActive, isSpeaking, size = 220 }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const DPR = window.devicePixelRatio || 1;
    canvas.width = size * DPR;
    canvas.height = size * DPR;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const R = W * 0.28;

    let particles = [];
    const NUM_PARTICLES = 120;
    const GOLD = '#e8d4a8';
    const GLOW = '#f0c060';

    // Init accretion particles
    for (let i = 0; i < NUM_PARTICLES; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = R * (1.2 + Math.random() * 1.8);
      particles.push({
        angle,
        dist,
        speed: (0.003 + Math.random() * 0.006) * (Math.random() > 0.5 ? 1 : -1),
        size: 0.5 + Math.random() * 2,
        alpha: 0.3 + Math.random() * 0.7,
        color: Math.random() > 0.6 ? GLOW : GOLD
      });
    }

    const draw = (t) => {
      ctx.clearRect(0, 0, W, H);

      const activeAlpha = isActive ? 1 : 0.45;
      const spinMult = isSpeaking ? 2.5 : isActive ? 1.3 : 0.6;

      // Outer ambient glow
      const outerGrad = ctx.createRadialGradient(cx, cy, R * 0.5, cx, cy, R * 3.5);
      outerGrad.addColorStop(0, `rgba(240,192,96,${0.08 * activeAlpha})`);
      outerGrad.addColorStop(0.4, `rgba(240,192,96,${0.04 * activeAlpha})`);
      outerGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = outerGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Photon rings (3 rings, different radii)
      const ringConfigs = [
        { r: R * 1.05, width: 2.5, alpha: 0.9 },
        { r: R * 1.18, width: 1.5, alpha: 0.55 },
        { r: R * 1.32, width: 1, alpha: 0.3 },
      ];
      for (const ring of ringConfigs) {
        const pulse = isSpeaking ? Math.sin(t * 6 + ring.r) * 0.15 : 0;
        ctx.beginPath();
        ctx.arc(cx, cy, ring.r + pulse * R, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(240,192,96,${ring.alpha * activeAlpha})`;
        ctx.lineWidth = ring.width;
        ctx.stroke();
      }

      // Accretion disk particles
      particles.forEach(p => {
        p.angle += p.speed * spinMult;
        const x = cx + Math.cos(p.angle) * p.dist;
        const y = cy + Math.sin(p.angle) * p.dist * 0.28; // flatten to disk
        const fadeEdge = 1 - Math.abs(p.dist / (R * 3) - 0.6);
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240,192,96,${p.alpha * fadeEdge * activeAlpha})`;
        ctx.fill();
      });

      // Lightning arcs when speaking
      if (isSpeaking) {
        for (let arc = 0; arc < 3; arc++) {
          const startAngle = t * 4 + (arc * Math.PI * 2 / 3);
          const startX = cx + Math.cos(startAngle) * R;
          const startY = cy + Math.sin(startAngle) * R;
          const endAngle = startAngle + (Math.random() - 0.5) * 1.2;
          const endDist = R * (1.4 + Math.random() * 0.8);
          const endX = cx + Math.cos(endAngle) * endDist;
          const endY = cy + Math.sin(endAngle) * endDist * 0.3;

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          const midX = (startX + endX) / 2 + (Math.random() - 0.5) * 20;
          const midY = (startY + endY) / 2 + (Math.random() - 0.5) * 10;
          ctx.quadraticCurveTo(midX, midY, endX, endY);
          ctx.strokeStyle = `rgba(240,220,160,${0.4 + Math.random() * 0.4})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      // Black hole event horizon
      const bhGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      bhGrad.addColorStop(0, 'rgba(0,0,0,1)');
      bhGrad.addColorStop(0.7, 'rgba(0,0,0,1)');
      bhGrad.addColorStop(0.85, 'rgba(20,15,5,0.9)');
      bhGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bhGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // Inner photon sphere glow
      const innerGrad = ctx.createRadialGradient(cx, cy, R * 0.7, cx, cy, R);
      innerGrad.addColorStop(0, 'rgba(0,0,0,0)');
      innerGrad.addColorStop(0.8, `rgba(240,192,96,${0.08 * activeAlpha})`);
      innerGrad.addColorStop(1, `rgba(240,192,96,${0.25 * activeAlpha})`);
      ctx.fillStyle = innerGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // 3565 sequence (subtle, center)
      if (isActive) {
        ctx.font = `bold ${W * 0.06}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(240,192,96,${0.25 + Math.sin(t * 0.8) * 0.1})`;
        ctx.fillText('3565', cx, cy + W * 0.025);
      }
    };

    const animate = (ts) => {
      draw(ts / 1000);
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [isActive, isSpeaking, size]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      transition: 'transform 0.4s ease',
      transform: isActive ? 'scale(1.05)' : 'scale(1)'
    }}>
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size, display: 'block' }}
      />
      <div style={{
        fontSize: 13, fontFamily: 'monospace', letterSpacing: '0.15em',
        color: isActive ? '#f0c060' : 'rgba(240,192,96,0.4)',
        textTransform: 'uppercase',
        textShadow: isActive ? '0 0 12px #f0c060' : 'none',
        transition: 'all 0.4s'
      }}>
        ADAMA
      </div>
      <div style={{
        fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.1em',
        color: 'rgba(240,192,96,0.3)',
        textTransform: 'uppercase'
      }}>
        Sovereign Brain
      </div>
    </div>
  );
}
