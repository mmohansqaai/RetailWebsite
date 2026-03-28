import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiGetProduct } from '../api/api'
import { useCartStore } from '../stores/cartStore'
import { useSettingsStore } from '../stores/settingsStore'

function money(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n)
}

export function ProductDetailsPage() {
  const { productId } = useParams()
  const addItem = useCartStore((s) => s.addItem)
  const testingMode = useSettingsStore((s) => s.settings.testingMode)

  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [product, setProduct] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setStatus('loading')
      setError('')
      try {
        const p = await apiGetProduct(productId)
        if (!cancelled) {
          setProduct(p)
          setStatus('ready')
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Failed to load product')
          setStatus('error')
        }
      }
    }
    const t = setTimeout(load, 350 + Math.random() * 400)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [productId])

  if (status === 'loading') return <div className="rw-skeleton">Loading product…</div>
  if (status === 'error') return <div className="rw-alert">{error}</div>
  if (!product) return <div className="rw-alert">Not found</div>

  return (
    <div className="rw-page">
      <div className="rw-page-head">
        <div>
          <div className="rw-eyebrow">Product</div>
          <h2 className="rw-h2">{product.name}</h2>
          <div className="rw-muted">{product.category} · {product.sku}</div>
        </div>
        <Link className="rw-btn rw-btn-ghost" to="/app/products">Back to products</Link>
      </div>

      <section className={testingMode ? `rw-panel pd-${Math.floor(Math.random() * 30)}` : 'rw-panel'}>
        <div className="rw-grid-two">
          <div>
            <div className="rw-price big">{money(product.price)}</div>
            <div className="rw-muted">Rating {product.rating} · {product.reviewCount} reviews</div>
            <p className="rw-paragraph">{product.description}</p>
          </div>
          <div className="rw-checkout-box">
            <div className="rw-row-between">
              <div className="rw-muted">Availability</div>
              <div className={product.stock === 0 ? 'rw-danger' : 'rw-ok'}>
                {product.stock === 0 ? 'Out of stock' : `${product.stock} in stock`}
              </div>
            </div>
            <button
              className="rw-btn rw-btn-primary"
              disabled={product.stock === 0}
              id={testingMode ? `add_${Math.random().toString(36).slice(2, 7)}` : 'add-to-cart'}
              onClick={() => addItem({ id: product.id, name: product.name, price: product.price }, 1)}
            >
              {product.stock === 0 ? 'Unavailable' : (testingMode && Date.now() % 2 ? 'Add item' : 'Add to cart')}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

