import { useRef, useEffect, useState, useCallback } from 'react'
import { schedule, foodShoppingData } from '../data/schedule'
import type { DaySchedule, FoodShoppingSpot } from '../data/schedule'
import './Sidebar.css'

interface SidebarProps {
  selectedDay: number | null
  collapsed: boolean
  onToggleCollapse: () => void
  showRoute: boolean
  onToggleRoute: () => void
  onShowAccom: (day: number) => void
  activeGolfCourse: string | null
  onShowGolfCourse: (lat: number, lng: number, name: string) => void
  golfRouteDuration: string | null
  golfRouteLoading: boolean
  golfRouteOriginLabel: string
  activeFoodSpot: string | null
  onShowFoodSpot: (spot: FoodShoppingSpot) => void
}

/* ── Transport icon helper ── */
function getTransportIcon(transport: string) {
  const t = transport.toLowerCase()
  if (t.includes('비행기')) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
      <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
    </svg>
  )
  if (t.includes('기차') || t.includes('rj')) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
      <rect x="4" y="3" width="16" height="16" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="M8 19l-2 3"/><path d="M16 19l2 3"/><circle cx="9" cy="15" r="1"/><circle cx="15" cy="15" r="1"/>
    </svg>
  )
  if (t.includes('버스') || t.includes('셔틀')) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
      <path d="M8 6v6"/><path d="M16 6v6"/><path d="M2 12h20"/><path d="M5 18H3c-.6 0-1-.4-1-1V6c0-2.2 3.6-4 8-4s8 1.8 8 4v11c0 .6-.4 1-1 1h-2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>
    </svg>
  )
  if (t.includes('렌터카') || t.includes('송영차량')) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
      <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>
    </svg>
  )
  if (t.includes('도보') || t.includes('트램')) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
      <circle cx="12" cy="5" r="1.5"/><path d="M9 20l3-8 3 8"/><path d="M12 12V9.5l-2.5-2"/><path d="M12 9.5l2.5-2"/>
    </svg>
  )
  if (t.includes('대중교통')) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
      <rect x="3" y="3" width="18" height="14" rx="2"/><path d="M3 10h18"/><path d="M7 21l2-4"/><path d="M17 21l-2-4"/>
    </svg>
  )
  // default: walking
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
      <circle cx="12" cy="5" r="1.5"/><path d="M9 20l3-8 3 8"/><path d="M12 12V9.5l-2.5-2"/><path d="M12 9.5l2.5-2"/>
    </svg>
  )
}

/* ── Booking platform color ── */
function getPlatformStyle(platform: string | null): { bg: string; color: string } {
  if (!platform || platform === '미정') return { bg: '#f1f5f9', color: '#94a3b8' }
  if (platform.includes('에어비앤비')) return { bg: '#fff1f0', color: '#e0234e' }
  if (platform.includes('트립닷컴')) return { bg: '#eef6ff', color: '#006ce4' }
  return { bg: '#f0fdf4', color: '#16a34a' }
}

