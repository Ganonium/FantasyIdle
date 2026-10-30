// Alle Spieldaten an einem Ort: Klassen, Materialien, Rezepte, Gebiete, Ausbauten, Namen, Wesenszüge.
// Zeiten sind in Spielsekunden angegeben (bei Tempo 1× = echte Sekunden).

export const MIN = 60;
export const HOUR = 3600;

export const CLASSES = {
  krieger: { name: 'Krieger', icon: '🛡️', female: 'Kriegerin' },
  jaeger: { name: 'Waldläufer', icon: '🏹', female: 'Waldläuferin' },
  magier: { name: 'Magier', icon: '🔮', female: 'Magierin' },
};

// Händlerwaren kann man jederzeit kaufen, Beutematerialien bringen nur Helden aus den Gebieten mit.
export const MATERIALS = {
  eisen: { name: 'Eisen', icon: '⛓️', buy: 4 },
  holz: { name: 'Holz', icon: '🪵', buy: 3 },
  stoff: { name: 'Stoff', icon: '🧵', buy: 3 },
  kraeuter: { name: 'Kräuter', icon: '🌿', buy: 2 },
  wolfsfell: { name: 'Wolfsfell', icon: '🐺', bounty: 8 },
  spinnenseide: { name: 'Spinnenseide', icon: '🕸️', bounty: 12 },
  mondkristall: { name: 'Mondkristall', icon: '💎', bounty: 25 },
  trollknochen: { name: 'Trollknochen', icon: '🦴', bounty: 35 },
  drachenschuppe: { name: 'Drachenschuppe', icon: '🐉', bounty: 90 },
};
export const TRADER_GOODS = ['eisen', 'holz', 'stoff', 'kraeuter'];
export const LOOT_GOODS = ['wolfsfell', 'spinnenseide', 'mondkristall', 'trollknochen', 'drachenschuppe'];

export const SLOTS = { waffe: 'Waffe', ruestung: 'Rüstung', trank: 'Trank' };

// Kampfkraft und Grundpreis je Stufe
const TIER = {
  1: { waffe: 5, ruestung: 4, price: [30, 26], time: 20 * MIN },
  2: { waffe: 12, ruestung: 10, price: [85, 75], time: 45 * MIN },
  3: { waffe: 24, ruestung: 20, price: [210, 190], time: 90 * MIN },
  4: { waffe: 45, ruestung: 38, price: [520, 470], time: 180 * MIN },
};

