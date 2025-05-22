"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, LogIn, LogOut, Search, User, Calendar, Phone, Mail, MapPin } from "lucide-react"

// Mock data for quote requests
const MOCK_QUOTE_REQUESTS = [
  {
    id: "q-001",
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "555-123-4567",
    date: "2023-05-15",
    serviceType: "both",
    needsPacking: true,
    loadingAddress: "123 Main St, Anytown, USA",
    unloadingAddress: "456 Oak Ave, Newcity, USA",
    furniture: {
      Sofa: 1,
      Chair: 4,
      "Dining Table": 1,
      Bed: 2,
      Dresser: 2,
      Bookshelf: 1,
    },
    estimatedHours: 4.5,
    estimatedCost: 540,
    status: "pending",
  },
  {
    id: "q-002",
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    phone: "555-987-6543",
    date: "2023-05-18",
    serviceType: "loading",
    needsPacking: false,
    loadingAddress: "789 Pine St, Sometown, USA",
    unloadingAddress: "",
    furniture: {
      Sofa: 2,
      Chair: 6,
      "Coffee Table": 1,
      "TV Stand": 1,
      Bed: 1,
    },
    estimatedHours: 3,
    estimatedCost: 360,
    status: "confirmed",
  },
  {
    id: "q-003",
    name: "Michael Brown",
    email: "mbrown@example.com",
    phone: "555-456-7890",
    date: "2023-05-20",
    serviceType: "both",
    needsPacking: true,
    loadingAddress: "321 Elm St, Oldtown, USA",
    unloadingAddress: "654 Maple Dr, Faraway, USA",
    furniture: {
      Sofa: 1,
      Chair: 2,
      "Dining Table": 1,
      Bed: 3,
      Dresser: 3,
      Desk: 1,
      Bookshelf: 2,
      "TV Stand": 1,
    },
    estimatedHours: 6,
    estimatedCost: 720,
    status: "completed",
  },
]

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [quoteRequests, setQuoteRequests] = useState(MOCK_QUOTE_REQUESTS)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null)

  // Check if user is already authenticated (from localStorage)
  useEffect(() => {
    const authStatus = localStorage.getItem("moveQuoteAdminAuth")
    if (authStatus === "true") {
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Simulate API call
    setTimeout(() => {
      if (username === "admin" && password === "password") {
        setIsAuthenticated(true)
        localStorage.setItem("moveQuoteAdminAuth", "true")
      } else {
        setError("Invalid username or password")
      }
      setIsLoading(false)
    }, 1000)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("moveQuoteAdminAuth")
  }

  // Filter quote requests based on search term
  const filteredQuotes = quoteRequests.filter(
    (quote) =>
      quote.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.phone.includes(searchTerm) ||
      quote.id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Get the selected quote details
  const quoteDetails = quoteRequests.find((q) => q.id === selectedQuote)

  if (!isAuthenticated) {
    return (
      <div className="container py-10 flex items-center justify-center min-h-[80vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Admin Login</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access the admin dashboard
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">{error}</div>
              )}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      <Tabs defaultValue="quotes">
        <TabsList className="mb-4">
          <TabsTrigger value="quotes">Quote Requests</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="quotes">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Quote Requests</CardTitle>
                  <CardDescription>View and manage customer quote requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative mb-4">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, or ID..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                    {filteredQuotes.length > 0 ? (
                      filteredQuotes.map((quote) => (
                        <div
                          key={quote.id}
                          className={`p-3 border rounded-md cursor-pointer transition-colors ${
                            selectedQuote === quote.id ? "bg-primary/10 border-primary" : "hover:bg-muted"
                          }`}
                          onClick={() => setSelectedQuote(quote.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium flex items-center">
                                <User className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                {quote.name}
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center mt-1">
                                <Calendar className="h-3.5 w-3.5 mr-1" />
                                {quote.date}
                              </div>
                            </div>
                            <Badge
                              variant={
                                quote.status === "confirmed"
                                  ? "default"
                                  : quote.status === "completed"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {quote.status}
                            </Badge>
                          </div>
                          <div className="mt-2 text-sm">
                            <div className="flex justify-between">
                              <span>Items:</span>
                              <span>{Object.keys(quote.furniture).length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Est. Cost:</span>
                              <span>${quote.estimatedCost}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">No quote requests found</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2">
              {quoteDetails ? (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>Quote #{quoteDetails.id}</CardTitle>
                        <CardDescription>Submitted on {quoteDetails.date}</CardDescription>
                      </div>
                      <Badge
                        variant={
                          quoteDetails.status === "confirmed"
                            ? "default"
                            : quoteDetails.status === "completed"
                              ? "secondary"
                              : "outline"
                        }
                        className="capitalize"
                      >
                        {quoteDetails.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h3 className="font-medium">Customer Information</h3>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{quoteDetails.name}</span>
                          </div>
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{quoteDetails.email}</span>
                          </div>
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{quoteDetails.phone}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h3 className="font-medium">Service Details</h3>
                        <div className="space-y-2">
                          <div className="flex items-start">
                            <MapPin className="h-4 w-4 mr-2 text-muted-foreground shrink-0 mt-0.5" />
                            <div>
                              <div className="text-sm font-medium">Loading Address:</div>
                              <div>{quoteDetails.loadingAddress || "N/A"}</div>
                            </div>
                          </div>
                          {quoteDetails.serviceType !== "loading" && (
                            <div className="flex items-start">
                              <MapPin className="h-4 w-4 mr-2 text-muted-foreground shrink-0 mt-0.5" />
                              <div>
                                <div className="text-sm font-medium">Unloading Address:</div>
                                <div>{quoteDetails.unloadingAddress || "N/A"}</div>
                              </div>
                            </div>
                          )}
                          <div>
                            <span className="text-sm font-medium">Service Type: </span>
                            <span className="capitalize">{quoteDetails.serviceType}</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium">Packing Services: </span>
                            <span>{quoteDetails.needsPacking ? "Yes" : "No"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-medium">Furniture Items</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(quoteDetails.furniture).map(([item, quantity]) => (
                            <TableRow key={item}>
                              <TableCell>{item}</TableCell>
                              <TableCell className="text-right">{quantity}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-sm font-medium text-muted-foreground">Estimated Hours</div>
                            <div className="text-2xl font-bold mt-1">{quoteDetails.estimatedHours}</div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-sm font-medium text-muted-foreground">Hourly Rate</div>
                            <div className="text-2xl font-bold mt-1">$120</div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-sm font-medium text-muted-foreground">Total Estimate</div>
                            <div className="text-2xl font-bold mt-1">${quoteDetails.estimatedCost}</div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-6">
                    <Button variant="outline">Download Quote</Button>
                    <div className="space-x-2">
                      <Button variant="outline">Update Status</Button>
                      <Button>Contact Customer</Button>
                    </div>
                  </CardFooter>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center min-h-[400px] text-center">
                    <div className="text-muted-foreground mb-2">
                      <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <h3 className="text-lg font-medium">No Quote Selected</h3>
                      <p className="max-w-md mx-auto mt-2">Select a quote request from the list to view its details</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
              <CardDescription>Overview of quote requests and business metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-sm font-medium text-muted-foreground">Total Quotes</div>
                      <div className="text-3xl font-bold mt-1">{quoteRequests.length}</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-sm font-medium text-muted-foreground">Confirmed Quotes</div>
                      <div className="text-3xl font-bold mt-1">
                        {quoteRequests.filter((q) => q.status === "confirmed").length}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-sm font-medium text-muted-foreground">Completed Moves</div>
                      <div className="text-3xl font-bold mt-1">
                        {quoteRequests.filter((q) => q.status === "completed").length}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-8">
                <h3 className="font-medium mb-4">Recent Activity</h3>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quoteRequests
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .slice(0, 5)
                        .map((quote) => (
                          <TableRow key={quote.id}>
                            <TableCell>{quote.date}</TableCell>
                            <TableCell>{quote.name}</TableCell>
                            <TableCell className="capitalize">{quote.serviceType}</TableCell>
                            <TableCell className="text-right">${quote.estimatedCost}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
