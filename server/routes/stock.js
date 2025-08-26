const express = require("express")
const StockController = require("../controllers/stockController")
const { authenticateToken, requireAdmin } = require("../middleware/auth")

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

// Get stock movements
router.get("/movements", StockController.getStockMovements)

// Get returns
router.get("/returns", StockController.getReturns)

// Admin only routes
router.post("/movements", requireAdmin, StockController.createStockMovement)
router.post("/returns", requireAdmin, StockController.createReturn)

module.exports = router
