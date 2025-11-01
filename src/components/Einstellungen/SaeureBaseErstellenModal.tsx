// In Datei: src/components/Einstellungen/SaeureBaseErstellenModal.tsx
// VOLLSTÄNDIGER CODE

import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  Button, VStack, FormControl, FormLabel, Input, useToast, SimpleGrid, NumberInput, NumberInputField,
  Select, Box, Text
} from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import { db } from '../../db';
import { ISaeureBase, SaeureBaseTyp } from '../../types';

// === UMRECHNUNGSFAKTOREN (aus NutrientCalculator) ===
const F_P_aus_P2O5 = 0.4364;
const F_K_aus_K2O = 0.830;
const F_N_aus_NO3 = 0.226;
const F_S_aus_SO4 = 0.334;

interface SaeureBaseErstellenModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit?: ISaeureBase;
}

export function SaeureBaseErstellenModal({ isOpen, onClose, itemToEdit }: SaeureBaseErstellenModalProps) {
  const toast = useToast();
  const initialFocusRef = useRef(null);
  const isEditMode = !!itemToEdit;

  const [name, setName] = useState("");
  const [typ, setTyp] = useState<SaeureBaseTyp>("saeure");
  const [dichteStr, setDichteStr] = useState("1.0");
  const [elementName, setElementName] = useState("P2O5_prozent");
  const [elementWertStr, setElementWertStr] = useState("0");
  
  useEffect(() => {
    if (isEditMode && isOpen) {
      setName(itemToEdit.name);
      setTyp(itemToEdit.typ);
      setDichteStr(String(itemToEdit.dichte));
      const elName = Object.keys(itemToEdit.element_prozent)[0] || "P2O5_prozent";
      const elWert = itemToEdit.element_prozent[elName] || 0;
      setElementName(elName);
      setElementWertStr(String(elWert));
    } else {
      resetFormular();
    }
  }, [itemToEdit, isEditMode, isOpen]);


  const handleSave = async () => {
    const dichteNum = parseFloat(dichteStr.replace(',', '.'));
    const wertNum = parseFloat(elementWertStr.replace(',', '.'));

    if (!name || !dichteNum || dichteNum <= 0 || !wertNum || wertNum <= 0) {
      toast({ title: "Angaben unvollständig", description: "Name, Dichte (>0) und Wert (>0) sind Pflichtfelder.", status: "warning", duration: 3000 });
      return;
    }

    const elementProzent = { [elementName]: wertNum };
    
    const reinststoffMgMl: { [key: string]: number } = {};
    const mg_ml_verbindung = 1000 * dichteNum * (wertNum / 100);

    if (elementName === 'P2O5_prozent') {
      reinststoffMgMl['P'] = mg_ml_verbindung * F_P_aus_P2O5;
    } else if (elementName === 'K2O_prozent') {
      reinststoffMgMl['K'] = mg_ml_verbindung * F_K_aus_K2O;
    } else if (elementName === 'NO3_prozent') {
      reinststoffMgMl['N'] = mg_ml_verbindung * F_N_aus_NO3;
    } else if (elementName === 'SO4_prozent') {
      reinststoffMgMl['S'] = mg_ml_verbindung * F_S_aus_SO4;
    }

    const saeureBaseDaten: Omit<ISaeureBase, 'id'> = {
      name,
      typ,
      dichte: dichteNum,
      element_prozent: elementProzent,
      reinststoff_mg_ml: reinststoffMgMl,
    };

    try {
      if (isEditMode) {
        await db.saeurenBasen.put({ id: itemToEdit.id!, ...saeureBaseDaten });
        toast({ title: "Regulator aktualisiert", status: "success", duration: 2000 });
      } else {
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
    setElementName("P2O5_prozent");
    setElementWertStr("0");
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
              
              {/* === FIX FÜR PUNKT 1 (Label) & 2 (Dezimalen) === */}
              <FormControl isRequired>
                <FormLabel>Dichte (g/cm³)</FormLabel>
                <NumberInput 
                  value={dichteStr} 
                  onChange={(valStr) => setDichteStr(valStr)} 
                  precision={2} // Erlaube 2 Dezimalstellen
                  step={0.01}
                >
                  <NumberInputField placeholder="z.B. 1.71" />
                </NumberInput>
              </FormControl>
            </SimpleGrid>

            <Box w="100%" p={4} bg="gray.700" borderRadius="md">
              <Text fontWeight="bold" mb={2}>Enthaltenes Element (für Nährwert)</Text>
              <SimpleGrid columns={2} spacing={4} w="100%">
                <FormControl isRequired>
                  <FormLabel>Element</FormLabel>
                  <Select value={elementName} onChange={(e) => setElementName(e.target.value)}>
                    <option value="P2O5_prozent">P2O5</option>
                    <option value="K2O_prozent">K2O</option>
                    <option value="NO3_prozent">NO3</option>
                    <option value="SO4_prozent">SO4</option>
                  </Select>
                </FormControl>
                
                {/* === FIX FÜR PUNKT 2 (Dezimalen) === */}
                <FormControl isRequired>
                  <FormLabel>Wert (in %)</FormLabel>
                  <NumberInput 
                    value={elementWertStr} 
                    onChange={(valStr) => setElementWertStr(valStr)} 
                    min={0} 
                    max={100}
                    precision={1} // Erlaube 1 Dezimalstelle
                    step={0.1}
                  >
                    <NumberInputField placeholder="z.B. 61.7" />
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