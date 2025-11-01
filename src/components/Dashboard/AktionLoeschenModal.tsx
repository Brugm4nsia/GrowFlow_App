// In Datei: src/components/Dashboard/AktionLoeschenModal.tsx
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
import { IAktion } from '../../types';

interface AktionLoeschenModalProps {
  isOpen: boolean;
  onClose: () => void;
  aktionToDelete: IAktion;
}

export function AktionLoeschenModal({ isOpen, onClose, aktionToDelete }: AktionLoeschenModalProps) {
  const toast = useToast();
  const cancelRef = useRef(null);

  const handleDelete = async () => {
    try {
      await db.aktionen.delete(aktionToDelete.id!);
      toast({
        title: "Aktion gelöscht",
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
            Aktion löschen
          </AlertDialogHeader>

          <AlertDialogBody>
            <Text>Bist du sicher, dass du die Aktion "{aktionToDelete.typ}" vom 
              <strong> {new Date(aktionToDelete.datum).toLocaleString('de-DE')}</strong> 
            endgültig löschen möchtest?</Text>
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