// In Datei: src/components/Einstellungen/NaehrsalzErstellenModal.tsx
// VOLLSTÄNDIGER CODE

import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  Button, VStack, FormControl, FormLabel, Input, useToast, SimpleGrid, NumberInput, NumberInputField,
  Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Box,
} from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import { db } from '../../db';
import { INaehrsalz } from '../../types';

interface NaehrsalzErstellenModalProps {
  isOpen: boolean;
  onClose: () => void;
  salzToEdit?: INaehrsalz;
}

// === KORREKTUR: Labels für N-Felder geändert ===
const makroFelder: { key: keyof INaehrsalz['inhaltsstoffe'], label: string }[] = [
  { key: "NH4_prozent", label: "N-NH4 (%)" },
  { key: "NO3_prozent", label: "N-NO3 (%)" },
  { key: "P2O5_prozent", label: "P2O5 (%)" },
  { key: "K2O_prozent", label: "K2O (%)" },
  { key: "CaO_prozent", label: "CaO (%)" },
  { key: "MgO_prozent", label: "MgO (%)" },
  { key: "SO4_prozent", label: "SO4 (%)" },
  { key: "SO3_prozent", label: "SO3 (%)" },
  { key: "SiO_prozent", label: "SiO (%)" }
];
const mikroFelder: { key: keyof INaehrsalz['inhaltsstoffe'], label: string }[] = [
  { key: "Fe_prozent", label: "Fe (%)" },
  { key: "Mn_prozent", label: "Mn (%)" },
  { key: "Cu_prozent", label: "Cu (%)" },
  { key: "Zn_prozent", label: "Zn (%)" },
  { key: "B_prozent", label: "B (%)" },
  { key: "Mo_prozent", label: "Mo (%)" }
];


export function NaehrsalzErstellenModal({ isOpen, onClose, salzToEdit }: NaehrsalzErstellenModalProps) {
  const toast = useToast();
  const initialFocusRef = useRef(null);
  const isEditMode = !!salzToEdit;

  const [name, setName] = useState("");
  const [beschreibung, setBeschreibung] = useState("");
  const [inhaltsstoffeStrings, setInhaltsstoffeStrings] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (isEditMode && isOpen) {
      setName(salzToEdit.name);
      setBeschreibung(salzToEdit.beschreibung || "");
      const strings: {[key: string]: string} = {};
      if (salzToEdit.inhaltsstoffe) {
        for (const key in salzToEdit.inhaltsstoffe) {
          const k = key as keyof INaehrsalz['inhaltsstoffe'];
          strings[k] = salzToEdit.inhaltsstoffe[k] ? String(salzToEdit.inhaltsstoffe[k]) : "";
        }
      }
      setInhaltsstoffeStrings(strings);
    } else {
      resetFormular();
    }
  }, [salzToEdit, isEditMode, isOpen]);

  const handleProzentChange = (key: keyof INaehrsalz['inhaltsstoffe'], valueAsString: string) => {
    setInhaltsstoffeStrings(prev => ({
      ...prev,
      [key]: valueAsString
    }));
  };

  const handleSave = async () => {
    if (!name) {
      toast({ title: "Name fehlt", status: "warning", duration: 2000 });
      return;
    }

    const finaleInhaltsstoffe: INaehrsalz['inhaltsstoffe'] = {};
    (Object.keys(inhaltsstoffeStrings) as Array<keyof typeof finaleInhaltsstoffe>).forEach(key => {
      const valString = inhaltsstoffeStrings[key]?.replace(',', '.');
      const valNum = parseFloat(valString);
      if (!isNaN(valNum) && valNum > 0) {
        finaleInhaltsstoffe[key] = valNum;
      }
    });

    const salzDaten: Omit<INaehrsalz, 'id'> = {
      name,
      beschreibung,
      inhaltsstoffe: finaleInhaltsstoffe,
    };

    try {
      if (isEditMode) {
        await db.naehrsalze.update(salzToEdit.id!, salzDaten);
        toast({ title: "Nährsalz aktualisiert", status: "success", duration: 2000 });
      } else {
        await db.naehrsalze.add(salzDaten as INaehrsalz);
        toast({ title: "Nährsalz erstellt", status: "success", duration: 2000 });
      }
      resetFormular();
      onClose();
    } catch (error) {
      toast({ title: "Fehler beim Speichern", status: "error", duration: 3000 });
      console.error(error);
    }
  };

  const resetFormular = () => {
    setName("");
    setBeschreibung("");
    setInhaltsstoffeStrings({});
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" scrollBehavior="inside" initialFocusRef={initialFocusRef}>
      <ModalOverlay />
      <ModalContent bg="gray.800">
        <ModalHeader>{isEditMode ? 'Nährsalz bearbeiten' : 'Neues Nährsalz'}</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Name des Salzes</FormLabel>
              <Input ref={initialFocusRef} value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Kaliumnitrat (KNO3)" />
            </FormControl>

            <FormControl>
              <FormLabel>Beschreibung (Optional)</FormLabel>
              <Input value={beschreibung} onChange={(e) => setBeschreibung(e.target.value)} placeholder="Hersteller, Notizen..." />
            </FormControl>
            
            <Accordion allowMultiple w="100%" defaultIndex={[0, 1]}>
              <AccordionItem>
                <AccordionButton>
                  <Box flex="1" textAlign="left" fontWeight="bold">Makronährstoffe</Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <SimpleGrid columns={3} spacing={4}>
                    {makroFelder.map(feld => (
                      <FormControl key={feld.key}>
                        <FormLabel>{feld.label}</FormLabel>
                        <NumberInput 
                          onChange={(valueAsString) => handleProzentChange(feld.key, valueAsString)}
                          precision={1}
                          step={0.1}
                          value={inhaltsstoffeStrings[feld.key] || ""}
                        >
                          <NumberInputField placeholder="z.B. 13.5" />
                        </NumberInput>
                      </FormControl>
                    ))}
                  </SimpleGrid>
                </AccordionPanel>
              </AccordionItem>
              
              <AccordionItem>
                <AccordionButton>
                  <Box flex="1" textAlign="left" fontWeight="bold">Mikronährstoffe</Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <SimpleGrid columns={3} spacing={4}>
                    {mikroFelder.map(feld => (
                      <FormControl key={feld.key}>
                        <FormLabel>{feld.label}</FormLabel>
                        <NumberInput 
                          onChange={(valueAsString) => handleProzentChange(feld.key, valueAsString)}
                          precision={3}
                          step={0.001}
                          value={inhaltsstoffeStrings[feld.key] || ""}
                        >
                          <NumberInputField placeholder="z.B. 0.205" />
                        </NumberInput>
                      </FormControl>
                    ))}
                  </SimpleGrid>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>Abbrechen</Button>
          <Button colorScheme="green" onClick={handleSave}>Speichern</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}