import { useRef, useEffect, useState } from 'react'
import { schedule } from '../data/schedule'
import type { DaySchedule } from '../data/schedule'
import './Sidebar.css'

interface SidebarProps {
  selectedDay: number | null
  onSelectDay: (day: number | null) => void
  collapsed: boolean
  onToggleCollapse: () => void
  showRoute: boolean
  onToggleRoute: () => void
  activeAccomDay: number | null
  onShowAccom: (day: number) => void
  dayRouteDay: number | null
  onShowDayRoute: (day: number) => void
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
  if (t.includes('렌터카')) return (
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
function DayCard({ item, isSelected, onClick, isAccomActive, onShowAccom, isDayRouteActive, onShowDayRoute }: {
  item: DaySchedule
  isSelected: boolean
  onClick: () => void
  isAccomActive: boolean
  onShowAccom: (day: number) => void
  isDayRouteActive: boolean
  onShowDayRoute: (day: number) => void
}) {
  const isWeekend = item.weekday === '토' || item.weekday === '일'
  const isMovingDay = item.departure !== item.city
  const ref = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (isSelected && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [isSelected])

  const platformStyle = getPlatformStyle(item.bookingPlatform)
  const hasAccomCoords = !!(item.accommodation && item.accommodation.lat && item.accommodation.lng)

  return (
    <div
      ref={ref}
      className={`day-card ${isSelected ? 'day-card--selected' : ''} ${isMovingDay ? 'day-card--moving' : ''}`}
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

      {/* Route: departure → city */}
      <div className="day-card__route">
        <div className="day-card__route-top">
          <div className="day-card__route-transport">
            {getTransportIcon(item.transport)}
            <span>{item.transport}</span>
          </div>
          {isMovingDay && (
            <button
              className={`day-card__route-btn ${isDayRouteActive ? 'day-card__route-btn--active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                onShowDayRoute(item.day)
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="11" height="11">
                <path d="M3 17l6-6 4 4 8-8" /><polyline points="17 7 21 7 21 11" />
              </svg>
              경로 보기
            </button>
          )}
        </div>
        {isMovingDay ? (
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
            <span className="day-card__route-to">{item.city}</span>
            <span className="day-card__route-country">{item.country}</span>
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

      {/* Accommodation: clickable "숙소" button for confirmed, expandable details */}
      {item.accommodation && item.accommodation.name !== '미정' && (
        <div
          className={`day-card__accom ${expanded ? 'day-card__accom--expanded' : ''} ${isAccomActive ? 'day-card__accom--active' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            if (hasAccomCoords) {
              onShowAccom(item.day)
            }
            setExpanded(!expanded)
          }}
        >
          <div className="day-card__accom-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
              <path d="M3 21V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14"/>
              <path d="M3 11h18"/><path d="M9 21V11"/>
            </svg>
            <span className="day-card__accom-name">숙소</span>
            <svg className={`day-card__accom-chevron ${expanded ? 'day-card__accom-chevron--open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          {expanded && (
            <div className="day-card__accom-details">
              <p className="day-card__accom-detail-name">{item.accommodation.name}</p>
              <p className="day-card__accom-address">{item.accommodation.address}</p>
            </div>
          )}
        </div>
      )}
      {item.accommodation && item.accommodation.name === '미정' && (
        <div className="day-card__accom day-card__accom--pending">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
            <path d="M3 21V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14"/>
            <path d="M3 11h18"/><path d="M9 21V11"/>
          </svg>
          <span className="day-card__accom-name day-card__accom-name--pending">숙소 미정</span>
        </div>
      )}
    </div>
  )
}

/* ── Sidebar ── */
export default function Sidebar({ selectedDay, onSelectDay, collapsed, onToggleCollapse, showRoute, onToggleRoute, activeAccomDay, onShowAccom, dayRouteDay, onShowDayRoute }: SidebarProps) {
  const uniqueCities = new Set(schedule.map(s => s.city)).size

  return (
    <>
      <button
        className={`sidebar-toggle ${collapsed ? 'sidebar-toggle--collapsed' : ''}`}
        onClick={onToggleCollapse}
        aria-label={collapsed ? '사이드바 열기' : '사이드바 닫기'}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          {collapsed
            ? <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>
            : <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>
          }
        </svg>
      </button>

      <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
        <div className="sidebar__header">
          <div className="sidebar__header-banner">
            <div className="sidebar__header-banner-bg" />
            <div className="sidebar__header-banner-content">
              <div className="sidebar__badge">2026 FAMILY TRIP</div>
              <h2 className="sidebar__title">동유럽 가족 여행</h2>
              <p className="sidebar__subtitle">체코 · 오스트리아</p>
            </div>
          </div>
          <div className="sidebar__stats">
            <div className="sidebar__stat">
              <span className="sidebar__stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </span>
              <div>
                <span className="sidebar__stat-value">8.15 — 8.28</span>
                <span className="sidebar__stat-label">14일간</span>
              </div>
            </div>
            <div className="sidebar__stat-divider" />
            <div className="sidebar__stat">
              <span className="sidebar__stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </span>
              <div>
                <span className="sidebar__stat-value">{uniqueCities}개 도시</span>
                <span className="sidebar__stat-label">2개국</span>
              </div>
            </div>
          </div>
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
        </div>
        <div className="sidebar__list">
          {schedule.map((item) => (
            <DayCard
              key={item.day}
              item={item}
              isSelected={selectedDay === item.day}
              onClick={() => onSelectDay(selectedDay === item.day ? null : item.day)}
              isAccomActive={activeAccomDay === item.day}
              onShowAccom={onShowAccom}
              isDayRouteActive={dayRouteDay === item.day}
              onShowDayRoute={onShowDayRoute}
            />
          ))}
        </div>
      </aside>
    </>
  )
}
