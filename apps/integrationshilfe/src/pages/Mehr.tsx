import { Box, Button, FormControl, FormLabel, HStack, IconButton, Input, Select, Stack, Switch, Text, Textarea, useColorMode, Wrap, WrapItem, Tag, TagLabel, TagCloseButton } from '@chakra-ui/react'
import { useState } from 'react'
import { Karte, Seite } from '../components/Seite'
import { db, speichereEinstellungen } from '../domain/db'
import { useAlleItems, useEigeneBausteine, useEigeneItems, useEinstellungen } from '../domain/hooks'
import { KATALOG, SKALA_BEREICHE } from '../domain/katalog'
import type { Einstellungen } from '../domain/types'
import { IcPlus } from '../components/icons'
import { Datensicherung } from './Datensicherung'

function Abschnitt({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <Karte>
      <Text as="h2" fontWeight={700} fontSize="lg" mb={3}>{titel}</Text>
      {children}
    </Karte>
  )
}

/** Textfeld mit Autosave beim Verlassen. */
function EinstellungsFeld({ feld, label, hilfe }: { feld: 'erstellerName' | 'funktion' | 'traeger'; label: string; hilfe?: string }) {
  const e = useEinstellungen()
  const [wert, setWert] = useState<string | null>(null)
  return (
    <FormControl>
      <FormLabel>{label}</FormLabel>
      <Input
        value={wert ?? e[feld] ?? ''}
        onChange={(ev) => setWert(ev.target.value)}
        onBlur={() => {
          if (wert !== null) speichereEinstellungen({ [feld]: wert } as Partial<Einstellungen>).then(() => setWert(null))
        }}
        autoComplete="off"
      />
      {hilfe ? <Text fontSize="sm" color="text.mute" mt={1}>{hilfe}</Text> : null}
    </FormControl>
  )
}

function ListenEditor({ titel, feld, hilfe }: { titel: string; feld: 'eigeneFoerder' | 'eigeneBarrieren' | 'eigeneMassnahmen'; hilfe: string }) {
  const e = useEinstellungen()
  const [neu, setNeu] = useState('')
  const liste = e[feld]
  const hinzu = async () => {
    const t = neu.trim()
    if (!t || liste.includes(t)) return
    await speichereEinstellungen({ [feld]: [...liste, t] } as Partial<Einstellungen>)
    setNeu('')
  }
  return (
    <Box>
      <Text fontWeight={600}>{titel}</Text>
      <Text fontSize="sm" color="text.mute" mb={2}>{hilfe}</Text>
      <Wrap mb={2}>
        {liste.map((t) => (
          <WrapItem key={t}>
            <Tag size="lg" colorScheme="brand" variant="subtle">
              <TagLabel>{t}</TagLabel>
              <TagCloseButton aria-label={`${t} entfernen`} onClick={() => speichereEinstellungen({ [feld]: liste.filter((x) => x !== t) } as Partial<Einstellungen>)} />
            </Tag>
          </WrapItem>
        ))}
      </Wrap>
      <HStack>
        <Input value={neu} onChange={(ev) => setNeu(ev.target.value)} onKeyDown={(ev) => ev.key === 'Enter' && hinzu()} placeholder="Neuer Eintrag" aria-label={`${titel}: neuer Eintrag`} />
        <IconButton aria-label="Hinzufügen" icon={<IcPlus />} onClick={hinzu} h="48px" w="48px" />
      </HStack>
    </Box>
  )
}

function EigenePunkte() {
  const eigene = useEigeneItems()
  const [label, setLabel] = useState('')
  const [bereich, setBereich] = useState<(typeof SKALA_BEREICHE)[number]['id']>('kognition')
  const hinzu = async () => {
    if (!label.trim()) return
    await db.eigeneItems.add({ bereich, label: label.trim() })
    setLabel('')
  }
  return (
    <Stack spacing={3}>
      <Text fontSize="sm" color="text.mute">Zusätzliche Beobachtungspunkte erscheinen in der Kinder-Beobachtungsliste und in der Erfassung.</Text>
      {eigene.map((i) => (
        <HStack key={i.id} justify="space-between" borderBottomWidth="1px" borderColor="line" pb={2}>
          <Box>
            <Text fontWeight={600}>{i.label}</Text>
            <Text fontSize="sm" color="text.mute">{SKALA_BEREICHE.find((b) => b.id === i.bereich)?.kurz}</Text>
          </Box>
          <Button size="sm" variant="outline" colorScheme="red" onClick={() => db.eigeneItems.delete(Number(i.id.replace('eigen-', '')))}>Löschen</Button>
        </HStack>
      ))}
      <Select value={bereich} onChange={(e) => setBereich(e.target.value as typeof bereich)} aria-label="Fachbereich">
        {SKALA_BEREICHE.map((b) => <option key={b.id} value={b.id}>{b.titel}</option>)}
      </Select>
      <HStack>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Bezeichnung des Beobachtungspunkts" aria-label="Bezeichnung" />
        <IconButton aria-label="Punkt hinzufügen" icon={<IcPlus />} onClick={hinzu} h="48px" w="48px" />
      </HStack>
    </Stack>
  )
}

