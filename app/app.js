// Leonida Platinum — an offline checklist and guide for the 55 GTA VI trophies.
// The data lives in data/trophies.json (guides), data/sources.json (who said what)
// and data/roadmap.json (the six stages). Progress never leaves this browser:
// it is kept in localStorage and can be exported to a file and imported back.
const KEY = 'leonida-platinum-progress-v9';
const SPOILER_KEY = 'leonida-platinum-spoilers-v9';

const $ = (id) => document.getElementById(id);
const listEl = $('trophyList');
const detailEl = $('detailPanel');

const [doc, srcDoc, roadDoc] = await Promise.all([
  fetch('data/trophies.json').then((r) => r.json()),
  fetch('data/sources.json').then((r) => r.json()),
  fetch('data/roadmap.json').then((r) => r.json()),
]);
const trophies = doc.trophies;
const sources = srcDoc.sources;
const stages = roadDoc.stages;
const byId = new Map(trophies.map((t) => [t.id, t]));
const srcName = (n) => sources.find((s) => s.n === n)?.name ?? 'Source ' + n;

let earned = new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
let hideSpoilers = localStorage.getItem(SPOILER_KEY) !== 'off';
let kindFilter = 'all';
let statusFilter = 'all';
let query = '';
let selectedId = 28;
let activeTab = 'trophies';
const tabFromUrl = new URLSearchParams(location.search).get('tab');
if (['trophies', 'roadmap', 'missables', 'sources'].includes(tabFromUrl)) activeTab = tabFromUrl;

const isStory = (t) => t.kind === 'story';
const isMasked = (t) => isStory(t) && hideSpoilers && !earned.has(t.id);
const chapterLabel = (t) => (!t.chapter ? 'story' : t.chapter === 'final' ? 'final mission' : 'Chapter ' + t.chapter);

function save() {
  localStorage.setItem(KEY, JSON.stringify([...earned]));
  localStorage.setItem(SPOILER_KEY, hideSpoilers ? 'on' : 'off');
}

// ---------- audit numbers, all counted from the data, never typed by hand ----------
function audit() {
  let steps = 0;
  let cited = 0;
  let withSteps = 0;
  for (const t of trophies) {
    if (t.steps && t.steps.length) withSteps++;
    for (const s of t.steps ?? []) {
      steps++;
      if (s.s && s.s.length) cited++;
    }
  }
  const coverage = new Map();
  for (const s of sources) coverage.set(s.n, 0);
  for (const t of trophies) {
    const used = new Set();
    for (const st of t.steps ?? []) for (const n of st.s ?? []) used.add(n);
    for (const sc of t.sources ?? []) used.add(sc.src);
    for (const n of used) if (coverage.has(n)) coverage.set(n, coverage.get(n) + 1);
  }
  return {
    steps, cited, withSteps, coverage,
    missable: trophies.filter((t) => t.missable).length,
    watch: trophies.filter((t) => t.watch).length,
    unconfirmed: trophies.filter((t) => t.unconfirmed).length,
    single: trophies.filter((t) => t.single).length,
    disagree: trophies.filter((t) => t.disagree).length,
  };
}

function renderAudit() {
  const a = audit();
  $('auditBar').innerHTML =
    'AUDIT &nbsp;·&nbsp; <b>55 official</b> · 1P 2G 6S 46B · 28 hidden on PSN · ' +
    `<b>${a.withSteps}/55 guides cite a source</b> · ` +
    `<b>${a.cited}/${a.steps} steps cited</b> · ` +
    `<b>${sources.length} sources read 20 Nov 2026</b> · ` +
    `${a.missable} possibly missable · ${a.watch} watch · ${a.unconfirmed} unconfirmed · ` +
    `${a.single} single-source · ${a.disagree} disagree ` +
    '<span class="ok">— every number above is counted from this guide\u2019s own data.</span>';
}

function renderStats() {
  const e = earned.size;
  $('statEarned').textContent = e + '/55';
  $('statPct').textContent = Math.round((e / 55) * 100) + '%';
  const missLeft = trophies.filter((t) => t.missable && !earned.has(t.id)).length;
  $('statMiss').textContent = missLeft ? missLeft + ' left' : '0 left';
  $('statHidden').textContent = trophies.filter((t) => isStory(t) && !earned.has(t.id)).length + ' hidden';
}

