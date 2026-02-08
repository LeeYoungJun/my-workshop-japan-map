import { useState, useEffect, useCallback, useRef } from 'react'
import { GoogleMap, LoadScript, PolylineF, OverlayViewF, OverlayView, DirectionsRenderer } from '@react-google-maps/api'
import Sidebar from './components/Sidebar'
import { schedule, routePath, getRouteMarkers, cityCoords, grossglocknerWaypoints } from './data/schedule'
import './App.css'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

const mapContainerStyle = {
  width: '100%',
  height: '100vh',
}

const defaultCenter = { lat: 48.5, lng: 15.0 }
const defaultZoom = 6

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
  const [dayRouteDay, setDayRouteDay] = useState<number | null>(null)
  const [dayRouteResult, setDayRouteResult] = useState<google.maps.DirectionsResult | null>(null)
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
    const currentZoom = map.getZoom() ?? defaultZoom
    const midZoom = Math.min(currentZoom, item.zoom, 8)

    smoothZoom(map, midZoom, () => {
      map.panTo({ lat: item.lat, lng: item.lng })
      setTimeout(() => {
        smoothZoom(map, item.zoom, () => {
          animating.current = false
        })
      }, 400)
    })
  }, [map])

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
      return
    }

    const item = schedule.find(s => s.day === day)
    if (!item?.accommodation?.lat || !item?.accommodation?.lng) return

    setActiveAccomDay(day)

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

  const handleShowDayRoute = useCallback((day: number) => {
    // Toggle off if same day
    if (dayRouteDay === day) {
      setDayRouteDay(null)
      setDayRouteResult(null)
      return
    }

    const item = schedule.find(s => s.day === day)
    if (!item || item.departure === item.city) return

    const originCoords = cityCoords[item.departure]
    const destCoords = cityCoords[item.city]
    if (!originCoords || !destCoords) return

    // Determine travel mode: rental car → DRIVING, else TRANSIT
    const t = item.transport.toLowerCase()
    const travelMode = t.includes('렌터카')
      ? google.maps.TravelMode.DRIVING
      : google.maps.TravelMode.TRANSIT

    setDayRouteDay(day)
    setDayRouteResult(null)

    // Add Grossglockner waypoints for Day 9 (Innsbruck → Hallstatt)
    const waypoints: google.maps.DirectionsWaypoint[] = day === 9
      ? grossglocknerWaypoints.map(wp => ({
          location: new google.maps.LatLng(wp.lat, wp.lng),
          stopover: false,
        }))
      : []

    const directionsService = new google.maps.DirectionsService()
    directionsService.route(
      {
        origin: { lat: originCoords.lat, lng: originCoords.lng },
        destination: { lat: destCoords.lat, lng: destCoords.lng },
        waypoints,
        travelMode,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDayRouteResult(result)
          if (map) {
            const bounds = new google.maps.LatLngBounds()
            result.routes[0]?.legs[0]?.steps.forEach(step => {
              bounds.extend(step.start_location)
              bounds.extend(step.end_location)
            })
            map.fitBounds(bounds, { top: 60, bottom: 60, left: 400, right: 60 })
          }
        } else {
          // Fallback: if TRANSIT fails, try DRIVING
          if (travelMode === google.maps.TravelMode.TRANSIT) {
            directionsService.route(
              {
                origin: { lat: originCoords.lat, lng: originCoords.lng },
                destination: { lat: destCoords.lat, lng: destCoords.lng },
                travelMode: google.maps.TravelMode.DRIVING,
              },
              (fallbackResult, fallbackStatus) => {
                if (fallbackStatus === google.maps.DirectionsStatus.OK && fallbackResult) {
                  setDayRouteResult(fallbackResult)
                  if (map) {
                    const bounds = new google.maps.LatLngBounds()
                    fallbackResult.routes[0]?.legs[0]?.steps.forEach(step => {
                      bounds.extend(step.start_location)
                      bounds.extend(step.end_location)
                    })
                    map.fitBounds(bounds, { top: 60, bottom: 60, left: 400, right: 60 })
                  }
                }
              }
            )
          }
        }
      }
    )
  }, [map, dayRouteDay])

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
          showRoute={showRoute}
          onToggleRoute={handleToggleRoute}
          activeAccomDay={activeAccomDay}
          onShowAccom={handleShowAccom}
          dayRouteDay={dayRouteDay}
          onShowDayRoute={handleShowDayRoute}
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

              {/* Per-day directions route */}
              {dayRouteResult && (
                <>
                  <DirectionsRenderer
                    directions={dayRouteResult}
                    options={{
                      suppressMarkers: true,
                      polylineOptions: {
                        strokeColor: '#f59e0b',
                        strokeOpacity: 0.9,
                        strokeWeight: 4,
                      },
                    }}
                  />
                  {(() => {
                    const leg = dayRouteResult.routes[0]?.legs[0]
                    if (!leg) return null
                    const item = schedule.find(s => s.day === dayRouteDay)
                    return (
                      <>
                        <OverlayViewF
                          position={leg.start_location}
                          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                        >
                          <div className="dir-marker dir-marker--origin">
                            <div className="dir-marker__pin" />
                            <span className="dir-marker__label">{item?.departure}</span>
                          </div>
                        </OverlayViewF>
                        <OverlayViewF
                          position={leg.end_location}
                          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                        >
                          <div className="dir-marker dir-marker--dest">
                            <div className="dir-marker__pin" />
                            <span className="dir-marker__label">{item?.city}</span>
                          </div>
                        </OverlayViewF>
                      </>
                    )
                  })()}
                </>
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
