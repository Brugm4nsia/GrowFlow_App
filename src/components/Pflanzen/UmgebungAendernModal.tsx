// In Datei: src/components/Pflanzen/UmgebungAendernModal.tsx
// VOLLSTÄNDIGER CODE

import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  Button, VStack, FormControl, FormLabel, Select, useToast,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { db } from '../../db';
import { IPflanze } from '../../types';
import { useLiveQuery } from 'dexie-react-hooks';

interface UmgebungAendernModalProps {
  isOpen: boolean;
  onClose: () => void;
  pflanze: IPflanze;
}

export function UmgebungAendernModal({ isOpen, onClose, pflanze }: UmgebungAendernModalProps) {
  const toast = useToast();

  // Lade alle verfügbaren Umgebungen
  const umgebungen = useLiveQuery(() => db.umgebungen.toArray(), []);

  // State für die neue ausgewählte ID
  const [neueUmgebungId, setNeueUmgebungId] = useState(pflanze.umgebungId);

  // Setze den State zurück, wenn sich die Pflanze ändert
  useEffect(() => {
    setNeueUmgebungId(pflanze.umgebungId);
  }, [pflanze, isOpen]);

  const handleSave = async () => {
    if (neueUmgebungId === pflanze.umgebungId) {
      toast({ title: "Keine Änderung", status: "info", duration: 1500 });
      onClose();
      return;
    }

    try {
      // Aktualisiere nur die umgebungId der Pflanze
      await db.pflanzen.update(pflanze.id!, { umgebungId: Number(neueUmgebungId) });
      toast({ title: "Umgebung geändert", status: "success", duration: 2000 });
      onClose();
    } catch (error) {
      toast({ title: "Fehler beim Ändern", status: "error", duration: 3000 });
      console.error(error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent bg="gray.800">
        <ModalHeader>Umgebung ändern</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Neue Umgebung für "{pflanze.name}"</FormLabel>
              <Select 
                placeholder="Umgebung wählen..." 
                value={neueUmgebungId}
                onChange={(e) => setNeueUmgebungId(Number(e.target.value))}
              >
                {umgebungen?.map(umg => (
                  <option key={umg.id} value={umg.id}>{umg.name}</option>
                ))}
              </Select>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>Abbrechen</Button>
          <Button 
            colorScheme="green" 
            onClick={handleSave}
            isDisabled={neueUmgebungId === pflanze.umgebungId} // Deaktiviert, wenn keine Änderung
          >
            Speichern
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}