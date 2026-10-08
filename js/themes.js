// Temas visuales desbloqueables: cambian el render del juego y la interfaz completa.

// Colores base de los ladrillos (BRICK_COLORS y BRICK_TYPES) → colores de cada tema.
const BASE_KEYS = ['#ff4d6d', '#ff8c42', '#ffd23f', '#3ddc84', '#2ec4f1', '#4d7cff', '#b06bff', '#e8ecf5',
  '#a7b0c0', '#79849a', '#5a6273', '#f5b921', '#e0302a', '#19c39b', '#ff6ad5', '#9fb4ff', '#ffcf33', '#8a5cff'];
const remap = list => Object.fromEntries(BASE_KEYS.map((k, i) => [k, list[i]]));

const THEMES = {
  neon: {
    name: 'Neón', icon: '⚡', desc: 'El clásico de Arkanaid: neón violeta y cristal',
    unlock: { type: 'default' },
    bg: 'neon', bricks: 'gloss', glow: 1, pixel: false,
    font: '"Orbitron", "Rajdhani", system-ui, sans-serif', fontScale: 1,
    colors: null,
    ball: '#ffffff', paddle: '#6ea8ff', wall: '#7c5cff', enemy: '#7cf7ff',
    hud: { bg: 'rgba(6,4,20,0.92)', text: '#ffffff', muted: '#8c90b8', coin: '#ffcf33' },
    swatch: ['#05040f', '#7c5cff', '#2ec4f1', '#ff4d6d'],
  },
  synthwave: {
    name: 'Synthwave 80s', icon: '🌅', desc: 'Atardecer retro, sol a rayas y cuadrícula infinita',
    unlock: { type: 'campaign', level: 6 },
    bg: 'synth', bricks: 'gloss', glow: 1.3, pixel: false,
    font: '"Monoton", "Orbitron", system-ui, sans-serif', fontHud: '"Orbitron", system-ui, sans-serif', fontScale: 1,
    colors: remap(['#ff2a6d', '#ff6c11', '#f9c80e', '#2de2e6', '#05d9e8', '#5b6cff', '#d300c5', '#f5e9ff',
      '#9d8ec7', '#6e5d9e', '#3d2f5b', '#ffb000', '#ff184c', '#00f5d4', '#ff71ce', '#b967ff', '#ffd319', '#b967ff']),
    ball: '#fff2fb', paddle: '#05d9e8', wall: '#ff2a6d', enemy: '#2de2e6',
    hud: { bg: 'rgba(26,11,46,0.94)', text: '#fff2fb', muted: '#ff71ce', coin: '#f9c80e' },
    swatch: ['#1a0b2e', '#ff2a6d', '#ff9e00', '#05d9e8'],
  },
  pixel: {
    name: 'Pixel CRT', icon: '👾', desc: '8 bits de verdad, chiptune visual y pantalla de tubo',
    unlock: { type: 'coins', cost: 500 },
    bg: 'pixel', bricks: 'pixel', glow: 0, pixel: true,
    font: '"Press Start 2P", monospace', fontScale: 0.78,
    colors: remap(['#e43b44', '#f77622', '#feae34', '#63c74d', '#2ce8f5', '#0099db', '#b55088', '#ffffff',
      '#c0cbdc', '#8b9bb4', '#5a6988', '#feae34', '#a22633', '#3e8948', '#f6757a', '#c0cbdc', '#fee761', '#68386c']),
    ball: '#ffffff', paddle: '#c0cbdc', wall: '#3a4466', enemy: '#2ce8f5',
    hud: { bg: '#181425', text: '#ffffff', muted: '#8b9bb4', coin: '#feae34' },
    swatch: ['#0f0f1b', '#e43b44', '#feae34', '#0099db'],
  },
  pastel: {
    name: 'Pastel minimal', icon: '🌸', desc: 'Claro, suave y redondeado',
    unlock: { type: 'account', level: 8 },
    bg: 'pastel', bricks: 'pastel', glow: 0, pixel: false, light: true,
    font: '"Fredoka", "Rajdhani", system-ui, sans-serif', fontScale: 1.05,
    colors: remap(['#f4a6a6', '#f8c49c', '#f7dc9a', '#b5dfc0', '#a9dbe6', '#b3c7f2', '#d4c1f0', '#e9e4dc',
      '#c9c3ba', '#a8a197', '#7d776f', '#f1c26b', '#ec8a8a', '#8fd1b3', '#f2b6d6', '#cfd8f5', '#f6d27a', '#c3a8ec']),
    ball: '#3b352d', paddle: '#3b352d', wall: '#d9cfc1', enemy: '#8fb8e8',
    hud: { bg: 'rgba(244,239,230,0.96)', text: '#3b352d', muted: '#8a8275', coin: '#c98a1b' },
    swatch: ['#f4efe6', '#f4a6a6', '#b5dfc0', '#b3c7f2'],
  },
  tron: {
    name: 'Tron holográfico', icon: '💠', desc: 'Contornos de luz sobre una red hexagonal',
    unlock: { type: 'campaign', level: 15 },
    bg: 'tron', bricks: 'outline', glow: 1.5, pixel: false,
    font: '"Orbitron", system-ui, sans-serif', fontScale: 1,
    colors: remap(['#ff3864', '#ff7a00', '#ffd000', '#00ff9c', '#00e5ff', '#2f7bff', '#b84dff', '#e6fdff',
      '#8fdcff', '#4fb6d9', '#3a5566', '#ffcc00', '#ff3b3b', '#00ff9c', '#ff4fd8', '#6ef0ff', '#ffd000', '#b84dff']),
    ball: '#e6fdff', paddle: '#00e5ff', wall: '#00e5ff', enemy: '#ff7a00',
    hud: { bg: 'rgba(2,4,10,0.94)', text: '#e6fdff', muted: '#4fb6d9', coin: '#ffd000' },
    swatch: ['#02040a', '#00e5ff', '#ff7a00', '#2f7bff'],
  },
};

