const clueCanvas = document.getElementById('clueCanvas');
const clueCtx = clueCanvas.getContext('2d');
const blueprintCanvas = document.getElementById('blueprintCanvas');
const blueprintCtx = blueprintCanvas.getContext('2d');
const homeExampleCanvas = document.getElementById('homeExampleCanvas');
const homeExampleCtx = homeExampleCanvas.getContext('2d');
const browserPreviewCanvas = document.getElementById('browserPreviewCanvas');
const browserPreviewCtx = browserPreviewCanvas.getContext('2d');
const browserModifierSelect = document.getElementById('browserModifierSelect');

const navButtons = [...document.querySelectorAll('.nav-btn')];
const sections = [...document.querySelectorAll('.section')];
const filterButtons = [...document.querySelectorAll('.filter-btn')];

const modeSelect = document.getElementById('modeSelect');
const difficultySelect = document.getElementById('difficultySelect');
const modifierSelect = document.getElementById('modifierSelect');
const roundCountSelect = document.getElementById('roundCountSelect');
const startGameBtn = document.getElementById('startGameBtn');
const nextRoundBtn = document.getElementById('nextRoundBtn');
const confirmGuessBtn = document.getElementById('confirmGuessBtn');
const helpBtn = document.getElementById('helpBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const zoomResetBtn = document.getElementById('zoomResetBtn');

const closeHelpBtn = document.getElementById('closeHelpBtn');
const helpBackdrop = document.getElementById('helpBackdrop');
const helpModal = document.getElementById('helpModal');

const roundModal = document.getElementById('roundModal');
const roundBackdrop = document.getElementById('roundBackdrop');
const roundResultBody = document.getElementById('roundResultBody');
const roundModalNextBtn = document.getElementById('roundModalNextBtn');

const roundText = document.getElementById('roundText');
const scoreText = document.getElementById('scoreText');
const timeText = document.getElementById('timeText');
const clueMetaText = document.getElementById('clueMetaText');
const blueprintMetaText = document.getElementById('blueprintMetaText');
const difficultyBadge = document.getElementById('difficultyBadge');
const selectedMapBadge = document.getElementById('selectedMapBadge');
const zoomLevelText = document.getElementById('zoomLevelText');
const statusMessage = document.getElementById('statusMessage');
const mapButtonsGrid = document.getElementById('mapButtonsGrid');
const mapPoolText = document.getElementById('mapPoolText');
const mapsList = document.getElementById('mapsList');
const browserPreviewMeta = document.getElementById('browserPreviewMeta');
const browserPreviewBadge = document.getElementById('browserPreviewBadge');
const mapsBrowserSummary = document.getElementById('mapsBrowserSummary');
const recordsTableBody = document.getElementById('recordsTableBody');
const recordModeFilter = document.getElementById('recordModeFilter');
const recordDifficultyFilter = document.getElementById('recordDifficultyFilter');
const recordModifierFilter = document.getElementById('recordModifierFilter');
const recordRoundsFilter = document.getElementById('recordRoundsFilter');
const logsOverview = document.getElementById('logsOverview');
const logsList = document.getElementById('logsList');

const SOURCE_WIDTH = 1200;
const SOURCE_HEIGHT = 1600;
const RECORDS_KEY = 'b2guessr-records-v1';
const ATTEMPTS_KEY = 'b2guessr-attempts-v1';
const BLUEPRINT_CACHE = new Map();

const MODE_LABELS = { all: 'All Maps', hom: 'Hall of Masters' };
const MODIFIER_LABELS = { none: 'None', bw: 'Black and White', invert: 'Inverted', pixel: 'Pixelated', upside: 'Upside Down' };
const ROUND_OPTIONS = [5, 10, 15];

const DIFFICULTY_PRESETS = {
  beginner: { label: 'Beginner', cropScale: 0.56 },
  intermediate: { label: 'Intermediate', cropScale: 0.42 },
  advanced: { label: 'Advanced', cropScale: 0.29 },
  expert: { label: 'Expert', cropScale: 0.10 },
  chimps: { label: 'CHIMPS', cropScale: 0.072 }
};

const state = {
  started: false,
  roundLocked: true,
  currentRound: 0,
  totalRounds: 5,
  totalScore: 0,
  bestScore: 0,
  bestTimeMs: null,
  elapsedMs: 0,
  runStartMs: 0,
  timerHandle: null,
  selectedMapId: null,
  answerMapId: null,
  targetPoint: null,
  difficulty: 'intermediate',
  mode: 'all',
  modifier: 'none',
  browserFilter: 'all',
  browserSelectedId: null,
  browserModifier: 'none',
  blueprintView: {
    zoom: 1,
    min: 1,
    max: 5,
    x: 0,
    y: 0,
    dragging: false,
    moved: false,
    lastX: 0,
    lastY: 0
  },
  resultOverlay: null,
  pendingGuess: null
};

const imageLoadPromise = Promise.all(
  MAPS.map(map => new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      map.img = img;
      resolve();
    };
    img.onerror = () => {
      console.error('Failed to load image', map.image);
      resolve();
    };
    img.src = map.image;
  }))
);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getMapById(id) {
  return MAPS.find(map => map.id === id);
}

function getPool(mode) {
  return mode === 'hom' ? MAPS.filter(map => map.hallOfMasters) : MAPS.slice();
}

