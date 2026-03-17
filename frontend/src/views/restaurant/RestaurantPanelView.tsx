import { useEffect, useState } from 'react'
import { useAuth } from '../../components/auth/AuthContext.jsx'
import { uploadRestaurantImage, getRestaurantImage } from '../../services/authService'
import { getRestaurantDetail, updateRestaurant } from '../../services/restaurantsService'
import type { RestaurantDetail, RestaurantUpdatePayload } from '../../types/domain'
import { CUISINE_META } from '../../utils/cuisine'
import PredictionDashboard from './PredictionDashboard'

type TabKey = 'perfil' | 'ocr' | 'predicciones'
type NullableBooleanValue = '' | 'true' | 'false'
type SegmentOption = '' | 'gourmet' | 'traditional' | 'business' | 'family'
type TerraceOption = '' | 'yearround' | 'summer' | 'none'
type CuisineOption =
  | ''
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

type ProfileFormState = {
  name: string
  capacity_limit: string
  table_count: string
  min_service_duration: string
  terrace_setup_type: TerraceOption
  opens_weekends: NullableBooleanValue
  has_wifi: NullableBooleanValue
  restaurant_segment: SegmentOption
  menu_price: string
  dist_office_towers: string
  google_rating: string
  cuisine_type: CuisineOption
}

type NumericFieldRule = {
  key: 'capacity_limit' | 'table_count' | 'min_service_duration' | 'menu_price' | 'dist_office_towers' | 'google_rating'
  label: string
  min: number
  max?: number
}

type TodayMenuResponse = {
  starter: string | null
  main: string | null
  dessert: string | null
  includes_drink: boolean
}

const SEGMENT_OPTIONS: Array<{ value: SegmentOption; label: string }> = [
  { value: '', label: 'Sin definir' },
  { value: 'gourmet', label: 'Gourmet' },
  { value: 'traditional', label: 'Tradicional' },
  { value: 'business', label: 'Business' },
  { value: 'family', label: 'Family' },
]

const TERRACE_OPTIONS: Array<{ value: TerraceOption; label: string }> = [
  { value: '', label: 'Sin definir' },
  { value: 'yearround', label: 'Todo el año' },
  { value: 'summer', label: 'Solo verano' },
  { value: 'none', label: 'No tiene' },
]

const BOOLEAN_OPTIONS: Array<{ value: NullableBooleanValue; label: string }> = [
  { value: '', label: 'Sin definir' },
  { value: 'true', label: 'Sí' },
  { value: 'false', label: 'No' },
]

const CUISINE_OPTIONS: Array<{ value: CuisineOption; label: string }> = [
  { value: '', label: 'Sin definir' },
  { value: 'grill', label: `${CUISINE_META.grill.emoji} ${CUISINE_META.grill.label}` },
  { value: 'spanish', label: `${CUISINE_META.spanish.emoji} ${CUISINE_META.spanish.label}` },
  { value: 'mediterranean', label: `${CUISINE_META.mediterranean.emoji} ${CUISINE_META.mediterranean.label}` },
  { value: 'stew', label: `${CUISINE_META.stew.emoji} ${CUISINE_META.stew.label}` },
  { value: 'fried', label: `${CUISINE_META.fried.emoji} ${CUISINE_META.fried.label}` },
  { value: 'italian', label: `${CUISINE_META.italian.emoji} ${CUISINE_META.italian.label}` },
  { value: 'asian', label: `${CUISINE_META.asian.emoji} ${CUISINE_META.asian.label}` },
  { value: 'latin', label: `${CUISINE_META.latin.emoji} ${CUISINE_META.latin.label}` },
  { value: 'arabic', label: `${CUISINE_META.arabic.emoji} ${CUISINE_META.arabic.label}` },
  { value: 'avantgarde', label: `${CUISINE_META.avantgarde.emoji} ${CUISINE_META.avantgarde.label}` },
  { value: 'plantbased', label: `${CUISINE_META.plantbased.emoji} ${CUISINE_META.plantbased.label}` },
  { value: 'streetfood', label: `${CUISINE_META.streetfood.emoji} ${CUISINE_META.streetfood.label}` },
]

