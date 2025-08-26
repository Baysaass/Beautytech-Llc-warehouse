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
import { Plus, Edit, Trash2, AlertTriangle } from "lucide-react"
import { db, type Product } from "@/lib/database"

interface ProductsTabProps {
  onDataChange: () => void
}

export function ProductsTab({ onDataChange }: ProductsTabProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [expiringProducts, setExpiringProducts] = useState<Product[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    brand: "",
    buyPrice: "",
    sellPrice: "",
    stock: "",
    minStock: "",
    barcode: "",
    description: "",
    expirationDate: "",
  })
  const [error, setError] = useState("")

  useEffect(() => {
    loadProducts()
    loadExpiringProducts()
  }, [])

  const loadProducts = () => {
    const productsData = db.getProducts()
    setProducts(productsData)
  }

  const loadExpiringProducts = () => {
    const expiringData = db.getExpiringProducts()
    setExpiringProducts(expiringData)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      brand: "",
      buyPrice: "",
      sellPrice: "",
      stock: "",
      minStock: "",
      barcode: "",
      description: "",
      expirationDate: "",
    })
    setError("")
  }

  const handleAdd = () => {
    setEditingProduct(null)
    resetForm()
    setIsAddDialogOpen(true)
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      category: product.category,
      brand: product.brand,
      buyPrice: product.buyPrice.toString(),
      sellPrice: product.sellPrice.toString(),
      stock: product.stock.toString(),
      minStock: product.minStock.toString(),
      barcode: product.barcode || "",
      description: product.description || "",
      expirationDate: product.expirationDate || "",
    })
    setIsAddDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.name || !formData.category || !formData.brand) {
      setError("Заавал бөглөх талбаруудыг бөглөнө үү")
      return
    }

    const buyPrice = Number.parseFloat(formData.buyPrice)
    const sellPrice = Number.parseFloat(formData.sellPrice)
    const stock = Number.parseInt(formData.stock)
    const minStock = Number.parseInt(formData.minStock)

    if (isNaN(buyPrice) || isNaN(sellPrice) || isNaN(stock) || isNaN(minStock)) {
      setError("Үнэ болон тоо хэмжээ зөв оруулна уу")
      return
    }

    const productData = {
      name: formData.name,
      category: formData.category,
      brand: formData.brand,
      buyPrice,
      sellPrice,
      stock,
      minStock,
      barcode: formData.barcode,
      description: formData.description,
      expirationDate: formData.expirationDate || undefined,
    }

    try {
      if (editingProduct) {
        db.updateProduct(editingProduct.id, productData)
      } else {
        db.addProduct(productData)
      }

      loadProducts()
      loadExpiringProducts()
      onDataChange()
      setIsAddDialogOpen(false)
      resetForm()
    } catch (err) {
      setError("Алдаа гарлаа")
    }
  }

  const handleDelete = (id: string) => {
    if (confirm("Энэ барааг устгахдаа итгэлтэй байна уу?")) {
      db.deleteProduct(id)
      loadProducts()
      onDataChange()
    }
  }

  const getStockStatus = (product: Product) => {
    if (product.stock === 0) {
      return <Badge variant="destructive">Дууссан</Badge>
    } else if (product.stock <= product.minStock) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          Бага
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        Хангалттай
      </Badge>
    )
  }

  const formatExpirationDate = (dateString?: string) => {
    if (!dateString) return "Тодорхойгүй"
    const date = new Date(dateString)
    return date.toLocaleDateString("mn-MN")
  }

  const isExpiringSoon = (product: Product) => {
    if (!product.expirationDate) return false
    const expirationDate = new Date(product.expirationDate)
    const fourMonthsFromNow = new Date()
    fourMonthsFromNow.setMonth(fourMonthsFromNow.getMonth() + 4)
    return expirationDate <= fourMonthsFromNow && expirationDate > new Date()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Бараа материал</CardTitle>
            <CardDescription>Бүх бараа материалын жагсаалт</CardDescription>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Бараа нэмэх
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {expiringProducts.length > 0 && (
          <Alert className="mb-4 border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Анхааруулга:</strong> {expiringProducts.length} бараа 4 сарын дотор дуусах хугацаатай байна.
              <div className="mt-2 space-y-1">
                {expiringProducts.map((product) => (
                  <div key={product.id} className="text-sm">
                    • {product.name} - {formatExpirationDate(product.expirationDate)}
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Нэр</TableHead>
                <TableHead>Ангилал</TableHead>
                <TableHead>Брэнд</TableHead>
                <TableHead>Авсан үнэ</TableHead>
                <TableHead>Зарах үнэ</TableHead>
                <TableHead>Нөөц</TableHead>
                <TableHead>Дуусах хугацаа</TableHead>
                <TableHead>Төлөв</TableHead>
                <TableHead>Үйлдэл</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>{product.brand}</TableCell>
                  <TableCell>{product.buyPrice.toLocaleString()}₮</TableCell>
                  <TableCell>{product.sellPrice.toLocaleString()}₮</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>
                    <span className={isExpiringSoon(product) ? "text-yellow-600 font-medium" : ""}>
                      {formatExpirationDate(product.expirationDate)}
                      {isExpiringSoon(product) && <AlertTriangle className="w-4 h-4 inline ml-1 text-yellow-600" />}
                    </span>
                  </TableCell>
                  <TableCell>{getStockStatus(product)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(product.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Бараа материал байхгүй байна
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Бараа засах" : "Шинэ бараа нэмэх"}</DialogTitle>
              <DialogDescription>Барааны мэдээллийг оруулна уу</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Нэр *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Ангилал *</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">Брэнд *</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode">Баркод</Label>
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="buyPrice">Авсан үнэ *</Label>
                  <Input
                    id="buyPrice"
                    type="number"
                    value={formData.buyPrice}
                    onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellPrice">Зарах үнэ *</Label>
                  <Input
                    id="sellPrice"
                    type="number"
                    value={formData.sellPrice}
                    onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock">Нөөц *</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minStock">Хамгийн бага нөөц *</Label>
                  <Input
                    id="minStock"
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expirationDate">Дуусах хугацаа</Label>
                <Input
                  id="expirationDate"
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Тайлбар</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
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
                <Button type="submit">{editingProduct ? "Засах" : "Нэмэх"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
