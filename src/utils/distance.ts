import type { Coordenadas } from '../types/datos'

const EARTH_RADIUS_KM = 6371
// ↑ Radio medio de la Tierra en kilómetros (para fórmula Haversine)

const degreesToRadians = (degrees: number) => (degrees * Math.PI) / 180
// ↑ Conversión grados → radianes (Math.PI rad = 180°)

export function calculateDistance(
  origin: Coordenadas,
  destination: Coordenadas,
): number {
  // ↑ Fórmula Haversine: distancia en línea recta entre dos puntos lat/lng
  const latitudeDelta = degreesToRadians(destination.lat - origin.lat)
  const longitudeDelta = degreesToRadians(destination.lng - origin.lng)
  const originLatitude = degreesToRadians(origin.lat)
  const destinationLatitude = degreesToRadians(destination.lat)

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(originLatitude) *
      Math.cos(destinationLatitude) *
      Math.sin(longitudeDelta / 2) ** 2

  const clampedHaversine = Math.min(1, Math.max(0, haversine))
  // ↑ Clampeo numérico para evitar errores de redondeo > 1 o < 0
  const angularDistance = 2 * Math.atan2(
    Math.sqrt(clampedHaversine),
    Math.sqrt(1 - clampedHaversine),
  )

  return EARTH_RADIUS_KM * angularDistance
  // ↑ Distancia final en km
}

export function formatDistance(distanceKm: number | null): string {
  if (distanceKm === null) {
    return 'Activa tu ubicación para ver la distancia'
    // ↑ Sin ubicación del usuario → mensaje invitando a activar
  }

  if (distanceKm < 1) {
    return `A ${Math.round(distanceKm * 1000)} m de ti`
    // ↑ < 1 km → muestra en metros (redondeado)
  }

  return `A ${distanceKm.toFixed(1).replace('.', ',')} km de ti`
  // ↑ ≥ 1 km → muestra en km con 1 decimal (coma argentina)
}
