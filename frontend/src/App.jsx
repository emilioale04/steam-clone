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

// Game Keys
import { GestionLlavesPage } from './features/game-keys';

// Inventory & Profile & Marketplace
// Steamworks (Administración)
import {
  LoginAdminPage,
  AdminDashboardPage,
  ProtectedAdminRoute,
  AdminAuthProvider
} from './features/admin';

// Inventory & Profile
import { ProfilePage, InventoryPage } from './features/inventory';
import { MarketplacePage } from './features/inventory/pages/MarketplacePage';

import { useState, useEffect } from 'react'
import { Search, User, ShoppingCart, Gamepad2, Star } from 'lucide-react'

const API_URL = 'http://localhost:3000/api';

function App() {
  const { user, loading } = useAuth();
  const [featuredGame, setFeaturedGame] = useState(null);

  const calculateDiscountedPrice = (price, discount) => {
    if (discount === 0) return price;
    return (price - (price * discount / 100)).toFixed(2);
  };

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
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <ProtectedRoute>
            <InventoryPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/marketplace"
        element={
          <ProtectedRoute>
            <MarketplacePage />
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
      <Route 
        path="/steamworks/gestion-llaves" 
        element={
          <DeveloperAuthProvider>
            <ProtectedDeveloperRoute>
              <GestionLlavesPage />
            </ProtectedDeveloperRoute>
          </DeveloperAuthProvider>
        } 
      />
      {/* Redirigir /steamworks a login de desarrolladores */}
      <Route 
        path="/steamworks" 
        element={<Navigate to="/steamworks/login" replace />} 
      />

      {/* ============================================ */}
      {/* RUTAS DE ADMINISTRACIÓN */}
      {/* URL separada: /steamworks/admin-* */}
      {/* ============================================ */}
      <Route 
        path="/steamworks/admin-login" 
        element={
          <AdminAuthProvider>
            <LoginAdminPage />
          </AdminAuthProvider>
        } 
      />
      <Route 
        path="/steamworks/admin-dashboard" 
        element={
          <AdminAuthProvider>
            <ProtectedAdminRoute>
              <AdminDashboardPage />
            </ProtectedAdminRoute>
          </AdminAuthProvider>
        } 
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;