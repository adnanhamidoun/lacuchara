import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'

export default function ProtectedRoute({ children, role }) {
  const { session, loading } = useAuth()

  if (loading) {
    return <p className="text-sm text-[var(--text-muted)]">Comprobando sesión...</p>
  }

  if (!session) {
    return <Navigate to={role === 'admin' ? '/admin/login' : '/restaurante/login'} replace />
  }

  if (role && session.role !== role) {
    return <Navigate to="/cliente/restaurantes" replace />
  }

  return children
}