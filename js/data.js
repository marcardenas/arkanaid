// Datos del juego: ladrillos, power-ups, niveles, mejoras, estilos y logros.

const BRICK_COLORS = {
  r: '#ff4d6d', o: '#ff8c42', y: '#ffd23f', g: '#3ddc84',
  c: '#2ec4f1', b: '#4d7cff', p: '#b06bff', w: '#e8ecf5',
};

// Leyenda de los mapas:
//  r o y g c b p w  normales (1 golpe)     T  duro (2)     U  muy duro (3)
//  M  metal (indestructible)               G  oro (5 golpes, monedas)
//  X  explosivo (reacción en cadena)       R  regenerativo (vuelve a crecer)
//  H  fila móvil (toda la fila se desliza) I  invisible (aparece al golpearlo)
//  C  cofre de monedas                     ?  misterio (siempre suelta cápsula)
const BRICK_TYPES = {
  T: { hp: 2, color: '#a7b0c0', pts: 100 },
  U: { hp: 3, color: '#79849a', pts: 150 },
  M: { hp: Infinity, color: '#5a6273', pts: 0, metal: true },
  G: { hp: 5, color: '#f5b921', pts: 500, coins: 6, gold: true },
  X: { hp: 1, color: '#e0302a', pts: 80, explosive: true },
  R: { hp: 1, color: '#19c39b', pts: 60, regen: true },
  H: { hp: 1, color: '#ff6ad5', pts: 90 },
  I: { hp: 2, color: '#9fb4ff', pts: 120, invisible: true },
  C: { hp: 1, color: '#ffcf33', pts: 60, coins: 4, coinBrick: true },
  '?': { hp: 1, color: '#8a5cff', pts: 100, mystery: true },
};

const POWERUPS = {
  expand:  { label: 'E',  name: 'EXPANDIR',      color: '#4d7cff', good: true,  w: 12, dur: 18, desc: 'Paleta más ancha' },
  multi:   { label: 'M',  name: 'MULTIBOLA',     color: '#3ddc84', good: true,  w: 11, desc: 'Cada bola se divide en tres' },
  laser:   { label: 'L',  name: 'LÁSER',         color: '#ff4d6d', good: true,  w: 8,  dur: 12, desc: 'Mantén clic/espacio para disparar' },
  catch:   { label: 'C',  name: 'ATRAPAR',       color: '#22d3a6', good: true,  w: 7,  dur: 16, desc: 'La bola se pega a la paleta' },
  slow:    { label: 'S',  name: 'LENTO',         color: '#ff8c42', good: true,  w: 8,  dur: 14, desc: 'Bola más lenta' },
  fire:    { label: 'F',  name: 'BOLA DE FUEGO', color: '#ff5e1a', good: true,  w: 5,  dur: 8,  desc: 'Atraviesa todo lo que no sea metal' },
  mega:    { label: 'B',  name: 'MEGABOLA',      color: '#b06bff', good: true,  w: 5,  dur: 12, desc: 'Bola gigante que hace triple daño' },
  barrier: { label: 'W',  name: 'BARRERA',       color: '#2ec4f1', good: true,  w: 6,  desc: 'Un muro salva la bola (acumulable)' },
  magnet:  { label: 'G',  name: 'IMÁN',          color: '#e879f9', good: true,  w: 4,  dur: 18, desc: 'Atrae monedas y cápsulas' },
  double:  { label: '2X', name: 'PUNTOS x2',     color: '#ffd23f', good: true,  w: 5,  dur: 15, desc: 'Puntaje doble' },
  coins:   { label: '$',  name: 'LLUVIA DE ORO', color: '#ffcf33', good: true,  w: 4,  desc: 'Llueven monedas' },
  life:    { label: '+1', name: 'VIDA EXTRA',    color: '#ff4fd8', good: true,  w: 1.5, desc: '+1 vida' },
  warp:    { label: '>>', name: 'WARP',          color: '#ffffff', good: true,  w: 0.8, desc: 'Salta al siguiente nivel' },
  shrink:  { label: '-',  name: 'ENCOGER',       color: '#6b7280', good: false, w: 4,  dur: 12, desc: 'Paleta pequeña (+500 pts por valiente)' },
  fast:    { label: '!',  name: 'ACELERAR',      color: '#9ca3af', good: false, w: 4,  dur: 10, desc: 'Bola rápida (+500 pts por valiente)' },
};

