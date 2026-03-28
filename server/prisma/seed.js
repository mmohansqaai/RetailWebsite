import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const SEED_PRODUCTS = [
  {
    id: 'p-101',
    sku: 'SHOE-URB-101',
    name: 'Urban Runner Shoes',
    category: 'Footwear',
    price: 79,
    rating: 4.3,
    reviewCount: 142,
    stock: 9,
    description: 'Lightweight city shoes for daily wear.',
    badges: JSON.stringify(['Bestseller'])
  },
  {
    id: 'p-102',
    sku: 'AUD-NC-102',
    name: 'Noise-Cancel Headphones',
    category: 'Electronics',
    price: 149,
    rating: 4.6,
    reviewCount: 581,
    stock: 0,
    description: 'Wireless headphones with active noise cancellation.',
    badges: JSON.stringify(['Popular'])
  },
  {
    id: 'p-103',
    sku: 'HOME-LAMP-103',
    name: 'Minimal Desk Lamp',
    category: 'Home',
    price: 39,
    rating: 4.1,
    reviewCount: 88,
    stock: 14,
    description: 'Adjustable desk lamp with warm and cool light.',
    badges: JSON.stringify([])
  },
  {
    id: 'p-104',
    sku: 'BAG-CLSC-104',
    name: 'Classic Backpack',
    category: 'Accessories',
    price: 59,
    rating: 4.4,
    reviewCount: 211,
    stock: 4,
    description: 'Compact backpack with laptop sleeve.',
    badges: JSON.stringify(['Limited'])
  },
  {
    id: 'p-105',
    sku: 'FIT-H2O-105',
    name: 'Smart Water Bottle',
    category: 'Fitness',
    price: 29,
    rating: 4.0,
    reviewCount: 64,
    stock: 18,
    description: 'Hydration reminders and temperature display.',
    badges: JSON.stringify([])
  }
]

async function main() {
  await prisma.orderLine.deleteMany()
  await prisma.order.deleteMany()
  await prisma.product.deleteMany()
  await prisma.user.deleteMany()

  const hash = await bcrypt.hash('password123', 10)
  const adminHash = await bcrypt.hash('admin123', 10)

  await prisma.user.createMany({
    data: [
      {
        email: 'test@demo.com',
        passwordHash: hash,
        name: 'test',
        role: 'customer'
      },
      {
        email: 'admin@demo.com',
        passwordHash: adminHash,
        name: 'Admin',
        role: 'admin'
      }
    ]
  })

  for (const p of SEED_PRODUCTS) {
    await prisma.product.create({
      data: { ...p, isSeed: true }
    })
  }

  console.log('Seeded users: test@demo.com / password123, admin@demo.com / admin123')
  console.log(`Seeded ${SEED_PRODUCTS.length} products`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
