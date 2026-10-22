import {
  Alert, AlertDescription, AlertIcon, AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay,
  Box, Button, Checkbox, FormControl, FormHelperText, FormLabel, Heading, HStack, Input, Select, SimpleGrid, Stack, Text, Textarea, useDisclosure, useToast, Wrap,
} from '@chakra-ui/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { KindAvatar } from '../components/KindAvatar'
import { Karte, Seite } from '../components/Seite'
import { db, loescheKind } from '../domain/db'
import { useAlleItems, useKinder } from '../domain/hooks'
import { ICD10, KIND_FARBEN, NETZWERK_FELDER, SCHULARTEN, SKALA_BEREICHE } from '../domain/katalog'
import type { Kind } from '../domain/types'

function neuesKind(anzahl: number): Kind {
  return {
    name: '', diagnosen: [], ziele: [], netzwerk: {}, aktiveItems: [],
    farbe: KIND_FARBEN[anzahl % KIND_FARBEN.length], archiviert: 0,
  }
}

export function KindFormular() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const alle = useKinder(true)
  const items = useAlleItems()
  const [kind, setKind] = useState<Kind | null>(null)
  const geladen = useRef(false)
  const loeschen = useDisclosure()
  const abbruchRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (geladen.current || alle === undefined) return
    if (id === undefined) {
      geladen.current = true
      setKind(neuesKind(alle.length))
    } else {
      const k = alle.find((x) => x.id === Number(id))
      if (k) {
        geladen.current = true
        setKind({ ...k })
      } else {
        db.kinder.get(Number(id)).then((x) => {
          geladen.current = true
          setKind(x ?? neuesKind(alle.length))
        })
      }
    }
  }, [alle, id])

  const zielText = useMemo(() => (kind ? kind.ziele.join('\n') : ''), [kind])
  const [zielEntwurf, setZielEntwurf] = useState<string | null>(null)

  if (!kind) return <Seite titel="Kind">{null}</Seite>
  const set = <K extends keyof Kind>(k: K, v: Kind[K]) => setKind({ ...kind, [k]: v })
  const anzahl = kind.aktiveItems.length
  const gueltig = kind.name.trim().length > 0

  async function speichern() {
    if (!kind || !gueltig) return
    const ziele = (zielEntwurf ?? zielText).split('\n').map((z) => z.trim()).filter(Boolean)
    const daten: Kind = { ...kind, name: kind.name.trim(), ziele }
    const neu = daten.id === undefined
    const neueId = await db.kinder.put(daten)
    toast({ title: neu ? 'Kind angelegt' : 'Gespeichert', status: 'success', duration: 2000 })
    if (neu) navigate(`/kinder/${neueId}`, { replace: true })
    else navigate('/kinder')
  }

  async function archivieren() {
    if (!kind?.id) return
    await db.kinder.update(kind.id, { archiviert: kind.archiviert ? 0 : 1 })
    navigate('/kinder')
  }

  async function endgueltigLoeschen() {
    if (!kind?.id) return
    await loescheKind(kind.id)
    loeschen.onClose()
    navigate('/kinder')
  }

  const toggle = (liste: string[], wert: string) => (liste.includes(wert) ? liste.filter((x) => x !== wert) : [...liste, wert])

  return (
    <Seite titel={kind.id ? kind.name || 'Kind' : 'Neues Kind'}>
      <Stack spacing={4}>
        <Karte>
          <Heading size="sm" mb={3}>Stammdaten</Heading>
          <Stack spacing={3}>
            <FormControl isRequired>
              <FormLabel>Kürzel oder Vorname</FormLabel>
              <Input value={kind.name} onChange={(e) => set('name', e.target.value)} autoComplete="off" maxLength={40} />
              <FormHelperText>Pseudonym empfohlen. Erscheint so im Bericht und im Dateinamen.</FormHelperText>
            </FormControl>
            <FormControl>
              <FormLabel>Nachname (optional)</FormLabel>
              <Input value={kind.nachname ?? ''} onChange={(e) => set('nachname', e.target.value)} autoComplete="off" />
              <FormHelperText>Wird nur gespeichert, nicht in den Bericht übernommen.</FormHelperText>
            </FormControl>
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
              <FormControl>
                <FormLabel>Geburtsdatum</FormLabel>
                <Input type="date" value={kind.geburtsdatum ?? ''} onChange={(e) => set('geburtsdatum', e.target.value || undefined)} />
              </FormControl>
              <FormControl>
                <FormLabel>Klasse</FormLabel>
                <Input value={kind.klasse ?? ''} onChange={(e) => set('klasse', e.target.value)} placeholder="z. B. 3b" />
              </FormControl>
              <FormControl>
                <FormLabel>Schulart</FormLabel>
                <Select placeholder="–" value={kind.schulart ?? ''} onChange={(e) => set('schulart', e.target.value || undefined)}>
                  {SCHULARTEN.map((s) => <option key={s}>{s}</option>)}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Kostenträger</FormLabel>
                <Input value={kind.kostentraeger ?? ''} onChange={(e) => set('kostentraeger', e.target.value)} />
              </FormControl>
            </SimpleGrid>
            <FormControl>
              <FormLabel>Aktenzeichen</FormLabel>
              <Input value={kind.aktenzeichen ?? ''} onChange={(e) => set('aktenzeichen', e.target.value)} autoComplete="off" />
              <FormHelperText>Erscheint nur im Bericht, wenn beim Export aktiviert.</FormHelperText>
            </FormControl>
            <FormControl>
              <FormLabel>Farbe</FormLabel>
              <HStack wrap="wrap" spacing={2}>
                {KIND_FARBEN.map((f) => (
                  <Button
                    key={f} onClick={() => set('farbe', f)} aria-label={`Farbe ${f}`} aria-pressed={kind.farbe === f}
                    w="44px" h="44px" minW="44px" p={0} borderRadius="full" bg={f} _hover={{ bg: f }} _active={{ bg: f }}
                    borderWidth={kind.farbe === f ? '4px' : '1px'} borderColor={kind.farbe === f ? 'text.main' : 'line'}
                  />
                ))}
              </HStack>
            </FormControl>
          </Stack>
        </Karte>

        <Karte>
          <Heading size="sm" mb={1}>Diagnosen (ICD-10)</Heading>
          <Text fontSize="sm" color="text.mute" mb={3}>Gesundheitsdaten – nur lokal gespeichert, im Bericht standardmäßig ausgeblendet.</Text>
          <Stack spacing={1}>
            {ICD10.map((d) => (
              <Checkbox key={d.code} size="lg" py={1} isChecked={kind.diagnosen.includes(d.code)} onChange={() => set('diagnosen', toggle(kind.diagnosen, d.code))}>
                <Text as="span" fontWeight={600}>{d.code}</Text> <Text as="span" fontSize="sm">{d.text}</Text>
              </Checkbox>
            ))}
          </Stack>
          <FormControl mt={3}>
            <FormLabel>Weitere Diagnosen (Freitext)</FormLabel>
            <Input value={kind.diagnoseFreitext ?? ''} onChange={(e) => set('diagnoseFreitext', e.target.value)} />
          </FormControl>
        </Karte>

        <Karte>
          <Heading size="sm" mb={3}>Bewilligung</Heading>
          <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
            <FormControl>
              <FormLabel>Stunden pro Woche</FormLabel>
              <Input type="number" inputMode="decimal" min={0} step="0.5" value={kind.stunden ?? ''} onChange={(e) => set('stunden', e.target.value === '' ? undefined : Number(e.target.value))} />
            </FormControl>
            <FormControl>
              <FormLabel>Gültig von</FormLabel>
              <Input type="date" value={kind.bewilligungVon ?? ''} onChange={(e) => set('bewilligungVon', e.target.value || undefined)} />
            </FormControl>
            <FormControl>
              <FormLabel>Gültig bis</FormLabel>
              <Input type="date" value={kind.bewilligungBis ?? ''} onChange={(e) => set('bewilligungBis', e.target.value || undefined)} />
            </FormControl>
          </SimpleGrid>
        </Karte>

        <Karte>
          <Heading size="sm" mb={3}>Leit- und Teilhabeziele</Heading>
          <FormControl>
            <Textarea
              rows={4}
              value={zielEntwurf ?? zielText}
              onChange={(e) => setZielEntwurf(e.target.value)}
              placeholder={'Ein Ziel pro Zeile, z. B.\nTeilnahme an Gruppenarbeiten'}
              aria-label="Ziele, ein Ziel pro Zeile"
            />
          </FormControl>
        </Karte>

        <Karte>
          <Heading size="sm" mb={3}>Netzwerk</Heading>
          <Stack spacing={3}>
            {NETZWERK_FELDER.map((f) => (
              <FormControl key={f.key}>
                <FormLabel>{f.label}</FormLabel>
                <Input value={kind.netzwerk[f.key] ?? ''} onChange={(e) => set('netzwerk', { ...kind.netzwerk, [f.key]: e.target.value })} />
              </FormControl>
            ))}
          </Stack>
        </Karte>

        <Karte>
          <Heading size="sm" mb={1}>Beobachtungsliste</Heading>
          <Text fontSize="sm" color="text.mute" mb={2}>
            Wähle die Punkte aus, die aus Hilfeplan und Zielen für dieses Kind relevant sind (empfohlen: 5–10).
          </Text>
          <Alert status={anzahl >= 5 && anzahl <= 10 ? 'success' : 'info'} borderRadius="md" mb={3}>
            <AlertIcon />
            <AlertDescription fontSize="sm">
              {anzahl} Punkte aktiv{anzahl > 10 ? ' – mehr als 10 verlängern die tägliche Erfassung.' : anzahl < 5 ? ' – empfohlen sind 5–10.' : '.'}
            </AlertDescription>
          </Alert>
          <Stack spacing={4}>
            {SKALA_BEREICHE.map((b) => {
              const bi = items.filter((i) => i.bereich === b.id)
              return (
                <Box key={b.id}>
                  <Text fontWeight={700} fontSize="sm" color="accent" mb={1}>{b.titel}</Text>
                  <Stack spacing={0}>
                    {bi.map((i) => (
                      <Checkbox key={i.id} size="lg" py={2} isChecked={kind.aktiveItems.includes(i.id)} onChange={() => set('aktiveItems', toggle(kind.aktiveItems, i.id))}>
                        <Text fontSize="md">{i.label}</Text>
                      </Checkbox>
                    ))}
                  </Stack>
                </Box>
              )
            })}
          </Stack>
        </Karte>

        <HStack spacing={3} position="sticky" bottom="calc(68px + env(safe-area-inset-bottom))" bg="bg.app" py={2} zIndex={5}>
          <Button size="lg" flex="1" onClick={speichern} isDisabled={!gueltig}>Speichern</Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/kinder')}>Abbrechen</Button>
        </HStack>

        {kind.id ? (
          <Karte>
            <Wrap spacing={3} align="center">
              <KindAvatar kind={kind} />
              <Button variant="outline" onClick={archivieren}>{kind.archiviert ? 'Wieder aktivieren' : 'Archivieren'}</Button>
              <Button variant="outline" colorScheme="red" onClick={loeschen.onOpen}>Kind und alle Einträge löschen</Button>
            </Wrap>
          </Karte>
        ) : null}
      </Stack>

      <AlertDialog isOpen={loeschen.isOpen} leastDestructiveRef={abbruchRef} onClose={loeschen.onClose} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent mx={4}>
            <AlertDialogHeader>„{kind.name}“ löschen?</AlertDialogHeader>
            <AlertDialogBody>Das Kind und alle zugehörigen Einträge werden unwiderruflich von diesem Gerät gelöscht. Tipp: Vorher ein Backup erstellen oder das Kind nur archivieren.</AlertDialogBody>
            <AlertDialogFooter gap={2}>
              <Button ref={abbruchRef} variant="outline" onClick={loeschen.onClose}>Abbrechen</Button>
              <Button colorScheme="red" onClick={endgueltigLoeschen}>Endgültig löschen</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Seite>
  )
}
