"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, Truck, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    // The Sheet component becomes the root for lg:hidden scenarios
    <Sheet open={open} onOpenChange={setOpen}>
      {/* This div will ensure logo and trigger are on the same line, taking full width */}
      <div className="flex items-center justify-between w-full"> 
        <Link href="/" className="flex items-center space-x-2" onClick={() => setOpen(false)}>
          <Truck className="h-6 w-6" />
          <span className="font-bold">MoveQuote</span>
        </Link>
        
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon"> {/* Removed lg:hidden from here as parent div controls visibility */}
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
      </div>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        {/* Logo inside the sheet for when it's open */}
        <div className="flex items-center justify-between pb-4 border-b mb-4">
          <Link href="/" className="flex items-center space-x-2" onClick={() => setOpen(false)}>
            <Truck className="h-6 w-6" />
            <span className="font-bold">MoveQuote</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
            <X className="h-6 w-6" />
            <span className="sr-only">Close menu</span>
          </Button>
        </div>
        <nav className="mt-8 flex flex-col gap-4">
          <Link href="/quote" className="text-lg font-medium hover:text-foreground" onClick={() => setOpen(false)}>
            Home/Quote
          </Link>
          {/* "Get a Quote" is removed as Home/Quote points to /quote */}
          <Link href="/services" className="text-lg font-medium hover:text-foreground" onClick={() => setOpen(false)}>
            Services
          </Link>
          <Link href="/contact" className="text-lg font-medium hover:text-foreground" onClick={() => setOpen(false)}>
            Contact Us
          </Link>
          <Link href="/admin" className="text-lg font-medium hover:text-foreground" onClick={() => setOpen(false)}>
            Admin
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