function getBrowserPool(filter) {
  return filter === 'hom' ? MAPS.filter(map => map.hallOfMasters) : MAPS.slice();
}
function getButtonThumbPosition(mapId) {
  const custom = {
    'banana-depot': 'center 42%',
    'bloonstone-quarry': 'center 38%',
    'bloontonium-mines': 'center 36%',
    'bot-factory': 'center 50%',
    'building-site': 'center 34%',
    'castle-ruins': 'center 40%',
    'cobra-command': 'center 48%',
    'dino-graveyard': 'center 44%',
    'docks': 'center 54%',
    'garden': 'center 40%',
    'glade': 'center 54%',
    'in-the-wall': 'center 48%',
    'inflection': 'center 46%',
    'island-base': 'center 46%',
    'koru': 'center 45%',
    'magma-mixup': 'center 50%',
    'mayan': 'center 42%',
    'neo-highway': 'center 44%',
    'oasis': 'center 40%',
    'off-tide': 'center 55%',
    'park': 'center 42%',
    'pirate-cove': 'center 52%',
    'ports': 'center 46%',
    'precious-space': 'center 40%',
    'salmon-ladder': 'center 42%',
    'sands-of-time': 'center 46%',
    'splashdown': 'center 52%',
    'star': 'center 48%',
    'street-party': 'center 48%',
    'sun-palace': 'center 42%',
    'thin-ice': 'center 46%',
    'times-up': 'center 46%',
    'up-on-the-roof': 'center 46%'
  };
  return custom[mapId] || 'center 42%';
}


function getMapLabelClass(name) {
  const compact = name.replace(/[^a-zA-Z0-9]/g, '');
  if (compact.length >= 18) return ' is-xlong';
  if (compact.length >= 14) return ' is-long';
  return '';
}

function applyMapButtonThumbnail(button, map) {
  const thumbUrl = new URL(map.image, window.location.href).href;
  button.style.setProperty('--thumb-image', `url("${thumbUrl}")`);
  button.style.setProperty('--thumb-pos', getButtonThumbPosition(map.id));
}


function getRulesetKey(mode = state.mode, difficulty = state.difficulty, modifier = state.modifier, rounds = state.totalRounds) {
  return [mode, difficulty, modifier, rounds].join('|');
}

function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem(RECORDS_KEY) || '{}');
  } catch (error) {
    console.warn('Records reset because stored data was invalid.', error);
    return {};
  }
}

function saveRecords(records) {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

function loadAttempts() {
  try {
    return JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || '[]');
  } catch (error) {
    console.warn('Attempt logs reset because stored data was invalid.', error);
    return [];
  }
}

function saveAttempts(attempts) {
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
}

function addAttemptLog(entry) {
  const attempts = loadAttempts();
  attempts.unshift(entry);
  saveAttempts(attempts);
}

function formatMode(mode) {
  return MODE_LABELS[mode] || mode;
}

function formatModifier(modifier) {
  return MODIFIER_LABELS[modifier] || modifier;
}

function formatDifficulty(difficulty) {
  return DIFFICULTY_PRESETS[difficulty]?.label || difficulty;
}

function formatDateTime(timestamp) {
  try {
    return new Date(timestamp).toLocaleString();
  } catch (error) {
    return 'Unknown date';
  }
}

function getRulesetRecords(mode = state.mode, difficulty = state.difficulty, modifier = state.modifier, rounds = state.totalRounds) {
  const records = loadRecords();
  return records[getRulesetKey(mode, difficulty, modifier, rounds)] || { bestScore: 0, bestTimeMs: null };
}

function applyRulesetRecords(score, timeMs) {
  const records = loadRecords();
  const key = getRulesetKey();
  const current = records[key] || { bestScore: 0, bestTimeMs: null };

  if (score > current.bestScore) current.bestScore = score;
  if (typeof timeMs === 'number' && Number.isFinite(timeMs) && timeMs > 0) {
    if (current.bestTimeMs == null || timeMs < current.bestTimeMs) current.bestTimeMs = timeMs;
  }

  records[key] = current;
  saveRecords(records);
  state.bestScore = current.bestScore;
  state.bestTimeMs = current.bestTimeMs;
}

function syncRulesetRecordsFromControls() {
  const mode = state.started ? state.mode : modeSelect.value;
  const difficulty = state.started ? state.difficulty : difficultySelect.value;
  const modifier = state.started ? state.modifier : modifierSelect.value;
  const rounds = state.started ? state.totalRounds : Number(roundCountSelect.value);
  const records = getRulesetRecords(mode, difficulty, modifier, rounds);
  state.bestScore = records.bestScore;
  state.bestTimeMs = records.bestTimeMs;
}

function formatTime(ms, fallback = '00:00.0') {
  if (ms == null || !Number.isFinite(ms)) return fallback;
  const totalTenths = Math.max(0, Math.round(ms / 100));
  const minutes = Math.floor(totalTenths / 600);
  const seconds = Math.floor((totalTenths % 600) / 10);
  const tenths = totalTenths % 10;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remMinutes = minutes % 60;
    return `${hours}:${String(remMinutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`;
}

function getLiveElapsedMs() {
  if (state.started && state.runStartMs) {
    return performance.now() - state.runStartMs;
  }
  return state.elapsedMs;
}

function startRunTimer() {
  if (state.timerHandle) clearInterval(state.timerHandle);
  state.elapsedMs = 0;
  state.runStartMs = performance.now();
  state.timerHandle = window.setInterval(() => {
    state.elapsedMs = performance.now() - state.runStartMs;
    refreshStats();
  }, 100);
}

function stopRunTimer() {
  if (state.runStartMs) {
    state.elapsedMs = performance.now() - state.runStartMs;
  }
  if (state.timerHandle) {
    clearInterval(state.timerHandle);
    state.timerHandle = null;
  }
  state.runStartMs = 0;
  refreshStats();
  return state.elapsedMs;
}

