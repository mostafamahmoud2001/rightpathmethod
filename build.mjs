// Static site build for rightpathmethod.com. No dependencies.
//
//   src/pages/*.html        page bodies, each starting with a <!-- meta {...} --> JSON header
//   src/layout.html         shared page shell
//   src/data/placeholders.json   every placeholder fact (fees, scores, contact, registry...)
//   src/assets/             css + js, copied to dist/assets/
//   public/                 copied as-is to dist/ (downloads, images, favicon)
//
// Tokens available in pages and layout:
//   {{ph.some.path}}   a value from placeholders.json (build fails if missing)
//   {{render:name}}    an HTML block produced by a renderer below
//   {{badge}}          the visible "Placeholder" label

import { readFile, writeFile, mkdir, readdir, cp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'dist');
const SITE_URL = 'https://rightpathmethod.com';

const NAV_PRIMARY = [
  ['home', 'Home', 'index.html'],
  ['about', 'About', 'about.html'],
  ['method', 'Method', 'method.html'],
  ['standards', 'Standards', 'standards.html'],
  ['certification', 'Certification', 'certification.html'],
  ['mark-licensing', 'Mark Licensing', 'mark-licensing.html'],
  ['directory', 'Directory', 'directory.html'],
  ['research', 'Research', 'research.html'],
  ['apply', 'Apply', 'apply.html'],
];
const NAV_SECONDARY = [
  ['resources', 'Resources', 'resources.html'],
  ['faq', 'FAQ', 'faq.html'],
  ['contact', 'Contact', 'contact.html'],
];

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const BADGE = '<span class="ph-badge">Placeholder</span>';

function lookup(obj, dotted) {
  return dotted.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function tableWrap(label, inner) {
  return `<div class="table-wrap" role="region" aria-label="${esc(label)}" tabindex="0">\n<table>\n${inner}\n</table>\n</div>`;
}

const renderers = {
  scoringTable(ph) {
    const rows = ph.scoring.categories
      .map((c) => `<tr><th scope="row">${esc(c.category)}</th><td>${esc(c.weight)}</td><td>${esc(c.score)}</td></tr>`)
      .join('\n');
    return tableWrap(
      'Sample scoring categories',
      `<caption>Sample Scoring Categories ${BADGE}</caption>
<thead><tr><th scope="col">Category</th><th scope="col">Sample Weight</th><th scope="col">Placeholder Score</th></tr></thead>
<tbody>
${rows}
</tbody>`
    );
  },
  feesTable(ph) {
    const rows = ph.fees
      .map((f) => `<tr><th scope="row">${esc(f.reviewType)}</th><td>${esc(f.fee)}</td><td>${esc(f.notes)}</td></tr>`)
      .join('\n');
    return tableWrap(
      'Sample fees',
      `<caption>Sample Fees ${BADGE}</caption>
<thead><tr><th scope="col">Review Type</th><th scope="col">Placeholder Fee</th><th scope="col">Notes</th></tr></thead>
<tbody>
${rows}
</tbody>`
    );
  },
  contactTable(ph) {
    const c = ph.contact;
    const rows = [
      ['Email', `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a> <span class="ph-flag">Not a client domain. Confirm before launch.</span>`],
      ['Phone', esc(c.phone)],
      ['Mailing Address', esc(c.mailingAddress)],
      ['Office Hours', esc(c.officeHours)],
      ['General Response Window', esc(c.responseWindow)],
    ]
      .map(([k, v]) => `<tr><th scope="row">${k}</th><td>${v}</td></tr>`)
      .join('\n');
    return tableWrap(
      'Certification office contact details',
      `<caption>Certification Office ${BADGE}</caption>
<thead><tr><th scope="col">Contact Field</th><th scope="col">Placeholder Information</th></tr></thead>
<tbody>
${rows}
</tbody>`
    );
  },
  navPrimary(_ph, page) {
    return NAV_PRIMARY.map(([key, label, href]) => navLink(key, label, href, page.nav)).join('\n');
  },
  navSecondary(_ph, page) {
    return NAV_SECONDARY.map(([key, label, href]) => navLink(key, label, href, page.nav)).join('\n');
  },
};

function navLink(key, label, href, active) {
  const current = key === active ? ' aria-current="page"' : '';
  return `<li><a href="${href}"${current}>${label}</a></li>`;
}

function fill(template, ph, page) {
  return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_m, token) => {
    if (token === 'badge') return BADGE;
    if (token.startsWith('ph.')) {
      const v = lookup(ph, token.slice(3));
      if (v === undefined || typeof v === 'object') throw new Error(`Unknown placeholder "${token}" in ${page.file}`);
      return esc(v);
    }
    if (token.startsWith('render:')) {
      const fn = renderers[token.slice(7)];
      if (!fn) throw new Error(`Unknown renderer "${token}" in ${page.file}`);
      return fn(ph, page);
    }
    if (token.startsWith('page.')) {
      const v = page[token.slice(5)];
      if (v === undefined) throw new Error(`Unknown page field "${token}" in ${page.file}`);
      return v;
    }
    throw new Error(`Unknown token "{{${token}}}" in ${page.file}`);
  });
}

export async function build() {
  const ph = JSON.parse(await readFile(path.join(SRC, 'data', 'placeholders.json'), 'utf8'));
  const layout = await readFile(path.join(SRC, 'layout.html'), 'utf8');

  if (existsSync(OUT)) await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  await cp(path.join(ROOT, 'public'), OUT, { recursive: true });
  await cp(path.join(SRC, 'assets'), path.join(OUT, 'assets'), { recursive: true });

  // Runtime data for the directory page comes from the same placeholders file.
  await mkdir(path.join(OUT, 'data'), { recursive: true });
  await writeFile(path.join(OUT, 'data', 'directory.json'), JSON.stringify(ph.directory, null, 2));

  const files = (await readdir(path.join(SRC, 'pages'))).filter((f) => f.endsWith('.html')).sort();
  const urls = [];
  for (const file of files) {
    const raw = await readFile(path.join(SRC, 'pages', file), 'utf8');
    const m = raw.match(/^<!--\s*meta\s*(\{[\s\S]*?\})\s*-->\s*/);
    if (!m) throw new Error(`Missing <!-- meta {...} --> header in ${file}`);
    const meta = JSON.parse(m[1]);
    const page = {
      file,
      nav: meta.nav || '',
      title: esc(meta.title),
      description: esc(meta.description),
      url: SITE_URL + '/' + (file === 'index.html' ? '' : file),
      scripts: (meta.scripts || []).map((s) => `<script src="assets/js/${s}" defer></script>`).join('\n  '),
      year: String(new Date().getFullYear()),
    };
    page.content = fill(raw.slice(m[0].length), ph, page);
    await writeFile(path.join(OUT, file), fill(layout, ph, page));
    urls.push(page.url);
  }

  const today = new Date().toISOString().slice(0, 10);
  await writeFile(
    path.join(OUT, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`)
      .join('\n')}\n</urlset>\n`
  );
  await writeFile(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);

  return files.length;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  build()
    .then((n) => console.log(`Built ${n} pages into dist/`))
    .catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
}
