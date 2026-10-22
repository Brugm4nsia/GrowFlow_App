import { describe, expect, it } from 'vitest'
import { auswerteItem, auswerteMassnahmen, auswerteUmwelt, baueBerichtDaten, berechneTrend, istDokumentiert, sammleTexte, zaehleWerktage, profilVon } from './auswertung'
import { leererEintrag } from './db'
import { KATALOG } from './katalog'
import type { Eintrag, Kind, Stufe } from './types'

const item = { id: 'kog-fokus', label: 'Fokusdauer bei Einzelarbeit', bereich: 'kognition' as const }
const e = (datum: string, stufe?: Stufe, extra: Partial<Eintrag> = {}): Eintrag => {
  const x = leererEintrag(1, datum)
  if (stufe !== undefined) x.werte['kog-fokus'] = { stufe }
  return Object.assign(x, extra)
}

describe('Trend', () => {
  it('zu wenige Daten bei n < 4', () => {
    expect(berechneTrend([3, 2, 1]).art).toBe('zuWenig')
    expect(berechneTrend([]).art).toBe('zuWenig')
  })
  it('sinkender Verlauf = weniger Unterstützung nötig (positiv)', () => {
    expect(berechneTrend([3, 3, 1, 1])).toEqual({ art: 'weniger', delta: -2 })
  })
  it('steigender Verlauf = mehr Unterstützung nötig', () => {
    expect(berechneTrend([0, 1, 2, 3]).art).toBe('mehr')
  })
  it('|Δ| < 0,3 ist stabil, ab 0,3 nicht', () => {
    expect(berechneTrend([2, 2, 2, 2]).art).toBe('stabil')
    const erste = Array(10).fill(2)
    expect(berechneTrend([...erste, ...Array(8).fill(2), 3, 3]).art).toBe('stabil') // Δ = 0,2
    expect(berechneTrend([...erste, ...Array(7).fill(2), 3, 3, 3]).art).toBe('mehr') // Δ = 0,3 genau: nicht mehr „stabil“
    expect(berechneTrend([...erste.map(() => 3), ...Array(7).fill(3), 2, 2, 2]).art).toBe('weniger') // Δ = −0,3
  })
  it('ungerades n: Mitte gehört zur 2. Hälfte', () => {
    // n=5: erste 2 = [4,4] (4), Rest [2,2,2] (2) → −2
    expect(berechneTrend([4, 4, 2, 2, 2])).toEqual({ art: 'weniger', delta: -2 })
  })
})

describe('auswerteItem', () => {
  it('„nicht beobachtet“ zählt nie als 0', () => {
    const a = auswerteItem(item, [e('2026-09-01', 2), e('2026-09-02'), e('2026-09-03', 0), e('2026-09-04')])
    expect(a.n).toBe(2)
    expect(a.mittel).toBe(1)
    expect(a.verteilung).toEqual([1, 0, 1, 0, 0])
  })
  it('übernommene, unbestätigte Werte zählen nicht', () => {
    const x = e('2026-09-01'); x.werte['kog-fokus'] = { stufe: 4, uebernommen: true }
    expect(auswerteItem(item, [x, e('2026-09-02', 1)]).n).toBe(1)
    expect(istDokumentiert(x)).toBe(false)
  })
  it('keine Daten: Mittel null', () => {
    const a = auswerteItem(item, [])
    expect(a.mittel).toBeNull(); expect(a.n).toBe(0); expect(a.trend.art).toBe('zuWenig')
  })
  it('Wochenmittel gruppiert nach Montag, chronologisch auch bei unsortierter Eingabe', () => {
    const a = auswerteItem(item, [e('2026-09-15', 4), e('2026-09-01', 2), e('2026-09-02', 4), e('2026-09-16', 2)])
    expect(a.wochen).toEqual([
      { woche: '2026-08-31', mittel: 3, n: 2 },
      { woche: '2026-09-14', mittel: 3, n: 2 },
    ])
  })
})

describe('Umwelt und Maßnahmen', () => {
  it('zählt Tage je Faktor, nicht Mehrfachnennungen', () => {
    const a = e('2026-09-01', undefined, { umwelt: { foerder: ['Lärmschutz', 'Lärmschutz'], barrieren: ['Hoher Lärmpegel'], laerm: 3, reizschutz: 'wirksam' } })
    const b = e('2026-09-02', undefined, { umwelt: { foerder: ['Lärmschutz'], barrieren: [], laerm: 3 } })
    const u = auswerteUmwelt([a, b])
    expect(u.foerder).toEqual([{ text: 'Lärmschutz', tage: 2 }])
    expect(u.barrieren).toEqual([{ text: 'Hoher Lärmpegel', tage: 1 }])
    expect(u.laerm).toEqual([0, 0, 0, 2, 0])
    expect(u.reizschutz.wirksam).toBe(1)
  })
  it('Wirksamkeitsanteil über bewertete Einsätze (Tag und Punkt)', () => {
    const a = e('2026-09-01', 1, { massnahmen: [{ methode: 'Timer', wirksamkeit: 'wirksam' }] })
    a.werte['kog-fokus'].massnahme = 'Timer'; a.werte['kog-fokus'].wirksamkeit = 'nicht'
    const b = e('2026-09-02', undefined, { massnahmen: [{ methode: 'Timer' }] })
    const m = auswerteMassnahmen([a, b])
    expect(m).toEqual([{ methode: 'Timer', anzahl: 3, wirksam: 1, teilweise: 0, nicht: 1, bewertet: 2, anteilWirksam: 0.5 }])
  })
})

