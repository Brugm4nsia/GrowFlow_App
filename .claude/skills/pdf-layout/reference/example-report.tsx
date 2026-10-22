/**
 * Referenz-Layout „Verlaufsbericht“ für @react-pdf/renderer (v4, React 18).
 * In der Erstellungssitzung per Node geprüft (Render → pdftotext/pdffonts/pdftoppm, Sichtprüfung).
 * Der Browser-Pfad (`pdf(<Report/>).toBlob()`) ist dort NICHT geprüft – in der App mit Playwright testen.
 *
 * Lokal ausprobieren (im App-Ordner nach `npm i`; `"type": "module"` in der package.json):
 *   npm i -D tsx && npx tsx <pfad>/example-report.tsx && pdftoppm -r 70 -png example.pdf pg
 *
 * Wichtig: Schrift-Registrierung ist parametrisiert (Node: Dateipfade, Vite: `?url`-Importe).
 */
import React from 'react';
import path from 'node:path';
import { Document, Page, View, Text, Svg, Rect, Line, Polyline, Path, Font, StyleSheet, renderToFile } from '@react-pdf/renderer';

// ---------- Schrift (lokal gebündelt, kein CDN) ----------
export function registerFonts(src: { regular: string; semibold: string; bold: string }) {
  Font.register({
    family: 'Inter',
    fonts: [
      { src: src.regular, fontWeight: 400 },
      { src: src.semibold, fontWeight: 600 },
      { src: src.bold, fontWeight: 700 },
    ],
  });
  // Keine (englische) Silbentrennung: deutsche Komposita werden sonst falsch getrennt.
  Font.registerHyphenationCallback((word) => [word]);
}

// ---------- Design-Tokens ----------
const C = {
  ink: '#1A202C', mute: '#4A5568', line: '#CBD5E0', soft: '#F1F5F9',
  brand: '#1E4E8C', brandSoft: '#E8F0FA',
  // Einfarbige Abstufung hell→dunkel: druck-/graustufentauglich, kein „Ampel“-Urteil.
  stufe: ['#D6E6F5', '#9CC1E4', '#5E9BD1', '#2F73B5', '#1B4A82'],
};
const T = { body: 9.5, small: 8, h1: 21, h2: 12.5 }; // pt; nie kleiner als 8 pt

const s = StyleSheet.create({
  // KEIN lineHeight auf Page-Ebene (vererbt sich als feste Punktgröße → Überlappungen, Fußzeile verschwindet).
  page: { fontFamily: 'Inter', fontSize: T.body, color: C.ink, paddingTop: 62, paddingBottom: 56, paddingHorizontal: 40 },
  p: { fontSize: T.body, lineHeight: 1.4 },
  small: { fontSize: T.small, lineHeight: 1.35, color: C.mute },
  // Text in unten verankerten (position: absolute, bottom) fixed-Elementen: KEINE lineHeight, sonst verschwindet die Fußzeile.
  footText: { fontSize: T.small, color: C.mute },
  head: { position: 'absolute', top: 24, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 0.75, borderBottomColor: C.line, paddingBottom: 6 },
  foot: { position: 'absolute', bottom: 22, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between' },
  h1: { fontSize: T.h1, fontWeight: 700, lineHeight: 1.2, color: C.brand },
  h2: { fontSize: T.h2, fontWeight: 700, lineHeight: 1.25, color: C.brand },
  card: { backgroundColor: C.soft, borderRadius: 4, padding: 10 },
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: C.line, paddingVertical: 4 },
  th: { fontSize: T.small, fontWeight: 600, lineHeight: 1.2, color: C.mute },
});

