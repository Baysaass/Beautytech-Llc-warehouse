import { apiService } from "./api"

export interface User {
  id: string
  username: string
  role: "admin" | "seller"
  name: string
  createdAt: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
}

class AuthService {
  private storageKey = "beauty_salon_auth"
  private tokenKey = "beauty_salon_token"

  async login(username: string, password: string): Promise<User | null> {
    try {
      const response = await apiService.login(username, password)

      if (response.success && response.token && response.user) {
        // Store token
        localStorage.setItem(this.tokenKey, response.token)

        // Store auth state
        const authState: AuthState = {
          user: response.user,
          isAuthenticated: true,
        }
        localStorage.setItem(this.storageKey, JSON.stringify(authState))

        return response.user
      }
      return null
    } catch (error) {
      console.error("Login error:", error)
      return null
    }
  }

  logout(): void {
    localStorage.removeItem(this.storageKey)
    localStorage.removeItem(this.tokenKey)
  }

  async getCurrentUser(): Promise<User | null> {
    if (typeof window === "undefined") return null

    const token = localStorage.getItem(this.tokenKey)
    if (!token) return null

    try {
      const response = await apiService.verifyToken()
      if (response.success && response.user) {
        // Update stored auth state
        const authState: AuthState = {
          user: response.user,
          isAuthenticated: true,
        }
        localStorage.setItem(this.storageKey, JSON.stringify(authState))
        return response.user
      }
    } catch (error) {
      console.error("Token verification failed:", error)
      // Clear invalid token
      this.logout()
    }

    return null
  }

  getCurrentUserSync(): User | null {
    if (typeof window === "undefined") return null

    const authData = localStorage.getItem(this.storageKey)
    if (!authData) return null

    try {
      const authState: AuthState = JSON.parse(authData)
      return authState.isAuthenticated ? authState.user : null
    } catch {
      return null
    }
  }

  isAuthenticated(): boolean {
    return this.getCurrentUserSync() !== null
  }

  hasRole(role: "admin" | "seller"): boolean {
    const user = this.getCurrentUserSync()
    return user?.role === role
  }

  isAdmin(): boolean {
    return this.hasRole("admin")
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey)
  }

  async refreshToken(): Promise<boolean> {
    try {
      const response = await apiService.refreshToken()
      if (response.success && response.token) {
        localStorage.setItem(this.tokenKey, response.token)
        return true
      }
    } catch (error) {
      console.error("Token refresh failed:", error)
      this.logout()
    }
    return false
  }
}

export const authService = new AuthService()
