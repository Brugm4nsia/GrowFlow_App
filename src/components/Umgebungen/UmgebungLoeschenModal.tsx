// In Datei: src/components/Umgebungen/UmgebungLoeschenModal.tsx
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
  Text,
  VStack,
} from '@chakra-ui/react';
import { useRef } from 'react';
import { db } from '../../db';
import { IUmgebung } from '../../types';

interface UmgebungLoeschenModalProps {
  isOpen: boolean;
  onClose: () => void;
  umgebungToDelete: IUmgebung;
}

export function UmgebungLoeschenModal({ isOpen, onClose, umgebungToDelete }: UmgebungLoeschenModalProps) {
  const toast = useToast();
  const cancelRef = useRef(null);

  const handleDelete = async () => {
    try {
      // Prüfe, ob noch Pflanzen in der Umgebung sind
      const pflanzenInUmgebung = await db.pflanzen.where('umgebungId').equals(umgebungToDelete.id!).count();
      
      if (pflanzenInUmgebung > 0) {
        toast({
          title: "Löschen nicht möglich",
          description: `Es befinden sich noch ${pflanzenInUmgebung} Pflanze(n) in dieser Umgebung.`,
          status: "error",
          duration: 5000,
        });
        onClose();
        return;
      }
      
      // Lösche die Umgebung
      await db.umgebungen.delete(umgebungToDelete.id!);
      
      toast({
        title: "Umgebung gelöscht",
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
            Umgebung löschen
          </AlertDialogHeader>

          <AlertDialogBody>
            <VStack>
              <Text>Bist du sicher, dass du "{umgebungToDelete.name}" löschen möchtest?</Text>
              <Text color="gray.400" fontSize="sm">
                Dies ist nur möglich, wenn sich keine Pflanzen mehr in der Umgebung befinden.
              </Text>
            </VStack>
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