'use strict';

// ─── Canvas & Context ─────────────────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// ─── Constants ────────────────────────────────────────────────────────────────
const FRAME_W = 32;          // source pixels per frame
const FRAME_H = 32;
const FRAME_COUNT = 6;
const SPRITE_SCALE = 2;      // display scale
const SW = FRAME_W * SPRITE_SCALE;   // 64px on canvas
const SH = FRAME_H * SPRITE_SCALE;   // 64px on canvas

// Background image dimensions — used to anchor ground to the actual sidewalk
// regardless of viewport size (background-size: cover; background-position: center top)
const BG_W = 1536, BG_H = 1024;

function bgCanvasScale() {
  // Returns the CSS scale factor applied to background.png by 'cover'
  return (canvas.width / canvas.height > BG_W / BG_H)
    ? canvas.width  / BG_W   // wider viewport: scale to fill width
    : canvas.height / BG_H;  // taller viewport: scale to fill height
}

// Sidewalk path with slight perspective arch (center appears marginally higher).
// Ground level is anchored to image y ≈ 76%, which is where the Goldwin Smith
// sidewalk sits — this keeps robots on the path at every viewport aspect ratio.
function getGroundY(x) {
  const scale = bgCanvasScale();
  const baseY  = BG_H * 0.760 * scale;          // sidewalk in image coords
  const archPx = BG_H * 0.0075 * scale;         // arch height, proportional to image
  const t = (x / canvas.width - 0.5) * 2;       // -1 … 1
  return baseY - archPx * (1 - t * t);
}

// ─── Sprite Loading ───────────────────────────────────────────────────────────
const SPRITES = {};
let loadedCount = 0;
const SPRITE_NAMES = [
  'Dude_Monster_Walk_6',
  'Owlet_Monster_Walk_6',
  'Pink_Monster_Walk_6',
];

for (const name of SPRITE_NAMES) {
  const img = new Image();
  img.onload = () => { loadedCount++; };
  img.src = name + '.png';
  SPRITES[name] = img;
}

function spritesReady() {
  return loadedCount === SPRITE_NAMES.length;
}

// ─── Robot Definitions ────────────────────────────────────────────────────────
const ROBOT_DEFS = [
  {
    sprite: 'Dude_Monster_Walk_6',
    hue: 0,
    speed: 0.255,
    html: `In high school, I loved policy debate, and won two national championships while being ranked #2 in the United States.`,
  },
  {
    sprite: 'Owlet_Monster_Walk_6',
    hue: 0,
    speed: 0.33,
    html: `I'm a Cornell CS student interested in large-scale ML, stochastic systems, financial technology, and AI safety.`,
  },
  {
    sprite: 'Pink_Monster_Walk_6',
    hue: 0,
    speed: 0.216,
    html: `Check out my <a href="https://linkedin.com/in/pranavbalakri" target="_blank">LinkedIn!</a>`,
  },
  {
    sprite: 'Dude_Monster_Walk_6',
    hue: 130,    // green-shifted Dude
    speed: 0.384,
    html: `Email me at<br><a href="mailto:pb629@cornell.edu">pb629@cornell.edu</a>`,
  },
  {
    sprite: 'Pink_Monster_Walk_6',
    hue: 195,    // blue-shifted Pink
    speed: 0.3,
    html: `Check out my projects on <a href="https://github.com/pranavbalakri" target="_blank">GitHub,</a> or by clicking this monster!`,
  },
  {
    sprite: 'Pink_Monster_Walk_6',
    hue: 300,
    speed: 0.29,
    html: `Click to see my experience!`,
  },
];

// ─── Draw Robot ───────────────────────────────────────────────────────────────
function drawRobot(bx, by, spriteImg, frameIndex, flip, hue, invert) {
  if (!spriteImg || !spriteImg.complete || spriteImg.naturalWidth === 0) return;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const filters = [];
  if (invert) filters.push('invert(1)');
  if (hue)    filters.push(`hue-rotate(${hue}deg)`);
  if (filters.length) ctx.filter = filters.join(' ');

  if (flip) {
    ctx.translate(bx + SW, 0);
    ctx.scale(-1, 1);
    bx = 0;
  }

  ctx.drawImage(
    spriteImg,
    frameIndex * FRAME_W, 0,
    FRAME_W, FRAME_H,
    bx, by,
    SW, SH
  );

  ctx.restore();
}

