import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './store';
import { refreshDatabaseState } from './features/appSlice';

// Layouts
import PublicLayout from './components/Layout/PublicLayout';
import DashboardLayout from './components/Layout/DashboardLayout';

// Components
import AuthPage from './components/AuthPage/AuthPage';
import Home from "./components/Home/Home";
import Dashboard from './components/Dashboard/Dashboard';
import ActivityHistory from './components/ActivityHistory/ActivityHistory';
import GraphBuilder from './components/GraphBuilder/GraphBuilder';
import CustomDashboard from './components/CustomDashboard/CustomDashboard';
import AllGraphs from './components/AllGraphs/AllGraphs';
import PrintableDashboard from './components/PrintableDashboard/PrintableDashboard';
import LandingPage from './components/LandingPage/LandingPage';
import SplashScreen from './components/Common/SplashScreen';

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { token } = useSelector((state: RootState) => state.auth);
  if (!token) {
    return <Navigate to="/auth" replace />;
  }
  return children;
};

// Placeholder Settings Page
const SettingsPlaceholder = () => (
    <div className="dashboard">
        <div className="unified-page-header"><h2>Settings</h2></div>
        <div className="dashboard-container"><div className="glass-panel" style={{ padding: 40, textAlign: 'center' }}>User settings and preferences coming soon.</div></div>
    </div>
);

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const { currentUploadId, uploadedDbPath, databaseState } = useSelector((state: RootState) => state.app);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Artificial delay to show brand splash screen and handle hydration
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 1200);

    if (currentUploadId && uploadedDbPath && !databaseState) {
      dispatch(refreshDatabaseState());
    }

    return () => clearTimeout(timer);
  }, [dispatch, currentUploadId, uploadedDbPath, databaseState]);

  if (isInitializing) {
    return <SplashScreen />;
  }

  return (
    <div className="app-container">
      <div className="main-content">
        <Routes>
          {/* Public Marketing Experience */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            {/* Features can be a standalone page or anchor in landing page */}
          </Route>

          {/* Protected SaaS Workspace */}
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/dashboard">
              {/* Main Views */}
              <Route index element={<Dashboard />} />
              <Route path="upload" element={<Home />} />
              <Route path="graphs" element={<AllGraphs />} />
              <Route path="history" element={<ActivityHistory />} />
              <Route path="settings" element={<SettingsPlaceholder />} />
              
              {/* Advanced / Specialized Views */}
              <Route path="custom" element={<CustomDashboard />} />
              <Route path="designer/:uploadId?" element={<GraphBuilder />} />
              <Route path="print" element={<PrintableDashboard />} />
            </Route>

            {/* Support old paths by redirecting to new /dashboard subpaths */}
            <Route path="/upload" element={<Navigate to="/dashboard/upload" replace />} />
            <Route path="/history" element={<Navigate to="/dashboard/history" replace />} />
            <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
