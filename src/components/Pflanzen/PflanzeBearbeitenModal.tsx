// In Datei: src/components/Pflanzen/PflanzeBearbeitenModal.tsx
// VOLLSTÄNDIGER CODE

import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  Button, VStack, FormControl, FormLabel, Input, Select, useToast,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { db } from '../../db';
// === HIER IST DIE KORREKTUR: 'IUmgebung' entfernt ===
import { IPflanze, AnbauMedium } from '../../types';
import { useLiveQuery } from 'dexie-react-hooks';

// Helper für Datums-Input
const getLokalesDatumString = (datum: Date): string => {
  return datum.toISOString().split('T')[0]; // Format YYYY-MM-DD
};

interface PflanzeBearbeitenModalProps {
  isOpen: boolean;
  onClose: () => void;
  pflanze: IPflanze; // Die zu bearbeitende Pflanze
}

export function PflanzeBearbeitenModal({ isOpen, onClose, pflanze }: PflanzeBearbeitenModalProps) {
  const toast = useToast();

  // Lade verfügbare Umgebungen für das Dropdown
  const umgebungen = useLiveQuery(() => db.umgebungen.toArray(), []);

  // === Formular-States ===
  const [name, setName] = useState(pflanze.name);
  const [sorte, setSorte] = useState(pflanze.sorte);
  const [breeder, setBreeder] = useState(pflanze.breeder);
  const [umgebungId, setUmgebungId] = useState(pflanze.umgebungId);
  const [medium, setMedium] = useState(pflanze.medium);
  const [startDatum, setStartDatum] = useState(getLokalesDatumString(pflanze.startDatum));

  useEffect(() => {
    setName(pflanze.name);
    setSorte(pflanze.sorte);
    setBreeder(pflanze.breeder);
    setUmgebungId(pflanze.umgebungId);
    setMedium(pflanze.medium);
    setStartDatum(getLokalesDatumString(pflanze.startDatum));
  }, [pflanze, isOpen]); 

  const handleSave = async () => {
    if (!name || !umgebungId) {
      toast({ title: "Name und Umgebung sind Pflichtfelder.", status: "warning", duration: 2000 });
      return;
    }

    const datum = new Date(startDatum);

    const updates: Partial<IPflanze> = {
      name,
      sorte,
      breeder,
      umgebungId: Number(umgebungId),
      medium,
      startDatum: datum,
      phasenDaten: {
        ...pflanze.phasenDaten,
        [pflanze.stadium]: datum,
      }
    };

    try {
      await db.pflanzen.update(pflanze.id!, updates);
      toast({ title: "Pflanze aktualisiert", status: "success", duration: 2000 });
      onClose();
    } catch (error) {
      toast({ title: "Fehler beim Aktualisieren", status: "error", duration: 3000 });
      console.error(error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent bg="gray.800">
        <ModalHeader>Pflanze bearbeiten: {pflanze.name}</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Name</FormLabel>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel>Umgebung</FormLabel>
              <Select 
                placeholder="Umgebung wählen..." 
                value={umgebungId}
                onChange={(e) => setUmgebungId(Number(e.target.value))}
              >
                {umgebungen?.map(umg => (
                  <option key={umg.id} value={umg.id}>{umg.name}</option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Sorte</FormLabel>
              <Input value={sorte} onChange={(e) => setSorte(e.target.value)} />
            </FormControl>
            
            <FormControl>
              <FormLabel>Breeder</FormLabel>
              <Input value={breeder} onChange={(e) => setBreeder(e.target.value)} />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Medium</FormLabel>
              <Select value={medium} onChange={(e) => setMedium(e.target.value as AnbauMedium)}>
                <option value="erde">Erde</option>
                <option value="kokos">Kokos</option>
                <option value="hydro">Hydro</option>
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Start-Datum (Keimung/Steckling)</FormLabel>
              <Input 
                type="date"
                value={startDatum} 
                onChange={(e) => setStartDatum(e.target.value)}
              />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>Abbrechen</Button>
          <Button colorScheme="green" onClick={handleSave}>
            Speichern
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}