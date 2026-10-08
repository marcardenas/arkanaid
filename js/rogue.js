// Modo Rogue: Arkanoid + roguelike. Mapa ramificado, reliquias, maldiciones, eventos y muerte permanente.

const ROGUE_RELICS = {
  // comunes
  sharp:    { icon: '🗡', name: 'Filo',              rarity: 'common',    stack: true, desc: '+1 de daño de la bola', fx: { sharp: 1 } },
  wide:     { icon: '↔', name: 'Plataforma',        rarity: 'common',    stack: true, desc: 'Paleta 20% más ancha', fx: { wide: 0.2 } },
  shield:   { icon: '🛡', name: 'Égida',             rarity: 'common',    stack: true, desc: '+1 barrera al empezar cada nivel', fx: { barrier: 1 } },
  luck:     { icon: '🍀', name: 'Trébol',            rarity: 'common',    stack: true, desc: '+8% de probabilidad de cápsulas', fx: { luck: 0.08 } },
  greed:    { icon: '💎', name: 'Avaricia',          rarity: 'common',    stack: true, desc: '+50% de fragmentos', fx: { shards: 0.5 } },
  slowmo:   { icon: '🐌', name: 'Caracol',           rarity: 'common',    stack: true, desc: 'La bola va 10% más lenta', fx: { slow: 0.1 } },
  memory:   { icon: '🧠', name: 'Memoria',           rarity: 'common',    desc: 'Conservas 60% del combo al tocar la paleta', fx: { memory: 0.6 } },
  magnet:   { icon: '🧲', name: 'Imán eterno',       rarity: 'common',    desc: 'Imán siempre activo', fx: { magnet: 5 } },
  spin:     { icon: '🌀', name: 'Maestro del efecto', rarity: 'common',   stack: true, desc: 'El slice curva el doble', fx: { spin: 1 } },
  // raras
  twin:     { icon: '⚪', name: 'Gemelas',           rarity: 'rare',      stack: true, desc: 'Empiezas cada nivel con una bola extra', fx: { twin: 1 } },
  powder:   { icon: '💥', name: 'Pólvora',           rarity: 'rare',      desc: '12% de que un ladrillo roto explote', fx: { powder: 0.12 } },
  crit:     { icon: '🎯', name: 'Ojo crítico',       rarity: 'rare',      stack: true, desc: '15% de golpe crítico (daño x3)', fx: { crit: 0.15 } },
  feverish: { icon: '🔥', name: 'Calentura',         rarity: 'rare',      desc: 'La FIEBRE se llena 60% más rápido', fx: { fever: 0.6 } },
  hydra:    { icon: '🐍', name: 'Hidra',             rarity: 'rare',      desc: 'Multibola crea 4 bolas por bola en vez de 2', fx: { hydra: 1 } },
  vampire:  { icon: '🦇', name: 'Vampiro',           rarity: 'rare',      desc: 'Cada 50 ladrillos rotos: +1 vida', fx: { vamp: 0.02 } },
  eagle:    { icon: '👁', name: 'Ojo de águila',     rarity: 'rare',      desc: 'Ves los ladrillos invisibles y ves más en la oscuridad', fx: { eagle: 1 } },
  igniter:  { icon: '☄', name: 'Ignición',          rarity: 'rare',      desc: 'Empiezas cada nivel con 6 s de bola de fuego', fx: { ignite: 6 } },
  // legendarias
  cannon:   { icon: '🔫', name: 'Cañón eterno',      rarity: 'legendary', desc: 'Láser permanente', fx: { cannon: 1 } },
  echo:     { icon: '🔊', name: 'Eco',               rarity: 'legendary', desc: '6% de que un ladrillo roto cree una bola nueva', fx: { echo: 0.06 } },
  phoenix:  { icon: '🪶', name: 'Fénix',             rarity: 'legendary', desc: 'Al perder tu última vida, renaces con 2 (se consume)', fx: { phoenix: 1 } },
  juggernaut: { icon: '🔨', name: 'Coloso',          rarity: 'legendary', desc: 'Megabola permanente', fx: { jugg: 1 } },
  pierce:   { icon: '✴', name: 'Perforación',       rarity: 'legendary', desc: 'Cada 8 toques de paleta: 3 s de bola de fuego', fx: { pierce: 1 } },
  // maldiciones
  c_fast:   { icon: '💢', name: 'Prisa',             rarity: 'curse',     desc: 'La bola va 15% más rápida', fx: { fast: 0.15 } },
  c_small:  { icon: '🔻', name: 'Atrofia',           rarity: 'curse',     desc: 'Paleta 15% más pequeña', fx: { small: 0.15 } },
  c_dark:   { icon: '🌑', name: 'Penumbra',          rarity: 'curse',     desc: 'Todos los niveles a oscuras', fx: { dark: 1 } },
  c_greed:  { icon: '🕳', name: 'Agujero',           rarity: 'curse',     desc: '−30% de fragmentos', fx: { shards: -0.3 } },
};

