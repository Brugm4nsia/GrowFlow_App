// In Datei: src/components/Dashboard/Tagebuch.tsx
// VOLLSTÄNDIGER CODE

import { 
  Box, Heading, Text, VStack, Flex, Checkbox, 
  Icon, Image, Tag, Spacer, useToast,
  HStack, IconButton, Wrap, WrapItem, useDisclosure,
} from '@chakra-ui/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { IAktion, ILog, EndloesungErgebnis } from '../../types';
import { useMemo, useState, useEffect } from 'react';
import { 
  FiZap, FiClipboard, FiThermometer, FiCamera, 
  FiDroplet, FiPlusSquare, FiScissors, FiShield,
  FiEdit, FiTrash
} from 'react-icons/fi';
import { isToday, format } from 'date-fns';
import { de } from 'date-fns/locale';
import { PflanzenProtokollModal } from './PflanzenProtokollModal';
import { UmgebungProtokollModal } from './UmgebungProtokollModal';
import { FotoLogModal } from './FotoLogModal';
import { LogLoeschenModal } from './LogLoeschenModal';
import { AktionErstellenModal } from './AktionErstellenModal';
import { AktionLoeschenModal } from './AktionLoeschenModal';

// === HILFSFUNKTIONEN ===
const getDateRange = (date: Date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};
const aktionIcons: { [key in IAktion['typ']]: any } = {
  wasser: FiDroplet,
  naehrstoffe: FiPlusSquare,
  ph: FiPlusSquare,
  training: FiScissors,
  beschneiden: FiScissors,
  schutz: FiShield,
};
const logIcons: { [key in ILog['typ']]: any } = {
  pflanze: FiClipboard,
  umgebung: FiThermometer,
  foto: FiCamera,
};

// === SUB-KOMPONENTE: Nährwert-Anzeige ===
function NaehrwertAnzeige({ ergebnis }: { ergebnis: EndloesungErgebnis }) {
  const eintraege = Object.entries(ergebnis)
    .filter(([, val]) => val && val > 0)
    .map(([key, val]) => ({
      key: key.replace('_gesamt', ''),
      val: val
    }));

  return (
    <Wrap spacing="10px" mt={3}>
      {eintraege.map(e => (
        <WrapItem key={e.key}>
          <Tag colorScheme="green" size="sm" variant="outline">
            {e.key}: {e.val < 0.1 ? e.val.toFixed(3) : e.val.toFixed(1)}
          </Tag>
        </WrapItem>
      ))}
      <WrapItem><Tag colorScheme="gray" size="sm" variant="outline">(mg/l)</Tag></WrapItem>
    </Wrap>
  );
}

