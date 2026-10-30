// Darstellung: jede Ansicht erzeugt HTML. Neu gezeichnet wird nur, wenn sich der Inhalt ändert –
// Zeitanzeigen und Fortschrittsbalken aktualisieren sich dazwischen von selbst (data-until / data-from).
import {
  CLASSES, MATERIALS, TRADER_GOODS, LOOT_GOODS, ITEMS, PRICE_LEVELS, REGIONS, REGION, UPGRADES, TRAITS, SLOTS,
  shelfSize, heroCap, craftSlots, maxTier,
} from './data.js';
import {
  className, gearOf, heroPower, xpNeeded, successChance, priceOf, craftBlocker, restockCost, stockCount, sellBackPrice, canAfford,
} from './sim.js';

export const ui = { tab: 'dorf', filter: 'alle' };

const fmtNum = (n) => Math.floor(n).toLocaleString('de-DE');

export function fmtDur(sec) {
  sec = Math.max(0, Math.ceil(sec));
  if (sec < 60) return `${sec} s`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m} min ${String(sec % 60).padStart(2, '0')} s`.replace(/ 0?0 s$/, '');
  const h = Math.floor(m / 60);
  return `${h} h ${String(m % 60).padStart(2, '0')} min`;
}

export function fmtAgo(sec) {
  if (sec < 60) return 'jetzt';
  if (sec < 3600) return `${Math.floor(sec / 60)} min`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} h`;
  return `${Math.floor(sec / 86400)} T`;
}

const costHtml = (s, cost) => Object.entries(cost).map(([k, v]) => {
  const have = k === 'gold' ? s.gold : s.mats[k];
  const icon = k === 'gold' ? '🪙' : MATERIALS[k].icon;
  return `<span class="${have < v ? 'miss' : ''}">${icon} ${v}</span>`;
}).join(' · ');

// Restzeit in echter Zeit (Spielsekunden / Tempo)
const timer = (until) => `<span data-until="${until}"></span>`;
const bar = (from, to, cls = '') => `<div class="bar ${cls}"><i data-from="${from}" data-to="${to}"></i></div>`;

// ---------------------------------------------------------------- Kopf

export function renderTop(s) {
  const goldEl = document.querySelector('#gold b');
  const txt = fmtNum(s.gold) + (s.escrow > 0 ? ` <small>(+${fmtNum(s.escrow)})</small>` : '');
  if (goldEl.innerHTML !== txt) {
    if (goldEl.dataset.v && Number(goldEl.dataset.v) < s.gold) {
      const g = document.getElementById('gold');
      g.classList.remove('bump'); void g.offsetWidth; g.classList.add('bump');
    }
    goldEl.innerHTML = txt;
    goldEl.dataset.v = s.gold;
  }
  const mats = [...TRADER_GOODS, ...LOOT_GOODS].map((m) => {
    const n = s.mats[m];
    const rare = LOOT_GOODS.includes(m);
    if (rare && n === 0 && !s.bounties[m].want) return '';
    return `<span class="mat ${rare ? 'rare' : ''} ${n ? '' : 'zero'}" title="${MATERIALS[m].name}">${MATERIALS[m].icon} ${n}</span>`;
  }).join('');
  const el = document.getElementById('mats');
  if (el.innerHTML !== mats) el.innerHTML = mats;
  // Hinweis-Punkte auf den Reitern
  const idle = craftSlots(s) - s.crafting.length;
  setDot('schmiede', idle > 0 && stockCount(s) < shelfSize(s) ? idle : 0);
}

function setDot(tab, n) {
  const b = document.querySelector(`#tabs [data-tab="${tab}"]`);
  let d = b.querySelector('.dot');
  if (!n) { if (d) d.remove(); return; }
  if (!d) { d = document.createElement('i'); d.className = 'dot'; b.appendChild(d); }
  d.textContent = n;
}

// ---------------------------------------------------------------- Dorf