function showSection(name) {
  navButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.section === name));
  sections.forEach(section => section.classList.toggle('active', section.id === `section-${name}`));
  if (name === 'records') renderRecordsPage();
  if (name === 'logs') renderLogsPage();
}

navButtons.forEach(btn => btn.addEventListener('click', () => showSection(btn.dataset.section)));

function refreshStats() {
  roundText.textContent = `${state.currentRound} / ${state.totalRounds}`;
  scoreText.textContent = String(state.totalScore);
  timeText.textContent = formatTime(getLiveElapsedMs());
  difficultyBadge.textContent = DIFFICULTY_PRESETS[state.difficulty].label;
  zoomLevelText.textContent = `${state.blueprintView.zoom.toFixed(1)}x`;
}

function drawPlaceholder(ctx, title, subtitle, canvas) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#11284b');
  gradient.addColorStop(1, '#09152b');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  for (let y = 30; y < canvas.height; y += 36) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.textAlign = 'center';
  ctx.font = '700 26px Arial';
  ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 12);
  ctx.fillStyle = 'rgba(255,255,255,0.58)';
  ctx.font = '600 15px Arial';
  ctx.fillText(subtitle, canvas.width / 2, canvas.height / 2 + 20);
}

function drawCrosshair(ctx, canvas) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.strokeStyle = 'rgba(40, 0, 0, 0.45)';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.strokeStyle = 'rgba(255, 72, 72, 0.68)';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();
}

function drawFramedImage(ctx, img, canvas) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 12;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);
}

function applyFullModifierDraw(ctx, img, canvas, modifier) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = modifier !== 'pixel';

  if (modifier === 'pixel') {
    const tiny = document.createElement('canvas');
    tiny.width = Math.max(34, Math.round(canvas.width / 12));
    tiny.height = Math.max(46, Math.round(canvas.height / 12));
    const tinyCtx = tiny.getContext('2d');
    tinyCtx.imageSmoothingEnabled = false;
    tinyCtx.drawImage(img, 0, 0, tiny.width, tiny.height);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tiny, 0, 0, tiny.width, tiny.height, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  } else {
    ctx.save();
    if (modifier === 'bw') ctx.filter = 'grayscale(1)';
    if (modifier === 'invert') ctx.filter = 'invert(1)';
    if (modifier === 'upside') {
      ctx.translate(canvas.width, canvas.height);
      ctx.rotate(Math.PI);
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 12;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);
}

function applyClueModifierDraw(ctx, img, sx, sy, sw, sh, canvas, modifier) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = modifier !== 'pixel';

  if (modifier === 'pixel') {
    const tiny = document.createElement('canvas');
    tiny.width = Math.max(40, Math.round(canvas.width / 12));
    tiny.height = Math.max(52, Math.round(canvas.height / 12));
    const tinyCtx = tiny.getContext('2d');
    tinyCtx.imageSmoothingEnabled = false;
    tinyCtx.drawImage(img, sx, sy, sw, sh, 0, 0, tiny.width, tiny.height);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tiny, 0, 0, tiny.width, tiny.height, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  } else {
    ctx.save();
    if (modifier === 'bw') ctx.filter = 'grayscale(1)';
    if (modifier === 'invert') ctx.filter = 'invert(1)';
    if (modifier === 'upside') {
      ctx.translate(canvas.width, canvas.height);
      ctx.rotate(Math.PI);
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 12;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);
  drawCrosshair(ctx, canvas);
}

function selectTargetPoint(map, difficulty) {
  const preset = DIFFICULTY_PRESETS[difficulty];
  const cropW = SOURCE_WIDTH * preset.cropScale;
  const cropH = SOURCE_HEIGHT * preset.cropScale;
  const marginX = cropW / 2 / SOURCE_WIDTH;
  const marginY = cropH / 2 / SOURCE_HEIGHT;

  const valid = (map.candidates || []).filter(([x, y]) => (
    x >= marginX && x <= 1 - marginX && y >= marginY && y <= 1 - marginY
  ));

  if (valid.length) return randomItem(valid);

  return [
    Number((marginX + Math.random() * (1 - marginX * 2)).toFixed(4)),
    Number((marginY + Math.random() * (1 - marginY * 2)).toFixed(4))
  ];
}

function renderClue(map, point, difficulty, modifier, targetCanvas = clueCanvas, targetCtx = clueCtx) {
  const preset = DIFFICULTY_PRESETS[difficulty];
  const cropW = SOURCE_WIDTH * preset.cropScale;
  const cropH = SOURCE_HEIGHT * preset.cropScale;
  const centerX = point[0] * SOURCE_WIDTH;
  const centerY = point[1] * SOURCE_HEIGHT;
  const sx = Math.round(centerX - cropW / 2);
  const sy = Math.round(centerY - cropH / 2);

  applyClueModifierDraw(targetCtx, map.img, sx, sy, cropW, cropH, targetCanvas, modifier);

  if (targetCanvas === clueCanvas) {
    clueMetaText.textContent = `${preset.label} image${modifier !== 'none' ? ` • ${modifierLabel(modifier)}` : ''} • center this image on the full map.`;
  }
}

function modifierLabel(value) {
  switch (value) {
    case 'bw': return 'Black and White';
    case 'invert': return 'Inverted';
    case 'pixel': return 'Pixelated';
    case 'upside': return 'Upside Down';
    default: return 'None';
  }
}

