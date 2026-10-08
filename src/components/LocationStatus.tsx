import type { GeolocationStatus } from '../types/datos'

type LocationStatusProps = {
  status: GeolocationStatus
  message: string
  onRetry: () => void
}

const statusStyles: Record<GeolocationStatus, string> = {
  idle: 'border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300',
  loading: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100',
  error: 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100',
}

const statusLabels: Record<GeolocationStatus, string> = {
  idle: 'Ubicación desactivada',
  loading: 'Obteniendo ubicación',
  success: 'Ubicación activada',
  error: 'No pudimos obtener tu ubicación',
}

export function LocationStatus({ status, message, onRetry }: LocationStatusProps) {
  const isError = status === 'error'

  return (
    <div
      aria-live={isError ? 'assertive' : 'polite'}
      className={`mb-5 flex flex-col gap-3 rounded-xl border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between ${statusStyles[status]}`}
      role={isError ? 'alert' : 'status'}
    >
      <div className="flex items-start gap-3">
        <svg aria-hidden="true" className="mt-0.5 size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Z" />
          <circle cx="12" cy="10" r="2.2" />
          {/* ↑ Icono pin ubicación (círculo + punto) - decorativo */}
        </svg>
        <div>
          <p className="font-semibold">{statusLabels[status]}</p>
          {/* ↑ Título del estado (ej. "Ubicación activada") */}
          <p className="mt-0.5 leading-5 opacity-90">{message}</p>
          {/* ↑ Mensaje detallado (opacidad 90% para jerarquía visual) */}
        </div>
      </div>
      {isError && (
        <button
          className="min-h-11 shrink-0 self-start rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm font-semibold text-rose-800 transition hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700 dark:border-rose-800 dark:bg-slate-950/40 dark:text-rose-200 dark:hover:bg-rose-950/60 dark:focus-visible:outline-rose-300"
          onClick={onRetry}
          type="button"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}
