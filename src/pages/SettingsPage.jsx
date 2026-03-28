import { useSettingsStore } from '../stores/settingsStore'

export function SettingsPage() {
  const settings = useSettingsStore((s) => s.settings)
  const setTestingMode = useSettingsStore((s) => s.setTestingMode)
  const setFlag = useSettingsStore((s) => s.setFlag)

  return (
    <div className="rw-page">
      <div className="rw-page-head">
        <div>
          <div className="rw-eyebrow">Workspace</div>
          <h2 className="rw-h2">Settings</h2>
          <div className="rw-muted">Control feature flags and testing mode.</div>
        </div>
      </div>

      <section className="rw-panel">
        <div className="rw-panel-title">Testing</div>
        <label className="rw-check">
          <input type="checkbox" checked={settings.testingMode} onChange={(e) => setTestingMode(e.target.checked)} />
          Enable Testing Mode (adds unstable selectors, random IDs/classes, slight text changes)
        </label>
      </section>

      <section className="rw-panel">
        <div className="rw-panel-title">Feature flags</div>
        <div className="rw-stack">
          <label className="rw-check">
            <input
              type="checkbox"
              checked={settings.featureFlags.quickCheckout}
              onChange={(e) => setFlag('quickCheckout', e.target.checked)}
            />
            Quick checkout
          </label>
          <label className="rw-check">
            <input
              type="checkbox"
              checked={settings.featureFlags.recommendations}
              onChange={(e) => setFlag('recommendations', e.target.checked)}
            />
            Recommendations widget
          </label>
          <label className="rw-check">
            <input
              type="checkbox"
              checked={settings.featureFlags.adminInsights}
              onChange={(e) => setFlag('adminInsights', e.target.checked)}
            />
            Admin insights
          </label>
        </div>
      </section>
    </div>
  )
}

