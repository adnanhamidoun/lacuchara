import { useEffect, useState } from 'react'
import { useAuth } from '../../components/auth/AuthContext.jsx'
import { uploadRestaurantImage, getRestaurantImage } from '../../services/authService'
import type { RestaurantDetail } from '../../types/domain'

export default function RestaurantPanelView() {
  const { session } = useAuth() as any
  const [previewUrl, setPreviewUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  // Variables de TABS
  const [activeTab, setActiveTab] = useState<'perfil' | 'ocr'>('perfil')

  // Variables Menú OCR
  const [menuFile, setMenuFile] = useState<File | null>(null)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [menuData, setMenuData] = useState({ starter: '', main: '', dessert: '', includes_drink: false })
  const [ocrMessage, setOcrMessage] = useState('')
  const [ocrError, setOcrError] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [loadingTodayMenu, setLoadingTodayMenu] = useState(false)
  const [hasTodayMenu, setHasTodayMenu] = useState(false)

  type TodayMenuResponse = {
    starter: string | null
    main: string | null
    dessert: string | null
    includes_drink: boolean
  }

  useEffect(() => {
    const loadRestaurant = async () => {
      if (!session?.restaurant_id) return
      try {
        // Cargar imagen desde el nuevo endpoint
        const data = await getRestaurantImage(session.restaurant_id)
        setPreviewUrl(data.image_url || '')
      } catch (err) {
        // Si falla, usar placeholder
        setPreviewUrl('https://placehold.co/400x240?text=Restaurante')
      }
    }

    loadRestaurant()
  }, [session?.restaurant_id])

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
      // Usar el nuevo endpoint de subida a Azure Blob Storage
      const result = await uploadRestaurantImage(
        session.restaurant_id,
        selectedFile,
        session.token
      )
      
      // Obtener la URL actualizada de la imagen
      const imageData = await getRestaurantImage(session.restaurant_id)
      setPreviewUrl(imageData.image_url || '')
      
      setMessage('Imagen actualizada correctamente.')
      setSelectedFile(null)
      
      // Limpiar input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      if (fileInput) fileInput.value = ''
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir la imagen.')
    } finally {
      setLoading(false)
    }
  }

  const handleOcrUpload = async () => {
    if (!menuFile) return
    setOcrLoading(true)
    setOcrMessage('')
    setOcrError('')

    const formData = new FormData()
    formData.append('menu_file', menuFile)

    try {
      // Usar la ruta correcta con /api si corresponde, o en localhost
      const response = await fetch('/ocr/menu-sections', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.token}`
        },
        body: formData
      })
      
      if (!response.ok) throw new Error('Fallo al procesar OCR.')
      
      const data = await response.json()
      const menu = data.extracted_menu
      setMenuData({
        starter: menu?.starter_options?.length ? menu.starter_options.join('; ') : (menu?.starter || ''),
        main: menu?.main_options?.length ? menu.main_options.join('; ') : (menu?.main || ''),
        dessert: menu?.dessert_options?.length ? menu.dessert_options.join('; ') : (menu?.dessert || ''),
        includes_drink: menuData.includes_drink,
      })
      setOcrMessage('¡Menú detectado con éxito! Revisa y guarda.')
    } catch (err) {
      setOcrError(err instanceof Error ? err.message : 'Error en lectura de IA')
    } finally {
      setOcrLoading(false)
    }
  }

  const handleSaveMenu = async () => {
    setIsSaving(true);
    setSuccess('');
    setError('');

    const restaurantId = session?.restaurant_id;

    if (!restaurantId) {
      setError('Sesión no válida para guardar menú.');
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch(`/restaurants/${restaurantId}/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menuData),
      });

      if (!response.ok) throw new Error('Error al publicar el menú');

      setSuccess('¡Menú del día publicado con éxito!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Hubo un problema al publicar el menú.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-[var(--text)]">Panel del restaurante</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Gestiona tu exposición pública y Menú del Día.
        </p>
      </div>

      <div className="flex border-b border-[var(--border)] mb-4">
        <button 
          onClick={() => setActiveTab('perfil')}
          className={`pb-2 px-4 text-sm font-semibold transition-colors ${activeTab === 'perfil' ? 'border-b-2 border-[#E07B54] text-[#E07B54]' : 'text-[var(--text-muted)]'}`}>
          Perfil e Imagen
        </button>
        <button 
          onClick={() => setActiveTab('ocr')}
          className={`pb-2 px-4 text-sm font-semibold transition-colors ${activeTab === 'ocr' ? 'border-b-2 border-[#E07B54] text-[#E07B54]' : 'text-[var(--text-muted)]'}`}>
          Menú del Día (IA OCR)
        </button>
      </div>

      {activeTab === 'perfil' && (
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
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
                    // Preview local
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
              alt="Preview Restaurante"
              className="h-60 w-full rounded-xl object-cover"
            />
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
              onChange={(e) => setMenuFile(e.target.files?.[0] || null)}
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
               onChange={(e) => setMenuData({...menuData, starter: e.target.value})}
               className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[#E07B54]" 
               rows={2} placeholder="Ej: Ensalada Mixta; Sopa..." 
             />
           </div>
           <div className="space-y-2">
             <label className="text-xs font-semibold text-[var(--text-muted)]">Platos Principales detectados</label>
             <textarea 
               value={menuData.main}
               onChange={(e) => setMenuData({...menuData, main: e.target.value})}
               className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[#E07B54]" 
               rows={2} placeholder="Ej: Entrecot al horno; Paella..."
             />
           </div>
           <div className="space-y-2">
             <label className="text-xs font-semibold text-[var(--text-muted)]">Postres detectados</label>
             <textarea 
               value={menuData.dessert}
               onChange={(e) => setMenuData({...menuData, dessert: e.target.value})}
               className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[#E07B54]" 
               rows={2} placeholder="Ej: Tarta de Queso; Flan..."
             />
           </div>

           <label className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]">
             <input
               type="checkbox"
               checked={menuData.includes_drink}
               onChange={(e) => setMenuData({ ...menuData, includes_drink: e.target.checked })}
               className="h-4 w-4 rounded border-[var(--border)] accent-[#E07B54]"
             />
             Incluye bebida
           </label>

          {ocrMessage && <p className="text-sm font-semibold text-[#2E7D32] bg-[#4CAF50]/15 p-2 rounded-lg">{ocrMessage}</p>}
          {ocrError && <p className="text-sm font-semibold text-[#E53935] bg-[#E53935]/15 p-2 rounded-lg">{ocrError}</p>}

            {/* Acciones */}
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

    </section>
  )
}