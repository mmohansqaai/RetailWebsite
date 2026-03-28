import { Router } from 'express'
import { prisma } from '../db.js'

export const productsRouter = Router()

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

productsRouter.get('/', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim().toLowerCase()
    const list = await prisma.product.findMany({ orderBy: { name: 'asc' } })
    const filtered = q
      ? list.filter(
          (p) =>
            p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
        )
      : list
    res.json(filtered.map(dto))
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to list products' })
  }
})

productsRouter.get('/:id', async (req, res) => {
  try {
    const p = await prisma.product.findUnique({ where: { id: req.params.id } })
    if (!p) return res.status(404).json({ error: 'Not found' })
    res.json(dto(p))
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to load product' })
  }
})
