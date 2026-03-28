import { useEffect, useState } from 'react'
import { useSettingsStore } from '../stores/settingsStore'

function money(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n)
}

export function DashboardPage() {
  const testingMode = useSettingsStore((s) => s.settings.testingMode)
  const [ready, setReady] = useState(false)
  const [flip, setFlip] = useState(false)

  useEffect(() => {
    setReady(false)
    const t = setTimeout(() => setReady(true), 650 + Math.random() * 700)
    return () => clearTimeout(t)
  }, [])

  const blocks = flip ? ['activity', 'kpis', 'ops'] : ['kpis', 'ops', 'activity']
  const dynamicClass = testingMode ? `rw-${Math.floor(Date.now() / 3000) % 7}` : ''

  function block(key) {
    if (key === 'kpis') {
      return (
        <section className={`rw-panel ${dynamicClass}`} id={testingMode ? `kpi-${Math.random().toString(36).slice(2, 7)}` : 'kpi'}>
          <div className="rw-panel-title">Today</div>
          <div className="rw-kpis">
            <div className="rw-kpi">
              <div className="rw-kpi-label">Revenue</div>
              <div className="rw-kpi-value">{money(12450.75)}</div>
            </div>
            <div className="rw-kpi">
              <div className="rw-kpi-label">Orders</div>
              <div className="rw-kpi-value">86</div>
            </div>
            <div className="rw-kpi">
              <div className="rw-kpi-label">Refunds</div>
              <div className="rw-kpi-value">3</div>
            </div>
          </div>
        </section>
      )
    }
    if (key === 'ops') {
      return (
        <section className={`rw-panel ${dynamicClass}`} id={testingMode ? `ops-${Math.random().toString(36).slice(2, 7)}` : 'ops'}>
          <div className="rw-panel-title">Operations</div>
          <ul className="rw-list">
            <li>5 shipments awaiting pickup</li>
            <li>2 products low on stock</li>
            <li>1 payment needs review</li>
          </ul>
        </section>
      )
    }
    return (
      <section className={`rw-panel ${dynamicClass}`} id={testingMode ? `act-${Math.random().toString(36).slice(2, 7)}` : 'activity'}>
        <div className="rw-panel-title">Activity</div>
        <ul className="rw-list">
          <li>Order #5033 confirmed</li>
          <li>New customer created an account</li>
          <li>Inventory sync completed</li>
        </ul>
      </section>
    )
  }

  return (
    <div className="rw-page">
      <div className="rw-page-head">
        <div>
          <div className="rw-eyebrow">Overview</div>
          <h2 className="rw-h2">Dashboard</h2>
        </div>
        <button className="rw-btn rw-btn-ghost" onClick={() => setFlip((v) => !v)}>Reorder widgets</button>
      </div>

      {!ready ? (
        <div className="rw-skeleton">Loading analytics…</div>
      ) : (
        <div className="rw-grid">
          {blocks.map((k) => (
            <div key={k}>{block(k)}</div>
          ))}
        </div>
      )}
    </div>
  )
}

