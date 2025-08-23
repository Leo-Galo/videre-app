
"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: string; 
  trendDirection?: "up" | "down" | "neutral" | "warning";
  isLoading?: boolean;
  link?: { href: string; text: string; target?: string; };
}

export function KpiCard({ title, value, description, icon: Icon, trend, trendDirection = "neutral", isLoading = false, link }: KpiCardProps) {
  const trendColor = 
    trendDirection === "up" ? "text-green-600" : 
    trendDirection === "down" ? "text-red-600" : 
    trendDirection === "warning" ? "text-yellow-600" : 
    "text-muted-foreground";

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow rounded-xl flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent className="flex-grow">
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
            {link && <Skeleton className="h-6 w-1/3 mt-2" />}
          </>
        ) : (
          <>
            <div className="text-3xl font-bold text-foreground">{value}</div>
            {description && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
            {trend && <p className={`text-xs ${trendColor} pt-1`}>{trend}</p>}
            
          </>
        )}
      </CardContent>
      {link && !isLoading && (
        <CardFooter className="pt-0 pb-3">
            <Button variant="link" size="sm" asChild className="p-0 h-auto text-xs text-primary hover:underline">
                <Link href={link.href} target={link.target}>{link.text}</Link>
            </Button>
        </CardFooter>
      )}
    </Card>
  );
}
