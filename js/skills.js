// Árbol de habilidades radial (estilo Path of Exile): clases, 12 ramas, pasivas y habilidades activas.
// Los puntos (PH) se ganan en la campaña.

// ---------- Habilidades activas ----------
const ACTIVES = {
  pulse:      { icon: '💢', name: 'Pulso',         cd: 18, desc: 'Onda de choque que daña todo alrededor de cada bola' },
  recall:     { icon: '🪃', name: 'Llamada',       cd: 30, desc: 'Todas las bolas vuelven a la paleta' },
  vacuum:     { icon: '🧹', name: 'Aspirar',       cd: 15, desc: 'Atrae al instante todas las cápsulas y monedas' },
  barrage:    { icon: '🎆', name: 'Bombardeo',     cd: 35, desc: '10 explosiones caen sobre ladrillos al azar' },
  multiply:   { icon: '➗', name: 'Dividir',       cd: 30, desc: 'Cada bola se divide en tres' },
  shield:     { icon: '🛡', name: 'Barrera',       cd: 30, desc: '+2 barreras al instante' },
  fever:      { icon: '🌡', name: 'Fiebre',        cd: 50, desc: 'Entras en FIEBRE al instante' },
  goldrain:   { icon: '💰', name: 'Lluvia de oro', cd: 40, desc: 'Llueven 20 monedas' },
  bullettime: { icon: '🕰', name: 'Tiempo bala',   cd: 25, desc: 'Durante 5 s la bola va a menos de la mitad de velocidad' },
  beam:       { icon: '🔆', name: 'Rayo',          cd: 25, desc: 'Un rayo vertical arrasa la columna sobre la paleta' },
};

