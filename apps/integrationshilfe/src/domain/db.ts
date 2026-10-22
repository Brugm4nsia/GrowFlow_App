import Dexie, { type Table } from 'dexie'
import type { EigenerBaustein, EigenesItem, Eintrag, Einstellungen, Kind } from './types'

export const STANDARD_EINSTELLUNGEN: Einstellungen = {
  key: 'app',
  letzteKinder: [],
  eigeneFoerder: [],
  eigeneBarrieren: [],
  eigeneMassnahmen: [],
  backupErinnerungTage: 14,
}

export class IntegrationshilfeDB extends Dexie {
  kinder!: Table<Kind, number>
  eintraege!: Table<Eintrag, number>
  eigeneItems!: Table<EigenesItem, number>
  textbausteine!: Table<EigenerBaustein, number>
  einstellungen!: Table<Einstellungen, string>

  constructor(name = 'integrationshilfeDB') {
    super(name)
    // Schema-Änderungen nur über neue version(n) mit Migration.
    this.version(1).stores({
      kinder: '++id, name, archiviert',
      eintraege: '++id, &[kindId+datum], kindId, datum',
      eigeneItems: '++id, bereich',
      textbausteine: '++id, itemId',
      einstellungen: 'key',
    })
  }
}

export const db = new IntegrationshilfeDB()

export async function ladeEinstellungen(d: IntegrationshilfeDB = db): Promise<Einstellungen> {
  const e = await d.einstellungen.get('app')
  return { ...STANDARD_EINSTELLUNGEN, ...(e ?? {}) }
}

export async function speichereEinstellungen(patch: Partial<Einstellungen>, d: IntegrationshilfeDB = db) {
  await d.transaction('rw', d.einstellungen, async () => {
    const alt = await ladeEinstellungen(d)
    await d.einstellungen.put({ ...alt, ...patch, key: 'app' })
  })
}

export function leererEintrag(kindId: number, datum: string): Eintrag {
  const jetzt = Date.now()
  return { kindId, datum, werte: {}, umwelt: { foerder: [], barrieren: [] }, massnahmen: [], createdAt: jetzt, updatedAt: jetzt }
}

export function istLeer(e: Eintrag): boolean {
  const werteLeer = Object.values(e.werte).every(
    (w) => w.stufe === undefined && !w.bausteine?.length && !w.notiz?.trim() && !w.massnahme && !w.wirksamkeit,
  )
  return (
    werteLeer &&
    !e.umwelt.foerder.length &&
    !e.umwelt.barrieren.length &&
    e.umwelt.laerm === undefined &&
    e.umwelt.reizschutz === undefined &&
    !e.massnahmen.length &&
    !e.ressourcen?.trim() &&
    !e.tagesnotiz?.trim() &&
    !e.tagesbausteine?.length
  )
}

/**
 * Autosave-Kern: liest den Eintrag (kind, datum), wendet `fn` an, speichert ihn
 * oder löscht ihn, wenn er danach leer ist (Tag zählt dann nicht als dokumentiert).
 */
export async function aendereEintrag(
  kindId: number,
  datum: string,
  fn: (e: Eintrag) => void,
  d: IntegrationshilfeDB = db,
): Promise<void> {
  await d.transaction('rw', d.eintraege, async () => {
    const vorhanden = await d.eintraege.where('[kindId+datum]').equals([kindId, datum]).first()
    const e: Eintrag = vorhanden ?? leererEintrag(kindId, datum)
    fn(e)
    for (const [k, w] of Object.entries(e.werte)) {
      if (w.stufe === undefined && !w.bausteine?.length && !w.notiz?.trim() && !w.massnahme && !w.wirksamkeit) delete e.werte[k]
    }
    e.updatedAt = Date.now()
    if (istLeer(e)) {
      if (e.id !== undefined) await d.eintraege.delete(e.id)
    } else {
      await d.eintraege.put(e)
    }
  })
}

export async function eintraegeImZeitraum(kindId: number, von: string, bis: string, d: IntegrationshilfeDB = db): Promise<Eintrag[]> {
  return d.eintraege.where('[kindId+datum]').between([kindId, von], [kindId, bis], true, true).toArray()
}

export async function loescheKind(kindId: number, d: IntegrationshilfeDB = db) {
  await d.transaction('rw', d.kinder, d.eintraege, async () => {
    await d.eintraege.where('kindId').equals(kindId).delete()
    await d.kinder.delete(kindId)
  })
}
