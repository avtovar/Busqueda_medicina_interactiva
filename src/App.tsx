import { useCallback, useEffect, useMemo, useState } from 'react'
import { AvisoFuente } from './components/AvisoFuente'
import { FarmaciasCercanas } from './components/FarmaciasCercanas'
import { LocationStatus } from './components/LocationStatus'
import { OrdenFiltros } from './components/OrdenFiltros'
import { ResultadosLista, ResultadosRelacionadas } from './components/ResultadosLista'
import { SearchBar } from './components/SearchBar'
import { ThemeToggle } from './components/ThemeToggle'
import type {
  Catalogo,
  Coordenadas,
  EstadoCarga,
  Farmacia,
  FarmaciasMeta,
  GeolocationStatus,
  OrdenResultados,
} from './types/datos'
import {
  alcanzaElMinimo,
  buscarGrupos,
  cargarCatalogo,
  cargarFarmacias,
  construirIndice,
  filtrarFarmacias,
  ordenarGrupos,
} from './utils/busqueda'
import { calculateDistance } from './utils/distance'

function mensajeErrorGeolocalizacion(error: GeolocationPositionError): string {
  switch (error.code) {
    case 1:
      return 'El permiso de ubicación fue denegado. Podés habilitarlo desde los permisos del navegador.'
    case 2:
      return 'No se pudo determinar tu posición. Probá de nuevo en un lugar con mejor señal.'
    case 3:
      return 'La solicitud de ubicación tardó demasiado. Probá de nuevo.'
    default:
      return 'No se pudo obtener tu ubicación en este momento.'
  }
}

