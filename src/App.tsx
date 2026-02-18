import { useState, useEffect, useCallback, useRef } from 'react'
import { GoogleMap, LoadScript, PolylineF, OverlayViewF, OverlayView, DirectionsRenderer } from '@react-google-maps/api'
import Sidebar from './components/Sidebar'
import { schedule, routePath, getRouteMarkers, golfCourseDetails } from './data/schedule'
import type { FoodShoppingSpot } from './data/schedule'
import './App.css'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

const mapContainerStyle = {
  width: '100%',
  height: '100vh',
}

const kobeAirport = { lat: 34.6304, lng: 135.2238 }
const defaultCenter = kobeAirport
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
  const [golfRouteResult, setGolfRouteResult] = useState<google.maps.DirectionsResult | null>(null)
  const [golfRouteDuration, setGolfRouteDuration] = useState<string | null>(null)
  const [golfRouteLoading, setGolfRouteLoading] = useState(false)
  const [golfRouteOriginLabel, setGolfRouteOriginLabel] = useState<string>('')
  const [golfPopup, setGolfPopup] = useState<{ name: string; lat: number; lng: number } | null>(null)
  const [activeFoodSpot, setActiveFoodSpot] = useState<FoodShoppingSpot | null>(null)
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
        const padding = isMobile()
          ? { top: 60, bottom: 60, left: 30, right: 30 }
          : { top: 60, bottom: 60, left: 400, right: 60 }
        map.fitBounds(bounds, padding)
      }
      return next
    })
  }, [map])

  const isMobile = () => window.innerWidth <= 640

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

    // Auto-collapse sidebar on mobile so user can see the map
    if (isMobile()) {
      setSidebarCollapsed(true)
    }

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
    // Toggle off
    if (activeGolfCourse?.name === name) {
      setActiveGolfCourse(null)
      setGolfRouteResult(null)
      setGolfRouteDuration(null)
      setGolfRouteOriginLabel('')
      setGolfPopup(null)
      return
    }

    setActiveGolfCourse({ name, lat, lng })
    setGolfPopup(null)
    setGolfRouteResult(null)
    setGolfRouteDuration(null)
    setGolfRouteLoading(true)

    if (isMobile()) {
      setSidebarCollapsed(true)
    }

    // Day 1 → origin is Kobe Airport, otherwise hotel
    const isDay1 = selectedDay === 1
    const origin = isDay1
      ? kobeAirport
      : { lat: 34.6873, lng: 135.1930 } // 고베 오리엔탈 호텔
    setGolfRouteOriginLabel(isDay1 ? '고베 공항' : '오리엔탈 호텔')

    const directionsService = new google.maps.DirectionsService()
    directionsService.route(
      {
        origin,
        destination: { lat, lng },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        setGolfRouteLoading(false)
        if (status === google.maps.DirectionsStatus.OK && result) {
          setGolfRouteResult(result)
          const duration = result.routes[0]?.legs[0]?.duration?.text
          setGolfRouteDuration(duration ?? null)
          if (map) {
            const bounds = new google.maps.LatLngBounds()
            result.routes[0]?.legs[0]?.steps.forEach(step => {
              bounds.extend(step.start_location)
              bounds.extend(step.end_location)
            })
            const padding = isMobile()
              ? { top: 60, bottom: 60, left: 30, right: 30 }
              : { top: 60, bottom: 60, left: 400, right: 60 }
            map.fitBounds(bounds, padding)
          }
        }
      }
    )
  }, [map, activeGolfCourse, selectedDay])

  const handleShowFoodSpot = useCallback((spot: FoodShoppingSpot) => {
    if (activeFoodSpot?.name === spot.name) {
      setActiveFoodSpot(null)
      return
    }
    setActiveFoodSpot(spot)
    if (isMobile()) {
      setSidebarCollapsed(true)
    }
    if (map && !animating.current) {
      animating.current = true
      map.panTo({ lat: spot.lat, lng: spot.lng })
      setTimeout(() => {
        smoothZoom(map, 16, () => {
          animating.current = false
        })
      }, 300)
    }
  }, [map, activeFoodSpot])

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
          golfRouteDuration={golfRouteDuration}
          golfRouteLoading={golfRouteLoading}
          golfRouteOriginLabel={golfRouteOriginLabel}
          activeFoodSpot={activeFoodSpot?.name ?? null}
          onShowFoodSpot={handleShowFoodSpot}
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

              {/* Golf course driving route */}
              {golfRouteResult && (
                <>
                  <DirectionsRenderer
                    directions={golfRouteResult}
                    options={{
                      suppressMarkers: true,
                      polylineOptions: {
                        strokeColor: '#16a34a',
                        strokeOpacity: 0.85,
                        strokeWeight: 5,
                      },
                    }}
                  />
                  {(() => {
                    const leg = golfRouteResult.routes[0]?.legs[0]
                    if (!leg) return null
                    return (
                      <>
                        <OverlayViewF
                          position={leg.start_location}
                          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                        >
                          <div className="dir-marker dir-marker--origin">
                            <div className="dir-marker__pin" />
                            <span className="dir-marker__label">{golfRouteOriginLabel}</span>
                          </div>
                        </OverlayViewF>
                        <OverlayViewF
                          position={leg.end_location}
                          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                        >
                          <div className="dir-marker dir-marker--golf" style={{ cursor: 'pointer' }} onClick={() => activeGolfCourse && setGolfPopup(activeGolfCourse)}>
                            <div className="dir-marker__pin" />
                            <span className="dir-marker__label">{activeGolfCourse?.name}</span>
                          </div>
                        </OverlayViewF>
                      </>
                    )
                  })()}
                </>
              )}

              {/* Golf course marker (no route) */}
              {activeGolfCourse && !golfRouteResult && (
                <OverlayViewF
                  position={{ lat: activeGolfCourse.lat, lng: activeGolfCourse.lng }}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                  <div className="poi-marker poi-marker--golf" onClick={() => setGolfPopup(activeGolfCourse)}>
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
              {/* Food/Shopping spot marker */}
              {activeFoodSpot && (
                <OverlayViewF
                  position={{ lat: activeFoodSpot.lat, lng: activeFoodSpot.lng }}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                  <div className={`poi-marker poi-marker--${activeFoodSpot.type === 'food' ? 'restaurant' : 'shop'}`}>
                    <div className="poi-marker__icon">
                      {activeFoodSpot.type === 'food' ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                          <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
                        </svg>
                      )}
                    </div>
                    <span className="poi-marker__label">{activeFoodSpot.name}</span>
                  </div>
                </OverlayViewF>
              )}

              {/* Golf course info popup */}
              {golfPopup && (() => {
                const detail = golfCourseDetails[golfPopup.name]
                if (!detail) return null
                return (
                  <OverlayViewF
                    position={{ lat: golfPopup.lat, lng: golfPopup.lng }}
                    mapPaneName={OverlayView.FLOAT_PANE}
                  >
                    <div className="poi-popup poi-popup--golf">
                      <button className="poi-popup__close" onClick={() => setGolfPopup(null)}>×</button>
                      <p className="poi-popup__name">{golfPopup.name}</p>
                      <p className="poi-popup__name-en">{detail.nameEn}</p>
                      <div className="poi-popup__stats">
                        <span className="poi-popup__stat">{detail.holes}홀</span>
                        <span className="poi-popup__stat-sep">·</span>
                        <span className="poi-popup__stat">Par {detail.par}</span>
                        {detail.yards && (
                          <>
                            <span className="poi-popup__stat-sep">·</span>
                            <span className="poi-popup__stat">{detail.yards.toLocaleString()}야드</span>
                          </>
                        )}
                      </div>
                      {detail.address && <p className="poi-popup__address">{detail.address}</p>}
                      {detail.tel && <p className="poi-popup__address">TEL: {detail.tel}</p>}
                      <p className="poi-popup__desc">{detail.description}</p>
                      {detail.features && (
                        <div className="poi-popup__features">
                          {detail.features.map((f, i) => (
                            <span key={i} className="poi-popup__feature-tag">{f}</span>
                          ))}
                        </div>
                      )}
                      {detail.established && (
                        <p className="poi-popup__established">설립 {detail.established}년</p>
                      )}
                      {detail.website && (
                        <a className="poi-popup__link" href={detail.website} target="_blank" rel="noopener noreferrer">
                          홈페이지 방문 →
                        </a>
                      )}
                    </div>
                  </OverlayViewF>
                )
              })()}
            </GoogleMap>
          </LoadScript>
        </div>
      </div>
    </>
  )
}

export default App
