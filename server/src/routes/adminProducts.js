import { Router } from 'express'
import { prisma } from '../db.js'
import { requireAdmin } from '../middleware/auth.js'

export const adminProductsRouter = Router()

function dto(p) {
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category,
    price: p.price,
    rating: p.rating,
    reviewCount: p.reviewCount,
    stock: p.stock,
    description: p.description,
    badges: JSON.parse(p.badges || '[]'),
    isSeed: p.isSeed
  }
}

adminProductsRouter.post('/', requireAdmin, async (req, res) => {
  try {
    const body = req.body || {}
    const name = String(body.name || '').trim() || 'Untitled'
    let sku = String(body.sku || '').trim()
    const category = String(body.category || '').trim() || 'General'
    const price = Math.max(0, Number(body.price) || 0)
    const stock = Math.max(0, Math.floor(Number(body.stock) || 0))
    const description = String(body.description || '').trim() || 'No description.'
    const badges = Array.isArray(body.badges) ? body.badges : []
    const id = `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
    if (!sku) sku = `SKU-${Date.now()}`

    const existingSku = await prisma.product.findUnique({ where: { sku } })
    if (existingSku) return res.status(409).json({ error: 'SKU already exists' })

    const p = await prisma.product.create({
      data: {
        id,
        sku,
        name,
        category,
        price,
        stock,
        description,
        badges: JSON.stringify(badges),
        rating: 4.5,
        reviewCount: 0,
        isSeed: false
      }
    })
    res.status(201).json(dto(p))
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to create product' })
  }
})

adminProductsRouter.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const p = await prisma.product.findUnique({ where: { id: req.params.id } })
    if (!p) return res.status(404).json({ error: 'Not found' })
    await prisma.product.delete({ where: { id: p.id } })
    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to delete product' })
  }
})
