// In Datei: src/components/Pflanzen/PflanzeStatusAendernModal.tsx
// VOLLSTÄNDIGER CODE

import {
  AlertDialog, // Wichtig: AlertDialog für Bestätigungen
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
  useToast,
  Tag,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useRef } from 'react';
import { db } from '../../db';
import { IPflanze, PflanzenStatus } from '../../types';
import { useNavigate } from 'react-router-dom';

interface PflanzeStatusAendernModalProps {
  isOpen: boolean;
  onClose: () => void;
  pflanze: IPflanze;
  neuerStatus: PflanzenStatus; // z.B. 'tot' oder 'geoerntet'
}

export function PflanzeStatusAendernModal(
  { isOpen, onClose, pflanze, neuerStatus }: PflanzeStatusAendernModalProps
) {
  const toast = useToast();
  const navigate = useNavigate();
  const cancelRef = useRef(null);
  
  const handleConfirm = async () => {
    try {
      await db.pflanzen.update(pflanze.id!, { status: neuerStatus });
      
      toast({ 
        title: `Pflanze als ${neuerStatus} markiert`, 
        status: "success", 
        duration: 2000 
      });
      onClose();
      navigate('/pflanzen'); // Zurück zur Pflanzen-Übersicht
    } catch (error) {
      toast({ title: "Fehler", status: "error", duration: 3000 });
      console.error(error);
    }
  };
  
  const colorScheme = neuerStatus === 'tot' ? 'red' : 'yellow';

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
      isCentered
    >
      <AlertDialogOverlay>
        <AlertDialogContent bg="gray.800">
          <AlertDialogHeader>Status ändern</AlertDialogHeader>

          <AlertDialogBody>
            <VStack spacing={4}>
              <Text>Möchtest du "{pflanze.name}" wirklich als 
                <Tag colorScheme={colorScheme} mx={2}>
                  {neuerStatus}
                </Tag> 
              markieren?</Text>
              <Text fontSize="sm" color="gray.400">
                Die Pflanze wird archiviert und das Protokoll bleibt erhalten.
              </Text>
            </VStack>
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose}>
              Abbrechen
            </Button>
            <Button 
              colorScheme={colorScheme} 
              onClick={handleConfirm}
              ml={3}
            >
              Bestätigen
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
}