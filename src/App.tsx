import { useState, useEffect, useCallback, useRef } from 'react'
import { GoogleMap, LoadScript, MarkerF } from '@react-google-maps/api'
import Sidebar from './components/Sidebar'
import { schedule, cityMarkers } from './data/schedule'
import './App.css'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

const mapContainerStyle = {
  width: '100%',
  height: '100vh',
}

const defaultCenter = { lat: 48.5, lng: 15.0 }
const defaultZoom = 6

function smoothZoom(map: google.maps.Map, targetZoom: number, callback?: () => void) {
  const currentZoom = map.getZoom() ?? defaultZoom
  if (currentZoom === targetZoom) {
    callback?.()
    return
  }

  const step = targetZoom > currentZoom ? 1 : -1
  const listener = google.maps.event.addListener(map, 'zoom_changed', () => {
    const newZoom = map.getZoom() ?? currentZoom
    if (
      (step > 0 && newZoom < targetZoom) ||
      (step < 0 && newZoom > targetZoom)
    ) {
      setTimeout(() => map.setZoom(newZoom + step), 80)
    } else {
      google.maps.event.removeListener(listener)
      callback?.()
    }
  })
  map.setZoom(currentZoom + step)
}

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const animating = useRef(false)

  useEffect(() => {
    if (showSplash) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }, [showSplash])

  const handleClose = () => {
    setFadeOut(true)
    setTimeout(() => setShowSplash(false), 600)
  }

  const handleSelectDay = useCallback((day: number | null) => {
    setSelectedDay(day)
    if (!map || animating.current) return

    if (day === null) {
      animating.current = true
      smoothZoom(map, defaultZoom, () => {
        map.panTo(defaultCenter)
        animating.current = false
      })
      return
    }

    const item = schedule.find((s) => s.day === day)
    if (!item) return

    animating.current = true
    // Zoom out first, then pan, then zoom in
    const currentZoom = map.getZoom() ?? defaultZoom
    const midZoom = Math.min(currentZoom, item.zoom, 8)

    smoothZoom(map, midZoom, () => {
      map.panTo({ lat: item.lat, lng: item.lng })
      // Wait for pan to settle
      setTimeout(() => {
        smoothZoom(map, item.zoom, () => {
          animating.current = false
        })
      }, 400)
    })
  }, [map])

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance)
  }, [])

  return (
    <>
      {showSplash && (
        <div className={`splash-overlay ${fadeOut ? 'fade-out' : ''}`}>
          <div className="splash-bg" />
          <div className="splash-content">
            <div className="splash-popup">
              <div className="splash-badge">2026 FAMILY TRIP</div>
              <h1>동유럽 가족 여행</h1>
              <p className="splash-route">체코 · 오스트리아</p>
              <div className="splash-details">
                <div className="splash-detail-item">
                  <span className="splash-detail-value">13박 14일</span>
                </div>
              </div>
              <div className="splash-divider" />
              <button className="splash-button" onClick={handleClose}>
                여행 지도 보기
                <span className="splash-button-arrow">→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="app-layout">
        <Sidebar
          selectedDay={selectedDay}
          onSelectDay={handleSelectDay}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div className="map-container">
          <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={defaultCenter}
              zoom={defaultZoom}
              onLoad={onMapLoad}
              options={{
                styles: [
                  { featureType: 'poi', stylers: [{ visibility: 'simplified' }] },
                  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
                ],
              }}
            >
              {cityMarkers.map((marker) => (
                <MarkerF
                  key={marker.city}
                  position={{ lat: marker.lat, lng: marker.lng }}
                  label={{
                    text: marker.city,
                    fontSize: '13px',
                    fontWeight: '700',
                    className: 'marker-label',
                  }}
                />
              ))}
            </GoogleMap>
          </LoadScript>
        </div>
      </div>
    </>
  )
}

export default App
