// In Datei: src/pages/StammlosungRechnerPage.tsx
// VOLLSTÄNDIGER CODE

import { 
  Box, Heading, VStack, Button, useToast,
  FormControl, FormLabel, Input, SimpleGrid, NumberInput, 
  NumberInputField, IconButton, Select, Tag,
  Flex, Spinner,
} from "@chakra-ui/react";
import { FiChevronLeft, FiPlus, FiTrash } from "react-icons/fi";
import { db } from '../db';
import type { IStammlosung } from "../types";
import { useLiveQuery } from "dexie-react-hooks";
import { useState, useEffect } from "react";
import { calculateStockSolution } from "../utils/NutrientCalculator";
// NEU: useParams für die ID, useNavigate für die Rückleitung
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";

type RezeptZeile = {
  id: string;
  naehrsalzId?: number;
  gramm?: number;
};

export function StammlosungRechnerPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const { rezeptId } = useParams(); // NEU: Holt die ID aus der URL
  const isEditMode = !!rezeptId; // NEU: Prüft, ob wir im Bearbeiten-Modus sind

  // Lade alle verfügbaren Nährsalze für die Dropdowns
  const verfuegbareSalze = useLiveQuery(() => db.naehrsalze.toArray(), []);
  
  // NEU: Lade das zu bearbeitende Rezept, falls rezeptId vorhanden ist
  const rezeptToEdit = useLiveQuery(
    () => (isEditMode ? db.stammlosungen.get(Number(rezeptId)) : undefined),
    [isEditMode, rezeptId]
  );
  
  // === STATE-VERWALTUNG ===
  const [name, setName] = useState("");
  const [endvolumenLiter, setEndvolumenLiter] = useState(1.0);
  const [rezeptZeilen, setRezeptZeilen] = useState<RezeptZeile[]>([]);
  const [ergebnis, setErgebnis] = useState<IStammlosung['ergebnis_mg_ml'] | null>(null);
  const [isLoading, setIsLoading] = useState(isEditMode); // NEU: Lade-Status für Bearbeiten

  // NEU: Effekt zum Füllen des Formulars im Bearbeiten-Modus
  useEffect(() => {
    if (isEditMode && rezeptToEdit) {
      setName(rezeptToEdit.name);
      setEndvolumenLiter(rezeptToEdit.endvolumenLiter);
      // Wandle das DB-Rezept in UI-RezeptZeilen um
      setRezeptZeilen(rezeptToEdit.rezept.map((r, index) => ({
        id: `db-${index}-${r.naehrsalzId}`, // Eindeutige ID für React
        naehrsalzId: r.naehrsalzId,
        gramm: r.gramm
      })));
      setIsLoading(false); // Ladevorgang abgeschlossen
    } else if (!isEditMode) {
      setIsLoading(false); // Nicht im Bearbeiten-Modus, kein Lade-Status
    }
  }, [isEditMode, rezeptToEdit]);

  // === REZEPT-HANDLER (unverändert) ===
  const addRezeptZeile = () => { setRezeptZeilen(prev => [...prev, { id: `temp-${Date.now()}` }]); };
  const removeRezeptZeile = (id: string) => { setRezeptZeilen(prev => prev.filter(z => z.id !== id)); };
  const updateRezeptZeile = (id: string, feld: 'naehrsalzId' | 'gramm', wert: number | undefined) => {
    setRezeptZeilen(prev => 
      prev.map(z => (z.id === id ? { ...z, [feld]: wert } : z))
    );
  };

  // === BERECHNUNG (unverändert) ===
  useEffect(() => {
    const rezeptFuerRechner = rezeptZeilen
      .filter(z => z.naehrsalzId && z.gramm && z.gramm > 0)
      .map(z => ({ naehrsalzId: z.naehrsalzId!, gramm: z.gramm! }));
    if (rezeptFuerRechner.length > 0 && endvolumenLiter > 0) {
      calculateStockSolution(rezeptFuerRechner, endvolumenLiter)
        .then(setErgebnis)
        .catch(err => { toast({ title: "Rechenfehler", description: err.message, status: "error" }); });
    } else { setErgebnis(null); }
  }, [rezeptZeilen, endvolumenLiter, toast]);

  // === SPEICHERN (Aktualisiert) ===
  const handleSave = async () => {
    if (!name || !ergebnis || rezeptZeilen.length === 0) {
      toast({ title: "Angaben unvollständig", description: "Name, Rezept und Ergebnis werden benötigt.", status: "warning" });
      return;
    }
    const finalesRezept = rezeptZeilen
      .filter(z => z.naehrsalzId && z.gramm)
      .map(z => ({ naehrsalzId: z.naehrsalzId!, gramm: z.gramm! }));

    const stammlosungDaten: Omit<IStammlosung, 'id'> = {
      name,
      endvolumenLiter,
      rezept: finalesRezept,
      ergebnis_mg_ml: ergebnis,
    };

    try {
      if (isEditMode) {
        // === UPDATE statt ADD ===
        await db.stammlosungen.update(Number(rezeptId), stammlosungDaten);
        toast({ title: "Rezept aktualisiert", status: "success" });
      } else {
        await db.stammlosungen.add(stammlosungDaten as IStammlosung);
        toast({ title: "Rezept gespeichert", status: "success" });
      }
      navigate('/stammlosungen'); // Zurück zur Übersicht
    } catch (error) {
      toast({ title: "Fehler beim Speichern", status: "error" });
      console.error(error);
    }
  };

  if (isLoading) {
    return <Spinner p={4} />; // Zeige Lade-Spinner im Bearbeiten-Modus
  }

  return (
    <Box p={4}>
      <Flex align="center" mb={4}>
        <IconButton
          as={RouterLink}
          to="/stammlosungen"
          aria-label="Zurück"
          icon={<FiChevronLeft />}
          variant="ghost"
          mr={2}
        />
        {/* NEU: Dynamischer Titel */}
        <Heading>{isEditMode ? 'Rezept bearbeiten' : 'Neues Stammlösungs-Rezept'}</Heading>
      </Flex>

      <VStack spacing={6} align="stretch">
        {/* --- 1. GRUNDDATEN --- */}
        <VStack spacing={4} bg="gray.800" p={4} borderRadius="md" align="stretch">
          <FormControl isRequired>
            <FormLabel>Name des Rezepts</FormLabel>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Endvolumen (Liter)</FormLabel>
            <NumberInput value={endvolumenLiter} min={0.1} precision={2} step={0.1} onChange={(_, val) => setEndvolumenLiter(val || 0.1)}>
              <NumberInputField />
            </NumberInput>
          </FormControl>
        </VStack>

        {/* --- 2. REZEPT-ZUTATEN --- */}
        <VStack spacing={4} bg="gray.800" p={4} borderRadius="md" align="stretch">
          <Heading as="h2" size="md">Rezept-Zutaten</Heading>
          {rezeptZeilen.map((zeile) => (
            <Flex key={zeile.id} gap={2} align="center">
              <Select 
                placeholder="Nährsalz wählen..."
                value={zeile.naehrsalzId || ""}
                onChange={(e) => updateRezeptZeile(zeile.id, 'naehrsalzId', Number(e.target.value) || undefined)}
              >
                {verfuegbareSalze?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
              <NumberInput 
                value={zeile.gramm || ""} 
                onChange={(_, val) => updateRezeptZeile(zeile.id, 'gramm', val || undefined)} 
                min={0} maxW="120px"
              >
                <NumberInputField placeholder="Gramm" />
              </NumberInput>
              <IconButton aria-label="Löschen" icon={<FiTrash />} colorScheme="red" variant="ghost" onClick={() => removeRezeptZeile(zeile.id)} />
            </Flex>
          ))}
          <Button leftIcon={<FiPlus />} size="sm" onClick={addRezeptZeile}>Zutat hinzufügen</Button>
        </VStack>

        {/* --- 3. BERECHNETES ERGEBNIS --- */}
        {ergebnis && (
          <Box bg="gray.800" p={4} borderRadius="md">
            <Heading as="h2" size="md" mb={4}>Berechnetes Ergebnis (mg/ml)</Heading>
            <SimpleGrid columns={{ base: 3, md: 5 }} spacing={2}>
              <Tag size="lg" colorScheme="blue" variant="solid">
                N: {ergebnis.N_gesamt.toFixed(2)}
              </Tag>
              <Tag size="lg" colorScheme="blue" variant="outline">
                NH4: {ergebnis.NH4.toFixed(2)}
              </Tag>
              <Tag size="lg" colorScheme="blue" variant="outline">
                NO3: {ergebnis.NO3.toFixed(2)}
              </Tag>
              {Object.entries(ergebnis)
                .filter(([key, val]) => 
                  val > 0 && key !== 'N_gesamt' && key !== 'NH4' && key !== 'NO3'
                )
                .map(([key, val]) => (
                  <Tag key={key} size="lg" colorScheme="blue" variant="solid">
                    {key}: {val.toFixed(2)}
                  </Tag>
                ))
              }
            </SimpleGrid>
          </Box>
        )}

        {/* --- SPEICHERN --- */}
        <Button 
          colorScheme="green" 
          size="lg"
          onClick={handleSave}
          isDisabled={!name || !ergebnis}
        >
          {isEditMode ? 'Änderungen speichern' : 'Rezept speichern'}
        </Button>
      </VStack>
    </Box>
  );
}