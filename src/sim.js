// Die Spielwelt rechnet hier – ohne DOM, damit sie auch im Hintergrund (Offline-Fortschritt) und in Node laufen kann.
import {
  MIN, CLASSES, MATERIALS, TRADER_GOODS, LOOT_GOODS, ITEMS, STARTER, PRICE_LEVELS, REGIONS, REGION, TRAITS, TRAIT_CLASH, NAMES, EPITHETS,
  shelfSize, heroCap, craftSlots, healMult, maxTier,
} from './data.js';

export const SAVE_VERSION = 1;

const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------------------------------------------------------------- Neues Spiel

export function newGame(speed) {
  const s = {
    v: SAVE_VERSION,
    speed,
    time: 0,
    lastSave: Date.now(),
    gold: 120,
    escrow: 0,
    mats: { eisen: 4, holz: 4, stoff: 4, kraeuter: 4, wolfsfell: 0, spinnenseide: 0, mondkristall: 0, trollknochen: 0, drachenschuppe: 0 },
    bounties: Object.fromEntries(LOOT_GOODS.map((m) => [m, { reward: MATERIALS[m].bounty, want: 0 }])),
    stock: {},
    prices: {},
    crafting: [],
    heroes: [],
    nextHeroId: 1,
    nextHeroAt: 30 * MIN,
    upgrades: { schmiede: 0, werkbank: 0, regal: 0, taverne: 0, heiler: 0, lager: 0 },
    log: [],
    stats: { sold: 0, earned: 0, quests: 0, fails: 0, delivered: 0, heroes: 0, levelups: 0 },
    flags: {},
  };
  for (const cls of Object.keys(CLASSES)) addHero(s, cls);
  log(s, '🏰 Du übernimmst die Schmiede „Zum Goldenen Amboss“ in Eichenfurt. Helden brauchen Waffen – und du brauchst Gold.', 'story');
  return s;
}

export function log(s, text, kind = 'info') {
  s.log.push({ t: s.time, text, kind });
  if (s.log.length > 120) s.log.splice(0, s.log.length - 120);
}

// ---------------------------------------------------------------- Helden

function addHero(s, cls = pick(Object.keys(CLASSES))) {
  const sex = Math.random() < 0.5 ? 'f' : 'm';
  const used = new Set(s.heroes.map((h) => h.name));
  const name = pick(NAMES[sex].filter((n) => !used.has(n))) || pick(NAMES[sex]);
  const traits = [];
  const all = Object.keys(TRAITS);
  while (traits.length < 2) {
    const t = pick(all);
    if (traits.includes(t)) continue;
    if (TRAIT_CLASH.some((pair) => pair.includes(t) && pair.some((o) => o !== t && traits.includes(o)))) continue;
    traits.push(t);
  }
  const regionIds = REGIONS.map((r) => r.id);
  const likes = pick(regionIds);
  const dislikes = pick(regionIds.filter((r) => r !== likes));
  const avgLevel = s.heroes.length ? s.heroes.reduce((a, h) => a + h.level, 0) / s.heroes.length : 1;
  const h = {
    id: s.nextHeroId++,
    name,
    sex,
    epithet: EPITHETS[traits[0]][sex === 'f' ? 0 : 1],
    cls,
    level: Math.max(1, Math.round(avgLevel * 0.6)),
    xp: 0,
    gold: randInt(32, 50),
    gear: { waffe: null, ruestung: null },
    traits,
    likes,
    dislikes,
    mood: 60,
    energy: 100,
    state: 'taverne',
    until: 0,
    nextThink: s.time + rand(0.5, 3) * MIN,
    thought: 'ist gerade erst im Dorf angekommen.',
    wish: null,
    joined: s.time,
    quests: 0,
    wins: 0,
  };
  s.heroes.push(h);
  s.stats.heroes++;
  return h;
}

export const className = (h) => (h.sex === 'f' ? CLASSES[h.cls].female : CLASSES[h.cls].name);
export const gearOf = (h, slot) => (h.gear[slot] ? ITEMS[h.gear[slot]] : STARTER[slot]);
export const heroPower = (h) => h.level * 3 + gearOf(h, 'waffe').power + gearOf(h, 'ruestung').power;
export const xpNeeded = (level) => Math.round(15 * Math.pow(level, 1.4));
const traitVal = (h, key, def) => h.traits.reduce((v, t) => (TRAITS[t][key] !== undefined ? v * TRAITS[t][key] : v), def);
const has = (h, t) => h.traits.includes(t);

