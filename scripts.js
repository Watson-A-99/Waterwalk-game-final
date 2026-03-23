// ============================================================
//  WATER WALK  –  charity:water Educational Side-Scroller
// ============================================================
//  CONTROLS:
//    Jump   →  W / ArrowUp / Space
//    Duck   →  S / ArrowDown
//    Pause  →  P / Escape / click pause button
//    Mobile →  Swipe Up = Jump, Swipe Down = Duck
// ============================================================


// ============================================================
// [CANVAS SETUP]
// ============================================================
var canvas = document.getElementById("game");
var ctx    = canvas.getContext("2d");

var W = 960;
var H = 540;
canvas.width  = W;
canvas.height = H;


// ============================================================
// [BRAND COLORS]
// ============================================================
var COLORS = {
  yellow:    "#ffcb3d",
  blue:      "#0090d9",
  darkBlue:  "#1e3a5f",
  waterBlue: "#4db8e8",
  white:     "#ffffff",
  black:     "#000000"
};

var HUD_FONT_STACK = '"Inter", "DM Sans", "Segoe UI", sans-serif';
var HUD_DISTANCE_COLOR = "#ffffff";
var HUD_SCORE_BLUE = "#ffffff";
var HUD_PILL_BLUE = "rgba(143, 220, 255, 0.56)";
var HUD_PILL_YELLOW = "rgba(255, 224, 141, 0.29)";


// ============================================================
// [GAME CONSTANTS]
// ============================================================
var GROUND_Y       = H - 60;
var GROUND_HEIGHT  = 60;
var PLAYER_X       = 100;
var PLAYER_W       = 50;
var PLAYER_H       = 64;
var DUCK_H         = 36;
var JUMP_VELOCITY  = -10;
var GRAVITY        = 0.55;
var DUCK_DURATION  = 38;
var START_WATER    = 15;
var MAX_WATER      = 100;
var DROP_VALUE     = 1;
var WIN_WATER      = 80;
var DAMAGE_ZONE_1  = 8;
var DAMAGE_ZONE_2  = 14;
var DAMAGE_ZONE_3  = 20;
var TOTAL_TIME     = 90;  // seconds to reach 6km
var TOTAL_DISTANCE = 6;
var BASE_SPEED     = 10;
var MAX_SPEED      = 20;
var INVULN_FRAMES  = 45;
var DROP_W         = 22;
var DROP_H         = 30;   // adjusted for SVG aspect ratio (13:18)
var ROCK_W         = 36;
var ROCK_H         = 36;
var CLUSTER_W      = 100;
var CLUSTER_H      = 40;
var WIND_W         = 100;
var WIND_H         = 60;
var WIND_BOTTOM_GAP = 40;
var PAUSE_BTN_X    = W - 55;
var PAUSE_BTN_Y    = 12;
var PAUSE_BTN_SIZE = 36;
var GROUND_SURFACE = GROUND_Y + 10;
var PLAYER_DRAW_Y_OFFSET = GROUND_SURFACE - GROUND_Y;


// ============================================================
// [GAME STATE]
// ============================================================
var state  = "start";
var paused = false;

var player = {};
var drops  = [];
var obstacles = [];
var particles = [];

var water       = 0;
var distance    = 0;
var elapsed     = 0;
var scrollSpeed = 0;
var frameCount  = 0;

var countdownTimer = 0;
var countdownNum   = 3;

var endResult = "";

var infiniteUnlocked = false;
var infiniteMode     = false;
var infiniteDistance  = 0;
var infiniteHighScore = 0;

var nextDropSpawn     = 0;
var nextObstacleSpawn = 0;

var hillOffset = 0;

// ---- New overlay state ----
var hasCompletedOnce  = false;   // true after first full playthrough reaches score
var deathKm           = 0;       // km at time of death (for background)
var endScreenTimeout  = null;    // auto-advance timer
var currentAdvanceFn  = null;    // click-to-advance callback
var totalDropsCollected = 0;     // raw count of drops grabbed
var meterCountInterval  = null;  // for counting up meter number
var hasSeenTutorial   = false;
var hasSeenInfTutorial = false;
var storyBestWater    = 0;       // best water % in story mode
var infiniteBestDrops = 0;       // best drops in infinite

// ---- Cutscene state ----
var cutscenePhase     = "";
var cutsceneTimer     = 0;
var cutsceneSpeedSnap = 0;
var cutscenePlayerStart = 0;
var cutsceneCamY      = 0;
var cutsceneSunScale  = 1;
var cutsceneRayAngle  = 0;
var cutsceneWhiteout  = 0;

var BACK34_ASPECT = 869.04 / 548.78;
var SPRITE_BACK34_W = PLAYER_W;
var SPRITE_BACK34_H = Math.round(PLAYER_W * BACK34_ASPECT);

var DECEL_FRAMES      = 90;
var WALK_CENTER_SPEED = 2.5;
var SPRITE_SWAP_PAUSE = 50;
var PAN_SUN_FRAMES    = 200;
var WHITEOUT_FRAMES   = 5;
var POST_WHITE_PAUSE  = 15;   // quick hold then straight to end screens


// ============================================================
// [LOCAL STORAGE]
// ============================================================
function saveState() {
  try {
    localStorage.setItem("ww_infiniteUnlocked", infiniteUnlocked ? "1" : "0");
    localStorage.setItem("ww_infiniteHighScore", infiniteHighScore.toFixed(2));
    localStorage.setItem("ww_storyBestWater", storyBestWater.toString());
    localStorage.setItem("ww_infiniteBestDrops", infiniteBestDrops.toString());
    localStorage.setItem("ww_hasSeenTutorial", hasSeenTutorial ? "1" : "0");
    localStorage.setItem("ww_hasSeenInfTutorial", hasSeenInfTutorial ? "1" : "0");
    localStorage.setItem("ww_hasCompletedOnce", hasCompletedOnce ? "1" : "0");
  } catch(e) {}
}

function loadState() {
  try {
    infiniteUnlocked = localStorage.getItem("ww_infiniteUnlocked") === "1";
    infiniteHighScore = parseFloat(localStorage.getItem("ww_infiniteHighScore")) || 0;
    storyBestWater = parseInt(localStorage.getItem("ww_storyBestWater")) || 0;
    infiniteBestDrops = parseInt(localStorage.getItem("ww_infiniteBestDrops")) || 0;
    hasSeenTutorial = localStorage.getItem("ww_hasSeenTutorial") === "1";
    hasSeenInfTutorial = localStorage.getItem("ww_hasSeenInfTutorial") === "1";
    hasCompletedOnce = localStorage.getItem("ww_hasCompletedOnce") === "1";
  } catch(e) {}
}

// Dev helper: call resetSaveData() in console to clear all saved state
function resetSaveData() {
  try {
    var keys = ["ww_infiniteUnlocked","ww_infiniteHighScore","ww_storyBestWater",
                "ww_infiniteBestDrops","ww_hasSeenTutorial","ww_hasSeenInfTutorial","ww_hasCompletedOnce"];
    for (var i = 0; i < keys.length; i++) localStorage.removeItem(keys[i]);
    infiniteUnlocked = false; infiniteHighScore = 0; storyBestWater = 0;
    infiniteBestDrops = 0; hasSeenTutorial = false; hasSeenInfTutorial = false; hasCompletedOnce = false;
    console.log("Water Walk: save data cleared. Refresh the page.");
  } catch(e) {}
}

loadState();


// ============================================================
// [THEME TOGGLE]
// ============================================================
function applyTheme(theme) {
  var resolved = theme === "light" ? "light" : "dark";
  document.body.setAttribute("data-theme", resolved);

  var btn = document.getElementById("themeToggle");
  if (btn) {
    var isLight = resolved === "light";
    btn.textContent = isLight ? "Dark Mode" : "Light Mode";
    btn.setAttribute("aria-pressed", isLight ? "true" : "false");
  }

  try {
    localStorage.setItem("ww_theme", resolved);
  } catch(e) {}
}

function initThemeToggle() {
  var savedTheme = "dark";
  try {
    var fromStorage = localStorage.getItem("ww_theme");
    if (fromStorage === "light" || fromStorage === "dark") savedTheme = fromStorage;
  } catch(e) {}

  applyTheme(savedTheme);

  var btn = document.getElementById("themeToggle");
  if (!btn) return;

  btn.addEventListener("click", function() {
    var current = document.body.getAttribute("data-theme") === "light" ? "light" : "dark";
    applyTheme(current === "light" ? "dark" : "light");
  });
}

initThemeToggle();


// ============================================================
// [OVERLAY MANAGEMENT]
// ============================================================
var overlayIds = [
  "overlayStart", "overlayPause", "overlayDeath", "overlayTutorial", "overlayInfTutorial",
  "overlayArrival", "overlayFact1", "overlayFact2", "overlayHope",
  "overlayCTA", "overlayScore"
];

function hideAllOverlays() {
  for (var i = 0; i < overlayIds.length; i++) {
    var el = document.getElementById(overlayIds[i]);
    if (el) el.classList.remove("active");
  }
  // Clear any pending auto-advance
  if (endScreenTimeout) {
    clearTimeout(endScreenTimeout);
    endScreenTimeout = null;
  }
  if (meterCountInterval) {
    clearInterval(meterCountInterval);
    meterCountInterval = null;
  }
  currentAdvanceFn = null;
}

