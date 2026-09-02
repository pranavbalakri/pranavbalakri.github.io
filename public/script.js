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
const SPRITE_NAMES = [
  'Dude_Monster_Walk_6',
  'Owlet_Monster_Walk_6',
  'Pink_Monster_Walk_6',
];

for (const name of SPRITE_NAMES) {
  const img = new Image();
  img.src = '/' + name + '.png';
  SPRITES[name] = img;
}

// ─── Robot Definitions ────────────────────────────────────────────────────────
const ROBOT_DEFS = [
  {
    sprite: 'Dude_Monster_Walk_6',
    hue: 0,
    speed: 0.255,
    html: `I think the world's greatest moral objectives include AI safety and ending factory farming.`,
  },
  {
    sprite: 'Owlet_Monster_Walk_6',
    hue: 0,
    speed: 0.33,
    html: `Some of my interests include poker, Geoguessr, and policy debate.`,
  },
  {
    sprite: 'Pink_Monster_Walk_6',
    hue: 0,
    speed: 0.216,
    html: `Check out my <a href="https://linkedin.com/in/pranavbalakri" target="_blank">LinkedIn</a> and <a href="https://github.com/pranavbalakri" target="_blank">GitHub</a>!`,
  },
  {
    sprite: 'Dude_Monster_Walk_6',
    hue: 130,    // green-shifted Dude
    speed: 0.384,
    html: `Contact me at<br><a href="mailto:pranavbalakri@gmail.com">pranavbalakri@gmail.com</a>`,
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
  placeBubbleAbove(el, anchor.x, anchor.y);
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

function placeBubbleAbove(el, anchorX, anchorY) {
  const containerW = bubblesContainer.clientWidth;
  const margin = 8;
  const half   = el.offsetWidth / 2;
  const clampedX = Math.max(half + margin, Math.min(anchorX, containerW - half - margin));
  el.style.left = clampedX + 'px';
  const h = el.offsetHeight;
  el.style.top = (anchorY - h - 16) + 'px';
  el.style.setProperty('--tail-x', (anchorX - (clampedX - half)) + 'px');
}

function updateBubblePositions() {
  for (const robot of robots) {
    if (robot.bubbleEl) {
      const anchor = robot.bubbleAnchor();
      placeBubbleAbove(robot.bubbleEl, anchor.x, anchor.y);
    }
  }
}

// ─── Resize ───────────────────────────────────────────────────────────────────
function resize() {
  // Size the canvas to its parent (#scene) so it fills the banner.
  const parent = canvas.parentElement;
  const rect   = parent.getBoundingClientRect();
  canvas.width  = Math.max(1, Math.round(rect.width));
  canvas.height = Math.max(1, Math.round(rect.height));
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

// ─── Init ─────────────────────────────────────────────────────────────────────
resize();
loop();

// ─── Blog ↔ Home navigation ───────────────────────────────────────────────────
function showHome() {
  document.getElementById('new-page').style.display = 'none';
  document.getElementById('page').style.display = '';
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function showBlog() {
  document.getElementById('page').style.display = 'none';
  document.getElementById('new-page').style.display = 'block';
  document.getElementById('article-view').style.display = 'none';
  document.getElementById('blog-listing').style.display = 'block';
  document.getElementById('new-page').scrollTop = 0;
}

// ─── Pixelation engine ────────────────────────────────────────────────────────
// Entering the blog plays a pixelate-in → page swap → pixelate-out transition,
// driven by a mosaic SVG filter (#pixelate-filter in index.html) over the
// visible page. The blog back button reuses the same transition in reverse.

const pxFlood   = document.getElementById('px-flood');
const pxComp    = document.getElementById('px-comp');
const pxMorph   = document.getElementById('px-morph');
const pxTargets = [document.getElementById('page'), document.getElementById('new-page')];

// WebKit (Safari and every iOS browser) can't apply this SVG filter chain via
// CSS filter:url() — the element either renders unfiltered or disappears — so
// those browsers get a chunky blur instead.
const PX_USE_BLUR =
  (/AppleWebKit/.test(navigator.userAgent) && !/Chrome|Chromium|Edg|OPR/.test(navigator.userAgent)) ||
  /iPad|iPhone|iPod|CriOS|FxiOS/.test(navigator.userAgent);

let _pxApplied = false;

// px = mosaic cell size in CSS pixels; 0 removes the effect entirely.
function setPixelation(px) {
  if (px < 1.25) {
    if (_pxApplied) {
      for (const t of pxTargets) t.style.filter = '';
      _pxApplied = false;
    }
    return;
  }
  let css;
  if (PX_USE_BLUR) {
    css = 'blur(' + (px / 4).toFixed(2) + 'px)';
  } else {
    // feFlood drops a tiny seed at each cell's center, feTile repeats it,
    // the composite samples the source through the seeds, and feMorphology
    // dilates each sample into a full px×px square.
    const seed = Math.max(1, px / 6);
    pxFlood.setAttribute('x', (px - seed) / 2);
    pxFlood.setAttribute('y', (px - seed) / 2);
    pxFlood.setAttribute('width', seed);
    pxFlood.setAttribute('height', seed);
    pxComp.setAttribute('width', px);
    pxComp.setAttribute('height', px);
    pxMorph.setAttribute('radius', px / 2);
    css = 'url(#pixelate-filter)';
  }
  for (const t of pxTargets) t.style.filter = css;
  _pxApplied = true;
}

// ─── Pixel transition ─────────────────────────────────────────────────────────
const PEAK_PX      = 60;    // cell size at the transition midpoint
const RAMP_UP_MS   = 300;
const RAMP_DOWN_MS = 750;

let transitioning = false;

const easeInQuad   = t => t * t;
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

// Pixelate up to PEAK_PX, swap pages at the peak, then smoothly resolve back
// down to zero.
function pixelTransition(swap) {
  transitioning = true;
  const t0 = performance.now();

  requestAnimationFrame(function up(t) {
    const k = Math.min(1, (t - t0) / RAMP_UP_MS);
    setPixelation(PEAK_PX * easeInQuad(k));
    if (k < 1) { requestAnimationFrame(up); return; }

    swap();
    const t1 = performance.now();
    requestAnimationFrame(function down(t2) {
      const k2 = Math.min(1, (t2 - t1) / RAMP_DOWN_MS);
      setPixelation(PEAK_PX * (1 - easeOutCubic(k2)));
      if (k2 < 1) { requestAnimationFrame(down); return; }
      setPixelation(0);
      transitioning = false;
    });
  });
}

// One click on any blog door pixelates straight into the blog.
function enterBlog() {
  if (transitioning) return;
  history.pushState({ page: 'blog' }, '', '/blog');
  pixelTransition(() => showBlog());
}

// In-page /blog links animate instead of doing a full page load. Modified
// clicks (cmd/ctrl/shift — new tab, etc.) keep native behavior.
for (const a of document.querySelectorAll('#page a[href="/blog"]')) {
  a.addEventListener('click', e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    enterBlog();
  });
}

// Back button on the blog page pixelates back home.
document.getElementById('back-btn').addEventListener('click', () => {
  if (transitioning) return;
  history.pushState({ page: 'home' }, '', '/');
  pixelTransition(() => showHome());
});

// ─── Back-button bubble ───────────────────────────────────────────────────────
let backBubbleEl    = null;
let backBubbleTimer = null;
const backBtn       = document.getElementById('back-btn');
const newPage       = document.getElementById('new-page');

backBtn.addEventListener('mouseenter', () => {
  clearTimeout(backBubbleTimer);
  if (backBubbleEl) return;
  const rect = backBtn.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'speech-bubble bubble-below';
  el.textContent = 'Click to go back.';
  el.style.position = 'absolute';
  el.style.top  = (rect.bottom + 16) + 'px';
  newPage.appendChild(el);
  const margin      = 12;
  const center      = rect.left + rect.width / 2;
  const half        = el.offsetWidth / 2;
  const clampedLeft = Math.max(center, half + margin);
  el.style.left = clampedLeft + 'px';
  // Tail must point at the button center regardless of clamping
  const tailX = center - (clampedLeft - half);
  el.style.setProperty('--tail-x', tailX + 'px');
  backBubbleEl = el;
});

backBtn.addEventListener('mouseleave', () => {
  backBubbleTimer = setTimeout(() => {
    if (backBubbleEl) { backBubbleEl.remove(); backBubbleEl = null; }
  }, 120);
});

// ─── Blog Articles ────────────────────────────────────────────────────────────
// The listing is generated at build time by scripts/build-articles.js, which
// scans public/articles/*.txt and writes index.json. To add an article, drop a
// new .txt in that folder — the prebuild npm hook regenerates the index.
let ARTICLES = [];
let _articlesPromise = null;

function loadArticles() {
  if (_articlesPromise) return _articlesPromise;
  _articlesPromise = fetch('/articles/index.json')
    .then(r => r.ok ? r.json() : [])
    .then(list => { ARTICLES = list; return ARTICLES; })
    .catch(err => { console.warn('[articles] index load failed', err); return ARTICLES; });
  return _articlesPromise;
}

// ─── LaTeX → HTML parser ──────────────────────────────────────────────────────
// Breakout option shared by rich media: [wide] and [full] widen an element
// past the text column (see style.css).
const breakoutClass = opt =>
  opt === 'wide' ? ' wide' : opt === 'full' ? ' full' : '';

function parseLatexToHtml(src) {
  let s = src;

  // 0. Lift rich blocks (raw HTML embeds and Chart.js charts) out before any
  //    text processing so their contents are never rewritten. Each leaves a
  //    single-line <div data-embed-slot> token — block-level, so paragraph
  //    wrapping skips it — that is swapped back at the very end.
  const embeds = [];
  const slot = html => {
    embeds.push(html);
    return '\n\n<div data-embed-slot="' + (embeds.length - 1) + '"></div>\n\n';
  };

  s = s.replace(/\\begin\{html\}(?:\[([^\]]*)\])?([\s\S]*?)\\end\{html\}/g,
    (_, opt, body) =>
      slot('<div class="article-embed' + breakoutClass(opt) + '">' + body.trim() + '</div>'));

  s = s.replace(/\\begin\{chart\}(?:\[([^\]]*)\])?([\s\S]*?)\\end\{chart\}/g,
    (_, opt, body) =>
      slot('<div class="article-chart' + breakoutClass(opt) + '">' +
           '<canvas data-chart="' + encodeURIComponent(body.trim()) + '"></canvas></div>'));

  // 1. Strip line comments (an escaped \% survives)
  s = s.replace(/(^|[^\\])%[^\n]*/g, '$1');

  // 2. Protect math blocks with null-byte placeholders so text processing
  //    never touches the math content.
  const math = [];
  const protect = m => { math.push(m); return '\x00M' + (math.length - 1) + '\x00'; };

  s = s.replace(/\\\[([\s\S]*?)\\\]/g,  m => protect(m));
  s = s.replace(/\$\$([\s\S]*?)\$\$/g,  m => protect(m));
  s = s.replace(/\\begin\{(equation|align|gather)\*?\}([\s\S]*?)\\end\{\1\*?\}/g, m => protect(m));
  s = s.replace(/\$(?!\$)([^$\n]+?)\$/g, m => protect(m));
  s = s.replace(/\\\(([\s\S]*?)\\\)/g,  m => protect(m));

  // 3. Metadata — extract title/author/date and strip excerpt/hidden so they
  //    don't leak into the rendered article body.
  let title = '', author = '', date = '';
  s = s.replace(/\\title\{([^}]*)\}/,   (_, v) => { title  = v; return ''; });
  s = s.replace(/\\author\{([^}]*)\}/,  (_, v) => { author = v; return ''; });
  s = s.replace(/\\date\{([^}]*)\}/,    (_, v) => { date   = v; return ''; });
  s = s.replace(/\\excerpt\{[^}]*\}/g,  '');
  s = s.replace(/\\hidden(?:\{[^}]*\})?/g, '');

  // 4. Environments
  const items = c => c.split('\\item').slice(1).map(t => '<li>' + t.trim() + '</li>').join('');
  s = s.replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g,
    (_, c) => '<ul>' + items(c) + '</ul>');
  s = s.replace(/\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g,
    (_, c) => '<ol>' + items(c) + '</ol>');
  s = s.replace(/\\begin\{quote\}([\s\S]*?)\\end\{quote\}/g,
    (_, c) => '<blockquote>' + c.trim() + '</blockquote>');
  s = s.replace(/\\begin\{center\}([\s\S]*?)\\end\{center\}/g,
    (_, c) => '<div style="text-align:center">' + c.trim() + '</div>');

  // 4b. Images: \image[wide|full]{src}{optional caption}. The caption is
  //     re-inserted into the stream, so inline commands inside it still work.
  s = s.replace(/\\image(?:\[([^\]]*)\])?\{([^}]*)\}(?:\{((?:[^{}]|\{[^{}]*\})*)\})?/g,
    (_, opt, url, cap) => {
      const alt = (cap || '').replace(/\\[a-zA-Z]+\*?/g, '').replace(/[{}]/g, '')
        .replace(/"/g, '&quot;').trim();
      return '<figure class="article-figure' + breakoutClass(opt) + '">' +
        '<img src="' + url.trim() + '" alt="' + alt + '" loading="lazy">' +
        (cap ? '<figcaption>' + cap + '</figcaption>' : '') +
        '</figure>';
    });

  // 5. Headings
  s = s.replace(/\\section\*?\{([^}]*)\}/g,       '<h2>$1</h2>');
  s = s.replace(/\\subsection\*?\{([^}]*)\}/g,    '<h3>$1</h3>');
  s = s.replace(/\\subsubsection\*?\{([^}]*)\}/g, '<h4>$1</h4>');

  // 6. Inline formatting
  s = s.replace(/\\textbf\{([^}]*)\}/g,   '<strong>$1</strong>');
  s = s.replace(/\\textit\{([^}]*)\}/g,   '<em>$1</em>');
  s = s.replace(/\\emph\{([^}]*)\}/g,     '<em>$1</em>');
  s = s.replace(/\\underline\{([^}]*)\}/g,'<u>$1</u>');
  s = s.replace(/\\texttt\{([^}]*)\}/g,   '<code>$1</code>');
  s = s.replace(/\\text\{([^}]*)\}/g,     '$1');

  // 7. Links
  s = s.replace(/\\href\{([^}]*)\}\{([^}]*)\}/g, '<a href="$1" target="_blank">$2</a>');
  s = s.replace(/\\url\{([^}]*)\}/g,              '<a href="$1" target="_blank">$1</a>');

  // 8. Rules
  s = s.replace(/\\hrule/g,                '<hr>');
  s = s.replace(/\\rule\{[^}]*\}\{[^}]*\}/g, '<hr>');

  // 9. Spacing / structural commands to discard
  s = s.replace(/\\(noindent|medskip|bigskip|smallskip|newpage|clearpage|maketitle)\b\s*/g, '');
  s = s.replace(/\\(vspace|hspace)\{[^}]*\}/g, '');
  s = s.replace(/\\label\{[^}]*\}/g, '');
  s = s.replace(/\\ref\{([^}]*)\}/g, '($1)');

  // 10. Explicit line breaks
  s = s.replace(/\\\\\s*/g, '<br>');
  s = s.replace(/\\newline/g, '<br>');

  // 11. Typography
  s = s.replace(/---/g, '\u2014').replace(/--/g, '\u2013');
  s = s.replace(/``/g, '\u201C').replace(/''/g, '\u201D');

  // 12. Escaped special chars
  s = s.replace(/\\&/g, '&amp;').replace(/\\%/g, '%')
       .replace(/\\\$/g, '$').replace(/\\#/g, '#');

  // 13. Wrap plain-text blocks in <p> (blank lines separate blocks)
  s = s.split(/\n{2,}/).map(b => {
    b = b.trim().replace(/\n/g, ' ');
    if (!b) return '';
    if (/^<(h[2-6]|ul|ol|blockquote|div|hr|figure)/.test(b)) return b;
    return '<p>' + b + '</p>';
  }).filter(Boolean).join('\n');

  // 14. Restore math, then rich blocks
  s = s.replace(/\x00M(\d+)\x00/g, (_, i) => math[+i]);
  s = s.replace(/<div data-embed-slot="(\d+)"><\/div>/g, (_, i) => embeds[+i]);

  return { title, author, date, html: s };
}

