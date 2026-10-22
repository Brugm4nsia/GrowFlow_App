import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { aendereEintrag, eintraegeImZeitraum, IntegrationshilfeDB, loescheKind } from './db'
import { schnellwahl, tagVersetzen } from './datum'

let d: IntegrationshilfeDB
beforeEach(async () => {
  d = new IntegrationshilfeDB('test-' + Math.random())
  await d.open()
})

describe('aendereEintrag', () => {
  it('legt einen Eintrag erst bei der ersten Eingabe an und fasst pro Tag zusammen', async () => {
    expect(await d.eintraege.count()).toBe(0)
    await aendereEintrag(1, '2026-09-01', (e) => { e.werte['kog-fokus'] = { stufe: 2 } }, d)
    await aendereEintrag(1, '2026-09-01', (e) => { e.werte['kog-impuls'] = { stufe: 1 } }, d)
    expect(await d.eintraege.count()).toBe(1)
    const e = (await d.eintraege.toArray())[0]
    expect(e.werte['kog-fokus'].stufe).toBe(2)
    expect(e.werte['kog-impuls'].stufe).toBe(1)
  })

  it('löscht den Eintrag, wenn alles zurückgenommen wurde', async () => {
    await aendereEintrag(1, '2026-09-01', (e) => { e.werte['a'] = { stufe: 0 } }, d)
    await aendereEintrag(1, '2026-09-01', (e) => { delete e.werte['a'].stufe }, d)
    expect(await d.eintraege.count()).toBe(0)
  })

  it('Stufe 0 ist ein gültiger Wert und keine „leere“ Eingabe', async () => {
    await aendereEintrag(1, '2026-09-01', (e) => { e.werte['a'] = { stufe: 0 } }, d)
    expect(await d.eintraege.count()).toBe(1)
  })

  it('trennt Kinder und fragt Zeiträume pro Kind ab', async () => {
    for (const k of [1, 2]) for (const t of ['2026-08-31', '2026-09-01', '2026-09-30', '2026-10-01'])
      await aendereEintrag(k, t, (e) => { e.tagesnotiz = 'x' }, d)
    const r = await eintraegeImZeitraum(1, '2026-09-01', '2026-09-30', d)
    expect(r.map((e) => e.datum)).toEqual(['2026-09-01', '2026-09-30'])
    expect(r.every((e) => e.kindId === 1)).toBe(true)
  })

  it('löscht beim Entfernen eines Kindes dessen Einträge', async () => {
    const id = await d.kinder.add({ name: 'Test', diagnosen: [], ziele: [], netzwerk: {}, aktiveItems: [], farbe: '#000', archiviert: 0 })
    await aendereEintrag(id, '2026-09-01', (e) => { e.tagesnotiz = 'x' }, d)
    await aendereEintrag(id + 1, '2026-09-01', (e) => { e.tagesnotiz = 'y' }, d)
    await loescheKind(id, d)
    expect(await d.kinder.count()).toBe(0)
    expect(await d.eintraege.count()).toBe(1)
  })
})

describe('datum', () => {
  it('rechnet Tage ohne Zeitzonenfehler', () => {
    expect(tagVersetzen('2026-03-28', 1)).toBe('2026-03-29')
    expect(tagVersetzen('2026-03-29', 1)).toBe('2026-03-30')
    expect(tagVersetzen('2026-01-01', -1)).toBe('2025-12-31')
  })
  it('Schnellwahl Woche beginnt am Montag', () => {
    expect(schnellwahl('woche', '2026-09-16')).toEqual({ von: '2026-09-14', bis: '2026-09-20' })
    expect(schnellwahl('monat', '2026-02-10')).toEqual({ von: '2026-02-01', bis: '2026-02-28' })
    expect(schnellwahl('halbjahr', '2026-09-16')).toEqual({ von: '2026-08-01', bis: '2027-01-31' })
    expect(schnellwahl('halbjahr', '2027-01-10')).toEqual({ von: '2026-08-01', bis: '2027-01-31' })
  })
})
