// In Datei: src/pages/PflanzeDetailPage.tsx
// VOLLSTÄNDIGER CODE

import { 
  Box, 
  Heading, 
  Text, 
  VStack, 
  IconButton, 
  Flex, 
  Spacer, 
  Tag,
  Spinner,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  MenuDivider, // NEU
} from '@chakra-ui/react';
import { FiChevronLeft, FiMoreVertical } from 'react-icons/fi';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { IPflanze, IUmgebung } from '../types';
import { Tagebuch } from '../components/Dashboard/Tagebuch';
import { StufeAendernModal } from '../components/Pflanzen/StufeAendernModal';
import { PflanzeBearbeitenModal } from '../components/Pflanzen/PflanzeBearbeitenModal';
import { UmgebungAendernModal } from '../components/Pflanzen/UmgebungAendernModal';
import { PflanzeStatusAendernModal } from '../components/Pflanzen/PflanzeStatusAendernModal';
// NEU: Importiere das Löschen-Modal
import { PflanzeLoeschenModal } from '../components/Pflanzen/PflanzeLoeschenModal';

function getPhasenTag(pflanze: IPflanze): string {
  if (pflanze.status !== 'aktiv') {
    return pflanze.status.charAt(0).toUpperCase() + pflanze.status.slice(1);
  }
  const { stadium, phasenDaten } = pflanze;
  const phasenDatum = (phasenDaten && phasenDaten[stadium]) ? phasenDaten[stadium] : pflanze.startDatum;
  if (!phasenDatum) return stadium.charAt(0).toUpperCase() + stadium.slice(1);
  const heute = new Date();
  heute.setHours(0, 0, 0, 0); 
  const start = new Date(phasenDatum);
  start.setHours(0, 0, 0, 0);
  const diffZeit = Math.abs(heute.getTime() - start.getTime());
  const diffTage = Math.ceil(diffZeit / (1000 * 60 * 60 * 24)) + 1; 
  const stadiumName = stadium.charAt(0).toUpperCase() + stadium.slice(1);
  return `${stadiumName} Tag ${diffTage}`;
}

export function PflanzeDetailPage() {
  const { pflanzenId } = useParams();
  
  // Hooks für alle Modals
  const { isOpen: isStufeOpen, onOpen: onStufeOpen, onClose: onStufeClose } = useDisclosure();
  const { isOpen: isBearbeitenOpen, onOpen: onBearbeitenOpen, onClose: onBearbeitenClose } = useDisclosure();
  const { isOpen: isUmgebungOpen, onOpen: onUmgebungOpen, onClose: onUmgebungClose } = useDisclosure();
  const { isOpen: isTotOpen, onOpen: onTotOpen, onClose: onTotClose } = useDisclosure();
  // NEU: Hook für Löschen-Modal
  const { isOpen: isLoeschenOpen, onOpen: onLoeschenOpen, onClose: onLoeschenClose } = useDisclosure();

  const pflanze = useLiveQuery(
    () => db.pflanzen.get(Number(pflanzenId)),
    [pflanzenId]
  );
  
  const umgebung = useLiveQuery(
    () => (pflanze ? db.umgebungen.get(pflanze.umgebungId) : undefined),
    [pflanze?.umgebungId]
  ) as IUmgebung | undefined;

  if (!pflanze) {
    return <Spinner p={4} />;
  }
  
  // Wenn Pflanze archiviert ist, zeige nur Status-Info (unverändert)
  if (pflanze.status !== 'aktiv') {
     return (
       <Box p={4} textAlign="center">
          <IconButton
            as={RouterLink}
            to="/pflanzen"
            aria-label="Zurück"
            icon={<FiChevronLeft />}
            variant="ghost"
            position="absolute"
            top={4}
            left={4}
          />
         <Heading mt={16}>{pflanze.name}</Heading>
         <Tag mt={4} colorScheme={pflanze.status === 'tot' ? 'red' : 'yellow'} size="lg">
           Status: {pflanze.status}
         </Tag>
       </Box>
     );
  }

  return (
    <Box p={4} pb={24}>
      <Flex align="center" mb={4}>
        <IconButton
          as={RouterLink}
          to="/pflanzen"
          aria-label="Zurück"
          icon={<FiChevronLeft />}
          variant="ghost"
          mr={2}
        />
        <Heading size="lg">{pflanze.name}</Heading>
        <Spacer />
        <Menu>
          <MenuButton as={IconButton} icon={<FiMoreVertical />} variant="ghost" />
          <MenuList bg="gray.700">
            <MenuItem bg="gray.700" onClick={onBearbeitenOpen}>Bearbeiten</MenuItem>
            <MenuItem bg="gray.700" onClick={onStufeOpen}>Stufe ändern</MenuItem>
            <MenuItem bg="gray.700" onClick={onUmgebungOpen}>Umgebung ändern</MenuItem>
            
            <MenuDivider /> 
            
            <MenuItem bg="gray.700" color="yellow.400" onClick={onTotOpen}>
              Als 'Tot' markieren (Archivieren)
            </MenuItem>
            
            {/* NEU: Menüpunkt "Endgültig löschen" */}
            <MenuItem bg="gray.700" color="red.400" onClick={onLoeschenOpen}>
              Endgültig löschen
            </MenuItem>
          </MenuList>
        </Menu>
      </Flex>

      <VStack align="start" spacing={1} mb={6}>
        <Text fontSize="lg" color="gray.300">{pflanze.sorte || 'Unbekannte Sorte'}</Text>
        <Text fontSize="md" color="gray.400">Breeder: {pflanze.breeder || 'N/A'}</Text>
        <Text fontSize="md" color="gray.400">in "{umgebung?.name || '...'}"</Text>
        <Flex gap={2} mt={2}>
          <Tag colorScheme="green">{getPhasenTag(pflanze)}</Tag>
          <Tag textTransform="capitalize">{pflanze.medium}</Tag>
        </Flex>
      </VStack>

      <Tagebuch filterPflanzenId={pflanze.id} />
      
      {/* --- Die (unsichtbaren) Modals --- */}
      <StufeAendernModal isOpen={isStufeOpen} onClose={onStufeClose} pflanze={pflanze} />
      <PflanzeBearbeitenModal isOpen={isBearbeitenOpen} onClose={onBearbeitenClose} pflanze={pflanze} />
      <UmgebungAendernModal isOpen={isUmgebungOpen} onClose={onUmgebungClose} pflanze={pflanze} />
      
      <PflanzeStatusAendernModal
        isOpen={isTotOpen}
        onClose={onTotClose}
        pflanze={pflanze}
        neuerStatus="tot"
      />
      
      {/* NEU: Das Löschen-Modal */}
      <PflanzeLoeschenModal
        isOpen={isLoeschenOpen}
        onClose={onLoeschenClose}
        pflanze={pflanze}
      />
    </Box>
  );
}