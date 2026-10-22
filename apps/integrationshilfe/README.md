# Verlaufsdokumentation Integrationshilfe

Offline-fähige Web-App (PWA), mit der Integrationshelfer:innen im Schulalltag **in wenigen Tipps** Beobachtungen erfassen
und daraus für einen frei wählbaren Zeitraum einen **fertig formatierten Verlaufsbericht als PDF** erzeugen – eine Datei pro Kind.

Grundlage ist das Anforderungsprofil in [`docs/integrationshilfe/Anforderungsprofil.pdf`](../../docs/integrationshilfe/Anforderungsprofil.pdf),
die Umsetzungsentscheidungen stehen in [`docs/integrationshilfe/PLAN.md`](../../docs/integrationshilfe/PLAN.md).
Die App ist eigenständig und unabhängig von GrowFlow im Repo-Root.

## Funktionen

- **Heute erfassen**: Datum (◀ ▶, Nachtrag), Kinder per Mehrfachauswahl, Fachbereich-Tabs, je Beobachtungspunkt eine Skala **0–4**
  (1 Tipp = Wert, erneuter Tipp nimmt zurück), Textbausteine mit `{Kind}`-Platzhalter, Kurznotiz, Assistenzmethode + Wirksamkeit,
  Umwelt (Förderfaktoren/Barrieren/Lärm/Reizschutz), Tagesnotiz, Ressourcen („Was ist heute gelungen?“).
  **Autosave** (kein Speichern-Button), Statuszeile „gespeichert · 6 von 8 erfasst“.
- **Nie vorbelegt**: Standard ist „nicht beobachtet“. „Wie zuletzt“ übernimmt Werte nur als **gestrichelt markierten Vorschlag**; sie zählen
  in der Auswertung erst nach Bestätigung (Antippen oder „Alle bestätigen“).
- **Mehrere Kinder** verwalten (Pseudonym empfohlen), pro Kind eine eigene Beobachtungsliste (5–10 Punkte). Bei mehreren gewählten Kindern gilt
  ein Tipp für alle, die den Punkt aktiv haben; gespeichert wird immer **pro Kind**. Persönliche Texte (Notizen) gibt es nur im Einzelmodus.
- **Formulierungs-Hinweis** (nicht blockierend) bei Etikett-Wörtern wie „aggressiv“ oder „verweigert“ mit Alternativbeispiel aus dem Dokument.
- **Verlauf**: Kalender oder Liste, Lücken (Werktage ohne Eintrag) sind sichtbar, Antippen öffnet den Tag zum Nachtragen.
- **Bericht**: Zeitraum (Schnellwahl oder frei), Kinder, **Empfänger-Profil** (Vollständig, Eltern, Ergotherapie, Logopädie, KJP/Neurologie,
  Jugend-/Sozialamt, Schule) mit einstellbaren Fachbereichen, Schalter für Diagnosen/Aktenzeichen (Standard: aus), bearbeitbares
  **Fazit** (regelbasierter Vorschlag, keine KI), PDF je Kind, bei mehreren Kindern zusätzlich ZIP, Teilen (wo vom Gerät unterstützt).
- **Auswertung**: nur beobachtete Tage zählen (immer mit `n`), Mittelwert, Verteilung 0–4, Wochenmittel, Trend. **Niedrigere Zahl = mehr
  Selbstständigkeit**: ein sinkender Verlauf wird als „weniger Unterstützung nötig“ ausgewiesen (positive Entwicklung). Trend: Tage chronologisch
  halbiert, Δ = Mittel(2. Hälfte) − Mittel(1. Hälfte); |Δ| < 0,3 „stabil“; ab n < 4 „zu wenige Daten“.
- **Datensicherung**: Backup als Datei (optional mit Passwort, AES-256-GCM), Wiederherstellen, Erinnerung, Anfrage auf dauerhaften Speicher.
- **Demo-Modus**: zwei rein fiktive Kinder („Demo …“) mit Beispieleinträgen, jederzeit rückstandsfrei entfernbar.
- Hell (Standard) und dunkel, große Touch-Ziele (≥ 44 px), Phone und Tablet.

## Datenschutz

- **Alle Daten bleiben auf dem Gerät** (IndexedDB, Dexie). Kein Backend, keine Anmeldung, kein Tracking/Analytics, **keine Laufzeit-Requests an Dritte**,
  Schrift (Inter) lokal gebündelt, kein CDN. Das wurde im Browser-Test geprüft (`scripts/e2e*.mjs` zählen externe Requests).