function getBlueprintSource(map) {
  if (BLUEPRINT_CACHE.has(map.id)) return BLUEPRINT_CACHE.get(map.id);

  const off = document.createElement('canvas');
  off.width = blueprintCanvas.width;
  off.height = blueprintCanvas.height;
  const ctx = off.getContext('2d');

  // Base: keep the original map colors
  ctx.drawImage(map.img, 0, 0, off.width, off.height);

  // Very light desaturated pass on top
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.filter = 'grayscale(1) contrast(1.03) brightness(1.02)';
  ctx.drawImage(map.img, 0, 0, off.width, off.height);
  ctx.restore();

  // Very faint blue tint
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = 'rgba(70, 145, 235, 0.05)';
  ctx.fillRect(0, 0, off.width, off.height);
  ctx.restore();

  // Subtle grid
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 1;
  for (let x = 0; x < off.width; x += 36) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, off.height);
    ctx.stroke();
  }
  for (let y = 0; y < off.height; y += 36) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(off.width, y);
    ctx.stroke();
  }

  BLUEPRINT_CACHE.set(map.id, off);
  return off;
}

function resetBlueprintView() {
  state.blueprintView.zoom = 1;
  state.blueprintView.x = 0;
  state.blueprintView.y = 0;
  refreshStats();
}

function getVisibleView() {
  return {
    width: blueprintCanvas.width / state.blueprintView.zoom,
    height: blueprintCanvas.height / state.blueprintView.zoom
  };
}

function clampBlueprintView() {
  const sourceMapId = state.resultOverlay?.displayMapId || state.selectedMapId;
  if (!sourceMapId) return;
  const source = getBlueprintSource(getMapById(sourceMapId));
  const view = getVisibleView();
  state.blueprintView.x = clamp(state.blueprintView.x, 0, source.width - view.width);
  state.blueprintView.y = clamp(state.blueprintView.y, 0, source.height - view.height);
}

function normalizedToScreen(nx, ny) {
  const sourceMapId = state.resultOverlay?.displayMapId || state.selectedMapId;
  if (!sourceMapId) return null;
  const source = getBlueprintSource(getMapById(sourceMapId));
  const view = getVisibleView();
  const sourceX = nx * source.width;
  const sourceY = ny * source.height;
  return {
    x: ((sourceX - state.blueprintView.x) / view.width) * blueprintCanvas.width,
    y: ((sourceY - state.blueprintView.y) / view.height) * blueprintCanvas.height
  };
}

function screenToNormalized(x, y) {
  const sourceMapId = state.resultOverlay?.displayMapId || state.selectedMapId;
  if (!sourceMapId) return null;
  const source = getBlueprintSource(getMapById(sourceMapId));
  const view = getVisibleView();
  return {
    x: clamp((state.blueprintView.x + (x / blueprintCanvas.width) * view.width) / source.width, 0, 1),
    y: clamp((state.blueprintView.y + (y / blueprintCanvas.height) * view.height) / source.height, 0, 1)
  };
}

function drawMarker(ctx, x, y, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawConnectionLine(ctx, x1, y1, x2, y2) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.38)';
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function clearPendingGuess() {
  state.pendingGuess = null;
  confirmGuessBtn.disabled = true;
}

function setPendingGuess(x, y) {
  state.pendingGuess = [x, y];
  confirmGuessBtn.disabled = false;
  const map = getMapById(state.selectedMapId);
  if (map) {
    blueprintMetaText.textContent = `Selected map: ${map.name}. Guess placed — press CONFIRM GUESS to lock it in.`;
  }
  statusMessage.innerHTML = 'Guess marker placed. Adjust it by clicking again, then press <strong>CONFIRM GUESS</strong> when you are ready.';
  renderBlueprintDisplay();
}

function renderBlueprintDisplay() {
  const mapId = state.resultOverlay?.displayMapId || state.selectedMapId;
  if (!mapId) {
    drawPlaceholder(blueprintCtx, 'Choose a map first', 'Then click the clue center on that map', blueprintCanvas);
    selectedMapBadge.textContent = 'No map selected';
    refreshStats();
    return;
  }

  const map = getMapById(mapId);
  const source = getBlueprintSource(map);
  clampBlueprintView();
  const view = getVisibleView();

  blueprintCtx.clearRect(0, 0, blueprintCanvas.width, blueprintCanvas.height);
  blueprintCtx.drawImage(
    source,
    state.blueprintView.x,
    state.blueprintView.y,
    view.width,
    view.height,
    0,
    0,
    blueprintCanvas.width,
    blueprintCanvas.height
  );

  if (state.resultOverlay && state.resultOverlay.displayMapId === mapId) {
    const targetPoint = normalizedToScreen(state.resultOverlay.target[0], state.resultOverlay.target[1]);
    if (targetPoint) drawMarker(blueprintCtx, targetPoint.x, targetPoint.y, '#7bffae');

    if (state.resultOverlay.guess) {
      const guessPoint = normalizedToScreen(state.resultOverlay.guess[0], state.resultOverlay.guess[1]);
      if (guessPoint && targetPoint) {
        drawMarker(blueprintCtx, guessPoint.x, guessPoint.y, '#ff9090');
        drawConnectionLine(blueprintCtx, guessPoint.x, guessPoint.y, targetPoint.x, targetPoint.y);
      }
    }
  } else if (state.pendingGuess && state.selectedMapId === mapId) {
    const pendingPoint = normalizedToScreen(state.pendingGuess[0], state.pendingGuess[1]);
    if (pendingPoint) drawMarker(blueprintCtx, pendingPoint.x, pendingPoint.y, '#ff9090');
  }

  selectedMapBadge.textContent = map.name;
  refreshStats();
}

