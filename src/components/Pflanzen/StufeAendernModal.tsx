// In Datei: src/components/Pflanzen/StufeAendernModal.tsx
// VOLLSTÄNDIGER CODE

import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  Button, Text, useToast, VStack, Tag, Icon,
  Flex // <-- HIER IST DER FEHLENDE IMPORT
} from '@chakra-ui/react';
import { db } from '../../db';
// 'PHASEN_REIHENFOLGE' wird jetzt korrekt importiert
import { IPflanze, PflanzenStadium, PHASEN_REIHENFOLGE } from '../../types';
import { FiArrowRight } from 'react-icons/fi';

interface StufeAendernModalProps {
  isOpen: boolean;
  onClose: () => void;
  pflanze: IPflanze; 
}

// Findet die nächste Stufe in der Reihenfolge
function getNaechstesStadium(aktuellesStadium: PflanzenStadium): PflanzenStadium | null {
  const aktuellerIndex = PHASEN_REIHENFOLGE.indexOf(aktuellesStadium);
  if (aktuellerIndex < 0 || aktuellerIndex === PHASEN_REIHENFOLGE.length - 1) {
    return null; // Letzte Stufe (oder nicht gefunden)
  }
  return PHASEN_REIHENFOLGE[aktuellerIndex + 1];
}

export function StufeAendernModal({ isOpen, onClose, pflanze }: StufeAendernModalProps) {
  const toast = useToast();
  
  const naechstesStadium = getNaechstesStadium(pflanze.stadium);
  
  const handleSave = async () => {
    if (!naechstesStadium) {
      toast({ title: "Fehler", description: "Dies ist bereits die letzte Stufe.", status: "error" });
      return;
    }

    try {
      const heute = new Date();
      await db.pflanzen.update(pflanze.id!, {
        stadium: naechstesStadium,
        phasenDaten: {
          ...pflanze.phasenDaten,
          [naechstesStadium]: heute,
        }
      });
      
      toast({ title: "Stufe geändert!", status: "success", duration: 2000 });
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
        <ModalHeader>Stufe ändern</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4}>
            <Text>Möchtest du die Stufe von {pflanze.name} wirklich ändern?</Text>
            {/* 'Flex' wird jetzt korrekt gefunden */}
            <Flex align="center" gap={3}>
              <Tag colorScheme="gray" textTransform="capitalize">{pflanze.stadium}</Tag>
              <Icon as={FiArrowRight} />
              {naechstesStadium ? (
                <Tag colorScheme="green" textTransform="capitalize">{naechstesStadium}</Tag>
              ) : (
                <Tag colorScheme="red">Letzte Stufe</Tag>
              )}
            </Flex>
            {naechstesStadium && (
                <Text fontSize="sm" color="gray.400">
                  Das Startdatum für "{naechstesStadium}" wird auf heute gesetzt.
                </Text>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>Abbrechen</Button>
          <Button 
            colorScheme="green" 
            onClick={handleSave}
            isDisabled={!naechstesStadium}
          >
            Bestätigen
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}