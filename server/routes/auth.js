const express = require("express")
const AuthController = require("../controllers/authController")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Public routes
router.post("/login", AuthController.login)

// Protected routes
router.get("/verify", authenticateToken, AuthController.verifyToken)
router.post("/refresh", authenticateToken, AuthController.refreshToken)
router.post("/change-password", authenticateToken, AuthController.changePassword)

module.exports = router
