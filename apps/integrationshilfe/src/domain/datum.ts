import { addDays, endOfMonth, endOfWeek, format, parseISO, startOfMonth, startOfWeek, subWeeks, isValid } from 'date-fns'
import { de } from 'date-fns/locale'

export const ISO = 'yyyy-MM-dd'

export function heuteISO(): string {
  return format(new Date(), ISO)
}

export function istISO(s: string | undefined): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && isValid(parseISO(s))
}

export function tagVersetzen(iso: string, tage: number): string {
  return format(addDays(parseISO(iso), tage), ISO)
}

export function anzeigeDatum(iso: string): string {
  return format(parseISO(iso), 'dd.MM.yyyy')
}

export function langesDatum(iso: string): string {
  return format(parseISO(iso), 'EEEE, d. MMMM yyyy', { locale: de })
}

export function kurzDatum(iso: string): string {
  return format(parseISO(iso), 'dd.MM.')
}

export function wochentagKurz(iso: string): string {
  return format(parseISO(iso), 'EE', { locale: de })
}

export function istWochenende(iso: string): boolean {
  const d = parseISO(iso).getDay()
  return d === 0 || d === 6
}

export function alleTage(von: string, bis: string): string[] {
  const out: string[] = []
  let d = parseISO(von)
  const ende = parseISO(bis)
  while (d <= ende && out.length < 800) {
    out.push(format(d, ISO))
    d = addDays(d, 1)
  }
  return out
}

/** Montag der Woche (ISO-Woche) als yyyy-MM-dd. */
export function wochenStart(iso: string): string {
  return format(startOfWeek(parseISO(iso), { weekStartsOn: 1 }), ISO)
}

export interface Zeitraum {
  von: string
  bis: string
}

export type Schnellwahl = 'woche' | 'monat' | '4wochen' | 'halbjahr'

export function schnellwahl(art: Schnellwahl, heute = heuteISO()): Zeitraum {
  const h = parseISO(heute)
  switch (art) {
    case 'woche':
      return { von: format(startOfWeek(h, { weekStartsOn: 1 }), ISO), bis: format(endOfWeek(h, { weekStartsOn: 1 }), ISO) }
    case 'monat':
      return { von: format(startOfMonth(h), ISO), bis: format(endOfMonth(h), ISO) }
    case '4wochen':
      return { von: format(addDays(subWeeks(startOfWeek(h, { weekStartsOn: 1 }), 3), 0), ISO), bis: format(endOfWeek(h, { weekStartsOn: 1 }), ISO) }
    case 'halbjahr': {
      // Schulhalbjahre grob: Aug–Jan und Feb–Jul
      const m = h.getMonth() // 0-basiert
      const y = h.getFullYear()
      if (m >= 7) return { von: `${y}-08-01`, bis: `${y + 1}-01-31` }
      if (m === 0) return { von: `${y - 1}-08-01`, bis: `${y}-01-31` }
      return { von: `${y}-02-01`, bis: `${y}-07-31` }
    }
  }
}
