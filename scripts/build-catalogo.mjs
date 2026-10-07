import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { descargar, decodificar, parsearCsv, normalizar } from './lib/fuentes.mjs'
import { buscarVademecum, esperarTurno, vigencia } from './lib/cnpm.mjs'
import {
  clavePresentacion,
  estadisticas,
  extraerPotencia,
  formaLegible,
  ingredientesDe,
  precioSeguro,
  tipoVenta,
  unidadesDe,
} from './lib/medicamentos.mjs'

const SEMILLA_URL =
  'http://datos.pami.org.ar/dataset/71fc4db2-11f8-4f28-a836-eb799174ae61/resource/d0aa734f-8eaa-4df7-ba1c-8a3c1b553b07/download/rank-medicamento-consumido-.csv'
// ↑ CSV del ranking de medicamentos más consumidos (PAMI) - datos.gob.ar

/** Debe coincidir con la ruta que carga la app: public/datos/catalogo.json. */
const SALIDA = resolve('public/datos/catalogo.json')
const MIN_LETRAS = 3
// ↑ Mínimo de letras para considerar un principio activo usable (coincide con CNPM)

/** "hioscina,n-butilbr.+ibuprofeno" -> "hioscina + n-butilbr. + ibuprofeno" */
function etiquetaLegible(droga) {
  // ↑ Convierte campo DROGA de CNPM (separadores + y ,) a etiqueta legible para UI
  return droga
    .split('+')
    .flatMap((grupo) => grupo.split(','))
    .map((p) => p.trim())
    .filter(Boolean)
    .join(' + ')
}

async function leerSemillas() {
  console.log('1. Descargando la lista de medicamentos más consumidos (PAMI)...')
  const { texto, encoding } = decodificar(await descargar(SEMILLA_URL))
  console.log(`   encoding detectado: ${encoding}`)

  const filas = parsearCsv(texto, ';')
  // ↑ CSV de PAMI usa punto y coma como delimitador
  const idxHeader = filas.findIndex((f) => f.some((c) => c.trim() === 'Medicamento ID'))
  if (idxHeader === -1) throw new Error('No se encontro la fila de encabezado del CSV de PAMI')

  const cols = filas[idxHeader].map((c) => c.trim())
  const iMarca = cols.indexOf('Medicamento ID')
  const iGenerico = cols.indexOf('Generico ID')
  const iPresentacion = cols.indexOf('Presentacion ID')
  const iRank = cols.indexOf('Rank ID')

  const registros = filas.slice(idxHeader + 1).map((f) => ({
    rank: Number(f[iRank]),
    marca: (f[iMarca] ?? '').trim(),
    presentacionPami: (f[iPresentacion] ?? '').trim(),
    generico: (f[iGenerico] ?? '').trim(),
  })).filter((r) => Number.isFinite(r.rank))

  const validas = registros.filter((r) => normalizar(r.generico).length >= MIN_LETRAS)
  const descartadas = registros.length - validas.length
  console.log(`   ${registros.length} filas, ${validas.length} con principio activo usable` +
    (descartadas > 0 ? `, ${descartadas} descartadas por tener menos de ${MIN_LETRAS} letras` : ''))

  const genericos = [...new Set(validas.map((r) => r.generico))]
  const marcas = [...new Set(validas.map((r) => r.marca).filter((m) => normalizar(m).length >= MIN_LETRAS))]
  const terminos = [...new Set([...genericos, ...marcas])]
  // ↑ Términos únicos a consultar: principios activos + marcas (sin duplicados)

  console.log(`   ${genericos.length} principios activos + ${marcas.length} marcas = ${terminos.length} terminos a consultar`)
  return { registros, terminos, genericos, marcas }
}

