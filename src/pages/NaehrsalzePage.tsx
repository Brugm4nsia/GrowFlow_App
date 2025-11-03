// In Datei: src/pages/NaehrsalzePage.tsx
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
  IconButton,
  HStack,
  Wrap,
  WrapItem,
  Tag,
  Icon,
} from '@chakra-ui/react';
import { FiPlus, FiChevronLeft, FiEdit, FiTrash, FiLock } from 'react-icons/fi';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { INaehrsalz } from '../types';
import { NaehrsalzErstellenModal } from '../components/Einstellungen/NaehrsalzErstellenModal';
import { Link as RouterLink } from 'react-router-dom';
import { useState } from 'react';
import { NaehrsalzLoeschenModal } from '../components/Einstellungen/NaehrsalzLoeschenModal';

// Karte zur Anzeige eines Salzes
function NaehrsalzCard({ 
  salz, 
  onEdit,
  onDelete
}: { 
  salz: INaehrsalz,
  onEdit: () => void,
  onDelete: () => void,
}) {
  
  const inhaltsstoffe = salz.inhaltsstoffe || {};
  
  const ergebnisEintraege = Object.entries(inhaltsstoffe)
    .filter(([, val]) => val && val > 0)
    .map(([key, val]) => ({
      key: key.replace('_prozent', ''),
      val: val
    }));

  return (
    <Box p={4} bg="gray.800" borderRadius="md" w="100%">
      <Flex align="center" mb={3}>
        <Heading size="md">{salz.name}</Heading>
        {/* === KORREKTUR: Zeige Schloss-Icon für Master-Einträge === */}
        {salz.isReadOnly && <Icon as={FiLock} color="gray.500" ml={2} title="Master-Daten (Schreibgeschützt)" />}
        <Spacer />
        <HStack>
          {/* === KORREKTUR: Deaktiviere Buttons für Master-Einträge === */}
          <IconButton 
            icon={<FiEdit />} 
            aria-label="Bearbeiten" 
            variant="ghost"
            onClick={onEdit}
            isDisabled={salz.isReadOnly} // Deaktiviert
          />
          <IconButton 
            icon={<FiTrash />} 
            aria-label="Löschen" 
            variant="ghost" 
            colorScheme="red"
            onClick={onDelete}
            isDisabled={salz.isReadOnly} // Deaktiviert
          />
        </HStack>
      </Flex>
      
      <Wrap spacing="8px">
        {ergebnisEintraege.length > 0 ? (
          ergebnisEintraege.map(e => (
            <WrapItem key={e.key}>
              <Tag colorScheme="blue" variant="solid" size="md">
                {e.key}: {e.val}%
              </Tag>
            </WrapItem>
          ))
        ) : (
          <Text color="gray.400" fontSize="sm">{salz.beschreibung || "Keine Inhaltsstoffe angegeben"}</Text>
        )}
      </Wrap>
    </Box>
  );
}

export function NaehrsalzePage() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  // Lädt jetzt ALLE Salze (Master + Benutzer) aus der DB
  const alleSalze = useLiveQuery(
    () => db.naehrsalze.orderBy('name').toArray(), 
    []
  ) || [];

  const [salzToEdit, setSalzToEdit] = useState<INaehrsalz | undefined>(undefined);
  const [salzToDelete, setSalzToDelete] = useState<INaehrsalz | undefined>(undefined);

  const handleOpenNew = () => {
    setSalzToEdit(undefined);
    onOpen();
  };
  const handleOpenEdit = (salz: INaehrsalz) => {
    setSalzToEdit(salz);
    onOpen();
  };
  const handleOpenDelete = (salz: INaehrsalz) => {
    setSalzToDelete(salz);
    onDeleteOpen();
  };

  return (
    <Box p={4}>
      <Flex align="center" mb={4}>
        <IconButton
          as={RouterLink}
          to="/einstellungen"
          aria-label="Zurück zu Mehr"
          icon={<FiChevronLeft />}
          variant="ghost"
          mr={2}
        />
        <Heading>Nährsalze</Heading>
        <Spacer />
        <Button 
          leftIcon={<FiPlus />} 
          colorScheme="green" 
          onClick={handleOpenNew}
        >
          Neu
        </Button>
      </Flex>

      <VStack spacing={4}>
        {alleSalze.length > 0 ? (
          alleSalze.map(s => (
            <NaehrsalzCard 
              key={s.id} 
              salz={s} 
              onEdit={() => handleOpenEdit(s)}
              onDelete={() => handleOpenDelete(s)}
            />
          ))
        ) : (
          <Text color="gray.500">Noch keine Nährsalze erstellt.</Text>
        )}
      </VStack>

      <NaehrsalzErstellenModal 
        isOpen={isOpen} 
        onClose={onClose} 
        salzToEdit={salzToEdit}
      />
      
      {salzToDelete && (
        <NaehrsalzLoeschenModal
          isOpen={isDeleteOpen}
          onClose={onDeleteClose}
          salzToDelete={salzToDelete}
        />
      )}
    </Box>
  );
}