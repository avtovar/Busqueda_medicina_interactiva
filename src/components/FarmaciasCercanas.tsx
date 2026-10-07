import { useState } from 'react'
import type { ReactNode } from 'react'
import type { FarmaciaConDistancia } from '../types/datos'
import { formatDistance } from '../utils/distance'

const VISIBLES_INICIALES = 8
const VISIBLES_COMPACTAS = 2

function FarmaciaItem({ farmacia, compact }: { farmacia: FarmaciaConDistancia; compact: boolean }) {
  const ruta = `https://www.google.com/maps/dir/?api=1&destination=${farmacia.lat},${farmacia.lng}`
  const telefono = farmacia.telefono?.replace(/[^\d+]/g, '')

  return (
    <li className={`grid gap-3 border-t border-slate-200 py-4 dark:border-slate-800 ${compact ? '' : 'sm:grid-cols-[minmax(0,1.2fr)_minmax(10rem,0.8fr)_auto] sm:items-center'}`}>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{farmacia.nombre}</h3>
        <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">
          {farmacia.direccion ?? 'Dirección no informada'}
          {[farmacia.barrio, farmacia.comuna].filter(Boolean).length > 0 && (
            <span className="text-slate-500 dark:text-slate-400">
              {' '}· {[farmacia.barrio, farmacia.comuna].filter(Boolean).join(' · ')}
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        {farmacia.telefono && telefono && (
          <a
            aria-label={`Llamar a ${farmacia.nombre}: ${farmacia.telefono}`}
            className="inline-flex min-h-11 items-center font-semibold text-sky-800 underline decoration-sky-300 underline-offset-4 hover:text-sky-950 focus:outline-none focus:ring-4 focus:ring-sky-500/10 dark:text-sky-300 dark:decoration-sky-700 dark:hover:text-sky-200 dark:focus:ring-sky-500/20"
            href={`tel:${telefono}`}
          >
            Llamar · {farmacia.telefono}
          </a>
        )}
        {farmacia.distanceKm !== null ? (
          <span className="text-slate-600 dark:text-slate-400">{formatDistance(farmacia.distanceKm)}</span>
        ) : (
          <span className="text-slate-500 dark:text-slate-400">Sin ubicación para calcular distancia</span>
        )}
        {compact && (
          <a
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-slate-900/15 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-sky-200 dark:focus:ring-sky-500/20"
            href={ruta}
            rel="noreferrer"
            target="_blank"
          >
            Abrir ruta
          </a>
        )}
      </div>

      {!compact && (
        <a
          className="inline-flex min-h-11 items-center justify-center self-start rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-slate-900/15 sm:self-center dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-sky-200 dark:focus:ring-sky-500/20"
          href={ruta}
          rel="noreferrer"
          target="_blank"
        >
          Abrir ruta
        </a>
      )}
    </li>
  )
}

type FarmaciasCercanasProps = {
  farmacias: FarmaciaConDistancia[]
  total: number
  hayUbicacion: boolean
  filtro: string
  onFiltroChange: (valor: string) => void
  compact?: boolean
  locationStatus?: ReactNode
}

export function FarmaciasCercanas({
  farmacias,
  total,
  hayUbicacion,
  filtro,
  onFiltroChange,
  compact = false,
  locationStatus,
}: FarmaciasCercanasProps) {
  const [todas, setTodas] = useState(false)
  const limiteVisible = compact ? VISIBLES_COMPACTAS : VISIBLES_INICIALES
  const visibles = todas ? farmacias : farmacias.slice(0, limiteVisible)

  return (
    <section aria-labelledby="farmacias-title" className={compact ? '' : 'pt-7'}>
      <div className={`flex flex-col gap-4 ${compact ? '' : 'sm:flex-row sm:items-end sm:justify-between'}`}>
        <div>
          <h2 className={`${compact ? 'text-xl' : 'text-2xl'} font-bold tracking-tight text-slate-950 dark:text-slate-100`} id="farmacias-title">
            Farmacias registradas en CABA
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-300">
            El registro es independiente de la búsqueda; no informa precio ni stock. Llamá para consultar antes de ir.
          </p>
          {locationStatus}
        </div>
        <div className={`flex flex-col gap-2 ${compact ? '' : 'sm:w-64 sm:shrink-0'}`}>
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-300" htmlFor="farmacia-filtro">
            Filtrar farmacias
          </label>
          <input
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-sky-400 dark:focus:ring-sky-500/20"
            id="farmacia-filtro"
            onChange={(event) => onFiltroChange(event.target.value)}
            placeholder="Barrio, comuna o nombre"
            type="search"
            value={filtro}
          />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {farmacias.length.toLocaleString('es-AR')} de {total.toLocaleString('es-AR')}
          </p>
        </div>
      </div>

      {farmacias.length === 0 ? (
        <p className="mt-4 border-y border-slate-200 py-5 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
          Ninguna farmacia del registro coincide con ese filtro.
        </p>
      ) : (
        <>
          <ul className="mt-4">
            {visibles.map((farmacia) => (
              <FarmaciaItem compact={compact} farmacia={farmacia} key={farmacia.id} />
            ))}
          </ul>
          {farmacias.length > limiteVisible && (
            <button
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm font-semibold text-sky-800 transition hover:text-sky-950 focus:outline-none focus:ring-4 focus:ring-sky-500/10 dark:text-sky-300 dark:hover:text-sky-200 dark:focus:ring-sky-500/20"
              onClick={() => setTodas((value) => !value)}
              type="button"
            >
              {todas ? 'Ver menos' : `Ver las ${farmacias.length.toLocaleString('es-AR')} farmacias`}
              <svg aria-hidden="true" className={`size-4 transition-transform ${todas ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
              </svg>
            </button>
          )}
        </>
      )}

      {!hayUbicacion && (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Sin ubicación activada, la lista está en orden alfabético.
        </p>
      )}
    </section>
  )
}
