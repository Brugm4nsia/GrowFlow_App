import { describe, expect, it } from 'vitest'
import { bestaetigeAlle, fortschritt, gemeinsameStufe, setzeStufe, tippAktion, uebernimmLetzten, umschalten } from './erfassung'
import { leererEintrag } from './db'

describe('Tipp-Logik', () => {
  it('setzt beim ersten Tipp, nimmt beim erneuten Tipp zurück', () => {
    expect(tippAktion([undefined], 2)).toBe('setzen')
    expect(tippAktion([{ stufe: 2 }], 2)).toBe('entfernen')
    expect(tippAktion([{ stufe: 2 }], 3)).toBe('setzen')
  })
  it('Stufe 0 wird als Wert erkannt', () => {
    expect(tippAktion([{ stufe: 0 }], 0)).toBe('entfernen')
  })
  it('bei mehreren Kindern nur zurücknehmen, wenn alle gleich sind', () => {
    expect(tippAktion([{ stufe: 1 }, { stufe: 2 }], 1)).toBe('setzen')
    expect(tippAktion([{ stufe: 1 }, undefined], 1)).toBe('setzen')
    expect(tippAktion([{ stufe: 1 }, { stufe: 1 }], 1)).toBe('entfernen')
  })
  it('Tipp auf übernommenen Wert bestätigt statt zurückzunehmen', () => {
    expect(tippAktion([{ stufe: 1, uebernommen: true }], 1)).toBe('setzen')
  })
  it('gemeinsameStufe', () => {
    expect(gemeinsameStufe([undefined, undefined])).toBeUndefined()
    expect(gemeinsameStufe([{ stufe: 0 }, { stufe: 0 }])).toBe(0)
    expect(gemeinsameStufe([{ stufe: 0 }, { stufe: 1 }])).toBe('unterschiedlich')
    expect(gemeinsameStufe([{ stufe: 0 }, undefined])).toBe('unterschiedlich')
  })
})

describe('Wie zuletzt', () => {
  it('übernimmt nur nicht erfasste Aktiv-Punkte, markiert sie und überschreibt nichts', () => {
    const alt = leererEintrag(1, '2026-09-01')
    alt.werte = { a: { stufe: 2, notiz: 'privat' }, b: { stufe: 1 }, c: { stufe: 3 } }
    alt.massnahmen = [{ methode: 'Timer' }]
    const neu = leererEintrag(1, '2026-09-02')
    neu.werte = { b: { stufe: 4 } }
    const n = uebernimmLetzten(neu, alt, ['a', 'b'])
    expect(n).toBe(1)
    expect(neu.werte.a).toEqual({ stufe: 2, uebernommen: true })
    expect(neu.werte.b).toEqual({ stufe: 4 })
    expect(neu.werte.c).toBeUndefined()
    expect(neu.massnahmen).toEqual([{ methode: 'Timer' }])
  })
  it('zählt übernommene Werte getrennt und bestätigt sie', () => {
    const e = leererEintrag(1, '2026-09-02')
    setzeStufe(e, 'a', 1)
    e.werte.b = { stufe: 2, uebernommen: true }
    expect(fortschritt(e, ['a', 'b', 'c'])).toEqual({ gesamt: 3, erfasst: 1, uebernommen: 1 })
    bestaetigeAlle(e)
    expect(fortschritt(e, ['a', 'b', 'c'])).toEqual({ gesamt: 3, erfasst: 2, uebernommen: 0 })
  })
  it('umschalten', () => {
    expect(umschalten(['a'], 'b')).toEqual(['a', 'b'])
    expect(umschalten(['a', 'b'], 'a')).toEqual(['b'])
  })
})