function App() {
  // Estado del catálogo y farmacias (datos cargados al inicio)
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null)
  const [farmacias, setFarmacias] = useState<Farmacia[]>([])
  const [metaFarmacias, setMetaFarmacias] = useState<FarmaciasMeta | null>(null)
  const [carga, setCarga] = useState<EstadoCarga>('cargando')
  const [errorCarga, setErrorCarga] = useState<string | null>(null)

  // Estado de la búsqueda
  const [consulta, setConsulta] = useState('')
  const [filtroFarmacias, setFiltroFarmacias] = useState('')
  const [orden, setOrden] = useState<OrdenResultados>('precio-asc')

  // Estado de geolocalización
  const [ubicacion, setUbicacion] = useState<Coordenadas | null>(null)
  const [estadoGeo, setEstadoGeo] = useState<GeolocationStatus>('idle')
  const [mensajeGeo, setMensajeGeo] = useState(
    'Activá tu ubicación para saber qué farmacia te queda más cerca.',
  )
  const [temaOscuro, setTemaOscuro] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const guardado = localStorage.getItem('farmaciacerca-tema')
    if (guardado === 'oscuro') return true
    if (guardado === 'claro') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const controlador = new AbortController()

    ;(async () => {
      try {
        const [datosCatalogo, datosFarmacias] = await Promise.all([
          cargarCatalogo(controlador.signal),
          cargarFarmacias(controlador.signal),
        ])
        setCatalogo(datosCatalogo)
        setFarmacias(datosFarmacias.farmacias)
        setMetaFarmacias(datosFarmacias.meta)
        setCarga('listo')
      } catch (error) {
        if (controlador.signal.aborted) return
        setErrorCarga(error instanceof Error ? error.message : 'Error desconocido')
        setCarga('error')
      }
    })()

    return () => controlador.abort()
  }, [])

  useEffect(() => {
    if (temaOscuro) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('farmaciacerca-tema', temaOscuro ? 'oscuro' : 'claro')
  }, [temaOscuro])

  const indice = useMemo(
    () => (catalogo ? construirIndice(catalogo.grupos) : null),
    [catalogo],
  )

  const minimaAlcanzada = alcanzaElMinimo(consulta)

  const resultados = useMemo(() => {
    if (!catalogo || !indice || !minimaAlcanzada) return []
    return ordenarGrupos(buscarGrupos(catalogo.grupos, consulta, indice), orden)
  }, [catalogo, indice, consulta, orden, minimaAlcanzada])

  const coincidenciasPrincipales = resultados.filter(
    (resultado) => resultado.coincidencia === 'principio-activo' || resultado.coincidencia === 'comercial',
  ).length
  const relacionadas = resultados.length - coincidenciasPrincipales

  const farmaciasVisibles = useMemo(() => {
    const filtradas = filtrarFarmacias(farmacias, filtroFarmacias)
    const conDistancia = filtradas.map((farmacia) => ({
      ...farmacia,
      distanceKm: ubicacion ? calculateDistance(ubicacion, farmacia) : null,
    }))
    if (!ubicacion) return conDistancia.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    return conDistancia.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
  }, [farmacias, filtroFarmacias, ubicacion])

  const pedirUbicacion = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setEstadoGeo('error')
      setMensajeGeo('Tu navegador no admite la geolocalización.')
      return
    }

    setEstadoGeo('loading')
    setMensajeGeo('Autorizá el permiso de ubicación en el navegador.')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUbicacion({ lat: position.coords.latitude, lng: position.coords.longitude })
        setEstadoGeo('success')
        setMensajeGeo('Listo: las farmacias están ordenadas por distancia.')
      },
      (error) => {
        setEstadoGeo('error')
        setMensajeGeo(mensajeErrorGeolocalizacion(error))
      },
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 },
    )
  }, [])

  const limpiarBusqueda = useCallback(() => setConsulta(''), [])

  const etiquetaBoton = estadoGeo === 'loading'
    ? 'Obteniendo…'
    : ubicacion
      ? 'Actualizar ubicación'
      : 'Usar mi ubicación'

  if (carga === 'cargando') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300" role="status">
          {/* ↑ role="status" → screen readers lo anuncian como estado vivo (polite) */}
          Cargando el catálogo de medicamentos…
        </p>
      </div>
    )
  }

  if (carga === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <div className="max-w-md rounded-2xl border border-rose-200 bg-white p-6 text-center dark:border-rose-900 dark:bg-slate-900">
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">No pudimos cargar los datos</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{errorCarga}</p>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Para regenerarlos: <code>npm run datos</code>
            {/* ↑ Indica al usuario cómo regenerar los JSON locales si están corruptos/desactualizados */}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* ↑ Contenedor principal: min-h-screen = al menos altura viewport, overflow-x-clip evita scroll horizontal */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {/* ↑ Header fijo visualmente (no sticky), con borde y fondo adaptado a tema */}
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          {/* ↑ Centrado (mx-auto), max-w-6xl = ancho máx contenido, responsive padding */}
          <a className="flex items-center gap-3" href="/" aria-label="FarmaciaCerca, inicio">
            {/* ↑ Enlace al home (recarga), aria-label para screen readers */}
            <span className="flex size-10 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm shadow-sky-900/15">
              {/* ↑ Badge circular brand color (sky-600) con sombra sutil */}
              <svg aria-hidden="true" className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                {/* ↑ Icono cruz (farmacia): aria-hidden oculta del árbol de accesibilidad */}
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
              </svg>
            </span>
            <span>
              <span className="block text-sm font-extrabold tracking-tight text-slate-950 dark:text-slate-100">FarmaciaCerca</span>
              <span className="mt-0.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Precio de referencia · Ministerio de Salud
                {/* ↑ Subtítulo descriptivo (copy del canvas nodo 02) */}
              </span>
            </span>
          </a>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle temaOscuro={temaOscuro} onToggle={() => setTemaOscuro((v) => !v)} />
            {/* ↑ Botón tema: recibe estado actual y callback que invierte (v => !v) */}
            <button
              aria-busy={estadoGeo === 'loading'}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 disabled:cursor-wait disabled:opacity-70 sm:px-4 sm:text-sm dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200 dark:hover:border-sky-400 dark:hover:bg-sky-950/40 dark:hover:text-sky-100 dark:focus-visible:outline-sky-300"
              disabled={estadoGeo === 'loading'}
              onClick={pedirUbicacion}
              type="button"
            >
              <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Z" />
                <circle cx="12" cy="10" r="2.2" />
              </svg>
              {/* ↑ Icono pin de ubicación (círculo + punto central) */}
              <span className="hidden sm:inline">{etiquetaBoton}</span>
              {/* ↑ Texto completo en desktop (≥640px) */}
              <span className="sm:hidden">{ubicacion ? 'Actualizar' : 'Ubicación'}</span>
              {/* ↑ Texto abreviado en mobile (<640px) */}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6 sm:pt-10 lg:px-8">
        {/* ↑ Main con padding responsive, max-w-6xl centrado */}
        <section aria-labelledby="search-title">
          {/* ↑ Sección de búsqueda: aria-labelledby apunta al h1 id="search-title" */}
          <div className="max-w-4xl">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-4xl dark:text-slate-100" id="search-title">
              Buscá por principio activo o nombre comercial
            </h1>
            <p className="mt-2 text-base leading-6 text-slate-600 dark:text-slate-300">
              Compará precios de referencia entre laboratorios para una misma presentación.
            </p>
          </div>

          <SearchBar
            minimaAlcanzada={minimaAlcanzada}
            onClear={limpiarBusqueda}
            onQueryChange={setConsulta}
            query={consulta}
          />
          {/* ↑ SearchBar controlado: value=consulta, onChange=setConsulta, onClear=limpiarBusqueda */}

          <p className="mt-3 border-b border-slate-200 pb-5 text-sm leading-5 text-slate-600 dark:border-slate-800 dark:text-slate-300">
            <strong className="font-semibold text-slate-800 dark:text-slate-200">Catálogo parcial</strong>
            {' · '}{catalogo?.meta.totalProductos.toLocaleString('es-AR')} productos
            {/* ↑ Encadenamiento opcional (?.) por si catalogo aún null (aunque carga='listo' garantiza que existe) */}
          </p>
        </section>

        {minimaAlcanzada && (
          <section aria-labelledby="results-title" className="mt-8">
            <div className="mb-4 flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between dark:border-slate-800">
              {/* ↑ Header de resultados: en mobile columna, en desktop fila con justify-between */}
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-100" id="results-title">
                  {resultados.length > 0 ? 'Precios de referencia' : `Sin resultados para “${consulta.trim()}”`}
                </h2>
                {/* ↑ Título dinámico: "Precios de referencia" si hay resultados, sino mensaje "Sin resultados para X" */}
                {resultados.length > 0 && (
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {resultados.length} {resultados.length === 1 ? 'composición' : 'composiciones'} para “{consulta.trim()}”
                    <span className="mx-1.5 text-slate-400">·</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {coincidenciasPrincipales} {coincidenciasPrincipales === 1 ? 'coincidencia principal' : 'coincidencias principales'}
                    </span>
                    <span className="mx-1.5 text-slate-400">·</span>
                    {relacionadas} {relacionadas === 1 ? 'relacionada' : 'relacionadas'}
                    {/* ↑ Resumen: total composiciones · coincidencias principales · relacionadas */}
                  </p>
                )}
              </div>
              {resultados.length > 0 && <OrdenFiltros onChange={setOrden} value={orden} />}
              {/* ↑ Select de orden solo si hay resultados (no mostrar en estado vacío) */}
            </div>

            <div className={`grid items-start gap-x-9 gap-y-7 ${coincidenciasPrincipales > 0 ? 'lg:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.85fr)]' : ''}`}>
              {/* ↑ Grid CSS: en desktop con coincidencias principales → 2 columnas (resultados | directorio) */}
              {/* ↑ minmax(0,1.55fr) = columna flexible principal, minmax(18rem,0.85fr) = aside mínimo 18rem */}
              {/* ↑ En mobile o sin coincidencias principales → 1 columna (stack vertical) */}
              <div className="min-w-0">
                {/* ↑ min-w-0 permite que el grid item se encoja (evita overflow en flex/grid) */}
                <ResultadosLista
                  consulta={consulta}
                  minimaAlcanzada={minimaAlcanzada}
                  onClear={limpiarBusqueda}
                  resultados={resultados}
                />
              </div>
              {coincidenciasPrincipales > 0 && (
                <aside aria-label="Directorio independiente de farmacias" className="min-w-0 border-t border-slate-200 pt-6 dark:border-slate-800 lg:border-t-0 lg:pt-0">
                  <FarmaciasCercanas
                    compact
                    locationStatus={estadoGeo !== 'idle' ? (
                      <LocationStatus
                        message={mensajeGeo}
                        onRetry={pedirUbicacion}
                        status={estadoGeo}
                      />
                    ) : undefined}
                    farmacias={farmaciasVisibles}
                    filtro={filtroFarmacias}
                    hayUbicacion={ubicacion !== null}
                    onFiltroChange={setFiltroFarmacias}
                    total={farmacias.length}
                  />
                </aside>
              )}
            </div>

            {coincidenciasPrincipales === 0 && (
              <section aria-label="Directorio de farmacias" className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800">
                <LocationStatus
                  message={mensajeGeo}
                  onRetry={pedirUbicacion}
                  status={estadoGeo}
                />
                <FarmaciasCercanas
                  farmacias={farmaciasVisibles}
                  filtro={filtroFarmacias}
                  hayUbicacion={ubicacion !== null}
                  onFiltroChange={setFiltroFarmacias}
                  total={farmacias.length}
                />
              </section>
            )}

            <ResultadosRelacionadas consulta={consulta} resultados={resultados} />
            {/* ↑ Siempre al final: coincidencias relacionadas (asociaciones + relacionados) */}
          </section>
        )}

        {!minimaAlcanzada && (
          <section aria-label="Directorio de farmacias" className="mt-8 pt-0">
            <LocationStatus
              message={mensajeGeo}
              onRetry={pedirUbicacion}
              status={estadoGeo}
            />
            <FarmaciasCercanas
              farmacias={farmaciasVisibles}
              filtro={filtroFarmacias}
              hayUbicacion={ubicacion !== null}
              onFiltroChange={setFiltroFarmacias}
              total={farmacias.length}
            />
          </section>
        )}

        <AvisoFuente catalogo={catalogo?.meta ?? null} farmacias={metaFarmacias} />
        {/* ↑ Fuentes, vigencia, aviso legal y limitaciones (al final de main) */}
      </main>

      <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {/* ↑ Footer con borde superior, fondo adaptado a tema */}
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 dark:text-slate-400">
          {/* ↑ En mobile: columna. En desktop: fila con space-between */}
          <p>FarmaciaCerca · Versión alpha</p>
          <p>No es consejo médico. Confirmá precio y disponibilidad con la farmacia.</p>
          {/* ↑ Disclaimer legal obligatorio en apps de salud */}
        </div>
      </footer>
    </div>
  )
}

export default App
