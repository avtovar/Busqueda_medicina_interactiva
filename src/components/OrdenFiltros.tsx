import type { OrdenResultados } from '../types/datos'

type OrdenFiltrosProps = {
  value: OrdenResultados
  onChange: (value: OrdenResultados) => void
}

export function OrdenFiltros({ value, onChange }: OrdenFiltrosProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2 sm:min-w-64">
      <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500" htmlFor="sort-results">
        Ordenar resultados
      </label>
      <select
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200 dark:focus:border-sky-400 dark:focus:ring-sky-500/20"
        id="sort-results"
        onChange={(event) => onChange(event.target.value as OrdenResultados)}
        value={value}
      >
        <option value="precio-asc">Precio más bajo primero</option>
        <option value="precio-desc">Precio más alto primero</option>
        <option value="ofertas-desc">Más opciones de laboratorio</option>
        <option value="nombre">Nombre (A - Z)</option>
      </select>
      <p className="text-xs text-slate-400">
        El precio es el más bajo dentro de la presentación más barata de cada composición.
      </p>
    </div>
  )
}
