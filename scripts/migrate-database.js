const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function main() {
  console.log("🔄 Running database migrations...")

  // This script can be used for future database migrations
  // For now, it just ensures the database is properly connected

  try {
    await prisma.$connect()
    console.log("✅ Database connection successful!")

    // Check if tables exist
    const userCount = await prisma.user.count()
    const productCount = await prisma.product.count()

    console.log(`📊 Current database status:`)
    console.log(`   Users: ${userCount}`)
    console.log(`   Products: ${productCount}`)
  } catch (error) {
    console.error("❌ Database connection failed:", error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error("❌ Migration failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
