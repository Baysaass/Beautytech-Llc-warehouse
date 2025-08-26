"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { LogOut, ShoppingCart, TrendingUp, Package } from "lucide-react"
import { SellerSalesTab } from "@/components/seller-sales-tab"
import { SellerHistoryTab } from "@/components/seller-history-tab"
import { db } from "@/lib/database"
import type { User, Product, Sale } from "@/lib/auth"

interface SellerDashboardProps {
  user: User
  onLogout: () => void
}

export function SellerDashboard({ user, onLogout }: SellerDashboardProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [mySales, setMySales] = useState<Sale[]>([])

  useEffect(() => {
    loadData()
  }, [user.id])

  const loadData = () => {
    const productsData = db.getProducts()
    const salesData = db.getSales()
    const mySalesData = salesData.filter((sale) => sale.sellerId === user.id)

    setProducts(productsData)
    setSales(salesData)
    setMySales(mySalesData)
  }

  const availableProducts = products.filter((p) => p.stock > 0).length
  const todayMySales = mySales.filter((s) => new Date(s.createdAt).toDateString() === new Date().toDateString()).length

  const todayMyRevenue = mySales
    .filter((s) => new Date(s.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, sale) => sum + sale.totalPrice, 0)

  const totalMySales = mySales.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Гоо сайхны салон</h1>
                <p className="text-sm text-gray-500">Борлуулагчийн систем</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <Badge variant="outline" className="text-xs">
                  Борлуулагч
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
              <CardTitle className="text-sm font-medium">Боломжтой бараа</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{availableProducts}</div>
              <p className="text-xs text-muted-foreground">Нөөцтэй бараа</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Өнөөдрийн борлуулалт</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayMySales}</div>
              <p className="text-xs text-muted-foreground">Миний гүйлгээ</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Өнөөдрийн орлого</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayMyRevenue.toLocaleString()}₮</div>
              <p className="text-xs text-muted-foreground">Миний орлого</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Нийт борлуулалт</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMySales}</div>
              <p className="text-xs text-muted-foreground">Миний нийт гүйлгээ</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="sales" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sales">Борлуулалт хийх</TabsTrigger>
            <TabsTrigger value="history">Миний түүх</TabsTrigger>
          </TabsList>

          <TabsContent value="sales">
            <SellerSalesTab user={user} onDataChange={loadData} />
          </TabsContent>

          <TabsContent value="history">
            <SellerHistoryTab sales={mySales} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