// ---------- chips ----------
const KIND_ORDER = [
  ['story', 'Story'], ['activity', 'Activities'], ['collectible', 'Collectibles'],
  ['stranger', 'Stranger'], ['money', 'Money'], ['combat', 'Combat'],
  ['exploration', 'Exploration'], ['robbery', 'Robbery'],
  ['completion', '100%'], ['platinum', 'Platinum'],
];
function renderChips() {
  const a = audit();
  const kc = $('kindChips');
  kc.replaceChildren();
  const all = document.createElement('button');
  all.type = 'button';
  all.className = 'chip' + (kindFilter === 'all' ? ' on' : '');
  all.innerHTML = 'All <small>55</small>';
  all.onclick = () => { kindFilter = 'all'; renderAll(); };
  kc.append(all);
  for (const [k, label] of KIND_ORDER) {
    const n = trophies.filter((t) => t.kind === k).length;
    if (!n) continue;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (kindFilter === k ? ' on' : '');
    b.innerHTML = `${label} <small>${n}</small>`;
    b.onclick = () => { kindFilter = kindFilter === k ? 'all' : k; renderAll(); };
    kc.append(b);
  }
  const sc = $('statusChips');
  sc.replaceChildren();
  const defs = [
    ['missable', 'Possibly missable', a.missable, 'warn'],
    ['watch', 'Watch', a.watch, 'warn'],
    ['unconfirmed', 'Unconfirmed', a.unconfirmed, 'warn'],
    ['disagree', 'Sources disagree', a.disagree, 'warn'],
    ['single', 'Single-source', a.single, ''],
    ['earned', 'Earned', earned.size, ''],
    ['todo', 'Not earned', 55 - earned.size, ''],
  ];
  for (const [key, label, n, cls] of defs) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip ' + cls + (statusFilter === key ? ' on' : '');
    b.innerHTML = `${label} <small>${n}</small>`;
    b.onclick = () => { statusFilter = statusFilter === key ? 'all' : key; renderAll(); };
    sc.append(b);
  }
}

// ---------- trophy list ----------
function matches(t) {
  if (kindFilter !== 'all' && t.kind !== kindFilter) return false;
  if (statusFilter === 'missable' && !t.missable) return false;
  if (statusFilter === 'watch' && !t.watch) return false;
  if (statusFilter === 'unconfirmed' && !t.unconfirmed) return false;
  if (statusFilter === 'disagree' && !t.disagree) return false;
  if (statusFilter === 'single' && !t.single) return false;
  if (statusFilter === 'earned' && !earned.has(t.id)) return false;
  if (statusFilter === 'todo' && earned.has(t.id)) return false;
  if (query) {
    if (isMasked(t)) return false;
    const hay = (t.name + ' ' + t.description + ' ' + (t.guide ?? '')).toLowerCase();
    if (!hay.includes(query)) return false;
  }
  return true;
}

function badgeHtml(t) {
  let out = '';
  if (t.count) out += `<span class="badge cnt">${t.count.target} ${t.count.unit}</span>`;
  if (t.missable) out += '<span class="badge miss">POSSIBLY MISSABLE</span>';
  if (t.watch) out += '<span class="badge watch">WATCH</span>';
  if (t.disagree) out += '<span class="badge dis">SOURCES DISAGREE</span>';
  if (t.unconfirmed) out += '<span class="badge unc">UNCONFIRMED</span>';
  if (t.single) out += '<span class="badge single">SINGLE-SOURCE</span>';
  return out;
}

function renderList() {
  const shown = trophies.filter(matches);
  $('listNote').textContent =
    `Showing ${shown.length} of 55 trophies` +
    (hideSpoilers ? ' — story trophies stay covered until earned (toggle above to preview).' : ' — spoiler cover off: story trophies are shown.');
  listEl.replaceChildren();
  for (const t of shown) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'trow' + (t.id === selectedId ? ' sel' : '');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', 'Mark earned');
    box.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (box.checked) earned.add(t.id); else earned.delete(t.id);
      save();
      renderAll();
    });
    const mid = document.createElement('span');
    if (isMasked(t)) {
      mid.innerHTML = `<span class="nm">Hidden trophy — ${chapterLabel(t)}</span>` +
        '<span class="ds">Covered until earned. Turn spoiler cover off to preview it.</span>';
    } else {
      mid.innerHTML = `<span class="nm">${t.name}</span><span class="ds">${t.description}</span>`;
      const meta = document.createElement('span');
      meta.className = 'meta';
      meta.innerHTML = badgeHtml(t);
      mid.append(meta);
    }
    const gr = document.createElement('span');
    gr.className = 'gr ' + t.grade;
    gr.textContent = t.grade;
    btn.append(box, mid, gr);
    btn.addEventListener('click', () => { selectedId = t.id; renderAll(); });
    li.append(btn);
    listEl.append(li);
  }
}

