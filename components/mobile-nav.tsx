"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, Truck, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <div className="lg:hidden flex items-center">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
          <div className="flex items-center justify-between">
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
            <Link href="/" className="text-lg font-medium hover:text-foreground" onClick={() => setOpen(false)}>
              Home
            </Link>
            <Link href="/quote" className="text-lg font-medium hover:text-foreground" onClick={() => setOpen(false)}>
              Get a Quote
            </Link>
            <Link href="/services" className="text-lg font-medium hover:text-foreground" onClick={() => setOpen(false)}>
              Services
            </Link>
            <Link href="/contact" className="text-lg font-medium hover:text-foreground" onClick={() => setOpen(false)}>
              Contact
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
      <Link href="/" className="flex items-center space-x-2 ml-4">
        <Truck className="h-6 w-6" />
        <span className="font-bold inline-block">MoveQuote</span>
      </Link>
    </div>
  )
}
