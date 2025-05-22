"use client"

import type React from "react"

import { useState, useEffect } from "react" // Added useEffect
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input" // Added Input
import { Upload, Loader2, Info, AlertTriangle, ClipboardList, PlusCircle, Home, MinusCircle, Trash2, Plus } from "lucide-react" // Added PlusCircle, Home, MinusCircle, Trash2, Plus
import { useRouter } from "next/navigation"
import { FurnitureDetector } from "@/components/furniture-detector"
import { QuoteCalculator } from "@/components/quote-calculator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ManualFurnitureEntry } from "@/components/manual-furniture-entry"

// Helper function for generating unique IDs
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

// Define the Room interface for manual entry
interface FurnitureItem {
  id: string; 
  name: string;
  quantity: number;
  detectedBy?: "AI" | "MANUAL"; // New optional field
  roomId?: string; // Optional, if items are sometimes not yet in a room
}

interface Room {
  id: string; 
  name: string;
  furniture: FurnitureItem[];
  imagePreviewUrl?: string | null; // Optional: to store a representative image of the room
}

export default function QuotePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [images, setImages] = useState<string[]>([]) // Stores dataURLs of images with detections
  const [detectedFurniture, setDetectedFurniture] = useState<{ [key: string]: number }>({})
  const [isProcessing, setIsProcessing] = useState(false) // General processing state for "Continue" button
  const [activeTab, setActiveTab] = useState<string>("camera")
  const [rooms, setRooms] = useState<Room[]>([]) // This will be the primary state for storing all furniture.
  const [currentRoomName, setCurrentRoomName] = useState<string>("")
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null)
  const [newManualItemName, setNewManualItemName] = useState<string>("");
  const [newManualItemQuantity, setNewManualItemQuantity] = useState<number>(1);


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
    console.log("[QuotePage] Current room ID:", currentRoomId);

    if (!currentRoomId) {
      console.warn("[QuotePage] No current room set. Please name the room before capturing furniture.");
      alert("Please set a room name before capturing or uploading images for furniture detection.");
       // Clear the image from detector if it was from a batch upload, so it doesn't get stuck
      if (imageToPassToDetector !== null) {
        setImageToPassToDetector(null); 
        // Optionally, decide if you want to advance the batch or halt. Halting might be safer.
        // For now, we'll halt by not advancing currentImageIndexToProcess. User needs to set room then retry batch.
        // setIsBatchProcessing(false); // Or consider halting the batch
      }
      return;
    }

    setRooms(prevRooms => {
      const roomIndex = prevRooms.findIndex(room => room.id === currentRoomId);
      if (roomIndex === -1) {
        console.error("[QuotePage] Current room not found in rooms array. This should not happen.");
        return prevRooms; // Return previous state if room not found
      }

      const updatedRoom = { ...prevRooms[roomIndex] };
      updatedRoom.imagePreviewUrl = imageUrl; // Set or update the room's image preview

      const newFurnitureItems: FurnitureItem[] = [...updatedRoom.furniture];

      Object.entries(detectedItems).forEach(([itemName, count]) => {
        const existingItemIndex = newFurnitureItems.findIndex(item => item.name === itemName);
        if (existingItemIndex !== -1) {
          newFurnitureItems[existingItemIndex] = {
            ...newFurnitureItems[existingItemIndex],
            quantity: newFurnitureItems[existingItemIndex].quantity + count,
            detectedBy: "AI", // Mark as AI detected/updated
          };
        } else {
          newFurnitureItems.push({
            id: generateId(),
            name: itemName,
            quantity: count,
            detectedBy: "AI",
            roomId: currentRoomId,
          });
        }
      });
      updatedRoom.furniture = newFurnitureItems;
      
      const newRooms = [...prevRooms];
      newRooms[roomIndex] = updatedRoom;
      console.log("[QuotePage] Updated rooms state:", newRooms);
      return newRooms;
    });

    // Still update global detectedFurniture for summary, can be refactored later
    // This line is removed as per the subtask to rely on aggregation from rooms
    // const updatedGlobalFurniture = { ...detectedFurniture };
    // Object.entries(detectedItems).forEach(([item, count]) => {
    //   updatedGlobalFurniture[item] = (updatedGlobalFurniture[item] || 0) + count;
    // });
    // setDetectedFurniture(updatedGlobalFurniture);
    // console.log("[QuotePage] Updated global detectedFurniture:", updatedGlobalFurniture);


    setImages(prevImages => [...prevImages, imageUrl]); // Keep track of all processed images for display

    if (imageToPassToDetector !== null) {
      setImageToPassToDetector(null); 
      const newIndex = currentImageIndexToProcess + 1;
      setCurrentImageIndexToProcess(newIndex); 
      console.log("[QuotePage] Batch processing: advancing to next image, index:", newIndex);
    }
  }
  
  // --- Aggregation function for QuoteCalculator ---
  const aggregateFurnitureForQuote = (allRooms: Room[]): { [key: string]: number } => {
    const aggregated: { [key: string]: number } = {};
    allRooms.forEach(room => {
      room.furniture.forEach(item => {
        aggregated[item.name] = (aggregated[item.name] || 0) + item.quantity;
      });
    });
    console.log("[QuotePage] Aggregated furniture for quote:", aggregated);
    return aggregated;
  };

  const handleProcessImages = () => { // This is the "Continue to Quote" button
    setIsProcessing(true);
    console.log("[QuotePage] handleProcessImages called. Aggregating furniture from rooms state:", rooms);
    const aggregatedFurniture = aggregateFurnitureForQuote(rooms);
    setDetectedFurniture(aggregatedFurniture);
    
    // Simulate processing delay then move to next step
    setTimeout(() => {
      setIsProcessing(false);
      setStep(2);
    }, 500);
  }

  const handleQuoteComplete = () => {
    router.push("/contact")
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Reset states for a new batch
      setImages([])
      // setDetectedFurniture({}) // Keep existing detected furniture from other rooms/camera
      setImageToPassToDetector(null)
      
      const filesArray = Array.from(e.target.files)
      setUploadedImageFiles(filesArray)
      setCurrentImageIndexToProcess(0) // Start from the first image
      setIsBatchProcessing(true) // Signal that batch processing has started
      // processNextUploadedImage() will be called by the useEffect watching currentImageIndexToProcess & isBatchProcessing
    }
  }

  const handleManualEntryComplete = (enteredRooms: Room[]) => {
    // Ensure all items from manual entry have `detectedBy: "MANUAL"` and unique IDs.
    // The ManualFurnitureEntry component should ideally handle this.
    // For now, we'll assume `enteredRooms` is correctly formatted.
    const processedManualRooms = enteredRooms.map(room => ({
      ...room,
      id: room.id || generateId(), // Ensure room has an ID
      furniture: room.furniture.map(item => ({
        ...item,
        id: item.id || generateId(), // Ensure item has an ID
        detectedBy: "MANUAL" as "MANUAL", // Set detectedBy
        roomId: room.id || item.roomId, // Ensure roomId is set
      })),
    }));

    // Merge manually entered rooms with existing rooms, replacing if name matches, else adding.
    const updatedRooms = [...rooms];
    processedManualRooms.forEach(manualRoom => {
      const existingRoomIndex = updatedRooms.findIndex(r => r.name === manualRoom.name);
      if (existingRoomIndex !== -1) {
        updatedRooms[existingRoomIndex] = manualRoom; // Replace existing room
      } else {
        updatedRooms.push(manualRoom); // Add as new room
      }
    });
    
    setRooms(updatedRooms); 
    console.log("[QuotePage] handleManualEntryComplete. Processed manual rooms:", updatedRooms);
    const aggregatedFurniture = aggregateFurnitureForQuote(updatedRooms);
    setDetectedFurniture(aggregatedFurniture);
    setStep(2);
  }

  const handleSetCurrentRoom = () => {
    if (!currentRoomName.trim()) {
      alert("Please enter a room name.");
      return;
    }
    // Check if room already exists by name
    const existingRoom = rooms.find(room => room.name.toLowerCase() === currentRoomName.trim().toLowerCase());
    if (existingRoom) {
      setCurrentRoomId(existingRoom.id);
      console.log(`[QuotePage] Set existing room "${existingRoom.name}" (ID: ${existingRoom.id}) as current.`);
    } else {
      const newRoom: Room = {
        id: generateId(),
        name: currentRoomName.trim(),
        furniture: [],
        imagePreviewUrl: null,
      };
      setRooms(prevRooms => [...prevRooms, newRoom]);
      setCurrentRoomId(newRoom.id);
      console.log(`[QuotePage] Created and set new room "${newRoom.name}" (ID: ${newRoom.id}) as current.`);
    }
    // Do not clear currentRoomName, so user sees what room is active.
    // Or, provide different UI feedback for the active room.
  };

  // --- Helper functions for adjusting furniture within a room ---

  const handleIncrementQuantity = (roomId: string, furnitureItemId: string) => {
    setRooms(prevRooms => prevRooms.map(room => {
      if (room.id === roomId) {
        return {
          ...room,
          furniture: room.furniture.map(item => 
            item.id === furnitureItemId ? { ...item, quantity: item.quantity + 1 } : item
          )
        };
      }
      return room;
    }));
  };

  const handleDecrementQuantity = (roomId: string, furnitureItemId: string) => {
    setRooms(prevRooms => prevRooms.map(room => {
      if (room.id === roomId) {
        const updatedFurniture = room.furniture
          .map(item => 
            item.id === furnitureItemId ? { ...item, quantity: item.quantity - 1 } : item
          )
          .filter(item => item.quantity > 0); // Remove item if quantity is 0
        return { ...room, furniture: updatedFurniture };
      }
      return room;
    }));
  };

  const handleDeleteItem = (roomId: string, furnitureItemId: string) => {
    setRooms(prevRooms => prevRooms.map(room => {
      if (room.id === roomId) {
        return {
          ...room,
          furniture: room.furniture.filter(item => item.id !== furnitureItemId)
        };
      }
      return room;
    }));
  };
  
  const handleAddNewFurnitureItemToRoom = (roomId: string) => {
    if (!newManualItemName.trim()) {
      alert("Please enter a name for the furniture item.");
      return;
    }
    if (newManualItemQuantity < 1) {
      alert("Quantity must be at least 1.");
      return;
    }

    setRooms(prevRooms => prevRooms.map(room => {
      if (room.id === roomId) {
        // Check if item already exists by name to avoid duplicates, or increment quantity
        const existingItemIndex = room.furniture.findIndex(
          item => item.name.toLowerCase() === newManualItemName.trim().toLowerCase()
        );

        let updatedFurniture;
        if (existingItemIndex !== -1) {
          // Item exists, increment its quantity
          updatedFurniture = room.furniture.map((item, index) => 
            index === existingItemIndex 
              ? { ...item, quantity: item.quantity + newManualItemQuantity, detectedBy: "MANUAL" } 
              : item
          );
        } else {
          // Item does not exist, add new
          const newItem: FurnitureItem = {
            id: generateId(),
            name: newManualItemName.trim(),
            quantity: newManualItemQuantity,
            detectedBy: "MANUAL",
            roomId: roomId,
          };
          updatedFurniture = [...room.furniture, newItem];
        }
        return { ...room, furniture: updatedFurniture };
      }
      return room;
    }));

    // Reset input fields after adding
    setNewManualItemName("");
    setNewManualItemQuantity(1);
  };


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
                  <div className="mb-6 p-4 border rounded-lg bg-slate-50">
                    <h3 className="text-lg font-semibold mb-3">Define Room for Detection</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <Home className="text-slate-500" />
                      <Input
                        type="text"
                        placeholder="Enter room name (e.g., Living Room)"
                        value={currentRoomName}
                        onChange={(e) => setCurrentRoomName(e.target.value)}
                        className="flex-grow"
                      />
                      <Button onClick={handleSetCurrentRoom} disabled={!currentRoomName.trim()}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Set Current Room
                      </Button>
                    </div>
                    {currentRoomId && rooms.find(r => r.id === currentRoomId) && (
                      <p className="text-sm text-green-600 font-medium">
                        Currently detecting for: <span className="font-bold">{rooms.find(r => r.id === currentRoomId)?.name}</span>
                      </p>
                    )}
                     {!currentRoomId && images.length === 0 && !isBatchProcessing && (
                        <p className="text-xs text-amber-600 mt-1">Tip: Name your room before starting camera or uploading for that room.</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <FurnitureDetector 
                        onCapture={handleImageCapture} 
                        imageToProcess={imageToPassToDetector} 
                    />

                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2">Processed Image Previews ({images.length})</h3>
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
                  
                  {/* Display Rooms and their Furniture (Basic) */}
                  {rooms.length > 0 && (
                    <div className="mt-6 pt-4 border-t">
                      <h3 className="text-xl font-semibold mb-3">Your Rooms & Items</h3>
                      {rooms.map(room => (
                        <Card key={room.id} className="mb-4">
                          <CardHeader>
                            <CardTitle>{room.name}</CardTitle>
                            {room.imagePreviewUrl && (
                              <div className="mt-2">
                                <img 
                                  src={room.imagePreviewUrl} 
                                  alt={`${room.name} preview`} 
                                  className="rounded-md max-h-32 object-contain"
                                />
                              </div>
                            )}
                          </CardHeader>
                          <CardContent>
                            {room.furniture.length > 0 ? (
                              <ul className="space-y-2">
                                {room.furniture.map(item => (
                                  <li key={item.id} className="flex justify-between items-center p-2 border rounded-md">
                                    <div>
                                      <span className="font-medium">{item.name}</span>
                                      <span className="text-xs text-gray-500 ml-1">({item.detectedBy})</span>
                                      <br />
                                      <span className="text-sm">Quantity: {item.quantity}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button 
                                        variant="outline" 
                                        size="icon" 
                                        onClick={() => handleDecrementQuantity(room.id, item.id)}
                                        className="h-7 w-7"
                                      >
                                        <MinusCircle className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="icon" 
                                        onClick={() => handleIncrementQuantity(room.id, item.id)}
                                        className="h-7 w-7"
                                      >
                                        <PlusCircle className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="destructive" 
                                        size="icon" 
                                        onClick={() => handleDeleteItem(room.id, item.id)}
                                        className="h-7 w-7"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-muted-foreground">No furniture items detected/added for this room yet.</p>
                            )}
                             {/* Form to add new furniture item to this room */}
                            <div className="mt-4 pt-3 border-t">
                              <h4 className="text-sm font-semibold mb-2">Add Furniture to {room.name}</h4>
                              <div className="flex items-center gap-2">
                                <Input 
                                  type="text" 
                                  placeholder="Item Name" 
                                  value={newManualItemName} 
                                  onChange={(e) => setNewManualItemName(e.target.value)}
                                  className="h-8 text-sm"
                                />
                                <Input 
                                  type="number" 
                                  placeholder="Qty" 
                                  value={newManualItemQuantity} 
                                  onChange={(e) => setNewManualItemQuantity(parseInt(e.target.value, 10) || 1)}
                                  min="1"
                                  className="h-8 w-20 text-sm"
                                />
                                <Button 
                                  size="sm" 
                                  onClick={() => handleAddNewFurnitureItemToRoom(room.id)}
                                  disabled={!newManualItemName.trim() || newManualItemQuantity < 1}
                                >
                                  <Plus className="h-4 w-4 mr-1" /> Add
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}


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

                  {/* Global summary can be removed or re-purposed if rooms state is primary */}
                  {/* {Object.keys(detectedFurniture).length > 0 && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <h3 className="font-medium mb-2">Accumulated Detected Furniture (Overall Summary)</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Object.entries(detectedFurniture).map(([item, count]) => (
                          <div key={item} className="flex justify-between">
                            <span>{item}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )} */}

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
                        onClick={() => {
                            if (!currentRoomId && uploadedImageFiles.length === 0) { // Allow upload only if room is set or it's the first action
                                alert("Please set a room name first before uploading images for it.");
                                return;
                            }
                            document.getElementById("file-upload")?.click()
                        }}
                        disabled={isBatchProcessing || !currentRoomId} // Disable if no current room or batch processing
                       >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload for "{rooms.find(r=>r.id === currentRoomId)?.name || "Set Room"}"
                        <input
                          id="file-upload"
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleFileUpload}
                          disabled={isBatchProcessing || !currentRoomId}
                        />
                      </Button>
                      <Button
                        onClick={handleProcessImages}
                        disabled={
                            isBatchProcessing || 
                            isProcessing || 
                            rooms.length === 0 || // No rooms defined
                            rooms.every(room => room.furniture.length === 0) || // All rooms are empty
                            (uploadedImageFiles.length > 0 && currentImageIndexToProcess < uploadedImageFiles.length) 
                        }
                      >
                        {isProcessing || isBatchProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {isBatchProcessing ? `Processing Batch...` : `Processing...`}
                          </>
                        ) : (
                          "Continue to Quote"
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