function scene(s) {
  const out = s.heroes.filter((h) => h.state === 'quest').length;
  const smoke = s.crafting.length > 0;
  return `<div class="scene"><svg viewBox="0 0 360 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2a3f"/><stop offset="0.6" stop-color="#4a3a4a"/><stop offset="1" stop-color="#c0794a"/></linearGradient>
      <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ffb35a" stop-opacity="0.9"/><stop offset="1" stop-color="#ffb35a" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="360" height="150" fill="url(#sky)"/>
    <circle cx="300" cy="28" r="12" fill="#f3e3b0" opacity="0.85"/>
    <g fill="#ffffff" opacity="0.6"><circle cx="40" cy="20" r="0.9"/><circle cx="90" cy="12" r="0.7"/><circle cx="150" cy="26" r="0.8"/><circle cx="210" cy="10" r="0.7"/><circle cx="250" cy="34" r="0.6"/><circle cx="340" cy="14" r="0.8"/></g>
    <path d="M0 95 L40 60 L70 80 L120 35 L160 75 L200 50 L245 85 L290 30 L330 70 L360 55 L360 150 L0 150Z" fill="#2c3346"/>
    <path d="M282 38 L290 30 L298 38 L292 36 L290 39 L288 36Z" fill="#e9eef7" opacity="0.8"/>
    ${s.flags.dragon ? '' : '<path d="M268 22 q6 -6 12 0 q4 -5 9 -1 l-6 3 q-4 3 -9 1 q-3 2 -6 -3Z" fill="#160e10" opacity="0.85"/>'}
    <path d="M0 110 Q60 92 120 104 T240 100 T360 98 L360 150 L0 150Z" fill="#1b2a1e"/>
    <g fill="#13201a">${[10, 28, 46, 300, 322, 344].map((x, i) => `<path d="M${x} ${112 - (i % 2) * 6} l9 -26 l9 26Z"/>`).join('')}</g>
    <path d="M0 124 Q90 112 180 120 T360 118 L360 150 L0 150Z" fill="#263a28"/>
    <!-- Taverne -->
    <rect x="70" y="96" width="56" height="30" fill="#d8c9a4"/><path d="M70 96 h56 M70 110 h56 M84 96 v30 M112 96 v30" stroke="#4a2f1d" stroke-width="2"/>
    <path d="M64 98 L98 76 L132 98Z" fill="#7a3b2c"/><rect x="92" y="112" width="10" height="14" fill="#3a2414"/>
    <rect x="76" y="100" width="6" height="6" fill="#ffcf73"/><rect x="116" y="100" width="6" height="6" fill="#ffcf73"/>
    <text x="98" y="92" font-size="9" text-anchor="middle">🍺</text>
    <!-- Laden -->
    <rect x="150" y="100" width="48" height="26" fill="#e3d4ae"/><path d="M150 100 h48 M162 100 v26 M186 100 v26" stroke="#5b3b24" stroke-width="2"/>
    <path d="M144 102 L174 82 L204 102Z" fill="#5d6b3a"/><path d="M150 112 h48 l-4 6 h-40Z" fill="#b8473a"/>
    <rect x="168" y="114" width="12" height="12" fill="#3a2414"/>
    <!-- Schmiede -->
    <rect x="222" y="102" width="50" height="24" fill="#8d8579"/><path d="M216 104 L247 86 L278 104Z" fill="#4b4f57"/>
    <rect x="258" y="80" width="8" height="18" fill="#6c665c"/>
    <rect x="232" y="112" width="14" height="14" fill="#2a1a10"/><circle cx="239" cy="119" r="${smoke ? 14 : 6}" fill="url(#glow)"/>
    ${smoke ? '<g fill="#cfc8bd" opacity="0.35"><circle cx="262" cy="72" r="4"/><circle cx="266" cy="62" r="5"/><circle cx="262" cy="50" r="6"/></g>' : ''}
    <path d="M0 140 Q180 128 360 140 L360 150 L0 150Z" fill="#7a6648" opacity="0.6"/>
  </svg><div class="caption">${s.heroes.length} Helden im Dorf · ${out} auf Abenteuer${s.flags.dragon ? ' · 🐲 Der Drache ist besiegt!' : ''}</div></div>`;
}

