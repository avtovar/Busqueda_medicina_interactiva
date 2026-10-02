const PAUSA_MS = 350
const REINTENTOS = 3

export function normalizar(texto) {
  return (texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function descargar(url, { intentos = REINTENTOS } = {}) {
  return (async () => {
    let ultimoError
    for (let intento = 1; intento <= intentos; intento += 1) {
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'FarmaciaCerca/0.1 (generador de datos; proyecto personal)' },
          signal: AbortSignal.timeout(90_000),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return Buffer.from(await res.arrayBuffer())
      } catch (error) {
        ultimoError = error
        if (intento < intentos) {
          const espera = 800 * intento
          console.warn(`  ! fallo en ${url} (intento ${intento}/${intentos}): ${error.message}. Reintento en ${espera}ms`)
          await dormir(espera)
        }
      }
    }
    throw new Error(`No se pudo descargar ${url}: ${ultimoError?.message}`)
  })()
}

export function dormir(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function pausa() {
  return dormir(PAUSA_MS)
}

/**
 * Detecta el encoding de un buffer probando UTF-8 estricto y cayendo a
 * windows-1252. Los CSV oficiales vienen en latin1, las APIs en UTF-8.
 */
export function decodificar(buf) {
  try {
    return { texto: new TextDecoder('utf-8', { fatal: true }).decode(buf), encoding: 'utf-8' }
  } catch {
    return { texto: new TextDecoder('windows-1252').decode(buf), encoding: 'windows-1252' }
  }
}

/** Parser de CSV con comillas dobles y saltos de linea embebidos. */
export function parsearCsv(texto, delimitador = ',') {
  const filas = []
  let campo = ''
  let fila = []
  let enComillas = false

  for (let i = 0; i < texto.length; i += 1) {
    const c = texto[i]

    if (enComillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') { campo += '"'; i += 1 } else { enComillas = false }
      } else { campo += c }
      continue
    }

    if (c === '"') { enComillas = true; continue }
    if (c === delimitador) { fila.push(campo); campo = ''; continue }
    if (c === '\r') continue
    if (c === '\n') { fila.push(campo); filas.push(fila); fila = []; campo = ''; continue }
    campo += c
  }

  if (campo.length > 0 || fila.length > 0) { fila.push(campo); filas.push(fila) }
  return filas.filter((f) => f.some((v) => v.trim() !== ''))
}
