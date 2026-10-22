/**
 * Verlaufsbericht-PDF (@react-pdf/renderer v4). Reine Darstellung: bekommt fertig aggregierte BerichtDaten.
 * Layout-Regeln und Fallstricke: .claude/skills/pdf-layout/SKILL.md
 */
import { Document, Font, Line, Page, Path, Polyline, Rect, StyleSheet, Svg, Text, View } from '@react-pdf/renderer'
import type { ItemAuswertung, TrendArt, BerichtDaten } from '../domain/auswertung'
import { TREND_TEXT } from '../domain/auswertung'
import { anzeigeDatum, kurzDatum } from '../domain/datum'
import { LAERM_STUFEN, STUFEN } from '../domain/katalog'

export function registerFonts(src: { regular: string; semibold: string; bold: string }) {
  Font.register({
    family: 'Inter',
    fonts: [
      { src: src.regular, fontWeight: 400 },
      { src: src.semibold, fontWeight: 600 },
      { src: src.bold, fontWeight: 700 },
    ],
  })
  // Keine (englische) Silbentrennung: deutsche Komposita werden sonst falsch getrennt.
  Font.registerHyphenationCallback((word) => [word])
}

const C = {
  ink: '#1A202C', mute: '#4A5568', line: '#CBD5E0', soft: '#F1F5F9',
  brand: '#1E4E8C',
  stufe: ['#D6E6F5', '#9CC1E4', '#5E9BD1', '#2F73B5', '#1B4A82'],
}
const T = { body: 9.5, small: 8, h1: 21, h2: 12.5 }

const s = StyleSheet.create({
  // Kein lineHeight auf Page (vererbt sich als feste Punktgröße); Fußzeilen-Text ohne lineHeight.
  page: { fontFamily: 'Inter', fontSize: T.body, color: C.ink, paddingTop: 62, paddingBottom: 56, paddingHorizontal: 40 },
  p: { fontSize: T.body, lineHeight: 1.4 },
  small: { fontSize: T.small, lineHeight: 1.35, color: C.mute },
  footText: { fontSize: T.small, color: C.mute },
  head: { position: 'absolute', top: 24, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 0.75, borderBottomColor: C.line, paddingBottom: 6 },
  foot: { position: 'absolute', bottom: 22, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between' },
  h1: { fontSize: T.h1, fontWeight: 700, lineHeight: 1.2, color: C.brand },
  h2: { fontSize: T.h2, fontWeight: 700, lineHeight: 1.25, color: C.brand },
  card: { backgroundColor: C.soft, borderRadius: 4, padding: 10 },
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: C.line, paddingVertical: 4 },
  th: { fontSize: T.small, fontWeight: 600, lineHeight: 1.2, color: C.mute },
})

const komma = (n: number, d = 1) => n.toFixed(d).replace('.', ',')
const prozent = (x: number) => `${Math.round(x * 100)} %`

// ---------- Vektor-Bausteine (Glyphen wie →, ✓ fehlen in der Schrift: als SVG zeichnen) ----------
const Verteilung = ({ v }: { v: number[] }) => {
  const max = Math.max(...v, 1)
  return (
    <Svg width={70} height={16} viewBox="0 0 70 16">
      {v.map((n, i) => (
        <Rect key={i} x={i * 14} y={15 - (n / max) * 13} width={11} height={n ? (n / max) * 13 + 1 : 0.5} fill={C.stufe[i]} />
      ))}
    </Svg>
  )
}

const Verlauf = ({ v }: { v: number[] }) => {
  if (v.length < 2) return <Text style={s.small}>–</Text>
  const pts = v.map((y, i) => `${(i / (v.length - 1)) * 78 + 1},${17 - (y / 4) * 15}`)
  return (
    <Svg width={80} height={18} viewBox="0 0 80 18">
      <Line x1={0} y1={17} x2={80} y2={17} stroke={C.line} strokeWidth={0.5} />
      <Polyline points={pts.join(' ')} stroke={C.brand} strokeWidth={1.3} fill="none" />
    </Svg>
  )
}

const Pfeil = ({ art }: { art: TrendArt }) => {
  if (art === 'zuWenig') return <Text style={s.small}>–</Text>
  const d = art === 'weniger' ? 'M5 1 V9 M2.5 6.5 L5 9 L7.5 6.5' : art === 'mehr' ? 'M5 9 V1 M2.5 3.5 L5 1 L7.5 3.5' : 'M1 5 H9 M6.5 2.5 L9 5 L6.5 7.5'
  return (
    <Svg width={10} height={10} viewBox="0 0 10 10">
      <Path d={d} stroke={art === 'stabil' ? C.mute : C.brand} strokeWidth={1.2} fill="none" />
    </Svg>
  )
}

