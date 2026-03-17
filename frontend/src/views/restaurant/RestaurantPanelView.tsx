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

function mapRestaurantToForm(detail: RestaurantDetail): ProfileFormState {
  return {
    name: detail.name ?? '',
    capacity_limit: detail.capacity_limit?.toString() ?? '',
    table_count: detail.table_count?.toString() ?? '',
    min_service_duration: detail.min_service_duration?.toString() ?? '',
    terrace_setup_type: (detail.terrace_setup_type as TerraceOption | null) ?? '',
    opens_weekends: detail.opens_weekends === null ? '' : detail.opens_weekends ? 'true' : 'false',
    has_wifi: detail.has_wifi === null ? '' : detail.has_wifi ? 'true' : 'false',
    restaurant_segment: (detail.restaurant_segment as SegmentOption | null) ?? '',
    menu_price: detail.menu_price?.toString() ?? '',
    dist_office_towers: detail.dist_office_towers?.toString() ?? '',
    google_rating: detail.google_rating?.toString() ?? '',
    cuisine_type: (detail.cuisine_type as CuisineOption | null) ?? '',
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
      terrace_setup_type: profileForm.terrace_setup_type || null,
      opens_weekends: stringToNullableBoolean(profileForm.opens_weekends),
      has_wifi: stringToNullableBoolean(profileForm.has_wifi),
      restaurant_segment: profileForm.restaurant_segment || null,
      menu_price: stringToNullableNumber(profileForm.menu_price),
      dist_office_towers: stringToNullableNumber(profileForm.dist_office_towers),
      google_rating: stringToNullableNumber(profileForm.google_rating),
      cuisine_type: profileForm.cuisine_type || null,
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
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-[var(--text)]">Panel del restaurante</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Gestiona tu ficha pública y el Menú del Día directamente sobre la base de datos.
        </p>
      </div>

      <div className="flex border-b border-[var(--border)] mb-4">
        <button
          onClick={() => setActiveTab('perfil')}
          className={`pb-2 px-4 text-sm font-semibold transition-colors ${activeTab === 'perfil' ? 'border-b-2 border-[#E07B54] text-[#E07B54]' : 'text-[var(--text-muted)]'}`}
        >
          Perfil e Imagen
        </button>
        <button
          onClick={() => setActiveTab('ocr')}
          className={`pb-2 px-4 text-sm font-semibold transition-colors ${activeTab === 'ocr' ? 'border-b-2 border-[#E07B54] text-[#E07B54]' : 'text-[var(--text-muted)]'}`}
        >
          Menú del Día (IA OCR)
        </button>
        <button
          onClick={() => setActiveTab('predicciones')}
          className={`pb-2 px-4 text-sm font-semibold transition-colors ${activeTab === 'predicciones' ? 'border-b-2 border-[#E07B54] text-[#E07B54]' : 'text-[var(--text-muted)]'}`}
        >
          Predicciones de Menú
        </button>
      </div>

      {activeTab === 'perfil' && (
        <div className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <div>
              <h3 className="font-semibold text-[var(--text)]">Ficha del restaurante</h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Los cambios se guardan en dim_restaurants. Si dejas un campo opcional vacío, se limpia en base de datos.
              </p>
            </div>

            {profileLoading ? <p className="text-sm text-[var(--text-muted)]">Cargando datos del restaurante...</p> : null}
            {profileMessage ? <p className="rounded-lg bg-[#4CAF50]/15 p-3 text-sm text-[#2E7D32]">{profileMessage}</p> : null}
            {profileError ? <p className="rounded-lg bg-[#E53935]/10 p-3 text-sm text-[#E53935]">{profileError}</p> : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-[var(--text-muted)]">Nombre</label>
                <input
                  value={profileForm.name}
                  onChange={(event) => setProfileField('name', event.target.value)}
                  className={fieldClassName()}
                  placeholder="Nombre del restaurante"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--text-muted)]">Capacidad</label>
                <input
                  type="number"
                  min={1}
                  value={profileForm.capacity_limit}
                  onChange={(event) => setProfileField('capacity_limit', event.target.value)}
                  className={fieldClassName()}
                  placeholder="Ej: 80"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--text-muted)]">Mesas</label>
                <input
                  type="number"
                  min={1}
                  value={profileForm.table_count}
                  onChange={(event) => setProfileField('table_count', event.target.value)}
                  className={fieldClassName()}
                  placeholder="Ej: 16"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--text-muted)]">Servicio mínimo (min)</label>
                <input
                  type="number"
                  min={1}
                  value={profileForm.min_service_duration}
                  onChange={(event) => setProfileField('min_service_duration', event.target.value)}
                  className={fieldClassName()}
                  placeholder="Ej: 45"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--text-muted)]">Precio menú</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={profileForm.menu_price}
                  onChange={(event) => setProfileField('menu_price', event.target.value)}
                  className={fieldClassName()}
                  placeholder="Ej: 14.50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--text-muted)]">Distancia a oficinas (m)</label>
                <input
                  type="number"
                  min={0}
                  value={profileForm.dist_office_towers}
                  onChange={(event) => setProfileField('dist_office_towers', event.target.value)}
                  className={fieldClassName()}
                  placeholder="Ej: 250"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--text-muted)]">Valoración Google</label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  step="0.1"
                  value={profileForm.google_rating}
                  onChange={(event) => setProfileField('google_rating', event.target.value)}
                  className={fieldClassName()}
                  placeholder="Ej: 4.3"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--text-muted)]">Tipo de cocina</label>
                <select
                  value={profileForm.cuisine_type}
                  onChange={(event) => setProfileField('cuisine_type', event.target.value as CuisineOption)}
                  className={fieldClassName()}
                >
                  {CUISINE_OPTIONS.map((option) => (
                    <option key={option.value || 'empty'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--text-muted)]">Segmento</label>
                <select
                  value={profileForm.restaurant_segment}
                  onChange={(event) => setProfileField('restaurant_segment', event.target.value as SegmentOption)}
                  className={fieldClassName()}
                >
                  {SEGMENT_OPTIONS.map((option) => (
                    <option key={option.value || 'empty'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--text-muted)]">Terraza</label>
                <select
                  value={profileForm.terrace_setup_type}
                  onChange={(event) => setProfileField('terrace_setup_type', event.target.value as TerraceOption)}
                  className={fieldClassName()}
                >
                  {TERRACE_OPTIONS.map((option) => (
                    <option key={option.value || 'empty'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--text-muted)]">Abre fines de semana</label>
                <select
                  value={profileForm.opens_weekends}
                  onChange={(event) => setProfileField('opens_weekends', event.target.value as NullableBooleanValue)}
                  className={fieldClassName()}
                >
                  {BOOLEAN_OPTIONS.map((option) => (
                    <option key={option.value || 'empty'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--text-muted)]">WiFi</label>
                <select
                  value={profileForm.has_wifi}
                  onChange={(event) => setProfileField('has_wifi', event.target.value as NullableBooleanValue)}
                  className={fieldClassName()}
                >
                  {BOOLEAN_OPTIONS.map((option) => (
                    <option key={option.value || 'empty'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3 border-t border-[var(--border)] pt-4">
              <button
                type="button"
                onClick={handleResetProfile}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-soft)]"
              >
                Deshacer cambios
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={profileLoading || profileSaving}
                className="rounded-lg bg-[#E07B54] px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:brightness-95 disabled:opacity-60"
              >
                {profileSaving ? 'Guardando ficha...' : 'Guardar ficha'}
              </button>
            </div>
          </div>

          <div className="space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-[var(--text)]">Subir imagen del restaurante</label>
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
                  className="w-full text-sm mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#1A1A2E]/5 file:text-[#1A1A2E] hover:file:bg-[#1A1A2E]/10 cursor-pointer text-[var(--text)]"
                />
              </div>

              {message ? <p className="rounded-lg bg-[#4CAF50]/15 p-3 text-sm text-[#2E7D32]">{message}</p> : null}
              {error ? <p className="rounded-lg bg-[#E53935]/10 p-3 text-sm text-[#E53935]">{error}</p> : null}

              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-[#E07B54] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:brightness-95 disabled:opacity-60"
              >
                {loading ? 'Guardando...' : 'Guardar imagen'}
              </button>
            </form>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
              <p className="mb-3 text-sm font-semibold text-[var(--text)]">Vista previa</p>
              <img
                src={previewUrl || 'https://placehold.co/400x240?text=Restaurante'}
                alt={restaurantDetail?.name || 'Preview Restaurante'}
                className="h-60 w-full rounded-xl object-cover"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ocr' && (
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <h3 className="font-semibold text-[var(--text)] mb-2">Paso 1: Sube la foto de tu menú físico</h3>
            {loadingTodayMenu ? <p className="text-xs text-[var(--text-muted)]">Comprobando menú actual...</p> : null}
            {!loadingTodayMenu && hasTodayMenu ? (
              <p className="text-xs text-[var(--text-muted)]">Ya existe un menú de hoy. Si subes OCR, reemplazará los campos para editar.</p>
            ) : null}
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(event) => setMenuFile(event.target.files?.[0] || null)}
              className="w-full text-sm mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#1A1A2E]/5 file:text-[#1A1A2E] hover:file:bg-[#1A1A2E]/10 cursor-pointer text-[var(--text)]"
            />
            <button
              onClick={handleOcrUpload}
              disabled={!menuFile || ocrLoading}
              className="mt-4 rounded-lg bg-[#1A1A2E] px-4 py-2.5 w-full text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-60"
            >
              {ocrLoading ? 'Escaneando con IA...' : 'Escanear Platos (OCR)'}
            </button>
          </div>

          <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <h3 className="font-semibold text-[var(--text)] mb-2">Paso 2: Revisa y Publica</h3>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text-muted)]">Entrantes detectados</label>
              <textarea
                value={menuData.starter}
                onChange={(event) => setMenuData({ ...menuData, starter: event.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[#E07B54]"
                rows={2}
                placeholder="Ej: Ensalada Mixta; Sopa..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text-muted)]">Platos Principales detectados</label>
              <textarea
                value={menuData.main}
                onChange={(event) => setMenuData({ ...menuData, main: event.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[#E07B54]"
                rows={2}
                placeholder="Ej: Entrecot al horno; Paella..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text-muted)]">Postres detectados</label>
              <textarea
                value={menuData.dessert}
                onChange={(event) => setMenuData({ ...menuData, dessert: event.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[#E07B54]"
                rows={2}
                placeholder="Ej: Tarta de Queso; Flan..."
              />
            </div>

            <label className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]">
              <input
                type="checkbox"
                checked={menuData.includes_drink}
                onChange={(event) => setMenuData({ ...menuData, includes_drink: event.target.checked })}
                className="h-4 w-4 rounded border-[var(--border)] accent-[#E07B54]"
              />
              Incluye bebida
            </label>

            {ocrMessage ? <p className="text-sm font-semibold text-[#2E7D32] bg-[#4CAF50]/15 p-2 rounded-lg">{ocrMessage}</p> : null}
            {ocrError ? <p className="text-sm font-semibold text-[#E53935] bg-[#E53935]/15 p-2 rounded-lg">{ocrError}</p> : null}
            {success ? <p className="text-sm font-semibold text-[#2E7D32] bg-[#4CAF50]/15 p-2 rounded-lg">{success}</p> : null}
            {error ? <p className="text-sm font-semibold text-[#E53935] bg-[#E53935]/15 p-2 rounded-lg">{error}</p> : null}

            <div className="flex justify-end pt-4 space-x-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setMenuFile(null)
                  setMenuData({ starter: '', main: '', dessert: '', includes_drink: false })
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveMenu}
                disabled={isSaving}
                className={`px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 ${
                  isSaving ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isSaving ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v16a8 8 0 01-8-8z"></path>
                    </svg>
                    Publicando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7"></path>
                    </svg>
                    Publicar Menú
                  </>
                )}
              </button>
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
