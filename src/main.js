import { HOUR, MATERIALS, UPGRADES, offlineCapHours } from './data.js';
import {
  SAVE_VERSION, newGame, simulate, startCraft, buyMaterial, setBounty, upgrade, sellToTrader,
} from './sim.js';
import { ui, renderTop, renderView, updateTimers, fmtDur } from './ui.js';

// Spieltempo: 1× ist das „echte“ Spiel (ein paarmal am Tag reinschauen), höhere Stufen zum Testen.
const SPEEDS = [1, 10, 30, 60];
const DEFAULT_SPEED = 30; // während der Entwicklung schnell – später auf 1 stellen
const SAVE_KEY = 'fantasyidle.save.v1';
const AWAY_AFTER = 30; // echte Sekunden ohne Takt gelten als „weg gewesen“

let s = load() || newGame(speedFromUrl() || DEFAULT_SPEED);
window.game = s; // zum Ausprobieren in der Konsole

function speedFromUrl() {
  const v = Number(new URLSearchParams(location.search).get('speed'));
  return v > 0 ? v : null;
}

// ---------------------------------------------------------------- Speichern

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch { /* Speicher voll oder gesperrt */ }
}

function migrate(data) {
  if (!data || data.v !== SAVE_VERSION) return null;
  const base = newGame(data.speed || DEFAULT_SPEED);
  for (const k of Object.keys(base)) if (data[k] === undefined) data[k] = base[k];
  for (const k of ['mats', 'upgrades', 'bounties', 'stats', 'flags']) data[k] = { ...base[k], ...data[k] };
  return data;
}

function load() {
  try { return migrate(JSON.parse(localStorage.getItem(SAVE_KEY))); } catch { return null; }
}

const encode = (obj) => btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
const decode = (str) => JSON.parse(decodeURIComponent(escape(atob(str.trim()))));

// ---------------------------------------------------------------- Zeit

function tick() {
  if (document.hidden) return; // im Hintergrund nichts tun – beim Zurückkehren wird nachgerechnet
  const now = Date.now();
  const real = Math.max(0, (now - s.lastSave) / 1000);
  s.lastSave = now;
  if (real > AWAY_AFTER) away(real);
  else simulate(s, real * s.speed);
  renderTop(s);
  renderView(s);
}

// Nach einer Pause: verpasste Zeit nachrechnen (begrenzt durch das Lagerhaus) und berichten.
function away(real) {
  const want = real * s.speed;
  const cap = offlineCapHours(s) * HOUR;
  const game = Math.min(want, cap);
  const before = { gold: s.gold, time: s.time, stats: { ...s.stats }, mats: { ...s.mats }, heroes: s.heroes.length };
  simulate(s, game);
  showReport(real, want > cap, before);
}

function showReport(real, capped, b) {
  const d = (k) => s.stats[k] - b.stats[k];
  const lines = [];
  const gold = s.gold - b.gold;
  if (gold) lines.push(`🪙 ${gold > 0 ? '+' : ''}${Math.floor(gold)} Gold in der Kasse`);
  const pl = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  if (d('sold')) lines.push(`🛒 ${pl(d('sold'), 'Ware', 'Waren')} verkauft`);
  if (d('quests') || d('fails')) lines.push(`⚔️ ${d('quests')} Abenteuer bestanden${d('fails') ? `, ${d('fails')} gescheitert` : ''}`);
  for (const [m, n] of Object.entries(s.mats)) if (n > b.mats[m] && MATERIALS[m]) lines.push(`${MATERIALS[m].icon} +${n - b.mats[m]} ${MATERIALS[m].name} geliefert`);
  if (d('levelups')) lines.push(`⭐ ${pl(d('levelups'), 'Stufenaufstieg', 'Stufenaufstiege')}`);
  if (s.heroes.length > b.heroes) lines.push(`🍺 ${pl(s.heroes.length - b.heroes, 'neuer Held', 'neue Helden')} in der Taverne`);
  const story = s.log.filter((e) => e.t > b.time && (e.kind === 'story' || e.kind === 'good' || e.kind === 'bad')).slice(-6);
  openModal(`<h3>Während du fort warst …</h3>
    <p class="hint">Du warst ${fmtDur(real)} weg.${capped ? ` <span class="bad">Das Dorf hat nur ${offlineCapHours(s)} Spielstunden ohne dich weitergearbeitet – das Lagerhaus erhöht diese Grenze.</span>` : ''}</p>
    <ul class="report">${lines.map((l) => `<li>${l}</li>`).join('') || '<li class="muted">Es ist nichts Nennenswertes passiert.</li>'}</ul>
    ${story.length ? `<ul class="log">${story.map((e) => `<li class="${e.kind}"><span>${e.text}</span></li>`).join('')}</ul>` : ''}
    <div class="actions"><button class="btn primary" data-close>Weiter</button></div>`);
}