function showOverlay(id) {
  var el = document.getElementById(id);
  if (el) el.classList.add("active");
}

function showSkipButton(onDark) {
  var btn = document.getElementById("btnSkip");
  if (btn && hasCompletedOnce) {
    btn.classList.add("visible");
    btn.classList.toggle("on-dark", !!onDark);
  }
}

function hideSkipButton() {
  var btn = document.getElementById("btnSkip");
  if (btn) {
    btn.classList.remove("visible");
    btn.classList.remove("on-dark");
  }
}


// ============================================================
// [INPUT HANDLING]
// ============================================================
var keys = {};

function togglePause() {
  if (state === "playing" || state === "infinite") {
    paused = !paused;
    if (paused) {
      showOverlay("overlayPause");
    } else {
      document.getElementById("overlayPause").classList.remove("active");
    }
  }
}

document.addEventListener("keydown", function(e) {
  keys[e.key] = true;
  if (e.key === "p" || e.key === "P" || e.key === "Escape") {
    togglePause();
    return;
  }
  // Start game
  if (state === "start" && (e.key === " " || e.key === "Enter")) {
    startCountdown();
  }
  // Death screen
  if (state === "death") {
    if (e.key === "r" || e.key === "R" || e.key === " " || e.key === "Enter") {
      resetAndPlay();
    }
  }
  // Score screen
  if (state === "score") {
    if (e.key === "r" || e.key === "R") {
      if (infiniteMode) startInfinite();
      else resetAndPlay();
    }
    if ((e.key === "i" || e.key === "I") && infiniteUnlocked && !infiniteMode) startInfinite();
  }
  // Advance end screens on space/enter
  if (state === "endScreens" && (e.key === " " || e.key === "Enter")) {
    if (currentAdvanceFn) {
      var fn = currentAdvanceFn;
      currentAdvanceFn = null;
      if (endScreenTimeout) { clearTimeout(endScreenTimeout); endScreenTimeout = null; }
      fn();
    }
  }
});

document.addEventListener("keyup", function(e) {
  keys[e.key] = false;
});

// Touch / swipe for mobile
var touchStartY = 0;
var touchStartX = 0;

canvas.addEventListener("touchstart", function(e) {
  e.preventDefault();
  touchStartY = e.touches[0].clientY;
  touchStartX = e.touches[0].clientX;

  var rect = canvas.getBoundingClientRect();
  var scaleX = W / rect.width;
  var scaleY = H / rect.height;
  var tx = (e.touches[0].clientX - rect.left) * scaleX;
  var ty = (e.touches[0].clientY - rect.top) * scaleY;

  if ((state === "playing" || state === "infinite") && !paused &&
      tx > PAUSE_BTN_X && tx < PAUSE_BTN_X + PAUSE_BTN_SIZE &&
      ty > PAUSE_BTN_Y && ty < PAUSE_BTN_Y + PAUSE_BTN_SIZE) {
    togglePause();
    return;
  }
}, { passive: false });

canvas.addEventListener("touchend", function(e) {
  e.preventDefault();
  var touchEndY = e.changedTouches[0].clientY;
  var diff = touchStartY - touchEndY;

  if ((state === "playing" || state === "infinite") && !paused) {
    if (diff > 30) tryJump();
    if (diff < -30) tryDuck();
  }
}, { passive: false });

// Canvas click (only for pause button and pause resume during gameplay)
canvas.addEventListener("click", function(e) {
  var rect = canvas.getBoundingClientRect();
  var scaleX = W / rect.width;
  var scaleY = H / rect.height;
  var mx = (e.clientX - rect.left) * scaleX;
  var my = (e.clientY - rect.top) * scaleY;

  if ((state === "playing" || state === "infinite") && !paused &&
      mx > PAUSE_BTN_X && mx < PAUSE_BTN_X + PAUSE_BTN_SIZE &&
      my > PAUSE_BTN_Y && my < PAUSE_BTN_Y + PAUSE_BTN_SIZE) {
    togglePause();
    return;
  }
});

// --- HTML button handlers ---
document.getElementById("btnStart").addEventListener("click", function() {
  if (state === "start") startCountdown();
});

document.getElementById("btnResume").addEventListener("click", function() {
  if (paused) togglePause();
});

document.getElementById("btnTryAgain").addEventListener("click", function() {
  if (state === "death") resetAndPlay();
});

document.getElementById("btnContinue").addEventListener("click", function() {
  if (state === "endScreens") {
    transitionToScore();
  }
});

document.getElementById("btnReplay").addEventListener("click", function() {
  if (state === "score") resetAndPlay();
});

document.getElementById("btnInfinite").addEventListener("click", function() {
  if (state === "score" && infiniteUnlocked) startInfinite();
});

document.getElementById("btnInfReplay").addEventListener("click", function() {
  if (state === "score") startInfinite();
});

document.getElementById("btnPlayOriginal").addEventListener("click", function() {
  if (state === "score") resetAndPlay();
});

document.getElementById("btnSkip").addEventListener("click", function() {
  if (state === "cutscene" || state === "endScreens") {
    transitionToScore();
  }
});

document.getElementById("btnTutorialGo").addEventListener("click", function() {
  hideAllOverlays();
  hasSeenTutorial = true;
  saveState();
  beginCountdown();
});

document.getElementById("btnInfTutorialGo").addEventListener("click", function() {
  hideAllOverlays();
  hasSeenInfTutorial = true;
  saveState();
  beginInfCountdown();
});

// Click-to-advance on overlay screens with data-advance
document.querySelectorAll(".game-overlay[data-advance]").forEach(function(el) {
  el.addEventListener("click", function(e) {
    // Don't advance if they clicked a button inside the overlay
    if (e.target.closest("button, a")) return;
    if (state === "endScreens" && currentAdvanceFn) {
      var fn = currentAdvanceFn;
      currentAdvanceFn = null;
      if (endScreenTimeout) { clearTimeout(endScreenTimeout); endScreenTimeout = null; }
      fn();
    }
  });
});


function tryJump() {
  if (!paused && player.onGround && !player.ducking) {
    player.vy = JUMP_VELOCITY;
    player.onGround = false;
  }
}

function tryDuck() {
  if (!paused && player.onGround && !player.ducking) {
    player.ducking = true;
    var duckScale = getDuckScale(scrollSpeed);
    player.duckTimer = Math.max(10, Math.round(DUCK_DURATION / duckScale));
  }
}

function getSpeedExcess(speed) {
  return Math.max(0, speed / BASE_SPEED - 1);
}

function getGravityScale(speed) {
  // Gentler midgame, steeper late-game/infinite ramp.
  var ex = getSpeedExcess(speed);
  return 1 + ex * 0.55 + ex * ex * 0.24;
}

function getDuckScale(speed) {
  // Keep ducks usable in midgame, but shorten quickly at extreme speeds.
  var ex = getSpeedExcess(speed);
  return 1 + ex * 0.48 + ex * ex * 0.42;
}


// ============================================================
// [SUNRISE SYSTEM]
// ============================================================
var skyTopPalette = [
  { km: 0, rgb: [30, 30, 65] },
  { km: 1, rgb: [42, 48, 85] },
  { km: 3, rgb: [80, 100, 155] },
  { km: 5, rgb: [130, 195, 230] },
  { km: 6, rgb: [190, 220, 250] }
];
var skyBotPalette = [
  { km: 0, rgb: [55, 55, 85] },
  { km: 1, rgb: [195, 125, 80] },
  { km: 3, rgb: [230, 155, 85] },
  { km: 5, rgb: [250, 210, 100] },
  { km: 6, rgb: [255, 240, 210] }
];
var hillPalette = [
  { km: 0, rgb: [18, 22, 45] },
  { km: 1, rgb: [25, 40, 70] },
  { km: 3, rgb: [40, 70, 105] },
  { km: 5, rgb: [65, 110, 155] },
  { km: 6, rgb: [120, 190, 220] }
];
var sunPalette = [
  { km: 0, rgb: [220, 150, 80] },
  { km: 1.5, rgb: [240, 185, 100] },
  { km: 3, rgb: [255, 225, 140] },
  { km: 5, rgb: [255, 245, 210] },
  { km: 6, rgb: [255, 252, 235] }
];
var sunRingPalette = [
  { km: 0, rgb: [210, 130, 60] },
  { km: 1.5, rgb: [225, 155, 55] },
  { km: 3, rgb: [245, 185, 55] },
  { km: 5, rgb: [255, 203, 61] },
  { km: 6, rgb: [255, 203, 61] }
];
var sunCenterPalette = [
  { km: 0, rgb: [255, 255, 230] },
  { km: 3, rgb: [255, 255, 240] },
  { km: 6, rgb: [255, 255, 250] }
];
var sunPositions = [
  { km: 0, y: GROUND_Y - 10, r: 30 },
  { km: 1, y: GROUND_Y - 50, r: 45 },
  { km: 3, y: GROUND_Y - 120, r: 60 },
  { km: 5, y: GROUND_Y - 200, r: 75 },
  { km: 6, y: GROUND_Y - 240, r: 85 }
];

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function blendPalette(palette, km) {
  var lo = palette[0];
  var hi = palette[palette.length - 1];
  for (var i = 0; i < palette.length - 1; i++) {
    if (km >= palette[i].km && km <= palette[i + 1].km) {
      lo = palette[i];
      hi = palette[i + 1];
      break;
    }
  }
  var range = hi.km - lo.km;
  var t = range > 0 ? clamp((km - lo.km) / range, 0, 1) : 0;
  return [
    Math.round(lerp(lo.rgb[0], hi.rgb[0], t)),
    Math.round(lerp(lo.rgb[1], hi.rgb[1], t)),
    Math.round(lerp(lo.rgb[2], hi.rgb[2], t))
  ];
}

