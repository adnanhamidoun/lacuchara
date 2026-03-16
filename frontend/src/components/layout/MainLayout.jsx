import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Sun, Moon, Crown, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'

export default function MainLayout({ children }) {
  const [theme, setTheme] = useState('light')
  const { session, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const savedTheme = localStorage.getItem('aml-theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const nextTheme = savedTheme || (prefersDark ? 'dark' : 'light')
    setTheme(nextTheme)
    document.documentElement.classList.toggle('dark', nextTheme === 'dark')
  }, [])

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('aml-theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[var(--bg)] text-[var(--text)]">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="animate-ambient-shift absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(216,139,90,0.09),transparent_32%),radial-gradient(circle_at_82%_10%,rgba(122,162,255,0.09),transparent_36%)] dark:bg-[radial-gradient(circle_at_20%_15%,rgba(216,139,90,0.12),transparent_34%),radial-gradient(circle_at_82%_10%,rgba(122,162,255,0.14),transparent_38%)]" />
      </div>

      <div aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-[1] hidden h-screen w-20 overflow-hidden xl:block">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to right, rgba(224,123,84,0.07), transparent)' }}
        />

        <div
          className="absolute h-2 w-2 rounded-full bg-orange-400/20 animate-side-float"
          style={{ left: '20px', animationDelay: '0s', animationDuration: '12s' }}
        />
        <div
          className="absolute h-2 w-2 rounded-full bg-orange-400/20 animate-side-float"
          style={{ left: '45px', animationDelay: '3s', animationDuration: '12s' }}
        />
        <div
          className="absolute h-2 w-2 rounded-full bg-orange-400/20 animate-side-float"
          style={{ left: '10px', animationDelay: '6s', animationDuration: '12s' }}
        />

        <div
          className="absolute right-0 top-[10%] h-[80%]"
          style={{ borderRight: '1px dashed rgba(224,123,84,0.15)' }}
        />

        <svg
          viewBox="0 0 24 24"
          className="absolute bottom-[20%] left-1/2 h-12 w-12 -translate-x-1/2 text-orange-400 opacity-5 animate-side-sway"
          fill="currentColor"
        >
          <path d="M12 2 C8 2 5 5 5 9 c0 3 1.5 5.5 4 7 L8 22 h8 l-1-6 c2.5-1.5 4-4 4-7 0-4-3-7-7-7z" />
        </svg>
      </div>

      <div aria-hidden="true" className="pointer-events-none fixed right-0 top-0 z-[1] hidden h-screen w-20 overflow-hidden xl:block">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to left, rgba(224,123,84,0.07), transparent)' }}
        />

        <div
          className="absolute h-2 w-2 rounded-full bg-orange-400/20 animate-side-float"
          style={{ right: '20px', animationDelay: '1.5s', animationDuration: '12s' }}
        />
        <div
          className="absolute h-2 w-2 rounded-full bg-orange-400/20 animate-side-float"
          style={{ right: '45px', animationDelay: '4.5s', animationDuration: '12s' }}
        />
        <div
          className="absolute h-2 w-2 rounded-full bg-orange-400/20 animate-side-float"
          style={{ right: '10px', animationDelay: '7.5s', animationDuration: '12s' }}
        />

        <div
          className="absolute left-0 top-[10%] h-[80%]"
          style={{ borderLeft: '1px dashed rgba(224,123,84,0.15)' }}
        />

        <svg
          viewBox="0 0 24 24"
          className="absolute left-1/2 top-[25%] h-10 w-10 -translate-x-1/2 text-orange-400 opacity-5 animate-side-sway"
          fill="currentColor"
        >
          <path d="M7 2v6c0 1.1.9 2 2 2v12h2V10c1.1 0 2-.9 2-2V2h-1v5H10V2H9v5H8V2H7z" />
        </svg>
      </div>

      <header className="sticky top-0 z-40 border-b border-[#3A3037]/60 bg-[var(--bg)]/80 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 items-center gap-4 px-4 py-4 md:grid-cols-3">
          <Link to="/cliente/restaurantes" className="justify-self-start">
            <h1 className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight text-[var(--text)]">
              <Crown size={20} className="text-[var(--accent)]" />
              CUISINE AML
            </h1>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Prestige Restaurant Management</p>
          </Link>

          <nav className="justify-self-center">
            <ul className="luxury-panel inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-[#3A3037]/60 bg-[var(--surface)]/70 p-1.5 shadow-[0_0_0_1px_rgba(216,139,90,0.08)]">
              <li>
                <Link to="/cliente/restaurantes#inicio" className="inline-flex rounded-xl px-4 py-2 text-sm font-semibold text-[var(--text)] transition-all duration-200 hover:bg-[var(--surface-soft)]">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/cliente/restaurantes#explorar" className="inline-flex rounded-xl px-4 py-2 text-sm font-semibold text-[var(--text)] transition-all duration-200 hover:bg-[var(--surface-soft)]">
                  Explorar
                </Link>
              </li>
              <li>
                <Link to="/cliente/restaurantes#sobre-nosotros" className="inline-flex rounded-xl px-4 py-2 text-sm font-semibold text-[var(--text)] transition-all duration-200 hover:bg-[var(--surface-soft)]">
                  Sobre Nosotros
                </Link>
              </li>
            </ul>
          </nav>

          <div className="justify-self-end">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center gap-2 rounded-xl border border-[#3A3037]/70 bg-[var(--surface)]/75 px-3 py-2 text-xs font-semibold text-[var(--text)] transition-all duration-200 hover:brightness-110"
              >
                {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
                {theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
              </button>

              {session ? (
                <>
                  {session.role === 'admin' ? (
                    <NavLink
                      to="/admin/inscripciones"
                      className="inline-flex items-center rounded-xl border border-[#3A3037]/70 bg-[var(--surface)]/75 px-4 py-2 text-sm font-semibold text-[var(--text)] transition-all duration-200 hover:bg-[var(--surface-soft)]"
                    >
                      Dashboard Admin
                    </NavLink>
                  ) : (
                    <NavLink
                      to="/restaurante/panel"
                      className="inline-flex items-center rounded-xl bg-gradient-to-r from-[#C9794D] to-[#E09A63] px-4 py-2 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(201,121,77,0.35)] transition-all duration-200 hover:brightness-105"
                    >
                      Mi restaurante
                    </NavLink>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-rose-600/10 px-4 py-2 text-sm font-semibold text-rose-500 transition-all duration-200 hover:bg-rose-600/20"
                    title="Cerrar sesión"
                  >
                    <LogOut size={16} />
                  </button>
                </>
              ) : (
                <>
                  <NavLink
                    to="/login"
                    className="inline-flex items-center rounded-xl border border-[#3A3037]/70 bg-[var(--surface)]/75 px-4 py-2 text-sm font-semibold text-[var(--text)] transition-all duration-200 hover:bg-[var(--surface-soft)]"
                  >
                    Iniciar Sesión
                  </NavLink>

                  <NavLink
                    to="/restaurante/alta"
                    className="inline-flex items-center rounded-xl bg-gradient-to-r from-[#C9794D] to-[#E09A63] px-4 py-2 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(201,121,77,0.35)] transition-all duration-200 hover:brightness-105"
                  >
                    Únete como Restaurante
                  </NavLink>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-[1600px] px-4 py-6">{children}</main>
    </div>
  )
}
