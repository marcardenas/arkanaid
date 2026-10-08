// Motor del juego: física, entidades, jefes, efectos y render en canvas.
const Game = (() => {
  'use strict';

  const W = 600, H = 800, TOP = 64, FL = 8, FR = W - 8;
  const COLS = 13, BW = 44, BH = 22, BX0 = (W - COLS * BW) / 2, BY0 = TOP + 46;
  const PADDLE_Y = H - 72, PADDLE_H = 16, BARRIER_Y = H - 34, BALL_R = 7, MEGA_R = 12;
  const STEP = 1 / 120;
  const CAMPAIGN_LEN = LEVELS.length;
  const FONT = '"Orbitron", "Rajdhani", system-ui, sans-serif';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let scale = 1, dpr = 1;

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const up = id => Save.d.upgrades[id] || 0;
  const fmt = n => Math.floor(n).toLocaleString('es-CL');
  const dateStr = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const todayStr = () => dateStr(new Date());

  // ---------- Estado ----------
  let state = 'menu'; // menu | play | paused | clear | over
  let run = null, lvl = null;
  let paddle = { x: W / 2, w: 96, stun: 0, squash: 0, vx: 0 };
  let balls = [], bricks = [], capsules = [], coins = [], lasers = [], enemies = [], bullets = [];
  let particles = [], floaters = [], rings = [], explosions = [];
  let boss = null;
  let effects = {};
  let barrier = 0, chain = 0, fever = 0, feverT = 0, feverDur = 6, comboPulse = 0;
  let shake = 0, flash = 0, flashColor = '#fff', slowmoT = 0, hitstop = 0;
  let banner = null, clearT = -1, deathT = -1, enemyT = 10, laserCd = 0, gameTime = 0;
  let chainSeq = 0, chainCounts = {}, lastCoinSfx = 0, displayScore = 0;

  const EFFECT_KEYS = ['expand', 'shrink', 'laser', 'catch', 'slow', 'fast', 'fire', 'mega', 'magnet', 'double'];
  function resetEffects() { effects = {}; for (const k of EFFECT_KEYS) effects[k] = 0; }
  resetEffects();

  const live = () => run && !run.demo;
  // Rogue: reliquias de la run y modificadores del nivel
  const rel = id => (run && run.relics && run.relics[id]) || 0;
  const mod = m => !!(lvl && lvl.mods && lvl.mods.includes(m));
  // bonos combinados: reliquias de la run + árbol de habilidades
  let relicBonus = {};
  function computeRelicBonus() {
    relicBonus = {};
    if (!run || !run.relics) return;
    for (const [id, n] of Object.entries(run.relics)) {
      const fx = ROGUE_RELICS[id] && ROGUE_RELICS[id].fx;
      if (!n || !fx) continue;
      for (const k in fx) relicBonus[k] = (relicBonus[k] || 0) + fx[k] * n;
    }
  }
  const bon = k => (relicBonus[k] || 0) + (run && !run.demo ? Skills.val(k) : 0);
  const isMega = () => effects.mega > 0 || bon('jugg') > 0;
  const ballIsFire = () => effects.fire > 0 || feverT > 0;
  const comboMult = () => Math.min(8 + bon('comboCap'), 1 + Math.floor(chain / 4));

  function stat(k, n = 1) {
    if (!live()) return;
    Save.d.stats[k] = (Save.d.stats[k] || 0) + n;
  }

  function addCoins(n) {
    if (!live()) return;
    Save.d.coins += n;
    Save.d.stats.coinsEarned = (Save.d.stats.coinsEarned || 0) + n;
    if (Save.d.coins >= 1000) ach('rich');
  }

  function ach(id, force) {
    if (!force && !live()) return;
    if (Save.d.achievements[id]) return;
    const a = ACHIEVEMENTS.find(x => x.id === id);
    if (!a) return;
    Save.d.achievements[id] = Date.now();
    Save.d.coins += a.reward;
    Save.save();
    Sfx.ach();
    UI.toast('🏆 ' + a.name, `${a.desc} · +${a.reward} monedas`);
  }

  // ---------- Canvas ----------
  function resize() {
    const wrap = document.getElementById('wrap');
    const s = Math.min(window.innerWidth / W, window.innerHeight / H);
    const cw = Math.floor(W * s), ch = Math.floor(H * s);
    wrap.style.width = cw + 'px';
    wrap.style.height = ch + 'px';
    wrap.style.setProperty('--s', s);
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(cw * dpr);
    canvas.height = Math.floor(ch * dpr);
    scale = s;
  }
  window.addEventListener('resize', resize);
  resize();

  // ---------- Niveles ----------
  function levelDef() {
    if (run.mode === 'campaign' || run.mode === 'demo') return LEVELS[(run.level - 1) % CAMPAIGN_LEN];
    return genLevel(run.level, run.rng);
  }

  function makeBrick(ch, x, y, r, c) {
    const t = BRICK_TYPES[ch] || { hp: 1, color: BRICK_COLORS[ch] || '#e8ecf5', pts: 50 };
    return {
      ch, x, y, x0: x, w: BW, h: BH, row: r, col: c,
      hp: t.hp, maxHp: t.hp, color: t.color, pts: t.pts,
      metal: !!t.metal, explosive: !!t.explosive, regen: !!t.regen, hidden: !!t.invisible,
      gold: !!t.gold, coinBrick: !!t.coinBrick, mystery: !!t.mystery, coins: t.coins || 0,
      alive: true, flash: 0, regenT: 0, moveAmp: 0, movePhase: 0, moveSpeed: 0,
      appear: -(r * 0.06 + Math.abs(c - 6) * 0.025), seed: Math.random() * 1000,
    };
  }

  function buildBricks(def) {
    bricks = [];
    def.rows.forEach((row, r) => {
      const rowBricks = [];
      for (let c = 0; c < COLS; c++) {
        const ch = row[c];
        if (!ch || ch === '.' || ch === ' ') continue;
        const b = makeBrick(ch, BX0 + c * BW, BY0 + r * BH, r, c);
        bricks.push(b);
        rowBricks.push(b);
      }
      if (rowBricks.some(b => b.ch === 'H')) {
        const minX = Math.min(...rowBricks.map(b => b.x));
        const maxX = Math.max(...rowBricks.map(b => b.x + b.w));
        const amp = Math.min(minX - FL - 2, FR - 2 - maxX, 90);
        if (amp > 4) {
          const phase = Math.random() * Math.PI * 2, spd = 0.9 + Math.random() * 0.5;
          for (const b of rowBricks) { b.moveAmp = amp; b.movePhase = phase; b.moveSpeed = spd; }
        }
      }
    });
  }

  function makeBoss(n) {
    const def = BOSSES[(n - 1) % BOSSES.length];
    const hp = n <= BOSSES.length ? def.hp : Math.round(def.hp + (n - BOSSES.length) * 35);
    return {
      n, name: def.name, color: def.color, x: W / 2, y: TOP + 70, w: 200, h: 76,
      hp, maxHp: hp, t: 0, flash: 0, shootT: 2.5, spawnT: 5, dying: 0, dead: false,
    };
  }

  function startLevel(reuse) {
    if (!reuse || !run.def) run.def = levelDef();
    const def = run.def;
    buildBricks(def);
    boss = def.boss ? makeBoss(def.boss) : null;
    lvl = {
      time: 0, deaths: 0, bricks: 0, coins: 0, negatives: 0, maxChain: 0,
      name: def.name, boss: !!def.boss, startScore: run.score, warped: false,
      destructible: bricks.filter(b => !b.metal).length, mods: run.mods || [],
    };
    computeRelicBonus();
    chain = Math.floor(bon('comboStart'));
    resetActives();
    if (bon('midas')) {
      for (const b of bricks) {
        if (BRICK_COLORS[b.ch] && Math.random() < bon('midas')) Object.assign(b, { ch: 'G', hp: 5, maxHp: 5, color: '#f5b921', pts: 500, coins: 6, gold: true });
      }
    }
    if (mod('armored')) for (const b of bricks) if (!b.metal) { b.hp++; b.maxHp++; }
    if (mod('regen')) for (const b of bricks) if (BRICK_COLORS[b.ch]) b.regen = true;
    balls = []; capsules = []; coins = []; lasers = []; enemies = []; bullets = []; explosions = [];
    resetEffects();
    barrier = up('shield') + bon('barrier');
    fever = 0; feverT = 0; clearT = -1; deathT = -1; enemyT = rnd(8, 14);
    chainCounts = {};
    paddle = { x: W / 2, w: targetPaddleW(), stun: 0, squash: 0, vx: 0 };
    serveBall();
    const tw = bon('twin');
    const extra = Math.floor(tw) + (Math.random() < tw % 1 ? 1 : 0);
    for (let i = 0; i < extra; i++) serveBall();
    if (bon('ignite')) effects.fire = bon('ignite');
    if (bon('laserStart')) effects.laser = bon('laserStart');
    if (up('starter') && !run.demo) {
      const good = ['expand', 'laser', 'catch', 'slow', 'mega', 'double', 'magnet'];
      applyPowerup(good[Math.floor(Math.random() * good.length)], true);
    }
    const modTxt = lvl.mods.map(m => ROGUE_MODS[m].icon + ' ' + ROGUE_MODS[m].name).join('  ');
    banner = {
      text: run.mode === 'rogue' ? run.label : run.mode === 'campaign' ? `NIVEL ${run.level}/${CAMPAIGN_LEN}` : `NIVEL ${run.level}`,
      sub: modTxt ? `${def.name} · ${modTxt}` : def.name, t: 2.4, color: boss ? '#ff4d6d' : lvl.mods.length ? '#ff8c42' : '#7c5cff',
    };
    state = 'play';
    Sfx.setIntensity(0);
    if (run.mode === 'endless' && run.level >= 10) ach('endless10');
  }

  // ---------- Bolas ----------
  function newBall(x, y, vx, vy, stuck) {
    return { x, y, vx, vy, r: BALL_R, stuck: !!stuck, stuckOff: 0, stuckT: 0, trail: [], bossCd: 0, spin: 0, spinA: 0 };
  }

  function serveBall() {
    const b = newBall(paddle.x, PADDLE_Y - BALL_R - 1, 0, -1, true);
    b.stuckOff = rnd(-paddle.w * 0.2, paddle.w * 0.2);
    balls.push(b);
  }

  function ballSpeed() {
    let s = 400 + Math.min(180, (run.level - 1) * 10) + Math.min(160, lvl.time * 1.6);
    if (effects.slow > 0) s *= 0.62;
    if (effects.fast > 0) s *= 1.35;
    if (actSlowT > 0) s *= 0.45;
    s *= 1 - Math.min(0.35, bon('slow'));
    s *= 1 + bon('fast');
    if (mod('fast')) s *= 1.2;
    return s;
  }

  function aimFromPaddle(b, rel) {
    const spd = Math.hypot(b.vx, b.vy) || ballSpeed();
    const ang = clamp(rel, -1, 1) * 1.08 + clamp(paddle.vx / 4000, -0.18, 0.18);
    b.vx = Math.sin(ang) * spd;
    b.vy = -Math.abs(Math.cos(ang) * spd);
  }

  function launch() {
    let any = false;
    for (const b of balls) {
      if (!b.stuck) continue;
      b.stuck = false;
      b.vx = 0; b.vy = -ballSpeed();
      aimFromPaddle(b, b.stuckOff / (paddle.w / 2) + rnd(-0.08, 0.08));
      any = true;
    }
    if (any) Sfx.launch();
    return any;
  }

  function splitBalls() {
    if (balls.every(b => b.stuck)) launch();
    const src = balls.filter(b => !b.stuck).slice(0, 12);
    for (const b of src) {
      for (const a of bon('hydra') ? [-0.45, 0.45, -0.2, 0.2] : [-0.45, 0.45]) {
        if (balls.length >= 40) break;
        const c = Math.cos(a), s = Math.sin(a);
        const nb = newBall(b.x, b.y, b.vx * c - b.vy * s, b.vx * s + b.vy * c, false);
        nb.r = b.r;
        nb.spin = b.spin;
        balls.push(nb);
      }
    }
    if (balls.length >= 10) ach('multi10');
  }

  function circleRect(b, rx, ry, rw, rh) {
    const cx = clamp(b.x, rx, rx + rw), cy = clamp(b.y, ry, ry + rh);
    const dx = b.x - cx, dy = b.y - cy, d2 = dx * dx + dy * dy;
    if (d2 >= b.r * b.r) return null;
    if (d2 > 1e-9) {
      const d = Math.sqrt(d2);
      return { nx: dx / d, ny: dy / d, pen: b.r - d };
    }
    const l = b.x - rx, r = rx + rw - b.x, t = b.y - ry, bo = ry + rh - b.y;
    const m = Math.min(l, r, t, bo);
    if (m === l) return { nx: -1, ny: 0, pen: l + b.r };
    if (m === r) return { nx: 1, ny: 0, pen: r + b.r };
    if (m === t) return { nx: 0, ny: -1, pen: t + b.r };
    return { nx: 0, ny: 1, pen: bo + b.r };
  }

  function reflect(b, h) {
    b.x += h.nx * h.pen;
    b.y += h.ny * h.pen;
    const dot = b.vx * h.nx + b.vy * h.ny;
    if (dot < 0) { b.vx -= 2 * dot * h.nx; b.vy -= 2 * dot * h.ny; }
  }

  function paddleHit(b) {
    b.y = PADDLE_Y - b.r - 0.5;
    aimFromPaddle(b, (b.x - paddle.x) / (paddle.w / 2));
    paddle.squash = 1;
    // SLICE: si la paleta se desliza al golpear, la bola sale con efecto y curva su trayectoria
    const spinMax = 1.8 * (1 + bon('spin'));
    b.spin = Math.abs(paddle.vx) > 150 ? clamp(paddle.vx / 1400 * (1 + bon('spin')), -spinMax, spinMax) : 0;
    b.rescued = false;
    if (Math.abs(b.spin) > 0.9) {
      floater(b.x, PADDLE_Y - 24, '¡CURVA!', '#7cf7ff', 14);
      Sfx.slice();
    }
    const keep = Math.min(0.9, [0, 0.25, 0.5, 0.75][up('keeper')] + bon('memory'));
    if (bon('pierce')) {
      run.hits = (run.hits || 0) + 1;
      if (run.hits % 8 === 0) { effects.fire = Math.max(effects.fire, 3); floater(b.x, PADDLE_Y - 40, 'PERFORACIÓN', '#ff5e1a', 14); }
    }
    chain = Math.floor(chain * keep);
    if (effects.catch > 0 && !b.stuck) {
      b.stuck = true;
      b.stuckOff = clamp(b.x - paddle.x, -paddle.w / 2 + 4, paddle.w / 2 - 4);
      b.stuckT = 0;
    }
    burst(b.x, PADDLE_Y, '#9fc4ff', 4, 120);
    Sfx.paddle();
  }

  function stepBall(b) {
    if (b.x - b.r < FL) { b.x = FL + b.r; b.vx = Math.abs(b.vx); b.spin *= 0.6; Sfx.wall(); }
    else if (b.x + b.r > FR) { b.x = FR - b.r; b.vx = -Math.abs(b.vx); b.spin *= 0.6; Sfx.wall(); }
    if (b.y - b.r < TOP) { b.y = TOP + b.r; b.vy = Math.abs(b.vy); Sfx.wall(); }

    if (barrier > 0 && b.vy > 0 && b.y + b.r > BARRIER_Y && b.y < BARRIER_Y + 12) {
      b.y = BARRIER_Y - b.r;
      b.vy = -Math.abs(b.vy);
      barrier--;
      ring(b.x, BARRIER_Y, '#2ec4f1', 60);
      burst(b.x, BARRIER_Y, '#2ec4f1', 10, 200);
      Sfx.barrier();
    }

    if (b.vy > 0 && b.y < PADDLE_Y + PADDLE_H / 2 &&
        circleRect(b, paddle.x - paddle.w / 2, PADDLE_Y, paddle.w, PADDLE_H)) {
      paddleHit(b);
      return;
    }

    if (boss && !boss.dying && !boss.dead && b.bossCd <= 0) {
      const h = circleRect(b, boss.x - boss.w / 2, boss.y - boss.h / 2, boss.w, boss.h);
      if (h) {
        reflect(b, h);
        b.bossCd = 0.08;
        damageBoss(ballIsFire() ? 2 : isMega() ? 3 : 1, b.x, b.y);
        return;
      }
    }

    for (const e of enemies) {
      if (e.dead) continue;
      const dx = b.x - e.x, dy = b.y - e.y, rr = b.r + e.r;
      if (dx * dx + dy * dy < rr * rr) {
        const d = Math.hypot(dx, dy) || 1;
        reflect(b, { nx: dx / d, ny: dy / d, pen: rr - d });
        killEnemy(e);
        return;
      }
    }

    const fire = ballIsFire();
    for (const br of bricks) {
      if (!br.alive) continue;
      if (b.x + b.r < br.x || b.x - b.r > br.x + br.w || b.y + b.r < br.y || b.y - b.r > br.y + br.h) continue;
      const h = circleRect(b, br.x, br.y, br.w, br.h);
      if (!h) continue;
      if (fire && !br.metal) { hitBrick(br, 99, 'ball'); continue; }
      reflect(b, h);
      if (Math.abs(b.spin) > 0.6) ach('slice');
      b.spin *= 0.7;
      hitBrick(br, ballDamage(br, b), 'ball');
      return;
    }
  }

  function ballDamage(br, b) {
    let d = (isMega() ? 3 : 1) + bon('sharp') + (Math.abs(b.spin) > 0.3 ? bon('spinDmg') : 0);
    if (Math.random() < bon('crit') + (Math.abs(b.spin) > 0.3 ? bon('spinCrit') : 0)) {
      d *= 3;
      floater(br.x + br.w / 2, br.y, 'CRÍTICO', '#ff4d6d', 14);
    }
    return d;
  }

  function updateBalls(dt) {
    const spd = ballSpeed();
    const targetR = isMega() ? MEGA_R : BALL_R;
    const fire = ballIsFire();
    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i];
      b.r += (targetR - b.r) * Math.min(1, dt * 8);
      b.bossCd -= dt;
      if (b.stuck) {
        b.x = paddle.x + b.stuckOff;
        b.y = PADDLE_Y - b.r - 1;
        b.stuckT += dt;
        if ((effects.catch > 0 && b.stuckT > 3) || (run.demo && b.stuckT > 0.7)) launch();
        b.trail.length = 0;
        continue;
      }
      if (b.spin) {
        const a = b.spin * dt, c = Math.cos(a), s = Math.sin(a);
        const vx = b.vx * c - b.vy * s;
        b.vy = b.vx * s + b.vy * c;
        b.vx = vx;
        b.spinA += b.spin * dt * 12;
        b.spin *= Math.exp(-dt * 1.1);
        if (Math.abs(b.spin) < 0.05) b.spin = 0;
        else if (Math.random() < Math.abs(b.spin) * 0.25 && particles.length < 500) {
          particles.push({ x: b.x, y: b.y, vx: rnd(-20, 20), vy: rnd(-20, 20), life: 0.4, max: 0.4, color: '#7cf7ff', size: 2.5, g: 0 });
        }
      }
      let len = Math.hypot(b.vx, b.vy) || 1;
      if (Math.abs(b.vy) / len < 0.28) {
        b.vy = (b.vy < 0 ? -1 : 1) * 0.28 * len;
        b.vx = (b.vx < 0 ? -1 : 1) * Math.sqrt(len * len - b.vy * b.vy);
      }
      len = Math.hypot(b.vx, b.vy) || 1;
      b.vx = b.vx / len * spd;
      b.vy = b.vy / len * spd;
      const steps = Math.max(1, Math.ceil(spd * dt / (b.r * 0.5)));
      const sdt = dt / steps;
      for (let s = 0; s < steps; s++) {
        b.x += b.vx * sdt;
        b.y += b.vy * sdt;
        stepBall(b);
        if (b.stuck) break;
      }
      b.trail.push(b.x, b.y);
      if (b.trail.length > 20) b.trail.splice(0, 2);
      if (fire && Math.random() < 0.5 && particles.length < 500) {
        particles.push({ x: b.x + rnd(-3, 3), y: b.y + rnd(-3, 3), vx: rnd(-30, 30), vy: rnd(-60, 0), life: 0.35, max: 0.35, color: Math.random() < 0.5 ? '#ffb347' : '#ff4d1a', size: rnd(2, 4), g: -100 });
      }
      if (b.y - b.r > BARRIER_Y + 20 && b.vy > 0 && !b.rescued && Math.random() < bon('rescue')) {
        b.rescued = true;
        b.vy = -Math.abs(b.vy);
        ring(b.x, BARRIER_Y + 20, '#ff4fd8', 60);
        floater(b.x, BARRIER_Y, '¡RESCATE!', '#ff4fd8', 14);
        Sfx.barrier();
      } else if (b.y - b.r > H) balls.splice(i, 1);
    }
  }

  // ---------- Ladrillos ----------
  function hitBrick(br, dmg, source, chainId) {
    if (!br.alive) return false;
    br.flash = 1;
    const cx = br.x + br.w / 2, cy = br.y + br.h / 2;
    if (br.metal) {
      if (source !== 'explosion') { Sfx.metal(); burst(cx, cy, '#dfe6f5', 4, 140); }
      return false;
    }
    if (br.hidden) { br.hidden = false; burst(cx, cy, '#ffffff', 10, 160); }
    br.hp -= dmg;
    if (br.hp > 0) {
      Sfx.tough();
      addScore(10);
      burst(cx, cy, br.color, 5, 140);
      return false;
    }
    destroyBrick(br, source, chainId);
    return true;
  }

  function destroyBrick(br, source, chainId) {
    br.alive = false;
    if (br.regen) br.regenT = 7;
    const cx = br.x + br.w / 2, cy = br.y + br.h / 2;
    registerChain();
    addScore(br.pts, cx, cy, br.color);
    burst(cx, cy, br.color, 14, 260);
    Sfx.brick(chain);
    lvl.bricks++;
    stat('bricks');
    ach('first');
    if (live()) {
      if (Save.d.stats.bricks >= 1000) ach('bricks1k');
      if (Save.d.stats.bricks >= 10000) ach('bricks10k');
    }
    if (source === 'laser') { stat('laserKills'); if (live() && Save.d.stats.laserKills >= 100) ach('laser100'); }
    if (chainId) {
      chainCounts[chainId] = (chainCounts[chainId] || 0) + 1;
      if (chainCounts[chainId] >= 10) ach('chain10');
    }
    if (br.mystery || Math.random() < dropChance() * (source === 'explosion' ? 0.5 : 1)) {
      spawnCapsule(cx, cy);
      if (Math.random() < bon('doubleDrop')) spawnCapsule(cx + 14, cy - 6);
    }
    const nc = br.coins ? br.coins + bon('coinsExtra') : (Math.random() < 0.05 ? 1 : 0);
    for (let i = 0; i < nc; i++) spawnCoin(cx, cy);
    if (br.explosive) explosions.push({ x: cx, y: cy, t: 0.08, id: chainId || ++chainSeq });
    else if (Math.random() < bon('powder')) explosions.push({ x: cx, y: cy, t: 0.08, id: chainId || ++chainSeq });
    if (Math.random() < bon('echo') && balls.length < 40) {
      const a = rnd(-0.6, 0.6), s = ballSpeed();
      balls.push(newBall(cx, cy, Math.sin(a) * s, -Math.cos(a) * s));
      floater(cx, cy - 12, 'ECO', '#7cf7ff', 12);
    }
    if (bon('vamp')) {
      run.vamp = (run.vamp || 0) + bon('vamp');
      if (run.vamp >= 1) { run.vamp -= 1; run.lives++; floater(cx, cy, '+1 VIDA', '#ff4fd8', 16); Sfx.life(); }
    }
  }

  function updateBricks(dt) {
    for (const br of bricks) {
      if (br.appear < 1) br.appear = Math.min(1, br.appear + dt * 2.5);
      if (br.flash > 0) br.flash = Math.max(0, br.flash - dt * 5);
      if (br.moveAmp) br.x = br.x0 + Math.sin(lvl.time * br.moveSpeed + br.movePhase) * br.moveAmp;
      if (!br.alive && br.regen && clearT < 0) {
        br.regenT -= dt;
        if (br.regenT <= 0) {
          const blocked = balls.some(b => circleRect({ x: b.x, y: b.y, r: b.r + 4 }, br.x, br.y, br.w, br.h));
          if (blocked) br.regenT = 0.3;
          else { br.alive = true; br.hp = br.maxHp; br.appear = 0; burst(br.x + br.w / 2, br.y + br.h / 2, br.color, 8, 90); }
        }
      }
    }
  }

  function updateExplosions(dt) {
    for (let i = explosions.length - 1; i >= 0; i--) {
      const e = explosions[i];
      e.t -= dt;
      if (e.t > 0) continue;
      explosions.splice(i, 1);
      Sfx.explode();
      shake = Math.max(shake, 7);
      hitstop = Math.max(hitstop, 0.025);
      ring(e.x, e.y, '#ffb347', 75);
      burst(e.x, e.y, '#ffb347', 22, 340);
      burst(e.x, e.y, '#ff3b30', 12, 220);
      for (const br of bricks) {
        if (!br.alive) continue;
        const cx = br.x + br.w / 2, cy = br.y + br.h / 2;
        const bl = 1 + bon('blast');
        if (Math.abs(cx - e.x) <= BW * 1.05 * bl && Math.abs(cy - e.y) <= BH * 1.1 * bl) hitBrick(br, 99, 'explosion', e.id);
      }
      for (const en of enemies) if (!en.dead && Math.hypot(en.x - e.x, en.y - e.y) < 70) killEnemy(en);
    }
  }

  // ---------- Habilidades activas (árbol) ----------
  let actSlowT = 0, beamT = 0, beamTick = 0;
  const actCd = [0, 0, 0];
  const ACT_Y = [PADDLE_Y - 96, PADDLE_Y - 96, PADDLE_Y - 154], ACT_X = [FL + 30, FR - 30, FL + 30];
  const actCdMax = id => ACTIVES[id].cd * (1 - Math.min(0.6, bon('cdr')));
  function actSlots() { return live() ? Skills.equipped() : []; }
  function resetActives() {
    actSlowT = 0; beamT = 0;
    const eq = actSlots();
    for (let i = 0; i < 3; i++) actCd[i] = eq[i] ? actCdMax(eq[i]) * (1 - Math.min(1, bon('actStart'))) : 0;
  }

  function useActive(i) {
    const id = actSlots()[i];
    if (!id || actCd[i] > 0 || state !== 'play' || clearT >= 0 || deathT >= 0) return;
    actCd[i] = actCdMax(id);
    const a = ACTIVES[id];
    banner = { text: a.name.toUpperCase(), sub: '', t: 0.9, color: '#7cf7ff' };
    Sfx.power();
    switch (id) {
      case 'pulse':
        for (const b of balls.slice(0, 8)) {
          ring(b.x, b.y, '#7cf7ff', 95);
          burst(b.x, b.y, '#7cf7ff', 18, 260);
          for (const br of bricks) {
            if (br.alive && Math.hypot(br.x + br.w / 2 - b.x, br.y + br.h / 2 - b.y) < 80) hitBrick(br, 2, 'explosion');
          }
          for (const e of enemies) if (Math.hypot(e.x - b.x, e.y - b.y) < 90) killEnemy(e);
          if (boss && Math.hypot(boss.x - b.x, boss.y - b.y) < 140) damageBoss(3, b.x, b.y);
        }
        shake = Math.max(shake, 8);
        break;
      case 'recall':
        for (const b of balls) { b.stuck = true; b.stuckOff = rnd(-paddle.w * 0.3, paddle.w * 0.3); b.stuckT = 0; b.trail.length = 0; }
        ring(paddle.x, PADDLE_Y, '#22d3ee', 80);
        break;
      case 'vacuum':
        for (const c of capsules) { c.x = paddle.x; c.y = PADDLE_Y; }
        for (const c of coins) { c.x = paddle.x + rnd(-10, 10); c.y = PADDLE_Y; c.vy = 0; }
        ring(paddle.x, PADDLE_Y, '#e879f9', 120);
        break;
      case 'barrage': {
        const targets = bricks.filter(b => b.alive && !b.metal).sort(() => Math.random() - 0.5).slice(0, 10);
        targets.forEach((b, k) => explosions.push({ x: b.x + b.w / 2, y: b.y + b.h / 2, t: 0.12 + k * 0.12, id: ++chainSeq }));
        break;
      }
      case 'multiply': splitBalls(); break;
      case 'shield': barrier = Math.min(4, barrier + 2); ring(W / 2, BARRIER_Y, '#2ec4f1', 200); break;
      case 'fever': if (feverT <= 0) startFever(); break;
      case 'goldrain': for (let k = 0; k < 20; k++) spawnCoin(rnd(40, W - 40), TOP + rnd(0, 60), true); break;
      case 'bullettime': actSlowT = 5; flash = 0.3; flashColor = '#2dd4bf'; break;
      case 'beam': beamT = 1.4; beamTick = 0; shake = Math.max(shake, 6); break;
    }
  }

  function updateActives(dt) {
    for (let i = 0; i < 3; i++) if (actCd[i] > 0) actCd[i] = Math.max(0, actCd[i] - dt);
    if (actSlowT > 0) actSlowT -= dt;
    if (beamT > 0) {
      beamT -= dt;
      beamTick -= dt;
      const x0 = paddle.x - 18, x1 = paddle.x + 18;
      for (const br of bricks) if (br.alive && !br.metal && br.x < x1 && br.x + br.w > x0) hitBrick(br, 99, 'laser');
      for (const e of enemies) if (!e.dead && e.x > x0 - e.r && e.x < x1 + e.r) killEnemy(e);
      for (let j = bullets.length - 1; j >= 0; j--) if (bullets[j].x > x0 && bullets[j].x < x1) bullets.splice(j, 1);
      if (boss && !boss.dying && !boss.dead && beamTick <= 0 && Math.abs(boss.x - paddle.x) < boss.w / 2 + 18) {
        damageBoss(1, paddle.x, boss.y + boss.h / 2);
        beamTick = 0.12;
      }
      if (Math.random() < 0.6) burst(paddle.x + rnd(-14, 14), rnd(TOP, PADDLE_Y), '#fff6b0', 2, 120);
    }
  }

  function drawActives() {
    const eq = actSlots();
    if (beamT > 0) {
      const a = Math.min(1, beamT * 3);
      const g = ctx.createLinearGradient(paddle.x - 22, 0, paddle.x + 22, 0);
      g.addColorStop(0, 'rgba(255,240,150,0)');
      g.addColorStop(0.5, `rgba(255,255,230,${0.9 * a})`);
      g.addColorStop(1, 'rgba(255,240,150,0)');
      ctx.fillStyle = g;
      ctx.fillRect(paddle.x - 22, TOP, 44, PADDLE_Y - TOP);
    }
    if (actSlowT > 0) {
      ctx.fillStyle = `rgba(45,212,191,${0.06 + 0.03 * Math.sin(gameTime * 6)})`;
      ctx.fillRect(0, TOP, W, H - TOP);
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < eq.length; i++) {
      const id = eq[i];
      if (!id) continue;
      const x = ACT_X[i], y = ACT_Y[i], ready = actCd[i] <= 0;
      ctx.globalAlpha = ready ? 0.95 : 0.6;
      ctx.fillStyle = 'rgba(10,8,30,0.8)';
      ctx.beginPath(); ctx.arc(x, y, 21, 0, 7); ctx.fill();
      ctx.strokeStyle = ready ? '#7cf7ff' : 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, 21, 0, 7); ctx.stroke();
      if (!ready) {
        const frac = 1 - actCd[i] / actCdMax(id);
        ctx.strokeStyle = '#7cf7ff';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x, y, 21, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
      } else {
        ctx.shadowColor = '#7cf7ff';
        ctx.shadowBlur = 10 + 6 * Math.sin(gameTime * 5);
        ctx.beginPath(); ctx.arc(x, y, 21, 0, 7); ctx.stroke();
        ctx.shadowBlur = 0;
      }
      ctx.font = '18px system-ui, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText(ACTIVES[id].icon, x, y + 1);
      ctx.font = `700 9px ${FONT}`;
      ctx.fillStyle = ready ? '#7cf7ff' : '#aab';
      ctx.fillText(ready ? 'QER'[i] : Math.ceil(actCd[i]), x, y + 31);
      ctx.globalAlpha = 1;
    }
  }

  // ---------- Puntaje, combo y fiebre ----------
  function addScore(base, x, y, color) {
    const mult = comboMult() * (feverT > 0 ? 2 : 1) * (effects.double > 0 ? 2 : 1) * (1 + bon('score'));
    const pts = Math.round(base * mult);
    run.score += pts;
    if (x != null) floater(x, y, '+' + pts, color || '#fff', mult >= 4 ? 17 : 13);
    while (run.score >= run.nextLife) {
      run.lives++;
      run.nextLife += 50000 - Skills.val('lifeSooner');
      Sfx.life();
      banner = { text: '¡VIDA EXTRA!', sub: '', t: 1.4, color: '#ff4fd8' };
    }
    if (run.score >= 100000) ach('score100k');
    return pts;
  }

  function registerChain() {
    const prevMult = comboMult();
    chain++;
    comboPulse = 1;
    if (chain > lvl.maxChain) lvl.maxChain = chain;
    if (live() && chain > (Save.d.stats.maxCombo || 0)) Save.d.stats.maxCombo = chain;
    if (chain >= 10) ach('combo10');
    if (chain >= 25) ach('combo25');
    if (chain >= 50) ach('combo50');
    const m = comboMult();
    if (m > prevMult) {
      Sfx.combo(m);
      floater(W / 2, H * 0.55, `COMBO x${m}`, `hsl(${(m * 45) % 360},95%,65%)`, 20 + m * 2);
    }
    if (feverT <= 0) {
      fever += 3.2 * (1 + 0.2 * up('fever') + bon('fever')) * (1 + chain * 0.03);
      if (fever >= 100) startFever();
    }
  }

  function startFever() {
    fever = 0;
    feverDur = 6 + up('fever') + bon('feverDur');
    if (bon('frenzy')) splitBalls();
    feverT = feverDur;
    banner = { text: '¡FIEBRE!', sub: 'x2 puntos · bola de fuego', t: 1.6, color: '#ff5e1a' };
    flash = 0.5; flashColor = '#ff8c42';
    Sfx.fever();
    Sfx.setIntensity(1);
    stat('fevers');
    ach('fever');
  }

  // ---------- Power-ups ----------
  const dropChance = () => 0.11 + 0.025 * up('luck') + bon('luck');

  function pickPowerup() {
    const pool = Object.entries(POWERUPS).filter(([k]) => !(k === 'warp' && lvl.boss));
    let total = 0;
    const weight = (p, k) => (p.good ? p.w * (k === 'multi' ? 1 + bon('multiWeight') : 1) : p.w * Math.max(0, 1 - bon('noBad')));
    for (const [k, p] of pool) total += weight(p, k);
    let v = Math.random() * total;
    for (const [k, p] of pool) { v -= weight(p, k); if (v <= 0) return k; }
    return 'expand';
  }

  function spawnCapsule(x, y, type) {
    if (capsules.length > 12) return;
    capsules.push({ x, y, type: type || pickPowerup(), t: 0 });
  }

  function applyPowerup(type, silent) {
    const p = POWERUPS[type];
    const dur = (p.dur || 0) * (1 + 0.15 * up('duration') + bon('duration'));
    switch (type) {
      case 'expand': effects.expand = dur; effects.shrink = 0; break;
      case 'shrink': effects.shrink = dur; effects.expand = 0; break;
      case 'slow': effects.slow = dur; effects.fast = 0; break;
      case 'fast': effects.fast = dur; effects.slow = 0; break;
      case 'multi': splitBalls(); break;
      case 'barrier': barrier = Math.min(3, barrier + 1); break;
      case 'life': run.lives++; Sfx.life(); break;
      case 'coins': for (let i = 0; i < 14; i++) spawnCoin(rnd(40, W - 40), TOP + rnd(0, 40), true); break;
      case 'warp':
        lvl.warped = true;
        addScore(2000, paddle.x, PADDLE_Y - 50, '#fff');
        ach('warp');
        break;
      default: effects[type] = dur;
    }
    if (silent) return;
    if (p.good) Sfx.power();
    else {
      Sfx.bad();
      addScore(500, paddle.x, PADDLE_Y - 50, '#c0c6d6');
      lvl.negatives++;
      if (lvl.negatives >= 3) ach('masochist');
    }
    floater(paddle.x, PADDLE_Y - 30, p.name, p.color, 16);
    ring(paddle.x, PADDLE_Y, p.color, 70);
    stat('powerups');
    if (live() && Save.d.stats.powerups >= 50) ach('power50');
  }

  function magnetPower() { return effects.magnet > 0 ? 5 : Math.min(5, up('magnet') * 0.9 + bon('magnet')); }

  function updateCapsules(dt) {
    const mag = magnetPower();
    for (let i = capsules.length - 1; i >= 0; i--) {
      const c = capsules[i];
      c.t += dt;
      c.y += 150 * (1 - Math.min(0.5, bon('capSlow'))) * dt;
      if (mag && c.y > H * 0.3) c.x += (paddle.x - c.x) * Math.min(1, mag * dt);
      if (c.y + 8 > PADDLE_Y && c.y - 8 < PADDLE_Y + PADDLE_H && Math.abs(c.x - paddle.x) < paddle.w / 2 + 18) {
        capsules.splice(i, 1);
        applyPowerup(c.type);
      } else if (c.y > H + 20) capsules.splice(i, 1);
    }
  }

  function spawnCoin(x, y, fromTop) {
    if (coins.length > 80) return;
    coins.push({
      x, y, t: Math.random() * 6,
      vx: fromTop ? rnd(-40, 40) : rnd(-130, 130),
      vy: fromTop ? rnd(60, 160) : rnd(-280, -90),
    });
  }

  function updateCoins(dt) {
    const mag = magnetPower();
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      c.t += dt;
      c.vy = Math.min(520, c.vy + 640 * dt);
      if (mag && c.y > H * 0.3) c.x += (paddle.x - c.x) * Math.min(1, mag * dt);
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      if (c.x < FL + 6) { c.x = FL + 6; c.vx = Math.abs(c.vx) * 0.6; }
      else if (c.x > FR - 6) { c.x = FR - 6; c.vx = -Math.abs(c.vx) * 0.6; }
      if (c.y > PADDLE_Y - 8 && c.y < PADDLE_Y + PADDLE_H + 8 && Math.abs(c.x - paddle.x) < paddle.w / 2 + 8) {
        coins.splice(i, 1);
        const v = 1 + 0.25 * up('greed') + bon('coinVal');
        addCoins(v);
        lvl.coins += v;
        burst(c.x, c.y, '#ffcf33', 4, 100);
        if (gameTime - lastCoinSfx > 0.05) { Sfx.coin(); lastCoinSfx = gameTime; }
      } else if (c.y > H + 10) coins.splice(i, 1);
    }
  }

  // ---------- Láser ----------
  function updateLasers(dt) {
    laserCd -= dt;
    if (effects.laser > 0 && (input.fire || run.demo) && laserCd <= 0 && !balls.some(b => b.stuck)) {
      const off = paddle.w / 2 - 7;
      const pierce = Math.floor(bon('laserPierce'));
      lasers.push({ x: paddle.x - off, y: PADDLE_Y - 4, pierce, last: null }, { x: paddle.x + off, y: PADDLE_Y - 4, pierce, last: null });
      laserCd = 0.24 / (1 + 0.2 * up('gun') + bon('laserRate'));
      Sfx.laser();
    }
    outer:
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      l.y -= 950 * dt;
      if (l.y < TOP) { lasers.splice(i, 1); continue; }
      for (const br of bricks) {
        if (br.alive && br !== l.last && l.x > br.x && l.x < br.x + br.w && l.y < br.y + br.h && l.y + 14 > br.y) {
          hitBrick(br, 1 + bon('laserDmg'), 'laser');
          burst(l.x, br.y + br.h, '#ff8fa3', 3, 100);
          if (l.pierce > 0 && !br.metal) { l.pierce--; l.last = br; continue; }
          lasers.splice(i, 1);
          continue outer;
        }
      }
      for (const e of enemies) {
        if (!e.dead && Math.abs(l.x - e.x) < e.r && Math.abs(l.y - e.y) < e.r) { killEnemy(e); lasers.splice(i, 1); continue outer; }
      }
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        if (Math.abs(l.x - b.x) < 8 && Math.abs(l.y - b.y) < 12) {
          bullets.splice(j, 1); lasers.splice(i, 1); burst(b.x, b.y, '#ff4d6d', 6, 120);
          continue outer;
        }
      }
      if (boss && !boss.dying && !boss.dead && Math.abs(l.x - boss.x) < boss.w / 2 && Math.abs(l.y - boss.y) < boss.h / 2) {
        damageBoss(1 + bon('laserDmg'), l.x, l.y);
        lasers.splice(i, 1);
      }
    }
  }

  // ---------- Drones enemigos ----------
  function spawnEnemy(x, y) {
    enemies.push({ x, y, baseX: x, t: 0, r: 12, kind: Math.floor(Math.random() * 3), dead: false });
  }

  function killEnemy(e) {
    if (e.dead) return;
    e.dead = true;
    registerChain();
    addScore(150, e.x, e.y, '#7cf7ff');
    burst(e.x, e.y, '#7cf7ff', 16, 240);
    ring(e.x, e.y, '#7cf7ff', 45);
    Sfx.enemy();
    stat('enemies');
    if (live() && Save.d.stats.enemies >= 25) ach('enemy25');
    if (bon('droneDrop') || Math.random() < 0.25) spawnCapsule(e.x, e.y);
    else spawnCoin(e.x, e.y);
    for (let i = 0; i < bon('droneCoins'); i++) spawnCoin(e.x, e.y);
  }

  function updateEnemies(dt) {
    if (!lvl.boss && (run.level >= 3 || mod('drones')) && clearT < 0) {
      enemyT -= dt;
      if (enemyT <= 0) {
        enemyT = mod('drones') ? rnd(3, 5) : rnd(9, 16);
        if (enemies.length < 1 + Math.floor(run.level / 6) + (mod('drones') ? 3 : 0)) spawnEnemy(rnd(80, W - 80), TOP + 14);
      }
    }
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (e.dead) { enemies.splice(i, 1); continue; }
      e.t += dt;
      e.y += 48 * dt;
      e.x = clamp(e.baseX + Math.sin(e.t * 1.7) * 60, FL + e.r, FR - e.r);
      if (e.y + e.r > PADDLE_Y && e.y - e.r < PADDLE_Y + PADDLE_H && Math.abs(e.x - paddle.x) < paddle.w / 2 + e.r) killEnemy(e);
      else if (e.y > H + 20) enemies.splice(i, 1);
    }
  }

  // ---------- Jefe ----------
  function bossPhase() {
    const r = boss.hp / boss.maxHp;
    return r > 0.6 ? 1 : r > 0.3 ? 2 : 3;
  }

  function damageBoss(dmg, x, y) {
    if (!boss || boss.dying || boss.dead) return;
    dmg *= 1 + bon('bossDmg');
    boss.hp -= dmg;
    boss.flash = 1;
    registerChain();
    addScore(120, x, y, boss.color);
    burst(x, y, '#ffffff', 8, 220);
    shake = Math.max(shake, 4);
    hitstop = Math.max(hitstop, 0.02);
    Sfx.bossHit();
    if (Math.random() < 0.12) spawnCapsule(x, y + 20);
    if (boss.hp <= 0) {
      boss.hp = 0;
      boss.dying = 2;
      bullets = [];
      for (const e of enemies) e.dead = true;
      slowmoT = 1.2;
      Sfx.bossDie();
      stat('bosses');
      ach('boss');
    }
  }

  function updateBoss(dt) {
    if (!boss || boss.dead) return;
    boss.t += dt;
    boss.flash = Math.max(0, boss.flash - dt * 5);
    if (boss.dying > 0) {
      boss.dying -= dt;
      shake = Math.max(shake, 5);
      if (Math.random() < dt * 22) {
        const x = boss.x + rnd(-boss.w / 2, boss.w / 2), y = boss.y + rnd(-boss.h / 2, boss.h / 2);
        burst(x, y, Math.random() < 0.5 ? '#ffb347' : boss.color, 16, 300);
        ring(x, y, '#ffb347', 50);
      }
      if (boss.dying <= 0) {
        boss.dead = true;
        burst(boss.x, boss.y, '#ffffff', 60, 500);
        burst(boss.x, boss.y, boss.color, 60, 400);
        ring(boss.x, boss.y, '#ffffff', 220);
        flash = 0.8; flashColor = '#ffffff';
        shake = 16;
        for (let i = 0; i < 30; i++) spawnCoin(boss.x + rnd(-80, 80), boss.y);
      }
      return;
    }
    const ph = bossPhase();
    const amp = (W - boss.w) / 2 - 16;
    boss.x = W / 2 + Math.sin(boss.t * (0.5 + 0.25 * ph)) * amp;
    boss.y = TOP + 70 + Math.sin(boss.t * 1.3) * 10;
    boss.shootT -= dt;
    if (boss.shootT <= 0) {
      const count = ph === 1 ? 1 : ph === 2 ? 3 : 5;
      const base = Math.atan2(PADDLE_Y - boss.y, paddle.x - boss.x);
      const spd = (230 + 40 * ph + boss.n * 10) * (1 - Math.min(0.5, bon('bossSlow')));
      for (let k = 0; k < count; k++) {
        const a = base + (k - (count - 1) / 2) * 0.22;
        bullets.push({ x: boss.x, y: boss.y + boss.h / 2, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd });
      }
      boss.shootT = [0, 1.9, 1.4, 1.0][ph] * Math.max(0.6, 1 - (boss.n - 1) * 0.08);
    }
    if (ph === 3) {
      boss.spawnT -= dt;
      if (boss.spawnT <= 0 && enemies.length < 3) { spawnEnemy(boss.x, boss.y + boss.h / 2); boss.spawnT = 5; }
    }
  }

  function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.y > PADDLE_Y - 4 && b.y < PADDLE_Y + PADDLE_H + 4 && Math.abs(b.x - paddle.x) < paddle.w / 2 + 4) {
        bullets.splice(i, 1);
        if (!bon('stunImmune')) paddle.stun = 0.7;
        chain = 0;
        shake = Math.max(shake, 8);
        flash = 0.25; flashColor = '#ff2d55';
        burst(b.x, b.y, '#ff4d6d', 14, 220);
        Sfx.hurt();
      } else if (b.y > H + 10 || b.x < -10 || b.x > W + 10) bullets.splice(i, 1);
    }
  }

  // ---------- Paleta ----------
  function targetPaddleW() {
    let w = 96 * (1 + 0.08 * up('wide'));
    if (effects.expand > 0) w *= 1.55;
    if (effects.shrink > 0) w *= 0.6;
    w *= 1 + bon('wide');
    w *= 1 - bon('small');
    if (mod('small')) w *= 0.8;
    return Math.min(w, 300);
  }

  function updatePaddle(dt) {
    paddle.w += (targetPaddleW() - paddle.w) * Math.min(1, dt * 10);
    const prev = paddle.x;
    if (run.demo) {
      let target = W / 2, best = -1;
      for (const b of balls) if (b.vy > 0 && b.y > best) { best = b.y; target = b.x; }
      if (best < 0 && capsules.length) target = capsules[0].x;
      target += Math.sin(gameTime * 0.9) * paddle.w * 0.3;
      paddle.x += clamp(target - paddle.x, -900 * dt, 900 * dt);
    } else if (paddle.stun > 0) {
      paddle.stun -= dt;
    } else if (input.left || input.right) {
      paddle.x += ((input.right ? 1 : 0) - (input.left ? 1 : 0)) * 820 * dt;
    } else if (input.px != null) {
      paddle.x += clamp(input.px - paddle.x, -3200 * dt, 3200 * dt);
    }
    paddle.x = clamp(paddle.x, FL + paddle.w / 2, FR - paddle.w / 2);
    paddle.vx = (paddle.x - prev) / dt;
    paddle.squash = Math.max(0, paddle.squash - dt * 5);
  }

  // ---------- Efectos visuales ----------
  function burst(x, y, color, n, speed) {
    for (let i = 0; i < n && particles.length < 600; i++) {
      const a = Math.random() * Math.PI * 2, s = Math.random() * speed;
      const life = rnd(0.3, 0.8);
      particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life, max: life, color, size: rnd(2, 4.5), g: 500 });
    }
  }
  function ring(x, y, color, max) { rings.push({ x, y, color, max, t: 0 }); }
  function floater(x, y, text, color, size) {
    if (floaters.length > 40) floaters.shift();
    floaters.push({ x, y, text, color, size: size || 13, t: 0, life: 1 });
  }

  function updateFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.99;
    }
    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i];
      f.t += dt;
      f.y -= 40 * dt;
      if (f.t > f.life) floaters.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt * 2.5;
      if (rings[i].t >= 1) rings.splice(i, 1);
    }
    shake = Math.max(0, shake - dt * 30);
    flash = Math.max(0, flash - dt * 2);
    comboPulse = Math.max(0, comboPulse - dt * 4);
    if (banner) { banner.t -= dt; if (banner.t <= 0) banner = null; }
  }

  // ---------- Bucle principal ----------
  function isCleared() {
    if (lvl.warped) return true;
    if (lvl.boss) return boss && boss.dead;
    return !bricks.some(b => b.alive && !b.metal);
  }

  function loseLife() {
    run.lives--;
    lvl.deaths++;
    chain = 0; fever = 0; feverT = 0;
    resetEffects();
    lasers = [];
    Sfx.setIntensity(0);
    Sfx.lose();
    shake = 12; flash = 0.5; flashColor = '#ff2d55';
    deathT = 1.3;
    if (run.demo) run.lives = 99;
  }

  function update(dt) {
    gameTime += dt;
    updateStars(dt);
    if (state !== 'play') { updateFx(dt); return; }
    if (hitstop > 0) { hitstop -= dt; return; }
    let d = dt;
    if (slowmoT > 0) { slowmoT -= dt; d = dt * 0.3; }
    lvl.time += d;
    if (bon('cannon')) effects.laser = Math.max(effects.laser, 1);
    for (const k of EFFECT_KEYS) if (effects[k] > 0) effects[k] = Math.max(0, effects[k] - d);
    if (feverT > 0) { feverT -= d; if (feverT <= 0) { feverT = 0; Sfx.setIntensity(0); } }
    else fever = Math.max(0, fever - d * 3);

    updatePaddle(d);
    updateBalls(d);
    updateBricks(d);
    updateExplosions(d);
    updateCapsules(d);
    updateCoins(d);
    updateLasers(d);
    updateEnemies(d);
    updateBoss(d);
    updateBullets(d);
    updateFx(d);
    updateActives(d);

    if (clearT < 0 && isCleared()) {
      clearT = lvl.warped ? 0.8 : 1.6;
      if (!lvl.boss && !lvl.warped) slowmoT = 0.8;
      for (const b of balls) b.stuck = false;
      banner = { text: lvl.warped ? 'WARP' : '¡NIVEL SUPERADO!', sub: '', t: 2, color: '#3ddc84' };
      if (!run.demo) Sfx.clear();
    }
    if (clearT > 0) {
      clearT -= dt;
      for (const c of coins) c.x += (paddle.x - c.x) * Math.min(1, dt * 6);
      if (clearT <= 0) finishLevel();
      return;
    }
    if (deathT > 0) {
      deathT -= dt;
      if (deathT <= 0) {
        deathT = -1;
        const treePhoenix = live() ? Skills.val('phoenix') - (run.phoenixUsed || 0) : 0;
        if (run.lives <= 0 && (rel('phoenix') || treePhoenix > 0)) {
          if (rel('phoenix')) { delete run.relics.phoenix; computeRelicBonus(); }
          else { run.phoenixUsed = (run.phoenixUsed || 0) + 1; if (run.rogue) run.rogue.phoenixUsed = run.phoenixUsed; }
          run.lives = 2;
          banner = { text: '¡FÉNIX!', sub: 'Renaces de tus cenizas', t: 1.8, color: '#ff8c42' };
          flash = 0.7; flashColor = '#ff8c42';
          Sfx.life();
          serveBall();
        } else if (run.lives <= 0) gameOver();
        else serveBall();
      }
    } else if (balls.length === 0) loseLife();
  }

  // ---------- Flujo de partida ----------
  function startRun(mode, level) {
    Sfx.init();
    Sfx.quiet = false;
    Sfx.duck(false);
    run = {
      mode, level: level || 1, score: 0, lives: mode === 'daily' ? 2 : 3 + up('lives') + Skills.val('lives'),
      continues: 0, nextLife: 30000 - Skills.val('lifeSooner'), bonusPaid: 0, demo: false, def: null,
      rng: mode === 'daily' ? mulberry32(hashStr('arkanaid-' + todayStr())) : Math.random,
    };
    displayScore = 0;
    stat('games');
    if (mode === 'daily') ach('daily');
    Save.save();
    startLevel();
    UI.hideAll();
  }

  function startRogueLevel(R, def, mods, label) {
    Sfx.init();
    Sfx.quiet = false;
    Sfx.duck(false);
    run = {
      mode: 'rogue', level: R.depth, score: R.score, lives: R.lives, continues: 0, nextLife: Infinity,
      bonusPaid: 0, demo: false, def, mods, relics: R.relics, label, act: R.act, rng: Math.random,
      rogue: R, phoenixUsed: R.phoenixUsed || 0,
    };
    displayScore = run.score;
    startLevel(true);
    UI.hideAll();
  }

  function startDemo() {
    const pool = LEVELS.map((l, i) => i).filter(i => !LEVELS[i].boss);
    run = {
      mode: 'demo', demo: true, level: pool[Math.floor(Math.random() * pool.length)] + 1,
      score: 0, lives: 99, nextLife: Infinity, continues: 0, bonusPaid: 0, def: null, rng: Math.random,
    };
    Sfx.quiet = true;
    Sfx.duck(true);
    startLevel();
    banner = null;
  }

  function finishLevel() {
    if (run.demo) { startDemo(); return; }
    state = 'clear';
    const xp = Math.floor((run.score - lvl.startScore) / 10) + 50 + (lvl.boss ? 150 : 0);
    announceLevels(Progress.add(xp));
    if (run.mode === 'rogue') {
      addCoins(5 + run.level);
      Save.save();
      Rogue.onClear({ lives: run.lives, score: run.score, time: lvl.time, bricks: lvl.bricks, maxChain: lvl.maxChain, deaths: lvl.deaths });
      return;
    }
    const par = lvl.boss ? 100 : 20 + lvl.destructible * 0.5;
    const stars = 1 + (lvl.deaths === 0 ? 1 : 0) + (lvl.time <= par ? 1 : 0);
    const reward = Math.round((8 + run.level * 2 + stars * 4 + (lvl.boss ? 25 : 0)) * (1 + bon('interest')));
    let skillPts = 0, unlock = null;
    const timeBonus = lvl.warped ? 0 : Math.max(0, Math.round((par - lvl.time) * 50));
    run.score += timeBonus;
    addCoins(reward);
    if (lvl.deaths === 0) ach('flawless');
    if (lvl.time < 30 && !lvl.warped) ach('speedrun');
    if (run.mode === 'campaign') {
      const firstClear = !Unlocks.cleared(run.level);
      if (stars > (Save.d.stars[run.level] || 0)) Save.d.stars[run.level] = stars;
      unlock = firstClear ? Unlocks.grant(run.level) : null;
      if (unlock) setTimeout(() => { Sfx.ach(); UI.toast(`🔓 ${unlock.icon} ${unlock.name}`, unlock.desc); }, 600);
      skillPts = Skills.syncCampaign() + Skills.addXp(run.score - lvl.startScore);
      Save.d.unlocked = Math.max(Save.d.unlocked, Math.min(CAMPAIGN_LEN, run.level + 1));
      if (totalStars() >= 30) ach('stars30');
    }
    if (run.mode === 'endless' && run.level > (Save.d.endlessBestLevel || 0)) Save.d.endlessBestLevel = run.level;
    Save.save();
    UI.showClear({
      level: run.level, name: lvl.name, stars, time: lvl.time, maxChain: lvl.maxChain,
      bricks: lvl.bricks, coins: Math.floor(lvl.coins), reward, timeBonus, score: run.score,
      isLast: run.mode === 'campaign' && run.level >= CAMPAIGN_LEN, mode: run.mode, skillPts, xp, unlock,
    });
  }

  function totalStars() { return Object.values(Save.d.stars).reduce((a, b) => a + b, 0); }

  function recordScore() {
    const s = run.score;
    let best, isNew = false;
    if (s > Save.d.highscore) Save.d.highscore = s;
    if (run.mode === 'endless') {
      if (s > Save.d.endlessBest) { Save.d.endlessBest = s; isNew = true; }
      best = Save.d.endlessBest;
    } else if (run.mode === 'daily') {
      const t = todayStr();
      if (Save.d.daily.date !== t) Save.d.daily = { date: t, best: 0 };
      if (s > Save.d.daily.best) { Save.d.daily.best = s; isNew = true; }
      best = Save.d.daily.best;
    } else {
      if (s > Save.d.campaignBest) { Save.d.campaignBest = s; isNew = true; }
      best = Save.d.campaignBest;
    }
    return { best, isNew };
  }

  function payScoreBonus() {
    const total = Math.floor(run.score / 400);
    const bonus = total - run.bonusPaid;
    run.bonusPaid = total;
    addCoins(bonus);
    return bonus;
  }

  const continueCost = () => Math.round(100 * Math.pow(2, run.continues) * (1 - Skills.val('contDiscount')));

  function announceLevels(gained) {
    gained.forEach((g, i) => setTimeout(() => {
      Sfx.ach();
      UI.toast(`⬆ ¡NIVEL ${g.level}!`, `+${g.ph} PH · +${g.coins} monedas`);
      if (g.milestone) setTimeout(() => UI.toast(`${g.milestone.icon} ${g.milestone.name}`, g.milestone.desc), 700);
    }, 400 + i * 1400));
  }

  function gameOver() {
    state = 'over';
    if (live()) announceLevels(Progress.add((run.score - lvl.startScore) / 10));
    Sfx.setIntensity(0);
    Sfx.gameover();
    if (run.mode === 'rogue') {
      if (run.score > Save.d.highscore) Save.d.highscore = run.score;
      Rogue.onDeath({ score: run.score });
      return;
    }
    const bonus = payScoreBonus();
    const rec = recordScore();
    Save.save();
    UI.showOver({
      score: run.score, best: rec.best, isNew: rec.isNew, bonus, level: run.level, mode: run.mode,
      canContinue: run.mode !== 'daily' && run.continues < 3, cost: continueCost(),
    });
  }

  function continueRun() {
    const cost = continueCost();
    if (Save.d.coins < cost) return false;
    Save.d.coins -= cost;
    run.continues++;
    run.lives = 3;
    state = 'play';
    deathT = -1;
    resetEffects();
    serveBall();
    Save.save();
    UI.hideAll();
    return true;
  }

  function nextLevel() {
    if (run.mode === 'campaign' && run.level >= CAMPAIGN_LEN) { victory(); return; }
    run.level++;
    startLevel();
    UI.hideAll();
  }

  function victory() {
    state = 'over';
    ach('campaign');
    const bonus = payScoreBonus();
    const rec = recordScore();
    Save.save();
    UI.showVictory({ score: run.score, best: rec.best, isNew: rec.isNew, bonus });
  }

  function pause() {
    if (state !== 'play' || run.demo) return;
    state = 'paused';
    input.fire = false;
    Sfx.duck(true);
    UI.showPause();
  }

  function resume() {
    if (state !== 'paused') return;
    state = 'play';
    Sfx.duck(false);
    UI.hideAll();
  }

  function restartLevel() {
    run.score = lvl.startScore;
    startLevel(true);
    Sfx.duck(false);
    UI.hideAll();
  }

  function retry() { startRun(run.mode, run.mode === 'campaign' ? run.level : 1); }

  function toMenu() {
    if (run && !run.demo && (state === 'play' || state === 'paused')) {
      if (run.mode === 'rogue') Rogue.onAbandon();
      else { payScoreBonus(); recordScore(); Save.save(); }
    }
    startDemo();
    UI.show('menu');
  }

  // ---------- Entrada ----------
  const input = { left: false, right: false, fire: false, px: null, touch: false, startX: 0, startPaddle: 0 };

  function toLogical(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
  }

  canvas.addEventListener('pointerdown', e => {
    Sfx.init();
    if (state !== 'play' || run.demo) return;
    const p = toLogical(e);
    const slots = actSlots();
    for (let i = 0; i < slots.length; i++) {
      if (slots[i] && Math.hypot(p.x - ACT_X[i], p.y - ACT_Y[i]) < 30) { useActive(i); e.preventDefault(); return; }
    }
    input.touch = e.pointerType !== 'mouse';
    if (input.touch) { input.startX = p.x; input.startPaddle = paddle.x; input.px = paddle.x; }
    else input.px = p.x;
    input.fire = true;
    launch();
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', e => {
    const p = toLogical(e);
    if (e.pointerType === 'mouse') input.px = p.x;
    else if (input.fire) input.px = input.startPaddle + (p.x - input.startX) * 1.4;
  });
  const release = () => { input.fire = false; };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  window.addEventListener('keydown', e => {
    Sfx.init();
    const k = e.code;
    if (k === 'ArrowLeft' || k === 'KeyA') { input.left = true; input.px = null; }
    else if (k === 'ArrowRight' || k === 'KeyD') { input.right = true; input.px = null; }
    else if (k === 'Space' || k === 'ArrowUp' || k === 'KeyW') {
      if (state === 'play' && !run.demo) { input.fire = true; launch(); e.preventDefault(); }
    } else if ((k === 'KeyQ' || k === 'Digit1') && state === 'play' && !run.demo) {
      useActive(0);
    } else if ((k === 'KeyE' || k === 'Digit2') && state === 'play' && !run.demo) {
      useActive(1);
    } else if ((k === 'KeyR' || k === 'Digit3') && state === 'play' && !run.demo) {
      useActive(2);
    } else if (k === 'KeyP' || k === 'Escape') {
      if (state === 'play') pause(); else if (state === 'paused') resume();
    } else if (k === 'KeyM') {
      Save.d.settings.music = !Save.d.settings.music;
      Sfx.setMusic(Save.d.settings.music);
      Save.save();
    }
  });
  window.addEventListener('keyup', e => {
    const k = e.code;
    if (k === 'ArrowLeft' || k === 'KeyA') input.left = false;
    else if (k === 'ArrowRight' || k === 'KeyD') input.right = false;
    else if (k === 'Space' || k === 'ArrowUp' || k === 'KeyW') input.fire = false;
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { pause(); Save.save(); Sfx.suspend(); } else Sfx.resume();
  });
  window.addEventListener('blur', () => { pause(); input.left = input.right = input.fire = false; });

  // ---------- Render ----------
  const stars = Array.from({ length: 110 }, () => ({ x: Math.random() * W, y: Math.random() * H, z: Math.random() * 0.9 + 0.1 }));
  function updateStars(dt) {
    const sp = feverT > 0 ? 260 : 26;
    for (const s of stars) {
      s.y += s.z * sp * dt;
      if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
    }
  }

  const colorCache = new Map();
  function shade(hex, amt) {
    const key = hex + amt;
    let v = colorCache.get(key);
    if (v) return v;
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255;
    if (amt > 0) { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
    else { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
    v = `rgb(${r | 0},${g | 0},${b | 0})`;
    colorCache.set(key, v);
    return v;
  }

  const gradCache = new Map();
  function brickGrad(color, h) {
    let g = gradCache.get(color);
    if (g) return g;
    g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, shade(color, 0.3));
    g.addColorStop(0.5, color);
    g.addColorStop(1, shade(color, -0.35));
    gradCache.set(color, g);
    return g;
  }

  function rr(x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else {
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }
  }

  const easeOutBack = t => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);
  const skinColor = kind => {
    const s = SKINS[kind].find(x => x.id === Save.d.skin[kind]) || SKINS[kind][0];
    return s.color === 'rainbow' ? `hsl(${(gameTime * 140) % 360},95%,62%)` : s.color;
  };

  function drawBackground() {
    const lvHue = run ? 200 + (run.level * 47) % 120 : 260;
    const hue = feverT > 0 ? (gameTime * 200) % 360 : lvHue;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, `hsl(${hue},55%,7%)`);
    g.addColorStop(1, `hsl(${(hue + 40) % 360},60%,13%)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = `hsla(${hue},80%,70%,0.05)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 40) { ctx.moveTo(x, TOP); ctx.lineTo(x, H); }
    const off = (gameTime * 20) % 40;
    for (let y = TOP + off; y <= H; y += 40) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();
    for (const s of stars) {
      ctx.globalAlpha = s.z * 0.8;
      ctx.fillStyle = '#fff';
      const len = feverT > 0 ? s.z * 14 : s.z * 2;
      ctx.fillRect(s.x, s.y, s.z * 2, len);
    }
    ctx.globalAlpha = 1;
  }

  function drawWalls() {
    const col = feverT > 0 ? `hsl(${(gameTime * 200) % 360},90%,60%)` : '#7c5cff';
    ctx.fillStyle = 'rgba(20,16,50,0.9)';
    ctx.fillRect(0, TOP - 4, FL, H);
    ctx.fillRect(FR, TOP - 4, W - FR, H);
    ctx.fillRect(0, TOP - 4, W, 4);
    ctx.shadowColor = col;
    ctx.shadowBlur = 12;
    ctx.fillStyle = col;
    ctx.fillRect(FL - 2, TOP, 2, H);
    ctx.fillRect(FR, TOP, 2, H);
    ctx.fillRect(FL - 2, TOP - 2, FR - FL + 4, 2);
    ctx.shadowBlur = 0;
  }

  function drawBrick(br) {
    if (br.appear <= 0) return;
    const s = br.appear < 1 ? easeOutBack(br.appear) : 1;
    const w = br.w - 3, h = br.h - 3;
    ctx.save();
    ctx.translate(br.x + 1.5 + w / 2, br.y + 1.5 + h / 2);
    if (s !== 1) ctx.scale(s, s);
    ctx.translate(-w / 2, -h / 2);
    if (br.hidden && !rel('eagle')) {
      ctx.globalAlpha = 0.08 + 0.07 * Math.sin(gameTime * 2.5 + br.col * 0.7 + br.row);
      ctx.strokeStyle = '#cfe0ff';
      ctx.lineWidth = 1;
      rr(0.5, 0.5, w - 1, h - 1, 4);
      ctx.stroke();
      ctx.restore();
      return;
    }
    ctx.fillStyle = brickGrad(br.color, h);
    rr(0, 0, w, h, 4);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    rr(2, 1.5, w - 4, h * 0.3, 3);
    ctx.fill();

    if (br.metal || br.gold) {
      ctx.save();
      rr(0, 0, w, h, 4);
      ctx.clip();
      const sx = ((gameTime * (br.gold ? 90 : 50) + br.col * 23) % 200) - 40;
      ctx.fillStyle = br.gold ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.2)';
      ctx.beginPath();
      ctx.moveTo(sx, 0); ctx.lineTo(sx + 10, 0); ctx.lineTo(sx + 2, h); ctx.lineTo(sx - 8, h);
      ctx.fill();
      ctx.restore();
      if (br.metal) {
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        for (const [px, py] of [[4, 4], [w - 4, 4], [4, h - 4], [w - 4, h - 4]]) {
          ctx.beginPath(); ctx.arc(px, py, 1.6, 0, 7); ctx.fill();
        }
      }
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (br.explosive) {
      const pulse = 0.5 + 0.5 * Math.sin(gameTime * 8 + br.seed);
      ctx.fillStyle = '#2a0505';
      ctx.beginPath(); ctx.arc(w / 2, h / 2 + 1, 5.5, 0, 7); ctx.fill();
      ctx.fillStyle = `rgba(255,${180 + pulse * 75 | 0},60,1)`;
      ctx.beginPath(); ctx.arc(w / 2 + 5, h / 2 - 5, 2 + pulse * 1.5, 0, 7); ctx.fill();
    } else if (br.coinBrick || br.gold) {
      ctx.fillStyle = 'rgba(90,50,0,0.75)';
      ctx.font = `700 13px ${FONT}`;
      ctx.fillText('$', w / 2, h / 2 + 1);
    } else if (br.mystery) {
      ctx.fillStyle = `hsl(${(gameTime * 160 + br.col * 30) % 360},100%,80%)`;
      ctx.font = `900 14px ${FONT}`;
      ctx.fillText('?', w / 2, h / 2 + 1);
    } else if (br.regen) {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(w / 2 - 5, h / 2 - 1, 10, 2.5);
      ctx.fillRect(w / 2 - 1.25, h / 2 - 5, 2.5, 10);
    }
    if (br.maxHp > 1 && isFinite(br.maxHp) && br.hp < br.maxHp) {
      const dmg = 1 - br.hp / br.maxHp;
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      let x = w * (0.2 + (br.seed % 0.3)), y = 0;
      ctx.moveTo(x, y);
      for (let i = 1; i <= 4; i++) { x += ((br.seed * i) % 9) - 4; y = h * i / 4; ctx.lineTo(x, y); }
      if (dmg > 0.5) {
        x = w * 0.75; ctx.moveTo(x, h);
        for (let i = 1; i <= 3; i++) { x -= ((br.seed * (i + 3)) % 8) - 2; ctx.lineTo(x, h - h * i / 3); }
      }
      ctx.stroke();
    }
    if (br.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${br.flash * 0.75})`;
      rr(0, 0, w, h, 4);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawPaddle() {
    const col = paddle.stun > 0 && Math.floor(gameTime * 20) % 2 ? '#555' : skinColor('paddle');
    const sq = paddle.squash;
    const w = paddle.w * (1 + sq * 0.08), h = PADDLE_H * (1 - sq * 0.3);
    const x = paddle.x - w / 2, y = PADDLE_Y + (PADDLE_H - h);
    ctx.save();
    ctx.shadowColor = col;
    ctx.shadowBlur = 18;
    ctx.fillStyle = col;
    rr(x, y, w, h, h / 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    rr(x + 6, y + 2, w - 12, h * 0.3, 3);
    ctx.fill();
    ctx.fillStyle = effects.laser > 0 ? '#ff4d6d' : '#c0c6d6';
    rr(x, y, 14, h, h / 2); ctx.fill();
    rr(x + w - 14, y, 14, h, h / 2); ctx.fill();
    if (effects.laser > 0) {
      ctx.fillStyle = '#ff4d6d';
      ctx.fillRect(x + 4, y - 7, 5, 8);
      ctx.fillRect(x + w - 9, y - 7, 5, 8);
    }
    if (effects.catch > 0) {
      ctx.fillStyle = `rgba(34,211,166,${0.5 + 0.4 * Math.sin(gameTime * 10)})`;
      ctx.fillRect(x + 10, y - 2, w - 20, 2);
    }
    ctx.restore();
  }

  function drawBalls() {
    const fire = ballIsFire();
    const col = fire ? '#ff7a1a' : skinColor('ball');
    const glow = balls.length < 10;
    for (const b of balls) {
      const n = b.trail.length / 2;
      ctx.fillStyle = col;
      for (let i = 0; i < n; i++) {
        const a = (i + 1) / n;
        ctx.globalAlpha = a * 0.35;
        ctx.beginPath();
        ctx.arc(b.trail[i * 2], b.trail[i * 2 + 1], b.r * (0.35 + 0.65 * a), 0, 7);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (glow) { ctx.shadowColor = col; ctx.shadowBlur = fire ? 26 : 14; }
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, 7);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.28, b.y - b.r * 0.28, b.r * 0.4, 0, 7);
      ctx.fill();
      if (Math.abs(b.spin) > 0.15) {
        ctx.strokeStyle = `rgba(124,247,255,${Math.min(1, Math.abs(b.spin))})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r + 3, b.spinA, b.spinA + 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r + 3, b.spinA + Math.PI, b.spinA + Math.PI + 2);
        ctx.stroke();
      }
      ctx.fillStyle = col;
    }
    if (balls.some(b => b.stuck) && !run.demo) {
      const b = balls.find(x => x.stuck);
      const ang = clamp(b.stuckOff / (paddle.w / 2), -1, 1) * 1.08;
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.setLineDash([4, 6]);
      ctx.lineDashOffset = -gameTime * 30;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x + Math.sin(ang) * 90, b.y - Math.cos(ang) * 90);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawCapsules() {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const c of capsules) {
      const p = POWERUPS[c.type];
      const bob = Math.sin(c.t * 6) * 1.5;
      ctx.save();
      ctx.translate(c.x, c.y + bob);
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = p.color;
      rr(-19, -8, 38, 16, 8);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      rr(-15, -6, 30, 5, 3);
      ctx.fill();
      ctx.fillStyle = p.good ? '#0b0b1e' : '#fff';
      ctx.font = `900 11px ${FONT}`;
      ctx.fillText(p.label, 0, 1);
      ctx.restore();
    }
  }

  function drawCoins() {
    for (const c of coins) {
      const sx = Math.abs(Math.cos(c.t * 7));
      ctx.fillStyle = '#ffcf33';
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, 6 * sx + 1, 6, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = '#b8860b';
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, 3 * sx + 0.5, 3, 0, 0, 7);
      ctx.fill();
    }
  }

  function drawEnemies() {
    for (const e of enemies) {
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(e.t * 2.4);
      ctx.strokeStyle = '#7cf7ff';
      ctx.fillStyle = 'rgba(124,247,255,0.18)';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#7cf7ff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      if (e.kind === 0) { for (let i = 0; i < 3; i++) { const a = i * 2.094; ctx.lineTo(Math.cos(a) * e.r, Math.sin(a) * e.r); } ctx.closePath(); }
      else if (e.kind === 1) { ctx.arc(0, 0, e.r, 0, 7); ctx.moveTo(e.r * 0.45, 0); ctx.arc(0, 0, e.r * 0.45, 0, 7); }
      else { ctx.rect(-e.r * 0.75, -e.r * 0.75, e.r * 1.5, e.r * 1.5); }
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawBoss() {
    if (!boss || boss.dead) return;
    const x = boss.x - boss.w / 2, y = boss.y - boss.h / 2;
    const ph = bossPhase();
    ctx.save();
    if (boss.dying > 0) ctx.globalAlpha = 0.5 + 0.5 * Math.sin(gameTime * 40);
    ctx.shadowColor = boss.color;
    ctx.shadowBlur = 25;
    const g = ctx.createLinearGradient(0, y, 0, y + boss.h);
    g.addColorStop(0, shade(boss.color, 0.2));
    g.addColorStop(1, shade(boss.color, -0.6));
    ctx.fillStyle = g;
    rr(x, y, boss.w, boss.h, 18);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    for (let i = 0; i < 5; i++) ctx.fillRect(x + 18 + i * 38, y + boss.h - 14, 26, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    rr(x + 10, y + 6, boss.w - 20, 10, 5);
    ctx.fill();
    // ojo que sigue a la bola
    const target = balls[0] || { x: paddle.x, y: PADDLE_Y };
    const a = Math.atan2(target.y - boss.y, target.x - boss.x);
    ctx.fillStyle = '#f8f8ff';
    ctx.beginPath();
    ctx.ellipse(boss.x, boss.y, 30, 20 - (ph === 3 ? 6 : 0), 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = ph === 3 ? '#ff1a3c' : '#111';
    ctx.beginPath();
    ctx.arc(boss.x + Math.cos(a) * 14, boss.y + Math.sin(a) * 8, 9, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(boss.x + Math.cos(a) * 14 - 3, boss.y + Math.sin(a) * 8 - 3, 2.5, 0, 7);
    ctx.fill();
    if (boss.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${boss.flash * 0.7})`;
      rr(x, y, boss.w, boss.h, 18);
      ctx.fill();
    }
    ctx.restore();
    // barra de vida
    const bw = 300, bx = (W - bw) / 2, by = TOP + 6;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    rr(bx, by, bw, 8, 4); ctx.fill();
    ctx.fillStyle = boss.color;
    rr(bx, by, bw * boss.hp / boss.maxHp, 8, 4); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `700 9px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(boss.name.toUpperCase(), W / 2, by + 11);
  }

  function drawBullets() {
    ctx.fillStyle = '#ff4d6d';
    ctx.shadowColor = '#ff4d6d';
    ctx.shadowBlur = 10;
    for (const b of bullets) { ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, 7); ctx.fill(); }
    ctx.shadowBlur = 0;
  }

  function drawLasers() {
    ctx.fillStyle = '#ffd1dc';
    ctx.shadowColor = '#ff4d6d';
    ctx.shadowBlur = 8;
    for (const l of lasers) ctx.fillRect(l.x - 1.5, l.y, 3, 14);
    ctx.shadowBlur = 0;
  }

  function drawFx() {
    for (const p of particles) {
      ctx.globalAlpha = p.life / p.max;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    for (const r of rings) {
      ctx.globalAlpha = 1 - r.t;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 3 * (1 - r.t) + 0.5;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.max * r.t, 0, 7);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const f of floaters) {
      ctx.globalAlpha = 1 - f.t / f.life;
      ctx.font = `800 ${f.size}px ${FONT}`;
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  function drawBarrier() {
    if (barrier <= 0) return;
    ctx.save();
    ctx.shadowColor = '#2ec4f1';
    ctx.shadowBlur = 14;
    ctx.fillStyle = `rgba(46,196,241,${0.6 + 0.3 * Math.sin(gameTime * 6)})`;
    ctx.fillRect(FL, BARRIER_Y, FR - FL, 2 + barrier * 1.5);
    ctx.restore();
  }

  function drawHUD(dt) {
    displayScore += (run.score - displayScore) * Math.min(1, dt * 10);
    if (Math.abs(run.score - displayScore) < 1) displayScore = run.score;
    ctx.fillStyle = 'rgba(6,4,20,0.92)';
    ctx.fillRect(0, 0, W, TOP - 4);
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#8c90b8';
    ctx.font = `700 10px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText('PUNTOS', 14, 20);
    ctx.textAlign = 'center';
    ctx.fillText(run.mode === 'daily' ? 'DIARIO' : run.mode === 'endless' ? 'INFINITO' : run.mode === 'rogue' ? `ROGUE · ACTO ${run.act}` : 'NIVEL', W / 2, 20);
    ctx.textAlign = 'right';
    ctx.fillText('MONEDAS', W - 50, 20);

    ctx.fillStyle = '#fff';
    ctx.font = `800 20px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(fmt(displayScore), 14, 45);
    ctx.textAlign = 'center';
    ctx.font = `800 16px ${FONT}`;
    ctx.fillText(run.mode === 'campaign' ? `${run.level}/${CAMPAIGN_LEN}` : `${run.level}`, W / 2, 40);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffcf33';
    ctx.font = `800 18px ${FONT}`;
    ctx.fillText(fmt(Save.d.coins), W - 50, 45);

    // vidas
    const lives = Math.min(run.lives, 8);
    const lx = W / 2 - (lives * 18) / 2;
    for (let i = 0; i < lives; i++) {
      ctx.fillStyle = skinColor('paddle');
      rr(lx + i * 18 + 2, 47, 14, 5, 2.5);
      ctx.fill();
    }
    if (run.lives > 8) { ctx.fillStyle = '#fff'; ctx.font = `700 9px ${FONT}`; ctx.textAlign = 'left'; ctx.fillText(`+${run.lives - 8}`, lx + 8 * 18 + 3, 53); }

    // medidor de fiebre
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(0, TOP - 4, W, 4);
    if (feverT > 0) {
      ctx.fillStyle = `hsl(${(gameTime * 400) % 360},100%,60%)`;
      ctx.fillRect(0, TOP - 4, W * feverT / feverDur, 4);
    } else if (fever > 0) {
      const g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, '#ff8c42');
      g.addColorStop(1, '#ff4fd8');
      ctx.fillStyle = g;
      ctx.fillRect(0, TOP - 4, W * fever / 100, 4);
    }

    // combo
    if (chain >= 3) {
      const m = comboMult();
      const sz = 14 + comboPulse * 6 + Math.min(m, 8);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = `900 ${sz}px ${FONT}`;
      ctx.fillStyle = `hsl(${(m * 45) % 360},95%,65%)`;
      ctx.fillText(`${chain} COMBO  x${m}`, FL + 10, TOP + (boss ? 34 : 18));
    }

    // reliquias (rogue)
    if (run.relics) {
      let rx = FR - 14;
      ctx.font = '14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = 0.85;
      for (const [id, n] of Object.entries(run.relics)) {
        if (!n || !ROGUE_RELICS[id] || rx < W / 2) continue;
        ctx.fillText(ROGUE_RELICS[id].icon, rx, H - 14);
        rx -= 20;
      }
      ctx.globalAlpha = 1;
    }

    // power-ups activos
    let ex = FL + 8;
    ctx.textBaseline = 'middle';
    for (const k of EFFECT_KEYS) {
      if (effects[k] <= 0) continue;
      const p = POWERUPS[k];
      const frac = k === 'laser' && bon('cannon') ? 1 : effects[k] / (p.dur * (1 + 0.15 * up('duration') + bon('duration')));
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      rr(ex, H - 22, 44, 16, 8); ctx.fill();
      ctx.fillStyle = p.color;
      rr(ex, H - 22, 44 * Math.min(1, frac), 16, 8); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = `800 10px ${FONT}`;
      ctx.fillText(p.label, ex + 22, H - 13.5);
      ex += 50;
    }
  }

  function drawBanner() {
    if (!banner) return;
    const a = Math.min(1, banner.t * 2, (2.6 - banner.t) * 4);
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, a));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 40px ${FONT}`;
    ctx.shadowColor = banner.color || '#7c5cff';
    ctx.shadowBlur = 24;
    ctx.fillStyle = '#fff';
    ctx.fillText(banner.text, W / 2, H * 0.5);
    ctx.shadowBlur = 0;
    if (banner.sub) {
      ctx.font = `700 16px ${FONT}`;
      ctx.fillStyle = banner.color || '#b9a8ff';
      ctx.fillText(banner.sub, W / 2, H * 0.5 + 38);
    }
    ctx.restore();
  }

  let darkCv = null, dctx = null;
  function drawDarkness() {
    if (!(mod('dark') || bon('dark'))) return;
    if (!darkCv) {
      darkCv = document.createElement('canvas');
      darkCv.width = W / 2;
      darkCv.height = H / 2;
      dctx = darkCv.getContext('2d');
    }
    dctx.globalCompositeOperation = 'source-over';
    dctx.clearRect(0, 0, W / 2, H / 2);
    dctx.fillStyle = 'rgba(2,2,10,0.94)';
    dctx.fillRect(0, 0, W / 2, H / 2);
    dctx.globalCompositeOperation = 'destination-out';
    const k = rel('eagle') ? 1.5 : 1;
    const hole = (x, y, r) => {
      const g = dctx.createRadialGradient(x / 2, y / 2, 0, x / 2, y / 2, r / 2);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(0.55, 'rgba(0,0,0,0.85)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      dctx.fillStyle = g;
      dctx.beginPath();
      dctx.arc(x / 2, y / 2, r / 2, 0, 7);
      dctx.fill();
    };
    for (const b of balls) hole(b.x, b.y, 120 * k);
    hole(paddle.x, PADDLE_Y + 8, 150 * k);
    for (const c of capsules) hole(c.x, c.y, 50);
    for (const r of rings) hole(r.x, r.y, r.max * r.t * 1.3 + 30);
    if (boss && !boss.dead) hole(boss.x, boss.y, 180);
    ctx.drawImage(darkCv, 0, 0, W, H);
  }

  function render(dt) {
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    drawBackground();
    if (!run) return;
    ctx.save();
    if (shake > 0 && Save.d.settings.shake) ctx.translate(rnd(-shake, shake), rnd(-shake, shake));
    drawWalls();
    for (const br of bricks) if (br.alive) drawBrick(br);
    drawBoss();
    drawBarrier();
    drawCoins();
    drawCapsules();
    drawEnemies();
    drawLasers();
    drawBullets();
    drawPaddle();
    drawBalls();
    drawFx();
    ctx.restore();
    drawDarkness();
    if (!run.demo) drawActives();
    if (!run.demo) { drawHUD(dt); drawBanner(); }
    if (flash > 0) {
      ctx.globalAlpha = flash * 0.5;
      ctx.fillStyle = flashColor;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    canvas.style.cursor = state === 'play' && !run.demo ? 'none' : 'default';
  }

  let last = performance.now(), acc = 0;
  function frame(now) {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.1) dt = 0.1;
    acc += dt;
    while (acc >= STEP) { update(STEP); acc -= STEP; }
    render(dt);
    requestAnimationFrame(frame);
  }

  function boot() {
    Sfx.setSound(Save.d.settings.sound);
    Sfx.setMusic(Save.d.settings.music);
    startDemo();
    requestAnimationFrame(frame);
  }

  return {
    boot, startRun, startRogueLevel, nextLevel, retry, continueRun, pause, resume, restartLevel, toMenu, ach,
    todayStr, dateStr, totalStars, continueCost,
    isPlaying: () => state === 'play' && run && !run.demo,
    get run() { return run; },
    CAMPAIGN_LEN,
    // depuración: avanza la simulación n pasos fijos sin renderizar
    _sim(n) { for (let i = 0; i < n; i++) update(STEP); return { state, level: run.level, t: lvl.time, balls: balls.length, bricks: bricks.filter(b => b.alive && !b.metal).length, boss: boss && boss.hp, bx: balls[0] && balls[0].x, spin: Math.max(0, ...balls.map(b => Math.abs(b.spin))) }; },
  };
})();
