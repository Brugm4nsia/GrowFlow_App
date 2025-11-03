// In Datei: src/main.tsx
// VOLLSTÄNDIGER CODE

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { db } from './db';
import { MASTER_NAEHRSALZE } from './data/masterNaehrsalze';
import { MASTER_SAEUREN } from './data/masterSaeuren'; // NEU
import { INaehrsalz, ISaeureBase } from './types'; // NEU

// Seed-Funktion für Nährsalze
async function populateNaehrsalze() {
  await db.transaction('rw', db.naehrsalze, async () => {
    for (const salz of MASTER_NAEHRSALZE) {
      const exists = await db.naehrsalze.where('name').equals(salz.name).first();
      if (!exists) {
        await db.naehrsalze.add(salz as INaehrsalz);
      } else if (exists.isReadOnly) {
        await db.naehrsalze.update(exists.id!, salz);
      }
    }
  });
}

// === NEUE SEED-FUNKTION (Säuren) ===
async function populateSaeuren() {
  await db.transaction('rw', db.saeurenBasen, async () => {
    for (const item of MASTER_SAEUREN) {
      const exists = await db.saeurenBasen.where('name').equals(item.name).first();
      if (!exists) {
        await db.saeurenBasen.add(item as ISaeureBase);
      } else if (exists.isReadOnly) {
        await db.saeurenBasen.update(exists.id!, item);
      }
    }
  });
}
// === ENDE NEUE FUNKTION ===

// Theme (unverändert)
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

// Starte die App, *nachdem* beide Seed-Funktionen gelaufen sind
async function startApp() {
  await db.open();
  // Rufe beide Funktionen parallel auf
  await Promise.all([
    populateNaehrsalze(),
    populateSaeuren() // NEU
  ]);
  
  console.log("Master-Datenbanken erfolgreich synchronisiert.");

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ChakraProvider theme={theme}>
        <App />
      </ChakraProvider>
    </React.StrictMode>
  );
}

startApp(); // App starten