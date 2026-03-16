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
];

// ─── Draw Robot ───────────────────────────────────────────────────────────────
function drawRobot(bx, by, spriteImg, frameIndex, flip, hue) {
  if (!spriteImg || !spriteImg.complete || spriteImg.naturalWidth === 0) return;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  if (hue) {
    ctx.filter = `hue-rotate(${hue}deg)`;
  }

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
      this.def.hue
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
  canvas.style.cursor = anyHit ? 'pointer' : 'default';
});

canvas.addEventListener('mouseleave', () => {
  for (const robot of robots) {
    if (robot.hovered) {
      robot.hovered = false;
      scheduleBubbleHide(robot);
    }
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
  // Pause and unhover all robots
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

// Click backdrop (but not the panel itself) → close
inventoryOverlay.addEventListener('click', e => {
  if (e.target === inventoryOverlay) closeInventory();
});

// ESC → close
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeInventory();
});

// Click on the GitHub robot (index 4) → open inventory
canvas.addEventListener('click', e => {
  const { x, y } = getCanvasPos(e);
  for (const robot of robots) {
    if (robot.index === 4 && robot.contains(x, y)) {
      openInventory();
    }
  }
});

// ─── Init ─────────────────────────────────────────────────────────────────────
resize();
loop();
