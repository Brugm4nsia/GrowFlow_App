// In Datei: src/pages/EndlosungRechnerPage.tsx
// VOLLSTÄNDIGER CODE

import { 
  Box, Heading, Flex, IconButton, Text, VStack, FormControl, FormLabel,
  NumberInput, NumberInputField, Select, Button, SimpleGrid, Tag,
  Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon,
  useToast,
} from '@chakra-ui/react';
import { FiChevronLeft, FiPlus, FiTrash } from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useState, useMemo } from 'react';
import { calculateFinalSolution, EndloesungErgebnis } from '../utils/NutrientCalculator';
import type { IStammlosung, INaehrsalz, ISaeureBase } from '../types';

type StammlosungEingabe = { id: string; loesungId?: number; mlStr?: string };
type NaehrsalzEingabe = { id: string; salzId?: number; grammStr?: string };
type SaeureBaseEingabe = { id: string; itemId?: number; mlStr?: string };

const parseFloatSafe = (val: string | undefined): number => {
  if (!val) return 0;
  return parseFloat(val.replace(',', '.')) || 0;
}

export function EndlosungRechnerPage() {
  const toast = useToast();

  const wasserprofile = useLiveQuery(() => db.wasserprofile.toArray(), []);
  const stammlosungen = useLiveQuery(() => db.stammlosungen.toArray(), []);
  const naehrsalze = useLiveQuery(() => db.naehrsalze.toArray(), []);
  const saeurenBasen = useLiveQuery(() => db.saeurenBasen.toArray(), []);

  const [zielvolumenLiterStr, setZielvolumenLiterStr] = useState("10");
  const [wasserProfilId, setWasserProfilId] = useState<number | undefined>(undefined);
  
  const [slEingaben, setSlEingaben] = useState<StammlosungEingabe[]>([]);
  const [nsEingaben, setNsEingaben] = useState<NaehrsalzEingabe[]>([]);
  const [sbEingaben, setSbEingaben] = useState<SaeureBaseEingabe[]>([]);

  const berechnetesErgebnis: EndloesungErgebnis | null = useMemo(() => {
    const zielvolumenLiter = parseFloatSafe(zielvolumenLiterStr);
    if (zielvolumenLiter <= 0) return null;

    const wasserProfil = wasserprofile?.find(wp => wp.id === wasserProfilId);

    const stammlosungZutaten = slEingaben
      .map(e => ({ 
        loesung: stammlosungen?.find(sl => sl.id === e.loesungId), 
        ml: parseFloatSafe(e.mlStr) 
      }))
      .filter(item => item.loesung && item.ml > 0) as { loesung: IStammlosung; ml: number }[];

    const naehrsalzZutaten = nsEingaben
      .map(e => ({ 
        salz: naehrsalze?.find(ns => ns.id === e.salzId), 
        gramm: parseFloatSafe(e.grammStr)
      }))
      .filter(item => item.salz && item.gramm > 0) as { salz: INaehrsalz; gramm: number }[];
      
    const saeureBaseZutaten = sbEingaben
      .map(e => ({ 
        item: saeurenBasen?.find(sb => sb.id === e.itemId), 
        ml: parseFloatSafe(e.mlStr)
      }))
      .filter(item => item.item && item.ml > 0) as { item: ISaeureBase; ml: number }[];

    try {
      return calculateFinalSolution({
        zielvolumenLiter,
        wasserProfil,
        stammlosungen: stammlosungZutaten,
        naehrsalze: naehrsalzZutaten,
        saeurenBasen: saeureBaseZutaten,
      });
    } catch (error: any) {
      toast({ title: "Rechenfehler", description: error.message, status: "error", duration: 3000 });
      return null;
    }

  }, [zielvolumenLiterStr, wasserProfilId, slEingaben, nsEingaben, sbEingaben, wasserprofile, stammlosungen, naehrsalze, saeurenBasen, toast]);

  
  const addSlZeile = () => setSlEingaben(p => [...p, { id: `temp-${Date.now()}` }]);
  const removeSlZeile = (id: string) => setSlEingaben(p => p.filter(z => z.id !== id));
  const updateSlZeile = (id: string, feld: 'loesungId' | 'mlStr', wert: number | string | undefined) => {
    setSlEingaben(p => p.map(z => (z.id === id ? { ...z, [feld]: wert } : z)));
  };
  
  const addNsZeile = () => setNsEingaben(p => [...p, { id: `temp-${Date.now()}` }]);
  const removeNsZeile = (id: string) => setNsEingaben(p => p.filter(z => z.id !== id));
  const updateNsZeile = (id: string, feld: 'salzId' | 'grammStr', wert: number | string | undefined) => {
    setNsEingaben(p => p.map(z => (z.id === id ? { ...z, [feld]: wert } : z)));
  };
  
  const addSbZeile = () => setSbEingaben(p => [...p, { id: `temp-${Date.now()}` }]);
  const removeSbZeile = (id: string) => setSbEingaben(p => p.filter(z => z.id !== id));
  const updateSbZeile = (id: string, feld: 'itemId' | 'mlStr', wert: number | string | undefined) => {
    setSbEingaben(p => p.map(z => (z.id === id ? { ...z, [feld]: wert } : z)));
  };


  return (
    <Box p={4} pb={24}>
      <Flex align="center" mb={4}>
        <IconButton as={RouterLink} to="/einstellungen" aria-label="Zurück zu Mehr" icon={<FiChevronLeft />} variant="ghost" mr={2} />
        <Heading>Endlösungs-Rechner</Heading>
      </Flex>
      
      <VStack spacing={6} align="stretch">
        {/* --- 1. ZIELVOLUMEN & WASSER --- */}
        <VStack spacing={4} bg="gray.800" p={4} borderRadius="md" align="stretch">
          <SimpleGrid columns={2} spacing={4}>
            <FormControl isRequired>
              <FormLabel>Zielvolumen (Liter)</FormLabel>
              <NumberInput value={zielvolumenLiterStr} min={0.1} precision={2} step={0.5} onChange={(valStr) => setZielvolumenLiterStr(valStr)}>
                <NumberInputField />
              </NumberInput>
            </FormControl>
            <FormControl>
              <FormLabel>Wasserprofil (Basis)</FormLabel>
              <Select 
                placeholder="Kein Profil (0.0)"
                value={wasserProfilId || ""}
                onChange={(e) => setWasserProfilId(Number(e.target.value) || undefined)}
              >
                {wasserprofile?.map(wp => <option key={wp.id} value={wp.id}>{wp.name}</option>)}
              </Select>
            </FormControl>
          </SimpleGrid>
        </VStack>

        {/* --- 2. ZUTATEN (als Akkordeon) --- */}
        <Accordion allowMultiple defaultIndex={[0]} w="100%">
          {/* Stammlösungen */}
          <AccordionItem bg="gray.800" borderRadius="md" mb={4}>
            <AccordionButton><Box flex="1" textAlign="left" fontWeight="bold">Stammlösungen (ml)</Box><AccordionIcon /></AccordionButton>
            <AccordionPanel pb={4}>
              <VStack spacing={3} align="stretch">
                {slEingaben.map(zeile => (
                  <Flex key={zeile.id} gap={2} align="center">
                    <Select placeholder="Lösung wählen..." value={zeile.loesungId || ""} onChange={(e) => updateSlZeile(zeile.id, 'loesungId', Number(e.target.value))}>
                      {stammlosungen?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                    <NumberInput value={zeile.mlStr || ""} precision={2} step={0.1} onChange={(valStr) => updateSlZeile(zeile.id, 'mlStr', valStr)} min={0} maxW="100px">
                      <NumberInputField placeholder="ml" />
                    </NumberInput>
                    <IconButton aria-label="Löschen" icon={<FiTrash />} colorScheme="red" variant="ghost" onClick={() => removeSlZeile(zeile.id)} />
                  </Flex>
                ))}
                <Button leftIcon={<FiPlus />} size="sm" onClick={addSlZeile}>Lösung hinzufügen</Button>
              </VStack>
            </AccordionPanel>
          </AccordionItem>
          
          {/* Nährsalze (Roh) */}
          <AccordionItem bg="gray.800" borderRadius="md" mb={4}>
            <AccordionButton><Box flex="1" textAlign="left" fontWeight="bold">Nährsalze (Gramm)</Box><AccordionIcon /></AccordionButton>
            <AccordionPanel pb={4}>
              <VStack spacing={3} align="stretch">
                {nsEingaben.map(zeile => (
                  <Flex key={zeile.id} gap={2} align="center">
                    <Select placeholder="Salz wählen..." value={zeile.salzId || ""} onChange={(e) => updateNsZeile(zeile.id, 'salzId', Number(e.target.value))}>
                      {naehrsalze?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                    <NumberInput value={zeile.grammStr || ""} precision={2} step={0.1} onChange={(valStr) => updateNsZeile(zeile.id, 'grammStr', valStr)} min={0} maxW="100px">
                      <NumberInputField placeholder="g" />
                    </NumberInput>
                    <IconButton aria-label="Löschen" icon={<FiTrash />} colorScheme="red" variant="ghost" onClick={() => removeNsZeile(zeile.id)} />
                  </Flex>
                ))}
                <Button leftIcon={<FiPlus />} size="sm" onClick={addNsZeile}>Salz hinzufügen</Button>
              </VStack>
            </AccordionPanel>
          </AccordionItem>

          {/* Säuren / Basen */}
          <AccordionItem bg="gray.800" borderRadius="md" mb={4}>
            <AccordionButton><Box flex="1" textAlign="left" fontWeight="bold">pH-Regulatoren (ml)</Box><AccordionIcon /></AccordionButton>
            <AccordionPanel pb={4}>
              <VStack spacing={3} align="stretch">
                {sbEingaben.map(zeile => (
                  <Flex key={zeile.id} gap={2} align="center">
                    <Select placeholder="Regulator wählen..." value={zeile.itemId || ""} onChange={(e) => updateSbZeile(zeile.id, 'itemId', Number(e.target.value))}>
                      {saeurenBasen?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                    <NumberInput value={zeile.mlStr || ""} precision={2} step={0.1} onChange={(valStr) => updateSbZeile(zeile.id, 'mlStr', valStr)} min={0} maxW="100px">
                      <NumberInputField placeholder="ml" />
                    </NumberInput>
                    <IconButton aria-label="Löschen" icon={<FiTrash />} colorScheme="red" variant="ghost" onClick={() => removeSbZeile(zeile.id)} />
                  </Flex>
                ))}
                <Button leftIcon={<FiPlus />} size="sm" onClick={addSbZeile}>Regulator hinzufügen</Button>
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
        
        {/* --- 3. ERGEBNIS-ANZEIGE --- */}
        {berechnetesErgebnis && (
          <Box bg="gray.800" p={4} borderRadius="md">
            <Heading as="h2" size="md" mb={4}>Endergebnis (mg/l)</Heading>
            <SimpleGrid columns={{ base: 3, md: 4 }} spacing={2}>
              {Object.entries(berechnetesErgebnis)
                .filter(([, val]) => val && val > 0)
                .map(([key, val]) => {
                  
                  const displayKey = key.replace('_gesamt', '');
                  
                  // === HIER IST DIE KORREKTUR FÜR Mo ===
                  // Mo (und andere Mikros) mit 3 Stellen, Rest mit 1 Stelle
                  const displayVal = (
                    displayKey === 'Mo' || displayKey === 'Mn' || displayKey === 'Zn' || 
                    displayKey === 'Cu' || displayKey === 'B' || displayKey === 'Fe'
                  ) 
                    ? val.toFixed(3) 
                    : val.toFixed(1);
                  
                  return (
                    <Tag key={key} size="lg" colorScheme="green" variant="solid" justifyContent="space-between">
                      <Text>{displayKey}</Text>
                      <Text>{displayVal}</Text>
                    </Tag>
                  );
                })
              }
            </SimpleGrid>
          </Box>
        )}
      </VStack>
    </Box>
  );
}