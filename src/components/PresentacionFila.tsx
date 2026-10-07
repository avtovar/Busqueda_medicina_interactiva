import { useId, useState } from 'react'
// ↑ useId: genera ID único estable para aria-controls/aria-expanded (accesibilidad)
// ↑ useState: controla si el panel de ofertas está expandido
import type { Presentacion, TipoVenta } from '../types/datos'
import { formatearDispersion, formatearPrecio, formatearRango } from '../utils/formato'

const TONOS_VENTA: Record<TipoVenta, string> = {
  // ↑ Mapa de clases Tailwind por tipo de venta (badge coloreado)
  'Venta Libre': 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-900',
  // ↑ Verde: venta libre (sin receta)
  'Bajo Receta': 'bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:ring-amber-900',
  // ↑ Ámbar: bajo receta (receta simple)
  'Bajo Receta Archivada': 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700',
  // ↑ Gris: receta archivada (psicotrópicos, etc.)
  'No Clasificados': 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700',
  // ↑ Gris: sin clasificar
}

function detallePresentacion(presentacion: Presentacion): string {
  // ↑ Construye string legible: "10 unidades · comprimido · vía oral"
  const partes: string[] = []
  const cantidadExpresadaComoVolumenOMasa = /x\s*\d+(?:[.,]\d+)?\s*(?:ml|l|g|gr|kg)\b/i.test(presentacion.presentacion)
  // ↑ Regex: detecta si la presentación YA incluye volumen/masa (ej. "susp.x 90 ml")
  if (presentacion.unidades !== null && !cantidadExpresadaComoVolumenOMasa) {
    partes.push(`${presentacion.unidades} unidades`)
    // ↑ Solo agrega "X unidades" si NO está ya en el texto de presentación
  }
  if (presentacion.forma) partes.push(presentacion.forma.toLowerCase())
  // ↑ Forma farmacéutica: comprimido, cápsula, suspensión, etc.
  if (presentacion.via) partes.push(`vía ${presentacion.via.toLowerCase()}`)
  // ↑ Vía de administración: oral, tópica, inyectable, etc.
  return partes.join(' · ')
  // ↑ Une con separador " · "
}

type PresentacionFilaProps = {
  presentacion: Presentacion
  // ↑ Presentación completa: clave, presentacion, forma, via, potencia, unidades, precios, ofertas
}

export function PresentacionFila({ presentacion }: PresentacionFilaProps) {
  const [abierto, setAbierto] = useState(false)
  // ↑ Estado: panel de ofertas expandido (true) o colapsado (false)
  const idPanel = useId()
  // ↑ ID único para aria-controls (vincula botón con panel) y id del <ul>
  const dispersion = formatearDispersion(presentacion.dispersion)
  // ↑ String legible de dispersión: "hasta 2,5 x de diferencia" o "precios iguales" o null
  const muchos = presentacion.ofertas.length > 3
  // ↑ Si hay >3 ofertas, muestra botón "Ver N productos" + panel expandible

  return (
    <li className="py-4 first:pt-4">
      {/* ↑ Padding vertical; first:pt-4 elimina padding extra del primer hijo en GrupoCard */}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        {/* ↑ Fila principal: info izquierda, precios derecha; flex-wrap en mobile */}
        <div className="min-w-0">
          {/* ↑ min-w-0 permite truncar texto largo (break-words implícito en flex) */}
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{presentacion.presentacion}</p>
          {/* ↑ Texto de presentación: ej. "400 mg comp.x 10" */}
          {detallePresentacion(presentacion) !== '' && (
            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{detallePresentacion(presentacion)}</p>
          )}
          {/* ↑ Detalle adicional (unidades, forma, vía) solo si no está vacío */}
        </div>
        <div className="text-right">
          <p className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            {formatearRango(presentacion.precioMin, presentacion.precioMax, presentacion.ofertas.length)}
          </p>
          {/* ↑ Rango: "$100" (1 lab) o "$100 - $150" (múltiples labs) */}
          {dispersion !== null && (
            <p className="text-sm text-slate-600 dark:text-slate-400">{dispersion}</p>
          )}
          {/* ↑ Dispersión solo si hay ≥2 laboratorios (null si 1 solo) */}
        </div>
      </div>

      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        <span className="font-semibold text-slate-800 dark:text-slate-200">Más barato:</span>{' '}
        {presentacion.economico.nombre}
        {presentacion.economico.laboratorio !== '' && (
          <span className="text-slate-600 dark:text-slate-400"> · {presentacion.economico.laboratorio}</span>
        )}{' '}
        · {formatearPrecio(presentacion.economico.precio)}
      </p>
      // ↑ Línea "Más barato": nombre · laboratorio · precio formateado

      {muchos && (
        // ↑ Si >3 ofertas: botón toggle + panel expandible
        <>
          <button
            aria-controls={idPanel}
            // ↑ Vincula botón con panel (idPanel) para screen readers
            aria-expanded={abierto}
            // ↑ true/false: anuncia estado expandido/colapsado
            className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-500/10 dark:text-sky-300 dark:hover:bg-sky-950/40 dark:focus:ring-sky-500/20"
            onClick={() => setAbierto((value) => !value)}
            // ↑ Toggle: invierte boolean (prev => !prev)
            type="button"
          >
            {abierto ? 'Ocultar' : 'Ver'} {presentacion.ofertas.length} productos
            {/* ↑ Texto dinámico: "Ver 5 productos" / "Ocultar 5 productos" */}
            <svg
              aria-hidden="true"
              className={`size-4 transition-transform ${abierto ? 'rotate-180' : ''}`}
              // ↑ Flecha rota 180° cuando abierto (transición suave)
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
            </svg>
          </button>

          {abierto && (
            // ↑ Render condicional: solo monta el <ul> si abierto=true
            <ul className="mt-2 divide-y divide-slate-200 border-t border-slate-200 dark:divide-slate-800 dark:border-slate-800" id={idPanel}>
              // ↑ idPanel = aria-controls del botón; divide-y = separadores entre li
              {presentacion.ofertas.map((oferta) => (
                <li className="flex flex-wrap items-center justify-between gap-2 py-3" key={oferta.gtin}>
                  // ↑ gtin = clave única estable (código de barras)
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium text-slate-800 dark:text-slate-200">{oferta.nombre}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{oferta.laboratorio || 'Laboratorio sin especificar'}</p>
                    // ↑ Fallback si laboratorio viene vacío/null
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${TONOS_VENTA[oferta.tipoVenta]}`}>
                      {oferta.tipoVenta}
                    </span>
                    // ↑ Badge tipo venta: clases dinámicas según TONOS_VENTA
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {formatearPrecio(oferta.precio)}
                    </span>
                    // ↑ Precio individual de esta oferta
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {!muchos && presentacion.ofertas.length === 1 && (
        // ↑ Si ≤3 ofertas Y exactamente 1: mensaje especial (no botón)
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Único laboratorio con esta presentación en el Vademécum.
        </p>
      )}
    </li>
  )
}