const EMPTY_PROFILE_FORM: ProfileFormState = {
  name: '',
  capacity_limit: '',
  table_count: '',
  min_service_duration: '',
  terrace_setup_type: '',
  opens_weekends: '',
  has_wifi: '',
  restaurant_segment: '',
  menu_price: '',
  dist_office_towers: '',
  google_rating: '',
  cuisine_type: '',
}

function normalizeSegmentOption(value: string | null | undefined): SegmentOption {
  const normalized = (value ?? '').trim().toLowerCase()
  if (!normalized) return ''

  if (normalized === 'tradicional') return 'traditional'
  if (normalized === 'business' || normalized === 'gourmet' || normalized === 'traditional' || normalized === 'family') {
    return normalized
  }

  return ''
}

function normalizeTerraceOption(value: string | null | undefined): TerraceOption {
  const normalized = (value ?? '').trim().toLowerCase()
  if (!normalized) return ''

  if (
    normalized === 'yearround' ||
    normalized === 'year-round' ||
    normalized === 'all_year' ||
    normalized === 'all year' ||
    normalized === 'todo el año' ||
    normalized === 'todo el ano'
  ) {
    return 'yearround'
  }

  if (normalized === 'summer' || normalized === 'summer_only' || normalized === 'solo verano') {
    return 'summer'
  }

  if (normalized === 'none' || normalized === 'sin terraza' || normalized === 'no tiene') {
    return 'none'
  }

  return ''
}

function normalizeCuisineOption(value: string | null | undefined): CuisineOption {
  const normalized = (value ?? '').trim().toLowerCase()
  if (!normalized) return ''

  if (
    normalized === 'grill' ||
    normalized === 'spanish' ||
    normalized === 'mediterranean' ||
    normalized === 'stew' ||
    normalized === 'fried' ||
    normalized === 'italian' ||
    normalized === 'asian' ||
    normalized === 'latin' ||
    normalized === 'arabic' ||
    normalized === 'avantgarde' ||
    normalized === 'plantbased' ||
    normalized === 'streetfood'
  ) {
    return normalized
  }

  if (normalized === 'española' || normalized === 'espanola') return 'spanish'
  if (normalized === 'mediterránea' || normalized === 'mediterranea') return 'mediterranean'
  if (normalized === 'árabe' || normalized === 'arabe') return 'arabic'
  if (normalized === 'vanguardia') return 'avantgarde'

  return ''
}

function mapRestaurantToForm(detail: RestaurantDetail): ProfileFormState {
  return {
    name: detail.name ?? '',
    capacity_limit: detail.capacity_limit?.toString() ?? '',
    table_count: detail.table_count?.toString() ?? '',
    min_service_duration: detail.min_service_duration?.toString() ?? '',
    terrace_setup_type: normalizeTerraceOption(detail.terrace_setup_type),
    opens_weekends: detail.opens_weekends === null ? '' : detail.opens_weekends ? 'true' : 'false',
    has_wifi: detail.has_wifi === null ? '' : detail.has_wifi ? 'true' : 'false',
    restaurant_segment: normalizeSegmentOption(detail.restaurant_segment),
    menu_price: detail.menu_price?.toString() ?? '',
    dist_office_towers: detail.dist_office_towers?.toString() ?? '',
    google_rating: detail.google_rating?.toString() ?? '',
    cuisine_type: normalizeCuisineOption(detail.cuisine_type),
  }
}

function stringToNullableNumber(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  return Number(trimmed)
}

function stringToNullableBoolean(value: NullableBooleanValue): boolean | null {
  if (value === '') return null
  return value === 'true'
}

function fieldClassName(): string {
  return 'w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[#E07B54]'
}