function setBlueprintZoom(targetZoom, focusX = blueprintCanvas.width / 2, focusY = blueprintCanvas.height / 2) {
  const mapId = state.resultOverlay?.displayMapId || state.selectedMapId;
  if (!mapId) return;

  const source = getBlueprintSource(getMapById(mapId));
  const oldZoom = state.blueprintView.zoom;
  const newZoom = clamp(targetZoom, state.blueprintView.min, state.blueprintView.max);
  if (newZoom === oldZoom) return;

  const oldViewW = source.width / oldZoom;
  const oldViewH = source.height / oldZoom;
  const sourceFocusX = state.blueprintView.x + (focusX / blueprintCanvas.width) * oldViewW;
  const sourceFocusY = state.blueprintView.y + (focusY / blueprintCanvas.height) * oldViewH;

  const newViewW = source.width / newZoom;
  const newViewH = source.height / newZoom;
  state.blueprintView.zoom = newZoom;
  state.blueprintView.x = sourceFocusX - (focusX / blueprintCanvas.width) * newViewW;
  state.blueprintView.y = sourceFocusY - (focusY / blueprintCanvas.height) * newViewH;
  clampBlueprintView();
  renderBlueprintDisplay();
}

function panBlueprint(dxCanvas, dyCanvas) {
  const mapId = state.resultOverlay?.displayMapId || state.selectedMapId;
  if (!mapId) return;
  if (state.blueprintView.zoom <= 1) return;

  state.blueprintView.x -= dxCanvas / state.blueprintView.zoom;
  state.blueprintView.y -= dyCanvas / state.blueprintView.zoom;
  clampBlueprintView();
  renderBlueprintDisplay();
}

function buildMapButtons(pool) {
  mapButtonsGrid.innerHTML = '';
  pool.forEach(map => {
    const button = document.createElement('button');
    button.className = 'map-btn';
    button.dataset.mapId = map.id;
    button.innerHTML = `<span class="map-btn-label${getMapLabelClass(map.name)}">${map.name}</span>`;
    applyMapButtonThumbnail(button, map);
    button.addEventListener('click', () => selectMap(map.id));
    mapButtonsGrid.appendChild(button);
  });
}

function updateMapButtonSelection() {
  [...mapButtonsGrid.children].forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.mapId === state.selectedMapId);
  });
}

function selectMap(mapId) {
  if (!state.started || state.roundLocked) return;
  state.selectedMapId = mapId;
  state.resultOverlay = null;
  clearPendingGuess();
  resetBlueprintView();
  updateMapButtonSelection();
  const map = getMapById(mapId);
  blueprintMetaText.textContent = `Selected map: ${map.name}. Click where the clue center should be.`;
  renderBlueprintDisplay();
}

function renderBrowserPreview(map) {
  if (!map || !map.img) {
    drawPlaceholder(browserPreviewCtx, 'Map preview', 'Click a map to view it here', browserPreviewCanvas);
    browserPreviewMeta.textContent = 'Click a map on the right to preview it here.';
    browserPreviewBadge.textContent = 'Preview';
    return;
  }
  applyFullModifierDraw(browserPreviewCtx, map.img, browserPreviewCanvas, state.browserModifier);
  const modifierText = state.browserModifier !== 'none' ? ` • ${formatModifier(state.browserModifier)}` : '';
  browserPreviewMeta.textContent = map.hallOfMasters ? `${map.name} • Hall of Masters map.${modifierText}` : `${map.name} • Available in All Maps mode.${modifierText}`;
  browserPreviewBadge.textContent = map.hallOfMasters ? 'HOM' : 'All Maps';
}

function buildMapsBrowser(filter = state.browserFilter) {
  state.browserFilter = filter;
  filterButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.filter === filter));

  const pool = getBrowserPool(filter);
  mapsList.innerHTML = '';
  mapsBrowserSummary.textContent = filter === 'hom'
    ? `${pool.length} Hall of Masters maps loaded.`
    : `${pool.length} total maps loaded.`;

  pool.forEach(map => {
    const button = document.createElement('button');
    button.className = 'map-browser-btn';
    button.dataset.mapId = map.id;
    button.innerHTML = `<span class="map-btn-label${getMapLabelClass(map.name)}">${map.name}</span>`;
    applyMapButtonThumbnail(button, map);
    button.addEventListener('click', () => {
      state.browserSelectedId = map.id;
      updateBrowserSelection();
      renderBrowserPreview(map);
    });
    mapsList.appendChild(button);
  });

  if (!state.browserSelectedId || !pool.some(map => map.id === state.browserSelectedId)) {
    state.browserSelectedId = pool[0]?.id || null;
  }
  updateBrowserSelection();
  renderBrowserPreview(getMapById(state.browserSelectedId));
}

function updateBrowserSelection() {
  [...mapsList.children].forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mapId === state.browserSelectedId);
  });
}

function getRecordFilters() {
  return {
    mode: recordModeFilter?.value || 'any',
    difficulty: recordDifficultyFilter?.value || 'any',
    modifier: recordModifierFilter?.value || 'any',
    rounds: recordRoundsFilter?.value || 'any'
  };
}

