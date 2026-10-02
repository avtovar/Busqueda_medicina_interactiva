const API = 'https://cnpm.msal.gov.ar/api/vademecum'
const MIN_LETRAS = 3
const PAUSA_MS = 350

const dormir = (ms) => new Promise((r) => setTimeout(r, ms))
const norm = (s) => (s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()

/** La API responde en UTF-8 y exige al menos 3 letras. */
export async function buscarVademecum(termino, { intentos = 3 } = {}) {
  const limpio = norm(termino)
  if (limpio.length < MIN_LETRAS) {
    throw new Error(`"${termino}" tiene menos de ${MIN_LETRAS} letras y la API lo rechaza`)
  }

  let ultimoError
  for (let intento = 1; intento <= intentos; intento += 1) {
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ searchdata: limpio }),
        signal: AbortSignal.timeout(60_000),
      })

      if (!res.ok) {
        const cuerpo = (await res.text()).slice(0, 120)
        throw new Error(`HTTP ${res.status}: ${cuerpo}`)
      }

      return JSON.parse(new TextDecoder('utf-8').decode(await res.arrayBuffer()))
    } catch (error) {
      ultimoError = error
      if (intento < intentos) {
        const espera = 1000 * intento
        console.warn(`    ! ${limpio} fallo (${intento}/${intentos}): ${error.message}. Reintento en ${espera}ms`)
        await dormir(espera)
      }
    }
  }
  throw new Error(`Fallo consultando "${termino}": ${ultimoError?.message}`)
}

export async function vigencia() {
  const res = await fetch('https://cnpm.msal.gov.ar/api/vigencia', { signal: AbortSignal.timeout(30_000) })
  return (await res.text()).trim()
}

export function esperarTurno() {
  return dormir(PAUSA_MS)
}
