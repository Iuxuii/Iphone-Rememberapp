'use strict';

/* Grove — a personal space with a diary, calendar, to-do list, goals and dreams.
   Everything is stored in this browser only (localStorage). */

/* ---------- Storage ---------- */

const PREFIX = 'grove.';
const DEFAULTS = { diary: [], events: [], todos: [], goals: [], dreams: [], settings: { name: '' } };
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
function fmt(s, opts) { return parseISO(s).toLocaleDateString('en-GB', opts); }
function addDays(s, n) { const d = parseISO(s); d.setDate(d.getDate() + n); return isoDate(d); }
function relDay(s) {
  const t = today();
  if (s === t) return 'Today';
  if (s === addDays(t, -1)) return 'Yesterday';
  if (s === addDays(t, 1)) return 'Tomorrow';
  const sameYear = s.slice(0, 4) === t.slice(0, 4);
  return fmt(s, sameYear ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' });
}
function longDay(s) {
  const base = fmt(s, { weekday: 'long', day: 'numeric', month: 'long' });
  const r = relDay(s);
  return ['Today', 'Yesterday', 'Tomorrow'].includes(r) ? `${r} · ${base}` : base;
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
};
function icon(name, cls = '') {
  return `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}

/* ---------- Sections ---------- */

const SECTIONS = [
  { id: 'diary', title: 'Diary', icon: 'diary', accent: 'tan' },
  { id: 'calendar', title: 'Calendar', icon: 'calendar', accent: 'forest' },
  { id: 'todo', title: 'To-do', icon: 'todo', accent: 'moss' },
  { id: 'goals', title: 'Goals', icon: 'goals', accent: 'bark' },
  { id: 'dreams', title: 'Dreams', icon: 'dreams', accent: 'sage' },
];
const sec = id => SECTIONS.find(s => s.id === id);

const MOODS = ['Calm', 'Happy', 'Grateful', 'Inspired', 'Tired', 'Low'];
const AREAS = ['Health', 'Mind', 'Career', 'Money', 'Learning', 'Relationships', 'Home', 'Other'];
const DREAM_CATS = ['Travel', 'Adventure', 'Create', 'Learn', 'Own', 'Become', 'Give', 'Other'];

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
};

/* ---------- Shared pieces ---------- */

function head(id, right = '') {
  const s = sec(id);
  return `<header class="topbar">
      <a href="#/" class="back">${icon('back')}<span>Lobby</span></a>${right}
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
    if (!n) return 'Write your first page';
    const last = db.diary.reduce((a, b) => (b.date > a.date ? b : a));
    return `${plural(n, 'entry', 'entries')} · latest ${relDay(last.date)}`;
  },
  calendar() {
    const t = today();
    const up = db.events.filter(e => e.date >= t)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '99').localeCompare(b.time || '99'));
    if (!up.length) return 'Nothing planned';
    const e = up[0];
    return `Next: ${relDay(e.date)}${e.time ? ' ' + e.time : ''} · ${e.title}`;
  },
  todo() {
    const open = db.todos.filter(x => !x.done);
    if (!open.length) return db.todos.length ? 'All clear' : 'Nothing yet';
    const late = open.filter(isLate).length;
    const next = open.filter(x => x.urgent && x.time && !isLate(x)).sort((a, b) => taskKey(a).localeCompare(taskKey(b)))[0];
    return `${open.length} open${late ? ` · ${late} overdue` : ''}${next ? ` · next ${next.due === today() ? '' : relDay(next.due) + ' '}${next.time}` : ''}`;
  },
  goals() {
    if (!db.goals.length) return 'Set your first goal';
    const done = db.goals.filter(g => g.done).length;
    return `${db.goals.length - done} active · ${done} achieved`;
  },
  dreams() {
    if (!db.dreams.length) return 'What do you dream of?';
    const lived = db.dreams.filter(d => d.status === 'Lived').length;
    return `${plural(db.dreams.length, 'dream', 'dreams')} · ${lived} lived`;
  },
};

