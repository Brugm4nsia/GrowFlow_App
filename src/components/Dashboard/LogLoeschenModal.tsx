// In Datei: src/components/Dashboard/LogLoeschenModal.tsx
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
import { ILog } from '../../types';

interface LogLoeschenModalProps {
  isOpen: boolean;
  onClose: () => void;
  logToDelete: ILog;
}

export function LogLoeschenModal({ isOpen, onClose, logToDelete }: LogLoeschenModalProps) {
  const toast = useToast();
  const cancelRef = useRef(null);

  const handleDelete = async () => {
    try {
      await db.logs.delete(logToDelete.id!);
      
      // TODO: Auch verknüpfte 'Aktion' aktualisieren, falls vorhanden?
      
      toast({
        title: "Protokoll gelöscht",
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
            Protokoll löschen
          </AlertDialogHeader>

          <AlertDialogBody>
            <Text>Bist du sicher, dass du diesen Protokolleintrag vom 
              <strong> {new Date(logToDelete.datum).toLocaleString('de-DE')}</strong> 
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