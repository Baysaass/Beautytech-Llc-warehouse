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

    // Create CSV content
    const headers = [
      "Огноо",
      "Бүтээгдэхүүн",
      "Тоо ширхэг",
      "Нэгжийн үнэ",
      "Нийт үнэ",
      "Төлбөрийн хэрэгсэл",
      "Хүргэлт",
      "Худалдагч",
    ]
    const csvContent = [
      headers.join(","),
      ...sales.map((sale) =>
        [
          `"${sale.createdAt.toISOString().split("T")[0]}"`,
          `"${sale.product.name}"`,
          sale.quantity,
          sale.unitPrice,
          sale.totalPrice,
          `"${sale.paymentMethod}"`,
          `"${sale.deliveryType}"`,
          `"${sale.user.name}"`,
        ].join(","),
      ),
    ].join("\n")

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=sales.csv",
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Токен шаардлагатай" }, { status: 401 })
  }
}