// ─── Robot Class ─────────────────────────────────────────────────────────────
class Robot {
  constructor(def, index) {
    this.def = def;
    this.index = index;
    this.frame = index % FRAME_COUNT;
    this.frameTick = 0;
    this.frameDuration = Math.round((7 + index * 1.5) * (5 / 6));
    this.speed = def.speed;
    this.dir = index % 2 === 0 ? 1 : -1;
    this.paused = false;
    this.pauseTick = 0;
    this.hovered = false;
    this.bubbleHovered = false;
    this._hideTimeout = null;
    this.bubbleEl = null;
    this.x = 0;
    this.y = 0;
  }

  place() {
    const slot = canvas.width / ROBOT_DEFS.length;
    this.x = slot * this.index + slot * 0.1 + Math.random() * slot * 0.6;
    this.x = Math.max(20, Math.min(canvas.width - SW - 20, this.x));
    this.y = getGroundY(this.x + SW / 2) - SH;
  }

  update() {
    if (this.hovered || this.bubbleHovered) return;

    if (this.paused) {
      this.pauseTick--;
      if (this.pauseTick <= 0) this.paused = false;
      return;
    }

    this.x += this.speed * this.dir;
    this.y = getGroundY(this.x + SW / 2) - SH;

    if (this.x < 20) {
      this.dir = 1;
      this.x = 20;
    } else if (this.x > canvas.width - SW - 20) {
      this.dir = -1;
      this.x = canvas.width - SW - 20;
    }

    if (Math.random() < 0.002) {
      this.paused = true;
      this.pauseTick = 30 + Math.floor(Math.random() * 100);
    }

    this.frameTick++;
    if (this.frameTick >= this.frameDuration) {
      this.frameTick = 0;
      this.frame = (this.frame + 1) % FRAME_COUNT;
    }
  }

  draw() {
    const frameIndex = this.hovered || this.bubbleHovered || this.paused ? 0 : this.frame;
    drawRobot(
      this.x, this.y,
      SPRITES[this.def.sprite],
      frameIndex,
      this.dir < 0,
      this.def.hue,
      this.def.invert
    );
  }

  contains(mx, my) {
    // Tighten hit box a bit — sprites have some transparent padding
    const padX = SW * 0.15;
    const padY = SH * 0.1;
    return (
      mx >= this.x + padX &&
      mx <= this.x + SW - padX &&
      my >= this.y + padY &&
      my <= this.y + SH
    );
  }

  bubbleAnchor() {
    return {
      x: this.x + SW / 2,
      y: this.y + SH * 0.05,
    };
  }
}

// ─── Bubble Management ────────────────────────────────────────────────────────
const bubblesContainer = document.getElementById('bubbles');

function showBubble(robot) {
  if (robot.bubbleEl) return;
  clearTimeout(robot._hideTimeout);
  const el = document.createElement('div');
  el.className = 'speech-bubble';
  el.innerHTML = robot.def.html;
  const anchor = robot.bubbleAnchor();
  el.style.left = anchor.x + 'px';
  el.style.top = '0px';
  bubblesContainer.appendChild(el);
  const h = el.offsetHeight;
  el.style.top = (anchor.y - h - 16) + 'px';
  el.addEventListener('mouseenter', () => {
    robot.bubbleHovered = true;
    clearTimeout(robot._hideTimeout);
  });
  el.addEventListener('mouseleave', () => {
    robot.bubbleHovered = false;
    if (!robot.hovered) hideBubble(robot);
  });
  robot.bubbleEl = el;
}

function hideBubble(robot) {
  clearTimeout(robot._hideTimeout);
  robot._hideTimeout = null;
  if (robot.bubbleEl) {
    robot.bubbleEl.remove();
    robot.bubbleEl = null;
  }
}

function scheduleBubbleHide(robot) {
  clearTimeout(robot._hideTimeout);
  robot._hideTimeout = setTimeout(() => {
    if (!robot.bubbleHovered) hideBubble(robot);
  }, 120);
}

// ─── Statue Bubble ────────────────────────────────────────────────────────────
let statueHovered     = false;
let statueBubbleEl    = null;
let statueBubbleTimer = null;

function showStatueBubble() {
  if (statueBubbleEl) return;
  clearTimeout(statueBubbleTimer);
  const { cx, topY } = getStatueBounds();
  const el = document.createElement('div');
  el.className = 'speech-bubble';
  el.textContent = 'Click to transition to blog!';
  el.style.left = cx + 'px';
  el.style.top  = '0px';
  bubblesContainer.appendChild(el);
  const h = el.offsetHeight;
  el.style.top = (topY - h - 16) + 'px';
  statueBubbleEl = el;
}

