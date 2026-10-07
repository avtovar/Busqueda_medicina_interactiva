import { useId, useState } from 'react'
import type { Presentacion, TipoVenta } from '../types/datos'
import { formatearDispersion, formatearPrecio, formatearRango } from '../utils/formato'

const TONOS_VENTA: Record<TipoVenta, string> = {
  'Venta Libre': 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-900',
  'Bajo Receta': 'bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:ring-amber-900',
  'Bajo Receta Archivada': 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700',
  'No Clasificados': 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700',
}

function detallePresentacion(presentacion: Presentacion): string {
  const partes: string[] = []
  const cantidadExpresadaComoVolumenOMasa = /x\s*\d+(?:[.,]\d+)?\s*(?:ml|l|g|gr|kg)\b/i.test(presentacion.presentacion)
  if (presentacion.unidades !== null && !cantidadExpresadaComoVolumenOMasa) {
    partes.push(`${presentacion.unidades} unidades`)
  }
  if (presentacion.forma) partes.push(presentacion.forma.toLowerCase())
  if (presentacion.via) partes.push(`vía ${presentacion.via.toLowerCase()}`)
  return partes.join(' · ')
}

type PresentacionFilaProps = {
  presentacion: Presentacion
}

export function PresentacionFila({ presentacion }: PresentacionFilaProps) {
  const [abierto, setAbierto] = useState(false)
  const idPanel = useId()
  const dispersion = formatearDispersion(presentacion.dispersion)
  const muchos = presentacion.ofertas.length > 3

  return (
    <li className="py-4 first:pt-4">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{presentacion.presentacion}</p>
          {detallePresentacion(presentacion) !== '' && (
            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{detallePresentacion(presentacion)}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            {formatearRango(presentacion.precioMin, presentacion.precioMax, presentacion.ofertas.length)}
          </p>
          {dispersion !== null && (
            <p className="text-sm text-slate-600 dark:text-slate-400">{dispersion}</p>
          )}
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

      {muchos && (
        <>
          <button
            aria-controls={idPanel}
            aria-expanded={abierto}
            className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-500/10 dark:text-sky-300 dark:hover:bg-sky-950/40 dark:focus:ring-sky-500/20"
            onClick={() => setAbierto((value) => !value)}
            type="button"
          >
            {abierto ? 'Ocultar' : 'Ver'} {presentacion.ofertas.length} productos
            <svg
              aria-hidden="true"
              className={`size-4 transition-transform ${abierto ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
            </svg>
          </button>

          {abierto && (
            <ul className="mt-2 divide-y divide-slate-200 border-t border-slate-200 dark:divide-slate-800 dark:border-slate-800" id={idPanel}>
              {presentacion.ofertas.map((oferta) => (
                <li className="flex flex-wrap items-center justify-between gap-2 py-3" key={oferta.gtin}>
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium text-slate-800 dark:text-slate-200">{oferta.nombre}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{oferta.laboratorio || 'Laboratorio sin especificar'}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${TONOS_VENTA[oferta.tipoVenta]}`}>
                      {oferta.tipoVenta}
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {formatearPrecio(oferta.precio)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {!muchos && presentacion.ofertas.length === 1 && (
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Único laboratorio con esta presentación en el Vademécum.
        </p>
      )}
    </li>
  )
}
