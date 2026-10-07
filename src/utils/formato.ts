const formatoPesos = new Intl.NumberFormat('es-AR', {
  // ↑ Formateador de moneda ARS (pesos argentinos) para locale es-AR
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
  // ↑ Sin decimales para precios enteros (ej. $1.200)
})

const formatoPesosExactos = new Intl.NumberFormat('es-AR', {
  // ↑ Formateador para precios con decimales (ej. $1.234,56)
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  // ↑ Fuerza 2 decimales siempre
})

export function formatearPrecio(valor: number): string {
  // ↑ Elige formateador según si el valor es entero o tiene decimales
  return Number.isInteger(valor) ? formatoPesos.format(valor) : formatoPesosExactos.format(valor)
}

/**
 * El rango solo se muestra cuando hay varios laboratorios en la misma
 * presentacion. Con un solo laboratorio el rango seria ruido.
 */
export function formatearRango(min: number, max: number, cantidad: number): string {
  if (cantidad < 2 || min === max) return formatearPrecio(min)
  // ↑ Si 1 solo lab O min=max → muestra solo el precio (no rango)
  return `${formatearPrecio(min)} - ${formatearPrecio(max)}`
  // ↑ Rango: "$100 - $150" (mismo formato que formatearPrecio)
}

export function formatearDispersion(dispersion: number | null): string | null {
  if (dispersion === null) return null
  // ↑ null = 1 solo laboratorio (sin dispersión)
  if (dispersion < 1.15) return 'precios iguales'
  // ↑ Umbral: < 15% de diferencia → "precios iguales" (evita ruido por centavos)
  const factor = dispersion.toFixed(1).replace('.', ',')
  // ↑ 1 decimal con coma decimal argentina (ej. "2,5")
  return `hasta ${factor} x de diferencia`
  // ↑ Texto legible: "hasta 2,5 x de diferencia"
}

export function formatearFecha(iso: string): string {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return iso
  // ↑ Fallback: si ISO inválido, devuelve string original
  return fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
  // ↑ Formato argentino: "15 de enero de 2026"
}
