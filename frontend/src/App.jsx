import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'
import GeolocationPrompt from './components/GeolocationPrompt'
import { LocationProvider, useUserLocation } from './context/LocationContext'
import AdminDashboardView from './views/admin/AdminDashboardView.tsx'
import LoginView from './views/auth/LoginView.tsx'
import MenuView from './views/client/MenuView.tsx'
import LandingPageView from './views/client/LandingPageView.tsx'
import CatalogView from './views/client/CatalogView.tsx'
import AboutView from './views/client/AboutView.tsx'
import RestaurantOnboardingView from './views/restaurant/RestaurantOnboardingView.tsx'
import RestaurantPanelView from './views/restaurant/RestaurantPanelView.tsx'

function NotFoundView() {
  return (
    <section className="rounded-2xl border border-[#1A1A2E]/10 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-[#1A1A2E]">Ruta no encontrada</h2>
      <p className="mt-2 text-sm text-[#1A1A2E]/70">
        Usa la navegación superior para acceder a Cliente, Restaurante o Administrador.
      </p>
    </section>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPageView />} />
      <Route path="/restaurantes" element={<CatalogView />} />
      <Route path="/sobre-nosotros" element={<AboutView />} />

      <Route path="/cliente/restaurantes" element={<Navigate to="/" replace />} />
      <Route
        path="/cliente/restaurantes/:restaurantId/menu"
        element={<MenuView />}
      />

      <Route path="/restaurante/alta" element={<RestaurantOnboardingView />} />
      <Route
        path="/restaurante/panel"
        element={
          <ProtectedRoute role="restaurant_owner">
            <RestaurantPanelView />
          </ProtectedRoute>
        }
      />

      {/* Auth Compartido */}
      <Route path="/login" element={<LoginView />} />
      <Route path="/admin/login" element={<LoginView />} />

      {/* Admin Routes */}
      <Route
        path="/admin/inscripciones"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboardView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/administrador"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboardView />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFoundView />} />
    </Routes>
  );
}

function AppContent() {
  const { userLocation, updateLocation } = useUserLocation();
  const [showGeoPrompt, setShowGeoPrompt] = useState(true);

  return (
    <>
      {showGeoPrompt && !userLocation && (
        <GeolocationPrompt
          onLocationReceived={(location) => {
            updateLocation(location);
            setShowGeoPrompt(false);
          }}
          onDismiss={() => setShowGeoPrompt(false)}
        />
      )}
      <MainLayout>
        <AppRoutes />
      </MainLayout>
    </>
  );
}

export default function App() {
  return (
    <LocationProvider>
      <AppContent />
    </LocationProvider>
  );
}
