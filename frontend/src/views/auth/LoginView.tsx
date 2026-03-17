import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../components/auth/AuthContext.jsx'
import { Lock, CheckCircle2, Loader } from 'lucide-react'

const PRIVATE_FEATURES = [
  {
    title: 'Panel de administración',
    description: 'Aprobaciones, supervisión del catálogo y gestión global de restaurantes.',
  },
  {
    title: 'Panel de restaurante',
    description: 'Gestiona tu perfil, actualiza información y administra tu presencia en CUISINE AML.',
  },
  {
    title: 'Herramientas inteligentes',
    description: 'Accede a paneles y utilidades internas disponibles según tu rol.',
  },
]

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
        navigate('/restaurante/panel', { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative h-screen overflow-hidden bg-gradient-to-br from-[var(--bg)] via-[var(--bg)] to-[var(--surface-soft)]/20">
      {/* Premium Background with glows */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Subtle radial glows */}
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-[#E07B54]/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-[#4f8cff]/5 blur-3xl" />
        
        {/* Vignette */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/5" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex h-screen items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl">
          {/* Desktop Split Layout */}
          <div className="hidden gap-16 lg:grid lg:grid-cols-2 lg:items-center">
            {/* Left: Branding & Context Panel */}
            <div className="space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E07B54]/30 bg-[#E07B54]/10 px-4 py-2">
                <Lock size={16} className="text-[#E07B54]" />
                <span className="text-xs font-semibold tracking-wide text-[#E07B54]">ÁREA PRIVADA</span>
              </div>

              {/* Main Title */}
              <div className="space-y-3">
                <h1 className="text-3xl font-bold leading-tight text-[var(--text)]">
                  Accede a tu área privada
                </h1>
                <p className="text-base text-[var(--text-muted)] leading-relaxed">
                  Inicio de sesión para administradores y restaurantes. El sistema te llevará automáticamente al panel correspondiente.
                </p>
              </div>

              {/* Feature List */}
              <div className="space-y-3">
                {PRIVATE_FEATURES.map((feature, idx) => (
                  <div key={idx} className="flex gap-3">
                    <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0 text-[#E07B54]" />
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text)]">{feature.title}</h3>
                      <p className="text-xs text-[var(--text-muted)]">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Login Card */}
            <div className="flex justify-center">
              <LoginCard
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                error={error}
                loading={loading}
                onSubmit={handleSubmit}
              />
            </div>
          </div>

          {/* Mobile Stacked Layout */}
          <div className="space-y-5 lg:hidden">
            {/* Mobile Branding */}
            <div className="space-y-6 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E07B54]/30 bg-[#E07B54]/10 px-4 py-2">
                <Lock size={16} className="text-[#E07B54]" />
                <span className="text-xs font-semibold tracking-wide text-[#E07B54]">ÁREA PRIVADA</span>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-[var(--text)]">
                  Acceso privado
                </h1>
                <p className="text-sm text-[var(--text-muted)]">
                  Inicio de sesión para administradores y restaurantes.
                </p>
              </div>
            </div>

            {/* Mobile Login Card */}
            <div className="mx-auto w-full max-w-sm">
              <LoginCard
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                error={error}
                loading={loading}
                onSubmit={handleSubmit}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface LoginCardProps {
  email: string
  setEmail: (value: string) => void
  password: string
  setPassword: (value: string) => void
  error: string
  loading: boolean
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}

function LoginCard({
  email,
  setEmail,
  password,
  setPassword,
  error,
  loading,
  onSubmit,
}: LoginCardProps) {
  return (
    <div className="w-full max-w-sm space-y-5 rounded-2xl border border-[var(--border)]/30 bg-[var(--surface)]/95 p-6 shadow-2xl backdrop-blur-sm">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold text-[var(--text)]">Iniciar Sesión</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Acceso para administradores y restaurantes de CUISINE AML.
        </p>
      </div>

      {/* Form */}
      <form className="space-y-4" onSubmit={onSubmit}>
        {/* Email Input */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-[var(--text)]">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="w-full rounded-xl border border-[var(--border)]/50 bg-[var(--surface-soft)] px-4 py-2.5 text-sm font-medium text-[var(--text)] placeholder:text-[var(--text-muted)]/60 outline-none transition-all duration-200 focus:border-[#E07B54]/60 focus:ring-2 focus:ring-[#E07B54]/20"
          />
        </div>

        {/* Password Input */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-[var(--text)]">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-[var(--border)]/50 bg-[var(--surface-soft)] px-4 py-2.5 text-sm font-medium text-[var(--text)] placeholder:text-[var(--text-muted)]/60 outline-none transition-all duration-200 focus:border-[#E07B54]/60 focus:ring-2 focus:ring-[#E07B54]/20"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-xl border border-[#E53935]/30 bg-[#E53935]/10 px-4 py-2.5">
            <p className="text-xs text-[#E53935] font-medium">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-[#E07B54] to-[#D88B5A] px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-[#E07B54]/30 hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader size={18} className="animate-spin" />
              Accediendo...
            </>
          ) : (
            'Entrar'
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="border-t border-[var(--border)]/20 pt-3">
        <p className="text-center text-xs text-[var(--text-muted)]">
          Acceso restringido a usuarios autorizados de CUISINE AML.
          <span className="text-[#E07B54]"> Contacta con soporte si tienes dudas.</span>
        </p>
      </div>
    </div>
  )
}