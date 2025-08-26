import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    console.log("[v0] Login attempt for username:", username)

    if (!username || !password) {
      return NextResponse.json({ error: "Хэрэглэгчийн нэр болон нууц үг шаардлагатай" }, { status: 400 })
    }

    console.log("[v0] Searching for user in database...")
    const user = await prisma.user.findUnique({
      where: { username },
    })

    console.log("[v0] User found:", user ? "Yes" : "No")

    if (!user) {
      return NextResponse.json({ error: "Хэрэглэгчийн нэр эсвэл нууц үг буруу байна" }, { status: 401 })
    }

    console.log("[v0] Comparing passwords...")
    const passwordMatch = bcrypt.compareSync(password, user.password)
    console.log("[v0] Password match:", passwordMatch)

    if (!passwordMatch) {
      return NextResponse.json({ error: "Хэрэглэгчийн нэр эсвэл нууц үг буруу байна" }, { status: 401 })
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: "24h" })

    console.log("[v0] Login successful for user:", user.username)

    return NextResponse.json({
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
    console.error("[v0] Login error:", error)
    return NextResponse.json({ error: "Серверийн алдаа гарлаа" }, { status: 500 })
  }
}
