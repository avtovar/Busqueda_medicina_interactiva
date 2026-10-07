import type { OrdenResultados } from '../types/datos'

type OrdenFiltrosProps = {
  value: OrdenResultados
  onChange: (value: OrdenResultados) => void
}

export function OrdenFiltros({ value, onChange }: OrdenFiltrosProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 sm:w-64 sm:shrink-0">
      <label className="text-sm font-semibold text-slate-600 dark:text-slate-300" htmlFor="sort-results">
        Ordenar resultados
      </label>
      <select
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-sky-400 dark:focus:ring-sky-500/20"
        id="sort-results"
        onChange={(event) => onChange(event.target.value as OrdenResultados)}
        value={value}
      >
        <option value="precio-asc">Menor precio mínimo de referencia</option>
        <option value="precio-desc">Mayor precio mínimo de referencia</option>
        <option value="ofertas-desc">Más productos</option>
        <option value="nombre">Nombre (A–Z)</option>
      </select>
      <p className="text-sm leading-5 text-slate-600 dark:text-slate-400">
        Ordena por el mínimo de cada composición; puede corresponder a distintas presentaciones.
      </p>
    </div>
  )
}
