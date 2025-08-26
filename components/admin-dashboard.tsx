"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { LogOut, Package, ShoppingCart, TrendingUp, AlertTriangle } from "lucide-react"
import { ProductsTab } from "@/components/products-tab"
import { SalesTab } from "@/components/sales-tab"
import { ReportsTab } from "@/components/reports-tab"
import { StockMovementsTab } from "@/components/stock-movements-tab"
import { db } from "@/lib/database"
import type { User, Product, Sale } from "@/lib/auth"

interface AdminDashboardProps {
  user: User
  onLogout: () => void
}

export function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [lowStockCount, setLowStockCount] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const productsData = db.getProducts()
    const salesData = db.getSales()

    setProducts(productsData)
    setSales(salesData)

    // Calculate low stock items
    const lowStock = productsData.filter((p) => p.stock <= p.minStock).length
    setLowStockCount(lowStock)
  }

  const totalProducts = products.length
  const totalSales = sales.length
  const todaySales = sales.filter((s) => new Date(s.createdAt).toDateString() === new Date().toDateString()).length

  const todayRevenue = sales
    .filter((s) => new Date(s.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, sale) => sum + sale.totalPrice, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">beautytech LLC</h1>
                <p className="text-sm text-gray-500">Админ удирдлага</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <Badge variant="secondary" className="text-xs">
                  Админ
                </Badge>
              </div>
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Гарах
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Нийт бараа</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
              <p className="text-xs text-muted-foreground">Бүртгэлтэй бараа</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Өнөөдрийн борлуулалт</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todaySales}</div>
              <p className="text-xs text-muted-foreground">Гүйлгээ</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Өнөөдрийн орлого</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayRevenue.toLocaleString()}₮</div>
              <p className="text-xs text-muted-foreground">Нийт орлого</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Бага нөөцтэй</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{lowStockCount}</div>
              <p className="text-xs text-muted-foreground">Бараа дуусч байна</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="products">Бараа материал</TabsTrigger>
            <TabsTrigger value="sales">Борлуулалт</TabsTrigger>
            <TabsTrigger value="movements">Нөөцийн хөдөлгөөн</TabsTrigger>
            <TabsTrigger value="reports">Тайлан</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <ProductsTab onDataChange={loadData} />
          </TabsContent>

          <TabsContent value="sales">
            <SalesTab user={user} onDataChange={loadData} />
          </TabsContent>

          <TabsContent value="movements">
            <StockMovementsTab />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
