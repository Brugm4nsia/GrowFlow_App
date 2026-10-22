---
name: pdf-layout
description: Ansprechende, druck- und lesefreundliche PDF-Berichte im Browser mit @react-pdf/renderer erzeugen (Layout, Typografie, Tabellen, Mini-Diagramme, Kopf-/Fußzeilen, Seitenzahlen, deutsche Umlaute) und visuell prüfen. Verwenden beim Bauen oder Ändern des Verlaufsbericht-PDFs der Integrationshilfe-App (apps/integrationshilfe) oder jedes anderen clientseitigen PDF-Exports.
---

# PDF-Layout mit @react-pdf/renderer

Dieser Skill fasst **in der Erstellungssitzung geprüfte** Erkenntnisse zusammen (Node-Render, `pdftotext`, `pdffonts`,
`pdftoppm`, Sichtprüfung der PNGs; `@react-pdf/renderer` 4.9.0, React 18). Eine lauffähige Referenz liegt in
[`reference/example-report.tsx`](./reference/example-report.tsx) – zuerst ansehen, dann anpassen.

**Browser-Pfad geprüft** (Phase 3 der App, Playwright + Chromium, Vite 7 `build` + `preview`, Handy-Viewport): siehe Abschnitt
„Browser-Pfad (geprüft)“. **Weiterhin nicht geprüft:** Web Share (`navigator.share`, im Headless-Chromium nicht verfügbar) und iOS-Safari.

## Technik

- Report-Komponente **rein und datengetrieben** (`<Report daten={...} />`), ohne DB-Zugriff. Aggregation passiert vorher
  in getesteten reinen Funktionen.
- Nur beim Export laden: `const { pdf } = await import('@react-pdf/renderer'); const blob = await pdf(<Report .../>).toBlob();`
  (großes Bundle, nicht in den Start-Chunk).
- Schrift **lokal bündeln** (`@fontsource/inter`, Vite: `import url from '@fontsource/inter/files/inter-latin-400-normal.woff?url'`),
  nie von einem CDN. Gewichte 400/600/700. Registrierung als Funktion mit übergebenen URLs/Pfaden
  (Node-Test: Dateipfade, App: `?url`-Importe), siehe `registerFonts` im Beispiel. WOFF funktioniert.
- `Font.registerHyphenationCallback((w) => [w])` setzen: keine englische Silbentrennung auf deutschen Komposita.
  Spaltenbreiten so wählen, dass das längste Wort passt.
- Dokument-Metadaten setzen: `title`, `author`, `subject`, `language="de"`.
- Dateiname: `Verlaufsbericht_<Kürzel>_<von>_<bis>.pdf`, Standard **Kürzel statt Klarname**, Sonderzeichen entfernen.
- Pro Kind eine Datei. Mehrere Kinder: eine Datei je Kind erzeugen und per `fflate` (`zipSync`) bündeln;
  einzelnes Kind: direkter Download (`<a download>`), wo verfügbar Web Share mit `navigator.canShare({ files })`.

## Browser-Pfad (geprüft)

- `const { pdf } = await import('@react-pdf/renderer')` + `await pdf(Report({ daten })).toBlob()` läuft unter Vite **ohne Polyfills**
  (kein Buffer-/process-Shim nötig). Stichprobe (1-Seiten-Bericht, Sichtprüfung gegen den Node-Render): Schriften eingebettet (`pdffonts`), Umlaute korrekt
  (`pdftotext`), Layout sieht gleich aus.
- `pdf()` erwartet ein `<Document>`-Element. `createElement(Report, …)` liefert den Typ `FunctionComponentElement` und scheitert an
  `tsc`; **`Report({ daten })` direkt aufrufen** (Komponente nutzt keine Hooks) ist typsicher.
- Chunking: Renderer ≈ 1,2 MB (449 kB gzip) als eigener Chunk, `Report` ≈ 12 kB, `fonts.ts` ≈ 0,2 kB; der Start-Chunk bleibt frei davon,
  solange alle drei nur per `import()` geladen werden. `registerFonts(FONT_URLS)` bei jedem Export aufzurufen ist unkritisch.