// ---------- Ramas ----------
// Cada rama sigue la misma forma: 0 → (1, 2) → 3 → (4, 5) → 6 → 7 (clave de la rama).
// Entrada: [id, icono, nombre, rangos, efectos por rango, descripción, habilidad activa que desbloquea]
const SKILL_BRANCHES = {
  paddle: { name: 'Paleta', color: '#4d7cff', angle: -90, minor: [[{ wide: 0.02 }, '+2% de ancho de paleta'], [{ magnet: 0.15 }, 'Imán leve']], nodes: [
    ['pa_wide', '↔', 'Paleta reforzada', 3, { wide: 0.05 }, '+5% de ancho de paleta'],
    ['pa_magnet', '🧲', 'Atracción', 2, { magnet: 0.6 }, 'Monedas y cápsulas se acercan a la paleta'],
    ['pa_barrier', '🧱', 'Escudo inicial', 2, { barrier: 1 }, '+1 barrera al empezar cada nivel'],
    ['pa_act', '🧹', 'Habilidad: Aspirar', 1, { cdr: 0.1 }, 'Desbloquea la habilidad activa Aspirar y da +10% de recarga a tus habilidades', 'vacuum'],
    ['pa_plates', '🏛', 'Placas', 2, { wide: 0.05 }, '+5% de ancho de paleta'],
    ['pa_firm', '⚓', 'Firmeza', 1, { stunImmune: 1 }, 'Inmune al aturdimiento de los jefes'],
    ['pa_big', '📏', 'Gran paleta', 2, { wide: 0.07 }, '+7% de ancho de paleta'],
    ['pa_ult', '🛸', 'Nave nodriza', 1, { wide: 0.15, magnet: 1, barrier: 1 }, 'Paleta +15%, imán fuerte y +1 barrera'],
  ] },
  spin: { name: 'Efecto', color: '#22d3ee', angle: -60, minor: [[{ spin: 0.06 }, '+6% de curva del slice'], [{ spinCrit: 0.01 }, '+1% de crítico con efecto']], nodes: [
    ['sp_spin', '🌀', 'Efecto', 3, { spin: 0.25 }, '+25% de curva del slice'],
    ['sp_dmg', '🎳', 'Curva letal', 1, { spinDmg: 1 }, 'Las bolas con efecto hacen +1 de daño'],
    ['sp_crit', '🎯', 'Curva crítica', 2, { spinCrit: 0.1 }, '+10% de crítico para bolas con efecto'],
    ['sp_act', '🪃', 'Habilidad: Llamada', 1, { cdr: 0.1 }, 'Desbloquea la habilidad activa Llamada y da +10% de recarga a tus habilidades', 'recall'],
    ['sp_master', '🌬', 'Maestría', 2, { spin: 0.3 }, '+30% de curva del slice'],
    ['sp_wind', '🍃', 'Viento', 2, { slow: 0.03 }, 'La bola va 3% más lenta'],
    ['sp_whirl', '💫', 'Remolino', 2, { fever: 0.1 }, 'La FIEBRE se llena 10% más rápido'],
    ['sp_ult', '🌪', 'Huracán', 1, { spin: 1, spinDmg: 1 }, 'Curva x2 y +1 de daño con efecto'],
  ] },
  ball: { name: 'Bola', color: '#e2e8f0', angle: -30, minor: [[{ crit: 0.01 }, '+1% de golpe crítico'], [{ slow: 0.01 }, 'Bola 1% más lenta']], nodes: [
    ['ba_crit', '🎯', 'Golpe pesado', 3, { crit: 0.05 }, '+5% de golpe crítico (daño x3)'],
    ['ba_slow', '🐌', 'Freno', 3, { slow: 0.04 }, 'La bola va 4% más lenta'],
    ['ba_sharp', '🗡', 'Afilado', 1, { sharp: 1 }, '+1 de daño'],
    ['ba_act', '💢', 'Habilidad: Pulso', 1, { cdr: 0.1 }, 'Desbloquea la habilidad activa Pulso y da +10% de recarga a tus habilidades', 'pulse'],
    ['ba_grav', '🪐', 'Gravedad', 2, { slow: 0.03, crit: 0.02 }, 'Bola 3% más lenta y +2% de crítico'],
    ['ba_dense', '⚫', 'Núcleo denso', 2, { bossDmg: 0.2 }, '+20% de daño a jefes'],
    ['ba_crit2', '💥', 'Devastación', 2, { crit: 0.06 }, '+6% de golpe crítico'],
    ['ba_ult', '🔨', 'Coloso', 1, { jugg: 1 }, 'Megabola permanente'],
  ] },
  fire: { name: 'Piromancia', color: '#ff6a1a', angle: 0, minor: [[{ powder: 0.01 }, '+1% de explosiones'], [{ blast: 0.04 }, 'Explosiones 4% más grandes']], nodes: [
    ['fi_powder', '💥', 'Pólvora', 3, { powder: 0.03 }, '+3% de que un ladrillo roto explote'],
    ['fi_ignite', '☄', 'Ignición', 3, { ignite: 2 }, 'Empiezas cada nivel con 2 s de bola de fuego'],
    ['fi_blast', '🧨', 'Onda expansiva', 2, { blast: 0.25 }, 'Explosiones 25% más grandes'],
    ['fi_act', '🎆', 'Habilidad: Bombardeo', 1, { cdr: 0.1 }, 'Desbloquea la habilidad activa Bombardeo y da +10% de recarga a tus habilidades', 'barrage'],
    ['fi_chain', '🔗', 'Reacción en cadena', 2, { powder: 0.04 }, '+4% de explosiones'],
    ['fi_ardor', '🔥', 'Ardor', 3, { fever: 0.12 }, 'La FIEBRE se llena 12% más rápido'],
    ['fi_heat', '🌡', 'Calor', 2, { ignite: 2, blast: 0.15 }, '+2 s de fuego inicial y explosiones 15% más grandes'],
    ['fi_ult', '🌋', 'Volcán', 1, { powder: 0.1, blast: 0.5, ignite: 4 }, '+10% de explosiones, +50% de radio y +4 s de fuego'],
  ] },
  swarm: { name: 'Enjambre', color: '#3ddc84', angle: 30, minor: [[{ twin: 0.05 }, '+5% de bola extra al empezar'], [{ multiWeight: 0.1 }, 'Multibola aparece 10% más']], nodes: [
    ['sw_twin', '⚪', 'Bola gemela', 3, { twin: 0.25 }, '+25% de empezar con una bola extra'],
    ['sw_multi', '🎱', 'Multiplicación', 2, { multiWeight: 0.5 }, 'Multibola aparece 50% más'],
    ['sw_echo', '🔊', 'Eco', 2, { echo: 0.02 }, '+2% de que un ladrillo roto cree una bola'],
    ['sw_act', '➗', 'Habilidad: Dividir', 1, { cdr: 0.1 }, 'Desbloquea la habilidad activa Dividir y da +10% de recarga a tus habilidades', 'multiply'],
    ['sw_hydra', '🐍', 'Hidra', 1, { hydra: 1 }, 'Multibola crea 4 bolas por bola'],
    ['sw_triplets', '🫧', 'Trillizas', 2, { twin: 0.3 }, '+30% de bola extra al empezar'],
    ['sw_reson', '📣', 'Resonancia', 2, { echo: 0.02 }, '+2% de eco'],
    ['sw_ult', '🐝', 'Colmena', 1, { twin: 1, echo: 0.04, multiWeight: 1 }, '+1 bola al empezar, +4% de eco y multibola x2'],
  ] },
  power: { name: 'Poder', color: '#c084fc', angle: 60, minor: [[{ duration: 0.03 }, '+3% de duración de power-ups'], [{ luck: 0.006 }, '+0,6% de cápsulas']], nodes: [
    ['po_dur', '⏱', 'Persistencia', 3, { duration: 0.1 }, '+10% de duración de power-ups'],
    ['po_luck', '🍀', 'Fortuna', 3, { luck: 0.02 }, '+2% de probabilidad de cápsulas'],
    ['po_double', '🎁', 'Doble botín', 3, { doubleDrop: 0.06 }, '6% de que caigan dos cápsulas'],
    ['po_act', '🛡', 'Habilidad: Barrera', 1, { cdr: 0.1 }, 'Desbloquea la habilidad activa Barrera y da +10% de recarga a tus habilidades', 'shield'],
    ['po_pure', '✨', 'Purificador', 2, { noBad: 0.4 }, '−40% de cápsulas malas'],
    ['po_dur2', '⌛', 'Prolongar', 2, { duration: 0.1 }, '+10% de duración de power-ups'],
    ['po_luck2', '🌈', 'Abundancia', 2, { luck: 0.03 }, '+3% de cápsulas'],
    ['po_ult', '🎰', 'Cornucopia', 1, { doubleDrop: 0.15, luck: 0.04, noBad: 0.2 }, 'Más cápsulas, dobles y menos malas'],
  ] },
  combo: { name: 'Combo', color: '#ff4fd8', angle: 90, minor: [[{ memory: 0.03 }, '+3% de combo conservado'], [{ score: 0.015 }, '+1,5% de puntos']], nodes: [
    ['co_mem', '🧠', 'Memoria', 3, { memory: 0.15 }, 'Conservas +15% del combo al tocar la paleta'],
    ['co_start', '➕', 'Arranque', 2, { comboStart: 4 }, 'Empiezas cada nivel con +4 de combo'],
    ['co_flame', '🔥', 'Llama', 2, { fever: 0.15 }, 'La FIEBRE se llena 15% más rápido'],
    ['co_act', '🌡', 'Habilidad: Fiebre', 1, { cdr: 0.1 }, 'Desbloquea la habilidad activa Fiebre y da +10% de recarga a tus habilidades', 'fever'],
    ['co_cap', '📈', 'Techo', 2, { comboCap: 1 }, '+1 al multiplicador máximo de combo'],
    ['co_long', '⏳', 'Fiebre larga', 2, { feverDur: 1 }, 'La FIEBRE dura +1 s'],
    ['co_rhythm', '🥁', 'Ritmo', 3, { score: 0.04 }, '+4% de puntos'],
    ['co_ult', '🎼', 'Sinfonía', 1, { comboCap: 2, memory: 0.2 }, '+2 al multiplicador máximo y +20% de combo conservado'],
  ] },
  fortune: { name: 'Fortuna', color: '#ffcf33', angle: 120, minor: [[{ coinVal: 0.03 }, '+3% de valor de monedas'], [{ interest: 0.03 }, '+3% de recompensa por nivel']], nodes: [
    ['fo_coin', '🪙', 'Monedas brillantes', 3, { coinVal: 0.1 }, '+10% de valor de las monedas'],
    ['fo_chest', '🧰', 'Cofres llenos', 2, { coinsExtra: 2 }, 'Cofres y oro sueltan +2 monedas'],
    ['fo_interest', '🏦', 'Interés', 3, { interest: 0.12 }, '+12% de recompensa al superar un nivel'],
    ['fo_act', '💰', 'Habilidad: Lluvia de oro', 1, { cdr: 0.1 }, 'Desbloquea la habilidad activa Lluvia de oro y da +10% de recarga a tus habilidades', 'goldrain'],
    ['fo_shards', '💎', 'Cristalero', 3, { shards: 0.1 }, '+10% de fragmentos en modo Rogue'],
    ['fo_cont', '🤝', 'Negociante', 2, { contDiscount: 0.2 }, 'Continuar cuesta 20% menos'],
    ['fo_prestige', '🏅', 'Prestigio', 3, { score: 0.04 }, '+4% de puntos'],
    ['fo_ult', '👑', 'Rey Midas', 1, { midas: 0.05, coinVal: 0.25 }, '5% de ladrillos de oro y +25% de valor de monedas'],
  ] },
  hunter: { name: 'Cazador', color: '#f87171', angle: 150, minor: [[{ bossDmg: 0.04 }, '+4% de daño a jefes'], [{ droneCoins: 1 }, 'Los drones sueltan +1 moneda']], nodes: [
    ['hu_boss', '🎯', 'Matagigantes', 3, { bossDmg: 0.15 }, '+15% de daño a jefes'],
    ['hu_calm', '🧘', 'Calma', 2, { bossSlow: 0.15 }, 'Las balas de los jefes van 15% más lentas'],
    ['hu_scrap', '🛸', 'Chatarrero', 1, { droneDrop: 1 }, 'Los drones siempre sueltan una cápsula'],
    ['hu_eye', '👁', 'Ojo del cazador', 1, { bossDmg: 0.2, droneCoins: 2 }, '+20% de daño a jefes y drones más ricos'],
    ['hu_temper', '🪨', 'Templanza', 1, { stunImmune: 1 }, 'Inmune al aturdimiento de los jefes'],
    ['hu_bounty', '💀', 'Recompensa', 2, { droneCoins: 3 }, 'Los drones sueltan +3 monedas'],
    ['hu_exec', '⚔', 'Verdugo', 2, { bossDmg: 0.25 }, '+25% de daño a jefes'],
    ['hu_ult', '🐉', 'Cazadragones', 1, { bossDmg: 0.5, bossSlow: 0.2 }, '+50% de daño a jefes y balas 20% más lentas'],
  ] },
  survival: { name: 'Supervivencia', color: '#fb7185', angle: 180, minor: [[{ rescue: 0.01 }, '+1% de rescate'], [{ vamp: 0.002 }, 'Pequeño drenaje vital']], nodes: [
    ['su_life', '❤', 'Vitalidad', 1, { lives: 1 }, '+1 vida inicial'],
    ['su_rescue', '🪂', 'Rescate', 3, { rescue: 0.06 }, '6% de que una bola perdida rebote de vuelta'],
    ['su_vamp', '🦇', 'Sanguijuela', 1, { vamp: 0.0125 }, '+1 vida cada 80 ladrillos rotos'],
    ['su_heart', '💖', 'Corazón', 1, { lives: 1 }, '+1 vida inicial'],
    ['su_wall', '🛡', 'Muralla', 2, { barrier: 1 }, '+1 barrera al empezar cada nivel'],
    ['su_phoenix', '🪶', 'Fénix', 1, { phoenix: 1 }, 'Una vez por partida renaces con 2 vidas'],
    ['su_net', '🪢', 'Red', 2, { rescue: 0.05 }, '+5% de rescate'],
    ['su_ult', '👼', 'Inmortal', 1, { lives: 2 }, '+2 vidas iniciales'],
  ] },
  chrono: { name: 'Cronos', color: '#2dd4bf', angle: 210, minor: [[{ cdr: 0.02 }, 'Habilidades 2% más rápidas'], [{ slow: 0.01 }, 'Bola 1% más lenta']], nodes: [
    ['ch_haste', '⏳', 'Prisa', 3, { cdr: 0.06 }, 'Las habilidades activas recargan 6% más rápido'],
    ['ch_dilate', '🐌', 'Dilatación', 3, { slow: 0.03 }, 'La bola va 3% más lenta'],
    ['ch_eternal', '⏱', 'Eternizar', 2, { duration: 0.1 }, '+10% de duración de power-ups'],
    ['ch_act', '🕰', 'Habilidad: Tiempo bala', 1, { cdr: 0.1 }, 'Desbloquea la habilidad activa Tiempo bala y da +10% de recarga a tus habilidades', 'bullettime'],
    ['ch_accel', '⌛', 'Aceleración', 2, { cdr: 0.08 }, 'Las habilidades recargan 8% más rápido'],
    ['ch_frost', '🧊', 'Escarcha', 2, { slow: 0.03 }, 'La bola va 3% más lenta'],
    ['ch_charge', '🔋', 'Carga inicial', 2, { actStart: 0.25 }, 'Las habilidades empiezan cada nivel 25% cargadas'],
    ['ch_ult', '♾', 'Paradoja', 1, { cdr: 0.2, slow: 0.05 }, 'Habilidades 20% más rápidas y bola 5% más lenta'],
  ] },
  laser: { name: 'Artillería', color: '#f43f5e', angle: 240, minor: [[{ laserRate: 0.04 }, '+4% de cadencia del láser'], [{ laserStart: 1 }, '+1 s de láser inicial']], nodes: [
    ['la_rate', '⚡', 'Láser afilado', 3, { laserRate: 0.15 }, '+15% de cadencia del láser'],
    ['la_arsenal', '🔫', 'Arsenal', 2, { laserStart: 4 }, 'Empiezas cada nivel con 4 s de láser'],
    ['la_energy', '🔴', 'Alta energía', 2, { laserDmg: 1 }, 'El láser hace +1 de daño'],
    ['la_act', '🔆', 'Habilidad: Rayo', 1, { cdr: 0.1 }, 'Desbloquea la habilidad activa Rayo y da +10% de recarga a tus habilidades', 'beam'],
    ['la_pierce', '🏹', 'Perforante', 2, { laserPierce: 1 }, 'Los láseres atraviesan 1 ladrillo más'],
    ['la_burst', '🔁', 'Ráfaga', 2, { laserRate: 0.2 }, '+20% de cadencia del láser'],
    ['la_ammo', '🔋', 'Munición', 2, { laserStart: 4 }, '+4 s de láser inicial'],
    ['la_ult', '⛈', 'Tormenta', 1, { cannon: 1 }, 'Láser permanente'],
  ] },
};