function lobby() {
  const t = today();
  const h = new Date().getHours();
  const greet = h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const name = (db.settings.name || '').trim();
  const evToday = db.events.filter(e => e.date === t).length;
  const due = db.todos.filter(x => !x.done && x.due && (x.due <= t || isLate(x))).length;
  const wrote = db.diary.some(e => e.date === t);

  return `
  <header class="lobby-head">
    <div class="lobby-top">
      <p class="eyebrow">${fmt(t, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      <button class="icon-btn" data-action="settings" aria-label="Settings">${icon('sliders')}</button>
    </div>
    <h1 class="greet">${greet}${name ? `,<br><em>${esc(name)}</em>` : '<em>.</em>'}</h1>
    <div class="today-strip">
      <a class="pill" href="#/calendar" data-action="cal-today-go"><b>${evToday}</b>${evToday === 1 ? 'event' : 'events'} today</a>
      <a class="pill" href="#/todo"><b>${due}</b>${due === 1 ? 'task' : 'tasks'} due</a>
      <a class="pill" href="#/diary"><span class="dot${wrote ? ' ok' : ''}"></span>${wrote ? 'Wrote today' : 'No diary yet today'}</a>
    </div>
  </header>
  <nav class="tiles" aria-label="Sections">
    ${SECTIONS.map((s, i) => `
    <a class="tile acc-${s.accent}${i === 0 ? ' wide' : ''}" href="#/${s.id}">
      <span class="t-ic">${icon(s.icon)}</span>
      <span class="go">${icon('arrow')}</span>
      <span class="t-txt"><h2>${s.title}</h2><p>${esc(STATS[s.id]())}</p></span>
    </a>`).join('')}
  </nav>
  <p class="foot">Grove · everything stays on this device</p>`;
}

/* ---------- Diary ---------- */

function diary() {
  return head('diary', addBtn('new-diary', 'New entry')) +
    (db.diary.length ? `<label class="search">${icon('search')}<input id="diary-q" type="search" placeholder="Search your pages" value="${esc(ui.diaryQuery)}" autocomplete="off" aria-label="Search diary"></label>` : '') +
    `<div id="diary-list">${diaryList()}</div>`;
}

