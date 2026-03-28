import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiListProducts } from '../api/api'
import { useCartStore } from '../stores/cartStore'
import { useSettingsStore } from '../stores/settingsStore'

function money(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n)
}

export function ProductsPage() {
  const addItem = useCartStore((s) => s.addItem)
  const testingMode = useSettingsStore((s) => s.settings.testingMode)

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [products, setProducts] = useState([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setStatus('loading')
      setError('')
      try {
        const data = await apiListProducts({ query })
        if (!cancelled) {
          setProducts(data)
          setStatus('ready')
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Failed to load products')
          setStatus('error')
        }
      }
    }
    const t = setTimeout(load, 250) // feel like real search debounce
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [query])

  useEffect(() => {
    function onCatalogChanged() {
      setStatus('loading')
      setError('')
      apiListProducts({ query })
        .then((data) => {
          setProducts(data)
          setStatus('ready')
        })
        .catch((err) => {
          setError(err?.message || 'Failed to load products')
          setStatus('error')
        })
    }
    window.addEventListener('nova-catalog-changed', onCatalogChanged)
    return () => window.removeEventListener('nova-catalog-changed', onCatalogChanged)
  }, [query])

  const headerText = useMemo(() => (testingMode && Date.now() % 2 === 0 ? 'Catalog' : 'Products'), [testingMode])

  return (
    <div className="rw-page">
      <div className="rw-page-head">
        <div>
          <div className="rw-eyebrow">Storefront</div>
          <h2 className="rw-h2">{headerText}</h2>
        </div>
        <div className="rw-row">
          <input
            className={testingMode ? `rw-input q-${Math.floor(Date.now() / 4000) % 5}` : 'rw-input'}
            placeholder="Search products, categories…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {status === 'loading' ? <div className="rw-skeleton">Fetching products…</div> : null}
      {status === 'error' ? <div className="rw-alert">{error}</div> : null}

      {status === 'ready' ? (
        <div className="rw-cards">
          {products.map((p) => (
            <article
              key={p.id}
              className={testingMode ? `rw-card c-${Math.floor(Math.random() * 90)}` : 'rw-card'}
              id={testingMode ? `p_${Math.random().toString(36).slice(2, 7)}` : undefined}
            >
              <div className="rw-card-top">
                <div>
                  <div className="rw-card-title">{p.name}</div>
                  <div className="rw-muted">{p.category} · {p.sku}</div>
                </div>
                <div className="rw-price">{money(p.price)}</div>
              </div>
              <div className="rw-badges">
                {p.badges?.map((b) => <span className="rw-badge" key={b}>{b}</span>)}
                {p.stock === 0 ? <span className="rw-badge danger">Out of stock</span> : null}
              </div>
              <div className="rw-card-actions">
                <Link className="rw-btn rw-btn-ghost" to={`/app/products/${p.id}`}>View</Link>
                <button
                  className="rw-btn rw-btn-primary"
                  disabled={p.stock === 0}
                  onClick={() => addItem({ id: p.id, name: p.name, price: p.price }, 1)}
                >
                  Add to cart
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  )
}