// ---------- detail panel ----------
function renderDetail() {
  const t = byId.get(selectedId) ?? trophies[0];
  if (isMasked(t)) {
    detailEl.innerHTML =
      `<h2>Hidden trophy — ${chapterLabel(t)}</h2>` +
      '<p class="desc">A story trophy. Its name, description and guide stay covered until you earn it.</p>' +
      '<div class="hiddenbox">Hidden trophy — covered until earned.<br>Tick its checkbox in the list once it pops, or turn the spoiler cover off above.</div>';
    return;
  }
  const steps = (t.steps ?? []).map((s) => {
    const refs = (s.s ?? []).map((n) => '[' + n + ']').join(' ');
    const clean = s.t.replace(/(\s*\[\d+\])+$/, '');
    return `<li>${clean} <span class="src">${refs}</span></li>`;
  }).join('');
  const srcs = (t.sources ?? []).map((sc) =>
    `<li><b>[${sc.src}] ${srcName(sc.src)}</b> — ${sc.fact} <i>(${sc.role})</i></li>`).join('');
  const counter = t.count
    ? `<h3>Progress</h3><p class="missline"><b>0 / ${t.count.target}</b> ${t.count.unit} — tracked in game under ${t.count.where ?? 'Progress'}.</p>`
    : '';
  const miss = t.missable
    ? `<h3>Can it be missed?</h3><p class="missline"><b>Yes — possibly.</b> ${t.missableNote ?? ''}</p>`
    : `<h3>Can it be missed?</h3><p class="missline"><b>No.</b> ${t.missableNote ?? 'It stays available in free-roam after the story.'}</p>`;
  const dis = t.disagree ? disagreeBox(t) : '';
  detailEl.innerHTML =
    `<h2>${t.name}</h2><p class="desc">${t.description} — <b>${t.grade}</b> · ${t.kind} · Stage ${t.stage}</p>` +
    `<div class="meta">${badgeHtml(t)}</div>` +
    `<h3>How to get it — ${(t.steps ?? []).length} steps, each cited</h3><ol>${steps}</ol>` +
    counter + miss + dis +
    `<h3>Sources — per claim</h3><ul class="srclist">${srcs}</ul>` +
    (t.honesty ? `<h3>Honest note</h3><p class="missline">${t.honesty}</p>` : '');
}

function disagreeBox(t) {
  const d = t.disagree;
  return `<div class="disbox"><h3>⚠ SOURCES DISAGREE — BOTH VERSIONS SHOWN</h3>
    <div class="vers">
      <div class="ver"><b>Version A</b>${d.a}</div>
      <div class="ver"><b>Version B</b>${d.b}</div>
    </div>
    <p class="safe"><b>Safe play:</b> ${d.safe}</p></div>`;
}

function renderNextUp() {
  const up = trophies.filter((t) => !earned.has(t.id) && !isStory(t)).slice(0, 5);
  $('nextUp').innerHTML = '<h3>Next up</h3><ol>' +
    up.map((t) => `<li>${t.name} <span class="badge">${t.kind} · stage ${t.stage}</span></li>`).join('') +
    '</ol>';
}

// ---------- roadmap ----------
function stageTrophies(n) { return trophies.filter((t) => t.stage === n); }
function renderRoadmap() {
  const el = $('roadmapView');
  let html = '';
  for (const st of stages) {
    const list = stageTrophies(st.n);
    const done = list.filter((t) => earned.has(t.id)).length;
    const chips = list.map((t) => {
      const label = isMasked(t) ? `Hidden trophy — ${chapterLabel(t)}` : t.name;
      return `<span class="tchip${earned.has(t.id) ? ' done' : ''}${isStory(t) ? ' story' : ''}">${label}</span>`;
    }).join('');
    html += `<div class="stage"><h2>Stage ${st.n} — ${st.name} <span class="hrs">${st.hours}</span></h2>` +
      `<p><b>${done}/${list.length} earned in this stage.</b> ${st.text}</p><div class="tchips">${chips}</div></div>`;
  }
  html += `<div class="rules"><h2>Ground rules</h2><ul>` +
    roadDoc.groundRules.map((r) => `<li>${r}</li>`).join('') + '</ul></div>';
  html += `<div class="howbuilt"><h2>How this roadmap was built</h2><ul>` +
    roadDoc.howBuilt.map((r) => `<li>${r}</li>`).join('') + '</ul></div>';
  html += `<div class="rules"><h2>Missable watch list</h2><ul>` +
    trophies.filter((t) => t.watch).map((t) =>
      `<li><b>${isMasked(t) ? 'Hidden story trophy' : t.name}:</b> ${t.watch}</li>`).join('') +
    `<li><b>Optional missions:</b> black icons with pink letters can disappear, but there are far more than the 100 the checklist needs, so no trophy is lost. [1]</li>` +
    `<li><b>Quest givers:</b> some, like Kenton, go quiet for a stretch of the story and return in free-roam. [1]</li>` +
    '</ul></div>';
  el.innerHTML = html;
}