export function successChance(power, danger) {
  const r = power / danger;
  return clamp(1 / (1 + Math.exp(-4 * (r - 0.85))), 0.03, 0.97);
}

export const priceOf = (s, id) => Math.round(ITEMS[id].price * PRICE_LEVELS[s.prices[id] ?? 1].mult);

// Wieviel ist ein Gebiet einem Helden wert? Liefert Bewertung und Gründe (für Gedanken und Anzeige).
export function rateRegion(s, h, region) {
  const p = successChance(heroPower(h), region.danger);
  let lootVal = 0;
  let bountyVal = 0;
  for (const [m, [a, b]] of Object.entries(region.loot)) {
    const avg = (a + b) / 2;
    const bt = s.bounties[m];
    if (bt && bt.want > 0) bountyVal += Math.min(avg, bt.want) * bt.reward;
    lootVal += avg * MATERIALS[m].bounty * 0.25; // Restbeute verkaufen sie anderswo billig
  }
  const gold = (region.gold[0] + region.gold[1]) / 2;
  const greed = traitVal(h, 'greed', 1);
  const value = gold + lootVal + bountyVal * greed;
  let mult = 0.6 + (h.mood / 100) * 0.8;
  if (h.likes === region.id) mult *= 1.4;
  if (h.dislikes === region.id) mult *= 0.35;
  const fear = traitVal(h, 'fear', 1);
  const risk = (1 - p) * fear * (region.danger * 0.8 + 4);
  const glory = has(h, 'ruhmsuechtig') ? region.danger * 0.4 * p : 0;
  // Pro Stunde rechnen, damit lange Reisen nicht automatisch attraktiver sind
  const hours = region.time / 3600;
  const score = ((p * value) * mult + glory - risk) / Math.sqrt(hours);
  const minP = has(h, 'mutig') ? 0.15 : has(h, 'vorsichtig') ? 0.55 : 0.3;
  return { region, p, score, bountyVal, tooRisky: p < minP };
}

// Bestes Upgrade im Laden, das sich ein Held leisten will. Gibt auch Gründe zurück, warum nicht.
function shopChoice(s, h) {
  let best = null;
  let tooPricey = null;
  for (const [id, n] of Object.entries(s.stock)) {
    if (n <= 0) continue;
    const it = ITEMS[id];
    if (it.cls !== h.cls) continue;
    const gain = it.power - gearOf(h, it.slot).power;
    if (gain <= 0) continue;
    const price = priceOf(s, id);
    const mult = PRICE_LEVELS[s.prices[id] ?? 1].mult;
    const tolerance = has(h, 'geizig') ? 1 : 1.25;
    if (price > h.gold) continue;
    if (mult > tolerance && h.gold < price * 2.5) { tooPricey = it; continue; }
    if (!best || gain > best.gain) best = { id, gain, price };
  }
  return { best, tooPricey };
}

// Was würde der Held sich als Nächstes wünschen? (für die Nachfrage-Anzeige im Laden)
function computeWish(s, h) {
  let wish = null;
  for (const it of Object.values(ITEMS)) {
    if (it.cls !== h.cls) continue;
    const gain = it.power - gearOf(h, it.slot).power;
    if (gain <= 0 || it.price > h.gold * 1.1) continue;
    if (!wish || gain > wish.gain) wish = { id: it.id, gain };
  }
  return wish ? wish.id : null;
}