// ---------- Bausteine ----------
const Verteilung = ({ v }: { v: number[] }) => {
  const max = Math.max(...v, 1);
  return (
    <Svg width={70} height={16} viewBox="0 0 70 16">
      {v.map((n, i) => (
        <Rect key={i} x={i * 14} y={15 - (n / max) * 13} width={11} height={(n / max) * 13 + 1} fill={C.stufe[i]} />
      ))}
    </Svg>
  );
};
const Verlauf = ({ v }: { v: number[] }) => (
  <Svg width={80} height={18} viewBox="0 0 80 18">
    <Line x1={0} y1={17} x2={80} y2={17} stroke={C.line} strokeWidth={0.5} />
    <Polyline points={v.map((y, i) => `${(i / (v.length - 1)) * 78 + 1},${17 - (y / 4) * 15}`).join(' ')} stroke={C.brand} strokeWidth={1.3} fill="none" />
  </Svg>
);
// Pfeile als Vektor statt Unicode (Inter-Latin-Subset hat → ≈ ✓ ● ▲ ▼ nicht; fehlende Glyphen erscheinen als FALSCHE Zeichen).
const Pfeil = ({ dir }: { dir: 'ab' | 'auf' | 'stabil' }) => (
  <Svg width={10} height={10} viewBox="0 0 10 10">
    {dir === 'stabil'
      ? <Path d="M1 5 H9 M6.5 2.5 L9 5 L6.5 7.5" stroke={C.mute} strokeWidth={1.2} fill="none" />
      : <Path d={dir === 'ab' ? 'M5 1 V9 M2.5 6.5 L5 9 L7.5 6.5' : 'M5 9 V1 M2.5 3.5 L5 1 L7.5 3.5'} stroke={C.brand} strokeWidth={1.2} fill="none" />}
  </Svg>
);

const Legende = ({ stufen }: { stufen: string[] }) => (
  <View style={{ flexDirection: 'row', marginTop: 6 }}>
    {stufen.map((t, i) => (
      <View key={i} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingRight: 6 }}>
        <View style={{ width: 16, height: 16, borderRadius: 3, backgroundColor: C.stufe[i], alignItems: 'center', justifyContent: 'center', marginRight: 4 }}>
          <Text style={{ fontSize: T.small, fontWeight: 700, color: i > 1 ? '#FFFFFF' : C.ink }}>{i}</Text>
        </View>
        <Text style={s.small}>{t}</Text>
      </View>
    ))}
  </View>
);

// ---------- Beispieldaten (fiktiv) ----------
const STUFEN = ['Selbstständig', 'Verbaler Impuls', 'Visuelle Hilfe', 'Teil-Assistenz', 'Übernahme'];
const BEREICHE = [
  { titel: 'Kognition und exekutive Funktionen', icf: 'ICF-CY b110–b199 / d110–d199',
    punkte: ['Fokusdauer bei Einzelarbeit', 'Ablenkbarkeit durch Umweltreize', 'Befolgen mehrschrittiger Anweisungen', 'Reizverarbeitung und Affektsteuerung (Entlastungsstrategien)'] },
  { titel: 'Motorik, Sensorik und Grafomotorik', icf: 'ICF-CY b710–b799 / d140–d159',
    punkte: ['Stifthaltung und Schreibdruck', 'Grafomotorische Ermüdung', 'Haltungskontrolle am Sitzplatz'] },
];
const NOTIZEN = [
  ['03.09.', 'Nach fünf Minuten Schreibaktivität benötigte Mia eine Pause zur Handentlastung und setzte die Aufgabe danach selbstständig fort.'],
  ['10.09.', 'Beim unerwarteten Raumwechsel zog sich Mia in den Ruheraum zurück und war nach zehn Minuten wieder arbeitsfähig.'],
];