// ---------------------------------------------------------------- Dialoge

function openModal(html) {
  document.getElementById('sheet').innerHTML = html;
  document.getElementById('modal').hidden = false;
}
function closeModal() { document.getElementById('modal').hidden = true; }

function openSettings() {
  openModal(`<h3>Einstellungen</h3>
    <div class="name">Spieltempo</div>
    <p class="hint">1× ist das eigentliche Spiel: ein paarmal am Tag reinschauen. Höhere Stufen sind zum Testen – alles läuft entsprechend schneller.</p>
    <div class="seg">${SPEEDS.map((v) => `<button data-speed="${v}" class="${s.speed === v ? 'on' : ''}">${v}×</button>`).join('')}</div>
    <div class="name" style="margin-top:16px">Spielstand</div>
    <p class="hint">Der Spielstand liegt nur in diesem Browser. Mit dem Code kannst du ihn sichern oder auf ein anderes Gerät mitnehmen.</p>
    <textarea id="savecode" placeholder="Spielstand-Code hier einfügen …"></textarea>
    <div class="actions">
      <button class="btn" data-export>Exportieren</button>
      <button class="btn" data-import>Importieren</button>
      <button class="btn danger" data-reset>Neues Spiel</button>
    </div>
    <div class="actions"><button class="btn primary" data-close>Schließen</button></div>`);
}

document.getElementById('modal').addEventListener('click', async (e) => {
  const t = e.target.closest('button') || e.target;
  if (t.id === 'modal' || t.hasAttribute('data-close')) return closeModal();
  if (t.dataset.speed) {
    s.speed = Number(t.dataset.speed);
    save();
    openSettings();
  } else if (t.hasAttribute('data-export')) {
    const box = document.getElementById('savecode');
    box.value = encode(s);
    box.select();
    try { await navigator.clipboard.writeText(box.value); t.textContent = 'Kopiert ✓'; } catch { t.textContent = 'Markiert ✓'; }
  } else if (t.hasAttribute('data-import')) {
    try {
      const data = migrate(decode(document.getElementById('savecode').value));
      if (!data) throw new Error('version');
      data.lastSave = Date.now();
      s = window.game = data;
      save();
      closeModal();
      tick();
    } catch { t.textContent = 'Ungültiger Code'; }
  } else if (t.hasAttribute('data-reset')) {
    if (!confirm('Wirklich neu anfangen? Der aktuelle Spielstand geht verloren.')) return;
    s = window.game = newGame(s.speed);
    save();
    closeModal();
    tick();
  }
});

// ---------------------------------------------------------------- Eingaben

document.getElementById('tabs').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-tab]');
  if (!b) return;
  ui.tab = b.dataset.tab;
  renderView(s, true);
});

document.getElementById('btn-settings').addEventListener('click', openSettings);

document.getElementById('view').addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]');
  if (!b || b.disabled) return;
  const { act, id } = b.dataset;
  const n = Number(b.dataset.n);
  if (act === 'craft') startCraft(s, id);
  else if (act === 'buy') buyMaterial(s, id, n);
  else if (act === 'upgrade') upgrade(s, id, UPGRADES[id]);
  else if (act === 'sellback') sellToTrader(s, id);
  else if (act === 'price') s.prices[id] = n;
  else if (act === 'filter') ui.filter = id;
  else if (act === 'bounty') {
    const bt = s.bounties[id];
    setBounty(s, id, Math.max(1, bt.reward + Number(b.dataset.r)), Math.max(0, Math.min(30, bt.want + Number(b.dataset.w))));
  }
  save();
  renderTop(s);
  renderView(s);
});

// ---------------------------------------------------------------- Start

document.addEventListener('visibilitychange', () => {
  if (document.hidden) save(); else tick();
});
window.addEventListener('pagehide', save);

tick();
setInterval(tick, 250);
setInterval(() => updateTimers(s), 1000);
setInterval(save, 5000);

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
