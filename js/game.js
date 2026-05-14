// File: game.js

// ============================================================
//  Point-and-Click Adventure Game Engine — Boilerplate
// ============================================================
 
// ── Canvas Setup ─────────────────────────────────────────────
 
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
 
// Logical resolution (design at this size, scale to fit the window)
const GAME_W = 2200;
const GAME_H = 1200;
 
canvas.width  = GAME_W;
canvas.height = GAME_H;
 
// Optional: scale canvas to fill the browser window while keeping aspect ratio
function resizeCanvas() {
  const scale = Math.min(window.innerWidth / GAME_W, window.innerHeight / GAME_H);
  canvas.style.width  = `${GAME_W * scale}px`;
  canvas.style.height = `${GAME_H * scale}px`;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ── Asset Loader ─────────────────────────────────────────────
 
const assets = {};
 
/**
 * Load a set of named images.
 * @param {Object} manifest  e.g. { bedroom: "img/bedroom.png", hero: "img/hero.png" }
 * @returns {Promise<void>}
 */
function loadAssets(manifest) {
  const promises = Object.entries(manifest).map(([key, src]) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        console.log("Loaded asset:", key, src);
        assets[key] = img;
        resolve();
      };

      img.onerror = () => {
        console.error("FAILED to load asset:", key, src);
        reject(new Error(`Failed to load asset: ${src}`));
      };
      img.onerror = () => reject(new Error(`Failed to load asset: ${src}`));
    })
  );
  return Promise.all(promises);
}

// ── Game State ────────────────────────────────────────────────
 
const state = {
  currentScene: null,     // key of the active scene
  flags: {},              // story flags:  flags.metGuard = true
  inventory: [],          // item keys the player is carrying
  dialogueLine: null,     // { text, ttl } — fades after ttl frames
};
 
/**
 * Set a story flag.
 */
function setFlag(key, value = true) {
  state.flags[key] = value;
}

/**
 * Clear a story flag.
 */
function clearFlag(key) {
  delete state.flags[key];
}

/**
 * Toggle a story flag.
 */
function toggleFlag(key) {
  state.flags[key] = !hasFlag(key);
}
 
/**
 * Check a story flag.
 */
function hasFlag(key) {
  return !!state.flags[key];
}
 
/**
 * Add an item to the player's inventory (no duplicates).
 */
function addItem(key) {
  if (!state.inventory.includes(key)) state.inventory.push(key);
}
 
/**
 * Remove an item from the player's inventory.
 */
function removeItem(key) {
  state.inventory = state.inventory.filter(k => k !== key);
}
 
/**
 * Show a line of dialogue for a number of frames.
 */
function say(text, frames = 1000) {
  state.dialogueLine = { text, ttl: frames };
}

function drawText(str) {
  // Draw text on top
    ctx.fillStyle = "white";
    ctx.font = "24px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(str, 120, 20);
}

// ── Scene Definition ──────────────────────────────────────────
 
/**
 * A Scene object describes one "slide" of the game.
 *
 * {
 *   background: "assetKey",          // key in assets{}
 *   music: "url/to/track.ogg",       // optional background audio
 *
 *   sprites: [                       // optional overlaid sprites
 *     {
 *       asset: "heroStanding",       // key in assets{}
 *       x: 300, y: 200,             // top-left position
 *       w: 80,  h: 120,             // drawn size (optional, defaults to natural size)
 *       visible: () => true,        // optional function — hide/show based on state
 *     }
 *   ],
 *
 *   hotspots: [                      // clickable regions
 *     {
 *       id: "door",
 *       label: "Wooden Door",       // shown on hover (optional)
 *       x: 500, y: 150, w: 80, h: 200,
 *       cursor: "pointer",          // CSS cursor (default: "pointer")
 *       visible: () => true,        // hide hotspot conditionally
 *       onClick: () => {            // what happens when clicked
 *         goTo("hallway");
 *       }
 *     }
 *   ],
 *
 *   onEnter: () => {},               // called when the scene is loaded
 *   onExit:  () => {},               // called when leaving the scene
 * }
 */

