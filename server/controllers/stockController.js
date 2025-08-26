const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

class StockController {
  // Get stock movements
  static async getStockMovements(req, res) {
    try {
      const { productId, type, startDate, endDate } = req.query

      const whereClause = {}

      if (productId) whereClause.productId = productId
      if (type) whereClause.type = type
      if (startDate || endDate) {
        whereClause.createdAt = {}
        if (startDate) whereClause.createdAt.gte = new Date(startDate)
        if (endDate) whereClause.createdAt.lte = new Date(endDate)
      }

      const movements = await prisma.stockMovement.findMany({
        where: whereClause,
        include: {
          product: { select: { name: true, category: true } },
        },
        orderBy: { createdAt: "desc" },
      })

      res.json({
        success: true,
        movements,
      })
    } catch (error) {
      console.error("Get stock movements error:", error)
      res.status(500).json({ error: "Серверийн алдаа гарлаа" })
    }
  }

  // Create stock movement (Admin only)
  static async createStockMovement(req, res) {
    try {
      const { productId, type, quantity, reason } = req.body

      if (!productId || !type || !quantity || !reason) {
        return res.status(400).json({
          error: "Бүх шаардлагатай талбарыг бөглөнө үү",
        })
      }

      const product = await prisma.product.findUnique({
        where: { id: productId },
      })

      if (!product) {
        return res.status(404).json({ error: "Бүтээгдэхүүн олдсонгүй" })
      }

      // Check stock for outgoing movements
      if (type === "out" && product.stock < Number.parseInt(quantity)) {
        return res.status(400).json({
          error: "Хангалттай нөөц байхгүй байна",
        })
      }

      // Create movement
      const movement = await prisma.stockMovement.create({
        data: {
          productId,
          type,
          quantity: Number.parseInt(quantity),
          reason,
        },
        include: {
          product: { select: { name: true, category: true } },
        },
      })

      // Update product stock
      const newStock =
        type === "in" ? product.stock + Number.parseInt(quantity) : product.stock - Number.parseInt(quantity)

      await prisma.product.update({
        where: { id: productId },
        data: { stock: newStock },
      })

      res.status(201).json({
        success: true,
        movement,
        message: "Нөөцийн хөдөлгөөн амжилттай бүртгэгдлээ",
      })
    } catch (error) {
      console.error("Create stock movement error:", error)
      res.status(500).json({ error: "Серверийн алдаа гарлаа" })
    }
  }

  // Get returns
  static async getReturns(req, res) {
    try {
      const { productId, startDate, endDate } = req.query

      const whereClause = {}

      if (productId) whereClause.productId = productId
      if (startDate || endDate) {
        whereClause.createdAt = {}
        if (startDate) whereClause.createdAt.gte = new Date(startDate)
        if (endDate) whereClause.createdAt.lte = new Date(endDate)
      }

      const returns = await prisma.return.findMany({
        where: whereClause,
        include: {
          product: { select: { name: true, category: true } },
        },
        orderBy: { createdAt: "desc" },
      })

      res.json({
        success: true,
        returns,
      })
    } catch (error) {
      console.error("Get returns error:", error)
      res.status(500).json({ error: "Серверийн алдаа гарлаа" })
    }
  }

  // Create return (Admin only)
  static async createReturn(req, res) {
    try {
      const { productId, quantity, reason } = req.body

      if (!productId || !quantity || !reason) {
        return res.status(400).json({
          error: "Бүх шаардлагатай талбарыг бөглөнө үү",
        })
      }

      const product = await prisma.product.findUnique({
        where: { id: productId },
      })

      if (!product) {
        return res.status(404).json({ error: "Бүтээгдэхүүн олдсонгүй" })
      }

      // Create return
      const returnRecord = await prisma.return.create({
        data: {
          productId,
          quantity: Number.parseInt(quantity),
          reason,
        },
        include: {
          product: { select: { name: true, category: true } },
        },
      })

      // Update product stock (add back returned items)
      await prisma.product.update({
        where: { id: productId },
        data: { stock: product.stock + Number.parseInt(quantity) },
      })

      // Create stock movement
      await prisma.stockMovement.create({
        data: {
          productId,
          type: "in",
          quantity: Number.parseInt(quantity),
          reason: `Буцаалт: ${reason}`,
        },
      })

      res.status(201).json({
        success: true,
        return: returnRecord,
        message: "Буцаалт амжилттай бүртгэгдлээ",
      })
    } catch (error) {
      console.error("Create return error:", error)
      res.status(500).json({ error: "Серверийн алдаа гарлаа" })
    }
  }
}

module.exports = StockController
