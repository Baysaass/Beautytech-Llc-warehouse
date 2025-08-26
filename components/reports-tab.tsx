"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, TrendingUp, Package, ShoppingCart } from "lucide-react"
import { db, type Product, type Sale } from "@/lib/database"

export function ReportsTab() {
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  useEffect(() => {
    loadData()
    // Set default date range (last 30 days)
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    setDateFrom(thirtyDaysAgo.toISOString().split("T")[0])
    setDateTo(today.toISOString().split("T")[0])
  }, [])

  const loadData = () => {
    const productsData = db.getProducts()
    const salesData = db.getSales()
    setProducts(productsData)
    setSales(salesData)
  }

  const getFilteredSales = () => {
    if (!dateFrom || !dateTo) return sales

    const fromDate = new Date(dateFrom)
    const toDate = new Date(dateTo)
    toDate.setHours(23, 59, 59, 999) // Include the entire end date

    return sales.filter((sale) => {
      const saleDate = new Date(sale.createdAt)
      return saleDate >= fromDate && saleDate <= toDate
    })
  }

  const filteredSales = getFilteredSales()

  // Calculate statistics
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalPrice, 0)
  const totalSalesCount = filteredSales.length
  const lowStockProducts = products.filter((p) => p.stock <= p.minStock)

  // Top selling products
  const productSales = filteredSales.reduce(
    (acc, sale) => {
      if (!acc[sale.productId]) {
        acc[sale.productId] = {
          productName: sale.productName,
          quantity: 0,
          revenue: 0,
        }
      }
      acc[sale.productId].quantity += sale.quantity
      acc[sale.productId].revenue += sale.totalPrice
      return acc
    },
    {} as Record<string, { productName: string; quantity: number; revenue: number }>,
  )

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  const exportReport = () => {
    const reportData = {
      period: `${dateFrom} - ${dateTo}`,
      summary: {
        totalRevenue,
        totalSales: totalSalesCount,
        lowStockCount: lowStockProducts.length,
      },
      topProducts,
      lowStockProducts: lowStockProducts.map((p) => ({
        name: p.name,
        currentStock: p.stock,
        minStock: p.minStock,
      })),
    }

    const dataStr = JSON.stringify(reportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `salon-report-${dateFrom}-${dateTo}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Тайлангийн хугацаа</CardTitle>
          <CardDescription>Тайлан авах хугацааг сонгоно уу</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Эхлэх огноо</Label>
              <Input id="dateFrom" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">Дуусах огноо</Label>
              <Input id="dateTo" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <Button onClick={exportReport}>
              <Download className="w-4 h-4 mr-2" />
              Тайлан татах
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Нийт орлого</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toLocaleString()}₮</div>
            <p className="text-xs text-muted-foreground">Сонгосон хугацаанд</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Нийт борлуулалт</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSalesCount}</div>
            <p className="text-xs text-muted-foreground">Гүйлгээний тоо</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Бага нөөцтэй</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{lowStockProducts.length}</div>
            <p className="text-xs text-muted-foreground">Бараа дуусч байна</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Хамгийн их зарагдсан бараа</CardTitle>
          <CardDescription>Орлогоор эрэмбэлсэн топ 10 бараа</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Бараа</TableHead>
                  <TableHead>Зарагдсан тоо</TableHead>
                  <TableHead>Нийт орлого</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{product.productName}</TableCell>
                    <TableCell>{product.quantity}</TableCell>
                    <TableCell className="font-medium">{product.revenue.toLocaleString()}₮</TableCell>
                  </TableRow>
                ))}
                {topProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      Сонгосон хугацаанд борлуулалт байхгүй байна
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Sales Report */}
      <Card>
        <CardHeader>
          <CardTitle>Дэлгэрэнгүй борлуулалтын тайлан</CardTitle>
          <CardDescription>Төлбөр болон хүргэлтийн мэдээлэл бүхий бүх борлуулалт</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Огноо</TableHead>
                  <TableHead>Бараа</TableHead>
                  <TableHead>Тоо хэмжээ</TableHead>
                  <TableHead>Нийт үнэ</TableHead>
                  <TableHead>Төлбөрийн хэрэгсэл</TableHead>
                  <TableHead>Хүргэлт</TableHead>
                  <TableHead>Худалдагч</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{new Date(sale.createdAt).toLocaleString("mn-MN")}</TableCell>
                    <TableCell className="font-medium">{sale.productName}</TableCell>
                    <TableCell>{sale.quantity}</TableCell>
                    <TableCell className="font-medium">{sale.totalPrice.toLocaleString()}₮</TableCell>
                    <TableCell>
                      <span className="capitalize">
                        {sale.paymentMethod === "cash" && "Бэлэн мөнгө"}
                        {sale.paymentMethod === "card" && "Карт"}
                        {sale.paymentMethod === "transfer" && "Шилжүүлэг"}
                        {sale.paymentMethod === "other" && "Бусад"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">
                        {sale.deliveryType === "pickup" && "Биеэр авсан"}
                        {sale.deliveryType === "delivery" && "Хүргэлт"}
                      </span>
                    </TableCell>
                    <TableCell>{sale.sellerName}</TableCell>
                  </TableRow>
                ))}
                {filteredSales.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Сонгосон хугацаанд борлуулалт байхгүй байна
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Products */}
      {lowStockProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Бага нөөцтэй бараа</CardTitle>
            <CardDescription>Нөөц нэмэх шаардлагатай бараанууд</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Бараа</TableHead>
                    <TableHead>Одоогийн нөөц</TableHead>
                    <TableHead>Хамгийн бага нөөц</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-destructive font-medium">{product.stock}</TableCell>
                      <TableCell>{product.minStock}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
