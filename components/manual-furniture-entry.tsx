"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Trash2, Home, Save } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// Common furniture items for selection
const COMMON_FURNITURE = [
  "Sofa",
  "Chair",
  "Table",
  "Bed",
  "Dresser",
  "Bookshelf",
  "TV",
  "Desk",
  "Cabinet",
  "Wardrobe",
  "Nightstand",
  "Ottoman",
  "Coffee Table",
  "Dining Table",
  "TV Stand",
  "Armchair",
  "Refrigerator",
  "Microwave",
  "Oven",
  "Washer/Dryer",
]

// Common room types
const ROOM_TYPES = [
  "Living Room",
  "Bedroom",
  "Kitchen",
  "Bathroom",
  "Dining Room",
  "Office",
  "Basement",
  "Attic",
  "Garage",
  "Hallway",
  "Laundry Room",
  "Storage Room",
]

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

interface ManualFurnitureEntryProps {
  onComplete: (rooms: Room[]) => void
}

export function ManualFurnitureEntry({ onComplete }: ManualFurnitureEntryProps) {
  const [rooms, setRooms] = useState<Room[]>([
    {
      id: "room-" + Date.now(),
      name: "Living Room",
      furniture: [],
    },
  ])

  const [newFurnitureName, setNewFurnitureName] = useState<string>("")
  const [newFurnitureQuantity, setNewFurnitureQuantity] = useState<number>(1)
  const [activeRoomId, setActiveRoomId] = useState<string>(rooms[0].id)
  const [customFurnitureName, setCustomFurnitureName] = useState<string>("")

  // Get the active room
  const activeRoom = rooms.find((room) => room.id === activeRoomId) || rooms[0]

  // Add a new room
  const addRoom = () => {
    const newRoom: Room = {
      id: "room-" + Date.now(),
      name: "New Room",
      furniture: [],
    }
    setRooms([...rooms, newRoom])
    setActiveRoomId(newRoom.id)
  }

  // Remove a room
  const removeRoom = (roomId: string) => {
    if (rooms.length <= 1) {
      return // Don't remove the last room
    }
    const updatedRooms = rooms.filter((room) => room.id !== roomId)
    setRooms(updatedRooms)

    // If we removed the active room, set a new active room
    if (roomId === activeRoomId) {
      setActiveRoomId(updatedRooms[0].id)
    }
  }

  // Update room name
  const updateRoomName = (roomId: string, name: string) => {
    setRooms(
      rooms.map((room) => {
        if (room.id === roomId) {
          return { ...room, name }
        }
        return room
      }),
    )
  }

  // Add furniture to a room
  const addFurniture = () => {
    // Use either the selected furniture or custom name
    const furnitureName = newFurnitureName === "custom" ? customFurnitureName : newFurnitureName

    if (!furnitureName || furnitureName.trim() === "") {
      return // Don't add empty furniture
    }

    setRooms(
      rooms.map((room) => {
        if (room.id === activeRoomId) {
          // Check if this furniture already exists
          const existingFurniture = room.furniture.find((f) => f.name.toLowerCase() === furnitureName.toLowerCase())

          if (existingFurniture) {
            // Update quantity of existing furniture
            return {
              ...room,
              furniture: room.furniture.map((f) => {
                if (f.id === existingFurniture.id) {
                  return { ...f, quantity: f.quantity + newFurnitureQuantity }
                }
                return f
              }),
            }
          } else {
            // Add new furniture
            return {
              ...room,
              furniture: [
                ...room.furniture,
                {
                  id: "furniture-" + Date.now(),
                  name: furnitureName,
                  quantity: newFurnitureQuantity,
                },
              ],
            }
          }
        }
        return room
      }),
    )

    // Reset inputs
    setNewFurnitureName("")
    setCustomFurnitureName("")
    setNewFurnitureQuantity(1)
  }

  // Remove furniture from a room
  const removeFurniture = (roomId: string, furnitureId: string) => {
    setRooms(
      rooms.map((room) => {
        if (room.id === roomId) {
          return {
            ...room,
            furniture: room.furniture.filter((f) => f.id !== furnitureId),
          }
        }
        return room
      }),
    )
  }

  // Calculate total furniture count
  const totalFurnitureCount = rooms.reduce(
    (total, room) => total + room.furniture.reduce((roomTotal, f) => roomTotal + f.quantity, 0),
    0,
  )

  // Handle form submission
  const handleSubmit = () => {
    // Convert to a format compatible with the quote calculator
    const detectedFurniture: { [key: string]: number } = {}

    rooms.forEach((room) => {
      room.furniture.forEach((furniture) => {
        detectedFurniture[furniture.name] = (detectedFurniture[furniture.name] || 0) + furniture.quantity
      })
    })

    onComplete(rooms)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Manual Furniture Entry</h2>
          <p className="text-muted-foreground">Add rooms and furniture items manually to get a moving quote</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {rooms.length} {rooms.length === 1 ? "Room" : "Rooms"}
          </Badge>
          <Badge variant="outline" className="text-sm">
            {totalFurnitureCount} {totalFurnitureCount === 1 ? "Item" : "Items"}
          </Badge>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {rooms.map((room) => (
          <Button
            key={room.id}
            variant={room.id === activeRoomId ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveRoomId(room.id)}
            className="flex items-center gap-1"
          >
            <Home className="h-4 w-4" />
            {room.name}
            {room.furniture.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {room.furniture.reduce((total, f) => total + f.quantity, 0)}
              </Badge>
            )}
          </Button>
        ))}
        <Button variant="outline" size="sm" onClick={addRoom}>
          <PlusCircle className="h-4 w-4 mr-1" />
          Add Room
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <Select value={activeRoom.name} onValueChange={(value) => updateRoomName(activeRoom.id, value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select room type" />
                </SelectTrigger>
                <SelectContent>
                  {ROOM_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeRoom(activeRoom.id)}
              disabled={rooms.length <= 1}
              className="ml-2"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="furnitureType">Furniture Type</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select value={newFurnitureName} onValueChange={setNewFurnitureName}>
                      <SelectTrigger id="furnitureType">
                        <SelectValue placeholder="Select furniture" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_FURNITURE.map((furniture) => (
                          <SelectItem key={furniture} value={furniture}>
                            {furniture}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">Custom Item...</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newFurnitureName === "custom" && (
                    <Input
                      placeholder="Enter furniture name"
                      value={customFurnitureName}
                      onChange={(e) => setCustomFurnitureName(e.target.value)}
                    />
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <div className="flex gap-2">
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={newFurnitureQuantity}
                    onChange={(e) => setNewFurnitureQuantity(Number.parseInt(e.target.value) || 1)}
                  />
                  <Button onClick={addFurniture} disabled={!newFurnitureName}>
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {activeRoom.furniture.length > 0 ? (
              <div className="border rounded-md">
                <div className="grid grid-cols-12 bg-muted p-2 rounded-t-md">
                  <div className="col-span-7 font-medium">Item</div>
                  <div className="col-span-3 font-medium text-center">Quantity</div>
                  <div className="col-span-2 font-medium text-right">Actions</div>
                </div>
                <div className="divide-y">
                  {activeRoom.furniture.map((furniture) => (
                    <div key={furniture.id} className="grid grid-cols-12 p-2 items-center">
                      <div className="col-span-7">{furniture.name}</div>
                      <div className="col-span-3 text-center">{furniture.quantity}</div>
                      <div className="col-span-2 text-right">
                        <Button variant="ghost" size="sm" onClick={() => removeFurniture(activeRoom.id, furniture.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="border rounded-md p-8 text-center text-muted-foreground">
                <p>No furniture added to this room yet.</p>
                <p className="text-sm">Select a furniture type and click Add to begin.</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4 flex justify-between">
          <Button variant="outline" onClick={() => addRoom()}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Another Room
          </Button>
          <Button onClick={handleSubmit} disabled={totalFurnitureCount === 0}>
            <Save className="h-4 w-4 mr-2" />
            Generate Quote
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
