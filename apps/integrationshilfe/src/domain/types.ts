export type Stufe = 0 | 1 | 2 | 3 | 4
export type Wirksamkeit = 'wirksam' | 'teilweise' | 'nicht'
export type BereichId = 'kognition' | 'motorik' | 'sprache' | 'sozio' | 'selbst' | 'umwelt'

export interface Netzwerk {
  schule?: string
  ergotherapie?: string
  logopaedie?: string
  kjp?: string
  spz?: string
}

export interface Kind {
  id?: number
  /** Kürzel bzw. Vorname – Pseudonym ist der Standard. */
  name: string
  nachname?: string
  geburtsdatum?: string
  schulart?: string
  klasse?: string
  kostentraeger?: string
  aktenzeichen?: string
  /** Auswahl-Einträge der ICD-10-Liste, z. B. „F84.5“. */
  diagnosen: string[]
  diagnoseFreitext?: string
  stunden?: number
  bewilligungVon?: string
  bewilligungBis?: string
  /** Leit- und Teilhabeziele, ein Ziel pro Zeile. */
  ziele: string[]
  netzwerk: Netzwerk
  /** IDs der aktiven Beobachtungspunkte (Katalog oder „eigen-<id>“). */
  aktiveItems: string[]
  farbe: string
  /** 0 = aktiv, 1 = archiviert (Dexie kann keine Booleans indizieren). */
  archiviert: 0 | 1
}

export interface WertEintrag {
  stufe?: Stufe
  /** Ausgewählte Textbausteine als Vorlagentext mit Platzhalter {Kind}. */
  bausteine?: string[]
  notiz?: string
  massnahme?: string
  wirksamkeit?: Wirksamkeit
  /** Per „Wie zuletzt“ übernommen und noch nicht bestätigt: zählt nicht in der Auswertung. */
  uebernommen?: boolean
}

export interface Massnahme {
  methode: string
  wirksamkeit?: Wirksamkeit
}

export interface Umwelt {
  foerder: string[]
  barrieren: string[]
  /** 0 (ruhig) … 4 (sehr laut) */
  laerm?: Stufe
  reizschutz?: Wirksamkeit
}

export interface Eintrag {
  id?: number
  kindId: number
  /** yyyy-MM-dd */
  datum: string
  werte: Record<string, WertEintrag>
  umwelt: Umwelt
  massnahmen: Massnahme[]
  ressourcen?: string
  tagesnotiz?: string
  /** Bausteine für die Tagesnotiz (Vorlagentext mit {Kind}). */
  tagesbausteine?: string[]
  createdAt: number
  updatedAt: number
}

export interface EigenesItem {
  id?: number
  bereich: Exclude<BereichId, 'umwelt'>
  label: string
  hinweis?: string
}

export interface EigenerBaustein {
  id?: number
  /** Katalog-Item-ID oder '' für allgemein. */
  itemId: string
  text: string
}

export interface Einstellungen {
  key: 'app'
  erstellerName?: string
  funktion?: string
  traeger?: string
  letzteKinder: number[]
  eigeneFoerder: string[]
  eigeneBarrieren: string[]
  eigeneMassnahmen: string[]
  letztesBackup?: number
  backupErinnerungTage: number
  /** IDs der Demo-Kinder (fiktive Beispieldaten), solange geladen. */
  demoKinder?: number[]
}

export interface Item {
  id: string
  bereich: Exclude<BereichId, 'umwelt'>
  label: string
  hinweis: string
  bausteine: string[]
  eigen?: boolean
}
