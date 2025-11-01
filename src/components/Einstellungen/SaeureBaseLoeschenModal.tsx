// In Datei: src/components/Einstellungen/SaeureBaseLoeschenModal.tsx
// VOLLSTÄNDIGER CODE (FEHLENDE DATEI)

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
import { ISaeureBase } from '../../types';

interface SaeureBaseLoeschenModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToDelete: ISaeureBase;
}

export function SaeureBaseLoeschenModal({ isOpen, onClose, itemToDelete }: SaeureBaseLoeschenModalProps) {
  const toast = useToast();
  const cancelRef = useRef(null);

  const handleDelete = async () => {
    try {
      await db.saeurenBasen.delete(itemToDelete.id!);
      toast({
        title: "Regulator gelöscht",
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
            Regulator löschen
          </AlertDialogHeader>

          <AlertDialogBody>
            Bist du sicher, dass du "{itemToDelete.name}" löschen möchtest?
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