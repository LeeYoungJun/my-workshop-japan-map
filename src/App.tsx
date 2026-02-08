import { useState, useEffect, useCallback, useRef } from 'react'
import { GoogleMap, LoadScript, PolylineF, OverlayViewF, OverlayView } from '@react-google-maps/api'
import Sidebar from './components/Sidebar'
import { schedule, routePath, getRouteMarkers } from './data/schedule'
import './App.css'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

const mapContainerStyle = {
  width: '100%',
  height: '100vh',
}

const defaultCenter = { lat: 34.6304, lng: 135.2238 }  // Kobe Airport
const defaultZoom = 12

const routeLineOptions: google.maps.PolylineOptions = {
  strokeColor: '#2563eb',
  strokeOpacity: 0.8,
  strokeWeight: 3,
  geodesic: true,
}

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

const routeMarkers = getRouteMarkers()

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showRoute, setShowRoute] = useState(false)
  const [activeAccomDay, setActiveAccomDay] = useState<number | null>(null)
  const [activeGolfCourse, setActiveGolfCourse] = useState<{ name: string; lat: number; lng: number } | null>(null)
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

  const handleToggleRoute = useCallback(() => {
    setShowRoute(prev => {
      const next = !prev
      if (next && map) {
        const bounds = new google.maps.LatLngBounds()
        routePath.forEach(p => bounds.extend(p))
        map.fitBounds(bounds, { top: 60, bottom: 60, left: 400, right: 60 })
      }
      return next
    })
  }, [map])

  const handleShowAccom = useCallback((day: number) => {
    // Toggle off if same day
    if (activeAccomDay === day) {
      setActiveAccomDay(null)
      setSelectedDay(null)
      return
    }

    const item = schedule.find(s => s.day === day)
    if (!item?.accommodation?.lat || !item?.accommodation?.lng) return

    setActiveAccomDay(day)
    setSelectedDay(day)

    if (map && !animating.current) {
      const accomLat = item.accommodation.lat
      const accomLng = item.accommodation.lng
      animating.current = true
      map.panTo({ lat: accomLat, lng: accomLng })
      setTimeout(() => {
        smoothZoom(map, 16, () => {
          animating.current = false
        })
      }, 300)
    }
  }, [map, activeAccomDay])

  const handleShowGolfCourse = useCallback((lat: number, lng: number, name: string) => {
    if (activeGolfCourse?.name === name) {
      setActiveGolfCourse(null)
      return
    }

    setActiveGolfCourse({ name, lat, lng })

    if (map && !animating.current) {
      animating.current = true
      map.panTo({ lat, lng })
      setTimeout(() => {
        smoothZoom(map, 14, () => {
          animating.current = false
        })
      }, 300)
    }
  }, [map, activeGolfCourse])

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    mapInstance.setOptions({
      mapTypeControlOptions: {
        position: google.maps.ControlPosition.TOP_RIGHT,
      },
    })
    setMap(mapInstance)
  }, [])

  // Get active accommodation for marker rendering
  const activeAccom = activeAccomDay
    ? schedule.find(s => s.day === activeAccomDay)?.accommodation
    : null

  return (
    <>
      {showSplash && (
        <div className={`splash-overlay ${fadeOut ? 'fade-out' : ''}`}>
          <div className="splash-bg" />
          <div className="splash-content">
            <div className="splash-popup">
              <div className="splash-badge">2026 WORKSHOP</div>
              <h1>SPH 고베 워크샵</h1>
              <p className="splash-route">일본 · 고베</p>
              <div className="splash-details">
                <div className="splash-detail-item">
                  <span className="splash-detail-value">3박 4일</span>
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
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          showRoute={showRoute}
          onToggleRoute={handleToggleRoute}
          onShowAccom={handleShowAccom}
          activeGolfCourse={activeGolfCourse?.name ?? null}
          onShowGolfCourse={handleShowGolfCourse}
        />
        <div className="map-container">
          <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={defaultCenter}
              zoom={defaultZoom}
              onLoad={onMapLoad}
              options={{
                mapTypeControl: true,
                styles: [
                  { featureType: 'poi', stylers: [{ visibility: 'simplified' }] },
                  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
                ],
              }}
            >
              {!showRoute && selectedDay !== null && (() => {
                const selected = schedule.find(s => s.day === selectedDay)
                if (!selected) return null
                return (
                  <OverlayViewF
                    position={{ lat: selected.lat, lng: selected.lng }}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                  >
                    <div className="city-marker">
                      <div className="city-marker__pin" />
                      <span className="city-marker__label">{selected.city}</span>
                    </div>
                  </OverlayViewF>
                )
              })()}

              {showRoute && (
                <>
                  <PolylineF path={routePath} options={routeLineOptions} />
                  {routeMarkers.map((marker) => (
                    <OverlayViewF
                      key={marker.label}
                      position={{ lat: marker.lat, lng: marker.lng }}
                      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                    >
                      <div className="route-marker">
                        <div className="route-marker__pin" />
                        <span className="route-marker__label">{marker.label}</span>
                      </div>
                    </OverlayViewF>
                  ))}
                </>
              )}

              {/* Golf course marker */}
              {activeGolfCourse && (
                <OverlayViewF
                  position={{ lat: activeGolfCourse.lat, lng: activeGolfCourse.lng }}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                  <div className="poi-marker poi-marker--golf">
                    <div className="poi-marker__icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                        <circle cx="19.5" cy="3.5" r="2.5"/><path d="M5 21V4l14 7-14 7"/>
                      </svg>
                    </div>
                    <span className="poi-marker__label">{activeGolfCourse.name}</span>
                  </div>
                </OverlayViewF>
              )}

              {/* Accommodation marker */}
              {activeAccom && activeAccom.lat && activeAccom.lng && (
                <OverlayViewF
                  position={{ lat: activeAccom.lat, lng: activeAccom.lng }}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                  <div className="poi-marker poi-marker--hotel">
                    <div className="poi-marker__icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                        <path d="M3 21V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14"/>
                        <path d="M3 11h18"/><path d="M9 21V11"/>
                      </svg>
                    </div>
                    <span className="poi-marker__label">{activeAccom.name}</span>
                  </div>
                </OverlayViewF>
              )}
            </GoogleMap>
          </LoadScript>
        </div>
      </div>
    </>
  )
}

export default App