// ─── Article rendering ────────────────────────────────────────────────────────
function renderArticleListing() {
  const container = document.getElementById('article-list');
  container.innerHTML = '';
  ARTICLES.filter(a => !a.hidden).forEach(article => {
    const el = document.createElement('div');
    el.className = 'article-item';
    el.innerHTML =
      (article.date ? `<div class="article-item-date">${article.date}</div>` : '') +
      `<div class="article-item-title">${article.title}</div>` +
      (article.excerpt ? `<div class="article-item-excerpt">${article.excerpt}</div>` : '');
    el.addEventListener('click', () => openArticle(article.slug));
    container.appendChild(el);
  });
}

async function openArticle(slug, { pushState = true } = {}) {
  await loadArticles();
  const article = ARTICLES.find(a => a.slug === slug);
  if (!article) return;

  document.getElementById('article-title').textContent = article.title;

  const dateEl = document.getElementById('article-date');
  dateEl.textContent = article.date || '';
  dateEl.style.display = article.date ? '' : 'none';

  const authorEl = document.getElementById('article-author');
  authorEl.textContent = article.author || '';
  authorEl.style.display = article.author ? '' : 'none';

  const bodyEl = document.getElementById('article-body');
  if (window.Chart) {
    for (const c of bodyEl.querySelectorAll('canvas')) {
      const chart = Chart.getChart(c);
      if (chart) chart.destroy();
    }
  }
  bodyEl.innerHTML = '<p style="opacity:.45">Loading\u2026</p>';

  document.getElementById('blog-listing').style.display = 'none';
  document.getElementById('article-view').style.display = 'block';
  document.getElementById('new-page').scrollTop = 0;

  if (pushState) {
    history.pushState({ page: 'article', slug: article.slug }, '', '/blog/' + article.slug);
  }

  try {
    const resp = await fetch(article.file);
    if (!resp.ok) throw new Error(resp.status);
    const { html } = parseLatexToHtml(await resp.text());
    bodyEl.innerHTML = html;
    buildArticleToc(bodyEl);
    renderArticleCharts(bodyEl);
    if (window.renderMathInElement) {
      renderMathInElement(bodyEl, {
        delimiters: [
          { left: '$$',   right: '$$',   display: true  },
          { left: '\\[',  right: '\\]',  display: true  },
          { left: '$',    right: '$',    display: false },
          { left: '\\(',  right: '\\)',  display: false },
        ],
        throwOnError: false,
      });
    }
  } catch (_) {
    bodyEl.innerHTML = '<p>Could not load article.</p>';
  }
}