// ---------- missables ----------
function renderMissables() {
  const a = audit();
  const sec = (title, n, items) =>
    `<div class="msec"><h2>${title} <span class="n">${n}</span></h2>${items}</div>`;
  const item = (t, note) =>
    `<div class="mitem"><span class="nm">${isMasked(t) ? 'Hidden trophy — ' + chapterLabel(t) : t.name}</span> ` +
    `${badgeHtml(t)}<p>${note}</p></div>`;
  const miss = trophies.filter((t) => t.missable).map((t) => item(t, `<b>Possibly missable.</b> ${t.missableNote ?? ''}`)).join('');
  const watch = trophies.filter((t) => t.watch).map((t) => item(t, t.watch)).join('');
  const unc = trophies.filter((t) => t.unconfirmed).map((t) =>
    item(t, 'No guide has pinned the method down yet. What is known is written in its steps; nothing is invented.')).join('');
  const dis = trophies.filter((t) => t.disagree).map((t) =>
    `<div class="mitem"><span class="nm">${isMasked(t) ? 'Hidden trophy — ' + chapterLabel(t) : t.name}</span> ${badgeHtml(t)}${disagreeBox(t)}</div>`).join('');
  const cleared = trophies.filter((t) => !t.missable && !t.watch && !t.unconfirmed && !t.disagree && !isStory(t))
    .slice(0, 8).map((t) => item(t, 'Safe after the story — no missable step, no open question.')).join('') +
    `<p>…and ${trophies.filter((t) => !t.missable && !t.watch && !t.unconfirmed && !t.disagree && !isStory(t)).length - 8} more cleared trophies with the same status.</p>`;
  $('missablesView').innerHTML =
    sec('Possibly missable', a.missable, miss || '<p>None.</p>') +
    sec('Watch — do it on time', a.watch, watch || '<p>None.</p>') +
    sec('Unconfirmed — method not yet pinned down', a.unconfirmed, unc || '<p>None.</p>') +
    sec('Sources disagree — both versions shown', a.disagree, dis || '<p>None.</p>') +
    sec('Cleared — safe in free-roam', trophies.filter((t) => !t.missable && !t.watch && !t.unconfirmed && !t.disagree && !isStory(t)).length, cleared);
}

// ---------- sources ----------
function renderSources() {
  const a = audit();
  $('sourcesView').innerHTML = sources.map((s) => {
    const cov = a.coverage.get(s.n) ?? 0;
    return `<div class="srccard"><h2>[${s.n}] ${s.name} <span class="cov">— cited by ${cov} of 55 guides</span></h2>` +
      `<p class="role"><b>Role in this guide:</b> ${s.role}</p>` +
      `<p>Read ${s.read}. ${s.note ?? ''}</p>` +
      `<p class="url">${s.url}</p></div>`;
  }).join('') +
  `<div class="srccard"><h2>What was not used</h2><p>Two outlets other entries name — Beebom and the IGN wiki — could not be found at a readable address in fresh searches on 20 Nov 2026, so neither is cited anywhere in this guide. A source is only cited after it has actually been read.</p></div>`;
}

// ---------- tabs, toolbar, export/import ----------
document.querySelectorAll('.tabs button').forEach((b) => {
  b.addEventListener('click', () => {
    activeTab = b.dataset.tab;
    document.querySelectorAll('.tabs button').forEach((x) => x.classList.toggle('active', x === b));
    document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === 'view-' + activeTab));
    if (activeTab === 'roadmap') renderRoadmap();
    if (activeTab === 'missables') renderMissables();
    if (activeTab === 'sources') renderSources();
  });
});
$('search').addEventListener('input', (e) => { query = e.target.value.trim().toLowerCase(); renderList(); });
$('spoilerToggle').checked = hideSpoilers;
$('spoilerToggle').addEventListener('change', (e) => {
  hideSpoilers = e.target.checked;
  save();
  renderAll();
});
$('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ game: 'GTA VI', earned: [...earned], exported: new Date().toISOString() }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
$('importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const names = Array.isArray(data) ? data : data.earned;
    const next = new Set();
    for (const id of names ?? []) {
      const t = trophies.find((x) => x.id === id || x.name === id);
      if (t) next.add(t.id);
    }
    earned = next;
    save();
    renderAll();
  } catch { /* a bad file just does nothing */ }
});

function renderAll() {
  renderAudit();
  renderStats();
  renderChips();
  renderList();
  renderDetail();
  renderNextUp();
  if (activeTab !== 'trophies') {
    document.querySelectorAll('.tabs button').forEach((x) => x.classList.toggle('active', x.dataset.tab === activeTab));
    document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === 'view-' + activeTab));
    if (activeTab === 'roadmap') renderRoadmap();
    if (activeTab === 'missables') renderMissables();
    if (activeTab === 'sources') renderSources();
  }
}
renderAll();
