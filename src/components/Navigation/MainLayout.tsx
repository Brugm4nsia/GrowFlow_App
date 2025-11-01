// In Datei: src/component/Navigation/MainLayout.tsx
// VOLLSTÄNDIGER CODE (zur Überprüfung)

import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav'; // Dieser Pfad ist korrekt
import { Box } from '@chakra-ui/react'; 

export function MainLayout() {
  return (
    <Box>
      <Box as="main" pb="80px"> 
        <Outlet />
      </Box>
      <BottomNav />
    </Box>
  );
}