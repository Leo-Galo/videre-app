
"use client";

import { SiteLogo } from '@/components/shared/site-logo';
import { MainNav } from '@/components/shared/main-nav';
import { UserNav } from '@/components/shared/user-nav';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <SiteLogo className="mr-8" />
        <MainNav className="mx-6 hidden md:flex" />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <UserNav />
          </nav>
        </div>
      </div>
    </header>
  );
}
