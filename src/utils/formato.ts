const formatoPesos = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

const formatoPesosExactos = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatearPrecio(valor: number): string {
  return Number.isInteger(valor) ? formatoPesos.format(valor) : formatoPesosExactos.format(valor)
}

/**
 * El rango solo se muestra cuando hay varios laboratorios en la misma
 * presentacion. Con un solo laboratorio el rango seria ruido.
 */
export function formatearRango(min: number, max: number, cantidad: number): string {
  if (cantidad < 2 || min === max) return formatearPrecio(min)
  return `${formatearPrecio(min)} - ${formatearPrecio(max)}`
}

export function formatearDispersion(dispersion: number | null): string | null {
  if (dispersion === null) return null
  if (dispersion < 1.15) return 'precios iguales'
  const factor = dispersion.toFixed(1).replace('.', ',')
  return `hasta ${factor} x de diferencia`
}

export function formatearFecha(iso: string): string {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return iso
  return fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
}