// Claves de Trascendencia: en el anillo exterior, entre dos ramas vecinas. Requieren las dos claves de rama.
const SKILL_ULTIMATES = [
  { id: 'u_maelstrom', between: ['paddle', 'spin'], icon: '🌊', name: 'Vorágine',     fx: { spin: 0.5, wide: 0.1, magnet: 1 }, desc: 'Curva +50%, paleta +10% e imán' },
  { id: 'u_inferno',   between: ['ball', 'fire'],   icon: '☀', name: 'Infierno',     fx: { ignite: 4, powder: 0.06, crit: 0.05 }, desc: '+4 s de fuego, +6% de explosiones y +5% de crítico' },
  { id: 'u_plague',    between: ['swarm', 'power'], icon: '🦠', name: 'Plaga',        fx: { echo: 0.04, doubleDrop: 0.1, duration: 0.2 }, desc: 'Más ecos, cápsulas dobles y power-ups más largos' },
  { id: 'u_golden',    between: ['combo', 'fortune'], icon: '🌟', name: 'Edad dorada', fx: { score: 0.25, coinVal: 0.25 }, desc: '+25% de puntos y de valor de monedas' },
  { id: 'u_eternal',   between: ['hunter', 'survival'], icon: '⚜', name: 'Eternidad', fx: { phoenix: 1, lives: 1, bossDmg: 0.25 }, desc: 'Un Fénix extra, +1 vida y +25% de daño a jefes' },
  { id: 'u_singular',  between: ['chrono', 'laser'], icon: '🌀', name: 'Singularidad', fx: { cdr: 0.2, cannon: 1 }, desc: 'Láser permanente y habilidades 20% más rápidas' },
];

