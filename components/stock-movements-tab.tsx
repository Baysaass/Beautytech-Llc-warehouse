"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { db, type StockMovement } from "@/lib/database"

export function StockMovementsTab() {
  const [movements, setMovements] = useState<StockMovement[]>([])

  useEffect(() => {
    loadMovements()
  }, [])

  const loadMovements = () => {
    const movementsData = db.getStockMovements()
    setMovements(movementsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
  }

  const getMovementBadge = (type: string) => {
    switch (type) {
      case "in":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Орлого
          </Badge>
        )
      case "out":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Зарлага
          </Badge>
        )
      case "return":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Буцаалт
          </Badge>
        )
      default:
        return <Badge variant="secondary">{type}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("mn-MN")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Нөөцийн хөдөлгөөн</CardTitle>
        <CardDescription>Бүх нөөцийн орлого зарлагын түүх</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Огноо</TableHead>
                <TableHead>Бараа</TableHead>
                <TableHead>Төрөл</TableHead>
                <TableHead>Тоо хэмжээ</TableHead>
                <TableHead>Шалтгаан</TableHead>
                <TableHead>Хэрэглэгч</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>{formatDate(movement.createdAt)}</TableCell>
                  <TableCell className="font-medium">{movement.productName}</TableCell>
                  <TableCell>{getMovementBadge(movement.type)}</TableCell>
                  <TableCell>
                    <span className={movement.type === "out" ? "text-red-600" : "text-green-600"}>
                      {movement.type === "out" ? "-" : "+"}
                      {movement.quantity}
                    </span>
                  </TableCell>
                  <TableCell>{movement.reason}</TableCell>
                  <TableCell>{movement.userName}</TableCell>
                </TableRow>
              ))}
              {movements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Нөөцийн хөдөлгөөн байхгүй байна
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
