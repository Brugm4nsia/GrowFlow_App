import type { BereichId, Item, Stufe, Wirksamkeit } from './types'

/** Katalogversion – bei inhaltlichen Änderungen erhöhen (Einträge speichern nur Item-IDs und Texte). */
export const KATALOG_VERSION = 1

export const STUFEN: { stufe: Stufe; kurz: string; titel: string; text: string }[] = [
  { stufe: 0, kurz: 'Selbstständig', titel: 'Vollständig selbstständig', text: 'Das Kind führt die Handlung ohne externe Impulse innerhalb des altersgemäßen Zeitrahmens aus.' },
  { stufe: 1, kurz: 'Verbaler Impuls', titel: 'Verbaler Impuls', text: 'Eine einmalige Aufforderung oder Erinnerung reicht zur Handlungsinitiierung aus.' },
  { stufe: 2, kurz: 'Visuelle Hilfe', titel: 'Visuelle / strukturierende Unterstützung', text: 'Das Kind benötigt Piktogramme, Checklisten, Ablaufpläne oder Lärmschutz, um die Aufgabe zu bewältigen.' },
  { stufe: 3, kurz: 'Teil-Assistenz', titel: 'Physische Teil-Assistenz', text: 'Die Integrationskraft führt Teilhandlungen aus oder gibt direkte Hand-über-Hand-Führung.' },
  { stufe: 4, kurz: 'Übernahme', titel: 'Vollständige Übernahme', text: 'Die Handlung muss aufgrund von Überforderung oder physischer Einschränkung gänzlich von der Assistenzkraft erbracht werden.' },
]

/** Einfarbige Abstufung hell → dunkel (kein Ampel-Urteil), Text-Farbe für ausreichenden Kontrast. */
export const STUFEN_FARBE: { bg: string; fg: string }[] = [
  { bg: '#D6E6F5', fg: '#1A202C' },
  { bg: '#9CC1E4', fg: '#1A202C' },
  { bg: '#5E9BD1', fg: '#0B1A2E' },
  { bg: '#2F73B5', fg: '#FFFFFF' },
  { bg: '#1B4A82', fg: '#FFFFFF' },
]

export const WIRKSAMKEIT: { id: Wirksamkeit; label: string }[] = [
  { id: 'wirksam', label: 'wirksam' },
  { id: 'teilweise', label: 'teilweise wirksam' },
  { id: 'nicht', label: 'nicht wirksam' },
]

export interface Bereich {
  id: BereichId
  titel: string
  kurz: string
  icf: string
}

export const BEREICHE: Bereich[] = [
  { id: 'kognition', titel: 'Kognition und exekutive Funktionen', kurz: 'Kognition', icf: 'ICF-CY b110–b199 / d110–d199' },
  { id: 'motorik', titel: 'Motorik, Sensorik und Grafomotorik', kurz: 'Motorik', icf: 'ICF-CY b710–b799 / d140–d159' },
  { id: 'sprache', titel: 'Sprache und Kommunikation', kurz: 'Sprache', icf: 'ICF-CY b167 / d310–d399' },
  { id: 'sozio', titel: 'Sozio-emotionale Entwicklung und Interaktion', kurz: 'Sozio-emotional', icf: 'ICF-CY b122, b152 / d710–d799' },
  { id: 'selbst', titel: 'Selbstversorgung und Alltagsautonomie', kurz: 'Selbstversorgung', icf: 'ICF-CY d510–d599 / d200' },
  { id: 'umwelt', titel: 'Umwelt und Kontext', kurz: 'Umwelt', icf: 'ICF-CY e110–e599' },
]

export const SKALA_BEREICHE = BEREICHE.filter((b) => b.id !== 'umwelt') as (Bereich & { id: Exclude<BereichId, 'umwelt'> })[]

export function bereichVon(id: BereichId): Bereich {
  return BEREICHE.find((b) => b.id === id)!
}

type Roh = Omit<Item, 'bereich'>
const item = (id: string, label: string, hinweis: string, bausteine: string[]): Roh => ({ id, label, hinweis, bausteine })

