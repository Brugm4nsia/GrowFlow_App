import { Box, Button, Collapse, Flex, HStack, IconButton, Input, Stack, Text, useToast, VStack } from '@chakra-ui/react'
import Dexie from 'dexie'
import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'
import { KindAvatar } from '../components/KindAvatar'
import { IcHaken, IcPfeilL, IcPfeilR } from '../components/icons'
import { ItemZeile } from '../components/erfassung/ItemZeile'
import type { ErfassungsKontext } from '../components/erfassung/kontext'
import { TagTab } from '../components/erfassung/TagTab'
import { UmweltTab } from '../components/erfassung/UmweltTab'
import { BackupHinweis } from '../components/BackupHinweis'
import { Seite } from '../components/Seite'
import { aendereEintrag, db, ladeEinstellungen, speichereEinstellungen } from '../domain/db'
import { anzeigeDatum, heuteISO, istISO, langesDatum, tagVersetzen } from '../domain/datum'
import { bestaetigeAlle, fortschritt, hatUebernommene, uebernimmLetzten } from '../domain/erfassung'
import { useAlleItems, useKinder } from '../domain/hooks'
import { SKALA_BEREICHE, STUFEN, STUFEN_FARBE } from '../domain/katalog'
import { mitStatus, useSaveState } from '../domain/speicherStatus'
import type { Eintrag, Kind } from '../domain/types'

type TabId = (typeof SKALA_BEREICHE)[number]['id'] | 'umwelt' | 'tag'

function Skala() {
  const [offen, setOffen] = useState(false)
  return (
    <Box>
      <Button variant="link" size="sm" onClick={() => setOffen(!offen)} aria-expanded={offen} minH="44px">
        {offen ? 'Skala ausblenden' : 'Skala 0–4 anzeigen'}
      </Button>
      <Collapse in={offen} animateOpacity>
        <VStack align="stretch" spacing={1} mt={2} bg="bg.card" borderWidth="1px" borderColor="line" borderRadius="lg" p={3}>
          <Text fontSize="sm" color="text.mute">Niedriger = mehr Selbstständigkeit. Ohne Beobachtung bitte nichts antippen.</Text>
          {STUFEN.map((s) => (
            <HStack key={s.stufe} align="start">
              <Box w="26px" h="26px" borderRadius="md" bg={STUFEN_FARBE[s.stufe].bg} color={STUFEN_FARBE[s.stufe].fg} fontWeight={700} textAlign="center" lineHeight="26px" flexShrink={0}>{s.stufe}</Box>
              <Text fontSize="sm"><b>{s.titel}.</b> {s.text}</Text>
            </HStack>
          ))}
        </VStack>
      </Collapse>
    </Box>
  )
}