const RECIPES = [
  // Krieger
  ['eisenschwert', 'Eisenschwert', 'krieger', 'waffe', 1, { eisen: 2 }, '🗡️'],
  ['wolfszahnklinge', 'Wolfszahnklinge', 'krieger', 'waffe', 2, { eisen: 3, wolfsfell: 2 }, '🗡️'],
  ['trollspalter', 'Trollspalter', 'krieger', 'waffe', 3, { eisen: 4, trollknochen: 2 }, '🪓'],
  ['drachentoeter', 'Drachentöter', 'krieger', 'waffe', 4, { eisen: 5, drachenschuppe: 3 }, '⚔️'],
  ['gambeson', 'Gambeson', 'krieger', 'ruestung', 1, { stoff: 2 }, '🦺'],
  ['kettenhemd', 'Kettenhemd', 'krieger', 'ruestung', 2, { eisen: 4, wolfsfell: 1 }, '🛡️'],
  ['trollpanzer', 'Trollknochenpanzer', 'krieger', 'ruestung', 3, { eisen: 3, trollknochen: 3 }, '🛡️'],
  ['drachenpanzer', 'Drachenschuppenpanzer', 'krieger', 'ruestung', 4, { eisen: 3, drachenschuppe: 4 }, '🛡️'],
  // Waldläufer
  ['kurzbogen', 'Kurzbogen', 'jaeger', 'waffe', 1, { holz: 2 }, '🏹'],
  ['seidenbogen', 'Seidensehnenbogen', 'jaeger', 'waffe', 2, { holz: 3, spinnenseide: 2 }, '🏹'],
  ['mondbogen', 'Mondbogen', 'jaeger', 'waffe', 3, { holz: 3, mondkristall: 2 }, '🏹'],
  ['drachenhornbogen', 'Drachenhornbogen', 'jaeger', 'waffe', 4, { holz: 3, drachenschuppe: 3 }, '🏹'],
  ['jagdmantel', 'Jagdmantel', 'jaeger', 'ruestung', 1, { stoff: 2 }, '🧥'],
  ['wolfsfellmantel', 'Wolfsfellmantel', 'jaeger', 'ruestung', 2, { stoff: 1, wolfsfell: 2 }, '🧥'],
  ['trollhautwams', 'Trollhautwams', 'jaeger', 'ruestung', 3, { stoff: 2, trollknochen: 2 }, '🧥'],
  ['drachenlederruestung', 'Drachenlederrüstung', 'jaeger', 'ruestung', 4, { stoff: 2, drachenschuppe: 3 }, '🧥'],
  // Magier
  ['eichenstab', 'Eichenstab', 'magier', 'waffe', 1, { holz: 2 }, '🪄'],
  ['seidenrunenstab', 'Seidenrunenstab', 'magier', 'waffe', 2, { holz: 3, spinnenseide: 2 }, '🪄'],
  ['mondkristallstab', 'Mondkristallstab', 'magier', 'waffe', 3, { holz: 3, mondkristall: 3 }, '🔮'],
  ['drachenfeuerstab', 'Drachenfeuerstab', 'magier', 'waffe', 4, { holz: 3, drachenschuppe: 3 }, '🔥'],
  ['wollrobe', 'Wollrobe', 'magier', 'ruestung', 1, { stoff: 2 }, '👘'],
  ['seidenrobe', 'Seidenrobe', 'magier', 'ruestung', 2, { stoff: 1, spinnenseide: 3 }, '👘'],
  ['mondrobe', 'Mondrobe', 'magier', 'ruestung', 3, { spinnenseide: 2, mondkristall: 2 }, '👘'],
  ['drachenmantel', 'Drachenmantel', 'magier', 'ruestung', 4, { stoff: 2, drachenschuppe: 3 }, '👘'],
];

export const ITEMS = {};
for (const [id, name, cls, slot, tier, cost, icon] of RECIPES) {
  const t = TIER[tier];
  ITEMS[id] = { id, name, cls, slot, tier, cost, icon, power: t[slot], price: t.price[slot === 'waffe' ? 0 : 1], time: t.time };
}

// Tränke: Helden kaufen sie vor gefährlichen Abenteuern und verbrauchen sie dabei (laufende Einnahmen).
ITEMS.heiltrank = { id: 'heiltrank', name: 'Heiltrank', cls: null, slot: 'trank', tier: 1, cost: { kraeuter: 2 }, icon: '🧪', boost: 0.2, price: 14, time: 10 * MIN };
ITEMS.trollblut = { id: 'trollblut', name: 'Trollblut-Elixier', cls: null, slot: 'trank', tier: 3, cost: { kraeuter: 3, trollknochen: 1 }, icon: '⚗️', boost: 0.45, price: 70, time: 30 * MIN };

// Startausrüstung neuer Helden (nicht im Laden erhältlich)
export const STARTER = {
  waffe: { name: 'Abgenutzte Waffe', power: 2, tier: 0 },
  ruestung: { name: 'Flickenkleidung', power: 1, tier: 0 },
};

// Preisstufen im Laden
export const PRICE_LEVELS = [
  { id: 'guenstig', name: 'Günstig', mult: 0.8 },
  { id: 'fair', name: 'Fair', mult: 1 },
  { id: 'teuer', name: 'Teuer', mult: 1.25 },
  { id: 'wucher', name: 'Wucher', mult: 1.6 },
];

