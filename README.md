# FantasyIdle – Zum Goldenen Amboss

Ein kleines Fantasy-Idlespiel für Handy und Browser. Du führst die Schmiede von Eichenfurt und rüstest
**eigensinnige Helden** aus, die selbst entscheiden, ob sie sich in die Spinnenhöhle oder an den Drachen wagen.
Du setzt nur Preise und Kopfgelder. Das Spiel läuft weiter, während du weg bist.

Konzept und Ideen: [docs/KONZEPT.md](docs/KONZEPT.md)

## Spielen

- **Online:** über GitHub Pages (siehe unten), z. B. `https://ganonium.github.io/FantasyIdle/`
- **Aufs Handy holen:** Seite öffnen → „Zum Home-Bildschirm“. Dann läuft es wie eine App (Vollbild, offline).
- **Lokal:** `npm start` (oder `python3 -m http.server`) → http://localhost:8080

Kein Build-Schritt, keine Abhängigkeiten: reines HTML/CSS/JavaScript (ES-Module).

## Bedienung

| Reiter | Was du tust |
|---|---|
| 🏰 Dorf | Dorf ausbauen, Chronik lesen |
| ⚔️ Helden | Wer ist wo, was denken sie, warum gehen sie (nicht) los? |
| 🔨 Schmiede | Grundstoffe kaufen, Waffen, Rüstungen und Tränke schmieden |
| 🪙 Laden | Preise festlegen, Nachfrage sehen, Ladenhüter loswerden |
| 📜 Brett | Kopfgelder für seltene Materialien aussetzen |

⚙️ oben rechts: **Spieltempo** (1× = echtes Spiel, 10–60× zum Testen), Spielstand exportieren/importieren, neues Spiel.
Das Tempo lässt sich auch per URL setzen: `?speed=60` (gilt für ein neues Spiel).

## Spielstand

Der Spielstand liegt im Browser (`localStorage`), also nur auf diesem Gerät. Mit „Exportieren“ bekommst du einen Code,
den du sichern oder auf einem anderen Gerät importieren kannst. Als installierte App (Home-Bildschirm) löscht iOS die
Daten nicht nach 7 Tagen Inaktivität.

## GitHub Pages einrichten

Einmalig im Repository: **Settings → Pages → Build and deployment → Source: „Deploy from a branch“**,
Branch **`main`**, Ordner **`/ (root)`** → Save. Nach ca. einer Minute ist das Spiel unter
`https://ganonium.github.io/FantasyIdle/` erreichbar.

## Entwicklung

| Datei | Inhalt |
|---|---|
| `src/data.js` | Alle Spieldaten: Klassen, Rezepte, Gebiete, Ausbauten, Namen, Wesenszüge |
| `src/sim.js` | Spiellogik ohne DOM: Heldenentscheidungen, Schmieden, Kopfgelder, Zeit |
| `src/ui.js` | Darstellung der Reiter |
| `src/main.js` | Spielschleife, Speichern, Offline-Fortschritt, Einstellungen |
| `sw.js`, `manifest.webmanifest` | Installierbar als App (PWA), offline spielbar |
| `tools/balance.mjs` | Balancing-Test: ein Bot spielt einige Tage durch (`node tools/balance.mjs 5`) |
