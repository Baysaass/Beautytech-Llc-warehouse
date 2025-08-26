const ExcelJS = require("exceljs")
const jsPDF = require("jspdf")
require("jspdf-autotable")
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

class ExportController {
  // Export products to Excel
  static async exportProductsExcel(req, res) {
    try {
      const products = await prisma.product.findMany({
        orderBy: { name: "asc" },
      })

      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet("Бүтээгдэхүүн")

      // Set column headers
      worksheet.columns = [
        { header: "Нэр", key: "name", width: 25 },
        { header: "Ангилал", key: "category", width: 20 },
        { header: "Үнэ", key: "price", width: 15 },
        { header: "Нөөц", key: "stock", width: 10 },
        { header: "Хамгийн бага нөөц", key: "minStock", width: 15 },
        { header: "Дуусах хугацаа", key: "expiryDate", width: 20 },
        { header: "Үүсгэсэн огноо", key: "createdAt", width: 20 },
      ]

      // Style header row
      worksheet.getRow(1).font = { bold: true }
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE6E6FA" },
      }

      // Add data rows
      products.forEach((product) => {
        const fourMonthsFromNow = new Date()
        fourMonthsFromNow.setMonth(fourMonthsFromNow.getMonth() + 4)

        const row = worksheet.addRow({
          name: product.name,
          category: product.category,
          price: product.price,
          stock: product.stock,
          minStock: product.minStock,
          expiryDate: product.expiryDate ? product.expiryDate.toLocaleDateString("mn-MN") : "Тодорхойгүй",
          createdAt: product.createdAt.toLocaleDateString("mn-MN"),
        })

        // Highlight expiring products
        if (product.expiryDate && product.expiryDate <= fourMonthsFromNow) {
          row.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFFF00" }, // Yellow
          }
        }

        // Highlight low stock
        if (product.stock <= product.minStock) {
          row.getCell("stock").fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFF6B6B" }, // Red
          }
        }
      })

      // Set response headers
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=products_${new Date().toISOString().split("T")[0]}.xlsx`,
      )

      // Write to response
      await workbook.xlsx.write(res)
      res.end()
    } catch (error) {
      console.error("Export products Excel error:", error)
      res.status(500).json({ error: "Экспорт хийхэд алдаа гарлаа" })
    }
  }

  // Export sales to Excel
  static async exportSalesExcel(req, res) {
    try {
      const { startDate, endDate, userId } = req.query

      const whereClause = {}
      if (startDate || endDate) {
        whereClause.createdAt = {}
        if (startDate) whereClause.createdAt.gte = new Date(startDate)
        if (endDate) whereClause.createdAt.lte = new Date(endDate)
      }

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

      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet("Борлуулалт")

      // Set column headers
      worksheet.columns = [
        { header: "Огноо", key: "date", width: 20 },
        { header: "Бүтээгдэхүүн", key: "product", width: 25 },
        { header: "Ангилал", key: "category", width: 20 },
        { header: "Тоо ширхэг", key: "quantity", width: 12 },
        { header: "Нийт үнэ", key: "totalPrice", width: 15 },
        { header: "Төлбөрийн хэрэгсэл", key: "paymentMethod", width: 18 },
        { header: "Хүргэлтийн төрөл", key: "deliveryType", width: 18 },
        { header: "Худалдагч", key: "seller", width: 20 },
      ]

      // Style header row
      worksheet.getRow(1).font = { bold: true }
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE6E6FA" },
      }

      // Payment method translations
      const paymentMethodMap = {
        cash: "Бэлэн мөнгө",
        card: "Карт",
        transfer: "Шилжүүлэг",
        other: "Бусад",
      }

      // Delivery type translations
      const deliveryTypeMap = {
        pickup: "Биеэр авсан",
        delivery: "Хүргэлтээр авсан",
      }

      // Add data rows
      sales.forEach((sale) => {
        worksheet.addRow({
          date: sale.createdAt.toLocaleString("mn-MN"),
          product: sale.product.name,
          category: sale.product.category,
          quantity: sale.quantity,
          totalPrice: sale.totalPrice,
          paymentMethod: paymentMethodMap[sale.paymentMethod] || sale.paymentMethod,
          deliveryType: deliveryTypeMap[sale.deliveryType] || sale.deliveryType,
          seller: sale.user.name,
        })
      })

      // Add summary row
      const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalPrice, 0)
      const summaryRow = worksheet.addRow({
        date: "НИЙТ:",
        product: "",
        category: "",
        quantity: sales.reduce((sum, sale) => sum + sale.quantity, 0),
        totalPrice: totalRevenue,
        paymentMethod: "",
        deliveryType: "",
        seller: "",
      })
      summaryRow.font = { bold: true }
      summaryRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD3D3D3" },
      }

      // Set response headers
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      res.setHeader("Content-Disposition", `attachment; filename=sales_${new Date().toISOString().split("T")[0]}.xlsx`)

      // Write to response
      await workbook.xlsx.write(res)
      res.end()
    } catch (error) {
      console.error("Export sales Excel error:", error)
      res.status(500).json({ error: "Экспорт хийхэд алдаа гарлаа" })
    }
  }

  // Export products to PDF
  static async exportProductsPDF(req, res) {
    try {
      const products = await prisma.product.findMany({
        orderBy: { name: "asc" },
      })

      const doc = new jsPDF()

      // Add title
      doc.setFontSize(16)
      doc.text("Бүтээгдэхүүний жагсаалт", 20, 20)

      // Add date
      doc.setFontSize(10)
      doc.text(`Огноо: ${new Date().toLocaleDateString("mn-MN")}`, 20, 30)

      // Prepare table data
      const tableData = products.map((product) => [
        product.name,
        product.category,
        product.price.toLocaleString(),
        product.stock.toString(),
        product.minStock.toString(),
        product.expiryDate ? product.expiryDate.toLocaleDateString("mn-MN") : "Тодорхойгүй",
      ])

      // Add table
      doc.autoTable({
        head: [["Нэр", "Ангилал", "Үнэ", "Нөөц", "Хамгийн бага", "Дуусах хугацаа"]],
        body: tableData,
        startY: 40,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [230, 230, 250] },
        didParseCell: (data) => {
          // Highlight expiring products
          if (data.section === "body") {
            const product = products[data.row.index]
            const fourMonthsFromNow = new Date()
            fourMonthsFromNow.setMonth(fourMonthsFromNow.getMonth() + 4)

            if (product.expiryDate && product.expiryDate <= fourMonthsFromNow) {
              data.cell.styles.fillColor = [255, 255, 0] // Yellow
            }
            if (product.stock <= product.minStock && data.column.index === 3) {
              data.cell.styles.fillColor = [255, 107, 107] // Red
            }
          }
        },
      })

      // Set response headers
      res.setHeader("Content-Type", "application/pdf")
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=products_${new Date().toISOString().split("T")[0]}.pdf`,
      )

      // Send PDF
      const pdfBuffer = Buffer.from(doc.output("arraybuffer"))
      res.send(pdfBuffer)
    } catch (error) {
      console.error("Export products PDF error:", error)
      res.status(500).json({ error: "PDF экспорт хийхэд алдаа гарлаа" })
    }
  }

  // Export sales to PDF
  static async exportSalesPDF(req, res) {
    try {
      const { startDate, endDate, userId } = req.query

      const whereClause = {}
      if (startDate || endDate) {
        whereClause.createdAt = {}
        if (startDate) whereClause.createdAt.gte = new Date(startDate)
        if (endDate) whereClause.createdAt.lte = new Date(endDate)
      }

      if (req.user.role === "seller") {
        whereClause.userId = req.user.id
      } else if (userId) {
        whereClause.userId = userId
      }

      const sales = await prisma.sale.findMany({
        where: whereClause,
        include: {
          product: { select: { name: true, category: true } },
          user: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      })

      const doc = new jsPDF()

      // Add title
      doc.setFontSize(16)
      doc.text("Борлуулалтын тайлан", 20, 20)

      // Add date range
      doc.setFontSize(10)
      let dateRange = `Огноо: ${new Date().toLocaleDateString("mn-MN")}`
      if (startDate || endDate) {
        dateRange += ` (${startDate || "..."} - ${endDate || "..."})`
      }
      doc.text(dateRange, 20, 30)

      // Payment method translations
      const paymentMethodMap = {
        cash: "Бэлэн",
        card: "Карт",
        transfer: "Шилжүүлэг",
        other: "Бусад",
      }

      const deliveryTypeMap = {
        pickup: "Биеэр",
        delivery: "Хүргэлт",
      }

      // Prepare table data
      const tableData = sales.map((sale) => [
        sale.createdAt.toLocaleDateString("mn-MN"),
        sale.product.name,
        sale.quantity.toString(),
        sale.totalPrice.toLocaleString(),
        paymentMethodMap[sale.paymentMethod] || sale.paymentMethod,
        deliveryTypeMap[sale.deliveryType] || sale.deliveryType,
        sale.user.name,
      ])

      // Add summary
      const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalPrice, 0)
      tableData.push([
        "НИЙТ:",
        "",
        sales.reduce((sum, sale) => sum + sale.quantity, 0).toString(),
        totalRevenue.toLocaleString(),
        "",
        "",
        "",
      ])

      // Add table
      doc.autoTable({
        head: [["Огноо", "Бүтээгдэхүүн", "Тоо", "Үнэ", "Төлбөр", "Хүргэлт", "Худалдагч"]],
        body: tableData,
        startY: 40,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [230, 230, 250] },
        didParseCell: (data) => {
          // Highlight summary row
          if (data.section === "body" && data.row.index === tableData.length - 1) {
            data.cell.styles.fontStyle = "bold"
            data.cell.styles.fillColor = [211, 211, 211]
          }
        },
      })

      // Set response headers
      res.setHeader("Content-Type", "application/pdf")
      res.setHeader("Content-Disposition", `attachment; filename=sales_${new Date().toISOString().split("T")[0]}.pdf`)

      // Send PDF
      const pdfBuffer = Buffer.from(doc.output("arraybuffer"))
      res.send(pdfBuffer)
    } catch (error) {
      console.error("Export sales PDF error:", error)
      res.status(500).json({ error: "PDF экспорт хийхэд алдаа гарлаа" })
    }
  }

  // Export stock movements to Excel
  static async exportStockMovementsExcel(req, res) {
    try {
      const { startDate, endDate, productId } = req.query

      const whereClause = {}
      if (startDate || endDate) {
        whereClause.createdAt = {}
        if (startDate) whereClause.createdAt.gte = new Date(startDate)
        if (endDate) whereClause.createdAt.lte = new Date(endDate)
      }
      if (productId) whereClause.productId = productId

      const movements = await prisma.stockMovement.findMany({
        where: whereClause,
        include: {
          product: { select: { name: true, category: true } },
        },
        orderBy: { createdAt: "desc" },
      })

      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet("Нөөцийн хөдөлгөөн")

      // Set column headers
      worksheet.columns = [
        { header: "Огноо", key: "date", width: 20 },
        { header: "Бүтээгдэхүүн", key: "product", width: 25 },
        { header: "Ангилал", key: "category", width: 20 },
        { header: "Төрөл", key: "type", width: 15 },
        { header: "Тоо ширхэг", key: "quantity", width: 12 },
        { header: "Шалтгаан", key: "reason", width: 30 },
      ]

      // Style header row
      worksheet.getRow(1).font = { bold: true }
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE6E6FA" },
      }

      // Add data rows
      movements.forEach((movement) => {
        const row = worksheet.addRow({
          date: movement.createdAt.toLocaleString("mn-MN"),
          product: movement.product.name,
          category: movement.product.category,
          type: movement.type === "in" ? "Орлого" : "Зарлага",
          quantity: movement.quantity,
          reason: movement.reason,
        })

        // Color code by type
        if (movement.type === "in") {
          row.getCell("type").fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF90EE90" }, // Light green
          }
        } else {
          row.getCell("type").fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFA07A" }, // Light salmon
          }
        }
      })

      // Set response headers
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=stock_movements_${new Date().toISOString().split("T")[0]}.xlsx`,
      )

      // Write to response
      await workbook.xlsx.write(res)
      res.end()
    } catch (error) {
      console.error("Export stock movements Excel error:", error)
      res.status(500).json({ error: "Экспорт хийхэд алдаа гарлаа" })
    }
  }
}

module.exports = ExportController


