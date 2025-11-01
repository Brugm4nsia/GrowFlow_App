// In Datei: src/components/Dashboard/AktionErstellenModal.tsx
// VOLLSTÄNDIGER CODE

import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  Button, VStack, FormControl, FormLabel, Select, Textarea, Input, useToast,
  CheckboxGroup, Checkbox, Text, Box, Accordion, AccordionItem, AccordionButton,
  AccordionPanel, AccordionIcon, NumberInput, NumberInputField, SimpleGrid,
  IconButton, Flex, Heading,
} from '@chakra-ui/react';
import { FiPlus, FiTrash } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { db } from '../../db';
import { IAktion, ZutatTyp, EndloesungErgebnis, TrainingTyp, BeschneidenTyp } from '../../types';
import { useLiveQuery } from 'dexie-react-hooks';
import { calculateFinalSolution } from '../../utils/NutrientCalculator';

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

interface AktionErstellenModalProps {
  isOpen: boolean;
  onClose: () => void;
  aktionToEdit?: IAktion;
}

type ZutatEingabe = {
  id: string;
  typ: ZutatTyp;
  zutatId?: number;
  mengeStr?: string;
};

const trainingOptions: { key: TrainingTyp; label: string }[] = [
  { key: 'lst', label: 'LST (Low Stress Training)' },
  { key: 'fim', label: 'FIM (F*ck I Missed)' },
  { key: 'scrog', label: 'SCROG (Screen of Green)' },
  { key: 'supercropping', label: 'Supercropping' },
  { key: 'topping', label: 'Topping' },
];
const beschneidenOptions: { key: BeschneidenTyp; label: string }[] = [
  { key: 'topping', label: 'Topping' },
  { key: 'fim', label: 'FIM' },
  { key: 'entlaubung', label: 'Entlaubung' },
  { key: 'lollipopping', label: 'Lollipopping' },
  { key: 'untere_aeste', label: 'Untere Äste entfernen' },
];

