import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import DocsPage from './pages/DocsPage';
import styles from './App.module.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { auth } = useAuth();
  if (auth) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function HomeRoute() {
  const { auth } = useAuth();
  if (auth) return <Navigate to="/app/chat" replace />;
  return <LandingPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <div className={styles.app}>
            <Routes>
              {/* 公开页面 */}
              <Route path="/" element={<HomeRoute />} />
              <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
              <Route path="/docs" element={<DocsPage />} />

              {/* 应用（需登录） */}
              <Route path="/app" element={<ProtectedRoute><Navigate to="/app/chat" replace /></ProtectedRoute>} />
              <Route path="/app/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
              <Route path="/app/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

              {/* 回退 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}
