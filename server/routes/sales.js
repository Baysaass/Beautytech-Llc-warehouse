const express = require("express")
const SalesController = require("../controllers/salesController")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

// Get sales (filtered by role)
router.get("/", SalesController.getAllSales)

// Create sale
router.post("/", SalesController.createSale)

// Get sales statistics
router.get("/stats", SalesController.getSalesStats)

module.exports = router