const scenes = {};
 
/**
 * Register one or more scenes.
 * @param {Object} defs  key → scene definition
 */
function defineScenes(defs) {
  Object.assign(scenes, defs);
}
// ── Scene Transitions ─────────────────────────────────────────
 
let transitioning = false;
 
/**
 * Navigate to a scene by key, with an optional fade transition.
 */
function goTo(sceneKey, fadeDuration = 100) {
  if (transitioning) return;
  if (!scenes[sceneKey]) {
    console.warn(`Scene "${sceneKey}" not found.`);
    return;
  }
 
  const prev = scenes[state.currentScene];
  if (prev?.onExit) prev.onExit();
 
  if (fadeDuration > 0) {
    fadeOut(fadeDuration, () => {
      state.currentScene = sceneKey;
      state.dialogueLine = null;
      const next = scenes[sceneKey];
      if (next?.onEnter) next.onEnter();
      loadSceneMusic(next);
      fadeIn(fadeDuration);
    });
  } else {
    state.currentScene = sceneKey;
    state.dialogueLine = null;
    const next = scenes[sceneKey];
    if (next?.onEnter) next.onEnter();
    loadSceneMusic(next);
  }
}
 
// ── Fade Overlay ──────────────────────────────────────────────
 
let fadeAlpha = 0;   // 0 = transparent, 1 = black
let fadeDir   = 0;   // -1 fade in, +1 fade out, 0 idle
let fadeSpeed = 0;
let fadeCallback = null;
 
function fadeOut(frames, onComplete) {
  transitioning = true;
  fadeAlpha = 0;
  fadeDir   = 1;
  fadeSpeed = 1 / frames;
  fadeCallback = onComplete;
}
 
function fadeIn(frames) {
  transitioning = false; 
  fadeAlpha = 1;
  fadeDir   = -1;
  fadeSpeed = 1 / frames;
  //fadeCallback = () => { transitioning = false; };
}
 
function updateFade() {
  if (fadeDir === 0) return;
  fadeAlpha = Math.max(0, Math.min(1, fadeAlpha + fadeDir * fadeSpeed));
  if ((fadeDir === 1 && fadeAlpha >= 1) || (fadeDir === -1 && fadeAlpha <= 0)) {
    fadeDir = 0;
    if (fadeCallback) { fadeCallback(); fadeCallback = null; }
  }
}
 
 
// ── Audio ─────────────────────────────────────────────────────
 
let bgmAudio = null;
 
function loadSceneMusic(scene) {
  if (!scene?.music) {
    if (bgmAudio) { bgmAudio.pause(); bgmAudio = null; }
    return;
  }
  if (bgmAudio?.src?.endsWith(scene.music)) return; // already playing
  if (bgmAudio) bgmAudio.pause();
  bgmAudio = new Audio(scene.music);
  bgmAudio.loop = true;
  bgmAudio.volume = 0.5;
  bgmAudio.play().catch(() => {}); // browser may block until user gesture
}
 
/**
 * Play a one-shot sound effect.
 */
let currentSfx = null;

function playSfx(src, volume = 1) {
  // Stop any currently playing SFX first
  if (currentSfx) {
    currentSfx.pause();
    currentSfx.currentTime = 0;
  }

  currentSfx = new Audio(src);
  currentSfx.volume = volume;

  currentSfx.play().catch(err => {
    console.error("Failed to play sound:", src, err);
  });
}

function stopSfx() {
  if (currentSfx) {
    currentSfx.pause();
    currentSfx.currentTime = 0;
    currentSfx = null;
  }
}
 
 
// ── Input ─────────────────────────────────────────────────────
 
const mouse = { x: 0, y: 0, hoveredHotspot: null };
 
canvas.addEventListener("mousemove", e => {
  const rect  = canvas.getBoundingClientRect();
  const scaleX = GAME_W / rect.width;
  const scaleY = GAME_H / rect.height;
  mouse.x = (e.clientX - rect.left) * scaleX;
  mouse.y = (e.clientY - rect.top)  * scaleY;
  updateHoveredHotspot();
});
 