// ---------- Clases ----------
const CLASSES = {
  titan:     { icon: '🗿', name: 'Titán',      home: 'ball',     active: 'pulse',      fx: { sharp: 1, crit: 0.05, bossDmg: 0.2 },     desc: 'La bola golpea como un martillo: +1 de daño, +5% de crítico y +20% contra jefes.' },
  merchant:  { icon: '💰', name: 'Mercader',   home: 'fortune',  active: 'goldrain',   fx: { coinVal: 0.5, interest: 0.25, coinsExtra: 2 }, desc: 'Todo brilla: +50% de valor de monedas, +25% de recompensa y cofres más llenos.' },
  swarm:     { icon: '🐝', name: 'Enjambre',   home: 'swarm',    active: 'multiply',   fx: { twin: 1, multiWeight: 0.5, hydra: 1 },    desc: 'Nunca juega con una sola bola: +1 bola inicial, multibola más frecuente y Hidra.' },
  gunner:    { icon: '🔫', name: 'Artillero',  home: 'laser',    active: 'beam',       fx: { laserStart: 6, laserRate: 0.3 },          desc: 'Dispara primero: 6 s de láser al empezar y +30% de cadencia.' },
  guardian:  { icon: '🛡', name: 'Guardián',   home: 'survival', active: 'shield',     fx: { lives: 1, barrier: 1, rescue: 0.05 },     desc: 'Muro inquebrantable: +1 vida, +1 barrera inicial y 5% de rescate.' },
  pyro:      { icon: '🔥', name: 'Piromante',  home: 'fire',     active: 'barrage',    fx: { powder: 0.08, ignite: 3, blast: 0.2 },    desc: 'Todo arde: +8% de explosiones, 3 s de fuego inicial y explosiones más grandes.' },
  chrono:    { icon: '⏳', name: 'Cronomante', home: 'chrono',   active: 'bullettime', fx: { slow: 0.1, duration: 0.2, cdr: 0.15 },    desc: 'Dueño del tiempo: bola 10% más lenta, power-ups más largos y habilidades más rápidas.' },
  weaver:    { icon: '🌀', name: 'Tejedor',    home: 'spin',     active: 'recall',     fx: { spin: 0.5, spinDmg: 1, spinCrit: 0.05 },  desc: 'Maestro del slice: +50% de curva, +1 de daño y +5% de crítico con efecto.' },
};

