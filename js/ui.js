// Pantallas DOM superpuestas al canvas: menú, tienda, logros, pausa, resultados.
const UI = (() => {
  const $ = s => document.querySelector(s);
  const SCREENS = ['menu', 'levels', 'shop', 'ach', 'settings', 'howto', 'pause', 'clear', 'over', 'victory'];
  const fmt = n => Math.floor(n).toLocaleString('es-CL');
  const coin = '<i class="coin-ico"></i>';
  let current = null, backTo = 'menu', shopTab = 'upgrades';

  function show(id) {
    for (const s of SCREENS) $('#scr-' + s).classList.toggle('show', s === id);
    current = id;
    $('#pauseBtn').classList.toggle('show', !id && Game.isPlaying());
    if (id && render[id]) render[id]();
  }
  const hideAll = () => show(null);

  function open(id) {
    if (['menu', 'pause', 'clear', 'over', 'victory'].includes(current)) backTo = current;
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
      const n = Object.keys(d.achievements).length;
      $('#m-ach').textContent = `${n}/${ACHIEVEMENTS.length}`;
      const affordable = UPGRADES.some(u => (d.upgrades[u.id] || 0) < u.max && d.coins >= u.cost(d.upgrades[u.id] || 0));
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
        </button>`;
      }).join('');
    },

    shop() {
      const d = Save.d;
      $('#s-coins').textContent = fmt(d.coins);
      document.querySelectorAll('#scr-shop .tab').forEach(t => t.classList.toggle('on', t.dataset.tab === shopTab));
      let html = '';
      if (shopTab === 'upgrades') {
        html = UPGRADES.map(u => {
          const lv = d.upgrades[u.id] || 0, maxed = lv >= u.max, cost = maxed ? 0 : u.cost(lv);
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
  function showPause() { show('pause'); }

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
      ['Recompensa', `${coin}+${fmt(r.reward)}`],
      ['Puntaje', fmt(r.score)],
    ].map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join('');
    $('#c-next').innerHTML = r.isLast ? 'Ver final ▶' : 'Siguiente ▶';
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
    back: () => show(backTo),
    home: () => { backTo = 'menu'; Game.toMenu(); },
    resume: () => Game.resume(),
    restart: () => Game.restartLevel(),
    next: () => Game.nextLevel(),
    retry: () => Game.retry(),
    continue: () => Game.continueRun(),
    tab: ds => { shopTab = ds.tab; render.shop(); },
    buy: ds => {
      const u = UPGRADES.find(x => x.id === ds.id);
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
    if (fn) fn(b.dataset);
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
    show('menu');
    if (!Save.d.seenHowto) { Save.d.seenHowto = true; Save.save(); backTo = 'menu'; show('howto'); }
  }

  return { show, hideAll, showPause, showClear, showOver, showVictory, toast, boot };
})();

Game.boot();
UI.boot();