canvas.addEventListener("click", () => {
  console.log("Transitioning: ", transitioning);
  if (transitioning) return;
  const h = mouse.hoveredHotspot;
  
  //debugging purposes
  console.log(`button pressed!
    mouse.x: ${mouse.x/GAME_W}
    mouse.y: ${mouse.y/GAME_H}`);
  
  if (h?.onClick) h.onClick();
});
 
function updateHoveredHotspot() {
  const scene = scenes[state.currentScene];
  if (!scene) { mouse.hoveredHotspot = null; return; }
  mouse.hoveredHotspot = (scene.hotspots ?? []).find(h =>
    (!h.visible || h.visible()) &&
    mouse.x >= h.x && mouse.x <= h.x + h.w &&
    mouse.y >= h.y && mouse.y <= h.y + h.h
  ) ?? null;
  canvas.style.cursor = mouse.hoveredHotspot?.cursor ?? "default";
}
 
 
// ── Render ────────────────────────────────────────────────────
 
function render() {
  ctx.clearRect(0, 0, GAME_W, GAME_H);
 
  const scene = scenes[state.currentScene];
  if (!scene) return;
 
  // Background
  const bg = assets[scene.background];
  if (bg) {
    const mode = scene.backgroundMode ?? "stretch";

    if (mode === "stretch") {
      ctx.drawImage(bg, 0, 0, GAME_W, GAME_H);

    } else if (mode === "fit") {
      // Letterbox/pillarbox — fits whole image, no cropping
      const scale = Math.min(GAME_W / bg.naturalWidth, GAME_H / bg.naturalHeight);
      const w = bg.naturalWidth * scale;
      const h = bg.naturalHeight * scale;
      const x = (GAME_W - w) / 2;
      const y = (GAME_H - h) / 2;
      ctx.fillStyle = "#000"; // letterbox colour
      ctx.fillRect(0, 0, GAME_W, GAME_H);
      ctx.drawImage(bg, x, y, w, h);

    } else if (mode === "fill") {
      // Zoom to fill — crops but no bars
      const scale = Math.max(GAME_W / bg.naturalWidth, GAME_H / bg.naturalHeight);
      const w = bg.naturalWidth * scale;
      const h = bg.naturalHeight * scale;
      const x = (GAME_W - w) / 2;
      const y = (GAME_H - h) / 2;
      ctx.drawImage(bg, x, y, w, h);

    } else if (mode === "scroll-x") {
      // Tall-and-narrow image — scrolls horizontally based on a state value
      const scale = GAME_H / bg.naturalHeight; // fit height exactly
      const w = bg.naturalWidth * scale;
      const offsetX = (state.scrollX ?? 0); // you control this
      ctx.drawImage(bg, offsetX, 0, w, GAME_H);
    }
  }
 
  // Sprites
  for (const sp of scene.sprites ?? []) {
    if (sp.visible && !sp.visible()) continue;
    const img = assets[sp.asset];
    if (!img) continue;
    const w = sp.w ?? img.naturalWidth;
    const h = sp.h ?? img.naturalHeight;

    ctx.drawImage(img, sp.x, sp.y, w, h);
  }
 
  // Hotspot debug outlines (remove in production)
  if (DEBUG_HOTSPOTS) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,0,0,0.5)";
    ctx.lineWidth = 1;
    for (const h of scene.hotspots ?? []) {
      if (h.visible && !h.visible()) continue;
      ctx.strokeRect(h.x, h.y, h.w, h.h);
    }
    ctx.restore();
  }
 
  // Hover label
  if (mouse.hoveredHotspot?.label) {
    drawHoverLabel(mouse.hoveredHotspot.label);
  }
 
  // Dialogue
  if (state.dialogueLine) {
    drawDialogue(state.dialogueLine.text);
  }
 
  // Inventory HUD
  drawInventory();
 
  // Fade overlay
  if (fadeAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = fadeAlpha;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, GAME_W, GAME_H);
    ctx.restore();
  }
}
 