const KOGNITION: Roh[] = [
  item('kog-fokus', 'Fokusdauer bei Einzelarbeit', 'Wie lange bleibt das Kind bei einer Aufgabe, bevor ein Impuls nötig ist?', [
    '{Kind} blieb eine ganze Arbeitsphase ohne Impuls bei der Aufgabe.',
    '{Kind} kehrte nach einer kurzen Unterbrechung selbstständig zur Aufgabe zurück.',
    'Nach einem kurzen Hinweis konnte {Kind} die Aufgabe weiterführen.',
    'Mit einer kurzen Bewegungspause arbeitete {Kind} danach wieder konzentriert weiter.',
    'Mit einer Zeitanzeige (Sanduhr, Timer) blieb {Kind} länger bei der Aufgabe.',
  ]),
  item('kog-ablenkung', 'Ablenkbarkeit durch Umweltreize', 'Reaktion auf visuelle und akustische Reize im Raum.', [
    '{Kind} wandte sich bei Geräuschen aus dem Flur kurz um und arbeitete selbstständig weiter.',
    'Mit Kapselgehörschutz konnte {Kind} bei Lärm in der Klasse die Aufgabe fortsetzen.',
    'An einem reizärmeren Platz arbeitete {Kind} ruhiger und zügiger.',
    'Nach einem leisen Hinweis fand {Kind} zur Aufgabe zurück.',
    '{Kind} benötigte bei Bewegung im Raum mehrfach Unterstützung, um beim Thema zu bleiben.',
  ]),
  item('kog-anweisung', 'Befolgen mehrschrittiger Anweisungen', 'Umsetzen von Arbeitsaufträgen mit mehreren Schritten.', [
    '{Kind} setzte einen Auftrag mit drei Schritten ohne Wiederholung um.',
    'Mit einer Schritt-für-Schritt-Liste führte {Kind} den Auftrag selbstständig aus.',
    'Der Auftrag wurde in einzelne Schritte gegliedert; danach gelang {Kind} die Umsetzung.',
    '{Kind} benötigte die Wiederholung des zweiten Schrittes und führte ihn dann aus.',
  ]),
  item('kog-wechsel', 'Wechsel von Arbeitsphasen / Strukturbrüche', 'Verhalten bei Raumwechsel, Vertretung, Planänderung.', [
    '{Kind} ging mit dem angekündigten Wechsel des Arbeitsplatzes ruhig um.',
    'Bei einer unerwarteten Planänderung half ein Blick auf die Tagesstruktur, um sich neu zu orientieren.',
    'Nach Vorankündigung des Raumwechsels gelang {Kind} der Übergang ohne Unterstützung.',
    'Bei der Vertretungsstunde zog sich {Kind} kurz zurück und war danach wieder arbeitsfähig.',
    '{Kind} benötigte beim Wechsel eine Begleitung bis in den neuen Raum.',
  ]),
  item('kog-planung', 'Handlungsplanung und Arbeitsorganisation', 'Material bereitlegen, Arbeitsplatz strukturieren, Reihenfolge planen.', [
    '{Kind} legte die Arbeitsmaterialien selbstständig bereit.',
    'Mit einer Checkliste strukturierte {Kind} den Arbeitsplatz selbst.',
    'Nach einem Impuls begann {Kind} mit dem Bereitlegen der Materialien.',
    '{Kind} plante die Reihenfolge der Aufgaben mit einem Ablaufplan eigenständig.',
  ]),
  item('kog-impuls', 'Impulskontrolle und Abwarten', 'Abwarten, Unterbrechen laufender Handlungen.', [
    '{Kind} wartete bis zum Aufruf, ohne hineinzurufen.',
    'Mit dem vereinbarten Handzeichen konnte {Kind} abwarten.',
    'Nach einer kurzen Erinnerung wartete {Kind} auf den Beginn der Aufgabe.',
    '{Kind} unterbrach die laufende Handlung auf Aufforderung und wechselte zur nächsten Aufgabe.',
  ]),
  item('kog-reiz', 'Reizverarbeitung und Affektsteuerung', 'Anzeichen von Überstimulation, Nutzung von Entlastungsstrategien.', [
    '{Kind} suchte bei zunehmender Anspannung selbstständig den Reizschutz auf.',
    'Auf Aufforderung nutzte {Kind} den Rückzugsort und kehrte nach kurzer Zeit zurück.',
    'Die Anspannung zeigte sich durch Stimming; {Kind} beruhigte sich mit der vereinbarten Strategie.',
    'Bei lautem Umfeld reagierte {Kind} mit Rückzug; nach einer ruhigen Phase war die Teilnahme wieder möglich.',
    '{Kind} lehnte den Reizschutz zunächst ab und nahm ihn nach einem erneuten Angebot an.',
  ]),
]

