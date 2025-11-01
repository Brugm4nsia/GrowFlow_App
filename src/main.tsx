// In Datei: src/main.tsx
// VOLLSTÄNDIGER CODE (zur Überprüfung)

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App'; 

// Diese Imports MÜSSEN nach Schritt 1 funktionieren
import { ChakraProvider, extendTheme } from '@chakra-ui/react';

// Erstelle ein dunkles Theme für die App
const theme = extendTheme({
  config: {
    initialColorMode: 'dark', 
    useSystemColorMode: false,
  },
  styles: {
    global: {
      body: {
        bg: 'gray.900', 
        color: 'whiteAlpha.900',
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>
);