// Gebiete: Helden wählen selbst, wohin sie ziehen. danger ≈ Kampfkraft für gute Erfolgsaussichten.
export const REGIONS = [
  { id: 'kornfelder', to: 'auf die Kornfelder', from: 'von den Kornfeldern', name: 'Kornfelder', icon: '🌾', foe: 'die Riesenratten', danger: 4, time: 30 * MIN, gold: [3, 7], loot: {},
    fear: 'Ratten', flavor: 'Riesenratten plündern die Ernte der Bauern.' },
  { id: 'finsterwald', to: 'in den Finsterwald', from: 'aus dem Finsterwald', name: 'Finsterwald', icon: '🌲', foe: 'die Wölfe', danger: 8, time: 60 * MIN, gold: [6, 14], loot: { wolfsfell: [0, 2] },
    fear: 'Wölfe', flavor: 'Zwischen den Tannen heulen Wölfe.' },
  { id: 'spinnenhoehle', to: 'in die Spinnenhöhle', from: 'aus der Spinnenhöhle', name: 'Spinnenhöhle', icon: '🕷️', foe: 'die Riesenspinnen', danger: 18, time: 90 * MIN, gold: [12, 25], loot: { spinnenseide: [0, 2] },
    fear: 'Spinnen', flavor: 'Klebrige Netze und viele Augen im Dunkel.' },
  { id: 'mondmine', to: 'in die Mondsteinmine', from: 'aus der Mondsteinmine', name: 'Mondsteinmine', icon: '⛏️', foe: 'die Goblins', danger: 35, time: 120 * MIN, gold: [25, 50], loot: { mondkristall: [0, 2] },
    fear: 'Goblins', flavor: 'Goblins horten hier schimmernde Kristalle.' },
  { id: 'trollbruecke', to: 'zur Trollbrücke', from: 'von der Trollbrücke', name: 'Trollbrücke', icon: '🌉', foe: 'die Trolle', danger: 50, time: 150 * MIN, gold: [35, 70], loot: { trollknochen: [0, 2] },
    fear: 'Trolle', flavor: 'Wer passieren will, muss den Brückenzoll in Blut zahlen.' },
  { id: 'drachenhorst', to: 'zum Drachenhorst', from: 'vom Drachenhorst', name: 'Drachenhorst', icon: '🐲', foe: 'den Drachen', danger: 100, time: 240 * MIN, gold: [120, 250], loot: { drachenschuppe: [1, 3] },
    fear: 'Drachen', flavor: 'Auf dem Gipfel schläft Vharzul, der Aschenfürst.' },
];
export const REGION = Object.fromEntries(REGIONS.map((r) => [r.id, r]));

// Ausbauten im Dorf. levels[i] = Kosten für Stufe i+1 (Stufe 0 ist Start).
export const UPGRADES = {
  schmiede: { name: 'Schmiede', icon: '🔥', desc: 'Schaltet Rezepte höherer Stufe frei.',
    costs: [{ gold: 150 }, { gold: 600, wolfsfell: 3, spinnenseide: 3 }, { gold: 2000, mondkristall: 4, trollknochen: 4 }],
    effect: (l) => `Rezepte bis Stufe ${l + 1}` },
  werkbank: { name: 'Werkbänke', icon: '🔨', desc: 'Mehr Gegenstände gleichzeitig schmieden.',
    costs: [{ gold: 120 }, { gold: 450 }], effect: (l) => `${l + 1} gleichzeitig` },
  regal: { name: 'Ladenregale', icon: '🗄️', desc: 'Mehr Waren in der Auslage.',
    costs: [{ gold: 80 }, { gold: 260 }, { gold: 700 }], effect: (l) => `${[6, 10, 16, 24][l]} Plätze` },
  taverne: { name: 'Taverne', icon: '🍺', desc: 'Mehr Helden finden ein Zimmer im Dorf.',
    costs: [{ gold: 120 }, { gold: 400 }, { gold: 1100 }], effect: (l) => `${[4, 6, 8, 10][l]} Helden` },
  heiler: { name: 'Heilerhütte', icon: '🩹', desc: 'Verletzte Helden genesen schneller.',
    costs: [{ gold: 150 }, { gold: 500 }], effect: (l) => `Genesung ×${[1, 0.6, 0.35][l]}` },
  lager: { name: 'Lagerhaus', icon: '📦', desc: 'Das Dorf arbeitet länger weiter, während du fort bist.',
    costs: [{ gold: 200 }, { gold: 650 }, { gold: 1600 }], effect: (l) => `${[8, 12, 18, 24][l]} Std. Abwesenheit` },
};
export const shelfSize = (s) => [6, 10, 16, 24][s.upgrades.regal];
export const heroCap = (s) => [4, 6, 8, 10][s.upgrades.taverne];
export const craftSlots = (s) => s.upgrades.werkbank + 1;
export const healMult = (s) => [1, 0.6, 0.35][s.upgrades.heiler];
export const offlineCapHours = (s) => [8, 12, 18, 24][s.upgrades.lager];
export const maxTier = (s) => s.upgrades.schmiede + 1;

