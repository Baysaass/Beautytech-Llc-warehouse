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
    const { searchParams } = new URL(request.url)

    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const where: any = {}

    if (user.role === "seller") {
      where.userId = user.id
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const [totalSales, totalRevenue, salesCount] = await Promise.all([
      prisma.sale.aggregate({
        where,
        _sum: { quantity: true },
      }),
      prisma.sale.aggregate({
        where,
        _sum: { totalPrice: true },
      }),
      prisma.sale.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      stats: {
        totalQuantity: totalSales._sum.quantity || 0,
        totalRevenue: totalRevenue._sum.totalPrice || 0,
        salesCount,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Токен шаардлагатай" }, { status: 401 })
  }
}
