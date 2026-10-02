import type {
  Catalogo,
  Coincidencia,
  Farmacia,
  Farmacias,
  GrupoComposicion,
  ResultadoGrupo,
} from '../types/datos'

/** La API oficial exige al menos 3 letras, y el catalogo local sigue el mismo piso. */
export const MIN_LETRAS = 3

export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function alcanzaElMinimo(consulta: string): boolean {
  return normalizar(consulta).length >= MIN_LETRAS
}

/** Indice de nombres comerciales por grupo, para no recorrerlos en cada pulsacion. */
export type IndiceBusqueda = {
  marcasPorGrupo: Map<string, string[]>
  marcasNormalizadas: Map<string, string>
}

export function construirIndice(grupos: GrupoComposicion[]): IndiceBusqueda {
  const marcasPorGrupo = new Map<string, string[]>()
  const marcasNormalizadas = new Map<string, string>()

  for (const grupo of grupos) {
    const marcas: string[] = []
    for (const presentacion of grupo.presentaciones) {
      for (const oferta of presentacion.ofertas) {
        const clave = normalizar(oferta.nombre)
        if (!clave) continue
        marcasNormalizadas.set(clave, oferta.nombre)
        if (!marcas.includes(clave)) marcas.push(clave)
      }
    }
    marcasPorGrupo.set(grupo.clave, marcas)
  }

  return { marcasPorGrupo, marcasNormalizadas }
}

/**
 * Longitud minima para admitir coincidencias dentro de una palabra. Con 3 letras
 * un fragmento aparece en decenas de marcas y tapa el principio activo real.
 */
export const MIN_LETRAS_PARCIAL = 4

type Grado = 'exacto' | 'prefijo' | 'parcial' | null

/**
 * Grado de coincidencia entre un texto ya normalizado y la consulta. El prefijo se
 * evalua por palabra: "ibu" tiene que encontrar "ibuprofeno" y no solo "ibu + algo".
 */
function gradoCoincidencia(texto: string, consulta: string): Grado {
  if (texto === consulta) return 'exacto'
  if (texto.split(' ').some((palabra) => palabra.startsWith(consulta))) return 'prefijo'
  if (texto.includes(consulta)) return 'parcial'
  return null
}

function clasificarIngrediente(ingrediente: string, consulta: string): Coincidencia | null {
  const grado = gradoCoincidencia(ingrediente, consulta)
  if (grado === 'exacto' || grado === 'prefijo') return 'principio-activo'
  if (grado === 'parcial' && consulta.length >= MIN_LETRAS_PARCIAL) return 'relacionado'
  return null
}

const PRIORIDAD: Record<Coincidencia, number> = {
  'principio-activo': 0,
  comercial: 1,
  asociacion: 2,
  relacionado: 3,
}

function esMejor(a: Coincidencia, b: Coincidencia): boolean {
  return PRIORIDAD[a] < PRIORIDAD[b]
}

function precioDesde(grupo: GrupoComposicion): number {
  let menor = Number.POSITIVE_INFINITY
  for (const presentacion of grupo.presentaciones) {
    if (presentacion.precioMin < menor) menor = presentacion.precioMin
  }
  return Number.isFinite(menor) ? menor : 0
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
}

/**
 * Busca sobre el catalogo local. La composicion manda sobre el nombre comercial:
 * buscar "ibuprofeno" trae primero el principio activo puro, despues las
 * asociaciones que lo contienen y por ultimo coincidencias de nombre comercial.
 */
export function buscarGrupos(
  grupos: GrupoComposicion[],
  consulta: string,
  indice: IndiceBusqueda,
): ResultadoGrupo[] {
  const q = normalizar(consulta)
  if (q.length < MIN_LETRAS) return []

  const resultados: ResultadoGrupo[] = []

  for (const grupo of grupos) {
    let coincidencia: Coincidencia | null = null

    for (const ingrediente of grupo.ingredientes) {
      const tipo = clasificarIngrediente(ingrediente, q)
      if (tipo === null) continue

      const efectiva: Coincidencia =
        tipo === 'principio-activo' && grupo.esAsociacion ? 'asociacion' : tipo

      if (coincidencia === null || esMejor(efectiva, coincidencia)) {
        coincidencia = efectiva
      }
      if (coincidencia === 'principio-activo') break
    }

    const marcas = buscarEnMarcas(grupo, q, indice)
    if (marcas.length > 0 && (coincidencia === null || esMejor('comercial', coincidencia))) {
      coincidencia = 'comercial'
    }

    if (coincidencia === null) continue

    resultados.push({
      ...grupo,
      coincidencia,
      marcasQueCoinciden: marcas.slice(0, 6),
      precioDesde: precioDesde(grupo),
    })
  }

  return resultados.sort((a, b) => {
    if (a.coincidencia !== b.coincidencia) {
      return PRIORIDAD[a.coincidencia] - PRIORIDAD[b.coincidencia]
    }
    return a.precioDesde - b.precioDesde
  })
}

export function ordenarGrupos(resultados: ResultadoGrupo[], orden: string): ResultadoGrupo[] {
  const copia = [...resultados]
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
  if (!res.ok) throw new Error(`No se pudo cargar el catalogo (HTTP ${res.status})`)
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
  return farmacias.filter((f) => normalizar(`${f.nombre} ${f.barrio ?? ''} ${f.comuna ?? ''}`).includes(q))
}