const E = '.............';
const LEVELS = [
  { name: 'Primera luz', obj: [{ type: 'time', n: 75 }, { type: 'combo', n: 8 }], rows: [
    E,
    '..rrrrrrrrr..',
    '.ooooooooooo.',
    'yyyy?yyy?yyyy',
    'ggggggCgggggg',
    '.ccccccccccc.',
    '..bbbbbbbbb..',
  ] },
  { name: 'Pirámide', obj: [{ type: 'noDeath' }, { type: 'powerups', n: 2 }], rows: [
    '......y......',
    '.....yoy.....',
    '....yo?oy....',
    '...yorrroy...',
    '..yorrCrroy..',
    '.yorrrrrrroy.',
    'yorrrrXrrrroy',
  ] },
  { name: 'Jaque', obj: [{ type: 'combo', n: 10 }, { type: 'time', n: 100 }], rows: [
    'T.T.T.T.T.T.T',
    '.b.b.b?b.b.b.',
    'T.T.T.T.T.T.T',
    '.c.c.cCc.c.c.',
    'T.T.T.T.T.T.T',
    '.g.g.g.g.g.g.',
  ] },
  { name: 'Barril de pólvora', obj: [{ type: 'explosions', n: 15 }, { type: 'noDeath' }], rows: [
    'ppppppppppppp',
    'pbbbbbbbbbbbp',
    'pbXXX.?.XXXbp',
    'pb.X.....X.bp',
    'pbXXX.C.XXXbp',
    'pbbbbbbbbbbbp',
    'ppppppppppppp',
  ] },
  { name: 'JEFE: El Guardián', boss: 1, obj: [{ type: 'bossTime', n: 90 }, { type: 'noDeath' }], rows: [
    E, E, E, E, E, E,
    '.R.R.R.R.R.R.',
    '..?.......?..',
  ] },
  { name: 'Fortaleza', obj: [{ type: 'multiball', n: 3 }, { type: 'time', n: 160 }], rows: [
    'MMMMM...MMMMM',
    'MyyyM...MyyyM',
    'MyGyMTTTMyGyM',
    'MyyyM?C?MyyyM',
    'MTTTMTTTMTTTM',
    '...ooooooo...',
    '.rrrrrrrrrrr.',
  ] },
  { name: 'Invasores', obj: [{ type: 'drones', n: 2 }, { type: 'combo', n: 12 }], rows: [
    '..g.......g..',
    '...g.....g...',
    '..ggggggggg..',
    '.ggXgggggXgg.',
    'ggggg?g?ggggg',
    'g.gggTTTggg.g',
    'g.g.......g.g',
    '...gg...gg...',
  ] },
  { name: 'Cinta transportadora', obj: [{ type: 'slice', n: 6 }, { type: 'noDeath' }], rows: [
    'cccccc.cccccc',
    E,
    '...HHHHHHH...',
    E,
    '..HHH?HHH....',
    E,
    'TTTTTTCTTTTTT',
    E,
    '....HHHHH....',
  ] },
  { name: 'Fantasma', obj: [{ type: 'fever', n: 1 }, { type: 'powerups', n: 3 }], rows: [
    'IIIIIIIIIIIII',
    'I...........I',
    'I.bbbbbbbbb.I',
    'I.b..?.?..b.I',
    'I.b..GCG..b.I',
    'I.bbbbbbbbb.I',
    'I...........I',
    'IIIIIIIIIIIII',
  ] },
  { name: 'JEFE: El Coloso', boss: 2, obj: [{ type: 'noHit' }, { type: 'bossTime', n: 120 }], rows: [
    E, E, E, E, E, E,
    'RRR.RRRRR.RRR',
    '.X.........X.',
  ] },
  { name: 'Rebrote', obj: [{ type: 'explosions', n: 25 }, { type: 'time', n: 130 }], rows: [
    '......R......',
    '.....RyR.....',
    '....RyXyR....',
    '...RyX?XyR...',
    '..RyXyCyXyR..',
    '...RyX?XyR...',
    '....RyXyR....',
    '.....RyR.....',
    '......R......',
  ] },
  { name: 'Lluvia de acero', obj: [{ type: 'multiball', n: 5 }, { type: 'coins', n: 12 }], rows: [
    'M.M.M.M.M.M.M',
    'rrrrrrrrrrrrr',
    '.M.M.M.M.M.M.',
    'ooooo?C?ooooo',
    'M.M.M.M.M.M.M',
    'UUUUUUUUUUUUU',
    '..T.T.T.T.T..',
  ] },
  { name: 'Corazón', obj: [{ type: 'combo', n: 20 }, { type: 'noDeath' }], rows: [
    '..rrr...rrr..',
    '.rpppr.rpppr.',
    'rppGpprppGppr',
    'rppppppCppppr',
    '.rppp?p?pppr.',
    '..rpppppppr..',
    '...rpppppr...',
    '....rpppr....',
    '.....rpr.....',
    '......X......',
  ] },
  { name: 'Motor del caos', obj: [{ type: 'score', n: 15000 }, { type: 'fever', n: 2 }], rows: [
    'G.X.?.C.?.X.G',
    'TTTTTTTTTTTTT',
    '..HHHHHHHHH..',
    'IIIIIIIIIIIII',
    'bXbXbXbXbXbXb',
    'UUUMUUUUUMUUU',
    '.R.R.R.R.R.R.',
  ] },
  { name: 'JEFE: Señor Supremo', boss: 3, obj: [{ type: 'bossTime', n: 160 }, { type: 'noHit' }], rows: [
    E, E, E, E, E, E,
    '..MRRRRRRRM..',
    'C.X.?...?.X.C',
  ] },
];