// === SUB-KOMPONENTE: Aktion (Aktualisiert für Bug-Fix) ===
function AktionCard({ 
  aktion,
  onEdit,
  onDelete
}: { 
  aktion: IAktion,
  onEdit: () => void,
  onDelete: () => void,
}) {
  const toast = useToast();
  const handleToggleAktion = async () => {
    const neuerStatus = aktion.status === 'offen' ? 'erledigt' : 'offen';
    try {
      await db.aktionen.update(aktion.id!, { status: neuerStatus });
      toast({ title: `Aktion ${neuerStatus}`, status: "success", duration: 1500 });
    } catch (error) {
      toast({ title: "Fehler", status: "error", duration: 2000 });
    }
  };
  const uhrzeit = new Date(aktion.datum).toLocaleTimeString('de-DE').substring(0, 5);
  const datum = new Date(aktion.datum).toLocaleDateString('de-DE');
  const { details } = aktion;

  // === HIER IST DIE KORREKTUR ===
  // 1. Definiere den Titel (z.B. "Training")
  const titel = aktion.typ.charAt(0).toUpperCase() + aktion.typ.slice(1);
  
  // 2. Definiere die Unter-Überschrift (die Details)
  let unterueberschrift = aktion.notiz || "Keine Notiz"; // Standard-Fallback
  
  if (aktion.typ === 'training' && details?.trainingTyp) {
    unterueberschrift = details.trainingTyp.toUpperCase();
  }
  if (aktion.typ === 'beschneiden' && details?.beschneidenTyp) {
    unterueberschrift = details.beschneidenTyp.replace('_', ' ').toUpperCase();
  }
  if ((aktion.typ === 'wasser' || aktion.typ === 'naehrstoffe' || aktion.typ === 'ph') && details?.mengeL) {
    unterueberschrift = `${details.mengeL} L | ${aktion.notiz || "Keine Notiz"}`;
  }
  // === ENDE KORREKTUR ===

  return (
    <Box w="100%" p={3} bg="gray.800" borderRadius="md">
      <Flex align="center">
        <Checkbox 
          colorScheme="green"
          isChecked={aktion.status === 'erledigt'}
          onChange={handleToggleAktion}
          mr={3}
          size="lg"
        />
        <Icon as={aktionIcons[aktion.typ] || FiZap} color="green.300" />
        <Box ml={3}>
          {/* Titel (z.B. "Training") */}
          <Text fontWeight="bold" textTransform="capitalize" textDecoration={aktion.status === 'erledigt' ? 'line-through' : 'none'}>
            {titel}
          </Text>
          {/* Unter-Überschrift (z.B. "LST") */}
          <Text fontSize="sm" color="gray.400" noOfLines={1}>
            {unterueberschrift}
          </Text>
        </Box>
        <Spacer />
        <Tag size="sm">{datum}</Tag>
        <Tag size="sm" ml={2}>{uhrzeit}</Tag>
        <HStack spacing={0} ml={2}>
          <IconButton icon={<FiEdit />} aria-label="Bearbeiten" variant="ghost" size="sm" onClick={onEdit} />
          <IconButton icon={<FiTrash />} aria-label="Löschen" variant="ghost" colorScheme="red" size="sm" onClick={onDelete} />
        </HStack>
      </Flex>
      
      {details?.berechnetesErgebnis_mg_l && (
        <NaehrwertAnzeige ergebnis={details.berechnetesErgebnis_mg_l} />
      )}
    </Box>
  );
}

// === SUB-KOMPONENTE: Messwerte (Unverändert) ===
function MesswerteAnzeige({ messwerte }: { messwerte: NonNullable<ILog['messwerte']> }) {
  const ignorierteSchluessel = [
    'pumpenintervall_on', 'pumpenintervall_on_einheit',
    'pumpenintervall_off', 'pumpenintervall_off_einheit'
  ];
  const eintraege = Object.entries(messwerte)
    .filter(([key, val]) => val !== undefined && val !== null && !ignorierteSchluessel.includes(key))
    .map(([key, val]) => ({ key, val }));
  return (
    <Wrap spacing="10px" mt={3}>
      {eintraege.map(e => (
        <WrapItem key={e.key}><Tag colorScheme="blue" size="sm">{e.key.replace('_', ' ')}: {e.val}</Tag></WrapItem>
      ))}
      {messwerte.pumpenintervall_on !== undefined && (
        <WrapItem><Tag colorScheme="blue" size="sm">Pumpe ON: {messwerte.pumpenintervall_on} {messwerte.pumpenintervall_on_einheit || 'min'}</Tag></WrapItem>
      )}
      {messwerte.pumpenintervall_off !== undefined && (
        <WrapItem><Tag colorScheme="blue" size="sm">Pumpe OFF: {messwerte.pumpenintervall_off} {messwerte.pumpenintervall_off_einheit || 'min'}</Tag></WrapItem>
      )}
    </Wrap>
  );
}

