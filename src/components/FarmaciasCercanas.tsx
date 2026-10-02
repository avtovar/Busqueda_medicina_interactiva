import { useState } from 'react'
import type { FarmaciaConDistancia } from '../types/datos'
import { formatDistance } from '../utils/distance'

const VISIBLES_INICIALES = 8

function FarmaciaItem({ farmacia }: { farmacia: FarmaciaConDistancia }) {
  const ruta = `https://www.google.com/maps/dir/?api=1&destination=${farmacia.lat},${farmacia.lng}`

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between dark:border-slate-800 dark:bg-slate-950/40">
      <div className="min-w-0">
        <h4 className="text-sm font-bold text-slate-900">{farmacia.nombre}</h4>
        <p className="mt-1 text-xs leading-5 text-slate-600">
          {farmacia.direccion ?? 'Dirección no informada'}
        </p>
        <p className="mt-0.5 text-xs text-slate-400">
          {[farmacia.barrio, farmacia.comuna].filter(Boolean).join(' · ')}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
          {formatDistance(farmacia.distanceKm)}
        </span>
        {farmacia.telefono && (
          <a
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-sky-400 dark:hover:bg-sky-950/40 dark:hover:text-sky-100 dark:focus:ring-sky-500/20"
            href={`tel:${farmacia.telefono.replace(/[^\d+]/g, '')}`}
          >
            {farmacia.telefono}
          </a>
        )}
        <a
          className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-slate-900/15 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-sky-200 dark:focus:ring-sky-500/20"
          href={ruta}
          rel="noreferrer"
          target="_blank"
        >
          Ruta
        </a>
      </div>
    </li>
  )
}

type FarmaciasCercanasProps = {
  farmacias: FarmaciaConDistancia[]
  total: number
  hayUbicacion: boolean
  filtro: string
  onFiltroChange: (valor: string) => void
}

export function FarmaciasCercanas({
  farmacias,
  total,
  hayUbicacion,
  filtro,
  onFiltroChange,
}: FarmaciasCercanasProps) {
  const [todas, setTodas] = useState(false)
  const visibles = todas ? farmacias : farmacias.slice(0, VISIBLES_INICIALES)

  return (
    <section aria-labelledby="farmacias-title" className="pt-12">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900" id="farmacias-title">
          Farmacias en CABA
        </h2>
        <p className="shrink-0 text-sm font-semibold text-slate-500">
          {farmacias.length.toLocaleString('es-AR')} de {total.toLocaleString('es-AR')}
        </p>
      </div>
      <p className="mb-5 max-w-2xl text-sm leading-6 text-slate-500">
        El registro oficial no informa precios ni stock por farmacia, así que no se pueden comparar
        precios entre estos comercios. Sirven para saber dónde consultar, llamar o ir.
      </p>

      <label className="sr-only" htmlFor="farmacia-filtro">
        Filtrar farmacias por nombre, barrio o comuna
      </label>
      <input
        className="mb-4 h-11 w-full max-w-sm rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-400 dark:focus:ring-sky-500/20"
        id="farmacia-filtro"
        onChange={(event) => onFiltroChange(event.target.value)}
        placeholder="Filtrar por barrio, comuna o nombre"
        type="search"
        value={filtro}
      />

      {farmacias.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
          Ninguna farmacia del registro coincide con ese filtro.
        </p>
      ) : (
        <>
          <ul className="space-y-2.5">
            {visibles.map((farmacia) => (
              <FarmaciaItem farmacia={farmacia} key={farmacia.id} />
            ))}
          </ul>
          {farmacias.length > VISIBLES_INICIALES && (
            <button
              className="mt-4 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-sky-400 dark:hover:bg-sky-950/40 dark:hover:text-sky-100 dark:focus:ring-sky-500/20"
              onClick={() => setTodas((v) => !v)}
              type="button"
            >
              {todas ? 'Ver menos' : `Ver las ${farmacias.length} farmacias`}
            </button>
          )}
        </>
      )}

      {!hayUbicacion && (
        <p className="mt-4 text-xs text-slate-400">
          Sin ubicación activada la lista está en orden alfabético.
        </p>
      )}
    </section>
  )
}
