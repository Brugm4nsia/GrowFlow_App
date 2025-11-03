// In Datei: src/components/Pflanzen/StufeAendernModal.tsx
// VOLLSTÄNDIGER CODE

import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  Button, Text, useToast, VStack, Tag, Icon,
  Flex,
  FormControl, // NEU
  FormLabel, // NEU
  Input, // NEU
} from '@chakra-ui/react';
import { db } from '../../db';
import { IPflanze, PflanzenStadium, PHASEN_REIHENFOLGE } from '../../types';
import { FiArrowRight } from 'react-icons/fi';
import { useState } from 'react'; // NEU

// Helper für Datums-Input (nur YYYY-MM-DD)
const getLokalesDatumString = (datum: Date): string => {
  return datum.toISOString().split('T')[0];
};

interface StufeAendernModalProps {
  isOpen: boolean;
  onClose: () => void;
  pflanze: IPflanze;
}

function getNaechstesStadium(aktuellesStadium: PflanzenStadium): PflanzenStadium | null {
  const aktuellerIndex = PHASEN_REIHENFOLGE.indexOf(aktuellesStadium);
  if (aktuellerIndex < 0 || aktuellerIndex === PHASEN_REIHENFOLGE.length - 1) {
    return null;
  }
  return PHASEN_REIHENFOLGE[aktuellerIndex + 1];
}

export function StufeAendernModal({ isOpen, onClose, pflanze }: StufeAendernModalProps) {
  const toast = useToast();
  
  const naechstesStadium = getNaechstesStadium(pflanze.stadium);
  
  // === HIER IST DIE KORREKTUR ===
  // State für das Datum, Standard ist 'heute'
  const [startDatum, setStartDatum] = useState(getLokalesDatumString(new Date()));
  
  const handleSave = async () => {
    if (!naechstesStadium) {
      toast({ title: "Fehler", description: "Dies ist bereits die letzte Stufe.", status: "error" });
      return;
    }
    
    // Prüfe, ob das Datum gültig ist
    const neuesDatum = new Date(startDatum);
    if (isNaN(neuesDatum.getTime())) {
      toast({ title: "Ungültiges Datum", status: "error" });
      return;
    }

    try {
      await db.pflanzen.update(pflanze.id!, {
        stadium: naechstesStadium,
        phasenDaten: {
          ...pflanze.phasenDaten,
          [naechstesStadium]: neuesDatum, // Verwende das ausgewählte Datum
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
            <Flex align="center" gap={3}>
              <Tag colorScheme="gray" textTransform="capitalize">{pflanze.stadium}</Tag>
              <Icon as={FiArrowRight} />
              {naechstesStadium ? (
                <Tag colorScheme="green" textTransform="capitalize">{naechstesStadium}</Tag>
              ) : (
                <Tag colorScheme="red">Letzte Stufe</Tag>
              )}
            </Flex>
            
            {/* === HIER IST DAS NEUE FELD === */}
            {naechstesStadium && (
              <FormControl isRequired>
                <FormLabel>Startdatum für "{naechstesStadium}"</FormLabel>
                <Input 
                  type="date"
                  value={startDatum}
                  onChange={(e) => setStartDatum(e.target.value)}
                />
              </FormControl>
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