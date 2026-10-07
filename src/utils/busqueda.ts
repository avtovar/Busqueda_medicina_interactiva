import type {
  Catalogo,
  Coincidencia,
  Farmacia,
  Farmacias,
  GrupoComposicion,
  ResultadoGrupo,
} from '../types/datos'

/** La API oficial exige al menos 3 letras, y el catálogo local sigue el mismo piso. */
export const MIN_LETRAS = 3
// ↑ Mínimo de caracteres normalizados para disparar búsqueda (coincide con CNPM)

export function normalizar(texto: string): string {
  // ↑ Normalización robusta: quita acentos, minúsculas, colapsa espacios, solo alfanuméricos
  return texto
    .normalize('NFD')
    // ↑ NFD descompone caracteres acentuados en base + marca diacrítica (ej. á → a + ́)
    .replace(/[\u0300-\u036f]/g, '')
    // ↑ Elimina marcas diacríticas (rango Unicode combining diacritical marks)
    .toLowerCase()
    // ↑ Minúsculas
    .replace(/[^a-z0-9]+/g, ' ')
    // ↑ Reemplaza secuencias de no-alfanuméricos por un espacio
    .trim()
    // ↑ Recorta espacios al inicio/fin
}

export function alcanzaElMinimo(consulta: string): boolean {
  // ↑ true si consulta normalizada tiene ≥ MIN_LETRAS (3)
  return normalizar(consulta).length >= MIN_LETRAS
}

/** Índice de nombres comerciales por grupo, para no recorrerlos en cada pulsación. */
export type IndiceBusqueda = {
  marcasPorGrupo: Map<string, string[]>
  // ↑ clave=grupo.clave → array de marcas normalizadas de ese grupo
  marcasNormalizadas: Map<string, string>
  // ↑ clave=marca normalizada → marca original (para mostrar)
}

export function construirIndice(grupos: GrupoComposicion[]): IndiceBusqueda {
  // ↑ Construye el índice UNA sola vez al cargar catálogo (useMemo en App)
  const marcasPorGrupo = new Map<string, string[]>()
  const marcasNormalizadas = new Map<string, string>()

  for (const grupo of grupos) {
    const marcas: string[] = []
    for (const presentacion of grupo.presentaciones) {
      for (const oferta of presentacion.ofertas) {
        const clave = normalizar(oferta.nombre)
        if (!clave) continue
        marcasNormalizadas.set(clave, oferta.nombre)
        // ↑ Guarda mapping normalizado → original (para mostrar nombre real)
        if (!marcas.includes(clave)) marcas.push(clave)
      }
    }
    marcasPorGrupo.set(grupo.clave, marcas)
  }

  return { marcasPorGrupo, marcasNormalizadas }
}

/**
 * Longitud mínima para admitir coincidencias dentro de una palabra. Con 3 letras
 * un fragmento aparece en decenas de marcas y tapa el principio activo real.
 */
export const MIN_LETRAS_PARCIAL = 4
// ↑ Para coincidencia PARCIAL (substring) se exigen ≥4 letras (evita falsos positivos)

type Grado = 'exacto' | 'prefijo' | 'parcial' | null

/**
 * Grado de coincidencia entre un texto ya normalizado y la consulta. El prefijo se
 * evalúa por palabra: "ibu" tiene que encontrar "ibuprofeno" y no solo "ibu + algo".
 */
function gradoCoincidencia(texto: string, consulta: string): Grado {
  if (texto === consulta) return 'exacto'
  // ↑ Coincidencia exacta completa
  if (texto.split(' ').some((palabra) => palabra.startsWith(consulta))) return 'prefijo'
  // ↑ Prefijo por PALABRA: "ibu" matchea "ibuprofeno" porque "ibuprofeno".startsWith("ibu")
  if (texto.includes(consulta)) return 'parcial'
  // ↑ Substring en cualquier posición (solo si ≥4 letras)
  return null
}

function clasificarIngrediente(ingrediente: string, consulta: string): Coincidencia | null {
  const grado = gradoCoincidencia(ingrediente, consulta)
  if (grado === 'exacto' || grado === 'prefijo') return 'principio-activo'
  // ↑ Exacto o prefijo por palabra → principio activo
  if (grado === 'parcial' && consulta.length >= MIN_LETRAS_PARCIAL) return 'relacionado'
  // ↑ Parcial solo si consulta ≥4 letras → relacionado
  return null
}

const PRIORIDAD: Record<Coincidencia, number> = {
  'principio-activo': 0,
  comercial: 1,
  asociacion: 2,
  relacionado: 3,
}
// ↑ Prioridad numérica: menor = mejor (para sort)

function esMejor(a: Coincidencia, b: Coincidencia): boolean {
  return PRIORIDAD[a] < PRIORIDAD[b]
  // ↑ true si a tiene prioridad más alta (número menor) que b
}

function precioDesde(grupo: GrupoComposicion): number {
  let menor = Number.POSITIVE_INFINITY
  for (const presentacion of grupo.presentaciones) {
    if (presentacion.precioMin < menor) menor = presentacion.precioMin
  }
  return Number.isFinite(menor) ? menor : 0
  // ↑ Precio mínimo entre TODAS las presentaciones del grupo
}