function drawHoverLabel(text) {
  ctx.save();
  ctx.font = "16px sans-serif";
  const pad = 6;
  const tw  = ctx.measureText(text).width;
  let lx = mouse.x + 12;
  let ly = mouse.y - 10;
  if (lx + tw + pad * 2 > GAME_W) lx = mouse.x - tw - pad * 2 - 12;
  ctx.fillStyle = "rgba(0,0,0,0.65)";
  ctx.beginPath();
  ctx.roundRect(lx - pad, ly - 18, tw + pad * 2, 26, 4);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.fillText(text, lx, ly);
  ctx.restore();
}
 
function drawDialogue(text) {
  ctx.save();
  const boxH  = 80;
  const boxY  = GAME_H - boxH - 10;
  ctx.fillStyle = "rgba(0,0,0,0.72)";
  ctx.beginPath();
  ctx.roundRect(20, boxY, GAME_W - 40, boxH, 8);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "18px sans-serif";
  ctx.textBaseline = "middle";
  // Basic word-wrap
  wrapText(ctx, text, 36, boxY + boxH / 2, GAME_W - 72, 24);
  ctx.restore();
}
 
function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = text.split(" ");
  let line  = "";
  let lineY = y - lineH / 2;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, lineY);
      line  = word;
      lineY += lineH;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, lineY);
}
 
function drawInventory() {
  const slotSize = 40;
  const pad = 6;
  const startX = GAME_W - (state.inventory.length * (slotSize + pad)) - 10;
  state.inventory.forEach((key, i) => {
    const sx = startX + i * (slotSize + pad);
    const sy = 10;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.beginPath();
    ctx.roundRect(sx, sy, slotSize, slotSize, 6);
    ctx.fill();
    const img = assets[key];
    if (img) ctx.drawImage(img, sx + 2, sy + 2, slotSize - 4, slotSize - 4);
    ctx.restore();
  });
}
// ── Animation ─────────────────────────────────────────────────
function updateSprites() {
  const scene = scenes[state.currentScene];
  if (!scene) return;

  for (const sp of scene.sprites ?? []) {
    if (sp.visible && !sp.visible()) continue;

    // Simple movement
    if (sp.vx) sp.x += sp.vx;
    if (sp.vy) sp.y += sp.vy;

    // Optional: bounce back and forth
    if (sp.bounceX) {
      if (sp.x <= sp.minX || sp.x /*+ (sp.w ?? 0)*/ >= sp.maxX) {
        sp.vx *= -1;
      }
    }

    if (sp.bounceY) {
      if (sp.y <= sp.minY || sp.y + (sp.h ?? 0) >= sp.maxY) {
        sp.vy *= -1;
      }
    }

    // Optional: travel to destination. ONLY TRAVEL X THEN Y DIRECTION FOR NOW
    if (sp.travelX) {
      if (sp.x <= sp.minX || sp.x /*+ (sp.w ?? 0)*/ >= sp.maxX) {
        sp.vx *= 0;
        if(sp.minY > 0) sp.vy = -5;
        if(sp.maxY > 0) sp.vy = 5;
      }
    }

    // sp.vy happens when reached destination
    if (sp.travelY) {
      if (sp.y <= sp.minY || sp.y /*+ (sp.w ?? 0)*/ >= sp.maxY) {
        sp.vy *= 0;
        setFlag("spriteArrived");
      }
    }
  }
} 

// ── Game Loop ─────────────────────────────────────────────────
 
let DEBUG_HOTSPOTS = true; // set to true to see hotspot outlines
 
function tick() {
  // Advance dialogue timer
  if (state.dialogueLine) {
    state.dialogueLine.ttl--;
    if (state.dialogueLine.ttl <= 0) state.dialogueLine = null;
  }
  
  state.blinkTimer = (state.blinkTimer ?? 0) + 1;
  state.gameTimer = (state.gameTimer ?? 0) + 1;
  if(state.gameTimer % 120 === 0) {
    //do something every 120 ticks
  }

  //controls blinking for circle/arrow icons
  if(state.blinkTimer % 60 === 0) {
    state.flags.redCircleVisible = !state.flags.redCircleVisible;
    state.flags.arrowVisible = !state.flags.arrowVisible;
  }

  updateSprites();
  updateFade();
  render();
  requestAnimationFrame(tick);
}
 
 
// ── Bootstrap ─────────────────────────────────────────────────
 
