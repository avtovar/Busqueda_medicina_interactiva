import type { ResultadoGrupo } from '../types/datos'
import { GrupoCard } from './GrupoCard'

type ResultadosListaProps = {
  resultados: ResultadoGrupo[]
  consulta: string
  minimaAlcanzada: boolean
  onClear: () => void
}

export function ResultadosLista({
  resultados,
  consulta,
  minimaAlcanzada,
  onClear,
}: ResultadosListaProps) {
  if (resultados.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-950/40">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <svg aria-hidden="true" className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m2.1-5.4a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-bold text-slate-900">
          {consulta.trim() === ''
            ? 'Buscá un medicamento'
            : minimaAlcanzada
              ? 'Sin resultados'
              : 'Faltan letras'}
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          {!minimaAlcanzada && consulta.trim() !== ''
            ? 'Escribí al menos 3 letras para buscar.'
            : 'Probá con el principio activo (ibuprofeno, paracetamol) o con el nombre comercial (Actron, Losacor).'}
        </p>
        {consulta.trim() !== '' && (
          <button
            className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-slate-900/15 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-sky-200 dark:focus:ring-sky-500/20"
            onClick={onClear}
            type="button"
          >
            Limpiar búsqueda
          </button>
        )}
      </div>
    )
  }

  const exactos = resultados.filter(
    (r) => r.coincidencia === 'principio-activo' || r.coincidencia === 'comercial',
  )
  const otros = resultados.filter(
    (r) => r.coincidencia === 'asociacion' || r.coincidencia === 'relacionado',
  )

  return (
    <div className="space-y-10">
      {exactos.length > 0 && (
        <section aria-labelledby="resultados-exactos">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-slate-500" id="resultados-exactos">
            {exactos.length === 1
              ? '1 composición que coincide'
              : `${exactos.length} composiciones que coinciden`}
          </h3>
          <ul className="grid gap-4 lg:grid-cols-2">
            {exactos.map((grupo) => (
              <li key={grupo.clave}>
                <GrupoCard grupo={grupo} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {otros.length > 0 && (
        <section aria-labelledby="resultados-asociaciones">
          <h3 className="mb-1 text-sm font-bold uppercase tracking-[0.16em] text-amber-700" id="resultados-asociaciones">
            {otros.length} {otros.length === 1 ? 'relacionada' : 'relacionadas'}
          </h3>
          <p className="mb-4 text-sm text-slate-500">
            Productos que contienen lo que buscaste junto con otro principio activo, o nombres
            parecidos. No son el mismo medicamento.
          </p>
          <ul className="grid gap-4 lg:grid-cols-2">
            {otros.map((grupo) => (
              <li key={grupo.clave}>
                <GrupoCard grupo={grupo} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
