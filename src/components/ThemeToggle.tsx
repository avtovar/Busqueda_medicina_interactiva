type ThemeToggleProps = {
  temaOscuro: boolean
  onToggle: () => void
}

export function ThemeToggle({ temaOscuro, onToggle }: ThemeToggleProps) {
  return (
    <button
      aria-label={temaOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200 dark:hover:border-sky-400 dark:hover:bg-sky-950/40 dark:hover:text-sky-100 dark:focus:ring-sky-500/20"
      onClick={onToggle}
      type="button"
    >
      {temaOscuro ? (
        <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2M12 19v2M5 12H3M21 12h-2M18.36 18.36l-1.42-1.42M5.64 5.64 4.22 4.22M18.36 5.64l-1.42 1.42M5.64 18.36l-1.42 1.42M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
        </svg>
      ) : (
        <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
        </svg>
      )}
      <span className="sr-only">{temaOscuro ? 'Modo claro' : 'Modo oscuro'}</span>
    </button>
  )
}
