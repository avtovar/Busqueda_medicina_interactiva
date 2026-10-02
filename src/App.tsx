import { useCallback, useEffect, useMemo, useState } from 'react'
import { AvisoFuente } from './components/AvisoFuente'
import { FarmaciasCercanas } from './components/FarmaciasCercanas'
import { LocationStatus } from './components/LocationStatus'
import { OrdenFiltros } from './components/OrdenFiltros'
import { ResultadosLista } from './components/ResultadosLista'
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
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null)
  const [farmacias, setFarmacias] = useState<Farmacia[]>([])
  const [metaFarmacias, setMetaFarmacias] = useState<FarmaciasMeta | null>(null)
  const [carga, setCarga] = useState<EstadoCarga>('cargando')
  const [errorCarga, setErrorCarga] = useState<string | null>(null)

  const [consulta, setConsulta] = useState('')
  const [filtroFarmacias, setFiltroFarmacias] = useState('')
  const [orden, setOrden] = useState<OrdenResultados>('precio-asc')

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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <p className="text-sm font-semibold text-slate-500" role="status">
          Cargando el catálogo de medicamentos…
        </p>
      </div>
    )
  }

  if (carga === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-2xl border border-rose-200 bg-white p-6 text-center">
          <h1 className="text-lg font-bold text-slate-900">No pudimos cargar los datos</h1>
          <p className="mt-2 text-sm text-slate-600">{errorCarga}</p>
          <p className="mt-3 text-xs text-slate-400">
            Para regenerarlos: <code>npm run datos</code>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <a className="flex items-center gap-3" href="/" aria-label="FarmaciaCerca, inicio">
            <span className="flex size-10 items-center justify-center rounded-xl bg-sky-600 text-white shadow-lg shadow-sky-600/20">
              <svg aria-hidden="true" className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
              </svg>
            </span>
            <span>
              <span className="block text-sm font-extrabold tracking-tight text-slate-900 dark:text-slate-100">FarmaciaCerca</span>
              <span className="block text-[11px] font-medium text-slate-400 dark:text-slate-500">
                Precio de referencia, de parte del Estado
              </span>
            </span>
          </a>

          <div className="flex items-center gap-3">
            <ThemeToggle temaOscuro={temaOscuro} onToggle={() => setTemaOscuro((v) => !v)} />
            <button
              aria-busy={estadoGeo === 'loading'}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-500/10 disabled:cursor-wait disabled:opacity-70 sm:px-4 sm:text-sm dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200 dark:hover:border-sky-400 dark:hover:bg-sky-950/40 dark:hover:text-sky-100 dark:focus:ring-sky-500/20"
              disabled={estadoGeo === 'loading'}
              onClick={pedirUbicacion}
              type="button"
            >
              <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Z" />
                <circle cx="12" cy="10" r="2.2" />
              </svg>
              <span className="hidden sm:inline">{etiquetaBoton}</span>
              <span className="sm:hidden">{ubicacion ? 'Actualizar' : 'Ubicación'}</span>
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-slate-200/70 bg-gradient-to-br from-white via-sky-50/60 to-sky-50 dark:border-slate-800/60 dark:from-slate-950 dark:via-sky-950/20 dark:to-slate-950">
          <div className="pointer-events-none absolute -right-24 -top-32 size-96 rounded-full bg-sky-200/30 blur-3xl dark:bg-sky-500/10" />
          <div className="pointer-events-none absolute -bottom-40 left-1/3 size-80 rounded-full bg-sky-200/20 blur-3xl dark:bg-sky-500/10" />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16 lg:px-8">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-white/70 px-3 py-1.5 text-xs font-bold text-sky-700 dark:border-sky-500/40 dark:bg-slate-900/70 dark:text-sky-200">
                <span className="size-1.5 rounded-full bg-sky-500" />
                Datos del Vademécum Nacional
              </span>
              <h1 className="mt-5 max-w-xl text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl dark:text-slate-100">
                El precio oficial, <span className="text-sky-600 dark:text-sky-300">sin vueltas.</span>
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
                Precios de referencia del Ministerio de Salud, comparados entre laboratorios de una
                misma presentación, y las farmacias registradas cerca de vos.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                <span className="rounded-full bg-white/80 px-3 py-1.5 shadow-sm">
                  {catalogo?.meta.totalProductos.toLocaleString('es-AR')} productos
                </span>
                <span className="rounded-full bg-white/80 px-3 py-1.5 shadow-sm">
                  {catalogo?.meta.totalGrupos} composiciones
                </span>
                <span className="rounded-full bg-white/80 px-3 py-1.5 shadow-sm">
                  {farmacias.length.toLocaleString('es-AR')} farmacias en CABA
                </span>
              </div>
            </div>
            <SearchBar
              minimaAlcanzada={minimaAlcanzada}
              onClear={limpiarBusqueda}
              onQueryChange={setConsulta}
              query={consulta}
              resultCount={resultados.length}
            />
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <LocationStatus
            message={mensajeGeo}
            onRetry={pedirUbicacion}
            status={estadoGeo}
          />

          <section className="pt-10" aria-labelledby="results-title">
            <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-sky-600 dark:text-sky-300">Resultados</p>
                <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl" id="results-title">
                  {minimaAlcanzada
                    ? `${resultados.length} ${resultados.length === 1 ? 'composición' : 'composiciones'} para “${consulta.trim()}”`
                    : 'Buscá un medicamento para ver precios'}
                </h2>
              </div>
              <OrdenFiltros onChange={setOrden} value={orden} />
            </div>

            <ResultadosLista
              consulta={consulta}
              minimaAlcanzada={minimaAlcanzada}
              onClear={limpiarBusqueda}
              resultados={resultados}
            />
          </section>

          <FarmaciasCercanas
            farmacias={farmaciasVisibles}
            filtro={filtroFarmacias}
            hayUbicacion={ubicacion !== null}
            onFiltroChange={setFiltroFarmacias}
            total={farmacias.length}
          />

          <AvisoFuente catalogo={catalogo?.meta ?? null} farmacias={metaFarmacias} />
        </div>
      </main>

      <footer className="mt-12 border-t border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-xs text-slate-400 sm:px-6 lg:px-8">
          <p>FarmaciaCerca · Versión alpha</p>
          <p>
            No es consejo médico. Los precios son de referencia y no garantizan disponibilidad ni
            precio final en ningún comercio.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
