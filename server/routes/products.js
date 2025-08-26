const express = require("express")
const ProductController = require("../controllers/productController")
const { authenticateToken, requireAdmin } = require("../middleware/auth")

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

// Get all products
router.get("/", ProductController.getAllProducts)

// Get single product
router.get("/:id", ProductController.getProduct)

// Admin only routes
router.post("/", requireAdmin, ProductController.createProduct)
router.put("/:id", requireAdmin, ProductController.updateProduct)
router.delete("/:id", requireAdmin, ProductController.deleteProduct)

module.exports = router
