import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { aendereEintrag, IntegrationshilfeDB } from './db'
import { entschluessele, erzeugeBackup, FalschesPasswort, istVerschluesselt, pruefeBackup, stelleWiederHer, verschluessele } from './backup'

async function neueDb() {
  const d = new IntegrationshilfeDB('test-' + Math.random())
  await d.open()
  return d
}

describe('Backup', () => {
  it('Verschlüsselung: Roundtrip, falsches Passwort scheitert, Magic erkennbar', async () => {
    const daten = new TextEncoder().encode('{"geheim":"Gesundheitsdaten"}')
    const blob = await verschluessele(daten, 'passwort-1')
    const bytes = new Uint8Array(await blob.arrayBuffer())
    expect(istVerschluesselt(bytes)).toBe(true)
    expect(new TextDecoder().decode(bytes)).not.toContain('Gesundheitsdaten')
    expect(new TextDecoder().decode(await entschluessele(bytes, 'passwort-1'))).toContain('Gesundheitsdaten')
    await expect(entschluessele(bytes, 'falsch')).rejects.toBeInstanceOf(FalschesPasswort)
  })

  it('Export → Import in leere DB (unverschlüsselt und verschlüsselt)', async () => {
    const quelle = await neueDb()
    const kid = await quelle.kinder.add({ name: 'Demo X', diagnosen: [], ziele: [], netzwerk: {}, aktiveItems: ['kog-fokus'], farbe: '#000', archiviert: 0 })
    await aendereEintrag(kid, '2026-09-01', (e) => { e.werte['kog-fokus'] = { stufe: 0, notiz: 'Beispiel' } }, quelle)

    for (const pw of [undefined, 'geheim']) {
      const { blob, name } = await erzeugeBackup(pw, quelle)
      expect(name.endsWith(pw ? '.ihbackup' : '.json')).toBe(true)
      const pruef = await pruefeBackup(blob)
      expect(pruef).toEqual({ ok: true, verschluesselt: !!pw })
      const ziel = await neueDb()
      await ziel.kinder.add({ name: 'Wird überschrieben', diagnosen: [], ziele: [], netzwerk: {}, aktiveItems: [], farbe: '#000', archiviert: 0 })
      await stelleWiederHer(blob, pw, ziel)
      const kinder = await ziel.kinder.toArray()
      expect(kinder.map((k) => k.name)).toEqual(['Demo X'])
      const e = await ziel.eintraege.toArray()
      expect(e).toHaveLength(1)
      expect(e[0].werte['kog-fokus']).toEqual({ stufe: 0, notiz: 'Beispiel' })
    }
  })

  it('lehnt Dateien ohne Backup-Format ab', async () => {
    const r = await pruefeBackup(new Blob(['kein backup']))
    expect(r.ok).toBe(false)
  })
})