function EigeneBausteine() {
  const items = useAlleItems()
  const bausteine = useEigeneBausteine()
  const [text, setText] = useState('')
  const [itemId, setItemId] = useState('')
  const hinzu = async () => {
    if (!text.trim()) return
    await db.textbausteine.add({ itemId, text: text.trim() })
    setText('')
  }
  return (
    <Stack spacing={3}>
      <Text fontSize="sm" color="text.mute">
        Platzhalter <b>{'{Kind}'}</b> wird durch das Kürzel ersetzt. Bitte konkret, sachlich und vom Gelungenen her formulieren – keine Namen anderer Personen.
      </Text>
      {bausteine.map((b) => (
        <HStack key={b.id} align="start" justify="space-between" borderBottomWidth="1px" borderColor="line" pb={2}>
          <Box>
            <Text>{b.text}</Text>
            <Text fontSize="sm" color="text.mute">{b.itemId ? items.find((i) => i.id === b.itemId)?.label ?? 'Punkt gelöscht' : 'Allgemein (Tagesnotiz)'}</Text>
          </Box>
          <Button size="sm" variant="outline" colorScheme="red" onClick={() => db.textbausteine.delete(b.id!)}>Löschen</Button>
        </HStack>
      ))}
      <Select value={itemId} onChange={(e) => setItemId(e.target.value)} aria-label="Zugeordneter Punkt">
        <option value="">Allgemein (Tagesnotiz)</option>
        {items.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
      </Select>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="{Kind} …" aria-label="Text des Bausteins" />
      <Button onClick={hinzu} alignSelf="start" leftIcon={<IcPlus />}>Baustein hinzufügen</Button>
    </Stack>
  )
}

export function Mehr() {
  const { colorMode, toggleColorMode } = useColorMode()
  return (
    <Seite titel="Mehr">
      <Stack spacing={4}>
        <Abschnitt titel="Darstellung">
          <FormControl display="flex" alignItems="center" minH="48px">
            <Switch id="dunkel" size="lg" isChecked={colorMode === 'dark'} onChange={toggleColorMode} mr={3} />
            <FormLabel htmlFor="dunkel" mb={0}>Dunkler Modus</FormLabel>
          </FormControl>
        </Abschnitt>

        <Abschnitt titel="Angaben für den Bericht">
          <Stack spacing={3}>
            <EinstellungsFeld feld="erstellerName" label="Name der Ersteller:in" />
            <EinstellungsFeld feld="funktion" label="Funktion" hilfe="z. B. Integrationshelfer:in" />
            <EinstellungsFeld feld="traeger" label="Träger / Organisation" />
          </Stack>
        </Abschnitt>

        <Abschnitt titel="Eigene Beobachtungspunkte"><EigenePunkte /></Abschnitt>
        <Abschnitt titel="Eigene Textbausteine"><EigeneBausteine /></Abschnitt>

        <Abschnitt titel="Eigene Auswahllisten">
          <Stack spacing={5}>
            <ListenEditor titel="Förderfaktoren" feld="eigeneFoerder" hilfe="Zusätzlich zu den vorgegebenen Förderfaktoren." />
            <ListenEditor titel="Barrieren" feld="eigeneBarrieren" hilfe="Zusätzlich zu den vorgegebenen Barrieren." />
            <ListenEditor titel="Assistenzmethoden" feld="eigeneMassnahmen" hilfe="Zusätzlich zu den vorgegebenen Maßnahmen." />
          </Stack>
        </Abschnitt>

        <Datensicherung />

        <Abschnitt titel="Über diese App">
          <Text fontSize="sm" color="text.mute">
            Alle Daten bleiben auf diesem Gerät (IndexedDB). Es gibt kein Backend, keine Anmeldung, kein Tracking und keine Anfragen an Dritte.
            Katalog: {KATALOG.length} Beobachtungspunkte in 5 Fachbereichen (Quelle: Anforderungsprofil, ICF-CY auf Bereichsebene).
            Ob der Einsatz für Ihren Träger zulässig ist, klären Sie bitte mit der Datenschutzbeauftragten bzw. dem Datenschutzbeauftragten. Dies ist keine Rechtsberatung.
          </Text>
        </Abschnitt>
      </Stack>
    </Seite>
  )
}
