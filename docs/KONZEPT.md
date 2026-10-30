# FantasyIdle – Konzept

## Kernidee

Du führst die Schmiede **„Zum Goldenen Amboss“** im Dorf **Eichenfurt**. Helden kommen ins Dorf, kaufen bei dir
Ausrüstung und ziehen auf Abenteuer. **Du schickst niemanden los.** Helden haben ein Eigenleben: Sie entscheiden selbst,
ob und wohin sie gehen. Du beeinflusst sie nur indirekt:

- **Was du schmiedest und zu welchem Preis** (bessere Ausrüstung → mehr Mut → gefährlichere Gebiete)
- **Welche Kopfgelder du am Auftragsbrett aussetzt** (Belohnung pro Stück für seltene Materialien)
- **Wie du das Dorf ausbaust** (Schmiede, Werkbänke, Regale, Taverne, Heiler, Lager)

```
Ausrüstung ─► Helden trauen sich mehr zu ─► seltene Materialien + Gold ─► bessere Ausrüstung …
     ▲                                                                          │
     └──────────── Helden kaufen bei dir ◄── Helden verdienen Gold ◄────────────┘
```

Daraus entsteht die Spannung: Ohne Drachenschuppen keine Drachenrüstung. Und solange sich niemand an den Drachen traut,
gibt es keine Drachenschuppen.

## Spielrhythmus

- **Ziel: ca. 5× am Tag kurz reinschauen.** Abenteuer dauern 30 Min bis 4 Std, Schmieden 10 Min bis 3 Std (bei Tempo 1×).
- **Zum Testen** gibt es höhere Tempostufen (10×, 30×, 60×) in den Einstellungen bzw. per `?speed=60` in der URL.
  Zurzeit startet ein neues Spiel mit 30×. Für die „echte“ Version wird `DEFAULT_SPEED` in `src/main.js` auf 1 gesetzt.
- **Offline-Fortschritt:** Beim Öffnen rechnet das Spiel die verpasste Zeit nach (begrenzt durch das Lagerhaus,
  8–24 Spielstunden) und zeigt einen Bericht „Während du fort warst …“.

## Helden mit Eigenleben

Jeder Held hat:

| Eigenschaft | Wirkung |
|---|---|
| **Klasse** (Krieger, Waldläufer, Magier) | Kauft nur passende Waffen/Rüstungen |
| **Stufe & Ausrüstung** → Kampfkraft | Bestimmt die Erfolgschance pro Gebiet |
| **Zwei Wesenszüge** | z. B. *Mutig* (wenig Angst), *Vorsichtig*, *Gierig* (Kopfgelder zählen mehr), *Faul*, *Eifrig*, *Ruhmsüchtig* (sucht Gefahr), *Geizig* (kauft nur zu fairen Preisen) |
| **Lieblingsgebiet / verhasstes Gebiet** | „Spinnenhöhle? Nicht für alles Gold der Welt. Ich hasse Spinnen.“ |
| **Laune** | Steigt bei Erfolgen und Käufen, sinkt bei Verletzungen und Wucherpreisen. Gute Laune = mehr Tatendrang |
| **Ausdauer** | Nach Abenteuern ruhen sie sich in der Taverne aus (und geben dort Gold aus) |
| **Gold** | Eigenes Geld; davon kaufen sie bei dir |

**Entscheidung** (alle paar Spielminuten, wenn ausgeruht):
1. Gibt es im Laden ein bezahlbares Upgrade zu akzeptablem Preis? → einkaufen
2. Sonst: jedes Gebiet bewerten: Erfolgschance × (Gold + Kopfgelder × Gier) × Laune × Vorlieben − Risiko × Angst.
   Ist das Beste attraktiv genug (Faulheit + Tagesform), zieht der Held los, vorher kauft er evtl. einen Heiltrank.
3. Sonst: bleibt in der Taverne und **sagt dir, warum** („Mit dieser Ausrüstung? Da bräuchte ich schon Besseres.“).

Die Gedanken der Helden sind die wichtigste Rückmeldung an dich als Spieler.

## Wirtschaft

- **Grundstoffe** (Eisen, Holz, Stoff, Kräuter) gibt es jederzeit beim fahrenden Händler.
- **Seltene Materialien** (Wolfsfell, Spinnenseide, Mondkristall, Trollknochen, Drachenschuppe) nur über Kopfgelder.
  Das Gold wird beim Aussetzen hinterlegt und bei Lieferung an den Helden ausgezahlt. Ungewollte Beute verkaufen
  Helden billig beim Hausierer.
- **Ausrüstung** in 4 Stufen je Klasse und Slot (Waffe, Rüstung). Stufen werden über den Schmiede-Ausbau freigeschaltet.
- **Tränke** sind Verbrauchsgüter und sorgen für laufende Einnahmen, auch wenn alle gut ausgerüstet sind.
- **Preisstufen** pro Ware: Günstig / Fair / Teuer / Wucher.
- **Ladenhüter** kann man für 50 % an den Händler verkaufen (verhindert Sackgassen bei vollem Regal).

## Gebiete

| Gebiet | Gefahr | Beute |
|---|---|---|
| 🌾 Kornfelder | 4 | nur Gold (Einstieg) |
| 🌲 Finsterwald | 8 | Wolfsfell |
| 🕷️ Spinnenhöhle | 18 | Spinnenseide |
| ⛏️ Mondsteinmine | 35 | Mondkristall |
| 🌉 Trollbrücke | 50 | Trollknochen |
| 🐲 Drachenhorst | 100 | Drachenschuppe (+ Vharzul, der Aschenfürst) |

## Ideen für später

- **Helden verlassen das Dorf**, wenn sie lange schlecht gelaunt sind; Ruf des Dorfes lockt bessere Helden an
- **Heldengruppen**: Freunde ziehen gemeinsam los; Rivalitäten
- **Ereignisse**: Goblin-Überfall (Wachen brauchen Speere), Händlerkarawane, Turnier, Drachenangriff aufs Dorf
- **Verschleiß / Reparaturen** als weitere laufende Einnahme
- **Legendäre Gegenstände** mit Namen, die Helden berühmt machen
- **Prestige**: Mit dem Ruhm des Drachensiegs ein neues, größeres Dorf gründen (Bonus bleibt)
- **Grafik**: Dorfszene mit herumlaufenden Helden im Stil von Fantasy Citizens (Canvas)
- **Benachrichtigungen** sind ohne Server kaum möglich, daher liegt der Fokus auf dem Bericht beim Öffnen
