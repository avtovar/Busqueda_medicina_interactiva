import type { ResultadoGrupo } from '../types/datos'
import { GrupoCard } from './GrupoCard'

type ResultadosListaProps = {
  resultados: ResultadoGrupo[]
  consulta: string
  minimaAlcanzada: boolean
  onClear: () => void
}

function obtenerPrincipales(resultados: ResultadoGrupo[]) {
  return resultados.filter(
    (resultado) => resultado.coincidencia === 'principio-activo' || resultado.coincidencia === 'comercial',
  )
}

function obtenerRelacionadas(resultados: ResultadoGrupo[]) {
  return resultados.filter(
    (resultado) => resultado.coincidencia === 'asociacion' || resultado.coincidencia === 'relacionado',
  )
}

export function ResultadosLista({
  resultados,
  consulta,
  minimaAlcanzada,
  onClear,
}: ResultadosListaProps) {
  if (resultados.length === 0) {
    if (!minimaAlcanzada || consulta.trim() === '') return null

    return (
      <div className="flex flex-col items-start gap-3 border-b border-slate-200 py-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800" role="status">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">No encontramos coincidencias</h3>
          <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Probá con el principio activo o con el nombre comercial. El catálogo disponible es parcial.
          </p>
        </div>
        <button
          className="min-h-11 shrink-0 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-sky-400 dark:hover:bg-sky-950/40 dark:hover:text-sky-100 dark:focus:ring-sky-500/20"
          onClick={onClear}
          type="button"
        >
          Limpiar búsqueda
        </button>
      </div>
    )
  }

  const principales = obtenerPrincipales(resultados)

  if (principales.length === 0) {
    return (
      <p className="border-b border-slate-200 py-5 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:text-slate-300" role="status">
        No encontramos coincidencias principales. Las coincidencias relacionadas aparecen después del directorio.
      </p>
    )
  }

  return (
    <section aria-labelledby="resultados-principales" className="min-w-0">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200" id="resultados-principales">
          Coincidencias principales
        </h3>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {principales.length} {principales.length === 1 ? 'composición' : 'composiciones'}
        </span>
      </div>
      <ul className="space-y-4">
        {principales.map((grupo) => (
          <li key={grupo.clave}>
            <GrupoCard consulta={consulta} grupo={grupo} />
          </li>
        ))}
      </ul>
    </section>
  )
}

export function ResultadosRelacionadas({
  resultados,
  consulta,
}: Pick<ResultadosListaProps, 'resultados' | 'consulta'>) {
  const relacionadas = obtenerRelacionadas(resultados)
  if (relacionadas.length === 0) return null

  return (
    <section aria-labelledby="resultados-relacionados" className="mt-9 border-t border-slate-200 pt-6 dark:border-slate-800">
      <div className="mb-3 border-b border-slate-200 pb-3 dark:border-slate-800">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200" id="resultados-relacionados">
            Coincidencias relacionadas
          </h3>
          <span className="shrink-0 text-sm font-medium text-amber-800 dark:text-amber-300">
            {relacionadas.length} {relacionadas.length === 1 ? 'resultado' : 'resultados'}
          </span>
        </div>
        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
          Asociaciones y nombres afines; no son el mismo medicamento.
        </p>
      </div>
      <ul className="space-y-4">
        {relacionadas.map((grupo) => (
          <li key={grupo.clave}>
            <GrupoCard consulta={consulta} grupo={grupo} />
          </li>
        ))}
      </ul>
    </section>
  )
}
