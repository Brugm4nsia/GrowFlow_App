import { useSyncExternalStore } from 'react'

export type SaveState = { phase: 'leer' | 'speichert' | 'gespeichert' | 'fehler'; zeit: number }
let state: SaveState = { phase: 'leer', zeit: 0 }
const hoerer = new Set<() => void>()
const setze = (s: SaveState) => {
  state = s
  hoerer.forEach((h) => h())
}

/** Hüllt einen Schreibvorgang ein und meldet den Status (Autosave-Anzeige). */
export async function mitStatus<T>(fn: () => Promise<T>): Promise<T | undefined> {
  setze({ phase: 'speichert', zeit: Date.now() })
  try {
    const r = await fn()
    setze({ phase: 'gespeichert', zeit: Date.now() })
    return r
  } catch (err) {
    console.error(err)
    setze({ phase: 'fehler', zeit: Date.now() })
    return undefined
  }
}

export function useSaveState(): SaveState {
  return useSyncExternalStore(
    (cb) => {
      hoerer.add(cb)
      return () => hoerer.delete(cb)
    },
    () => state,
  )
}