describe('Texte', () => {
  it('chronologisch, mit Kürzel statt Platzhalter, nur Zeitraum-Daten', () => {
    const a = e('2026-09-02', 1, { tagesnotiz: 'Ruhiger Tag' })
    a.werte['kog-fokus'].bausteine = ['{Kind} blieb bei der Aufgabe.']
    const b = e('2026-09-01', undefined, { ressourcen: 'Hat selbst begonnen' })
    const t = sammleTexte([a, b], 'Mia', [item])
    expect(t.map((x) => x.datum)).toEqual(['2026-09-01', '2026-09-02'])
    expect(t[1].zeilen.some((z) => z.text === 'Mia blieb bei der Aufgabe.' && z.prefix === item.label)).toBe(true)
    expect(JSON.stringify(t)).not.toContain('{Kind}')
  })
})

describe('Bericht', () => {
  const kind: Kind = { id: 1, name: 'Mia', diagnosen: ['F84.5'], aktenzeichen: 'AZ-1', kostentraeger: 'Amt', ziele: ['Ziel A'], netzwerk: {}, aktiveItems: ['kog-fokus', 'mot-stift'], farbe: '#000', archiviert: 0, stunden: 15 }
  const basis = { kind, von: '2026-09-01', bis: '2026-09-30', items: KATALOG, ersteller: {}, heute: '2026-10-05' }
  const eintraege = [e('2026-09-01', 3), e('2026-09-02', 3), e('2026-09-03', 1), e('2026-09-04', 1), e('2026-08-31', 4), e('2026-10-01', 4)]
  eintraege.push(Object.assign(leererEintrag(1, '2026-09-05'), { werte: { 'mot-stift': { stufe: 2 as Stufe } } }))

  it('Datensparsamkeit: Diagnose/Aktenzeichen nur wenn aktiviert, Zeitraum strikt', () => {
    const aus = baueBerichtDaten({ ...basis, eintraege, optionen: { profilId: 'voll', bereiche: profilVon('voll').bereiche, diagnose: false, aktenzeichen: false, tagestexte: profilVon('voll').tagestexte } })
    expect(aus.kind.diagnose).toBeUndefined(); expect(aus.kind.aktenzeichen).toBeUndefined()
    expect(aus.tageDokumentiert).toBe(5)
    expect(aus.bereiche.find((b) => b.id === 'kognition')!.items[0].n).toBe(4)
    const an = baueBerichtDaten({ ...basis, eintraege, optionen: { profilId: 'voll', bereiche: profilVon('voll').bereiche, diagnose: true, aktenzeichen: true, tagestexte: true } })
    expect(an.kind.diagnose).toBe('F84.5'); expect(an.kind.aktenzeichen).toBe('AZ-1')
  })
  it('Profil blendet Fachbereiche und Verwaltungsdaten aus', () => {
    const p = profilVon('ergo')
    const d = baueBerichtDaten({ ...basis, eintraege, optionen: { profilId: 'ergo', bereiche: p.bereiche, diagnose: false, aktenzeichen: false, tagestexte: p.tagestexte } })
    expect(d.bereiche.map((b) => b.id)).toEqual(['motorik'])
    expect(d.kind.kostentraeger).toBeUndefined(); expect(d.kind.stunden).toBeUndefined(); expect(d.kind.ziele).toEqual([])
  })
  it('Fachtherapie-Profil: keine Tagesnotizen/Tages-Maßnahmen, Punkt-Maßnahmen nur aus sichtbaren Bereichen', () => {
    const p = profilVon('ergo')
    const x = e('2026-09-01', 2, { tagesnotiz: 'privat', massnahmen: [{ methode: 'Timer' }] })
    x.werte['kog-fokus'].massnahme = 'Checkliste'
    x.werte['mot-stift'] = { stufe: 1, massnahme: 'Stifthilfe' }
    const d = baueBerichtDaten({ ...basis, eintraege: [x], optionen: { profilId: 'ergo', bereiche: p.bereiche, diagnose: false, aktenzeichen: false, tagestexte: p.tagestexte } })
    expect(d.texte).toEqual([])
    expect(d.massnahmen.map((m) => m.methode)).toEqual(['Stifthilfe'])
  })
  it('Fazit nutzt Trend positiv formuliert und Werktage', () => {
    const d = baueBerichtDaten({ ...basis, eintraege, optionen: { profilId: 'voll', bereiche: profilVon('voll').bereiche, diagnose: false, aktenzeichen: false, tagestexte: profilVon('voll').tagestexte } })
    expect(d.fazit).toContain('5 von 22 Werktagen') // 01.–30.09.: 22 Werktage
    expect(d.fazit).toContain('Weniger Unterstützung nötig war zuletzt bei: Fokusdauer bei Einzelarbeit')
  })
  it('leerer Zeitraum', () => {
    const d = baueBerichtDaten({ ...basis, eintraege: [], optionen: { profilId: 'voll', bereiche: profilVon('voll').bereiche, diagnose: false, aktenzeichen: false, tagestexte: profilVon('voll').tagestexte } })
    expect(d.tageDokumentiert).toBe(0); expect(d.bereiche).toEqual([]); expect(d.fazit).toContain('keine Beobachtungen')
  })
  it('Werktage werden bis heute gedeckelt', () => {
    expect(zaehleWerktage('2026-09-01', '2026-09-30', '2026-09-10')).toBe(8)
    expect(zaehleWerktage('2026-09-01', '2026-09-30', '2026-10-05')).toBe(22)
  })
})
