# Integrationshilfe-Verlaufsdokumentation – freigegebener Umsetzungsplan

Status: **vom Nutzer freigegeben** (Planung in vorheriger Sitzung). Nicht erneut um Freigabe bitten,
sondern phasenweise umsetzen. Quelle der Anforderungen: [`Anforderungsprofil.pdf`](./Anforderungsprofil.pdf)
(Text auslesen mit `pdftotext -layout`). Bei Widersprüchen gilt das PDF.

## Ziel

Eine Vorlage, in der Integrationshelfer:innen im Arbeitsalltag **schnell** (Ziel: < 3 Minuten pro Kind und Tag)
alle Beobachtungspunkte eintragen. **Mehrere Kinder werden verwaltet** und können gleichzeitig ausgewählt werden.
Für einen **frei wählbaren Zeitraum** werden die Beobachtungen als **fertig formatiertes PDF** exportiert
(**eine Datei pro Kind**).

## Freigegebene Entscheidungen

| | Entscheidung |
|---|---|
| A | **Eigenständige App** in `apps/integrationshilfe/` (eigene `package.json`, eigener Build). GrowFlow-Dateien im Repo-Root **nicht verändern**. |
| B | **Mehrere Kinder verwalten** (Profile). Zusätzlich: Eintrag für mehrere ausgewählte Kinder gleichzeitig setzen. Gespeichert wird immer **pro Kind** ein eigener Eintrag. |
| C | **Ein Gerät, lokal.** Kein Backend, keine Anmeldung, kein Tracking/Analytics, keine Laufzeit-Requests an Dritte (Schriften lokal bündeln, kein CDN). Datenverlust-Schutz über Backup-Datei. |
| D | **PDF pro Kind eine eigene Datei** (bei mehreren Kindern ZIP). Nie Daten mehrerer Kinder in einer Datei. |
| E | Kein verbindliches Träger-Formular. Layout frei nach Anforderungsprofil. |
| F | **Helles, kontrastreiches Design** als Standard, dunkler Modus optional. |

## Tech-Stack (an GrowFlow angelehnt)

React 18, TypeScript (strict, `noUnusedLocals`), Vite, Chakra UI v2, Dexie 4 + dexie-react-hooks,
date-fns, react-router-dom 6, vite-plugin-pwa, **@react-pdf/renderer** (nur beim Export per `import()` nachladen),
**fflate** (ZIP), **vitest** (Logik-Tests), `@fontsource/*` für lokal gebündelte Schrift.
UI-Sprache Deutsch. Build: `tsc && vite build`. Das Root-`.gitignore` ignoriert `package-lock.json`.

PDF-Layout: Skill `pdf-layout` in `.claude/skills/pdf-layout/SKILL.md` **vor** der PDF-Phase lesen.

## Bedienkonzept „Heute erfassen“

Navigation: **Heute | Verlauf | Bericht | Kinder | Mehr**

- Datum (Standard heute, ◀ ▶), darunter **Kinder-Chips mit Mehrfachauswahl**; letzte Auswahl wird gemerkt.
- Fachbereich-Tabs; je Beobachtungspunkt eine Zeile mit **fünf großen Buttons 0–4** (≥ 48 px, farbcodiert,
  1 Tipp = Wert, erneuter Tipp = zurücknehmen). Stufenbeschriftung beim Antippen sichtbar.
- Standard ist **„nicht beobachtet“** – es wird nie ein Wert vorbelegt, der nicht erfasst wurde.
- Pro Punkt optional: Textbausteine (Chips), Kurznotiz, Assistenzmethode + Wirksamkeit.
- **Pro Kind individuelle Beobachtungsliste** (5–10 aktive Punkte aus dem Katalog, abgeleitet aus Hilfeplan/Zielen).
  Bei mehreren ausgewählten Kindern: Vereinigungsmenge anzeigen, Kind-Markierung am Punkt; ein Tipp gilt für alle
  ausgewählten Kinder, die den Punkt aktiv haben. Danach pro Kind korrigierbar.
- **Autosave** (kein Speichern-Button), Statuszeile „✓ gespeichert · 6 von 8 erfasst“.
- Button **„Wie zuletzt“**: übernimmt den letzten Eintrag als Ausgangspunkt; übernommene Werte sind sichtbar
  markiert, bis sie bestätigt/geändert werden.
- Tagesnotiz, Ressourcen-Zeile („Was ist heute gelungen?“), Textbausteine mit Platzhalter `{Kind}`.
- **Sanfter Formulierungs-Hinweis** (nicht blockierend) bei Etikett-Wörtern (z. B. „aggressiv“, „verweigert“, „faul“, „frech“)
  mit Alternativbeispiel aus dem Dokument. Feste Erinnerung: keine Namen von Mitschülern/Lehrkräften, keine Noten
  oder Bewertung von Lehrleistungen.
- Große Touch-Ziele, einhändig bedienbar, Phone **und** Tablet, vollständig offline.

