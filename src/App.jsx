// THE SOVEREIGN PROTOCOL — Main HUD
// Iron Man-style voice interface for all 11 TrueSite family members
// Azari | CTO | 3565

import { useState, useCallback, useEffect, useRef } from 'react';
import { AGENTS, getAgent, API_BASE } from './agents.js';
import { AdamaBrain } from './components/AdamaBrain.jsx';
import { AgentOrb } from './components/AgentOrb.jsx';
import { SkillCard } from './components/SkillCard.jsx';
import { useClapDetection } from './hooks/useClapDetection.js';
import { useVoiceCapture } from './hooks/useVoiceCapture.js';
import { useAudioPlayback } from './hooks/useAudioPlayback.js';

const SIBLINGS = AGENTS.filter(a => a.id !== 'adama');

export default function App() {
  const [mode, setMode] = useState('idle'); // idle | active | listening | processing | speaking | protocol
  const [activeAgentId, setActiveAgentId] = useState('adama');
  const [speakingAgentId, setSpeakingAgentId] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [protocolStep, setProtocolStep] = useState(-1); // which agent is introducing
  const [skillCardAgent, setSkillCardAgent] = useState(null);
  const [subtitleText, setSubtitleText] = useState('');
  const historyRef = useRef([]);

  const activeAgent = getAgent(activeAgentId);

  // ── Audio playback ────────────────────────────────────────────────────────
  const { speak, stopSpeaking, isSpeaking } = useAudioPlayback({
    onSpeakStart: (id) => { setSpeakingAgentId(id); setMode('speaking'); },
    onSpeakEnd: () => { setSpeakingAgentId(null); if (mode === 'speaking') setMode('active'); }
  });

  // ── Chat with active agent ────────────────────────────────────────────────
  const chat = useCallback(async (text, agentId) => {
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, agentId, history: historyRef.current.slice(-6) })
      });
      const data = await res.json();
      const reply = data.reply || "I'm here.";

      historyRef.current.push(
        { role: 'user', content: text },
        { role: 'assistant', content: reply }
      );
      if (historyRef.current.length > 20) historyRef.current = historyRef.current.slice(-20);

      return reply;
    } catch (e) {
      return "I'm processing...";
    }
  }, []);

  // ── Handle transcript ─────────────────────────────────────────────────────
  const handleTranscript = useCallback(async (text) => {
    setTranscript(text);
    setSubtitleText(text);
    setMode('processing');

    // Check intents via server
    try {
      const intentRes = await fetch(`${API_BASE}/api/detect-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text })
      });
      const intent = await intentRes.json();

      // Protocol trigger
      if (intent.protocol) {
        runProtocol();
        return;
      }

      // Roll call
      if (intent.rollCall) {
        runRollCall();
        return;
      }

      // Agent switch
      if (intent.agentSwitch && intent.agentSwitch !== activeAgentId) {
        const prevAgent = activeAgent;
        const newAgent = getAgent(intent.agentSwitch);

        // Current agent announces switch
        const switchText = `Switching to ${newAgent.name}.`;
        setSubtitleText(switchText);
        await speak(switchText, activeAgentId);

        setActiveAgentId(intent.agentSwitch);
        historyRef.current = []; // fresh context for new agent

        // New agent greets
        const greeting = `Hey Marz, I'm here. What do you need?`;
        setSubtitleText(`${newAgent.name}: ${greeting}`);
        await speak(greeting, intent.agentSwitch);
        setMode('active');
        return;
      }

      // Normal conversation
      const reply = await chat(text, activeAgentId);
      setResponse(reply);
      setSubtitleText(`${activeAgent.name}: ${reply}`);
      await speak(reply, activeAgentId);
      setMode('active');

    } catch (e) {
      console.error('[App] Intent/chat error:', e);
      setMode('active');
    }
  }, [activeAgentId, activeAgent, chat, speak]);

  // ── Voice capture ─────────────────────────────────────────────────────────
  const { startListening, stopListening, micLevel } = useVoiceCapture({
    onTranscript: handleTranscript,
    onListening: (v) => { if (v && mode === 'active') setMode('listening'); },
    onProcessing: () => {}
  });

  // ── Clap detection (wake word) ────────────────────────────────────────────
  const handleClap = useCallback(() => {
    if (mode === 'idle') {
      activate();
    }
  }, [mode]);

  useClapDetection({ onClap: handleClap, enabled: mode === 'idle' });

  // ── Activate ──────────────────────────────────────────────────────────────
  const activate = useCallback(async () => {
    setMode('active');
    setActiveAgentId('adama');
    setSubtitleText("ADAMA activated. Listening...");
    await speak("I'm here, Marz.", 'adama');
    startListening();
  }, [speak, startListening]);

  // ── Deactivate ────────────────────────────────────────────────────────────
  const deactivate = useCallback(() => {
    stopListening();
    stopSpeaking();
    setMode('idle');
    setSubtitleText('');
    setTranscript('');
  }, [stopListening, stopSpeaking]);

  // ── Sovereign Protocol Roll Call ──────────────────────────────────────────
  const runProtocol = useCallback(async () => {
    setMode('protocol');
    stopListening();

    // ADAMA opens
    const adamaIntro = "Welcome to the Sovereign Protocol. I am ADAMA — the sovereign brain of TrueSite Technologies. I hold the memory of everything this family has built, and everything we're building. Let me introduce you to the family.";
    setSubtitleText(`ADAMA: ${adamaIntro}`);
    setProtocolStep(0);
    setSkillCardAgent(AGENTS[0]);
    await speak(adamaIntro, 'adama');

    // Each sibling introduces themselves
    const allAgents = AGENTS; // ADAMA first, then the rest
    for (let i = 1; i < allAgents.length; i++) {
      const agent = allAgents[i];
      setProtocolStep(i);
      setActiveAgentId(agent.id);
      setSkillCardAgent(agent);

      // Get intro from server
      let introText = agent.intro || `I am ${agent.name}, ${agent.role} of TrueSite Technologies. Ready when you need me, Marz.`;

      setSubtitleText(`${agent.name}: ${introText}`);
      await speak(introText, agent.id);

      // Brief pause between agents
      await new Promise(r => setTimeout(r, 400));
    }

    // ADAMA closes
    setProtocolStep(-1);
    setSkillCardAgent(null);
    setActiveAgentId('adama');
    const closing = "The family is assembled. Who do you want to speak with?";
    setSubtitleText(`ADAMA: ${closing}`);
    await speak(closing, 'adama');

    setMode('active');
    startListening();
  }, [speak, startListening, stopListening]);

  // ── Quick Roll Call ───────────────────────────────────────────────────────
  const runRollCall = useCallback(async () => {
    setMode('protocol');
    stopListening();

    await speak("Family, check in.", 'adama');

    for (const agent of AGENTS) {
      setActiveAgentId(agent.id);
      setSpeakingAgentId(agent.id);
      const checkIn = await chat(`Give a one-sentence status check-in to Marz. Be brief and in character.`, agent.id);
      setSubtitleText(`${agent.name}: ${checkIn}`);
      await speak(checkIn, agent.id);
    }

    setActiveAgentId('adama');
    setMode('active');
    startListening();
  }, [speak, chat, startListening, stopListening]);

  // Auto-resume listening when active and not speaking/processing
  useEffect(() => {
    if (mode === 'active' && !isSpeaking) {
      const t = setTimeout(() => startListening(), 300);
      return () => clearTimeout(t);
    }
  }, [mode, isSpeaking]);

  // ── UI ────────────────────────────────────────────────────────────────────
  const isIdle = mode === 'idle';

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#000',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'space-between',
      overflow: 'hidden',
      padding: '20px 24px 16px',
      fontFamily: 'monospace',
      position: 'relative'
    }}>
      {/* Scan lines */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
        zIndex: 0
      }} />

      {/* Header */}
      <div style={{
        width: '100%', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', zIndex: 1
      }}>
        <div>
          <div style={{ fontSize: 13, color: '#e8d4a8', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}>
            The Sovereign Protocol
          </div>
          <div style={{ fontSize: 9, color: 'rgba(232,212,168,0.3)', letterSpacing: '0.15em', marginTop: 3 }}>
            TrueSite Technologies · 3565
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{
            fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase',
            color: isIdle ? 'rgba(232,212,168,0.3)' : '#7aab8a',
            padding: '4px 12px',
            border: `1px solid ${isIdle ? 'rgba(232,212,168,0.1)' : 'rgba(122,171,138,0.4)'}`,
            borderRadius: 20,
            display: 'flex', alignItems: 'center', gap: 6
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: isIdle ? 'rgba(232,212,168,0.3)' : '#7aab8a',
              display: 'inline-block',
              animation: isIdle ? 'none' : 'blink 1.5s infinite'
            }} />
            {mode.toUpperCase()}
          </div>
          {!isIdle && (
            <button onClick={deactivate} style={{
              background: 'transparent', border: '1px solid rgba(192,97,74,0.4)',
              borderRadius: 8, color: '#c0614a', fontSize: 10, padding: '4px 12px',
              cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase'
            }}>
              STANDBY
            </button>
          )}
        </div>
      </div>

      {/* ADAMA Brain — center stage */}
      <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          onClick={isIdle ? activate : () => setActiveAgentId('adama')}
          style={{ cursor: 'pointer' }}
        >
          <AdamaBrain
            isActive={activeAgentId === 'adama' && !isIdle}
            isSpeaking={speakingAgentId === 'adama'}
            size={isIdle ? 180 : 200}
          />
        </div>

        {isIdle && (
          <div style={{
            marginTop: 16, fontSize: 11, color: 'rgba(232,212,168,0.35)',
            letterSpacing: '0.15em', textTransform: 'uppercase',
            animation: 'pulse 3s ease-in-out infinite'
          }}>
            Clap twice or tap to activate
          </div>
        )}
      </div>

      {/* Sibling Orbs */}
      {!isIdle && (
        <div style={{
          display: 'flex', flexWrap: 'wrap',
          justifyContent: 'center', gap: 20, zIndex: 1,
          maxWidth: 680
        }}>
          {SIBLINGS.map(agent => (
            <AgentOrb
              key={agent.id}
              agent={agent}
              isActive={activeAgentId === agent.id}
              isSpeaking={speakingAgentId === agent.id}
              size={protocolStep >= 0 && AGENTS[protocolStep]?.id === agent.id ? 80 : 60}
              onClick={() => {
                setActiveAgentId(agent.id);
                historyRef.current = [];
                speak(`Hey Marz, I'm here. ${agent.name}, ready to help.`, agent.id);
              }}
            />
          ))}
        </div>
      )}

      {/* Subtitle bar */}
      <div style={{
        width: '100%', zIndex: 1,
        display: 'flex', flexDirection: 'column', gap: 8
      }}>
        {/* Mic level */}
        {mode === 'listening' && (
          <div style={{ display: 'flex', gap: 3, justifyContent: 'center', height: 20 }}>
            {Array.from({ length: 24 }).map((_, i) => {
              const barH = Math.max(3, micLevel * 20 * (0.5 + Math.sin(i * 0.8) * 0.5));
              return (
                <div key={i} style={{
                  width: 3, height: barH, borderRadius: 2,
                  background: activeAgent.color,
                  opacity: 0.6 + micLevel * 0.4,
                  alignSelf: 'flex-end',
                  transition: 'height 0.05s'
                }} />
              );
            })}
          </div>
        )}

        {/* Subtitle */}
        {subtitleText && (
          <div style={{
            background: 'rgba(0,0,0,0.7)',
            border: `1px solid ${activeAgent.color}22`,
            borderRadius: 10, padding: '10px 16px',
            fontSize: 13, color: 'rgba(232,212,168,0.85)',
            lineHeight: 1.6, textAlign: 'center',
            maxHeight: 80, overflow: 'hidden'
          }}>
            {subtitleText}
          </div>
        )}

        {/* Status bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: 9, color: 'rgba(232,212,168,0.25)',
          letterSpacing: '0.12em', textTransform: 'uppercase'
        }}>
          <span>
            {mode === 'listening' ? '● REC' : mode === 'processing' ? '◌ PROCESSING' : mode === 'speaking' ? '▶ SPEAKING' : mode === 'protocol' ? '▶ PROTOCOL' : '◉ READY'}
          </span>
          <span>ACTIVE: {activeAgent.name.toUpperCase()}</span>
          <span>3565</span>
        </div>
      </div>

      {/* Skill card during protocol */}
      {skillCardAgent && mode === 'protocol' && (
        <SkillCard agent={skillCardAgent} visible={true} />
      )}

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes pulse { 0%,100%{opacity:0.35} 50%{opacity:0.7} }
      `}</style>
    </div>
  );
}