function lerpKeyframes(kf, km, prop) {
  var lo = kf[0];
  var hi = kf[kf.length - 1];
  for (var i = 0; i < kf.length - 1; i++) {
    if (km >= kf[i].km && km <= kf[i + 1].km) {
      lo = kf[i];
      hi = kf[i + 1];
      break;
    }
  }
  var range = hi.km - lo.km;
  var t = range > 0 ? clamp((km - lo.km) / range, 0, 1) : 0;
  return lerp(lo[prop], hi[prop], t);
}

function rgb(c) { return "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")"; }
function rgba(c, a) { return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")"; }


// ============================================================
// [DRAWING HELPERS]
// ============================================================
function drawSky(km) {
  var top = blendPalette(skyTopPalette, km);
  var bot = blendPalette(skyBotPalette, km);
  var grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, rgb(top));
  grad.addColorStop(1, rgb(bot));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

function drawSun(km) {
  var sunX = W * 0.58;
  var sunY = lerpKeyframes(sunPositions, km, "y");
  var radius = lerpKeyframes(sunPositions, km, "r");
  var col = blendPalette(sunPalette, km);
  var ringCol = blendPalette(sunRingPalette, km);
  var centerCol = blendPalette(sunCenterPalette, km);
  var alpha = clamp(km / 1.5, 0.35, 1.0);

  var glow = ctx.createRadialGradient(sunX, sunY, radius * 0.5, sunX, sunY, radius * 2.5);
  glow.addColorStop(0, rgba(col, alpha * 0.3));
  glow.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  ctx.beginPath();
  ctx.arc(sunX, sunY, radius + 14, 0, Math.PI * 2);
  ctx.fillStyle = rgba(ringCol, alpha * 0.65);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(sunX, sunY, radius, 0, Math.PI * 2);
  ctx.fillStyle = rgba(col, alpha);
  ctx.fill();

  var inner = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, radius * 0.7);
  inner.addColorStop(0, rgba(centerCol, alpha * 0.6));
  inner.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = inner;
  ctx.beginPath();
  ctx.arc(sunX, sunY, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawHills(km) {
  var col = blendPalette(hillPalette, km);
  var scroll = hillOffset * 0.3;
  var heightMult;
  if (km <= 5.5) {
    heightMult = 1.0 + clamp(km / 5.5, 0, 1) * 1.0;
  } else {
    var fadeT = clamp((km - 5.5) / 0.5, 0, 1);
    heightMult = lerp(2.0, 0.8, fadeT);
  }

  var backCol = [
    Math.min(255, col[0] + 25),
    Math.min(255, col[1] + 25),
    Math.min(255, col[2] + 25)
  ];
  ctx.fillStyle = rgb(backCol);
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (var x = -50; x <= W + 50; x += 4) {
    var y = GROUND_Y - 60 * heightMult
          + Math.sin((x + scroll * 0.4) * 0.0035) * 80 * heightMult
          + Math.sin((x + scroll * 0.4) * 0.007) * 30 * heightMult;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W + 50, H);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = rgb(col);
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (var x = -50; x <= W + 50; x += 4) {
    var y = GROUND_Y - 20 * heightMult
          + Math.sin((x + scroll) * 0.005) * 55 * heightMult
          + Math.sin((x + scroll) * 0.009) * 25 * heightMult;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W + 50, H);
  ctx.closePath();
  ctx.fill();
}

function drawGround(km) {
  var col = blendPalette(hillPalette, km);
  var dark = [Math.max(0, col[0] - 15), Math.max(0, col[1] - 15), Math.max(0, col[2] - 10)];
  ctx.fillStyle = rgb(dark);
  ctx.fillRect(0, GROUND_SURFACE, W, H - GROUND_SURFACE);

  ctx.strokeStyle = rgba([77, 184, 232], 0.3);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_SURFACE + 2);
  ctx.lineTo(W, GROUND_SURFACE + 2);
  ctx.stroke();
}

// Golden wash background for post-cutscene screens
function drawGoldenWash() {
  var sunX = W * 0.58;
  var sunY = H * 0.35;

  var grad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, Math.max(W, H) * 0.95);
  grad.addColorStop(0, "rgb(255, 253, 245)");
  grad.addColorStop(0.25, "rgb(255, 249, 232)");
  grad.addColorStop(0.55, "rgb(252, 243, 218)");
  grad.addColorStop(0.8, "rgb(245, 237, 212)");
  grad.addColorStop(1, "rgb(238, 230, 205)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

// Draw background for a given km (used for start and death screens)
function drawBackground(km) {
  drawSky(km);
  drawSun(km);
  drawHills(km);
  drawGround(km);
}


// ============================================================
// [SVG SPRITE SYSTEM]
// ============================================================
var SPRITE_FILES = {
  walkContact1: "Jerry Sprites/charity-water-1_WALK-CONTACT1.svg",
  walkPassing:  "Jerry Sprites/charity-water-1_WALK-PASSING.svg",
  walkContact2: "Jerry Sprites/charity-water-1_WALK-CONTACT-2.svg",
  walkHit:      "Jerry Sprites/charity-water-1_WALK-OBSTACLE-HIT.svg",
  duckNormal:   "Jerry Sprites/charity-water-1_DUCK NORMAL.svg",
  duckHit:      "Jerry Sprites/charity-water-1_DUCK-OBSTACLE-HIT.svg",
  lose:         "Jerry Sprites/charity-water-1_LOSE.svg",
  back34:       "Jerry Sprites/charity-water-1_BACK 3-4 VIEW.svg"
};

var sprites = {};
var spritesLoaded = false;

function loadSprites(callback) {
  var spriteKeys = Object.keys(SPRITE_FILES);
  var remaining = spriteKeys.length;

  spriteKeys.forEach(function(key) {
    var img = new Image();
    img._loaded = false;
    img.onload = function() {
      img._loaded = true;
      remaining--;
      if (remaining <= 0) { spritesLoaded = true; if (callback) callback(); }
    };
    img.onerror = function() {
      console.warn("Failed to load sprite: " + SPRITE_FILES[key]);
      img._loaded = false;
      remaining--;
      if (remaining <= 0) { spritesLoaded = true; if (callback) callback(); }
    };
    img.src = SPRITE_FILES[key];
    sprites[key] = img;
  });
}

var walkFrames = ["walkContact1", "walkPassing", "walkContact2", "walkPassing"];
var walkFrameIndex = 0;
var walkFrameTimer = 0;
var WALK_FRAME_DURATION = 8;

var WALK_ASPECT  = 791 / 458;
var DUCK_ASPECT  = 426 / 458;
var LOSE_ASPECT  = 627 / 833;
var HIT_ASPECT   = 829 / 833;

var SPRITE_STAND_W = PLAYER_W;
var SPRITE_STAND_H = Math.round(PLAYER_W * WALK_ASPECT);
var SPRITE_DUCK_W  = PLAYER_W;
var SPRITE_DUCK_H  = Math.round(PLAYER_W * DUCK_ASPECT);
var SPRITE_HIT_W   = Math.round(PLAYER_W * (833 / 458));
var SPRITE_HIT_H   = Math.round(SPRITE_HIT_W * HIT_ASPECT);
var SPRITE_LOSE_W  = 80;
var SPRITE_LOSE_H  = Math.round(80 * LOSE_ASPECT);

var LOSE_ANIM_DURATION = 90;


// ============================================================
// [WATER DROP SVG]
// ============================================================
var dropSvgImage = new Image();
dropSvgImage._loaded = false;
dropSvgImage.onload = function() { dropSvgImage._loaded = true; };
dropSvgImage.src = "data:image/svg+xml,%3csvg%20fill='none'%20height='18'%20viewBox='0%200%2013%2018'%20width='13'%20xmlns='http://www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%3e%3cclipPath%20id='a'%3e%3cpath%20d='m.043457.549805h12.62v16.9h-12.62z'/%3e%3c/clipPath%3e%3cg%20clip-path='url(%23a)'%3e%3cpath%20d='m6.70353%2016.94c-3.2.24-6.01-2.17-6.25-5.37-.24-3.19996%204.56-9.58996%204.76-9.86996l.31-.41.36.36c.24.24%205.94997%205.94%206.18997%209.03996.24%203.1-2.16997%206-5.36997%206.25z'%20fill='%23fff'/%3e%3cpath%20d='m5.91349%2016.8199c-2.79.21-5.229999-1.89-5.439999-4.68-.21-2.68996%203.959999-8.34996%204.139999-8.58996l.27-.36.32.31c.21.21%205.19001%205.18%205.39001%207.86996.21%202.79-1.89001%205.23-4.68001%205.44z'%20fill='%235493d3'/%3e%3cpath%20d='m6.79366%2016.9296c-3.2.24-5.999997-2.16-6.239997-5.36-.24-3.09003%204.539997-9.57003%204.749997-9.85003l.3-.41.36.36c.24.24%205.94004%205.93%206.18004%209.02003.24%203.09-2.16004%205.99-5.36004%206.24z'%20stroke='%231a1a1a'%20stroke-linecap='round'%20stroke-miterlimit='10'/%3e%3c/g%3e%3c/svg%3e";


// ============================================================
// [JERRY CAN CHARACTER]
// ============================================================
function drawJerryCan() {
  var p = player;

  if (state === "dying") { drawDyingAnimation(); return; }

  if (p.invulnTimer > 0 && Math.floor(p.invulnTimer / 4) % 2 === 0) return;

  if (!spritesLoaded) return;

  ctx.save();

  if (p.stumbleTimer > 0) {
    var shake = Math.sin(p.stumbleTimer * 0.8) * 3;
    ctx.translate(shake, 0);
  }

  var spriteKey, drawW, drawH, drawX, drawY;

  if (p.ducking) {
    spriteKey = (p.invulnTimer > 0 && p.invulnTimer > INVULN_FRAMES - 20) ? "duckHit" : "duckNormal";
    drawW = SPRITE_DUCK_W;
    drawH = SPRITE_DUCK_H;
    drawX = p.x + (PLAYER_W - drawW) / 2;
    drawY = p.y - drawH + PLAYER_DRAW_Y_OFFSET;
  } else {
    if (p.invulnTimer > 0 && p.invulnTimer > INVULN_FRAMES - 20) {
      spriteKey = "walkHit";
      drawW = SPRITE_HIT_W;
      drawH = SPRITE_HIT_H;
    } else if (p.onGround) {
      spriteKey = walkFrames[walkFrameIndex];
      drawW = SPRITE_STAND_W;
      drawH = SPRITE_STAND_H;
    } else {
      spriteKey = "walkPassing";
      drawW = SPRITE_STAND_W;
      drawH = SPRITE_STAND_H;
    }
    drawX = p.x + (PLAYER_W - drawW) / 2;
    drawY = p.y - drawH + PLAYER_DRAW_Y_OFFSET;
  }

  var img = sprites[spriteKey];
  if (img && img._loaded) {
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  } else {
    ctx.fillStyle = COLORS.yellow;
    var fbH = p.ducking ? DUCK_H : PLAYER_H;
    ctx.fillRect(p.x, p.y - fbH + PLAYER_DRAW_Y_OFFSET, PLAYER_W, fbH);
    ctx.strokeStyle = "#d4a830";
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x, p.y - fbH + PLAYER_DRAW_Y_OFFSET, PLAYER_W, fbH);
  }

  ctx.restore();
}