function getSortedRecordRows() {
  const records = loadRecords();
  const difficultyOrder = Object.keys(DIFFICULTY_PRESETS);
  const modifierOrder = ['none', 'bw', 'invert', 'pixel', 'upside'];
  const modeOrder = ['all', 'hom'];

  const filters = getRecordFilters();

  return Object.entries(records)
    .filter(([, value]) => value && (value.bestScore > 0 || value.bestTimeMs != null))
    .map(([key, value]) => {
      const [mode, difficulty, modifier, rounds] = key.split('|');
      return { key, mode, difficulty, modifier, rounds: Number(rounds), ...value };
    })
    .filter(row => {
      if (filters.mode !== 'any' && row.mode !== filters.mode) return false;
      if (filters.difficulty !== 'any' && row.difficulty !== filters.difficulty) return false;
      if (filters.modifier !== 'any' && row.modifier !== filters.modifier) return false;
      if (filters.rounds !== 'any' && row.rounds !== Number(filters.rounds)) return false;
      return true;
    })
    .sort((a, b) => {
      return (
        modeOrder.indexOf(a.mode) - modeOrder.indexOf(b.mode) ||
        a.rounds - b.rounds ||
        difficultyOrder.indexOf(a.difficulty) - difficultyOrder.indexOf(b.difficulty) ||
        modifierOrder.indexOf(a.modifier) - modifierOrder.indexOf(b.modifier)
      );
    });
}