export function AktionErstellenModal({ isOpen, onClose, aktionToEdit }: AktionErstellenModalProps) {
  const toast = useToast();
  const isEditMode = !!aktionToEdit;

  const pflanzen = useLiveQuery(() => db.pflanzen.toArray(), []);
  const umgebungen = useLiveQuery(() => db.umgebungen.toArray(), []);
  const wasserprofile = useLiveQuery(() => db.wasserprofile.toArray(), []);
  const naehrsalze = useLiveQuery(() => db.naehrsalze.toArray(), []);
  const saeurenBasen = useLiveQuery(() => db.saeurenBasen.toArray(), []);
  const stammlosungen = useLiveQuery(() => db.stammlosungen.toArray(), []);

  // === STATES ===
  const [typ, setTyp] = useState<IAktion['typ'] | undefined>(undefined);
  const [datum, setDatum] = useState(getLokalesDatumString(new Date()));
  const [notiz, setNotiz] = useState("");
  const [zielIDs, setZielIDs] = useState<string[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  // Detail-States
  const [mengeLStr, setMengeLStr] = useState<string>("1.0");
  const [wasserProfilId, setWasserProfilId] = useState<number | undefined>(undefined);
  const [zutatEingaben, setZutatEingaben] = useState<ZutatEingabe[]>([]);
  const [trainingTyp, setTrainingTyp] = useState<TrainingTyp | undefined>(undefined);
  const [beschneidenTyp, setBeschneidenTyp] = useState<BeschneidenTyp | undefined>(undefined);

  
  useEffect(() => {
    if (isEditMode && isOpen && aktionToEdit) {
      const pflanzenZiele = aktionToEdit.zielPflanzenIds.map((id: number) => `p-${id}`);
      const umgebungZiele = aktionToEdit.zielUmgebungIds.map((id: number) => `u-${id}`);
      
      setTyp(aktionToEdit.typ);
      setDatum(getLokalesDatumString(aktionToEdit.datum));
      setNotiz(aktionToEdit.notiz || "");
      setZielIDs([...pflanzenZiele, ...umgebungZiele]);
      // Lade Detail-States
      setMengeLStr(String(aktionToEdit.details?.mengeL || "1.0"));
      setWasserProfilId(aktionToEdit.details?.wasserProfilId);
      setTrainingTyp(aktionToEdit.details?.trainingTyp);
      setBeschneidenTyp(aktionToEdit.details?.beschneidenTyp);
      
      const uiZutaten = aktionToEdit.details?.zutaten?.map((z, i) => ({
        id: `db-${i}-${z.id}`,
        typ: z.typ,
        zutatId: z.id,
        mengeStr: String(z.menge)
      })) || [];
      setZutatEingaben(uiZutaten);
      
    } else {
      resetFormular();
    }
  }, [aktionToEdit, isEditMode, isOpen]);


  const handleZielChange = (neueWerte: (string | number)[]) => {
    setZielIDs(neueWerte.map(val => String(val)));
  };
  
  const handleSave = async () => {
    setIsCalculating(true);
    
    if (!typ || !datum) { /* ... */ setIsCalculating(false); return; }
    const zielPflanzenIds: number[] = [];
    const zielUmgebungIds: number[] = [];
    zielIDs.forEach(idString => {
      if (idString.startsWith('p-')) zielPflanzenIds.push(Number(idString.replace('p-', '')));
      if (idString.startsWith('u-')) zielUmgebungIds.push(Number(idString.replace('u-', '')));
    });
    if (zielPflanzenIds.length === 0 && zielUmgebungIds.length === 0) { /* ... */ setIsCalculating(false); return; }
    
    const mengeL = parseFloatSafe(mengeLStr);
    const zutaten = zutatEingaben
      .map(z => ({ id: z.zutatId!, menge: parseFloatSafe(z.mengeStr)!, typ: z.typ }))
      .filter(z => z.id && z.menge > 0);
    
    // Validierung
    const isLiquidAction = typ === 'wasser' || typ === 'naehrstoffe' || typ === 'ph';
    if (isLiquidAction && (!mengeL || mengeL <= 0)) {
       toast({ title: "Menge (L) fehlt", status: "warning" }); setIsCalculating(false); return;
    }
    if (typ === 'training' && !trainingTyp) {
       toast({ title: "Trainingstyp fehlt", status: "warning" }); setIsCalculating(false); return;
    }
    if (typ === 'beschneiden' && !beschneidenTyp) {
       toast({ title: "Beschneiden-Typ fehlt", status: "warning" }); setIsCalculating(false); return;
    }
    
    let berechnetesErgebnis: EndloesungErgebnis | undefined = undefined;
    if (isLiquidAction) { // Führe Rechner nur für flüssige Aktionen aus
      try {
        berechnetesErgebnis = await calculateFinalSolution({
          zielvolumenLiter: mengeL!,
          wasserProfilId: wasserProfilId,
          zutaten: zutaten,
        });
      } catch (error: any) {
         toast({ title: "Rechenfehler", description: error.message, status: "error" });
         setIsCalculating(false); return;
      }
    }

    // === HIER IST DIE KORREKTUR ===
    // Wir bauen das 'details'-Objekt basierend auf dem Typ
    const details: IAktion['details'] = {
      // Flüssige Details
      wasserProfilId: isLiquidAction ? wasserProfilId : undefined,
      mengeL: isLiquidAction ? mengeL : undefined,
      zutaten: (typ === 'naehrstoffe' || typ === 'ph') ? zutaten : undefined,
      berechnetesErgebnis_mg_l: berechnetesErgebnis, // Wird nur bei Flüssig-Aktionen berechnet
      
      // Nicht-flüssige Details
      trainingTyp: typ === 'training' ? trainingTyp : undefined,
      beschneidenTyp: typ === 'beschneiden' ? beschneidenTyp : undefined,
    };
    // === ENDE KORREKTUR ===

    const aktionDaten: Omit<IAktion, 'id' | 'status'> = {
      typ: typ, 
      datum: new Date(datum), 
      notiz: notiz,
      zielPflanzenIds: zielPflanzenIds, 
      zielUmgebungIds: zielUmgebungIds,
      details: details // Weise das saubere Objekt zu
    };

    try {
      if (isEditMode) {
        await db.aktionen.put({ id: aktionToEdit!.id!, status: aktionToEdit!.status, ...aktionDaten });
        toast({ title: "Aktion aktualisiert", status: "success", duration: 2000 });
      } else {
        await db.aktionen.add({ ...aktionDaten, status: 'offen' } as IAktion);
        toast({ title: "Aktion geplant", status: "success", duration: 2000 });
      }
      resetFormular();
      onClose();
    } catch (error) {
      console.error("Fehler beim Speichern der Aktion:", error);
      toast({ title: "Fehler", description: "Aktion konnte nicht gespeichert werden.", status: "error" });
    } finally {
      setIsCalculating(false);
    }
  };

  const resetFormular = () => {
    setTyp(undefined);
    setDatum(getLokalesDatumString(new Date()));
    setNotiz("");
    setZielIDs([]);
    setMengeLStr("1.0");
    setWasserProfilId(undefined);
    setZutatEingaben([]);
    setTrainingTyp(undefined);
    setBeschneidenTyp(undefined);
  };
  const handleClose = () => { resetFormular(); onClose(); };

  // (Handler für Zutaten-Zeilen unverändert)
  const addZutatZeile = () => {
    const defaultTyp: ZutatTyp = typ === 'ph' ? 'saeure' : 'naehrsalz';
    setZutatEingaben(prev => [...prev, { id: `temp-${Date.now()}`, typ: defaultTyp }]);
  };
  const removeZutatZeile = (id: string) => {
    setZutatEingaben(prev => prev.filter(n => n.id !== id));
  };
  const updateZutatZeile = (id: string, feld: keyof ZutatEingabe, wert: string | number | ZutatTyp) => {
    setZutatEingaben(prev => 
      prev.map(n => {
        if (n.id === id) {
          if (feld === 'typ') {
            return { ...n, typ: wert as ZutatTyp, zutatId: undefined, mengeStr: n.mengeStr };
          }
          return { ...n, [feld]: wert };
        }
        return n;
      })
    );
  };
  const getZutatOptions = (typ: ZutatTyp) => {
    if (typ === 'naehrsalz') return naehrsalze?.map(s => <option key={s.id} value={s.id}>{s.name}</option>);
    if (typ === 'stammlosung') return stammlosungen?.map(s => <option key={s.id} value={s.id}>{s.name}</option>);
    if (typ === 'saeure') return saeurenBasen?.map(s => <option key={s.id} value={s.id}>{s.name}</option>);
    return [];
  };
  const getEinheit = (typ: ZutatTyp) => {
    if (typ === 'naehrsalz') return 'g';
    return 'ml';
  }
  const getZutatTypOptions = () => {
    if (typ === 'naehrstoffe') {
      return [
        <option key="naehrsalz" value="naehrsalz">Nährsalz</option>,
        <option key="stammlosung" value="stammlosung">Lösung</option>,
        <option key="saeure" value="saeure">Säure/Base</option>
      ];
    }
    if (typ === 'ph') {
      return [<option key="saeure" value="saeure">Säure/Base</option>];
    }
    return [];
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="full" trapFocus={false}>
      <ModalOverlay />
      <ModalContent bg="gray.800">
        <ModalHeader>{isEditMode ? 'Aktion bearbeiten' : 'Neue Aktion planen'}</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody overflowY="auto">
          <VStack spacing={4} align="stretch" pb={24}>
            
            <FormControl isRequired>
              <FormLabel>Für wen ist diese Aktion?</FormLabel>
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
              <FormLabel>Aktionstyp</FormLabel>
              <Select 
                placeholder="Aktionstyp wählen..."
                value={typ || ""}
                onChange={(e) => setTyp(e.target.value as IAktion['typ'])}
              >
                <option value="wasser">Wasser (Pur)</option>
                <option value="naehrstoffe">Nährlösung (Wasser + Zutaten)</option>
                <option value="ph">pH-Anpassung (mit Wasser)</option>
                <option value="training">Training</option>
                <option value="beschneiden">Beschneiden</option>
                <option value="schutz">Pflanzenschutz</option>
              </Select>
            </FormControl>

            {(typ === 'wasser' || typ === 'naehrstoffe' || typ === 'ph') && (
              <VStack spacing={4} align="stretch" w="100%" bg="gray.700" p={4} borderRadius="md">
                <Heading size="sm">Basis-Flüssigkeit</Heading>
                <SimpleGrid columns={2} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Menge (L)</FormLabel>
                    <NumberInput value={mengeLStr} onChange={(valStr) => setMengeLStr(valStr)} min={0} precision={2} step={0.1}>
                      <NumberInputField placeholder="z.B. 10.5" />
                    </NumberInput>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Wasserprofil</FormLabel>
                    <Select 
                      placeholder="Kein Profil (RO-Wasser)"
                      value={wasserProfilId || ""}
                      onChange={(e) => setWasserProfilId(Number(e.target.value) || undefined)}
                    >
                      {wasserprofile?.map(wp => (<option key={wp.id} value={wp.id}>{wp.name}</option>))}
                    </Select>
                  </FormControl>
                </SimpleGrid>
              </VStack>
            )}

            {(typ === 'naehrstoffe' || typ === 'ph') && (
              <VStack spacing={4} align="stretch" w="100%" bg="gray.700" p={4} borderRadius="md">
                <Heading size="sm">{typ === 'ph' ? 'pH-Regulator hinzufügen' : 'Zutaten hinzufügen'}</Heading>
                
                {zutatEingaben.map((zeile) => (
                  <Flex key={zeile.id} gap={2} align="flex-end">
                    <FormControl w="130px">
                      <FormLabel fontSize="xs">Typ</FormLabel>
                      <Select 
                        value={zeile.typ} 
                        onChange={(e) => updateZutatZeile(zeile.id, 'typ', e.target.value as ZutatTyp)}
                        isDisabled={typ === 'ph'}
                      >
                        {getZutatTypOptions()}
                      </Select>
                    </FormControl>
                    <FormControl flex={1}>
                      <FormLabel fontSize="xs">Zutat</FormLabel>
                      <Select 
                        placeholder="Wählen..."
                        value={zeile.zutatId || ""}
                        onChange={(e) => updateZutatZeile(zeile.id, 'zutatId', Number(e.target.value))}
                      >
                        {getZutatOptions(zeile.typ)}
                      </Select>
                    </FormControl>
                    <FormControl w="100px">
                      <FormLabel fontSize="xs">Menge ({getEinheit(zeile.typ)})</FormLabel>
                      <NumberInput 
                        value={zeile.mengeStr || ""} 
                        onChange={(valStr) => updateZutatZeile(zeile.id, 'mengeStr', valStr)} 
                        min={0} precision={2}
                      >
                        <NumberInputField />
                      </NumberInput>
                    </FormControl>
                    <IconButton aria-label="Löschen" icon={<FiTrash />} colorScheme="red" variant="ghost" onClick={() => removeZutatZeile(zeile.id)} />
                  </Flex>
                ))}
                <Button leftIcon={<FiPlus />} size="sm" onClick={addZutatZeile}>Zutat hinzufügen</Button>
              </VStack>
            )}
            
            {typ === 'training' && (
              <VStack spacing={4} align="stretch" w="100%" bg="gray.700" p={4} borderRadius="md">
                <Heading size="sm">Training-Details</Heading>
                <FormControl isRequired>
                  <FormLabel>Trainingstyp</FormLabel>
                  <Select 
                    placeholder="Trainingstyp wählen..."
                    value={trainingTyp || ""}
                    onChange={(e) => setTrainingTyp(e.target.value as TrainingTyp)}
                  >
                    {trainingOptions.map(opt => (
                      <option key={opt.key} value={opt.key}>{opt.label}</option>
                    ))}
                  </Select>
                </FormControl>
              </VStack>
            )}
            
            {typ === 'beschneiden' && (
              <VStack spacing={4} align="stretch" w="100%" bg="gray.700" p={4} borderRadius="md">
                <Heading size="sm">Beschneiden-Details</Heading>
                <FormControl isRequired>
                  <FormLabel>Beschneiden-Typ</FormLabel>
                  <Select 
                    placeholder="Beschneiden-Typ wählen..."
                    value={beschneidenTyp || ""}
                    onChange={(e) => setBeschneidenTyp(e.target.value as BeschneidenTyp)}
                  >
                    {beschneidenOptions.map(opt => (
                      <option key={opt.key} value={opt.key}>{opt.label}</option>
                    ))}
                  </Select>
                </FormControl>
              </VStack>
            )}
            
            <FormControl isRequired>
              <FormLabel>Datum</FormLabel>
              <Input type="datetime-local" value={datum} onChange={(e) => setDatum(e.target.value)} />
            </FormControl>

            <FormControl>
              <FormLabel>Notiz (Optional)</FormLabel>
              <Textarea 
                placeholder="Details zur geplanten Aktion..." 
                value={notiz}
                onChange={(e) => setNotiz(e.target.value)}
              />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor="gray.700" bg="gray.800" position="fixed" bottom={0} left={0} right={0} zIndex={1}>
          <Button variant="ghost" mr={3} onClick={handleClose}>Abbrechen</Button>
          <Button 
            colorScheme="green" 
            onClick={handleSave}
            isLoading={isCalculating}
          >
            {isEditMode ? 'Aktion aktualisieren' : 'Aktion planen'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}