export default function RestaurantPanelView() {
  const { session } = useAuth() as any
  const [previewUrl, setPreviewUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('perfil')
  const [restaurantDetail, setRestaurantDetail] = useState<RestaurantDetail | null>(null)
  const [profileForm, setProfileForm] = useState<ProfileFormState>(EMPTY_PROFILE_FORM)
  const [initialProfileForm, setInitialProfileForm] = useState<ProfileFormState>(EMPTY_PROFILE_FORM)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')
  const [menuFile, setMenuFile] = useState<File | null>(null)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [menuData, setMenuData] = useState({ starter: '', main: '', dessert: '', includes_drink: false })
  const [ocrMessage, setOcrMessage] = useState('')
  const [ocrError, setOcrError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [loadingTodayMenu, setLoadingTodayMenu] = useState(false)
  const [hasTodayMenu, setHasTodayMenu] = useState(false)

  useEffect(() => {
    const loadRestaurantAssets = async () => {
      if (!session?.restaurant_id) return

      setProfileLoading(true)
      setProfileError('')
      try {
        const [detail, imageData] = await Promise.all([
          getRestaurantDetail(session.restaurant_id, session.token),
          getRestaurantImage(session.restaurant_id).catch(() => ({ image_url: 'https://placehold.co/400x240?text=Restaurante' })),
        ])

        const nextForm = mapRestaurantToForm(detail)
        setRestaurantDetail(detail)
        setProfileForm(nextForm)
        setInitialProfileForm(nextForm)
        setPreviewUrl(imageData.image_url || 'https://placehold.co/400x240?text=Restaurante')
      } catch (err) {
        setProfileError(err instanceof Error ? err.message : 'No se pudo cargar la ficha del restaurante.')
        setPreviewUrl('https://placehold.co/400x240?text=Restaurante')
      } finally {
        setProfileLoading(false)
      }
    }

    loadRestaurantAssets()
  }, [session?.restaurant_id, session?.token])

  useEffect(() => {
    const loadTodayMenu = async () => {
      if (activeTab !== 'ocr' || !session?.restaurant_id) return

      setLoadingTodayMenu(true)
      try {
        const response = await fetch(`/restaurants/${session.restaurant_id}/menu/today`)
        if (!response.ok) {
          setHasTodayMenu(false)
          if (response.status === 404) {
            setOcrMessage('')
            setOcrError('')
          }
          return
        }

        const data = (await response.json()) as TodayMenuResponse
        setMenuData({
          starter: data.starter ?? '',
          main: data.main ?? '',
          dessert: data.dessert ?? '',
          includes_drink: Boolean(data.includes_drink),
        })
        setHasTodayMenu(true)
        setOcrMessage('Menú de hoy cargado. Puedes editarlo y volver a publicarlo.')
        setOcrError('')
      } catch {
        setHasTodayMenu(false)
      } finally {
        setLoadingTodayMenu(false)
      }
    }

    loadTodayMenu()
  }, [activeTab, session?.restaurant_id])

  const setProfileField = <K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K]) => {
    setProfileForm((prev) => ({ ...prev, [key]: value }))
    setProfileError('')
    setProfileMessage('')
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!session?.restaurant_id || !session.token || !selectedFile) {
      setError('Selecciona un archivo para subir.')
      return
    }

    setLoading(true)
    setMessage('')
    setError('')

    try {
      await uploadRestaurantImage(session.restaurant_id, selectedFile, session.token)
      const imageData = await getRestaurantImage(session.restaurant_id)
      setPreviewUrl(imageData.image_url || '')
      setMessage('Imagen actualizada correctamente.')
      setSelectedFile(null)

      const imageInput = document.querySelector('input[type="file"]') as HTMLInputElement | null
      if (imageInput) imageInput.value = ''
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir la imagen.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!session?.restaurant_id || !session?.token) {
      setProfileError('Sesión no válida para editar el restaurante.')
      return
    }

    if (!profileForm.name.trim()) {
      setProfileError('El nombre del restaurante es obligatorio.')
      return
    }

    const numericFields: NumericFieldRule[] = [
      { key: 'capacity_limit', label: 'Capacidad', min: 1 },
      { key: 'table_count', label: 'Mesas', min: 1 },
      { key: 'min_service_duration', label: 'Servicio mínimo', min: 1 },
      { key: 'menu_price', label: 'Precio menú', min: 0 },
      { key: 'dist_office_towers', label: 'Distancia a oficinas', min: 0 },
      { key: 'google_rating', label: 'Valoración Google', min: 0, max: 5 },
    ]

    for (const field of numericFields) {
      const rawValue = profileForm[field.key]
      if (!rawValue.trim()) continue
      const parsedValue = Number(rawValue)
      if (Number.isNaN(parsedValue)) {
        setProfileError(`${field.label}: introduce un número válido.`)
        return
      }
      if (parsedValue < field.min || (typeof field.max === 'number' && parsedValue > field.max)) {
        setProfileError(
          typeof field.max === 'number'
            ? `${field.label}: el valor debe estar entre ${field.min} y ${field.max}.`
            : `${field.label}: el valor no puede ser inferior a ${field.min}.`,
        )
        return
      }
    }

    const payload: RestaurantUpdatePayload = {
      name: profileForm.name.trim(),
      capacity_limit: stringToNullableNumber(profileForm.capacity_limit),
      table_count: stringToNullableNumber(profileForm.table_count),
      min_service_duration: stringToNullableNumber(profileForm.min_service_duration),
      terrace_setup_type: normalizeTerraceOption(profileForm.terrace_setup_type) || null,
      opens_weekends: stringToNullableBoolean(profileForm.opens_weekends),
      has_wifi: stringToNullableBoolean(profileForm.has_wifi),
      restaurant_segment: normalizeSegmentOption(profileForm.restaurant_segment) || null,
      menu_price: stringToNullableNumber(profileForm.menu_price),
      dist_office_towers: stringToNullableNumber(profileForm.dist_office_towers),
      google_rating: stringToNullableNumber(profileForm.google_rating),
      cuisine_type: normalizeCuisineOption(profileForm.cuisine_type) || null,
    }

    setProfileSaving(true)
    setProfileMessage('')
    setProfileError('')
    try {
      const updatedRestaurant = await updateRestaurant(session.restaurant_id, payload, session.token)
      const nextForm = mapRestaurantToForm(updatedRestaurant)
      setRestaurantDetail(updatedRestaurant)
      setProfileForm(nextForm)
      setInitialProfileForm(nextForm)
      setProfileMessage('Ficha del restaurante actualizada en base de datos.')
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'No se pudo guardar la ficha del restaurante.')
    } finally {
      setProfileSaving(false)
    }
  }

  const handleResetProfile = () => {
    setProfileForm(initialProfileForm)
    setProfileError('')
    setProfileMessage('')
  }

  const handleOcrUpload = async () => {
    if (!menuFile) return
    setOcrLoading(true)
    setOcrMessage('')
    setOcrError('')

    const formData = new FormData()
    formData.append('menu_file', menuFile)

    try {
      const response = await fetch('/ocr/menu-sections', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.token}`,
        },
        body: formData,
      })

      if (!response.ok) throw new Error('Fallo al procesar OCR.')

      const data = await response.json()
      const menu = data.extracted_menu
      setMenuData((current) => ({
        starter: menu?.starter_options?.length ? menu.starter_options.join('; ') : (menu?.starter || ''),
        main: menu?.main_options?.length ? menu.main_options.join('; ') : (menu?.main || ''),
        dessert: menu?.dessert_options?.length ? menu.dessert_options.join('; ') : (menu?.dessert || ''),
        includes_drink: current.includes_drink,
      }))
      setOcrMessage('¡Menú detectado con éxito! Revisa y guarda.')
    } catch (err) {
      setOcrError(err instanceof Error ? err.message : 'Error en lectura de IA')
    } finally {
      setOcrLoading(false)
    }
  }

  const handleSaveMenu = async () => {
    setIsSaving(true)
    setSuccess('')
    setError('')

    const restaurantId = session?.restaurant_id
    if (!restaurantId) {
      setError('Sesión no válida para guardar menú.')
      setIsSaving(false)
      return
    }

    try {
      const response = await fetch(`/restaurants/${restaurantId}/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menuData),
      })

      if (!response.ok) throw new Error('Error al publicar el menú')

      setSuccess('¡Menú del día publicado con éxito!')
      setHasTodayMenu(true)
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('Hubo un problema al publicar el menú.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-[var(--text)]">Panel de Restaurante</h1>
        <p className="text-base text-[var(--text-muted)]">
          Gestiona tu ficha pública, menú del día y predicciones de IA.
        </p>
      </div>

      <div className="flex gap-1 border-b border-[var(--border)]">
        <button
          onClick={() => setActiveTab('perfil')}
          className={`px-6 py-3 text-sm font-semibold transition-all duration-200 relative ${
            activeTab === 'perfil'
              ? 'text-[#E07B54] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#E07B54]'
              : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          Perfil e Imagen
        </button>
        <button
          onClick={() => setActiveTab('ocr')}
          className={`px-6 py-3 text-sm font-semibold transition-all duration-200 relative ${
            activeTab === 'ocr'
              ? 'text-[#E07B54] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#E07B54]'
              : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          Menú del Día (IA OCR)
        </button>
        <button
          onClick={() => setActiveTab('predicciones')}
          className={`px-6 py-3 text-sm font-semibold transition-all duration-200 relative ${
            activeTab === 'predicciones'
              ? 'text-[#E07B54] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#E07B54]'
              : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          Predicciones de Menú
        </button>
      </div>

      {activeTab === 'perfil' && (
        <div className="grid gap-8 xl:grid-cols-[1.3fr_1fr]">
          {/* Left Column: Form */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-lg">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-[var(--text)]">Ficha del restaurante</h3>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  Información pública de tu restaurante para los algoritmos de predicción.
                </p>
              </div>

              {profileLoading ? (
                <p className="text-sm text-[var(--text-muted)]">Cargando datos del restaurante...</p>
              ) : null}
              
              {profileMessage ? (
                <div className="mb-5 rounded-xl bg-[#4CAF50]/10 border border-[#4CAF50]/30 p-4 text-sm text-[#2E7D32]">
                  <div className="flex gap-3">
                    <span className="text-lg">✓</span>
                    <span>{profileMessage}</span>
                  </div>
                </div>
              ) : null}
              
              {profileError ? (
                <div className="mb-5 rounded-xl bg-[#E53935]/10 border border-[#E53935]/30 p-4 text-sm text-[#E53935]">
                  <div className="flex gap-3">
                    <span className="text-lg">✕</span>
                    <span>{profileError}</span>
                  </div>
                </div>
              ) : null}

              <div className="space-y-6">
                {/* Name - Full Width */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[var(--text)]">Nombre</label>
                  <input
                    value={profileForm.name}
                    onChange={(event) => setProfileField('name', event.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]/50 outline-none transition-all focus:border-[#E07B54] focus:ring-1 focus:ring-[#E07B54]/20"
                    placeholder="Ej: Restaurante La Cocina"
                  />
                </div>

                {/* Grid 2 Columns */}
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[var(--text)]">Capacidad</label>
                    <input
                      type="number"
                      min={1}
                      value={profileForm.capacity_limit}
                      onChange={(event) => setProfileField('capacity_limit', event.target.value)}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]/50 outline-none transition-all focus:border-[#E07B54] focus:ring-1 focus:ring-[#E07B54]/20"
                      placeholder="Ej: 80"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[var(--text)]">Mesas</label>
                    <input
                      type="number"
                      min={1}
                      value={profileForm.table_count}
                      onChange={(event) => setProfileField('table_count', event.target.value)}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]/50 outline-none transition-all focus:border-[#E07B54] focus:ring-1 focus:ring-[#E07B54]/20"
                      placeholder="Ej: 16"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[var(--text)]">Servicio mínimo</label>
                    <input
                      type="number"
                      min={1}
                      value={profileForm.min_service_duration}
                      onChange={(event) => setProfileField('min_service_duration', event.target.value)}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]/50 outline-none transition-all focus:border-[#E07B54] focus:ring-1 focus:ring-[#E07B54]/20"
                      placeholder="Ej: 45 min"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[var(--text)]">Precio menú</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={profileForm.menu_price}
                      onChange={(event) => setProfileField('menu_price', event.target.value)}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]/50 outline-none transition-all focus:border-[#E07B54] focus:ring-1 focus:ring-[#E07B54]/20"
                      placeholder="Ej: 14.50 €"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[var(--text)]">Distancia a oficinas</label>
                    <input
                      type="number"
                      min={0}
                      value={profileForm.dist_office_towers}
                      onChange={(event) => setProfileField('dist_office_towers', event.target.value)}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]/50 outline-none transition-all focus:border-[#E07B54] focus:ring-1 focus:ring-[#E07B54]/20"
                      placeholder="Ej: 250 m"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[var(--text)]">Valoración Google</label>
                    <input
                      type="number"
                      min={0}
                      max={5}
                      step="0.1"
                      value={profileForm.google_rating}
                      onChange={(event) => setProfileField('google_rating', event.target.value)}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]/50 outline-none transition-all focus:border-[#E07B54] focus:ring-1 focus:ring-[#E07B54]/20"
                      placeholder="Ej: 4.3 ⭐"
                    />
                  </div>
                </div>

                {/* Grid 2 Columns - Selects */}
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[var(--text)]">Tipo de cocina</label>
                    <select
                      value={profileForm.cuisine_type}
                      onChange={(event) => setProfileField('cuisine_type', event.target.value as CuisineOption)}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] outline-none transition-all focus:border-[#E07B54] focus:ring-1 focus:ring-[#E07B54]/20"
                    >
                      {CUISINE_OPTIONS.map((option) => (
                        <option key={option.value || 'empty'} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[var(--text)]">Segmento</label>
                    <select
                      value={profileForm.restaurant_segment}
                      onChange={(event) => setProfileField('restaurant_segment', event.target.value as SegmentOption)}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] outline-none transition-all focus:border-[#E07B54] focus:ring-1 focus:ring-[#E07B54]/20"
                    >
                      {SEGMENT_OPTIONS.map((option) => (
                        <option key={option.value || 'empty'} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[var(--text)]">Terraza</label>
                    <select
                      value={profileForm.terrace_setup_type}
                      onChange={(event) => setProfileField('terrace_setup_type', event.target.value as TerraceOption)}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] outline-none transition-all focus:border-[#E07B54] focus:ring-1 focus:ring-[#E07B54]/20"
                    >
                      {TERRACE_OPTIONS.map((option) => (
                        <option key={option.value || 'empty'} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[var(--text)]">Abre fines de semana</label>
                    <select
                      value={profileForm.opens_weekends}
                      onChange={(event) => setProfileField('opens_weekends', event.target.value as NullableBooleanValue)}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] outline-none transition-all focus:border-[#E07B54] focus:ring-1 focus:ring-[#E07B54]/20"
                    >
                      {BOOLEAN_OPTIONS.map((option) => (
                        <option key={option.value || 'empty'} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[var(--text)]">WiFi</label>
                    <select
                      value={profileForm.has_wifi}
                      onChange={(event) => setProfileField('has_wifi', event.target.value as NullableBooleanValue)}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] outline-none transition-all focus:border-[#E07B54] focus:ring-1 focus:ring-[#E07B54]/20"
                    >
                      {BOOLEAN_OPTIONS.map((option) => (
                        <option key={option.value || 'empty'} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-end gap-3 border-t border-[var(--border)] pt-6 mt-6">
                <button
                  type="button"
                  onClick={handleResetProfile}
                  className="rounded-xl border border-[var(--border)] px-6 py-2.5 text-sm font-semibold text-[var(--text)] transition-all hover:bg-[var(--surface-soft)]"
                >
                  Deshacer
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={profileLoading || profileSaving}
                  className="rounded-xl bg-[#E07B54] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#E07B54]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {profileSaving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Image Upload */}
          <div className="space-y-6">
            {/* File Upload Card */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-lg">
              <h3 className="text-lg font-bold text-[var(--text)] mb-1">Imagen del restaurante</h3>
              <p className="text-sm text-[var(--text-muted)] mb-6">
                Sube una foto de calidad que represente tu establecimiento.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Upload Area */}
                <label className="relative block w-full rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface-soft)]/30 p-8 text-center cursor-pointer transition-all hover:border-[#E07B54] hover:bg-[var(--surface-soft)]/60 focus-within:border-[#E07B54] focus-within:ring-2 focus-within:ring-[#E07B54]/20">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) {
                        setSelectedFile(file)
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          setPreviewUrl(reader.result as string)
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                    className="hidden"
                  />
                  <div className="space-y-3">
                    <div className="text-4xl">📸</div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text)]">
                        {selectedFile ? selectedFile.name : 'Arrastra tu imagen aquí'}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {selectedFile ? 'Listo para subir' : 'o haz clic para seleccionar'}
                      </p>
                    </div>
                    {!selectedFile && (
                      <p className="text-xs text-[var(--text-muted)]/70">JPG, PNG o WebP • Max 10MB</p>
                    )}
                  </div>
                </label>

                {message ? (
                  <div className="rounded-xl bg-[#4CAF50]/10 border border-[#4CAF50]/30 p-4 text-sm text-[#2E7D32]">
                    <div className="flex gap-3">
                      <span>✓</span>
                      <span>{message}</span>
                    </div>
                  </div>
                ) : null}

                {error ? (
                  <div className="rounded-xl bg-[#E53935]/10 border border-[#E53935]/30 p-4 text-sm text-[#E53935]">
                    <div className="flex gap-3">
                      <span>✕</span>
                      <span>{error}</span>
                    </div>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading || !selectedFile}
                  className="w-full rounded-xl bg-[#E07B54] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#E07B54]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Subiendo...' : 'Confirmar imagen'}
                </button>
              </form>
            </div>

            {/* Preview Card */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-lg overflow-hidden">
              <p className="text-sm font-semibold text-[var(--text)] mb-4">Vista previa</p>
              <div className="rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface-soft)]">
                <img
                  src={previewUrl || 'https://placehold.co/400x240?text=Restaurante'}
                  alt={restaurantDetail?.name || 'Preview'}
                  className="w-full h-48 object-cover"
                />
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-4">
                {restaurantDetail?.name && `${restaurantDetail.name} • ${restaurantDetail.cuisine_type}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ocr' && (
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Step 1: Upload */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#E07B54] text-white text-sm font-bold">1</span>
                <h2 className="text-2xl font-bold text-[var(--text)]">Sube tu menú</h2>
              </div>
              <p className="text-base text-[var(--text-muted)] mt-2">
                Fotografía clara de tu menú físico para escanear con IA.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-lg">
              {loadingTodayMenu ? (
                <p className="text-center text-sm text-[var(--text-muted)] py-8">Comprobando menú actual...</p>
              ) : !loadingTodayMenu && hasTodayMenu ? (
                <div className="mb-6 rounded-xl bg-[#FF9800]/10 border border-[#FF9800]/30 p-4 text-sm text-[#FF9800]">
                  <div className="flex gap-3">
                    <span>ℹ️</span>
                    <span>Ya existe un menú de hoy. Si subes uno nuevo, reemplazará los datos.</span>
                  </div>
                </div>
              ) : null}

              {/* Custom Upload Zone */}
              <label className="relative block cursor-pointer">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(event) => setMenuFile(event.target.files?.[0] || null)}
                  className="hidden"
                />
                <div className="rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface-soft)]/30 p-12 text-center transition-all hover:border-[#E07B54] hover:bg-[var(--surface-soft)]/60">
                  <div className="space-y-4">
                    <div className="text-5xl inline-block">📸</div>
                    <div>
                      <p className="text-lg font-semibold text-[var(--text)]">
                        {menuFile ? menuFile.name : 'Arrastra tu imagen aquí'}
                      </p>
                      <p className="text-sm text-[var(--text-muted)] mt-2">
                        {menuFile ? 'Listo para procesar' : 'o haz clic para seleccionar'}
                      </p>
                    </div>
                    {!menuFile && (
                      <p className="text-xs text-[var(--text-muted)]/70 flex justify-center gap-2">
                        <span>📷 JPG</span>
                        <span>•</span>
                        <span>🖼️ PNG</span>
                        <span>•</span>
                        <span>📄 PDF</span>
                      </p>
                    )}
                  </div>
                </div>
              </label>

              <button
                onClick={handleOcrUpload}
                disabled={!menuFile || ocrLoading}
                className="w-full mt-6 rounded-xl bg-[#E07B54] px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#E07B54]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {ocrLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v16a8 8 0 01-8-8z"></path>
                    </svg>
                    Escaneando...
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    Escanear menú (OCR)
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Step 2: Review & Publish */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--border)] text-[var(--text)] text-sm font-bold">2</span>
                <h2 className="text-2xl font-bold text-[var(--text)]">Revisa y publica</h2>
              </div>
              <p className="text-base text-[var(--text-muted)] mt-2">
                Ajusta los detalles antes de publicar el menú.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-lg space-y-6">
              {/* Starters */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-[var(--text)]">🥗 Entrantes</label>
                <textarea
                  value={menuData.starter}
                  onChange={(event) => setMenuData({ ...menuData, starter: event.target.value })}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] outline-none transition-all focus:border-[#E07B54] focus:ring-1 focus:ring-[#E07B54]/20 resize-none"
                  rows={2}
                  placeholder="Ej: Ensalada César; Tabla de quesos; Camarones al ajillo"
                />
              </div>

              {/* Mains */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-[var(--text)]">🍖 Plato Principal</label>
                <textarea
                  value={menuData.main}
                  onChange={(event) => setMenuData({ ...menuData, main: event.target.value })}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] outline-none transition-all focus:border-[#E07B54] focus:ring-1 focus:ring-[#E07B54]/20 resize-none"
                  rows={2}
                  placeholder="Ej: Entrecot 300gr; Lubina a la sal; Sepia a la plancha"
                />
              </div>

              {/* Desserts */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-[var(--text)]">🍰 Postre</label>
                <textarea
                  value={menuData.dessert}
                  onChange={(event) => setMenuData({ ...menuData, dessert: event.target.value })}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] outline-none transition-all focus:border-[#E07B54] focus:ring-1 focus:ring-[#E07B54]/20 resize-none"
                  rows={2}
                  placeholder="Ej: Tarta de queso; Crema catalana; Fruta fresca"
                />
              </div>

              {/* Drink Checkbox */}
              <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/40 px-4 py-3 cursor-pointer hover:bg-[var(--surface-soft)]/60 transition-all">
                <input
                  type="checkbox"
                  checked={menuData.includes_drink}
                  onChange={(event) => setMenuData({ ...menuData, includes_drink: event.target.checked })}
                  className="w-5 h-5 rounded accent-[#E07B54] cursor-pointer"
                />
                <span className="text-sm font-semibold text-[var(--text)]">🍷 Incluye bebida</span>
              </label>

              {/* Messages */}
              {ocrMessage ? (
                <div className="rounded-xl bg-[#4CAF50]/10 border border-[#4CAF50]/30 p-4 text-sm text-[#2E7D32]">
                  <div className="flex gap-3">
                    <span>✓</span>
                    <span>{ocrMessage}</span>
                  </div>
                </div>
              ) : null}

              {ocrError ? (
                <div className="rounded-xl bg-[#E53935]/10 border border-[#E53935]/30 p-4 text-sm text-[#E53935]">
                  <div className="flex gap-3">
                    <span>✕</span>
                    <span>{ocrError}</span>
                  </div>
                </div>
              ) : null}

              {success ? (
                <div className="rounded-xl bg-[#4CAF50]/10 border border-[#4CAF50]/30 p-4 text-sm text-[#2E7D32]">
                  <div className="flex gap-3">
                    <span>✓</span>
                    <span>{success}</span>
                  </div>
                </div>
              ) : null}

              {error ? (
                <div className="rounded-xl bg-[#E53935]/10 border border-[#E53935]/30 p-4 text-sm text-[#E53935]">
                  <div className="flex gap-3">
                    <span>✕</span>
                    <span>{error}</span>
                  </div>
                </div>
              ) : null}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => {
                    setMenuFile(null)
                    setMenuData({ starter: '', main: '', dessert: '', includes_drink: false })
                    setOcrMessage('')
                    setOcrError('')
                  }}
                  className="flex-1 rounded-xl border border-[var(--border)] px-6 py-2.5 text-sm font-semibold text-[var(--text)] transition-all hover:bg-[var(--surface-soft)]"
                >
                  Limpiar
                </button>
                <button
                  onClick={handleSaveMenu}
                  disabled={isSaving}
                  className="flex-1 rounded-xl bg-[#E07B54] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#E07B54]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v16a8 8 0 01-8-8z"></path>
                      </svg>
                    </>
                  ) : (
                    <span>✓</span>
                  )}
                  {isSaving ? 'Publicando...' : 'Publicar menú'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'predicciones' && (
        <PredictionDashboard />
      )}
    </section>
  )
}