function hideStatueBubble() {
  clearTimeout(statueBubbleTimer);
  if (statueBubbleEl) { statueBubbleEl.remove(); statueBubbleEl = null; }
}

function scheduleStatueBubbleHide() {
  clearTimeout(statueBubbleTimer);
  statueBubbleTimer = setTimeout(hideStatueBubble, 120);
}

// ─── Particles (fireflies) ────────────────────────────────────────────────────
const NUM_PARTICLES = 22;
const particles = [];

function initParticles() {
  particles.length = 0;
  const groundY = getGroundY(canvas.width / 2);
  for (let i = 0; i < NUM_PARTICLES; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: groundY - Math.random() * canvas.height * 0.55,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.15 - Math.random() * 0.25,
      phase: Math.random() * Math.PI * 2,
      phaseSpeed: 0.03 + Math.random() * 0.04,
      size: 2 + Math.floor(Math.random() * 2),
      baseAlpha: 0.5 + Math.random() * 0.4,
      color: Math.random() < 0.5 ? '#ffe080' : '#c0ff90',
    });
  }
}

function updateParticles() {
  const groundY = getGroundY(canvas.width / 2);
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.phase += p.phaseSpeed;

    if (p.x < -10) p.x = canvas.width + 10;
    if (p.x > canvas.width + 10) p.x = -10;

    if (p.y < canvas.height * 0.05) {
      p.y = groundY - Math.random() * canvas.height * 0.3;
      p.x = Math.random() * canvas.width;
    }
  }
}

function drawParticles() {
  for (const p of particles) {
    const alpha = p.baseAlpha * (0.5 + 0.5 * Math.sin(p.phase));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 6;
    ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    ctx.restore();
  }
}


// ─── Robots ───────────────────────────────────────────────────────────────────
let robots = [];

function initRobots() {
  robots.forEach(r => hideBubble(r));
  robots = ROBOT_DEFS.map((def, i) => {
    const r = new Robot(def, i);
    r.place();
    return r;
  });
}

// ─── Statue Hit-Test ──────────────────────────────────────────────────────────
// Single source of truth for hitbox geometry — edit values here only.
function getStatueBounds() {
  const cx      = canvas.width / 2;
  const groundY = canvas.height * 0.73;
  const halfW   = canvas.width  * 0.02;
  const topY    = groundY - canvas.height * 0.10;
  return { cx, groundY, halfW, topY };
}

function isOverStatue(mx, my) {
  const { cx, groundY, halfW, topY } = getStatueBounds();
  return mx >= cx - halfW && mx <= cx + halfW && my >= topY && my <= groundY;
}

// ─── Mouse Handling ───────────────────────────────────────────────────────────
function getCanvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

canvas.addEventListener('mousemove', e => {
  const { x, y } = getCanvasPos(e);
  let anyHit = false;
  for (const robot of robots) {
    const hit = robot.contains(x, y);
    if (hit && !robot.hovered) {
      robot.hovered = true;
      showBubble(robot);
    } else if (!hit && robot.hovered) {
      robot.hovered = false;
      scheduleBubbleHide(robot);
    }
    if (hit) anyHit = true;
  }
  const statueHit = isOverStatue(x, y);
  if (statueHit && !statueHovered) {
    statueHovered = true;
    showStatueBubble();
  } else if (!statueHit && statueHovered) {
    statueHovered = false;
    scheduleStatueBubbleHide();
  }
  canvas.style.cursor = (anyHit || statueHit) ? 'pointer' : 'default';
});

canvas.addEventListener('mouseleave', () => {
  for (const robot of robots) {
    if (robot.hovered) {
      robot.hovered = false;
      scheduleBubbleHide(robot);
    }
  }
  if (statueHovered) {
    statueHovered = false;
    scheduleStatueBubbleHide();
  }
  canvas.style.cursor = 'default';
});

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const { x, y } = getCanvasPos(e);
  for (const robot of robots) {
    if (robot.contains(x, y)) {
      if (robot.hovered) {
        robot.hovered = false;
        hideBubble(robot);
      } else {
        for (const r of robots) { r.hovered = false; hideBubble(r); }
        robot.hovered = true;
        showBubble(robot);
      }
    }
  }
}, { passive: false });

