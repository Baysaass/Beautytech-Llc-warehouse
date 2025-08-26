const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  console.log("🔄 Setting up database...")

  try {
    // Create admin user
    const adminPassword = await bcrypt.hash("admin2024!", 10)
    const admin = await prisma.user.upsert({
      where: { username: "admin_manager" },
      update: {},
      create: {
        username: "admin_manager",
        password: adminPassword,
        role: "admin",
        name: "Захирал",
      },
    })

    // Create accountant user
    const accountantPassword = await bcrypt.hash("account2024!", 10)
    const accountant = await prisma.user.upsert({
      where: { username: "accountant" },
      update: {},
      create: {
        username: "accountant",
        password: accountantPassword,
        role: "seller",
        name: "Нягтлан бодогч",
      },
    })

    // Create seller user
    const sellerPassword = await bcrypt.hash("seller2024!", 10)
    const seller = await prisma.user.upsert({
      where: { username: "seller_staff" },
      update: {},
      create: {
        username: "seller_staff",
        password: sellerPassword,
        role: "seller",
        name: "Худалдагч",
      },
    })

    // Create sample products
    const products = [
      {
        name: "Гоо сайхны тос",
        category: "Арьс арчилгаа",
        price: 25000,
        stock: 50,
        minStock: 10,
        expiryDate: new Date("2025-12-31"),
      },
      {
        name: "Шампунь",
        category: "Үс арчилгаа",
        price: 15000,
        stock: 30,
        minStock: 5,
        expiryDate: new Date("2025-06-30"),
      },
      {
        name: "Будаг",
        category: "Гоо сайхан",
        price: 35000,
        stock: 20,
        minStock: 3,
        expiryDate: new Date("2024-12-31"),
      },
    ]

    for (const product of products) {
      await prisma.product.upsert({
        where: { name: product.name },
        update: {},
        create: product,
      })
    }

    console.log("✅ Database setup completed!")
    console.log("👤 Захирал нэвтрэх: admin_manager / admin2024!")
    console.log("👤 Нягтлан нэвтрэх: accountant / account2024!")
    console.log("👤 Худалдагч нэвтрэх: seller_staff / seller2024!")
  } catch (error) {
    console.error("❌ Database setup failed:", error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
