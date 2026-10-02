import { useId, useState } from 'react'
import type { Presentacion, TipoVenta } from '../types/datos'
import { formatearDispersion, formatearPrecio, formatearRango } from '../utils/formato'

const TONOS_VENTA: Record<TipoVenta, string> = {
  'Venta Libre': 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  'Bajo Receta': 'bg-amber-50 text-amber-800 ring-amber-100',
  'Bajo Receta Archivada': 'bg-slate-100 text-slate-600 ring-slate-200',
  'No Clasificados': 'bg-slate-100 text-slate-500 ring-slate-200',
}

function detallePresentacion(presentacion: Presentacion): string {
  const partes: string[] = []
  if (presentacion.unidades !== null) partes.push(`${presentacion.unidades} unidades`)
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
    <li className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900">{presentacion.presentacion}</p>
          {detallePresentacion(presentacion) !== '' && (
            <p className="mt-0.5 text-xs text-slate-500">{detallePresentacion(presentacion)}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-lg font-extrabold tracking-tight text-slate-900">
            {formatearRango(presentacion.precioMin, presentacion.precioMax, presentacion.ofertas.length)}
          </p>
          {dispersion !== null && (
            <p className="text-xs font-medium text-slate-500">{dispersion}</p>
          )}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-600">
        <span className="font-semibold text-slate-800">Más barato:</span>{' '}
        {presentacion.economico.nombre}
        {presentacion.economico.laboratorio !== '' && (
          <span className="text-slate-500"> · {presentacion.economico.laboratorio}</span>
        )}{' '}
        · {formatearPrecio(presentacion.economico.precio)}
      </p>

      {muchos && (
        <>
          <button
            aria-controls={idPanel}
            aria-expanded={abierto}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold text-sky-700 transition hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-500/10 dark:text-sky-100 dark:hover:bg-sky-950/40 dark:focus:ring-sky-500/20"
            onClick={() => setAbierto((v) => !v)}
            type="button"
          >
            {abierto ? 'Ocultar' : 'Ver'} {presentacion.ofertas.length} laboratorios
            <svg
              aria-hidden="true"
              className={`size-3.5 transition-transform ${abierto ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
            </svg>
          </button>

          {abierto && (
            <ul className="mt-3 divide-y divide-slate-100 border-t border-slate-100" id={idPanel}>
              {presentacion.ofertas.map((oferta) => (
                <li className="flex flex-wrap items-center justify-between gap-2 py-2" key={oferta.gtin}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{oferta.nombre}</p>
                    <p className="text-xs text-slate-500">{oferta.laboratorio || 'Laboratorio sin especificar'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${TONOS_VENTA[oferta.tipoVenta]}`}
                    >
                      {oferta.tipoVenta}
                    </span>
                    <span className="text-sm font-bold text-slate-900">
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
        <p className="mt-3 text-xs text-slate-400">
          Único laboratorio con esta presentación en el Vademécum.
        </p>
      )}
    </li>
  )
}
