import { Alert, AlertDescription, AlertIcon, Button, Flex } from '@chakra-ui/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { db } from '../domain/db'
import { useEinstellungen } from '../domain/hooks'

/** Erinnert an ein Backup, sobald Daten vorhanden sind und das letzte Backup länger her ist als eingestellt. */
export function BackupHinweis() {
  const e = useEinstellungen()
  const anzahl = useLiveQuery(() => db.eintraege.count(), [])
  const [weg, setWeg] = useState(false)
  if (weg || !anzahl || e.backupErinnerungTage === 0) return null
  const tage = e.letztesBackup ? Math.floor((Date.now() - e.letztesBackup) / 864e5) : Infinity
  if (tage < e.backupErinnerungTage) return null
  return (
    <Alert status="warning" borderRadius="lg" alignItems="center">
      <AlertIcon />
      <Flex gap={2} wrap="wrap" align="center" flex="1">
        <AlertDescription fontSize="sm" flex="1" minW="180px">
          {e.letztesBackup ? `Das letzte Backup ist ${tage} Tage alt.` : 'Es gibt noch kein Backup.'} Die Daten liegen nur auf diesem Gerät.
        </AlertDescription>
        <Button as={RouterLink} to="/mehr" size="sm" minH="44px">Backup erstellen</Button>
        <Button size="sm" variant="ghost" minH="44px" onClick={() => setWeg(true)}>Später</Button>
      </Flex>
    </Alert>
  )
}
