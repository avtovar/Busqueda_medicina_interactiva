import { useState } from 'react'
// ↑ Estado local: expandir/colapsar lista de farmacias
import type { ReactNode } from 'react'
// ↑ Tipo para children/locationStatus (puede ser JSX o undefined)
import type { FarmaciaConDistancia } from '../types/datos'
// ↑ Farmacia + distanceKm (number | null)
import { formatDistance } from '../utils/distance'
// ↑ Formatea distancia en km/m legible ("A 1,2 km de ti" / "A 350 m de ti")

const VISIBLES_INICIALES = 8
// ↑ Cantidad de farmacias visibles por defecto (modo normal)
const VISIBLES_COMPACTAS = 2
// ↑ Cantidad en modo compact (aside junto a resultados)

function FarmaciaItem({ farmacia, compact }: { farmacia: FarmaciaConDistancia; compact: boolean }) {
  // ↑ Componente interno: renderiza una sola farmacia (reutilizado en map)
  const ruta = `https://www.google.com/maps/dir/?api=1&destination=${farmacia.lat},${farmacia.lng}`
  // ↑ URL Google Maps: destination=lat,lng (abre en app Maps o web)
  const telefono = farmacia.telefono?.replace(/[^\d+]/g, '')
  // ↑ Limpia teléfono: solo dígitos y + (para href tel:)

  return (
    <li className={`grid gap-3 border-t border-slate-200 py-4 dark:border-slate-800 ${compact ? '' : 'sm:grid-cols-[minmax(0,1.2fr)_minmax(10rem,0.8fr)_auto] sm:items-center'}`}>
      {/* ↑ Grid CSS: mobile=1 columna; desktop=3 cols (info | contactos | botón) */}
      {/* ↑ minmax(0,1.2fr) = info flexible; minmax(10rem,0.8fr) = contactos; auto = botón */}
      <div className="min-w-0">
        // ↑ min-w-0 permite truncar nombre/dirección largos
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{farmacia.nombre}</h3>
        <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">
          {farmacia.direccion ?? 'Dirección no informada'}
          // ↑ Fallback si dirección null
          {[farmacia.barrio, farmacia.comuna].filter(Boolean).length > 0 && (
            // ↑ Solo muestra barrio/comuna si al menos uno existe
            <span className="text-slate-500 dark:text-slate-400">
              {' '}· {[farmacia.barrio, farmacia.comuna].filter(Boolean).join(' · ')}
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        // ↑ Fila de contactos: tel + distancia + botón ruta (flex-wrap en mobile)
        {farmacia.telefono && telefono && (
          // ↑ Solo renderiza si hay teléfono Y se pudo limpiar
          <a
            aria-label={`Llamar a ${farmacia.nombre}: ${farmacia.telefono}`}
            // ↑ aria-label descriptivo para screen readers
            className="inline-flex min-h-11 items-center font-semibold text-sky-800 underline decoration-sky-300 underline-offset-4 hover:text-sky-950 focus:outline-none focus:ring-4 focus:ring-sky-500/10 dark:text-sky-300 dark:decoration-sky-700 dark:hover:text-sky-200 dark:focus:ring-sky-500/20"
            href={`tel:${telefono}`}
            // ↑ tel: abre app teléfono nativa en móvil
          >
            Llamar · {farmacia.telefono}
          </a>
        )}
        {farmacia.distanceKm !== null ? (
          <span className="text-slate-600 dark:text-slate-400">{formatDistance(farmacia.distanceKm)}</span>
          // ↑ Distancia calculada (Haversine) formateada
        ) : (
          <span className="text-slate-500 dark:text-slate-400">Sin ubicación para calcular distancia</span>
          // ↑ Mensaje cuando usuario no dio permiso de geolocalización
        )}
        {compact && (
          // ↑ En modo compact: botón "Abrir ruta" inline (ahorra espacio)
          <a
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-slate-900/15 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-sky-200 dark:focus:ring-sky-500/20"
            href={ruta}
            rel="noreferrer"
            // ↑ rel="noreferrer": no envía Referer header al abrir en nueva pestaña (seguridad)
            target="_blank"
            // ↑ target="_blank": abre en pestaña nueva
          >
            Abrir ruta
          </a>
        )}
      </div>

      {!compact && (
        // ↑ En modo normal: botón "Abrir ruta" en su propia columna (grid auto)
        <a
          className="inline-flex min-h-11 items-center justify-center self-start rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-slate-900/15 sm:self-center dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-sky-200 dark:focus:ring-sky-500/20"
          href={ruta}
          rel="noreferrer"
          target="_blank"
        >
          Abrir ruta
        </a>
      )}
    </li>
  )
}

type FarmaciasCercanasProps = {
  farmacias: FarmaciaConDistancia[]
  // ↑ Lista ya filtrada + con distanceKm calculado
  total: number
  // ↑ Total SIN filtrar (para mostrar "X de Y")
  hayUbicacion: boolean
  // ↑ true si usuario autorizó geolocalización
  filtro: string
  // ↑ Texto actual del input filtro
  onFiltroChange: (valor: string) => void
  // ↑ Callback: padre actualiza su estado filtro
  compact?: boolean
  // ↑ Opcional: true = modo aside (2 iniciales), false = modo full (8 iniciales)
  locationStatus?: ReactNode
  // ↑ Opcional: LocationStatus inline (solo en modo compact/aside)
}

export function FarmaciasCercanas({
  farmacias,
  total,
  hayUbicacion,
  filtro,
  onFiltroChange,
  compact = false,
  locationStatus,
}: FarmaciasCercanasProps) {
  const [todas, setTodas] = useState(false)
  // ↑ Estado: true = muestra todas, false = muestra solo las primeras N
  const limiteVisible = compact ? VISIBLES_COMPACTAS : VISIBLES_INICIALES
  // ↑ Derivado: 2 en compact, 8 en normal
  const visibles = todas ? farmacias : farmacias.slice(0, limiteVisible)
  // ↑ Derivado: array a renderizar (todas o slice)

  return (
    <section aria-labelledby="farmacias-title" className={compact ? '' : 'pt-7'}>
      {/* ↑ pt-7 solo en modo normal (separación del contenido anterior) */}
      <div className={`flex flex-col gap-4 ${compact ? '' : 'sm:flex-row sm:items-end sm:justify-between'}`}>
        {/* ↑ Mobile: columna; Desktop: fila con justify-between */}
        <div>
          <h2 className={`${compact ? 'text-xl' : 'text-2xl'} font-bold tracking-tight text-slate-950 dark:text-slate-100`} id="farmacias-title">
            Farmacias registradas en CABA
            {/* ↑ Copy exacto del canvas nodo 02 (desktop) */}
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-300">
            El registro es independiente de la búsqueda; no informa precio ni stock. Llamá para consultar antes de ir.
            {/* ↑ Aclaración clave: directorio INDEPENDIENTE de la búsqueda de medicamentos */}
          </p>
          {locationStatus}
          {/* ↑ LocationStatus inline (solo en modo compact/aside) */}
        </div>
        <div className={`flex flex-col gap-2 ${compact ? '' : 'sm:w-64 sm:shrink-0'}`}>
          {/* ↑ Input filtro: en desktop ancho fijo 16rem (w-64), no se encoje (shrink-0) */}
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-300" htmlFor="farmacia-filtro">
            Filtrar farmacias
          </label>
          <input
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-sky-400 dark:focus:ring-sky-500/20"
            id="farmacia-filtro"
            onChange={(event) => onFiltroChange(event.target.value)}
            placeholder="Barrio, comuna o nombre"
            type="search"
            value={filtro}
          />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {farmacias.length.toLocaleString('es-AR')} de {total.toLocaleString('es-AR')}
            {/* ↑ Contador: filtradas / total (formato AR con separador de miles) */}
          </p>
        </div>
      </div>

      {farmacias.length === 0 ? (
        // ↑ Estado vacío tras filtrar: ninguna coincide
        <p className="mt-4 border-y border-slate-200 py-5 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
          Ninguna farmacia del registro coincide con ese filtro.
        </p>
      ) : (
        <>
          <ul className="mt-4">
            {visibles.map((farmacia) => (
              <FarmaciaItem compact={compact} farmacia={farmacia} key={farmacia.id} />
              // ↑ key=id (estable, único por farmacia)
            ))}
          </ul>
          {farmacias.length > limiteVisible && (
            // ↑ Botón "Ver más/menos" solo si hay farmacias ocultas
            <button
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm font-semibold text-sky-800 transition hover:text-sky-950 focus:outline-none focus:ring-4 focus:ring-sky-500/10 dark:text-sky-300 dark:hover:text-sky-200 dark:focus:ring-sky-500/20"
              onClick={() => setTodas((value) => !value)}
              type="button"
            >
              {todas ? 'Ver menos' : `Ver las ${farmacias.length.toLocaleString('es-AR')} farmacias`}
              // ↑ Texto dinámico con total formateado
              <svg aria-hidden="true" className={`size-4 transition-transform ${todas ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                // ↑ Flecha abajo/arriba rotada según estado
              </svg>
            </button>
          )}
        </>
      )}

      {!hayUbicacion && (
        // ↑ Mensaje solo si NO hay ubicación activa (orden alfabético)
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Sin ubicación activada, la lista está en orden alfabético.
        </p>
      )}
    </section>
  )
}
