import type { CatalogoMeta, FarmaciasMeta } from '../types/datos'
import { formatearFecha } from '../utils/formato'

type AvisoFuenteProps = {
  catalogo: CatalogoMeta | null
  farmacias: FarmaciasMeta | null
}

export function AvisoFuente({ catalogo, farmacias }: AvisoFuenteProps) {
  if (!catalogo) return null

  return (
    <section aria-labelledby="fuentes-title" className="mt-10 border-t border-slate-200 pt-6 dark:border-slate-800">
      <h2 className="text-base font-bold text-slate-800 dark:text-slate-200" id="fuentes-title">
        Fuentes y limitaciones
      </h2>

      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-semibold text-slate-600 dark:text-slate-400">Precios</dt>
          <dd className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">{catalogo.fuente}</dd>
          <dd className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Vigencia {catalogo.vigencia.replace(/"/g, '')} · generado el {formatearFecha(catalogo.generadoEn)}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-semibold text-slate-600 dark:text-slate-400">Farmacias</dt>
          <dd className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">{farmacias?.fuente}</dd>
          <dd className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {farmacias?.totalFarmacias.toLocaleString('es-AR') ?? 0} farmacias registradas en {farmacias?.cobertura}
          </dd>
        </div>
      </dl>

      <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
        {catalogo.aviso}
      </p>

      <details className="mt-4 text-sm">
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