const Balken = ({ anteil, breite = 70 }: { anteil: number; breite?: number }) => (
  <Svg width={breite} height={9} viewBox={`0 0 ${breite} 9`}>
    <Rect x={0} y={0} width={breite} height={9} fill={C.soft} />
    <Rect x={0} y={0} width={Math.max(anteil, 0) * breite} height={9} fill={C.stufe[3]} />
  </Svg>
)

const Legende = () => (
  <View style={{ flexDirection: 'row', marginTop: 6 }}>
    {STUFEN.map((st, i) => (
      <View key={i} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingRight: 6 }}>
        <View style={{ width: 16, height: 16, borderRadius: 3, backgroundColor: C.stufe[i], alignItems: 'center', justifyContent: 'center', marginRight: 4 }}>
          <Text style={{ fontSize: T.small, fontWeight: 700, color: i > 1 ? '#FFFFFF' : C.ink }}>{i}</Text>
        </View>
        <Text style={[s.small, { flex: 1 }]}>{st.kurz}</Text>
      </View>
    ))}
  </View>
)

const trendText = (i: ItemAuswertung) => (i.trend.art === 'zuWenig' ? `zu wenige Daten (n = ${i.n}, ab 4 Tagen mit Verlauf)` : TREND_TEXT[i.trend.art])

const Tabellenkopf = () => (
  <View style={[s.row, { borderBottomColor: C.ink }]}>
    <Text style={[s.th, { flex: 1 }]}>Beobachtungspunkt</Text>
    <Text style={[s.th, { width: 28, textAlign: 'right' }]}>Tage</Text>
    <Text style={[s.th, { width: 36, textAlign: 'right' }]}>Ø Stufe</Text>
    <Text style={[s.th, { width: 70, marginLeft: 10 }]}>Verteilung 0–4</Text>
    <Text style={[s.th, { width: 80, marginLeft: 10 }]}>Verlauf</Text>
    <Text style={[s.th, { width: 14, marginLeft: 6 }]} />
  </View>
)

const Zeile = ({ i }: { i: ItemAuswertung }) => (
  <View style={s.row} wrap={false}>
    <View style={{ flex: 1, paddingRight: 6 }}>
      <Text style={s.p}>{i.label}</Text>
      <Text style={s.small}>{trendText(i)}</Text>
    </View>
    <Text style={[s.p, { width: 28, textAlign: 'right' }]}>{i.n}</Text>
    <Text style={[s.p, { width: 36, textAlign: 'right', fontWeight: 600 }]}>{i.mittel === null ? '–' : komma(i.mittel)}</Text>
    <View style={{ width: 70, marginLeft: 10 }}><Verteilung v={i.verteilung} /></View>
    <View style={{ width: 80, marginLeft: 10 }}><Verlauf v={i.wochen.map((w) => w.mittel)} /></View>
    <View style={{ width: 14, marginLeft: 6 }}><Pfeil art={i.trend.art} /></View>
  </View>
)

const Spalte = ({ titel, liste, gesamt }: { titel: string; liste: { text: string; tage: number }[]; gesamt: number }) => (
  <View style={{ flex: 1 }}>
    <Text style={[s.th, { marginBottom: 3 }]}>{titel}</Text>
    {liste.length === 0 ? <Text style={s.small}>keine Angaben</Text> : liste.map((f) => (
      <View key={f.text} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 2 }} wrap={false}>
        <Text style={[s.p, { flex: 1, paddingRight: 4, fontSize: 9 }]}>{f.text}</Text>
        <Balken anteil={f.tage / Math.max(gesamt, 1)} breite={44} />
        <Text style={[s.small, { width: 38, textAlign: 'right' }]}>{f.tage} Tage</Text>
      </View>
    ))}
  </View>
)

const Kennzahl = ({ k, v }: { k: string; v: string }) => (
  <View style={{ width: '25%', paddingRight: 6, marginBottom: 6 }}>
    <Text style={s.small}>{k}</Text>
    <Text style={[s.p, { fontWeight: 600 }]}>{v}</Text>
  </View>
)

