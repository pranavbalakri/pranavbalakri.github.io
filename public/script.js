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
    html: `I'm a bit of an <a href="https://www.effectivealtruism.org/" target="_blank" rel="noopener">effective altruist</a>. I think the world's greatest moral objectives include AI safety and ending factory farming.`,
  },
  {
    sprite: 'Owlet_Monster_Walk_6',
    hue: 0,
    speed: 0.33,
    html: `Click here to learn more about <a href="https://www.endurance.exchange/" target="_blank" rel="noopener">Endurance</a>.`,
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
    html: `Contact me at<br><a href="mailto:pranavbalakri+website@gmail.com">pranavbalakri@gmail.com</a>`,
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

// Back button on the blog page returns home.
document.getElementById('back-btn').addEventListener('click', () => {
  history.pushState({ page: 'home' }, '', '/');
  showHome();
});

// "Blog" link navigates to the blog page (client-side, no reload).
const blogLink = document.getElementById('blog-link');
if (blogLink) {
  blogLink.addEventListener('click', e => {
    e.preventDefault();
    history.pushState({ page: 'blog' }, '', '/blog');
    showBlog();
  });
}

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
function parseLatexToHtml(src) {
  let s = src;

  // 1. Strip line comments
  s = s.replace(/%[^\n]*/g, '');

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
    if (/^<(h[2-6]|ul|ol|blockquote|div|hr)/.test(b)) return b;
    return '<p>' + b + '</p>';
  }).filter(Boolean).join('\n');

  // 14. Restore math
  s = s.replace(/\x00M(\d+)\x00/g, (_, i) => math[+i]);

  return { title, author, date, html: s };
}

// ─── Article rendering ────────────────────────────────────────────────────────
function renderArticleListing() {
  const container = document.getElementById('article-list');
  container.innerHTML = '';
  ARTICLES.filter(a => !a.hidden).forEach(article => {
    const el = document.createElement('div');
    el.className = 'article-item';
    el.innerHTML = `
      <div class="article-item-title">${article.title}</div>
      <div class="article-item-meta">${[article.author, article.date].filter(Boolean).join(' · ')}</div>
      <div class="article-item-excerpt">${article.excerpt}</div>
    `;
    el.addEventListener('click', () => openArticle(article.slug));
    container.appendChild(el);
  });
}

async function openArticle(slug, { pushState = true } = {}) {
  await loadArticles();
  const article = ARTICLES.find(a => a.slug === slug);
  if (!article) return;

  document.getElementById('article-title').textContent = article.title;
  document.getElementById('article-meta').textContent =
    [article.author, article.date].filter(Boolean).join(' · ');

  const bodyEl = document.getElementById('article-body');
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

document.getElementById('article-back').addEventListener('click', closeArticle);

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
