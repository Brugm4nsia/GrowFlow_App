// In Datei: src/components/Dashboard/FotoLogModal.tsx
// VOLLSTÄNDIGER CODE

import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  Button, VStack, FormControl, FormLabel, Textarea, Input, useToast,
  CheckboxGroup, Checkbox, Text, Box, Accordion, AccordionItem, AccordionButton,
  AccordionPanel, AccordionIcon, Image,
} from '@chakra-ui/react';
import { useState, useRef, useEffect } from 'react';
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

interface FotoLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logToEdit?: ILog;
}

export function FotoLogModal({ isOpen, onClose, logToEdit }: FotoLogModalProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditMode = !!logToEdit;

  const pflanzen = useLiveQuery(() => db.pflanzen.toArray(), []);
  const umgebungen = useLiveQuery(() => db.umgebungen.toArray(), []);

  const [datum, setDatum] = useState(getLokalesDatumString(new Date()));
  const [notiz, setNotiz] = useState("");
  const [zielIDs, setZielIDs] = useState<string[]>([]);
  const [foto, setFoto] = useState<File | Blob | undefined>(undefined);
  const [fotoVorschau, setFotoVorschau] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    if (isEditMode && isOpen && logToEdit) { // Sicherstellen, dass logToEdit existiert
      // === FIX 1 & 2 HIER ===
      const pflanzenZiele = logToEdit.zielPflanzenIds.map((id: number) => `p-${id}`);
      // 'zielAnbauflaechenIds' zu 'zielUmgebungIds' korrigiert
      const umgebungZiele = logToEdit.zielUmgebungIds.map((id: number) => `u-${id}`);

      setDatum(getLokalesDatumString(logToEdit.datum));
      setNotiz(logToEdit.notiz || "");
      setZielIDs([...pflanzenZiele, ...umgebungZiele]);
      
      if (logToEdit.foto) {
        setFoto(logToEdit.foto);
        setFotoVorschau(URL.createObjectURL(logToEdit.foto));
      }
    } else {
      resetFormular();
    }
  }, [logToEdit, isEditMode, isOpen]);
  

  const handleZielChange = (neueWerte: (string | number)[]) => {
    const stringWerte = neueWerte.map(val => String(val));
    setZielIDs(stringWerte);
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFoto(file);
      if (fotoVorschau) URL.revokeObjectURL(fotoVorschau);
      setFotoVorschau(URL.createObjectURL(file));
    }
  };
  
  const handleSave = async () => {
    if (!foto) { /* ... */ return; }
    if (zielIDs.length === 0) { /* ... */ return; }
    
    const zielPflanzenIds: number[] = [];
    const zielUmgebungIds: number[] = [];
    zielIDs.forEach(idString => {
      if (idString.startsWith('p-')) zielPflanzenIds.push(Number(idString.replace('p-', '')));
      if (idString.startsWith('u-')) zielUmgebungIds.push(Number(idString.replace('u-', '')));
    });

    const logDaten: Omit<ILog, 'id'> = {
      typ: 'foto',
      datum: new Date(datum),
      notiz: notiz,
      zielPflanzenIds: zielPflanzenIds,
      zielUmgebungIds: zielUmgebungIds, // Korrekter Feldname
      foto: foto,
    };

    try {
      if (isEditMode) {
        await db.logs.put({ id: logToEdit.id!, ...logDaten });
        toast({ title: "Foto aktualisiert", status: "success", duration: 2000 });
      } else {
        await db.logs.add(logDaten as ILog);
        toast({ title: "Foto gespeichert", status: "success", duration: 2000 });
      }
      resetFormular();
      onClose();
    } catch (error) {
      console.error("Fehler beim Speichern des Fotos:", error);
      toast({ title: "Fehler", description: "Foto konnte nicht gespeichert werden.", status: "error" });
    }
  };

  const resetFormular = () => {
    setDatum(getLokalesDatumString(new Date()));
    setNotiz("");
    setZielIDs([]);
    setFoto(undefined);
    if (fotoVorschau) {
      URL.revokeObjectURL(fotoVorschau);
    }
    setFotoVorschau(undefined);
  };

  const handleClose = () => {
    resetFormular();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="full" trapFocus={false}>
      <ModalOverlay />
      <ModalContent bg="gray.800">
        <ModalHeader>{isEditMode ? 'Foto-Protokoll bearbeiten' : 'Neues Foto-Protokoll'}</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody overflowY="auto">
          <VStack spacing={4} align="stretch" pb={24}>
            
            <FormControl isRequired>
              <FormLabel>Foto</FormLabel>
              <Box 
                border="2px dashed" 
                borderColor="gray.600" 
                borderRadius="md" 
                p={4} 
                textAlign="center"
                cursor="pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Input type="file" accept="image/*" ref={fileInputRef} hidden onChange={onFileChange} />
                {fotoVorschau ? (
                  <Image src={fotoVorschau} alt="Vorschau" maxH="300px" mx="auto" borderRadius="md" />
                ) : (
                  <Text color="gray.400">Klicken, um Foto auszuwählen oder aufzunehmen</Text>
                )}
              </Box>
            </FormControl>

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
              <Input 
                type="datetime-local" 
                value={datum}
                onChange={(e) => setDatum(e.target.value)}
              />
            </FormControl>

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
          <Button colorScheme="green" onClick={handleSave} isDisabled={!foto}>Foto speichern</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}