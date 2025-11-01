// In Datei: src/components/Dashboard/Werkzeugkiste.tsx
// VOLLSTÄNDIGER CODE

import { Box, Heading, Flex, VStack, Circle, Text, Icon, useDisclosure } from '@chakra-ui/react';
import { 
  FiZap,
  FiCamera,
  FiClipboard,
  FiThermometer,
  FiMoreHorizontal 
} from 'react-icons/fi';
import { AktionErstellenModal } from './AktionErstellenModal';
import { PflanzenProtokollModal } from './PflanzenProtokollModal';
import { UmgebungProtokollModal } from './UmgebungProtokollModal';
// NEU: Importiere das Foto-Modal
import { FotoLogModal } from './FotoLogModal';

function WerkzeugButton({ icon, label, onClick }: { icon: any, label: string, onClick?: () => void }) {
  return (
    <VStack 
      spacing={2} 
      as="button" 
      onClick={onClick}
      _hover={{ opacity: 0.8 }}
    >
      <Circle size="60px" bg="green.500" color="white">
        <Icon as={icon} w={6} h={6} />
      </Circle>
      <Text fontSize="sm" fontWeight="medium">{label}</Text>
    </VStack>
  );
}

export function Werkzeugkiste() {
  const { 
    isOpen: isAktionOpen, 
    onOpen: onAktionOpen, 
    onClose: onAktionClose 
  } = useDisclosure();
  
  const { 
    isOpen: isPflanzenLogOpen, 
    onOpen: onPflanzenLogOpen, 
    onClose: onPflanzenLogClose 
  } = useDisclosure();
  
  const { 
    isOpen: isUmgebungLogOpen, 
    onOpen: onUmgebungLogOpen, 
    onClose: onUmgebungLogClose 
  } = useDisclosure();

  // NEU: Controller für "Foto"
  const { 
    isOpen: isFotoLogOpen, 
    onOpen: onFotoLogOpen, 
    onClose: onFotoLogClose 
  } = useDisclosure();

  return (
    <Box p={4}>
      <Heading size="sm" color="gray.400" mb={4}>WERKZEUGKISTE</Heading>
      
      <Flex justify="space-around">
        <WerkzeugButton 
          icon={FiZap} 
          label="Aktion" 
          onClick={onAktionOpen}
        />
        
        {/* NEU: Button mit 'onFotoLogOpen' verknüpft */}
        <WerkzeugButton 
          icon={FiCamera} 
          label="Foto" 
          onClick={onFotoLogOpen}
        />
        
        <WerkzeugButton 
          icon={FiClipboard} 
          label="Pflanzenpr."
          onClick={onPflanzenLogOpen} 
        />
        
        <WerkzeugButton 
          icon={FiThermometer} 
          label="Umgebung"
          onClick={onUmgebungLogOpen} 
        />
        
        <WerkzeugButton icon={FiMoreHorizontal} label="Mehr" />
      </Flex>

      {/* --- Modals --- */}
      <AktionErstellenModal 
        isOpen={isAktionOpen} 
        onClose={onAktionClose} 
      />
      <PflanzenProtokollModal
        isOpen={isPflanzenLogOpen}
        onClose={onPflanzenLogClose}
      />
      <UmgebungProtokollModal
        isOpen={isUmgebungLogOpen}
        onClose={onUmgebungLogClose}
      />
      {/* NEU: Das "Foto"-Modal */}
      <FotoLogModal
        isOpen={isFotoLogOpen}
        onClose={onFotoLogClose}
      />
    </Box>
  );
}