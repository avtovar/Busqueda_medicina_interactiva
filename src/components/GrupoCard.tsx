import { useState } from 'react'
// ↑ Hook para estado local: expandir/colapsar lista de presentaciones
import type { Coincidencia, ResultadoGrupo } from '../types/datos'
import { formatearPrecio } from '../utils/formato'
import { PresentacionFila } from './PresentacionFila'

const ETIQUETAS: Record<Coincidencia, { texto: string; clase: string }> = {
  // ↑ Mapa de badges según tipo de coincidencia: texto visible + clases Tailwind
  'principio-activo': {
    texto: 'Principio activo',
    clase: 'text-xs font-semibold text-sky-800 dark:text-sky-300',
    // ↑ Azul cielo: color principal de la app (brand)
  },
  comercial: {
    texto: 'Nombre comercial',
    clase: 'text-xs font-semibold text-indigo-800 dark:text-indigo-300',
    // ↑ Índigo: distingue coincidencia por marca vs principio activo
  },
  asociacion: {
    texto: 'Asociación',
    clase: 'text-xs font-semibold text-amber-800 dark:text-amber-300',
    // ↑ Ámbar: advierte que contiene MÁS de lo buscado
  },
  relacionado: {
    texto: 'Relacionado',
    clase: 'text-xs font-semibold text-slate-600 dark:text-slate-300',
    // ↑ Gris neutro: coincidencia parcial débil (≥4 letras)
  },
}

const PRESENTACIONES_INICIALES = 4
// ↑ Cantidad de presentaciones visibles antes de "Ver más"

const EXPLICACION_ASOCIACION =
  'Contiene más de un principio activo; no es el mismo producto que {consulta} solo.'
// ↑ Template con placeholder {consulta} que se interpola en runtime

const EXPLICACION_RELACIONADO = 'Resultado relacionado, separado de la coincidencia principal.'
// ↑ Texto fijo para tipo 'relacionado' (coincidencia parcial)

type GrupoCardProps = {
  grupo: ResultadoGrupo
  // ↑ Grupo completo con presentaciones, precioDesde, coincidencia, marcasQueCoinciden, etc.
  consulta: string
  // ↑ Término buscado (se usa para interpolar en EXPLICACION_ASOCIACION)
}

export function GrupoCard({ grupo, consulta }: GrupoCardProps) {
  const [todas, setTodas] = useState(false)
  // ↑ Estado booleano: false = muestra primeras 4, true = muestra todas
  const visibles = todas ? grupo.presentaciones : grupo.presentaciones.slice(0, PRESENTACIONES_INICIALES)
  // ↑ Derivado: si todas=true → array completo, sino → slice(0, 4)
  const restantes = grupo.presentaciones.length - PRESENTACIONES_INICIALES
  // ↑ Cuántas presentaciones quedan ocultas (para mostrar en botón)
  const etiqueta = ETIQUETAS[grupo.coincidencia]
  // ↑ Lookup O(1) del badge según tipo de coincidencia
  const busqueda = consulta.trim()
  // ↑ Consulta sin espacios extremos (para interpolación)

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 sm:p-5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-slate-950/30">
      {/* ↑ Tarjeta semántica article: composición autocontenida */}
      {/* ↑ p-4 mobile, sm:p-5 desktop; bordes/sombras adaptados a tema */}
      <div className="flex items-start justify-between gap-4">
        {/* ↑ Header: info principal a la izquierda, precio a la derecha */}
        <div className="min-w-0">
          {/* ↑ min-w-0 permite que el texto se trunque (break-words) en flex */}
          <span className={etiqueta.clase}>{etiqueta.texto}</span>
          {/* ↑ Badge tipo coincidencia (coloreado según ETIQUETAS) */}
          <h4 className="mt-1.5 break-words text-lg font-bold tracking-tight text-slate-950 dark:text-slate-100">
            {grupo.etiqueta}
          </h4>
          {/* ↑ Nombre de la composición (ej. "ibuprofeno", "ibuprofeno + cafeína") */}
          <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-400">
            {grupo.totalProductos.toLocaleString('es-AR')} productos en {grupo.presentaciones.length.toLocaleString('es-AR')} presentaciones
            {/* ↑ Stats: total productos (ofertas) y presentaciones distintas (formato AR) */}
            {grupo.marcasQueCoinciden.length > 0 && (
              <> · incluye {grupo.marcasQueCoinciden.slice(0, 2).join(', ')}</>
            )}
            {/* ↑ Si coincidió por nombre comercial, muestra hasta 2 marcas que matchearon */}
          </p>
        </div>
        <div className="shrink-0 text-right">
          {/* ↑ shrink-0: precio nunca se encoje; text-right: alineado a la derecha */}
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Desde · referencia</p>
          {/* ↑ Label: "Desde · referencia" (precio mínimo de referencia) */}
          <p className="mt-0.5 text-xl font-extrabold tracking-tight text-sky-800 dark:text-sky-300">
            {formatearPrecio(grupo.precioDesde)}
          </p>
          {/* ↑ Precio mínimo de referencia formateado en ARS (color brand sky) */}
          <p className="mt-1 max-w-40 text-xs leading-4 text-slate-500 dark:text-slate-400">
            Mínimo entre distintas presentaciones
          </p>
          {/* ↑ Aclaración: el mínimo puede venir de presentaciones distintas */}
        </div>
      </div>

      {grupo.esAsociacion ? (
        // ↑ Si es asociación (contiene lo buscado + más principios activos)
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm leading-5 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
          // ↑ Fondo ámbar suave, texto ámbar oscuro (advertencia suave)
          {busqueda === ''
            ? `Contiene más de un principio activo: ${grupo.ingredientes.join(' + ')}.`
            : EXPLICACION_ASOCIACION.replace('{consulta}', busqueda)}
          // ↑ Si no hay búsqueda (raro), lista ingredientes; sino interpola término
        </p>
      ) : (
        grupo.coincidencia === 'relacionado' && (
          // ↑ Solo para tipo 'relacionado' (no para principio-activo/comercial/asociacion)
          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm leading-5 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
            {EXPLICACION_RELACIONADO}
          </p>
        )
      )}

      <ul className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
        // ↑ Lista de presentaciones con divisores (divide-y)
        {visibles.map((presentacion) => (
          <PresentacionFila key={presentacion.clave} presentacion={presentacion} />
          // ↑ Cada presentación renderiza su fila expandible
        ))}
      </ul>

      {restantes > 0 && (
        // ↑ Botón "Ver más/menos" solo si hay presentaciones ocultas
        <button
          className="mt-2 inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-50 hover:text-sky-950 focus:outline-none focus:ring-4 focus:ring-sky-500/10 dark:text-sky-300 dark:hover:bg-sky-950/40 dark:hover:text-sky-100 dark:focus:ring-sky-500/20"
          onClick={() => setTodas((value) => !value)}
          // ↑ Toggle: setTodas(prev => !prev) invierte el booleano
          type="button"
        >
          {todas ? 'Ver menos' : `Ver las ${grupo.presentaciones.length.toLocaleString('es-AR')} presentaciones`}
          {/* ↑ Texto dinámico: "Ver menos" si expandido, sino "Ver las N presentaciones" */}
        </button>
      )}
    </article>
  )
}
