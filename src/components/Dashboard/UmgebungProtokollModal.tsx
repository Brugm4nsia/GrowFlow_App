// In Datei: src/components/Dashboard/UmgebungProtokollModal.tsx
// VOLLSTÄNDIGER CODE (mit Typ-Fix in handleSave)

import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  Button, VStack, FormControl, FormLabel, Textarea, Input, useToast,
  CheckboxGroup, Checkbox, Text, Box, Accordion, AccordionItem, AccordionButton,
  AccordionPanel, AccordionIcon, SimpleGrid, NumberInput, NumberInputField,
  Heading, Flex, Select,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { db } from '../../db';
import { ILog, PumpenEinheit } from '../../types';
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

const parseFloatSafe = (val: string | undefined): number | undefined => {
  if (!val) return undefined;
  const num = parseFloat(val.replace(',', '.'));
  return isNaN(num) ? undefined : num;
}

type MesswertEingabe = NonNullable<ILog['messwerte']>;

interface UmgebungProtokollModalProps {
  isOpen: boolean;
  onClose: () => void;
  logToEdit?: ILog;
}

const messwertFelder: { key: keyof MesswertEingabe; label: string; precision: number; step: number; }[] = [
  { key: 'luftfeuchtigkeit', label: 'Luftfeuchtigkeit (%)', precision: 1, step: 0.5 },
  { key: 'umgebungstemperatur', label: 'Temperatur (°C)', precision: 1, step: 0.5 },
  { key: 'lichtabstand', label: 'Lichtabstand (cm)', precision: 0, step: 1 },
  { key: 'ppfd_durchschnitt', label: 'Ø PPFD', precision: 0, step: 10 },
  { key: 'vpd', label: 'VPD', precision: 2, step: 0.01 },
];
const pumpenFelder: { key: keyof MesswertEingabe; label: string }[] = [
  { key: 'pumpenintervall_on', label: 'Pumpe ON' },
  { key: 'pumpenintervall_off', label: 'Pumpe OFF' },
];