export function Heute() {
  const [params] = useSearchParams()
  const toast = useToast()
  const kinder = useKinder()
  const alleItems = useAlleItems()
  const einstellungen = useLiveQuery(() => ladeEinstellungen(), [])
  const speicher = useSaveState()

  const [datum, setDatum] = useState(() => (istISO(params.get('datum') ?? undefined) ? params.get('datum')! : heuteISO()))
  const [auswahl, setAuswahl] = useState<number[] | null>(() => (params.get('kind') ? [Number(params.get('kind'))] : null))
  const [tab, setTab] = useState<TabId | null>(null)

  const gewaehlt: Kind[] = useMemo(() => {
    if (!kinder?.length || !einstellungen) return []
    const ids = auswahl ?? einstellungen.letzteKinder
    const treffer = kinder.filter((k) => ids.includes(k.id!))
    return treffer.length ? treffer : [kinder[0]]
  }, [kinder, einstellungen, auswahl])

  const idKey = gewaehlt.map((k) => k.id).join(',')
  const eintraegeListe = useLiveQuery(
    () => (gewaehlt.length ? db.eintraege.where('[kindId+datum]').anyOf(gewaehlt.map((k) => [k.id!, datum])).toArray() : Promise.resolve([] as Eintrag[])),
    [idKey, datum],
  )
  const eintraege = useMemo(() => new Map((eintraegeListe ?? []).map((e) => [e.kindId, e])), [eintraegeListe])

  const aendere = useCallback<ErfassungsKontext['aendere']>(
    (fn, nur) => {
      const ziel = nur ?? gewaehlt
      if (!ziel.length) return
      void mitStatus(() => Promise.all(ziel.map((k) => aendereEintrag(k.id!, datum, (e) => fn(e, k)))))
    },
    [gewaehlt, datum],
  )

  // Auswahl merken (nur nach bewusster Änderung).
  const waehle = (ids: number[]) => {
    if (!ids.length) return
    setAuswahl(ids)
    void speichereEinstellungen({ letzteKinder: ids })
  }
  const toggleKind = (id: number) => waehle(gewaehlt.some((k) => k.id === id) ? gewaehlt.filter((k) => k.id !== id).map((k) => k.id!) : [...gewaehlt.map((k) => k.id!), id])

  // Sichtbare Items je Bereich (Vereinigungsmenge der gewählten Kinder).
  const itemsDerAuswahl = useMemo(() => alleItems.filter((i) => gewaehlt.some((k) => k.aktiveItems.includes(i.id))), [alleItems, gewaehlt])
  const bereicheMitItems = SKALA_BEREICHE.filter((b) => itemsDerAuswahl.some((i) => i.bereich === b.id))
  const tabs: { id: TabId; label: string }[] = [
    ...bereicheMitItems.map((b) => ({ id: b.id as TabId, label: b.kurz })),
    { id: 'umwelt', label: 'Umwelt' },
    { id: 'tag', label: 'Tag' },
  ]
  const aktiv: TabId = tab && tabs.some((t) => t.id === tab) ? tab : tabs[0].id

  useEffect(() => { window.scrollTo({ top: 0 }) }, [aktiv])

  if (kinder === undefined || einstellungen === undefined) return <Seite titel="Heute">{null}</Seite>
  if (kinder.length === 0) {
    return (
      <Seite titel="Heute">
        <Box bg="bg.card" borderWidth="1px" borderColor="line" borderRadius="xl" p={5}>
          <Text fontWeight={700} fontSize="lg">Willkommen</Text>
          <Text color="text.mute" mt={1}>Lege zuerst ein Kind an und wähle die Beobachtungspunkte aus. Danach erfasst du hier in wenigen Tipps den Tag.</Text>
          <Button as={RouterLink} to="/kinder/neu" mt={4} size="lg">Erstes Kind anlegen</Button>
        </Box>
      </Seite>
    )
  }

  const ctx: ErfassungsKontext = { datum, kinder: gewaehlt, eintraege, aendere, einzeln: gewaehlt.length === 1, einst: einstellungen }
  const istHeute = datum === heuteISO()
  const eigeneMassnahmen = einstellungen.eigeneMassnahmen
  const uebernommenVorhanden = gewaehlt.some((k) => hatUebernommene(eintraege.get(k.id!)))

  const wieZuletzt = async () => {
    let gesamt = 0
    let ohneVorgaenger = 0
    await mitStatus(async () => {
      for (const k of gewaehlt) {
        const letzter = await db.eintraege.where('[kindId+datum]').between([k.id!, Dexie.minKey], [k.id!, datum], true, false).last()
        if (!letzter) { ohneVorgaenger++; continue }
        await aendereEintrag(k.id!, datum, (e) => { gesamt += uebernimmLetzten(e, letzter, k.aktiveItems) })
      }
    })
    toast({
      title: gesamt ? `${gesamt} Werte übernommen` : 'Nichts zu übernehmen',
      description: gesamt ? 'Gestrichelt markiert – bitte antippen, um zu bestätigen, oder ändern.' : ohneVorgaenger === gewaehlt.length ? 'Es gibt noch keinen früheren Eintrag.' : 'Alles ist bereits erfasst.',
      status: gesamt ? 'success' : 'info', duration: 4500, isClosable: true,
    })
  }
  const alleBestaetigen = () => aendere((e) => bestaetigeAlle(e))

  const prog = gewaehlt.map((k) => ({ k, p: fortschritt(eintraege.get(k.id!), k.aktiveItems) }))
  const statusText = gewaehlt.length === 1
    ? `${prog[0].p.erfasst} von ${prog[0].p.gesamt} erfasst${prog[0].p.uebernommen ? ` · ${prog[0].p.uebernommen} übernommen` : ''}`
    : prog.map(({ k, p }) => `${k.name} ${p.erfasst}/${p.gesamt}`).join(' · ')

  const itemsImTab = itemsDerAuswahl.filter((i) => i.bereich === aktiv)
  const tabZaehler = (id: TabId) => {
    const its = itemsDerAuswahl.filter((i) => i.bereich === id)
    let ok = 0, ges = 0
    for (const k of gewaehlt) for (const i of its) if (k.aktiveItems.includes(i.id)) { ges++; if (eintraege.get(k.id!)?.werte[i.id]?.stufe !== undefined) ok++ }
    return ges ? `${ok}/${ges}` : ''
  }

  return (
    <Seite titel="Heute erfassen" pb="90px">
      <Stack spacing={3}>
        <BackupHinweis />
        {(einstellungen.demoKinder?.length ?? 0) > 0 ? <Text fontSize="sm" fontWeight={600} bg="bg.soft" borderRadius="md" px={3} py={2}>Demo-Modus: Beispieldaten mit fiktiven Kindern (Mehr → Demo-Daten entfernen).</Text> : null}
        <Flex align="center" gap={1}>
          <IconButton aria-label="Vorheriger Tag" icon={<IcPfeilL boxSize={6} />} variant="outline" h="52px" w="52px" onClick={() => setDatum(tagVersetzen(datum, -1))} />
          <Box position="relative" flex="1" textAlign="center">
            <Box bg="bg.card" borderWidth="1px" borderColor="line" borderRadius="lg" h="52px" display="flex" flexDirection="column" justifyContent="center">
              <Text fontWeight={700} lineHeight={1.2}>{langesDatum(datum)}</Text>
              <Text fontSize="xs" color="text.mute">{istHeute ? 'Heute' : 'Nachtrag'} · Datum antippen zum Wählen</Text>
            </Box>
            <Input type="date" value={datum} aria-label="Datum wählen" onChange={(e) => istISO(e.target.value) && setDatum(e.target.value)} position="absolute" inset={0} opacity={0} h="52px" w="full" cursor="pointer" />
          </Box>
          <IconButton aria-label="Nächster Tag" icon={<IcPfeilR boxSize={6} />} variant="outline" h="52px" w="52px" onClick={() => setDatum(tagVersetzen(datum, 1))} />
        </Flex>
        {!istHeute ? (
          <Button variant="link" size="sm" alignSelf="center" onClick={() => setDatum(heuteISO())} minH="44px">Zu heute springen ({anzeigeDatum(heuteISO())})</Button>
        ) : null}

        <Box role="group" aria-label="Kinder auswählen">
          <Flex gap={2} wrap="wrap" align="center">
            {kinder.map((k) => {
              const an = gewaehlt.some((g) => g.id === k.id)
              return (
                <Button key={k.id} onClick={() => toggleKind(k.id!)} aria-pressed={an} variant={an ? 'solid' : 'outline'} h="48px" pl={2} pr={4} leftIcon={<KindAvatar kind={k} size={30} />} borderRadius="full">
                  {k.name}
                </Button>
              )
            })}
            {kinder.length > 1 && gewaehlt.length < kinder.length ? (
              <Button variant="ghost" size="sm" onClick={() => waehle(kinder.map((k) => k.id!))} minH="44px">Alle</Button>
            ) : null}
          </Flex>
          {gewaehlt.length > 1 ? (
            <Text fontSize="sm" color="text.mute" mt={1}>Mehrere Kinder gewählt: Ein Tipp gilt für alle, die den Punkt aktiv haben. Gespeichert wird je Kind separat.</Text>
          ) : null}
        </Box>

        <HStack spacing={2}>
          <Button variant="outline" onClick={wieZuletzt} minH="48px">Wie zuletzt</Button>
          {uebernommenVorhanden ? <Button variant="outline" leftIcon={<IcHaken />} onClick={alleBestaetigen} minH="48px">Alle bestätigen</Button> : null}
          <Skala />
        </HStack>

        <Box overflowX="auto" mx={-4} px={4} sx={{ scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
          <HStack spacing={2} role="tablist" aria-label="Fachbereiche" w="max-content">
            {tabs.map((t) => (
              <Button key={t.id} role="tab" aria-selected={aktiv === t.id} onClick={() => setTab(t.id)} variant={aktiv === t.id ? 'solid' : 'outline'} h="48px" borderRadius="full" px={4}>
                {t.label}{tabZaehler(t.id) ? <Text as="span" ml={2} fontSize="xs" opacity={0.85}>{tabZaehler(t.id)}</Text> : null}
              </Button>
            ))}
          </HStack>
        </Box>

        <Box role="tabpanel">
          {aktiv === 'umwelt' ? <UmweltTab ctx={ctx} /> : aktiv === 'tag' ? <TagTab ctx={ctx} /> : (
            <Stack spacing={3}>
              {itemsImTab.map((i) => <ItemZeile key={i.id} item={i} ctx={ctx} alleMassnahmen={eigeneMassnahmen} />)}
            </Stack>
          )}
        </Box>
      </Stack>

      <Flex
        position="fixed" left={0} right={0} bottom="calc(60px + env(safe-area-inset-bottom))" zIndex={15}
        bg="bg.soft" borderTopWidth="1px" borderColor="line" justify="center"
      >
        <Flex w="full" maxW="760px" px={4} minH="40px" align="center" gap={2} role="status" aria-live="polite">
          <IcHaken color={speicher.phase === 'fehler' ? 'red.500' : 'green.600'} />
          <Text fontSize="sm" fontWeight={600} noOfLines={1}>
            {speicher.phase === 'fehler' ? 'Speichern fehlgeschlagen' : speicher.phase === 'speichert' ? 'speichert …' : 'gespeichert'} · {statusText}
          </Text>
        </Flex>
      </Flex>
    </Seite>
  )
}
