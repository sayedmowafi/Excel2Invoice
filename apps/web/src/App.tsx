import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/components/layout/Layout';
import ServerWakeup from '@/components/ServerWakeup';
import LandingPage from '@/pages/LandingPage';
import UploadPage from '@/pages/UploadPage';
import SheetSelectionPage from '@/pages/SheetSelectionPage';
import MappingPage from '@/pages/MappingPage';
import ValidationPage from '@/pages/ValidationPage';
import ConfigPage from '@/pages/ConfigPage';
import PreviewPage from '@/pages/PreviewPage';
import GeneratePage from '@/pages/GeneratePage';
import DownloadPage from '@/pages/DownloadPage';

function App() {
  return (
    <ServerWakeup>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<Layout />}>
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/session/:sessionId/sheets" element={<SheetSelectionPage />} />
          <Route path="/session/:sessionId/mapping" element={<MappingPage />} />
          <Route path="/session/:sessionId/validation" element={<ValidationPage />} />
          <Route path="/session/:sessionId/config" element={<ConfigPage />} />
          <Route path="/session/:sessionId/preview" element={<PreviewPage />} />
          <Route path="/session/:sessionId/generate" element={<GeneratePage />} />
          <Route path="/session/:sessionId/download" element={<DownloadPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </ServerWakeup>
  );
}

export default App;
