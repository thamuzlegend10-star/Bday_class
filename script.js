/* Birthday Tracker: data comes from birthdays.js (window.birthdays) */

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const today = new Date();
today.setHours(0, 0, 0, 0);

const people = (window.birthdays || []).map((p) => {
  const [y, m, d] = (p.date || p.birthday).split('-').map(Number);
  return { name: p.name, y, m, d };
});

const fmt = (date, opts) => date.toLocaleDateString('en', opts);
const hue = (name) => [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
const initial = (name) => esc((name.match(/[A-Za-z0-9]/) || ['?'])[0].toUpperCase());

function nextOf(p) {
  const t = new Date(today.getFullYear(), p.m - 1, p.d);
  if (t < today) t.setFullYear(t.getFullYear() + 1);
  return t;
}

const upcoming = people
  .map((p) => {
    const next = nextOf(p);
    return { ...p, next, left: Math.round((next - today) / 864e5), age: next.getFullYear() - p.y };
  })
  .sort((a, b) => a.left - b.left);

const when = (left) => (left === 0 ? 'Today' : left === 1 ? 'Tomorrow' : `${left} days`);

/* ---------- Dashboard ---------- */
function renderHero() {
  $('today-label').textContent = fmt(today, { weekday: 'long', month: 'long', day: 'numeric' });
  if (!upcoming.length) { $('hero-name').textContent = 'No birthdays yet'; return; }

  const first = upcoming[0];
  const group = upcoming.filter((p) => p.left === first.left);
  $('hero-name').textContent = group.map((p) => p.name).join(' & ');
  $('hero-sub').textContent = first.left === 0
    ? `Celebrating today. Turning ${group.map((p) => p.age).join(' & ')}!`
    : `Turns ${group.map((p) => p.age).join(' & ')} on ${fmt(first.next, { weekday: 'long', month: 'long', day: 'numeric' })}`;

  const pct = first.left === 0 ? 100 : Math.max(4, (1 - first.left / 365) * 100);
  requestAnimationFrame(() => { $('xp-fill').style.width = pct + '%'; });
  $('xp-label').textContent = first.left === 0 ? 'Level up! Happy birthday' : `${when(first.left)} to go`;
}

function renderStats() {
  const month = today.getMonth() + 1;
  $('stat-total').textContent = people.length;
  $('stat-month').textContent = people.filter((p) => p.m === month).length;
  $('stat-month-hint').textContent = `in ${MONTHS[month - 1]}`;
  if (upcoming.length) {
    $('stat-next-days').textContent = upcoming[0].left === 0 ? 'Today' : `${upcoming[0].left}d`;
    $('stat-next-name').textContent = upcoming[0].name;
  }
}

function renderList() {
  const items = upcoming.slice(0, 6);
  $('birthday-list').innerHTML = items.length
    ? items.map((p) => `
      <article class="row${p.left === 0 ? ' is-today' : ''}">
        <div class="avatar" style="--h:${hue(p.name)}" aria-hidden="true">${initial(p.name)}</div>
        <div class="who"><b>${esc(p.name)}</b><span>${fmt(p.next, { weekday: 'short', month: 'short', day: 'numeric' })} · turns ${p.age}</span></div>
        <span class="chip">${when(p.left)}</span>
      </article>`).join('')
    : '<div class="empty">No birthdays on the list yet.</div>';
}

function renderMonths() {
  const counts = new Array(12).fill(0);
  people.forEach((p) => counts[p.m - 1]++);
  const max = Math.max(...counts, 1);
  $('bar-graph').innerHTML = counts.map((n, i) => `
    <div class="col${i === today.getMonth() ? ' is-now' : ''}" title="${MONTHS[i]}: ${n}">
      <em>${n}</em><i style="height:${(n / max) * 78}%"></i><span>${MONTHS[i].slice(0, 3)}</span>
    </div>`).join('');
}

/* ---------- Calendar ---------- */
const cal = { y: today.getFullYear(), m: today.getMonth(), sel: today.getDate() };

function renderDetail() {
  const box = $('day-detail');
  const inMonth = people.filter((p) => p.m === cal.m + 1);
  if (!cal.sel) {
    box.innerHTML = `<h2>${MONTHS[cal.m]}</h2><p class="sub">${inMonth.length} birthday${inMonth.length === 1 ? '' : 's'} this month. Tap a day to see who.</p>`;
    return;
  }
  const names = inMonth.filter((p) => p.d === cal.sel);
  const label = fmt(new Date(cal.y, cal.m, cal.sel), { weekday: 'long', month: 'long', day: 'numeric' });
  box.innerHTML = `<h2>${label}</h2>` + (names.length
    ? `<div class="list">${names.map((p) => `
        <article class="row"><div class="avatar" style="--h:${hue(p.name)}" aria-hidden="true">${initial(p.name)}</div>
        <div class="who"><b>${esc(p.name)}</b><span>Turns ${cal.y - p.y}</span></div></article>`).join('')}</div>`
    : '<div class="empty">No birthdays on this day.</div>');
}

function renderCalendar() {
  $('calendar-title').textContent = `${MONTHS[cal.m]} ${cal.y}`;
  const first = new Date(cal.y, cal.m, 1).getDay();
  const total = new Date(cal.y, cal.m + 1, 0).getDate();
  const has = new Set(people.filter((p) => p.m === cal.m + 1).map((p) => p.d));
  const isNowMonth = cal.y === today.getFullYear() && cal.m === today.getMonth();

  let html = '<span class="day pad" aria-hidden="true"></span>'.repeat(first);
  for (let d = 1; d <= total; d++) {
    const cls = ['day', has.has(d) && 'has', isNowMonth && d === today.getDate() && 'now', d === cal.sel && 'sel'].filter(Boolean).join(' ');
    html += `<button class="${cls}" data-day="${d}" aria-pressed="${d === cal.sel}" aria-label="${MONTHS[cal.m]} ${d}${has.has(d) ? ', has birthday' : ''}">${d}</button>`;
  }
  $('calendar-days').innerHTML = html;
  renderDetail();
}

function shiftMonth(step) {
  cal.m += step;
  if (cal.m < 0) { cal.m = 11; cal.y--; }
  if (cal.m > 11) { cal.m = 0; cal.y++; }
  cal.sel = null;
  renderCalendar();
}

$('cal-prev').addEventListener('click', () => shiftMonth(-1));
$('cal-next').addEventListener('click', () => shiftMonth(1));
$('calendar-days').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-day]');
  if (!btn) return;
  cal.sel = Number(btn.dataset.day);
  renderCalendar();
  $('calendar-days').querySelector(`[data-day="${cal.sel}"]`).focus();
});

/* ---------- Navigation ---------- */
function show(page) {
  if (!$('page-' + page)) page = 'birthdays';
  document.querySelectorAll('.page').forEach((p) => p.classList.toggle('is-on', p.id === 'page-' + page));
  document.querySelectorAll('.tab').forEach((t) => {
    const on = t.dataset.page === page;
    t.classList.toggle('is-on', on);
    if (on) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
  });
  history.replaceState(null, '', '#' + page);
  window.scrollTo(0, 0);
}
document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => show(t.dataset.page)));

/* ---------- Feedback form ---------- */
$('advice-form').addEventListener('submit', () => {
  $('form-hint').textContent = 'Opening your email app…';
});

/* ---------- Click sound (clones the node so rapid clicks stack) ---------- */
const click = $('mc-click-sound');
document.body.addEventListener('click', (e) => {
  if (!click || !e.target.closest('button, a, input, textarea, .row')) return;
  const s = click.cloneNode();
  s.volume = 0.4;
  s.play().catch(() => {});
});

/* ---------- Boot ---------- */
renderHero();
renderStats();
renderList();
renderMonths();
renderCalendar();
show(location.hash.slice(1) || 'birthdays');
