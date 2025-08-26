const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

class ProductController {
  // Get all products
  static async getAllProducts(req, res) {
    try {
      const products = await prisma.product.findMany({
        orderBy: { createdAt: "desc" },
      })

      // Check for expiring products (within 4 months)
      const fourMonthsFromNow = new Date()
      fourMonthsFromNow.setMonth(fourMonthsFromNow.getMonth() + 4)

      const productsWithWarnings = products.map((product) => ({
        ...product,
        isExpiring: product.expiryDate && product.expiryDate <= fourMonthsFromNow,
        isExpired: product.expiryDate && product.expiryDate <= new Date(),
        isLowStock: product.stock <= product.minStock,
      }))

      res.json({
        success: true,
        products: productsWithWarnings,
      })
    } catch (error) {
      console.error("Get products error:", error)
      res.status(500).json({ error: "Серверийн алдаа гарлаа" })
    }
  }

  // Get single product
  static async getProduct(req, res) {
    try {
      const { id } = req.params

      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          sales: {
            include: { user: { select: { name: true } } },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          stockMovements: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          returns: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      })

      if (!product) {
        return res.status(404).json({ error: "Бүтээгдэхүүн олдсонгүй" })
      }

      res.json({
        success: true,
        product,
      })
    } catch (error) {
      console.error("Get product error:", error)
      res.status(500).json({ error: "Серверийн алдаа гарлаа" })
    }
  }

  // Create product (Admin only)
  static async createProduct(req, res) {
    try {
      const { name, category, price, stock, minStock, expiryDate } = req.body

      if (!name || !category || !price || stock === undefined || minStock === undefined) {
        return res.status(400).json({
          error: "Бүх шаардлагатай талбарыг бөглөнө үү",
        })
      }

      const product = await prisma.product.create({
        data: {
          name,
          category,
          price: Number.parseFloat(price),
          stock: Number.parseInt(stock),
          minStock: Number.parseInt(minStock),
          expiryDate: expiryDate ? new Date(expiryDate) : null,
        },
      })

      // Create stock movement record
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: "in",
          quantity: Number.parseInt(stock),
          reason: "Анхны бүртгэл",
        },
      })

      res.status(201).json({
        success: true,
        product,
        message: "Бүтээгдэхүүн амжилттай нэмэгдлээ",
      })
    } catch (error) {
      console.error("Create product error:", error)
      res.status(500).json({ error: "Серверийн алдаа гарлаа" })
    }
  }

  // Update product (Admin only)
  static async updateProduct(req, res) {
    try {
      const { id } = req.params
      const { name, category, price, stock, minStock, expiryDate } = req.body

      const existingProduct = await prisma.product.findUnique({
        where: { id },
      })

      if (!existingProduct) {
        return res.status(404).json({ error: "Бүтээгдэхүүн олдсонгүй" })
      }

      const product = await prisma.product.update({
        where: { id },
        data: {
          name,
          category,
          price: Number.parseFloat(price),
          stock: Number.parseInt(stock),
          minStock: Number.parseInt(minStock),
          expiryDate: expiryDate ? new Date(expiryDate) : null,
        },
      })

      // Create stock movement if stock changed
      if (Number.parseInt(stock) !== existingProduct.stock) {
        const difference = Number.parseInt(stock) - existingProduct.stock
        await prisma.stockMovement.create({
          data: {
            productId: product.id,
            type: difference > 0 ? "in" : "out",
            quantity: Math.abs(difference),
            reason: "Админ засварлалт",
          },
        })
      }

      res.json({
        success: true,
        product,
        message: "Бүтээгдэхүүн амжилттай шинэчлэгдлээ",
      })
    } catch (error) {
      console.error("Update product error:", error)
      res.status(500).json({ error: "Серверийн алдаа гарлаа" })
    }
  }

  // Delete product (Admin only)
  static async deleteProduct(req, res) {
    try {
      const { id } = req.params

      const product = await prisma.product.findUnique({
        where: { id },
      })

      if (!product) {
        return res.status(404).json({ error: "Бүтээгдэхүүн олдсонгүй" })
      }

      await prisma.product.delete({
        where: { id },
      })

      res.json({
        success: true,
        message: "Бүтээгдэхүүн амжилттай устгагдлаа",
      })
    } catch (error) {
      console.error("Delete product error:", error)
      res.status(500).json({ error: "Серверийн алдаа гарлаа" })
    }
  }
}

module.exports = ProductController
