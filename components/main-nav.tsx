import Link from "next/link"
import { Truck } from "lucide-react"

export function MainNav() {
  return (
    <div className="hidden lg:flex gap-6 md:gap-10">
      <Link href="/" className="flex items-center space-x-2">
        <Truck className="h-6 w-6" />
        <span className="font-bold inline-block">MoveQuote</span>
      </Link>
      <nav className="flex gap-6">
        <Link href="/" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
          Home
        </Link>
        <Link
          href="/quote"
          className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Get a Quote
        </Link>
        <Link
          href="/services"
          className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Services
        </Link>
        <Link
          href="/contact"
          className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Contact
        </Link>
      </nav>
    </div>
  )
}
