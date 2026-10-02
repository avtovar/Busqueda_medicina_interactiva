const norm = (s) => (s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()

/**
 * El campo DROGA codifica la composicion: los grupos se separan con "+" y los
 * principios activos dentro de un grupo con ",". Ejemplos reales:
 *   "ibuprofeno"                              -> monofarmaco
 *   "hioscina,n-butilbr.+ibuprofeno"          -> asociacion
 *   "clorfeniramina maleato+ibuprofeno+pseudoef."
 */
export function ingredientesDe(droga) {
  return (droga ?? '')
    .split('+')
    .flatMap((grupo) => grupo.split(',').map(norm))
    .filter(Boolean)
}

/**
 * Clasifica un producto respecto de lo que el usuario busco.
 *  - monofarmaco: composicion identica a la consulta
 *  - asociacion:  contiene lo buscado mas otros principios activos
 *  - otro:        no coincide (falsos amigos como "dexibuprofeno" al buscar "ibuprofeno")
 */
export function clasificar(droga, ingredientesConsulta) {
  const propios = new Set(ingredientesDe(droga))
  if (propios.size === 0) return 'otro'

  const contieneTodo = ingredientesConsulta.every((i) => propios.has(i))
  if (!contieneTodo) return 'otro'

  const tieneExtra = [...propios].some((i) => !ingredientesConsulta.includes(i))
  return tieneExtra ? 'asociacion' : 'monofarmaco'
}

/**
 * Abreviaturas que la API usa de forma inconsistente. Solo se unifican sinonimos
 * no ambiguos: es preferible dejar dos grupos separados antes que unir dos
 * presentaciones que no son comparables entre si.
 */
const ABREVIATURAS = new Map([
  ['capsula', 'caps'], ['capsulas', 'caps'], ['capsula', 'caps'],
  ['comprimido', 'comp'], ['comprimidos', 'comp'],
  ['tabletas', 'comp'], ['tableta', 'comp'],
  ['gragea', 'grag'], ['grageas', 'grag'],
  ['suspension', 'susp'], ['suspensiones', 'susp'],
  ['inyectable', 'iny'],
  ['gotas', 'gts'],
  ['frascos', 'frascos'], ['frasco', 'frascos'],
  ['oral', 'oral'],
  ['blanda', 'blanda'], ['blandas', 'blanda'],
  ['gelatina', 'gelat'], ['gelatin', 'gelat'], ['gelat', 'gelat'],
  ['rectal', 'rec'], ['rec', 'rec'],
])

/**
 * Las presentaciones llegan con puntuacion y espacios inconsistentes:
 * "600 mg comp.x 10", "600mg comp.x 10" y "600 mg comp. x 10" son el mismo
 * producto. El objetivo es unificar SOLO por formato y abreviatura, nunca
 * Fusionar presentaciones distintas: la potencia y la cantidad de unidades
 * forman parte de la clave, porque son justamente lo que hace comparables dos
 * precios entre si.
 */
export function clavePresentacion(presentacion) {
  let p = norm(presentacion)
  if (!p) return 'sin presentacion'

  // Los puntos decimales ("0.5 mg", "2.5 mg") no son separadores: hay que
  // protegerlos antes de tratar el punto como abreviatura, o la dosis queda
  // partida y "0.5 mg" termina mezclandose con "0 5 mg".
  const decimales = []
  p = p.replace(/(\d+)[.,](\d+)/g, (_, entero, decimal) => {
    decimales.push(`${entero}.${decimal}`)
    return ` DEC${decimales.length - 1}DEC `
  })

  p = p
    .replace(/\./g, ' ')
    .replace(/(\d)\s*(mcg|mg|ml|gr|g)\b/g, '$1 $2 ')
    .replace(/\b(mcg|mg|ml|gr|g)\b/g, ' $1 ')
    .replace(/%/g, ' % ')
    .replace(/\bx\s*(\d+)/g, ' x $1')
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s+/g, ' ')
    .trim()

  p = p.replace(/DEC(\d+)DEC/g, (_, i) => decimales[Number(i)])

  p = p.replace(/[a-z]+/g, (palabra) => ABREVIATURAS.get(palabra) ?? palabra)

  return p
}

/** La potencia viene embebida en el texto de presentacion; el campo POTENCIA suele venir vacio. */
export function extraerPotencia(presentacion) {
  const m = norm(presentacion).match(/(\d+(?:[.,]\d+)?)\s*(mcg|mg|gr|g|%)/)
  if (!m) return null
  return { valor: Number(m[1].replace(',', '.')), unidad: m[2] }
}
export function unidadesDe(presentacion, unidadesApi) {
  const m = norm(presentacion).match(/x\s*(\d+)/)
  if (m) return Number(m[1])
  const n = Number(unidadesApi)
  return Number.isFinite(n) && n > 0 ? n : null
}

export function formaLegible(forma) {
  if (!forma) return null
  return forma.split('/').map((f) => f.trim()).filter(Boolean)[0] ?? null
}

export function precioSeguro(valor) {
  const n = Number(valor)
  return Number.isFinite(n) && n > 0 ? n : null
}

export function tipoVenta(tipo) {
  const t = norm(tipo)
  if (!t) return 'No Clasificados'
  if (t.includes('bajo receta archivada')) return 'Bajo Receta Archivada'
  if (t.includes('bajo receta')) return 'Bajo Receta'
  if (t.includes('venta libre')) return 'Venta Libre'
  return 'No Clasificados'
}

export function estadisticas(precios) {
  if (precios.length === 0) return { min: null, max: null, mediana: null }
  const ordenados = [...precios].sort((a, b) => a - b)
  const mitad = Math.floor(ordenados.length / 2)
  return {
    min: ordenados[0],
    max: ordenados[ordenados.length - 1],
    mediana: ordenados.length % 2 === 0
      ? Math.round((ordenados[mitad - 1] + ordenados[mitad]) / 2)
      : ordenados[mitad],
  }
}

export { norm }
