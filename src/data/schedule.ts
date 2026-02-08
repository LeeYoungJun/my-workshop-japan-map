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
  '프라하': { lat: 50.0755, lng: 14.4378, zoom: 14 },
  '체스키크룸로프': { lat: 48.8127, lng: 14.3175, zoom: 15 },
  '잘츠부르크': { lat: 47.8095, lng: 13.0550, zoom: 14 },
  '인스부르크': { lat: 47.2692, lng: 11.4041, zoom: 14 },
  '할슈타트/볼프강': { lat: 47.5622, lng: 13.6493, zoom: 13 },
  '비엔나': { lat: 48.2082, lng: 16.3738, zoom: 13 },
}

// Accommodation coordinates (confirmed bookings only)
const accomCoords: Record<string, { lat: number; lng: number }> = {
  '에어비앤비 숙소': { lat: 50.0848, lng: 14.4280 },
  '캐슬뷰아파트먼트': { lat: 48.8122, lng: 14.3168 },
  '레오나르도 호텔 빈 하우프트반호프': { lat: 48.1860, lng: 16.3780 },
  '아디나 아파트먼트 호텔 비엔나 벨베데레': { lat: 48.1830, lng: 16.3820 },
}

// Unsplash city photos
const cityImages: Record<string, string> = {
  '인천': 'https://images.unsplash.com/photo-1583400225507-859fc2b89e5e?w=800&q=80',
  '프라하': 'https://images.unsplash.com/photo-1592906209472-a36b1f3782ef?w=800&q=80',
  '체스키크룸로프': 'https://images.unsplash.com/photo-1560452992-e0f8d2b11029?w=800&q=80',
  '잘츠부르크': 'https://images.unsplash.com/photo-1609866138210-84bb689f3c61?w=800&q=80',
  '인스부르크': 'https://images.unsplash.com/photo-1573599852326-2d4da0bbe613?w=800&q=80',
  '할슈타트/볼프강': 'https://images.unsplash.com/photo-1617103996702-96ff29b1c467?w=800&q=80',
  '비엔나': 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=800&q=80',
}

const defaultCoord = { lat: 48.5, lng: 15.0, zoom: 6 }

export const schedule: DaySchedule[] = (rawSchedule as ScheduleEntry[]).map(entry => {
  const coords = cityCoords[entry.city] ?? defaultCoord
  const image = cityImages[entry.city] ?? cityImages['프라하']
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

// Schedule excluding Day 14 (return flight) for route display
const routeSchedule = schedule.filter(s => s.day < 14)

// Grossglockner High Alpine Road waypoints (Day 8 Innsbruck → Day 9 Hallstatt)
export const grossglocknerWaypoints = [
  { lat: 47.489, lng: 12.063 },  // Wörgl junction
  { lat: 47.323, lng: 12.797 },  // Zell am See
  { lat: 47.228, lng: 12.828 },  // Bruck/Fusch north entrance
  { lat: 47.120, lng: 12.840 },  // Fuscher Törl
  { lat: 47.074, lng: 12.751 },  // Kaiser-Franz-Josefs-Höhe
  { lat: 47.228, lng: 12.828 },  // Back to Fusch
  { lat: 47.323, lng: 12.797 },  // Zell am See
]

// Route path coordinates (ordered by day, Day 14 excluded, Grossglockner waypoints inserted)
export const routePath: { lat: number; lng: number }[] = []
for (const s of routeSchedule) {
  routePath.push({ lat: s.lat, lng: s.lng })
  // Insert Grossglockner waypoints after Day 8 (Innsbruck) before Day 9 (Hallstatt)
  if (s.day === 8) {
    routePath.push(...grossglocknerWaypoints)
  }
}

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
