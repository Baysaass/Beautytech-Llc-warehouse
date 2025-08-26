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
    const userId = searchParams.get("userId")

    const where: any = {}

    if (user.role === "seller") {
      where.userId = user.id
    } else if (userId) {
      where.userId = userId
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        product: true,
        user: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      success: true,
      sales,
    })
  } catch (error) {
    return NextResponse.json({ error: "Токен шаардлагатай" }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = authenticateToken(request)
    const { productId, quantity, paymentMethod, deliveryType } = await request.json()

    if (!productId || !quantity || !paymentMethod || !deliveryType) {
      return NextResponse.json({ error: "Бүх талбарыг бөглөнө үү" }, { status: 400 })
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json({ error: "Бүтээгдэхүүн олдсонгүй" }, { status: 404 })
    }

    if (product.stock < quantity) {
      return NextResponse.json({ error: "Хангалттай нөөц байхгүй байна" }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          productId,
          userId: user.id,
          quantity: Number.parseInt(quantity),
          unitPrice: product.price,
          totalPrice: product.price * Number.parseInt(quantity),
          paymentMethod,
          deliveryType,
        },
        include: {
          product: true,
          user: true,
        },
      })

      await tx.product.update({
        where: { id: productId },
        data: { stock: { decrement: Number.parseInt(quantity) } },
      })

      return sale
    })

    return NextResponse.json({
      success: true,
      sale: result,
      message: "Борлуулалт амжилттай бүртгэгдлээ",
    })
  } catch (error) {
    console.error("Create sale error:", error)
    return NextResponse.json({ error: "Серверийн алдаа гарлаа" }, { status: 500 })
  }
}
