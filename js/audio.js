// Audio 100% sintetizado con WebAudio: efectos + música procedural que se acelera en FIEBRE.
const Sfx = (() => {
  let ctx = null, master, sfxBus, musicBus, noiseBuf;
  let soundOn = true, musicOn = true, intensity = 0, ducked = false;
  let timer = null, nextT = 0, step = 0;
  const api = { quiet: false };

  function init() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.55;
      const comp = ctx.createDynamicsCompressor();
      master.connect(comp);
      comp.connect(ctx.destination);
      sfxBus = ctx.createGain();
      sfxBus.connect(master);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 3200;
      musicBus = ctx.createGain();
      musicBus.gain.value = 0;
      musicBus.connect(lp);
      lp.connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const ch = noiseBuf.getChannelData(0);
      for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    applyMusic();
  }

  const ok = () => ctx && soundOn && !api.quiet;
  const now = () => ctx.currentTime;

  function osc(f, t, dur, type, vol, slideTo, bus) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(bus || sfxBus);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function noise(dur, vol, freq, t, bus, ftype) {
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noiseBuf;
    f.type = ftype || 'lowpass';
    f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(bus || sfxBus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }

  function seq(freqs, gap, dur, type, vol) {
    const t = now();
    freqs.forEach((f, i) => osc(f, t + i * gap, dur, type, vol));
  }

  // Escala pentatónica: cada ladrillo del combo suena una nota más alta
  const PENTA = [0, 2, 4, 7, 9];
  function pent(i) {
    i = Math.max(0, Math.min(i, 14));
    return 261.63 * Math.pow(2, (PENTA[i % 5] + 12 * Math.floor(i / 5)) / 12);
  }

  const fx = {
    paddle() { osc(196, now(), 0.09, 'square', 0.11, 290); },
    wall() { osc(520, now(), 0.03, 'square', 0.04); },
    brick(chain) {
      const f = pent(chain - 1), t = now();
      osc(f, t, 0.12, 'square', 0.1);
      osc(f * 2, t, 0.08, 'triangle', 0.06);
    },
    tough() { osc(330, now(), 0.06, 'square', 0.08, 240); },
    metal() { const t = now(); osc(1400, t, 0.08, 'triangle', 0.08); osc(2100, t, 0.05, 'sine', 0.05); },
    explode() { const t = now(); noise(0.45, 0.5, 900, t); osc(120, t, 0.3, 'sine', 0.35, 40); },
    power() { seq([523, 659, 784, 1046], 0.055, 0.1, 'square', 0.08); },
    bad() { seq([392, 330, 262], 0.07, 0.14, 'sawtooth', 0.08); },
    laser() { osc(1300, now(), 0.08, 'sawtooth', 0.04, 300); },
    coin() { const t = now(); osc(988, t, 0.05, 'square', 0.05); osc(1319, t + 0.05, 0.1, 'square', 0.05); },
    life() { seq([523, 659, 784, 1046, 1319, 1568], 0.06, 0.14, 'triangle', 0.12); },
    lose() { const t = now(); osc(440, t, 0.55, 'sawtooth', 0.12, 90); noise(0.4, 0.2, 600, t); },
    clear() { seq([523, 659, 784, 1046, 784, 1046, 1319], 0.09, 0.2, 'square', 0.08); },
    fever() { const t = now(); osc(200, t, 0.6, 'sawtooth', 0.09, 1600); seq([784, 988, 1175, 1568], 0.07, 0.15, 'square', 0.07); },
    bossHit() { const t = now(); osc(160, t, 0.12, 'square', 0.14, 90); noise(0.08, 0.15, 1500, t); },
    bossDie() { const t = now(); for (let i = 0; i < 8; i++) { noise(0.5, 0.4, 700 + i * 80, t + i * 0.18); osc(140 - i * 10, t + i * 0.18, 0.3, 'sine', 0.3, 30); } },
    hurt() { osc(300, now(), 0.25, 'sawtooth', 0.12, 80); },
    launch() { osc(400, now(), 0.08, 'square', 0.07, 800); },
    enemy() { const t = now(); noise(0.2, 0.25, 2000, t); osc(660, t, 0.1, 'square', 0.07, 1320); },
    ach() { seq([784, 988, 1175, 1568], 0.08, 0.25, 'triangle', 0.12); },
    barrier() { osc(880, now(), 0.15, 'sine', 0.12, 440); },
    slice() { const t = now(); osc(500, t, 0.18, 'sine', 0.08, 1500); noise(0.15, 0.08, 3000, t, null, 'bandpass'); },
    click() { osc(660, now(), 0.04, 'square', 0.04); },
    buy() { seq([659, 988, 1319], 0.05, 0.12, 'square', 0.07); },
    gameover() { seq([392, 349, 330, 262], 0.22, 0.35, 'triangle', 0.14); },
    combo(level) { const t = now(); osc(pent(level * 2 + 4), t, 0.2, 'triangle', 0.09); osc(pent(level * 2 + 6), t + 0.06, 0.2, 'triangle', 0.09); },
  };
  for (const k of Object.keys(fx)) {
    const f = fx[k];
    api[k] = (...a) => { if (ok()) f(...a); };
  }
  // la UI suena aunque el juego de demo esté en silencio
  api.click = () => { if (ctx && soundOn) fx.click(); };
  api.buy = () => { if (ctx && soundOn) fx.buy(); };
  api.ach = () => { if (ctx && soundOn) fx.ach(); };

  // ---------- Música ----------
  const PROG = [{ root: 45, minor: true }, { root: 41 }, { root: 48 }, { root: 43 }]; // Am F C G
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const BASS = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1];

  function kick(t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    o.connect(g);
    g.connect(musicBus);
    o.start(t);
    o.stop(t + 0.16);
  }

  function playStep(s, t, sp) {
    const ch = PROG[Math.floor(s / 16)], i = s % 16, third = ch.minor ? 3 : 4;
    if (i % 4 === 0) kick(t);
    if (i === 4 || i === 12) noise(0.12, 0.16, 2500, t, musicBus, 'bandpass');
    if (i % 2 === 1) noise(0.03, 0.05 + intensity * 0.04, 7000, t, musicBus, 'highpass');
    if (BASS[i]) osc(mtof(ch.root - 12 + (i % 8 === 6 ? 12 : 0)), t, sp * 1.6, 'sawtooth', 0.08, 0, musicBus);
    if (intensity) {
      const tones = [0, third, 7, 12, 7, third];
      osc(mtof(ch.root + 12 + tones[i % 6]), t, sp * 0.9, 'square', 0.035, 0, musicBus);
    } else if (i % 4 === 2) {
      osc(mtof(ch.root + 12 + [0, third, 7, 12][(i / 4) | 0]), t, sp * 2, 'triangle', 0.05, 0, musicBus);
    }
  }

  function schedule() {
    if (!ctx || !musicOn) return;
    const sp = 60 / (intensity ? 152 : 124) / 4;
    if (nextT < ctx.currentTime) nextT = ctx.currentTime + 0.05;
    while (nextT < ctx.currentTime + 0.15) {
      playStep(step, nextT, sp);
      nextT += sp;
      step = (step + 1) % 64;
    }
  }

  function applyMusic() {
    if (!ctx) return;
    const target = musicOn ? (ducked ? 0.12 : 0.32) : 0;
    musicBus.gain.setTargetAtTime(target, ctx.currentTime, 0.1);
    if (musicOn && !timer) { nextT = ctx.currentTime + 0.05; timer = setInterval(schedule, 30); }
    if (!musicOn && timer) { clearInterval(timer); timer = null; }
  }

  api.init = init;
  api.setSound = on => { soundOn = on; };
  api.setMusic = on => { musicOn = on; applyMusic(); };
  api.duck = on => { ducked = on; applyMusic(); };
  api.setIntensity = v => { intensity = v; };
  api.suspend = () => { if (ctx && ctx.state === 'running') ctx.suspend(); };
  api.resume = () => { if (ctx && ctx.state === 'suspended') ctx.resume(); };
  return api;
})();