// ---------- Dokument ----------
export const Report = () => (
  <Document title="Verlaufsbericht Mia M. 09/2026" author="Beispiel-Ersteller:in" subject="Verlaufsbericht Integrationshilfe" language="de">
    <Page size="A4" style={s.page}>
      <View fixed style={s.head}>
        <Text style={s.small}>Verlaufsbericht Integrationshilfe</Text>
        <Text style={s.small}>Mia M. · 01.09.2026–30.09.2026</Text>
      </View>
      <View fixed style={s.foot}>
        <Text style={s.footText}>Vertraulich – enthält Sozialdaten</Text>
        <Text style={s.footText} render={({ pageNumber, totalPages }) => `Seite ${pageNumber} von ${totalPages}`} />
      </View>

      <Text style={s.h1}>Verlaufsbericht</Text>
      <Text style={[s.p, { color: C.mute, marginBottom: 10 }]}>Integrationshilfe · Zeitraum 01.09.2026 bis 30.09.2026</Text>

      <View style={[s.card, { flexDirection: 'row', marginBottom: 10 }]} wrap={false}>
        {[['Kind', 'Mia M.'], ['Klasse', '3b, Grundschule'], ['Dokumentierte Tage', '18 von 21'], ['Bewilligt', '15 Std./Woche']].map(([k, v]) => (
          <View key={k} style={{ flex: 1 }}>
            <Text style={s.small}>{k}</Text>
            <Text style={[s.p, { fontWeight: 600 }]}>{v}</Text>
          </View>
        ))}
      </View>

      <View wrap={false} style={{ marginBottom: 6 }}>
        <Text style={[s.small, { fontWeight: 600 }]}>Assistenzstufen (niedriger = mehr Selbstständigkeit)</Text>
        <Legende stufen={STUFEN} />
      </View>

      {BEREICHE.map((b, k) => (
        // Kompletter Fachbereich bleibt zusammen (max. ~7 Zeilen): Tabellenkopf wird nicht automatisch wiederholt.
        <View key={k} wrap={false} style={{ marginTop: 14 }}>
          <Text style={s.h2}>{b.titel}</Text>
          <Text style={[s.small, { marginBottom: 4 }]}>{b.icf}</Text>
          <View style={[s.row, { borderBottomColor: C.ink }]}>
            <Text style={[s.th, { flex: 1 }]}>Beobachtungspunkt</Text>
            <Text style={[s.th, { width: 28, textAlign: 'right' }]}>Tage</Text>
            <Text style={[s.th, { width: 36, textAlign: 'right' }]}>Ø Stufe</Text>
            <Text style={[s.th, { width: 70, marginLeft: 10 }]}>Verteilung 0–4</Text>
            <Text style={[s.th, { width: 80, marginLeft: 10 }]}>Verlauf</Text>
            <Text style={[s.th, { width: 14, marginLeft: 6 }]} />
          </View>
          {b.punkte.map((p, i) => (
            <View key={i} style={s.row} wrap={false}>
              <Text style={[s.p, { flex: 1, paddingRight: 6 }]}>{p}</Text>
              <Text style={[s.p, { width: 28, textAlign: 'right' }]}>{12 + i}</Text>
              <Text style={[s.p, { width: 36, textAlign: 'right', fontWeight: 600 }]}>{(1 + i * 0.4).toFixed(1).replace('.', ',')}</Text>
              <View style={{ width: 70, marginLeft: 10 }}><Verteilung v={[5, 4, 3, 1, i % 2]} /></View>
              <View style={{ width: 80, marginLeft: 10 }}><Verlauf v={[3, 2.6, 2.8, 2.1, 1.6, 1.3]} /></View>
              <View style={{ width: 14, marginLeft: 6 }}><Pfeil dir={i % 3 === 0 ? 'ab' : i % 3 === 1 ? 'stabil' : 'auf'} /></View>
            </View>
          ))}
        </View>
      ))}

      <Text style={[s.h2, { marginTop: 16 }]} minPresenceAhead={60}>Dokumentierte Beobachtungen</Text>
      {NOTIZEN.map(([d, t], i) => (
        <View key={i} style={{ flexDirection: 'row', marginTop: 5 }} wrap={false}>
          <Text style={[s.small, { width: 34, fontWeight: 600 }]}>{d}</Text>
          <Text style={[s.p, { flex: 1 }]}>{t}</Text>
        </View>
      ))}

      <View wrap={false} style={{ marginTop: 22 }}>
        <Text style={s.h2}>Fazit</Text>
        <Text style={[s.p, { marginTop: 4 }]}>Hier steht der vor dem Export bearbeitbare Fazit-Text.</Text>
        <View style={{ flexDirection: 'row', marginTop: 36 }}>
          <View style={{ flex: 1, marginRight: 24 }}><View style={{ borderTopWidth: 0.75, borderTopColor: C.ink }} /><Text style={s.small}>Ort, Datum</Text></View>
          <View style={{ flex: 2 }}><View style={{ borderTopWidth: 0.75, borderTopColor: C.ink }} /><Text style={s.small}>Name, Funktion, Unterschrift</Text></View>
        </View>
      </View>
    </Page>
  </Document>
);

// ---------- Node-Aufruf zum Testen ----------
if (process.argv[1]?.endsWith('example-report.tsx')) {
  const F = path.resolve('node_modules/@fontsource/inter/files');
  registerFonts({
    regular: `${F}/inter-latin-400-normal.woff`,
    semibold: `${F}/inter-latin-600-normal.woff`,
    bold: `${F}/inter-latin-700-normal.woff`,
  });
  await renderToFile(<Report />, path.resolve('example.pdf'));
  console.log('example.pdf geschrieben');
}