## Skala (aus Dokument, Kap. 4)

| Stufe | Bezeichnung |
|---|---|
| 0 | Vollständig selbstständig |
| 1 | Verbaler Impuls |
| 2 | Visuelle / strukturierende Unterstützung |
| 3 | Physische Teil-Assistenz |
| 4 | Vollständige Übernahme |

**Wichtig für Auswertung/PDF:** Niedrigere Zahl = mehr Selbstständigkeit. Ein sinkender Verlauf ist eine
*positive* Entwicklung und muss in Text/Farbe/Pfeilen auch so dargestellt werden („weniger Unterstützung nötig“).

## Beobachtungskatalog (statische TS-Konstanten, versioniert)

ICF-CY-Codes nur auf **Bereichsebene** wie im Dokument, keine erfundenen Einzelcodes.
Je Punkt: `id`, `bereich`, `label`, `hinweis`, `bausteine[]` (3–6 ressourcenorientierte, konkrete, wertfreie Formulierungen
nach den Formulierungsgrundsätzen des Dokuments, Platzhalter `{Kind}`).

| Bereich (ICF-CY laut Dokument) | Punkte |
|---|---|
| Kognition & Exekutive (b110–b199 / d110–d199) | Fokusdauer Einzelarbeit · Ablenkbarkeit durch Umweltreize · Befolgen mehrschrittiger Anweisungen · Wechsel von Arbeitsphasen/Strukturbrüche (Raumwechsel, Vertretung) · Handlungsplanung & Arbeitsorganisation · Impulskontrolle & Abwarten · Reizverarbeitung & Affektsteuerung (Reizschutz aufsuchen) |
| Motorik, Sensorik, Grafomotorik (b710–b799 / d140–d159) | Grobmotorik & Haltungskontrolle am Sitzplatz · Feinmotorik & Werkzeuggebrauch · Stifthaltung & Schreibdruck · Grafomotorische Ermüdung (Zeit bis Pause) · Sensorische Integration (taktil/propriozeptiv/vestibulär) |
| Sprache & Kommunikation (b167 / d310–d399) | Sprachverständnis (Arbeitsaufträge, Instruktionen) · Expressive Sprache (Wortschatzabruf, Satzbau) · Pragmatik (Blickkontakt, Turn-Taking, Themenbezug, Lautstärke) · UK-Nutzung (Talker, Piktogramme, Gebärden, PECS – Initiierung/Akzeptanz) |
| Sozio-emotional (b122, b152 / d710–d799) | Kontaktaufnahme zu Peers/Gruppenarbeit · Mitspielverhalten in Pausen · Frustrationstoleranz bei Kritik/Misserfolg · Affektregulation bei Überforderung · Emotionale Regulation & Selbstwirksamkeit · Regeleinhaltung |
| Selbstversorgung & Autonomie (d510–d599 / d200) | Hygiene & Toilettengang · An-/Auskleiden (z. B. Sport) · Nahrungsaufnahme/Mensa · Materialorganisation im Pult · Raum- & Zeitorientierung (Schulgelände, Stundenplan, Fachraumwechsel) |
| Umwelt & Kontext (e110–e599) | **Mehrfachauswahl**, keine Skala: Förderfaktoren (Lärmschutz, visuelle Tagesstruktur, Nachteilsausgleich, fester Rückzugsort, unterstützendes Peer-Umfeld, unterstützende Haltung der Lehrkraft) · Barrieren (hoher Lärmpegel, Reizüberflutung, unruhige Sitzordnung, unstrukturierte Pausen, bauliche Hindernisse, Raum-/Sachausstattung) · Lärmpegel im Klassenraum · Wirksamkeit des Reizschutzes. Eigene Einträge möglich. |

Zusätzlich je Tag: Assistenzmethode (+ Wirksamkeit: wirksam / teilweise / nicht wirksam), Ressourcen-Zeile, Tagesnotiz.
Eigene Beobachtungspunkte und eigene Textbausteine sind in der DB anlegbar.

## Kinderprofil (administrative Parameter, Kap. 2 des Dokuments)

Kürzel/Vorname (**Pseudonym als Standard**), optional Nachname, Geburtsdatum, Schulart, Klasse, Kostenträger, Aktenzeichen ·
Diagnosen (ICD-10 mit Auswahlliste, z. B. F84.5, F90.0, F82, plus Freitext) · Bewilligung (Stundenumfang, Gültigkeit von/bis) ·
Leit- und Teilhabeziele · Netzwerk (Schule, Ergotherapie, Logopädie, KJP, SPZ) · aktive Beobachtungspunkte · Farbe · archiviert.

## Datenmodell (Dexie, eigene DB `integrationshilfeDB`)

