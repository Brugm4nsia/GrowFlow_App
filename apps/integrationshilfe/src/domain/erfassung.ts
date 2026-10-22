import type { Eintrag, Stufe, WertEintrag } from './types'

export type TippAktion = 'setzen' | 'entfernen'

/**
 * Ein Tipp auf eine Stufe: Sind bereits alle betroffenen Kinder bestätigt auf genau dieser Stufe,
 * nimmt der Tipp den Wert zurück; sonst wird die Stufe für alle gesetzt (das bestätigt auch „übernommene“ Werte).
 */
export function tippAktion(werte: (WertEintrag | undefined)[], stufe: Stufe): TippAktion {
  const alleGleich = werte.length > 0 && werte.every((w) => w?.stufe === stufe && !w.uebernommen)
  return alleGleich ? 'entfernen' : 'setzen'
}

export function setzeStufe(e: Eintrag, itemId: string, stufe: Stufe | undefined) {
  const w: WertEintrag = e.werte[itemId] ?? {}
  if (stufe === undefined) delete w.stufe
  else w.stufe = stufe
  delete w.uebernommen
  e.werte[itemId] = w
}

/** Gemeinsame Stufe aller Werte, oder 'unterschiedlich' / undefined (nichts erfasst). */
export function gemeinsameStufe(werte: (WertEintrag | undefined)[]): Stufe | 'unterschiedlich' | undefined {
  const stufen = werte.map((w) => w?.stufe)
  if (stufen.every((s) => s === undefined)) return undefined
  const erste = stufen[0]
  return stufen.every((s) => s === erste) ? erste : 'unterschiedlich'
}

export interface Fortschritt {
  gesamt: number
  erfasst: number
  uebernommen: number
}

export function fortschritt(e: Eintrag | undefined, aktiveItems: string[]): Fortschritt {
  let erfasst = 0
  let uebernommen = 0
  for (const id of aktiveItems) {
    const w = e?.werte[id]
    if (w?.stufe === undefined) continue
    if (w.uebernommen) uebernommen++
    else erfasst++
  }
  return { gesamt: aktiveItems.length, erfasst, uebernommen }
}

/**
 * „Wie zuletzt“: Übernimmt Stufen, Umwelt und Maßnahmen des letzten Eintrags als Ausgangspunkt.
 * Bereits erfasste Werte werden nie überschrieben; übernommene Stufen sind als „uebernommen“ markiert.
 * Notizen und Texte werden nicht übernommen. Rückgabe: Anzahl übernommener Stufen.
 */
export function uebernimmLetzten(ziel: Eintrag, letzter: Eintrag, aktiveItems: string[]): number {
  let n = 0
  for (const id of aktiveItems) {
    const alt = letzter.werte[id]
    if (alt?.stufe === undefined || alt.uebernommen) continue
    if (ziel.werte[id]?.stufe !== undefined) continue
    ziel.werte[id] = { ...ziel.werte[id], stufe: alt.stufe, uebernommen: true }
    n++
  }
  const leer = !ziel.umwelt.foerder.length && !ziel.umwelt.barrieren.length && ziel.umwelt.laerm === undefined && ziel.umwelt.reizschutz === undefined
  if (leer) ziel.umwelt = { ...letzter.umwelt, foerder: [...letzter.umwelt.foerder], barrieren: [...letzter.umwelt.barrieren] }
  if (!ziel.massnahmen.length) ziel.massnahmen = letzter.massnahmen.map((m) => ({ ...m }))
  return n
}

export function bestaetigeAlle(e: Eintrag) {
  for (const w of Object.values(e.werte)) delete w.uebernommen
}

export function hatUebernommene(e: Eintrag | undefined): boolean {
  return !!e && Object.values(e.werte).some((w) => w.uebernommen)
}

export function umschalten(liste: string[], wert: string): string[] {
  return liste.includes(wert) ? liste.filter((x) => x !== wert) : [...liste, wert]
}