// === SUB-KOMPONENTE: Log (Unverändert) ===
function LogCard({ log, onEdit, onDelete }: { log: ILog, onEdit: () => void, onDelete: () => void }) {
  const [fotoUrl, setFotoUrl] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (log.typ === 'foto' && log.foto) {
      const url = URL.createObjectURL(log.foto);
      setFotoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [log]);
  const uhrzeit = new Date(log.datum).toLocaleTimeString('de-DE').substring(0, 5);
  const datum = new Date(log.datum).toLocaleDateString('de-DE');
  return (
    <Box w="100%" p={3} bg="gray.700" borderRadius="md">
      <Flex align="center">
        <Icon as={logIcons[log.typ] || FiClipboard} color="blue.300" />
        <Box ml={3}>
          <Text fontWeight="bold" textTransform="capitalize">Protokoll: {log.typ}</Text>
          <Text fontSize="sm" color="gray.300" noOfLines={1}>{log.notiz || "Keine Notiz"}</Text>
        </Box>
        <Spacer />
        <Tag size="sm">{datum}</Tag>
        <Tag size="sm" ml={2}>{uhrzeit}</Tag>
        <HStack spacing={0} ml={2}>
          <IconButton icon={<FiEdit />} aria-label="Bearbeiten" variant="ghost" size="sm" onClick={onEdit} />
          <IconButton icon={<FiTrash />} aria-label="Löschen" variant="ghost" colorScheme="red" size="sm" onClick={onDelete} />
        </HStack>
      </Flex>
      {log.typ === 'foto' && fotoUrl && ( <Image src={fotoUrl} maxH="300px" w="100%" objectFit="cover" borderRadius="md" mt={3} /> )}
      {log.messwerte && (<MesswerteAnzeige messwerte={log.messwerte} />)}
    </Box>
  );
}

