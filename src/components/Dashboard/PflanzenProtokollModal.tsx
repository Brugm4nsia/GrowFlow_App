// In Datei: src/components/Dashboard/PflanzenProtokollModal.tsx
// VOLLSTÄNDIGER CODE (mit Dezimal-Fix)

import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  Button, VStack, FormControl, FormLabel, Textarea, Input, useToast,
  CheckboxGroup, Checkbox, Text, Box, Accordion, AccordionItem, AccordionButton,
  AccordionPanel, AccordionIcon, SimpleGrid, NumberInput, NumberInputField,
  Heading,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { db } from '../../db';
import { ILog } from '../../types';
import { useLiveQuery } from 'dexie-react-hooks';

const getLokalesDatumString = (datum: Date): string => {
  const
    jahr = datum.getFullYear(),
    monat = (datum.getMonth() + 1).toString().padStart(2, '0'),
    tag = datum.getDate().toString().padStart(2, '0'),
    stunden = datum.getHours().toString().padStart(2, '0'),
    minuten = datum.getMinutes().toString().padStart(2, '0');
  return `${jahr}-${monat}-${tag}T${stunden}:${minuten}`;
};

// Helper zum sicheren Parsen von Komma/Punkt-Strings
const parseFloatSafe = (val: string | undefined): number | undefined => {
  if (!val) return undefined;
  const num = parseFloat(val.replace(',', '.'));
  return isNaN(num) ? undefined : num;
}

type MesswertEingabe = NonNullable<ILog['messwerte']>;

interface PflanzenProtokollModalProps {
  isOpen: boolean;
  onClose: () => void;
  logToEdit?: ILog;
}

// Definition der Felder und ihrer Präzision
const messwertFelder: { key: keyof MesswertEingabe; label: string; precision: number; step: number; }[] = [
  { key: 'hoehe', label: 'Höhe (cm)', precision: 0, step: 1 },
  { key: 'tds_vorher', label: 'TDS - Vorher (ppm)', precision: 0, step: 10 },
  { key: 'tds_nachher', label: 'TDS - Nachher (ppm)', precision: 0, step: 10 },
  { key: 'ph_vorher', label: 'pH - Vorher', precision: 1, step: 0.1 }, // FIX
  { key: 'ph_nachher', label: 'pH - Nachher', precision: 1, step: 0.1 }, // FIX
  { key: 'ec_vorher', label: 'EC - Vorher', precision: 2, step: 0.1 }, // FIX
  { key: 'ec_nachher', label: 'EC - Nachher', precision: 2, step: 0.1 }, // FIX
  { key: 'wassertemperatur', label: 'Wassertemperatur (°C)', precision: 1, step: 0.5 },
  { key: 'ppfd_pflanze', label: 'PPFD (an Pflanze)', precision: 0, step: 10 },
];