- Diagnosen und Hilfeplan-Daten sind **Gesundheits- bzw. Sozialdaten** (DSGVO Art. 9). Hinweise:
  - Kinder unter **Pseudonym/Kürzel** anlegen; der Nachname wird nur gespeichert, nie in den Bericht übernommen.
  - Keine Namen von Mitschüler:innen oder Lehrkräften erfassen, keine Noten, keine Bewertung von Unterricht (Hinweis erscheint in der App).
  - Backups und PDFs enthalten Sozialdaten: **Backups mit Passwort verschlüsseln**, Geräte sperren, PDFs nur über freigegebene Wege weitergeben.
  - Dateien im Download-Ordner und im Browser-Speicher liegen unverschlüsselt auf dem Gerät (Geräteverschlüsselung/Bildschirmsperre nutzen).
- **Ob der Einsatz für Ihren Träger zulässig ist, klären Sie bitte mit der bzw. dem Datenschutzbeauftragten des Trägers.** Diese App ist kein
  Rechtsrat und ersetzt keine Freigabe durch den Träger.

## Entwicklung

```bash
cd apps/integrationshilfe
npm install
npm run dev        # lokal starten
npm test           # Logik-Tests (vitest): Auswertung, Autosave-Kern, Backup, ZIP, Datum
npm run build      # tsc && vite build → dist/
npm run preview    # gebaute App lokal ansehen
```

Browser-Tests (Handy-Viewport, vorinstalliertes Chromium, **kein** `playwright install`):

```bash
npm run build
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers npm run e2e   # nutzt /opt/pw-browsers/chromium; Screenshots in scripts/out/
```

Beispiel-PDFs mit fiktiven Daten rendern und prüfen (siehe `.claude/skills/pdf-layout/SKILL.md`):

```bash
npm run pdf:sample                       # scripts/out/*.pdf
pdftotext -layout scripts/out/voll-monat.pdf - | head -60
pdftoppm -r 80 -png scripts/out/voll-monat.pdf scripts/out/pg   # Seiten ansehen
```

## Deployment (Vercel)

1. Neues Vercel-Projekt aus diesem Repository anlegen.
2. **Root Directory**: `apps/integrationshilfe`. Framework-Preset: *Vite*. Build Command `npm run build`, Output Directory `dist` (Standard).
3. `vercel.json` im App-Ordner enthält den SPA-Rewrite (Routen wie `/bericht` liefern `index.html`; Dateien mit Endung und `/assets/` bleiben unberührt),
   Sicherheits-Header und `no-cache` für Service-Worker und Manifest.
4. Die App aktualisiert sich selbst (`autoUpdate`). Nach dem ersten Besuch läuft sie vollständig offline; „Zum Startbildschirm hinzufügen“ installiert sie.

Hinweis: `package-lock.json` ist im Repo per `.gitignore` ausgeschlossen, Vercel installiert daher ohne Lockfile die jeweils neuesten passenden Versionen.

## Aufbau

```
src/domain/    Katalog, Datenmodell (Dexie), Autosave-Kern, Auswertung, Backup, Demo-Daten, Fixtures (alles reine/getestete Logik)
src/pages/     Heute, Verlauf, Bericht, Kinder, Mehr (inkl. Datensicherung)
src/components Erfassungs-Bausteine, AutoText, Hinweise
src/pdf/       Report.tsx (reine Darstellung), export.ts (Laden/ZIP/Teilen), fonts.ts
scripts/       e2e.mjs, e2e-haertung.mjs, render-sample-pdf.tsx
```

Der Beobachtungskatalog (`src/domain/katalog.ts`) ist versioniert; ICF-CY-Codes stehen nur auf **Bereichsebene** wie im Anforderungsprofil.
Schema-Änderungen an der Datenbank nur über eine neue `version(n)` mit Migration in `src/domain/db.ts`.

## Bewusst offen

- **App-Sperre per PIN** (optional im Plan) ist nicht umgesetzt. Bitte die Bildschirmsperre des Geräts nutzen.
- **Web Share** ist implementiert, aber nur dort sichtbar, wo der Browser Datei-Teilen unterstützt; nicht auf echten Mobilgeräten getestet.
- Keine Content-Security-Policy gesetzt (das Öffnen von PDF-Blobs im Browser-Viewer wurde nicht unter CSP geprüft).
- Schulferien/Feiertage sind nicht hinterlegt: „Werktage“ sind Montag bis Freitag.