// === HAUPT-KOMPONENTE (Unverändert) ===
interface TagebuchProps {
  filterPflanzenId?: number;
  showAll?: boolean;
  selectedDate?: Date;
}
export function Tagebuch({ filterPflanzenId, showAll, selectedDate }: TagebuchProps) {
  
  const { start, end } = getDateRange(selectedDate || new Date());

  const [logToEdit, setLogToEdit] = useState<ILog | undefined>(undefined);
  const [logToDelete, setLogToDelete] = useState<ILog | undefined>(undefined);
  const { isOpen: isPflanzeOpen, onOpen: onPflanzeOpen, onClose: onPflanzeClose } = useDisclosure();
  const { isOpen: isUmgebungOpen, onOpen: onUmgebungOpen, onClose: onUmgebungClose } = useDisclosure();
  const { isOpen: isFotoOpen, onOpen: onFotoOpen, onClose: onFotoClose } = useDisclosure();
  const { isOpen: isLogDeleteOpen, onOpen: onLogDeleteOpen, onClose: onLogDeleteClose } = useDisclosure();
  
  const [aktionToEdit, setAktionToEdit] = useState<IAktion | undefined>(undefined);
  const [aktionToDelete, setAktionToDelete] = useState<IAktion | undefined>(undefined);
  const { isOpen: isAktionOpen, onOpen: onAktionOpen, onClose: onAktionClose } = useDisclosure();
  const { isOpen: isAktionDeleteOpen, onOpen: onAktionDeleteOpen, onClose: onAktionDeleteClose } = useDisclosure();

  const aktionen = useLiveQuery(
    () => {
      if (filterPflanzenId) return db.aktionen.where('zielPflanzenIds').equals(filterPflanzenId).reverse().toArray();
      if (showAll) return db.aktionen.orderBy('datum').reverse().toArray(); 
      return db.aktionen.where('datum').between(start, end).toArray();
    }, [filterPflanzenId, showAll, start, end]
  );
  
  const logs = useLiveQuery(
    () => {
      if (filterPflanzenId) return db.logs.where('zielPflanzenIds').equals(filterPflanzenId).reverse().toArray();
      if (showAll) return db.logs.orderBy('datum').reverse().toArray();
      return db.logs.where('datum').between(start, end).toArray();
    }, [filterPflanzenId, showAll, start, end]
  );

  const eintraege = useMemo(() => {
    const alleEintraege: (IAktion | ILog)[] = [ ...(aktionen || []), ...(logs || []) ];
    return alleEintraege.sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime());
  }, [aktionen, logs]);

  const handleLogEdit = (log: ILog) => { setLogToEdit(log); if (log.typ === 'pflanze') onPflanzeOpen(); if (log.typ === 'umgebung') onUmgebungOpen(); if (log.typ === 'foto') onFotoOpen(); };
  const handleLogDelete = (log: ILog) => { setLogToDelete(log); onLogDeleteOpen(); };
  const handleLogEditClose = () => { setLogToEdit(undefined); onPflanzeClose(); onUmgebungClose(); onFotoClose(); };
  const handleLogDeleteClose = () => { setLogToDelete(undefined); onLogDeleteClose(); };
  
  const handleAktionEdit = (aktion: IAktion) => { setAktionToEdit(aktion); onAktionOpen(); };
  const handleAktionDelete = (aktion: IAktion) => { setAktionToDelete(aktion); onAktionDeleteOpen(); };
  const handleAktionEditClose = () => { setAktionToEdit(undefined); onAktionClose(); };
  const handleAktionDeleteClose = () => { setAktionToDelete(undefined); onAktionDeleteClose(); };

  let titel = "TAGEBUCH";
  if (filterPflanzenId) titel = "Gesamtes Protokoll (Pflanze)";
  else if (showAll) titel = "Gesamtes Protokoll (Alle)";
  else if (selectedDate && isToday(selectedDate)) titel = "TAGEBUCH (HEUTE)";
  else if (selectedDate) titel = `TAGEBUCH (${format(selectedDate, 'd. LLL', { locale: de }).toUpperCase()})`;

  return (
    <Box p={4} pb="100px"> 
      <Heading size="sm" color="gray.400" mb={4}>{titel}</Heading>
      {eintraege.length === 0 ? (
        <Box bg="gray.800" p={4} borderRadius="md" textAlign="center"><Text color="gray.400">Keine Einträge für diesen Tag</Text></Box>
      ) : (
        <VStack spacing={3}>
          {eintraege.map(eintrag => {
            if ('status' in eintrag) {
              return (
                <AktionCard 
                  key={`aktion-${eintrag.id}`} 
                  aktion={eintrag as IAktion} 
                  onEdit={() => handleAktionEdit(eintrag as IAktion)}
                  onDelete={() => handleAktionDelete(eintrag as IAktion)}
                />
              );
            }
            const log = eintrag as ILog;
            return (
              <LogCard 
                key={`log-${log.id}`} 
                log={log} 
                onEdit={() => handleLogEdit(log)}
                onDelete={() => handleLogDelete(log)}
              />
            );
          })}
        </VStack> 
      )}
      
      {logToDelete && ( <LogLoeschenModal isOpen={isLogDeleteOpen} onClose={handleLogDeleteClose} logToDelete={logToDelete} /> )}
      {logToEdit && (
        <>
          <PflanzenProtokollModal isOpen={isPflanzeOpen} onClose={handleLogEditClose} logToEdit={logToEdit.typ === 'pflanze' ? logToEdit : undefined} />
          <UmgebungProtokollModal isOpen={isUmgebungOpen} onClose={handleLogEditClose} logToEdit={logToEdit.typ === 'umgebung' ? logToEdit : undefined} />
          <FotoLogModal isOpen={isFotoOpen} onClose={handleLogEditClose} logToEdit={logToEdit.typ === 'foto' ? logToEdit : undefined} />
        </>
      )}
      
      {aktionToDelete && (
        <AktionLoeschenModal
          isOpen={isAktionDeleteOpen}
          onClose={handleAktionDeleteClose}
          aktionToDelete={aktionToDelete}
        />
      )}
      <AktionErstellenModal
        isOpen={isAktionOpen}
        onClose={handleAktionEditClose}
        aktionToEdit={aktionToEdit}
      />
    </Box>
  );
}