- `kinder`: `++id, name, archiviert`
- `eintraege`: `++id, &[kindId+datum], kindId, datum` – `datum` als `'yyyy-MM-dd'`-String (keine Zeitzonenfehler);
  `werte: { [itemId]: { stufe?: 0..4; bausteine?: string[]; notiz?: string; massnahme?: string; wirksamkeit?: ... } }`,
  `umwelt: { foerder: string[]; barrieren: string[]; laerm?: number }`, `ressourcen?`, `tagesnotiz?`, `createdAt`, `updatedAt`
- `eigeneItems`, `textbausteine` (eigene), `einstellungen` (Ersteller:in, Funktion, Träger für Fußzeile/Unterschrift; letzte Kinderauswahl)
- Zeitraumabfrage: `where('[kindId+datum]').between([id, von], [id, bis], true, true)`
- Schema-Änderungen nur über neue `version(n)` mit Migration.

## Auswertung (reine Funktionen, mit vitest getestet)

- Es zählen **nur beobachtete Werte**; „nicht beobachtet“ ist kein Wert. Immer `n` (Anzahl Tage) mit ausweisen.
- Pro Punkt: Mittelwert, Verteilung 0–4, Wochenmittel.
- Trend: beobachtete Tage chronologisch halbieren, Δ = Mittel(2. Hälfte) − Mittel(1. Hälfte); |Δ| < 0,3 → „stabil“;
  Δ < 0 → „weniger Unterstützung nötig“; Δ > 0 → „mehr Unterstützung nötig“; bei n < 4 → „zu wenige Daten“.
- Umwelt: Häufigkeit je Förderfaktor/Barriere. Assistenzmethoden: Häufigkeit + Wirksamkeitsanteil.
- Texte/Notizen chronologisch, nur aus dem gewählten Zeitraum.

## PDF-Export

- Zeitraum: Schnellwahl (diese Woche, dieser Monat, letzte 4 Wochen, Halbjahr) + frei von–bis.
- Kinder: Mehrfachauswahl → **pro Kind eine Datei**, bei mehreren als ZIP (fflate).
- **Empfänger-Profile** blenden Fachbereiche ein/aus: Vollständig · Eltern · Ergotherapie (Motorik/Sensorik) ·
  Logopädie (Sprache) · KJP/Neurologie (Kognition, Sozio-emotional) · Jugend-/Sozialamt (Selbstversorgung, Sozio-emotional, Umwelt,
  Bewilligung/Ziele) · Schule. Zusätzlich Schalter für Diagnose und Aktenzeichen (Datensparsamkeit, Standard: aus).
- Editierbares **Fazit** vor dem Export; Vorschau in der App; Download/Teilen (Web Share API wo verfügbar).
- Layout und technische Details: Skill `pdf-layout`. Kein KI-Text; alle Sätze regelbasiert.

## Datenschutz & Robustheit

- Kinder-Diagnosen sind Gesundheitsdaten (DSGVO Art. 9): nur lokal, kein Analytics, keine externen Requests.
- `navigator.storage.persist()` anfragen; Backup-Export/-Import als Datei (dexie-export-import) mit regelmäßiger Erinnerung.
- README der App: Datenschutzhinweise, Hinweis „Freigabe durch Träger/Datenschutzbeauftragte:n klären“, kein Rechtsrat.
- Optional (letzte Phase, nur wenn Zeit): App-Sperre per PIN.

## Phasen (jeweils ein Commit auf dem Arbeitsbranch, **kein Pull Request**)

1. **Fundament**: Projekt-Setup in `apps/integrationshilfe/`, Theme, Routing, Katalog, DB, Kinderprofile (CRUD, Beobachtungsliste).
2. **Erfassung**: Heute-Screen, Mehrfachauswahl, Skala, Bausteine, Autosave, „Wie zuletzt“, Verlauf (Liste/Kalender, Nachtrag, Lücken sichtbar).
3. **Bericht**: Aggregation + vitest, PDF-Layout (Skill `pdf-layout`), Zeitraum, Empfänger-Profile, Fazit, Vorschau, Download, ZIP.
4. **Härtung**: Backup/Restore, persistenter Speicher, PWA offline, Kontraste/Touch-Größen, README, optionaler Demo-Modus (fiktive Kinder, klar gekennzeichnet).

## Prüfung vor jeder Übergabe

- `npm run build` (inkl. `tsc`) im App-Ordner ohne Fehler; `npm test` grün.
- Browser-Test (Playwright mit vorinstalliertem Chromium, `executablePath: '/opt/pw-browsers/chromium'`, **kein** `playwright install`)
  im Handy-Viewport: Kind anlegen → zwei Kinder wählen → Werte erfassen → Zeitraum wählen → PDF erzeugen.
- Beispiel-PDF mit Testdaten erzeugen, mit `pdftoppm` zu PNG rendern und **Seite für Seite ansehen**
  (Umlaute, Umbrüche, Tabellen, Seitenzahlen, Kontrast). Mit `pdftotext` Umlaute/Text prüfen.
- Keine echten Personendaten in Tests, Demo-Daten oder Commits.