function updateWalkCycle() {
  if (player.onGround && !player.ducking && !paused) {
    walkFrameTimer++;
    if (walkFrameTimer >= WALK_FRAME_DURATION) {
      walkFrameTimer = 0;
      walkFrameIndex = (walkFrameIndex + 1) % walkFrames.length;
    }
  } else if (!player.onGround) {
    walkFrameTimer = 0;
  }
}

// Dying animation
var dyingTimer = 0;
var dyingWasDucking = false;

function startDyingAnimation(wasDucking) {
  state = "dying";
  dyingTimer = 0;
  dyingWasDucking = wasDucking;
  deathKm = infiniteMode ? Math.min(elapsed * 0.3, 5) : distance;
}

function drawDyingAnimation() {
  if (!spritesLoaded) return;

  dyingTimer++;
  var t = Math.min(dyingTimer / LOSE_ANIM_DURATION, 1);

  ctx.save();

  if (t < 0.4) {
    var shake = Math.sin(dyingTimer * 1.5) * (4 - t * 8);
    ctx.translate(shake, 0);

    var spriteKey = dyingWasDucking ? "duckHit" : "walkHit";
    var img = sprites[spriteKey];
    var drawH, drawW, drawX, drawY;

    if (dyingWasDucking) {
      drawW = SPRITE_DUCK_W; drawH = SPRITE_DUCK_H;
      drawX = player.x + (PLAYER_W - drawW) / 2;
      drawY = player.y - drawH + PLAYER_DRAW_Y_OFFSET;
    } else {
      drawW = SPRITE_HIT_W; drawH = SPRITE_HIT_H;
      drawX = player.x + (PLAYER_W - drawW) / 2;
      drawY = player.y - drawH + PLAYER_DRAW_Y_OFFSET;
    }

    if (img && img._loaded) {
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    }
  } else {
    var loseT = (t - 0.4) / 0.6;
    var eased = loseT * loseT;

    var startX = player.x;
    var endX = player.x + 25;
    var startY = player.y - SPRITE_STAND_H + PLAYER_DRAW_Y_OFFSET;
    var endY = player.y - SPRITE_LOSE_H + PLAYER_DRAW_Y_OFFSET;

    var curX = lerp(startX, endX, eased);
    var curY = lerp(startY, endY, eased);

    var rotation = eased * 0.15;
    ctx.translate(curX + SPRITE_LOSE_W / 2, curY + SPRITE_LOSE_H / 2);
    ctx.rotate(rotation);
    ctx.translate(-(curX + SPRITE_LOSE_W / 2), -(curY + SPRITE_LOSE_H / 2));

    var img = sprites["lose"];
    if (img && img._loaded) {
      ctx.drawImage(img, curX, curY, SPRITE_LOSE_W, SPRITE_LOSE_H);
    }
  }

  ctx.restore();

  if (dyingTimer >= LOSE_ANIM_DURATION) {
    if (infiniteMode) {
      // Infinite mode goes straight to score
      state = "score";
      showInfiniteScore();
    } else {
      state = "death";
      showDeathScreen();
    }
  }
}


// ============================================================
// [WATER DROPS] — now using SVG image
// ============================================================
function drawDrop(drop) {
  var x = drop.x;
  var bob = Math.sin(elapsed * 2.5 + drop.x * 0.02) * 3;
  var y = drop.y + bob - DROP_H / 2;

  if (dropSvgImage._loaded) {
    ctx.drawImage(dropSvgImage, x, y, DROP_W, DROP_H);
  } else {
    // Fallback: simple blue drop shape
    var cx = x + DROP_W / 2;
    var cy = y + DROP_H / 2;
    ctx.fillStyle = COLORS.waterBlue;
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.quadraticCurveTo(cx + DROP_W / 2, cy, cx + DROP_W / 2, cy + DROP_H / 6);
    ctx.arc(cx, cy + DROP_H / 6, DROP_W / 2, 0, Math.PI, false);
    ctx.quadraticCurveTo(cx - DROP_W / 2, cy, cx, y);
    ctx.closePath();
    ctx.fill();
  }
}

function getDropBox(drop) {
  var bob = Math.sin(elapsed * 2.5 + drop.x * 0.02) * 3;
  return { x: drop.x + 2, y: drop.y + bob - DROP_H / 2 + 2, w: DROP_W - 4, h: DROP_H - 4 };
}


// ============================================================
// [OBSTACLES]
// ============================================================
function drawObstacle(obs) {
  if (obs.type === "rock")    drawRock(obs);
  if (obs.type === "cluster") drawCluster(obs);
  if (obs.type === "wind")    drawWind(obs);
}

