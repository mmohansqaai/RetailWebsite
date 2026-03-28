import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiCreateProduct, apiDeleteProduct, apiListProducts } from '../api/api'
import { useAuthStore } from '../stores/authStore'
import { useSettingsStore } from '../stores/settingsStore'

function money(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n)
}

export function AdminPage() {
  const token = useAuthStore((s) => s.session?.token)
  const { featureFlags } = useSettingsStore((s) => s.settings)
  const [custom, setCustom] = useState([])
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const loadCustom = useCallback(async () => {
    const all = await apiListProducts()
    setCustom(all.filter((p) => !p.isSeed))
  }, [])

  useEffect(() => {
    loadCustom().catch((e) => setErr(e?.message || 'Failed to load products'))
  }, [loadCustom])

  const rows = useMemo(() => custom, [custom])

  async function onSubmit(e) {
    e.preventDefault()
    setMsg('')
    setErr('')
    const form = new FormData(e.currentTarget)
    const name = String(form.get('name') || '')
    const sku = String(form.get('sku') || '')
    const category = String(form.get('category') || '')
    const price = Number(form.get('price'))
    const stock = Number(form.get('stock'))
    const description = String(form.get('description') || '')
    const badgesRaw = String(form.get('badges') || '')
    const badges = badgesRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    try {
      await apiCreateProduct({ name, sku, category, price, stock, description, badges }, token)
      e.currentTarget.reset()
      await loadCustom()
      setMsg('Product saved to the database. It appears on the Products page.')
      window.dispatchEvent(new Event('nova-catalog-changed'))
    } catch (error) {
      setErr(error?.message || 'Could not add product')
    }
  }

  async function onRemove(id) {
    setErr('')
    try {
      await apiDeleteProduct(id, token)
      await loadCustom()
      setMsg('Product removed from the database.')
      window.dispatchEvent(new Event('nova-catalog-changed'))
    } catch (error) {
      setErr(error?.message || 'Could not remove product')
    }
  }

  return (
    <div className="rw-page">
      <div className="rw-page-head">
        <div>
          <div className="rw-eyebrow">Admin</div>
          <h2 className="rw-h2">Operations</h2>
          <div className="rw-muted">Role-restricted admin tools.</div>
        </div>
        <Link className="rw-btn rw-btn-ghost" to="/app/products">View storefront</Link>
      </div>

      {msg ? <div className="rw-success">{msg}</div> : null}
      {err ? <div className="rw-alert">{err}</div> : null}

      <section className="rw-panel">
        <div className="rw-panel-title">Add product</div>
        <p className="rw-muted" style={{ marginBottom: '0.75rem' }}>
          New products are stored in the server database (SQLite by default).
        </p>
        <form className="rw-form rw-form-grid" onSubmit={onSubmit}>
          <label>
            Name
            <input name="name" required placeholder="e.g. Linen shirt" />
          </label>
          <label>
            SKU (optional)
            <input name="sku" placeholder="Auto-generated if empty" />
          </label>
          <label>
            Category
            <input name="category" placeholder="e.g. Apparel" />
          </label>
          <label>
            Price (USD)
            <input name="price" type="number" min="0" step="0.01" required defaultValue="29.99" />
          </label>
          <label>
            Stock
            <input name="stock" type="number" min="0" step="1" required defaultValue="10" />
          </label>
          <label className="rw-form-span-2">
            Description
            <textarea name="description" rows={3} placeholder="Short description for product detail page" />
          </label>
          <label className="rw-form-span-2">
            Badges (optional, comma-separated)
            <input name="badges" placeholder="e.g. New, Sale" />
          </label>
          <button className="rw-btn rw-btn-primary" type="submit">
            Add to catalog
          </button>
        </form>
      </section>

      <section className="rw-panel">
        <div className="rw-panel-title">Custom products ({rows.length})</div>
        {rows.length === 0 ? (
          <div className="rw-muted">No admin-added products yet.</div>
        ) : (
          <div className="rw-table rw-table-admin">
            <div className="rw-table-head">
              <div>Name</div>
              <div>SKU</div>
              <div>Price</div>
              <div>Stock</div>
              <div></div>
            </div>
            {rows.map((p) => (
              <div key={p.id} className="rw-table-row">
                <div>
                  <div className="rw-card-title">{p.name}</div>
                  <div className="rw-muted">{p.category}</div>
                </div>
                <div className="rw-muted">{p.sku}</div>
                <div>{money(p.price)}</div>
                <div>{p.stock}</div>
                <div>
                  <button type="button" className="rw-btn rw-btn-ghost" onClick={() => onRemove(p.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rw-panel">
        <div className="rw-panel-title">Access controls</div>
        <div className="rw-table">
          <div className="rw-table-head">
            <div>Permission</div>
            <div>Status</div>
            <div>Notes</div>
            <div></div>
          </div>
          <div className="rw-table-row">
            <div>Feature flags</div>
            <div className="rw-ok">Enabled</div>
            <div className="rw-muted">Managed in Settings</div>
            <div />
          </div>
          <div className="rw-table-row">
            <div>Insights</div>
            <div className={featureFlags.adminInsights ? 'rw-ok' : 'rw-danger'}>
              {featureFlags.adminInsights ? 'Enabled' : 'Disabled'}
            </div>
            <div className="rw-muted">Controlled by a feature flag</div>
            <div />
          </div>
        </div>
      </section>

      <section className="rw-panel">
        <div className="rw-panel-title">Insights</div>
        {featureFlags.adminInsights ? (
          <div className="rw-success">Insights loaded: last 24h sales trend looks healthy.</div>
        ) : (
          <div className="rw-alert">Insights are hidden because the feature is disabled.</div>
        )}
      </section>
    </div>
  )
}
