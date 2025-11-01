// In Datei: src/components/Pflanzen/PflanzeLoeschenModal.tsx
// VOLLSTÄNDIGER CODE

import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
  useToast,
  Text,
} from '@chakra-ui/react';
import { useRef } from 'react';
import { db } from '../../db';
import { IPflanze } from '../../types';
import { useNavigate } from 'react-router-dom';

interface PflanzeLoeschenModalProps {
  isOpen: boolean;
  onClose: () => void;
  pflanze: IPflanze;
}

export function PflanzeLoeschenModal({ isOpen, onClose, pflanze }: PflanzeLoeschenModalProps) {
  const toast = useToast();
  const navigate = useNavigate();
  const cancelRef = useRef(null);

  const handleDelete = async () => {
    try {
      // 1. Lösche die Pflanze selbst
      await db.pflanzen.delete(pflanze.id!);
      
      // 2. TODO: (Optional) Lösche alle zugehörigen Logs und Aktionen
      // await db.logs.where('zielPflanzenIds').equals(pflanze.id!).delete();
      // await db.aktionen.where('zielPflanzenIds').equals(pflanze.id!).delete();

      toast({
        title: "Pflanze endgültig gelöscht",
        status: "success",
        duration: 2000,
      });
      onClose();
      navigate('/pflanzen'); // Zurück zur Übersicht
    } catch (error) {
      toast({
        title: "Fehler beim Löschen",
        status: "error",
        duration: 3000,
      });
      console.error(error);
    }
  };

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
      isCentered
    >
      <AlertDialogOverlay>
        <AlertDialogContent bg="gray.800">
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            Pflanze endgültig löschen
          </AlertDialogHeader>

          <AlertDialogBody>
            <Text>Bist du sicher, dass du "{pflanze.name}" **endgültig** löschen möchtest?</Text>
            <Text color="red.300" mt={2} fontWeight="bold">
              Alle zugehörigen Protokolle gehen verloren. Diese Aktion kann nicht rückgängig gemacht werden.
            </Text>
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose}>
              Abbrechen
            </Button>
            <Button colorScheme="red" onClick={handleDelete} ml={3}>
              Endgültig löschen
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
}