// Lo que desbloquea superar cada nivel de la campaña por primera vez.
const CAMPAIGN_REWARDS = {
  1:  { icon: '🎁', name: 'Cofre de bienvenida',   desc: '+200 monedas para la tienda', bonus: { coins: 200 } },
  2:  { icon: '🧲', name: 'Imán leve',             desc: 'Monedas y cápsulas se acercan un poco a la paleta', fx: { magnet: 0.3 } },
  3:  { icon: '🎛', name: 'Segunda ranura',        desc: 'Equipa dos habilidades activas (Q y E)', key: 'slot2' },
  4:  { icon: '⏱', name: 'Persistencia',          desc: '+10% de duración de power-ups', fx: { duration: 0.1 } },
  5:  { icon: '💰', name: 'Botín del Guardián',    desc: '+300 monedas', bonus: { coins: 300 } },
  6:  { icon: '🎨', name: 'Estilos',               desc: 'Bolas y paletas nuevas en la tienda', key: 'skins' },
  7:  { icon: '❤',  name: 'Corazón de campaña',    desc: '+1 vida inicial en todos los modos', fx: { lives: 1 } },
  8:  { icon: '🛒', name: 'Mejoras avanzadas',     desc: 'Red de seguridad, Ventaja inicial, Fiebre y Láser rápido en la tienda', key: 'advshop' },
  9:  { icon: '📈', name: 'Techo de combo',        desc: '+1 al multiplicador máximo de combo', fx: { comboCap: 1 } },
  10: { icon: '🌳', name: 'Árbol de habilidades',  desc: 'Fin del capítulo 1: elige una clase y gasta tus PH', key: 'tree' },
  11: { icon: '🪙', name: 'Bolsillos hondos',      desc: '+10% de valor de monedas', fx: { coinVal: 0.1 } },
  12: { icon: '🪂', name: 'Paracaídas',            desc: 'Las cápsulas caen 25% más lento', fx: { capSlow: 0.25 } },
  13: { icon: '🏅', name: 'Renombre',              desc: '+10% de puntos', fx: { score: 0.1 } },
  14: { icon: '⚪', name: 'Compañera',             desc: '25% de empezar cada nivel con una bola extra', fx: { twin: 0.25 } },
  15: { icon: '👑', name: 'Trofeo del Supremo',    desc: '+500 monedas, +5 PH y la paleta Oro', bonus: { coins: 500, ph: 5, paddle: 'gold' } },
  20: { icon: '∞',  name: 'Modo Infinito',         desc: 'Fin de la campaña 2: niveles procedurales sin fin', key: 'endless' },
  25: { icon: '🎯', name: 'Precisión',             desc: '+5% de golpe crítico', fx: { crit: 0.05 } },
  30: { icon: '📅', name: 'Desafío diario',        desc: 'Fin de la campaña 3: un nivel nuevo cada día', key: 'daily' },
  35: { icon: '🧱', name: 'Escudo eterno',         desc: '+1 barrera al empezar cada nivel', fx: { barrier: 1 } },
  40: { icon: '☠',  name: 'Modo Rogue',            desc: 'Fin de la campaña 4: Arkanoid + roguelike, +1000 monedas', key: 'rogue', bonus: { coins: 1000 } },
};