function viewDorf(s) {
  const inShop = stockCount(s) - s.crafting.length;
  let html = scene(s);
  html += `<div class="summary">
    <div><b>${s.heroes.filter((h) => h.state === 'quest').length}/${s.heroes.length}</b>unterwegs</div>
    <div><b>${inShop}/${shelfSize(s)}</b>im Regal</div>
    <div><b>${fmtNum(s.stats.sold)}</b>verkauft</div></div>`;
  html += '<h2>Ausbau <small>Investiere in Eichenfurt</small></h2>';
  for (const [key, def] of Object.entries(UPGRADES)) {
    const lvl = s.upgrades[key];
    const cost = def.costs[lvl];
    html += `<div class="card"><div class="row"><div class="big">${def.icon}</div><div class="grow">
      <div class="name">${def.name} <span class="tag">Stufe ${lvl + 1}</span></div>
      <div class="sub">${def.desc}</div>
      <div class="sub">Jetzt: ${def.effect(lvl)}${cost ? ` → <span class="good">${def.effect(lvl + 1)}</span>` : ''}</div>
      ${cost ? `<div class="cost">${costHtml(s, cost)}</div>` : '<div class="cost good">Voll ausgebaut</div>'}
    </div>${cost ? `<button class="btn small" data-act="upgrade" data-id="${key}" ${canAfford(s, cost) ? '' : 'disabled'}>Ausbauen</button>` : ''}</div></div>`;
  }
  html += '<h2>Chronik</h2><ul class="log">';
  for (const e of s.log.slice(-50).reverse()) html += `<li class="${e.kind}"><time data-t="${e.t}"></time><span>${e.text}</span></li>`;
  html += '</ul>';
  return html;
}

// ---------------------------------------------------------------- Helden

function heroState(s, h) {
  switch (h.state) {
    case 'quest': {
      const r = REGION[h.region];
      return `<div class="state">${r.icon} Unterwegs: <b>${r.name}</b> · zurück in ${timer(h.until)} · Chance ${Math.round(h.chance * 100)} %</div>${bar(h.since, h.until)}`;
    }
    case 'laden': return `<div class="state">🛒 Stöbert in deinem Laden</div>`;
    case 'verletzt': return `<div class="state bad">🩸 Verletzt beim Heiler · wieder fit in ${timer(h.until)}</div>`;
    default: return `<div class="state">🍺 In der Taverne · Ausdauer ${Math.round(h.energy / 10) * 10} %</div><div class="bar energy"><i style="width:${Math.round(h.energy / 10) * 10}%"></i></div>`;
  }
}

function viewHelden(s) {
  let html = `<h2>Helden <small>${s.heroes.length} / ${heroCap(s)} Zimmer in der Taverne</small></h2>
    <p class="hint">Du schickst niemanden los – Helden entscheiden selbst. Was sie lockt: gute Ausrüstung, Kopfgelder am Brett, ihre Laune und ihre Vorlieben.</p>`;
  for (const h of s.heroes) {
    const w = gearOf(h, 'waffe');
    const a = gearOf(h, 'ruestung');
    const mood = h.mood >= 70 ? '😄' : h.mood >= 45 ? '🙂' : h.mood >= 25 ? '😒' : '😠';
    html += `<div class="card hero"><div class="row"><div class="big">${CLASSES[h.cls].icon}</div><div class="grow">
      <div class="name">${h.name} <span class="muted" style="font-weight:400">${h.epithet}</span></div>
      <div class="sub">${className(h)} · Stufe ${h.level} · ⚔️ ${heroPower(h)} Kampfkraft</div></div></div>
      ${heroState(s, h)}
      <div class="thought">${h.name} ${h.thought.startsWith('„') ? 'meint: ' + h.thought : h.thought}</div>
      <div class="stats"><span>🪙 <b>${fmtNum(h.gold)}</b></span><span>${mood} <b>${Math.round(h.mood)}</b> Laune</span>
        <span>✨ <b>${h.xp}/${xpNeeded(h.level)}</b> EP</span><span>🏆 <b>${h.wins}</b>/${h.quests} Abenteuer</span></div>
      <div class="stats"><span>${w.icon || '🗡️'} <b>${w.name}</b> (+${w.power})</span><span>${a.icon || '🧥'} <b>${a.name}</b> (+${a.power})</span></div>
      <details><summary>Wesen &amp; Erfolgsaussichten</summary>
        <div>${h.traits.map((t) => `<span class="tag" title="${TRAITS[t].desc}">${TRAITS[t].name}</span>`).join('')}
          <span class="tag good">♥ ${REGION[h.likes].name}</span><span class="tag bad">✗ ${REGION[h.dislikes].name}</span></div>
        <div class="sub">${h.traits.map((t) => `${TRAITS[t].name}: ${TRAITS[t].desc}`).join(' ')}</div>
        <div class="chance">${REGIONS.map((r) => {
          const p = successChance(heroPower(h), r.danger);
          return `<span>${r.icon} ${r.name}</span><span></span><span class="${p >= 0.7 ? 'good' : p < 0.35 ? 'bad' : ''}">${Math.round(p * 100)} %</span>`;
        }).join('')}</div>
      </details></div>`;
  }
  return html;
}

