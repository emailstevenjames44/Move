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
  const [images, setImages] = useState<string[]>([]) // Stores dataURLs of images with detections
  const [detectedFurniture, setDetectedFurniture] = useState<{ [key: string]: number }>({})
  const [isProcessing, setIsProcessing] = useState(false) // General processing state for "Continue" button
  const [activeTab, setActiveTab] = useState<string>("camera")
  const [rooms, setRooms] = useState<Room[]>([])

  // New state variables for batch upload
  const [uploadedImageFiles, setUploadedImageFiles] = useState<File[]>([])
  const [currentImageIndexToProcess, setCurrentImageIndexToProcess] = useState(0)
  const [imageToPassToDetector, setImageToPassToDetector] = useState<string | null>(null)
  const [isBatchProcessing, setIsBatchProcessing] = useState(false)


  const processNextUploadedImage = () => {
    console.log("[QuotePage] processNextUploadedImage called for index:", currentImageIndexToProcess);
    if (currentImageIndexToProcess < uploadedImageFiles.length) {
      const file = uploadedImageFiles[currentImageIndexToProcess];
      const currentIndex = currentImageIndexToProcess; // Capture index for async callbacks
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          console.log("[QuotePage] FileReader success, setting imageToPassToDetector for index:", currentIndex);
          setImageToPassToDetector(event.target.result.toString());
        } else {
          console.error("[QuotePage] FileReader error: No result for file at index", currentIndex, file.name);
          setCurrentImageIndexToProcess(prev => prev + 1);
        }
      };
      reader.onerror = () => { // Removed 'error' param as it's not standard on direct onerror
        console.error("[QuotePage] FileReader error for index:", currentIndex, reader.error);
        // TODO: Consider user-facing feedback if multiple files fail.
        setCurrentImageIndexToProcess(prev => prev + 1);
      };
      reader.readAsDataURL(file);
    } else {
      // All images processed
      setIsBatchProcessing(false)
      setImageToPassToDetector(null) // Clear it once done
      // Consider enabling the "Continue" button here or based on detectedFurniture
    }
  }

  // Effect to trigger processing when currentImageIndexToProcess changes
  // and we are in batch processing mode.
  useEffect(() => {
    console.log(
        "[QuotePage] Batch processing effect triggered. Index:", currentImageIndexToProcess, 
        "IsBatchProcessing:", isBatchProcessing, 
        "DetectorReady:", !imageToPassToDetector,
        "Files in batch:", uploadedImageFiles.length
    );
    if (isBatchProcessing && currentImageIndexToProcess < uploadedImageFiles.length) {
        // Only call if imageToPassToDetector is null, meaning we are ready for the next one
        // or the previous one has been "cleared" by handleImageCapture
        if (imageToPassToDetector === null) {
            processNextUploadedImage();
        }
    } else if (isBatchProcessing && currentImageIndexToProcess >= uploadedImageFiles.length) {
        // Finished all uploads
        console.log("[QuotePage] All uploaded images processed or attempted.");
        setIsBatchProcessing(false);
        setImageToPassToDetector(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentImageIndexToProcess, isBatchProcessing, uploadedImageFiles.length]);


  const handleImageCapture = (imageUrl: string, detectedItems: { [key: string]: number }) => {
    console.log("[QuotePage] handleImageCapture called with detectedItems:", detectedItems, "imageUrl length:", imageUrl.length);
    console.log("[QuotePage] Current imageToPassToDetector state:", imageToPassToDetector);

    setImages(prevImages => [...prevImages, imageUrl])

    const updatedFurniture = { ...detectedFurniture }
    Object.entries(detectedItems).forEach(([item, count]) => {
      updatedFurniture[item] = (updatedFurniture[item] || 0) + count
    })
    setDetectedFurniture(updatedFurniture)
    console.log("[QuotePage] Updated detectedFurniture:", updatedFurniture);

    // If this capture was triggered by an uploaded image (part of a batch)
    if (imageToPassToDetector !== null) {
      setImageToPassToDetector(null); // Signal that this image is processed
      const newIndex = currentImageIndexToProcess + 1;
      setCurrentImageIndexToProcess(newIndex); // Move to next image
      console.log("[QuotePage] Batch processing: advancing to next image, index:", newIndex);
      // processNextUploadedImage() will be called by the useEffect watching currentImageIndexToProcess
    }
  }

  const handleProcessImages = () => { // This is the "Continue" button
    setIsProcessing(true)
    // This function is now simpler, as furniture is accumulated in real-time
    // or after batch processing.
    setTimeout(() => {
      setIsProcessing(false)
      setStep(2)
    }, 500)
  }

  const handleQuoteComplete = () => {
    router.push("/contact")
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Reset states for a new batch
      setImages([])
      setDetectedFurniture({})
      setImageToPassToDetector(null)
      
      const filesArray = Array.from(e.target.files)
      setUploadedImageFiles(filesArray)
      setCurrentImageIndexToProcess(0) // Start from the first image
      setIsBatchProcessing(true) // Signal that batch processing has started
      // processNextUploadedImage() will be called by the useEffect watching currentImageIndexToProcess & isBatchProcessing
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
                    <FurnitureDetector 
                        onCapture={handleImageCapture} 
                        imageToProcess={imageToPassToDetector} 
                    />

                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2">Processed Images ({images.length})</h3>
                      {images.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No images processed yet.</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {images.map((img, i) => (
                            <div key={i} className="aspect-video bg-muted rounded-md overflow-hidden">
                              <img
                                src={img || "/placeholder.svg"}
                                alt={`Processed ${i + 1}`}
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
                      <strong>Camera Tips / Upload Info:</strong>
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Ensure good lighting for camera or uploaded images.</li>
                      <li>Grant camera permissions if using the camera.</li>
                       {isBatchProcessing && (
                        <li>Processing uploaded image {currentImageIndexToProcess + 1} of {uploadedImageFiles.length}...</li>
                       )}
                       {!isBatchProcessing && uploadedImageFiles.length > 0 && currentImageIndexToProcess >= uploadedImageFiles.length && (
                        <li>All {uploadedImageFiles.length} uploaded images processed.</li>
                       )}
                    </ul>
                  </div>

                  {Object.keys(detectedFurniture).length > 0 && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <h3 className="font-medium mb-2">Accumulated Detected Furniture</h3>
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
                     <div>
                        {isBatchProcessing ? (
                            <p className="text-sm text-muted-foreground">
                                Processing: {currentImageIndexToProcess +1} / {uploadedImageFiles.length}...
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                {images.length} {images.length === 1 ? "image" : "images"} processed.
                                {uploadedImageFiles.length > 0 && images.length === uploadedImageFiles.length && " All uploads complete."}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => document.getElementById("file-upload")?.click()}
                        disabled={isBatchProcessing}
                       >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Images
                        <input
                          id="file-upload"
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleFileUpload}
                          disabled={isBatchProcessing}
                        />
                      </Button>
                      <Button
                        onClick={handleProcessImages}
                        disabled={
                            isBatchProcessing || // Disabled if batch is ongoing
                            isProcessing || // General processing lock
                            (images.length === 0 && Object.keys(detectedFurniture).length === 0) || // No images and no furniture
                            (uploadedImageFiles.length > 0 && currentImageIndexToProcess < uploadedImageFiles.length) // Still batch processing
                        }
                      >
                        {isProcessing || isBatchProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {isBatchProcessing ? `Processing Batch...` : `Processing...`}
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