async function recolectarProductos(terminos) {
  console.log(`\n2. Consultando el Vademecum Nacional (${terminos.length} terminos, con pausas para no cargar el servicio)...`)

  const porGtin = new Map()
  // ↑ Mapa GTIN -> producto (deduplicación por código de barras global)
  const resumen = []

  for (const [i, termino] of terminos.entries()) {
    process.stdout.write(`   [${String(i + 1).padStart(2)}/${terminos.length}] ${termino.padEnd(42)}`)
    let filas = []
    try {
      filas = await buscarVademecum(termino)
      // ↑ POST a CNPM /api/vademecum con {searchdata: termino}
    } catch (error) {
      console.log(`ERROR ${error.message}`)
      resumen.push({ termino, error: error.message, filas: 0 })
      continue
    }

    let nuevos = 0
    let sinPrecio = 0
    let deBaja = 0

    for (const f of filas) {
      if (!f.GTIN1) continue
      if (f.BAJA && String(f.BAJA) !== '0') { deBaja += 1; continue }
      // ↑ BAJA != "0" o "0" = producto dado de baja
      const precio = precioSeguro(f.PRECIO)
      if (precio === null) { sinPrecio += 1; continue }
      // ↑ Precio null/0/inválido → descarta
      if (porGtin.has(f.GTIN1)) continue
      // ↑ Ya procesado este GTIN (duplicado entre términos)

      porGtin.set(f.GTIN1, {
        gtin: f.GTIN1,
        nombre: (f.NOMBRE ?? '').trim(),
        laboratorio: (f.LABORATORIO ?? '').trim(),
        droga: (f.DROGA ?? '').trim(),
        // ↑ Campo DROGA: composicion codificada (ej. "ibuprofeno", "hioscina,n-butilbr.+ibuprofeno")
        presentacion: (f.PRESENTACION ?? '').trim(),
        forma: formaLegible(f.FORMA),
        via: (f.VIA ?? '').trim() || null,
        accion: (f.ACCION ?? '').trim() || null,
        // ↑ ACCION se CAPTURA pero NO se usa en agrupación (ver límite conocido en README)
        precio,
        precioPami: precioSeguro(f.PRECIOPAMI),
        tipoVenta: tipoVenta(f.TIPO_DE_VENTA),
        troquel: (f.TROQUEL ?? '').trim() || null,
        unidadesApi: f.UNIDADES,
      })
      nuevos += 1
    }

    console.log(`${String(filas.length).padStart(4)} filas | +${String(nuevos).padStart(3)} nuevos` +
      (sinPrecio > 0 ? ` | ${sinPrecio} sin precio` : '') +
      (deBaja > 0 ? ` | ${deBaja} de baja` : ''))

    resumen.push({ termino, filas: filas.length, nuevos, sinPrecio, deBaja })
    await esperarTurno()
    // ↑ Pausa 350ms entre peticiones para no saturar CNPM
  }

  console.log(`\n   Total de productos unicos: ${porGtin.size}`)
  return { productos: porGtin, resumen }
}

function construirGrupos(productos) {
  console.log('\n3. Agrupando por composicion y por presentacion...')

  const porDroga = new Map()
  // ↑ Agrupa productos por campo DROGA (clave de composición)
  for (const p of productos.values()) {
    if (!p.droga) continue
    if (!porDroga.has(p.droga)) porDroga.set(p.droga, [])
    porDroga.get(p.droga).push(p)
  }

  const grupos = []

  for (const [droga, items] of porDroga) {
    const ingredientes = ingredientesDe(droga)
    // ↑ Parse DROGA: "hioscina,n-butilbr.+ibuprofeno" -> ["hioscina", "n-butilbr", "ibuprofeno"]
    if (ingredientes.length === 0) continue

    const porPresentacion = new Map()
    // ↑ Dentro de una composición, agrupa por presentación (clave normalizada)
    for (const p of items) {
      const clave = clavePresentacion(p.presentacion)
      // ↑ Normaliza presentación: une variantes de formato/abreviaturas
      if (!porPresentacion.has(clave)) porPresentacion.set(clave, [])
      porPresentacion.get(clave).push(p)
    }

    const presentaciones = []
    for (const [clave, ofertas] of porPresentacion) {
      ofertas.sort((a, b) => a.precio - b.precio)
      // ↑ Ordena ofertas por precio ascendente (para stats y economico)
      const precios = ofertas.map((o) => o.precio)
      const stats = estadisticas(precios)
      // ↑ Calcula min, max, mediana
      const primera = ofertas[0]
      const economico = ofertas.reduce((mejor, o) => (o.precio < mejor.precio ? o : mejor), ofertas[0])

      presentaciones.push({
        clave,
        presentacion: primera.presentacion,
        forma: primera.forma,
        via: primera.via,
        potencia: extraerPotencia(primera.presentacion),
        // ↑ Extrae potencia del texto (ej. "400 mg" -> {valor: 400, unidad: "mg"})
        unidades: unidadesDe(primera.presentacion, primera.unidadesApi),
        // ↑ Extrae unidades del texto (ej. "comp.x 10" -> 10)
        precioMin: stats.min,
        precioMax: stats.max,
        precioMediana: stats.mediana,
        dispersion: stats.max > 0 ? Number((stats.max / stats.min).toFixed(2)) : null,
        // ↑ Ratio max/min (2 decimales). null si 1 solo lab.
        economico: { nombre: economico.nombre, laboratorio: economico.laboratorio, precio: economico.precio },
        ofertas: ofertas.map((o) => ({
          gtin: o.gtin,
          nombre: o.nombre,
          laboratorio: o.laboratorio,
          precio: o.precio,
          precioPami: o.precioPami,
          tipoVenta: o.tipoVenta,
        })),
      })
    }

    presentaciones.sort((a, b) => {
      if (a.precioMin !== b.precioMin) return a.precioMin - b.precioMin
      return (a.unidades ?? 0) - (b.unidades ?? 0)
    })
    // ↑ Ordena presentaciones: precioMin asc, luego unidades asc

    grupos.push({
      clave: normalizar(droga),
      etiqueta: etiquetaLegible(droga),
      droga,
      ingredientes,
      esAsociacion: ingredientes.length > 1,
      // ↑ true = asociación (múltiples principios activos)
      presentaciones,
      totalProductos: items.length,
    })
  }

  grupos.sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, 'es'))
  // ↑ Orden alfabético español para UI

  const mono = grupos.filter((g) => !g.esAsociacion)
  const asoci = grupos.filter((g) => g.esAsociacion)
  console.log(`   ${grupos.length} composiciones: ${mono.length} monofarmacos y ${asoci.length} asociaciones`)
  console.log(`   ${grupos.reduce((s, g) => s + g.presentaciones.length, 0)} presentaciones distintas`)

  const conUno = grupos.reduce((s, g) => s + g.presentaciones.filter((p) => p.ofertas.length === 1).length, 0)
  const totalPres = grupos.reduce((s, g) => s + g.presentaciones.length, 0)
  console.log(`   ${conUno} de ${totalPres} presentaciones tienen un solo laboratorio (posible fragmentacion por abreviaturas)`)

  return grupos
}

