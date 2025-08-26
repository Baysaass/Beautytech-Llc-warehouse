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

    if (user.role !== "admin") {
      return NextResponse.json({ error: "Админ эрх шаардлагатай" }, { status: 403 })
    }

    const products = await prisma.product.findMany({
      orderBy: { name: "asc" },
    })

    // Create CSV content for Excel compatibility
    const headers = ["Нэр", "Ангилал", "Үнэ", "Нөөц", "Хэмжих нэгж", "Дуусах хугацаа"]
    const csvContent = [
      headers.join(","),
      ...products.map((product) =>
        [
          `"${product.name}"`,
          `"${product.category}"`,
          product.price,
          product.stock,
          `"${product.unit}"`,
          product.expirationDate ? `"${product.expirationDate.toISOString().split("T")[0]}"` : '""',
        ].join(","),
      ),
    ].join("\n")

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=products.csv",
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Токен шаардлагатай" }, { status: 401 })
  }
}
