"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, AlertTriangle } from "lucide-react"
import { db, type Product, type Sale } from "@/lib/database"
import type { User } from "@/lib/auth"

interface SalesTabProps {
  user: User
  onDataChange: () => void
}

export function SalesTab({ user, onDataChange }: SalesTabProps) {
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    productId: "",
    quantity: "",
  })
  const [error, setError] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const salesData = db.getSales()
    const productsData = db.getProducts()
    setSales(salesData)
    setProducts(productsData)
  }

  const resetForm = () => {
    setFormData({
      productId: "",
      quantity: "",
    })
    setError("")
  }

  const handleAdd = () => {
    resetForm()
    setIsAddDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.productId || !formData.quantity) {
      setError("Бүх талбарыг бөглөнө үү")
      return
    }

    const quantity = Number.parseInt(formData.quantity)
    if (isNaN(quantity) || quantity <= 0) {
      setError("Тоо хэмжээ зөв оруулна уу")
      return
    }

    const product = products.find((p) => p.id === formData.productId)
    if (!product) {
      setError("Бараа олдсонгүй")
      return
    }

    if (product.stock < quantity) {
      setError(`Хангалтгүй нөөц. Одоогийн нөөц: ${product.stock}`)
      return
    }

    const saleData = {
      productId: product.id,
      productName: product.name,
      quantity,
      unitPrice: product.sellPrice,
      totalPrice: product.sellPrice * quantity,
      sellerId: user.id,
      sellerName: user.name,
    }

    try {
      const sale = db.addSale(saleData)
      if (sale) {
        loadData()
        onDataChange()
        setIsAddDialogOpen(false)
        resetForm()
      } else {
        setError("Борлуулалт хийхэд алдаа гарлаа")
      }
    } catch (err) {
      setError("Алдаа гарлаа")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("mn-MN")
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Борлуулалт</CardTitle>
            <CardDescription>Бүх борлуулалтын түүх</CardDescription>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Борлуулалт нэмэх
          </Button>
        </div>
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
                <TableHead>Борлуулагч</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{formatDate(sale.createdAt)}</TableCell>
                  <TableCell className="font-medium">{sale.productName}</TableCell>
                  <TableCell>{sale.quantity}</TableCell>
                  <TableCell>{sale.unitPrice.toLocaleString()}₮</TableCell>
                  <TableCell className="font-medium">{sale.totalPrice.toLocaleString()}₮</TableCell>
                  <TableCell>{sale.sellerName}</TableCell>
                </TableRow>
              ))}
              {sales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Борлуулалт байхгүй байна
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Шинэ борлуулалт</DialogTitle>
              <DialogDescription>Борлуулалтын мэдээллийг оруулна уу</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product">Бараа *</Label>
                <Select
                  value={formData.productId}
                  onValueChange={(value) => setFormData({ ...formData, productId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Бараа сонгох" />
                  </SelectTrigger>
                  <SelectContent>
                    {products
                      .filter((p) => p.stock > 0)
                      .map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {product.sellPrice.toLocaleString()}₮ (Нөөц: {product.stock})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Тоо хэмжээ *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                />
              </div>
              {formData.productId && formData.quantity && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Нийт үнэ:</p>
                  <p className="text-lg font-bold">
                    {(products.find((p) => p.id === formData.productId)?.sellPrice || 0) *
                      Number.parseInt(formData.quantity || "0")}
                    ₮
                  </p>
                </div>
              )}
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Цуцлах
                </Button>
                <Button type="submit">Борлуулах</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
