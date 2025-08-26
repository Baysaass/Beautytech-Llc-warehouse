const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting database initialization...")

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10)
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: adminPassword,
      role: "admin",
      name: "Админ",
    },
  })

  // Create seller user
  const sellerPassword = await bcrypt.hash("seller123", 10)
  const seller = await prisma.user.upsert({
    where: { username: "seller" },
    update: {},
    create: {
      username: "seller",
      password: sellerPassword,
      role: "seller",
      name: "Худалдагч",
    },
  })

  // Create sample products
  const products = [
    {
      name: "Шампунь",
      category: "Үсний арчилгаа",
      price: 25000,
      stock: 50,
      minStock: 10,
      expiryDate: new Date("2025-12-31"),
    },
    {
      name: "Кондиционер",
      category: "Үсний арчилгаа",
      price: 30000,
      stock: 30,
      minStock: 5,
      expiryDate: new Date("2025-11-30"),
    },
    {
      name: "Нүүрний маск",
      category: "Арьсны арчилгаа",
      price: 15000,
      stock: 25,
      minStock: 8,
      expiryDate: new Date("2025-06-30"),
    },
    {
      name: "Хумсны будаг",
      category: "Гоо сайхны бүтээгдэхүүн",
      price: 12000,
      stock: 40,
      minStock: 10,
      expiryDate: new Date("2026-03-15"),
    },
    {
      name: "Үсний тос",
      category: "Үсний арчилгаа",
      price: 35000,
      stock: 20,
      minStock: 5,
      expiryDate: new Date("2025-09-30"),
    },
  ]

  for (const productData of products) {
    await prisma.product.upsert({
      where: { name: productData.name },
      update: {},
      create: productData,
    })
  }

  console.log("✅ Database initialized successfully!")
  console.log("👤 Admin user: admin / admin123")
  console.log("👤 Seller user: seller / seller123")
  console.log(`📦 Created ${products.length} sample products`)
}

main()
  .catch((e) => {
    console.error("❌ Error initializing database:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
