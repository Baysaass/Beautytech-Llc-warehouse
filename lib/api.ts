const API_BASE_URL = "/api"

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("beauty_salon_token")
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Network error" }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }
    return response.json()
  }

  // Authentication
  async login(username: string, password: string) {
    const fullUrl = `${API_BASE_URL}/auth/login`
    console.log("[v0] API_BASE_URL:", API_BASE_URL)
    console.log("[v0] Full login URL:", fullUrl)
    console.log("[v0] Window location:", window.location.href)

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })

    console.log("[v0] Login API response status:", response.status)
    console.log("[v0] Login API response URL:", response.url)

    return this.handleResponse<{ success: boolean; token: string; user: any }>(response)
  }

  async verifyToken() {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse<{ success: boolean; user: any }>(response)
  }

  // Products
  async getProducts() {
    const response = await fetch(`${API_BASE_URL}/products`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse<{ success: boolean; products: any[] }>(response)
  }

  async getProduct(id: string) {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse<{ success: boolean; product: any }>(response)
  }

  async createProduct(productData: any) {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(productData),
    })
    return this.handleResponse<{ success: boolean; product: any; message: string }>(response)
  }

  async updateProduct(id: string, productData: any) {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(productData),
    })
    return this.handleResponse<{ success: boolean; product: any; message: string }>(response)
  }

  async deleteProduct(id: string) {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse<{ success: boolean; message: string }>(response)
  }

  // Sales
  async getSales(params?: { startDate?: string; endDate?: string; userId?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.startDate) searchParams.append("startDate", params.startDate)
    if (params?.endDate) searchParams.append("endDate", params.endDate)
    if (params?.userId) searchParams.append("userId", params.userId)

    const response = await fetch(`${API_BASE_URL}/sales?${searchParams}`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse<{ success: boolean; sales: any[] }>(response)
  }

  async createSale(saleData: any) {
    const response = await fetch(`${API_BASE_URL}/sales`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(saleData),
    })
    return this.handleResponse<{ success: boolean; sale: any; message: string }>(response)
  }

  async getSalesStats(params?: { startDate?: string; endDate?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.startDate) searchParams.append("startDate", params.startDate)
    if (params?.endDate) searchParams.append("endDate", params.endDate)

    const response = await fetch(`${API_BASE_URL}/sales/stats?${searchParams}`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse<{ success: boolean; stats: any }>(response)
  }

  // Stock
  async getStockMovements(params?: { productId?: string; type?: string; startDate?: string; endDate?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.productId) searchParams.append("productId", params.productId)
    if (params?.type) searchParams.append("type", params.type)
    if (params?.startDate) searchParams.append("startDate", params.startDate)
    if (params?.endDate) searchParams.append("endDate", params.endDate)

    const response = await fetch(`${API_BASE_URL}/stock/movements?${searchParams}`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse<{ success: boolean; movements: any[] }>(response)
  }

  async createStockMovement(movementData: any) {
    const response = await fetch(`${API_BASE_URL}/stock/movements`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(movementData),
    })
    return this.handleResponse<{ success: boolean; movement: any; message: string }>(response)
  }

  async getReturns(params?: { productId?: string; startDate?: string; endDate?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.productId) searchParams.append("productId", params.productId)
    if (params?.startDate) searchParams.append("startDate", params.startDate)
    if (params?.endDate) searchParams.append("endDate", params.endDate)

    const response = await fetch(`${API_BASE_URL}/stock/returns?${searchParams}`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse<{ success: boolean; returns: any[] }>(response)
  }

  async createReturn(returnData: any) {
    const response = await fetch(`${API_BASE_URL}/stock/returns`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(returnData),
    })
    return this.handleResponse<{ success: boolean; return: any; message: string }>(response)
  }

  // Export functions
  async exportProductsExcel() {
    const response = await fetch(`${API_BASE_URL}/export/products/excel`, {
      headers: this.getAuthHeaders(),
    })
    if (!response.ok) throw new Error("Export failed")
    return response.blob()
  }

  async exportProductsPDF() {
    const response = await fetch(`${API_BASE_URL}/export/products/pdf`, {
      headers: this.getAuthHeaders(),
    })
    if (!response.ok) throw new Error("Export failed")
    return response.blob()
  }

  async exportSalesExcel(params?: { startDate?: string; endDate?: string; userId?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.startDate) searchParams.append("startDate", params.startDate)
    if (params?.endDate) searchParams.append("endDate", params.endDate)
    if (params?.userId) searchParams.append("userId", params.userId)

    const response = await fetch(`${API_BASE_URL}/export/sales/excel?${searchParams}`, {
      headers: this.getAuthHeaders(),
    })
    if (!response.ok) throw new Error("Export failed")
    return response.blob()
  }

  async exportSalesPDF(params?: { startDate?: string; endDate?: string; userId?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.startDate) searchParams.append("startDate", params.startDate)
    if (params?.endDate) searchParams.append("endDate", params.endDate)
    if (params?.userId) searchParams.append("userId", params.userId)

    const response = await fetch(`${API_BASE_URL}/export/sales/pdf?${searchParams}`, {
      headers: this.getAuthHeaders(),
    })
    if (!response.ok) throw new Error("Export failed")
    return response.blob()
  }

  async exportStockMovementsExcel(params?: { productId?: string; startDate?: string; endDate?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.productId) searchParams.append("productId", params.productId)
    if (params?.startDate) searchParams.append("startDate", params.startDate)
    if (params?.endDate) searchParams.append("endDate", params.endDate)

    const response = await fetch(`${API_BASE_URL}/export/stock-movements/excel?${searchParams}`, {
      headers: this.getAuthHeaders(),
    })
    if (!response.ok) throw new Error("Export failed")
    return response.blob()
  }
}

export const apiService = new ApiService()

// Helper function to download blob as file
export const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}
