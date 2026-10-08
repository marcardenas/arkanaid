// Persistencia en localStorage (todo envuelto en try/catch: modo privado, cuota, etc.)
const Save = (() => {
  const KEY = 'arkanaid.save.v1';

  const defaults = () => ({
    coins: 0,
    highscore: 0,
    campaignBest: 0,
    endlessBest: 0,
    endlessBestLevel: 0,
    stars: {},
    unlocked: 1,
    upgrades: {},
    owned: { ball: ['classic'], paddle: ['classic'] },
    skin: { ball: 'classic', paddle: 'classic' },
    achievements: {},
    stats: {
      bricks: 0, powerups: 0, bosses: 0, games: 0, laserKills: 0,
      enemies: 0, maxCombo: 0, coinsEarned: 0, fevers: 0,
    },
    daily: { date: '', best: 0 },
    streak: { last: '', count: 0 },
    settings: { sound: true, music: true, shake: true },
    seenHowto: false,
  });

  const NESTED = ['owned', 'skin', 'stats', 'daily', 'streak', 'settings'];
  let data;

  function load() {
    data = defaults();
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      for (const k of Object.keys(parsed)) {
        if (NESTED.includes(k)) data[k] = Object.assign(data[k], parsed[k]);
        else data[k] = parsed[k];
      }
    } catch (e) { /* datos corruptos o storage bloqueado: usar defaults */ }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* ignorar */ }
  }

  load();
  return {
    get d() { return data; },
    save,
    reset() { data = defaults(); save(); },
  };
})();
