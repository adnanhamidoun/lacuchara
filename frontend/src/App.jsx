import { Navigate, Route, Routes } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'
import AdminDashboardView from './views/admin/AdminDashboardView.tsx'
import LoginView from './views/auth/LoginView.tsx'
import MenuView from './views/client/MenuView.tsx'
import RestaurantsListView from './views/client/RestaurantsListView.tsx'
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

export default function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/cliente/restaurantes" replace />} />

        <Route path="/cliente/restaurantes" element={<RestaurantsListView />} />
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
    </MainLayout>
  )
}
