
"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { DollarSign, PackageSearch } from "lucide-react"
import type { Order } from '@/types/pos';
import { getOrders } from "@/services/order-service"
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function RecentSales() {
  const [sales, setSales] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
        setIsLoading(true);
        const allOrders = await getOrders();
        setSales(allOrders.slice(0, 5)); // Get last 5
        setIsLoading(false);
    }
    loadData();
  }, []);

  const getStatusBadgeVariant = (status: Order["status"]) => {
    switch (status) {
      case 'completed': return 'default';
      case 'pending_payment': return 'secondary';
      case 'cancelled':
      case 'voided': return 'destructive';
      case 'partially_returned':
      case 'fully_returned': return 'outline';
      default: return 'default';
    }
  }

  const getStatusDisplayName = (status: Order["status"]): string => {
      switch (status) {
        case 'completed': return 'Facturada';
        case 'pending_payment': return 'Pend. Pago';
        case 'cancelled': return 'Cancelada';
        case 'voided': return 'Anulada';
        case 'partially_returned': return 'Dev. Parcial';
        case 'fully_returned': return 'Dev. Total';
        case 'partially_paid': return 'Abonada';
        default: return status;
      }
  };

  const formatCurrencyCRC = (amount: number) => {
    return `¢${new Intl.NumberFormat('es-CR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;
  };

  if (isLoading) {
    return (
       <Card className="shadow-md hover:shadow-lg transition-shadow rounded-xl">
        <CardHeader>
          <Skeleton className="h-6 w-1/2 mb-1" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent>
           <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-1/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-primary" />
          Ventas Recientes
        </CardTitle>
        <CardDescription>Un resumen de las últimas 5 transacciones registradas.</CardDescription>
      </CardHeader>
      <CardContent>
        {sales.length === 0 ? (
             <div className="text-center text-muted-foreground py-10">
                <PackageSearch className="h-12 w-12 mx-auto mb-2 text-primary/30" />
                <p className="mb-4">No hay ventas registradas todavía.</p>
                <Button asChild><Link href="/dashboard/sales">Realizar Primera Venta</Link></Button>
            </div>
        ) : (
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden sm:table-cell">Nº Orden</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="hidden md:table-cell text-center">Estado</TableHead>
                    <TableHead className="hidden lg:table-cell text-right">Fecha</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sales.map((sale) => (
                    <TableRow key={sale.id}>
                        <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar className="hidden h-9 w-9 sm:flex">
                            <AvatarFallback>{sale.customer?.name.split(" ").map(n=>n[0]).join("")}</AvatarFallback>
                            </Avatar>
                            <div className="font-medium">{sale.customer?.name}</div>
                        </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{sale.orderNumber}</TableCell>
                        <TableCell className="text-right">{formatCurrencyCRC(sale.totalCRC)}</TableCell>
                        <TableCell className="hidden md:table-cell text-center">
                          <Badge variant={getStatusBadgeVariant(sale.status)} className="capitalize">
                            {getStatusDisplayName(sale.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-right">{format(parseISO(sale.createdAt), 'dd MMM, yyyy', {locale: es})}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
            </Table>
        )}
      </CardContent>
    </Card>
  )
}
