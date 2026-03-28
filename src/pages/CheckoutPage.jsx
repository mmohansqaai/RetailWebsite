import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiPlaceOrder } from '../api/api'
import { useAuthStore } from '../stores/authStore'
import { useCartStore } from '../stores/cartStore'
import { useSettingsStore } from '../stores/settingsStore'

function money(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n)
}

const DEFAULT_FLAGS = {
  quickCheckout: true,
  adminInsights: true,
  recommendations: false
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.session?.token)
  const items = useCartStore((s) => s.items)
  const clear = useCartStore((s) => s.clear)
  const settings = useSettingsStore((s) => s.settings)
  const featureFlags = { ...DEFAULT_FLAGS, ...settings?.featureFlags }
  const testingMode = Boolean(settings?.testingMode)

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0)
    const shipping = subtotal > 120 ? 0 : subtotal === 0 ? 0 : 8
    const tax = Math.round(subtotal * 0.0825 * 100) / 100
    const total = Math.round((subtotal + shipping + tax) * 100) / 100
    return { subtotal, shipping, tax, total }
  }, [items])

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [placed, setPlaced] = useState(null)

  const disabled = useMemo(
    () => items.length === 0 || !featureFlags.quickCheckout || busy,
    [items.length, featureFlags.quickCheckout, busy]
  )

  async function submit(e) {
    e.preventDefault()
    setError('')
    setPlaced(null)
    const form = new FormData(e.currentTarget)
    const shipping = {
      name: String(form.get('name') || ''),
      address1: String(form.get('address1') || ''),
      city: String(form.get('city') || ''),
      postal: String(form.get('postal') || '')
    }
    setBusy(true)
    try {
      const payload = {
        items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
        shipping
      }
      const order = await apiPlaceOrder(payload, token)
      setPlaced(order)
      clear()
    } catch (err) {
      setError(err?.message || 'Payment failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rw-page">
      <div className="rw-page-head">
        <div>
          <div className="rw-eyebrow">Checkout</div>
          <h2 className="rw-h2">{testingMode && Date.now() % 2 ? 'Secure checkout' : 'Checkout'}</h2>
          <div className="rw-muted">Orders are submitted to the backend API and stored in the database.</div>
        </div>
        <button className="rw-btn rw-btn-ghost" onClick={() => navigate('/app/cart')}>Back to cart</button>
      </div>

      {!featureFlags.quickCheckout ? (
        <div className="rw-alert">Quick checkout is disabled by a feature flag in Settings.</div>
      ) : null}

      {items.length === 0 ? (
        <div className="rw-alert">Your cart is empty. Add items before checking out.</div>
      ) : null}

      {error ? <div className="rw-alert">{error}</div> : null}
      {placed ? (
        <div className="rw-success">
          Order <strong>{placed.id}</strong> confirmed.
        </div>
      ) : null}

      <div className="rw-grid-two">
        <section className="rw-panel">
          <div className="rw-panel-title">Shipping</div>
          <form className="rw-form" onSubmit={submit}>
            <label>
              Full name
              <input name="name" defaultValue="Alex Johnson" required />
            </label>
            <label>
              Address
              <input name="address1" defaultValue="100 Market St" required />
            </label>
            <div className="rw-row">
              <label style={{ flex: 1 }}>
                City
                <input name="city" defaultValue="San Francisco" required />
              </label>
              <label style={{ width: 180 }}>
                Postal
                <input name="postal" defaultValue="94105" required />
              </label>
            </div>

            <button
              className="rw-btn rw-btn-primary"
              disabled={disabled}
              id={testingMode ? `pay_${Math.random().toString(36).slice(2, 7)}` : 'place-order'}
            >
              {busy ? 'Placing order…' : `Pay ${money(totals.total)}`}
            </button>
          </form>
        </section>

        <aside className="rw-panel rw-summary">
          <div className="rw-panel-title">Order summary</div>
          <div className="rw-row-between"><span className="rw-muted">Subtotal</span><span>{money(totals.subtotal)}</span></div>
          <div className="rw-row-between"><span className="rw-muted">Shipping</span><span>{money(totals.shipping)}</span></div>
          <div className="rw-row-between"><span className="rw-muted">Tax</span><span>{money(totals.tax)}</span></div>
          <div className="rw-divider" />
          <div className="rw-row-between"><span className="rw-card-title">Total</span><span className="rw-price big">{money(totals.total)}</span></div>
        </aside>
      </div>
    </div>
  )
}