// ---------- Desbloqueos de campaña ----------
const Unlocks = {
  cleared: n => (Save.d.stars[n] || 0) > 0,
  levelOf(key) { for (const [lv, r] of Object.entries(CAMPAIGN_REWARDS)) if (r.key === key) return +lv; return 0; },
  has(key) { const lv = this.levelOf(key); return !lv || this.cleared(lv); },
  fx() {
    const out = {};
    for (const [lv, r] of Object.entries(CAMPAIGN_REWARDS)) if (r.fx && this.cleared(+lv)) for (const q in r.fx) out[q] = (out[q] || 0) + r.fx[q];
    return out;
  },
  // Al superar un nivel por primera vez: entrega premios únicos y devuelve el desbloqueo.
  grant(n) {
    const r = CAMPAIGN_REWARDS[n];
    if (!r) return null;
    if (r.bonus) {
      Save.d.coins += 500;
      Save.d.skills.points += 5;
      Save.d.skills.earned += 5;
      if (!Save.d.owned.paddle.includes('gold')) Save.d.owned.paddle.push('gold');
    }
    Skills.invalidate();
    return r;
  },
};

// ---------- Nivel de cuenta ----------
const PROFILE_MILESTONES = [
  { lv: 5,  icon: '🏅', name: 'Veterano',          desc: '+5% de puntos en todos los modos', fx: { score: 0.05 } },
  { lv: 10, icon: '🎭', name: 'Clase secundaria',  desc: 'Elige una segunda clase: su bono al 50%, su habilidad y un segundo punto de partida en el árbol' },
  { lv: 15, icon: '❤', name: 'Resistencia',        desc: '+1 vida inicial', fx: { lives: 1 } },
  { lv: 20, icon: '🎛', name: 'Ranura extra',      desc: 'Una ranura más de habilidad activa' },
  { lv: 25, icon: '🎭', name: 'Maestría dual',     desc: 'El bono de tu clase secundaria sube al 100%' },
  { lv: 30, icon: '💰', name: 'Fortuna de cuenta', desc: '+15% de valor de monedas', fx: { coinVal: 0.15 } },
  { lv: 40, icon: '🌳', name: 'Sabio',             desc: 'Cada nivel te da 2 PH en vez de 1' },
  { lv: 50, icon: '👑', name: 'Leyenda',           desc: '+10% de puntos y +1 barrera inicial', fx: { score: 0.1, barrier: 1 } },
];

