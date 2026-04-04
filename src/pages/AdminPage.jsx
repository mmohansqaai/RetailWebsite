import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  apiCreateProduct,
  apiDeleteProduct,
  apiListProducts,
  apiRestockAll,
  apiUpdateProductStock
} from '../api/api'
import { useAuthStore } from '../stores/authStore'
import { useSettingsStore } from '../stores/settingsStore'

function money(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n)
}

export function AdminPage() {
  const token = useAuthStore((s) => s.session?.token)
  const { featureFlags } = useSettingsStore((s) => s.settings)
  const [catalog, setCatalog] = useState([])
  const [stockDrafts, setStockDrafts] = useState({})
  const [bulkStock, setBulkStock] = useState('50')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [bulkBusy, setBulkBusy] = useState(false)

  const loadCatalog = useCallback(async () => {
    const all = await apiListProducts()
    const sorted = [...all].sort((a, b) => a.name.localeCompare(b.name))
    setCatalog(sorted)
    setStockDrafts((prev) => {
      const next = { ...prev }
      for (const p of sorted) {
        if (next[p.id] === undefined) next[p.id] = String(p.stock)
      }
      for (const id of Object.keys(next)) {
        if (!sorted.some((p) => p.id === id)) delete next[id]
      }
      return next
    })
  }, [])

  useEffect(() => {
    loadCatalog().catch((e) => setErr(e?.message || 'Failed to load products'))
  }, [loadCatalog])

  const rows = useMemo(() => catalog, [catalog])

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
      await loadCatalog()
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
      await loadCatalog()
      setMsg('Product removed from the database.')
      window.dispatchEvent(new Event('nova-catalog-changed'))
    } catch (error) {
      setErr(error?.message || 'Could not remove product')
    }
  }

  async function onSaveStock(p) {
    setErr('')
    setMsg('')
    const raw = stockDrafts[p.id]
    const stock = Math.max(0, Math.floor(Number(raw) || 0))
    setBusyId(p.id)
    try {
      await apiUpdateProductStock(p.id, stock, token)
      await loadCatalog()
      setMsg(`Stock updated for ${p.name}.`)
      window.dispatchEvent(new Event('nova-catalog-changed'))
    } catch (error) {
      setErr(error?.message || 'Could not update stock')
    } finally {
      setBusyId(null)
    }
  }

  async function onRestockAll() {
    setErr('')
    setMsg('')
    const stock = Math.max(0, Math.floor(Number(bulkStock)))
    setBulkBusy(true)
    try {
      const result = await apiRestockAll(stock, token)
      await loadCatalog()
      setMsg(`Restocked ${result.updated ?? rows.length} products to ${stock} units each.`)
      window.dispatchEvent(new Event('nova-catalog-changed'))
    } catch (error) {
      setErr(error?.message || 'Could not restock catalog')
    } finally {
      setBulkBusy(false)
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
          New products are stored in the server database.
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
        <div className="rw-panel-title">Catalog inventory ({rows.length})</div>
        <p className="rw-muted" style={{ marginBottom: '0.75rem' }}>
          Adjust stock for any product (including seed data). Use after automation runs that place orders and
          deplete inventory.
        </p>
        <div className="rw-row" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <label className="rw-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Restock all to
            <input
              className="rw-input"
              type="number"
              min="0"
              step="1"
              value={bulkStock}
              onChange={(e) => setBulkStock(e.target.value)}
              style={{ width: '5rem' }}
            />
            units
          </label>
          <button
            type="button"
            className="rw-btn rw-btn-primary"
            disabled={bulkBusy}
            onClick={() => onRestockAll()}
          >
            {bulkBusy ? 'Applying…' : 'Apply to entire catalog'}
          </button>
        </div>
        {rows.length === 0 ? (
          <div className="rw-muted">No products in the database.</div>
        ) : (
          <div className="rw-table rw-table-admin">
            <div className="rw-table-head">
              <div>Product</div>
              <div>SKU</div>
              <div>Price</div>
              <div>Stock</div>
              <div></div>
            </div>
            {rows.map((p) => (
              <div key={p.id} className="rw-table-row">
                <div>
                  <div className="rw-card-title">
                    {p.name}
                    {p.isSeed ? <span className="rw-badge" style={{ marginLeft: '0.35rem' }}>Seed</span> : null}
                  </div>
                  <div className="rw-muted">{p.category}</div>
                </div>
                <div className="rw-muted">{p.sku}</div>
                <div>{money(p.price)}</div>
                <div>
                  <input
                    className="rw-input"
                    type="number"
                    min="0"
                    step="1"
                    aria-label={`Stock for ${p.name}`}
                    value={stockDrafts[p.id] ?? String(p.stock)}
                    onChange={(e) =>
                      setStockDrafts((d) => ({ ...d, [p.id]: e.target.value }))
                    }
                    style={{ width: '5rem' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="rw-btn rw-btn-primary"
                    disabled={busyId === p.id}
                    onClick={() => onSaveStock(p)}
                  >
                    {busyId === p.id ? 'Saving…' : 'Save'}
                  </button>
                  {p.isSeed ? null : (
                    <button type="button" className="rw-btn rw-btn-ghost" onClick={() => onRemove(p.id)}>
                      Remove
                    </button>
                  )}
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
