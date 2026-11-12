'use strict';

/* Kaiken Alku — a personal space with a diary, calendar, to-do list, goals and dreams.
   Everything is stored in this browser only (localStorage). */

/* ---------- Storage ---------- */

const PREFIX = 'grove.'; // storage key from the app's first name — kept so saved data isn't lost
const DEFAULTS = { diary: [], events: [], todos: [], goals: [], dreams: [], topics: [], notes: [], settings: { name: '' } };
const KEYS = Object.keys(DEFAULTS);
const clone = v => JSON.parse(JSON.stringify(v));

function load(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw) {
      const val = JSON.parse(raw);
      const ok = Array.isArray(DEFAULTS[key]) ? Array.isArray(val) : val && typeof val === 'object';
      if (ok) return val;
    }
  } catch (_) { /* fall through to defaults */ }
  return clone(DEFAULTS[key]);
}

const db = Object.fromEntries(KEYS.map(k => [k, load(k)]));

function save(key) {
  try { localStorage.setItem(PREFIX + key, JSON.stringify(db[key])); }
  catch (_) { toast('Could not save — storage may be full'); }
}

const find = (key, id) => db[key].find(x => x.id === id);

/* ---------- Helpers ---------- */

function pad(n) { return String(n).padStart(2, '0'); }
function isoDate(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function today() { return isoDate(new Date()); }
function parseISO(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
function fmt(s, opts) { return parseISO(s).toLocaleDateString('fi-FI', opts); }
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function addDays(s, n) { const d = parseISO(s); d.setDate(d.getDate() + n); return isoDate(d); }
function relDay(s) {
  const t = today();
  if (s === t) return 'Tänään';
  if (s === addDays(t, -1)) return 'Eilen';
  if (s === addDays(t, 1)) return 'Huomenna';
  const [y, m, d] = s.split('-').map(Number);
  return s.slice(0, 4) === t.slice(0, 4) ? `${d}.${m}.` : `${d}.${m}.${y}`;
}
function longDay(s) {
  const base = fmt(s, { weekday: 'long', day: 'numeric', month: 'long' });
  const r = relDay(s);
  return ['Tänään', 'Eilen', 'Huomenna'].includes(r) ? `${r} · ${base}` : base;
}
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function plural(n, one, many) { return `${n} ${n === 1 ? one : many}`; }
const byDateDesc = (a, b) => b.date.localeCompare(a.date) || (b.created || 0) - (a.created || 0);

/* ---------- Icons ---------- */

const ICONS = {
  back: '<path d="M15 5l-7 7 7 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  arrow: '<path d="M7 17L17 7M9 7h8v8"/>',
  chevL: '<path d="M15 6l-6 6 6 6"/>',
  chevR: '<path d="M9 6l6 6-6 6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',
  sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  diary: '<path d="M6 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V5a1 1 0 0 1 1-1z"/><path d="M5 18a2 2 0 0 1 2-2h12M9 8h6"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  todo: '<rect x="4" y="4" width="16" height="16" rx="4.5"/><path d="M8.5 12.2l2.4 2.4 4.6-4.8"/>',
  goals: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8" fill="currentColor"/>',
  dreams: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 7 7 0 0 0 20 14.5z"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  pin: '<path d="M9 4h6l-1 5.5 3 2.5v2H7v-2l3-2.5z"/><path d="M12 14v6"/>',
  note: '<path d="M7 3.5h7.5L19 8v12.5H7a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2z"/><path d="M14 3.5V8h5M9 12.5h6M9 16h4"/>',
  // topic icons
  idea: '<path d="M9.5 17.5h5M10.5 20.5h3"/><path d="M12 3.5a5.8 5.8 0 0 0-3.4 10.5c.6.5.9 1.1.9 1.9v1.6h5v-1.6c0-.8.3-1.4.9-1.9A5.8 5.8 0 0 0 12 3.5z"/>',
  school: '<path d="M2.5 9.5L12 5l9.5 4.5L12 14z"/><path d="M6.5 11.6V16c0 1.4 2.5 3 5.5 3s5.5-1.6 5.5-3v-4.4M21.5 9.5v5"/>',
  work: '<rect x="3.5" y="7.5" width="17" height="12" rx="2.5"/><path d="M9 7.5v-2A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5v2M3.5 12.5h17"/>',
  music: '<path d="M9 18V5.5l11-2V16"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
  home: '<path d="M4 11l8-6.5 8 6.5V20H4z"/><path d="M10 20v-5h4v5"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.6 3.5 5.4 3.5 8.5s-1.1 5.9-3.5 8.5c-2.4-2.6-3.5-5.4-3.5-8.5s1.1-5.9 3.5-8.5z"/>',
  sport: '<path d="M6.5 7.5v9M17.5 7.5v9M3.5 10v4M20.5 10v4M6.5 12h11"/>',
  film: '<rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M7.5 5v14M16.5 5v14M3.5 9.5h4M3.5 14.5h4M16.5 9.5h4M16.5 14.5h4"/>',
  food: '<path d="M7 3.5v6a2 2 0 0 0 2 2v9M11 3.5v6a2 2 0 0 1-2 2M9 3.5v5M17 20.5v-17c-2 1-3.5 3.5-3.5 7 0 1.6.8 2.5 3.5 2.5"/>',
  money: '<path d="M4 7.5h14.5A1.5 1.5 0 0 1 20 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z"/><path d="M4 7.5V6a1.5 1.5 0 0 1 1.5-1.5H16v3M15.5 13.5H17"/>',
  code: '<path d="M8.5 7.5L4 12l4.5 4.5M15.5 7.5L20 12l-4.5 4.5M13.5 5l-3 14"/>',
  leaf: '<path d="M5 19C5 10 10 5 19.5 4.5 19 14 14 19 5 19z"/><path d="M5 19l8-8"/>',
  camera: '<path d="M4 8h3.5L9 5.5h6L16.5 8H20v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  chat: '<path d="M4.5 5.5h15v10h-8L7 19v-3.5H4.5z"/>',
};
function icon(name, cls = '') {
  return `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}

/* ---------- Sections ---------- */

const SECTIONS = [
  { id: 'diary', title: 'Päiväkirja', icon: 'diary', accent: 'tan', wide: true },
  { id: 'calendar', title: 'Kalenteri', icon: 'calendar', accent: 'forest' },
  { id: 'todo', title: 'Tehtävät', icon: 'todo', accent: 'moss' },
  { id: 'goals', title: 'Tavoitteet', icon: 'goals', accent: 'bark' },
  { id: 'dreams', title: 'Haaveet', icon: 'dreams', accent: 'sage' },
  { id: 'notes', title: 'Muistiinpanot', icon: 'note', accent: 'rust', wide: true },
];
const sec = id => SECTIONS.find(s => s.id === id);

const MOODS = ['Rauhallinen', 'Iloinen', 'Kiitollinen', 'Innostunut', 'Väsynyt', 'Alakuloinen'];
const AREAS = ['Terveys', 'Mieli', 'Ura', 'Raha', 'Oppiminen', 'Ihmissuhteet', 'Koti', 'Muu'];
const DREAM_CATS = ['Matkat', 'Seikkailut', 'Luominen', 'Oppiminen', 'Hankinnat', 'Kasvu', 'Antaminen', 'Muu'];

// Entries saved before the app was in Finnish: translate their mood / area / kind.
(() => {
  const FI = {
    Calm: 'Rauhallinen', Happy: 'Iloinen', Grateful: 'Kiitollinen', Inspired: 'Innostunut', Tired: 'Väsynyt', Low: 'Alakuloinen',
    Health: 'Terveys', Mind: 'Mieli', Career: 'Ura', Money: 'Raha', Learning: 'Oppiminen', Relationships: 'Ihmissuhteet', Home: 'Koti',
    Other: 'Muu', Travel: 'Matkat', Adventure: 'Seikkailut', Create: 'Luominen', Learn: 'Oppiminen', Own: 'Hankinnat', Become: 'Kasvu', Give: 'Antaminen',
  };
  const fix = (key, prop) => {
    let changed = false;
    db[key].forEach(x => { if (FI[x[prop]]) { x[prop] = FI[x[prop]]; changed = true; } });
    if (changed) save(key);
  };
  fix('diary', 'mood'); fix('goals', 'area'); fix('dreams', 'category');
})();

const now = new Date();
const ui = {
  view: 'lobby',
  diaryQuery: '',
  calY: now.getFullYear(),
  calM: now.getMonth(),
  calSel: today(),
  todoFilter: 'open',
  goalOpen: null,
  dreamFilter: 'Dreaming',
  topic: null,
  notesQuery: '',
};

/* ---------- Shared pieces ---------- */

function head(id, right = '') {
  const s = sec(id);
  return `<header class="topbar">
      <a href="#/" class="back">${icon('back')}<span>Etusivu</span></a>${right}
    </header>
    <div class="title-row acc-${s.accent}"><span class="t-ic">${icon(s.icon)}</span><h1>${s.title}</h1></div>`;
}
function addBtn(action, label) {
  return `<button class="add-btn" data-action="${action}" aria-label="${label}">${icon('plus')}</button>`;
}
function empty(id, text, label, action) {
  const s = sec(id);
  return `<div class="empty acc-${s.accent}"><span class="t-ic big">${icon(s.icon)}</span><p>${text}</p>
    ${label ? `<button class="btn solid" data-action="${action}">${icon('plus')}${label}</button>` : ''}</div>`;
}
function seg(action, options, current) {
  return `<div class="seg" role="tablist">${options.map(([v, l]) =>
    `<button role="tab" aria-selected="${v === current}" class="${v === current ? 'on' : ''}" data-action="${action}" data-f="${v}">${l}</button>`
  ).join('')}</div>`;
}

/* ---------- Lobby ---------- */

const STATS = {
  diary() {
    const n = db.diary.length;
    if (!n) return 'Kirjoita ensimmäinen sivu';
    const last = db.diary.reduce((a, b) => (b.date > a.date ? b : a));
    return `${plural(n, 'merkintä', 'merkintää')} · viimeisin ${relDay(last.date).toLowerCase()}`;
  },
  calendar() {
    const t = today();
    const up = db.events.filter(e => e.date >= t)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '99').localeCompare(b.time || '99'));
    if (!up.length) return 'Ei suunnitelmia';
    const e = up[0];
    return `Seuraava: ${relDay(e.date)}${e.time ? ' ' + e.time : ''} · ${e.title}`;
  },
  todo() {
    const open = db.todos.filter(x => !x.done);
    if (!open.length) return db.todos.length ? 'Kaikki tehty' : 'Ei vielä tehtäviä';
    const late = open.filter(isLate).length;
    const next = open.filter(x => x.urgent && x.time && !isLate(x)).sort((a, b) => taskKey(a).localeCompare(taskKey(b)))[0];
    return `${open.length} avoinna${late ? ` · ${late} myöhässä` : ''}${next ? ` · seuraava ${next.due === today() ? '' : relDay(next.due).toLowerCase() + ' '}${next.time}` : ''}`;
  },
  goals() {
    if (!db.goals.length) return 'Aseta ensimmäinen tavoite';
    const done = db.goals.filter(g => g.done).length;
    return `${db.goals.length - done} käynnissä · ${done} saavutettu`;
  },
  dreams() {
    if (!db.dreams.length) return 'Mistä haaveilet?';
    const lived = db.dreams.filter(d => d.status === 'Lived').length;
    return `${plural(db.dreams.length, 'haave', 'haavetta')} · ${lived} toteutunut`;
  },
  notes() {
    if (!db.topics.length) return 'Luo ensimmäinen aihe';
    return `${plural(db.notes.length, 'muistiinpano', 'muistiinpanoa')} · ${plural(db.topics.length, 'aihe', 'aihetta')}`;
  },
};

/* ---------- Clock ---------- */

const ZONES = [
  ['Pacific/Honolulu', 'Honolulu'], ['America/Los_Angeles', 'Los Angeles'], ['America/Denver', 'Denver'],
  ['America/Chicago', 'Chicago'], ['America/New_York', 'New York'], ['America/Toronto', 'Toronto'],
  ['America/Mexico_City', 'México'], ['America/Sao_Paulo', 'São Paulo'], ['Atlantic/Reykjavik', 'Reykjavík'],
  ['Europe/London', 'Lontoo'], ['Europe/Lisbon', 'Lissabon'], ['Europe/Paris', 'Pariisi'], ['Europe/Berlin', 'Berliini'],
  ['Europe/Madrid', 'Madrid'], ['Europe/Rome', 'Rooma'], ['Europe/Amsterdam', 'Amsterdam'], ['Europe/Stockholm', 'Tukholma'],
  ['Europe/Oslo', 'Oslo'], ['Europe/Copenhagen', 'Kööpenhamina'], ['Europe/Helsinki', 'Helsinki'], ['Europe/Tallinn', 'Tallinna'],
  ['Europe/Athens', 'Ateena'], ['Europe/Istanbul', 'Istanbul'], ['Europe/Moscow', 'Moskova'], ['Africa/Cairo', 'Kairo'],
  ['Africa/Johannesburg', 'Johannesburg'], ['Asia/Dubai', 'Dubai'], ['Asia/Kolkata', 'Intia'], ['Asia/Bangkok', 'Bangkok'],
  ['Asia/Singapore', 'Singapore'], ['Asia/Shanghai', 'Peking'], ['Asia/Hong_Kong', 'Hongkong'], ['Asia/Tokyo', 'Tokio'],
  ['Asia/Seoul', 'Soul'], ['Australia/Sydney', 'Sydney'], ['Pacific/Auckland', 'Auckland'],
];
const ZONE_OPTIONS = [['', 'Pois päältä'], ...ZONES];
const DEFAULT_ZONES = ['America/New_York', 'Asia/Tokyo'];

function zones() {
  const z = Array.isArray(db.settings.zones) ? db.settings.zones : DEFAULT_ZONES;
  return [z[0] ?? '', z[1] ?? ''];
}
function zoneCity(tz) {
  const known = ZONES.find(([id]) => id === tz);
  return known ? known[1] : (tz.split('/').pop() || tz).replace(/_/g, ' ');
}
const localZone = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (_) { return ''; } })();

// Minutes ahead of UTC for a time zone at a given moment.
function utcOffset(tz, d) {
  if (!tz) return -d.getTimezoneOffset();
  const p = {};
  new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric',
  }).formatToParts(d).forEach(x => { p[x.type] = x.value; });
  const asUTC = Date.UTC(+p.year, p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  return Math.round((asUTC - Math.floor(d.getTime() / 1000) * 1000) / 60000);
}
function fmtOffset(min, unit) {
  const sign = min < 0 ? '−' : '+';
  const a = Math.abs(min), h = Math.floor(a / 60), m = a % 60;
  return `${sign}${h}${m ? ':' + pad(m) : ''}${unit}`;
}
function timeIn(tz, d) {
  const o = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
  if (tz) o.timeZone = tz;
  return d.toLocaleTimeString('en-GB', o);
}
function dayIn(tz, d) {
  const o = { year: 'numeric', month: '2-digit', day: '2-digit' };
  if (tz) o.timeZone = tz;
  return d.toLocaleDateString('en-CA', o); // YYYY-MM-DD
}

function clockCard() {
  const d = new Date();
  const own = localZone ? zoneCity(localZone) : 'Paikallinen aika';
  const extra = zones().filter(Boolean);
  return `<section class="clock acc-forest" aria-label="Kello">
    <div class="clock-main">
      <div class="clock-time"><span data-clock-time="">${timeIn('', d)}</span><span class="clock-sec" data-clock-sec>${pad(d.getSeconds())}</span></div>
      <div class="clock-label">${esc(own)} · <span data-clock-utc>UTC${fmtOffset(utcOffset('', d), '')}</span></div>
    </div>
    ${extra.length ? `<div class="clock-zones">${extra.map(tz => `
      <div class="zone">
        <span class="z-city">${esc(zoneCity(tz))}</span>
        <span class="z-time" data-clock-time="${esc(tz)}">${timeIn(tz, d)}</span>
        <span class="z-diff" data-clock-diff="${esc(tz)}">${zoneDiff(tz, d)}</span>
      </div>`).join('')}</div>` : ''}
  </section>`;
}

function zoneDiff(tz, d) {
  const diff = utcOffset(tz, d) - utcOffset('', d);
  const local = dayIn('', d), there = dayIn(tz, d);
  const day = there > local ? ' · huomenna' : there < local ? ' · eilen' : '';
  return (diff === 0 ? 'Sama aika' : fmtOffset(diff, 'h')) + day;
}

function tickClock() {
  if (ui.view !== 'lobby' || document.hidden) return;
  const d = new Date();
  app.querySelectorAll('[data-clock-time]').forEach(el => {
    const t = timeIn(el.dataset.clockTime, d);
    if (el.textContent !== t) el.textContent = t;
  });
  const sec = app.querySelector('[data-clock-sec]');
  if (sec) sec.textContent = pad(d.getSeconds());
  if (d.getSeconds() === 0) {
    app.querySelectorAll('[data-clock-diff]').forEach(el => { el.textContent = zoneDiff(el.dataset.clockDiff, d); });
    const utc = app.querySelector('[data-clock-utc]');
    if (utc) utc.textContent = `UTC${fmtOffset(utcOffset('', d), '')}`;
  }
}
setInterval(tickClock, 1000);

function lobby() {
  const t = today();
  const h = new Date().getHours();
  const greet = h < 5 ? 'Hyvää yötä' : h < 10 ? 'Hyvää huomenta' : h < 18 ? 'Hyvää päivää' : h < 23 ? 'Hyvää iltaa' : 'Hyvää yötä';
  const name = (db.settings.name || '').trim();
  const evToday = db.events.filter(e => e.date === t).length;
  const due = db.todos.filter(x => !x.done && x.due && (x.due <= t || isLate(x))).length;
  const wrote = db.diary.some(e => e.date === t);

  return `
  <header class="lobby-head">
    <div class="lobby-top">
      <p class="eyebrow">${fmt(t, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      <button class="icon-btn" data-action="settings" aria-label="Asetukset">${icon('sliders')}</button>
    </div>
    <h1 class="greet">${greet}${name ? `,<br><em>${esc(name)}</em>` : '<em>.</em>'}</h1>
    ${clockCard()}
    <div class="today-strip">
      <a class="pill" href="#/calendar" data-action="cal-today-go"><b>${evToday}</b>${evToday === 1 ? 'tapahtuma' : 'tapahtumaa'} tänään</a>
      <a class="pill" href="#/todo"><b>${due}</b>${due === 1 ? 'tehtävä odottaa' : 'tehtävää odottaa'}</a>
      <a class="pill" href="#/diary"><span class="dot${wrote ? ' ok' : ''}"></span>${wrote ? 'Kirjoitit tänään' : 'Ei merkintää tänään'}</a>
    </div>
  </header>
  <nav class="tiles" aria-label="Osiot">
    ${SECTIONS.map((s, i) => `
    <a class="tile acc-${s.accent}${s.wide ? ' wide' : ''}" href="#/${s.id}">
      <span class="t-ic">${icon(s.icon)}</span>
      <span class="go">${icon('arrow')}</span>
      <span class="t-txt"><h2>${s.title}</h2><p>${esc(STATS[s.id]())}</p></span>
    </a>`).join('')}
  </nav>
  <p class="foot">Kaiken Alku · kaikki tiedot pysyvät tällä laitteella</p>`;
}

/* ---------- Diary ---------- */

function diary() {
  return head('diary', addBtn('new-diary', 'Uusi merkintä')) +
    (db.diary.length ? `<label class="search">${icon('search')}<input id="diary-q" type="search" placeholder="Hae merkinnöistä" value="${esc(ui.diaryQuery)}" autocomplete="off" aria-label="Hae päiväkirjasta"></label>` : '') +
    `<div id="diary-list">${diaryList()}</div>`;
}

function diaryList() {
  if (!db.diary.length) return empty('diary', 'Ensimmäinen sivu odottaa.', 'Kirjoita tänään', 'new-diary');
  const q = ui.diaryQuery.trim().toLowerCase();
  const list = [...db.diary].sort(byDateDesc)
    .filter(e => !q || `${e.title} ${e.text} ${e.mood}`.toLowerCase().includes(q));
  if (!list.length) return `<p class="muted center pad">Haulla “${esc(q)}” ei löytynyt merkintöjä.</p>`;

  let out = '', month = '';
  for (const e of list) {
    const m = e.date.slice(0, 7);
    if (m !== month) {
      if (month) out += '</ul>';
      month = m;
      out += `<h3 class="group">${fmt(e.date, { month: 'long', year: 'numeric' })}</h3><ul class="entries">`;
    }
    out += `<li><button class="entry" data-action="edit-diary" data-id="${e.id}">
      <span class="e-date"><b>${parseISO(e.date).getDate()}</b><small>${fmt(e.date, { weekday: 'short' })}</small></span>
      <span class="e-body">
        <span class="e-top"><span class="e-title">${esc(e.title || 'Nimetön')}</span>${e.mood ? `<span class="tag">${esc(e.mood)}</span>` : ''}</span>
        ${e.text ? `<span class="e-text">${esc(e.text)}</span>` : ''}
      </span></button></li>`;
  }
  return out + '</ul>';
}

function diarySheet(entry) {
  const isNew = !entry;
  openSheet({
    title: isNew ? 'Uusi merkintä' : 'Merkintä',
    values: entry || { date: today() },
    fields: [
      { name: 'date', label: 'Päivämäärä', type: 'date', required: true },
      { name: 'title', label: 'Otsikko', placeholder: 'Muutama sana päivästä' },
      { name: 'mood', label: 'Mieliala', type: 'chips', options: MOODS },
      { name: 'text', label: 'Merkintä', type: 'textarea', rows: 12, placeholder: 'Kirjoita vapaasti…' },
    ],
    onSave(v) {
      if (!v.title && !v.text) { toast('Kirjoita ensin jotain'); return false; }
      if (isNew) db.diary.push({ id: uid(), created: Date.now(), ...v });
      else Object.assign(entry, v, { updated: Date.now() });
      save('diary'); render();
    },
    onDelete: isNew ? null : () => {
      if (!confirm('Poistetaanko tämä merkintä?')) return false;
      db.diary = db.diary.filter(x => x !== entry); save('diary'); render();
    },
  });
}

/* ---------- Calendar ---------- */

function calendar() {
  const { calY: y, calM: m, calSel: sel } = ui;
  const t = today();
  const first = new Date(y, m, 1);
  const offset = (first.getDay() + 6) % 7; // weeks start on Monday
  const days = new Date(y, m + 1, 0).getDate();
  const ev = new Set(db.events.map(e => e.date));
  const td = new Set(db.todos.filter(x => !x.done && x.due).map(x => x.due));
  const di = new Set(db.diary.map(e => e.date));

  let cells = '';
  for (let i = 0; i < offset; i++) cells += '<span class="day blank"></span>';
  for (let d = 1; d <= days; d++) {
    const iso = `${y}-${pad(m + 1)}-${pad(d)}`;
    cells += `<button class="day${iso === t ? ' today' : ''}${iso === sel ? ' sel' : ''}" data-action="pick-day" data-date="${iso}" aria-label="${fmt(iso, { day: 'numeric', month: 'long' })}">
      <span class="n">${d}</span>
      <span class="dots">${ev.has(iso) ? '<i class="d-ev"></i>' : ''}${td.has(iso) ? '<i class="d-td"></i>' : ''}${di.has(iso) ? '<i class="d-di"></i>' : ''}</span>
    </button>`;
  }
  const showToday = sel !== t || y !== new Date().getFullYear() || m !== new Date().getMonth();

  return head('calendar', addBtn('new-event', 'Uusi tapahtuma')) + `
  <section class="cal">
    <div class="cal-nav">
      <button class="icon-btn" data-action="cal-prev" aria-label="Edellinen kuukausi">${icon('chevL')}</button>
      <h2>${cap(first.toLocaleDateString('fi-FI', { month: 'long', year: 'numeric' }))}</h2>
      <button class="icon-btn" data-action="cal-next" aria-label="Seuraava kuukausi">${icon('chevR')}</button>
    </div>
    <div class="wk">${['ma', 'ti', 'ke', 'to', 'pe', 'la', 'su'].map(w => `<span>${w}</span>`).join('')}</div>
    <div class="grid">${cells}</div>
    <div class="legend">
      <span><i class="d-ev"></i>Tapahtuma</span><span><i class="d-td"></i>Tehtävä</span><span><i class="d-di"></i>Päiväkirja</span>
      ${showToday ? '<button class="link" data-action="cal-today">Tänään</button>' : ''}
    </div>
  </section>
  <section class="agenda">${agenda(sel)}</section>`;
}

function agenda(d) {
  const evs = db.events.filter(e => e.date === d).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const tasks = db.todos.filter(x => x.due === d).sort((a, b) => taskKey(a).localeCompare(taskKey(b)));
  const pages = db.diary.filter(e => e.date === d);
  let html = `<h3 class="agenda-h">${longDay(d)}</h3>`;
  if (!evs.length && !tasks.length && !pages.length) {
    return html + `<div class="empty-sm"><p>Ei mitään tälle päivälle.</p><button class="btn ghost" data-action="new-event">${icon('plus')}Lisää tapahtuma</button></div>`;
  }
  html += '<ul class="agenda-list">';
  for (const e of evs) {
    html += `<li><button class="ag-item" data-action="edit-event" data-id="${e.id}">
      <span class="ag-time">${e.time || 'Koko päivä'}</span>
      <span class="ag-main"><span class="ag-title">${esc(e.title)}</span>${e.note ? `<span class="ag-note">${esc(e.note)}</span>` : ''}</span>
    </button></li>`;
  }
  for (const x of tasks) {
    html += `<li class="ag-task${x.done ? ' done' : ''}">
      <button class="check" data-action="toggle-todo" data-id="${x.id}" aria-label="${x.done ? 'Merkitse tekemättömäksi' : 'Merkitse tehdyksi'}">${icon('check')}</button>
      <button class="ag-main" data-action="edit-todo" data-id="${x.id}"><span class="ag-kicker">${x.urgent ? 'Aikasidonnainen' : 'Tehtävä'}${x.time ? ' · ' + x.time : ''}</span><span class="ag-title">${esc(x.title)}</span></button>
    </li>`;
  }
  for (const e of pages) {
    html += `<li><button class="ag-item" data-action="edit-diary" data-id="${e.id}">
      <span class="ag-time diary">Päiväkirja</span>
      <span class="ag-main"><span class="ag-title">${esc(e.title || 'Nimetön')}</span>${e.text ? `<span class="ag-note clamp">${esc(e.text)}</span>` : ''}</span>
    </button></li>`;
  }
  return html + '</ul>';
}

function eventSheet(ev) {
  const isNew = !ev;
  openSheet({
    title: isNew ? 'Uusi tapahtuma' : 'Tapahtuma',
    values: ev || { date: ui.calSel },
    fields: [
      { name: 'title', label: 'Otsikko', required: true, placeholder: 'Mitä tapahtuu?' },
      { name: 'date', label: 'Päivämäärä', type: 'date', required: true },
      { name: 'time', label: 'Kellonaika (valinnainen)', type: 'time' },
      { name: 'note', label: 'Muistiinpano', type: 'textarea', rows: 3, placeholder: 'Paikka, ihmiset, yksityiskohdat…' },
    ],
    onSave(v) {
      if (isNew) db.events.push({ id: uid(), created: Date.now(), ...v });
      else Object.assign(ev, v);
      save('events');
      ui.calSel = v.date;
      const d = parseISO(v.date); ui.calY = d.getFullYear(); ui.calM = d.getMonth();
      render();
    },
    onDelete: isNew ? null : () => {
      if (!confirm('Poistetaanko tämä tapahtuma?')) return false;
      db.events = db.events.filter(x => x !== ev); save('events'); render();
    },
  });
}

function shiftMonth(n) {
  const d = new Date(ui.calY, ui.calM + n, 1);
  ui.calY = d.getFullYear(); ui.calM = d.getMonth();
  const t = new Date();
  ui.calSel = (ui.calY === t.getFullYear() && ui.calM === t.getMonth()) ? today() : isoDate(d);
  render();
}

/* ---------- To-do ---------- */

const REMINDERS = [['', 'Ei'], ['0', 'Ajallaan'], ['5', '5 min ennen'], ['15', '15 min ennen'], ['60', '1 tunti ennen'], ['1440', '1 päivä ennen']];
const remindLabel = r => (REMINDERS.find(([v]) => v === String(r ?? '')) || REMINDERS[0])[1];
const taskKey = t => (t.due || '9999-99-99') + 'T' + (t.time || '99:99');

function dueMs(t) {
  if (!t.due) return null;
  const d = parseISO(t.due);
  if (t.time) { const [h, m] = t.time.split(':').map(Number); d.setHours(h, m, 0, 0); }
  else d.setHours(23, 59, 59, 0);
  return d.getTime();
}
function isLate(t) { const ms = dueMs(t); return !t.done && ms !== null && ms < Date.now(); }

function todo() {
  const total = db.todos.length;
  const done = db.todos.filter(x => x.done).length;
  const f = ui.todoFilter;
  const byDue = (a, b) => taskKey(a).localeCompare(taskKey(b)) || a.created - b.created;
  const closed = (a, b) => (b.doneAt || 0) - (a.doneAt || 0);
  const openTasks = db.todos.filter(x => !x.done);
  const urgent = openTasks.filter(x => x.urgent).sort(byDue);
  const normal = openTasks.filter(x => !x.urgent).sort(byDue);
  const finished = db.todos.filter(x => x.done).sort(closed);

  const group = (title, items) => items.length ? `${title ? `<h3 class="group">${title}</h3>` : ''}<ul class="tasks">${items.map(taskRow).join('')}</ul>` : '';
  let body = '';
  if (f !== 'done') {
    body += urgent.length ? group(`${icon('clock')}Aikasidonnaiset`, urgent) + group(normal.length ? 'Muut tehtävät' : '', normal) : group('', normal);
  }
  if (f === 'done') body += group('', finished);
  if (f === 'all' && finished.length) body += group('Tehdyt', finished);

  const emptyMsg = !total ? empty('todo', 'Ei vielä tehtäviä. Lisää tehtävä yllä — kellosta saat aikasidonnaisen tehtävän.')
    : f === 'open' ? `<p class="muted center pad">Kaikki tehty. Nauti!</p>`
    : `<p class="muted center pad">Ei vielä tehtyjä tehtäviä.</p>`;

  return head('todo') + `
  <form class="quick-add" data-form="add-todo">
    <input class="inp" id="todo-input" name="task" placeholder="Lisää tehtävä…" autocomplete="off" enterkeyhint="done" aria-label="Uusi tehtävä">
    <button type="button" class="add-btn alt" data-action="new-timed" aria-label="Lisää aikasidonnainen tehtävä">${icon('clock')}</button>
    <button class="add-btn" aria-label="Lisää tehtävä">${icon('plus')}</button>
  </form>
  ${total ? `<div class="progress"><div class="progress-txt"><span>${done}/${total} tehty</span><span>${Math.round(done / total * 100)}%</span></div>
    <span class="meter"><i style="width:${done / total * 100}%"></i></span></div>
    ${seg('todo-filter', [['open', 'Avoimet'], ['done', 'Tehdyt'], ['all', 'Kaikki']], f)}` : ''}
  ${body || emptyMsg}
  ${done && f !== 'open' ? '<button class="link block" data-action="clear-done">Poista tehdyt</button>' : ''}`;
}

function taskRow(x) {
  const late = isLate(x);
  const when = x.due ? `${relDay(x.due)}${x.time ? ' · ' + x.time : ''}` : '';
  const meta = [
    when ? `<span class="${late ? 'late' : x.urgent ? 'soon' : ''}">${late ? 'Myöhässä · ' : ''}${when}</span>` : '',
    x.urgent && x.remind !== '' && x.remind != null && !x.done ? `<span class="bell" title="${remindLabel(x.remind)}">${icon('bell')}${esc(remindLabel(x.remind))}</span>` : '',
  ].filter(Boolean).join('');
  return `<li class="task${x.done ? ' done' : ''}${x.urgent ? ' urgent' : ''}">
    <button class="check" data-action="toggle-todo" data-id="${x.id}" aria-label="${x.done ? 'Merkitse tekemättömäksi' : 'Merkitse tehdyksi'}">${icon('check')}</button>
    <button class="task-main" data-action="edit-todo" data-id="${x.id}">
      <span class="task-title">${esc(x.title)}</span>
      ${meta ? `<span class="task-meta">${meta}</span>` : ''}
    </button>
  </li>`;
}

function nextHour() { const d = new Date(); d.setHours(d.getHours() + 1, 0, 0, 0); return `${pad(d.getHours())}:00`; }

function notifyHelp() {
  let msg;
  if (!notifySupported()) msg = 'Saat ilmoitukset, kun avaat Kaiken Alun kotivalikosta (iPhone, iOS 16.4 tai uudempi).';
  else if (Notification.permission === 'denied') msg = 'Ilmoitukset on estetty. Salli ne iPhonen asetuksista: Asetukset → Ilmoitukset → Kaiken Alku.';
  else if (Notification.permission === 'default') msg = 'Kaiken Alku pyytää lupaa ilmoituksiin, kun tallennat.';
  else msg = 'Ilmoitukset ovat päällä. iPhone antaa Kaiken Alun lähettää niitä vain, kun se on auki — lisää tehtävä myös kalenteriin, niin hälytys tulee varmasti.';
  return `<div class="field notice" data-when="urgent">
    <p class="hint">${msg}</p>
    <button type="button" class="btn ghost" data-x="ics">${icon('calendar')}Lisää iPhonen kalenteriin</button>
  </div>`;
}

function todoSheet(x, preset) {
  const isNew = !x;
  const values = x
    ? { ...x, urgent: x.urgent ? 'on' : '', remind: x.remind ?? '' }
    : { due: today(), time: nextHour(), urgent: 'on', remind: '0', ...preset };
  openSheet({
    title: isNew ? 'Uusi tehtävä' : 'Tehtävä',
    values,
    fields: [
      { name: 'title', label: 'Tehtävä', required: true, placeholder: 'Mitä pitää tehdä?' },
      { name: 'urgent', label: 'Aikasidonnainen', type: 'switch', hint: 'Aseta tarkka aika ja saat ilmoituksen' },
      { name: 'due', label: 'Päivämäärä', type: 'date' },
      { name: 'time', label: 'Kellonaika', type: 'time', when: 'urgent', required: true },
      { name: 'remind', label: 'Muistuta', type: 'chips', when: 'urgent', options: REMINDERS },
      { name: 'note', label: 'Muistiinpano', type: 'textarea', rows: 3 },
    ],
    extra: notifyHelp(),
    onOpen(form) {
      form.querySelector('[data-x=ics]').onclick = () => {
        const el = form.elements;
        if (!el.title.value.trim()) { toast('Anna tehtävälle ensin nimi'); return; }
        if (!el.time.value) { toast('Aseta ensin kellonaika'); return; }
        downloadICS({
          id: x?.id, title: el.title.value.trim(), note: el.note.value.trim(),
          due: el.due.value || today(), time: el.time.value, remind: el.remind.value,
        });
      };
    },
    onSave(v) {
      const urgent = v.urgent === 'on';
      const t = { ...v, urgent };
      if (urgent && !t.due) t.due = today();
      if (!urgent) { t.time = ''; t.remind = ''; }
      if (!x || x.due !== t.due || x.time !== t.time || String(x.remind ?? '') !== t.remind) t.notified = '';
      if (isNew) db.todos.push({ id: uid(), created: Date.now(), done: false, ...t });
      else Object.assign(x, t);
      save('todos');
      if (urgent && t.remind !== '') ensurePermission();
      render();
      setTimeout(checkReminders, 300); // after the sheet has closed, so an in-app alert stays visible
    },
    onDelete: isNew ? null : () => { db.todos = db.todos.filter(t => t !== x); save('todos'); render(); },
  });
}

/* ---------- Reminders & notifications ---------- */

function notifySupported() { return 'Notification' in window && 'serviceWorker' in navigator; }

function ensurePermission() {
  if (!notifySupported()) { toast('Avaa Kaiken Alku kotivalikosta, niin saat ilmoituksia', 4000); return; }
  if (Notification.permission === 'denied') { toast('Ilmoitukset on estetty iPhonen asetuksissa', 4000); return; }
  if (Notification.permission === 'default') {
    try {
      Promise.resolve(Notification.requestPermission()).then(p => {
        if (p === 'granted') toast('Ilmoitukset päällä');
        else toast('Ilmoitukset pois — muistutukset näkyvät sovelluksessa', 4000);
      }).catch(() => {});
    } catch (_) { /* ignore */ }
  }
}

function fireAt(t) {
  if (t.done || !t.urgent || !t.due || !t.time || t.remind === '' || t.remind == null) return null;
  return dueMs(t) - Number(t.remind) * 60000;
}

function checkReminders() {
  const nowMs = Date.now();
  let changed = false;
  for (const t of db.todos) {
    const at = fireAt(t);
    if (at === null || nowMs < at || t.notified === String(at)) continue;
    t.notified = String(at);
    changed = true;
    if (nowMs - at < 6 * 3600e3) notify(t); // don't spam about reminders that are long past
  }
  if (changed) { save('todos'); if (ui.view === 'todo' && !sheet.open) render(); }
}

function notify(t) {
  const when = `${relDay(t.due)} klo ${t.time}`;
  const body = Number(t.remind) ? `${remindLabel(t.remind).replace(' ennen', '')} jäljellä · ${when}` : `Nyt · ${when}`;
  if (!document.hidden) toast(`⏰ ${t.title} · ${t.time}`, 6000);
  if (notifySupported() && Notification.permission === 'granted') {
    navigator.serviceWorker.getRegistration().then(reg => {
      const opts = { body, tag: t.id, icon: 'icons/icon-192.png', data: { url: './#/todo' } };
      if (reg) return reg.showNotification(t.title, opts);
      new Notification(t.title, opts);
    }).catch(() => {});
  }
}

setInterval(checkReminders, 15000);

function downloadICS(t) {
  const [y, mo, d] = t.due.split('-');
  const [h, mi] = t.time.split(':');
  const e = s => String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const mins = t.remind === '' || t.remind == null ? 0 : Number(t.remind);
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Kaiken Alku//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${t.id || uid()}@kaiken-alku`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${y}${mo}${d}T${h}${mi}00`,
    'DURATION:PT15M',
    `SUMMARY:${e(t.title)}`,
    ...(t.note ? [`DESCRIPTION:${e(t.note)}`] : []),
    'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${e(t.title)}`, `TRIGGER:-PT${mins}M`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ];
  const blob = new Blob([lines.join('\r\n') + '\r\n'], { type: 'text/calendar' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${t.title.replace(/[^\p{L}\p{N}\- ]+/gu, '').trim().slice(0, 40) || 'tehtava'}.ics`;
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
}

/* ---------- Goals ---------- */

function goalProgress(g) {
  if (g.done) return 100;
  const s = g.steps || [];
  return s.length ? Math.round(s.filter(x => x.done).length / s.length * 100) : 0;
}

function goals() {
  if (!db.goals.length) return head('goals', addBtn('new-goal', 'Uusi tavoite')) + empty('goals', 'Mitä haluat saavuttaa?', 'Aseta tavoite', 'new-goal');
  const active = db.goals.filter(g => !g.done)
    .sort((a, b) => (a.target || '9999').localeCompare(b.target || '9999') || a.created - b.created);
  const achieved = db.goals.filter(g => g.done).sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0));
  return head('goals', addBtn('new-goal', 'Uusi tavoite')) + `
    ${active.length ? `<div class="goal-list">${active.map(goalCard).join('')}</div>`
      : '<p class="muted center pad">Kaikki tavoitteet saavutettu. Aika asettaa uusi!</p>'}
    ${achieved.length ? `<h3 class="group">Saavutetut · ${achieved.length}</h3><div class="goal-list">${achieved.map(goalCard).join('')}</div>` : ''}`;
}

function goalCard(g) {
  const p = goalProgress(g);
  const open = ui.goalOpen === g.id;
  const steps = g.steps || [];
  const meta = [
    g.area,
    g.target ? `${g.done ? 'Tavoitepäivä' : 'Viimeistään'} ${relDay(g.target).toLowerCase()}` : '',
    steps.length ? `${steps.filter(s => s.done).length}/${steps.length} vaihetta` : '',
  ].filter(Boolean).join(' · ');

  return `<article class="goal${open ? ' open' : ''}${g.done ? ' achieved' : ''}">
    <button class="goal-head" data-action="goal-open" data-id="${g.id}" aria-expanded="${open}">
      <span class="goal-top"><span class="goal-title">${esc(g.title)}</span><span class="goal-pct">${g.done ? icon('check') : p + '%'}</span></span>
      ${meta ? `<span class="goal-meta">${esc(meta)}</span>` : ''}
      <span class="meter"><i style="width:${p}%"></i></span>
    </button>
    ${open ? `<div class="goal-body">
      ${g.why ? `<p class="goal-why">${esc(g.why)}</p>` : ''}
      <h4 class="mini">Vaiheet</h4>
      ${steps.length ? `<ul class="steps">${steps.map(s => `
        <li class="${s.done ? 'done' : ''}">
          <button class="check sm" data-action="toggle-step" data-id="${g.id}" data-step="${s.id}" aria-label="Merkitse vaihe">${icon('check')}</button>
          <span>${esc(s.text)}</span>
          <button class="x" data-action="del-step" data-id="${g.id}" data-step="${s.id}" aria-label="Poista vaihe">${icon('close')}</button>
        </li>`).join('')}</ul>` : '<p class="hint">Pilko tavoite pieniin vaiheisiin — edistyminen täyttyy, kun ruksaat niitä.</p>'}
      <form class="step-add" data-form="add-step" data-id="${g.id}">
        <input class="inp" name="step" placeholder="Lisää vaihe…" autocomplete="off" enterkeyhint="done" aria-label="Uusi vaihe">
        <button class="add-btn sm" aria-label="Lisää vaihe">${icon('plus')}</button>
      </form>
      <div class="goal-actions">
        <button class="btn ghost" data-action="edit-goal" data-id="${g.id}">Muokkaa</button>
        <button class="btn ${g.done ? 'ghost' : 'solid'}" data-action="achieve-goal" data-id="${g.id}">${g.done ? 'Avaa uudelleen' : `${icon('check')}Saavutettu`}</button>
      </div>
    </div>` : ''}
  </article>`;
}

function goalSheet(g) {
  const isNew = !g;
  openSheet({
    title: isNew ? 'Uusi tavoite' : 'Tavoite',
    values: g || {},
    fields: [
      { name: 'title', label: 'Tavoite', required: true, placeholder: 'Juokse puolimaraton' },
      { name: 'why', label: 'Miksi se on tärkeää', type: 'textarea', rows: 3 },
      { name: 'target', label: 'Tavoitepäivä', type: 'date' },
      { name: 'area', label: 'Elämänalue', type: 'chips', options: AREAS },
    ],
    onSave(v) {
      if (isNew) { const id = uid(); db.goals.push({ id, created: Date.now(), steps: [], done: false, ...v }); ui.goalOpen = id; }
      else Object.assign(g, v);
      save('goals'); render();
    },
    onDelete: isNew ? null : () => {
      if (!confirm('Poistetaanko tavoite vaiheineen?')) return false;
      db.goals = db.goals.filter(x => x !== g); save('goals'); render();
    },
  });
}

/* ---------- Dreams ---------- */

function dreams() {
  if (!db.dreams.length) return head('dreams', addBtn('new-dream', 'Uusi haave')) + empty('dreams', 'Haaveile isosti. Kirjoita se ylös.', 'Lisää haave', 'new-dream');
  const f = ui.dreamFilter;
  const lived = db.dreams.filter(d => d.status === 'Lived').length;
  const list = db.dreams.filter(d => (d.status === 'Lived' ? 'Lived' : 'Dreaming') === f).sort((a, b) => b.created - a.created);
  return head('dreams', addBtn('new-dream', 'Uusi haave')) +
    seg('dream-filter', [['Dreaming', `Haaveissa · ${db.dreams.length - lived}`], ['Lived', `Toteutuneet · ${lived}`]], f) +
    (list.length ? `<div class="dream-list">${list.map(dreamCard).join('')}</div>`
      : `<p class="muted center pad">${f === 'Lived' ? 'Toteutuneet haaveet kerääntyvät tänne.' : 'Kaikki haaveet toteutuneet. Haaveile lisää!'}</p>`);
}

function dreamCard(d) {
  const c = Math.max(0, DREAM_CATS.indexOf(d.category)) % 4;
  return `<button class="dream c${c}" data-action="edit-dream" data-id="${d.id}">
    <span class="dream-top"><span class="tag">${esc(d.category || 'Haave')}</span>
      ${d.status === 'Lived' ? `<span class="lived">${icon('check')}Toteutunut${d.livedAt ? ' · ' + relDay(d.livedAt).toLowerCase() : ''}</span>` : ''}</span>
    <span class="dream-title">${esc(d.title)}</span>
    ${d.text ? `<span class="dream-text">${esc(d.text)}</span>` : ''}
  </button>`;
}

function dreamSheet(d) {
  const isNew = !d;
  openSheet({
    title: isNew ? 'Uusi haave' : 'Haave',
    values: d || { status: 'Dreaming' },
    fields: [
      { name: 'title', label: 'Haave', required: true, placeholder: 'Näe revontulet lasi-iglusta' },
      { name: 'category', label: 'Laji', type: 'chips', options: DREAM_CATS },
      { name: 'text', label: 'Kuvittele se', type: 'textarea', rows: 5, placeholder: 'Missä olet? Kuka on kanssasi? Miltä se tuntuu?' },
      { name: 'status', label: 'Tila', type: 'chips', options: [['Dreaming', 'Haaveena'], ['Lived', 'Toteutunut']] },
    ],
    onSave(v) {
      v.status = v.status === 'Lived' ? 'Lived' : 'Dreaming';
      if (isNew) {
        db.dreams.push({ id: uid(), created: Date.now(), ...v, livedAt: v.status === 'Lived' ? today() : '' });
      } else {
        if (v.status === 'Lived' && d.status !== 'Lived') v.livedAt = today();
        if (v.status !== 'Lived') v.livedAt = '';
        Object.assign(d, v);
      }
      ui.dreamFilter = v.status;
      save('dreams'); render();
    },
    onDelete: isNew ? null : () => {
      if (!confirm('Poistetaanko tämä haave?')) return false;
      db.dreams = db.dreams.filter(x => x !== d); save('dreams'); render();
    },
  });
}

/* ---------- Notes ---------- */

const TOPIC_ICONS = ['idea', 'school', 'work', 'music', 'heart', 'star', 'home', 'globe', 'sport', 'film', 'food', 'money', 'code', 'leaf', 'camera', 'chat', 'diary', 'note'];
const TOPIC_COLORS = ['forest', 'moss', 'sage', 'tan', 'bark', 'rust'];
const byUpdated = (a, b) => (b.updated || b.created || 0) - (a.updated || a.created || 0);
const notesIn = id => db.notes.filter(n => n.topicId === id);

function notes() {
  if (ui.topic) {
    const t = find('topics', ui.topic);
    if (t) return topicView(t);
  }
  const top = head('notes', addBtn('new-topic', 'Uusi aihe'));
  if (!db.topics.length) {
    return top + empty('notes', 'Luo aiheita muistiinpanoillesi — esimerkiksi Koulu, Ideat tai Musiikki.', 'Uusi aihe', 'new-topic');
  }
  return top +
    (db.notes.length ? `<label class="search">${icon('search')}<input id="notes-q" type="search" placeholder="Hae kaikista muistiinpanoista" value="${esc(ui.notesQuery)}" autocomplete="off" aria-label="Hae muistiinpanoista"></label>` : '') +
    `<div id="notes-results">${notesHome()}</div>`;
}

function notesHome() {
  const q = ui.notesQuery.trim().toLowerCase();
  if (q) {
    const list = db.notes.filter(n => `${n.title} ${n.text}`.toLowerCase().includes(q)).sort(byUpdated);
    return list.length ? `<div class="notes-list">${list.map(n => noteCard(n, true)).join('')}</div>`
      : `<p class="muted center pad">Haulla “${esc(q)}” ei löytynyt muistiinpanoja.</p>`;
  }
  return `<div class="topics">${db.topics.map(t => {
    const n = notesIn(t.id).length;
    return `<a class="topic acc-${t.color || 'forest'}" href="#/notes/${t.id}">
      <span class="t-ic">${icon(t.icon || 'note')}</span>
      ${n ? `<span class="topic-count">${n}</span>` : ''}
      <span class="topic-name">${esc(t.name)}</span>
    </a>`;
  }).join('')}
    <button class="topic add" data-action="new-topic"><span class="t-ic">${icon('plus')}</span><span class="topic-name">Uusi aihe</span></button>
  </div>`;
}

function topicView(t) {
  const list = notesIn(t.id).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || byUpdated(a, b));
  return `<header class="topbar">
      <a href="#/notes" class="back">${icon('back')}<span>Muistiinpanot</span></a>
      <span class="bar-actions">
        <button class="icon-btn" data-action="edit-topic" data-id="${t.id}" aria-label="Muokkaa aihetta">${icon('sliders')}</button>
        ${addBtn('new-note', 'Uusi muistiinpano')}
      </span>
    </header>
    <div class="title-row acc-${t.color || 'forest'}"><span class="t-ic">${icon(t.icon || 'note')}</span><h1 class="wrap">${esc(t.name)}</h1></div>
    ${list.length ? `<div class="notes-list">${list.map(n => noteCard(n, false)).join('')}</div>`
      : `<div class="empty acc-${t.color || 'forest'}"><span class="t-ic big">${icon(t.icon || 'note')}</span><p>Ei vielä muistiinpanoja tässä aiheessa.</p>
          <button class="btn solid" data-action="new-note">${icon('plus')}Uusi muistiinpano</button></div>`}`;
}

function noteCard(n, showTopic) {
  let title = n.title, body = n.text || '';
  if (!title) { const lines = body.split('\n'); title = lines.shift(); body = lines.join('\n').trim(); }
  const t = showTopic ? find('topics', n.topicId) : null;
  const when = relDay(isoDate(new Date(n.updated || n.created)));
  return `<button class="note" data-action="edit-note" data-id="${n.id}">
    <span class="note-top"><span class="note-title">${esc(title || 'Nimetön')}</span>${n.pinned ? `<span class="pin" aria-label="Kiinnitetty">${icon('pin')}</span>` : ''}</span>
    ${body ? `<span class="note-text">${esc(body)}</span>` : ''}
    <span class="note-foot">${t ? `<span class="tag acc-${t.color || 'forest'}">${icon(t.icon || 'note')}${esc(t.name)}</span>` : ''}<span>${when}</span></span>
  </button>`;
}

function topicSheet(t) {
  const isNew = !t;
  openSheet({
    title: isNew ? 'Uusi aihe' : 'Aihe',
    values: t || { icon: 'idea', color: 'forest' },
    fields: [
      { name: 'name', label: 'Nimi', required: true, placeholder: 'Esim. Koulu, Ideat, Musiikki' },
      { name: 'icon', label: 'Kuvake', type: 'icons', options: TOPIC_ICONS },
      { name: 'color', label: 'Väri', type: 'swatches', options: TOPIC_COLORS },
    ],
    onOpen(form) {
      const pick = form.querySelector('.icon-pick');
      const sync = () => { pick.className = `icon-pick acc-${form.elements.color.value || 'forest'}`; };
      form.addEventListener('change', sync);
      sync();
    },
    onSave(v) {
      const rec = { name: v.name, icon: v.icon || 'note', color: v.color || 'forest' };
      if (isNew) {
        const id = uid();
        db.topics.push({ id, created: Date.now(), ...rec });
        save('topics');
        location.hash = `#/notes/${id}`;
      } else {
        Object.assign(t, rec); save('topics'); render();
      }
    },
    onDelete: isNew ? null : () => {
      const n = notesIn(t.id).length;
      if (!confirm(n ? `Poistetaanko aihe “${t.name}” ja sen ${plural(n, 'muistiinpano', 'muistiinpanoa')}?` : `Poistetaanko aihe “${t.name}”?`)) return false;
      db.topics = db.topics.filter(x => x !== t);
      db.notes = db.notes.filter(x => x.topicId !== t.id);
      save('topics'); save('notes');
      location.hash = '#/notes';
    },
  });
}

function noteSheet(n) {
  const isNew = !n;
  openSheet({
    title: isNew ? 'Uusi muistiinpano' : 'Muistiinpano',
    values: n ? { ...n, pinned: n.pinned ? 'on' : '' } : { topicId: ui.topic || db.topics[0]?.id },
    fields: [
      { name: 'title', label: 'Otsikko', placeholder: 'Otsikko' },
      { name: 'text', label: 'Muistiinpano', type: 'textarea', rows: 12, placeholder: 'Kirjoita…' },
      { name: 'topicId', label: 'Aihe', type: 'select', options: db.topics.map(t => [t.id, t.name]) },
      { name: 'pinned', label: 'Kiinnitä ylös', type: 'switch', hint: 'Näkyy aiheen ensimmäisenä' },
    ],
    onSave(v) {
      if (!v.title && !v.text) { toast('Kirjoita ensin jotain'); return false; }
      const rec = { title: v.title, text: v.text, topicId: v.topicId, pinned: v.pinned === 'on', updated: Date.now() };
      if (isNew) db.notes.push({ id: uid(), created: Date.now(), ...rec });
      else Object.assign(n, rec);
      save('notes'); render();
      if (ui.topic && rec.topicId !== ui.topic) toast(`Siirretty aiheeseen ${find('topics', rec.topicId)?.name || ''}`);
    },
    onDelete: isNew ? null : () => {
      if (!confirm('Poistetaanko tämä muistiinpano?')) return false;
      db.notes = db.notes.filter(x => x !== n); save('notes'); render();
    },
  });
}

/* ---------- Settings & backup ---------- */

function openSettings() {
  openSheet({
    title: 'Asetukset',
    saveLabel: 'Valmis',
    values: { name: db.settings.name, zone1: zones()[0], zone2: zones()[1] },
    fields: [
      { name: 'name', label: 'Nimesi', placeholder: 'Näkyy etusivun tervehdyksessä' },
      { name: 'zone1', label: 'Maailmankello 1', type: 'select', options: ZONE_OPTIONS },
      { name: 'zone2', label: 'Maailmankello 2', type: 'select', options: ZONE_OPTIONS },
    ],
    extra: `
      <div class="field"><span>Varmuuskopio</span>
        <p class="hint">Kaikki tallentuu vain tälle laitteelle. Tee varmuuskopio silloin tällöin, ettei mitään katoa.</p>
        <div class="row">
          <button type="button" class="btn ghost" data-x="export">Vie varmuuskopio</button>
          <label class="btn ghost">Tuo varmuuskopio<input type="file" accept="application/json,.json" class="vh" data-x="import"></label>
        </div>
      </div>
      <div class="field"><span>Vaara-alue</span>
        <button type="button" class="btn danger" data-x="erase">${icon('trash')}Poista kaikki tiedot</button>
      </div>`,
    onOpen(form) {
      form.querySelector('[data-x=export]').onclick = exportData;
      form.querySelector('[data-x=import]').onchange = e => importData(e.target.files[0]);
      form.querySelector('[data-x=erase]').onclick = eraseAll;
    },
    onSave(v) { db.settings.name = v.name; db.settings.zones = [v.zone1, v.zone2]; save('settings'); render(); },
  });
}

function exportData() {
  const data = { app: 'kaiken-alku', version: 1, exported: new Date().toISOString() };
  KEYS.forEach(k => { data[k] = db[k]; });
  const json = JSON.stringify(data, null, 2);
  const name = `kaiken-alku-varmuuskopio-${today()}.json`;
  const file = new File([json], name, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({ files: [file], title: 'Kaiken Alku -varmuuskopio' }).catch(() => {});
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = name;
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

function importData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || !['kaiken-alku', 'grove'].includes(data.app)) throw new Error('not a Kaiken Alku backup');
      if (!confirm('Korvataanko kaikki tämän laitteen tiedot tällä varmuuskopiolla?')) return;
      KEYS.forEach(k => {
        const ok = Array.isArray(DEFAULTS[k]) ? Array.isArray(data[k]) : data[k] && typeof data[k] === 'object';
        db[k] = ok ? data[k] : clone(DEFAULTS[k]);
        save(k);
      });
      closeSheet(); render(); toast('Varmuuskopio palautettu');
    } catch (_) {
      toast('Tiedosto ei ole Kaiken Alun varmuuskopio');
    }
  };
  reader.readAsText(file);
}

