import {
  Alert, AlertDescription, AlertIcon, Box, Button, Flex, FormControl, FormLabel, HStack, Input, Select, SimpleGrid, Spinner, Stack, Switch, Text, Textarea, Wrap,
} from '@chakra-ui/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { KindAvatar } from '../components/KindAvatar'
import { Karte, Seite } from '../components/Seite'
import { baueBerichtDaten, PROFILE, profilVon, TREND_TEXT } from '../domain/auswertung'
import { db, speichereEinstellungen } from '../domain/db'
import { anzeigeDatum, heuteISO, istISO, schnellwahl, type Schnellwahl } from '../domain/datum'
import { useAlleItems, useEinstellungen, useKinder } from '../domain/hooks'
import { BEREICHE } from '../domain/katalog'
import { dateiname, erzeugePdf, kannTeilen, lade, teile, zipDateien, type PdfDatei } from '../pdf/export'
import type { BereichId, Eintrag } from '../domain/types'

const SCHNELL: { id: Schnellwahl; label: string }[] = [
  { id: 'woche', label: 'Diese Woche' },
  { id: 'monat', label: 'Dieser Monat' },
  { id: '4wochen', label: 'Letzte 4 Wochen' },
  { id: 'halbjahr', label: 'Halbjahr' },
]

interface Ergebnis extends PdfDatei {
  kindId: number
  url: string
}