// Wesenszüge: beeinflussen, wie Helden Risiko, Gold und Preise abwägen.
export const TRAITS = {
  mutig: { name: 'Mutig', desc: 'Fürchtet kaum eine Gefahr.', fear: 0.5 },
  vorsichtig: { name: 'Vorsichtig', desc: 'Geht nur auf Nummer sicher.', fear: 1.8 },
  gierig: { name: 'Gierig', desc: 'Kopfgelder locken besonders.', greed: 1.5 },
  faul: { name: 'Faul', desc: 'Braucht einen guten Grund, die Taverne zu verlassen.', lazy: 1.8, rest: 1.5 },
  ruhmsuechtig: { name: 'Ruhmsüchtig', desc: 'Sucht die gefährlichsten Abenteuer.', glory: 1 },
  geizig: { name: 'Geizig', desc: 'Kauft nur zu fairen Preisen.', stingy: true },
  eifrig: { name: 'Eifrig', desc: 'Kann nicht stillsitzen.', lazy: 0.5, rest: 0.7 },
};
export const TRAIT_CLASH = [['mutig', 'vorsichtig'], ['faul', 'eifrig'], ['gierig', 'geizig']];

export const NAMES = {
  m: ['Hagen', 'Gerwin', 'Wulfric', 'Eberhard', 'Ragnar', 'Alwin', 'Thorwald', 'Gunther', 'Bertolf', 'Roderich', 'Dankwart', 'Leif',
    'Sigmar', 'Ortwin', 'Falko', 'Hartmut', 'Ansgar', 'Baldur', 'Konrad', 'Isegrim', 'Volker', 'Rüdiger', 'Gisbert', 'Arnulf'],
  f: ['Brunhild', 'Ortrun', 'Isolde', 'Sigrun', 'Kunigunde', 'Hildegard', 'Elsbeth', 'Adelheid', 'Mechthild', 'Walburga', 'Ysolde', 'Irmgard',
    'Gudrun', 'Runa', 'Thora', 'Hedwig', 'Frauke', 'Alruna', 'Swanhild', 'Gerlinde', 'Wiltrud', 'Liutgard', 'Ragna', 'Svea'],
};
export const EPITHETS = {
  mutig: ['die Unerschrockene', 'der Unerschrockene'],
  vorsichtig: ['die Bedächtige', 'der Bedächtige'],
  gierig: ['die Goldgierige', 'der Goldgierige'],
  faul: ['die Gemächliche', 'der Gemächliche'],
  ruhmsuechtig: ['die Ruhmreiche', 'der Ruhmreiche'],
  geizig: ['die Sparsame', 'der Sparsame'],
  eifrig: ['die Rastlose', 'der Rastlose'],
};
