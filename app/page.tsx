import Link from "next/link"
import { ArrowRight, Truck, Package, Camera, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">
                  Smart Moving Quotes
                </div>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Get an Accurate Moving Quote in Minutes
                </h1>
                <p className="text-gray-500 dark:text-gray-400 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Take photos of your rooms, and our app will detect your furniture and provide an accurate moving quote
                  instantly.
                </p>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/quote">
                    <Button className="w-full min-[400px]:w-auto">
                      Start Your Quote <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button variant="outline" className="w-full min-[400px]:w-auto">
                      Contact Us
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="mx-auto w-full max-w-[500px] aspect-video rounded-xl bg-gray-200 dark:bg-gray-800 overflow-hidden">
                <img
                  src="/placeholder.svg?height=500&width=800"
                  alt="Moving service illustration"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">How It Works</h2>
                <p className="max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Our smart quote system makes getting a moving estimate quick and accurate
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-3 lg:gap-12">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                  <Camera className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Take Photos</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Snap pictures of each room in your home using our app
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                  <Calculator className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Get a Quote</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Our AI detects your furniture and calculates an accurate quote
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                  <Truck className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Book Your Move</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Confirm your quote and schedule your move with our professional team
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Our Services</h2>
                <p className="max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Customized moving solutions to fit your needs
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:gap-12">
              <div className="flex flex-col space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-gray-900">
                  <Truck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Loading & Unloading</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Choose loading, unloading, or both services based on your specific needs
                </p>
              </div>
              <div className="flex flex-col space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-gray-900">
                  <Package className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Packing Services</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Professional packing services to ensure your belongings are safely transported
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