function eraseAll() {
  if (!confirm('Poistetaanko kaikki merkinnät, tapahtumat, tehtävät, tavoitteet, haaveet ja muistiinpanot tältä laitteelta? Tätä ei voi perua.')) return;
  KEYS.forEach(k => { db[k] = clone(DEFAULTS[k]); try { localStorage.removeItem(PREFIX + k); } catch (_) {} });
  closeSheet(); render(); toast('Kaikki tiedot poistettu');
}

/* ---------- Bottom sheet ---------- */

const sheet = document.getElementById('sheet');

function field(f, values) {
  const val = values[f.name] ?? '';
  const ph = f.placeholder ? ` placeholder="${esc(f.placeholder)}"` : '';
  if (f.type === 'textarea') {
    return `<label class="field"><span>${f.label}</span><textarea class="inp" name="${f.name}" rows="${f.rows || 5}"${ph}>${esc(val)}</textarea></label>`;
  }
  if (f.type === 'chips') {
    const opts = f.options.map(o => (Array.isArray(o) ? o : [o, o]));
    return `<fieldset class="field"><legend>${f.label}</legend><div class="chips">${opts.map(([v, l]) =>
      `<label class="chip-opt"><input type="radio" name="${f.name}" value="${esc(v)}"${String(v) === String(val) ? ' checked data-was="1"' : ''}><span>${esc(l)}</span></label>`
    ).join('')}</div></fieldset>`;
  }
  if (f.type === 'icons' || f.type === 'swatches') {
    const icons = f.type === 'icons';
    return `<fieldset class="field"><legend>${f.label}</legend><div class="${icons ? 'icon-pick' : 'swatches'}">${f.options.map(v =>
      `<label class="pick${icons ? '' : ` sw acc-${v}`}"><input type="radio" name="${f.name}" value="${v}"${v === val ? ' checked' : ''} aria-label="${v}"><span>${icons ? icon(v) : ''}</span></label>`
    ).join('')}</div></fieldset>`;
  }
  if (f.type === 'select') {
    return `<label class="field"><span>${f.label}</span><select class="inp" name="${f.name}">${f.options.map(([v, l]) =>
      `<option value="${esc(v)}"${String(v) === String(val) ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
  }
  if (f.type === 'switch') {
    return `<label class="switch-row"><span class="sw-txt"><b>${f.label}</b>${f.hint ? `<small>${esc(f.hint)}</small>` : ''}</span>
      <span class="switch"><input type="checkbox" name="${f.name}"${val === 'on' || val === true ? ' checked' : ''}><i></i></span></label>`;
  }
  return `<label class="field"><span>${f.label}</span><input class="inp" type="${f.type || 'text'}" name="${f.name}" value="${esc(val)}"${ph}${f.type ? '' : ' autocomplete="off"'}></label>`;
}

function openSheet(o) {
  const values = o.values || {};
  sheet.innerHTML = `<form class="sheet-form" novalidate>
    <div class="sheet-head">
      <button type="button" class="link" data-close>Peruuta</button>
      <h2>${esc(o.title)}</h2>
      <button type="submit" class="link strong">${o.saveLabel || 'Tallenna'}</button>
    </div>
    <div class="sheet-body">
      ${o.fields.map(f => (f.when ? `<div class="when" data-when="${f.when}">${field(f, values)}</div>` : field(f, values))).join('')}
      ${o.extra || ''}
      ${o.onDelete ? `<button type="button" class="btn danger" data-delete>${icon('trash')}Poista</button>` : ''}
    </div>
  </form>`;
  const form = sheet.firstElementChild;
  form.querySelector('[data-close]').onclick = closeSheet;

  // Let a selected chip be tapped again to clear it.
  form.addEventListener('click', e => {
    const r = e.target.closest('input[type=radio]');
    if (!r) return;
    if (r.dataset.was === '1' && !r.closest('.pick')) r.checked = false; // icon/colour pickers always keep a choice
    form.querySelectorAll(`input[name="${r.name}"]`).forEach(x => { x.dataset.was = x.checked ? '1' : ''; });
  });
  form.addEventListener('input', e => e.target.classList.remove('invalid'));

  // Fields marked `when: '<switch name>'` only show while that switch is on.
  const shown = name => { const c = form.elements[name]; return !!(c && c.checked); };
  const syncWhen = () => form.querySelectorAll('[data-when]').forEach(el => { el.hidden = !shown(el.dataset.when); });
  form.addEventListener('change', syncWhen);
  syncWhen();

  form.onsubmit = e => {
    e.preventDefault();
    const fd = new FormData(form);
    const out = {};
    for (const f of o.fields) {
      if (f.when && !shown(f.when)) { out[f.name] = ''; continue; }
      out[f.name] = String(fd.get(f.name) ?? '').trim();
      if (f.required && !out[f.name]) {
        const el = form.elements[f.name];
        if (el && el.focus) { el.classList.add('invalid'); el.focus(); }
        toast(`${f.label} puuttuu`);
        return;
      }
    }
    if (o.onSave(out) !== false) closeSheet();
  };
  if (o.onDelete) form.querySelector('[data-delete]').onclick = () => { if (o.onDelete() !== false) closeSheet(); };
  if (o.onOpen) o.onOpen(form);

  sheet.classList.remove('closing');
  sheet.showModal();
  form.querySelector('.sheet-body').scrollTop = 0;
}

function closeSheet() {
  if (!sheet.open || sheet.classList.contains('closing')) return;
  sheet.classList.add('closing');
  setTimeout(() => { sheet.close(); sheet.classList.remove('closing'); sheet.innerHTML = ''; }, 200);
}

sheet.addEventListener('click', e => { if (e.target === sheet) closeSheet(); });
sheet.addEventListener('cancel', e => { e.preventDefault(); closeSheet(); });

/* ---------- Toast ---------- */

function toast(msg, ms = 2200) {
  const host = sheet.open ? sheet : document.body;
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); }
  if (t.parentNode !== host) host.append(t);
  t.textContent = msg;
  requestAnimationFrame(() => t.classList.add('show'));
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), ms);
}

