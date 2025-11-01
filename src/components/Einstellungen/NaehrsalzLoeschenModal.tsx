// In Datei: src/components/Einstellungen/NaehrsalzLoeschenModal.tsx
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
} from '@chakra-ui/react';
import { useRef } from 'react';
import { db } from '../../db';
import { INaehrsalz } from '../../types';

interface NaehrsalzLoeschenModalProps {
  isOpen: boolean;
  onClose: () => void;
  salzToDelete: INaehrsalz;
}

export function NaehrsalzLoeschenModal({ isOpen, onClose, salzToDelete }: NaehrsalzLoeschenModalProps) {
  const toast = useToast();
  const cancelRef = useRef(null); // Für den Fokus

  const handleDelete = async () => {
    try {
      await db.naehrsalze.delete(salzToDelete.id!);
      toast({
        title: "Nährsalz gelöscht",
        status: "success",
        duration: 2000,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Fehler beim Löschen",
        description: "Das Salz konnte nicht gelöscht werden.",
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
            Nährsalz löschen
          </AlertDialogHeader>

          <AlertDialogBody>
            Bist du sicher, dass du "{salzToDelete.name}" löschen möchtest?
            Dies kann nicht rückgängig gemacht werden.
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose}>
              Abbrechen
            </Button>
            <Button colorScheme="red" onClick={handleDelete} ml={3}>
              Löschen
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
}