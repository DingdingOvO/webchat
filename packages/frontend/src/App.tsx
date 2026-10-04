import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import styles from './App.module.css';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LandingPage from './pages/LandingPage';

/*
 * 路由级代码分割。
 *
 * 首屏只有落地页/登录注册需要立刻可用；聊天页（含 WebSocket 上下文）、
 * 文档页（含 marked 与全部 markdown）、设置页都可以等用户真正进入时再加载。
 * 旧版把 7 个页面 + marked + 全部文档打进同一个 452KB 的 bundle，
 * 落地页访客被迫下载整个聊天应用的代码。这里按路由懒加载消除该问题。
 */
const ChatPage = lazy(() => import('./pages/ChatPage'));
const DocsPage = lazy(() => import('./pages/DocsPage'));
const FeedbackPage = lazy(() => import('./pages/FeedbackPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

/** 懒加载期间的占位：一个克制的居中提示，避免白屏闪烁。 */
function RouteFallback() {
  return <div className={styles.fallback}>加载中…</div>;
}

function ProtectedRoute({ children }: { readonly children: React.ReactNode }) {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { readonly children: React.ReactNode }) {
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
      <ThemeProvider>
        <AuthProvider>
          <ErrorBoundary>
            <div className={styles.app}>
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  {/* 公开页面 */}
                  <Route path="/" element={<HomeRoute />} />
                  <Route
                    path="/login"
                    element={
                      <PublicRoute>
                        <LoginPage />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      <PublicRoute>
                        <RegisterPage />
                      </PublicRoute>
                    }
                  />
                  <Route path="/docs" element={<DocsPage />} />
                  <Route path="/feedback" element={<FeedbackPage />} />

                  {/* 应用（需登录） */}
                  <Route
                    path="/app"
                    element={
                      <ProtectedRoute>
                        <Navigate to="/app/chat" replace />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/app/chat"
                    element={
                      <ProtectedRoute>
                        <ChatPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/app/settings"
                    element={
                      <ProtectedRoute>
                        <SettingsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* 回退 */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </div>
          </ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
