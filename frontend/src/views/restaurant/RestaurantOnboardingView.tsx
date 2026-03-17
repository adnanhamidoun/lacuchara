import { useMemo, useState } from 'react'
import { createInscripcion, uploadInscripcionImage } from '../../services/inscripcionesService.ts'
import type { InscripcionCreatePayload } from '../../types/domain'
import { CUISINE_META } from '../../utils/cuisine'

type SegmentOption = 'gourmet' | 'traditional' | 'business' | 'family'
type TerraceOption = 'yearround' | 'summer' | 'none'
type CuisineOption =
  | 'grill'
  | 'spanish'
  | 'mediterranean'
  | 'stew'
  | 'fried'
  | 'italian'
  | 'asian'
  | 'latin'
  | 'arabic'
  | 'avantgarde'
  | 'plantbased'
  | 'streetfood'

const SEGMENT_OPTIONS: Array<{ value: SegmentOption; label: string }> = [
  { value: 'gourmet', label: 'Gourmet' },
  { value: 'traditional', label: 'Tradicional' },
  { value: 'business', label: 'Business' },
  { value: 'family', label: 'Family' },
]

const TERRACE_OPTIONS: Array<{ value: TerraceOption; label: string }> = [
  { value: 'yearround', label: 'Todo el año' },
  { value: 'summer', label: 'Solo verano' },
  { value: 'none', label: 'No tiene' },
]

const CUISINE_OPTIONS: Array<{ value: CuisineOption; label: string }> = [
  { value: 'grill', label: CUISINE_META.grill.label },
  { value: 'spanish', label: CUISINE_META.spanish.label },
  { value: 'mediterranean', label: CUISINE_META.mediterranean.label },
  { value: 'stew', label: CUISINE_META.stew.label },
  { value: 'fried', label: CUISINE_META.fried.label },
  { value: 'italian', label: CUISINE_META.italian.label },
  { value: 'asian', label: CUISINE_META.asian.label },
  { value: 'latin', label: CUISINE_META.latin.label },
  { value: 'arabic', label: CUISINE_META.arabic.label },
  { value: 'avantgarde', label: CUISINE_META.avantgarde.label },
  { value: 'plantbased', label: CUISINE_META.plantbased.label },
  { value: 'streetfood', label: CUISINE_META.streetfood.label },
]

interface FormState {
  name: string
  capacity_limit: string
  table_count: string
  cuisine_type: CuisineOption
  min_service: string
  terrace_setup_type: TerraceOption
  restaurant_segment: SegmentOption
  menu_price: string
  dist_office_towers: string
  google_rating: string
  image_url: string
  google_maps_link: string
  opens_weekends: boolean
  has_wifi: boolean
  login_email?: string
  password?: string
}

type Errors = Partial<Record<keyof FormState, string>>

const INITIAL_FORM: FormState = {
  name: '',
  capacity_limit: '',
  table_count: '',
  cuisine_type: 'grill',
  min_service: '',
  terrace_setup_type: 'yearround',
  restaurant_segment: 'business',
  menu_price: '',
  dist_office_towers: '',
  google_rating: '',
  image_url: '',
  google_maps_link: '',
  opens_weekends: false,
  has_wifi: false,
  login_email: '',
  password: '',
}

const STEPS = [
  { key: 1, title: 'Info básica' },
  { key: 2, title: 'Servicio' },
  { key: 3, title: 'Ubicación y extras' },
]

function isValidUrl(value: string): boolean {
  return /^https?:\/\/.+/i.test(value)
}

function fieldClass(hasError: boolean): string {
  return `w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-all duration-200 ${
    hasError
      ? 'border-[#E53935] bg-[#E53935]/5 focus:ring-2 focus:ring-[#E53935]/20'
      : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:border-[#E07B54] focus:ring-2 focus:ring-[#E07B54]/20'
  }`
}

