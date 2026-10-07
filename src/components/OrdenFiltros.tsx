import type { OrdenResultados } from '../types/datos'
// ↑ Tipo union: 'precio-asc' | 'precio-desc' | 'ofertas-desc' | 'nombre'

type OrdenFiltrosProps = {
  value: OrdenResultados
  // ↑ Valor actual del select (controlado por padre)
  onChange: (value: OrdenResultados) => void
  // ↑ Callback: padre actualiza su estado orden
}

export function OrdenFiltros({ value, onChange }: OrdenFiltrosProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 sm:w-64 sm:shrink-0">
      {/* ↑ min-w-0 permite encojer en flex; sm:w-64 = ancho fijo 16rem en desktop */}
      {/* ↑ shrink-0 evita que el select se encoja por debajo de 16rem */}
      <label className="text-sm font-semibold text-slate-600 dark:text-slate-300" htmlFor="sort-results">
        Ordenar resultados
      </label>
      <select
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-sky-400 dark:focus:ring-sky-500/20"
        // ↑ h-11 = 44px touch target; focus:ring = anillo accesible sky-500
        id="sort-results"
        // ↑ ID vinculado con label[htmlFor]
        onChange={(event) => onChange(event.target.value as OrdenResultados)}
        // ↑ Castea a OrdenResultados (TS no infiere el value del select nativo)
        value={value}
        // ↑ Controlado: React maneja el valor seleccionado
      >
        <option value="precio-asc">Menor precio mínimo de referencia</option>
        <option value="precio-desc">Mayor precio mínimo de referencia</option>
        <option value="ofertas-desc">Más productos</option>
        <option value="nombre">Nombre (A–Z)</option>
      </select>
      <p className="text-sm leading-5 text-slate-600 dark:text-slate-400">
        Ordena por el mínimo de cada composición; puede corresponder a distintas presentaciones.
        {/* ↑ Aclaración importante: el precio mínimo puede venir de presentaciones DISTINTAS */}
      </p>
    </div>
  )
}