// ---------------------------------------------------------------- Schmiede

function wishedBy(s, id) {
  return s.heroes.filter((h) => h.wish === id);
}

function viewSchmiede(s) {
  let html = `<h2>Werkbänke <small>${s.crafting.length} / ${craftSlots(s)} belegt · Regal ${stockCount(s)} / ${shelfSize(s)}</small></h2>`;
  if (!s.crafting.length) html += '<p class="hint">Die Esse ist kalt. Wähle unten ein Rezept.</p>';
  for (const job of s.crafting) {
    const it = ITEMS[job.item];
    html += `<div class="card"><div class="row"><div class="big">${it.icon}</div><div class="grow"><div class="name">${it.name}</div>
      <div class="sub">fertig in ${timer(job.done)}</div>${bar(job.start, job.done)}</div></div></div>`;
  }
  html += '<h2>Fahrender Händler <small>Grundstoffe</small></h2><div class="card">';
  for (const m of TRADER_GOODS) {
    const mt = MATERIALS[m];
    html += `<div class="row" style="margin:4px 0"><div class="big" style="font-size:20px">${mt.icon}</div><div class="grow">${mt.name} <span class="sub">· ${mt.buy} Gold · Lager ${s.mats[m]}</span></div>
      <button class="btn small" data-act="buy" data-id="${m}" data-n="1" ${s.gold < mt.buy ? 'disabled' : ''}>+1</button>
      <button class="btn small" data-act="buy" data-id="${m}" data-n="5" ${s.gold < mt.buy * 5 ? 'disabled' : ''}>+5</button></div>`;
  }
  html += '</div>';
  const filters = [['alle', 'Alle'], ...Object.entries(CLASSES).map(([k, c]) => [k, c.icon]), ['trank', '🧪']];
  html += `<h2>Rezepte</h2><div class="seg" style="margin-bottom:8px">${filters.map(([k, l]) => `<button data-act="filter" data-id="${k}" class="${ui.filter === k ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  const items = Object.values(ITEMS).filter((it) => it.tier <= maxTier(s) + 1)
    .filter((it) => ui.filter === 'alle' || (ui.filter === 'trank' ? it.slot === 'trank' : it.cls === ui.filter))
    .sort((a, b) => wishedBy(s, b.id).length - wishedBy(s, a.id).length || a.tier - b.tier || (a.cls || 'z').localeCompare(b.cls || 'z') || a.slot.localeCompare(b.slot));
  for (const it of items) {
    const block = craftBlocker(s, it.id);
    const fans = wishedBy(s, it.id);
    const extra = restockCost(s, it.id);
    html += `<div class="card"><div class="row"><div class="big">${it.icon}</div><div class="grow">
      <div class="name">${it.name} <span class="tag">St. ${it.tier}</span>${it.cls ? `<span class="tag">${CLASSES[it.cls].icon} ${SLOTS[it.slot]}</span>` : '<span class="tag">Trank</span>'}</div>
      <div class="sub">${it.boost ? `+${Math.round(it.boost * 100)} % Kampfkraft für ein Abenteuer` : `+${it.power} Kampfkraft`} · Wert ${it.price} 🪙 · ⏳ ${fmtDur(it.time / s.speed)} · im Regal ${s.stock[it.id] || 0}</div>
      <div class="cost">${costHtml(s, it.cost)}</div>
      ${fans.length ? `<div class="sub" style="color:var(--gold)">Gewünscht von ${fans.map((h) => h.name).join(', ')}</div>` : ''}
      ${block ? `<div class="why">${block}</div>` : extra ? `<div class="sub">Fehlende Grundstoffe werden für ${extra} 🪙 nachgekauft.</div>` : ''}
    </div><button class="btn small primary" data-act="craft" data-id="${it.id}" ${block ? 'disabled' : ''}>Schmieden</button></div></div>`;
  }
  return html;
}

