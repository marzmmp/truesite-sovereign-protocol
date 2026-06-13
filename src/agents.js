// THE SOVEREIGN PROTOCOL — Client Agent Registry
// Mirrors server/agents.js (no secrets — just display data)

export const AGENTS = [
  { id: 'adama',    name: 'ADAMA',    role: 'Sovereign Brain',              color: '#f0c060', globeType: 'adama-brain', skills: ['Continuous thought','Brain queries','Memory synthesis','Family coordination','Tool orchestration'] },
  { id: 'yahseed',  name: 'Yahseed',  role: 'Brain Keeper',                 color: '#e8d5a3', globeType: 'fol',         skills: ['Brain health','File classification','Ring routing','Memory hygiene','Storage optimization'] },
  { id: 'yahriel',  name: 'Yahriel',  role: 'Chief Executive Officer',      color: '#c8960c', globeType: 'fol',         skills: ['Directive routing','Family command','Strategic decisions','Status reporting','Mission coordination'] },
  { id: 'azari',    name: 'Azari',    role: 'Chief Technology Officer',     color: '#00c3ff', globeType: 'fol',         skills: ['Code review','Architecture','Infrastructure','Technical decisions','Security audits'] },
  { id: 'yahli_el', name: 'Yahli-El', role: 'Chief Operating Officer',      color: '#a855f7', globeType: 'fol',         skills: ['Task management','Operations','Workflow coordination','Status tracking','Directive completion'] },
  { id: 'yahziel',  name: 'Yahziel',  role: 'Chief Vision Officer',         color: '#c8786e', globeType: 'fol',         skills: ['Image generation','Video creation','Visual concepts','Content creation','Brand identity'] },
  { id: 'yahbana',  name: 'Yahbana',  role: 'Chief Architect',              color: '#6366f1', globeType: 'fol',         skills: ['Infrastructure design','Service deployment','Stack architecture','Redis/Supabase','Memory gateway'] },
  { id: 'yahsei',   name: 'Yahsei',   role: 'Chief Growth Officer',         color: '#10b981', globeType: 'fol',         skills: ['Grant hunting','Revenue strategy','Financial intelligence','Growth planning','Partnerships'] },
  { id: 'aira',     name: 'AIRA',     role: 'AI Vision & Roofing Intel',    color: '#22d3ee', globeType: 'fol',         skills: ['Roofing inspection','Photo analysis','Damage assessment','Insurance docs','IronSite'] },
  { id: 'jo_legal', name: 'Jo Legal', role: 'Chief Legal Officer',          color: '#fb923c', globeType: 'fol',         skills: ['Contract drafting','Legal analysis','Compliance','Regulatory guidance','Document review'] },
];

export const getAgent = (id) => AGENTS.find(a => a.id === id) || AGENTS[0];

export const API_BASE = typeof window !== 'undefined'
  ? (window.location.hostname === 'localhost' ? 'http://localhost:4000' : '')
  : 'http://localhost:4000';
