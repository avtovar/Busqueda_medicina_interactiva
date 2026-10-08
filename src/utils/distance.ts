import type { Coordenadas } from '../types/datos'

const EARTH_RADIUS_KM = 6371

const degreesToRadians = (degrees: number) => (degrees * Math.PI) / 180

export function calculateDistance(
  origin: Coordenadas,
  destination: Coordenadas,
): number {
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
  const angularDistance = 2 * Math.atan2(
    Math.sqrt(clampedHaversine),
    Math.sqrt(1 - clampedHaversine),
  )

  return EARTH_RADIUS_KM * angularDistance
}

export function formatDistance(distanceKm: number | null): string {
  if (distanceKm === null) {
    return 'Activa tu ubicación para ver la distancia'
  }

  if (distanceKm < 1) {
    return `A ${Math.round(distanceKm * 1000)} m de ti`
  }

  return `A ${distanceKm.toFixed(1).replace('.', ',')} km de ti`
}
