import type { Eintrag, Einstellungen, Kind } from '../../domain/types'

export interface ErfassungsKontext {
  datum: string
  /** Ausgewählte Kinder (mindestens eines). */
  kinder: Kind[]
  eintraege: Map<number, Eintrag>
  /** Wendet fn auf die Einträge aller (oder der übergebenen) Kinder an und speichert automatisch. */
  aendere: (fn: (e: Eintrag, k: Kind) => void, nurKinder?: Kind[]) => void
  einzeln: boolean
  einst: Einstellungen
}
