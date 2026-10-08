// Pantallas DOM superpuestas al canvas: menú, tienda, logros, pausa, resultados.
const UI = (() => {
  const $ = s => document.querySelector(s);
  const SCREENS = ['menu', 'levels', 'shop', 'ach', 'settings', 'howto', 'pause', 'clear', 'over', 'victory', 'rogue', 'tree', 'profile'];
  const fmt = n => Math.floor(n).toLocaleString('es-CL');
  const coin = '<i class="coin-ico"></i>';
  let current = null, backTo = 'menu', shopTab = 'upgrades', treeSel = null;

  // ---------- Vista del árbol: arrastrar para mover, rueda/pellizco para zoom ----------
  const tv = { x: 0, y: 0, z: 1 };
  function treeUnits() {
    const v = $('#tree-view');
    return 205 / tv.z / Math.max(1, Math.min(v.clientWidth, v.clientHeight));
  }
  function applyTreeView() {
    const v = $('#tree-view'), svg = $('#tree-svg');
    if (!svg) return;
    tv.z = Math.min(5, Math.max(0.7, tv.z));
    tv.x = Math.min(95, Math.max(-95, tv.x));
    tv.y = Math.min(95, Math.max(-95, tv.y));
    const u = treeUnits(), w = v.clientWidth * u, h = v.clientHeight * u;
    svg.setAttribute('viewBox', `${tv.x - w / 2} ${tv.y - h / 2} ${w} ${h}`);
    svg.classList.toggle('far', tv.z < 1.4);
  }
  function zoomAt(factor, cx, cy) {
    const v = $('#tree-view'), rect = v.getBoundingClientRect();
    const u0 = treeUnits();
    const wx = tv.x + (cx - rect.left - rect.width / 2) * u0, wy = tv.y + (cy - rect.top - rect.height / 2) * u0;
    tv.z *= factor;
    tv.z = Math.min(5, Math.max(0.7, tv.z));
    const u1 = treeUnits();
    tv.x = wx - (cx - rect.left - rect.width / 2) * u1;
    tv.y = wy - (cy - rect.top - rect.height / 2) * u1;
    applyTreeView();
  }
  (function treeControls() {
    const v = $('#tree-view'), ptrs = new Map();
    let moved = 0, pinch = null;
    const dist = () => { const [a, b] = [...ptrs.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
    v.addEventListener('pointerdown', e => {
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 1) moved = 0;
      if (ptrs.size === 2) pinch = { d: dist(), z: tv.z };
    });
    v.addEventListener('pointermove', e => {
      const p = ptrs.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 1) {
        moved += Math.abs(dx) + Math.abs(dy);
        if (moved > 6) {
          const u = treeUnits();
          tv.x -= dx * u;
          tv.y -= dy * u;
          applyTreeView();
        }
      } else if (ptrs.size === 2 && pinch) {
        moved = 99;
        const [a, b] = [...ptrs.values()];
        const f = pinch.z * dist() / pinch.d / tv.z;
        zoomAt(f, (a.x + b.x) / 2, (a.y + b.y) / 2);
      }
    });
    const end = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; };
    v.addEventListener('pointerup', end);
    v.addEventListener('pointercancel', end);
    v.addEventListener('pointerleave', end);
    v.addEventListener('click', e => { if (moved > 6) { e.stopPropagation(); e.preventDefault(); } }, true);
    v.addEventListener('wheel', e => { e.preventDefault(); zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY); }, { passive: false });
    window.addEventListener('resize', applyTreeView);
  })();

  const treeColor = n => (n.kind === 'ultimate' ? '#ffffff' : SKILL_BRANCHES[n.branch].color);
  const KIND_LABEL = { minor: 'Tránsito', gate: 'Puerta', spur: 'Sendero', notable: 'Notable', active: 'Habilidad activa', keystone: 'Clave', ultimate: 'Trascendencia', class: 'Clase' };
  let clsPickerOpen = false;

  function renderDetail() {
    if (!Skills.node(treeSel)) treeSel = `cls_${Save.d.skills.cls || 'titan'}`;
    const n = Skills.node(treeSel), r = Skills.rank(n.id), col = treeColor(n);
    const branch = n.kind === 'ultimate' ? 'Trascendencia' : SKILL_BRANCHES[n.branch].name;
    let desc = n.desc, extra = '', btn;
    if (n.kind === 'class') {
      const c = CLASSES[n.cls], a = ACTIVES[c.active];
      desc = `${c.desc} Habilidad inicial: ${a.icon} ${a.name}.`;
      const role = Save.d.skills.cls === n.cls ? 'PRINCIPAL' : Skills.cls2() && Save.d.skills.cls2 === n.cls ? 'SECUNDARIA' : null;
      btn = role ? `<button class="btn buy" disabled>${role}</button>` : `<button class="btn buy" data-act="clspick">Elegir</button>`;
    } else {
      if (n.active) { const a = ACTIVES[n.active]; desc = `${a.icon} ${a.name}: ${a.desc} (recarga ${a.cd} s). Además +10% de recarga de habilidades${Skills.cls() && Skills.cls().active === n.active ? ' (tu clase ya la tiene)' : ''}`; }
      const lockTxt = !Skills.cls() ? 'Elige una clase primero' : n.reqAll ? 'Requiere llegar por ambos caminos' : 'Requiere un nodo conectado';
      extra = `Rango ${r}/${n.max}${!Skills.unlockedReq(n) && r < n.max ? ' · ' + lockTxt : ''}`;
      btn = `<button class="btn buy" data-act="skbuy" data-id="${n.id}" ${Skills.canBuy(n) ? '' : 'disabled'}>${r >= n.max ? 'MÁX' : `${Skills.cost(n)} PH`}</button>`;
    }
    $('#tree-detail').innerHTML = `
      <span class="ico" style="--c:${col}">${n.icon || '◆'}</span>
      <div class="info">
        <b>${n.name} <em style="color:${col}">${KIND_LABEL[n.kind]} · ${branch}</em></b>
        <small>${desc}${n.max > 1 ? ' (por rango)' : ''}</small>
        ${extra ? `<small class="muted">${extra}</small>` : ''}
      </div>
      ${btn}`;
  }

  function renderSlots() {
    const eq = Skills.equipped(), have = Skills.actives();
    $('#act-slots').innerHTML = `<small class="muted">Activas (${have.length}/${Object.keys(ACTIVES).length})</small>` + eq.map((id, i) => {
      const a = id && ACTIVES[id];
      return `<button class="slot" data-act="slot" data-i="${i}" ${have.length ? '' : 'disabled'}><kbd>${'QER'[i]}</kbd>${a ? `${a.icon} ${a.name}` : '— vacío —'}</button>`;
    }).join('');
  }

  let pickerSlot = 'primary';
  function renderClassPicker() {
    const sk = Save.d.skills, cur = sk.cls, cur2 = Skills.cls2() ? sk.cls2 : null;
    if (!cur) pickerSlot = 'primary';
    const second = pickerSlot === 'secondary';
    const open2 = Skills.secondaryOpen();
    const tabs = cur ? `<div class="tabs">
        <button class="tab ${second ? '' : 'on'}" data-act="clsslot" data-slot="primary">Principal</button>
        <button class="tab ${second ? 'on' : ''}" data-act="clsslot" data-slot="secondary">Secundaria ${open2 ? '' : '🔒 Nv 10'}</button>
      </div>` : '';
    const head = !cur ? 'Elige tu clase'
      : second ? (open2 ? `Clase secundaria: bono al ${Progress.has(25) ? '100' : '50'}%, su habilidad y un segundo punto de partida` : `Se desbloquea en el nivel 10 (vas en el ${Progress.level()})`)
      : 'Cambiar la clase principal (se devuelven todos los PH)';
    const cards = Object.entries(CLASSES).map(([id, c]) => {
      const a = ACTIVES[c.active], b = SKILL_BRANCHES[c.home];
      const isCur = second ? id === cur2 : id === cur;
      const disabled = second && (!open2 || id === cur);
      return `<button class="cls-card ${isCur ? 'cur' : ''}" data-act="pickcls" data-id="${id}" data-slot="${pickerSlot}" style="--c:${b.color}" ${disabled ? 'disabled' : ''}>
        <span class="ci">${c.icon}</span><b>${c.name}${second && id === cur ? ' (principal)' : ''}</b><small>${c.desc}</small>
        <em>${a.icon} ${a.name} · inicia en ${b.name}</em></button>`;
    }).join('');
    $('#cls-picker').innerHTML = `${tabs}<h3 class="sub">${head}</h3><div class="cls-grid">${cards}</div>${cur ? '<button class="btn sm" data-act="clsclose">Cerrar</button>' : ''}`;
  }



  function show(id) {
    for (const s of SCREENS) $('#scr-' + s).classList.toggle('show', s === id);
    current = id;
    $('#pauseBtn').classList.toggle('show', !id && Game.isPlaying());
    if (id && render[id]) render[id]();
  }
  const hideAll = () => show(null);

  function open(id) {
    if (['menu', 'pause', 'clear', 'over', 'victory', 'rogue'].includes(current)) backTo = current;
    show(id);
  }

  // ---------- Renderizadores ----------
  const render = {
    menu() {
      const d = Save.d;
      $('#m-coins').textContent = fmt(d.coins);
      $('#m-best').textContent = fmt(d.highscore);
      const st = d.streak.count || 1;
      $('#m-streak').textContent = `${st} día${st > 1 ? 's' : ''}`;
      const next = Math.min(d.unlocked, Game.CAMPAIGN_LEN);
      $('#m-camp').textContent = `Nivel ${next}`;
      $('#m-stars').textContent = `${Game.totalStars()}/${Game.CAMPAIGN_LEN * 3} ★`;
      $('#m-endless').textContent = d.endlessBest ? `Récord ${fmt(d.endlessBest)} · N${d.endlessBestLevel}` : 'Sin límite';
      const today = d.daily.date === Game.todayStr() ? d.daily.best : 0;
      $('#m-daily').textContent = today ? `Hoy: ${fmt(today)}` : 'Nuevo desafío hoy';
      const gate = (btn, small, key, text) => {
        const open = Unlocks.has(key);
        $(btn).disabled = !open;
        $(btn).classList.toggle('locked', !open);
        if (!open) $(small).textContent = `🔒 Supera el nivel ${Unlocks.levelOf(key)}`;
        else if (text != null) $(small).textContent = text;
      };
      gate('#endlessBtn', '#m-endless', 'endless');
      gate('#dailyBtn', '#m-daily', 'daily');
      const rb = $('#rogueBtn'), ok = Rogue.unlocked();
      rb.disabled = !ok;
      rb.classList.toggle('locked', !ok);
      $('#m-rogue').textContent = !ok ? '🔒 Vence el nivel 5' : Rogue.hasSave() ? `Run en curso · Acto ${d.rogueRun.act}` : d.rogue.wins ? `${d.rogue.wins} victoria${d.rogue.wins > 1 ? 's' : ''}` : 'Roguelike';
      const lv = Progress.level();
      $('#m-level').textContent = lv;
      $('#m-xp').style.width = `${Progress.xp() / Progress.need(lv) * 100}%`;
      const nextM = PROFILE_MILESTONES.find(m => m.lv > lv);
      $('#m-xptxt').textContent = nextM ? `${nextM.icon} Nv ${nextM.lv}: ${nextM.name}` : '👑 Todo desbloqueado';
      const cl = Skills.cls();
      const c2 = Skills.cls2();
      $('#m-tree').textContent = `${cl ? cl.icon + (c2 ? c2.icon : '') + ' ' + cl.name + (c2 ? ' / ' + c2.name : '') + ' · ' : 'Elige clase · '}${d.skills.points} PH`;
      const treeOpen = Unlocks.has('tree');
      $('#treeBtn').disabled = !treeOpen;
      $('#treeBtn').classList.toggle('locked', !treeOpen);
      if (!treeOpen) $('#m-tree').textContent = '🔒 Supera el nivel 1';
      $('#treeBtn').classList.toggle('notify', treeOpen && (!cl || Skills.anyAffordable()));
      const n = Object.keys(d.achievements).length;
      $('#m-ach').textContent = `${n}/${ACHIEVEMENTS.length}`;
      const affordable = UPGRADES.some(u => (!u.adv || Unlocks.has('advshop')) && (d.upgrades[u.id] || 0) < u.max && d.coins >= u.cost(d.upgrades[u.id] || 0));
      $('#shopBtn').classList.toggle('notify', affordable);
    },

    levels() {
      const d = Save.d;
      $('#lv-grid').innerHTML = LEVELS.map((l, i) => {
        const n = i + 1, locked = n > d.unlocked, st = d.stars[n] || 0;
        return `<button class="lv ${l.boss ? 'boss' : ''} ${locked ? 'locked' : ''}" data-act="play-level" data-level="${n}" ${locked ? 'disabled' : ''}>
          <b>${locked ? '🔒' : l.boss ? '☠' : n}</b>
          <span class="lv-name">${l.boss ? 'JEFE' : l.name}</span>
          <span class="stars">${'★'.repeat(st)}<em>${'★'.repeat(3 - st)}</em></span>
          ${CAMPAIGN_REWARDS[n] ? `<i class="lv-reward ${st ? 'got' : ''}" title="${CAMPAIGN_REWARDS[n].name}: ${CAMPAIGN_REWARDS[n].desc}">${CAMPAIGN_REWARDS[n].icon}</i>` : ''}
        </button>`;
      }).join('');
    },

    shop() {
      const d = Save.d;
      $('#s-coins').textContent = fmt(d.coins);
      const skinsOpen = Unlocks.has('skins');
      if (!skinsOpen) shopTab = 'upgrades';
      $('#skinsTab').disabled = !skinsOpen;
      $('#skinsTab').textContent = skinsOpen ? 'Estilos' : `Estilos 🔒 N${Unlocks.levelOf('skins')}`;
      document.querySelectorAll('#scr-shop .tab').forEach(t => t.classList.toggle('on', t.dataset.tab === shopTab));
      let html = '';
      if (shopTab === 'upgrades') {
        html = UPGRADES.map(u => {
          const lv = d.upgrades[u.id] || 0, maxed = lv >= u.max, cost = maxed ? 0 : u.cost(lv);
          if (u.adv && !Unlocks.has('advshop')) {
            return `<div class="card locked"><div class="ico">🔒</div>
              <div class="info"><b>${u.name}</b><small>Se desbloquea al superar el nivel ${Unlocks.levelOf('advshop')} de la campaña</small></div></div>`;
          }
          const pips = Array.from({ length: u.max }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('');
          return `<div class="card">
            <div class="ico">${u.icon}</div>
            <div class="info"><b>${u.name}</b><small>${u.desc}</small><div class="pips">${pips}</div></div>
            <button class="btn buy" data-act="buy" data-id="${u.id}" ${maxed || d.coins < cost ? 'disabled' : ''}>${maxed ? 'MÁX' : `${coin}${fmt(cost)}`}</button>
          </div>`;
        }).join('');
      } else {
        for (const kind of ['ball', 'paddle']) {
          html += `<h3 class="sub">${kind === 'ball' ? 'Bolas' : 'Paletas'}</h3><div class="skins">`;
          html += SKINS[kind].map(s => {
            const owned = d.owned[kind].includes(s.id), using = d.skin[kind] === s.id;
            const bg = s.color === 'rainbow' ? 'linear-gradient(90deg,#ff4d6d,#ffd23f,#3ddc84,#2ec4f1,#b06bff)' : s.color;
            const label = using ? 'En uso' : owned ? 'Usar' : `${coin}${fmt(s.cost)}`;
            return `<button class="skin ${using ? 'using' : ''}" data-act="skin" data-kind="${kind}" data-id="${s.id}" ${!owned && d.coins < s.cost ? 'disabled' : ''}>
              <span class="swatch ${kind}" style="background:${bg}"></span><b>${s.name}</b><small>${label}</small></button>`;
          }).join('');
          html += '</div>';
        }
      }
      $('#shop-list').innerHTML = html;
    },

    ach() {
      const d = Save.d;
      const n = Object.keys(d.achievements).length;
      $('#a-count').textContent = `${n}/${ACHIEVEMENTS.length}`;
      $('#ach-list').innerHTML = ACHIEVEMENTS.map(a => {
        const got = !!d.achievements[a.id];
        return `<div class="achv ${got ? 'got' : ''}"><span class="medal">${got ? '🏆' : '🔒'}</span>
          <div><b>${a.name}</b><small>${a.desc}</small></div><span class="rew">${coin}${a.reward}</span></div>`;
      }).join('');
      const s = d.stats;
      $('#stats').innerHTML = [
        ['Ladrillos', s.bricks], ['Combo máx.', s.maxCombo], ['Power-ups', s.powerups],
        ['Jefes', s.bosses], ['Drones', s.enemies], ['Partidas', s.games],
      ].map(([k, v]) => `<div><small>${k}</small><b>${fmt(v || 0)}</b></div>`).join('');
    },

    howto() {
      $('#pw-list').innerHTML = Object.values(POWERUPS).map(p =>
        `<div class="pw"><span class="cap ${p.good ? '' : 'bad'}" style="background:${p.color}">${p.label}</span><div><b>${p.name}</b><small>${p.desc}</small></div></div>`
      ).join('');
    },

    tree() {
      const sk = Save.d.skills, c = Skills.cls();
      $('#t-points').textContent = sk.points;
      $('#t-xp').style.width = `${(sk.xp / Skills.XP_PER_POINT) * 100}%`;
      $('#t-xptxt').textContent = `Próximo PH por puntaje en campaña: ${fmt(sk.xp)} / ${fmt(Skills.XP_PER_POINT)}`;
      const c2 = Skills.cls2();
      $('#t-cls').innerHTML = c ? `${c.icon} ${c.name}${c2 ? ` + ${c2.icon} ${c2.name}` : Skills.secondaryOpen() ? ' + ❔' : ''} ▾` : 'Elegir clase ▾';
      let bg = '', edges = '', nodes = '';
      for (const r of [15, 25, 35, 45, 55, 65, 76, 90]) bg += `<circle r="${r}" class="ring"/>`;
      for (const b of Object.values(SKILL_BRANCHES)) {
        const a = b.angle * Math.PI / 180, sep = a + Math.PI / 12;
        bg += `<path d="M0 0 L${Math.cos(a - Math.PI / 12) * 84} ${Math.sin(a - Math.PI / 12) * 84} A84 84 0 0 1 ${Math.cos(sep) * 84} ${Math.sin(sep) * 84} Z" class="wedge" fill="${b.color}"/>`;
        bg += `<line x1="${Math.cos(sep) * 11}" y1="${Math.sin(sep) * 11}" x2="${Math.cos(sep) * 84}" y2="${Math.sin(sep) * 84}" class="sector"/>`;
        const lr = 97;
        let rot = ((b.angle + 90) % 360 + 360) % 360;
        if (rot > 90 && rot < 270) rot -= 180;
        bg += `<text x="${Math.cos(a) * lr}" y="${Math.sin(a) * lr}" class="branch" fill="${b.color}" transform="rotate(${rot} ${Math.cos(a) * lr} ${Math.sin(a) * lr})">${b.name.toUpperCase()}</text>`;
      }
      for (const [a, b] of SKILL_TREE.edges) {
        const p = Skills.node(a), q = Skills.node(b);
        const ra = Skills.rank(a) > 0, rb = Skills.rank(b) > 0;
        const col = treeColor(q.kind === 'minor' || q.kind === 'class' ? p : q);
        edges += `<line x1="${p.x.toFixed(2)}" y1="${p.y.toFixed(2)}" x2="${q.x.toFixed(2)}" y2="${q.y.toFixed(2)}" class="${ra && rb ? 'lit' : ra || rb ? 'avail' : ''}" style="--c:${col}"/>`;
      }
      const SIZE = { minor: 1.05, gate: 1.6, spur: 1.9, notable: 2.4, active: 2.6, keystone: 3.2, ultimate: 3.8, class: 2.3 };
      const oct = r => [0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = Math.PI / 8 + i * Math.PI / 4; return `${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)}`; }).join(' ');
      for (const n of SKILL_TREE) {
        const r = Skills.rank(n.id), size = SIZE[n.kind];
        let cls;
        if (n.kind === 'class') cls = r ? 'maxed' : 'locked';
        else cls = r >= n.max ? 'maxed' : r > 0 ? 'owned' : Skills.unlockedReq(n) ? (Skills.canBuy(n) ? 'buyable' : 'open') : 'locked';
        const shape = n.kind === 'keystone' || n.kind === 'ultimate' ? `<polygon class="body" points="${oct(size)}"/>`
          : n.kind === 'active' ? `<rect class="body" x="${-size}" y="${-size}" width="${size * 2}" height="${size * 2}" rx="${size * 0.35}" transform="rotate(45)"/>`
          : n.kind === 'spur' ? `<polygon class="body" points="0,${-size * 1.15} ${size},0 0,${size * 1.15} ${-size},0"/>`
          : `<circle class="body" r="${size}"/>`;
        const icon = n.icon ? `<text class="ico" font-size="${(size * 1.05).toFixed(2)}">${n.icon}</text>` : '';
        const rk = n.max > 1 ? `<text class="rk" y="${(size + 1.5).toFixed(2)}">${r}/${n.max}</text>` : '';
        nodes += `<g class="sk ${cls} ${n.kind} ${n.id === treeSel ? 'sel' : ''}" data-act="sk" data-id="${n.id}" transform="translate(${n.x.toFixed(2)} ${n.y.toFixed(2)})" style="--c:${treeColor(n)}">
          <circle class="hit" r="${size + 1}"/>${shape}${icon}${rk}</g>`;
      }
      const center = c ? `<text class="emblem" font-size="3.4">${c.icon}</text>` : `<text class="emblem q" font-size="4">?</text>`;
      const c2e = Skills.cls2() ? `<text class="emblem" font-size="1.8" x="2.4" y="2.2">${Skills.cls2().icon}</text>` : '';
      $('#tree-view').innerHTML = `<svg id="tree-svg" preserveAspectRatio="none">
        <defs><filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="0.8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
        <g class="bg">${bg}</g><g class="edges">${edges}</g><g class="nodes">${center}${c2e}${nodes}</g></svg>`;
      applyTreeView();
      renderDetail();
      renderSlots();
      $('#cls-picker').classList.toggle('show', !c || clsPickerOpen);
      if (!c || clsPickerOpen) renderClassPicker();
    },

    profile() {
      const lv = Progress.level();
      $('#pr-level').textContent = lv;
      $('#pr-xp').style.width = `${Progress.xp() / Progress.need(lv) * 100}%`;
      $('#pr-xptxt').textContent = `${fmt(Progress.xp())} / ${fmt(Progress.need(lv))} XP para el nivel ${lv + 1}`;
      $('#pr-list').innerHTML = PROFILE_MILESTONES.map(m => {
        const got = lv >= m.lv;
        return `<div class="achv ${got ? 'got' : ''}"><span class="medal">${got ? m.icon : '🔒'}</span>
          <div><b>Nv ${m.lv} · ${m.name}</b><small>${m.desc}</small></div></div>`;
      }).join('');
    },

    settings() {
      const s = Save.d.settings;
      document.querySelectorAll('[data-act="toggle"]').forEach(b => {
        const on = !!s[b.dataset.key];
        b.classList.toggle('on', on);
        b.querySelector('em').textContent = on ? 'SÍ' : 'NO';
      });
    },
  };

  // ---------- Pantallas de resultado ----------
  function showPause() {
    const rogue = Game.run && Game.run.mode === 'rogue';
    $('#p-restart').style.display = rogue ? 'none' : '';
    $('#p-home').textContent = rogue ? 'Abandonar nivel (−1 vida)' : 'Salir al menú';
    show('pause');
  }

  function showClear(r) {
    $('#c-title').textContent = r.isLast ? '¡CAMPAÑA COMPLETADA!' : '¡NIVEL SUPERADO!';
    $('#c-name').textContent = `Nivel ${r.level} · ${r.name}`;
    $('#c-stars').innerHTML = [0, 1, 2].map(i => `<span class="${i < r.stars ? 'on' : ''}" style="animation-delay:${0.25 + i * 0.25}s">★</span>`).join('');
    const mm = Math.floor(r.time / 60), ss = Math.floor(r.time % 60);
    $('#c-stats').innerHTML = [
      ['Tiempo', `${mm}:${String(ss).padStart(2, '0')}`],
      ['Combo máximo', r.maxChain],
      ['Ladrillos', r.bricks],
      ['Bono de tiempo', `+${fmt(r.timeBonus)}`],
      ['Monedas recogidas', `${coin}${fmt(r.coins)}`],
      ...(r.mode === 'campaign' ? [['Puntos de habilidad', `🌳 +${r.skillPts}`]] : []),
      ['Experiencia', `+${fmt(r.xp)} XP`],
      ['Recompensa', `${coin}+${fmt(r.reward)}`],
      ['Puntaje', fmt(r.score)],
    ].map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join('');
    $('#c-next').innerHTML = r.isLast ? 'Ver final ▶' : 'Siguiente ▶';
    $('#c-unlock').innerHTML = r.unlock ? `<span class="u-ico">${r.unlock.icon}</span><div><small>¡DESBLOQUEADO!</small><b>${r.unlock.name}</b><em>${r.unlock.desc}</em></div>` : '';
    $('#c-unlock').style.display = r.unlock ? '' : 'none';
    const nextR = r.mode === 'campaign' && CAMPAIGN_REWARDS[r.level + 1] && !Unlocks.cleared(r.level + 1) ? CAMPAIGN_REWARDS[r.level + 1] : null;
    $('#c-nextr').textContent = nextR ? `Próximo desbloqueo: ${nextR.icon} ${nextR.name}` : '';
    show('clear');
  }

  function showOver(r) {
    $('#o-score').textContent = fmt(r.score);
    $('#o-best').textContent = fmt(r.best);
    $('#o-new').style.display = r.isNew && r.score > 0 ? 'inline-block' : 'none';
    $('#o-bonus').innerHTML = `${coin}+${fmt(r.bonus)}`;
    $('#o-level').textContent = r.level;
    const cont = $('#o-cont');
    cont.style.display = r.canContinue ? '' : 'none';
    cont.innerHTML = `<span>Continuar aquí · ${coin}${fmt(r.cost)}</span>`;
    cont.disabled = Save.d.coins < r.cost;
    const tips = [
      'Golpea la bola con el borde de la paleta para ángulos más cerrados.',
      'Las cápsulas grises son malas… pero dan +500 puntos.',
      'Encadena ladrillos sin tocar la paleta para subir el multiplicador.',
      'Llena el medidor de FIEBRE para puntos dobles y bola de fuego.',
      'Los ladrillos rojos con bomba explotan en cadena.',
      'Compra «Guardacombo» para no perder todo el combo al tocar la paleta.',
      'Los ladrillos invisibles brillan levemente: ¡fíjate bien!',
      'Con láser activo, mantén presionado para disparar en ráfaga.',
      'Cada 400 puntos ganas 1 moneda al terminar la partida.',
    ];
    $('#o-tip').textContent = '💡 ' + tips[Math.floor(Math.random() * tips.length)];
    show('over');
  }

  function showVictory(r) {
    $('#v-score').textContent = fmt(r.score);
    $('#v-bonus').innerHTML = `${coin}+${fmt(r.bonus)}`;
    show('victory');
  }

  // ---------- Toasts ----------
  function toast(title, sub) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<b></b><small></small>`;
    el.querySelector('b').textContent = title;
    el.querySelector('small').textContent = sub || '';
    $('#toasts').appendChild(el);
    setTimeout(() => el.classList.add('out'), 3200);
    setTimeout(() => el.remove(), 3700);
    if (current === 'menu') render.menu();
  }

  // ---------- Acciones ----------
  const actions = {
    campaign: () => Game.startRun('campaign', Math.min(Save.d.unlocked, Game.CAMPAIGN_LEN)),
    'play-level': ds => Game.startRun('campaign', +ds.level),
    endless: () => Game.startRun('endless', 1),
    daily: () => Game.startRun('daily', 1),
    levels: () => open('levels'),
    shop: () => open('shop'),
    ach: () => open('ach'),
    settings: () => open('settings'),
    howto: () => open('howto'),
    back: () => (backTo === 'rogue' ? Rogue.render() : show(backTo)),
    rogue: () => Rogue.hub(),
    tree: () => {
      Object.assign(tv, { x: 0, y: 0, z: 1 });
      clsPickerOpen = false;
      open('tree');
    },
    clspick: () => { clsPickerOpen = true; pickerSlot = Skills.secondaryOpen() && !Skills.cls2() ? 'secondary' : 'primary'; render.tree(); },
    clsclose: () => { clsPickerOpen = false; render.tree(); },
    clsslot: ds => { pickerSlot = ds.slot; render.tree(); },
    profile: () => open('profile'),
    pickcls: ds => {
      if (ds.slot === 'secondary') {
        if (!Skills.secondaryOpen() || ds.id === Save.d.skills.cls) return;
        if (Save.d.skills.cls2 === ds.id) { clsPickerOpen = false; render.tree(); return; }
        if (Skills.spentTotal() && !confirm(`¿Usar ${CLASSES[ds.id].name} como clase secundaria? Se reinicia el árbol y recuperas todos los PH.`)) return;
        Skills.setSecondary(ds.id);
        clsPickerOpen = false;
        treeSel = `cls_${ds.id}`;
        Sfx.buy();
        toast(`🎭 Secundaria: ${CLASSES[ds.id].icon} ${CLASSES[ds.id].name}`, `Habilidad: ${ACTIVES[CLASSES[ds.id].active].name} · nuevo punto de partida`);
        render.tree();
        return;
      }
      const cur = Save.d.skills.cls;
      if (cur === ds.id) { clsPickerOpen = false; render.tree(); return; }
      if (cur && Skills.spentTotal() && !confirm(`¿Cambiar a ${CLASSES[ds.id].name}? Se reinicia el árbol y recuperas todos los PH.`)) return;
      Skills.setClass(ds.id);
      clsPickerOpen = false;
      treeSel = `cls_${ds.id}`;
      Sfx.buy();
      toast(`${CLASSES[ds.id].icon} ${CLASSES[ds.id].name}`, `Habilidad: ${ACTIVES[CLASSES[ds.id].active].name}`);
      render.tree();
    },
    slot: ds => { Skills.cycleSlot(+ds.i); renderSlots(); },
    tzoom: ds => {
      const r = $('#tree-view').getBoundingClientRect();
      if (ds.z === 'reset') { Object.assign(tv, { x: 0, y: 0, z: 1 }); applyTreeView(); }
      else zoomAt(+ds.z, r.left + r.width / 2, r.top + r.height / 2);
    },
    sk: (ds, el) => {
      treeSel = ds.id;
      document.querySelectorAll('.sk.sel').forEach(e => e.classList.remove('sel'));
      el.classList.add('sel');
      renderDetail();
    },
    skbuy: ds => {
      if (!Skills.buy(ds.id)) return;
      Sfx.buy();
      render.tree();
    },
    respec: () => {
      if (!Skills.spentTotal()) return;
      if (!confirm('¿Reiniciar el árbol? Recuperas todos los PH gastados.')) return;
      const n = Skills.respec();
      toast('Árbol reiniciado', `+${n} PH devueltos`);
      render.tree();
    },
    rg: ds => Rogue.act(ds.op, ds),
    home: () => { backTo = 'menu'; Game.toMenu(); },
    resume: () => Game.resume(),
    restart: () => Game.restartLevel(),
    next: () => Game.nextLevel(),
    retry: () => Game.retry(),
    continue: () => Game.continueRun(),
    tab: ds => { shopTab = ds.tab; render.shop(); },
    buy: ds => {
      const u = UPGRADES.find(x => x.id === ds.id);
      if (u.adv && !Unlocks.has('advshop')) return;
      const lv = Save.d.upgrades[u.id] || 0;
      if (lv >= u.max) return;
      const cost = u.cost(lv);
      if (Save.d.coins < cost) return;
      Save.d.coins -= cost;
      Save.d.upgrades[u.id] = lv + 1;
      Save.save();
      Sfx.buy();
      Game.ach('shopper', true);
      render.shop();
    },
    skin: ds => {
      const d = Save.d, s = SKINS[ds.kind].find(x => x.id === ds.id);
      if (!d.owned[ds.kind].includes(s.id)) {
        if (d.coins < s.cost) return;
        d.coins -= s.cost;
        d.owned[ds.kind].push(s.id);
        Sfx.buy();
      }
      d.skin[ds.kind] = s.id;
      Save.save();
      render.shop();
    },
    toggle: ds => {
      const s = Save.d.settings;
      s[ds.key] = !s[ds.key];
      Sfx.setSound(s.sound);
      Sfx.setMusic(s.music);
      Save.save();
      render.settings();
    },
    reset: () => {
      if (!confirm('¿Borrar todo el progreso, monedas y logros? No se puede deshacer.')) return;
      Save.reset();
      Skills.invalidate();
      Sfx.setSound(true);
      Sfx.setMusic(true);
      render.settings();
      toast('Progreso borrado', 'Empiezas de cero.');
    },
  };

  document.getElementById('ui').addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    Sfx.init();
    Sfx.click();
    const fn = actions[b.dataset.act];
    if (fn) fn(b.dataset, b);
  });
  $('#pauseBtn').addEventListener('click', () => { Sfx.init(); Game.pause(); });

  // ---------- Bono diario por racha ----------
  function claimDaily() {
    const t = Game.todayStr(), s = Save.d.streak;
    if (s.last === t) return;
    const y = new Date();
    y.setDate(y.getDate() - 1);
    s.count = s.last === Game.dateStr(y) ? s.count + 1 : 1;
    s.last = t;
    const reward = 20 * Math.min(7, s.count);
    Save.d.coins += reward;
    Save.save();
    setTimeout(() => toast(`🎁 Bono diario: +${reward} monedas`, `Racha de ${s.count} día${s.count > 1 ? 's' : ''}. ¡Vuelve mañana por más!`), 700);
  }

  function boot() {
    claimDaily();
    const old = Skills.syncCampaign();
    if (old) { Save.save(); setTimeout(() => toast(`🌳 +${old} PH`, 'Por tu progreso en la campaña. ¡Revisa el árbol de habilidades!'), 1400); }
    show('menu');
    if (!Save.d.seenHowto) { Save.d.seenHowto = true; Save.save(); backTo = 'menu'; show('howto'); }
  }

  return { show, hideAll, showPause, showClear, showOver, showVictory, toast, boot };
})();

Game.boot();
UI.boot();