const MOTORIK: Roh[] = [
  item('mot-grob', 'Grobmotorik und Haltungskontrolle am Sitzplatz', 'Rumpfstabilität beim Sitzen, Bewegungsdrang, Koordination.', [
    '{Kind} saß die Arbeitsphase über aufrecht und stabil.',
    'Mit Sitzkeil bzw. Bewegungskissen hielt {Kind} die Sitzhaltung länger aufrecht.',
    '{Kind} benötigte zwischendurch einen Haltungswechsel und arbeitete danach weiter.',
    'Bei Pausenspielen koordinierte {Kind} die Bewegungen sicher.',
  ]),
  item('mot-fein', 'Feinmotorik und Werkzeuggebrauch', 'Schere, Lineal, Zirkel, Hand-Hand-Koordination, Kraftdosierung.', [
    '{Kind} schnitt entlang der Linie selbstständig aus.',
    'Beim Lineal-Gebrauch half ein kurzer Hinweis zur Haltehand.',
    'Mit einer Anti-Rutsch-Unterlage gelang {Kind} der Werkzeuggebrauch sicherer.',
    '{Kind} bewältigte die feinmotorische Aufgabe in kleinen Abschnitten mit Pausen.',
  ]),
  item('mot-stift', 'Stifthaltung und Schreibdruck', 'Dreipunktgriff, Druck, Lineatur.', [
    '{Kind} hielt den Stift im Dreipunktgriff und schrieb mit gleichmäßigem Druck.',
    'Mit einer Stifthilfe gelang {Kind} die Stifthaltung über die ganze Aufgabe.',
    'Nach einem Hinweis passte {Kind} den Schreibdruck an.',
    '{Kind} hielt die Lineatur mit einer Schreibhilfe ein.',
  ]),
  item('mot-ermuedung', 'Grafomotorische Ermüdung', 'Zeit bis zur nötigen Pause beim Schreiben.', [
    'Nach fünf Minuten Schreibaktivität benötigte {Kind} eine Pause zur Handentlastung und setzte die Aufgabe danach fort.',
    '{Kind} schrieb die gesamte Aufgabe ohne Pause.',
    'Mit einer Schreibpause nach der Hälfte der Aufgabe blieb das Schriftbild gleichmäßig.',
    'Das Schreibtempo ließ im Verlauf nach; {Kind} arbeitete mit verkürztem Umfang weiter.',
  ]),
  item('mot-sensorik', 'Sensorische Integration', 'Taktil, propriozeptiv, vestibulär.', [
    '{Kind} suchte Tiefendruck, z. B. durch Anlehnen oder Drücken, und wirkte danach ruhiger.',
    'Berührung im Gedränge löste Abwehr aus; mit mehr Abstand blieb {Kind} gelassen.',
    'Mit einem Kissen auf dem Stuhl konnte {Kind} länger sitzen.',
    'Die Schaukelbewegung auf dem Pausenhof half {Kind}, sich zu regulieren.',
  ]),
]

const SPRACHE: Roh[] = [
  item('spr-verstehen', 'Sprachverständnis', 'Arbeitsaufträge, Instruktionen, Ironie, Gruppenerklärungen.', [
    '{Kind} erfasste den Arbeitsauftrag nach einmaliger Erklärung.',
    'Mit einem Bild zum Auftrag verstand {Kind} die Aufgabe.',
    'Bildhafte Sprache wurde zunächst wörtlich verstanden; nach einer kurzen Erklärung gelang die Einordnung.',
    'Die Gruppenerklärung konnte {Kind} nach einer Wiederholung in einfacher Sprache nachvollziehen.',
  ]),
  item('spr-ausdruck', 'Expressive Sprache', 'Wortschatzabruf, Satzbau, Sprachfluss.', [
    '{Kind} formulierte die Antwort in ganzen Sätzen.',
    'Mit einer Wortkarte gelang {Kind} der Wortabruf.',
    '{Kind} suchte nach Wörtern und beschrieb den Begriff mit eigenen Worten.',
    'Im Gespräch sprach {Kind} flüssig und verständlich.',
  ]),
  item('spr-pragmatik', 'Pragmatik der Kommunikation', 'Blickkontakt, Sprecherwechsel, Themenbezug, Lautstärke.', [
    '{Kind} wechselte im Gespräch die Sprecherrolle ohne Hinweis.',
    'Nach einem Hinweis passte {Kind} die Lautstärke an.',
    '{Kind} blieb beim Thema und ergänzte passende Beiträge.',
    'Mit einem Signalkärtchen gelang {Kind} das Abwarten im Gespräch.',
  ]),
  item('spr-uk', 'Nutzung Unterstützter Kommunikation (UK)', 'Talker, Piktogramme, Gebärden, PECS: Initiierung und Akzeptanz.', [
    '{Kind} nutzte den Talker von sich aus, um einen Wunsch zu äußern.',
    'Nach dem Angebot der Piktogrammkarten wählte {Kind} eine passende Karte.',
    '{Kind} setzte Gebärden gezielt ein und wurde von der Gruppe verstanden.',
    'Das Hilfsmittel wurde bereitgelegt; {Kind} griff in der Gesprächssituation selbstständig danach.',
  ]),
]

