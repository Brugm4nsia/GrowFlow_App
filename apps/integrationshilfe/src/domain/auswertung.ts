import { baustein, BEREICHE, bereichVon, LAERM_STUFEN } from './katalog'
import { alleTage, anzeigeDatum, istWochenende, wochenStart } from './datum'
import type { BereichId, Eintrag, Item, Kind, Massnahme, Stufe, Wirksamkeit } from './types'

// ---------- Grundbegriffe ----------
// Es zählen NUR beobachtete Werte. „Nicht beobachtet“ (kein Wert) ist nie eine 0.
// Per „Wie zuletzt“ übernommene, unbestätigte Werte zählen ebenfalls nicht.

export const MIN_TAGE_TREND = 4
export const TREND_SCHWELLE = 0.3

export type TrendArt = 'stabil' | 'weniger' | 'mehr' | 'zuWenig'

export interface Trend {
  art: TrendArt
  /** Mittel(2. Hälfte) − Mittel(1. Hälfte); nur wenn art ≠ zuWenig. */
  delta?: number
}

export const TREND_TEXT: Record<TrendArt, string> = {
  stabil: 'stabil',
  weniger: 'weniger Unterstützung nötig',
  mehr: 'mehr Unterstützung nötig',
  zuWenig: 'zu wenige Daten',
}

export interface WochenMittel {
  /** Montag der Woche, yyyy-MM-dd */
  woche: string
  mittel: number
  n: number
}

export interface ItemAuswertung {
  itemId: string
  label: string
  bereich: Exclude<BereichId, 'umwelt'>
  /** Anzahl Tage mit beobachtetem Wert */
  n: number
  mittel: number | null
  /** Anzahl je Stufe 0–4 */
  verteilung: [number, number, number, number, number]
  wochen: WochenMittel[]
  trend: Trend
}

export function mittelwert(xs: number[]): number | null {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null
}

/** Trend über chronologisch sortierte Stufen: 1. Hälfte = erste ⌊n/2⌋ Werte, 2. Hälfte = Rest (bei ungeradem n inkl. Mitte). */
export function berechneTrend(stufenChrono: number[]): Trend {
  const n = stufenChrono.length
  if (n < MIN_TAGE_TREND) return { art: 'zuWenig' }
  const h = Math.floor(n / 2)
  const delta = Math.round((mittelwert(stufenChrono.slice(h))! - mittelwert(stufenChrono.slice(0, h))!) * 1000) / 1000
  if (Math.abs(delta) < TREND_SCHWELLE) return { art: 'stabil', delta }
  return { art: delta < 0 ? 'weniger' : 'mehr', delta }
}

export function wertImTag(e: Eintrag, itemId: string): Stufe | undefined {
  const w = e.werte[itemId]
  return w && !w.uebernommen ? w.stufe : undefined
}

export function auswerteItem(item: Pick<Item, 'id' | 'label' | 'bereich'>, eintraege: Eintrag[]): ItemAuswertung {
  const beob = eintraege
    .map((e) => ({ datum: e.datum, stufe: wertImTag(e, item.id) }))
    .filter((x): x is { datum: string; stufe: Stufe } => x.stufe !== undefined)
    .sort((a, b) => a.datum.localeCompare(b.datum))
  const verteilung: ItemAuswertung['verteilung'] = [0, 0, 0, 0, 0]
  for (const b of beob) verteilung[b.stufe]++
  const proWoche = new Map<string, number[]>()
  for (const b of beob) {
    const w = wochenStart(b.datum)
    proWoche.set(w, [...(proWoche.get(w) ?? []), b.stufe])
  }
  const wochen = [...proWoche.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([woche, s]) => ({ woche, mittel: mittelwert(s)!, n: s.length }))
  return {
    itemId: item.id,
    label: item.label,
    bereich: item.bereich,
    n: beob.length,
    mittel: mittelwert(beob.map((b) => b.stufe)),
    verteilung,
    wochen,
    trend: berechneTrend(beob.map((b) => b.stufe)),
  }
}

// ---------- Umwelt, Maßnahmen ----------
export interface Haeufigkeit {
  text: string
  tage: number
}

export interface UmweltAuswertung {
  foerder: Haeufigkeit[]
  barrieren: Haeufigkeit[]
  /** Tage je Lärmstufe 0–4 */
  laerm: number[]
  laermTage: number
  reizschutz: Record<Wirksamkeit, number>
  hatDaten: boolean
}

