export type Coordenadas = {
  lat: number
  // ↑ Latitud (grados decimales, ej. -34.6037 para CABA)
  lng: number
  // ↑ Longitud (grados decimales, ej. -58.3816 para CABA)
}

export type TipoVenta = 'Venta Libre' | 'Bajo Receta' | 'Bajo Receta Archivada' | 'No Clasificados'
// ↑ Clasificación regulatoria del medicamento en Argentina

/** Un producto concreto: un medicamento en una presentación y de un laboratorio. */
export type Oferta = {
  gtin: string
  // ↑ GTIN (código de barras global) - clave única e inmutable del producto
  nombre: string
  // ↑ Nombre comercial (ej. "Actron 600")
  laboratorio: string
  // ↑ Laboratorio fabricante (ej. "Bayer")
  precio: number
  // ↑ Precio de referencia (ARS, entero o con decimales)
  precioPami: number | null
  // ↑ Precio PAMI si aplica (null si no tiene convenio)
  tipoVenta: TipoVenta
  // ↑ Clasificación regulatoria
}

/**
 * Datos mínimos de la oferta más barata de una presentación. El generador solo
 * guarda nombre, laboratorio y precio: el resto ya está en `ofertas`.
 */
export type OfertaEconomica = {
  nombre: string
  laboratorio: string
  precio: number
}

export type Potencia = {
  valor: number
  // ↑ Valor numérico (ej. 400, 0.5, 2.5)
  unidad: string
  // ↑ Unidad: 'mg' | 'mcg' | 'g' | 'ml' | '%'
}

/**
 * La presentación es la unidad en la que dos precios SÍ son comparables: misma
 * dosis, misma forma y misma cantidad de unidades. El precio se informa siempre
 * dentro de una presentación, nunca mezclando presentaciones distintas.
 */
export type Presentacion = {
  clave: string
  // ↑ Clave estable normalizada (ej. "400 mg comp x 10") - une variantes de formato
  presentacion: string
  // ↑ Texto original tal como viene del Vademécum (ej. "400 mg comp.x 10")
  forma: string | null
  // ↑ Forma farmacéutica: "Comprimido", "Cápsula", "Suspensión", etc.
  via: string | null
  // ↑ Vía de administración: "Oral", "Tópica", "Inyectable", etc.
  potencia: Potencia | null
  // ↑ Potencia extraída del texto (valor + unidad)
  unidades: number | null
  // ↑ Cantidad de unidades por envase (ej. 10, 30, 90)
  precioMin: number
  // ↑ Precio mínimo entre laboratorios de ESTA presentación
  precioMax: number
  // ↑ Precio máximo entre laboratorios de ESTA presentación
  precioMediana: number
  // ↑ Mediana de precios (estadística robusta)
  dispersion: number | null
  // ↑ Ratio max/min (null si 1 solo lab). Ej: 2.5 = hasta 2,5x de diferencia
  economico: OfertaEconomica
  // ↑ Oferta más barata (nombre, lab, precio) para mostrar destacado
  ofertas: Oferta[]
  // ↑ TODAS las ofertas (laboratorios) de ESTA presentación
}

/** Un grupo es una composición exacta: un principio activo o una asociación. */
export type GrupoComposicion = {
  clave: string
  // ↑ Clave normalizada de la droga (ej. "ibuprofeno", "ibuprofeno+cafeina")
  etiqueta: string
  // ↑ Nombre legible para UI (ej. "ibuprofeno", "ibuprofeno + cafeína")
  droga: string
  // ↑ Campo DROGA original de CNPM (con separadores + y ,)
  ingredientes: string[]
  // ↑ Array de principios activos normalizados (ej. ["ibuprofeno", "cafeina"])
  esAsociacion: boolean
  // ↑ true si ingredientes.length > 1 (asociación de múltiples principios)
  presentaciones: Presentacion[]
  // ↑ Presentaciones distintas de esta composición (misma droga, distinta forma/dosis)
  totalProductos: number
  // ↑ Total de ofertas (productos) en TODAS las presentaciones de este grupo
}

export type CatalogoMeta = {
  generadoEn: string
  // ↑ ISO timestamp de generación del snapshot (ej. "2026-01-15T10:30:00.000Z")
  vigencia: string
  // ↑ Vigencia del Vademécum consultado (ej. "Enero 2026")
  fuente: string
  // ↑ Descripción de la fuente de datos
  semilla: string
  // ↑ Descripción de la semilla PAMI usada
  aviso: string
  // ↑ Aviso legal para mostrar en UI
  totalTerminos: number
  // ↑ Términos únicos consultados a CNPM (genéricos + marcas)
  totalFilasSemilla: number
  // ↑ Filas del ranking PAMI procesadas
  totalPrincipiosActivosSemilla: number
  // ↑ Principios activos únicos en la semilla
  totalMarcasSemilla: number
  // ↑ Marcas únicas en la semilla
  totalProductos: number
  // ↑ Productos únicos (GTIN) obtenidos de CNPM
  totalGrupos: number
  // ↑ Composiciones únicas (grupos) resultantes
  rangoRankSemilla: [number, number]
  // ↑ Rango de ranks PAMI [min, max] (ej. [1, 100])
}

export type Catalogo = {
  meta: CatalogoMeta
  grupos: GrupoComposicion[]
}

export type Farmacia = {
  id: string
  // ↑ ID único: normalizado(nombre|dirección) para deduplicar
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
  // ↑ Distancia Haversine desde ubicación usuario (null si no hay ubicación)
}

/** Cómo apareció un grupo en los resultados de una búsqueda. */
export type Coincidencia = 'principio-activo' | 'comercial' | 'asociacion' | 'relacionado'
// ↑ Jerarquía: principio-activo (0) > comercial (1) > asociacion (2) > relacionado (3)

export type ResultadoGrupo = GrupoComposicion & {
  coincidencia: Coincidencia
  // ↑ Tipo de coincidencia que hizo entrar a este grupo en resultados
  marcasQueCoinciden: string[]
  // ↑ Nombres comerciales que matchearon (máx 6, para mostrar en tarjeta)
  precioDesde: number
  // ↑ Precio mínimo de referencia de TODO el grupo (para ordenar)
}

export type OrdenResultados = 'precio-asc' | 'precio-desc' | 'nombre' | 'ofertas-desc'
// ↑ Criterios de ordenamiento del select OrdenFiltros

export type GeolocationStatus = 'idle' | 'loading' | 'success' | 'error'
// ↑ Estado de la geolocalización del usuario

export type EstadoCarga = 'cargando' | 'listo' | 'error'
// ↑ Estado de la carga inicial de datos (catálogo + farmacias)
