import type { CatalogoMeta, FarmaciasMeta } from '../types/datos'
import { formatearFecha } from '../utils/formato'

type AvisoFuenteProps = {
  catalogo: CatalogoMeta | null
  // ↑ Metadatos del catálogo (vigencia, fuente, totales, aviso, etc.)
  farmacias: FarmaciasMeta | null
  // ↑ Metadatos del registro de farmacias (fuente, cobertura, total, etc.)
}

export function AvisoFuente({ catalogo, farmacias }: AvisoFuenteProps) {
  if (!catalogo) return null
  // ↑ Si no hay catálogo (carga fallida), no renderiza nada

  return (
    <section aria-labelledby="fuentes-title" className="mt-10 border-t border-slate-200 pt-6 dark:border-slate-800">
      {/* ↑ Sección separada: margin-top 2.5rem + border-top + padding-top */}
      <h2 className="text-base font-bold text-slate-800 dark:text-slate-200" id="fuentes-title">
        Fuentes y limitaciones
      </h2>

      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        {/* ↑ Description list semántica: dt=término, dd=definición */}
        {/* ↑ Mobile: 1 columna; Desktop: 2 columnas (grid-cols-2) */}
        <div>
          <dt className="text-sm font-semibold text-slate-600 dark:text-slate-400">Precios</dt>
          <dd className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">{catalogo.fuente}</dd>
          {/* ↑ Fuente: "Vademecum Nacional de Medicamentos (CNPM) - Ministerio de Salud" */}
          <dd className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Vigencia {catalogo.vigencia.replace(/"/g, '')} · generado el {formatearFecha(catalogo.generadoEn)}
          </dd>
          {/* ↑ Vigencia del Vademécum + fecha de generación del snapshot (formato AR) */}
        </div>
        <div>
          <dt className="text-sm font-semibold text-slate-600 dark:text-slate-400">Farmacias</dt>
          <dd className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">{farmacias?.fuente}</dd>
          {/* ↑ Fuente: "Ministerio de Salud de la Ciudad de Buenos Aires - datos abiertos" */}
          <dd className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {farmacias?.totalFarmacias.toLocaleString('es-AR') ?? 0} farmacias registradas en {farmacias?.cobertura}
          </dd>
          {/* ↑ Total farmacias + cobertura ("Ciudad autónoma de Buenos Aires") */}
        </div>
      </dl>

      <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
        {catalogo.aviso}
        {/* ↑ Aviso legal del catálogo: precios son referencia, no confirmados por farmacia */}
      </p>

      <details className="mt-4 text-sm">
        {/* ↑ Details/summary nativo: colapsable sin JS */}
        <summary className="min-h-11 cursor-pointer py-2 font-semibold text-slate-700 hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-sky-500/10 dark:text-slate-300 dark:hover:text-slate-100 dark:focus:ring-sky-500/20">
          Ver las limitaciones de esta versión
        </summary>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 leading-6 text-slate-600 dark:text-slate-400">
          <li>
            El catálogo se armó a partir de los {catalogo.totalFilasSemilla} medicamentos más
            consumidos del ranking de PAMI (ranks {catalogo.rangoRankSemilla[0]} a{' '}
            {catalogo.rangoRankSemilla[1]}), consultando {catalogo.totalTerminos} términos. Hay{' '}
            {catalogo.totalProductos.toLocaleString('es-AR')} productos de {catalogo.totalGrupos} composiciones, pero no es
            el Vademécum completo.
          </li>
          <li>Los precios son de referencia y no son el precio de ninguna farmacia concreta.</li>
          <li>No hay stock ni disponibilidad por comercio, así que no se pueden comparar precios entre farmacias.</li>
          <li>Solo hay cobertura de la Ciudad de Buenos Aires.</li>
          <li>No es consejo médico. Para una consulta, hablá con un profesional o pedí receta.</li>
        </ul>
      </details>
    </section>
  )
}
