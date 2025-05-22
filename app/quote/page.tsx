"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Loader2, Info, AlertTriangle, ClipboardList } from "lucide-react"
import { useRouter } from "next/navigation"
import { FurnitureDetector } from "@/components/furniture-detector"
import { QuoteCalculator } from "@/components/quote-calculator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ManualFurnitureEntry } from "@/components/manual-furniture-entry"

// Define the Room interface for manual entry
interface FurnitureItem {
  id: string
  name: string
  quantity: number
}

interface Room {
  id: string
  name: string
  furniture: FurnitureItem[]
}

export default function QuotePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [images, setImages] = useState<string[]>([])
  const [detectedFurniture, setDetectedFurniture] = useState<{ [key: string]: number }>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("camera")
  const [rooms, setRooms] = useState<Room[]>([])

  const handleImageCapture = (imageUrl: string, detectedItems: { [key: string]: number }) => {
    setImages([...images, imageUrl])

    // Merge the newly detected items with the existing ones
    const updatedFurniture = { ...detectedFurniture }

    Object.entries(detectedItems).forEach(([item, count]) => {
      updatedFurniture[item] = (updatedFurniture[item] || 0) + count
    })

    setDetectedFurniture(updatedFurniture)
  }

  const handleProcessImages = () => {
    setIsProcessing(true)

    // Since we're now detecting furniture in real-time,
    // we can just move to the next step without additional processing
    setTimeout(() => {
      setIsProcessing(false)
      setStep(2)
    }, 500)
  }

  const handleQuoteComplete = () => {
    router.push("/contact")
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach((file) => {
        const reader = new FileReader()
        reader.onload = (event) => {
          if (event.target?.result) {
            // For uploaded images, we can't do real-time detection
            // So we'll just add the image and use default furniture estimates
            setImages([...images, event.target.result.toString()])

            // Add some default furniture for uploaded images
            // In a real app, you would send this to a server for processing
            const defaultFurniture = {
              Chair: 2,
              Table: 1,
              Sofa: 1,
            }

            const updatedFurniture = { ...detectedFurniture }
            Object.entries(defaultFurniture).forEach(([item, count]) => {
              updatedFurniture[item] = (updatedFurniture[item] || 0) + count
            })

            setDetectedFurniture(updatedFurniture)
          }
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const handleManualEntryComplete = (enteredRooms: Room[]) => {
    setRooms(enteredRooms)

    // Convert rooms to detectedFurniture format
    const furniture: { [key: string]: number } = {}

    enteredRooms.forEach((room) => {
      room.furniture.forEach((item) => {
        furniture[item.name] = (furniture[item.name] || 0) + item.quantity
      })
    })

    setDetectedFurniture(furniture)
    setStep(2)
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">Get Your Moving Quote</h1>

      {step === 1 && (
        <div className="max-w-3xl mx-auto">
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Browser Compatibility Notice</AlertTitle>
            <AlertDescription>
              For the best experience with camera features, we recommend using Chrome, Safari, or Firefox on a device
              with a camera. If you encounter issues, you can always upload images or use the manual entry option
              instead.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Step 1: Add Your Furniture</CardTitle>
                  <CardDescription>
                    Take photos of each room or manually enter your furniture to get an accurate quote.
                  </CardDescription>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Info className="h-4 w-4" />
                        <span className="sr-only">Tips for better detection</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">
                        <strong>Tips for better detection:</strong>
                        <br />• Ensure good lighting
                        <br />• Take photos from different angles
                        <br />• Keep a reasonable distance from furniture
                        <br />• Use image settings for low-light conditions
                        <br />• If camera doesn't work, use manual entry
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="camera" value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="camera">Camera Detection</TabsTrigger>
                  <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                </TabsList>
                <TabsContent value="camera" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <FurnitureDetector onCapture={handleImageCapture} />

                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2">Captured Images ({images.length})</h3>
                      {images.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No images captured yet</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {images.map((img, i) => (
                            <div key={i} className="aspect-video bg-muted rounded-md overflow-hidden">
                              <img
                                src={img || "/placeholder.svg"}
                                alt={`Room ${i + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 text-sm text-muted-foreground">
                    <p className="mb-2">
                      <strong>Having trouble with the camera?</strong>
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Make sure you've granted camera permissions in your browser</li>
                      <li>Try using a different browser (Chrome or Safari recommended)</li>
                      <li>If on mobile, ensure the app has camera access in your device settings</li>
                      <li>You can use the "Upload Images" option or switch to "Manual Entry" tab</li>
                    </ul>
                  </div>

                  {Object.keys(detectedFurniture).length > 0 && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <h3 className="font-medium mb-2">Detected Furniture</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Object.entries(detectedFurniture).map(([item, count]) => (
                          <div key={item} className="flex justify-between">
                            <span>{item}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-6">
                    <p className="text-sm text-muted-foreground">
                      {images.length} {images.length === 1 ? "image" : "images"} captured
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Images
                        <input
                          id="file-upload"
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </Button>
                      <Button
                        onClick={handleProcessImages}
                        disabled={images.length === 0 || isProcessing || Object.keys(detectedFurniture).length === 0}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Continue"
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="manual" className="mt-4">
                  <ManualFurnitureEntry onComplete={handleManualEntryComplete} />
                </TabsContent>
              </Tabs>

              <div className="flex justify-center mt-4">
                <Button
                  variant="ghost"
                  onClick={() => setActiveTab(activeTab === "camera" ? "manual" : "camera")}
                  className="text-sm"
                >
                  <ClipboardList className="h-4 w-4 mr-2" />
                  {activeTab === "camera" ? "Switch to manual furniture entry" : "Switch to camera detection"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 2 && <QuoteCalculator detectedFurniture={detectedFurniture} onComplete={handleQuoteComplete} />}
    </div>
  )
}