- Schrift: `@fontsource/inter/files/inter-latin-{400,600,700}-normal.woff?url` wird zur gehashten URL im Build; react-pdf lädt sie
  per `fetch` (gleiche Origin). Für Offline-Betrieb müssen `woff` im Service-Worker-Precache stehen (`globPatterns` mit `woff`).
- Download per `<a download>` + `URL.createObjectURL` (Playwright: `page.waitForEvent('download')`) liefert eine gültige Datei (`%PDF-`).
- ZIP mit `fflate.zipSync(…, { level: 0 })` liefert ein gültiges Archiv (`unzip -l`), Namen bei Kollision mit `_2` eindeutig machen.
- Node-Skript mit `tsx` (außerhalb der `tsconfig`-`include`) braucht `import React from 'react'` (klassisches JSX), sonst „React is not defined“.
- Text in verschachtelten `<Text>` (fett Präfix + normaler Text in einem Absatz) funktioniert inline.
- `wrap={false}` auf Zeilenebene und ganze Fachbereiche als Block zusammenhalten (≤ 8 Zeilen) funktionierte in 1-, 2-, 4- und 6-seitigen
  Beispielen ohne zerrissene Blöcke; sehr lange Notizen brechen innerhalb des Absatzes sauber um.

## Fallstricke (alle im Spike reproduziert)

1. **Niemals `lineHeight` auf `Page`.** Es vererbt sich als feste Punktgröße: größere Überschriften überlappen den
   Folgetext. `lineHeight` (Multiplikator, z. B. 1.4) nur an den einzelnen Text-Stilen setzen.
2. **Unten verankerte `fixed`-Elemente (`position: 'absolute', bottom`) verschwinden spurlos, wenn ihr Text eine
   `lineHeight` hat** (auch geerbt). Fußzeilen-Text ohne `lineHeight` stylen (`footText` im Beispiel). Kopfzeile mit `top` ist unkritisch.
3. **Fehlende Glyphen werden nicht als Kästchen, sondern als FALSCHE Zeichen ausgegeben.** Das Inter-Latin-Subset
   enthält u. a. `→ ≈ ✓ ● ▲ ▼` nicht (→ erschien als `’`). Verwendbar und geprüft: Umlaute, `ß`, „ “, `–`, `·`, `↑ ↓`.
   Pfeile/Häkchen/Symbole als **SVG** zeichnen (`Pfeil` im Beispiel). Jedes neue Sonderzeichen mit `pdftotext` und Sichtprüfung testen.
4. **Keine Tabellenkomponente.** Zeilen = `View` mit `flexDirection: 'row'`, feste Spaltenbreiten, `wrap={false}` je Zeile.
5. **Tabellenkopf wird nicht automatisch auf Folgeseiten wiederholt** (`fixed` wiederholt auf *jeder* Seite des Dokuments).
   Lösung: Jeden Fachbereich (max. ~7 Zeilen) mit `wrap={false}` als Block zusammenhalten; Überschriften mit
   `minPresenceAhead={60}` vor Waisen schützen. Lange Listen (Notizen) dürfen zeilenweise umbrechen (`wrap={false}` je Eintrag).
6. `pdffonts` kann einen nicht eingebetteten `Helvetica`-Eintrag zeigen (in einem Spike mit SVG beobachtet, Ursache ungeklärt;
   im finalen Beispiel nicht mehr vorhanden). Maßgeblich ist die Sichtprüfung.

## Gestaltung des Verlaufsberichts

**Seite:** A4, Ränder 40 pt, Kopfzeile (Titel · Kürzel · Zeitraum) und Fußzeile („Vertraulich – enthält Sozialdaten“ ·
„Seite x von y“) als `fixed`. Erste Seite zusätzlich mit großem Titel.

**Typografie:** Inter. Fließtext 9,5 pt, Tabellenkopf/Beschriftung 8 pt (nie kleiner), H2 12,5 pt, H1 21 pt.
Text `#1A202C`, gedämpft `#4A5568` (beide auf Weiß ≥ 7:1), Markenfarbe ein gedecktes Blau. Hierarchie über Gewicht und
Größe, nicht über viele Farben. Großzügiger Weißraum zwischen Fachbereichen (≈ 14 pt).

