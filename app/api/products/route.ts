import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

function authenticateToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const token = authHeader?.split(" ")[1]

  if (!token) {
    throw new Error("Access token required")
  }

  return jwt.verify(token, JWT_SECRET) as any
}

export async function GET(request: NextRequest) {
  try {
    const user = authenticateToken(request)

    const products = await prisma.product.findMany({
      orderBy: { name: "asc" },
    })

    return NextResponse.json({
      success: true,
      products,
    })
  } catch (error) {
    return NextResponse.json({ error: "Токен шаардлагатай" }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = authenticateToken(request)

    if (user.role !== "admin") {
      return NextResponse.json({ error: "Админ эрх шаардлагатай" }, { status: 403 })
    }

    const { name, category, price, stock, unit, expirationDate } = await request.json()

    if (!name || !category || !price || stock === undefined || !unit) {
      return NextResponse.json({ error: "Бүх талбарыг бөглөнө үү" }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        name,
        category,
        price: Number.parseFloat(price),
        stock: Number.parseInt(stock),
        unit,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
      },
    })

    return NextResponse.json({
      success: true,
      product,
      message: "Бүтээгдэхүүн амжилттай нэмэгдлээ",
    })
  } catch (error) {
    console.error("Create product error:", error)
    return NextResponse.json({ error: "Серверийн алдаа гарлаа" }, { status: 500 })
  }
}
