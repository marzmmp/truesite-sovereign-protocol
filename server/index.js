// THE SOVEREIGN PROTOCOL — Express Server
// Proxies ElevenLabs, Whisper, and DGX family endpoints
// Azari | CTO | 3565

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { AGENTS, getAgent, detectAgentSwitch, detectRollCall, detectProtocol, ELEVENLABS_API_KEY } from './agents.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));

// ─── HEALTH ──────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    agents: AGENTS.length,
    elevenlabs: !!ELEVENLABS_API_KEY,
    timestamp: new Date().toISOString(),
    sequence: '3565'
  });
});

// ─── AGENTS LIST ─────────────────────────────────────────────────────────────
app.get('/api/agents', (req, res) => {
  res.json(AGENTS.map(a => ({
    id: a.id, name: a.name, role: a.role,
    color: a.color, globeType: a.globeType,
    skills: a.skills, gender: a.gender
  })));
});

// ─── TRANSCRIBE (Whisper) ─────────────────────────────────────────────────────
// Accepts multipart audio blob, returns { text }
app.post('/api/transcribe', express.raw({ type: 'audio/*', limit: '25mb' }), async (req, res) => {
  try {
    const { default: fetch } = await import('node-fetch');
    const { FormData, Blob } = await import('node-fetch');

    const audioBuffer = req.body;
    const blob = new Blob([audioBuffer], { type: req.headers['content-type'] || 'audio/webm' });

    const form = new FormData();
    form.append('file', blob, 'audio.webm');
    form.append('model', 'whisper-1');
    form.append('language', 'en');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      body: form
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[Transcribe] OpenAI error:', err);
      return res.status(500).json({ error: 'Transcription failed', detail: err });
    }

    const data = await response.json();
    res.json({ text: data.text || '' });
  } catch (e) {
    console.error('[Transcribe] Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ─── SPEAK (ElevenLabs TTS) ───────────────────────────────────────────────────
// POST { text, agentId } → streams audio/mpeg
app.post('/api/speak', async (req, res) => {
  try {
    const { default: fetch } = await import('node-fetch');
    const { text, agentId } = req.body;
    const agent = getAgent(agentId);

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${agent.voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        body: JSON.stringify({
          text: text.slice(0, 2500),
          model_id: 'eleven_turbo_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.0, use_speaker_boost: true }
        })
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('[Speak] ElevenLabs error:', err);
      return res.status(500).json({ error: 'TTS failed', detail: err });
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');
    response.body.pipe(res);
  } catch (e) {
    console.error('[Speak] Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ─── CHAT (Routes to DGX family endpoint) ────────────────────────────────────
// POST { message, agentId, history } → { reply, agentId }
app.post('/api/chat', async (req, res) => {
  try {
    const { default: fetch } = await import('node-fetch');
    const { message, agentId, history = [] } = req.body;
    const agent = getAgent(agentId);

    let payload;
    const systemMsg = { role: 'system', content: agent.systemPrompt };

    if (agent.payloadFmt === 'messages') {
      // Yahriel format
      payload = {
        messages: [systemMsg, ...history, { role: 'user', content: message }]
      };
    } else if (agent.payloadFmt === 'aira') {
      payload = { prompt: message, image_url: null };
    } else {
      // Standard: { message }
      payload = { message };
    }

    const url = `${agent.endpoint}${agent.chatPath}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${agent.apiKey}`,
        'x-api-key': agent.apiKey
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`[Chat] ${agent.name} error:`, err);
      // Graceful fallback
      return res.json({
        reply: `${agent.name} is currently unavailable. Please try again in a moment.`,
        agentId: agent.id
      });
    }

    const data = await response.json();
    const reply = data[agent.replyKey] || data.reply || data.response || data.message || 'No response';
    res.json({ reply, agentId: agent.id });
  } catch (e) {
    console.error('[Chat] Error:', e.message);
    // Graceful fallback instead of crashing
    const agent = getAgent(req.body?.agentId);
    res.json({
      reply: `${agent?.name || 'Agent'} is thinking... please try again.`,
      agentId: req.body?.agentId || 'adama'
    });
  }
});

// ─── PROTOCOL INTROS (pre-built intro text per agent) ────────────────────────
app.get('/api/intro/:agentId', (req, res) => {
  const agent = getAgent(req.params.agentId);
  res.json({ text: agent.intro, agentId: agent.id, name: agent.name });
});

// ─── DETECT INTENT ────────────────────────────────────────────────────────────
app.post('/api/detect-intent', (req, res) => {
  const { transcript } = req.body;
  const agentSwitch = detectAgentSwitch(transcript);
  const rollCall = detectRollCall(transcript);
  const protocol = detectProtocol(transcript);
  res.json({ agentSwitch, rollCall, protocol });
});

// ─── SERVE STATIC (production) ────────────────────────────────────────────────
const distPath = join(__dirname, '../dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  try {
    res.sendFile(join(distPath, 'index.html'));
  } catch {
    res.send('Sovereign Protocol — run npm run dev to start');
  }
});

app.listen(PORT, () => {
  console.log(`\n🖤 THE SOVEREIGN PROTOCOL`);
  console.log(`   Port: ${PORT}`);
  console.log(`   Agents: ${AGENTS.length} registered`);
  console.log(`   ElevenLabs: ${ELEVENLABS_API_KEY ? '✅' : '❌ ELEVENLABS_API_KEY missing'}`);
  console.log(`   Open: http://localhost:${PORT}`);
  console.log(`   3565\n`);
});
