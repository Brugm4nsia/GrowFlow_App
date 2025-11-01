// In Datei: src/App.tsx
// VOLLSTÄNDIGER CODE

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
import { EndlosungRechnerPage } from './pages/EndlosungRechnerPage';
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
        
        {/* NEUE & GEÄNDERTE ROUTEN FÜR DEN RECHNER */}
        <Route path="stammlosung-rechner" element={<StammlosungRechnerPage />} /> {/* Für "Neu" */}
        <Route path="stammlosung-rechner/:rezeptId" element={<StammlosungRechnerPage />} /> {/* Für "Bearbeiten" */}

        <Route path="endlosung-rechner" element={<EndlosungRechnerPage />} />
      </Routes>
    </BrowserRouter>
  );
}