import rawSchedule from './schedule.json'

export interface Accommodation {
  name: string
  address: string
  lat?: number
  lng?: number
}

export interface ScheduleEntry {
  day: number
  date: string
  weekday: string
  departure: string
  city: string
  country: string
  transport: string
  bookingPlatform: string | null
  accommodation: Accommodation | null
  activities: string
}

export interface DaySchedule extends ScheduleEntry {
  lat: number
  lng: number
  zoom: number
  image: string
}

// City coordinates for the map
export const cityCoords: Record<string, { lat: number; lng: number; zoom: number }> = {
  '인천': { lat: 37.4563, lng: 126.7052, zoom: 12 },
  '고베': { lat: 34.6901, lng: 135.1956, zoom: 13 },
}

// Accommodation coordinates (confirmed bookings only)
const accomCoords: Record<string, { lat: number; lng: number }> = {
  '고베 오리엔탈 호텔': { lat: 34.6873, lng: 135.1930 },
}

// Unsplash city photos
const cityImages: Record<string, string> = {
  '인천': 'https://images.unsplash.com/photo-1583400225507-859fc2b89e5e?w=800&q=80',
  '고베': 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=800&q=80',
}

const defaultCoord = { lat: 34.6901, lng: 135.1956, zoom: 10 }

export const schedule: DaySchedule[] = (rawSchedule as ScheduleEntry[]).map(entry => {
  const coords = cityCoords[entry.city] ?? defaultCoord
  const image = cityImages[entry.city] ?? cityImages['고베']
  // Attach accommodation coordinates if available
  const accom = entry.accommodation
  if (accom && accomCoords[accom.name]) {
    accom.lat = accomCoords[accom.name].lat
    accom.lng = accomCoords[accom.name].lng
  }
  return { ...entry, ...coords, image }
})

// Unique cities for map markers
export const cityMarkers = Object.values(
  schedule.reduce<Record<string, { city: string; country: string; lat: number; lng: number }>>((acc, s) => {
    if (!acc[s.city]) {
      acc[s.city] = { city: s.city, country: s.country, lat: s.lat, lng: s.lng }
    }
    return acc
  }, {})
)

// Schedule excluding last day (return flight) for route display
const routeSchedule = schedule.filter(s => s.day < 4)

// Route path coordinates (ordered by day)
export const routePath: { lat: number; lng: number }[] = routeSchedule.map(s => ({ lat: s.lat, lng: s.lng }))

// Deduplicate route markers: show one marker per unique location with combined day labels
export function getRouteMarkers() {
  const markerMap = new Map<string, { lat: number; lng: number; days: number[] }>()
  for (const s of routeSchedule) {
    const key = `${s.lat.toFixed(4)},${s.lng.toFixed(4)}`
    const existing = markerMap.get(key)
    if (existing) {
      existing.days.push(s.day)
    } else {
      markerMap.set(key, { lat: s.lat, lng: s.lng, days: [s.day] })
    }
  }
  return Array.from(markerMap.values()).map(m => ({
    ...m,
    label: m.days.length === 1 ? `D${m.days[0]}` : `D${m.days[0]}-${m.days[m.days.length - 1]}`,
  }))
}
