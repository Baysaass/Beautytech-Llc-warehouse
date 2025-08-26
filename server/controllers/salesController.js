const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

class SalesController {
  // Get all sales
  static async getAllSales(req, res) {
    try {
      const { startDate, endDate, userId } = req.query

      const whereClause = {}

      // Date filtering
      if (startDate || endDate) {
        whereClause.createdAt = {}
        if (startDate) whereClause.createdAt.gte = new Date(startDate)
        if (endDate) whereClause.createdAt.lte = new Date(endDate)
      }

      // User filtering (for seller role)
      if (req.user.role === "seller") {
        whereClause.userId = req.user.id
      } else if (userId) {
        whereClause.userId = userId
      }

      const sales = await prisma.sale.findMany({
        where: whereClause,
        include: {
          product: { select: { name: true, category: true } },
          user: { select: { name: true, username: true } },
        },
        orderBy: { createdAt: "desc" },
      })

      res.json({
        success: true,
        sales,
      })
    } catch (error) {
      console.error("Get sales error:", error)
      res.status(500).json({ error: "Серверийн алдаа гарлаа" })
    }
  }

  // Create sale
  static async createSale(req, res) {
    try {
      const { productId, quantity, paymentMethod, deliveryType } = req.body

      if (!productId || !quantity || !paymentMethod || !deliveryType) {
        return res.status(400).json({
          error: "Бүх шаардлагатай талбарыг бөглөнө үү",
        })
      }

      // Get product
      const product = await prisma.product.findUnique({
        where: { id: productId },
      })

      if (!product) {
        return res.status(404).json({ error: "Бүтээгдэхүүн олдсонгүй" })
      }

      // Check stock
      if (product.stock < Number.parseInt(quantity)) {
        return res.status(400).json({
          error: "Хангалттай нөөц байхгүй байна",
        })
      }

      // Check if product is expired
      if (product.expiryDate && product.expiryDate <= new Date()) {
        return res.status(400).json({
          error: "Дуусах хугацаа нь дууссан бүтээгдэхүүн зарах боломжгүй",
        })
      }

      const totalPrice = product.price * Number.parseInt(quantity)

      // Create sale
      const sale = await prisma.sale.create({
        data: {
          productId,
          userId: req.user.id,
          quantity: Number.parseInt(quantity),
          totalPrice,
          paymentMethod,
          deliveryType,
        },
        include: {
          product: { select: { name: true, category: true } },
          user: { select: { name: true } },
        },
      })

      // Update product stock
      await prisma.product.update({
        where: { id: productId },
        data: { stock: product.stock - Number.parseInt(quantity) },
      })

      // Create stock movement
      await prisma.stockMovement.create({
        data: {
          productId,
          type: "out",
          quantity: Number.parseInt(quantity),
          reason: "Борлуулалт",
        },
      })

      res.status(201).json({
        success: true,
        sale,
        message: "Борлуулалт амжилттай бүртгэгдлээ",
      })
    } catch (error) {
      console.error("Create sale error:", error)
      res.status(500).json({ error: "Серверийн алдаа гарлаа" })
    }
  }

  // Get sales statistics
  static async getSalesStats(req, res) {
    try {
      const { startDate, endDate } = req.query

      const whereClause = {}
      if (startDate || endDate) {
        whereClause.createdAt = {}
        if (startDate) whereClause.createdAt.gte = new Date(startDate)
        if (endDate) whereClause.createdAt.lte = new Date(endDate)
      }

      // Filter by user for sellers
      if (req.user.role === "seller") {
        whereClause.userId = req.user.id
      }

      const [totalSales, totalRevenue, salesByPayment, salesByDelivery] = await Promise.all([
        prisma.sale.count({ where: whereClause }),
        prisma.sale.aggregate({
          where: whereClause,
          _sum: { totalPrice: true },
        }),
        prisma.sale.groupBy({
          by: ["paymentMethod"],
          where: whereClause,
          _count: { _all: true },
          _sum: { totalPrice: true },
        }),
        prisma.sale.groupBy({
          by: ["deliveryType"],
          where: whereClause,
          _count: { _all: true },
          _sum: { totalPrice: true },
        }),
      ])

      res.json({
        success: true,
        stats: {
          totalSales,
          totalRevenue: totalRevenue._sum.totalPrice || 0,
          salesByPayment,
          salesByDelivery,
        },
      })
    } catch (error) {
      console.error("Get sales stats error:", error)
      res.status(500).json({ error: "Серверийн алдаа гарлаа" })
    }
  }
}

module.exports = SalesController