/**
 * Start the game.
 *
 * @param {string}  firstScene  Key of the opening scene
 * @param {Object}  assetManifest  { key: "path/to/image.png", ... }
 */
async function startGame(firstScene, assetManifest = {}) {
  await loadAssets(assetManifest);
  state.currentScene = firstScene;
  const scene = scenes[firstScene];
  if (scene?.onEnter) scene.onEnter();
  loadSceneMusic(scene);
  console.log("GAME_H: ", GAME_H, "GAME_W: ", GAME_W);
  tick();
}
 
 
// ── Example Usage ─────────────────────────────────────────────
//
// 1. Add to your HTML:
//    <canvas id="gameCanvas"></canvas>
//    <script src="adventure-game.js"></script>
//
// 2. Define your scenes and start:
 
defineScenes({

  /***********************************************
   * 
   * World map (beginning)
   * 
   ***********************************************/

  world: {
    background: "worldBg",
    sprites: [
      {
        asset: "redCircle",
        x: GAME_W*0.78 - 50/2, y: GAME_H*0.43 - 50/2, w: 50, h: 50,
        visible: () => 
          !hasFlag("clickedOnHongKong") &&
          state.flags.redCircleVisible
      },
      {
        asset: "arrowRight",
        x: GAME_W*0.77 - 100, y: GAME_H*0.43 - 100/2, w: 100, h: 100,
        visible: () =>
          !hasFlag("clickedOnHongKong") &&
          state.flags.arrowVisible
      }
    ],
    hotspots: [
      {
        id: "cave",
        label: "Dark Cave",
        x: 100, y: 100, w: 128, h: 128,
        onClick: () => {
          if (hasFlag("hasLantern")) {
            goTo("caveInterior");
          } else {
            say("It's too dark to enter without a light source.");
          }
        }
      },
      {
        id: "hk",
        label: "Hong Kong",
        x: GAME_W*0.78 - 30/2, y: GAME_H*0.43 - 30/2, w: 30, h: 30,
        visible: () => !hasFlag("clickedOnHongKong"),
        onClick: () => {
          say("red Corcl;e: \"you clicked on the red cirlce!!!! :OOO\"");
          clearFlag("redCircleVisible");
          setFlag("clickedOnHongKong");
          goTo("hk");
        }

      }
    ],
    onEnter: () => console.log("Entered world view"),
  },
 
  /***********************************************
   * 
   * Hong kong, facing the sea and the notable buildings
   * 
   ***********************************************/

  hk: {
    background: "hkBg",
    //music: "assets/soundtrack/sk-beautifulgirls.mp3",
    hotspots: [
      {
        id: "exit",
        label: "Back to Hong Kong",
        x: 0, y: 0, w: 100, h: GAME_H,
        onClick: () => {
          clearFlag("clickedOnHongKong");
          goTo("world");
        }
      },
      {
        id: "kennedy",
        label: "To Kennedy town!!",
        x: GAME_W-100, y: GAME_H*0.25, w: 100, h: GAME_H*0.5,
        onClick: () => {
          goTo("kt");
        }
      }
    ],
    onEnter: () => {
      say("Welcome to Hong Kong!!");
      }
  },

  /***********************************************
   * 
   * Kennedy town
   * 
   ***********************************************/

  kt: {
    background: "ktBg",
    backgroundMode: "fit", // "stretch" | "fit" | "fill" | "scroll-x"
    hotspots: [
      {
        id: "apartment",
        label: "Rajanala Household!!",
        x: GAME_H*0.59, y: GAME_W*0.13, w: 100, h: 100,
        onClick: () => {
          goTo("apt");
        }
      }
    ]
  },

  /***********************************************
   * 
   * In the empty apartment
   * 
   ***********************************************/

  apt: {
    background: "aptBg",
    sprites: [
      {
        asset: "arrowRight",
        x: GAME_W*0.95 - 100/2, y: GAME_H*0.67 - 100/2, w:100, h:100,
        visible: () => 
          !hasFlag("bindusRoom") && 
          state.flags.arrowVisible,
        onClick: () => {
          say("Let's see what's in Bindu's room!!");
        }

      }
    ],
    hotspots: [
      {
        id: "bindusRoom",
        label: "Go to room... whose room tho????",
        x: GAME_W*0.96 - 100/2, y: GAME_H*0.67 - 100/2, w:100, h:100,
        onClick: () => {
          setFlag("bindusRoom");
          goTo("bRoomNoSprite");
        }
      }
    ]
  },

  /***********************************************
   * 
   * Bindu's room, no sprite
   * 
   ***********************************************/

  bRoomNoSprite: {
    background: "brBg",
    hotspots: [
      {
        id: "binduWokeUp",
        label: "WAKE UP BINDU YOU SLEEPYHEAD!!",
        x: 0, y: 0, w: GAME_W, h: GAME_H,
        onClick: () => {
          setFlag("binduAwoken");
          goTo("bRoomStationaryScene", 0);
        }
      }
    ]
  },

  /***********************************************
   * 
   * Stationary Bindu sprite in room
   * 
   ***********************************************/

  bRoomStationaryScene: {
    background: "brBg",
    sprites: [
      {
        asset: "binduSprite",
        x: GAME_W*0.33 - 500/2, y: GAME_H*0.78 - 500/2, w: 500, h: 500,
        visible: () => hasFlag("binduAwoken")
      }
    ],
    hotspots: [
      {
        id: "computer",
        label: "Check what's on the computer!!",
        x: GAME_W*0.78 - 120/2, y: GAME_H*0.55 - 100/2, w: 120, h: 100,
        onClick: () => {
          goTo("bRoomMoveToComputerScene", 0);
        }
      },
      {
        id: "window",
        label: "Check what's at the window!!",
        x: GAME_W*0.43 - 500/2, y: GAME_H*0.45 - 300/2, w: 500, h: 300,
        onClick: () => {
          goTo("bRoomMoveToWindowScene", 0);
        }
      }
    ],
    onEnter: () => say("HEYYYYYY, it's-a meeee, BINDUUUU. Don't wake me up from my sleepy time again or else >:("),
  },
  
  /**********************************************
   * 
   * Bindu moving to the computer
   * 
   **********************************************/
  bRoomMoveToComputerScene: {
    background: "brBg",
    sprites: [
      {
        asset: "binduSprite",
        x: GAME_W*0.33 - 500/2, y: GAME_H*0.78 - 500/2, w: 500, h: 500,
        vx:5,
        maxX: GAME_W*0.69 - 500/2,
        minY: GAME_H*0.6 - 500/2,
        travelX: true,
        travelY: true,
      }
    ],
    onEnter: () => {
      say("Let's see what's on the computer!!");
      goTo("yt", 400);
    }
  },

  /**********************************************
   * 
   * Bindu moving to the window
   * 
   **********************************************/
  bRoomMoveToWindowScene: {
    background: "brBg",
    sprites: [
      {
        asset: "binduSprite",
        x: GAME_W*0.33 - 500/2, y: GAME_H*0.78 - 500/2, w: 500, h: 500,
        vx:5,
        maxX: GAME_W*0.49 - 500/2,
        minY: GAME_H*0.59 - 500/2,
        travelX: true,
        travelY: true,
      }
    ],
    onEnter: () => {
      say("Let's see what's at the window!!");
      goTo("brWindow", 400);
    }
  },

  /**********************************************
   * 
   * Bindu on Youtube
   * 
   **********************************************/
  yt: {
    background: "ytBg",
    sprites: [
      {
        asset: "profilePic",
        x: GAME_W*0.84 - 125/2, y: GAME_H*0.31 - 125/2, w: 125, h: 125,
      },
      {
        asset: "nameText",
        x: GAME_W*0.92 - 200/2, y: GAME_H*0.28 - 25/2, w: 200, h: 35,
      },
      {
        asset: "odThumbnail",
        x: GAME_W*0.45 - 1000/2, y: GAME_H*0.39 - 200/2, w: 1000, h: 200,
      },
      {
        asset: "jbThumbnail",
        x: GAME_W*0.45 - 1000/2, y: GAME_H*0.62 - 200/2, w: 1000, h: 200,
      },
      {
        asset: "bgThumbnail",
        x: GAME_W*0.81 - 1000/2, y: GAME_H*0.62 - 200/2, w: 1000, h: 200,
      },
      {
        asset: "arrowLeft",
        x: GAME_W*0.1 - 100/2, y: GAME_H*0.9 - 100/2, w: 100, h: 100,
        visible: () =>   state.flags.arrowVisible

      }
    ],

    hotspots: [
      {
        id: "oneDirection",
        label: "Play One Direction",
        x: GAME_W*0.45 - 1000/2, y: GAME_H*0.39 - 200/2, w: 1000, h: 200,
        onClick: () => {
          playSfx("assets/soundtrack/od-whatmakesyoubeautiful.mp3", 0.5);
        }
      },
      {
        id: "profilePic",
        label: "Just the cutest girl on the planet ;)",
        x: GAME_W*0.84 - 125/2, y: GAME_H*0.31 - 125/2, w: 125, h: 125,
      },
      {
        id: "oneJBeebs",
        label: "Play Some JAY BEEBS",
        x: GAME_W*0.45 - 1000/2, y: GAME_H*0.62 - 200/2, w: 700, h: 200,
        onClick: () => {
          playSfx("assets/soundtrack/jb-baby.mp3", 0.5);
        }        
      },
      {
        id: "seanKINGSTON",
        label: "Play Some Beauitful girls!!!! :OO",
        x: GAME_W*0.81 - 1000/2, y: GAME_H*0.62 - 200/2, w: 1000, h: 200,
        onClick: () => {
          playSfx("assets/soundtrack/sk-beautifulgirls.mp3", 0.5);
        }        
      },
      {
        id: "exit",
        label: "Go back to room",
        x: GAME_W*0.1 - 100/2, y: GAME_H*0.9 - 100/2, w: 100, h: 100,
        onClick: () => {
          goTo("bRoomStationaryScene");
        }
      }
    ],

    onExit: () => {
      stopSfx();
    }

  },
  /**********************************************
   * 
   * Bindu at the window
   * 
   **********************************************/
  brWindow: {
    background: "buildingsBg",
    sprites: [
      asset: ""
    ]
  },

});
 
