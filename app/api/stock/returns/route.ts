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

    const productId = searchParams.get("productId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const where: any = {}

    if (productId) where.productId = productId
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const returns = await prisma.return.findMany({
      where,
      include: {
        product: true,
        user: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      success: true,
      returns,
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

    const { productId, quantity, reason } = await request.json()

    if (!productId || !quantity || !reason) {
      return NextResponse.json({ error: "Бүх талбарыг бөглөнө үү" }, { status: 400 })
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json({ error: "Бүтээгдэхүүн олдсонгүй" }, { status: 404 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const returnRecord = await tx.return.create({
        data: {
          productId,
          userId: user.id,
          quantity: Number.parseInt(quantity),
          reason,
        },
        include: {
          product: true,
          user: true,
        },
      })

      // Update product stock (add back returned items)
      await tx.product.update({
        where: { id: productId },
        data: { stock: { increment: Number.parseInt(quantity) } },
      })

      return returnRecord
    })

    return NextResponse.json({
      success: true,
      return: result,
      message: "Буцаалт амжилттай бүртгэгдлээ",
    })
  } catch (error) {
    console.error("Create return error:", error)
    return NextResponse.json({ error: "Серверийн алдаа гарлаа" }, { status: 500 })
  }
}