function diaryList() {
  if (!db.diary.length) return empty('diary', 'Your first page is waiting.', 'Write today', 'new-diary');
  const q = ui.diaryQuery.trim().toLowerCase();
  const list = [...db.diary].sort(byDateDesc)
    .filter(e => !q || `${e.title} ${e.text} ${e.mood}`.toLowerCase().includes(q));
  if (!list.length) return `<p class="muted center pad">No pages match “${esc(q)}”.</p>`;

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
        <span class="e-top"><span class="e-title">${esc(e.title || 'Untitled')}</span>${e.mood ? `<span class="tag">${esc(e.mood)}</span>` : ''}</span>
        ${e.text ? `<span class="e-text">${esc(e.text)}</span>` : ''}
      </span></button></li>`;
  }
  return out + '</ul>';
}

function diarySheet(entry) {
  const isNew = !entry;
  openSheet({
    title: isNew ? 'New entry' : 'Entry',
    values: entry || { date: today() },
    fields: [
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'title', label: 'Title', placeholder: 'A few words about the day' },
      { name: 'mood', label: 'Mood', type: 'chips', options: MOODS },
      { name: 'text', label: 'Entry', type: 'textarea', rows: 12, placeholder: 'Write freely…' },
    ],
    onSave(v) {
      if (!v.title && !v.text) { toast('Write something first'); return false; }
      if (isNew) db.diary.push({ id: uid(), created: Date.now(), ...v });
      else Object.assign(entry, v, { updated: Date.now() });
      save('diary'); render();
    },
    onDelete: isNew ? null : () => {
      if (!confirm('Delete this diary entry?')) return false;
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

  return head('calendar', addBtn('new-event', 'New event')) + `
  <section class="cal">
    <div class="cal-nav">
      <button class="icon-btn" data-action="cal-prev" aria-label="Previous month">${icon('chevL')}</button>
      <h2>${first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</h2>
      <button class="icon-btn" data-action="cal-next" aria-label="Next month">${icon('chevR')}</button>
    </div>
    <div class="wk">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(w => `<span>${w}</span>`).join('')}</div>
    <div class="grid">${cells}</div>
    <div class="legend">
      <span><i class="d-ev"></i>Event</span><span><i class="d-td"></i>Task</span><span><i class="d-di"></i>Diary</span>
      ${showToday ? '<button class="link" data-action="cal-today">Today</button>' : ''}
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
    return html + `<div class="empty-sm"><p>Nothing on this day.</p><button class="btn ghost" data-action="new-event">${icon('plus')}Add event</button></div>`;
  }
  html += '<ul class="agenda-list">';
  for (const e of evs) {
    html += `<li><button class="ag-item" data-action="edit-event" data-id="${e.id}">
      <span class="ag-time">${e.time || 'All day'}</span>
      <span class="ag-main"><span class="ag-title">${esc(e.title)}</span>${e.note ? `<span class="ag-note">${esc(e.note)}</span>` : ''}</span>
    </button></li>`;
  }
  for (const x of tasks) {
    html += `<li class="ag-task${x.done ? ' done' : ''}">
      <button class="check" data-action="toggle-todo" data-id="${x.id}" aria-label="${x.done ? 'Mark not done' : 'Mark done'}">${icon('check')}</button>
      <button class="ag-main" data-action="edit-todo" data-id="${x.id}"><span class="ag-kicker">${x.urgent ? 'Time-sensitive' : 'Task'}${x.time ? ' · ' + x.time : ''}</span><span class="ag-title">${esc(x.title)}</span></button>
    </li>`;
  }
  for (const e of pages) {
    html += `<li><button class="ag-item" data-action="edit-diary" data-id="${e.id}">
      <span class="ag-time diary">Diary</span>
      <span class="ag-main"><span class="ag-title">${esc(e.title || 'Untitled')}</span>${e.text ? `<span class="ag-note clamp">${esc(e.text)}</span>` : ''}</span>
    </button></li>`;
  }
  return html + '</ul>';
}