startGame("yt", {
  //Backgrounds
  worldBg:      "assets/images/world.png",
  hkBg:         "assets/images/pixel-hongkong.png",
  ktBg:         "assets/images/kennedytown.png",
  aptBg:        "assets/images/apartment.png",
  brBg:         "assets/images/bindus-room.jpeg",
  ytBg:         "assets/images/youtube.png",
  buildingsBg:  "assets/images/buildings-hk.png",


  //Indicators
  redCircle:    "assets/images/indicators/red_circle.png",
  arrowRight:   "assets/images/indicators/arrowright.png",
  arrowLeft:    "assets/images/indicators/arrowleft.png",


  //People sprites
  binduSprite:  "assets/images/sprites/girly.png",
  marthaSprite: "assets/images/sprites/martha.png",
  hoshaSprite:  "assets/images/sprites/hosha.png",
  rahulSprite:  "assets/images/sprites/rahul.png",
  meenaSprite:  "assets/images/sprites/meena.png",
  momSprite:    "assets/images/sprites/mom.png",
  dadSprite:    "assets/images/sprites/dad.png",

  //Misc images
  profilePic:   "assets/images/hottie.png",
  nameText:     "assets/images/bindutext.png",
  odThumbnail:  "assets/images/ydkyb-thumbnail.png",
  jbThumbnail:  "assets/images/jb-thumbnail.png",
  bgThumbnail:  "assets/images/bg-thumbnail.png",
});