export const Report = ({ daten: d }: { daten: BerichtDaten }) => {
  const zeitraum = `${anzeigeDatum(d.zeitraum.von)} bis ${anzeigeDatum(d.zeitraum.bis)}`
  const kopf: [string, string][] = [
    ['Kind', d.kind.name],
    ['Klasse / Schulart', [d.kind.klasse, d.kind.schulart].filter(Boolean).join(', ') || '–'],
    ['Dokumentierte Tage', `${d.tageDokumentiert} von ${d.werktage} Werktagen`],
    ['Berichtsumfang', d.profil],
  ]
  if (d.kind.stunden !== undefined) kopf.push(['Bewilligt', `${String(d.kind.stunden).replace('.', ',')} Std./Woche`])
  if (d.kind.bewilligungVon || d.kind.bewilligungBis) kopf.push(['Bescheid gültig', [d.kind.bewilligungVon && anzeigeDatum(d.kind.bewilligungVon), d.kind.bewilligungBis && anzeigeDatum(d.kind.bewilligungBis)].filter(Boolean).join(' bis ')])
  if (d.kind.kostentraeger) kopf.push(['Kostenträger', d.kind.kostentraeger])
  if (d.kind.aktenzeichen) kopf.push(['Aktenzeichen', d.kind.aktenzeichen])
  if (d.kind.diagnose) kopf.push(['Diagnose(n)', d.kind.diagnose])

  const leer = d.tageDokumentiert === 0
  const ersteller = [d.ersteller.name, d.ersteller.funktion, d.ersteller.traeger].filter(Boolean).join(', ')
  const sichtbar = d.bereiche.length > 0

  return (
    <Document title={`Verlaufsbericht ${d.kind.name} ${anzeigeDatum(d.zeitraum.von)}–${anzeigeDatum(d.zeitraum.bis)}`} author={d.ersteller.name || 'Integrationshilfe'} subject="Verlaufsbericht Integrationshilfe" language="de">
      <Page size="A4" style={s.page}>
        <View fixed style={s.head}>
          <Text style={s.small}>Verlaufsbericht Integrationshilfe</Text>
          <Text style={s.small}>{d.kind.name} · {zeitraum}</Text>
        </View>
        <View fixed style={s.foot}>
          <Text style={s.footText}>Vertraulich – enthält Sozialdaten · Erstellt am {anzeigeDatum(d.erstelltAm)}</Text>
          <Text style={s.footText} render={({ pageNumber, totalPages }) => `Seite ${pageNumber} von ${totalPages}`} />
        </View>

        <Text style={s.h1}>Verlaufsbericht</Text>
        <Text style={[s.p, { color: C.mute, marginBottom: 10 }]}>Integrationshilfe · Zeitraum {zeitraum}</Text>

        <View style={[s.card, { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }]} wrap={false}>
          {kopf.map(([k, v]) => <Kennzahl key={k} k={k} v={v} />)}
        </View>

        {d.kind.ziele.length > 0 ? (
          <View wrap={false} style={{ marginBottom: 8 }}>
            <Text style={[s.small, { fontWeight: 600, marginBottom: 2 }]}>Leit- und Teilhabeziele</Text>
            {d.kind.ziele.map((z, i) => (
              <Text key={i} style={s.p}>{i + 1}. {z}</Text>
            ))}
          </View>
        ) : null}

        {leer ? (
          <View style={[s.card, { marginTop: 14 }]}>
            <Text style={[s.h2, { marginBottom: 4 }]}>Keine Beobachtungen im Zeitraum</Text>
            <Text style={s.p}>Für {d.kind.name} liegen im gewählten Zeitraum keine dokumentierten Einträge vor. Bitte einen anderen Zeitraum wählen oder Einträge nachtragen.</Text>
          </View>
        ) : (
          <>
            {sichtbar ? (
              <View wrap={false} style={{ marginBottom: 6 }}>
                <Text style={[s.small, { fontWeight: 600 }]}>Assistenzstufen (niedriger = mehr Selbstständigkeit)</Text>
                <Legende />
                <Text style={[s.small, { marginTop: 4 }]}>
                  Es zählen nur beobachtete Tage (n). Ø Stufe = Mittelwert der beobachteten Tage. Verlauf = Wochenmittel (oben = mehr Unterstützung). Ein sinkender Verlauf bedeutet weniger nötige Unterstützung.
                </Text>
              </View>
            ) : null}

            {d.bereiche.map((b) => (
              <View key={b.id} wrap={b.items.length > 8} style={{ marginTop: 14 }}>
                <Text style={s.h2} minPresenceAhead={70}>{b.titel}</Text>
                <Text style={[s.small, { marginBottom: 4 }]}>{b.icf}</Text>
                <Tabellenkopf />
                {b.items.map((i) => <Zeile key={i.itemId} i={i} />)}
              </View>
            ))}

            {d.texte.length > 0 ? (
              <View style={{ marginTop: 16 }}>
                <Text style={s.h2} minPresenceAhead={60}>Dokumentierte Beobachtungen</Text>
                {d.texte.map((t) =>
                  t.zeilen.map((z, zi) => (
                    <View key={`${t.datum}-${zi}`} style={{ flexDirection: 'row', marginTop: zi === 0 ? 6 : 2 }} wrap={false}>
                      <Text style={[s.small, { width: 34, fontWeight: 600 }]}>{zi === 0 ? kurzDatum(t.datum) : ''}</Text>
                      <Text style={[s.p, { flex: 1 }]}>
                        {z.prefix ? <Text style={{ fontWeight: 600 }}>{z.prefix}: </Text> : null}
                        {z.text}
                      </Text>
                    </View>
                  )),
                )}
              </View>
            ) : null}

            {d.umwelt ? (
              <View style={{ marginTop: 16 }} wrap={false}>
                <Text style={s.h2}>Umwelt und Kontext</Text>
                <Text style={[s.small, { marginBottom: 4 }]}>ICF-CY e110–e599 · Häufigkeit an {d.tageDokumentiert} dokumentierten Tagen</Text>
                <View style={{ flexDirection: 'row' }}>
                  <Spalte titel="Förderfaktoren" liste={d.umwelt.foerder} gesamt={d.tageDokumentiert} />
                  <View style={{ width: 16 }} />
                  <Spalte titel="Barrieren" liste={d.umwelt.barrieren} gesamt={d.tageDokumentiert} />
                </View>
                {d.umwelt.laermTage > 0 ? (
                  <Text style={[s.p, { marginTop: 6 }]}>
                    <Text style={{ fontWeight: 600 }}>Lärmpegel im Klassenraum</Text> (an {d.umwelt.laermTage} Tagen erfasst):{' '}
                    {LAERM_STUFEN.map((t, i) => (d.umwelt!.laerm[i] ? `${t} ${d.umwelt!.laerm[i]}×` : null)).filter(Boolean).join(' · ')}
                  </Text>
                ) : null}
                {Object.values(d.umwelt.reizschutz).some(Boolean) ? (
                  <Text style={[s.p, { marginTop: 2 }]}>
                    <Text style={{ fontWeight: 600 }}>Wirksamkeit des Reizschutzes:</Text> wirksam {d.umwelt.reizschutz.wirksam}× · teilweise {d.umwelt.reizschutz.teilweise}× · nicht wirksam {d.umwelt.reizschutz.nicht}×
                  </Text>
                ) : null}
              </View>
            ) : null}

            {d.massnahmen.length > 0 ? (
              <View style={{ marginTop: 16 }} wrap={d.massnahmen.length > 8}>
                <Text style={s.h2} minPresenceAhead={70}>Assistenzmethoden und Wirksamkeit</Text>
                <View style={[s.row, { borderBottomColor: C.ink, marginTop: 4 }]}>
                  <Text style={[s.th, { flex: 1 }]}>Assistenzmethode</Text>
                  <Text style={[s.th, { width: 44, textAlign: 'right' }]}>Einsätze</Text>
                  <Text style={[s.th, { width: 44, textAlign: 'right' }]}>wirksam</Text>
                  <Text style={[s.th, { width: 52, textAlign: 'right' }]}>teilweise</Text>
                  <Text style={[s.th, { width: 44, textAlign: 'right' }]}>nicht</Text>
                  <Text style={[s.th, { width: 70, textAlign: 'right' }]}>Anteil wirksam</Text>
                </View>
                {d.massnahmen.map((m) => (
                  <View key={m.methode} style={s.row} wrap={false}>
                    <Text style={[s.p, { flex: 1, paddingRight: 6 }]}>{m.methode}</Text>
                    <Text style={[s.p, { width: 44, textAlign: 'right' }]}>{m.anzahl}</Text>
                    <Text style={[s.p, { width: 44, textAlign: 'right' }]}>{m.wirksam}</Text>
                    <Text style={[s.p, { width: 52, textAlign: 'right' }]}>{m.teilweise}</Text>
                    <Text style={[s.p, { width: 44, textAlign: 'right' }]}>{m.nicht}</Text>
                    <Text style={[s.p, { width: 70, textAlign: 'right', fontWeight: 600 }]}>{m.anteilWirksam === null ? 'nicht bewertet' : prozent(m.anteilWirksam)}</Text>
                  </View>
                ))}
                <Text style={[s.small, { marginTop: 3 }]}>Anteil = „wirksam“ unter den bewerteten Einsätzen.</Text>
              </View>
            ) : null}
          </>
        )}

        <View wrap={false} style={{ marginTop: 22 }}>
          <Text style={s.h2}>Fazit</Text>
          {d.fazit.split('\n').filter((x) => x.trim()).map((a, i) => (
            <Text key={i} style={[s.p, { marginTop: 4 }]}>{a}</Text>
          ))}
          <View style={{ flexDirection: 'row', marginTop: 36 }}>
            <View style={{ flex: 1, marginRight: 24 }}>
              <View style={{ borderTopWidth: 0.75, borderTopColor: C.ink }} />
              <Text style={s.small}>Ort, Datum</Text>
            </View>
            <View style={{ flex: 2 }}>
              <View style={{ borderTopWidth: 0.75, borderTopColor: C.ink }} />
              <Text style={s.small}>Name, Funktion, Unterschrift{ersteller ? `: ${ersteller}` : ''}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
