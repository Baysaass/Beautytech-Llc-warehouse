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
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ShoppingCart, AlertTriangle, Calendar } from "lucide-react"
import { db, type Product } from "@/lib/database"
import type { User } from "@/lib/auth"

interface SellerSalesTabProps {
  user: User
  onDataChange: () => void
}

export function SellerSalesTab({ user, onDataChange }: SellerSalesTabProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "transfer" | "other">("cash")
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    const filtered = products.filter(
      (product) =>
        product.stock > 0 &&
        (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.barcode && product.barcode.includes(searchTerm))),
    )
    setFilteredProducts(filtered)
  }, [products, searchTerm])

  const loadProducts = () => {
    const productsData = db.getProducts()
    setProducts(productsData)
  }

  const handleSellClick = (product: Product) => {
    setSelectedProduct(product)
    setQuantity("1")
    setPaymentMethod("cash")
    setDeliveryType("pickup")
    setError("")
    setSuccess("")
    setIsAddDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!selectedProduct || !quantity || !paymentMethod || !deliveryType) {
      setError("Бүх талбарыг бөглөнө үү")
      return
    }

    const qty = Number.parseInt(quantity)
    if (isNaN(qty) || qty <= 0) {
      setError("Тоо хэмжээ зөв оруулна уу")
      return
    }

    if (selectedProduct.stock < qty) {
      setError(`Хангалтгүй нөөц. Одоогийн нөөц: ${selectedProduct.stock}`)
      return
    }

    const saleData = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity: qty,
      unitPrice: selectedProduct.sellPrice,
      totalPrice: selectedProduct.sellPrice * qty,
      sellerId: user.id,
      sellerName: user.name,
      paymentMethod,
      deliveryType,
    }

    try {
      const sale = db.addSale(saleData)
      if (sale) {
        setSuccess(`${selectedProduct.name} амжилттай зарагдлаа!`)
        loadProducts()
        onDataChange()
        setTimeout(() => {
          setIsAddDialogOpen(false)
          setSuccess("")
        }, 1500)
      } else {
        setError("Борлуулалт хийхэд алдаа гарлаа")
      }
    } catch (err) {
      setError("Алдаа гарлаа")
    }
  }

  const getStockBadge = (product: Product) => {
    if (product.stock === 0) {
      return <Badge variant="destructive">Дууссан</Badge>
    } else if (product.stock <= product.minStock) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          Бага ({product.stock})
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        {product.stock}
      </Badge>
    )
  }

  const getExpirationStatus = (product: Product) => {
    if (!product.expirationDate) return null

    const today = new Date()
    const expDate = new Date(product.expirationDate)
    const fourMonthsFromNow = new Date()
    fourMonthsFromNow.setMonth(today.getMonth() + 4)

    const isExpired = expDate < today
    const isExpiringSoon = expDate <= fourMonthsFromNow && expDate >= today

    if (isExpired) {
      return { status: "expired", color: "text-red-600", icon: true }
    } else if (isExpiringSoon) {
      return { status: "expiring", color: "text-yellow-600", icon: true }
    }
    return { status: "normal", color: "text-muted-foreground", icon: false }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("mn-MN")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Бараа хайх</CardTitle>
          <CardDescription>Зарах барааг хайж олоод борлуулалт хийнэ үү</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Барааны нэр, ангилал, брэнд эсвэл баркодоор хайх..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Боломжтой бараа</CardTitle>
          <CardDescription>
            {filteredProducts.length} бараа олдлоо
            {searchTerm && ` "${searchTerm}" хайлтаар`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Нэр</TableHead>
                  <TableHead>Ангилал</TableHead>
                  <TableHead>Брэнд</TableHead>
                  <TableHead>Үнэ</TableHead>
                  <TableHead>Нөөц</TableHead>
                  <TableHead>Дуусах хугацаа</TableHead>
                  <TableHead>Үйлдэл</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const expirationStatus = getExpirationStatus(product)
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>{product.brand}</TableCell>
                      <TableCell className="font-medium">{product.sellPrice.toLocaleString()}₮</TableCell>
                      <TableCell>{getStockBadge(product)}</TableCell>
                      <TableCell>
                        {product.expirationDate ? (
                          <div className={`flex items-center gap-1 ${expirationStatus?.color}`}>
                            {expirationStatus?.icon && <AlertTriangle className="w-4 h-4" />}
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">{formatDate(product.expirationDate)}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleSellClick(product)}
                          disabled={product.stock === 0 || expirationStatus?.status === "expired"}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Зарах
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? `"${searchTerm}" хайлтаар бараа олдсонгүй` : "Нөөцтэй бараа байхгүй байна"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Борлуулалт хийх</DialogTitle>
            <DialogDescription>
              {selectedProduct && `${selectedProduct.name} - ${selectedProduct.sellPrice.toLocaleString()}₮`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {selectedProduct && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Бараа:</span> {selectedProduct.name}
                  </div>
                  <div>
                    <span className="font-medium">Үнэ:</span> {selectedProduct.sellPrice.toLocaleString()}₮
                  </div>
                  <div>
                    <span className="font-medium">Нөөц:</span> {selectedProduct.stock}
                  </div>
                  <div>
                    <span className="font-medium">Брэнд:</span> {selectedProduct.brand}
                  </div>
                  {selectedProduct.expirationDate && (
                    <>
                      <div className="col-span-2">
                        <span className="font-medium">Дуусах хугацаа:</span>{" "}
                        <span className={getExpirationStatus(selectedProduct)?.color}>
                          {formatDate(selectedProduct.expirationDate)}
                          {getExpirationStatus(selectedProduct)?.status === "expiring" && " (Удахгүй дуусна)"}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="quantity">Тоо хэмжээ *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={selectedProduct?.stock || 1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Төлбөрийн хэрэгсэл *</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value: "cash" | "card" | "transfer" | "other") => setPaymentMethod(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Төлбөрийн хэрэгсэл сонгох" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Бэлэн мөнгө</SelectItem>
                  <SelectItem value="card">Картаар</SelectItem>
                  <SelectItem value="transfer">Шилжүүлэг</SelectItem>
                  <SelectItem value="other">Бусад</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryType">Хүргэлтийн төрөл *</Label>
              <Select value={deliveryType} onValueChange={(value: "pickup" | "delivery") => setDeliveryType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Хүргэлтийн төрөл сонгох" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pickup">Биеэр авсан</SelectItem>
                  <SelectItem value="delivery">Хүргэлтээр авсан</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {quantity && selectedProduct && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Нийт үнэ:</p>
                <p className="text-xl font-bold text-blue-900">
                  {(selectedProduct.sellPrice * Number.parseInt(quantity || "0")).toLocaleString()}₮
                </p>
              </div>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Цуцлах
              </Button>
              <Button type="submit" disabled={!!success}>
                {success ? "Амжилттай!" : "Борлуулах"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
