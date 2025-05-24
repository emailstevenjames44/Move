import React from 'react';
import { MobileNav } from '@/components/mobile-nav'; // Path based on your structure
import { MainNav } from '@/components/main-nav';     // Path based on your structure

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-primary text-primary-foreground p-4 shadow-md sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          {/* MobileNav will be for small screens, MainNav for large screens */}
          {/* MobileNav internally handles its trigger and logo for small screens */}
          <div className="lg:hidden"> {/* Show MobileNav on small screens */}
            <MobileNav />
          </div>
          <div className="hidden lg:flex flex-1 items-center justify-between"> {/* Show MainNav on large screens */}
            <MainNav />
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 mt-[64px]"> {/* Added mt-[64px] assuming header height */}
        {children}
      </main>

      <footer className="bg-muted text-muted-foreground p-4 text-center text-sm">
        © {new Date().getFullYear()} Moving Co. App. All rights reserved.
      </footer>
    </div>
  );
}
