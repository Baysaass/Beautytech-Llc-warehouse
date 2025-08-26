const express = require("express")
const ExportController = require("../controllers/exportController")
const { authenticateToken, requireAdmin } = require("../middleware/auth")

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

// Products export (Admin only)
router.get("/products/excel", requireAdmin, ExportController.exportProductsExcel)
router.get("/products/pdf", requireAdmin, ExportController.exportProductsPDF)

// Sales export (role-based access)
router.get("/sales/excel", ExportController.exportSalesExcel)
router.get("/sales/pdf", ExportController.exportSalesPDF)

// Stock movements export (Admin only)
router.get("/stock-movements/excel", requireAdmin, ExportController.exportStockMovementsExcel)

module.exports = router