export function Bericht() {
  const kinder = useKinder()
  const items = useAlleItems()
  const einst = useEinstellungen()
  const [auswahl, setAuswahl] = useState<number[] | null>(null)
  const [zeitraum, setZeitraum] = useState(() => schnellwahl('monat'))
  const [profilId, setProfilId] = useState('voll')
  const [bereiche, setBereiche] = useState<BereichId[]>(PROFILE[0].bereiche)
  const [diagnose, setDiagnose] = useState(false)
  const [aktenzeichen, setAktenzeichen] = useState(false)
  const [tagestexte, setTagestexte] = useState(true)
  const [fazitEdit, setFazitEdit] = useState<Record<string, string>>({})
  const [laeuft, setLaeuft] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)
  const [ergebnisse, setErgebnisse] = useState<Ergebnis[]>([])
  const urls = useRef<string[]>([])

  const gewaehlt = useMemo(() => {
    if (!kinder) return []
    const ids = auswahl ?? einst.letzteKinder
    const t = kinder.filter((k) => ids.includes(k.id!))
    return t.length ? t : kinder.slice(0, 1)
  }, [kinder, auswahl, einst.letzteKinder])

  const gueltig = istISO(zeitraum.von) && istISO(zeitraum.bis) && zeitraum.von <= zeitraum.bis
  const alleEintraege = useLiveQuery(
    () => (gewaehlt.length && gueltig ? db.eintraege.where('kindId').anyOf(gewaehlt.map((k) => k.id!)).filter((e) => e.datum >= zeitraum.von && e.datum <= zeitraum.bis).toArray() : Promise.resolve([] as Eintrag[])),
    [gewaehlt.map((k) => k.id).join(','), zeitraum.von, zeitraum.bis, gueltig],
  )

  const schluessel = (kindId: number) => `${kindId}|${zeitraum.von}|${zeitraum.bis}|${profilId}|${bereiche.join()}`
  const daten = useMemo(
    () =>
      gewaehlt.map((k) => {
        const optionen = { profilId, bereiche, diagnose, aktenzeichen, tagestexte }
        const basis = {
          kind: k, eintraege: (alleEintraege ?? []).filter((e) => e.kindId === k.id), von: zeitraum.von, bis: zeitraum.bis, optionen, items,
          ersteller: { name: einst.erstellerName, funktion: einst.funktion, traeger: einst.traeger }, heute: heuteISO(),
        }
        const edit = fazitEdit[schluessel(k.id!)]
        return baueBerichtDaten({ ...basis, fazit: edit })
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gewaehlt, alleEintraege, zeitraum, profilId, bereiche, diagnose, aktenzeichen, tagestexte, items, einst.erstellerName, einst.funktion, einst.traeger, fazitEdit],
  )

  // Ergebnisse veralten, sobald sich Einstellungen ändern.
  useEffect(() => {
    urls.current.forEach((u) => URL.revokeObjectURL(u))
    urls.current = []
    setErgebnisse([])
  }, [gewaehlt, zeitraum, profilId, bereiche, diagnose, aktenzeichen, tagestexte, fazitEdit, alleEintraege])
  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), [])

  if (!kinder) return <Seite titel="Bericht">{null}</Seite>
  if (kinder.length === 0) return <Seite titel="Bericht"><Text color="text.mute">Lege zuerst ein Kind an und erfasse Beobachtungen.</Text><Button as={RouterLink} to="/kinder/neu" mt={3}>Kind anlegen</Button></Seite>

  const waehleProfil = (id: string) => {
    setProfilId(id)
    const p = profilVon(id)
    setBereiche(p.bereiche)
    setTagestexte(p.tagestexte)
  }
  const toggleKind = (id: number) => {
    const ids = gewaehlt.some((k) => k.id === id) ? gewaehlt.filter((k) => k.id !== id).map((k) => k.id!) : [...gewaehlt.map((k) => k.id!), id]
    if (!ids.length) return
    setAuswahl(ids)
    void speichereEinstellungen({ letzteKinder: ids })
  }
  const toggleBereich = (id: BereichId) => setBereiche(bereiche.includes(id) ? bereiche.filter((b) => b !== id) : [...bereiche, id])

  const erstellen = async () => {
    setLaeuft(true)
    setFehler(null)
    try {
      const neu: Ergebnis[] = []
      for (let i = 0; i < daten.length; i++) {
        const d = daten[i]
        const k = gewaehlt[i]
        const blob = await erzeugePdf(d)
        const name = dateiname(d.kind.name, d.zeitraum.von, d.zeitraum.bis)
        const url = URL.createObjectURL(blob)
        urls.current.push(url)
        neu.push({ kindId: k.id!, name, blob, url })
      }
      setErgebnisse(neu)
    } catch (e) {
      console.error(e)
      setFehler(e instanceof Error ? e.message : String(e))
    } finally {
      setLaeuft(false)
    }
  }

  const zipLaden = async () => {
    const zip = await zipDateien(ergebnisse)
    lade(zip, `Verlaufsberichte_${zeitraum.von}_${zeitraum.bis}.zip`)
  }

  return (
    <Seite titel="Bericht">
      <Stack spacing={4}>
        <Karte>
          <Text fontWeight={700} mb={2}>1 · Kinder</Text>
          <Wrap spacing={2}>
            {kinder.map((k) => {
              const an = gewaehlt.some((g) => g.id === k.id)
              return (
                <Button key={k.id} onClick={() => toggleKind(k.id!)} aria-pressed={an} variant={an ? 'solid' : 'outline'} h="48px" pl={2} pr={4} leftIcon={<KindAvatar kind={k} size={30} />} borderRadius="full">{k.name}</Button>
              )
            })}
          </Wrap>
          {gewaehlt.length > 1 ? <Text fontSize="sm" color="text.mute" mt={2}>Pro Kind entsteht eine eigene PDF-Datei; mehrere Dateien gibt es zusätzlich als ZIP.</Text> : null}
        </Karte>

        <Karte>
          <Text fontWeight={700} mb={2}>2 · Zeitraum</Text>
          <Wrap spacing={2} mb={3}>
            {SCHNELL.map((s) => (
              <Button key={s.id} variant="outline" size="md" minH="44px" onClick={() => setZeitraum(schnellwahl(s.id))}>{s.label}</Button>
            ))}
          </Wrap>
          <SimpleGrid columns={2} spacing={3}>
            <FormControl><FormLabel>Von</FormLabel><Input type="date" value={zeitraum.von} onChange={(e) => setZeitraum({ ...zeitraum, von: e.target.value })} /></FormControl>
            <FormControl><FormLabel>Bis</FormLabel><Input type="date" value={zeitraum.bis} onChange={(e) => setZeitraum({ ...zeitraum, bis: e.target.value })} /></FormControl>
          </SimpleGrid>
          {!gueltig ? <Alert status="warning" mt={3} borderRadius="md"><AlertIcon /><AlertDescription>Bitte einen gültigen Zeitraum wählen (Von nicht nach Bis).</AlertDescription></Alert> : null}
        </Karte>

        <Karte>
          <Text fontWeight={700} mb={2}>3 · Empfänger und Umfang</Text>
          <FormControl>
            <FormLabel>Empfänger-Profil</FormLabel>
            <Select value={profilId} onChange={(e) => waehleProfil(e.target.value)}>{PROFILE.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</Select>
          </FormControl>
          <Text fontWeight={600} mt={3} mb={1}>Enthaltene Fachbereiche</Text>
          <Wrap spacing={2}>
            {BEREICHE.map((b) => (
              <Button key={b.id} variant={bereiche.includes(b.id) ? 'solid' : 'outline'} aria-pressed={bereiche.includes(b.id)} minH="44px" size="md" onClick={() => toggleBereich(b.id)}>{b.kurz}</Button>
            ))}
          </Wrap>
          <Stack mt={3} spacing={1}>
            <Schalter id="tagestexte" label="Tagesnotizen und Tages-Maßnahmen einbeziehen" an={tagestexte} onChange={setTagestexte} />
            <Schalter id="diag" label="Diagnosen angeben" hilfe="Gesundheitsdaten – nur wenn der Empfänger sie braucht." an={diagnose} onChange={setDiagnose} />
            <Schalter id="az" label="Aktenzeichen angeben" an={aktenzeichen} onChange={setAktenzeichen} />
          </Stack>
        </Karte>

        <Text as="h2" fontWeight={700} fontSize="lg">4 · Vorschau und Fazit</Text>
        {daten.map((d, idx) => {
          const k = gewaehlt[idx]
          const key = schluessel(k.id!)
          return (
            <Karte key={k.id} data-testid={`vorschau-${k.name}`}>
              <HStack mb={2}><KindAvatar kind={k} /><Text fontWeight={700}>{k.name}</Text></HStack>
              <Text fontSize="sm" color="text.mute" mb={2}>
                {anzeigeDatum(d.zeitraum.von)} – {anzeigeDatum(d.zeitraum.bis)} · {d.tageDokumentiert} von {d.werktage} Werktagen dokumentiert · Dateiname: {dateiname(k.name, d.zeitraum.von, d.zeitraum.bis)}
              </Text>
              {d.tageDokumentiert === 0 ? (
                <Alert status="info" borderRadius="md" mb={2}><AlertIcon /><AlertDescription>Im Zeitraum gibt es keine dokumentierten Einträge. Das PDF enthält dann nur einen Hinweis.</AlertDescription></Alert>
              ) : (
                <Box mb={3}>
                  <Stack spacing={0}>
                    {d.bereiche.flatMap((b) => b.items.map((i) => (
                      <Box key={i.itemId} py={2} borderBottomWidth="1px" borderColor="line">
                        <Text fontWeight={600} lineHeight={1.3}>{i.label}</Text>
                        <Text fontSize="sm" color="text.mute">
                          n = {i.n} · Ø {i.mittel === null ? '–' : i.mittel.toFixed(1).replace('.', ',')} · {TREND_TEXT[i.trend.art]}
                        </Text>
                      </Box>
                    )))}
                  </Stack>
                  <Text fontSize="xs" color="text.mute" mt={2}>Niedrigere Stufe = mehr Selbstständigkeit. Es zählen nur beobachtete Tage. Das PDF enthält zusätzlich Verteilung, Wochenverlauf, Umwelt und Notizen.</Text>
                </Box>
              )}
              <FormControl>
                <FormLabel>Fazit (bearbeitbar)</FormLabel>
                <Textarea rows={8} value={d.fazit} onChange={(e) => setFazitEdit({ ...fazitEdit, [key]: e.target.value })} />
                <Button mt={2} size="sm" variant="ghost" onClick={() => { const n = { ...fazitEdit }; delete n[key]; setFazitEdit(n) }} isDisabled={fazitEdit[key] === undefined}>Vorschlag neu erzeugen</Button>
                <Text fontSize="xs" color="text.mute">Der Vorschlag ist regelbasiert aus den Zahlen erzeugt (keine KI) – bitte prüfen und anpassen.</Text>
              </FormControl>
            </Karte>
          )
        })}

        <Karte>
          <Button size="lg" w="full" onClick={erstellen} isDisabled={!gueltig || laeuft} leftIcon={laeuft ? <Spinner size="sm" /> : undefined}>
            {laeuft ? 'PDF wird erstellt …' : gewaehlt.length > 1 ? `${gewaehlt.length} PDF-Dateien erstellen` : 'PDF erstellen'}
          </Button>
          {fehler ? <Alert status="error" mt={3} borderRadius="md"><AlertIcon /><AlertDescription>PDF konnte nicht erstellt werden: {fehler}</AlertDescription></Alert> : null}
          {ergebnisse.length > 0 ? (
            <Stack mt={4} spacing={3} data-testid="ergebnisse">
              {ergebnisse.map((r) => (
                <Box key={r.url} borderWidth="1px" borderColor="line" borderRadius="lg" p={3}>
                  <Text fontWeight={600} fontSize="sm" wordBreak="break-all">{r.name}</Text>
                  <Text fontSize="xs" color="text.mute" mb={2}>{Math.max(1, Math.round(r.blob.size / 1024))} KB</Text>
                  <Flex gap={2} wrap="wrap">
                    <Button onClick={() => lade(r.blob, r.name)}>Herunterladen</Button>
                    <Button as="a" href={r.url} target="_blank" rel="noopener" variant="outline">Ansehen</Button>
                    {kannTeilen(r.blob, r.name) ? <Button variant="outline" onClick={() => teile(r.blob, r.name)}>Teilen</Button> : null}
                  </Flex>
                </Box>
              ))}
              {ergebnisse.length > 1 ? <Button variant="outline" onClick={zipLaden}>Alle als ZIP herunterladen</Button> : null}
              <Text fontSize="xs" color="text.mute">Die PDF enthält Sozialdaten. Bitte nur über freigegebene Wege weitergeben.</Text>
            </Stack>
          ) : null}
        </Karte>
      </Stack>
    </Seite>
  )
}

function Schalter({ id, label, hilfe, an, onChange }: { id: string; label: string; hilfe?: string; an: boolean; onChange: (b: boolean) => void }) {
  return (
    <FormControl display="flex" alignItems="center" minH="48px">
      <Switch id={id} size="lg" isChecked={an} onChange={(e) => onChange(e.target.checked)} mr={3} />
      <Box>
        <FormLabel htmlFor={id} mb={0}>{label}</FormLabel>
        {hilfe ? <Text fontSize="xs" color="text.mute">{hilfe}</Text> : null}
      </Box>
    </FormControl>
  )
}
