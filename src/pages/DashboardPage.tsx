// In Datei: src/pages/DashboardPage.tsx
// VOLLSTÄNDIGER CODE

import { VStack, Divider } from '@chakra-ui/react';
import { HorizontalCalendar } from '../components/Dashboard/HorizontalCalendar';
import { Werkzeugkiste } from '../components/Dashboard/Werkzeugkiste';
import { Tagebuch } from '../components/Dashboard/Tagebuch';
import { useState } from 'react'; // NEU: Importiere useState

export function DashboardPage() {
  
  // === HIER IST DER FIX ===
  // 1. Erstelle den State für das ausgewählte Datum (Standard: heute)
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  return (
    <VStack spacing={0} align="stretch">
      {/* 2. Übergib den State und den Setter an den Kalender */}
      <HorizontalCalendar 
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate} 
      />
      
      <Divider borderColor="gray.700" />
      <Werkzeugkiste />
      <Divider borderColor="gray.700" />
      
      {/* 3. Übergib den State an das Tagebuch */}
      <Tagebuch 
        selectedDate={selectedDate} 
      />
    </VStack>
  );
}