**Farben für Assistenzstufen 0–4:** **einfarbige Abstufung hell → dunkel**, jede Stufe zusätzlich mit **Ziffer**.
Kein Ampel-Rot/Grün: nicht graustufen- und farbsehschwächentauglich und es bewertet („rot = schlecht“), was den
ressourcenorientierten Formulierungsgrundsätzen des Anforderungsprofils widerspricht. Niedrigere Zahl = mehr
Selbstständigkeit; **sinkender Verlauf = positive Entwicklung** und so beschriften („weniger Unterstützung nötig“).
Immer in Graustufen gegenprüfen (`pdftoppm -gray`).

**Aufbau (Reihenfolge):**
1. Kopf: Titel, Zeitraum, Kennzahlenkarte (Kind/Kürzel, Klasse/Schulart, dokumentierte Tage „18 von 21“, Bewilligung).
   Diagnose und Aktenzeichen **nur, wenn im Export aktiviert** (Standard: aus). Leit-/Teilhabeziele als kurze Liste.
2. Legende der Stufen 0–4 (Ziffer + Kurzbezeichnung) mit Hinweis „niedriger = mehr Selbstständigkeit“.
3. Je gewähltem Fachbereich: H2 + ICF-CY-Bereichscode (klein, nur Bereichsebene) + Tabelle
   *Beobachtungspunkt · Tage (n) · Ø Stufe · Verteilung 0–4 (Mini-Balken) · Verlauf (Wochen-Sparkline) · Trend-Pfeil*.
   Punkte mit zu wenig Daten (n < 4) ohne Trend, mit „zu wenige Daten“ kennzeichnen. Nicht beobachtete Tage nie als 0 zählen.
4. „Dokumentierte Beobachtungen“: chronologisch, Datum klein/fett + Text (Textbausteine und Notizen, Maßnahme + Wirksamkeit).
5. Umwelt & Kontext: zwei Spalten Förderfaktoren | Barrieren mit Häufigkeit als horizontale Balken.
6. Assistenzmethoden mit Wirksamkeitsanteil.
7. Fazit (vor dem Export bearbeitbar), Linien für „Ort, Datum“ und „Name, Funktion, Unterschrift“ (aus den Einstellungen vorbelegt).

**Empfänger-Profile** entscheiden nur, *welche* Blöcke erscheinen; das Layout bleibt identisch. Leere Bereiche weglassen
statt leere Tabellen zu drucken. Alle Sätze sind regelbasiert (keine KI-Texte, keine Diagnosen).

## Prüfablauf (jedes Mal, nicht überspringen)

```bash
# Node-Render mit Fixture-Daten (fiktiv!), im App-Ordner
npx tsx scripts/render-sample-pdf.tsx          # schreibt sample.pdf
pdfinfo sample.pdf | grep -E 'Pages|Title'
pdftotext -layout sample.pdf - | head -60      # Umlaute/Text korrekt? Fußzeile auf JEDER Seite?
pdffonts sample.pdf                            # Schriften eingebettet?
pdftoppm -r 80 -png sample.pdf pg              # dann JEDE Seite mit Read ansehen
pdftoppm -r 50 -gray -png sample.pdf pgg       # Graustufen-Gegenprobe
```

Checkliste je Seite: kein Überlappen/Abschneiden · Umlaute und Sonderzeichen korrekt · Kopf-/Fußzeile + „Seite x von y“ auf
jeder Seite · kein Fachbereich über Seitengrenze zerrissen · keine einzelne Überschrift am Seitenende · Kontrast in Graustufen
ausreichend · Fixtures decken ab: 1 Kind mit wenigen Daten, 1 mit vollem Monat, sehr lange Notiz, alle Fachbereiche aktiv,
ein einziger Fachbereich aktiv (kurzes Dokument), leerer Zeitraum (freundlicher Hinweis statt leerer Seiten).

Keine echten Personendaten in Fixtures oder Commits.
