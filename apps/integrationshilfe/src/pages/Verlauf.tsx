import { Badge, Box, Button, ButtonGroup, Flex, HStack, IconButton, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { addMonths, endOfMonth, format, getDay, parseISO, startOfMonth } from 'date-fns'
import { de } from 'date-fns/locale'
import { useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { KindAvatar } from '../components/KindAvatar'
import { IcPfeilL, IcPfeilR } from '../components/icons'
import { Seite } from '../components/Seite'
import { eintraegeImZeitraum } from '../domain/db'
import { alleTage, heuteISO, ISO, istWochenende, kurzDatum, wochentagKurz } from '../domain/datum'
import { fortschritt } from '../domain/erfassung'
import { useKinder } from '../domain/hooks'
import type { Eintrag } from '../domain/types'

export function Verlauf() {
  const kinder = useKinder()
  const [kindId, setKindId] = useState<number | null>(null)
  const [monat, setMonat] = useState(() => format(startOfMonth(new Date()), ISO))
  const [ansicht, setAnsicht] = useState<'kalender' | 'liste'>('kalender')
  const kind = kinder?.find((k) => k.id === kindId) ?? kinder?.[0]

  const von = monat
  const bis = format(endOfMonth(parseISO(monat)), ISO)
  const eintraege = useLiveQuery(() => (kind ? eintraegeImZeitraum(kind.id!, von, bis) : Promise.resolve([] as Eintrag[])), [kind?.id, von, bis])
  const nachDatum = useMemo(() => new Map((eintraege ?? []).map((e) => [e.datum, e])), [eintraege])
  const tage = useMemo(() => alleTage(von, bis), [von, bis])
  const heute = heuteISO()

  if (!kinder) return <Seite titel="Verlauf">{null}</Seite>
  if (!kind) return <Seite titel="Verlauf"><Text color="text.mute">Noch kein Kind angelegt.</Text></Seite>

  const werktage = tage.filter((t) => !istWochenende(t) && t <= heute)
  const dokumentiert = werktage.filter((t) => nachDatum.has(t)).length
  const link = (t: string) => `/?datum=${t}&kind=${kind.id}`
  const status = (t: string) => {
    const e = nachDatum.get(t)
    if (!e) return null
    return fortschritt(e, kind.aktiveItems)
  }
  const monatsName = format(parseISO(monat), 'LLLL yyyy', { locale: de })
  // Montag = Spalte 0
  const versatz = (getDay(parseISO(von)) + 6) % 7

  return (
    <Seite titel="Verlauf">
      <Stack spacing={3}>
        <Flex gap={2} wrap="wrap" role="group" aria-label="Kind wählen">
          {kinder.map((k) => (
            <Button key={k.id} onClick={() => setKindId(k.id!)} aria-pressed={kind.id === k.id} variant={kind.id === k.id ? 'solid' : 'outline'} h="48px" pl={2} pr={4} leftIcon={<KindAvatar kind={k} size={30} />} borderRadius="full">
              {k.name}
            </Button>
          ))}
        </Flex>

        <Flex align="center" gap={1}>
          <IconButton aria-label="Vorheriger Monat" icon={<IcPfeilL boxSize={6} />} variant="outline" h="48px" w="48px" onClick={() => setMonat(format(addMonths(parseISO(monat), -1), ISO))} />
          <Text flex="1" textAlign="center" fontWeight={700} textTransform="capitalize">{monatsName}</Text>
          <IconButton aria-label="Nächster Monat" icon={<IcPfeilR boxSize={6} />} variant="outline" h="48px" w="48px" onClick={() => setMonat(format(addMonths(parseISO(monat), 1), ISO))} />
        </Flex>

        <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
          <Text fontSize="sm" color="text.mute">{dokumentiert} von {werktage.length} Werktagen dokumentiert</Text>
          <ButtonGroup isAttached size="sm" variant="outline">
            <Button aria-pressed={ansicht === 'kalender'} variant={ansicht === 'kalender' ? 'solid' : 'outline'} onClick={() => setAnsicht('kalender')} minH="40px">Kalender</Button>
            <Button aria-pressed={ansicht === 'liste'} variant={ansicht === 'liste' ? 'solid' : 'outline'} onClick={() => setAnsicht('liste')} minH="40px">Liste</Button>
          </ButtonGroup>
        </Flex>

        {ansicht === 'kalender' ? (
          <Box>
            <SimpleGrid columns={7} spacing={1} mb={1}>
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((t) => <Text key={t} textAlign="center" fontSize="xs" color="text.mute" fontWeight={600}>{t}</Text>)}
            </SimpleGrid>
            <SimpleGrid columns={7} spacing={1}>
              {Array.from({ length: versatz }).map((_, i) => <Box key={`v${i}`} />)}
              {tage.map((t) => {
                const s = status(t)
                const luecke = !s && !istWochenende(t) && t <= heute
                const tag = Number(t.slice(8))
                return (
                  <Box
                    key={t} as={RouterLink} to={link(t)}
                    aria-label={`${kurzDatum(t)}: ${s ? `${s.erfasst} von ${s.gesamt} erfasst` : luecke ? 'Lücke, nachtragen' : 'kein Eintrag'}`}
                    minH="52px" borderRadius="md" borderWidth={t === heute ? '3px' : '1px'}
                    borderColor={t === heute ? 'accent' : luecke ? 'orange.400' : 'line'}
                    borderStyle={luecke ? 'dashed' : 'solid'}
                    bg={s ? 'brand.500' : istWochenende(t) ? 'bg.soft' : 'bg.card'}
                    color={s ? 'white' : 'text.main'}
                    display="flex" flexDirection="column" alignItems="center" justifyContent="center" lineHeight={1.1}
                    _hover={{ textDecoration: 'none', borderColor: 'accent' }}
                  >
                    <Text fontWeight={700}>{tag}</Text>
                    <Text fontSize="10px">{s ? `${s.erfasst}/${s.gesamt}` : luecke ? 'Lücke' : ''}</Text>
                  </Box>
                )
              })}
            </SimpleGrid>
            <Text fontSize="xs" color="text.mute" mt={2}>Gefüllt = Eintrag (erfasst/aktive Punkte) · gestrichelt = Werktag ohne Eintrag · Tippen öffnet den Tag zum Nachtragen.</Text>
          </Box>
        ) : (
          <Stack spacing={2}>
            {[...tage].reverse().filter((t) => t <= heute || nachDatum.has(t)).map((t) => {
              const e = nachDatum.get(t)
              if (!e && istWochenende(t)) return null
              const s = status(t)
              return (
                <Box key={t} as={RouterLink} to={link(t)} bg="bg.card" borderWidth="1px" borderStyle={e ? 'solid' : 'dashed'} borderColor={e ? 'line' : 'orange.400'} borderRadius="lg" p={3} minH="56px" _hover={{ textDecoration: 'none', borderColor: 'accent' }}>
                  <HStack justify="space-between" align="start">
                    <Box>
                      <Text fontWeight={700}>{wochentagKurz(t)}, {kurzDatum(t)}</Text>
                      {e ? (
                        <Text fontSize="sm" color="text.mute" noOfLines={2}>{e.tagesnotiz || e.ressourcen || 'Keine Tagesnotiz'}</Text>
                      ) : (
                        <Text fontSize="sm" color="text.mute">Kein Eintrag – nachtragen</Text>
                      )}
                    </Box>
                    {s ? <Badge colorScheme="brand" fontSize="sm" px={2} py={1}>{s.erfasst}/{s.gesamt}</Badge> : <Badge colorScheme="orange" fontSize="sm" px={2} py={1}>Lücke</Badge>}
                  </HStack>
                </Box>
              )
            })}
          </Stack>
        )}
      </Stack>
    </Seite>
  )
}
