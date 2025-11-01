// In Datei: src/components/Einstellungen/WasserprofilLoeschenModal.tsx
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
import { IWasserprofil } from '../../types';

interface WasserprofilLoeschenModalProps {
  isOpen: boolean;
  onClose: () => void;
  profilToDelete: IWasserprofil;
}

export function WasserprofilLoeschenModal({ isOpen, onClose, profilToDelete }: WasserprofilLoeschenModalProps) {
  const toast = useToast();
  const cancelRef = useRef(null);

  const handleDelete = async () => {
    try {
      await db.wasserprofile.delete(profilToDelete.id!);
      toast({
        title: "Wasserprofil gelöscht",
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
            Profil löschen
          </AlertDialogHeader>

          <AlertDialogBody>
            Bist du sicher, dass du "{profilToDelete.name}" löschen möchtest?
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