const catalogo = await (async () => {
  const { registros, terminos, genericos, marcas } = await leerSemillas()
  const { productos, resumen } = await recolectarProductos(terminos)
  const grupos = construirGrupos(productos)

  const fechas = registros.map((r) => r.rank)
  const rangoRank = [Math.min(...fechas), Math.max(...fechas)]
  const doc = {
    meta: {
      generadoEn: new Date().toISOString(),
      vigencia: await vigencia(),
      // ↑ GET a CNPM /api/vigencia
      fuente: 'Vademecum Nacional de Medicamentos (CNPM) - Ministerio de Salud',
      semilla:
        `Los ${registros.length} medicamentos más consumidos del ranking PAMI (ranks ` +
        `${rangoRank[0]} a ${rangoRank[1]}, datos.gob.ar)`,
      aviso:
        'Los precios son precios oficiales de referencia a fecha de vigencia, no precios confirmados ' +
        'por farmacia. La dispersión mostrada es entre laboratorios de una misma presentación.',
      totalTerminos: terminos.length,
      totalFilasSemilla: registros.length,
      totalPrincipiosActivosSemilla: genericos.length,
      totalMarcasSemilla: marcas.length,
      totalProductos: productos.size,
      totalGrupos: grupos.length,
      rangoRankSemilla: rangoRank,
    },
    grupos,
  }

  mkdirSync(dirname(SALIDA), { recursive: true })
  writeFileSync(SALIDA, JSON.stringify(doc), 'utf8')

  const kb = (Buffer.byteLength(JSON.stringify(doc)) / 1024).toFixed(0)
  console.log(`\n4. Escrito ${SALIDA} (${kb} KB)`)
  console.log(`   Vigencia del Vademecum: ${doc.meta.vigencia}`)
  console.log(`   ${grupos.length} grupos, ${doc.meta.totalProductos} productos`)

  const fallidos = resumen.filter((r) => r.error)
  if (fallidos.length > 0) {
    console.log(`\n   ATENCION: ${fallidos.length} terminos no se pudieron consultar:`)
    fallidos.forEach((r) => console.log(`     - "${r.termino}": ${r.error}`))
  }

  const sinResultados = resumen.filter((r) => !r.error && r.filas === 0)
  if (sinResultados.length > 0) {
    console.log(`\n   ${sinResultados.length} terminos sin resultados: ` +
      sinResultados.map((r) => r.termino).join(', '))
    console.log('   (puede ser que el medicamento ya no este en el Vademecum vigente)')
  }

  return doc
})()

if (catalogo.meta.totalProductos === 0) {
  console.error('\nEl catalogo salio vacio. Revisar la conectividad o la semilla.')
  process.exit(1)
}
