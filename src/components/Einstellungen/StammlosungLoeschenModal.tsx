// In Datei: src/components/Einstellungen/StammlosungLoeschenModal.tsx
// VOLLSTÄNDIGER CODE (Diese Datei hat gefehlt)

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
import { IStammlosung } from '../../types';

interface StammlosungLoeschenModalProps {
  isOpen: boolean;
  onClose: () => void;
  rezeptToDelete: IStammlosung; // Geänderter Typ
}

export function StammlosungLoeschenModal({ isOpen, onClose, rezeptToDelete }: StammlosungLoeschenModalProps) {
  const toast = useToast();
  const cancelRef = useRef(null);

  const handleDelete = async () => {
    try {
      // Geänderte Datenbank-Tabelle
      await db.stammlosungen.delete(rezeptToDelete.id!);
      toast({
        title: "Rezept gelöscht",
        status: "success",
        duration: 2000,
      });
      onClose();
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
            Rezept löschen
          </AlertDialogHeader>

          <AlertDialogBody>
            Bist du sicher, dass du "{rezeptToDelete.name}" löschen möchtest?
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