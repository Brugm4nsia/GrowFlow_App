// In Datei: src/components/Einstellungen/SaeureBaseErstellenModal.tsx
// VOLLSTÄNDIGER CODE

import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  Button, VStack, FormControl, FormLabel, Input, useToast, SimpleGrid, NumberInput, NumberInputField,
  Select, Box, Text
} from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import { db } from '../../db';
import { ISaeureBase, SaeureBaseTyp, SaeureFormel } from '../../types';
// NEU: Importiere den neuen Rechner
import { calculateSaeureReinststoffe } from '../../utils/SaeureCalculator';

interface SaeureBaseErstellenModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit?: ISaeureBase;
}

// NEU: Liste der Formeln für das Dropdown
const formelOptions: { key: SaeureFormel, label: string }[] = [
  { key: 'H3PO4', label: 'H3PO4 (Phosphorsäure)' },
  { key: 'HNO3', label: 'HNO3 (Salpetersäure)' },
  { key: 'H2SO4', label: 'H2SO4 (Schwefelsäure)' },
  { key: 'KOH', label: 'KOH (Kaliumhydroxid)' },
  { key: 'P2O5', label: 'P2O5 (Phosphorpentoxid)' },
];

export function SaeureBaseErstellenModal({ isOpen, onClose, itemToEdit }: SaeureBaseErstellenModalProps) {
  const toast = useToast();
  const initialFocusRef = useRef(null);
  const isEditMode = !!itemToEdit;

  const [name, setName] = useState("");
  const [typ, setTyp] = useState<SaeureBaseTyp>("saeure");
  const [dichteStr, setDichteStr] = useState("1.0");
  const [formel, setFormel] = useState<SaeureFormel>("H3PO4");
  const [konzentrationStr, setKonzentrationStr] = useState("0");
  
  useEffect(() => {
    if (isEditMode && isOpen) {
      setName(itemToEdit.name);
      setTyp(itemToEdit.typ);
      setDichteStr(String(itemToEdit.dichte));
      setFormel(itemToEdit.ch_formel);
      setKonzentrationStr(String(itemToEdit.konzentration));
    } else {
      resetFormular();
    }
  }, [itemToEdit, isEditMode, isOpen]);


  const handleSave = async () => {
    const dichteNum = parseFloat(dichteStr.replace(',', '.'));
    const konzNum = parseFloat(konzentrationStr.replace(',', '.'));

    if (!name || !dichteNum || dichteNum <= 0 || !konzNum || konzNum <= 0) {
      toast({ title: "Angaben unvollständig", description: "Alle Felder müssen > 0 sein.", status: "warning", duration: 3000 });
      return;
    }

    // === NEUE BERECHNUNG (Schritt 2) ===
    const reinststoffMgMl = calculateSaeureReinststoffe(formel, dichteNum, konzNum);

    const saeureBaseDaten: Omit<ISaeureBase, 'id'> = {
      name,
      typ,
      dichte: dichteNum,
      ch_formel: formel,
      konzentration: konzNum,
      reinststoff_mg_ml: reinststoffMgMl,
      isReadOnly: false, // Benutzerdefinierte Einträge sind nie ReadOnly
    };

    try {
      if (isEditMode) {
        await db.saeurenBasen.put({ id: itemToEdit.id!, ...saeureBaseDaten });
        toast({ title: "Regulator aktualisiert", status: "success", duration: 2000 });
      } else {
        // Prüfen, ob der Name bereits existiert (da er jetzt 'unique' ist)
        const exists = await db.saeurenBasen.where('name').equals(name).count();
        if (exists > 0) {
          toast({ title: "Name existiert bereits", description: "Bitte einen eindeutigen Namen wählen.", status: "error", duration: 3000 });
          return;
        }
        await db.saeurenBasen.add(saeureBaseDaten as ISaeureBase);
        toast({ title: "Regulator erstellt", status: "success", duration: 2000 });
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
    setTyp("saeure");
    setDichteStr("1.0");
    setFormel("H3PO4");
    setKonzentrationStr("0");
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" initialFocusRef={initialFocusRef}>
      <ModalOverlay />
      <ModalContent bg="gray.800">
        <ModalHeader>{isEditMode ? 'pH-Regulator bearbeiten' : 'Neuer pH-Regulator'}</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Name</FormLabel>
              <Input ref={initialFocusRef} value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. pH- Blüte (Phosphorsäure)" />
            </FormControl>

            <SimpleGrid columns={2} spacing={4} w="100%">
              <FormControl isRequired>
                <FormLabel>Typ</FormLabel>
                <Select value={typ} onChange={(e) => setTyp(e.target.value as SaeureBaseTyp)}>
                  <option value="saeure">Säure (pH Down)</option>
                  <option value="base">Base (pH Up)</option>
                </Select>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Dichte (g/cm³)</FormLabel>
                <NumberInput 
                  value={dichteStr} 
                  onChange={(valStr) => setDichteStr(valStr)} 
                  precision={3} 
                  step={0.1}
                >
                  <NumberInputField placeholder="z.B. 1.685" />
                </NumberInput>
              </FormControl>
            </SimpleGrid>

            <Box w="100%" p={4} bg="gray.700" borderRadius="md">
              <Text fontWeight="bold" mb={2}>Enthaltenes Element (zur Berechnung)</Text>
              <SimpleGrid columns={2} spacing={4} w="100%">
                {/* === FIX FÜR BUG 1 (UI) === */}
                <FormControl isRequired>
                  <FormLabel>Chem. Formel</FormLabel>
                  <Select value={formel} onChange={(e) => setFormel(e.target.value as SaeureFormel)}>
                    {formelOptions.map(opt => (
                      <option key={opt.key} value={opt.key}>{opt.label}</option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Konzentration (in %)</FormLabel>
                  <NumberInput 
                    value={konzentrationStr} 
                    onChange={(valStr) => setKonzentrationStr(valStr)} 
                    min={0} 
                    max={100}
                    precision={1}
                    step={0.1}
                  >
                    <NumberInputField placeholder="z.B. 85" />
                  </NumberInput>
                </FormControl>
              </SimpleGrid>
            </Box>
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