const Progress = (() => {
  const P = () => Save.d.profile;
  const need = L => 300 + 120 * L;
  const level = () => P().level;
  const has = lv => P().level >= lv;

  function fx() {
    const out = {};
    for (const m of PROFILE_MILESTONES) if (m.fx && has(m.lv)) for (const k in m.fx) out[k] = (out[k] || 0) + m.fx[k];
    return out;
  }

  // Suma experiencia; devuelve los niveles ganados y entrega las recompensas.
  function add(xp) {
    const p = P();
    p.xp += Math.max(0, Math.floor(xp));
    const gained = [];
    while (p.xp >= need(p.level)) {
      p.xp -= need(p.level);
      p.level++;
      const ph = p.level >= 40 ? 2 : 1;
      const coins = 20 + p.level * 5;
      Save.d.skills.points += ph;
      Save.d.skills.earned += ph;
      Save.d.coins += coins;
      gained.push({ level: p.level, ph, coins, milestone: PROFILE_MILESTONES.find(m => m.lv === p.level) });
    }
    if (gained.length) Skills.invalidate();
    Save.save();
    return gained;
  }

  return { need, level, has, fx, add, xp: () => P().xp };
})();

const SKILL_TREE = [];

(function buildTree() {
  const rad = d => d * Math.PI / 180;
  const polar = (deg, r) => ({ x: Math.cos(rad(deg)) * r, y: Math.sin(rad(deg)) * r });
  const add = n => { SKILL_TREE.push(n); return n; };
  const RADII = { gate: 15, 1: 25, 2: 35, 3: 45, 4: 55, 5: 65, 6: 76 };
  const SHAPE = [[1, 0, ['gate']], [2, -1, [0]], [2, 1, [0]], [3, 0, [1, 2]], [4, -1, [3]], [4, 1, [3]], [5, 0, [4, 5]], [6, 0, [6]]];
  const links = [];
  let mk = 0;

  // anillo interior de puertas (una por rama) conectadas entre sí
  const keys = Object.keys(SKILL_BRANCHES);
  for (const k of keys) {
    const b = SKILL_BRANCHES[k];
    const [fx, desc] = b.minor[0];
    add({ id: `gate_${k}`, branch: k, kind: 'gate', icon: '', name: `Puerta: ${b.name}`, max: 1, fx, desc, ...polar(b.angle, RADII.gate) });
  }
  keys.forEach((k, i) => links.push([`gate_${k}`, `gate_${keys[(i + 1) % keys.length]}`, false]));

  // ramas
  for (const k of keys) {
    const b = SKILL_BRANCHES[k];
    b.nodes.forEach((e, i) => {
      const [id, icon, name, max, fx, desc, active] = e;
      const [row, off, reqs] = SHAPE[i];
      const r = RADII[row];
      const ang = rad(b.angle) + off * Math.min(8.5, r * 0.17) / r;
      add({ id, branch: k, kind: row === 6 ? 'keystone' : active ? 'active' : 'notable', row, icon, name, max, fx, desc, active,
        x: Math.cos(ang) * r, y: Math.sin(ang) * r });
      for (const q of reqs) links.push([q === 'gate' ? `gate_${k}` : b.nodes[q][0], id, true]);
    });
  }

  // ramas simples sin salida: cadenas cortas que terminan en un pequeño premio
  for (const k of keys) {
    const b = SKILL_BRANCHES[k];
    const spurs = [
      { from: b.nodes[4][0], pts: [[60, -1.6], [65.5, -2.0], [71, -2.2]], minor: b.minor[0], mult: 4, icon: '✦', name: `Cúmulo de ${b.name}` },
      { from: b.nodes[5][0], pts: [[61, 1.4], [68, 1.6], [75, 1.7]], minor: b.minor[1], mult: 5, icon: '❖', name: `Joya de ${b.name}` },
    ];
    spurs.forEach((sp, si) => {
      let prev = sp.from;
      sp.pts.forEach(([r, off], i) => {
        const last = i === sp.pts.length - 1;
        const ang = rad(b.angle) + off * 8.5 / r;
        const [fx, desc] = sp.minor;
        const id = `sp_${k}_${si}_${i}`;
        const bigFx = Object.fromEntries(Object.entries(fx).map(([q, v]) => [q, v * sp.mult]));
        add({
          id, branch: k, kind: last ? 'spur' : 'minor', icon: last ? sp.icon : '', name: last ? sp.name : `Sendero: ${b.name}`, max: 1,
          fx: last ? bigFx : fx, desc: last ? `${desc} ×${sp.mult} (fin del sendero)` : desc,
          x: Math.cos(ang) * r, y: Math.sin(ang) * r,
        });
        links.push([prev, id, false]);
        prev = id;
      });
    });
  }

  // trascendencia
  for (const u of SKILL_ULTIMATES) {
    const [a, c] = u.between;
    const ang = (SKILL_BRANCHES[a].angle + SKILL_BRANCHES[c].angle) / 2;
    add({ id: u.id, branch: 'ultimate', kind: 'ultimate', row: 7, icon: u.icon, name: u.name, max: 1, fx: u.fx, desc: u.desc, ...polar(ang, 90),
      reqAll: [SKILL_BRANCHES[a].nodes[7][0], SKILL_BRANCHES[c].nodes[7][0]] });
    for (const q of u.between) links.push([SKILL_BRANCHES[q].nodes[7][0], u.id, true]);
  }

  // clases: punto de partida en el centro, apuntando a su rama
  for (const [id, c] of Object.entries(CLASSES)) {
    add({ id: `cls_${id}`, cls: id, branch: c.home, kind: 'class', icon: c.icon, name: c.name, max: 1, fx: {}, desc: c.desc,
      ...polar(SKILL_BRANCHES[c.home].angle, 9.6) });
    links.push([`cls_${id}`, `gate_${c.home}`, false]);
  }

  // nodos de tránsito entre nodos importantes
  const byId = Object.fromEntries(SKILL_TREE.map(n => [n.id, n]));
  const edges = [];
  for (const [a, b, withMinor] of links) {
    if (!withMinor) { edges.push([a, b]); continue; }
    const p = byId[a], q = byId[b];
    const branch = q.kind === 'ultimate' ? p.branch : q.branch;
    const [fx, desc] = SKILL_BRANCHES[branch].minor[mk++ % 2];
    const id = `m_${a}_${b}`;
    add({ id, branch, kind: 'minor', icon: '', name: `Tránsito: ${SKILL_BRANCHES[branch].name}`, max: 1, fx, desc,
      x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 });
    edges.push([a, id], [id, b]);
    if (q.reqAll) q.reqAll = q.reqAll.map(r => (r === a ? id : r));
  }
  for (const n of SKILL_TREE) n.links = [];
  const all = Object.fromEntries(SKILL_TREE.map(n => [n.id, n]));
  for (const [a, b] of edges) { all[a].links.push(b); all[b].links.push(a); }
  SKILL_TREE.edges = edges;
})();

