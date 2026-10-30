// Balancing-Test ohne Browser: ein einfacher Bot spielt einige Spieltage durch.
// Aufruf: node tools/balance.mjs [Tage]
import { newGame, step, startCraft, craftBlocker, buyMaterial, setBounty, upgrade, heroPower } from '../src/sim.js';
import { ITEMS, MATERIALS, UPGRADES, TRADER_GOODS, maxTier } from '../src/data.js';

const days = Number(process.argv[2] || 3);
const s = newGame(1);
const CHECK = 20 * 60; // Bot schaut alle 20 Spielminuten rein (≈ "aktiver" Spieler)
let t = 0;
const report = [];
for (let sec = 0; sec < days * 86400; sec += 15) {
  step(s, 15);
  if (sec - t >= CHECK) {
    t = sec;
    // Wünsche der Helden schmieden
    const wishes = s.heroes.map((h) => h.wish).filter(Boolean);
    wishes.push('heiltrank', 'heiltrank');
    if (s.upgrades.schmiede >= 2) wishes.push('trollblut');
    for (const id of wishes) {
      const it = ITEMS[id];
      if ((s.stock[id] || 0) + s.crafting.filter((j) => j.item === id).length >= (ITEMS[id].slot === 'trank' ? 3 : 1)) continue;
      for (const [m, n] of Object.entries(it.cost)) if (TRADER_GOODS.includes(m) && s.mats[m] < n) buyMaterial(s, m, n - s.mats[m] + 2);
      if (!craftBlocker(s, id)) startCraft(s, id);
    }
    // Kopfgelder für Materialien der nächsten Stufe
    const wanted = [[], ['wolfsfell', 'spinnenseide'], ['wolfsfell', 'spinnenseide', 'mondkristall', 'trollknochen'], ['wolfsfell', 'spinnenseide', 'mondkristall', 'trollknochen', 'drachenschuppe']][s.upgrades.schmiede];
    // vor dem nächsten Schmiede-Ausbau: Material dafür sammeln
    const next = UPGRADES.schmiede.costs[s.upgrades.schmiede];
    if (next) for (const m of Object.keys(next)) if (m !== 'gold' && !wanted.includes(m)) wanted.push(m);
    for (const m of wanted) {
      if (s.gold < 120) break;
      const bt = s.bounties[m];
      if (bt.want < 3 && s.mats[m] < 8) setBounty(s, m, MATERIALS[m].bounty, 4);
    }
    for (const k of ['schmiede', 'regal', 'werkbank', 'taverne', 'heiler', 'lager']) if (k === 'schmiede' || s.gold > (UPGRADES.schmiede.costs[s.upgrades.schmiede]?.gold || 0) + 150) upgrade(s, k, UPGRADES[k]);
  }
  if (sec % (6 * 3600) === 0) {
    report.push(`h${sec / 3600}`.padEnd(5) + ` gold=${s.gold.toString().padStart(5)} escrow=${s.escrow} sold=${s.stats.sold} quests=${s.stats.quests}/${s.stats.fails} smith=${s.upgrades.schmiede} heroes=` +
      s.heroes.map((h) => `${h.name}[L${h.level} P${heroPower(h)} ${Math.floor(h.gold)}g]`).join(' '));
  }
}
console.log(report.join('\n'));
console.log('dragon', !!s.flags.dragon, 'upgrades', JSON.stringify(s.upgrades));
console.log(s.heroes.map((h) => `${h.name}: ${h.thought}`).join('\n'));