/* ── Day Card ── */
function DayCard({ item, isSelected, onClick, activeGolfCourse, onShowGolfCourse, activeFoodSpot, onShowFoodSpot }: {
  item: DaySchedule
  isSelected: boolean
  onClick: () => void
  activeGolfCourse: string | null
  onShowGolfCourse: (lat: number, lng: number, name: string) => void
  activeFoodSpot: string | null
  onShowFoodSpot: (spot: FoodShoppingSpot) => void
}) {
  const isWeekend = item.weekday === '토' || item.weekday === '일'
  const isFlightDay = item.transport.includes('비행기')
  const accomName = item.accommodation?.name ?? item.city
  const ref = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [foodExpanded, setFoodExpanded] = useState(false)
  const dayFoodData = foodShoppingData.find(f => f.day === item.day)

  useEffect(() => {
    if (isSelected && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [isSelected])

  const platformStyle = getPlatformStyle(item.bookingPlatform)

  return (
    <div
      ref={ref}
      className={`day-card ${isSelected ? 'day-card--selected' : ''}`}
      onClick={onClick}
    >
      {/* Header: Day + Date */}
      <div className="day-card__header">
        <div className="day-card__day-info">
          <span className="day-card__day-badge">DAY {item.day}</span>
          <span className={`day-card__date ${isWeekend ? 'day-card__date--weekend' : ''}`}>
            {item.date} ({item.weekday})
          </span>
        </div>
        {item.bookingPlatform && item.bookingPlatform !== '미정' && (
          <span className="day-card__platform" style={{ background: platformStyle.bg, color: platformStyle.color }}>
            {item.bookingPlatform}
          </span>
        )}
      </div>

      {/* Route / Location */}
      <div className="day-card__route">
        <div className="day-card__route-top">
          <div className="day-card__route-transport">
            {getTransportIcon(item.transport)}
            <span>{item.transport}</span>
          </div>
        </div>
        {isFlightDay ? (
          <div className="day-card__route-cities">
            <span className="day-card__route-from">{item.departure}</span>
            <svg className="day-card__route-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
              <path d="M5 12h14"/><polyline points="12 5 19 12 12 19"/>
            </svg>
            <span className="day-card__route-to">{item.city}</span>
            <span className="day-card__route-country">{item.country}</span>
          </div>
        ) : (
          <div className="day-card__route-cities">
            <span className="day-card__route-to">{accomName}</span>
            <span className="day-card__route-country">{item.city}, {item.country}</span>
          </div>
        )}
      </div>

      {/* Activities */}
      {item.activities && (
        <div className="day-card__activities">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <p>{item.activities}</p>
        </div>
      )}

      {/* Golf courses */}
      {item.golfCourseData && item.golfCourseData.length > 0 && (
        <div className={`day-card__golf ${expanded ? 'day-card__golf--expanded' : ''}`}>
          <div
            className="day-card__golf-header"
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
              <circle cx="19.5" cy="3.5" r="2.5"/><path d="M5 21V4l14 7-14 7"/>
            </svg>
            <span className="day-card__golf-title">골프장</span>
            {!expanded && item.golfCourseData[0]?.teeTimes?.[0] && (
              <span className="day-card__golf-tee-preview">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="9" height="9">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                {item.golfCourseData[0].teeTimes.map(t => t.time).join(' / ')}
              </span>
            )}
            <svg className={`day-card__golf-chevron ${expanded ? 'day-card__golf-chevron--open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          {expanded && (
            <div className="day-card__golf-list">
              {item.golfCourseData.map((gc) => (
                <div key={gc.name}>
                  <div
                    className={`day-card__golf-item ${activeGolfCourse === gc.name ? 'day-card__golf-item--active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (gc.lat && gc.lng) {
                        onShowGolfCourse(gc.lat, gc.lng, gc.name)
                      }
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="11" height="11">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span>{gc.name}</span>
                  </div>
                  {gc.teeTimes && gc.teeTimes.length > 0 && (
                    <div className="day-card__golf-tee">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="11" height="11">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                      <div className="day-card__golf-tee-times">
                        {gc.teeTimes.map((tt, i) => (
                          <div key={i} className="day-card__golf-tee-entry">
                            <span className="day-card__golf-tee-badge">{tt.time}</span>
                            {tt.note && <span className="day-card__golf-tee-note">{tt.note}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Food & Shopping section */}
      {dayFoodData && (
        <div className={`day-card__food ${foodExpanded ? 'day-card__food--expanded' : ''}`}>
          <div
            className="day-card__food-header"
            onClick={(e) => {
              e.stopPropagation()
              setFoodExpanded(!foodExpanded)
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
            </svg>
            <span className="day-card__food-title">저녁 식당 & 쇼핑</span>
            <svg className={`day-card__food-chevron ${foodExpanded ? 'day-card__food-chevron--open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          {foodExpanded && (
            <div className="day-card__food-content">
              <div className="day-card__food-info">
                <span className="day-card__food-time">{dayFoodData.dinner.time}</span>
                <span className="day-card__food-area">{dayFoodData.dinner.area}</span>
              </div>
              <p className="day-card__food-rec">{dayFoodData.dinner.recommendation}</p>

              <div className="day-card__food-spots">
                <div className="day-card__food-spots-group">
                  <span className="day-card__food-group-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="10" height="10">
                      <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
                    </svg>
                    식당
                  </span>
                  {dayFoodData.spots.filter(s => s.type === 'food').map((spot) => (
                    <div
                      key={spot.name}
                      className={`day-card__food-spot ${activeFoodSpot === spot.name ? 'day-card__food-spot--active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        onShowFoodSpot(spot)
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="11" height="11">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      <div className="day-card__food-spot-info">
                        <span className="day-card__food-spot-name">{spot.name}</span>
                        <span className="day-card__food-spot-desc">{spot.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="day-card__food-spots-group">
                  <span className="day-card__food-group-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="10" height="10">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
                    </svg>
                    쇼핑
                  </span>
                  {dayFoodData.spots.filter(s => s.type === 'shopping').map((spot) => (
                    <div
                      key={spot.name}
                      className={`day-card__food-spot day-card__food-spot--shop ${activeFoodSpot === spot.name ? 'day-card__food-spot--active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        onShowFoodSpot(spot)
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="11" height="11">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      <div className="day-card__food-spot-info">
                        <span className="day-card__food-spot-name">{spot.name}</span>
                        <span className="day-card__food-spot-desc">{spot.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="day-card__food-tip">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="11" height="11">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <span>{dayFoodData.tip}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Sidebar ── */
export default function Sidebar({ selectedDay, collapsed, onToggleCollapse, showRoute, onToggleRoute, onShowAccom, activeGolfCourse, onShowGolfCourse, golfRouteDuration, golfRouteLoading, golfRouteOriginLabel, activeFoodSpot, onShowFoodSpot }: SidebarProps) {
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const touchStartY = useRef(0)
  const touchStartTime = useRef(0)
  const sidebarRef = useRef<HTMLElement>(null)

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return
    touchStartY.current = e.touches[0].clientY
    touchStartTime.current = Date.now()
    setIsDragging(true)
  }, [isMobile])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !isDragging) return
    const deltaY = e.touches[0].clientY - touchStartY.current
    // Only allow dragging down (positive delta)
    setDragOffset(Math.max(0, deltaY))
  }, [isMobile, isDragging])

  const handleTouchEnd = useCallback(() => {
    if (!isMobile || !isDragging) return
    const elapsed = Date.now() - touchStartTime.current
    const velocity = dragOffset / elapsed // px/ms

    // Dismiss if dragged more than 100px or fast swipe (velocity > 0.5)
    if (dragOffset > 100 || velocity > 0.5) {
      onToggleCollapse()
    }
    setDragOffset(0)
    setIsDragging(false)
  }, [isMobile, isDragging, dragOffset, onToggleCollapse])

  const sidebarStyle = isDragging && dragOffset > 0
    ? { transform: `translateY(${dragOffset}px)`, transition: 'none' }
    : undefined

  return (
    <>
      {/* Mobile backdrop overlay */}
      {!collapsed && (
        <div
          className="sidebar-backdrop"
          onClick={onToggleCollapse}
        />
      )}

      <button
        className={`sidebar-toggle ${collapsed ? 'sidebar-toggle--collapsed' : ''}`}
        onClick={onToggleCollapse}
        aria-label={collapsed ? '일정 보기' : '지도 보기'}
      >
        {collapsed ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
        )}
      </button>

      <aside
        ref={sidebarRef}
        className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}
        style={sidebarStyle}
      >
        <div
          className="sidebar__header"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="sidebar__drag-handle">
            <div className="sidebar__drag-handle-bar" />
          </div>
          <div className="sidebar__header-banner">
            <div className="sidebar__header-banner-bg" />
            <div className="sidebar__header-banner-content">
              <div className="sidebar__badge">2026 WORKSHOP</div>
              <h2 className="sidebar__title">SPH 고베 워크샵</h2>
              <p className="sidebar__subtitle">일본 · 고베</p>
            </div>
          </div>
          <div className="sidebar__stats">
            <div className="sidebar__stat">
              <span className="sidebar__stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </span>
              <div>
                <span className="sidebar__stat-value">2.25 — 2.28</span>
                <span className="sidebar__stat-label">4일간</span>
              </div>
            </div>
            <div className="sidebar__stat-divider" />
            <div className="sidebar__stat sidebar__stat--clickable" onClick={() => onShowAccom(1)}>
              <span className="sidebar__stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </span>
              <div>
                <span className="sidebar__stat-value">오리엔탈 호텔</span>
                <span className="sidebar__stat-label">고베, 일본</span>
              </div>
            </div>
          </div>
          {/* Golf route info or default route button */}
          {activeGolfCourse ? (
            <div className="sidebar__golf-route">
              <div className="sidebar__golf-route-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                  <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>
                </svg>
                <span className="sidebar__golf-route-label">차량 이동 경로</span>
              </div>
              <div className="sidebar__golf-route-path">
                <span className="sidebar__golf-route-from">{golfRouteOriginLabel}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                  <path d="M5 12h14"/><polyline points="12 5 19 12 12 19"/>
                </svg>
                <span className="sidebar__golf-route-to">{activeGolfCourse}</span>
              </div>
              {golfRouteLoading && (
                <div className="sidebar__golf-route-duration sidebar__golf-route-duration--loading">
                  경로 계산 중...
                </div>
              )}
              {golfRouteDuration && !golfRouteLoading && (
                <div className="sidebar__golf-route-duration">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  약 {golfRouteDuration}
                </div>
              )}
            </div>
          ) : (
            <button
              className={`sidebar__route-btn ${showRoute ? 'sidebar__route-btn--active' : ''}`}
              onClick={onToggleRoute}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <path d="M3 17l6-6 4 4 8-8" />
                <polyline points="17 7 21 7 21 11" />
              </svg>
              {showRoute ? '경로 숨기기' : '경로 보기'}
            </button>
          )}
        </div>
        <div className="sidebar__list">
          {schedule.map((item) => (
            <DayCard
              key={item.day}
              item={item}
              isSelected={selectedDay === item.day}
              onClick={() => onShowAccom(item.day)}
              activeGolfCourse={activeGolfCourse}
              onShowGolfCourse={onShowGolfCourse}
              activeFoodSpot={activeFoodSpot}
              onShowFoodSpot={onShowFoodSpot}
            />
          ))}
        </div>
      </aside>
    </>
  )
}