function haeufigkeit(listen: string[][]): Haeufigkeit[] {
  const m = new Map<string, number>()
  for (const l of listen) for (const t of new Set(l)) m.set(t, (m.get(t) ?? 0) + 1)
  return [...m.entries()].map(([text, tage]) => ({ text, tage })).sort((a, b) => b.tage - a.tage || a.text.localeCompare(b.text, 'de'))
}

export function auswerteUmwelt(eintraege: Eintrag[]): UmweltAuswertung {
  const laerm = [0, 0, 0, 0, 0]
  const reizschutz: Record<Wirksamkeit, number> = { wirksam: 0, teilweise: 0, nicht: 0 }
  let laermTage = 0
  for (const e of eintraege) {
    if (e.umwelt.laerm !== undefined) { laerm[e.umwelt.laerm]++; laermTage++ }
    if (e.umwelt.reizschutz) reizschutz[e.umwelt.reizschutz]++
  }
  const foerder = haeufigkeit(eintraege.map((e) => e.umwelt.foerder))
  const barrieren = haeufigkeit(eintraege.map((e) => e.umwelt.barrieren))
  return {
    foerder, barrieren, laerm, laermTage, reizschutz,
    hatDaten: !!(foerder.length || barrieren.length || laermTage || Object.values(reizschutz).some(Boolean)),
  }
}

export interface MassnahmeAuswertung {
  methode: string
  anzahl: number
  wirksam: number
  teilweise: number
  nicht: number
  /** Anteil „wirksam“ unter den bewerteten Einsätzen, 0–1; null wenn keine Bewertung. */
  anteilWirksam: number | null
  bewertet: number
}

/** `nurItems`: Einsätze auf Punkt-Ebene nur für diese Punkte; `tagesebene`: Maßnahmen auf Tagesebene einbeziehen. */
export function auswerteMassnahmen(eintraege: Eintrag[], nurItems?: Set<string>, tagesebene = true): MassnahmeAuswertung[] {
  const m = new Map<string, { anzahl: number; w: Record<Wirksamkeit, number> }>()
  const zaehle = (x: Massnahme) => {
    const cur = m.get(x.methode) ?? { anzahl: 0, w: { wirksam: 0, teilweise: 0, nicht: 0 } }
    cur.anzahl++
    if (x.wirksamkeit) cur.w[x.wirksamkeit]++
    m.set(x.methode, cur)
  }
  for (const e of eintraege) {
    if (tagesebene) e.massnahmen.forEach(zaehle)
    for (const [id, w] of Object.entries(e.werte)) if (w.massnahme && (!nurItems || nurItems.has(id))) zaehle({ methode: w.massnahme, wirksamkeit: w.wirksamkeit })
  }
  return [...m.entries()]
    .map(([methode, { anzahl, w }]) => {
      const bewertet = w.wirksam + w.teilweise + w.nicht
      return { methode, anzahl, ...w, bewertet, anteilWirksam: bewertet ? w.wirksam / bewertet : null }
    })
    .sort((a, b) => b.anzahl - a.anzahl || a.methode.localeCompare(b.methode, 'de'))
}

// ---------- Texte ----------
export interface TagesText {
  datum: string
  zeilen: { prefix?: string; text: string; art: 'ressource' | 'notiz' | 'baustein' | 'massnahme' }[]
}

/** Chronologische Texte (Notizen, Bausteine) nur aus dem Zeitraum; {Kind} wird durch das Kürzel ersetzt. */
export function sammleTexte(eintraege: Eintrag[], kindName: string, items: Pick<Item, 'id' | 'label'>[], tagestexte = true): TagesText[] {
  const label = new Map(items.map((i) => [i.id, i.label]))
  const out: TagesText[] = []
  for (const e of [...eintraege].sort((a, b) => a.datum.localeCompare(b.datum))) {
    const z: TagesText['zeilen'] = []
    if (tagestexte && e.ressourcen?.trim()) z.push({ prefix: 'Gelungen', text: e.ressourcen.trim(), art: 'ressource' })
    for (const b of (tagestexte ? e.tagesbausteine : undefined) ?? []) z.push({ text: baustein(b, kindName), art: 'baustein' })
    if (tagestexte && e.tagesnotiz?.trim()) z.push({ text: e.tagesnotiz.trim(), art: 'notiz' })
    for (const [id, w] of Object.entries(e.werte)) {
      const p = label.get(id)
      if (!p) continue
      for (const b of w.bausteine ?? []) z.push({ prefix: p, text: baustein(b, kindName), art: 'baustein' })
      if (w.notiz?.trim()) z.push({ prefix: p, text: w.notiz.trim(), art: 'notiz' })
    }
    if (z.length) out.push({ datum: e.datum, zeilen: z })
  }
  return out
}

