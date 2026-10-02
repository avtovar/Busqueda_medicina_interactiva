export type Coordenadas = {
  lat: number
  lng: number
}

export type TipoVenta = 'Venta Libre' | 'Bajo Receta' | 'Bajo Receta Archivada' | 'No Clasificados'

/** Un producto concreto: un medicamento en una presentacion y de un laboratorio. */
export type Oferta = {
  gtin: string
  nombre: string
  laboratorio: string
  precio: number
  precioPami: number | null
  tipoVenta: TipoVenta
}

/**
 * Datos minimos de la oferta mas barata de una presentacion. El generador solo
 * guarda nombre, laboratorio y precio: el resto ya esta en `ofertas`.
 */
export type OfertaEconomica = {
  nombre: string
  laboratorio: string
  precio: number
}

export type Potencia = {
  valor: number
  unidad: string
}

/**
 * La presentacion es la unidad en la que dos precios SI son comparables: misma
 * dosis, misma forma y misma cantidad de unidades. El precio se informa siempre
 * dentro de una presentacion, nunca mezclando presentaciones distintas.
 */
export type Presentacion = {
  clave: string
  presentacion: string
  forma: string | null
  via: string | null
  potencia: Potencia | null
  unidades: number | null
  precioMin: number
  precioMax: number
  precioMediana: number
  dispersion: number | null
  economico: OfertaEconomica
  ofertas: Oferta[]
}

/** Un grupo es una composicion exacta: un principio activo o una asociacion. */
export type GrupoComposicion = {
  clave: string
  etiqueta: string
  droga: string
  ingredientes: string[]
  esAsociacion: boolean
  presentaciones: Presentacion[]
  totalProductos: number
}

export type CatalogoMeta = {
  generadoEn: string
  vigencia: string
  fuente: string
  semilla: string
  aviso: string
  totalTerminos: number
  totalFilasSemilla: number
  totalPrincipiosActivosSemilla: number
  totalMarcasSemilla: number
  totalProductos: number
  totalGrupos: number
  rangoRankSemilla: [number, number]
}

export type Catalogo = {
  meta: CatalogoMeta
  grupos: GrupoComposicion[]
}

export type Farmacia = {
  id: string
  nombre: string
  lat: number
  lng: number
  telefono: string | null
  direccion: string | null
  barrio: string | null
  comuna: string | null
}

export type FarmaciasMeta = {
  generadoEn: string
  fuente: string
  cobertura: string
  totalFarmacias: number
  conTelefono: number
  aviso: string
}

export type Farmacias = {
  meta: FarmaciasMeta
  farmacias: Farmacia[]
}

export type FarmaciaConDistancia = Farmacia & {
  distanceKm: number | null
}

/** Como aparecio un grupo en los resultados de una busqueda. */
export type Coincidencia = 'principio-activo' | 'comercial' | 'asociacion' | 'relacionado'

export type ResultadoGrupo = GrupoComposicion & {
  coincidencia: Coincidencia
  marcasQueCoinciden: string[]
  precioDesde: number
}

export type OrdenResultados = 'precio-asc' | 'precio-desc' | 'nombre' | 'ofertas-desc'

export type GeolocationStatus = 'idle' | 'loading' | 'success' | 'error'

export type EstadoCarga = 'cargando' | 'listo' | 'error'
