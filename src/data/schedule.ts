export interface DaySchedule {
  day: number
  date: string
  weekday: string
  title: string
  city: string
  country: string
  lat: number
  lng: number
  zoom: number
  image: string
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// Unsplash city photos
const cityImages: Record<string, string> = {
  '프라하': 'https://images.unsplash.com/photo-1592906209472-a36b1f3782ef?w=800&q=80',
  '쿠트나호라': 'https://images.unsplash.com/photo-1600623471616-8c1966c91ff6?w=800&q=80',
  '체스키크룸로프': 'https://images.unsplash.com/photo-1560452992-e0f8d2b11029?w=800&q=80',
  '할슈타트': 'https://images.unsplash.com/photo-1617103996702-96ff29b1c467?w=800&q=80',
  '잘츠부르크': 'https://images.unsplash.com/photo-1609866138210-84bb689f3c61?w=800&q=80',
  '비엔나': 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=800&q=80',
}

const itinerary: { title: string; city: string; country: string; lat: number; lng: number; zoom: number }[] = [
  { title: '인천 → 프라하 출발', city: '프라하', country: '체코', lat: 50.0755, lng: 14.4378, zoom: 13 },
  { title: '프라하 도착 · 구시가지', city: '프라하', country: '체코', lat: 50.0875, lng: 14.4213, zoom: 15 },
  { title: '프라하 성 · 카를교', city: '프라하', country: '체코', lat: 50.0884, lng: 14.4013, zoom: 15 },
  { title: '쿠트나호라 당일치기', city: '쿠트나호라', country: '체코', lat: 49.9481, lng: 15.2687, zoom: 14 },
  { title: '체스키크룸로프 이동', city: '체스키크룸로프', country: '체코', lat: 48.8127, lng: 14.3175, zoom: 14 },
  { title: '체스키크룸로프 탐방', city: '체스키크룸로프', country: '체코', lat: 48.8127, lng: 14.3175, zoom: 15 },
  { title: '할슈타트 이동', city: '할슈타트', country: '오스트리아', lat: 47.5622, lng: 13.6493, zoom: 14 },
  { title: '할슈타트 호수 · 소금광산', city: '할슈타트', country: '오스트리아', lat: 47.5622, lng: 13.6493, zoom: 15 },
  { title: '잘츠부르크 이동', city: '잘츠부르크', country: '오스트리아', lat: 47.8095, lng: 13.0550, zoom: 13 },
  { title: '잘츠부르크 관광', city: '잘츠부르크', country: '오스트리아', lat: 47.7981, lng: 13.0474, zoom: 15 },
  { title: '비엔나 이동', city: '비엔나', country: '오스트리아', lat: 48.2082, lng: 16.3738, zoom: 13 },
  { title: '쇤브룬 궁전 · 시내', city: '비엔나', country: '오스트리아', lat: 48.1845, lng: 16.3122, zoom: 15 },
  { title: '비엔나 자유일정', city: '비엔나', country: '오스트리아', lat: 48.2082, lng: 16.3738, zoom: 14 },
  { title: '비엔나 → 인천 귀국', city: '비엔나', country: '오스트리아', lat: 48.2082, lng: 16.3738, zoom: 13 },
]

function generateSchedule(): DaySchedule[] {
  const startDate = new Date(2026, 7, 15)
  const days: DaySchedule[] = []

  for (let i = 0; i < 14; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    const entry = itinerary[i]
    days.push({
      day: i + 1,
      date: `${d.getMonth() + 1}.${d.getDate()}`,
      weekday: WEEKDAYS[d.getDay()],
      ...entry,
      image: cityImages[entry.city],
    })
  }

  return days
}

export const schedule = generateSchedule()

// Unique cities for map markers
export const cityMarkers = Object.values(
  schedule.reduce<Record<string, { city: string; country: string; lat: number; lng: number }>>((acc, s) => {
    if (!acc[s.city]) {
      acc[s.city] = { city: s.city, country: s.country, lat: s.lat, lng: s.lng }
    }
    return acc
  }, {})
)
