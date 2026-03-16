import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../components/auth/AuthContext.jsx'

export default function LoginView() {
  const navigate = useNavigate()
  const { login } = useAuth() as any
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await login(email, password)
      if (result.role === 'admin') {
        navigate('/admin/inscripciones', { replace: true })
      } else {
        // Si es restaurante, llevalo al panel
        navigate('/restaurante/panel', { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto max-w-md space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <div>
        <h2 className="text-2xl font-bold text-[var(--text)]">Acceso administrador</h2>
        <p className="text-sm text-[var(--text-muted)]">Inicia sesión para gestionar aprobaciones y restaurantes.</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label className="text-sm font-semibold text-[var(--text)]">Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[#E07B54]"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-[var(--text)]">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[#E07B54]"
          />
        </div>

        {error ? <p className="rounded-lg bg-[#E53935]/10 p-3 text-sm text-[#E53935]">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#E07B54] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:brightness-95 disabled:opacity-60"
        >
          {loading ? 'Accediendo...' : 'Entrar'}
        </button>
      </form>
    </section>
  )
}