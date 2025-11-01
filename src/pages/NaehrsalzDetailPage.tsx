// In Datei: src/pages/NaehrsalzDetailPage.tsx
// VOLLSTÄNDIGER CODE (FEHLENDE DATEI)

import { 
  Box, 
  Heading, 
  Text, 
  IconButton,
  Flex
} from '@chakra-ui/react';
import { FiChevronLeft } from 'react-icons/fi';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

// (Wir werden diese Seite später mit Bearbeiten/Löschen-Logik füllen)

export function NaehrsalzDetailPage() {
  const { salzId } = useParams();

  const salz = useLiveQuery(
    () => db.naehrsalze.get(Number(salzId)),
    [salzId]
  );

  return (
    <Box p={4}>
      <Flex align="center" mb={4}>
        <IconButton
          as={RouterLink}
          to="/naehrsalze" // Zurück zur Nährsalz-Liste
          aria-label="Zurück"
          icon={<FiChevronLeft />}
          variant="ghost"
          mr={2}
        />
        <Heading>{salz?.name || "Lade..."}</Heading>
      </Flex>
      <Text mt={4}>TODO: Hier wird die Bearbeiten-Ansicht für das Nährsalz implementiert.</Text>
    </Box>
  );
}