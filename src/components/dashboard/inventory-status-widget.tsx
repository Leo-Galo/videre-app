
"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Package, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@/types/pos";
import { getProducts } from "@/services/inventory-service";
import Link from 'next/link';
import { Button } from "@/components/ui/button";

export function InventoryStatusWidget() {
  const [items, setItems] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
        setIsLoading(true);
        const allProducts = await getProducts();
        // Filter for items with a low stock threshold defined and where stock is low
        const lowStockItems = allProducts.filter(p => 
            p.lowStockThreshold && p.stock <= (typeof p.lowStockThreshold === 'number' ? p.lowStockThreshold : parseInt(p.lowStockThreshold, 10))
        );
        // Take top 4 or whatever is available
        setItems(lowStockItems.slice(0, 4));
        setIsLoading(false);
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <Card className="shadow-md hover:shadow-lg transition-shadow rounded-xl">
        <CardHeader>
          <Skeleton className="h-6 w-3/4 mb-1" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Package className="h-5 w-5 mr-2 text-primary" />
          Estado del Inventario
        </CardTitle>
        <CardDescription>Resumen de productos con stock bajo.</CardDescription>
      </CardHeader>
      <CardContent>
       {items.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500"/>
            <p>¡Todo en orden! No hay productos con stock bajo.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const threshold = typeof item.lowStockThreshold === 'number' ? item.lowStockThreshold : (typeof item.lowStockThreshold === 'string' && item.lowStockThreshold !== '' ? parseInt(item.lowStockThreshold, 10) : 1);
              const capacity = Math.max(item.stock, threshold) * 2; // Create a sensible capacity for progress
              const percentage = (item.stock / capacity) * 100;
              let statusColorClass = "bg-yellow-500";
              let iconColorClass = "text-yellow-500";
              let StatusIcon = AlertTriangle;

              if (item.stock === 0) {
                 statusColorClass = "bg-red-500";
                 iconColorClass = "text-red-500";
              }

              return (
                <div key={item.id}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-foreground">{item.name}</span>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <StatusIcon className={`h-4 w-4 mr-1 ${iconColorClass}`} />
                      {item.stock}/{threshold}
                    </div>
                  </div>
                  <Progress value={percentage} indicatorClassName={statusColorClass} aria-label={`Nivel de stock de ${item.name} ${percentage.toFixed(0)}%`} />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
       <CardFooter>
          <Button variant="outline" size="sm" asChild className="w-full">
            <Link href="/dashboard/inventory">Gestionar Inventario</Link>
          </Button>
       </CardFooter>
    </Card>
  );
}
