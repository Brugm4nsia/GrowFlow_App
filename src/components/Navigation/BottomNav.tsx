// In Datei: src/components/Navigation/BottomNav.tsx
// VOLLSTÄNDIGER CODE (mit neuen 'fi' Icons)

import { NavLink } from 'react-router-dom';
import { Flex, Text } from '@chakra-ui/react';
// KORREKTUR: Wir verwenden 'fi' (Feather Icons) statt 'io5'
import { 
  FiHome,
  FiDatabase, // Ein besseres Icon für "Protokoll"
  FiGitMerge, // Ein besseres Icon für "Pflanzen" (wie ein Ast)
  FiSun,      // Ein besseres Icon für "Umgebungen"
  FiSettings 
} from 'react-icons/fi'; 

export function BottomNav() {
  const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    color: isActive ? 'green.300' : 'gray.500',
    padding: '8px 0',
  });

  return (
    <Flex
      as="nav"
      position="fixed"
      bottom="0"
      left="0"
      right="0"
      height="80px"
      bg="gray.800"
      borderTop="1px solid"
      borderColor="gray.700"
      align="center"
      zIndex="1000"
    >
      <NavLink to="/dashboard" style={navLinkStyle}>
        <FiHome size={24} />
        <Text fontSize="xs">Start</Text>
      </NavLink>
      
      <NavLink to="/pflanzen" style={navLinkStyle}>
        <FiGitMerge size={24} />
        <Text fontSize="xs">Pflanzen</Text>
      </NavLink>

      <NavLink to="/umgebungen" style={navLinkStyle}>
        <FiSun size={24} />
        <Text fontSize="xs">Umgebungen</Text>
      </NavLink>

      <NavLink to="/protokoll" style={navLinkStyle}>
        <FiDatabase size={24} />
        <Text fontSize="xs">Protokoll</Text>
      </NavLink>

      <NavLink to="/einstellungen" style={navLinkStyle}>
        <FiSettings size={24} />
        <Text fontSize="xs">Mehr</Text>
      </NavLink>
    </Flex>
  );
}