function buscarEnMarcas(grupo: GrupoComposicion, consulta: string, indice: IndiceBusqueda) {
  const coincidencias: string[] = []
  for (const clave of indice.marcasPorGrupo.get(grupo.clave) ?? []) {
    const grado = gradoCoincidencia(clave, consulta)
    if (grado === null) continue
    if (grado === 'parcial' && consulta.length < MIN_LETRAS_PARCIAL) continue
    coincidencias.push(indice.marcasNormalizadas.get(clave) ?? clave)
  }
  return coincidencias
  // ↑ Array de marcas originales que matchean (máx 6 en resultado final)
}

/**
 * Busca sobre el catálogo local. La composición manda sobre el nombre comercial:
 * buscar "ibuprofeno" trae primero el principio activo puro, después las
 * asociaciones que lo contienen y por último coincidencias de nombre comercial.
 */
export function buscarGrupos(
  grupos: GrupoComposicion[],
  consulta: string,
  indice: IndiceBusqueda,
): ResultadoGrupo[] {
  const q = normalizar(consulta)
  if (q.length < MIN_LETRAS) return []
  // ↑ Guarda temprana: si no alcanza mínimo, array vacío

  const resultados: ResultadoGrupo[] = []

  for (const grupo of grupos) {
    let coincidencia: Coincidencia | null = null

    // 1) Coincidencia por principio activo / ingredientes
    for (const ingrediente of grupo.ingredientes) {
      const tipo = clasificarIngrediente(ingrediente, q)
      if (tipo === null) continue

      const efectiva: Coincidencia =
        tipo === 'principio-activo' && grupo.esAsociacion ? 'asociacion' : tipo
      // ↑ Si es principio-activo PERO el grupo es asociación → reclasifica a 'asociacion'

      if (coincidencia === null || esMejor(efectiva, coincidencia)) {
        coincidencia = efectiva
      }
      if (coincidencia === 'principio-activo') break
      // ↑ Optimización: si ya encontró principio-activo puro, no busca más ingredientes
    }

    // 2) Coincidencia por nombre comercial (marcas)
    const marcas = buscarEnMarcas(grupo, q, indice)
    if (marcas.length > 0 && (coincidencia === null || esMejor('comercial', coincidencia))) {
      coincidencia = 'comercial'
      // ↑ Nombre comercial gana sobre asociacion/relacionado, PIERDE vs principio-activo
    }

    if (coincidencia === null) continue
    // ↑ Sin ninguna coincidencia → salta este grupo

    resultados.push({
      ...grupo,
      coincidencia,
      marcasQueCoinciden: marcas.slice(0, 6),
      // ↑ Máximo 6 marcas mostradas en la tarjeta
      precioDesde: precioDesde(grupo),
    })
  }

  return resultados.sort((a, b) => {
    if (a.coincidencia !== b.coincidencia) {
      return PRIORIDAD[a.coincidencia] - PRIORIDAD[b.coincidencia]
      // ↑ Primero por prioridad de coincidencia (principio-activo > comercial > ...)
    }
    return a.precioDesde - b.precioDesde
    // ↑ Desempate: precio mínimo ascendente
  })
}

export function ordenarGrupos(resultados: ResultadoGrupo[], orden: string): ResultadoGrupo[] {
  const copia = [...resultados]
  // ↑ Copia shallow para no mutar array original
  switch (orden) {
    case 'precio-asc':
      return copia.sort((a, b) => a.precioDesde - b.precioDesde)
    case 'precio-desc':
      return copia.sort((a, b) => b.precioDesde - a.precioDesde)
    case 'ofertas-desc':
      return copia.sort((a, b) => b.totalProductos - a.totalProductos)
    case 'nombre':
      return copia.sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, 'es'))
    default:
      return copia
  }
}

export async function cargarCatalogo(signal?: AbortSignal): Promise<Catalogo> {
  const res = await fetch(`${import.meta.env.BASE_URL}datos/catalogo.json`, { signal })
  // ↑ Fetch al JSON local (public/datos/catalogo.json). BASE_URL = '/' en dev y prod.
  // ↑ signal permite abortar si el componente se desmonta
  if (!res.ok) throw new Error(`No se pudo cargar el catálogo (HTTP ${res.status})`)
  return (await res.json()) as Catalogo
}

export async function cargarFarmacias(signal?: AbortSignal): Promise<Farmacias> {
  const res = await fetch(`${import.meta.env.BASE_URL}datos/farmacias.json`, { signal })
  if (!res.ok) throw new Error(`No se pudo cargar el registro de farmacias (HTTP ${res.status})`)
  return (await res.json()) as Farmacias
}

export function filtrarFarmacias(farmacias: Farmacia[], consulta: string): Farmacia[] {
  const q = normalizar(consulta)
  if (q.length < 2) return farmacias
  // ↑ Filtro de farmacias: mínimo 2 letras (más permisivo que búsqueda medicamentos)
  return farmacias.filter((f) => normalizar(`${f.nombre} ${f.barrio ?? ''} ${f.comuna ?? ''}`).includes(q))
  // ↑ Busca en nombre + barrio + comuna (normalizados)
}