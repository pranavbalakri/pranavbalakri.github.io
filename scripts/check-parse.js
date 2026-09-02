// One-shot check: run the runtime LaTeX parser (extracted from script.js)
// against the test article and assert the new rich-media output.
const fs = require('fs');
const src = fs.readFileSync('public/script.js', 'utf8');
const start = src.indexOf('// ─── LaTeX → HTML parser');
const end = src.indexOf('// ─── Article rendering');
if (start < 0 || end < 0) throw new Error('parser markers not found');
eval(src.slice(start, end));

const out = parseLatexToHtml(fs.readFileSync('public/articles/test-article.txt', 'utf8'));
const html = out.html;

const checks = {
  'title extracted':      out.title === 'A Test Article',
  'comments stripped':    !html.includes('stripped at render'),
  'figure default':       html.includes('<figure class="article-figure">'),
  'figure wide':          html.includes('<figure class="article-figure wide">'),
  'caption formatting':   html.includes('<figcaption>') && html.includes('<em>wide</em>'),
  'chart canvas':         html.includes('article-chart wide') && html.includes('canvas data-chart='),
  'chart json intact':    (() => {
    const m = html.match(/data-chart="([^"]+)"/);
    if (!m) return false;
    const cfg = JSON.parse(decodeURIComponent(m[1]));
    return cfg.type === 'line' && cfg.data.datasets.length === 2;
  })(),
  'embed restored':       html.includes('article-embed') && html.includes('A raw HTML block'),
  'no leftover slots':    !html.includes('data-embed-slot'),
  'figures not in <p>':   !html.includes('<p><figure'),
  'divs not in <p>':      !html.includes('<p><div'),
  'all sections present': (html.match(/<h2>/g) || []).length === 9,
};

let ok = true;
for (const [name, pass] of Object.entries(checks)) {
  console.log((pass ? 'PASS' : 'FAIL') + '  ' + name);
  if (!pass) ok = false;
}
if (!ok) {
  console.log('\n----- rendered html -----\n' + html);
  process.exit(1);
}
