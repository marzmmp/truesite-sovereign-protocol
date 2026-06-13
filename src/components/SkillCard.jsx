// Skill Card — shown during Sovereign Protocol roll call
// Displays agent name, role, and skills as they introduce themselves

export function SkillCard({ agent, visible }) {
  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 100,
      background: 'rgba(0,0,0,0.92)',
      border: `1px solid ${agent.color}44`,
      borderRadius: 16,
      padding: '28px 36px',
      minWidth: 360,
      maxWidth: 480,
      animation: 'fadeInUp 0.4s ease',
      boxShadow: `0 0 40px ${agent.color}22`
    }}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate(-50%, calc(-50% + 20px)); }
          to { opacity: 1; transform: translate(-50%, -50%); }
        }
      `}</style>

      {/* Agent name + role */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: agent.color,
          boxShadow: `0 0 10px ${agent.color}`
        }} />
        <div>
          <div style={{
            fontSize: 20, fontWeight: 700,
            color: agent.color, fontFamily: 'monospace',
            letterSpacing: '0.05em'
          }}>
            {agent.name}
          </div>
          <div style={{
            fontSize: 10, color: 'rgba(232,212,168,0.5)',
            textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 2
          }}>
            {agent.role}
          </div>
        </div>
      </div>

      {/* Skills */}
      <div style={{
        fontSize: 10, color: 'rgba(232,212,168,0.4)',
        textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12
      }}>
        Capabilities
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {agent.skills.map((skill, i) => (
          <span key={i} style={{
            fontSize: 11,
            background: `${agent.color}12`,
            border: `1px solid ${agent.color}33`,
            borderRadius: 20,
            padding: '4px 12px',
            color: agent.color,
            fontFamily: 'monospace'
          }}>
            {skill}
          </span>
        ))}
      </div>

      {/* 3565 */}
      <div style={{
        marginTop: 20,
        fontSize: 9, color: 'rgba(232,212,168,0.2)',
        fontFamily: 'monospace', letterSpacing: '0.2em',
        textAlign: 'right'
      }}>
        3565 · TRUESITE TECHNOLOGIES
      </div>
    </div>
  );
}
