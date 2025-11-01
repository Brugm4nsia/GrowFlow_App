// In Datei: src/pages/WasserprofilePage.tsx
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
  HStack, // NEU
} from '@chakra-ui/react';
import { FiPlus, FiChevronLeft, FiEdit, FiTrash } from 'react-icons/fi'; // NEU
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { IWasserprofil } from '../types';
import { WasserprofilErstellenModal } from '../components/Einstellungen/WasserprofilErstellenModal';
import { Link as RouterLink } from 'react-router-dom';
import { useState } from 'react'; // NEU
// NEU: Importiere das Löschen-Modal
import { WasserprofilLoeschenModal } from '../components/Einstellungen/WasserprofilLoeschenModal';


// Karte zur Anzeige eines Profils
function WasserprofilCard({ 
  profil,
  onEdit, // NEU
  onDelete // NEU
}: { 
  profil: IWasserprofil,
  onEdit: () => void,
  onDelete: () => void,
}) {
  return (
    <Box p={4} bg="gray.800" borderRadius="md" w="100%">
      <Flex align="center">
        <Box flex={1}>
          <Heading size="md">{profil.name}</Heading>
          <Text color="gray.400">EC: {profil.ec} | pH: {profil.ph} | KH: {profil.kh}</Text>
        </Box>
        {/* NEU: Bearbeiten/Löschen-Buttons */}
        <HStack>
          <IconButton icon={<FiEdit />} aria-label="Bearbeiten" variant="ghost" onClick={onEdit} />
          <IconButton icon={<FiTrash />} aria-label="Löschen" variant="ghost" colorScheme="red" onClick={onDelete} />
        </HStack>
      </Flex>
    </Box>
  );
}

export function WasserprofilePage() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  // NEU: Hook für Löschen-Modal
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  // NEU: States für Bearbeiten/Löschen
  const [profilToEdit, setProfilToEdit] = useState<IWasserprofil | undefined>(undefined);
  const [profilToDelete, setProfilToDelete] = useState<IWasserprofil | undefined>(undefined);

  const profile = useLiveQuery(() => db.wasserprofile.toArray(), []) || [];

  // NEU: Handler
  const handleOpenNew = () => {
    setProfilToEdit(undefined);
    onOpen();
  };

  const handleOpenEdit = (profil: IWasserprofil) => {
    setProfilToEdit(profil);
    onOpen();
  };
  
  const handleOpenDelete = (profil: IWasserprofil) => {
    setProfilToDelete(profil);
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
        <Heading>Wasserprofile</Heading>
        <Spacer />
        <Button 
          leftIcon={<FiPlus />} 
          colorScheme="green" 
          onClick={handleOpenNew} // Verwendet Handler
        >
          Neu
        </Button>
      </Flex>

      <VStack spacing={4}>
        {profile.length > 0 ? (
          profile.map(p => (
            <WasserprofilCard 
              key={p.id} 
              profil={p}
              onEdit={() => handleOpenEdit(p)} // Verknüpft
              onDelete={() => handleOpenDelete(p)} // Verknüpft
            />
          ))
        ) : (
          <Text color="gray.500">Noch keine Wasserprofile erstellt.</Text>
        )}
      </VStack>

      <WasserprofilErstellenModal 
        isOpen={isOpen} 
        onClose={onClose} 
        profilToEdit={profilToEdit} // Übergibt Profil
      />
      
      {/* NEU: Löschen-Modal */}
      {profilToDelete && (
        <WasserprofilLoeschenModal
          isOpen={isDeleteOpen}
          onClose={onDeleteClose}
          profilToDelete={profilToDelete}
        />
      )}
    </Box>
  );
}