function think(s, h) {
  h.nextThink = s.time + rand(4, 8) * MIN;
  h.wish = computeWish(s, h);
  if (h.energy < 70) {
    h.thought = pick(['erholt sich in der Taverne.', 'sitzt bei einem Krug Met am Feuer.', `schläft ${h.sex === 'f' ? 'ihren' : 'seinen'} Rausch aus.`, 'flickt die Ausrüstung in der Taverne.']);
    return;
  }
  // 1. Einkaufen?
  const { best, tooPricey } = shopChoice(s, h);
  if (best) {
    h.state = 'laden';
    h.until = s.time + rand(5, 10) * MIN;
    h.target = best.id;
    h.thought = `schlendert zu deinem Laden – das ${ITEMS[best.id].name} sieht verlockend aus.`;
    return;
  }
  if (tooPricey && Math.random() < 0.5) {
    h.mood = clamp(h.mood - 3, 0, 100);
    h.thought = `„${PRICE_LEVELS[s.prices[tooPricey.id] ?? 1].name}? Für ein ${tooPricey.name}? Halsabschneider!“`;
  }
  // 2. Auf Abenteuer?
  const ratings = REGIONS.map((r) => rateRegion(s, h, r));
  const lazy = traitVal(h, 'lazy', 1) * rand(0.6, 1.4);
  const threshold = 5 * lazy;
  const ok = ratings.filter((r) => !r.tooRisky && r.score > threshold);
  if (ok.length) {
    const total = ok.reduce((a, r) => a + r.score * r.score, 0);
    let roll = Math.random() * total;
    let choice = ok[0];
    for (const r of ok) { roll -= r.score * r.score; if (roll <= 0) { choice = r; break; } }
    const reg = choice.region;
    h.state = 'quest';
    h.region = reg.id;
    h.chance = choice.p;
    const potion = choice.p < 0.9 && buyPotion(s, h);
    if (potion) h.chance = successChance(heroPower(h) * (1 + potion.boost), reg.danger);
    h.since = s.time;
    h.until = s.time + reg.time * rand(0.85, 1.15);
    h.quests++;
    const why = choice.bountyVal > 0 ? 'die Kopfgelder am Brett locken.'
      : h.likes === reg.id ? `da zieht es ${h.sex === 'f' ? 'sie' : 'ihn'} immer wieder hin.`
      : has(h, 'ruhmsuechtig') && reg.danger >= 35 ? 'Ruhm wartet!'
      : 'ein bisschen Gold verdienen.';
    h.thought = `zieht los: ${reg.icon} ${reg.name} – ${why}`;
    log(s, `${reg.icon} ${h.name} zieht ${reg.to}.`, 'go');
    return;
  }
  // 3. Keine Lust – erklären, warum
  const bountyRegion = ratings.filter((r) => r.bountyVal > 0).sort((a, b) => b.bountyVal - a.bountyVal)[0];
  if (bountyRegion && (bountyRegion.tooRisky || bountyRegion.score <= threshold)) {
    const reg = bountyRegion.region;
    if (h.dislikes === reg.id) h.thought = `„${reg.name}? Nicht für alles Gold der Welt. Ich hasse ${reg.fear}.“`;
    else if (bountyRegion.tooRisky || bountyRegion.p < 0.5) h.thought = `„${reg.name}? Mit dieser Ausrüstung? Da bräuchte ich schon Besseres.“`;
    else h.thought = `„Für die paar Münzen gehe ich nicht ${reg.to}.“`;
  } else if (!tooPricey) {
    h.thought = pick(['hat heute einfach keine Lust.', 'würfelt lieber in der Taverne.', 'erzählt zum dritten Mal dieselbe Heldengeschichte.', 'wartet auf ein lohnendes Kopfgeld.']);
  }
}

// Vor dem Aufbruch: stärksten bezahlbaren Trank aus dem Laden mitnehmen.
function buyPotion(s, h) {
  const tolerance = has(h, 'geizig') ? 1 : 1.25;
  const options = Object.values(ITEMS)
    .filter((it) => it.slot === 'trank' && s.stock[it.id] > 0 && priceOf(s, it.id) <= h.gold * 0.5 && PRICE_LEVELS[s.prices[it.id] ?? 1].mult <= tolerance)
    .sort((a, b) => b.boost - a.boost);
  const it = options[0];
  if (!it) return null;
  const price = priceOf(s, it.id);
  s.stock[it.id]--;
  h.gold -= price;
  s.gold += price;
  s.stats.sold++;
  s.stats.earned += price;
  log(s, `${it.icon} ${h.name} nimmt einen ${it.name} für ${price} Gold mit.`, 'sale');
  return it;
}