function closeArticle() {
  document.getElementById('article-view').style.display  = 'none';
  document.getElementById('blog-listing').style.display  = 'block';
  document.getElementById('new-page').scrollTop = 0;
  history.pushState({ page: 'blog' }, '', '/blog');
}

// ─── Article table of contents ────────────────────────────────────────────────
// Wide viewports get a sidebar listing the article's sections (h2s). The rail
// is anchored so its top sits exactly where the article body starts (it can
// never render higher); the inner list is sticky, so it scrolls with the page
// and pins near the viewport top. Hidden (via CSS) on narrow viewports.
let _tocSpy = null;
let _tocPosition = null;

function buildArticleToc(bodyEl) {
  const old = document.getElementById('article-toc');
  if (old) old.remove();
  _tocPosition = null;
  const newPageEl = document.getElementById('new-page');
  if (_tocSpy) { newPageEl.removeEventListener('scroll', _tocSpy); _tocSpy = null; }

  const toc = document.createElement('nav');
  toc.id = 'article-toc';
  toc.setAttribute('aria-label', 'On this page');
  const inner = document.createElement('div');
  inner.id = 'article-toc-inner';
  toc.appendChild(inner);

  // Back to the listing, above the section list. (On narrow viewports the
  // rail is hidden; browser back still returns to the listing.)
  const back = document.createElement('a');
  back.id = 'article-toc-back';
  back.href = '/blog';
  back.textContent = '← Articles';
  back.addEventListener('click', e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    closeArticle();
  });
  inner.appendChild(back);

  // Section (h2) and sub-section (h3) links; h3s are grouped into an
  // indented .toc-sub container hanging off their parent section's tree
  // line. Articles with fewer than two headings get no list.
  const heads = [...bodyEl.querySelectorAll('h2, h3')];
  const sections = heads.length >= 2 ? heads : [];

  const seen = {};
  const parents = [];      // for each link: its parent h2 link, or null
  let lastH2Link = null;
  let subGroup = null;     // open .toc-sub container under the last h2

  const links = sections.map(h => {
    let id = h.textContent.trim().toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-') || 'section';
    seen[id] = (seen[id] || 0) + 1;
    if (seen[id] > 1) id += '-' + seen[id];
    h.id = id;

    const a = document.createElement('a');
    a.href = '#' + id;
    a.textContent = h.textContent;
    a.addEventListener('click', e => {
      e.preventDefault();
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      h.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });

    if (h.tagName === 'H3') {
      if (!subGroup) {
        subGroup = document.createElement('div');
        subGroup.className = 'toc-sub';
        inner.appendChild(subGroup);
      }
      subGroup.appendChild(a);
      parents.push(lastH2Link);
    } else {
      subGroup = null;
      lastH2Link = a;
      inner.appendChild(a);
      parents.push(null);
    }
    return a;
  });

  document.getElementById('article-view').appendChild(toc);

  // Align the rail's top with the start of the article body (below the
  // title), re-aligning if a resize rewraps the title.
  _tocPosition = () => { toc.style.top = bodyEl.offsetTop + 'px'; };
  _tocPosition();

  if (links.length) {
    let raf = null;
    const update = () => {
      raf = null;
      let active = 0;
      for (let i = 0; i < links.length; i++) {
        if (sections[i].getBoundingClientRect().top <= 160) active = i;
      }
      links.forEach((a, i) => a.classList.toggle('active', i === active));
      // Keep the parent section lit while one of its children is active.
      if (parents[active]) parents[active].classList.add('active');
    };
    _tocSpy = () => { if (!raf) raf = requestAnimationFrame(update); };
    newPageEl.addEventListener('scroll', _tocSpy, { passive: true });
    update();
  }
}

