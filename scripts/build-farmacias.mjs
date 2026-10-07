import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { descargar, decodificar, normalizar, parsearCsv } from './lib/fuentes.mjs'

const URL_FARMACIAS =
  'https://cdn.buenosaires.gob.ar/datosabiertos/datasets/ministerio-de-salud/farmacias/farmacias.csv'
// ↑ Dataset oficial de farmacias de CABA (datos abiertos Buenos Aires)

/** Debe coincidir con la ruta que carga la app: public/datos/farmacias.json. */
const SALIDA = resolve('public/datos/farmacias.json')

function coordenada(valor) {
  // ↑ Convierte string a número, acepta coma decimal, valida rango razonable
  if (!valor) return null
  const n = Number(String(valor).replace(',', '.'))
  return Number.isFinite(n) && Math.abs(n) > 0 ? n : null
}

console.log('1. Descargando el registro de farmacias de CABA...')
const { texto, encoding } = decodificar(await descargar(URL_FARMACIAS))
console.log(`   encoding detectado: ${encoding}`)

const filas = parsearCsv(texto, ',')
// ↑ CSV de CABA usa coma como delimitador
const cols = filas[0].map((c) => c.trim())
console.log(`   columnas: ${cols.join(' | ')}`)

const idx = (nombre) => {
  const i = cols.findIndex((c) => c.toLowerCase() === nombre)
  if (i === -1) throw new Error(`Falta la columna "${nombre}" en el CSV`)
  return i
}

const iLong = idx('long')
const iLat = idx('lat')
const iTel = idx('telefono')
const iNombre = idx('objeto')
const iCalle = idx('calle_nomb')
const iAltura = idx('altura')
const iBarrio = idx('barrio')
const iComuna = idx('comuna')

console.log('\n2. Limpiando registros...')

const vistas = new Set()
// ↑ Set de IDs vistos para deduplicar (normalizado(nombre|direccion))
const farmacias = []
let sinCoordenadas = 0
let sinNombre = 0
let duplicados = 0

for (const f of filas.slice(1)) {
  const lat = coordenada(f[iLat])
  const long = coordenada(f[iLong])

  // Fuera de CABA no sirve para calcular distancia ni ruta.
  if (lat === null || long === null) { sinCoordenadas += 1; continue }
  if (lat < -35.1 || lat > -34.4 || long < -58.6 || long > -58.2) continue
  // ↑ Bounding box aproximado de CABA (filtra puntos fuera de la ciudad)

  const nombre = (f[iNombre] ?? '').trim()
  if (!nombre) { sinNombre += 1; continue }

  const calle = (f[iCalle] ?? '').trim()
  const altura = (f[iAltura] ?? '').trim()
  const direccion = [calle, altura].filter(Boolean).join(' ')

  const telefono = (f[iTel] ?? '').trim()
  const id = normalizar(`${nombre}|${direccion}`)
  // ↑ ID único: normaliza "Nombre|Dirección" para deduplicar
  if (vistas.has(id)) { duplicados += 1; continue }
  vistas.add(id)

  farmacias.push({
    id,
    nombre,
    lat,
    lng: long,
    telefono: telefono || null,
    direccion: direccion || null,
    barrio: (f[iBarrio] ?? '').trim() || null,
    comuna: (f[iComuna] ?? '').trim() || null,
  })
}

const conTelefono = farmacias.filter((f) => f.telefono).length
const conBarrio = farmacias.filter((f) => f.barrio).length
const conDireccion = farmacias.filter((f) => f.direccion).length

console.log(`   ${filas.length - 1} filas leidas`)
console.log(`   ${farmacias.length} farmacias utilizables`)
console.log(`   ${sinCoordenadas} descartadas por coordenadas invalidas, ${sinNombre} por falta de nombre, ${duplicados} duplicadas`)
console.log(`   ${conTelefono} con telefono, ${conDireccion} con direccion, ${conBarrio} con barrio`)

const CADENAS = /(farmacity|farmacia azul|dr\.?\s*ahorro)/i
const cadenas = farmacias.filter((f) => CADENAS.test(f.nombre))
console.log(`   ${cadenas.length} farmacias de cadenas comerciales con nombre reconocible`)
console.log(`      (solo son un dato de contexto: el registro no maneja precios ni stock)`)

const documento = {
  meta: {
    generadoEn: new Date().toISOString(),
    fuente: 'Ministerio de Salud de la Ciudad de Buenos Aires - datos abiertos',
    cobertura: 'Ciudad autónoma de Buenos Aires',
    totalFarmacias: farmacias.length,
    conTelefono,
    aviso:
      'El registro oficial no informa precios ni stock por farmacia. Sirve para ubicación, ' +
      'distancia y contacto, no para comparar precios entre comercios.',
  },
  farmacias,
}

mkdirSync(dirname(SALIDA), { recursive: true })
writeFileSync(SALIDA, JSON.stringify(documento), 'utf8')

const kb = (Buffer.byteLength(JSON.stringify(documento)) / 1024).toFixed(0)
console.log(`\n3. Escrito ${SALIDA} (${kb} KB) con ${farmacias.length} farmacias`)