/* ---------- Actions ---------- */

const ACTIONS = {
  settings: openSettings,
  'cal-today-go'() { const t = new Date(); ui.calY = t.getFullYear(); ui.calM = t.getMonth(); ui.calSel = today(); location.hash = '#/calendar'; },

  'new-diary': () => diarySheet(),
  'edit-diary': d => diarySheet(find('diary', d.id)),

  'cal-prev': () => shiftMonth(-1),
  'cal-next': () => shiftMonth(1),
  'cal-today'() { const t = new Date(); ui.calY = t.getFullYear(); ui.calM = t.getMonth(); ui.calSel = today(); render(); },
  'pick-day'(d) { ui.calSel = d.date; render(); },
  'new-event': () => eventSheet(),
  'edit-event': d => eventSheet(find('events', d.id)),

  'toggle-todo'(d, el) {
    const x = find('todos', d.id);
    if (!x) return;
    x.done = !x.done;
    x.doneAt = x.done ? Date.now() : null;
    save('todos');
    el.closest('li')?.classList.toggle('done', x.done);
    clearTimeout(ui._t);
    ui._t = setTimeout(render, 380); // let the tick animate before the list re-sorts
  },
  'edit-todo': d => todoSheet(find('todos', d.id)),
  'new-timed'() {
    const input = document.getElementById('todo-input');
    const title = input ? input.value.trim() : '';
    if (input) input.value = '';
    todoSheet(null, { title });
  },
  'todo-filter'(d) { ui.todoFilter = d.f; render(); },
  'clear-done'() {
    if (!confirm('Poistetaanko kaikki tehdyt tehtävät?')) return;
    db.todos = db.todos.filter(x => !x.done); save('todos'); render();
  },

  'new-goal': () => goalSheet(),
  'edit-goal': d => goalSheet(find('goals', d.id)),
  'goal-open'(d) { ui.goalOpen = ui.goalOpen === d.id ? null : d.id; render(); },
  'toggle-step'(d) {
    const g = find('goals', d.id); const s = g?.steps.find(x => x.id === d.step);
    if (!s) return;
    s.done = !s.done; save('goals'); render();
  },
  'del-step'(d) {
    const g = find('goals', d.id);
    if (!g) return;
    g.steps = g.steps.filter(x => x.id !== d.step); save('goals'); render();
  },
  'achieve-goal'(d) {
    const g = find('goals', d.id);
    if (!g) return;
    g.done = !g.done; g.doneAt = g.done ? Date.now() : null;
    save('goals'); render();
    if (g.done) toast('Tavoite saavutettu — hienoa!');
  },

  'new-dream': () => dreamSheet(),
  'edit-dream': d => dreamSheet(find('dreams', d.id)),
  'dream-filter'(d) { ui.dreamFilter = d.f; render(); },

  'new-topic': () => topicSheet(),
  'edit-topic': d => topicSheet(find('topics', d.id)),
  'new-note': () => noteSheet(),
  'edit-note': d => noteSheet(find('notes', d.id)),
};

