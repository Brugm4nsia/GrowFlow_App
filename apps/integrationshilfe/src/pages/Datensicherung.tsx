import {
  AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay,
  Alert, AlertDescription, AlertIcon, Box, Button, FormControl, FormLabel, Input, Select, Stack, Text, useDisclosure, useToast,
} from '@chakra-ui/react'
import { useEffect, useRef, useState } from 'react'
import { Karte } from '../components/Seite'
import { erzeugeBackup, FalschesPasswort, pruefeBackup, stelleWiederHer } from '../domain/backup'
import { speichereEinstellungen } from '../domain/db'
import { ladeDemo, entferneDemo } from '../domain/demo'
import { useEinstellungen } from '../domain/hooks'
import { fordereDauerhaftenSpeicher, speicherStatus } from '../domain/speicher'
import { lade } from '../pdf/export'

const mb = (b?: number) => (b === undefined ? '–' : `${(b / 1024 / 1024).toFixed(1).replace('.', ',')} MB`)

export function Datensicherung() {
  const e = useEinstellungen()
  const toast = useToast()
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [datei, setDatei] = useState<File | null>(null)
  const [verschl, setVerschl] = useState(false)
  const [restorePw, setRestorePw] = useState('')
  const [fehler, setFehler] = useState<string | null>(null)
  const [speicher, setSpeicher] = useState<Awaited<ReturnType<typeof speicherStatus>> | null>(null)
  const bestaetigen = useDisclosure()
  const abbruch = useRef<HTMLButtonElement>(null)

  useEffect(() => { speicherStatus().then(setSpeicher) }, [])

  const backup = async () => {
    setBusy(true)
    try {
      const { blob, name } = await erzeugeBackup(pw || undefined)
      lade(blob, name)
      await speichereEinstellungen({ letztesBackup: Date.now() })
      toast({ title: 'Backup erstellt', description: `${name} – bitte sicher aufbewahren (enthält Sozialdaten).`, status: 'success', duration: 6000, isClosable: true })
    } catch (err) {
      toast({ title: 'Backup fehlgeschlagen', description: String(err), status: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const waehleDatei = async (f: File | null) => {
    setDatei(f); setFehler(null); setRestorePw(''); setVerschl(false)
    if (!f) return
    const p = await pruefeBackup(f)
    if (!p.ok) { setFehler(p.grund); setDatei(null); return }
    setVerschl(p.verschluesselt)
  }

  const wiederherstellen = async () => {
    if (!datei) return
    setBusy(true); setFehler(null)
    try {
      await stelleWiederHer(datei, restorePw || undefined)
      bestaetigen.onClose()
      setDatei(null)
      toast({ title: 'Backup wiederhergestellt', status: 'success', duration: 5000 })
    } catch (err) {
      bestaetigen.onClose()
      setFehler(err instanceof FalschesPasswort ? err.message : `Wiederherstellung fehlgeschlagen: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setBusy(false)
    }
  }

  const demoAn = (e.demoKinder?.length ?? 0) > 0

  return (
    <Stack spacing={4}>
      <Karte>
        <Text as="h2" fontWeight={700} fontSize="lg" mb={1}>Datensicherung</Text>
        <Text fontSize="sm" color="text.mute" mb={3}>
          Die Daten liegen nur in diesem Browser. Geht das Gerät verloren oder werden Browserdaten gelöscht, sind sie weg – deshalb regelmäßig ein Backup erstellen.
        </Text>
        <Text fontSize="sm" mb={3}>Letztes Backup: <b>{e.letztesBackup ? new Date(e.letztesBackup).toLocaleString('de-DE') : 'noch nie'}</b></Text>
        <FormControl mb={3}>
          <FormLabel>Passwort für das Backup (empfohlen)</FormLabel>
          <Input type="password" value={pw} onChange={(ev) => setPw(ev.target.value)} autoComplete="new-password" placeholder="leer = unverschlüsselt" />
          <Text fontSize="xs" color="text.mute" mt={1}>Mit Passwort wird die Datei verschlüsselt (AES-256). Ohne Passwort ist sie im Klartext lesbar. Ein vergessenes Passwort lässt sich nicht zurücksetzen.</Text>
        </FormControl>
        <Button onClick={backup} isLoading={busy} size="lg" w="full">Backup herunterladen</Button>
        <FormControl mt={4}>
          <FormLabel>Erinnerung an Backup</FormLabel>
          <Select value={e.backupErinnerungTage} onChange={(ev) => speichereEinstellungen({ backupErinnerungTage: Number(ev.target.value) })}>
            <option value={7}>alle 7 Tage</option><option value={14}>alle 14 Tage</option><option value={30}>alle 30 Tage</option><option value={0}>nie</option>
          </Select>
        </FormControl>
      </Karte>

      <Karte>
        <Text as="h2" fontWeight={700} fontSize="lg" mb={2}>Aus Backup wiederherstellen</Text>
        <Alert status="warning" borderRadius="md" mb={3}><AlertIcon /><AlertDescription fontSize="sm">Ersetzt alle Daten auf diesem Gerät durch den Inhalt der Backup-Datei.</AlertDescription></Alert>
        <Input type="file" accept=".json,.ihbackup,application/json,application/octet-stream" onChange={(ev) => waehleDatei(ev.target.files?.[0] ?? null)} p={2} h="auto" aria-label="Backup-Datei wählen" />
        {verschl ? (
          <FormControl mt={3}>
            <FormLabel>Passwort der Backup-Datei</FormLabel>
            <Input type="password" value={restorePw} onChange={(ev) => setRestorePw(ev.target.value)} autoComplete="off" />
          </FormControl>
        ) : null}
        {fehler ? <Alert status="error" mt={3} borderRadius="md"><AlertIcon /><AlertDescription>{fehler}</AlertDescription></Alert> : null}
        <Button mt={3} colorScheme="red" variant="outline" isDisabled={!datei || (verschl && !restorePw)} onClick={bestaetigen.onOpen}>Wiederherstellen …</Button>
      </Karte>

      <Karte>
        <Text as="h2" fontWeight={700} fontSize="lg" mb={2}>Speicher</Text>
        <Text fontSize="sm">
          Dauerhafter Speicher: <b>{speicher?.dauerhaft === null || speicher === null ? 'unbekannt' : speicher.dauerhaft ? 'aktiv' : 'nicht aktiv'}</b>
          {speicher?.genutzt !== undefined ? <> · belegt {mb(speicher.genutzt)} von {mb(speicher.kontingent)}</> : null}
        </Text>
        {speicher && speicher.dauerhaft === false ? (
          <Box mt={2}>
            <Text fontSize="xs" color="text.mute" mb={2}>Ohne dauerhaften Speicher kann der Browser Daten bei Platzmangel löschen. Die App zum Startbildschirm hinzuzufügen erhöht die Chance auf Freigabe.</Text>
            <Button size="sm" variant="outline" onClick={async () => { await fordereDauerhaftenSpeicher(); setSpeicher(await speicherStatus()) }}>Dauerhaften Speicher anfordern</Button>
          </Box>
        ) : null}
      </Karte>

      <Karte>
        <Text as="h2" fontWeight={700} fontSize="lg" mb={1}>Demo-Modus</Text>
        <Text fontSize="sm" color="text.mute" mb={3}>Lädt zwei rein fiktive Kinder („Demo …“) mit Beispieleinträgen der letzten sechs Wochen zum Ausprobieren. Deine eigenen Daten bleiben unverändert; die Demo lässt sich mit einem Tipp wieder entfernen.</Text>
        {demoAn ? <Button variant="outline" onClick={() => entferneDemo().then(() => toast({ title: 'Demo-Daten entfernt', status: 'success' }))}>Demo-Daten entfernen</Button> : <Button variant="outline" onClick={() => ladeDemo().then(() => toast({ title: 'Demo-Daten geladen', status: 'success' }))}>Demo-Daten laden</Button>}
      </Karte>

      <AlertDialog isOpen={bestaetigen.isOpen} leastDestructiveRef={abbruch} onClose={bestaetigen.onClose} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent mx={4}>
            <AlertDialogHeader>Alle Daten ersetzen?</AlertDialogHeader>
            <AlertDialogBody>Kinder, Einträge und Einstellungen auf diesem Gerät werden durch „{datei?.name}“ ersetzt. Das lässt sich nicht rückgängig machen – erstelle vorher ein Backup, falls du den aktuellen Stand noch brauchst.</AlertDialogBody>
            <AlertDialogFooter gap={2}>
              <Button ref={abbruch} variant="outline" onClick={bestaetigen.onClose}>Abbrechen</Button>
              <Button colorScheme="red" onClick={wiederherstellen} isLoading={busy}>Ersetzen</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Stack>
  )
}