function updateBubblePositions() {
  for (const robot of robots) {
    if (robot.bubbleEl) {
      const anchor = robot.bubbleAnchor();
      robot.bubbleEl.style.left = anchor.x + 'px';
      const h = robot.bubbleEl.offsetHeight;
      robot.bubbleEl.style.top = (anchor.y - h - 16) + 'px';
    }
  }
  if (statueBubbleEl) {
    const { cx, topY } = getStatueBounds();
    statueBubbleEl.style.left = cx + 'px';
    const h = statueBubbleEl.offsetHeight;
    statueBubbleEl.style.top = (topY - h - 16) + 'px';
  }
}

// ─── Resize ───────────────────────────────────────────────────────────────────
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.imageSmoothingEnabled = false;
  initParticles();
  initRobots();
}

window.addEventListener('resize', resize);

// ─── Game Loop ────────────────────────────────────────────────────────────────
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  updateParticles();
  drawParticles();

  for (const robot of robots) {
    robot.update();
    robot.draw();
  }

  updateBubblePositions();

  requestAnimationFrame(loop);
}

// ─── Inventory ────────────────────────────────────────────────────────────────
const inventoryOverlay = document.getElementById('inventory-overlay');
const inventoryPanel   = document.getElementById('inventory-panel');

function openInventory() {
  for (const r of robots) {
    r.hovered = false;
    r.bubbleHovered = false;
    hideBubble(r);
  }
  inventoryOverlay.classList.remove('hidden');
}

function closeInventory() {
  inventoryOverlay.classList.add('hidden');
}

inventoryOverlay.addEventListener('click', e => {
  if (e.target === inventoryOverlay) closeInventory();
});

// ─── Experience ───────────────────────────────────────────────────────────────
const experienceOverlay = document.getElementById('experience-overlay');

function openExperience() {
  for (const r of robots) {
    r.hovered = false;
    r.bubbleHovered = false;
    hideBubble(r);
  }
  experienceOverlay.classList.remove('hidden');
}

function closeExperience() {
  experienceOverlay.classList.add('hidden');
}

experienceOverlay.addEventListener('click', e => {
  if (e.target === experienceOverlay) closeExperience();
});

// ESC → close either overlay
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeInventory(); closeExperience(); }
});

// Click on robots by index; statue click triggers the vortex transition.
canvas.addEventListener('click', e => {
  const { x, y } = getCanvasPos(e);

  // Statue takes priority — robot hitboxes won't overlap the center column
  // in normal gameplay, but return early just in case.
  if (isOverStatue(x, y)) {
    triggerVortexTransition();
    return;
  }

  for (const robot of robots) {
    if (robot.index === 4 && robot.contains(x, y)) openInventory();
    if (robot.index === 5 && robot.contains(x, y)) openExperience();
  }
});

// ─── Init ─────────────────────────────────────────────────────────────────────
resize();
loop();

// ─── Vortex Transition ────────────────────────────────────────────────────────
// Animation constants — mirror the framer-motion reference implementation.
const VORTEX_DURATION_MS = 2400;
const VORTEX_EASE        = 'cubic-bezier(0.18, 1, 0.22, 1)';

let vortexActive = false;

// Capture the current viewport to a data URL using html2canvas (loaded via CDN).
async function captureViewport() {
  try {
    const c = await html2canvas(document.body, {
      useCORS:       true,
      backgroundColor: '#000',
      logging:       false,
      scale:         1,
      x:             0,
      y:             window.scrollY,
      width:         window.innerWidth,
      height:        window.innerHeight,
      scrollX:       0,
      scrollY:       -window.scrollY,
      windowWidth:   document.documentElement.clientWidth,
      windowHeight:  window.innerHeight,
      removeContainer: true,
    });
    return c.toDataURL('image/png');
  } catch (err) {
    console.error('[vortex] captureViewport:', err);
    return null;
  }
}

