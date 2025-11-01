// In Datei: src/pages/PflanzenPage.tsx
// VOLLSTÄNDIGER CODE

import { 
  Box, 
  Button, 
  Heading, 
  VStack, 
  Text, 
  useDisclosure, 
  Flex,
  Spacer,
  Tag,
  Spinner // NEU: Lade-Anzeige
} from '@chakra-ui/react';
import { FiPlus } from 'react-icons/fi';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { PflanzeErstellenModal } from '../components/Pflanzen/PflanzeErstellenModal';
import { IPflanze, IUmgebung, PflanzenStatus } from '../types';
import { Link as RouterLink } from 'react-router-dom';
import { useMemo } from 'react'; // NEU: Für stabiles Sortieren

// === HIER IST DER FIX ===
function getPhasenTag(pflanze: IPflanze): string {
  // 1. Prüfe den Gesamtstatus (Archiviert)
  if (pflanze.status !== 'aktiv') {
    // Wandle 'tot' in 'Tot' um
    return pflanze.status.charAt(0).toUpperCase() + pflanze.status.slice(1);
  }
  
  const { stadium, phasenDaten } = pflanze;

  // 2. Prüfe, ob 'phasenDaten' (neu) oder 'startDatum' (alt) existiert
  // Dies fängt alte Daten ab, die 'phasenDaten' nicht haben.
  const phasenDatum = (phasenDaten && phasenDaten[stadium]) ? phasenDaten[stadium] : pflanze.startDatum;
  
  if (!phasenDatum) {
    // Fallback, falls alles fehlt
    return stadium.charAt(0).toUpperCase() + stadium.slice(1);
  }

  // 3. Berechne die Tage
  const heute = new Date();
  heute.setHours(0, 0, 0, 0); 
  const start = new Date(phasenDatum);
  start.setHours(0, 0, 0, 0);
  
  const diffZeit = Math.abs(heute.getTime() - start.getTime());
  const diffTage = Math.ceil(diffZeit / (1000 * 60 * 60 * 24)) + 1; 

  const stadiumName = stadium.charAt(0).toUpperCase() + stadium.slice(1);
  return `${stadiumName} Tag ${diffTage}`;
}

// Karte zur Anzeige einer Pflanze
function PflanzeCard({ pflanze }: { pflanze: IPflanze }) {
  const umgebung = useLiveQuery(
    () => db.umgebungen.get(pflanze.umgebungId), 
    [pflanze.umgebungId]
  ) as IUmgebung | undefined;

  const isAktiv = pflanze.status === 'aktiv';

  return (
    <Box 
      as={RouterLink}
      to={`/pflanze/${pflanze.id}`}
      p={4} 
      bg="gray.800" 
      borderRadius="md" 
      w="100%"
      _hover={{ bg: 'gray.700' }}
      opacity={isAktiv ? 1.0 : 0.5}
    >
      <Flex align="center" mb={2}>
        <Heading size="md">{pflanze.name}</Heading>
        <Spacer />
        <Tag colorScheme={isAktiv ? 'green' : 'red'}>{getPhasenTag(pflanze)}</Tag>
      </Flex>
      <Text color="gray.400">{pflanze.sorte}</Text>
      <Text color="gray.500" fontSize="sm">in "{umgebung?.name || 'Unbekannt'}"</Text>
    </Box>
  );
}

export function PflanzenPage() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Lade Pflanzen. 'pflanzen' ist 'undefined' beim ersten Laden.
  const pflanzen = useLiveQuery(() => db.pflanzen.toArray(), []);

  // Sortiere, sodass aktive Pflanzen oben sind (jetzt in useMemo)
  const sortiertePflanzen = useMemo(() => {
    if (!pflanzen) return []; // Wenn 'pflanzen' undefined ist, gib leeres Array zurück
    
    // Sortiere 'aktiv' nach oben
    return [...pflanzen].sort((a, b) => {
      const statusA: PflanzenStatus = a.status || 'aktiv'; // Fallback für alte Daten
      const statusB: PflanzenStatus = b.status || 'aktiv';
      
      if (statusA === 'aktiv' && statusB !== 'aktiv') return -1;
      if (statusA !== 'aktiv' && statusB === 'aktiv') return 1;
      return 0; // Behalte Reihenfolge bei gleichem Status
    });
  }, [pflanzen]); // Nur neuberechnen, wenn 'pflanzen' sich ändert

  return (
    <Box p={4}>
      <Flex align="center" mb={4}>
        <Heading>Pflanzen</Heading>
        <Spacer />
        <Button 
          leftIcon={<FiPlus />} 
          colorScheme="green" 
          onClick={onOpen}
        >
          Neu
        </Button>
      </Flex>

      <VStack spacing={4}>
        {pflanzen === undefined && (
          // Zeige Spinner, während die DB lädt
          <Spinner size="xl" mt={8} />
        )}
        
        {pflanzen && pflanzen.length === 0 && (
          // Laden fertig, aber keine Pflanzen da
          <Text color="gray.500">Noch keine Pflanzen erstellt.</Text>
        )}

        {sortiertePflanzen.length > 0 && (
          // Zeige die sortierte Liste
          sortiertePflanzen.map(pflanze => (
            <PflanzeCard key={pflanze.id} pflanze={pflanze} />
          ))
        )}
      </VStack>

      <PflanzeErstellenModal isOpen={isOpen} onClose={onClose} />
    </Box>
  );
}