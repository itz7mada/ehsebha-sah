import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './context/AppContext';
import { useTheme } from './hooks/useTheme';
import { Layout } from './components/common/Layout';
import { Loader } from './components/common/Loader';
import SetupWizard from './pages/SetupWizard';
import Dashboard from './pages/Dashboard';
import { Sections } from './pages/Sections';
import SectionDetail from './pages/SectionDetail';
import Support from './pages/Support';
import Reports from './pages/Reports';
import Journey from './pages/Journey';
import Settings from './pages/Settings';
import ReportPreview from './pages/ReportPreview';

function App() {
  const { state } = useApp();
  useTheme(state.settings?.theme ?? 'system');

  if (!state.initialized) {
    return <Loader />;
  }

  if (!state.settings?.setupComplete) {
    return (
      <Routes>
        <Route path="/setup" element={<SetupWizard />} />
        <Route path="*" element={<Navigate to="/setup" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/report" element={<ReportPreview />} />
      <Route path="*" element={
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/sections" element={<Sections />} />
            <Route path="/sections/:id" element={<SectionDetail />} />
            <Route path="/support" element={<Support />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/journey" element={<Journey />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Layout>
      } />
    </Routes>
  );
}

export default App;
