// In Datei: src/pages/ProtokollPage.tsx
// VOLLSTÄNDIGER CODE

import { Tagebuch } from '../components/Dashboard/Tagebuch';

export function ProtokollPage() {
  // Zeige das Tagebuch-Modul im "showAll"-Modus
  // (Zeigt alle Logs und Aktionen aus der gesamten Datenbank)
  return <Tagebuch showAll={true} />;
}