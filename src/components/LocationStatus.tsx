import type { GeolocationStatus } from '../types/datos'

type LocationStatusProps = {
  status: GeolocationStatus
  message: string
  onRetry: () => void
}

const statusStyles: Record<GeolocationStatus, string> = {
  idle: 'border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300',
  loading: 'border-blue-200 bg-blue-50 text-blue-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  error: 'border-rose-200 bg-rose-50 text-rose-700',
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
      className={`flex flex-col gap-3 rounded-2xl border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between ${statusStyles[status]}`}
      role={isError ? 'alert' : 'status'}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-white/70">
          <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Z" />
            <circle cx="12" cy="10" r="2.2" />
          </svg>
        </span>
        <div>
          <p className="font-semibold">{statusLabels[status]}</p>
          <p className="mt-0.5 leading-5 opacity-80">{message}</p>
        </div>
      </div>
      {isError && (
        <button
          className="shrink-0 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 focus:outline-none focus:ring-4 focus:ring-rose-200 dark:border-rose-800 dark:bg-slate-950/40 dark:text-rose-300 dark:hover:bg-rose-950/60 dark:focus:ring-rose-500/20"
          onClick={onRetry}
          type="button"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}
