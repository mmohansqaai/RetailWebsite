import { Router } from 'express'
import { prisma } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

export const ordersRouter = Router()

ordersRouter.post('/', requireAuth, async (req, res) => {
  try {
    const items = req.body?.items
    const shipping = req.body?.shipping
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' })
    }
    if (!shipping?.address1) {
      return res.status(400).json({ error: 'Missing shipping address' })
    }

    const userId = req.user.sub

    const merged = new Map()
    for (const line of items) {
      const productId = line.productId
      const qty = Math.max(1, Math.floor(Number(line.qty) || 0))
      merged.set(productId, (merged.get(productId) || 0) + qty)
    }

    const result = await prisma.$transaction(async (tx) => {
      let subtotal = 0
      const lineData = []

      for (const [productId, qty] of merged) {
        const product = await tx.product.findUnique({ where: { id: productId } })
        if (!product) throw new Error(`Product not found: ${productId}`)
        if (product.stock < qty) throw new Error(`Insufficient stock for ${product.name}`)
        const unitPrice = product.price
        subtotal += unitPrice * qty
        lineData.push({ product, qty, unitPrice })
      }

      const shippingCost = subtotal > 120 ? 0 : 8
      const tax = Math.round(subtotal * 0.0825 * 100) / 100
      const total = Math.round((subtotal + shippingCost + tax) * 100) / 100

      for (const { product, qty } of lineData) {
        await tx.product.update({
          where: { id: product.id },
          data: { stock: product.stock - qty }
        })
      }

      const order = await tx.order.create({
        data: {
          userId,
          total,
          status: 'confirmed',
          shippingJson: JSON.stringify(shipping),
          lines: {
            create: lineData.map(({ product, qty, unitPrice }) => ({
              productId: product.id,
              qty,
              unitPrice
            }))
          }
        }
      })

      return order
    })

    res.json({
      id: result.id,
      status: result.status,
      createdAt: result.createdAt.getTime()
    })
  } catch (e) {
    console.error(e)
    const msg = e?.message || 'Order failed'
    if (msg.includes('not found') || msg.includes('Insufficient')) {
      return res.status(400).json({ error: msg })
    }
    res.status(500).json({ error: 'Order failed' })
  }
})
