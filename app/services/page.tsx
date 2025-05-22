import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Truck, Package, Clock, DollarSign, ShieldCheck, Users } from "lucide-react"

export default function ServicesPage() {
  return (
    <div className="container py-10">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Our Moving Services</h1>
          <p className="text-muted-foreground">Professional moving services tailored to your needs</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="h-5 w-5 mr-2" />
                Loading & Unloading
              </CardTitle>
              <CardDescription>Professional handling of your belongings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Our experienced movers will carefully load and unload your belongings, ensuring everything is properly
                secured during transport and placed exactly where you want it in your new home.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <ShieldCheck className="h-5 w-5 mr-2 text-primary shrink-0" />
                  <span>Careful handling of all items, including fragile belongings</span>
                </li>
                <li className="flex items-start">
                  <Users className="h-5 w-5 mr-2 text-primary shrink-0" />
                  <span>Professional team of 2 movers included in standard rate</span>
                </li>
                <li className="flex items-start">
                  <Clock className="h-5 w-5 mr-2 text-primary shrink-0" />
                  <span>Efficient loading and unloading to save you time</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Packing Services
              </CardTitle>
              <CardDescription>Let us handle the packing for you</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Save time and ensure your belongings are properly protected with our professional packing services. We
                use high-quality materials and proven techniques to keep everything safe.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <ShieldCheck className="h-5 w-5 mr-2 text-primary shrink-0" />
                  <span>Professional-grade packing materials for maximum protection</span>
                </li>
                <li className="flex items-start">
                  <Clock className="h-5 w-5 mr-2 text-primary shrink-0" />
                  <span>Save hours of preparation time before your move</span>
                </li>
                <li className="flex items-start">
                  <DollarSign className="h-5 w-5 mr-2 text-primary shrink-0" />
                  <span>Available as an add-on service to any move</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10">
          <Card>
            <CardHeader>
              <CardTitle>Our Pricing Structure</CardTitle>
              <CardDescription>Transparent pricing with no hidden fees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-medium mb-2 flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      Hourly Rate
                    </h3>
                    <p className="text-sm mb-2">Our standard rate is $120/hour for a team of 2 professional movers.</p>
                    <p className="text-sm text-muted-foreground">
                      This includes all equipment needed for a standard move.
                    </p>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-medium mb-2 flex items-center">
                      <DollarSign className="h-5 w-5 mr-2" />
                      Maximum Price Guarantee
                    </h3>
                    <p className="text-sm mb-2">
                      We provide a maximum price that your move won't exceed, even if it takes longer than estimated.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      This gives you peace of mind and helps with budgeting.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Additional Services</h3>
                  <ul className="space-y-2">
                    <li className="flex justify-between items-center pb-2 border-b">
                      <span>Packing Services</span>
                      <span className="font-medium">$40/hour per packer</span>
                    </li>
                    <li className="flex justify-between items-center pb-2 border-b">
                      <span>Packing Materials</span>
                      <span className="font-medium">Priced per item used</span>
                    </li>
                    <li className="flex justify-between items-center pb-2 border-b">
                      <span>Additional Mover</span>
                      <span className="font-medium">$40/hour per additional mover</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>Specialty Item Handling (pianos, safes, etc.)</span>
                      <span className="font-medium">Custom quote required</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
