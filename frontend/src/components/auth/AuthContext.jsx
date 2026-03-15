import { createContext, useContext, useEffect, useState } from 'react'
import { getCurrentSession, getStoredSession, login as loginRequest, storeSession } from '../../services/authService.ts'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getStoredSession())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const bootstrap = async () => {
      const stored = getStoredSession()
      if (!stored?.token) {
        setLoading(false)
        return
      }

      try {
        const refreshed = await getCurrentSession(stored.token)
        setSession(refreshed)
        storeSession(refreshed)
      } catch {
        setSession(null)
        storeSession(null)
      } finally {
        setLoading(false)
      }
    }

    bootstrap()
  }, [])

  const login = async (email, password) => {
    const nextSession = await loginRequest(email, password)
    setSession(nextSession)
    storeSession(nextSession)
    return nextSession
  }

  const logout = () => {
    setSession(null)
    storeSession(null)
  }

  return (
    <AuthContext.Provider value={{ session, loading, login, logout, isAuthenticated: Boolean(session?.token) }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}