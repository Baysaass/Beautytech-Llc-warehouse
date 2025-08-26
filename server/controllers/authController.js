const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

class AuthController {
  // Login user
  static async login(req, res) {
    try {
      const { username, password } = req.body

      if (!username || !password) {
        return res.status(400).json({
          error: "Нэвтрэх нэр болон нууц үг шаардлагатай",
        })
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { username },
      })

      if (!user) {
        return res.status(401).json({
          error: "Нэвтрэх нэр эсвэл нууц үг буруу байна",
        })
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password)
      if (!isValidPassword) {
        return res.status(401).json({
          error: "Нэвтрэх нэр эсвэл нууц үг буруу байна",
        })
      }

      // Generate token
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name,
        },
        JWT_SECRET,
        { expiresIn: "24h" },
      )

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name,
        },
      })
    } catch (error) {
      console.error("Login error:", error)
      res.status(500).json({ error: "Серверийн алдаа гарлаа" })
    }
  }

  // Verify token
  static async verifyToken(req, res) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          username: true,
          role: true,
          name: true,
          createdAt: true,
        },
      })

      if (!user) {
        return res.status(404).json({ error: "Хэрэглэгч олдсонгүй" })
      }

      res.json({
        success: true,
        user,
      })
    } catch (error) {
      console.error("Token verification error:", error)
      res.status(500).json({ error: "Серверийн алдаа гарлаа" })
    }
  }

  // Refresh token
  static async refreshToken(req, res) {
    try {
      const token = jwt.sign(
        {
          id: req.user.id,
          username: req.user.username,
          role: req.user.role,
          name: req.user.name,
        },
        JWT_SECRET,
        { expiresIn: "24h" },
      )

      res.json({
        success: true,
        token,
      })
    } catch (error) {
      console.error("Token refresh error:", error)
      res.status(500).json({ error: "Серверийн алдаа гарлаа" })
    }
  }

  // Change password
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          error: "Одоогийн болон шинэ нууц үг шаардлагатай",
        })
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          error: "Шинэ нууц үг дор хаяж 6 тэмдэгт байх ёстой",
        })
      }

      // Get current user
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      })

      if (!user) {
        return res.status(404).json({ error: "Хэрэглэгч олдсонгүй" })
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password)
      if (!isValidPassword) {
        return res.status(401).json({ error: "Одоогийн нууц үг буруу байна" })
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10)

      // Update password
      await prisma.user.update({
        where: { id: req.user.id },
        data: { password: hashedPassword },
      })

      res.json({
        success: true,
        message: "Нууц үг амжилттай солигдлоо",
      })
    } catch (error) {
      console.error("Change password error:", error)
      res.status(500).json({ error: "Серверийн алдаа гарлаа" })
    }
  }
}

module.exports = AuthController
