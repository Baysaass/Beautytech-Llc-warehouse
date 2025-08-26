export interface Product {
  id: string
  name: string
  category: string
  brand: string
  buyPrice: number
  sellPrice: number
  stock: number
  minStock: number
  barcode?: string
  description?: string
  expirationDate?: string // Added expiration date field
  createdAt: string
  updatedAt: string
}

export interface Sale {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  sellerId: string
  sellerName: string
  paymentMethod: "cash" | "card" | "transfer" | "other" // Added payment method field
  deliveryType: "pickup" | "delivery" // Added delivery type field
  createdAt: string
}

export interface StockMovement {
  id: string
  productId: string
  productName: string
  type: "in" | "out" | "return"
  quantity: number
  reason: string
  userId: string
  userName: string
  createdAt: string
}

export interface Return {
  id: string
  saleId: string
  productId: string
  productName: string
  quantity: number
  reason: string
  userId: string
  userName: string
  createdAt: string
}

class DatabaseService {
  private productsKey = "beauty_salon_products"
  private salesKey = "beauty_salon_sales"
  private stockMovementsKey = "beauty_salon_stock_movements"
  private returnsKey = "beauty_salon_returns"

  // Products
  getProducts(): Product[] {
    return this.getFromStorage(this.productsKey, [])
  }

  addProduct(product: Omit<Product, "id" | "createdAt" | "updatedAt">): Product {
    const products = this.getProducts()
    const newProduct: Product = {
      ...product,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    products.push(newProduct)
    this.saveToStorage(this.productsKey, products)
    return newProduct
  }

  updateProduct(id: string, updates: Partial<Product>): Product | null {
    const products = this.getProducts()
    const index = products.findIndex((p) => p.id === id)
    if (index === -1) return null

    products[index] = {
      ...products[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    this.saveToStorage(this.productsKey, products)
    return products[index]
  }

  deleteProduct(id: string): boolean {
    const products = this.getProducts()
    const filteredProducts = products.filter((p) => p.id !== id)
    if (filteredProducts.length === products.length) return false

    this.saveToStorage(this.productsKey, filteredProducts)
    return true
  }

  getExpiringProducts(): Product[] {
    const products = this.getProducts()
    const fourMonthsFromNow = new Date()
    fourMonthsFromNow.setMonth(fourMonthsFromNow.getMonth() + 4)

    return products.filter((product) => {
      if (!product.expirationDate) return false
      const expirationDate = new Date(product.expirationDate)
      return expirationDate <= fourMonthsFromNow && expirationDate > new Date()
    })
  }

  // Sales
  getSales(): Sale[] {
    return this.getFromStorage(this.salesKey, [])
  }

  addSale(sale: Omit<Sale, "id" | "createdAt">): Sale | null {
    const products = this.getProducts()
    const product = products.find((p) => p.id === sale.productId)

    if (!product || product.stock < sale.quantity) {
      return null // Insufficient stock
    }

    // Update product stock
    this.updateProduct(sale.productId, { stock: product.stock - sale.quantity })

    // Add sale record
    const sales = this.getSales()
    const newSale: Sale = {
      ...sale,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
    }
    sales.push(newSale)
    this.saveToStorage(this.salesKey, sales)

    // Add stock movement
    this.addStockMovement({
      productId: sale.productId,
      productName: sale.productName,
      type: "out",
      quantity: sale.quantity,
      reason: "Борлуулалт",
      userId: sale.sellerId,
      userName: sale.sellerName,
    })

    return newSale
  }

  // Stock Movements
  getStockMovements(): StockMovement[] {
    return this.getFromStorage(this.stockMovementsKey, [])
  }

  addStockMovement(movement: Omit<StockMovement, "id" | "createdAt">): StockMovement {
    const movements = this.getStockMovements()
    const newMovement: StockMovement = {
      ...movement,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
    }
    movements.push(newMovement)
    this.saveToStorage(this.stockMovementsKey, movements)
    return newMovement
  }

  // Returns
  getReturns(): Return[] {
    return this.getFromStorage(this.returnsKey, [])
  }

  addReturn(returnData: Omit<Return, "id" | "createdAt">): Return {
    const returns = this.getReturns()
    const newReturn: Return = {
      ...returnData,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
    }
    returns.push(newReturn)
    this.saveToStorage(this.returnsKey, returns)

    // Update product stock
    const products = this.getProducts()
    const product = products.find((p) => p.id === returnData.productId)
    if (product) {
      this.updateProduct(returnData.productId, { stock: product.stock + returnData.quantity })
    }

    // Add stock movement
    this.addStockMovement({
      productId: returnData.productId,
      productName: returnData.productName,
      type: "return",
      quantity: returnData.quantity,
      reason: `Буцаалт: ${returnData.reason}`,
      userId: returnData.userId,
      userName: returnData.userName,
    })

    return newReturn
  }

  private getFromStorage<T>(key: string, defaultValue: T): T {
    if (typeof window === "undefined") return defaultValue

    const data = localStorage.getItem(key)
    if (!data) return defaultValue

    try {
      return JSON.parse(data)
    } catch {
      return defaultValue
    }
  }

  private saveToStorage<T>(key: string, data: T): void {
    if (typeof window === "undefined") return
    localStorage.setItem(key, JSON.stringify(data))
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
}

export const db = new DatabaseService()