// Tutorial: un nivel guiado por pasos. Desbloquea la campaña, el árbol y da PH.
const TUTORIAL = {
  name: 'Tutorial',
  rows: [
    '.............',
    '..ccccccccc..',
    '..bb?bbXbbb..',
    '..gggCggggg..',
  ],
  reward: { ph: 5 },
};

// Objetivos de estrellas: ★1 por superar el nivel, ★2 y ★3 por cumplir sus dos objetivos.
// 'live' se cumple durante la partida; 'end' se evalúa al superar el nivel.
const OBJECTIVES = {
  time:       { icon: '⏱', text: n => `Supéralo en menos de ${n} s`, end: (s, n) => s.time <= n },
  bossTime:   { icon: '⏱', text: n => `Derrota al jefe en menos de ${n} s`, end: (s, n) => s.time <= n },
  noDeath:    { icon: '❤', text: () => 'Sin perder vidas', end: s => s.deaths === 0 },
  noHit:      { icon: '🛡', text: () => 'Sin recibir disparos del jefe', end: s => s.hits === 0 },
  combo:      { icon: '🔗', text: n => `Logra un combo de ${n}`, live: (s, n) => s.maxChain >= n },
  multiball:  { icon: '⚪', text: n => `Ten ${n} bolas a la vez`, live: (s, n) => s.maxBalls >= n },
  powerups:   { icon: '💊', text: n => `Recoge ${n} cápsulas`, live: (s, n) => s.powerups >= n },
  explosions: { icon: '💥', text: n => `Rompe ${n} ladrillos con explosiones`, live: (s, n) => s.explBricks >= n },
  fever:      { icon: '🔥', text: n => (n > 1 ? `Activa la FIEBRE ${n} veces` : 'Activa la FIEBRE'), live: (s, n) => s.fevers >= n },
  slice:      { icon: '🌀', text: n => `Rompe ${n} ladrillos con bola curva`, live: (s, n) => s.sliceBricks >= n },
  drones:     { icon: '🛸', text: n => `Destruye ${n} drones`, live: (s, n) => s.drones >= n },
  coins:      { icon: '🪙', text: n => `Recoge ${n} monedas`, live: (s, n) => s.coinPickups >= n },
  score:      { icon: '🏅', text: n => `Haz ${n.toLocaleString('es-CL')} puntos en el nivel`, live: (s, n) => s.score >= n },
};

const BOSSES = [
  { name: 'Guardián', color: '#ff4d6d', hp: 40 },
  { name: 'Coloso', color: '#2ec4f1', hp: 70 },
  { name: 'Señor Supremo', color: '#b06bff', hp: 110 },
];

const UPGRADES = [
  { id: 'wide',     icon: '↔', name: 'Paleta ancha',       desc: '+8% ancho de paleta por nivel',               max: 5, cost: l => 60 + l * 60 },
  { id: 'lives',    icon: '♥', name: 'Vida extra',         desc: '+1 vida inicial por nivel',                    max: 3, cost: l => 200 + l * 250 },
  { id: 'duration', icon: '⏱', name: 'Duración',           desc: '+15% duración de power-ups',                    max: 5, cost: l => 80 + l * 70 },
  { id: 'luck',     icon: '🍀', name: 'Suerte',             desc: '+2.5% probabilidad de cápsulas',                max: 5, cost: l => 90 + l * 80 },
  { id: 'keeper',   icon: '⛓', name: 'Guardacombo',        desc: 'Conserva 25% del combo al tocar la paleta',     max: 3, cost: l => 150 + l * 150 },
  { id: 'greed',    icon: '💰', name: 'Codicia',            desc: '+25% valor de cada moneda',                     max: 4, cost: l => 120 + l * 120 },
  { id: 'shield', adv: true,   icon: '🛡', name: 'Red de seguridad',   desc: 'Empieza cada nivel con una barrera',            max: 2, cost: l => 250 + l * 300 },
  { id: 'starter', adv: true,  icon: '🚀', name: 'Ventaja inicial',    desc: 'Empieza cada nivel con un power-up aleatorio',  max: 1, cost: () => 400 },
  { id: 'magnet',   icon: '🧲', name: 'Imán de monedas',    desc: 'Monedas y cápsulas van hacia tu paleta',        max: 3, cost: l => 100 + l * 100 },
  { id: 'fever', adv: true,    icon: '🔥', name: 'Fiebre',             desc: 'La FIEBRE se llena 20% más rápido y dura +1s',  max: 3, cost: l => 140 + l * 140 },
  { id: 'gun', adv: true,      icon: '⚡', name: 'Láser rápido',       desc: '+20% cadencia del láser',                        max: 3, cost: l => 100 + l * 100 },
];

