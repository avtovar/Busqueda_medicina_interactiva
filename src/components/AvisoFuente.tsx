import type { CatalogoMeta, FarmaciasMeta } from '../types/datos'
import { formatearFecha } from '../utils/formato'

type AvisoFuenteProps = {
  catalogo: CatalogoMeta | null
  farmacias: FarmaciasMeta | null
}

export function AvisoFuente({ catalogo, farmacias }: AvisoFuenteProps) {
  if (!catalogo) return null

  return (
    <section aria-labelledby="fuentes-title" className="mt-12 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950/40">
      <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500" id="fuentes-title">
        De dónde salen estos datos
      </h2>

      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold text-slate-400">Precios</dt>
          <dd className="mt-1 text-sm leading-6 text-slate-700">{catalogo.fuente}</dd>
          <dd className="mt-1 text-sm text-slate-500">
            Vigencia {catalogo.vigencia} · generado el {formatearFecha(catalogo.generadoEn)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-slate-400">Farmacias</dt>
          <dd className="mt-1 text-sm leading-6 text-slate-700">{farmacias?.fuente}</dd>
          <dd className="mt-1 text-sm text-slate-500">
            {farmacias?.totalFarmacias ?? 0} farmacias registradas en {farmacias?.cobertura}
          </dd>
        </div>
      </dl>

      <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
        {catalogo.aviso}
      </p>

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer font-semibold text-slate-600 hover:text-slate-900">
          Ver las limitaciones de esta versión
        </summary>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 leading-6 text-slate-500">
          <li>
            El catálogo se armó a partir de los {catalogo.totalFilasSemilla} medicamentos más
            consumidos del ranking de PAMI (ranks {catalogo.rangoRankSemilla[0]} a{' '}
            {catalogo.rangoRankSemilla[1]}), consultando {catalogo.totalTerminos} términos. Hay{' '}
            {catalogo.totalProductos} productos de {catalogo.totalGrupos} composiciones, pero no es
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
