"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowRight, Truck, Clock, DollarSign } from "lucide-react"

interface QuoteCalculatorProps {
  detectedFurniture: { [key: string]: number }
  onComplete: () => void
}

// Furniture weight and time estimates
const FURNITURE_ESTIMATES = {
  Sofa: { weight: 150, timeMinutes: 20 },
  Chair: { weight: 30, timeMinutes: 5 },
  Table: { weight: 70, timeMinutes: 15 },
  Bed: { weight: 100, timeMinutes: 25 },
  Dresser: { weight: 120, timeMinutes: 20 },
  Bookshelf: { weight: 80, timeMinutes: 15 },
  TV: { weight: 40, timeMinutes: 10 },
  Desk: { weight: 90, timeMinutes: 15 },
  Wardrobe: { weight: 150, timeMinutes: 30 },
  Cabinet: { weight: 100, timeMinutes: 20 },
}

// Hourly rate for 2 movers
const HOURLY_RATE = 120

export function QuoteCalculator({ detectedFurniture, onComplete }: QuoteCalculatorProps) {
  // Calculate total time in hours
  const calculateTotalTime = () => {
    let totalMinutes = 0

    // Add time for each piece of furniture
    Object.entries(detectedFurniture).forEach(([item, count]) => {
      if (FURNITURE_ESTIMATES[item]) {
        totalMinutes += FURNITURE_ESTIMATES[item].timeMinutes * count
      } else {
        // Default estimate for unknown items
        totalMinutes += 10 * count
      }
    })

    // Add base time for truck setup, travel between rooms, etc.
    totalMinutes += 60

    // Convert to hours and round up to nearest half hour
    return Math.ceil(totalMinutes / 30) / 2
  }

  const totalHours = calculateTotalTime()
  const hourlyQuote = totalHours * HOURLY_RATE

  // Maximum price is 20% more than the hourly quote
  const maximumPrice = Math.ceil((hourlyQuote * 1.2) / 10) * 10

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Your Moving Quote</CardTitle>
          <CardDescription>Based on the furniture detected in your photos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Detected Furniture</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(detectedFurniture).map(([item, count]) => (
                    <TableRow key={item}>
                      <TableCell>{item}</TableCell>
                      <TableCell className="text-right">{count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <Clock className="h-8 w-8 mb-2 text-primary" />
                    <h3 className="font-medium">Estimated Time</h3>
                    <p className="text-2xl font-bold">{totalHours} hours</p>
                    <p className="text-sm text-muted-foreground">For 2 movers</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <DollarSign className="h-8 w-8 mb-2 text-primary" />
                    <h3 className="font-medium">Hourly Rate</h3>
                    <p className="text-2xl font-bold">${HOURLY_RATE}/hr</p>
                    <p className="text-sm text-muted-foreground">For 2 movers</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <Truck className="h-8 w-8 mb-2 text-primary" />
                    <h3 className="font-medium">Maximum Price</h3>
                    <p className="text-2xl font-bold">${maximumPrice}</p>
                    <p className="text-sm text-muted-foreground">Won't exceed this amount</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2">Quote Summary</h3>
              <p className="text-sm mb-4">
                Based on the furniture detected in your photos, we estimate your move will take approximately
                <span className="font-bold"> {totalHours} hours </span>
                with 2 movers at a rate of
                <span className="font-bold"> ${HOURLY_RATE}/hour</span>.
              </p>
              <p className="text-sm">
                Your total estimated cost is
                <span className="font-bold"> ${hourlyQuote.toFixed(2)}</span>, with a maximum price of
                <span className="font-bold"> ${maximumPrice}</span>
                even if the move takes longer than expected.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={onComplete} className="w-full">
            Continue to Contact Form
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
