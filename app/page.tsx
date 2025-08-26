"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "@/components/login-form"
import { AdminDashboard } from "@/components/admin-dashboard"
import { SellerDashboard } from "@/components/seller-dashboard"
import { authService } from "@/lib/auth"
import type { User } from "@/lib/auth"

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error("Auth initialization error:", error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const handleLogin = () => {
    const currentUser = authService.getCurrentUserSync()
    setUser(currentUser)
  }

  const handleLogout = () => {
    authService.logout()
    setUser(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Ачааллаж байна...</div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm onLogin={handleLogin} />
  }

  if (user.role === "admin") {
    return <AdminDashboard user={user} onLogout={handleLogout} />
  }

  return <SellerDashboard user={user} onLogout={handleLogout} />
}
