// Rein fiktive Beispieldaten (Tests, PDF-Prüfung, Demo-Modus). Keine echten Personen.
import { addDays, format, parseISO } from 'date-fns'
import { leererEintrag } from './db'
import { ISO, istWochenende } from './datum'
import { ALLGEMEINE_BAUSTEINE, FOERDERFAKTOREN, BARRIEREN, KATALOG } from './katalog'
import type { Eintrag, Kind, Stufe } from './types'

export function zufall(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const DEMO_KINDER: Kind[] = [
  {
    id: 1, name: 'Demo Lena', geburtsdatum: '2017-04-12', schulart: 'Grundschule', klasse: '3b', kostentraeger: 'Beispiel-Jugendamt', aktenzeichen: 'DEMO-0001',
    diagnosen: ['F84.5', 'F82'], diagnoseFreitext: '', stunden: 15, bewilligungVon: '2026-08-01', bewilligungBis: '2027-07-31',
    ziele: ['Teilnahme an Gruppenarbeiten', 'Selbstständiges Nutzen von Reizschutz', 'Eigenständiger Wechsel zwischen Arbeitsphasen'],
    netzwerk: { schule: 'Frau Beispiel (Klassenleitung)', ergotherapie: 'Praxis Muster' },
    aktiveItems: ['kog-fokus', 'kog-ablenkung', 'kog-wechsel', 'kog-reiz', 'mot-stift', 'mot-ermuedung', 'spr-pragmatik', 'soz-kontakt', 'soz-frust', 'selbst-material'],
    farbe: '#1E4E8C', archiviert: 0,
  },
  {
    id: 2, name: 'Demo Tim', schulart: 'Grundschule', klasse: '2a', diagnosen: ['F90.0'], stunden: 10,
    ziele: ['Aufgaben bis zum Ende bearbeiten'], netzwerk: {},
    aktiveItems: ['kog-fokus', 'kog-impuls', 'soz-regeln', 'selbst-hygiene', 'selbst-kleiden'],
    farbe: '#0E7C66', archiviert: 0,
  },
]

/**
 * Erzeugt Einträge für alle Werktage im Zeitraum. `besserung`: Stufen sinken im Zeitverlauf (positiver Verlauf).
 * `luecken` (0–1): Anteil ausgelassener Werktage.
 */
export function erzeugeEintraege(kind: Kind, von: string, bis: string, opt: { seed: number; besserung?: boolean; luecken?: number; langeNotiz?: boolean }): Eintrag[] {
  const r = zufall(opt.seed)
  const out: Eintrag[] = []
  const tage: string[] = []
  for (let d = parseISO(von); format(d, ISO) <= bis; d = addDays(d, 1)) if (!istWochenende(format(d, ISO))) tage.push(format(d, ISO))
  const items = KATALOG.filter((i) => kind.aktiveItems.includes(i.id))
  tage.forEach((datum, idx) => {
    if (r() < (opt.luecken ?? 0.1)) return
    const e = leererEintrag(kind.id!, datum)
    const fortschritt = idx / Math.max(tage.length - 1, 1)
    for (const it of items) {
      if (r() < 0.12) continue // an manchen Tagen nicht beobachtet
      const basis = 3.2 - (opt.besserung ? 2.0 * fortschritt : 0) + (r() - 0.5) * 1.4
      const stufe = Math.max(0, Math.min(4, Math.round(basis))) as Stufe
      e.werte[it.id] = { stufe }
      if (r() < 0.15) e.werte[it.id].bausteine = [it.bausteine[Math.floor(r() * it.bausteine.length)]]
      if (r() < 0.06) { e.werte[it.id].massnahme = 'Visueller Ablaufplan / Checkliste'; e.werte[it.id].wirksamkeit = r() < 0.7 ? 'wirksam' : 'teilweise' }
    }
    e.umwelt = { foerder: FOERDERFAKTOREN.filter(() => r() < 0.35), barrieren: BARRIEREN.filter(() => r() < 0.2), laerm: Math.floor(r() * 5) as Stufe, reizschutz: r() < 0.5 ? (r() < 0.6 ? 'wirksam' : 'teilweise') : undefined }
    if (r() < 0.5) e.massnahmen = [{ methode: 'Kurze Bewegungspause', wirksamkeit: r() < 0.8 ? 'wirksam' : 'nicht' }]
    if (r() < 0.25) e.tagesbausteine = [ALLGEMEINE_BAUSTEINE[Math.floor(r() * ALLGEMEINE_BAUSTEINE.length)]]
    if (r() < 0.2) e.ressourcen = 'Hat die Aufgabe von sich aus begonnen und zu Ende geführt.'
    if (r() < 0.15) e.tagesnotiz = `${kind.name} reagierte auf den angekündigten Raumwechsel ruhig und fand den Weg zum neuen Platz selbstständig.`
    if (opt.langeNotiz && idx === 5) e.tagesnotiz = Array(14).fill(`${kind.name} nutzte nach der Mathematikaufgabe den Rückzugsort, kehrte nach einigen Minuten zurück und setzte die Arbeit mit der Checkliste fort.`).join(' ')
    out.push(e)
  })
  return out
}