window.addEventListener('resize', () => { if (_tocPosition) _tocPosition(); });

// ─── Article charts (Chart.js, loaded only when an article uses one) ──────────
const CHART_PALETTE = ['#7dd3fc', '#f0abfc', '#86efac', '#fcd34d', '#fca5a5'];
let _chartJsPromise = null;

function loadChartJs() {
  if (window.Chart) return Promise.resolve();
  if (!_chartJsPromise) {
    _chartJsPromise = new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = 'https://cdn.jsdelivr.net/npm/chart.js@4';
      el.onload = resolve;
      el.onerror = () => { _chartJsPromise = null; reject(new Error('Chart.js failed to load')); };
      document.head.appendChild(el);
    });
  }
  return _chartJsPromise;
}

// Dark-theme defaults merged underneath whatever the article's config sets.
function themedChartConfig(config) {
  const o = (config.options = config.options || {});
  o.responsive = true;
  o.maintainAspectRatio = false;
  o.plugins = o.plugins || {};
  o.plugins.legend = o.plugins.legend || {};
  o.plugins.legend.labels = Object.assign(
    { color: 'rgba(255,255,255,.75)', boxWidth: 12, boxHeight: 12 },
    o.plugins.legend.labels);

  if (!/^(pie|doughnut|polarArea|radar)$/.test(config.type)) {
    const scales = (o.scales = o.scales || {});
    for (const axis of ['x', 'y']) {
      const sc = (scales[axis] = scales[axis] || {});
      sc.ticks  = Object.assign({ color: 'rgba(255,255,255,.55)' }, sc.ticks);
      sc.grid   = Object.assign({ color: 'rgba(255,255,255,.08)' }, sc.grid);
      sc.border = Object.assign({ color: 'rgba(255,255,255,.15)' }, sc.border);
    }
  }

  ((config.data && config.data.datasets) || []).forEach((d, i) => {
    const color = CHART_PALETTE[i % CHART_PALETTE.length];
    if (d.borderColor == null)     d.borderColor = color;
    if (d.backgroundColor == null)
      d.backgroundColor = config.type === 'line' ? 'transparent' : color + 'd9';
    if (config.type === 'line' && d.tension == null) d.tension = 0.35;
  });

  return config;
}

