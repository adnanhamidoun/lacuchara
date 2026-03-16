export interface RestaurantItem {
  restaurant_id: number
  name: string
}

export interface RestaurantDetail extends RestaurantItem {
  capacity_limit: number | null
  table_count: number | null
  min_service_duration: number | null
  terrace_setup_type: string | null
  opens_weekends: boolean | null
  has_wifi: boolean | null
  restaurant_segment: string | null
  menu_price: number | null
  dist_office_towers: number | null
  google_rating: number | null
  cuisine_type: string | null
  image_url: string | null
}

export interface RestaurantsListResponse {
  count: number
  restaurants: RestaurantItem[]
}

export interface RestaurantsDetailListResponse {
  count: number
  restaurants: RestaurantDetail[]
}

export interface Inscripcion {
  inscripcion_id: number
  name: string
  capacity_limit: number | null
  table_count: number | null
  min_service: string | null
  terrace_setup_type: string | null
  opens_weekends: boolean | null
  has_wifi: boolean | null
  restaurant_segment: string | null
  menu_price: number | null
  dist_office_towers: number | null
  google_rating: number | null
  cuisine_type: string | null
  login_email: string | null
  image_url: string | null
  google_maps_link: string
  estado_inscripcion: string | null
  fecha_solicitud: string | null
}

export interface InscripcionesListResponse {
  count: number
  inscripciones: Inscripcion[]
}

export interface InscripcionCreatePayload {
  name: string
  capacity_limit: number
  table_count: number
  min_service: string
  terrace_setup_type: string
  opens_weekends: boolean
  has_wifi: boolean
  restaurant_segment: string
  menu_price: number
  dist_office_towers: number
  google_rating: number
  cuisine_type: string
  image_url?: string
  google_maps_link: string
}

export interface AuthSession {
  role: 'admin'
  restaurant_id?: number | null
  restaurant_name?: string | null
  email: string
  token: string
}
