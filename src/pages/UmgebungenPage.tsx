// In Datei: src/pages/UmgebungenPage.tsx
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
} from '@chakra-ui/react';
import { FiPlus, FiChevronLeft, FiEdit, FiTrash } from 'react-icons/fi';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { UmgebungErstellenModal } from '../components/Umgebungen/UmgebungErstellenModal';
import { IUmgebung } from '../types';
import { Link as RouterLink } from 'react-router-dom';
import { useState } from 'react';
// Importiert das Modal aus Schritt 1
import { UmgebungLoeschenModal } from '../components/Umgebungen/UmgebungLoeschenModal';

// Eine Komponente, um eine einzelne Umgebung in der Liste darzustellen
function UmgebungCard({ 
  umgebung,
  onEdit,
  onDelete
}: { 
  umgebung: IUmgebung,
  onEdit: () => void,
  onDelete: () => void,
}) {
  
  const pflanzenAnzahl = useLiveQuery(
    () => db.pflanzen.where('umgebungId').equals(umgebung.id!).count(),
    [umgebung.id]
  );
  
  return (
    <Box p={4} bg="gray.800" borderRadius="md" w="100%">
      <Flex align="center">
        <Box>
          <Heading size="md">{umgebung.name}</Heading>
          <Text color="gray.400">{umgebung.art === 'innen' ? 'Innen' : 'Außen'}</Text>
        </Box>
        <Spacer />
        <Text color="gray.500" mr={4}>{pflanzenAnzahl} Pflanze(n)</Text>
        <HStack>
          <IconButton icon={<FiEdit />} aria-label="Bearbeiten" variant="ghost" onClick={onEdit} />
          <IconButton icon={<FiTrash />} aria-label="Löschen" variant="ghost" colorScheme="red" onClick={onDelete} />
        </HStack>
      </Flex>
    </Box>
  );
}

export function UmgebungenPage() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  const [umgebungToEdit, setUmgebungToEdit] = useState<IUmgebung | undefined>(undefined);
  const [umgebungToDelete, setUmgebungToDelete] = useState<IUmgebung | undefined>(undefined);

  const umgebungen = useLiveQuery(() => db.umgebungen.toArray(), []) || [];

  const handleOpenNew = () => {
    setUmgebungToEdit(undefined);
    onOpen();
  };
  const handleOpenEdit = (umgebung: IUmgebung) => {
    setUmgebungToEdit(umgebung);
    onOpen();
  };
  const handleOpenDelete = (umgebung: IUmgebung) => {
    setUmgebungToDelete(umgebung);
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
        <Heading>Umgebungen</Heading>
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
        {umgebungen.length > 0 ? (
          umgebungen.map(umg => (
            <UmgebungCard 
              key={umg.id} 
              umgebung={umg}
              onEdit={() => handleOpenEdit(umg)}
              onDelete={() => handleOpenDelete(umg)}
            />
          ))
        ) : (
          <Text color="gray.500">Noch keine Umgebungen erstellt.</Text>
        )}
      </VStack>

      <UmgebungErstellenModal 
        isOpen={isOpen} 
        onClose={onClose}
        umgebungToEdit={umgebungToEdit}
      />

      {umgebungToDelete && (
        <UmgebungLoeschenModal
          isOpen={isDeleteOpen}
          onClose={onDeleteClose}
          umgebungToDelete={umgebungToDelete}
        />
      )}
    </Box>
  );
}