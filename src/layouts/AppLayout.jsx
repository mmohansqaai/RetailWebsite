import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { DemoBanner } from '../components/DemoBanner'
import { useAuthStore } from '../stores/authStore'
import { useCartStore } from '../stores/cartStore'

export function AppLayout() {
  const navigate = useNavigate()
  const session = useAuthStore((s) => s.session)
  const logout = useAuthStore((s) => s.logout)
  const items = useCartStore((s) => s.items)
  const cartCount = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items])
  const lastAdded = useCartStore((s) => s.lastAdded)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!lastAdded) return
    setToast({ name: lastAdded.name, qty: lastAdded.qty, at: lastAdded.at })
    const t = setTimeout(() => setToast(null), 1800)
    return () => clearTimeout(t)
  }, [lastAdded])

  return (
    <div className="rw-shell">
      <div className="rw-chrome">
        <DemoBanner />
        <header className="rw-topbar">
          <div className="rw-brand" role="banner">
            <div className="rw-logo">B</div>
            <div>
              <div className="rw-title">BayOne Retail</div>
              <div className="rw-subtitle">Demo storefront + ops workspace</div>
            </div>
          </div>
          <div className="rw-top-actions">
            <button className="rw-pill" onClick={() => navigate('/app/cart')}>Cart {cartCount}</button>
            <div className="rw-user">
              <div className="rw-user-name">{session?.user?.name}</div>
              <div className="rw-user-meta">{session?.user?.email} · {session?.user?.role}</div>
            </div>
            <button className="rw-btn rw-btn-ghost" onClick={logout}>Sign out</button>
          </div>
        </header>
      </div>

      <div className="rw-body">
        <aside className="rw-sidebar">
          <nav className="rw-nav" aria-label="Primary">
            <NavLink className="rw-nav-item" to="/app/dashboard">Dashboard</NavLink>
            <NavLink className="rw-nav-item" to="/app/products">Products</NavLink>
            <NavLink className="rw-nav-item" to="/app/cart">Cart</NavLink>
            <NavLink className="rw-nav-item" to="/app/checkout">Checkout</NavLink>
            <NavLink className="rw-nav-item" to="/app/settings">Settings</NavLink>
            {session?.user?.role === 'admin' ? (
              <NavLink className="rw-nav-item" to="/app/admin">Admin</NavLink>
            ) : null}
          </nav>
        </aside>

        <main className="rw-main">
          <Outlet />
        </main>
      </div>

      {toast ? (
        <div className="rw-toast" role="status" aria-live="polite">
          Added {toast.qty} × {toast.name} to cart
        </div>
      ) : null}
    </div>
  )
}

