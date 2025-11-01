// In Datei: src/components/Einstellungen/WasserprofilErstellenModal.tsx
// VOLLSTÄNDIGER CODE

import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  Button, VStack, FormControl, FormLabel, Input, useToast, SimpleGrid, NumberInput, NumberInputField,
  Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Box,
} from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import { db } from '../../db';
import { IWasserprofil } from '../../types';

interface WasserprofilErstellenModalProps {
  isOpen: boolean;
  onClose: () => void;
  profilToEdit?: IWasserprofil; // NEU: Für Bearbeiten
}

// Helper zum sicheren Umwandeln von Komma/Punkt-Strings
const parseFloatSafe = (val: string | undefined): number => {
  if (!val) return 0;
  return parseFloat(val.replace(',', '.')) || 0;
}

export function WasserprofilErstellenModal({ isOpen, onClose, profilToEdit }: WasserprofilErstellenModalProps) {
  const toast = useToast();
  const initialFocusRef = useRef(null);
  const isEditMode = !!profilToEdit;
  
  // === FIX FÜR BUG 1 (Dezimalstellen) ===
  // Alle Zahlen werden als String im State gehalten
  const [name, setName] = useState("");
  const [beschreibung, setBeschreibung] = useState("");
  const [ecStr, setEcStr] = useState("0");
  const [phStr, setPhStr] = useState("7.0");
  const [khStr, setKhStr] = useState("0");
  const [naehrstoffStrings, setNaehrstoffStrings] = useState<{[key: string]: string}>({});

  // Fülle das Formular, wenn 'profilToEdit' übergeben wird
  useEffect(() => {
    if (isEditMode && isOpen) {
      setName(profilToEdit.name);
      setBeschreibung(profilToEdit.beschreibung || "");
      setEcStr(String(profilToEdit.ec));
      setPhStr(String(profilToEdit.ph));
      setKhStr(String(profilToEdit.kh));
      // Konvertiere Nährstoff-Zahlen zurück in Strings für die UI
      const strings: {[key: string]: string} = {};
      if (profilToEdit.naehrstoffe_mg_l) {
        for (const key in profilToEdit.naehrstoffe_mg_l) {
          const k = key as keyof IWasserprofil['naehrstoffe_mg_l'];
          strings[k] = profilToEdit.naehrstoffe_mg_l[k] ? String(profilToEdit.naehrstoffe_mg_l[k]) : "";
        }
      }
      setNaehrstoffStrings(strings);
    } else {
      resetFormular();
    }
  }, [profilToEdit, isEditMode, isOpen]);
  
  // Helper, um Nährstoff-String-Inputs zu verwalten
  const handleNaehrstoffChange = (key: string, valueAsString: string) => {
    setNaehrstoffStrings(prev => ({
      ...prev,
      [key]: valueAsString
    }));
  };

  const handleSave = async () => {
    // Wandle alle Strings zurück in Zahlen
    const ecNum = parseFloatSafe(ecStr);
    const phNum = parseFloatSafe(phStr);
    const khNum = parseFloatSafe(khStr);

    if (!name || !ecStr || !phStr || !khStr) { // Prüfe ob Strings leer sind
      toast({ title: "Pflichtfelder fehlen", description: "Name, EC, pH und KH sind Pflichtfelder.", status: "warning", duration: 3000 });
      return;
    }

    // Wandle Nährstoff-Strings in Zahlen um
    const finaleNaehrstoffe: IWasserprofil['naehrstoffe_mg_l'] = {};
    (Object.keys(naehrstoffStrings) as Array<keyof typeof finaleNaehrstoffe>).forEach(key => {
      const valNum = parseFloatSafe(naehrstoffStrings[key]);
      if (valNum > 0) {
        finaleNaehrstoffe[key] = valNum;
      }
    });

    const profilDaten: Omit<IWasserprofil, 'id'> = {
      name,
      beschreibung,
      ec: ecNum,
      ph: phNum,
      kh: khNum,
      naehrstoffe_mg_l: finaleNaehrstoffe,
    };

    try {
      if (isEditMode) {
        // === FIX FÜR BUG 2 (Bearbeiten) ===
        await db.wasserprofile.put({ id: profilToEdit.id!, ...profilDaten });
        toast({ title: "Wasserprofil aktualisiert", status: "success", duration: 2000 });
      } else {
        await db.wasserprofile.add(profilDaten as IWasserprofil);
        toast({ title: "Wasserprofil erstellt", status: "success", duration: 2000 });
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
    setEcStr("0");
    setPhStr("7.0");
    setKhStr("0");
    setNaehrstoffStrings({});
  };

  const handleClose = () => {
    onClose();
  };
  
  const makros = ["NO3", "NH4", "P", "K", "Ca", "Mg", "SO4"];
  const mikros = ["Na", "Cl", "Fe", "Mn", "Cu", "Zn", "B", "Mo", "Si"];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" initialFocusRef={initialFocusRef}>
      <ModalOverlay />
      <ModalContent bg="gray.800">
        <ModalHeader>{isEditMode ? 'Wasserprofil bearbeiten' : 'Neues Wasserprofil'}</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Profilname</FormLabel>
              <Input ref={initialFocusRef} value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Leitungswasser (hart)" />
            </FormControl>

            <FormControl>
              <FormLabel>Beschreibung (Optional)</FormLabel>
              <Input value={beschreibung} onChange={(e) => setBeschreibung(e.target.value)} placeholder="Wasseranalyse vom 10.05..." />
            </FormControl>

            {/* === FIX FÜR BUG 1 (Dezimalstellen) === */}
            <SimpleGrid columns={3} spacing={4} w="100%">
              <FormControl isRequired>
                <FormLabel>EC (Ausgang)</FormLabel>
                <NumberInput value={ecStr} onChange={(valStr) => setEcStr(valStr)} precision={2} step={0.1}>
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>pH (Ausgang)</FormLabel>
                <NumberInput value={phStr} onChange={(valStr) => setPhStr(valStr)} precision={1} step={0.1}>
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>KH (Karbonathärte)</FormLabel>
                <NumberInput value={khStr} onChange={(valStr) => setKhStr(valStr)} precision={1} step={0.5}>
                  <NumberInputField />
                </NumberInput>
              </FormControl>
            </SimpleGrid>
            
            <Accordion allowMultiple w="100%">
              <AccordionItem>
                <AccordionButton><Box flex="1" textAlign="left" fontWeight="bold">Makronährstoffe (mg/l)</Box><AccordionIcon /></AccordionButton>
                <AccordionPanel pb={4}>
                  <SimpleGrid columns={3} spacing={4}>
                    {makros.map(n => (
                      <FormControl key={n}>
                        <FormLabel>{n}</FormLabel>
                        <NumberInput 
                          value={naehrstoffStrings[n] || ""}
                          onChange={(valStr) => handleNaehrstoffChange(n, valStr)} 
                          precision={1} step={0.1}
                        >
                          <NumberInputField />
                        </NumberInput>
                      </FormControl>
                    ))}
                  </SimpleGrid>
                </AccordionPanel>
              </AccordionItem>
              <AccordionItem>
                <AccordionButton><Box flex="1" textAlign="left" fontWeight="bold">Mikronährstoffe & Andere (mg/l)</Box><AccordionIcon /></AccordionButton>
                <AccordionPanel pb={4}>
                  <SimpleGrid columns={3} spacing={4}>
                    {mikros.map(n => (
                      <FormControl key={n}>
                        <FormLabel>{n}</FormLabel>
                        <NumberInput 
                          value={naehrstoffStrings[n] || ""}
                          onChange={(valStr) => handleNaehrstoffChange(n, valStr)} 
                          precision={2} step={0.01}
                        >
                          <NumberInputField />
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