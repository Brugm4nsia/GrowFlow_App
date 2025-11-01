// In Datei: src/components/Umgebungen/UmgebungErstellenModal.tsx
// VOLLSTÄNDIGER CODE

import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  Button, VStack, FormControl, FormLabel, Input, Select, useToast, NumberInput,
  NumberInputField, SimpleGrid,
} from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react'; // useEffect/useRef hinzugefügt
import { db } from '../../db';
import { IUmgebung, UmgebungsArt } from '../../types';

interface UmgebungErstellenModalProps {
  isOpen: boolean;
  onClose: () => void;
  umgebungToEdit?: IUmgebung; // NEU: Für Bearbeiten
}

// Helper zum sicheren Parsen von Zahlen
const parseFloatSafe = (val: string | undefined): number => {
  if (!val) return 0;
  return parseFloat(val.replace(',', '.')) || 0;
}

export function UmgebungErstellenModal({ isOpen, onClose, umgebungToEdit }: UmgebungErstellenModalProps) {
  const toast = useToast();
  const initialFocusRef = useRef(null);
  const isEditMode = !!umgebungToEdit;
  
  // States für alle Formularfelder (jetzt auch Strings für NumberInputs)
  const [name, setName] = useState("");
  const [art, setArt] = useState<UmgebungsArt>("innen");
  const [lichter, setLichter] = useState("");
  const [belichtungszeitStr, setBelichtungszeitStr] = useState("18");
  const [laengeStr, setLaengeStr] = useState("0");
  const [breiteStr, setBreiteStr] = useState("0");
  const [hoeheStr, setHoeheStr] = useState("0");

  // Fülle das Formular, wenn 'umgebungToEdit' übergeben wird
  useEffect(() => {
    if (isEditMode && isOpen) {
      setName(umgebungToEdit.name);
      setArt(umgebungToEdit.art);
      setLichter(umgebungToEdit.lichter || "");
      setBelichtungszeitStr(String(umgebungToEdit.belichtungszeit || 18));
      setLaengeStr(String(umgebungToEdit.maße?.laenge || 0));
      setBreiteStr(String(umgebungToEdit.maße?.breite || 0));
      setHoeheStr(String(umgebungToEdit.maße?.hoehe || 0));
    } else {
      resetFormular();
    }
  }, [umgebungToEdit, isEditMode, isOpen]);


  const handleSave = async () => {
    if (!name) {
      toast({ title: "Name fehlt", status: "warning", duration: 2000 });
      return;
    }

    // Wandle Strings zurück in Zahlen
    const belichtungszeit = parseInt(belichtungszeitStr, 10) || 0;
    const laenge = parseFloatSafe(laengeStr);
    const breite = parseFloatSafe(breiteStr);
    const hoehe = parseFloatSafe(hoeheStr);

    const umgebungDaten: Omit<IUmgebung, 'id'> = {
      name,
      art,
      lichter: lichter || undefined,
      belichtungszeit: belichtungszeit > 0 ? belichtungszeit : undefined,
      maße: (laenge > 0 && breite > 0) ? { laenge, breite, hoehe } : undefined,
    };

    try {
      if (isEditMode) {
        // Verwende .put() zum Aktualisieren
        await db.umgebungen.put({ id: umgebungToEdit.id!, ...umgebungDaten });
        toast({ title: "Umgebung aktualisiert", status: "success", duration: 2000 });
      } else {
        await db.umgebungen.add(umgebungDaten as IUmgebung);
        toast({ title: "Umgebung erstellt", status: "success", duration: 2000 });
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
    setArt("innen");
    setLichter("");
    setBelichtungszeitStr("18");
    setLaengeStr("0");
    setBreiteStr("0");
    setHoeheStr("0");
  };

  const handleClose = () => {
    // Nicht zurücksetzen, damit Bearbeitungsdaten bei Klick daneben nicht verloren gehen
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} initialFocusRef={initialFocusRef}>
      <ModalOverlay />
      <ModalContent bg="gray.800">
        <ModalHeader>{isEditMode ? 'Umgebung bearbeiten' : 'Neue Umgebung erstellen'}</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Name</FormLabel>
              <Input 
                ref={initialFocusRef}
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Zelt 1 (Wachstum)"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Art</FormLabel>
              <Select value={art} onChange={(e) => setArt(e.target.value as UmgebungsArt)}>
                <option value="innen">Innen</option>
                <option value="aussen">Außen</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Lichter</FormLabel>
              <Input 
                value={lichter} 
                onChange={(e) => setLichter(e.target.value)}
                placeholder="z.B. SANlight Q5W"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Belichtungszeit (Stunden)</FormLabel>
              <NumberInput value={belichtungszeitStr} onChange={(valStr) => setBelichtungszeitStr(valStr)} min={0} max={24} step={1}>
                <NumberInputField />
              </NumberInput>
            </FormControl>

            <FormLabel>Maße (Optional, in cm)</FormLabel>
            <SimpleGrid columns={3} spacing={2}>
              <NumberInput value={laengeStr} onChange={(valStr) => setLaengeStr(valStr)} min={0} precision={0}>
                <NumberInputField placeholder="Länge" />
              </NumberInput>
              <NumberInput value={breiteStr} onChange={(valStr) => setBreiteStr(valStr)} min={0} precision={0}>
                <NumberInputField placeholder="Breite" />
              </NumberInput>
              <NumberInput value={hoeheStr} onChange={(valStr) => setHoeheStr(valStr)} min={0} precision={0}>
                <NumberInputField placeholder="Höhe" />
              </NumberInput>
            </SimpleGrid>
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