function finishShopping(s, h) {
  const id = h.target;
  h.target = null;
  h.state = 'taverne';
  h.nextThink = s.time + rand(1, 3) * MIN;
  if (!id || !(s.stock[id] > 0) || priceOf(s, id) > h.gold) {
    h.thought = '„Ausverkauft? Na großartig.“';
    h.mood = clamp(h.mood - 5, 0, 100);
    return;
  }
  const it = ITEMS[id];
  const price = priceOf(s, id);
  s.stock[id]--;
  h.gold -= price;
  s.gold += price;
  s.stats.sold++;
  s.stats.earned += price;
  h.gear[it.slot] = id;
  h.mood = clamp(h.mood + 12, 0, 100);
  h.thought = `ist stolz auf ${h.sex === 'f' ? 'ihr' : 'sein'} neues ${it.name}.`;
  log(s, `🪙 ${h.name} kauft ${it.icon} ${it.name} für ${price} Gold.`, 'sale');
}

function finishQuest(s, h) {
  const reg = REGION[h.region];
  h.region = null;
  const success = Math.random() < h.chance;
  h.energy = clamp(h.energy - rand(35, 60), 0, 100);
  const xpGain = Math.round(reg.danger * (success ? 1 : 0.3));
  h.xp += xpGain;
  while (h.xp >= xpNeeded(h.level)) {
    h.xp -= xpNeeded(h.level);
    h.level++;
    s.stats.levelups++;
    log(s, `⭐ ${h.name} erreicht Stufe ${h.level}!`, 'good');
  }
  if (!success) {
    s.stats.fails++;
    h.state = 'verletzt';
    h.until = s.time + (30 + reg.danger * 1.5) * MIN * healMult(s);
    h.mood = clamp(h.mood - 12, 0, 100);
    h.thought = `liegt verwundet beim Heiler – gegen ${reg.foe} hatte ${h.sex === 'f' ? 'sie' : 'er'} keine Chance.`;
    log(s, `🩸 ${h.name} kehrt verwundet ${reg.from} zurück.`, 'bad');
    return;
  }
  s.stats.quests++;
  h.wins++;
  const gold = randInt(...reg.gold);
  h.gold += gold;
  h.mood = clamp(h.mood + 6, 0, 100);
  const parts = [`${gold} Gold`];
  for (const [m, [a, b]] of Object.entries(reg.loot)) {
    const n = randInt(a, b);
    if (!n) continue;
    const bt = s.bounties[m];
    const deliver = Math.min(n, bt.want);
    if (deliver > 0) {
      const pay = deliver * bt.reward;
      bt.want -= deliver;
      s.escrow -= pay;
      h.gold += pay;
      s.mats[m] += deliver;
      s.stats.delivered += deliver;
      parts.push(`liefert ${deliver}× ${MATERIALS[m].icon} ${MATERIALS[m].name} ab (+${pay} Gold Kopfgeld)`);
    }
    if (n > deliver) {
      h.gold += Math.round((n - deliver) * MATERIALS[m].bounty * 0.25);
      parts.push(`verscherbelt ${n - deliver}× ${MATERIALS[m].icon} beim Hausierer`);
    }
  }
  if (reg.id === 'drachenhorst' && !s.flags.dragon) {
    s.flags.dragon = true;
    log(s, `🐲 ${h.name} hat Vharzul, den Aschenfürsten, bezwungen! Lieder werden über Eichenfurt gesungen.`, 'story');
  }
  h.state = 'taverne';
  h.nextThink = s.time + rand(1, 4) * MIN;
  h.thought = `feiert die Rückkehr ${reg.from}.`;
  log(s, `${reg.icon} ${h.name} kehrt siegreich zurück: ${parts.join(', ')}.`, 'win');
}

// ---------------------------------------------------------------- Aktionen des Spielers

export function canAfford(s, cost) {
  return Object.entries(cost).every(([k, v]) => (k === 'gold' ? s.gold : s.mats[k]) >= v);
}

export function pay(s, cost) {
  for (const [k, v] of Object.entries(cost)) {
    if (k === 'gold') s.gold -= v; else s.mats[k] -= v;
  }
}

export function stockCount(s) {
  return Object.values(s.stock).reduce((a, n) => a + n, 0) + s.crafting.length;
}

// Fehlende Grundstoffe kauft die Schmiede automatisch beim Händler nach. Gold-Kosten dafür, oder null wenn Beute fehlt.
export function restockCost(s, id) {
  let gold = 0;
  for (const [m, n] of Object.entries(ITEMS[id].cost)) {
    const missing = n - s.mats[m];
    if (missing <= 0) continue;
    if (!TRADER_GOODS.includes(m)) return null;
    gold += missing * MATERIALS[m].buy;
  }
  return gold;
}

