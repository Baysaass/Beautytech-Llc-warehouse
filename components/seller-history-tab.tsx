"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, TrendingUp } from "lucide-react"
import type { Sale } from "@/lib/database"

interface SellerHistoryTabProps {
  sales: Sale[]
}

export function SellerHistoryTab({ sales }: SellerHistoryTabProps) {
  const [filteredSales, setFilteredSales] = useState<Sale[]>(sales)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  useEffect(() => {
    // Set default date range (last 30 days)
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    setDateFrom(thirtyDaysAgo.toISOString().split("T")[0])
    setDateTo(today.toISOString().split("T")[0])
  }, [])

  useEffect(() => {
    let filtered = sales

    if (dateFrom && dateTo) {
      const fromDate = new Date(dateFrom)
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999) // Include the entire end date

      filtered = sales.filter((sale) => {
        const saleDate = new Date(sale.createdAt)
        return saleDate >= fromDate && saleDate <= toDate
      })
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    setFilteredSales(filtered)
  }, [sales, dateFrom, dateTo])

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalPrice, 0)
  const totalQuantity = filteredSales.reduce((sum, sale) => sum + sale.quantity, 0)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("mn-MN")
  }

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("mn-MN")
  }

  // Group sales by date for summary
  const salesByDate = filteredSales.reduce(
    (acc, sale) => {
      const date = formatDateOnly(sale.createdAt)
      if (!acc[date]) {
        acc[date] = { count: 0, revenue: 0 }
      }
      acc[date].count += 1
      acc[date].revenue += sale.totalPrice
      return acc
    },
    {} as Record<string, { count: number; revenue: number }>,
  )

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            Хугацаа сонгох
          </CardTitle>
          <CardDescription>Борлуулалтын түүхийг хугацаагаар шүүнэ үү</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Эхлэх огноо</Label>
              <Input id="dateFrom" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">Дуусах огноо</Label>
              <Input id="dateTo" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Нийт борлуулалт</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredSales.length}</div>
            <p className="text-xs text-muted-foreground">Гүйлгээний тоо</p>
          </CardContent>
        </Card>

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
            <CardTitle className="text-sm font-medium">Зарагдсан бараа</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuantity}</div>
            <p className="text-xs text-muted-foreground">Нийт тоо ширхэг</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Summary */}
      {Object.keys(salesByDate).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Өдрийн хураангуй</CardTitle>
            <CardDescription>Өдөр тутмын борлуулалтын дүн</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Огноо</TableHead>
                    <TableHead>Борлуулалт</TableHead>
                    <TableHead>Орлого</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(salesByDate)
                    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                    .map(([date, summary]) => (
                      <TableRow key={date}>
                        <TableCell className="font-medium">{date}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{summary.count} гүйлгээ</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{summary.revenue.toLocaleString()}₮</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Sales History */}
      <Card>
        <CardHeader>
          <CardTitle>Дэлгэрэнгүй түүх</CardTitle>
          <CardDescription>
            {filteredSales.length} борлуулалт
            {dateFrom && dateTo && ` (${dateFrom} - ${dateTo})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Огноо</TableHead>
                  <TableHead>Бараа</TableHead>
                  <TableHead>Тоо хэмжээ</TableHead>
                  <TableHead>Нэгжийн үнэ</TableHead>
                  <TableHead>Нийт үнэ</TableHead>
                  <TableHead>Төлбөрийн хэрэгсэл</TableHead>
                  <TableHead>Хүргэлт</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{formatDate(sale.createdAt)}</TableCell>
                    <TableCell className="font-medium">{sale.productName}</TableCell>
                    <TableCell>{sale.quantity}</TableCell>
                    <TableCell>{sale.unitPrice.toLocaleString()}₮</TableCell>
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
    </div>
  )
}