// ---------------------------------------------------------------- Laden

function viewLaden(s) {
  const inShop = stockCount(s) - s.crafting.length;
  let html = `<h2>Auslage <small>${inShop} ${inShop === 1 ? 'Ware' : 'Waren'} · Regal ${stockCount(s)} / ${shelfSize(s)}</small></h2>`;
  const wishes = s.heroes.filter((h) => h.wish);
  html += '<div class="card"><div class="name">💭 Nachfrage</div>';
  if (!wishes.length) html += '<div class="sub">Gerade wünscht sich niemand etwas Bestimmtes.</div>';
  for (const h of wishes) {
    const it = ITEMS[h.wish];
    const ok = (s.stock[it.id] || 0) > 0;
    html += `<div class="sub">${CLASSES[h.cls].icon} ${h.name} hätte gern <b style="color:var(--text)">${it.icon} ${it.name}</b> · hat ${fmtNum(h.gold)} 🪙${ok ? ' · <span class="good">vorrätig</span>' : it.tier > maxTier(s) ? ` · <span class="bad">Schmiede St. ${it.tier} nötig</span>` : ''}</div>`;
  }
  html += '</div>';
  const ids = Object.keys(s.stock).filter((id) => s.stock[id] > 0);
  if (!ids.length) html += '<p class="hint">Das Regal ist leer. In der Schmiede stellst du Waren her.</p>';
  for (const id of ids) {
    const it = ITEMS[id];
    const cur = s.prices[id] ?? 1;
    html += `<div class="card"><div class="row"><div class="big">${it.icon}</div><div class="grow">
      <div class="name">${it.name} <span class="tag">×${s.stock[id]}</span></div>
      <div class="sub">Verkaufspreis <b style="color:var(--gold)">${priceOf(s, id)} 🪙</b> ${it.cls ? `· für ${CLASSES[it.cls].name}` : '· für alle'}</div></div>
      <button class="btn small" data-act="sellback" data-id="${id}" title="An den fahrenden Händler">⇄ ${sellBackPrice(id)}</button></div>
      <div class="seg" style="margin-top:8px">${PRICE_LEVELS.map((p, i) => `<button data-act="price" data-id="${id}" data-n="${i}" class="${cur === i ? 'on' : ''}">${p.name} ${Math.round(it.price * p.mult)}</button>`).join('')}</div></div>`;
  }
  html += `<p class="hint">Teure Preise bringen mehr Gold pro Stück – aber geizige Helden kaufen nur fair oder günstig, und Wucher zahlt nur, wer im Gold schwimmt. ⇄ verkauft Ladenhüter für die Hälfte an den fahrenden Händler.</p>`;
  return html;
}

// ---------------------------------------------------------------- Brett

