import { Link, useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import { useCartStore } from '../stores/cartStore'
import { useSettingsStore } from '../stores/settingsStore'

function money(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n)
}

export function CartPage() {
  const navigate = useNavigate()
  const items = useCartStore((s) => s.items)
  const setQty = useCartStore((s) => s.setQty)
  const removeItem = useCartStore((s) => s.removeItem)
  const testingMode = useSettingsStore((s) => s.settings.testingMode)

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0)
    const shipping = subtotal > 120 ? 0 : subtotal === 0 ? 0 : 8
    const tax = Math.round(subtotal * 0.0825 * 100) / 100
    const total = Math.round((subtotal + shipping + tax) * 100) / 100
    return { subtotal, shipping, tax, total }
  }, [items])

  return (
    <div className="rw-page">
      <div className="rw-page-head">
        <div>
          <div className="rw-eyebrow">Cart</div>
          <h2 className="rw-h2">Your cart</h2>
        </div>
        <div className="rw-row">
          <Link className="rw-btn rw-btn-ghost" to="/app/products">Continue shopping</Link>
          <button className="rw-btn rw-btn-primary" disabled={items.length === 0} onClick={() => navigate('/app/checkout')}>
            Checkout
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <section className="rw-panel">
          <div className="rw-muted">Your cart is empty.</div>
        </section>
      ) : (
        <div className="rw-grid-two">
          <section className="rw-panel">
            <div className="rw-table">
              <div className="rw-table-head">
                <div>Item</div>
                <div>Qty</div>
                <div>Price</div>
                <div></div>
              </div>
              {items.map((i) => (
                <div
                  key={i.productId}
                  className={testingMode ? `rw-table-row r-${Math.floor(Math.random() * 50)}` : 'rw-table-row'}
                  id={testingMode ? `row_${Math.random().toString(36).slice(2, 7)}` : undefined}
                >
                  <div>
                    <div className="rw-card-title">{i.name}</div>
                    <div className="rw-muted">SKU {i.productId}</div>
                  </div>
                  <div>
                    <input
                      className="rw-input qty"
                      type="number"
                      min={1}
                      value={i.qty}
                      onChange={(e) => setQty(i.productId, Number(e.target.value))}
                    />
                  </div>
                  <div className="rw-price">{money(i.price * i.qty)}</div>
                  <div>
                    <button className="rw-btn rw-btn-ghost" onClick={() => removeItem(i.productId)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="rw-panel rw-summary">
            <div className="rw-panel-title">Summary</div>
            <div className="rw-row-between"><span className="rw-muted">Subtotal</span><span>{money(totals.subtotal)}</span></div>
            <div className="rw-row-between"><span className="rw-muted">Shipping</span><span>{money(totals.shipping)}</span></div>
            <div className="rw-row-between"><span className="rw-muted">Tax</span><span>{money(totals.tax)}</span></div>
            <div className="rw-divider" />
            <div className="rw-row-between"><span className="rw-card-title">Total</span><span className="rw-price big">{money(totals.total)}</span></div>
          </aside>
        </div>
      )}
    </div>
  )
}