const SOZIO: Roh[] = [
  item('soz-kontakt', 'Kontaktaufnahme zu Peers / Gruppenarbeit', 'Anschluss suchen, Beteiligung an Gruppenarbeit.', [
    '{Kind} sprach ein anderes Kind von sich aus an und fragte nach einem gemeinsamen Spiel.',
    'In der Gruppenarbeit übernahm {Kind} eine feste Rolle und erfüllte sie.',
    'Mit einer klar benannten Teilaufgabe beteiligte sich {Kind} an der Gruppenarbeit.',
    'Nach der Einladung durch ein anderes Kind schloss sich {Kind} dem Spiel an.',
  ]),
  item('soz-pause', 'Mitspielverhalten in Pausen', 'Spielaufnahme, Dauer, Konfliktverlauf in der Pause.', [
    '{Kind} spielte die Pause über mit anderen Kindern.',
    'Mit einem Spielangebot der Begleitung fand {Kind} Zugang zur Gruppe.',
    '{Kind} nutzte die Pause zum Rückzug und kam anschließend gestärkt in den Unterricht.',
    'Die Pause war durch feste Spielbereiche gut strukturiert; {Kind} beteiligte sich.',
  ]),
  item('soz-frust', 'Frustrationstoleranz bei Kritik und Misserfolg', 'Reaktion auf Misserfolge, Verlieren, Korrekturen.', [
    'Auf die Korrektur reagierte {Kind} mit kurzem Innehalten und verbesserte die Aufgabe.',
    'Beim Verlieren des Spiels nutzte {Kind} die vereinbarte Beruhigungsstrategie.',
    'Nach dem Misserfolg konnte {Kind} mit Zuspruch einen neuen Versuch beginnen.',
    '{Kind} benötigte nach der Rückmeldung eine kurze Auszeit und kehrte dann zur Aufgabe zurück.',
  ]),
  item('soz-affekt', 'Affektregulation bei Überforderung', 'Anzeichen, Auslöser und Dauer bis zur Stabilisierung.', [
    '{Kind} reagierte auf den unerwarteten Raumwechsel mit lautem Rufen; durch den Rückzug in den Beruhigungsraum stabilisierte sich {Kind} nach zehn Minuten.',
    '{Kind} benannte die Überforderung und bat um eine Pause.',
    'Mit einem vereinbarten Zeichen signalisierte {Kind} den Bedarf nach Rückzug.',
    'Die Anspannung ließ nach, nachdem die Aufgabe verkleinert wurde.',
  ]),
  item('soz-emotion', 'Emotionale Regulation und Selbstwirksamkeit', 'Selbstständigkeit, Stimmung, Zutrauen in die eigene Leistung.', [
    '{Kind} sagte nach der Aufgabe: „Das habe ich geschafft.“',
    '{Kind} startete gut gelaunt in den Tag und wirkte ausgeglichen.',
    'Zu Beginn zeigte {Kind} Zurückhaltung; nach einer ersten gelungenen Aufgabe stieg die Beteiligung.',
    '{Kind} probierte die Aufgabe selbstständig, ohne zuvor nach Hilfe zu fragen.',
  ]),
  item('soz-regeln', 'Regeleinhaltung', 'Schul- und Klassenregeln, Anweisungen des Schulpersonals.', [
    '{Kind} hielt die Klassenregeln ein, ohne erinnert zu werden.',
    'Mit der Regelkarte auf dem Tisch hielt {Kind} die Absprachen ein.',
    'Nach einer Erinnerung setzte {Kind} die Regel um.',
    '{Kind} folgte der Anweisung der Lehrkraft nach einer kurzen Wiederholung.',
  ]),
]