async function renderArticleCharts(bodyEl) {
  const canvases = bodyEl.querySelectorAll('canvas[data-chart]');
  if (!canvases.length) return;
  try { await loadChartJs(); } catch (_) { return; }

  Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
  Chart.defaults.font.size = 12;

  for (const canvas of canvases) {
    if (!canvas.isConnected) continue;   // article was closed while loading
    let config;
    try { config = JSON.parse(decodeURIComponent(canvas.dataset.chart)); }
    catch (_) {
      canvas.parentElement.innerHTML = '<p style="opacity:.45">Could not render chart.</p>';
      continue;
    }
    new Chart(canvas, themedChartConfig(config));
  }
}

// Reset to listing whenever the home→blog transition runs
const _origShowBlog = showBlog;
showBlog = function () {
  _origShowBlog();
  document.getElementById('article-view').style.display  = 'none';
  document.getElementById('blog-listing').style.display  = 'block';
};

// ─── Routing ──────────────────────────────────────────────────────────────────
window.addEventListener('popstate', async e => {
  const p = e.state && e.state.page;
  if (p === 'article') {
    await loadArticles();
    showBlog();
    openArticle(e.state.slug, { pushState: false });
  } else if (p === 'blog') {
    showBlog();
  } else {
    showHome();
  }
});

// Initial load: fetch the index, render the listing, then handle direct
// navigation (e.g. a refresh on /blog/<slug> restored by 404.html).
(async function () {
  await loadArticles();
  renderArticleListing();

  const path = window.location.pathname;
  if (path === '/blog') {
    showBlog();
  } else if (path.startsWith('/blog/')) {
    showBlog();
    openArticle(path.slice(6), { pushState: false });
  }
})();
