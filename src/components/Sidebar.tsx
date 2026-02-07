import { useRef, useEffect } from 'react'
import { schedule } from '../data/schedule'
import type { DaySchedule } from '../data/schedule'
import './Sidebar.css'

interface SidebarProps {
  selectedDay: number | null
  onSelectDay: (day: number | null) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

function DayCard({ item, isSelected, onClick }: {
  item: DaySchedule
  isSelected: boolean
  onClick: () => void
}) {
  const isWeekend = item.weekday === '토' || item.weekday === '일'
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isSelected && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [isSelected])

  return (
    <div
      ref={ref}
      className={`day-card ${isSelected ? 'day-card--selected' : ''}`}
      onClick={onClick}
    >
      <div className="day-card__image" style={{ backgroundImage: `url(${item.image})` }}>
        <div className="day-card__image-overlay" />
        <span className="day-card__day-badge">DAY {item.day}</span>
        <div className="day-card__image-text">
          <span className="day-card__city-name">{item.city}</span>
        </div>
      </div>
      <div className="day-card__body">
        <div className="day-card__header">
          <span className={`day-card__date ${isWeekend ? 'day-card__date--weekend' : ''}`}>
            {item.date} ({item.weekday})
          </span>
          <span className="day-card__country">{item.country}</span>
        </div>
        <h3 className="day-card__title">{item.title}</h3>
      </div>
    </div>
  )
}

export default function Sidebar({ selectedDay, onSelectDay, collapsed, onToggleCollapse }: SidebarProps) {
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
          <div className="sidebar__header-top">
            <span className="sidebar__icon">&#9992;</span>
            <div>
              <h2 className="sidebar__title">여행 일정</h2>
              <p className="sidebar__subtitle">2026. 8. 15 — 8. 28</p>
            </div>
          </div>
          <div className="sidebar__progress">
            <div className="sidebar__progress-bar">
              <div className="sidebar__progress-fill" style={{ width: '100%' }} />
            </div>
            <span className="sidebar__progress-text">14일 / 6개 도시</span>
          </div>
        </div>
        <div className="sidebar__list">
          {schedule.map((item) => (
            <DayCard
              key={item.day}
              item={item}
              isSelected={selectedDay === item.day}
              onClick={() => onSelectDay(selectedDay === item.day ? null : item.day)}
            />
          ))}
        </div>
      </aside>
    </>
  )
}
