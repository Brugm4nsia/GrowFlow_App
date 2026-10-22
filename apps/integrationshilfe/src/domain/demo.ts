import { addDays, format } from 'date-fns'
import { db, ladeEinstellungen, loescheKind, speichereEinstellungen } from './db'
import { ISO } from './datum'
import { DEMO_KINDER, erzeugeEintraege } from './fixtures'

/** Lädt zwei klar gekennzeichnete, rein fiktive Demo-Kinder mit sechs Wochen Beispieleinträgen. */
export async function ladeDemo(heute = new Date()): Promise<number[]> {
  const bis = format(addDays(heute, -1), ISO)
  const von = format(addDays(heute, -43), ISO)
  const ids: number[] = []
  await db.transaction('rw', db.kinder, db.eintraege, async () => {
    for (const [i, vorlage] of DEMO_KINDER.entries()) {
      const { id: _alt, ...kind } = vorlage
      void _alt
      const id = await db.kinder.add({ ...kind, ziele: [...kind.ziele] })
      ids.push(id)
      const eintraege = erzeugeEintraege({ ...vorlage, id }, von, bis, { seed: 10 + i, besserung: i === 0, luecken: 0.12 })
      await db.eintraege.bulkAdd(eintraege)
    }
  })
  const alt = (await ladeEinstellungen()).demoKinder ?? []
  await speichereEinstellungen({ demoKinder: [...alt, ...ids], letzteKinder: ids })
  return ids
}

export async function entferneDemo(): Promise<void> {
  const e = await ladeEinstellungen()
  for (const id of e.demoKinder ?? []) await loescheKind(id)
  await speichereEinstellungen({ demoKinder: [], letzteKinder: [] })
}