// Spawn 20 debris particles arranged in a ring and animate each one spiralling
// inward — equivalent to the VortexScreen particle system in the reference code.
function spawnParticles(container) {
  container.innerHTML = '';
  const COUNT = 20;
  for (let i = 0; i < COUNT; i++) {
    const angle = (i / COUNT) * Math.PI * 2;
    const dist  = 140 + (i % 5) * 34;
    const ox    = Math.cos(angle) * dist;
    const oy    = Math.sin(angle) * dist;
    const spin  = i % 2 === 0 ? 160 : -160;
    const size  = i % 3 === 0 ? 10 : 7;
    const delay = i * 30; // ms stagger

    const el = document.createElement('span');
    el.style.cssText = [
      'position:absolute',
      `left:calc(50% - ${size / 2}px)`,
      `top:calc(50% - ${size / 2}px)`,
      `width:${size}px`,
      `height:${size}px`,
      'border-radius:50%',
      'background:rgba(147,210,255,0.8)',
      'box-shadow:0 0 8px rgba(147,210,255,0.6)',
    ].join(';');
    container.appendChild(el);

    el.animate(
      [
        { opacity: 0,    transform: `translate(${ox}px,${oy}px) scale(.75) rotate(0deg)` },
        { opacity: 0.9,  transform: `translate(${ox}px,${oy}px) scale(1) rotate(${spin * .3}deg)`, offset: 0.20 },
        { opacity: 0.34, transform: `translate(${ox * .38}px,${oy * .26}px) scale(1) rotate(${spin * .6}deg)`, offset: 0.60 },
        { opacity: 0,    transform: `translate(0,0) scale(.24) rotate(${spin}deg)` },
      ],
      { duration: VORTEX_DURATION_MS, delay, easing: VORTEX_EASE, fill: 'forwards' }
    );
  }
}

// Full transition: capture → overlay → vortex animation → new page.
async function triggerVortexTransition() {
  if (vortexActive) return;
  vortexActive = true;

  // 1. Snapshot before showing anything
  const imgUrl = await captureViewport();

  const overlay    = document.getElementById('vortex-overlay');
  const snapshot   = document.getElementById('vortex-snapshot');
  const ringOuter  = document.getElementById('vortex-ring-outer');
  const ringBorder = document.getElementById('vortex-ring-border');
  const particles  = document.getElementById('vortex-particles');
  const gridEl     = document.getElementById('vortex-grid');
  const darkEl     = document.getElementById('vortex-dark');
  const captionEl  = document.getElementById('vortex-caption');

  // 2. Swap pages immediately so the new page is visible behind the overlay
  //    while the vortex clip-path shrinks.
  document.getElementById('scene').style.display = 'none';
  document.getElementById('new-page').style.display = 'block';

  // 3. Load snapshot into background layer
  snapshot.style.backgroundImage = imgUrl ? `url(${imgUrl})` : 'none';

  // 4. Show overlay at opacity 0, then fade it in quickly
  overlay.style.display = 'block';
  overlay.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: 220,
    easing: 'linear',
    fill: 'forwards',
  });

  // 4. Snapshot layer: spin + clip-path collapse (mirrors HomeShell snapshot animation)
  if (imgUrl) {
    snapshot.animate(
      [
        { offset: 0,    opacity: 1,    transform: 'rotate(0deg)  scale(1)',    clipPath: 'circle(165% at 50% 50%)', filter: 'brightness(1.02) saturate(1.02) contrast(1.02) blur(0px)'   },
        { offset: 0.58, opacity: 1,    transform: 'rotate(7deg)  scale(1.05)', clipPath: 'circle(118% at 50% 50%)', filter: 'brightness(1.08) saturate(0.94) contrast(1.08) blur(0.8px)' },
        { offset: 0.86, opacity: 0.86, transform: 'rotate(26deg) scale(1.12)', clipPath: 'circle(46%  at 50% 50%)', filter: 'brightness(1.16) saturate(0.72) contrast(1.16) blur(2.2px)' },
        { offset: 1,    opacity: 0.22, transform: 'rotate(92deg) scale(1.32)', clipPath: 'circle(2%   at 50% 50%)', filter: 'brightness(1.24) saturate(0.42) contrast(1.24) blur(4.8px)' },
      ],
      { duration: VORTEX_DURATION_MS, easing: 'ease-in-out', fill: 'forwards' }
    );
  }

  // 5. Glow ring: expand then implode
  ringOuter.animate(
    [
      { transform: 'translate(-50%,-50%) scale(.2)',   opacity: 0    },
      { transform: 'translate(-50%,-50%) scale(1.16)', opacity: 0.98, offset: 0.5 },
      { transform: 'translate(-50%,-50%) scale(.26)',  opacity: 0    },
    ],
    { duration: VORTEX_DURATION_MS, easing: VORTEX_EASE, fill: 'forwards' }
  );

  // 6. Border ring: same expand/implode pattern
  ringBorder.animate(
    [
      { transform: 'translate(-50%,-50%) scale(.35)',  opacity: 0    },
      { transform: 'translate(-50%,-50%) scale(1.34)', opacity: 0.84, offset: 0.5 },
      { transform: 'translate(-50%,-50%) scale(.08)',  opacity: 0    },
    ],
    { duration: VORTEX_DURATION_MS, easing: VORTEX_EASE, fill: 'forwards' }
  );

  // 7. Debris particles spiralling to center
  spawnParticles(particles);

  // 8. Dot-grid overlay: flash then vanish
  gridEl.animate(
    [
      { opacity: 0.06 },
      { opacity: 0.22, offset: 0.56 },
      { opacity: 0.08, offset: 0.86 },
      { opacity: 0    },
    ],
    { duration: VORTEX_DURATION_MS, easing: 'ease-in-out', fill: 'forwards' }
  );

  // 9. Dark radial vignette: slowly builds
  darkEl.animate(
    [
      { opacity: 0    },
      { opacity: 0.10, offset: 0.56 },
      { opacity: 0.18, offset: 0.86 },
      { opacity: 0.24 },
    ],
    { duration: VORTEX_DURATION_MS, easing: 'ease-in-out', fill: 'forwards' }
  );

  // 10. Caption: fade in then fade out
  captionEl.animate(
    [
      { opacity: 0    },
      { opacity: 0.7,  offset: 0.30 },
      { opacity: 0.08 },
    ],
    { duration: VORTEX_DURATION_MS, easing: 'ease-in-out', fill: 'forwards' }
  );

  // 11. After transition completes, dismiss the overlay — new page is already visible.
  setTimeout(() => {
    overlay.style.display = 'none';
    history.pushState({ page: 'blog' }, '', '/blog');
    vortexActive = false;
  }, VORTEX_DURATION_MS);
}

