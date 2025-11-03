// In Datei: src/App.tsx
// VOLLSTÄNDIGER CODE (zur Überprüfung)

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/Navigation/MainLayout';
import { DashboardPage } from './pages/DashboardPage';
import { PflanzenPage } from './pages/PflanzenPage';
import { UmgebungenPage } from './pages/UmgebungenPage';
import { ProtokollPage } from './pages/ProtokollPage';
import { EinstellungenPage } from './pages/EinstellungenPage';
import { WasserprofilePage } from './pages/WasserprofilePage';
import { NaehrsalzePage } from './pages/NaehrsalzePage';
import { SaeurenPage } from './pages/SaeurenPage';
import { PflanzeDetailPage } from './pages/PflanzeDetailPage';
import { StammlosungenPage } from './pages/StammlosungenPage';
import { StammlosungRechnerPage } from './pages/StammlosungRechnerPage';
// Dieser Import funktioniert nach der Umbenennung
import { NaehrlosungRechnerPage } from './pages/NaehrlosungRechnerPage'; 
import { NaehrsalzDetailPage } from './pages/NaehrsalzDetailPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routen mit unterer Navigationsleiste */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="pflanzen" element={<PflanzenPage />} />
          <Route path="umgebungen" element={<UmgebungenPage />} />
          <Route path="protokoll" element={<ProtokollPage />} />
          <Route path="einstellungen" element={<EinstellungenPage />} />
        </Route>
        
        {/* Routen ohne untere Navigationsleiste (Detail/Rechner-Seiten) */}
        <Route path="wasserprofile" element={<WasserprofilePage />} />
        <Route path="naehrsalze" element={<NaehrsalzePage />} />
        <Route path="naehrsalze/:salzId" element={<NaehrsalzDetailPage />} /> 
        <Route path="saeuren" element={<SaeurenPage />} />
        <Route path="pflanze/:pflanzenId" element={<PflanzeDetailPage />} />
        <Route path="stammlosungen" element={<StammlosungenPage />} />
        
        <Route path="stammlosung-rechner" element={<StammlosungRechnerPage />} />
        <Route path="stammlosung-rechner/:rezeptId" element={<StammlosungRechnerPage />} />

        {/* Diese Route passt jetzt zum Import */}
        <Route path="naehrlosung-rechner" element={<NaehrlosungRechnerPage />} />
      </Routes>
    </BrowserRouter>
  );
}