export function PflanzenProtokollModal({ isOpen, onClose, logToEdit }: PflanzenProtokollModalProps) {
  const toast = useToast();
  const isEditMode = !!logToEdit;

  const pflanzen = useLiveQuery(() => db.pflanzen.toArray(), []);
  const umgebungen = useLiveQuery(() => db.umgebungen.toArray(), []);

  const [datum, setDatum] = useState(getLokalesDatumString(new Date()));
  const [notiz, setNotiz] = useState("");
  const [zielIDs, setZielIDs] = useState<string[]>([]);
  const [aktiveMesswerte, setAktiveMesswerte] = useState<string[]>([]);
  
  // === FIX FÜR BUG 1 (Dezimalstellen) ===
  // Wir speichern die Eingaben als Strings
  const [messwertStrings, setMesswertStrings] = useState<{[key: string]: string}>({});
  
  useEffect(() => {
    if (isEditMode && isOpen && logToEdit) {
      const pflanzenZiele = logToEdit.zielPflanzenIds.map((id: number) => `p-${id}`);
      const umgebungZiele = logToEdit.zielUmgebungIds.map((id: number) => `u-${id}`);
      const aktiveWerte = logToEdit.messwerte ? Object.keys(logToEdit.messwerte) : [];

      // Konvertiere Zahlen aus DB in Strings für UI
      const strings: {[key: string]: string} = {};
      if (logToEdit.messwerte) {
        for (const key in logToEdit.messwerte) {
          const k = key as keyof MesswertEingabe;
          strings[k] = logToEdit.messwerte[k] ? String(logToEdit.messwerte[k]) : "";
        }
      }

      setDatum(getLokalesDatumString(logToEdit.datum));
      setNotiz(logToEdit.notiz || "");
      setZielIDs([...pflanzenZiele, ...umgebungZiele]);
      setMesswertStrings(strings); // Lade String-State
      setAktiveMesswerte(aktiveWerte);
    } else {
      resetFormular();
    }
  }, [logToEdit, isEditMode, isOpen]);
  

  const handleZielChange = (neueWerte: (string | number)[]) => {
    setZielIDs(neueWerte.map(val => String(val)));
  };
  const handleAktiveMesswerteChange = (neueWerte: (string | number)[]) => {
     setAktiveMesswerte(neueWerte.map(val => String(val)));
  };
  
  // Speichere die String-Eingabe
  const handleMesswertChange = (key: keyof MesswertEingabe, valueAsString: string) => {
    setMesswertStrings(prev => ({
      ...prev,
      [key]: valueAsString,
    }));
  };
  
  const handleSave = async () => {
    if (!datum) { /* ... */ return; }
    const zielPflanzenIds: number[] = [];
    const zielUmgebungIds: number[] = [];
    zielIDs.forEach(idString => {
      if (idString.startsWith('p-')) zielPflanzenIds.push(Number(idString.replace('p-', '')));
      if (idString.startsWith('u-')) zielUmgebungIds.push(Number(idString.replace('u-', '')));
    });
    if (zielPflanzenIds.length === 0 && zielUmgebungIds.length === 0) { /* ... */ return; }
    
    // Konvertiere Strings zurück in Zahlen für die DB
    const finaleMesswerte: MesswertEingabe = {};
    aktiveMesswerte.forEach(key => {
      const k = key as keyof MesswertEingabe;
      const valNum = parseFloatSafe(messwertStrings[k]);
      if (valNum !== undefined && valNum >= 0) {
        finaleMesswerte[k] = valNum;
      }
    });

    const logDaten: Omit<ILog, 'id'> = {
      typ: 'pflanze',
      datum: new Date(datum),
      notiz: notiz,
      zielPflanzenIds: zielPflanzenIds,
      zielUmgebungIds: zielUmgebungIds,
      messwerte: finaleMesswerte,
    };

    try {
      if (isEditMode) {
        await db.logs.put({ id: logToEdit.id!, ...logDaten });
        toast({ title: "Protokoll aktualisiert", status: "success", duration: 2000 });
      } else {
        await db.logs.add(logDaten as ILog);
        toast({ title: "Protokoll gespeichert", status: "success", duration: 2000 });
      }
      resetFormular();
      onClose();
    } catch (error) {
      console.error("Fehler beim Speichern des Protokolls:", error);
      toast({ title: "Fehler", description: "Protokoll konnte nicht gespeichert werden.", status: "error" });
    }
  };

  const resetFormular = () => {
    setDatum(getLokalesDatumString(new Date()));
    setNotiz("");
    setZielIDs([]);
    setAktiveMesswerte([]);
    setMesswertStrings({}); // String-State zurücksetzen
  };
  const handleClose = () => {
    resetFormular();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="full" trapFocus={false}>
      <ModalOverlay />
      <ModalContent bg="gray.800">
        <ModalHeader>{isEditMode ? 'Pflanzenprotokoll bearbeiten' : 'Neues Pflanzenprotokoll'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody overflowY="auto">
          <VStack spacing={4} align="stretch" pb={24}>
            
            <FormControl isRequired>
              <FormLabel>Für welche Ziele?</FormLabel>
              <CheckboxGroup colorScheme="green" value={zielIDs} onChange={handleZielChange}>
                <Accordion allowMultiple defaultIndex={[0, 1]}>
                  <AccordionItem>
                    <h2><AccordionButton><Box flex="1" textAlign="left" fontWeight="bold">Pflanzen</Box><AccordionIcon /></AccordionButton></h2>
                    <AccordionPanel pb={4}>
                      <VStack align="stretch" pl={4}>
                        {pflanzen?.length ? pflanzen.map(p => (
                          <Checkbox key={p.id} value={`p-${p.id}`}>{p.name}</Checkbox>
                        )) : <Text color="gray.500" fontSize="sm">Keine Pflanzen erstellt.</Text>}
                      </VStack>
                    </AccordionPanel>
                  </AccordionItem>
                  <AccordionItem>
                    <h2><AccordionButton><Box flex="1" textAlign="left" fontWeight="bold">Umgebungen</Box><AccordionIcon /></AccordionButton></h2>
                    <AccordionPanel pb={4}>
                       <VStack align="stretch" pl={4}>
                        {umgebungen?.length ? umgebungen.map(u => (
                          <Checkbox key={u.id} value={`u-${u.id}`}>{u.name}</Checkbox>
                        )) : <Text color="gray.500" fontSize="sm">Keine Umgebungen erstellt.</Text>}
                      </VStack>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              </CheckboxGroup>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Datum & Uhrzeit</FormLabel>
              <Input type="datetime-local" value={datum} onChange={(e) => setDatum(e.target.value)} />
            </FormControl>

            <FormControl>
              <FormLabel>Messungen hinzufügen</FormLabel>
              <CheckboxGroup colorScheme="green" value={aktiveMesswerte} onChange={handleAktiveMesswerteChange}>
                <SimpleGrid columns={2} spacing={2}>
                  {messwertFelder.map(feld => (
                    <Checkbox key={feld.key} value={feld.key}>{feld.label}</Checkbox>
                  ))}
                </SimpleGrid>
              </CheckboxGroup>
            </FormControl>
            
            {aktiveMesswerte.length > 0 && (
              <VStack spacing={4} align="stretch" w="100%" bg="gray.700" p={4} borderRadius="md">
                <Heading size="sm">Messwerte eintragen</Heading>
                <SimpleGrid columns={2} spacing={4}>
                  {messwertFelder
                    .filter(feld => aktiveMesswerte.includes(feld.key))
                    .map(feld => (
                      <FormControl key={feld.key}>
                        <FormLabel>{feld.label}</FormLabel>
                        {/* === FIX FÜR BUG 1 (Dezimalstellen) === */}
                        <NumberInput 
                          value={messwertStrings[feld.key] || ""}
                          onChange={(valStr) => handleMesswertChange(feld.key, valStr)}
                          precision={feld.precision} // Dynamische Präzision
                          step={feld.step}         // Dynamischer Schritt
                        >
                          <NumberInputField />
                        </NumberInput>
                      </FormControl>
                  ))}
                </SimpleGrid>
              </VStack>
            )}

            <FormControl>
              <FormLabel>Notiz (Optional)</FormLabel>
              <Textarea 
                placeholder="Beobachtungen, Besonderheiten..." 
                value={notiz}
                onChange={(e) => setNotiz(e.target.value)}
              />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor="gray.700" bg="gray.800" position="fixed" bottom={0} left={0} right={0} zIndex={1}>
          <Button variant="ghost" mr={3} onClick={handleClose}>Abbrechen</Button>
          <Button colorScheme="green" onClick={handleSave}>Protokoll speichern</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}