const SKINS = {
  ball: [
    { id: 'classic', name: 'Clásica', cost: 0,   color: '#ffffff' },
    { id: 'plasma',  name: 'Plasma',  cost: 150, color: '#5ef0ff' },
    { id: 'ember',   name: 'Brasa',   cost: 200, color: '#ff9a3c' },
    { id: 'toxic',   name: 'Tóxica',  cost: 250, color: '#9dff3c' },
    { id: 'void',    name: 'Vacío',   cost: 400, color: '#c084fc' },
    { id: 'rainbow', name: 'Prisma',  cost: 800, color: 'rainbow' },
  ],
  paddle: [
    { id: 'classic', name: 'Vaus',     cost: 0,   color: '#6ea8ff' },
    { id: 'neon',    name: 'Neón',     cost: 200, color: '#ff4fd8' },
    { id: 'mint',    name: 'Menta',    cost: 200, color: '#3ddc84' },
    { id: 'crimson', name: 'Carmesí',  cost: 250, color: '#ff4d6d' },
    { id: 'gold',    name: 'Oro',      cost: 500, color: '#ffcf33' },
    { id: 'rainbow', name: 'Arcoíris', cost: 800, color: 'rainbow' },
  ],
};

const ACHIEVEMENTS = [
  { id: 'first',     name: 'Primera grieta',      desc: 'Rompe tu primer ladrillo',                     reward: 10 },
  { id: 'combo10',   name: 'Combo inicial',       desc: 'Logra un combo de 10',                          reward: 25 },
  { id: 'combo25',   name: 'Artista del combo',   desc: 'Logra un combo de 25',                          reward: 60 },
  { id: 'combo50',   name: 'Leyenda del combo',   desc: 'Logra un combo de 50',                          reward: 150 },
  { id: 'fever',     name: 'Con fiebre',          desc: 'Activa el modo FIEBRE',                         reward: 25 },
  { id: 'multi10',   name: 'Piscina de bolas',    desc: 'Ten 10 bolas en juego a la vez',                reward: 50 },
  { id: 'chain10',   name: 'Demolición',          desc: 'Destruye 10 ladrillos con una sola cadena explosiva', reward: 60 },
  { id: 'boss',      name: 'Matagigantes',        desc: 'Derrota a un jefe',                             reward: 100 },
  { id: 'campaign',  name: 'Fin del Supremo',     desc: 'Completa la campaña',                           reward: 500 },
  { id: 'flawless',  name: 'Impecable',           desc: 'Supera un nivel sin perder vidas',              reward: 30 },
  { id: 'speedrun',  name: 'Demonio veloz',       desc: 'Supera un nivel en menos de 30 segundos',       reward: 60 },
  { id: 'bricks1k',  name: 'Cuadrilla demoledora', desc: 'Rompe 1.000 ladrillos en total',              reward: 100 },
  { id: 'bricks10k', name: 'Aniquilador',         desc: 'Rompe 10.000 ladrillos en total',               reward: 500 },
  { id: 'power50',   name: 'Hambre de poder',     desc: 'Recoge 50 power-ups',                           reward: 50 },
  { id: 'laser100',  name: 'Piu piu',             desc: 'Destruye 100 ladrillos con láser',              reward: 60 },
  { id: 'score100k', name: 'Seis cifras',         desc: 'Haz 100.000 puntos en una partida',             reward: 100 },
  { id: 'endless10', name: 'Inmersión profunda',  desc: 'Llega al nivel 10 en modo Infinito',            reward: 120 },
  { id: 'daily',     name: 'Rutina diaria',       desc: 'Juega un Desafío diario',                       reward: 20 },
  { id: 'shopper',   name: 'Inversionista',       desc: 'Compra tu primera mejora',                      reward: 20 },
  { id: 'stars30',   name: 'Coleccionista',       desc: 'Consigue 30 estrellas en la campaña',           reward: 150 },
  { id: 'rich',      name: 'Acaparador',          desc: 'Ten 1.000 monedas a la vez',                    reward: 100 },
  { id: 'masochist', name: 'Masoquista',          desc: 'Atrapa 3 cápsulas malas en un mismo nivel',     reward: 40 },
  { id: 'warp',      name: 'Atajo',               desc: 'Usa una cápsula WARP',                           reward: 30 },
  { id: 'slice',     name: 'Tiro con efecto',     desc: 'Rompe un ladrillo con una bola curva',          reward: 25 },
  { id: 'rogue1',    name: 'Superviviente',       desc: 'Supera el acto 1 en modo Rogue',                 reward: 80 },
  { id: 'roguewin',  name: 'Leyenda rogue',       desc: 'Gana una run completa de Rogue',                 reward: 400 },
  { id: 'relic10',   name: 'Relicario',           desc: 'Ten 10 reliquias en una misma run de Rogue',     reward: 100 },
  { id: 'enemy25',   name: 'Exterminador',        desc: 'Destruye 25 drones',                             reward: 50 },
];