// ---------- Empfänger-Profile ----------
export interface Profil {
  id: string
  label: string
  bereiche: BereichId[]
  ziele: boolean
  bewilligung: boolean
  /** Tagesnotizen, Ressourcen, Tagesbausteine und Tages-Maßnahmen einbeziehen (bei Fachtherapien standardmäßig aus). */
  tagestexte: boolean
}

const ALLE: BereichId[] = ['kognition', 'motorik', 'sprache', 'sozio', 'selbst', 'umwelt']

export const PROFILE: Profil[] = [
  { id: 'voll', label: 'Vollständig', bereiche: ALLE, ziele: true, bewilligung: true, tagestexte: true },
  { id: 'eltern', label: 'Eltern', bereiche: ALLE, ziele: true, bewilligung: false, tagestexte: true },
  { id: 'ergo', label: 'Ergotherapie (Motorik/Sensorik)', bereiche: ['motorik'], ziele: false, bewilligung: false, tagestexte: false },
  { id: 'logo', label: 'Logopädie (Sprache)', bereiche: ['sprache'], ziele: false, bewilligung: false, tagestexte: false },
  { id: 'kjp', label: 'KJP / Neurologie (Kognition, Sozio-emotional)', bereiche: ['kognition', 'sozio'], ziele: true, bewilligung: false, tagestexte: true },
  { id: 'amt', label: 'Jugend-/Sozialamt', bereiche: ['selbst', 'sozio', 'umwelt'], ziele: true, bewilligung: true, tagestexte: true },
  { id: 'schule', label: 'Schule', bereiche: ['kognition', 'motorik', 'sprache', 'sozio', 'umwelt'], ziele: true, bewilligung: false, tagestexte: true },
]

export function profilVon(id: string): Profil {
  return PROFILE.find((p) => p.id === id) ?? PROFILE[0]
}

// ---------- Gesamtbericht ----------
export interface BerichtOptionen {
  profilId: string
  bereiche: BereichId[]
  diagnose: boolean
  aktenzeichen: boolean
  tagestexte: boolean
}

export interface BereichBericht {
  id: Exclude<BereichId, 'umwelt'>
  titel: string
  icf: string
  items: ItemAuswertung[]
}

export interface BerichtDaten {
  kind: {
    name: string
    klasse?: string
    schulart?: string
    diagnose?: string
    aktenzeichen?: string
    kostentraeger?: string
    stunden?: number
    bewilligungVon?: string
    bewilligungBis?: string
    ziele: string[]
  }
  zeitraum: { von: string; bis: string }
  profil: string
  optionen: BerichtOptionen
  erstelltAm: string
  ersteller: { name?: string; funktion?: string; traeger?: string }
  tageDokumentiert: number
  werktage: number
  bereiche: BereichBericht[]
  texte: TagesText[]
  umwelt: UmweltAuswertung | null
  massnahmen: MassnahmeAuswertung[]
  fazit: string
}

/** Zählt einen Eintrag nur als dokumentiert, wenn er bestätigte Inhalte hat (nicht nur übernommene Stufen). */
export function istDokumentiert(e: Eintrag): boolean {
  const werte = Object.values(e.werte).some((w) => (w.stufe !== undefined && !w.uebernommen) || w.bausteine?.length || w.notiz?.trim() || w.massnahme)
  return !!(
    werte || e.umwelt.foerder.length || e.umwelt.barrieren.length || e.umwelt.laerm !== undefined || e.umwelt.reizschutz ||
    e.massnahmen.length || e.ressourcen?.trim() || e.tagesnotiz?.trim() || e.tagesbausteine?.length
  )
}

export function zaehleWerktage(von: string, bis: string, heute: string): number {
  return alleTage(von, bis > heute ? heute : bis).filter((t) => !istWochenende(t)).length
}

export function waehleBeobachtungspunkte(kind: Kind, items: Item[]): Item[] {
  return items.filter((i) => kind.aktiveItems.includes(i.id))
}