// ─── Blog ↔ Home navigation ───────────────────────────────────────────────────
function showHome() {
  document.getElementById('new-page').style.display = 'none';
  document.getElementById('scene').style.display = '';
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function showBlog() {
  document.getElementById('scene').style.display = 'none';
  document.getElementById('new-page').style.display = 'block';
}

document.getElementById('back-btn').addEventListener('click', () => {
  history.pushState({ page: 'home' }, '', '/');
  showHome();
});

// Keep the browser back/forward buttons in sync.
window.addEventListener('popstate', e => {
  if (e.state && e.state.page === 'blog') {
    showBlog();
  } else {
    showHome();
  }
});

// Handle direct navigation to /blog (restored from 404.html redirect).
if (window.location.pathname === '/blog') {
  showBlog();
}

// ─── Blog Articles ────────────────────────────────────────────────────────────
const ARTICLES = [
  {
    id: 1,
    title: 'Coming soon!',
    date: 'March 2026',
    author: 'Pranav Balakrishnan',
    readTime: '0 min read',
    excerpt: 'I will be posting some thoughts on here in the future.',
    body: `<p>I will be posting some thoughts on here in the future.</p>`,
  },
];

// Render the article listing inside #article-list
function renderArticleListing() {
  const container = document.getElementById('article-list');
  container.innerHTML = '';
  ARTICLES.forEach(article => {
    const el = document.createElement('div');
    el.className = 'article-item';
    el.innerHTML = `
      <div class="article-item-title">${article.title}</div>
      <div class="article-item-meta">${[article.author, article.date].filter(Boolean).join(' · ')}</div>
      <div class="article-item-excerpt">${article.excerpt}</div>
    `;
    el.addEventListener('click', () => openArticle(article.id));
    container.appendChild(el);
  });
}

function openArticle(id) {
  const article = ARTICLES.find(a => a.id === id);
  if (!article) return;
  document.getElementById('article-title').textContent = article.title;
  const metaParts = [article.author, article.date].filter(Boolean);
  document.getElementById('article-meta').textContent  = metaParts.join(' · ');
  document.getElementById('article-body').innerHTML    = article.body;
  document.getElementById('blog-listing').style.display  = 'none';
  document.getElementById('article-view').style.display  = 'block';
  document.getElementById('new-page').scrollTop = 0;
}

function closeArticle() {
  document.getElementById('article-view').style.display  = 'none';
  document.getElementById('blog-listing').style.display  = 'block';
  document.getElementById('new-page').scrollTop = 0;
}

document.getElementById('article-back').addEventListener('click', closeArticle);

// Reset blog to listing view whenever the home→blog transition runs
const _origShowBlog = showBlog;
showBlog = function () {
  _origShowBlog();
  closeArticle();
};

renderArticleListing();
