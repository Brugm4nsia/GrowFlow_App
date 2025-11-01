// In Datei: src/pages/NaehrsalzePage.tsx
// VOLLSTÄNDIGER CODE (mit Layout-Korrektur)

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
  Wrap,     // NEU
  WrapItem, // NEU
  Tag,      // NEU
} from '@chakra-ui/react';
import { FiPlus, FiChevronLeft, FiEdit, FiTrash } from 'react-icons/fi';
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
  
  // === HIER IST DIE KORREKTUR ===
  // Wandle das Objekt in ein Array um und filtere leere/Null-Werte
  const ergebnisEintraege = Object.entries(inhaltsstoffe)
    .filter(([, val]) => val && val > 0)
    .map(([key, val]) => ({
      key: key.replace('_prozent', ''), // Mache 'NH4_prozent' zu 'NH4'
      val: val
    }));

  return (
    <Box p={4} bg="gray.800" borderRadius="md" w="100%">
      <Flex align="center" mb={3}> {/* Mehr Abstand nach unten */}
        <Box as={RouterLink} to={`/naehrsalze/${salz.id}`} flex={1} _hover={{ textDecoration: 'underline' }}>
          <Heading size="md">{salz.name}</Heading>
        </Box>
        <Spacer />
        <HStack>
          <IconButton 
            icon={<FiEdit />} 
            aria-label="Bearbeiten" 
            variant="ghost"
            onClick={onEdit}
          />
          <IconButton 
            icon={<FiTrash />} 
            aria-label="Löschen" 
            variant="ghost" 
            colorScheme="red"
            onClick={onDelete}
          />
        </HStack>
      </Flex>
      
      {/* Zeige die Nährstoffe dynamisch als Tags an */}
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
          <Text color="gray.400" fontSize="sm">Keine Inhaltsstoffe angegeben</Text>
        )}
      </Wrap>
    </Box>
  );
}

export function NaehrsalzePage() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  const salze = useLiveQuery(() => db.naehrsalze.toArray(), []) || [];

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
        {salze.length > 0 ? (
          salze.map(s => (
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