// ---------- Generador procedural (Infinito y Diario) ----------
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function hashStr(s) {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = h << 13 | h >>> 19;
  }
  return h >>> 0;
}

function genLevel(n, rng) {
  const pick = arr => arr[Math.floor(rng() * arr.length)];
  if (n % 5 === 0) {
    const bi = n / 5;
    const rows = [E, E, E, E, E, E];
    rows.push(pick(['.R.R.R.R.R.R.', 'RRR.RRRRR.RRR', '..MRRRRRRRM..', 'T.T.T.T.T.T.T']));
    if (bi > 1) rows.push(pick(['..?.......?..', 'C...........C', '.X.........X.']));
    const b = BOSSES[(bi - 1) % BOSSES.length];
    return { name: `JEFE: ${b.name} ${'I'.repeat(Math.floor((bi - 1) / BOSSES.length) + 1)}`, boss: bi, rows };
  }

  const d = Math.min(1, n / 30);
  const nRows = Math.min(11, 5 + Math.floor(n / 3) + Math.floor(rng() * 2));
  const pattern = Math.floor(rng() * 7);
  const pal = [pick('roygcbpw'), pick('roygcbpw'), pick('roygcbpw')];
  const grid = Array.from({ length: nRows }, () => Array(13).fill('.'));
  const table = [
    ['?', 0.035], ['C', 0.035], ['X', 0.04 + 0.03 * d], ['G', 0.012 + 0.01 * d],
    ['M', 0.02 + 0.06 * d], ['T', 0.08 + 0.15 * d], ['U', 0.02 + 0.12 * d],
    ['R', 0.04 * d], ['I', 0.05 * d],
  ];
  const typeFor = y => {
    const v = rng();
    let acc = 0;
    for (const [ch, p] of table) { acc += p; if (v < acc) return ch; }
    return pal[y % pal.length];
  };

  for (let y = 0; y < nRows; y++) {
    for (let x = 0; x < 7; x++) {
      const dx = 6 - x, cy = Math.abs(y - (nRows - 1) / 2);
      let fill;
      switch (pattern) {
        case 0: fill = true; break;
        case 1: fill = (x + y) % 2 === 0; break;
        case 2: fill = dx * 0.75 + cy <= nRows * 0.55; break;
        case 3: fill = rng() < 0.72; break;
        case 4: fill = x % 2 === 0 || y % 3 === 0; break;
        case 5: fill = y % 2 === 0; break;
        default: fill = dx <= y + 1; break;
      }
      if (!fill) continue;
      grid[y][x] = grid[y][12 - x] = typeFor(y);
    }
  }

  if (n >= 4 && rng() < 0.35) {
    const y = Math.floor(rng() * nRows);
    grid[y] = '...HHHHHHH...'.split('');
  }

  // Seguridad: ningún ladrillo rompible puede quedar encerrado por metal.
  const open = (y, x) => y < 0 || y >= nRows || (x >= 0 && x < 13 && grid[y][x] !== 'M');
  const seen = new Set();
  const stack = [];
  for (let x = 0; x < 13; x++) { stack.push([-1, x], [nRows, x]); }
  while (stack.length) {
    const [y, x] = stack.pop();
    const k = y * 20 + x;
    if (x < 0 || x >= 13 || y < -1 || y > nRows || seen.has(k) || !open(y, x)) continue;
    seen.add(k);
    stack.push([y + 1, x], [y - 1, x], [y, x + 1], [y, x - 1]);
  }
  let trapped = false, destructible = 0;
  for (let y = 0; y < nRows; y++) {
    for (let x = 0; x < 13; x++) {
      const ch = grid[y][x];
      if (ch === '.' || ch === 'M') continue;
      destructible++;
      if (!seen.has(y * 20 + x)) trapped = true;
    }
  }
  if (trapped) for (const row of grid) for (let x = 0; x < 13; x++) if (row[x] === 'M') row[x] = 'U';
  if (destructible < 10) grid[nRows - 1] = pal[0].repeat(13).split('');

  const names = ['Sector', 'Cuadrante', 'Zona', 'Núcleo', 'Anillo', 'Matriz', 'Vórtice'];
  return { name: `${pick(names)} ${n}`, rows: grid.map(r => r.join('')) };
}