export default function RestaurantOnboardingView() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const progress = useMemo(() => (step / STEPS.length) * 100, [step])

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const validateStep = (targetStep: number): boolean => {
    const nextErrors: Errors = {}

    if (targetStep === 1) {
      if (!form.name.trim()) nextErrors.name = 'El nombre es obligatorio.'
      if (!form.login_email || !form.login_email.trim()) nextErrors.login_email = 'El email es obligatorio para el acceso.'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.login_email)) nextErrors.login_email = 'El email no es válido.'
      if (!form.password || form.password.length < 6) nextErrors.password = 'La contraseña debe tener al menos 6 caracteres.'
      if (!form.capacity_limit || Number(form.capacity_limit) <= 0) {
        nextErrors.capacity_limit = 'La capacidad debe ser mayor que 0.'
      }
      if (!form.table_count || Number(form.table_count) <= 0) {
        nextErrors.table_count = 'El número de mesas debe ser mayor que 0.'
      }
      if (!form.cuisine_type) nextErrors.cuisine_type = 'El tipo de cocina es obligatorio.'
    }

    if (targetStep === 2) {
      if (!form.min_service.trim()) nextErrors.min_service = 'Indica el tiempo mínimo de servicio.'
      if (!form.menu_price || Number(form.menu_price) < 0) {
        nextErrors.menu_price = 'El precio medio del menú no puede ser negativo.'
      }
      if (!form.dist_office_towers || Number(form.dist_office_towers) < 0) {
        nextErrors.dist_office_towers = 'La distancia debe ser 0 o superior.'
      }
    }

    if (targetStep === 3) {
      if (!form.google_rating || Number(form.google_rating) < 0 || Number(form.google_rating) > 5) {
        nextErrors.google_rating = 'La valoración debe estar entre 0 y 5.'
      }

      if (!form.google_maps_link.trim()) {
        nextErrors.google_maps_link = 'El link de reseñas es obligatorio.'
      } else if (!isValidUrl(form.google_maps_link)) {
        nextErrors.google_maps_link = 'Introduce una URL válida (http/https).'
      }
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const goNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(3, prev + 1))
    }
  }

  const goBack = () => setStep((prev) => Math.max(1, prev - 1))

  const handleSubmit = async () => {
    if (!validateStep(3)) return

    setLoading(true)
    setSuccessMessage('')
    setErrorMessage('')

    try {
      let imageUrl: string | undefined
      if (selectedImageFile) {
        const uploadResult = await uploadInscripcionImage(selectedImageFile)
        imageUrl = uploadResult.image_url
      }

      const payload: InscripcionCreatePayload = {
        name: form.name.trim(),
        capacity_limit: Number(form.capacity_limit),
        table_count: Number(form.table_count),
        cuisine_type: form.cuisine_type,
        min_service: form.min_service.trim(),
        terrace_setup_type: form.terrace_setup_type,
        restaurant_segment: form.restaurant_segment,
        menu_price: Number(form.menu_price),
        dist_office_towers: Number(form.dist_office_towers),
        google_rating: Number(form.google_rating),
        image_url: imageUrl || form.image_url.trim() || undefined,
        google_maps_link: form.google_maps_link.trim(),
        opens_weekends: form.opens_weekends,
        has_wifi: form.has_wifi,
        login_email: form.login_email?.trim() || undefined,
        password: form.password || undefined,
      }

      await createInscripcion(payload)
      setSuccessMessage('Inscripción enviada correctamente para revisión del administrador.')
      setForm(INITIAL_FORM)
      setSelectedImageFile(null)
      setImagePreviewUrl('')
      setErrors({})
      setStep(1)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo enviar la inscripción.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-[var(--text)]">Alta de restaurante</h2>
        <p className="text-sm text-[var(--text-muted)]">Completa el onboarding en 3 pasos.</p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {STEPS.map((item) => (
            <div
              key={item.key}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 ${
                step === item.key
                  ? 'bg-[#E07B54] text-white'
                  : step > item.key
                    ? 'bg-[#4CAF50]/15 text-[#4CAF50]'
                    : 'bg-[var(--surface-soft)] text-[var(--text-muted)]'
              }`}
            >
              {item.key}. {item.title}
            </div>
          ))}
        </div>

        <div className="h-2 w-full rounded-full bg-[var(--surface-soft)]">
          <div
            className="h-2 rounded-full bg-[#E07B54] transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        {step === 1 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-[var(--text)]">Nombre</label>
              <input
                value={form.name}
                onChange={(event) => setField('name', event.target.value)}
                className={fieldClass(Boolean(errors.name))}
              />
              {errors.name ? <p className="text-xs text-[#E53935]">{errors.name}</p> : null}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-[var(--text)]">Email de Vendedor</label>
              <input
                type="email"
                value={form.login_email || ''}
                onChange={(event) => setField('login_email', event.target.value)}
                className={fieldClass(Boolean(errors.login_email))}
              />
              {errors.login_email ? <p className="text-xs text-[#E53935]">{errors.login_email}</p> : null}
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-semibold text-[var(--text)]">Contraseña</label>
              <input
                type="password"
                value={form.password || ''}
                onChange={(event) => setField('password', event.target.value)}
                className={fieldClass(Boolean(errors.password))}
              />
              {errors.password ? <p className="text-xs text-[#E53935]">{errors.password}</p> : null}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-[var(--text)]">Capacidad</label>
              <input
                type="number"
                min={1}
                value={form.capacity_limit}
                onChange={(event) => setField('capacity_limit', event.target.value)}
                className={fieldClass(Boolean(errors.capacity_limit))}
              />
              {errors.capacity_limit ? <p className="text-xs text-[#E53935]">{errors.capacity_limit}</p> : null}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-[var(--text)]">Número de mesas</label>
              <input
                type="number"
                min={1}
                value={form.table_count}
                onChange={(event) => setField('table_count', event.target.value)}
                className={fieldClass(Boolean(errors.table_count))}
              />
              {errors.table_count ? <p className="text-xs text-[#E53935]">{errors.table_count}</p> : null}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-[var(--text)]">Tipo de cocina</label>
              <select
                value={form.cuisine_type}
                onChange={(event) => setField('cuisine_type', event.target.value as CuisineOption)}
                className={fieldClass(Boolean(errors.cuisine_type))}
              >
                {CUISINE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.cuisine_type ? <p className="text-xs text-[#E53935]">{errors.cuisine_type}</p> : null}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-[var(--text)]">Tiempo mínimo servicio</label>
              <input
                value={form.min_service}
                onChange={(event) => setField('min_service', event.target.value)}
                placeholder="Ej: 45"
                className={fieldClass(Boolean(errors.min_service))}
              />
              {errors.min_service ? <p className="text-xs text-[#E53935]">{errors.min_service}</p> : null}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-[var(--text)]">Tipo de terraza</label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {TERRACE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setField('terrace_setup_type', option.value)}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                      form.terrace_setup_type === option.value
                        ? 'border-[#E07B54] bg-[#E07B54] text-white'
                        : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-soft)]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-[var(--text)]">Segmento</label>
              <select
                value={form.restaurant_segment}
                onChange={(event) => setField('restaurant_segment', event.target.value as SegmentOption)}
                className={fieldClass(false)}
              >
                {SEGMENT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-[var(--text)]">Precio medio menú (€)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.menu_price}
                onChange={(event) => setField('menu_price', event.target.value)}
                className={fieldClass(Boolean(errors.menu_price))}
              />
              {errors.menu_price ? <p className="text-xs text-[#E53935]">{errors.menu_price}</p> : null}
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-semibold text-[var(--text)]">Distancia a oficinas (m)</label>
              <input
                type="number"
                min={0}
                value={form.dist_office_towers}
                onChange={(event) => setField('dist_office_towers', event.target.value)}
                className={fieldClass(Boolean(errors.dist_office_towers))}
              />
              {errors.dist_office_towers ? <p className="text-xs text-[#E53935]">{errors.dist_office_towers}</p> : null}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-[var(--text)]">Valoración (0-5)</label>
              <input
                type="number"
                min={0}
                max={5}
                step="0.1"
                value={form.google_rating}
                onChange={(event) => setField('google_rating', event.target.value)}
                placeholder="Ej: 4.3"
                className={fieldClass(Boolean(errors.google_rating))}
              />
              {errors.google_rating ? <p className="text-xs text-[#E53935]">{errors.google_rating}</p> : null}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-[var(--text)]">Link de reseñas (Google Maps)</label>
              <input
                type="url"
                value={form.google_maps_link}
                onChange={(event) => setField('google_maps_link', event.target.value)}
                placeholder="https://maps.google.com/..."
                className={fieldClass(Boolean(errors.google_maps_link))}
              />
              {errors.google_maps_link ? <p className="text-xs text-[#E53935]">{errors.google_maps_link}</p> : null}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-[var(--text)]">Imagen del restaurante (Opcional)</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (!file) {
                    setSelectedImageFile(null)
                    setImagePreviewUrl('')
                    return
                  }

                  setSelectedImageFile(file)
                  setField('image_url', '')

                  const reader = new FileReader()
                  reader.onloadend = () => {
                    setImagePreviewUrl(reader.result as string)
                  }
                  reader.readAsDataURL(file)
                }}
                className="w-full text-sm mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#1A1A2E]/5 file:text-[#1A1A2E] hover:file:bg-[#1A1A2E]/10 cursor-pointer text-[var(--text)]"
              />
              {selectedImageFile ? (
                <p className="text-xs text-green-600 mt-1">✔ Imagen seleccionada. Se subirá al enviar la inscripción.</p>
              ) : null}
              {imagePreviewUrl ? (
                <div className="mt-3 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/40">
                  <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2">
                    <p className="text-xs font-semibold text-[var(--text)]">Vista previa</p>
                    <p className="truncate text-xs text-[var(--text-muted)] max-w-[60%]" title={selectedImageFile?.name || ''}>
                      {selectedImageFile?.name}
                    </p>
                  </div>
                  <div className="relative flex min-h-[220px] items-center justify-center bg-gradient-to-br from-[var(--surface-soft)] to-[var(--surface)] p-3">
                    <img
                      src={imagePreviewUrl}
                      alt="Vista previa"
                      className="max-h-[320px] w-full rounded-lg object-contain"
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setField('opens_weekends', !form.opens_weekends)}
                className={`rounded-lg border px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  form.opens_weekends
                    ? 'border-[#E07B54] bg-[#E07B54] text-white'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-soft)]'
                }`}
              >
                {form.opens_weekends ? '✅ Abre fines de semana' : '⬜ Abre fines de semana'}
              </button>

              <button
                type="button"
                onClick={() => setField('has_wifi', !form.has_wifi)}
                className={`rounded-lg border px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  form.has_wifi
                    ? 'border-[#E07B54] bg-[#E07B54] text-white'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-soft)]'
                }`}
              >
                {form.has_wifi ? '✅ Tiene WiFi' : '⬜ Tiene WiFi'}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 1}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition-all duration-200 hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Atrás
        </button>

        {step < 3 ? (
          <button
            type="button"
            onClick={goNext}
            className="rounded-lg bg-[#1A1A2E] px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
          >
            Siguiente
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-lg bg-[#E07B54] px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Enviando...' : 'Enviar inscripción'}
          </button>
        )}
      </div>

      {successMessage ? <p className="rounded-lg bg-[#4CAF50]/15 p-3 text-sm text-[#4CAF50]">{successMessage}</p> : null}
      {errorMessage ? <p className="rounded-lg bg-[#E53935]/10 p-3 text-sm text-[#E53935]">{errorMessage}</p> : null}
    </section>
  )
}
