import rawSchedule from './schedule.json'

export interface Accommodation {
  name: string
  address: string
  lat?: number
  lng?: number
}

export interface GolfCourse {
  name: string
  lat: number
  lng: number
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
  golfCourses: string[]
  activities: string
}

export interface DaySchedule extends ScheduleEntry {
  lat: number
  lng: number
  zoom: number
  image: string
  golfCourseData: GolfCourse[]
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

// Golf course coordinates
const golfCourseCoords: Record<string, { lat: number; lng: number }> = {
  '도죠 파인 밸리': { lat: 34.8995, lng: 135.0379 },
  '미키오카와': { lat: 34.8330, lng: 135.0375 },
  '아리마컨츄리': { lat: 34.9046, lng: 135.1734 },
  '웨스트윈즈': { lat: 34.9587, lng: 134.9981 },
}

// Golf course detail info
export interface GolfCourseDetail {
  nameEn: string
  holes: number
  par: number
  yards?: number
  address?: string
  tel?: string
  website?: string
  description: string
  features?: string[]
  established?: string
}

export const golfCourseDetails: Record<string, GolfCourseDetail> = {
  '미키오카와': {
    nameEn: 'Mikiyokawa Country Club',
    holes: 27,
    par: 108,
    yards: 9162,
    website: 'https://www.mikiyokawa-cc.jp/',
    description: '연못과 계곡이 있어 전략적이고 기술적인 플레이가 요구되며, 각 코스마다 넓은 페어웨이, 다양한 거리 등 다양한 특성을 가지고 있습니다.',
    features: ['동쪽·중·서 3코스 (27홀)', '넓은 페어웨이와 연못', '자연 지형을 살린 레이아웃'],
  },
  '아리마컨츄리': {
    nameEn: 'Arima Country Club',
    holes: 18,
    par: 72,
    address: '〒669-1334 兵庫県三田市中内神南山841',
    tel: '079-565-2111',
    website: 'http://www.arimacc.jp/',
    description: 'LPGA 공식대회 개최장소. 완만한 구릉지에 펼쳐지는 평탄한 페어웨이가 양쪽이 거목으로 둘러싸인 코스입니다.',
    features: ['LPGA 공식대회 개최', '천연온천 시설 완비', '캐디 선택 가능', '카트 5인승'],
    established: '1960',
  },
  '도죠 파인 밸리': {
    nameEn: 'Tojo Pine Valley Golf Club',
    holes: 18,
    par: 72,
    description: '고도차가 적은 부드러운 구릉지에 느긋하게 배치된 각 홀은 풍부한 수목으로 분리되어 있습니다. 페어웨이는 광대하고, 큰 그린과 함께 개방감 있는 속에서 플레이를 즐길 수 있습니다.',
    features: ['캐디/셀프 선택 가능', '영국풍 클럽하우스', '고베 번화가 45분 거리'],
  },
  '웨스트윈즈': {
    nameEn: "West One's Country Club",
    holes: 18,
    par: 72,
    description: '효고현 가토시에 위치한 독특한 골프 코스로, 세계적인 설계자 피트 다이와 페리 다이가 공동 설계한 아메리칸-스코티시 스타일의 링크스 코스입니다.',
    features: ['피트 다이 설계', '링크스 스타일', '섬 그린 11번홀 (Par 3)', '325m 폭포 18번홀 (Par 5)'],
  },
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
  const golfCourseData: GolfCourse[] = (entry.golfCourses ?? []).map(name => ({
    name,
    ...(golfCourseCoords[name] ?? { lat: 0, lng: 0 }),
  }))
  return { ...entry, ...coords, image, golfCourseData }
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