function eventSheet(ev) {
  const isNew = !ev;
  openSheet({
    title: isNew ? 'New event' : 'Event',
    values: ev || { date: ui.calSel },
    fields: [
      { name: 'title', label: 'Title', required: true, placeholder: 'What’s happening?' },
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'time', label: 'Time (optional)', type: 'time' },
      { name: 'note', label: 'Note', type: 'textarea', rows: 3, placeholder: 'Place, people, details…' },
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
      if (!confirm('Delete this event?')) return false;
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

const REMINDERS = [['', 'None'], ['0', 'At the time'], ['5', '5 min before'], ['15', '15 min before'], ['60', '1 hour before'], ['1440', '1 day before']];
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
    body += urgent.length ? group(`${icon('clock')}Time-sensitive`, urgent) + group(normal.length ? 'Other tasks' : '', normal) : group('', normal);
  }
  if (f === 'done') body += group('', finished);
  if (f === 'all' && finished.length) body += group('Done', finished);

  const emptyMsg = !total ? empty('todo', 'Nothing to do yet. Add a task above — tap the clock for something time-sensitive.')
    : f === 'open' ? `<p class="muted center pad">All clear. Enjoy it.</p>`
    : `<p class="muted center pad">No finished tasks yet.</p>`;

  return head('todo') + `
  <form class="quick-add" data-form="add-todo">
    <input class="inp" id="todo-input" name="task" placeholder="Add a task…" autocomplete="off" enterkeyhint="done" aria-label="New task">
    <button type="button" class="add-btn alt" data-action="new-timed" aria-label="Add a time-sensitive task">${icon('clock')}</button>
    <button class="add-btn" aria-label="Add task">${icon('plus')}</button>
  </form>
  ${total ? `<div class="progress"><div class="progress-txt"><span>${done} of ${total} done</span><span>${Math.round(done / total * 100)}%</span></div>
    <span class="meter"><i style="width:${done / total * 100}%"></i></span></div>
    ${seg('todo-filter', [['open', 'Open'], ['done', 'Done'], ['all', 'All']], f)}` : ''}
  ${body || emptyMsg}
  ${done && f !== 'open' ? '<button class="link block" data-action="clear-done">Clear completed</button>' : ''}`;
}

function taskRow(x) {
  const late = isLate(x);
  const when = x.due ? `${relDay(x.due)}${x.time ? ' · ' + x.time : ''}` : '';
  const meta = [
    when ? `<span class="${late ? 'late' : x.urgent ? 'soon' : ''}">${late ? 'Overdue · ' : ''}${when}</span>` : '',
    x.urgent && x.remind !== '' && x.remind != null && !x.done ? `<span class="bell" title="${remindLabel(x.remind)}">${icon('bell')}${esc(remindLabel(x.remind))}</span>` : '',
  ].filter(Boolean).join('');
  return `<li class="task${x.done ? ' done' : ''}${x.urgent ? ' urgent' : ''}">
    <button class="check" data-action="toggle-todo" data-id="${x.id}" aria-label="${x.done ? 'Mark not done' : 'Mark done'}">${icon('check')}</button>
    <button class="task-main" data-action="edit-todo" data-id="${x.id}">
      <span class="task-title">${esc(x.title)}</span>
      ${meta ? `<span class="task-meta">${meta}</span>` : ''}
    </button>
  </li>`;
}

function nextHour() { const d = new Date(); d.setHours(d.getHours() + 1, 0, 0, 0); return `${pad(d.getHours())}:00`; }

function notifyHelp() {
  let msg;
  if (!notifySupported()) msg = 'To get notifications, open Grove from your Home Screen (iPhone with iOS 16.4 or newer).';
  else if (Notification.permission === 'denied') msg = 'Notifications are blocked. Turn them on in iPhone Settings → Notifications → Grove.';
  else if (Notification.permission === 'default') msg = 'Grove will ask to send you notifications when you save.';
  else msg = 'Notifications are on. iPhone only lets Grove send them while it’s open — for an alert that always arrives, add it to your Calendar too.';
  return `<div class="field notice" data-when="urgent">
    <p class="hint">${msg}</p>
    <button type="button" class="btn ghost" data-x="ics">${icon('calendar')}Add to iPhone Calendar</button>
  </div>`;
}

function todoSheet(x, preset) {
  const isNew = !x;
  const values = x
    ? { ...x, urgent: x.urgent ? 'on' : '', remind: x.remind ?? '' }
    : { due: today(), time: nextHour(), urgent: 'on', remind: '0', ...preset };
  openSheet({
    title: isNew ? 'New task' : 'Task',
    values,
    fields: [
      { name: 'title', label: 'Task', required: true, placeholder: 'What needs doing?' },
      { name: 'urgent', label: 'Time-sensitive', type: 'switch', hint: 'Set an exact time and get notified' },
      { name: 'due', label: 'Date', type: 'date' },
      { name: 'time', label: 'Time', type: 'time', when: 'urgent', required: true },
      { name: 'remind', label: 'Notify me', type: 'chips', when: 'urgent', options: REMINDERS },
      { name: 'note', label: 'Note', type: 'textarea', rows: 3 },
    ],
    extra: notifyHelp(),
    onOpen(form) {
      form.querySelector('[data-x=ics]').onclick = () => {
        const el = form.elements;
        if (!el.title.value.trim()) { toast('Give the task a name first'); return; }
        if (!el.time.value) { toast('Set a time first'); return; }
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
  if (!notifySupported()) { toast('Open Grove from your Home Screen to get notifications', 4000); return; }
  if (Notification.permission === 'denied') { toast('Notifications are blocked in iPhone Settings', 4000); return; }
  if (Notification.permission === 'default') {
    try {
      Promise.resolve(Notification.requestPermission()).then(p => {
        if (p === 'granted') toast('Notifications on');
        else toast('Notifications stay off — reminders show inside Grove', 4000);
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
  const when = `${relDay(t.due)} at ${t.time}`;
  const body = Number(t.remind) ? `${remindLabel(t.remind).replace(' before', '')} to go · ${when}` : `Now · ${when}`;
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
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Grove//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${t.id || uid()}@grove`,
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
  a.download = `${t.title.replace(/[^\w\- ]+/g, '').trim().slice(0, 40) || 'task'}.ics`;
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
  if (!db.goals.length) return head('goals', addBtn('new-goal', 'New goal')) + empty('goals', 'What do you want to achieve?', 'Set a goal', 'new-goal');
  const active = db.goals.filter(g => !g.done)
    .sort((a, b) => (a.target || '9999').localeCompare(b.target || '9999') || a.created - b.created);
  const achieved = db.goals.filter(g => g.done).sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0));
  return head('goals', addBtn('new-goal', 'New goal')) + `
    ${active.length ? `<div class="goal-list">${active.map(goalCard).join('')}</div>`
      : '<p class="muted center pad">Every goal achieved. Time to set a new one.</p>'}
    ${achieved.length ? `<h3 class="group">Achieved · ${achieved.length}</h3><div class="goal-list">${achieved.map(goalCard).join('')}</div>` : ''}`;
}

function goalCard(g) {
  const p = goalProgress(g);
  const open = ui.goalOpen === g.id;
  const steps = g.steps || [];
  const meta = [
    g.area,
    g.target ? `${g.done ? 'Target' : 'By'} ${relDay(g.target)}` : '',
    steps.length ? `${steps.filter(s => s.done).length}/${steps.length} steps` : '',
  ].filter(Boolean).join(' · ');

  return `<article class="goal${open ? ' open' : ''}${g.done ? ' achieved' : ''}">
    <button class="goal-head" data-action="goal-open" data-id="${g.id}" aria-expanded="${open}">
      <span class="goal-top"><span class="goal-title">${esc(g.title)}</span><span class="goal-pct">${g.done ? icon('check') : p + '%'}</span></span>
      ${meta ? `<span class="goal-meta">${esc(meta)}</span>` : ''}
      <span class="meter"><i style="width:${p}%"></i></span>
    </button>
    ${open ? `<div class="goal-body">
      ${g.why ? `<p class="goal-why">${esc(g.why)}</p>` : ''}
      <h4 class="mini">Steps</h4>
      ${steps.length ? `<ul class="steps">${steps.map(s => `
        <li class="${s.done ? 'done' : ''}">
          <button class="check sm" data-action="toggle-step" data-id="${g.id}" data-step="${s.id}" aria-label="Toggle step">${icon('check')}</button>
          <span>${esc(s.text)}</span>
          <button class="x" data-action="del-step" data-id="${g.id}" data-step="${s.id}" aria-label="Remove step">${icon('close')}</button>
        </li>`).join('')}</ul>` : '<p class="hint">Break it into small steps — progress fills in as you tick them off.</p>'}
      <form class="step-add" data-form="add-step" data-id="${g.id}">
        <input class="inp" name="step" placeholder="Add a step…" autocomplete="off" enterkeyhint="done" aria-label="New step">
        <button class="add-btn sm" aria-label="Add step">${icon('plus')}</button>
      </form>
      <div class="goal-actions">
        <button class="btn ghost" data-action="edit-goal" data-id="${g.id}">Edit</button>
        <button class="btn ${g.done ? 'ghost' : 'solid'}" data-action="achieve-goal" data-id="${g.id}">${g.done ? 'Reopen' : 'Mark achieved'}</button>
      </div>
    </div>` : ''}
  </article>`;
}

function goalSheet(g) {
  const isNew = !g;
  openSheet({
    title: isNew ? 'New goal' : 'Goal',
    values: g || {},
    fields: [
      { name: 'title', label: 'Goal', required: true, placeholder: 'Run a half marathon' },
      { name: 'why', label: 'Why it matters', type: 'textarea', rows: 3 },
      { name: 'target', label: 'Target date', type: 'date' },
      { name: 'area', label: 'Area of life', type: 'chips', options: AREAS },
    ],
    onSave(v) {
      if (isNew) { const id = uid(); db.goals.push({ id, created: Date.now(), steps: [], done: false, ...v }); ui.goalOpen = id; }
      else Object.assign(g, v);
      save('goals'); render();
    },
    onDelete: isNew ? null : () => {
      if (!confirm('Delete this goal and its steps?')) return false;
      db.goals = db.goals.filter(x => x !== g); save('goals'); render();
    },
  });
}

/* ---------- Dreams ---------- */

function dreams() {
  if (!db.dreams.length) return head('dreams', addBtn('new-dream', 'New dream')) + empty('dreams', 'Dream big. Write it down.', 'Add a dream', 'new-dream');
  const f = ui.dreamFilter;
  const lived = db.dreams.filter(d => d.status === 'Lived').length;
  const list = db.dreams.filter(d => (d.status === 'Lived' ? 'Lived' : 'Dreaming') === f).sort((a, b) => b.created - a.created);
  return head('dreams', addBtn('new-dream', 'New dream')) +
    seg('dream-filter', [['Dreaming', `Dreaming · ${db.dreams.length - lived}`], ['Lived', `Lived · ${lived}`]], f) +
    (list.length ? `<div class="dream-list">${list.map(dreamCard).join('')}</div>`
      : `<p class="muted center pad">${f === 'Lived' ? 'Dreams you’ve lived will gather here.' : 'Every dream lived. Dream again.'}</p>`);
}

function dreamCard(d) {
  const c = Math.max(0, DREAM_CATS.indexOf(d.category)) % 4;
  return `<button class="dream c${c}" data-action="edit-dream" data-id="${d.id}">
    <span class="dream-top"><span class="tag">${esc(d.category || 'Dream')}</span>
      ${d.status === 'Lived' ? `<span class="lived">${icon('check')}Lived${d.livedAt ? ' · ' + relDay(d.livedAt) : ''}</span>` : ''}</span>
    <span class="dream-title">${esc(d.title)}</span>
    ${d.text ? `<span class="dream-text">${esc(d.text)}</span>` : ''}
  </button>`;
}

function dreamSheet(d) {
  const isNew = !d;
  openSheet({
    title: isNew ? 'New dream' : 'Dream',
    values: d || { status: 'Dreaming' },
    fields: [
      { name: 'title', label: 'Dream', required: true, placeholder: 'See the northern lights from a glass cabin' },
      { name: 'category', label: 'Kind', type: 'chips', options: DREAM_CATS },
      { name: 'text', label: 'Picture it', type: 'textarea', rows: 5, placeholder: 'Where are you? Who is with you? How does it feel?' },
      { name: 'status', label: 'Status', type: 'chips', options: ['Dreaming', 'Lived'] },
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
      if (!confirm('Delete this dream?')) return false;
      db.dreams = db.dreams.filter(x => x !== d); save('dreams'); render();
    },
  });
}

/* ---------- Settings & backup ---------- */

function openSettings() {
  openSheet({
    title: 'Settings',
    saveLabel: 'Done',
    values: { name: db.settings.name },
    fields: [{ name: 'name', label: 'Your name', placeholder: 'Shown in the lobby greeting' }],
    extra: `
      <div class="field"><span>Backup</span>
        <p class="hint">Everything is saved only on this device. Export a backup now and then so nothing gets lost.</p>
        <div class="row">
          <button type="button" class="btn ghost" data-x="export">Export backup</button>
          <label class="btn ghost">Import backup<input type="file" accept="application/json,.json" class="vh" data-x="import"></label>
        </div>
      </div>
      <div class="field"><span>Danger zone</span>
        <button type="button" class="btn danger" data-x="erase">${icon('trash')}Erase all data</button>
      </div>`,
    onOpen(form) {
      form.querySelector('[data-x=export]').onclick = exportData;
      form.querySelector('[data-x=import]').onchange = e => importData(e.target.files[0]);
      form.querySelector('[data-x=erase]').onclick = eraseAll;
    },
    onSave(v) { db.settings.name = v.name; save('settings'); render(); },
  });
}

function exportData() {
  const data = { app: 'grove', version: 1, exported: new Date().toISOString() };
  KEYS.forEach(k => { data[k] = db[k]; });
  const json = JSON.stringify(data, null, 2);
  const name = `grove-backup-${today()}.json`;
  const file = new File([json], name, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({ files: [file], title: 'Grove backup' }).catch(() => {});
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
      if (!data || data.app !== 'grove') throw new Error('not a Grove backup');
      if (!confirm('Replace everything on this device with this backup?')) return;
      KEYS.forEach(k => {
        const ok = Array.isArray(DEFAULTS[k]) ? Array.isArray(data[k]) : data[k] && typeof data[k] === 'object';
        db[k] = ok ? data[k] : clone(DEFAULTS[k]);
        save(k);
      });
      closeSheet(); render(); toast('Backup restored');
    } catch (_) {
      toast('That file isn’t a Grove backup');
    }
  };
  reader.readAsText(file);
}

function eraseAll() {
  if (!confirm('Erase every diary entry, event, task, goal and dream on this device? This cannot be undone.')) return;
  KEYS.forEach(k => { db[k] = clone(DEFAULTS[k]); try { localStorage.removeItem(PREFIX + k); } catch (_) {} });
  closeSheet(); render(); toast('All data erased');
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
      <button type="button" class="link" data-close>Cancel</button>
      <h2>${esc(o.title)}</h2>
      <button type="submit" class="link strong">${o.saveLabel || 'Save'}</button>
    </div>
    <div class="sheet-body">
      ${o.fields.map(f => (f.when ? `<div class="when" data-when="${f.when}">${field(f, values)}</div>` : field(f, values))).join('')}
      ${o.extra || ''}
      ${o.onDelete ? `<button type="button" class="btn danger" data-delete>${icon('trash')}Delete</button>` : ''}
    </div>
  </form>`;
  const form = sheet.firstElementChild;
  form.querySelector('[data-close]').onclick = closeSheet;

  // Let a selected chip be tapped again to clear it.
  form.addEventListener('click', e => {
    const r = e.target.closest('input[type=radio]');
    if (!r) return;
    if (r.dataset.was === '1') r.checked = false;
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
        toast(`${f.label} is needed`);
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
    if (!confirm('Remove all completed tasks?')) return;
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
    if (g.done) toast('Goal achieved — well done');
  },

  'new-dream': () => dreamSheet(),
  'edit-dream': d => dreamSheet(find('dreams', d.id)),
  'dream-filter'(d) { ui.dreamFilter = d.f; render(); },
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

const VIEWS = { lobby, diary, calendar, todo, goals, dreams };
const app = document.getElementById('app');

function render() { app.innerHTML = VIEWS[ui.view](); }

function route() {
  const id = location.hash.replace(/^#\/?/, '');
  ui.view = VIEWS[id] ? id : 'lobby';
  if (sheet.open) closeSheet();
  render();
  app.classList.remove('enter'); void app.offsetWidth; app.classList.add('enter');
  window.scrollTo(0, 0);
  document.title = ui.view === 'lobby' ? 'Grove' : `${sec(ui.view).title} · Grove`;
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
