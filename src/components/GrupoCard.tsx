import { useState } from 'react'
import type { Coincidencia, ResultadoGrupo } from '../types/datos'
import { formatearPrecio } from '../utils/formato'
import { PresentacionFila } from './PresentacionFila'

const ETIQUETAS: Record<Coincidencia, { texto: string; clase: string }> = {
  'principio-activo': {
    texto: 'Principio activo',
    clase: 'inline-flex items-center rounded-full border border-sky-600 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-sky-700 dark:border-sky-500 dark:text-sky-200',
  },
  comercial: {
    texto: 'Nombre comercial',
    clase: 'inline-flex items-center rounded-full border border-indigo-600 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-indigo-700 dark:border-indigo-400 dark:text-indigo-200',
  },
  asociacion: {
    texto: 'Asociación',
    clase: 'inline-flex items-center rounded-full border border-amber-600 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-700 dark:border-amber-400 dark:text-amber-200',
  },
  relacionado: {
    texto: 'Relacionado',
    clase: 'inline-flex items-center rounded-full border border-slate-500 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-700 dark:border-slate-400 dark:text-slate-200',
  },
}

const PRESENTACIONES_INICIALES = 4

type GrupoCardProps = {
  grupo: ResultadoGrupo
}

export function GrupoCard({ grupo }: GrupoCardProps) {
  const [todas, setTodas] = useState(false)
  const visibles = todas ? grupo.presentaciones : grupo.presentaciones.slice(0, PRESENTACIONES_INICIALES)
  const restantes = grupo.presentaciones.length - PRESENTACIONES_INICIALES
  const etiqueta = ETIQUETAS[grupo.coincidencia]

  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-950/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span
            className={`inline-block ${etiqueta.clase}`}
          >
            {etiqueta.texto}
          </span>
          <h3 className="mt-2 text-lg font-extrabold tracking-tight text-slate-900">
            {grupo.etiqueta}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {grupo.totalProductos} productos en {grupo.presentaciones.length} presentaciones
            {grupo.marcasQueCoinciden.length > 0 && (
              <> · incluye {grupo.marcasQueCoinciden.slice(0, 2).join(', ')}</>
            )}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs text-slate-400">Desde</p>
          <p className="text-xl font-extrabold tracking-tight text-slate-900">
            {formatearPrecio(grupo.precioDesde)}
          </p>
        </div>
      </div>

      {grupo.esAsociacion && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
          Es una asociación: contiene {grupo.ingredientes.join(' + ')}. No es el mismo producto que
          uno de un solo principio activo.
        </p>
      )}

      <ul className="mt-4 space-y-2.5">
        {visibles.map((presentacion) => (
          <PresentacionFila key={presentacion.clave} presentacion={presentacion} />
        ))}
      </ul>

      {restantes > 0 && (
        <button
          className="mt-4 self-start rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200 dark:hover:border-sky-400 dark:hover:bg-sky-950/40 dark:hover:text-sky-100 dark:focus:ring-sky-500/20"
          onClick={() => setTodas((v) => !v)}
          type="button"
        >
          {todas ? 'Ver menos' : `Ver las ${grupo.presentaciones.length} presentaciones`}
        </button>
      )}
    </article>
  )
}
