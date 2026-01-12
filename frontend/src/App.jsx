import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage } from './features/auth';
import { HomePage } from './pages/HomePage';
import { ProtectedRoute } from './shared/components/ProtectedRoute';
import { useAuth } from './shared/context/AuthContext';

// Steamworks (Desarrolladores)
import { 
  LoginDesarrolladorPage, 
  RegisterDesarrolladorPage,
  SteamworksDashboardPage,
  ProtectedDeveloperRoute,
  DeveloperAuthProvider
} from './features/developer-auth';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1b2838] flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* ============================================ */}
      {/* RUTAS DE USUARIOS NORMALES (Steam) */}
      {/* ============================================ */}
      <Route 
        path="/login" 
        element={user ? <Navigate to="/" replace /> : <LoginPage />} 
      />
      <Route 
        path="/register" 
        element={user ? <Navigate to="/" replace /> : <RegisterPage />} 
      />
      <Route 
        path="/forgot-password" 
        element={<ForgotPasswordPage />} 
      />
      <Route 
        path="/reset-password" 
        element={<ResetPasswordPage />} 
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />

      {/* ============================================ */}
      {/* RUTAS DE STEAMWORKS (Desarrolladores) */}
      {/* URL separada: /steamworks/* */}
      {/* ============================================ */}
      <Route 
        path="/steamworks/login" 
        element={
          <DeveloperAuthProvider>
            <LoginDesarrolladorPage />
          </DeveloperAuthProvider>
        } 
      />
      <Route 
        path="/steamworks/registro" 
        element={
          <DeveloperAuthProvider>
            <RegisterDesarrolladorPage />
          </DeveloperAuthProvider>
        } 
      />
      <Route 
        path="/steamworks/dashboard" 
        element={
          <DeveloperAuthProvider>
            <ProtectedDeveloperRoute>
              <SteamworksDashboardPage />
            </ProtectedDeveloperRoute>
          </DeveloperAuthProvider>
        } 
      />
      {/* Redirigir /steamworks a login de desarrolladores */}
      <Route 
        path="/steamworks" 
        element={<Navigate to="/steamworks/login" replace />} 
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;