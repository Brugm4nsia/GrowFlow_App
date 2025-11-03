// In Datei: src/pages/SaeurenPage.tsx
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
  Tag,
  HStack,
  Icon, // NEU
} from '@chakra-ui/react';
import { FiPlus, FiChevronLeft, FiEdit, FiTrash, FiLock } from 'react-icons/fi'; // NEU
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { ISaeureBase } from '../types';
import { SaeureBaseErstellenModal } from '../components/Einstellungen/SaeureBaseErstellenModal';
import { Link as RouterLink } from 'react-router-dom';
import { useState } from 'react';
import { SaeureBaseLoeschenModal } from '../components/Einstellungen/SaeureBaseLoeschenModal';

// Karte zur Anzeige eines Regulators
function SaeureBaseCard({ 
  item,
  onEdit,
  onDelete
}: { 
  item: ISaeureBase,
  onEdit: () => void,
  onDelete: () => void,
}) {
  // Zeige das berechnete Ergebnis
  const reinststoffKey = Object.keys(item.reinststoff_mg_ml)[0];
  const reinststoffWert = item.reinststoff_mg_ml[reinststoffKey as keyof ISaeureBase['reinststoff_mg_ml']] || 0;

  return (
    <Box p={4} bg="gray.800" borderRadius="md" w="100%">
      <Flex align="center">
        <Box flex={1}>
          <Flex align="center">
            <Heading size="md">{item.name}</Heading>
            {/* NEU: Schloss-Icon */}
            {item.isReadOnly && <Icon as={FiLock} color="gray.500" ml={2} title="Master-Daten (Schreibgeschützt)" />}
          </Flex>
          <Text color="gray.400">{item.konzentration}% {item.ch_formel} | Dichte: {item.dichte} g/cm³</Text>
          {/* NEU: Zeige Ergebnis */}
          {reinststoffKey && (
            <Text color="green.300" fontWeight="bold">
              {reinststoffKey}: {reinststoffWert.toFixed(2)} mg/ml
            </Text>
          )}
        </Box>
        <Tag colorScheme={item.typ === 'saeure' ? 'red' : 'blue'} mr={4}>
          {item.typ === 'saeure' ? 'Säure' : 'Base'}
        </Tag>
        <HStack>
          {/* NEU: Deaktiviert bei ReadOnly */}
          <IconButton icon={<FiEdit />} aria-label="Bearbeiten" variant="ghost" onClick={onEdit} isDisabled={item.isReadOnly} />
          <IconButton icon={<FiTrash />} aria-label="Löschen" variant="ghost" colorScheme="red" onClick={onDelete} isDisabled={item.isReadOnly} />
        </HStack>
      </Flex>
    </Box>
  );
}

export function SaeurenPage() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  
  const [itemToEdit, setItemToEdit] = useState<ISaeureBase | undefined>(undefined);
  const [itemToDelete, setItemToDelete] = useState<ISaeureBase | undefined>(undefined);

  // Lade ALLE (Master + Benutzer)
  const saeurenBasen = useLiveQuery(() => db.saeurenBasen.orderBy('name').toArray(), []) || [];

  const handleOpenNew = () => {
    setItemToEdit(undefined);
    onOpen();
  };
  const handleOpenEdit = (item: ISaeureBase) => {
    setItemToEdit(item);
    onOpen();
  };
  const handleOpenDelete = (item: ISaeureBase) => {
    setItemToDelete(item);
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
        <Heading>Säuren & Basen</Heading>
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
        {saeurenBasen.length > 0 ? (
          saeurenBasen.map(s => (
            <SaeureBaseCard 
              key={s.id} 
              item={s}
              onEdit={() => handleOpenEdit(s)}
              onDelete={() => handleOpenDelete(s)}
            />
          ))
        ) : (
          <Text color="gray.500">Noch keine Regulatoren erstellt.</Text>
        )}
      </VStack>

      <SaeureBaseErstellenModal 
        isOpen={isOpen} 
        onClose={onClose} 
        itemToEdit={itemToEdit}
      />
      
      {itemToDelete && (
        <SaeureBaseLoeschenModal
          isOpen={isDeleteOpen}
          onClose={onDeleteClose}
          itemToDelete={itemToDelete}
        />
      )}
    </Box>
  );
}