// ---------- Campañas ----------
// La campaña se divide en 4 campañas de 10 niveles; al terminar cada una se desbloquea algo grande.
const CAMPAIGNS = [
  { name: 'El despertar', from: 1, to: 10, unlock: 'tree' },
  { name: 'La forja', from: 11, to: 20, unlock: 'endless' },
  { name: 'El abismo', from: 21, to: 30, unlock: 'daily' },
  { name: 'El trono', from: 31, to: 40, unlock: 'rogue' },
];
const campaignOf = n => CAMPAIGNS.findIndex(c => n >= c.from && n <= c.to);

// Niveles 16–40: generados con semilla fija (siempre iguales) y con objetivos propios.
(function extendCampaign() {
  const NAMES = {
    1: ['Fundición', 'Yunque', 'Crisol', 'Engranajes', 'Escoria'],
    2: ['Grieta', 'Sima', 'Marea negra', 'Ecos', 'Profundidad', 'Penumbra', 'Raíces', 'Vacío', 'Hielo negro'],
    3: ['Antesala', 'Guardia real', 'Pasillo de espejos', 'Bóveda', 'Salón de cristal', 'Armería', 'Escalinata', 'Coronación', 'Último umbral'],
  };
  const used = {};
  for (let n = LEVELS.length + 1; n <= 40; n++) {
    const rng = mulberry32(hashStr('arkanaid-campaign-' + n));
    const def = genLevel(n, rng);
    const ci = campaignOf(n);
    if (def.boss) {
      if (n === 40) { def.boss = 9; def.name = 'JEFE FINAL: Señor Supremo'; }
      def.obj = [{ type: 'bossTime', n: 90 + def.boss * 12 }, { type: n % 2 ? 'noHit' : 'noDeath' }];
    } else {
      used[ci] = (used[ci] || 0);
      def.name = NAMES[ci][used[ci]++ % NAMES[ci].length];
      const bricks = def.rows.join('').replace(/[.M]/g, '').length;
      const pool = [
        { type: 'combo', n: 8 + Math.floor(n / 3) }, { type: 'noDeath' }, { type: 'powerups', n: 2 + Math.floor(n / 15) },
        { type: 'multiball', n: 3 + Math.floor(n / 20) }, { type: 'coins', n: 8 + Math.floor(n / 5) }, { type: 'slice', n: 4 + Math.floor(n / 8) },
        { type: 'fever', n: 1 + Math.floor(n / 25) }, { type: 'score', n: 5000 + n * 600 }, { type: 'time', n: Math.round(35 + bricks * 1.1) },
      ];
      const a = pool.splice((n * 4) % pool.length, 1)[0];
      const b = pool.splice((n * 7 + 2) % pool.length, 1)[0];
      def.obj = [a, b];
    }
    LEVELS.push(def);
  }
})();
