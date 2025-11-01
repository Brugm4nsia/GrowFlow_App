// In Datei: src/pages/StammlosungenPage.tsx
// VOLLSTÄNDIGER CODE

import { 
  Box, 
  Button, 
  Heading, 
  VStack, 
  Text, 
  Flex,
  Spacer,
  IconButton,
  Wrap,
  WrapItem,
  Tag,
  HStack,
  useDisclosure, // NEU
} from '@chakra-ui/react';
// NEU: FiEdit, FiTrash
import { FiPlus, FiChevronLeft, FiEdit, FiTrash } from 'react-icons/fi'; 
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { IStammlosung } from '../types';
import { Link as RouterLink, useNavigate } from 'react-router-dom'; // NEU: useNavigate
import { useState } from 'react'; // NEU
// NEU: Importiere das Löschen-Modal
import { StammlosungLoeschenModal } from '../components/Einstellungen/StammlosungLoeschenModal';

// Karte zur Anzeige eines Rezepts
function RezeptCard({ 
  rezept, 
  onEdit, // NEU
  onDelete // NEU
}: { 
  rezept: IStammlosung,
  onEdit: () => void,
  onDelete: () => void,
}) {
  const anzahlZutaten = rezept.rezept.length;
  
  const ergebnisEintraege = Object.entries(rezept.ergebnis_mg_ml)
    .filter(([, val]) => val > 0)
    .map(([key, val]) => ({
      key: key.replace('_gesamt', ''),
      val: val.toFixed(1)
    }));
  
  return (
    <Box p={4} bg="gray.800" borderRadius="md" w="100%">
      <Flex align="center" mb={3}>
        <Heading size="md">{rezept.name}</Heading>
        <Spacer />
        {/* NEU: Buttons für Bearbeiten/Löschen */}
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
      
      <Text color="gray.400" mb={3}>{rezept.endvolumenLiter} Liter | {anzahlZutaten} Zutat(en)</Text>
      
      <Wrap spacing="8px">
        {ergebnisEintraege.map(e => (
          <WrapItem key={e.key}>
            <Tag colorScheme="blue" variant="solid" size="md">
              {e.key}: {e.val}
            </Tag>
          </WrapItem>
        ))}
        <WrapItem>
           <Tag colorScheme="gray" variant="outline" size="md">
              (mg/ml)
            </Tag>
        </WrapItem>
      </Wrap>
    </Box>
  );
}

export function StammlosungenPage() {
  const navigate = useNavigate(); // NEU
  // NEU: States für die Modals
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [rezeptToDelete, setRezeptToDelete] = useState<IStammlosung | undefined>(undefined);

  const rezepte = useLiveQuery(() => db.stammlosungen.toArray(), []);

  // NEU: Handler
  const handleOpenEdit = (rezept: IStammlosung) => {
    // Navigiere zur Rechner-Seite mit der ID
    navigate(`/stammlosung-rechner/${rezept.id}`);
  };
  
  const handleOpenDelete = (rezept: IStammlosung) => {
    setRezeptToDelete(rezept);
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
        <Heading>Stammlösungen</Heading>
        <Spacer />
        <Button 
          as={RouterLink}
          to="/stammlosung-rechner" // Link zum "Neu"-Rechner
          leftIcon={<FiPlus />} 
          colorScheme="green"
        >
          Neu
        </Button>
      </Flex>

      <VStack spacing={4}>
        {rezepte && rezepte.length > 0 ? (
          rezepte.map(r => (
            <RezeptCard 
              key={r.id} 
              rezept={r} 
              onEdit={() => handleOpenEdit(r)} // NEU
              onDelete={() => handleOpenDelete(r)} // NEU
            />
          ))
        ) : (
          <Text color="gray.500">Noch keine Stammlösungen erstellt.</Text>
        )}
      </VStack>
      
      {/* NEU: Das Löschen-Modal */}
      {rezeptToDelete && (
        <StammlosungLoeschenModal
          isOpen={isDeleteOpen}
          onClose={onDeleteClose}
          rezeptToDelete={rezeptToDelete}
        />
      )}
    </Box>
  );
}