export function craftBlocker(s, id) {
  const it = ITEMS[id];
  if (it.tier > maxTier(s)) return `Schmiede Stufe ${it.tier} nötig`;
  if (s.crafting.length >= craftSlots(s)) return 'Alle Werkbänke belegt';
  if (stockCount(s) >= shelfSize(s)) return 'Ladenregal voll';
  const extra = restockCost(s, id);
  if (extra === null) return 'Seltenes Material fehlt';
  if (extra > s.gold) return 'Zu wenig Gold für Grundstoffe';
  return null;
}

export function startCraft(s, id) {
  if (craftBlocker(s, id)) return false;
  const it = ITEMS[id];
  for (const [m, n] of Object.entries(it.cost)) if (s.mats[m] < n) buyMaterial(s, m, n - s.mats[m]);
  pay(s, it.cost);
  s.crafting.push({ item: id, start: s.time, done: s.time + it.time });
  return true;
}

// Ladenhüter verkauft der fahrende Händler für die Hälfte des Grundpreises.
export const sellBackPrice = (id) => Math.floor(ITEMS[id].price * 0.5);
export function sellToTrader(s, id) {
  if (!(s.stock[id] > 0)) return false;
  s.stock[id]--;
  s.gold += sellBackPrice(id);
  return true;
}

export function buyMaterial(s, m, n) {
  const cost = MATERIALS[m].buy * n;
  if (s.gold < cost) return false;
  s.gold -= cost;
  s.mats[m] += n;
  return true;
}

// Kopfgeld ändern: Gold wird am Brett hinterlegt und bei Lieferung ausgezahlt.
export function setBounty(s, m, reward, want) {
  const bt = s.bounties[m];
  const refund = bt.reward * bt.want;
  const need = reward * want;
  if (s.gold + refund < need) return false;
  s.gold += refund - need;
  s.escrow += need - refund;
  bt.reward = reward;
  bt.want = want;
  return true;
}

export function upgrade(s, key, def) {
  const lvl = s.upgrades[key];
  const cost = def.costs[lvl];
  if (!cost || !canAfford(s, cost)) return false;
  pay(s, cost);
  s.upgrades[key]++;
  log(s, `${def.icon} ${def.name} ausgebaut auf Stufe ${s.upgrades[key] + 1}.`, 'good');
  return true;
}

// ---------------------------------------------------------------- Zeit vergeht

export function step(s, dt) {
  s.time += dt;
  for (let i = s.crafting.length - 1; i >= 0; i--) {
    const job = s.crafting[i];
    if (job.done <= s.time) {
      s.crafting.splice(i, 1);
      s.stock[job.item] = (s.stock[job.item] || 0) + 1;
      log(s, `🔨 ${ITEMS[job.item].icon} ${ITEMS[job.item].name} ist fertig geschmiedet.`, 'craft');
    }
  }
  for (const h of s.heroes) {
    if (h.state === 'taverne') {
      h.energy = clamp(h.energy + (dt / (45 * MIN * traitVal(h, 'rest', 1))) * 100, 0, 100);
      h.mood += (55 - h.mood) * (dt / (6 * 3600));
      h.gold = Math.max(0, h.gold - h.gold * 0.05 * (dt / 3600)); // Met, Würfel und Zimmer kosten
      if (s.time >= h.nextThink) think(s, h);
    } else if (s.time >= h.until) {
      if (h.state === 'laden') finishShopping(s, h);
      else if (h.state === 'quest') finishQuest(s, h);
      else if (h.state === 'verletzt') {
        h.state = 'taverne';
        h.energy = 40;
        h.nextThink = s.time + rand(1, 3) * MIN;
        h.thought = 'ist wieder auf den Beinen.';
      }
    }
  }
  if (s.time >= s.nextHeroAt) {
    s.nextHeroAt = s.time + rand(60, 120) * MIN;
    if (s.heroes.length < heroCap(s)) {
      const h = addHero(s);
      log(s, `🍺 ${h.name} ${h.epithet}, ${className(h)}, mietet ein Zimmer in der Taverne.`, 'story');
    }
  }
}

// Läuft eine längere Zeitspanne in kleinen Schritten durch (Offline-Fortschritt).
export function simulate(s, seconds, stepSize = 15) {
  while (seconds > 0) {
    const dt = Math.min(stepSize, seconds);
    step(s, dt);
    seconds -= dt;
  }
}
