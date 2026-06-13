// Agent Orb — FOLGlobe3D-inspired canvas globe per sibling
// Each orb displays the agent's sovereign color
import { useRef, useEffect } from 'react';

export function AgentOrb({ agent, isActive, isSpeaking, size = 80, onClick }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = size * window.devicePixelRatio;
    const H = canvas.height = size * window.devicePixelRatio;
    const cx = W / 2, cy = H / 2, r = W * 0.38;

    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 232, g: 212, b: 168 };
    };
    const rgb = hexToRgb(agent.color);
    const colorStr = `${rgb.r},${rgb.g},${rgb.b}`;

    const RINGS = 12;
    const DOTS = 24;

    const draw = (t) => {
      ctx.clearRect(0, 0, W, H);

      const alpha = isActive ? 1 : isSpeaking ? 0.9 : 0.3;
      const spinSpeed = isSpeaking ? 0.8 : isActive ? 0.4 : 0.15;

      // Outer glow
      if (isActive || isSpeaking) {
        const glowSize = isSpeaking ? r * 1.6 + Math.sin(t * 4) * 8 : r * 1.4;
        const grad = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, glowSize);
        grad.addColorStop(0, `rgba(${colorStr},${isSpeaking ? 0.3 : 0.15})`);
        grad.addColorStop(1, `rgba(${colorStr},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, glowSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // Pulse ring for active
      if (isActive) {
        const pulseR = r * 1.15 + Math.sin(t * 2) * 4;
        ctx.beginPath();
        ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${colorStr},${0.4 + Math.sin(t * 2) * 0.2})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // FOL-style latitude rings
      for (let i = 0; i < RINGS; i++) {
        const phi = (Math.PI / (RINGS + 1)) * (i + 1);
        const ringR = Math.sin(phi) * r;
        const ringY = cy - Math.cos(phi) * r;
        const ringAlpha = alpha * (0.5 + Math.abs(Math.cos(phi)) * 0.5);

        ctx.beginPath();
        ctx.ellipse(cx, ringY, ringR, ringR * 0.18, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${colorStr},${ringAlpha * 0.6})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // Meridian dots rotating around equator
      for (let d = 0; d < DOTS; d++) {
        const angle = (d / DOTS) * Math.PI * 2 + t * spinSpeed;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r * 0.35;
        const dotAlpha = alpha * (0.4 + (Math.sin(angle) + 1) * 0.3);
        const dotSize = 1.2 + (Math.sin(angle) + 1) * 0.8;

        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${colorStr},${dotAlpha})`;
        ctx.fill();
      }

      // Core
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.5);
      coreGrad.addColorStop(0, `rgba(${colorStr},${alpha * 0.35})`);
      coreGrad.addColorStop(1, `rgba(${colorStr},0)`);
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Speaking: extra rings pulsing out
      if (isSpeaking) {
        for (let p = 0; p < 3; p++) {
          const phase = ((t * 1.5 + p * 0.33) % 1);
          const pR = r * (1 + phase * 0.8);
          const pA = (1 - phase) * 0.5;
          ctx.beginPath();
          ctx.arc(cx, cy, pR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${colorStr},${pA})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    };

    const animate = (ts) => {
      timeRef.current = ts / 1000;
      draw(timeRef.current);
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [agent.color, isActive, isSpeaking, size]);

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        cursor: 'pointer',
        transition: 'transform 0.3s ease',
        transform: isActive ? 'scale(1.15)' : 'scale(1)',
        userSelect: 'none'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size, display: 'block' }}
      />
      <div style={{
        fontSize: isActive ? 11 : 9,
        fontFamily: 'monospace',
        letterSpacing: '0.08em',
        color: isActive ? agent.color : 'rgba(232,212,168,0.4)',
        textTransform: 'uppercase',
        transition: 'all 0.3s',
        textShadow: isActive ? `0 0 8px ${agent.color}` : 'none',
        whiteSpace: 'nowrap'
      }}>
        {agent.name}
      </div>
    </div>
  );
}