export function baueBerichtDaten(p: {
  kind: Kind
  eintraege: Eintrag[]
  von: string
  bis: string
  optionen: BerichtOptionen
  items: Item[]
  ersteller: BerichtDaten['ersteller']
  heute: string
  fazit?: string
}): BerichtDaten {
  const { kind, optionen } = p
  const profil = profilVon(optionen.profilId)
  const eintraege = p.eintraege.filter((e) => e.kindId === kind.id && e.datum >= p.von && e.datum <= p.bis && istDokumentiert(e)).sort((a, b) => a.datum.localeCompare(b.datum))
  const aktiv = waehleBeobachtungspunkte(kind, p.items)
  const bereiche: BereichBericht[] = []
  for (const b of BEREICHE) {
    if (b.id === 'umwelt' || !optionen.bereiche.includes(b.id)) continue
    const items = aktiv.filter((i) => i.bereich === b.id).map((i) => auswerteItem(i, eintraege)).filter((a) => a.n > 0)
    if (items.length) bereiche.push({ id: b.id, titel: b.titel, icf: b.icf, items })
  }
  const umwelt = optionen.bereiche.includes('umwelt') ? auswerteUmwelt(eintraege) : null
  const sichtbareItems = p.items.filter((i) => optionen.bereiche.includes(i.bereich))
  const daten: BerichtDaten = {
    kind: {
      name: kind.name,
      klasse: kind.klasse,
      schulart: kind.schulart,
      diagnose: optionen.diagnose ? [...kind.diagnosen, kind.diagnoseFreitext?.trim()].filter(Boolean).join(', ') || undefined : undefined,
      aktenzeichen: optionen.aktenzeichen ? kind.aktenzeichen || undefined : undefined,
      kostentraeger: profil.bewilligung ? kind.kostentraeger || undefined : undefined,
      stunden: profil.bewilligung ? kind.stunden : undefined,
      bewilligungVon: profil.bewilligung ? kind.bewilligungVon : undefined,
      bewilligungBis: profil.bewilligung ? kind.bewilligungBis : undefined,
      ziele: profil.ziele ? kind.ziele : [],
    },
    zeitraum: { von: p.von, bis: p.bis },
    profil: profil.label,
    optionen,
    erstelltAm: p.heute,
    ersteller: p.ersteller,
    tageDokumentiert: eintraege.length,
    werktage: zaehleWerktage(p.von, p.bis, p.heute),
    bereiche,
    texte: sammleTexte(eintraege, kind.name, sichtbareItems, optionen.tagestexte),
    umwelt: umwelt?.hatDaten ? umwelt : null,
    massnahmen: auswerteMassnahmen(eintraege, new Set(sichtbareItems.map((i) => i.id)), optionen.tagestexte),
    fazit: '',
  }
  daten.fazit = p.fazit ?? fazitVorschlag(daten)
  return daten
}

// ---------- Fazit (regelbasiert, keine KI) ----------
function aufzaehlung(xs: string[]): string {
  if (xs.length <= 1) return xs.join('')
  return `${xs.slice(0, -1).join(', ')} und ${xs[xs.length - 1]}`
}

export function fazitVorschlag(d: BerichtDaten): string {
  const zeit = `${anzeigeDatum(d.zeitraum.von)} bis ${anzeigeDatum(d.zeitraum.bis)}`
  if (d.tageDokumentiert === 0) return `Im Zeitraum ${zeit} liegen keine Beobachtungen vor.`
  const alle = d.bereiche.flatMap((b) => b.items)
  const teile = [`Im Zeitraum ${zeit} wurden an ${d.tageDokumentiert} von ${d.werktage} Werktagen Beobachtungen dokumentiert.`]
  const gruppe = (art: TrendArt) => alle.filter((i) => i.trend.art === art).map((i) => i.label)
  const w = gruppe('weniger'), s = gruppe('stabil'), m = gruppe('mehr')
  if (w.length) teile.push(`Weniger Unterstützung nötig war zuletzt bei: ${aufzaehlung(w)}.`)
  if (s.length) teile.push(`Stabil blieb der Unterstützungsbedarf bei: ${aufzaehlung(s)}.`)
  if (m.length) teile.push(`Mehr Unterstützung nötig war zuletzt bei: ${aufzaehlung(m)}.`)
  const wenig = gruppe('zuWenig')
  if (wenig.length) teile.push(`Für ${wenig.length === 1 ? 'einen Punkt' : `${wenig.length} Punkte`} liegen noch zu wenige Beobachtungen für eine Aussage zum Verlauf vor (weniger als ${MIN_TAGE_TREND} Tage).`)
  if (d.umwelt?.foerder.length) teile.push(`Als Förderfaktoren wurden am häufigsten genannt: ${aufzaehlung(d.umwelt.foerder.slice(0, 3).map((f) => f.text))}.`)
  const wirksam = d.massnahmen.filter((x) => x.anteilWirksam !== null && x.anteilWirksam >= 0.5)
  if (wirksam.length) teile.push(`Als überwiegend wirksam bewertet wurden: ${aufzaehlung(wirksam.slice(0, 3).map((x) => x.methode))}.`)
  return teile.join(' ')
}

export { LAERM_STUFEN, bereichVon }