const Skills = (() => {
  const XP_PER_POINT = 3000;
  const S = () => Save.d.skills;
  const byId = Object.fromEntries(SKILL_TREE.map(n => [n.id, n]));
  let cache = null;

  const cls = () => CLASSES[S().cls] || null;
  const secondaryOpen = () => Progress.has(10);
  const cls2 = () => (secondaryOpen() && S().cls2 && S().cls2 !== S().cls ? CLASSES[S().cls2] : null);
  const slotCount = () => 1 + (Unlocks.has('slot2') ? 1 : 0) + (Progress.has(20) ? 1 : 0);
  const rank = id => {
    const n = byId[id];
    if (n && n.kind === 'class') return n.cls === S().cls || (cls2() && n.cls === S().cls2) ? 1 : 0;
    return S().ranks[id] || 0;
  };
  const node = id => byId[id];
  const cost = n => ({ minor: 1, gate: 1, class: 0, spur: 2, active: 2, keystone: 5, ultimate: 8 }[n.kind] || (n.row >= 5 ? 3 : n.row >= 3 ? 2 : 1));

  function recompute() {
    cache = {};
    const addFx = (fx, mult) => { for (const k in fx) cache[k] = (cache[k] || 0) + fx[k] * mult; };
    for (const n of SKILL_TREE) { const r = rank(n.id); if (r && n.kind !== 'class') addFx(n.fx, r); }
    if (cls()) addFx(cls().fx, 1);
    if (cls2()) addFx(cls2().fx, Progress.has(25) ? 1 : 0.5);
    addFx(Progress.fx(), 1);
    addFx(Unlocks.fx(), 1);
  }
  function val(k) { if (!cache) recompute(); return cache[k] || 0; }

  function unlockedReq(n) {
    if (!cls() || n.kind === 'class') return false;
    if (n.reqAll) return n.reqAll.every(id => rank(id) > 0);
    return n.links.some(id => rank(id) > 0);
  }
  const canBuy = n => rank(n.id) < n.max && S().points >= cost(n) && unlockedReq(n);

  function buy(id) {
    const n = byId[id];
    if (!n || !canBuy(n)) return false;
    S().points -= cost(n);
    S().ranks[id] = rank(id) + 1;
    recompute();
    Save.save();
    return true;
  }

  const spentTotal = () => SKILL_TREE.reduce((a, n) => a + (n.kind === 'class' ? 0 : (S().ranks[n.id] || 0) * cost(n)), 0);
  const maxTotal = () => SKILL_TREE.reduce((a, n) => a + n.max * cost(n), 0);

  function respec() {
    const refund = spentTotal();
    S().points += refund;
    S().ranks = {};
    recompute();
    sanitizeEquip();
    Save.save();
    return refund;
  }

  function setClass(id) {
    const refund = respec();
    S().cls = id;
    if (S().cls2 === id) S().cls2 = null;
    S().equip = [CLASSES[id].active, null, null];
    recompute();
    Save.save();
    return refund;
  }

  function setSecondary(id) {
    const refund = respec();
    S().cls2 = id;
    recompute();
    sanitizeEquip();
    Save.save();
    return refund;
  }

  // ---------- habilidades activas ----------
  function actives() {
    const out = [];
    if (cls()) out.push(cls().active);
    if (cls2() && !out.includes(cls2().active)) out.push(cls2().active);
    for (const n of SKILL_TREE) if (n.active && rank(n.id) > 0 && !out.includes(n.active)) out.push(n.active);
    return out;
  }
  function sanitizeEquip() {
    const have = actives(), n = slotCount();
    const eq = Array.from({ length: n }, (_, i) => ((S().equip || [])[i] && have.includes(S().equip[i]) ? S().equip[i] : null));
    for (let i = 0; i < n; i++) if (eq[i] && eq.indexOf(eq[i]) !== i) eq[i] = null;
    if (!eq[0] && have.length) eq[0] = have.find(a => !eq.includes(a)) || null;
    S().equip = eq;
    return eq;
  }
  const equipped = () => sanitizeEquip();
  function cycleSlot(i) {
    const have = actives(), eq = sanitizeEquip();
    const opts = [null, ...have.filter(a => !eq.some((x, j) => j !== i && x === a))];
    eq[i] = opts[(opts.indexOf(eq[i]) + 1) % opts.length];
    S().equip = eq;
    Save.save();
  }

  // ---------- puntos de campaña ----------
  function syncCampaign() {
    const s = S();
    const stars = Object.values(Save.d.stars).reduce((a, b) => a + b, 0);
    let gained = 0;
    if (stars > s.starsCredited) { gained += stars - s.starsCredited; s.starsCredited = stars; }
    LEVELS.forEach((l, i) => {
      if (l.boss && (Save.d.stars[i + 1] || 0) > 0 && !s.bosses[i + 1]) { s.bosses[i + 1] = 1; gained += 3; }
    });
    s.points += gained;
    s.earned += gained;
    return gained;
  }

  function addXp(score) {
    const s = S();
    s.xp += Math.max(0, score);
    let gained = 0;
    while (s.xp >= XP_PER_POINT) { s.xp -= XP_PER_POINT; gained++; }
    s.points += gained;
    s.earned += gained;
    return gained;
  }

  const anyAffordable = () => SKILL_TREE.some(canBuy);

  return {
    val, rank, cost, canBuy, buy, respec, setClass, setSecondary, cls, cls2, secondaryOpen, slotCount, syncCampaign, addXp, unlockedReq, spentTotal, maxTotal,
    anyAffordable, node, actives, equipped, cycleSlot, XP_PER_POINT, invalidate: () => { cache = null; },
  };
})();