function renderRecordsPage() {
  const rows = getSortedRecordRows();
  recordsTableBody.innerHTML = '';

  if (!rows.length) {
    const emptyRow = document.createElement('tr');
    emptyRow.className = 'empty-row';
    emptyRow.innerHTML = '<td colspan="6">No matching records yet. Finish a set or change the filters to see more results.</td>';
    recordsTableBody.appendChild(emptyRow);
    return;
  }

  rows.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatMode(row.mode)}</td>
      <td>${formatDifficulty(row.difficulty)}</td>
      <td>${formatModifier(row.modifier)}</td>
      <td>${row.rounds}</td>
      <td><strong>${row.bestScore}</strong></td>
      <td><strong>${row.bestTimeMs == null ? '—' : formatTime(row.bestTimeMs, '—')}</strong></td>
    `;
    recordsTableBody.appendChild(tr);
  });
}

function renderLogsPage() {
  const attempts = loadAttempts();
  logsOverview.innerHTML = '';
  logsList.innerHTML = '';

  const fastest = attempts
    .slice()
    .sort((a, b) => a.timeMs - b.timeMs)[0] || null;

  const getBestScoreForRounds = rounds => {
    const match = attempts
      .filter(attempt => attempt.rounds === rounds)
      .sort((a, b) => b.score - a.score || a.timeMs - b.timeMs)[0];
    return match ? match.score : '—';
  };

  const bestScoreByRounds = `${getBestScoreForRounds(5)} / ${getBestScoreForRounds(10)} / ${getBestScoreForRounds(15)}`;

  const overviewItems = [
    ['Total Attempts', String(attempts.length)],
    ['Fastest Attempt', fastest ? formatTime(fastest.timeMs) : 'None yet'],
    ['Best Attempt Score', bestScoreByRounds],
    ['Latest Attempt', attempts[0] ? formatDateTime(attempts[0].timestamp) : 'None yet']
  ];

  overviewItems.forEach(([label, value]) => {
    const tile = document.createElement('div');
    tile.className = 'overview-tile';
    tile.innerHTML = `<div class="overview-label">${label}</div><div class="overview-value">${value}</div>`;
    logsOverview.appendChild(tile);
  });

  if (!attempts.length) {
    logsList.innerHTML = '<div class="empty-logs">No completed attempts yet. Finish a full set and it will appear here.</div>';
    return;
  }

  attempts.slice(0, 5).forEach((attempt, index) => {
    const entry = document.createElement('article');
    entry.className = 'log-entry';
    entry.innerHTML = `
      <div class="log-top">
        <div class="log-title">${formatDateTime(attempt.timestamp)}</div>
        <div class="log-date">${index === 0 ? 'Latest attempt' : 'Completed run'}</div>
      </div>
      <div class="log-meta">
        <div class="log-chip"><span class="log-chip-label">Mode</span><span class="log-chip-value">${formatMode(attempt.mode)}</span></div>
        <div class="log-chip"><span class="log-chip-label">Difficulty</span><span class="log-chip-value">${formatDifficulty(attempt.difficulty)}</span></div>
        <div class="log-chip"><span class="log-chip-label">Modifier</span><span class="log-chip-value">${formatModifier(attempt.modifier)}</span></div>
        <div class="log-chip"><span class="log-chip-label">Rounds</span><span class="log-chip-value">${attempt.rounds}</span></div>
        <div class="log-chip"><span class="log-chip-label">Score</span><span class="log-chip-value">${attempt.score}</span></div>
        <div class="log-chip"><span class="log-chip-label">Time</span><span class="log-chip-value">${formatTime(attempt.timeMs)}</span></div>
      </div>
    `;
    logsList.appendChild(entry);
  });
}

function renderHomeExample() {
  const sampleMap = MAPS.find(map => map.id === 'garden') || MAPS[0];
  if (!sampleMap || !sampleMap.img) {
    drawPlaceholder(homeExampleCtx, 'Example clue', 'Images are still loading', homeExampleCanvas);
    return;
  }
  const samplePoint = sampleMap.candidates?.[8] || sampleMap.candidates?.[0] || [0.52, 0.46];
  renderClue(sampleMap, samplePoint, 'advanced', 'none', homeExampleCanvas, homeExampleCtx);
}

function startRound() {
  const pool = getPool(state.mode);
  state.currentRound += 1;
  state.roundLocked = false;
  state.selectedMapId = null;
  state.resultOverlay = null;
  clearPendingGuess();
  resetBlueprintView();
  updateMapButtonSelection();

  const answerMap = randomItem(pool);
  state.answerMapId = answerMap.id;
  state.targetPoint = selectTargetPoint(answerMap, state.difficulty);

  renderClue(answerMap, state.targetPoint, state.difficulty, state.modifier);
  blueprintMetaText.textContent = 'Select a map, then click the clue center.';
  selectedMapBadge.textContent = 'No map selected';
  drawPlaceholder(blueprintCtx, 'Choose a map first', 'Then click the clue center on that map', blueprintCanvas);

  mapPoolText.textContent = state.mode === 'hom'
    ? `${pool.length} Hall of Masters maps loaded.`
    : `${pool.length} total maps loaded.`;

  nextRoundBtn.disabled = true;
  nextRoundBtn.textContent = 'NEXT';
  statusMessage.innerHTML = 'Round live. Pick a map, place your marker where the <strong>center of the clue</strong> belongs, then press <strong>CONFIRM GUESS</strong>.';
  refreshStats();
}

function startGame() {
  closeRoundModal();
  state.mode = modeSelect.value;
  state.difficulty = difficultySelect.value;
  state.modifier = modifierSelect.value;
  state.totalRounds = Number(roundCountSelect.value);
  state.totalScore = 0;
  state.currentRound = 0;
  state.started = true;
  state.roundLocked = true;
  syncRulesetRecordsFromControls();
  buildMapButtons(getPool(state.mode));
  startRunTimer();
  refreshStats();
  startRound();
}

function openRoundModal(html, isFinalRound) {
  roundResultBody.innerHTML = html;
  roundModalNextBtn.textContent = isFinalRound ? 'FINISH SET' : 'NEXT ROUND';
  roundModal.classList.remove('hidden');
  roundModal.setAttribute('aria-hidden', 'false');
}

function closeRoundModal() {
  roundModal.classList.add('hidden');
  roundModal.setAttribute('aria-hidden', 'true');
}

function finishRound(guessXNorm, guessYNorm) {
  if (state.roundLocked || !state.selectedMapId) return;
  state.roundLocked = true;
  clearPendingGuess();

  const chosenMap = getMapById(state.selectedMapId);
  const answerMap = getMapById(state.answerMapId);
  const sameMap = chosenMap.id === answerMap.id;
  const [targetX, targetY] = state.targetPoint;

  let roundScore = 0;
  let distancePixels = null;
  let modalHtml = '';

  if (sameMap) {
    const dx = (guessXNorm - targetX) * SOURCE_WIDTH;
    const dy = (guessYNorm - targetY) * SOURCE_HEIGHT;
    distancePixels = Math.hypot(dx, dy);
    const maxDistance = Math.hypot(SOURCE_WIDTH, SOURCE_HEIGHT) * 0.34;
    const accuracy = clamp(1 - distancePixels / maxDistance, 0, 1);
    roundScore = Math.round(accuracy * 100);
    state.totalScore += roundScore;
    modalHtml = `
      <p><strong>Correct map:</strong> ${answerMap.name}</p>
      <p><strong>Distance from center:</strong> ${Math.round(distancePixels)} px</p>
      <p><strong>Round score:</strong> ${roundScore} / 100</p>
      <p>You picked the right map. Green is the true center and red is your guess.</p>
    `;
  } else {
    modalHtml = `
      <p><strong>Wrong map.</strong></p>
      <p>You chose <strong>${chosenMap.name}</strong>, but the clue came from <strong>${answerMap.name}</strong>.</p>
      <p><strong>Round score:</strong> 0 / 100</p>
      <p>The map now shows the correct answer and the true clue center.</p>
    `;
  }

  state.resultOverlay = {
    displayMapId: sameMap ? chosenMap.id : answerMap.id,
    guess: sameMap ? [guessXNorm, guessYNorm] : null,
    target: [targetX, targetY]
  };

  resetBlueprintView();
  blueprintMetaText.textContent = sameMap
    ? `Correct map: ${answerMap.name}`
    : `Wrong map chosen. Showing the correct map: ${answerMap.name}`;
  renderBlueprintDisplay();

  nextRoundBtn.disabled = false;
  if (state.currentRound >= state.totalRounds) {
    nextRoundBtn.textContent = 'FINISH';
    statusMessage.innerHTML = `Set finished. Final score: <strong>${state.totalScore}</strong>. Press <strong>FINISH</strong> or use the popup to wrap up.`;
  } else {
    statusMessage.innerHTML = 'Round complete. Press <strong>NEXT</strong> or use the popup to load another clue.';
  }

  refreshStats();
  openRoundModal(modalHtml, state.currentRound >= state.totalRounds);
}

function endSet() {
  const finalTime = stopRunTimer();
  addAttemptLog({
    timestamp: Date.now(),
    mode: state.mode,
    difficulty: state.difficulty,
    modifier: state.modifier,
    rounds: state.totalRounds,
    score: state.totalScore,
    timeMs: finalTime
  });
  applyRulesetRecords(state.totalScore, finalTime);
  renderRecordsPage();
  renderLogsPage();
  state.started = false;
  state.roundLocked = true;
  state.resultOverlay = null;
  state.selectedMapId = null;
  state.answerMapId = null;
  clearPendingGuess();
  state.targetPoint = null;
  resetBlueprintView();
  drawPlaceholder(clueCtx, 'Set complete', `Final score: ${state.totalScore}`, clueCanvas);
  drawPlaceholder(blueprintCtx, 'Ready for another run', `Run time: ${formatTime(finalTime)}`, blueprintCanvas);
  clueMetaText.textContent = 'Finished';
  blueprintMetaText.textContent = 'Finished';
  selectedMapBadge.textContent = 'No map selected';
  nextRoundBtn.disabled = true;
  nextRoundBtn.textContent = 'NEXT';
  statusMessage.innerHTML = `Set complete. Final score: <strong>${state.totalScore}</strong> • Time: <strong>${formatTime(finalTime)}</strong>. Press <strong>START GAME</strong> to run it again.`;
  updateMapButtonSelection();
  refreshStats();
}

function advanceRoundFlow() {
  closeRoundModal();
  if (state.currentRound >= state.totalRounds) {
    endSet();
  } else {
    startRound();
  }
}

blueprintCanvas.addEventListener('wheel', event => {
  const mapId = state.resultOverlay?.displayMapId || state.selectedMapId;
  if (!mapId) return;
  event.preventDefault();
  const rect = blueprintCanvas.getBoundingClientRect();
  const focusX = event.clientX - rect.left;
  const focusY = event.clientY - rect.top;
  const factor = event.deltaY < 0 ? 1.2 : 1 / 1.2;
  setBlueprintZoom(state.blueprintView.zoom * factor, focusX, focusY);
}, { passive: false });

blueprintCanvas.addEventListener('mousedown', event => {
  const mapId = state.resultOverlay?.displayMapId || state.selectedMapId;
  if (!mapId) return;
  state.blueprintView.dragging = true;
  state.blueprintView.moved = false;
  state.blueprintView.lastX = event.clientX;
  state.blueprintView.lastY = event.clientY;
});

window.addEventListener('mousemove', event => {
  if (!state.blueprintView.dragging) return;
  const dx = event.clientX - state.blueprintView.lastX;
  const dy = event.clientY - state.blueprintView.lastY;
  if (Math.abs(dx) + Math.abs(dy) > 3) state.blueprintView.moved = true;
  state.blueprintView.lastX = event.clientX;
  state.blueprintView.lastY = event.clientY;
  panBlueprint(dx, dy);
});

window.addEventListener('mouseup', event => {
  if (!state.blueprintView.dragging) return;
  const moved = state.blueprintView.moved;
  state.blueprintView.dragging = false;

  if (moved || !state.started || state.roundLocked || !state.selectedMapId) return;

  const rect = blueprintCanvas.getBoundingClientRect();
  const clickX = clamp(event.clientX - rect.left, 0, rect.width);
  const clickY = clamp(event.clientY - rect.top, 0, rect.height);
  const normalized = screenToNormalized(clickX / rect.width * blueprintCanvas.width, clickY / rect.height * blueprintCanvas.height);
  if (!normalized) return;
  setPendingGuess(normalized.x, normalized.y);
});

startGameBtn.addEventListener('click', startGame);
confirmGuessBtn.addEventListener('click', () => {
  if (!state.pendingGuess || state.roundLocked || !state.selectedMapId) return;
  finishRound(state.pendingGuess[0], state.pendingGuess[1]);
});
nextRoundBtn.addEventListener('click', advanceRoundFlow);
roundModalNextBtn.addEventListener('click', advanceRoundFlow);
roundBackdrop.addEventListener('click', closeRoundModal);

zoomInBtn.addEventListener('click', () => setBlueprintZoom(state.blueprintView.zoom + 0.5));
zoomOutBtn.addEventListener('click', () => setBlueprintZoom(state.blueprintView.zoom - 0.5));
zoomResetBtn.addEventListener('click', () => {
  resetBlueprintView();
  renderBlueprintDisplay();
});

function openHelp() {
  helpModal.classList.remove('hidden');
  helpModal.setAttribute('aria-hidden', 'false');
}
function closeHelp() {
  helpModal.classList.add('hidden');
  helpModal.setAttribute('aria-hidden', 'true');
}

helpBtn.addEventListener('click', openHelp);
closeHelpBtn.addEventListener('click', closeHelp);
helpBackdrop.addEventListener('click', closeHelp);
filterButtons.forEach(btn => btn.addEventListener('click', () => buildMapsBrowser(btn.dataset.filter)));
if (browserModifierSelect) {
  browserModifierSelect.addEventListener('change', () => {
    state.browserModifier = browserModifierSelect.value;
    renderBrowserPreview(getMapById(state.browserSelectedId));
  });
}
[recordModeFilter, recordDifficultyFilter, recordModifierFilter, recordRoundsFilter].forEach(select => {
  if (select) select.addEventListener('change', renderRecordsPage);
});

window.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    closeHelp();
    closeRoundModal();
  }
});

function refreshPreviewRecords() {
  if (state.started) return;
  syncRulesetRecordsFromControls();
  refreshStats();
}

modeSelect.addEventListener('change', refreshPreviewRecords);
difficultySelect.addEventListener('change', refreshPreviewRecords);
modifierSelect.addEventListener('change', refreshPreviewRecords);
roundCountSelect.addEventListener('change', refreshPreviewRecords);


imageLoadPromise.then(() => {
  syncRulesetRecordsFromControls();
  buildMapButtons(getPool(modeSelect.value));
  state.browserModifier = browserModifierSelect?.value || 'none';
  buildMapsBrowser('all');
  renderRecordsPage();
  renderLogsPage();
  renderHomeExample();
  drawPlaceholder(clueCtx, 'B2Guessr', 'Press START GAME to generate the first image', clueCanvas);
  drawPlaceholder(blueprintCtx, 'Click map appears here', 'Choose a map after the clue loads', blueprintCanvas);
  refreshStats();
});