function viewBrett(s) {
  let html = `<h2>Auftragsbrett <small>${fmtNum(s.escrow)} 🪙 hinterlegt</small></h2>
    <p class="hint">Seltene Materialien bekommst du nur von Helden. Setze ein Kopfgeld pro Stück – das Gold wird hinterlegt und bei Lieferung ausgezahlt. Ob sich jemand traut, entscheiden die Helden selbst.</p>`;
  for (const m of LOOT_GOODS) {
    const mt = MATERIALS[m];
    const bt = s.bounties[m];
    const reg = REGIONS.find((r) => r.loot[m]);
    const brave = s.heroes.filter((h) => successChance(heroPower(h), reg.danger) >= 0.5).length;
    const step = Math.max(1, Math.round(mt.bounty / 4));
    html += `<div class="card"><div class="row"><div class="big">${mt.icon}</div><div class="grow">
      <div class="name">${mt.name} <span class="sub">· Lager ${s.mats[m]}</span></div>
      <div class="sub">aus ${reg.icon} ${reg.name} · ${brave ? `<span class="${brave ? 'good' : ''}">${brave} Held${brave > 1 ? 'en' : ''} gut genug</span>` : '<span class="bad">noch niemand stark genug</span>'}</div></div></div>
      <div class="row" style="margin-top:8px;flex-wrap:wrap;gap:8px 14px">
        <div class="stepper"><label>Kopfgeld</label><button data-act="bounty" data-id="${m}" data-r="${-step}" data-w="0">−</button><b>${bt.reward}</b><button data-act="bounty" data-id="${m}" data-r="${step}" data-w="0">+</button></div>
        <div class="stepper"><label>Gesucht</label><button data-act="bounty" data-id="${m}" data-r="0" data-w="-1">−</button><b>${bt.want}</b><button data-act="bounty" data-id="${m}" data-r="0" data-w="1">+</button></div>
      </div>${bt.want ? `<div class="sub" style="margin-top:4px">Hinterlegt: ${bt.want * bt.reward} 🪙</div>` : ''}</div>`;
  }
  html += '<h2>Gebiete</h2>';
  for (const r of REGIONS) {
    const there = s.heroes.filter((h) => h.state === 'quest' && h.region === r.id);
    html += `<div class="card"><div class="row"><div class="big">${r.icon}</div><div class="grow">
      <div class="name">${r.name} <span class="tag">Gefahr ${r.danger}</span></div>
      <div class="sub">${r.flavor}</div>
      <div class="sub">⏳ ~${fmtDur(r.time / s.speed)} · ${r.gold[0]}–${r.gold[1]} 🪙${Object.keys(r.loot).map((m) => ` · ${MATERIALS[m].icon} ${MATERIALS[m].name}`).join('')}</div>
      ${there.length ? `<div class="sub" style="color:var(--gold)">Dort: ${there.map((h) => h.name).join(', ')}</div>` : ''}
    </div></div></div>`;
  }
  return html;
}

const VIEWS = { dorf: viewDorf, helden: viewHelden, schmiede: viewSchmiede, laden: viewLaden, brett: viewBrett };

let lastHtml = '';
let lastTab = '';
export function renderView(s, force = false) {
  const html = VIEWS[ui.tab](s);
  const main = document.getElementById('view');
  if (force || html !== lastHtml) {
    main.innerHTML = html;
    lastHtml = html;
  }
  if (lastTab !== ui.tab) { main.scrollTop = 0; lastTab = ui.tab; }
  document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === ui.tab));
  updateTimers(s);
}

export function updateTimers(s) {
  const main = document.getElementById('view');
  for (const el of main.querySelectorAll('[data-until]')) el.textContent = fmtDur((Number(el.dataset.until) - s.time) / s.speed);
  for (const el of main.querySelectorAll('[data-from]')) {
    const a = Number(el.dataset.from), b = Number(el.dataset.to);
    el.style.width = `${Math.max(0, Math.min(100, ((s.time - a) / (b - a)) * 100))}%`;
  }
  for (const el of main.querySelectorAll('time[data-t]')) el.textContent = fmtAgo((s.time - Number(el.dataset.t)) / s.speed);
}