const FORMS = {
  'add-todo'(f) {
    const title = f.elements.task.value.trim();
    if (!title) return;
    db.todos.push({ id: uid(), title, due: '', note: '', done: false, created: Date.now() });
    save('todos');
    if (ui.todoFilter === 'done') ui.todoFilter = 'open';
    render();
    document.getElementById('todo-input')?.focus();
  },
  'add-step'(f) {
    const g = find('goals', f.dataset.id);
    const text = f.elements.step.value.trim();
    if (!g || !text) return;
    (g.steps || (g.steps = [])).push({ id: uid(), text, done: false });
    save('goals'); render();
    document.querySelector('.step-add input')?.focus();
  },
};

/* ---------- Router ---------- */

const VIEWS = { lobby, diary, calendar, todo, goals, dreams, notes };
const app = document.getElementById('app');

function render() { app.innerHTML = VIEWS[ui.view](); }

function route() {
  const [id, sub] = location.hash.replace(/^#\/?/, '').split('/');
  ui.view = VIEWS[id] ? id : 'lobby';
  ui.topic = ui.view === 'notes' && sub ? decodeURIComponent(sub) : null;
  if (sheet.open) closeSheet();
  document.body.classList.toggle('lobby', ui.view === 'lobby');
  render();
  app.classList.remove('enter'); void app.offsetWidth; app.classList.add('enter');
  window.scrollTo(0, 0);
  const topic = ui.topic && find('topics', ui.topic);
  document.title = ui.view === 'lobby' ? 'Kaiken Alku' : `${topic ? topic.name : sec(ui.view).title} · Kaiken Alku`;
}

app.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const fn = ACTIONS[el.dataset.action];
  if (!fn) return;
  e.preventDefault();
  fn(el.dataset, el);
});
app.addEventListener('submit', e => {
  const fn = FORMS[e.target.dataset.form];
  if (fn) { e.preventDefault(); fn(e.target); }
});
app.addEventListener('input', e => {
  if (e.target.id === 'diary-q') {
    ui.diaryQuery = e.target.value;
    document.getElementById('diary-list').innerHTML = diaryList();
  }
  if (e.target.id === 'notes-q') {
    ui.notesQuery = e.target.value;
    document.getElementById('notes-results').innerHTML = notesHome();
  }
});

// Swipe the calendar grid left/right to change month.
let touchX = null;
app.addEventListener('touchstart', e => { touchX = e.target.closest('.cal .grid') ? e.touches[0].clientX : null; }, { passive: true });
app.addEventListener('touchend', e => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  touchX = null;
  if (Math.abs(dx) > 60) shiftMonth(dx < 0 ? 1 : -1);
}, { passive: true });

window.addEventListener('hashchange', route);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  checkReminders();
  if (!sheet.open) render();
});

route();
checkReminders();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