const SELBST: Roh[] = [
  item('selbst-hygiene', 'Hygiene und Toilettengang', 'Toilettenbenutzung, Händewaschen, Hygienestandards.', [
    '{Kind} ging selbstständig zur Toilette und wusch sich die Hände.',
    'Auf Erinnerung hin ging {Kind} zur Toilette.',
    'Mit der Bildkarte zum Händewaschen führte {Kind} alle Schritte aus.',
    '{Kind} benötigte beim Verschluss der Kleidung Unterstützung.',
  ]),
  item('selbst-kleiden', 'An- und Auskleiden', 'Garderobenwechsel (z. B. Sport), Verschlüsse.', [
    '{Kind} zog sich für den Sportunterricht selbstständig um.',
    'Mit einem Hinweis zur Reihenfolge gelang {Kind} das Umziehen.',
    '{Kind} schloss Reißverschluss und Klettverschluss selbst.',
    'Schnürsenkel wurden gemeinsam gebunden; {Kind} führte den letzten Schritt selbst aus.',
  ]),
  item('selbst-essen', 'Nahrungsaufnahme / Mensa', 'Besteck, Verpflegung, Vorgaben einhalten.', [
    '{Kind} aß selbstständig mit Besteck.',
    'In der Mensa wählte {Kind} das Essen selbst aus.',
    '{Kind} hielt die vorgegebenen Essensregeln ein.',
    'Beim Tragen des Tabletts benötigte {Kind} Begleitung.',
  ]),
  item('selbst-material', 'Materialorganisation im Pult', 'Ordnung, Material finden, Mappe führen.', [
    '{Kind} fand das benötigte Material im Fach selbstständig.',
    'Mit farbigen Markierungen am Material gelang {Kind} die Ordnung.',
    'Nach einem Impuls räumte {Kind} das Pult auf.',
    '{Kind} packte die Schultasche mit Hilfe einer Checkliste.',
  ]),
  item('selbst-orientierung', 'Raum- und Zeitorientierung', 'Schulgelände, Stundenplan, Fachraumwechsel.', [
    '{Kind} fand den Weg zum Fachraum allein.',
    'Mit dem Stundenplan in Bildern orientierte sich {Kind} im Tagesablauf.',
    'Auf dem Weg zum Fachraum begleitete die Assistenz einen Teil der Strecke.',
    '{Kind} kannte die nächste Stunde und bereitete das Material vor.',
  ]),
]

function mitBereich(b: Exclude<BereichId, 'umwelt'>, roh: Roh[]): Item[] {
  return roh.map((r) => ({ ...r, bereich: b }))
}

export const KATALOG: Item[] = [
  ...mitBereich('kognition', KOGNITION),
  ...mitBereich('motorik', MOTORIK),
  ...mitBereich('sprache', SPRACHE),
  ...mitBereich('sozio', SOZIO),
  ...mitBereich('selbst', SELBST),
]

export const FOERDERFAKTOREN = [
  'Lärmschutz',
  'Visuelle Tagesstruktur',
  'Nachteilsausgleich',
  'Fester Rückzugsort',
  'Unterstützendes Peer-Umfeld',
  'Unterstützende Haltung der Lehrkraft',
]

export const BARRIEREN = [
  'Hoher Lärmpegel',
  'Reizüberflutung',
  'Unruhige Sitzordnung',
  'Unstrukturierte Pausen',
  'Bauliche Hindernisse',
  'Raum- und Sachausstattung',
]

export const LAERM_STUFEN = ['ruhig', 'eher ruhig', 'mittel', 'laut', 'sehr laut']

export const MASSNAHMEN = [
  'Aufgabe in Teilschritte gegliedert',
  'Anschauungsmaterial eingesetzt',
  'Visueller Ablaufplan / Checkliste',
  'Verbale Erinnerung',
  'Kurze Bewegungspause',
  'Rückzug / Reizschutz angeboten',
  'Kapselgehörschutz',
  'Zeitgeber (Sanduhr, Timer)',
  'Vorankündigung des Wechsels',
  'Hand-über-Hand-Führung',
]

export const ICD10: { code: string; text: string }[] = [
  { code: 'F84.0', text: 'Frühkindlicher Autismus' },
  { code: 'F84.1', text: 'Atypischer Autismus' },
  { code: 'F84.5', text: 'Asperger-Syndrom' },
  { code: 'F90.0', text: 'Einfache Aktivitäts- und Aufmerksamkeitsstörung (ADHS)' },
  { code: 'F90.1', text: 'Hyperkinetische Störung des Sozialverhaltens' },
  { code: 'F80', text: 'Umschriebene Entwicklungsstörungen des Sprechens und der Sprache' },
  { code: 'F81', text: 'Umschriebene Entwicklungsstörungen schulischer Fertigkeiten' },
  { code: 'F82', text: 'Umschriebene Entwicklungsstörung der motorischen Funktionen' },
  { code: 'F91', text: 'Störungen des Sozialverhaltens' },
  { code: 'F93', text: 'Emotionale Störungen des Kindesalters' },
  { code: 'F95', text: 'Ticstörungen' },
  { code: 'G80', text: 'Infantile Zerebralparese' },
]

