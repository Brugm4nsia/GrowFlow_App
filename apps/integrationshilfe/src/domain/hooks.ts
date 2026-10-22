import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { db, STANDARD_EINSTELLUNGEN } from './db'
import { KATALOG } from './katalog'
import type { EigenerBaustein, Einstellungen, Item, Kind } from './types'

export function useKinder(inklArchiviert = false): Kind[] | undefined {
  return useLiveQuery(async () => {
    const alle = await db.kinder.toArray()
    return alle
      .filter((k) => inklArchiviert || k.archiviert === 0)
      .sort((a, b) => a.archiviert - b.archiviert || a.name.localeCompare(b.name, 'de'))
  }, [inklArchiviert])
}

export function useEinstellungen(): Einstellungen {
  const e = useLiveQuery(() => db.einstellungen.get('app'), [])
  return useMemo(() => ({ ...STANDARD_EINSTELLUNGEN, ...(e ?? {}) }), [e])
}

export function useEigeneItems(): Item[] {
  const l = useLiveQuery(() => db.eigeneItems.toArray(), []) ?? []
  return useMemo(
    () => l.map((e) => ({ id: `eigen-${e.id}`, bereich: e.bereich, label: e.label, hinweis: e.hinweis ?? 'Eigener Beobachtungspunkt', bausteine: [], eigen: true })),
    [l],
  )
}

export function useEigeneBausteine(): EigenerBaustein[] {
  return useLiveQuery(() => db.textbausteine.toArray(), []) ?? []
}

/** Katalog + eigene Punkte; Bausteine je Punkt inkl. eigener Bausteine. */
export function useAlleItems(): Item[] {
  const eigene = useEigeneItems()
  const bausteine = useEigeneBausteine()
  return useMemo(
    () =>
      [...KATALOG, ...eigene].map((i) => ({
        ...i,
        bausteine: [...i.bausteine, ...bausteine.filter((b) => b.itemId === i.id).map((b) => b.text)],
      })),
    [eigene, bausteine],
  )
}
