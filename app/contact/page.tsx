"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Check, Loader2 } from "lucide-react"

export default function ContactPage() {
  const [serviceType, setServiceType] = useState("both")
  const [needsPacking, setNeedsPacking] = useState(false)
  const [loadingAddress, setLoadingAddress] = useState("")
  const [unloadingAddress, setUnloadingAddress] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSubmitted(true)
    }, 1500)
  }

  if (isSubmitted) {
    return (
      <div className="container py-10">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Quote Request Submitted!</CardTitle>
              <CardDescription className="text-center">We've received your moving quote request</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="rounded-full bg-green-100 p-3 mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-center mb-4">
                Thank you for submitting your quote request. One of our moving specialists will contact you shortly to
                confirm the details and schedule your move.
              </p>
              <div className="bg-muted p-4 rounded-lg w-full">
                <h3 className="font-medium mb-2">Your Request Details</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <span className="font-medium">Name:</span> {name}
                  </li>
                  <li>
                    <span className="font-medium">Email:</span> {email}
                  </li>
                  <li>
                    <span className="font-medium">Phone:</span> {phone}
                  </li>
                  <li>
                    <span className="font-medium">Service Type:</span>{" "}
                    {serviceType === "both"
                      ? "Loading & Unloading"
                      : serviceType === "loading"
                        ? "Loading Only"
                        : "Unloading Only"}
                  </li>
                  <li>
                    <span className="font-medium">Packing Services:</span> {needsPacking ? "Yes" : "No"}
                  </li>
                  {(serviceType === "loading" || serviceType === "both") && (
                    <li>
                      <span className="font-medium">Loading Address:</span> {loadingAddress}
                    </li>
                  )}
                  {(serviceType === "unloading" || serviceType === "both") && (
                    <li>
                      <span className="font-medium">Unloading Address:</span> {unloadingAddress}
                    </li>
                  )}
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => (window.location.href = "/")} className="w-full">
                Return to Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">Contact Information</h1>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Moving Service Details</CardTitle>
            <CardDescription>Provide your contact information and service preferences</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Service Options</h3>

                <div className="space-y-2">
                  <Label>Service Type</Label>
                  <RadioGroup value={serviceType} onValueChange={setServiceType} className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="both" id="both" />
                      <Label htmlFor="both">Both Loading & Unloading</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="loading" id="loading" />
                      <Label htmlFor="loading">Loading Only</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="unloading" id="unloading" />
                      <Label htmlFor="unloading">Unloading Only</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="packing"
                    checked={needsPacking}
                    onCheckedChange={(checked) => setNeedsPacking(checked === true)}
                  />
                  <Label htmlFor="packing">I need help with packing</Label>
                </div>

                {(serviceType === "loading" || serviceType === "both") && (
                  <div className="space-y-2">
                    <Label htmlFor="loading-address">Loading Address</Label>
                    <Input
                      id="loading-address"
                      placeholder="Enter the address where items will be loaded"
                      value={loadingAddress}
                      onChange={(e) => setLoadingAddress(e.target.value)}
                      required
                    />
                  </div>
                )}

                {(serviceType === "unloading" || serviceType === "both") && (
                  <div className="space-y-2">
                    <Label htmlFor="unloading-address">Unloading Address</Label>
                    <Input
                      id="unloading-address"
                      placeholder="Enter the address where items will be unloaded"
                      value={unloadingAddress}
                      onChange={(e) => setUnloadingAddress(e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Contact Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special instructions or requirements for your move"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Quote Request"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
