// In Datei: src/pages/EinstellungenPage.tsx
// VOLLSTÄNDIGER CODE

import { 
  Box, Heading, VStack, Flex, Text, Spacer, Icon, 
  Button, useToast, Input, ButtonGroup
} from '@chakra-ui/react';
import { 
  FiChevronRight, FiDroplet, FiArchive, FiClipboard,
  FiPercent, FiFilter, FiDownload, FiUpload
} from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';
import { useRef } from 'react';
import { db } from '../db';
import { importDB, exportDB } from 'dexie-export-import';

function MenueEintrag({ to, icon, title, description }: { to: string, icon: any, title: string, description: string }) {
  return (
    <Flex 
      as={RouterLink}
      to={to} 
      p={4} 
      bg="gray.800" 
      borderRadius="md" 
      w="100%" 
      align="center"
      _hover={{ bg: "gray.700" }}
    >
      <Icon as={icon} w={6} h={6} color="green.300" />
      <Box ml={4}>
        <Text fontWeight="bold">{title}</Text>
        <Text fontSize="sm" color="gray.400">{description}</Text>
      </Box>
      <Spacer />
      <Icon as={FiChevronRight} />
    </Flex>
  );
}

export function EinstellungenPage() {
  const toast = useToast();
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const blob = await exportDB(db, {
        prettyJson: true, 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `growflow-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast({ title: "Datenbank exportiert", status: "success" });

    } catch (error) {
      console.error(error);
      toast({ title: "Export fehlgeschlagen", description: String(error), status: "error" });
    }
  };
  
  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm("WARNUNG: Der Import überschreibt alle aktuellen Daten. Möchtest du wirklich fortfahren?")) {
      event.target.value = "";
      return;
    }

    try {
      // === HIER IST DIE KORREKTUR ===
      // Alle Optionen entfernt. 'importDB' löscht standardmäßig
      // Tabellen, bevor es importiert, wenn es keine Delta-Datei ist.
      await importDB(file);
      
      toast({ title: "Import erfolgreich!", description: "Die App wird neu geladen.", status: "success" });
      window.location.reload();

    } catch (error) {
      console.error(error);
      toast({ title: "Import fehlgeschlagen", description: "Die Datei ist möglicherweise beschädigt.", status: "error" });
    }
    event.target.value = "";
  };


  return (
    <Box p={4} pb="100px">
      <Heading mb={4}>Mehr (Datenbank)</Heading>
      <VStack spacing={4} mb={8}>
        <MenueEintrag to="/wasserprofile" icon={FiDroplet} title="Wasserprofile" description="Ausgangswasser verwalten" />
        <MenueEintrag to="/naehrsalze" icon={FiArchive} title="Nährsalze" description="Rohsalze & Inhaltsstoffe" />
        <MenueEintrag to="/stammlosungen" icon={FiClipboard} title="Stammlösungen" description="DIY-Rezepte verwalten" />
        <MenueEintrag to="/saeuren" icon={FiPercent} title="Säuren & Basen" description="pH-Regulatoren verwalten" />
      </VStack>
      
      <Heading mb={4}>Rechner</Heading>
      <VStack spacing={4} mb={8}>
        <MenueEintrag to="/endlosung-rechner" icon={FiFilter} title="Endlösungs-Rechner" description="Finale Nährlösung berechnen" />
      </VStack>

      <Heading mb={4}>Datenverwaltung</Heading>
      <VStack spacing={4} align="stretch" bg="gray.800" p={4} borderRadius="md">
        <Text fontSize="sm" color="gray.300">
          Sichere deine Daten oder lade ein bestehendes Backup hoch.
          Achtung: Ein Import überschreibt alle deine aktuellen Daten in der App.
        </Text>
        <ButtonGroup>
          <Button leftIcon={<FiDownload />} colorScheme="blue" onClick={handleExport}>
            Backup exportieren
          </Button>
          <Button leftIcon={<FiUpload />} colorScheme="orange" onClick={handleImportClick}>
            Backup importieren
          </Button>
          <Input 
            type="file" 
            accept=".json"
            hidden 
            ref={importInputRef} 
            onChange={handleFileSelected}
          />
        </ButtonGroup>
      </VStack>

      <Text fontSize="xs" color="gray.500" textAlign="center" mt={12}>
        © {new Date().getFullYear()} GrowFlow. Alle Rechte vorbehalten.
      </Text>
    </Box>
  );
}