export const SCHULARTEN = ['Grundschule', 'Förderschule', 'Gemeinschaftsschule', 'Hauptschule', 'Realschule', 'Gymnasium', 'Berufsschule', 'Sonstige']

export const NETZWERK_FELDER: { key: 'schule' | 'ergotherapie' | 'logopaedie' | 'kjp' | 'spz'; label: string }[] = [
  { key: 'schule', label: 'Schule (Ansprechperson)' },
  { key: 'ergotherapie', label: 'Ergotherapie' },
  { key: 'logopaedie', label: 'Logopädie' },
  { key: 'kjp', label: 'Kinder- und Jugendpsychiatrie (KJP)' },
  { key: 'spz', label: 'Sozialpädiatrisches Zentrum (SPZ)' },
]

export const KIND_FARBEN = ['#1E4E8C', '#0E7C66', '#9A3B8C', '#B5541C', '#5B5BD6', '#8A6D00', '#C2410C', '#0F766E']

/** Etikett-Wörter für den sanften Formulierungs-Hinweis (Teilwort-Treffer, Groß-/Kleinschreibung egal). */
export const ETIKETTEN: { muster: RegExp; wort: string; alternative: string }[] = [
  { muster: /aggressiv/i, wort: 'aggressiv', alternative: 'Stattdessen konkret beschreiben, z. B.: „Das Kind reagierte auf den unerwarteten Raumwechsel mit lautem Rufen. Durch den Rückzug in den Beruhigungsraum konnte es sich nach zehn Minuten stabilisieren.“' },
  { muster: /verweiger/i, wort: 'verweigert', alternative: 'Stattdessen vom Gelungenen her, z. B.: „Das Kind benötigt nach fünf Minuten grafomotorischer Aktivität eine Pause zur Handentlastung, um die Aufgabe fortzuführen.“' },
  { muster: /\bfaul/i, wort: 'faul', alternative: 'Beschreiben, was beobachtet wurde und was beim Beginnen der Aufgabe geholfen hat.' },
  { muster: /\bfrech/i, wort: 'frech', alternative: 'Beschreiben, was gesagt oder getan wurde, ohne es zu bewerten.' },
  { muster: /unmotiviert|bockig|trotzig/i, wort: 'unmotiviert/bockig', alternative: 'Beschreiben, was das Kind getan hat und unter welchen Bedingungen die Mitarbeit gelang.' },
  { muster: /\bbös(e|artig)|\bdumm|\bunfähig|\bfaulenzt|\blügt/i, wort: 'wertende Wörter', alternative: 'Keine Vermutungen oder moralischen Wertungen dokumentieren – konkret beschreiben, was zu sehen und zu hören war.' },
]

export const FORMULIERUNGS_ERINNERUNG =
  'Keine Namen von Mitschüler:innen oder Lehrkräften, keine Noten und keine Bewertung von Unterricht. Sachlich, wertschätzend, vom Gelungenen her.'

export function findeEtikett(text: string) {
  return ETIKETTEN.find((e) => e.muster.test(text))
}

export function katalogItem(id: string, eigene: Item[] = []): Item | undefined {
  return KATALOG.find((i) => i.id === id) ?? eigene.find((i) => i.id === id)
}

/** Ersetzt den Platzhalter {Kind} durch das Kürzel. */
export function baustein(text: string, kind: string): string {
  return text.replace(/\{Kind\}/g, kind)
}

export const ALLGEMEINE_BAUSTEINE = [
  '{Kind} nahm am Unterricht teil und arbeitete mit der vereinbarten Unterstützung mit.',
  '{Kind} kam ruhig in den Schultag und fand den Einstieg in die erste Aufgabe.',
  'Nach einer kurzen Pause setzte {Kind} die Arbeit fort.',
  '{Kind} nutzte die vereinbarten Hilfen selbstständig.',
  'Der Tag verlief nach der gewohnten Struktur; Veränderungen wurden angekündigt.',
]
