#!/usr/bin/env node
// Scan public/articles/*.txt, extract metadata (\title, \author, \date, optional
// \excerpt, \hidden), and write public/articles/index.json. Wired up via the
// `prebuild` and `prestart` npm hooks so the listing stays in sync with the
// folder contents — drop a new .txt in and it shows up on the next build.

const fs   = require('fs');
const path = require('path');

const ARTICLES_DIR = path.join(__dirname, '..', 'public', 'articles');
const OUTPUT       = path.join(ARTICLES_DIR, 'index.json');

const MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4,  jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

// Parse "March 2026", "Mar 15, 2026", "2026-03-15", etc. → epoch ms (or null).
function parseDate(s) {
  if (!s) return null;
  s = s.trim();

  const iso = s.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?/);
  if (iso) return Date.UTC(+iso[1], +iso[2] - 1, +(iso[3] || 1));

  const mdy = s.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/);
  if (mdy) {
    const m = MONTHS[mdy[1].slice(0, 3).toLowerCase()];
    if (m != null) return Date.UTC(+mdy[3], m, +mdy[2]);
  }

  const my = s.match(/^([A-Za-z]+)\s+(\d{4})/);
  if (my) {
    const m = MONTHS[my[1].slice(0, 3).toLowerCase()];
    if (m != null) return Date.UTC(+my[2], m, 1);
  }

  const t = Date.parse(s);
  return isNaN(t) ? null : t;
}

function extractMeta(src) {
  const get = re => { const m = src.match(re); return m ? m[1].trim() : ''; };
  return {
    title:   get(/\\title\{([^}]*)\}/),
    author:  get(/\\author\{([^}]*)\}/),
    date:    get(/\\date\{([^}]*)\}/),
    excerpt: get(/\\excerpt\{([^}]*)\}/),
    hidden:  /\\hidden(?:\{[^}]*\})?(?![a-zA-Z])/.test(src),
  };
}

// Mirror the runtime LaTeX→HTML pipeline well enough to produce a clean plain
// text excerpt — strip math, environments, headings, and unwrap inline commands.
function stripLatex(src) {
  let s = src;

  // Drop metadata so it doesn't leak into the excerpt
  s = s.replace(/\\(?:title|author|date|excerpt)\{[^}]*\}/g, '');
  s = s.replace(/\\hidden(?:\{[^}]*\})?/g, '');

  // Comments
  s = s.replace(/(^|[^\\])%[^\n]*/g, '$1');

  // Math blocks (display + inline)
  s = s.replace(/\\\[[\s\S]*?\\\]/g, '');
  s = s.replace(/\$\$[\s\S]*?\$\$/g, '');
  s = s.replace(/\\begin\{(equation|align|gather)\*?\}[\s\S]*?\\end\{\1\*?\}/g, '');
  s = s.replace(/\\\([\s\S]*?\\\)/g, '');
  s = s.replace(/\$(?!\$)[^$\n]+?\$/g, '');

  // Drop \section{...} / \subsection{...} headings entirely
  s = s.replace(/\\(?:sub){0,2}section\*?\{[^}]*\}/g, '');

  // Drop list/quote/center environments wrappers but keep inner text
  s = s.replace(/\\begin\{[^}]*\}/g, '');
  s = s.replace(/\\end\{[^}]*\}/g, '');
  s = s.replace(/\\item\b/g, ' ');

  // Unwrap inline formatting: \textbf{x} → x, \href{url}{text} → text
  s = s.replace(/\\href\{[^}]*\}\{([^}]*)\}/g, '$1');
  s = s.replace(/\\url\{([^}]*)\}/g, '$1');
  for (let i = 0; i < 4; i++) {
    s = s.replace(/\\(?:textbf|textit|emph|underline|texttt|text)\{([^{}]*)\}/g, '$1');
  }

  // Remove any remaining commands and stray braces
  s = s.replace(/\\[a-zA-Z]+\*?(?:\{[^}]*\})?/g, '');
  s = s.replace(/\\\\/g, ' ');
  s = s.replace(/[{}]/g, '');

  // Typography
  s = s.replace(/---/g, '—').replace(/--/g, '–');

  return s.replace(/\s+/g, ' ').trim();
}

function autoExcerpt(src, maxLen = 180) {
  const text = stripLatex(src);
  if (text.length <= maxLen) return text;
  const cut = text.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(' ');
  const trimmed = (lastSpace > maxLen * 0.6 ? cut.slice(0, lastSpace) : cut)
    .replace(/[\s.,;:–—]+$/, '');
  return trimmed + '…';
}

function build() {
  if (!fs.existsSync(ARTICLES_DIR)) {
    console.warn('[build-articles] no ' + ARTICLES_DIR + ', skipping');
    return;
  }

  const entries = fs.readdirSync(ARTICLES_DIR)
    .filter(f => f.endsWith('.txt'))
    .map(filename => {
      const slug = filename.replace(/\.txt$/, '');
      const src  = fs.readFileSync(path.join(ARTICLES_DIR, filename), 'utf8');
      const meta = extractMeta(src);
      return {
        slug,
        title:   meta.title || slug,
        author:  meta.author,
        date:    meta.date,
        excerpt: meta.excerpt || autoExcerpt(src),
        hidden:  meta.hidden,
        file:    '/articles/' + filename,
        _ts:     parseDate(meta.date),
      };
    });

  entries.sort((a, b) => {
    if (a._ts != null && b._ts != null) return b._ts - a._ts;
    if (a._ts != null) return -1;
    if (b._ts != null) return 1;
    return a.slug.localeCompare(b.slug);
  });

  const out = entries.map(({ _ts, ...rest }) => rest);
  fs.writeFileSync(OUTPUT, JSON.stringify(out, null, 2) + '\n');
  const rel = path.relative(path.join(__dirname, '..'), OUTPUT);
  console.log(`[build-articles] wrote ${out.length} entr${out.length === 1 ? 'y' : 'ies'} to ${rel}`);
}

build();