const Theme = (() => {
  let cur = THEMES.neon;
  const listeners = [];

  function available(id) {
    const u = THEMES[id].unlock;
    if (u.type === 'default') return true;
    if (u.type === 'campaign') return (Save.d.stars[u.level] || 0) > 0;
    if (u.type === 'account') return Progress.level() >= u.level;
    if (u.type === 'coins') return Save.d.themes.owned.includes(id);
    return false;
  }

  function lockText(id) {
    const u = THEMES[id].unlock;
    if (u.type === 'campaign') return u.level >= LEVELS.length ? 'Completa la campaña' : `Supera el nivel ${u.level}`;
    if (u.type === 'account') return `Llega al nivel de cuenta ${u.level}`;
    if (u.type === 'coins') return `${u.cost} monedas`;
    return '';
  }

  function apply(id) {
    if (!THEMES[id] || !available(id)) id = 'neon';
    cur = THEMES[id];
    Save.d.themes.current = id;
    document.body.dataset.theme = id;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = cur.swatch[0];
    for (const f of listeners) f(cur);
    if (document.fonts && document.fonts.load) document.fonts.load(`12px ${cur.fontHud || cur.font}`).catch(() => {});
  }

  function buy(id) {
    const u = THEMES[id].unlock;
    if (u.type !== 'coins' || available(id) || Save.d.coins < u.cost) return false;
    Save.d.coins -= u.cost;
    Save.d.themes.owned.push(id);
    Save.save();
    return true;
  }

  // Avisa de temas recién disponibles (campaña o nivel de cuenta).
  function checkNew() {
    const seen = Save.d.themes.seen;
    const fresh = Object.keys(THEMES).filter(id => available(id) && !seen.includes(id));
    if (!fresh.length) return [];
    seen.push(...fresh);
    Save.save();
    return fresh.filter(id => THEMES[id].unlock.type !== 'default' && THEMES[id].unlock.type !== 'coins');
  }

  return {
    get cur() { return cur; }, get id() { return Save.d.themes.current; },
    available, lockText, apply, buy, checkNew, onChange: f => listeners.push(f),
    color: hex => (cur.colors && cur.colors[hex]) || hex,
  };
})();
