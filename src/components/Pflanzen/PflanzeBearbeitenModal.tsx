// In Datei: src/components/Pflanzen/PflanzeBearbeitenModal.tsx
// VOLLSTÄNDIGER CODE

import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  Button, VStack, FormControl, FormLabel, Input, Select, useToast,
  Heading, // NEU
  SimpleGrid, // NEU
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { db } from '../../db';
import { IPflanze, AnbauMedium, PHASEN_REIHENFOLGE, PflanzenStadium } from '../../types';
import { useLiveQuery } from 'dexie-react-hooks';

// Helper für Datums-Input (nur YYYY-MM-DD)
const getLokalesDatumString = (datum: Date | undefined): string => {
  if (!datum) return "";
  // Stelle sicher, dass das Datum als lokales Datum behandelt wird, nicht UTC
  const lokalesDatum = new Date(datum.getTime() - datum.getTimezoneOffset() * 60000);
  return lokalesDatum.toISOString().split('T')[0];
};

interface PflanzeBearbeitenModalProps {
  isOpen: boolean;
  onClose: () => void;
  pflanze: IPflanze;
}

export function PflanzeBearbeitenModal({ isOpen, onClose, pflanze }: PflanzeBearbeitenModalProps) {
  const toast = useToast();
  const umgebungen = useLiveQuery(() => db.umgebungen.toArray(), []);

  // === HIER IST DIE KORREKTUR: States für ALLE Felder ===
  const [name, setName] = useState(pflanze.name);
  const [sorte, setSorte] = useState(pflanze.sorte);
  const [breeder, setBreeder] = useState(pflanze.breeder);
  const [umgebungId, setUmgebungId] = useState(pflanze.umgebungId);
  const [medium, setMedium] = useState(pflanze.medium);
  
  // NEU: Ein State, der alle Phasendaten als Strings speichert
  const [phasenDatenStrings, setPhasenDatenStrings] = useState<{ [key: string]: string }>({});

  // Fülle alle States, wenn das Modal geöffnet wird
  useEffect(() => {
    if (isOpen) {
      setName(pflanze.name);
      setSorte(pflanze.sorte);
      setBreeder(pflanze.breeder);
      setUmgebungId(pflanze.umgebungId);
      setMedium(pflanze.medium);
      
      // Wandle die Datums-Objekte der Pflanze in Strings für die <Input>-Felder um
      const phasenStrings: { [key: string]: string } = {};
      (Object.keys(pflanze.phasenDaten) as PflanzenStadium[]).forEach(phase => {
        phasenStrings[phase] = getLokalesDatumString(pflanze.phasenDaten[phase]);
      });
      setPhasenDatenStrings(phasenStrings);
    }
  }, [pflanze, isOpen]);

  // Handler zum Ändern eines Phasendatums
  const handlePhasenDatumChange = (phase: PflanzenStadium, datumString: string) => {
    setPhasenDatenStrings(prev => ({
      ...prev,
      [phase]: datumString,
    }));
  };

  const handleSave = async () => {
    if (!name || !umgebungId) {
      toast({ title: "Name und Umgebung sind Pflichtfelder.", status: "warning", duration: 2000 });
      return;
    }

    // Wandle die Datums-Strings zurück in Date-Objekte
    const neuePhasenDaten: IPflanze['phasenDaten'] = {};
    let startDatum: Date | undefined = undefined;

    try {
      (Object.keys(phasenDatenStrings) as PflanzenStadium[]).forEach(phase => {
        const datumString = phasenDatenStrings[phase];
        if (datumString) {
          const neuesDatum = new Date(datumString);
          if (isNaN(neuesDatum.getTime())) {
            // Wirft einen Fehler, der im catch-Block gefangen wird
            throw new Error(`Ungültiges Datum für Phase: ${phase}`);
          }
          neuePhasenDaten[phase] = neuesDatum;
          
          // Setze das 'startDatum' (Gesamt-Start) auf das Keimungs-Datum
          if (phase === 'keimung') {
            startDatum = neuesDatum;
          }
        }
      });
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, status: "error" });
      return;
    }
    
    if (!startDatum) {
      toast({ title: "Fehler", description: "Das Keimungs-Datum (Start) darf nicht leer sein.", status: "error" });
      return;
    }

    const updates: Partial<IPflanze> = {
      name,
      sorte,
      breeder,
      umgebungId: Number(umgebungId),
      medium,
      startDatum: startDatum, // Aktualisiere das Haupt-Startdatum
      phasenDaten: neuePhasenDaten, // Aktualisiere ALLE Phasendaten
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
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent bg="gray.800">
        <ModalHeader>Pflanze bearbeiten: {pflanze.name}</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6}>
            {/* --- HAUPTDATEN --- */}
            <VStack spacing={4} align="stretch" w="100%">
              <Heading size="md">Stammdaten</Heading>
              <SimpleGrid columns={2} spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Name</FormLabel>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Umgebung</FormLabel>
                  <Select 
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
              </SimpleGrid>
            </VStack>
            
            {/* === PHASENDATEN (NEU) === */}
            <VStack spacing={4} align="stretch" w="100%">
              <Heading size="md">Phasendaten</Heading>
              <SimpleGrid columns={2} spacing={4}>
                {/* Gehe die offizielle Reihenfolge durch */}
                {PHASEN_REIHENFOLGE.map(phase => {
                  // Zeige das Feld nur an, wenn ein Datum dafür existiert
                  // (oder wenn es die Keimung ist, die immer da sein muss)
                  if (phasenDatenStrings[phase] !== undefined || phase === 'keimung') {
                    return (
                      <FormControl key={phase} isRequired={phase === 'keimung'}>
                        <FormLabel textTransform="capitalize">Start {phase}</FormLabel>
                        <Input 
                          type="date"
                          value={phasenDatenStrings[phase] || ""}
                          onChange={(e) => handlePhasenDatumChange(phase, e.target.value)}
                        />
                      </FormControl>
                    );
                  }
                  return null; // Zeige Phasen, die noch nicht erreicht wurden, nicht an
                })}
              </SimpleGrid>
            </VStack>
            
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