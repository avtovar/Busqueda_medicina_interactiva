import { useState } from 'react'
import type { Coincidencia, ResultadoGrupo } from '../types/datos'
import { formatearPrecio } from '../utils/formato'
import { PresentacionFila } from './PresentacionFila'

const ETIQUETAS: Record<Coincidencia, { texto: string; clase: string }> = {
  'principio-activo': {
    texto: 'Principio activo',
    clase: 'text-xs font-semibold text-sky-800 dark:text-sky-300',
  },
  comercial: {
    texto: 'Nombre comercial',
    clase: 'text-xs font-semibold text-indigo-800 dark:text-indigo-300',
  },
  asociacion: {
    texto: 'Asociación',
    clase: 'text-xs font-semibold text-amber-800 dark:text-amber-300',
  },
  relacionado: {
    texto: 'Relacionado',
    clase: 'text-xs font-semibold text-slate-600 dark:text-slate-300',
  },
}

const PRESENTACIONES_INICIALES = 4

const EXPLICACION_ASOCIACION =
  'Contiene más de un principio activo; no es el mismo producto que {consulta} solo.'

const EXPLICACION_RELACIONADO = 'Resultado relacionado, separado de la coincidencia principal.'

type GrupoCardProps = {
  grupo: ResultadoGrupo
  consulta: string
}

export function GrupoCard({ grupo, consulta }: GrupoCardProps) {
  const [todas, setTodas] = useState(false)
  const visibles = todas ? grupo.presentaciones : grupo.presentaciones.slice(0, PRESENTACIONES_INICIALES)
  const restantes = grupo.presentaciones.length - PRESENTACIONES_INICIALES
  const etiqueta = ETIQUETAS[grupo.coincidencia]
  const busqueda = consulta.trim()

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 sm:p-5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-slate-950/30">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className={etiqueta.clase}>{etiqueta.texto}</span>
          <h4 className="mt-1.5 break-words text-lg font-bold tracking-tight text-slate-950 dark:text-slate-100">
            {grupo.etiqueta}
          </h4>
          <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-400">
            {grupo.totalProductos.toLocaleString('es-AR')} productos en {grupo.presentaciones.length.toLocaleString('es-AR')} presentaciones
            {grupo.marcasQueCoinciden.length > 0 && (
              <> · incluye {grupo.marcasQueCoinciden.slice(0, 2).join(', ')}</>
            )}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Desde · referencia</p>
          <p className="mt-0.5 text-xl font-extrabold tracking-tight text-sky-800 dark:text-sky-300">
            {formatearPrecio(grupo.precioDesde)}
          </p>
          <p className="mt-1 max-w-40 text-xs leading-4 text-slate-500 dark:text-slate-400">
            Mínimo entre distintas presentaciones
          </p>
        </div>
      </div>

      {grupo.esAsociacion ? (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm leading-5 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
          {busqueda === ''
            ? `Contiene más de un principio activo: ${grupo.ingredientes.join(' + ')}.`
            : EXPLICACION_ASOCIACION.replace('{consulta}', busqueda)}
        </p>
      ) : (
        grupo.coincidencia === 'relacionado' && (
          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm leading-5 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
            {EXPLICACION_RELACIONADO}
          </p>
        )
      )}

      <ul className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
        {visibles.map((presentacion) => (
          <PresentacionFila key={presentacion.clave} presentacion={presentacion} />
        ))}
      </ul>

      {restantes > 0 && (
        <button
          className="mt-2 inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-50 hover:text-sky-950 focus:outline-none focus:ring-4 focus:ring-sky-500/10 dark:text-sky-300 dark:hover:bg-sky-950/40 dark:hover:text-sky-100 dark:focus:ring-sky-500/20"
          onClick={() => setTodas((value) => !value)}
          type="button"
        >
          {todas ? 'Ver menos' : `Ver las ${grupo.presentaciones.length.toLocaleString('es-AR')} presentaciones`}
        </button>
      )}
    </article>
  )
}
