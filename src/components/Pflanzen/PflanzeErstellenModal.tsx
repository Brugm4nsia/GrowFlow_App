// In Datei: src/components/Pflanzen/PflanzeErstellenModal.tsx
// VOLLSTÄNDIGER CODE

import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  Button, VStack, FormControl, FormLabel, Input, Select, useToast, Text
} from '@chakra-ui/react';
import { useState } from 'react';
import { db } from '../../db';
import { IPflanze, AnbauMedium } from '../../types';
import { useLiveQuery } from 'dexie-react-hooks'; 

const getLokalesDatumString = (datum: Date): string => {
  return datum.toISOString().split('T')[0];
};

interface PflanzeErstellenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PflanzeErstellenModal({ isOpen, onClose }: PflanzeErstellenModalProps) {
  const toast = useToast();
  const umgebungen = useLiveQuery(() => db.umgebungen.toArray(), []);

  const [name, setName] = useState("");
  const [sorte, setSorte] = useState("");
  const [breeder, setBreeder] = useState("");
  const [umgebungId, setUmgebungId] = useState<number | undefined>(undefined);
  const [medium, setMedium] = useState<AnbauMedium>("erde");
  const [startDatum, setStartDatum] = useState(getLokalesDatumString(new Date()));

  const handleSave = async () => {
    if (!name || !umgebungId || !startDatum) {
      toast({ title: "Name, Umgebung und Startdatum sind Pflichtfelder.", status: "warning", duration: 2000 });
      return;
    }
    const datum = new Date(startDatum);

    const neuePflanze: IPflanze = {
      name,
      sorte,
      breeder,
      umgebungId: Number(umgebungId),
      medium,
      startDatum: datum,
      stadium: 'keimung',
      status: 'aktiv', // <-- HIER IST DIE ÄNDERUNG
      phasenDaten: {
        keimung: datum, 
      },
    };

    try {
      await db.pflanzen.add(neuePflanze);
      toast({ title: "Pflanze erstellt", status: "success", duration: 2000 });
      resetFormular();
      onClose();
    } catch (error) {
      toast({ title: "Fehler beim Erstellen", status: "error", duration: 3000 });
      console.error(error);
    }
  };

  const resetFormular = () => {
    setName("");
    setSorte("");
    setBreeder("");
    setUmgebungId(undefined);
    setMedium("erde");
    setStartDatum(getLokalesDatumString(new Date()));
  };

  const handleClose = () => {
    resetFormular();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalOverlay />
      <ModalContent bg="gray.800">
        <ModalHeader>Neue Pflanze erstellen</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Name</FormLabel>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Mutti #1" />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Umgebung</FormLabel>
              <Select 
                placeholder="Umgebung wählen..." 
                value={umgebungId || ""}
                onChange={(e) => setUmgebungId(Number(e.target.value))}
              >
                {umgebungen?.map(umg => (
                  <option key={umg.id} value={umg.id}>{umg.name}</option>
                ))}
              </Select>
              {!umgebungen?.length && <Text fontSize="sm" color="yellow.400" mt={2}>Bitte erst eine Umgebung erstellen.</Text>}
            </FormControl>
            <FormControl>
              <FormLabel>Sorte</FormLabel>
              <Input value={sorte} onChange={(e) => setSorte(e.target.value)} placeholder="z.B. Northern Lights" />
            </FormControl>
            <FormControl>
              <FormLabel>Breeder</FormLabel>
              <Input value={breeder} onChange={(e) => setBreeder(e.target.value)} placeholder="z.B. Sensi Seeds" />
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
          <Button variant="ghost" mr={3} onClick={handleClose}>Abbrechen</Button>
          <Button colorScheme="green" onClick={handleSave} isDisabled={!umgebungen?.length}>
            Speichern
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}