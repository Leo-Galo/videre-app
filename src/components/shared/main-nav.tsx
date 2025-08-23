
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface MainNavProps extends React.HTMLAttributes<HTMLElement> {
  items?: { title: string; href: string; disabled?: boolean }[];
}

export function MainNav({ className, items, ...props }: MainNavProps) {
  const pathname = usePathname();
  const defaultItems = [
    { title: 'Características', href: '/#features' },
    { title: 'Planes', href: '/#pricing' },
    { title: 'Testimonios', href: '/#testimonials' },
    { title: 'Contacto', href: '/contact' },
  ];
  const navItems = items || defaultItems;

  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === item.href ? "text-primary" : "text-foreground/60",
            item.disabled && "cursor-not-allowed opacity-80"
          )}
          aria-disabled={item.disabled}
          tabIndex={item.disabled ? -1 : undefined}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
}