function drawRock(obs) {
  ctx.fillStyle = "#b8956a";
  ctx.beginPath();
  ctx.moveTo(obs.x + ROCK_W / 2, obs.y - ROCK_H);
  ctx.lineTo(obs.x + ROCK_W, obs.y);
  ctx.lineTo(obs.x, obs.y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#32271a";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawCluster(obs) {
  ctx.fillStyle = "#b8956a";
  ctx.beginPath();
  ctx.moveTo(obs.x + 18, obs.y - CLUSTER_H + 8);
  ctx.lineTo(obs.x + 36, obs.y);
  ctx.lineTo(obs.x, obs.y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#32271a";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#a3845e";
  ctx.beginPath();
  ctx.moveTo(obs.x + 50, obs.y - CLUSTER_H);
  ctx.lineTo(obs.x + 72, obs.y);
  ctx.lineTo(obs.x + 28, obs.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#b8956a";
  ctx.beginPath();
  ctx.moveTo(obs.x + 82, obs.y - CLUSTER_H + 12);
  ctx.lineTo(obs.x + CLUSTER_W, obs.y);
  ctx.lineTo(obs.x + 65, obs.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawWind(obs) {
  if (obs.phase === undefined) obs.phase = 0;
  obs.phase += 0.08;

  var w = WIND_W;
  var h = WIND_H;

  ctx.lineCap = "round";

  for (var i = 0; i < 5; i++) {
    var yy = obs.y + 4 + i * (h / 5);
    var shift = Math.sin(obs.phase + i * 1.2) * 8;

    ctx.beginPath();
    ctx.moveTo(obs.x + shift, yy);
    for (var px = 0; px <= w; px += 4) {
      var wave = Math.sin((px * 0.06) + obs.phase + i) * 5;
      ctx.lineTo(obs.x + px + shift, yy + wave);
    }

    ctx.strokeStyle = "rgba(47, 47, 58, 0.73)";
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.strokeStyle = "rgba(225, 225, 240, 0.7)";
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }
}

function getObsBox(obs) {
  if (obs.type === "rock") {
    return { x: obs.x + 6, y: obs.y - ROCK_H + 6, w: ROCK_W - 12, h: ROCK_H - 6 };
  }
  if (obs.type === "cluster") {
    return { x: obs.x + 5, y: obs.y - CLUSTER_H + 4, w: CLUSTER_W - 10, h: CLUSTER_H - 4 };
  }
  if (obs.type === "wind") {
    return { x: obs.x + 5, y: obs.y + 2, w: WIND_W - 10, h: WIND_H - 4 };
  }
}


// ============================================================
// [SPAWNING SYSTEM]
// ============================================================
function dropOverlapsObstacle(dx, dy) {
  var MARGIN = 20;
  var dropBox = {
    x: dx - MARGIN,
    y: dy - DROP_H / 2 - MARGIN,
    w: DROP_W + MARGIN * 2,
    h: DROP_H + MARGIN * 2
  };
  for (var i = 0; i < obstacles.length; i++) {
    var oBox = getObsBox(obstacles[i]);
    if (boxOverlap(dropBox, oBox)) return true;
  }
  return false;
}

function spawnDropGroup() {
  var count = 1 + Math.floor(Math.random() * 4);
  var level = Math.random();
  var baseY;

  if (level < 0.4) baseY = GROUND_Y - 20;
  else if (level < 0.75) baseY = GROUND_Y - PLAYER_H - 5;
  else baseY = GROUND_Y - PLAYER_H - 40;

  for (var i = 0; i < count; i++) {
    var dropX = W + i * 40;
    if (!dropOverlapsObstacle(dropX, baseY)) {
      drops.push({ x: dropX, y: baseY });
    }
  }
}

function spawnObstacle() {
  var types = ["rock", "cluster", "wind"];
  var type = types[Math.floor(Math.random() * types.length)];
  var obs = { type: type, x: W + 20 };

  if (type === "rock")         obs.y = GROUND_SURFACE;
  else if (type === "cluster") obs.y = GROUND_SURFACE;
  else if (type === "wind")    obs.y = GROUND_Y - WIND_BOTTOM_GAP - WIND_H;

  obstacles.push(obs);
}

function updateSpawning() {
  frameCount++;

  // Stop spawning obstacles at 5.8km so screen clears before cutscene
  var pastObstacleCutoff = (!infiniteMode && distance >= 5.8);

  // Use appropriate distance metric
  var dist = infiniteMode ? infiniteDistance : distance;

  var dropInterval, obsInterval;
  if (infiniteMode) {
    // Infinite: drops stay consistent, obstacles tighten with distance
    dropInterval = 38;
    if (dist < 0.5)     obsInterval = 48;
    else if (dist < 1)  obsInterval = 36;
    else if (dist < 3)  obsInterval = 26;
    else                obsInterval = 18;
  } else {
    if (dist < 1)      { dropInterval = 46; obsInterval = 50; }
    else if (dist < 2) { dropInterval = 41; obsInterval = 32; }
    else if (dist < 4) { dropInterval = 37; obsInterval = 24; }
    else               { dropInterval = 34; obsInterval = 20; }
  }

  nextDropSpawn--;
  nextObstacleSpawn--;

  if (nextDropSpawn <= 0) {
    spawnDropGroup();
    nextDropSpawn = dropInterval + Math.floor(Math.random() * 15);
  }

  if (nextObstacleSpawn <= 0 && frameCount > 180 && !pastObstacleCutoff) {
    spawnObstacle();
    var minFrameGap = Math.max(obsInterval, Math.ceil(290 / scrollSpeed));
    nextObstacleSpawn = minFrameGap + Math.floor(Math.random() * 10);

    if (Math.random() < 0.35) {
      var lastObs = obstacles[obstacles.length - 1];
      var riskY;
      var riskX = lastObs.x - 65;

      if (lastObs.type === "wind") riskY = GROUND_Y - 20;
      else riskY = GROUND_Y - PLAYER_H + 5;

      if (!dropOverlapsObstacle(riskX, riskY)) {
        drops.push({ x: riskX, y: riskY });
      }
      if (!dropOverlapsObstacle(riskX + 35, riskY)) {
        drops.push({ x: riskX + 35, y: riskY });
      }
    }
  }
}


// ============================================================
// [COLLISION DETECTION]
// ============================================================
function boxOverlap(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

function getPlayerBox() {
  var h = player.ducking ? DUCK_H : PLAYER_H;
  return { x: player.x + 6, y: player.y - h + 4, w: PLAYER_W - 12, h: h - 8 };
}


// ============================================================
// [PARTICLES]
// ============================================================
function spawnParticles(x, y, color, count) {
  for (var i = 0; i < count; i++) {
    particles.push({
      x: x, y: y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6 - 2,
      life: 20 + Math.random() * 15,
      color: color,
      size: 2 + Math.random() * 4
    });
  }
}

function updateAndDrawParticles() {
  for (var i = particles.length - 1; i >= 0; i--) {
    var p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15;
    p.life--;

    var alpha = p.life / 30;
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    if (p.life <= 0) particles.splice(i, 1);
  }
}


// ============================================================
// [HUD / UI]
// ============================================================
function drawRoundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawCounterPill(x, y, w, h, fillColor) {
  ctx.fillStyle = fillColor || "rgba(255,255,255,0.32)";
  drawRoundedRect(x, y, w, h, 10);
  ctx.fill();
}

function drawHUD() {
  if (infiniteMode) {
    drawHUD_Infinite();
  } else {
    drawHUD_Story();
  }

  drawPauseButton();
}

function drawHUD_Story() {
  var meterX = 50, meterY = 25, meterW = 200, meterH = 22;

  // Water drop SVG icon
  if (dropSvgImage._loaded) {
    ctx.drawImage(dropSvgImage, 18, meterY - 5, 20, 28);
  } else {
    ctx.fillStyle = COLORS.waterBlue;
    ctx.beginPath();
    ctx.moveTo(28, meterY - 6);
    ctx.quadraticCurveTo(38, meterY + 8, 38, meterY + 12);
    ctx.arc(28, meterY + 12, 10, 0, Math.PI, false);
    ctx.quadraticCurveTo(18, meterY + 8, 28, meterY - 6);
    ctx.closePath();
    ctx.fill();
  }

  // Meter background (matches score-page meter styling)
  ctx.fillStyle = "rgba(0,0,0,0.08)";
  drawRoundedRect(meterX, meterY, meterW, meterH, meterH / 2);
  ctx.fill();

  // Meter fill
  var fill = Math.min(water / MAX_WATER, 1);
  if (fill > 0) {
    var meterGrad = ctx.createLinearGradient(meterX, meterY, meterX + meterW, meterY);
    meterGrad.addColorStop(0, "#3a9ad9");
    meterGrad.addColorStop(1, "#4db8e8");
    ctx.fillStyle = meterGrad;
    drawRoundedRect(meterX, meterY, meterW * fill, meterH, meterH / 2);
    ctx.fill();
  }

  // Meter border
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 1;
  drawRoundedRect(meterX, meterY, meterW, meterH, meterH / 2);
  ctx.stroke();

  // Water number
  var waterText = Math.floor(water) + " / " + MAX_WATER;
  ctx.font = "700 14px " + HUD_FONT_STACK;
  ctx.fillStyle = COLORS.white;
  ctx.font = "700 14px " + HUD_FONT_STACK;
  ctx.textAlign = "left";
  ctx.fillText(waterText, meterX + 10, meterY + 16);

  // Score
  var scoreText = "SCORE: " + Math.floor(water);
  ctx.font = "700 16px " + HUD_FONT_STACK;
  var scoreTextW = ctx.measureText(scoreText).width;
  drawCounterPill(18, meterY + meterH + 8, scoreTextW + 20, 24, HUD_PILL_BLUE);
  ctx.fillStyle = HUD_SCORE_BLUE;
  ctx.font = "700 16px " + HUD_FONT_STACK;
  ctx.textAlign = "left";
  ctx.fillText(scoreText, 28, meterY + meterH + 26);

  // Distance — with background pill
  ctx.font = "700 20px " + HUD_FONT_STACK;
  var distText = "DISTANCE: " + distance.toFixed(2) + " km / " + TOTAL_DISTANCE + " km";
  var distTextW = ctx.measureText(distText).width;
  var distPillX = W - 70 - distTextW - 10;
  var distPillY = 24;
  drawCounterPill(distPillX, distPillY, distTextW + 20, 28, HUD_PILL_YELLOW);

  ctx.fillStyle = HUD_DISTANCE_COLOR;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText(distText, W - 70, distPillY + 14);
  ctx.textBaseline = "alphabetic";
}

function drawHUD_Infinite() {
  var iconY = 22;

  // Drop counter — background pill
  var dropText = "" + totalDropsCollected;
  ctx.font = "700 18px " + HUD_FONT_STACK;
  var dropTextW = ctx.measureText(dropText).width;
  drawCounterPill(12, iconY - 7, 28 + dropTextW + 14, 32, HUD_PILL_BLUE);

  // Water drop SVG icon
  if (dropSvgImage._loaded) {
    ctx.drawImage(dropSvgImage, 18, iconY - 3, 18, 25);
  }

  // Drops collected count
  ctx.fillStyle = HUD_SCORE_BLUE;
  ctx.font = "700 18px " + HUD_FONT_STACK;
  ctx.textAlign = "left";
  ctx.fillText(dropText, 42, iconY + 16);

  // Distance — with background pill
  ctx.font = "700 20px " + HUD_FONT_STACK;
  var distText = "DISTANCE: " + infiniteDistance.toFixed(2) + " km";
  var distTextW = ctx.measureText(distText).width;
  var distPillX = W - 70 - distTextW - 10;
  var distPillY = 24;
  drawCounterPill(distPillX, distPillY, distTextW + 20, 28, HUD_PILL_YELLOW);

  ctx.fillStyle = HUD_DISTANCE_COLOR;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText(distText, W - 70, distPillY + 14);
  ctx.textBaseline = "alphabetic";
}

function drawPauseButton() {
  var x = PAUSE_BTN_X, y = PAUSE_BTN_Y, s = PAUSE_BTN_SIZE;
  ctx.strokeStyle = "rgba(0,0,0,0.85)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, s, s);
  ctx.fillStyle = COLORS.white;
  var barW = 6, barH = 20, barY = y + (s - barH) / 2;
  ctx.fillRect(x + s/2 - barW - 3, barY, barW, barH);
  ctx.fillRect(x + s/2 + 3, barY, barW, barH);
}


// ============================================================
// [PAUSE SCREEN] — now HTML overlay, see overlayPause
// ============================================================
// Canvas pause drawing removed — handled by togglePause() + HTML overlay


// ============================================================
// [COUNTDOWN] — still canvas-drawn (brief, no need for HTML)
// ============================================================
function drawCountdown() {
  drawBackground(0);

  ctx.fillStyle = COLORS.yellow;
  ctx.font = "700 120px " + HUD_FONT_STACK;
  ctx.textAlign = "center";
  ctx.fillText(countdownNum, W/2, H/2 + 30);
}


// ============================================================
// [DEATH SCREEN] — story mode only
// ============================================================
function showDeathScreen() {
  hideAllOverlays();
  showOverlay("overlayDeath");
}


// ============================================================
// [INFINITE SCORE SCREEN]
// ============================================================
function showInfiniteScore() {
  hideAllOverlays();
  hideSkipButton();

  // Update high scores
  infiniteHighScore = Math.max(infiniteHighScore, infiniteDistance);
  infiniteBestDrops = Math.max(infiniteBestDrops, totalDropsCollected);
  saveState();

  // Configure score screen for infinite
  document.getElementById("scoreTitle").textContent = "Thank you for playing!";
  document.getElementById("scoreRowWater").style.display = "none";
  document.getElementById("scoreRowMeter").style.display = "none";
  document.getElementById("scoreRowDrops").style.display = "flex";
  document.getElementById("scoreRowBestDrops").style.display = "flex";
  document.getElementById("scoreDrops").textContent = totalDropsCollected;
  document.getElementById("scoreBestDrops").textContent = infiniteBestDrops;
  document.getElementById("scoreDistance").textContent = infiniteDistance.toFixed(2) + " km";
  document.getElementById("scoreRowHighScore").style.display = "flex";
  document.getElementById("scoreBestDist").textContent = infiniteHighScore.toFixed(2) + " km";

  // Show infinite buttons, hide story buttons
  document.getElementById("scoreButtonsStory").style.display = "none";
  document.getElementById("scoreButtonsInfinite").style.display = "flex";

  showOverlay("overlayScore");
}


// ============================================================
// [END SCREENS FLOW] — post-cutscene educational sequence
// ============================================================
function beginEndScreens() {
  state = "endScreens";
  hideAllOverlays();
  hideSkipButton();

  // Show skip for returning players
  showSkipButton(false);

  // Start with arrival screen
  showScreen_Arrival();
}

function showScreen_Arrival() {
  hideAllOverlays();
  showOverlay("overlayArrival");
  showSkipButton(false);

  // Reset meter animation elements
  var fill = document.getElementById("meterFill");
  var label = document.getElementById("meterLabel");
  fill.style.width = "0%";
  fill.classList.remove("filling", "perfect");
  label.textContent = "";
  label.classList.remove("perfect-text");

  // Animate meter after delay (matches CSS animation-delay on meter-wrap)
  setTimeout(function() {
    if (state !== "endScreens") return;
    animateArrivalMeter();
  }, 700);

  // Auto-advance after 4.5 seconds
  endScreenTimeout = setTimeout(function() { showScreen_Fact1(); }, 6000);
  currentAdvanceFn = showScreen_Fact1;
}

function animateArrivalMeter() {
  var fill = document.getElementById("meterFill");
  var label = document.getElementById("meterLabel");
  var pct = Math.min(Math.floor(water), 100);

  fill.classList.add("filling");
  fill.style.width = pct + "%";

  // Count up number
  var current = 0;
  var step = Math.max(1, Math.floor(pct / 60)); // complete in ~1 second
  if (meterCountInterval) clearInterval(meterCountInterval);

  meterCountInterval = setInterval(function() {
    current += step;
    if (current >= pct) {
      current = pct;
      clearInterval(meterCountInterval);
      meterCountInterval = null;

      if (pct >= 100) {
        label.textContent = "Every drop made it home";
        label.classList.add("perfect-text");
        fill.classList.add("perfect");
      } else {
        label.textContent = current + "%";
      }
    } else {
      label.textContent = current + "%";
    }
  }, 18);
}

function showScreen_Fact1() {
  hideAllOverlays();
  showOverlay("overlayFact1");
  showSkipButton(false);

  endScreenTimeout = setTimeout(function() { showScreen_Fact2(); }, 6000);
  currentAdvanceFn = showScreen_Fact2;
}

function showScreen_Fact2() {
  hideAllOverlays();
  showOverlay("overlayFact2");
  showSkipButton(false);

  endScreenTimeout = setTimeout(function() { showScreen_Hope(); }, 9000);
  currentAdvanceFn = showScreen_Hope;
}

function showScreen_Hope() {
  hideAllOverlays();
  showOverlay("overlayHope");
  showSkipButton(false);

  endScreenTimeout = setTimeout(function() { showScreen_CTA(); }, 8000);
  currentAdvanceFn = showScreen_Hope; // clicking on hope advances to CTA
  currentAdvanceFn = showScreen_CTA;
}

function showScreen_CTA() {
  hideAllOverlays();
  showOverlay("overlayCTA");
  showSkipButton(false);
  // No auto-advance — user must click Continue or Skip
  currentAdvanceFn = null;
}

function transitionToScore() {
  hideAllOverlays();
  hideSkipButton();
  state = "score";
  hasCompletedOnce = true;

  // Update best water score
  storyBestWater = Math.max(storyBestWater, Math.min(Math.floor(water), 100));
  saveState();

  // Configure score screen for story mode
  document.getElementById("scoreTitle").textContent = "Thank you for playing!";
  document.getElementById("scoreRowWater").style.display = "flex";
  document.getElementById("scoreRowMeter").style.display = "flex";
  document.getElementById("scoreRowDrops").style.display = "none";
  document.getElementById("scoreRowBestDrops").style.display = "none";
  document.getElementById("scoreRowHighScore").style.display = "none";

  document.getElementById("scoreWater").textContent = totalDropsCollected + " drops";
  document.getElementById("scorePct").textContent = Math.min(Math.floor(water), 100) + "%";
  document.getElementById("scoreDistance").textContent = "6.00 km ✓";

  var scoreFill = document.getElementById("scoreMeterFill");
  scoreFill.style.width = "0%";

  // Show story buttons, hide infinite buttons
  document.getElementById("scoreButtonsStory").style.display = "flex";
  document.getElementById("scoreButtonsInfinite").style.display = "none";

  var infBtn = document.getElementById("btnInfinite");
  if (infiniteUnlocked) {
    infBtn.style.display = "inline-flex";
  }

  showOverlay("overlayScore");

  // Animate score meter after short delay
  setTimeout(function() {
    scoreFill.style.width = Math.min(Math.floor(water), 100) + "%";
  }, 300);
}


// ============================================================
// [GAME LOOP]
// ============================================================
function resetGame() {
  player = {
    x: PLAYER_X, y: GROUND_Y, vy: 0,
    onGround: true, ducking: false, duckTimer: 0,
    invulnTimer: 0, stumbleTimer: 0
  };
  drops = [];
  obstacles = [];
  particles = [];
  water = START_WATER;
  distance = 0;
  elapsed = 0;
  scrollSpeed = BASE_SPEED;
  frameCount = 0;
  nextDropSpawn = 30;
  nextObstacleSpawn = 180;
  hillOffset = 0;
  paused = false;
  walkFrameIndex = 0;
  walkFrameTimer = 0;
  dyingTimer = 0;
  endResult = "";
  totalDropsCollected = 0;
  deathKm = 0;

  // Cutscene resets
  cutscenePhase = "";
  cutsceneTimer = 0;
  cutsceneSpeedSnap = 0;
  cutscenePlayerStart = 0;
  cutsceneCamY = 0;
  cutsceneSunScale = 1;
  cutsceneRayAngle = 0;
  cutsceneWhiteout = 0;

  // Clear any pending timers
  if (endScreenTimeout) { clearTimeout(endScreenTimeout); endScreenTimeout = null; }
  if (meterCountInterval) { clearInterval(meterCountInterval); meterCountInterval = null; }
  currentAdvanceFn = null;
}

function startCountdown() {
  resetGame();
  hideAllOverlays();
  hideSkipButton();
  infiniteMode = false;

  if (!hasSeenTutorial) {
    state = "tutorial";
    showOverlay("overlayTutorial");
  } else {
    beginCountdown();
  }
}

function beginCountdown() {
  state = "countdown";
  countdownNum = 3;
  countdownTimer = 0;
}

function resetAndPlay() {
  startCountdown();
}

function startInfinite() {
  resetGame();
  hideAllOverlays();
  hideSkipButton();
  infiniteMode = true;

  if (!hasSeenInfTutorial) {
    state = "tutorial";
    showOverlay("overlayInfTutorial");
  } else {
    beginInfCountdown();
  }
}

function beginInfCountdown() {
  state = "countdown";
  countdownNum = 3;
  countdownTimer = 0;
}

function update() {
  if (paused) return;

  if (state === "countdown") {
    countdownTimer++;
    if (countdownTimer >= 60) {
      countdownTimer = 0;
      countdownNum--;
      if (countdownNum <= 0) {
        state = infiniteMode ? "infinite" : "playing";
      }
    }
    return;
  }

  if (state !== "playing" && state !== "infinite" && state !== "dying" && state !== "cutscene") return;

  if (state === "dying") return;

  // ---- CUTSCENE UPDATE ----
  if (state === "cutscene") {
    updateCutscene();
    return;
  }

  // Input
  if (keys["w"] || keys["W"] || keys["ArrowUp"] || keys[" "]) tryJump();
  if (keys["s"] || keys["S"] || keys["ArrowDown"]) tryDuck();

  // Speed & distance
  if (!infiniteMode) {
    var progress = Math.min(elapsed / TOTAL_TIME, 1);
    scrollSpeed = BASE_SPEED + (MAX_SPEED - BASE_SPEED) * Math.pow(progress, 0.8);

    // Nudge only the middle stretch to feel a bit tougher without changing start/end feel.
    if (progress >= 0.35 && progress <= 0.75) {
      scrollSpeed *= 1.04;
    }

    elapsed += 1 / 60;
    distance = progress * TOTAL_DISTANCE;
  } else {
    // Infinite: speed ramps up continuously, accelerating
    scrollSpeed = BASE_SPEED + elapsed * 0.16 + elapsed * elapsed * 0.0035;
    elapsed += 1 / 60;
    infiniteDistance += scrollSpeed / 3600;  // pixels to km approximation
  }

  // Player physics
  var effectiveGravity = GRAVITY * getGravityScale(scrollSpeed);

  if (!player.onGround) {
    player.vy += effectiveGravity;
    player.y += player.vy;
    if (player.y >= GROUND_Y) {
      player.y = GROUND_Y;
      player.vy = 0;
      player.onGround = true;
    }
  }

  if (player.ducking) {
    player.duckTimer--;
    if (player.duckTimer <= 0) player.ducking = false;
  }

  if (player.invulnTimer > 0) player.invulnTimer--;
  if (player.stumbleTimer > 0) player.stumbleTimer--;

  updateWalkCycle();

  // Parallax
  hillOffset += scrollSpeed;

  // Spawning
  updateSpawning();

  // Move drops
  for (var i = drops.length - 1; i >= 0; i--) {
    drops[i].x -= scrollSpeed;
    if (drops[i].x < -50) drops.splice(i, 1);
  }

  // Move obstacles
  for (var i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].x -= scrollSpeed;
    if (obstacles[i].x < -100) obstacles.splice(i, 1);
  }

  // Collision: Player vs Drops
  var pBox = getPlayerBox();
  for (var i = drops.length - 1; i >= 0; i--) {
    var dBox = getDropBox(drops[i]);
    if (boxOverlap(pBox, dBox)) {
      water = Math.min(water + DROP_VALUE, MAX_WATER);
      totalDropsCollected++;
      drops.splice(i, 1);
    }
  }

  // Collision: Player vs Obstacles
  if (player.invulnTimer <= 0) {
    for (var i = 0; i < obstacles.length; i++) {
      var oBox = getObsBox(obstacles[i]);
      if (boxOverlap(pBox, oBox)) {
        if (infiniteMode) {
          infiniteHighScore = Math.max(infiniteHighScore, infiniteDistance);
          startDyingAnimation(player.ducking);
          endResult = "infinite";
          return;
        }

        var dmg = DAMAGE_ZONE_1;
        if (distance >= 3.5) dmg = DAMAGE_ZONE_3;
        else if (distance >= 1.5) dmg = DAMAGE_ZONE_2;

        water -= dmg;
        player.invulnTimer = INVULN_FRAMES;
        player.stumbleTimer = 20;
        spawnParticles(player.x + PLAYER_W/2, player.y - PLAYER_H/2, COLORS.waterBlue, 10);

        if (water <= 0 && distance >= 0.5) {
          water = 0;
          endResult = "loss";
          startDyingAnimation(player.ducking);
          return;
        }
        water = Math.max(0, water);
        break;
      }
    }
  }

  // Win check — trigger cutscene
  if (!infiniteMode && distance >= TOTAL_DISTANCE) {
    infiniteUnlocked = true;
    endResult = water >= WIN_WATER ? "win" : "partial";
    state = "cutscene";
    cutscenePhase = player.onGround ? "decel" : "landing";
    cutsceneTimer = 0;
    cutsceneSpeedSnap = scrollSpeed;
    cutsceneCamY = 0;
    cutsceneSunScale = 1;
    cutsceneRayAngle = 0;
    cutsceneWhiteout = 0;
    player.ducking = false;
    player.duckTimer = 0;

    // Show skip button for returning players during cutscene
    showSkipButton(true);
  }
}


// ============================================================
// [CUTSCENE SYSTEM]
// ============================================================
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function easeInCubic(t) { return t * t * t; }
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function updateCutscene() {
  cutsceneTimer++;

  if (cutscenePhase === "landing") {
    player.vy += GRAVITY;
    player.y += player.vy;

    if (player.y >= GROUND_Y) {
      player.y = GROUND_Y;
      player.vy = 0;
      player.onGround = true;
      cutscenePhase = "decel";
      cutsceneTimer = 0;
    }

    hillOffset += scrollSpeed;
    for (var i = drops.length - 1; i >= 0; i--) {
      drops[i].x -= scrollSpeed;
      if (drops[i].x < -50) drops.splice(i, 1);
    }
    for (var i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].x -= scrollSpeed;
      if (obstacles[i].x < -100) obstacles.splice(i, 1);
    }
    return;
  }

  if (cutscenePhase === "decel") {
    var t = Math.min(cutsceneTimer / DECEL_FRAMES, 1);
    var eased = easeOutCubic(t);
    scrollSpeed = cutsceneSpeedSnap * (1 - eased);

    hillOffset += scrollSpeed;

    for (var i = drops.length - 1; i >= 0; i--) {
      drops[i].x -= scrollSpeed;
      if (drops[i].x < -50) drops.splice(i, 1);
    }
    for (var i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].x -= scrollSpeed;
      if (obstacles[i].x < -100) obstacles.splice(i, 1);
    }

    updateWalkCycle();

    if (t >= 1) {
      scrollSpeed = 0;
      cutscenePhase = "walkCenter";
      cutsceneTimer = 0;
      cutscenePlayerStart = player.x;
    }
  }

  else if (cutscenePhase === "walkCenter") {
    var targetX = W / 2 - PLAYER_W / 2;
    var dx = targetX - player.x;

    if (Math.abs(dx) > 2) {
      player.x += Math.sign(dx) * WALK_CENTER_SPEED;
      updateWalkCycle();
    } else {
      player.x = targetX;
      cutscenePhase = "spriteSwap";
      cutsceneTimer = 0;
    }
  }

  else if (cutscenePhase === "spriteSwap") {
    if (cutsceneTimer >= SPRITE_SWAP_PAUSE) {
      cutscenePhase = "panSun";
      cutsceneTimer = 0;
    }
  }

  else if (cutscenePhase === "panSun") {
    var t = Math.min(cutsceneTimer / PAN_SUN_FRAMES, 1);
    var eased = easeInOutCubic(t);

    cutsceneCamY = eased * 450;
    cutsceneSunScale = 1 + eased * 11;

    var rotSpeed = 0.003 + eased * 0.02;
    cutsceneRayAngle += rotSpeed;

    if (t >= 1) {
      cutscenePhase = "whiteout";
      cutsceneTimer = 0;
    }
  }

  else if (cutscenePhase === "whiteout") {
    var t = Math.min(cutsceneTimer / WHITEOUT_FRAMES, 1);
    cutsceneWhiteout = easeInCubic(t);

    cutsceneRayAngle += 0.023;

    if (t >= 1) {
      cutscenePhase = "postWhite";
      cutsceneTimer = 0;
    }
  }

  else if (cutscenePhase === "postWhite") {
    if (cutsceneTimer >= POST_WHITE_PAUSE) {
      // Transition to end screens
      beginEndScreens();
    }
  }
}


function drawCutscene() {
  var km = 6;

  var skyTop = blendPalette(skyTopPalette, km);
  var skyBot = blendPalette(skyBotPalette, km);
  var skyGrad = ctx.createLinearGradient(0, 0, 0, H);
  skyGrad.addColorStop(0, rgb(skyTop));
  skyGrad.addColorStop(1, rgb(skyBot));
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  drawCutsceneSun(km);

  ctx.save();
  ctx.translate(0, cutsceneCamY);

  drawHills(km);
  drawGround(km);

  if (cutscenePhase === "landing" || cutscenePhase === "decel" || cutscenePhase === "walkCenter") {
    drawJerryCan();
  } else if (cutscenePhase === "spriteSwap" || cutscenePhase === "panSun") {
    drawBack34Sprite();
  }

  ctx.restore();

  var hudAlpha = 1;
  if (cutscenePhase === "landing") {
    hudAlpha = 1;
  } else if (cutscenePhase === "decel") {
    hudAlpha = 1 - Math.min(cutsceneTimer / (DECEL_FRAMES * 0.6), 1);
  } else {
    hudAlpha = 0;
  }
  if (hudAlpha > 0) {
    ctx.globalAlpha = hudAlpha;
    drawHUD();
    ctx.globalAlpha = 1;
  }

  if (cutsceneWhiteout > 0 || cutscenePhase === "postWhite") {
    var alpha = cutscenePhase === "postWhite" ? 1 : cutsceneWhiteout;

    var sunScreenX = W * 0.58;
    var sunBaseY = lerpKeyframes(sunPositions, km, "y");
    var sunTargetY = H * 0.32;
    var sunScreenY = lerp(sunBaseY, sunTargetY, 1);

    var whiteGrad = ctx.createRadialGradient(
      sunScreenX, sunScreenY, 0,
      sunScreenX, sunScreenY, Math.max(W, H) * 1.2
    );
    whiteGrad.addColorStop(0, "rgba(255, 255, 255, " + alpha + ")");
    whiteGrad.addColorStop(0.6, "rgba(255, 252, 245, " + alpha + ")");
    whiteGrad.addColorStop(1, "rgba(248, 243, 230, " + alpha + ")");

    ctx.fillStyle = whiteGrad;
    ctx.fillRect(0, 0, W, H);
  }
}


function drawCutsceneSun(km) {
  var sunX = W * 0.58;
  var sunBaseY = lerpKeyframes(sunPositions, km, "y");
  var baseRadius = lerpKeyframes(sunPositions, km, "r");

  var sunTargetY = H * 0.32;
  var riseT = 0;
  if (cutscenePhase === "panSun") {
    riseT = easeInOutCubic(Math.min(cutsceneTimer / PAN_SUN_FRAMES, 1));
  } else if (cutscenePhase === "whiteout" || cutscenePhase === "postWhite") {
    riseT = 1;
  }
  var sunY = lerp(sunBaseY, sunTargetY, riseT);

  var radius = baseRadius * cutsceneSunScale;

  var col = blendPalette(sunPalette, km);
  var ringCol = blendPalette(sunRingPalette, km);
  var centerCol = blendPalette(sunCenterPalette, km);

  var glow = ctx.createRadialGradient(sunX, sunY, radius * 0.3, sunX, sunY, radius * 2.5);
  glow.addColorStop(0, rgba(col, 0.35));
  glow.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  if (cutsceneSunScale > 1.2) {
    drawSunRays(sunX, sunY, radius);
  }

  ctx.beginPath();
  ctx.arc(sunX, sunY, radius + 14 * Math.min(cutsceneSunScale, 4), 0, Math.PI * 2);
  ctx.fillStyle = rgba(ringCol, 0.65);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(sunX, sunY, radius, 0, Math.PI * 2);
  ctx.fillStyle = rgb(col);
  ctx.fill();

  var inner = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, radius * 0.7);
  inner.addColorStop(0, rgba(centerCol, 0.7));
  inner.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = inner;
  ctx.beginPath();
  ctx.arc(sunX, sunY, radius, 0, Math.PI * 2);
  ctx.fill();
}


function drawSunRays(cx, cy, radius) {
  var numRays = 12;
  var rayLength = radius * 2.5;
  var rayWidth = 0.09;

  var fadeIn = clamp((cutsceneSunScale - 1.2) / 2, 0, 1);
  var alpha = fadeIn * 0.45;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(cutsceneRayAngle);

  for (var i = 0; i < numRays; i++) {
    var angle = (i / numRays) * Math.PI * 2;

    ctx.save();
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.moveTo(radius * 0.7, -Math.tan(rayWidth) * radius * 0.7);
    ctx.lineTo(radius + rayLength, 0);
    ctx.lineTo(radius * 0.7, Math.tan(rayWidth) * radius * 0.7);
    ctx.closePath();

    var rayGrad = ctx.createLinearGradient(radius * 0.7, 0, radius + rayLength, 0);
    rayGrad.addColorStop(0, "rgba(255, 203, 61, " + alpha + ")");
    rayGrad.addColorStop(0.4, "rgba(255, 215, 90, " + (alpha * 0.7) + ")");
    rayGrad.addColorStop(1, "rgba(255, 235, 170, 0)");

    ctx.fillStyle = rayGrad;
    ctx.fill();

    ctx.restore();
  }

  ctx.restore();
}


function drawBack34Sprite() {
  var img = sprites["back34"];
  var drawW = SPRITE_BACK34_W;
  var drawH = SPRITE_BACK34_H;
  var drawX = player.x + (PLAYER_W - drawW) / 2;
  var drawY = player.y - drawH + PLAYER_DRAW_Y_OFFSET;

  if (img && img._loaded) {
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  } else {
    ctx.fillStyle = COLORS.yellow;
    ctx.fillRect(player.x, player.y - PLAYER_H + PLAYER_DRAW_Y_OFFSET, PLAYER_W, PLAYER_H);
    ctx.strokeStyle = "#d4a830";
    ctx.lineWidth = 2;
    ctx.strokeRect(player.x, player.y - PLAYER_H + PLAYER_DRAW_Y_OFFSET, PLAYER_W, PLAYER_H);
  }
}


// ============================================================
// [DRAW FUNCTION]
// ============================================================
function draw() {
  ctx.clearRect(0, 0, W, H);

  // --- Screens that only need a canvas background (HTML overlays handle content) ---

  if (state === "start" || state === "tutorial") {
    drawBackground(0);
    return;
  }

  if (state === "countdown") {
    drawCountdown();
    return;
  }

  if (state === "cutscene") {
    drawCutscene();
    return;
  }

  if (state === "death") {
    drawBackground(deathKm);
    return;
  }

  if (state === "endScreens") {
    drawGoldenWash();
    return;
  }

  if (state === "score") {
    drawGoldenWash();
    return;
  }

  // --- Active gameplay ---
  if (state === "dying") {
    var km = infiniteMode ? Math.min(elapsed * 0.3, 5) : distance;
    drawSky(km);
    drawSun(km);
    drawHills(km);
    drawGround(km);

    for (var i = 0; i < drops.length; i++) drawDrop(drops[i]);
    for (var i = 0; i < obstacles.length; i++) drawObstacle(obstacles[i]);

    drawJerryCan();
    updateAndDrawParticles();
    drawHUD();
    return;
  }

  // Playing / Infinite
  var km = infiniteMode ? Math.min(elapsed * 0.3, 5) : distance;

  drawSky(km);
  drawSun(km);
  drawHills(km);
  drawGround(km);

  for (var i = 0; i < drops.length; i++) drawDrop(drops[i]);
  for (var i = 0; i < obstacles.length; i++) drawObstacle(obstacles[i]);

  drawJerryCan();

  if (!paused) updateAndDrawParticles();

  drawHUD();

  // Km flash
  var kmFloor = Math.floor(distance);
  var kmFrac  = distance - kmFloor;
  if (kmFloor > 0 && kmFrac < 0.02 && !infiniteMode) {
    ctx.fillStyle = "rgba(255,203,61,0.15)";
    ctx.fillRect(0, 0, W, H);
  }

  // Pause overlay is now HTML — no canvas drawing needed
}


// ============================================================
// [INITIALIZATION]
// ============================================================
var gameLoopStarted = false;

function startGameLoop() {
  if (gameLoopStarted) return;
  gameLoopStarted = true;
  gameLoop();
}

loadSprites(function() {
  startGameLoop();
});

setTimeout(function() {
  if (!spritesLoaded) spritesLoaded = true;
  startGameLoop();
}, 2000);

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}


// ============================================================
// [FULLSCREEN BUTTON]
// ============================================================
(function() {
  var btn = document.getElementById("fullscreenBtn");
  var card = document.getElementById("gameCard");
  if (btn && card) {
    btn.addEventListener("click", function() {
      if (!document.fullscreenElement) {
        if (card.requestFullscreen) card.requestFullscreen();
        else if (card.webkitRequestFullscreen) card.webkitRequestFullscreen();
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      }
    });
  }
})();


// ============================================================
// [ORIENTATION OVERLAY DISMISS]
// ============================================================
(function() {
  var overlay = document.getElementById("orientationOverlay");
  var dismissBtn = document.getElementById("orientationDismiss");

  if (dismissBtn && overlay) {
    dismissBtn.addEventListener("click", function() {
      overlay.classList.add("dismissed");
    });
  }
})();