export function UmgebungProtokollModal({ isOpen, onClose, logToEdit }: UmgebungProtokollModalProps) {
  const toast = useToast();
  const isEditMode = !!logToEdit;

  const pflanzen = useLiveQuery(() => db.pflanzen.toArray(), []);
  const umgebungen = useLiveQuery(() => db.umgebungen.toArray(), []);

  const [datum, setDatum] = useState(getLokalesDatumString(new Date()));
  const [notiz, setNotiz] = useState("");
  const [zielIDs, setZielIDs] = useState<string[]>([]);
  const [aktiveMesswerte, setAktiveMesswerte] = useState<string[]>([]);
  const [messwertStrings, setMesswertStrings] = useState<{[key: string]: string}>({});
  const [pumpeOnEinheit, setPumpeOnEinheit] = useState<PumpenEinheit>('min');
  const [pumpeOffEinheit, setPumpeOffEinheit] = useState<PumpenEinheit>('min');
  
  useEffect(() => {
    if (isEditMode && isOpen && logToEdit) {
      const pflanzenZiele = logToEdit.zielPflanzenIds.map((id: number) => `p-${id}`);
      const umgebungZiele = logToEdit.zielUmgebungIds.map((id: number) => `u-${id}`);
      const aktiveWerte = logToEdit.messwerte ? Object.keys(logToEdit.messwerte) : [];
      
      const strings: {[key: string]: string} = {};
      if (logToEdit.messwerte) {
        for (const key in logToEdit.messwerte) {
          const k = key as keyof MesswertEingabe;
          if (logToEdit.messwerte[k] !== undefined) {
            strings[k] = String(logToEdit.messwerte[k]);
          }
        }
      }

      setDatum(getLokalesDatumString(logToEdit.datum));
      setNotiz(logToEdit.notiz || "");
      setZielIDs([...pflanzenZiele, ...umgebungZiele]);
      setMesswertStrings(strings);
      setAktiveMesswerte(aktiveWerte);
      setPumpeOnEinheit(logToEdit.messwerte?.pumpenintervall_on_einheit || 'min');
      setPumpeOffEinheit(logToEdit.messwerte?.pumpenintervall_off_einheit || 'min');
    } else {
      resetFormular();
    }
  }, [logToEdit, isEditMode, isOpen]);
  

  const handleZielChange = (neueWerte: (string | number)[]) => setZielIDs(neueWerte.map(val => String(val)));
  const handleAktiveMesswerteChange = (neueWerte: (string | number)[]) => setAktiveMesswerte(neueWerte.map(val => String(val)));
  
  const handleMesswertChange = (key: string, valueAsString: string) => {
    setMesswertStrings(prev => ({ ...prev, [key]: valueAsString }));
  };
  
  const handleSave = async () => {
    if (!datum) { /* ... */ return; }
    const zielPflanzenIds: number[] = [];
    const zielUmgebungIds: number[] = [];
    zielIDs.forEach(idString => {
      if (idString.startsWith('p-')) zielPflanzenIds.push(Number(idString.replace('p-', '')));
      if (idString.startsWith('u-')) zielUmgebungIds.push(Number(idString.replace('u-', '')));
    });
    if (zielUmgebungIds.length === 0) {
       toast({ title: "Keine Umgebung ausgewählt", status: "warning", duration: 3000 });
       return;
    }
    
    const finaleMesswerte: MesswertEingabe = {};
    aktiveMesswerte.forEach(key => {
      // Ignoriere die Einheiten-Felder in dieser Schleife
      if (key.endsWith('_einheit')) return; 

      const k = key as keyof MesswertEingabe;
      const valNum = parseFloatSafe(messwertStrings[k]);

      if (valNum !== undefined && valNum >= 0) {
        // === HIER IST DER FIX ===
        // Wir umgehen die strenge Typ-Prüfung, da wir wissen, 
        // dass 'k' hier kein '_einheit'-Feld (String) ist.
        (finaleMesswerte as any)[k] = valNum;
      }
    });
    
    if (aktiveMesswerte.includes('pumpenintervall_on')) {
      finaleMesswerte['pumpenintervall_on_einheit'] = pumpeOnEinheit;
    }
    if (aktiveMesswerte.includes('pumpenintervall_off')) {
      finaleMesswerte['pumpenintervall_off_einheit'] = pumpeOffEinheit;
    }

    const logDaten: Omit<ILog, 'id'> = {
      typ: 'umgebung', datum: new Date(datum), notiz: notiz,
      zielPflanzenIds: zielPflanzenIds, zielUmgebungIds: zielUmgebungIds,
      messwerte: finaleMesswerte,
    };

    try {
      if (isEditMode) {
        await db.logs.put({ id: logToEdit!.id!, ...logDaten });
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
    setMesswertStrings({});
    setPumpeOnEinheit('min');
    setPumpeOffEinheit('min');
  };
  const handleClose = () => {
    resetFormular();
    onClose();
  };
  
  const felderMitPumpe = [...messwertFelder, ...pumpenFelder];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="full" trapFocus={false}>
      <ModalOverlay />
      <ModalContent bg="gray.800">
        <ModalHeader>{isEditMode ? 'Umgebungsprotokoll bearbeiten' : 'Neues Umgebungsprotokoll'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody overflowY="auto">
          <VStack spacing={4} align="stretch" pb={24}>
            
            <FormControl isRequired>
              <FormLabel>Für welche Ziele?</FormLabel>
              <CheckboxGroup colorScheme="green" value={zielIDs} onChange={handleZielChange}>
                <Accordion allowMultiple defaultIndex={[0, 1]}>
                  <AccordionItem>
                    <h2><AccordionButton><Box flex="1" textAlign="left" fontWeight="bold">Umgebungen</Box><AccordionIcon /></AccordionButton></h2>
                    <AccordionPanel pb={4}>
                       <VStack align="stretch" pl={4}>
                        {umgebungen?.length ? umgebungen.map(u => ( <Checkbox key={u.id} value={`u-${u.id}`}>{u.name}</Checkbox> )) : <Text color="gray.500" fontSize="sm">Keine Umgebungen erstellt.</Text>}
                       </VStack>
                    </AccordionPanel>
                  </AccordionItem>
                  <AccordionItem>
                    <h2><AccordionButton><Box flex="1" textAlign="left" fontWeight="bold">Pflanzen (Optional)</Box><AccordionIcon /></AccordionButton></h2>
                    <AccordionPanel pb={4}>
                      <VStack align="stretch" pl={4}>
                        {pflanzen?.length ? pflanzen.map(p => ( <Checkbox key={p.id} value={`p-${p.id}`}>{p.name}</Checkbox> )) : <Text color="gray.500" fontSize="sm">Keine Pflanzen erstellt.</Text>}
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
                  {felderMitPumpe.map(feld => (
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
                        <NumberInput 
                          value={messwertStrings[feld.key] || ""}
                          onChange={(valStr) => handleMesswertChange(feld.key, valStr)}
                          precision={feld.precision}
                          step={feld.step}
                        >
                          <NumberInputField />
                        </NumberInput>
                      </FormControl>
                  ))}
                </SimpleGrid>

                {(aktiveMesswerte.includes('pumpenintervall_on') || aktiveMesswerte.includes('pumpenintervall_off')) && (
                  <VStack align="stretch" spacing={4} pt={4} borderTop="1px" borderColor="gray.600">
                    {aktiveMesswerte.includes('pumpenintervall_on') && (
                      <FormControl>
                        <FormLabel>Pumpe ON</FormLabel>
                        <Flex gap={2}>
                          <NumberInput value={messwertStrings['pumpenintervall_on'] || ""} onChange={(valStr) => handleMesswertChange('pumpenintervall_on', valStr)} precision={0}>
                            <NumberInputField />
                          </NumberInput>
                          <Select w="100px" value={pumpeOnEinheit} onChange={(e) => setPumpeOnEinheit(e.target.value as PumpenEinheit)}>
                            <option value="sek">sek</option>
                            <option value="min">min</option>
                            <option value="h">h</option>
                          </Select>
                        </Flex>
                      </FormControl>
                    )}
                    {aktiveMesswerte.includes('pumpenintervall_off') && (
                      <FormControl>
                        <FormLabel>Pumpe OFF</FormLabel>
                        <Flex gap={2}>
                          <NumberInput value={messwertStrings['pumpenintervall_off'] || ""} onChange={(valStr) => handleMesswertChange('pumpenintervall_off', valStr)} precision={0}>
                            <NumberInputField />
                          </NumberInput>
                          <Select w="100px" value={pumpeOffEinheit} onChange={(e) => setPumpeOffEinheit(e.target.value as PumpenEinheit)}>
                            <option value="sek">sek</option>
                            <option value="min">min</option>
                            <option value="h">h</option>
                          </Select>
                        </Flex>
                      </FormControl>
                    )}
                  </VStack>
                )}
              </VStack>
            )}

            <FormControl>
              <FormLabel>Notiz (Optional)</FormLabel>
              <Textarea placeholder="Beobachtungen, Besonderheiten..." value={notiz} onChange={(e) => setNotiz(e.target.value)} />
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