const ROGUE_MODS = {
  dark:    { icon: '🌑', name: 'Oscuridad' },
  armored: { icon: '🛡', name: 'Blindados' },
  fast:    { icon: '⚡', name: 'Veloz' },
  regen:   { icon: '🌱', name: 'Regeneración' },
  drones:  { icon: '🛸', name: 'Enjambre' },
  small:   { icon: '🔻', name: 'Paleta reducida' },
};

const Rogue = (() => {
  const $ = s => document.querySelector(s);
  const ROWS = 7, ACTS = 3;
  const RARITY = {
    common:    { name: 'Común',      color: '#c0c6d6', cost: 45 },
    rare:      { name: 'Rara',       color: '#2ec4f1', cost: 80 },
    legendary: { name: 'Legendaria', color: '#ffcf33', cost: 140 },
    curse:     { name: 'Maldición',  color: '#ff4d6d', cost: 0 },
  };
  const NODES = {
    combat:   { icon: '⚔', name: 'Combate' },
    elite:    { icon: '💀', name: 'Élite' },
    event:    { icon: '❓', name: 'Evento' },
    shop:     { icon: '🛒', name: 'Tienda' },
    rest:     { icon: '🔥', name: 'Descanso' },
    treasure: { icon: '💎', name: 'Tesoro' },
    boss:     { icon: '☠', name: 'Jefe' },
  };
  const shard = '<b class="shard">◆</b>';
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const fmt = n => Math.floor(n).toLocaleString('es-CL');
  let R = null;

  const unlocked = () => Unlocks.has('rogue');
  const hasSave = () => !!Save.d.rogueRun;
  const persist = () => { Save.d.rogueRun = R; Save.save(); };
  const relicCount = () => Object.entries(R.relics).filter(([id, n]) => n && ROGUE_RELICS[id].rarity !== 'curse').reduce((a, [, n]) => a + n, 0);
  const curses = () => Object.keys(R.relics).filter(id => R.relics[id] && ROGUE_RELICS[id].rarity === 'curse');
  const shardMult = () => Math.max(0.2, 1 + 0.5 * (R.relics.greed || 0) - (R.relics.c_greed ? 0.3 : 0) + Skills.val('shards'));

  // ---------- Mapa ----------
  function weighted(table) {
    let total = 0;
    for (const [, w] of table) total += w;
    let v = Math.random() * total;
    for (const [k, w] of table) { v -= w; if (v <= 0) return k; }
    return table[0][0];
  }

  function rollMods(n) {
    const ids = Object.keys(ROGUE_MODS).sort(() => Math.random() - 0.5);
    return ids.slice(0, n);
  }

  function genMap(act) {
    const map = [];
    for (let r = 0; r < ROWS; r++) {
      if (r === ROWS - 1) { map.push([{ lane: 1, type: 'boss', mods: [], visited: false }]); continue; }
      const lanes = r === 0 ? [0, 1, 2] : [1].concat([0, 2].filter(() => Math.random() < 0.65)).sort();
      map.push(lanes.map(lane => {
        let type;
        if (r === 0) type = 'combat';
        else if (r === ROWS - 2) type = weighted([['rest', 3], ['shop', 2]]);
        else type = weighted([
          ['combat', 45], ['elite', r >= 2 ? 14 : 0], ['event', 16], ['shop', 9], ['rest', 7], ['treasure', r === 3 ? 12 : 4],
        ]);
        let mods = [];
        if (type === 'elite') mods = rollMods(act >= 3 ? 3 : 2);
        else if (type === 'combat' && Math.random() < 0.25 * act) mods = rollMods(1);
        return { lane, type, mods, visited: false };
      }));
    }
    return map;
  }

  function reachable() {
    if (R.row >= ROWS - 1) return [];
    const next = R.map[R.row + 1];
    if (R.row < 0) return next;
    return next.filter(n => Math.abs(n.lane - R.lane) <= 1);
  }

  // ---------- Reliquias ----------
  function offers(n, src) {
    const tables = {
      start:    [['common', 1]],
      combat:   [['common', 70], ['rare', 25], ['legendary', 5]],
      elite:    [['common', 20], ['rare', 60], ['legendary', 20]],
      treasure: [['rare', 70], ['legendary', 30]],
      boss:     [['legendary', 100]],
      rest:     [['common', 1]],
    };
    const out = [];
    for (let i = 0; i < n * 6 && out.length < n; i++) {
      const rarity = weighted(tables[src] || tables.combat);
      const pool = Object.keys(ROGUE_RELICS).filter(id => {
        const r = ROGUE_RELICS[id];
        return r.rarity === rarity && !out.includes(id) && (r.stack || !R.relics[id]);
      });
      if (pool.length) out.push(pick(pool));
    }
    if (out.length < n) {
      const any = Object.keys(ROGUE_RELICS).filter(id => ROGUE_RELICS[id].rarity !== 'curse' && !out.includes(id) && (ROGUE_RELICS[id].stack || !R.relics[id]));
      while (out.length < n && any.length) out.push(any.splice(Math.floor(Math.random() * any.length), 1)[0]);
    }
    return out;
  }

  function takeRelic(id) {
    R.relics[id] = (R.relics[id] || 0) + 1;
    if (relicCount() >= 10) Game.ach('relic10', true);
  }

  function addCurse() {
    const id = pick(Object.keys(ROGUE_RELICS).filter(k => ROGUE_RELICS[k].rarity === 'curse'));
    R.relics[id] = 1;
    return id;
  }

  // ---------- Eventos ----------
  const EVENTS = {
    altar: {
      icon: '🩸', title: 'Altar de sangre', text: 'Un altar late con energía oscura. Exige un sacrificio.',
      options: [
        { label: 'Sacrificar 1 vida → reliquia legendaria', can: () => R.lives > 1, run: () => { R.lives--; return { reward: offers(3, 'boss') }; } },
        { label: 'Alejarse', run: () => ({ msg: 'Te alejas sin mirar atrás.' }) },
      ],
    },
    gamble: {
      icon: '🎲', title: 'El apostador', text: '«¿Doble o nada?», susurra una figura encapuchada.',
      options: [
        { label: 'Apostar la mitad de tus fragmentos', can: () => R.shards >= 10, run: () => {
          const bet = Math.floor(R.shards / 2);
          if (Math.random() < 0.5) { R.shards += bet; return { msg: `¡Ganaste! +${bet} ◆` }; }
          R.shards -= bet;
          return { msg: `Perdiste ${bet} ◆. La casa siempre gana.` };
        } },
        { label: 'Irse', run: () => ({ msg: 'Mejor no tentar a la suerte.' }) },
      ],
    },
    pact: {
      icon: '📜', title: 'Pacto oscuro', text: 'Un contrato flota frente a ti. La letra chica es… muy chica.',
      options: [
        { label: 'Firmar: reliquia rara o mejor + una maldición', run: () => {
          const c = addCurse();
          return { reward: offers(3, 'elite'), msg: `Maldición recibida: ${ROGUE_RELICS[c].icon} ${ROGUE_RELICS[c].name}` };
        } },
        { label: 'Quemar el contrato', run: () => ({ msg: 'Las cenizas se las lleva el viento.' }) },
      ],
    },
    fountain: {
      icon: '⛲', title: 'Fuente sanadora', text: 'Agua cristalina brota entre los escombros.',
      options: [
        { label: 'Beber: +1 vida', run: () => { R.lives++; return { msg: '+1 vida. Te sientes renovado.' }; } },
        { label: 'Beber a fondo: +2 vidas, 50% de maldición', run: () => {
          R.lives += 2;
          if (Math.random() < 0.5) { const c = addCurse(); return { msg: `+2 vidas… pero el agua estaba turbia: ${ROGUE_RELICS[c].icon} ${ROGUE_RELICS[c].name}` }; }
          return { msg: '+2 vidas. ¡Qué suerte!' };
        } },
      ],
    },
    chest: {
      icon: '🧰', title: 'Cofre sospechoso', text: 'Un cofre reluciente. Demasiado reluciente.',
      options: [
        { label: 'Abrirlo (70% reliquia, 30% −1 vida)', run: () => {
          if (Math.random() < 0.7) return { reward: offers(3, 'treasure') };
          R.lives--;
          return { msg: '¡Era un mímico! −1 vida.' };
        } },
        { label: 'Dejarlo', run: () => ({ msg: 'La prudencia también es una virtud.' }) },
      ],
    },
    merchant: {
      icon: '🧙', title: 'Mercader errante', text: '«Tengo algo para ti… por un precio».',
      options: [
        { label: 'Pagar 35 ◆: reliquia aleatoria', can: () => R.shards >= 35, run: () => {
          R.shards -= 35;
          const id = offers(1, 'treasure')[0];
          takeRelic(id);
          return { msg: `Obtienes ${ROGUE_RELICS[id].icon} ${ROGUE_RELICS[id].name}: ${ROGUE_RELICS[id].desc}` };
        } },
        { label: 'Vender 1 vida por 60 ◆', can: () => R.lives > 1, run: () => { R.lives--; R.shards += 60; return { msg: '+60 ◆. Te sientes un poco más frágil.' }; } },
        { label: 'Seguir', run: () => ({ msg: 'El mercader se desvanece en la niebla.' }) },
      ],
    },
    shrine: {
      icon: '⛩', title: 'Santuario olvidado', text: 'Una luz cálida purifica a quien se arrodilla.',
      options: [
        { label: 'Rezar: elimina una maldición', can: () => curses().length > 0, run: () => {
          const c = pick(curses());
          delete R.relics[c];
          return { msg: `${ROGUE_RELICS[c].name} se disipa.` };
        } },
        { label: 'Ofrendar 25 ◆: reliquia común', can: () => R.shards >= 25, run: () => { R.shards -= 25; return { reward: offers(3, 'combat') }; } },
        { label: 'Seguir', run: () => ({ msg: 'Sigues tu camino.' }) },
      ],
    },
  };

  // ---------- Flujo ----------
  function newRun() {
    R = {
      act: 1, row: -1, lane: 1, map: genMap(1), lives: 3 + (Save.d.upgrades.lives || 0) + Skills.val('lives'), shards: 0, phoenixUsed: 0,
      relics: {}, depth: 0, score: 0, node: null,
      stats: { levels: 0, elites: 0, bosses: 0 },
      pending: { kind: 'reward', title: 'Elige tu reliquia inicial', choices: [], shards: 0, src: 'start' },
    };
    R.pending.choices = offers(3, 'start');
    Save.d.rogue.runs++;
    persist();
    render();
  }

  function resume() {
    R = Save.d.rogueRun;
    if (R.pending && R.pending.kind === 'fight') {
      R.pending = null;
      R.lives--;
      UI.toast('Abandonaste un nivel', '−1 vida');
      if (R.lives <= 0) { finish(false); return; }
      persist();
    }
    render();
  }

  function levelFor(node) {
    if (node.type === 'boss') return genLevel(R.act * 5, Math.random);
    let n = Math.round(2 + (R.act - 1) * 9 + R.row * 1.5) + (node.type === 'elite' ? 3 : 0);
    if (n % 5 === 0) n++;
    return genLevel(n, Math.random);
  }

  function enter(rowIdx, lane) {
    const node = R.map[rowIdx].find(n => n.lane === lane);
    if (!node || !reachable().includes(node)) return;
    R.row = rowIdx;
    R.lane = lane;
    node.visited = true;
    R.depth++;
    R.node = { type: node.type, mods: node.mods };
    switch (node.type) {
      case 'combat': case 'elite': case 'boss': {
        R.pending = { kind: 'fight' };
        persist();
        const def = levelFor(node);
        const label = node.type === 'boss' ? `JEFE · ACTO ${R.act}` : node.type === 'elite' ? `ÉLITE · ACTO ${R.act}` : `ACTO ${R.act} · PISO ${R.row + 1}`;
        Game.startRogueLevel(R, def, node.mods, label);
        return;
      }
      case 'event': R.pending = { kind: 'event', id: pick(Object.keys(EVENTS)) }; break;
      case 'shop': R.pending = { kind: 'shop', items: shopItems() }; break;
      case 'rest': R.pending = { kind: 'rest' }; break;
      case 'treasure': R.pending = { kind: 'reward', title: 'Tesoro', choices: offers(3, 'treasure'), shards: 0, src: 'treasure' }; break;
    }
    persist();
    render();
  }

  function onClear(r) {
    R.lives = r.lives;
    R.score = r.score;
    R.stats.levels++;
    const t = R.node.type;
    if (t === 'elite') R.stats.elites++;
    if (t === 'boss') R.stats.bosses++;
    const gain = Math.round((12 + R.depth * 2 + (t === 'elite' ? 20 : 0) + (t === 'boss' ? 50 : 0) + R.node.mods.length * 8) * shardMult());
    R.shards += gain;
    R.pending = {
      kind: 'reward', shards: gain, src: t === 'combat' ? 'combat' : t,
      title: t === 'boss' ? '¡Jefe derrotado!' : t === 'elite' ? '¡Élite derrotada!' : '¡Sector despejado!',
      choices: offers(3, t === 'combat' ? 'combat' : t),
      after: t === 'boss' ? (R.act >= ACTS ? 'win' : 'act') : null,
      stats: { time: r.time, maxChain: r.maxChain, bricks: r.bricks },
    };
    if (t === 'boss' && R.act === 1) Game.ach('rogue1', true);
    persist();
    render();
  }

  function onDeath(r) {
    R.score = r.score;
    R.lives = 0;
    finish(false);
  }

  function onAbandon() {
    if (!R) return;
    R.pending = null;
    R.lives--;
    if (R.lives <= 0) {
      record(false);
      Save.d.rogueRun = null;
      Save.save();
      UI.toast('☠ Run perdida', 'Abandonaste con tu última vida');
      return;
    }
    persist();
    UI.toast('Abandonaste el nivel', `−1 vida · te quedan ${R.lives}`);
  }

  function afterReward() {
    const after = R.pending && R.pending.after;
    R.pending = null;
    if (after === 'win') { finish(true); return; }
    if (after === 'act') {
      R.act++;
      R.row = -1;
      R.lane = 1;
      R.map = genMap(R.act);
      R.lives++;
      UI.toast(`ACTO ${R.act}`, 'Los sectores se vuelven más peligrosos · +1 vida');
    }
    persist();
    render();
  }

  function record(won) {
    const s = Save.d.rogue;
    if (won) s.wins++;
    s.bestDepth = Math.max(s.bestDepth, R.depth);
    s.bestScore = Math.max(s.bestScore, R.score);
    if (R.score > Save.d.highscore) Save.d.highscore = R.score;
    const coins = Math.floor(R.shards * 0.5) + R.depth * 8 + (won ? 300 : 0);
    Save.d.coins += coins;
    return coins;
  }

  function finish(won) {
    const coins = record(won);
    if (won) Game.ach('roguewin', true);
    const relics = Object.entries(R.relics).filter(([, n]) => n).map(([id, n]) => relicChip(id, n)).join('');
    Save.d.rogueRun = null;
    Save.save();
    body(`
      <h2 class="${won ? 'glow-gold' : 'glow-red'}">${won ? '¡RUN COMPLETADA!' : 'FIN DE LA RUN'}</h2>
      <p class="muted">${won ? 'Venciste a los tres jefes. Leyenda.' : `Caíste en el acto ${R.act}, a ${R.depth} salas de profundidad.`}</p>
      <div class="score-big"><span>${fmt(R.score)}</span></div>
      <div class="stats">
        <div><small>Profundidad</small><b>${R.depth}</b></div>
        <div><small>Niveles</small><b>${R.stats.levels}</b></div>
        <div><small>Élites</small><b>${R.stats.elites}</b></div>
        <div><small>Jefes</small><b>${R.stats.bosses}</b></div>
        <div><small>Fragmentos</small><b>${fmt(R.shards)}</b></div>
        <div><small>Monedas ganadas</small><b><i class="coin-ico"></i>+${fmt(coins)}</b></div>
      </div>
      <div class="rg-relics">${relics || '<small class="muted">Sin reliquias</small>'}</div>
      <div class="menu-btns">
        <button class="btn primary" data-act="rg" data-op="new">☠ Nueva run</button>
        <button class="btn sm" data-act="home">Menú</button>
      </div>`);
    R = null;
  }

  // ---------- Tienda ----------
  function shopItems() {
    const items = [...offers(2, 'combat'), ...offers(1, 'elite')]
      .map(id => ({ kind: 'relic', id, cost: RARITY[ROGUE_RELICS[id].rarity].cost + Math.floor(Math.random() * 15), sold: false }));
    items.push({ kind: 'heal', cost: 50, sold: false });
    items.push({ kind: 'purge', cost: 60, sold: false });
    return items;
  }

  // ---------- Render ----------
  function body(html) {
    $('#rg-body').innerHTML = html;
    UI.show('rogue');
  }

  function relicChip(id, n) {
    const r = ROGUE_RELICS[id];
    return `<button class="chip ${r.rarity}" data-act="rg" data-op="info" data-id="${id}" title="${r.name}: ${r.desc}">${r.icon}${n > 1 ? `<sup>${n}</sup>` : ''}</button>`;
  }

  function topBar() {
    const chips = Object.entries(R.relics).filter(([, n]) => n).map(([id, n]) => relicChip(id, n)).join('');
    return `<div class="rg-top">
        <span class="pill">ACTO <b>${R.act}/${ACTS}</b></span>
        <span class="pill">♥ <b>${R.lives}</b></span>
        <span class="pill">${shard} <b>${fmt(R.shards)}</b></span>
        <span class="pill">★ <b>${fmt(R.score)}</b></span>
      </div>
      <div class="rg-relics">${chips || '<small class="muted">Aún no tienes reliquias</small>'}</div>`;
  }

  function relicCard(id, extra) {
    const r = ROGUE_RELICS[id];
    return `<div class="relic-card ${r.rarity}">
      <span class="ico">${r.icon}</span>
      <div class="info"><b>${r.name}</b><small>${r.desc}</small><em>${RARITY[r.rarity].name}${R.relics[id] && r.stack ? ` · tienes ${R.relics[id]}` : ''}</em></div>
      ${extra || ''}
    </div>`;
  }

  function renderMap() {
    const reach = reachable();
    const x = lane => (lane + 0.5) / 3 * 100;
    const y = r => 8 + (ROWS - 1 - r) / (ROWS - 1) * 86;
    let lines = '', nodes = '';
    R.map.forEach((row, r) => {
      for (const n of row) {
        if (r < ROWS - 1) {
          for (const m of R.map[r + 1]) {
            if (Math.abs(m.lane - n.lane) > 1) continue;
            const active = r === R.row && n.lane === R.lane && reach.includes(m);
            const walked = n.visited && m.visited;
            lines += `<line x1="${x(n.lane)}" y1="${y(r)}" x2="${x(m.lane)}" y2="${y(r + 1)}" class="${active ? 'active' : walked ? 'walked' : ''}"/>`;
          }
        }
        const can = reach.includes(n);
        const cur = r === R.row && n.lane === R.lane;
        const info = NODES[n.type];
        const modIcons = n.mods.map(m => ROGUE_MODS[m].icon).join('');
        const title = `${info.name}${n.mods.length ? ' · ' + n.mods.map(m => ROGUE_MODS[m].name).join(', ') : ''}`;
        nodes += `<button class="node ${n.type} ${can ? 'can' : ''} ${n.visited ? 'visited' : ''} ${cur ? 'cur' : ''}"
          style="left:${x(n.lane)}%;top:${y(r)}%" data-act="rg" data-op="go" data-row="${r}" data-lane="${n.lane}" ${can ? '' : 'disabled'} title="${title}">
          ${info.icon}${modIcons ? `<i>${modIcons}</i>` : ''}</button>`;
      }
    });
    body(`
      ${topBar()}
      <div class="rg-map">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">${lines}</svg>
        ${nodes}
      </div>
      <p class="tip">Elige tu próxima sala. ⚔ combate · 💀 élite · ❓ evento · 🛒 tienda · 🔥 descanso · 💎 tesoro · ☠ jefe</p>
      <button class="btn sm" data-act="home">Guardar y salir</button>`);
  }

  function renderReward(p) {
    const s = p.stats;
    const statsHtml = s ? `<div class="stats">
        <div><small>Tiempo</small><b>${Math.floor(s.time / 60)}:${String(Math.floor(s.time % 60)).padStart(2, '0')}</b></div>
        <div><small>Combo máx.</small><b>${s.maxChain}</b></div>
        <div><small>Fragmentos</small><b>${shard}+${p.shards}</b></div>
      </div>` : '';
    const cards = p.choices.map(id => `<button class="pickable" data-act="rg" data-op="pick" data-id="${id}">${relicCard(id)}</button>`).join('');
    body(`
      ${topBar()}
      <h2 class="glow-green">${p.title}</h2>
      ${p.msg ? `<p class="tip">${p.msg}</p>` : ''}
      ${statsHtml}
      <p class="muted">Elige una reliquia</p>
      <div class="list">${cards}</div>
      ${p.src === 'start' ? '' : `<button class="btn sm" data-act="rg" data-op="skip">Saltar (+10 ◆)</button>`}`);
  }

  function renderEvent(p) {
    const ev = EVENTS[p.id];
    const opts = ev.options.map((o, i) => {
      const ok = !o.can || o.can();
      return `<button class="btn" data-act="rg" data-op="choose" data-i="${i}" ${ok ? '' : 'disabled'}>${o.label}</button>`;
    }).join('');
    body(`
      ${topBar()}
      <div class="ev-icon">${ev.icon}</div>
      <h2>${ev.title}</h2>
      <p class="tip">${ev.text}</p>
      <div class="menu-btns">${opts}</div>`);
  }

  function renderMsg(p) {
    body(`
      ${topBar()}
      <div class="ev-icon">${p.icon || '✨'}</div>
      <h2>${p.title || ''}</h2>
      <p class="tip">${p.msg}</p>
      <div class="menu-btns"><button class="btn primary" data-act="rg" data-op="ok">Continuar</button></div>`);
  }

  function renderShop(p) {
    const items = p.items.map((it, i) => {
      const afford = R.shards >= it.cost && !it.sold;
      const btn = `<button class="btn buy" data-act="rg" data-op="buy" data-i="${i}" ${afford && (it.kind !== 'purge' || curses().length) ? '' : 'disabled'}>${it.sold ? 'VENDIDO' : `${shard} ${it.cost}`}</button>`;
      if (it.kind === 'relic') return relicCard(it.id, btn);
      const [icon, name, desc] = it.kind === 'heal'
        ? ['♥', 'Reparación', '+1 vida']
        : ['⛩', 'Purificación', curses().length ? 'Elimina una maldición' : 'No tienes maldiciones'];
      return `<div class="relic-card"><span class="ico">${icon}</span><div class="info"><b>${name}</b><small>${desc}</small></div>${btn}</div>`;
    }).join('');
    body(`
      ${topBar()}
      <h2>🛒 Tienda</h2>
      <div class="list">${items}</div>
      <button class="btn sm" data-act="rg" data-op="ok">Salir de la tienda</button>`);
  }

  function renderRest() {
    body(`
      ${topBar()}
      <div class="ev-icon">🔥</div>
      <h2>Descanso</h2>
      <p class="tip">Una fogata tranquila entre los escombros. Tienes tiempo para una sola cosa.</p>
      <div class="menu-btns">
        <button class="btn" data-act="rg" data-op="rest" data-v="heal">♥ Descansar: +2 vidas</button>
        <button class="btn" data-act="rg" data-op="rest" data-v="meditate">🧘 Meditar: elige 1 de 3 reliquias comunes</button>
        <button class="btn" data-act="rg" data-op="rest" data-v="forage">◆ Rebuscar: +40 fragmentos</button>
      </div>`);
  }

  function render() {
    const p = R.pending;
    if (!p) return renderMap();
    if (p.kind === 'reward') return renderReward(p);
    if (p.kind === 'event') return renderEvent(p);
    if (p.kind === 'msg') return renderMsg(p);
    if (p.kind === 'shop') return renderShop(p);
    if (p.kind === 'rest') return renderRest();
    return renderMap();
  }

  function hub() {
    const s = Save.d.rogue;
    body(`
      <h2 class="glow-red">☠ MODO ROGUE</h2>
      <p class="tip">3 actos, un mapa con caminos que se bifurcan y muerte permanente. Junta <b>reliquias</b> que se combinan entre sí,
        cuídate de las <b>maldiciones</b>, enfrenta élites con modificadores y derrota a los tres jefes. Las vidas no se recuperan entre niveles.</p>
      <div class="stats">
        <div><small>Runs</small><b>${s.runs}</b></div>
        <div><small>Victorias</small><b>${s.wins}</b></div>
        <div><small>Mayor profundidad</small><b>${s.bestDepth}</b></div>
      </div>
      <div class="menu-btns">
        ${hasSave() ? `<button class="btn primary" data-act="rg" data-op="resume">▶ Continuar run <small>Acto ${Save.d.rogueRun.act} · ♥${Save.d.rogueRun.lives}</small></button>` : ''}
        <button class="btn ${hasSave() ? '' : 'primary'}" data-act="rg" data-op="new">☠ Nueva run</button>
        <button class="btn sm" data-act="home">← Volver</button>
      </div>`);
  }

  // ---------- Acciones ----------
  function act(op, ds) {
    if (op === 'new') {
      if (hasSave() && !confirm('Ya tienes una run en curso. ¿Abandonarla y empezar otra?')) return;
      newRun();
      return;
    }
    if (op === 'resume') { resume(); return; }
    if (!R) return;
    const p = R.pending;
    switch (op) {
      case 'go': enter(+ds.row, +ds.lane); break;
      case 'info': {
        const r = ROGUE_RELICS[ds.id];
        UI.toast(`${r.icon} ${r.name}`, r.desc);
        break;
      }
      case 'pick': takeRelic(ds.id); Sfx.buy(); afterReward(); break;
      case 'skip': R.shards += 10; afterReward(); break;
      case 'choose': {
        const o = EVENTS[p.id].options[+ds.i];
        if (o.can && !o.can()) return;
        const res = o.run();
        const ev = EVENTS[p.id];
        if (R.lives <= 0) { finish(false); return; }
        if (res.reward) R.pending = { kind: 'reward', title: ev.title, choices: res.reward, shards: 0, msg: res.msg, src: 'event' };
        else R.pending = { kind: 'msg', icon: ev.icon, title: ev.title, msg: res.msg };
        persist();
        render();
        break;
      }
      case 'ok': R.pending = null; persist(); render(); break;
      case 'buy': {
        const it = p.items[+ds.i];
        if (it.sold || R.shards < it.cost) return;
        if (it.kind === 'purge') {
          const cs = curses();
          if (!cs.length) return;
          delete R.relics[pick(cs)];
        } else if (it.kind === 'heal') R.lives++;
        else takeRelic(it.id);
        R.shards -= it.cost;
        it.sold = true;
        Sfx.buy();
        persist();
        render();
        break;
      }
      case 'rest':
        if (ds.v === 'heal') { R.lives += 2; R.pending = { kind: 'msg', icon: '🔥', title: 'Descanso', msg: '+2 vidas. Duermes profundamente.' }; }
        else if (ds.v === 'forage') { R.shards += 40; R.pending = { kind: 'msg', icon: '🔥', title: 'Descanso', msg: '+40 ◆ entre los escombros.' }; }
        else R.pending = { kind: 'reward', title: 'Meditación', choices: offers(3, 'rest'), shards: 0, src: 'rest' };
        persist();
        render();
        break;
    }
  }

  return { unlocked, hasSave, hub, act, onClear, onDeath, onAbandon, render: () => R && render() };
})();
