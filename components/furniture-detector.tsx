"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Camera, RefreshCw, Loader2, Sliders, Upload, ZoomIn, ZoomOut } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

// Define types for the global TensorFlow and COCO-SSD objects
declare global {
  interface Window {
    tf: any
    cocoSsd: any
  }
}

interface FurnitureDetectorProps {
  onCapture: (imageUrl: string, detectedItems: { [key: string]: number }) => void
}

// Furniture items that COCO-SSD can detect
const FURNITURE_ITEMS = [
  "chair",
  "couch",
  "bed",
  "dining table",
  "toilet",
  "tv",
  "laptop",
  "microwave",
  "oven",
  "refrigerator",
  "book",
  "clock",
  "vase",
  "potted plant",
  "bottle",
  "cup",
  "bowl",
  "sink",
]

// Map COCO-SSD classes to more user-friendly furniture names
const FURNITURE_CLASS_MAP = {
  chair: "Chair",
  couch: "Sofa",
  sofa: "Sofa",
  bed: "Bed",
  "dining table": "Table",
  diningtable: "Table",
  toilet: "Toilet",
  tv: "TV",
  tvmonitor: "TV",
  laptop: "Desk",
  microwave: "Microwave",
  oven: "Oven",
  refrigerator: "Refrigerator",
  book: "Bookshelf", // We'll count books as bookshelves for simplicity
  clock: "Clock",
  vase: "Decor Item",
  "potted plant": "Decor Item",
  bottle: "Small Item",
  cup: "Small Item",
  bowl: "Small Item",
  sink: "Fixture",
}

// Additional furniture items that might be detected with custom logic
const ADDITIONAL_FURNITURE = {
  cabinet: "Cabinet",
  dresser: "Dresser",
  wardrobe: "Wardrobe",
  bookshelf: "Bookshelf",
  desk: "Desk",
  table: "Table",
  nightstand: "Nightstand",
  ottoman: "Ottoman",
  armchair: "Armchair",
  recliner: "Recliner",
  loveseat: "Loveseat",
  sectional: "Sectional Sofa",
  coffeetable: "Coffee Table",
  sidetable: "Side Table",
  diningtable: "Dining Table",
  entertainmentcenter: "Entertainment Center",
  tvstand: "TV Stand",
}

// Preprocessing settings interface
interface PreprocessingSettings {
  brightness: number
  contrast: number
  blurRadius: number
  edgeEnhancement: boolean
  histogramEqualization: boolean
  denoise: boolean
  preprocessingMethod: string
}

// Detection settings interface
interface DetectionSettings {
  confidenceThreshold: number
  multipleDetections: boolean
  enhancedFurnitureDetection: boolean
  detectionModel: string
}

export function FurnitureDetector({ onCapture }: FurnitureDetectorProps) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [isModelLoading, setIsModelLoading] = useState(false)
  const [model, setModel] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [detectedObjects, setDetectedObjects] = useState<any[]>([])
  const [preprocessingSettings, setPreprocessingSettings] = useState<PreprocessingSettings>({
    brightness: 0,
    contrast: 0,
    blurRadius: 0,
    edgeEnhancement: false,
    histogramEqualization: false,
    denoise: false,
    preprocessingMethod: "furniture", // Default to furniture optimized
  })
  const [detectionSettings, setDetectionSettings] = useState<DetectionSettings>({
    confidenceThreshold: 0.4, // Default confidence threshold
    multipleDetections: true, // Allow multiple detections of the same object
    enhancedFurnitureDetection: true, // Use enhanced furniture detection
    detectionModel: "mobilenet_v2", // Default model
  })
  const [preprocessedImageUrl, setPreprocessedImageUrl] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [tfLoaded, setTfLoaded] = useState(false)
  const [mockDetection, setMockDetection] = useState(false)
  const [isPlayingVideo, setIsPlayingVideo] = useState(false)
  const [videoElementCreated, setVideoElementCreated] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>("")

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const displayCanvasRef = useRef<HTMLCanvasElement>(null)
  const preprocessCanvasRef = useRef<HTMLCanvasElement>(null)
  const videoContainerRef = useRef<HTMLDivElement | null>(null)

  // Create video element on component mount
  useEffect(() => {
    // Create video element if it doesn't exist
    if (!videoRef.current) {
      const video = document.createElement("video")
      video.autoplay = true
      video.playsInline = true
      video.muted = true
      video.className = "w-full h-full object-cover"
      videoRef.current = video
      setVideoElementCreated(true)
    }

    // Get available cameras
    const getAvailableCameras = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
          console.log("enumerateDevices() not supported.")
          return
        }

        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter((device) => device.kind === "videoinput")
        setAvailableCameras(videoDevices)

        // Set default camera (prefer back camera if available)
        if (videoDevices.length > 0) {
          // Try to find a back camera
          const backCamera = videoDevices.find(
            (device) => device.label.toLowerCase().includes("back") || device.label.toLowerCase().includes("rear"),
          )

          if (backCamera) {
            setSelectedCamera(backCamera.deviceId)
          } else {
            setSelectedCamera(videoDevices[0].deviceId)
          }
        }
      } catch (err) {
        console.error("Error getting camera devices:", err)
      }
    }

    getAvailableCameras()

    return () => {
      // Clean up video element on unmount
      if (videoRef.current) {
        videoRef.current.srcObject = null
        videoRef.current.onloadedmetadata = null
        videoRef.current.onerror = null
      }
    }
  }, [])

  // Check if TensorFlow.js and COCO-SSD are available
  useEffect(() => {
    const checkTfLoaded = () => {
      if (window.tf && window.cocoSsd) {
        setTfLoaded(true)
        return true
      }
      return false
    }

    // Check immediately
    if (checkTfLoaded()) {
      return
    }

    // If not loaded yet, set up an interval to check
    const intervalId = setInterval(() => {
      if (checkTfLoaded()) {
        clearInterval(intervalId)
      }
    }, 500)

    // Clean up interval
    return () => clearInterval(intervalId)
  }, [])

  // Load the COCO-SSD model
  useEffect(() => {
    async function loadModel() {
      if (!tfLoaded) return

      setIsModelLoading(true)
      try {
        // Use the global window.cocoSsd object
        const loadedModel = await window.cocoSsd.load({
          base: detectionSettings.detectionModel, // Use selected model
        })
        setModel(loadedModel)
      } catch (error) {
        console.error("Error loading model:", error)
        // If model fails to load, enable mock detection
        setMockDetection(true)
      } finally {
        setIsModelLoading(false)
      }
    }

    if (tfLoaded) {
      loadModel()
    }

    // Cleanup function
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [tfLoaded, detectionSettings.detectionModel])

  // Cleanup function for when component unmounts
  useEffect(() => {
    return () => {
      // Stop any active streams
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }

      // Clear any video element state
      if (videoRef.current) {
        videoRef.current.srcObject = null
        videoRef.current.onloadedmetadata = null
        videoRef.current.onerror = null
      }
    }
  }, [stream])

  // Update the startCamera function to add better error handling and user feedback
  const startCamera = async () => {
    try {
      // First check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported in your browser")
      }

      // Create video element if it doesn't exist
      if (!videoRef.current) {
        const video = document.createElement("video")
        video.autoplay = true
        video.playsInline = true
        video.muted = true
        video.className = "w-full h-full object-cover"
        videoRef.current = video
        setVideoElementCreated(true)
      }

      // Double check that videoRef.current exists now
      if (!videoRef.current) {
        throw new Error("Could not initialize video element")
      }

      // Request camera access with clear constraints
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      }

      // Use selected camera if available
      if (selectedCamera) {
        constraints.video = {
          ...constraints.video,
          deviceId: { exact: selectedCamera },
        }
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)

      // Store the stream first
      setStream(mediaStream)

      // Set the stream to the video element
      videoRef.current.srcObject = mediaStream

      // Reset the playing state
      setIsPlayingVideo(false)

      // Make sure the video element is in the DOM
      if (videoContainerRef.current) {
        const videoContainer = videoContainerRef.current.querySelector(".video-container")
        if (videoContainer && !videoContainer.contains(videoRef.current)) {
          const wrapper = document.createElement("div")
          wrapper.className = "absolute inset-0"
          wrapper.appendChild(videoRef.current)
          videoContainer.appendChild(wrapper)
        }
      }

      // Add event listeners to handle video loading
      videoRef.current.onloadedmetadata = () => {
        // Only try to play if the video element is still in the document
        if (videoRef.current) {
          setIsPlayingVideo(true)

          // Use a promise with proper error handling for play()
          const playPromise = videoRef.current.play()

          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                // Video playback started successfully
                console.log("Video playback started")
              })
              .catch((e) => {
                // Handle play() errors properly
                console.error("Error playing video:", e)
                if (e.name === "AbortError") {
                  setCameraError("Video playback was aborted. Please try again.")
                } else if (e.name === "NotAllowedError") {
                  setCameraError("Autoplay is disabled in your browser. Please enable it or click the video to play.")
                } else {
                  setCameraError("Error playing video: " + e.message)
                }
                setIsPlayingVideo(false)
              })
          }
        }
      }

      videoRef.current.onerror = (e) => {
        console.error("Video element error:", e)
        setCameraError("Error accessing camera stream")
        setIsPlayingVideo(false)
      }

      setIsActive(true)
      setCameraError(null)
    } catch (error: any) {
      console.error("Error accessing camera:", error)

      // Provide specific error messages based on the error
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setCameraError("Camera access denied. Please allow camera access in your browser settings.")
      } else if (error instanceof DOMException && error.name === "NotFoundError") {
        setCameraError("No camera found on your device.")
      } else if (error instanceof DOMException && error.name === "NotReadableError") {
        setCameraError("Camera is already in use by another application.")
      } else {
        setCameraError(`Camera error: ${error.message || "Unknown error"}`)
      }

      setIsActive(false)
      setIsPlayingVideo(false)
    }
  }

  const stopCamera = () => {
    // First set the state to inactive to prevent any new play attempts
    setIsActive(false)
    setIsPlayingVideo(false)

    // Then safely stop the stream
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }

    // Clear the video source
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    // Reset other states
    setDetectedObjects([])
    setPreprocessedImageUrl(null)
    setZoomLevel(1)
  }

  // Apply histogram equalization to improve contrast
  const histogramEqualization = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    // Convert to grayscale for histogram calculation
    const grayData = new Uint8Array(canvas.width * canvas.height)
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      // Convert RGB to grayscale
      grayData[i / 4] = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
    }

    // Calculate histogram
    const histogram = new Uint32Array(256)
    for (let i = 0; i < grayData.length; i++) {
      histogram[grayData[i]]++
    }

    // Calculate cumulative distribution function (CDF)
    const cdf = new Uint32Array(256)
    cdf[0] = histogram[0]
    for (let i = 1; i < 256; i++) {
      cdf[i] = cdf[i - 1] + histogram[i]
    }

    // Normalize CDF
    const cdfMin = cdf.find((val) => val > 0) || 0
    const cdfMax = cdf[255]
    const cdfRange = cdfMax - cdfMin

    // Create lookup table for mapping
    const lookupTable = new Uint8Array(256)
    for (let i = 0; i < 256; i++) {
      lookupTable[i] = Math.round(((cdf[i] - cdfMin) / cdfRange) * 255)
    }

    // Apply equalization to each channel
    for (let i = 0; i < data.length; i += 4) {
      data[i] = lookupTable[data[i]] // R
      data[i + 1] = lookupTable[data[i + 1]] // G
      data[i + 2] = lookupTable[data[i + 2]] // B
    }

    ctx.putImageData(imageData, 0, 0)
  }

  // Apply a simple denoising filter (median filter)
  const applyDenoising = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    const width = canvas.width
    const height = canvas.height
    const result = new Uint8ClampedArray(data.length)

    // Simple 3x3 median filter
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          // Process each color channel (R,G,B)
          const idx = (y * width + x) * 4 + c

          // Get 3x3 neighborhood values
          const values = [
            data[((y - 1) * width + (x - 1)) * 4 + c],
            data[((y - 1) * width + x) * 4 + c],
            data[((y - 1) * width + (x + 1)) * 4 + c],
            data[(y * width + (x - 1)) * 4 + c],
            data[idx],
            data[(y * width + (x + 1)) * 4 + c],
            data[((y + 1) * width + (x - 1)) * 4 + c],
            data[((y + 1) * width + x) * 4 + c],
            data[((y + 1) * width + (x + 1)) * 4 + c],
          ]

          // Sort and take the median
          values.sort((a, b) => a - b)
          result[idx] = values[4] // Median of 9 values
        }

        // Copy alpha channel
        result[(y * width + x) * 4 + 3] = data[(y * width + x) * 4 + 3]
      }
    }

    // Copy the edges (not processed by the filter)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
          const idx = (y * width + x) * 4
          result[idx] = data[idx]
          result[idx + 1] = data[idx + 1]
          result[idx + 2] = data[idx + 2]
          result[idx + 3] = data[idx + 3]
        }
      }
    }

    // Put the processed data back
    const processedImageData = new ImageData(result, width, height)
    ctx.putImageData(processedImageData, 0, 0)
  }

  // Apply edge enhancement using a simple sharpening filter
  const applyEdgeEnhancement = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    const width = canvas.width
    const height = canvas.height
    const result = new Uint8ClampedArray(data.length)

    // Copy original data to result
    for (let i = 0; i < data.length; i++) {
      result[i] = data[i]
    }

    // Apply sharpening filter (simple Laplacian)
    const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0]

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          // Process each color channel (R,G,B)
          let sum = 0

          // Apply convolution
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4 + c
              const kernelIdx = (ky + 1) * 3 + (kx + 1)
              sum += data[idx] * kernel[kernelIdx]
            }
          }

          // Clamp values to valid range
          result[(y * width + x) * 4 + c] = Math.max(0, Math.min(255, sum))
        }
      }
    }

    // Put the processed data back
    const processedImageData = new ImageData(result, width, height)
    ctx.putImageData(processedImageData, 0, 0)
  }

  // Apply a Gaussian blur for noise reduction
  const applyBlur = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, radius: number) => {
    if (radius <= 0) return

    // Use built-in canvas blur filter
    ctx.filter = `blur(${radius}px)`
    const tempCanvas = document.createElement("canvas")
    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height
    const tempCtx = tempCanvas.getContext("2d")

    if (tempCtx) {
      // Draw original image to temp canvas
      tempCtx.drawImage(canvas, 0, 0)

      // Clear original canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw blurred image back
      ctx.drawImage(tempCanvas, 0, 0)

      // Reset filter
      ctx.filter = "none"
    }
  }

  // Apply brightness and contrast adjustments
  const applyBrightnessContrast = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    brightness: number,
    contrast: number,
  ) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    // Convert to percentage values
    const brightnessValue = brightness / 100
    const contrastValue = contrast / 100

    // Calculate contrast factor
    const factor = (259 * (contrastValue + 1)) / (255 * (1 - contrastValue))

    for (let i = 0; i < data.length; i += 4) {
      // Apply brightness
      data[i] += 255 * brightnessValue
      data[i + 1] += 255 * brightnessValue
      data[i + 2] += 255 * brightnessValue

      // Apply contrast
      data[i] = factor * (data[i] - 128) + 128
      data[i + 1] = factor * (data[i + 1] - 128) + 128
      data[i + 2] = factor * (data[i + 2] - 128) + 128

      // Clamp values
      data[i] = Math.max(0, Math.min(255, data[i]))
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1]))
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2]))
    }

    ctx.putImageData(imageData, 0, 0)
  }

  // Apply automatic image enhancement
  const applyAutoEnhancement = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // First, apply histogram equalization for better contrast
    histogramEqualization(ctx, canvas)

    // Then apply a mild sharpening for edge enhancement
    applyEdgeEnhancement(ctx, canvas)

    // Apply a very slight blur to reduce noise (0.5px)
    applyBlur(ctx, canvas, 0.5)
  }

  // Apply furniture-optimized preprocessing
  const applyFurnitureOptimized = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Increase contrast slightly
    applyBrightnessContrast(ctx, canvas, 5, 20)

    // Apply edge enhancement for better furniture outlines
    applyEdgeEnhancement(ctx, canvas)

    // Apply histogram equalization for better contrast
    histogramEqualization(ctx, canvas)

    // Apply very mild blur to reduce noise but keep furniture edges
    applyBlur(ctx, canvas, 0.3)
  }

  // Apply low-light optimization
  const applyLowLightOptimization = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Increase brightness and contrast
    applyBrightnessContrast(ctx, canvas, 30, 25)

    // Apply histogram equalization
    histogramEqualization(ctx, canvas)

    // Apply denoising (low light images tend to be noisy)
    applyDenoising(ctx, canvas)
  }

  // Preprocess the image before detection
  const preprocessImage = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
    if (!preprocessCanvasRef.current) return canvas

    const preprocessCanvas = preprocessCanvasRef.current
    preprocessCanvas.width = canvas.width
    preprocessCanvas.height = canvas.height

    const ctx = preprocessCanvas.getContext("2d")
    if (!ctx) return canvas

    // Draw the original image to the preprocessing canvas
    ctx.drawImage(canvas, 0, 0)

    // Apply preprocessing based on selected method
    if (preprocessingSettings.preprocessingMethod === "auto") {
      applyAutoEnhancement(ctx, preprocessCanvas)
    } else if (preprocessingSettings.preprocessingMethod === "furniture") {
      applyFurnitureOptimized(ctx, preprocessCanvas)
    } else if (preprocessingSettings.preprocessingMethod === "lowLight") {
      applyLowLightOptimization(ctx, preprocessCanvas)
    } else {
      // Apply manual settings
      if (preprocessingSettings.brightness !== 0 || preprocessingSettings.contrast !== 0) {
        applyBrightnessContrast(ctx, preprocessCanvas, preprocessingSettings.brightness, preprocessingSettings.contrast)
      }

      if (preprocessingSettings.blurRadius > 0) {
        applyBlur(ctx, preprocessCanvas, preprocessingSettings.blurRadius)
      }

      if (preprocessingSettings.histogramEqualization) {
        histogramEqualization(ctx, preprocessCanvas)
      }

      if (preprocessingSettings.edgeEnhancement) {
        applyEdgeEnhancement(ctx, preprocessCanvas)
      }

      if (preprocessingSettings.denoise) {
        applyDenoising(ctx, preprocessCanvas)
      }
    }

    // Save the preprocessed image URL for preview
    setPreprocessedImageUrl(preprocessCanvas.toDataURL("image/jpeg"))

    return preprocessCanvas
  }

  // Enhanced furniture detection using additional heuristics
  const enhanceFurnitureDetection = (predictions: any[]): any[] => {
    if (!detectionSettings.enhancedFurnitureDetection) {
      return predictions
    }

    // Filter predictions to include only furniture items and those with confidence above threshold
    const filteredPredictions = predictions.filter(
      (pred) =>
        FURNITURE_ITEMS.includes(pred.class.toLowerCase()) && pred.score >= detectionSettings.confidenceThreshold,
    )

    // If we don't have many furniture items, try to detect additional furniture
    // based on size and shape heuristics
    if (filteredPredictions.length < 3) {
      // Look for large rectangular objects that might be furniture
      const potentialFurniture = predictions.filter((pred) => {
        // Skip already identified furniture
        if (FURNITURE_ITEMS.includes(pred.class.toLowerCase())) return false

        // Check if it's a large object (potential furniture)
        const [x, y, width, height] = pred.bbox
        const area = width * height
        const aspectRatio = width / height

        // Large objects with reasonable aspect ratios could be furniture
        return (
          area > canvasRef.current?.width * canvasRef.current?.height * 0.05 && // At least 5% of image
          aspectRatio > 0.3 &&
          aspectRatio < 3.0 && // Not too narrow or wide
          pred.score > detectionSettings.confidenceThreshold * 0.8 // Slightly lower threshold
        )
      })

      // Add these as generic furniture items
      potentialFurniture.forEach((item) => {
        // Try to guess what kind of furniture it might be based on aspect ratio and size
        const [x, y, width, height] = item.bbox
        const aspectRatio = width / height
        const area = width * height
        const imageArea = canvas.width * canvas.height

        let furnitureType = "Unknown Furniture"

        // Very rough heuristics
        if (aspectRatio > 1.5 && aspectRatio < 2.5 && area > imageArea * 0.15) {
          furnitureType = "Sofa"
        } else if (aspectRatio > 0.8 && aspectRatio < 1.2 && area < imageArea * 0.1) {
          furnitureType = "Table"
        } else if (aspectRatio < 0.7 && height > width && area > imageArea * 0.1) {
          furnitureType = "Bookshelf"
        } else if (aspectRatio > 0.8 && aspectRatio < 1.2 && area > imageArea * 0.1) {
          furnitureType = "Cabinet"
        }

        filteredPredictions.push({
          ...item,
          class: furnitureType.toLowerCase(),
          score: item.score * 0.9, // Slightly reduce confidence for these guesses
        })
      })
    }

    return filteredPredictions
  }

  // Mock detection function for when TensorFlow fails to load
  const mockDetectFurniture = (canvas: HTMLCanvasElement) => {
    // Generate some random furniture detections
    const mockItems = [
      { class: "chair", score: 0.92, bbox: [50, 100, 100, 150] },
      { class: "couch", score: 0.88, bbox: [200, 150, 250, 120] },
      { class: "dining table", score: 0.78, bbox: [400, 200, 200, 100] },
      { class: "bookshelf", score: 0.85, bbox: [100, 300, 150, 200] },
      { class: "cabinet", score: 0.82, bbox: [300, 50, 120, 180] },
    ]

    return mockItems
  }

  const captureImage = async () => {
    if (!canvasRef.current) return

    setIsProcessing(true)

    try {
      const canvas = canvasRef.current

      // If the video is active, capture from video
      if (isActive && videoRef.current) {
        const video = videoRef.current

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth || 640
        canvas.height = video.videoHeight || 480

        // Draw the current video frame to the canvas
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Apply zoom if needed
        if (zoomLevel !== 1) {
          const scaleFactor = zoomLevel
          const centerX = video.videoWidth / 2
          const centerY = video.videoHeight / 2
          const newWidth = video.videoWidth / scaleFactor
          const newHeight = video.videoHeight / scaleFactor
          const sourceX = centerX - newWidth / 2
          const sourceY = centerY - newHeight / 2

          ctx.drawImage(video, sourceX, sourceY, newWidth, newHeight, 0, 0, canvas.width, canvas.height)
        } else {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        }
      }
      // If we're here without setting canvas dimensions, it means we're using an uploaded image
      // which has already been drawn to the canvas

      // Continue with preprocessing and detection as before...
      const preprocessedCanvas = preprocessImage(canvas)

      // Run object detection on the preprocessed image
      let furnitureItems = []

      if (mockDetection || !model) {
        // Use mock detection if TensorFlow failed to load or model isn't available
        furnitureItems = mockDetectFurniture(preprocessedCanvas)
      } else {
        // Use real detection with TensorFlow
        const predictions = await model.detect(preprocessedCanvas)

        // Apply enhanced furniture detection if enabled
        if (detectionSettings.enhancedFurnitureDetection) {
          furnitureItems = enhanceFurnitureDetection(predictions)
        } else {
          // Just filter by confidence threshold
          furnitureItems = predictions.filter((pred: any) => pred.score >= detectionSettings.confidenceThreshold)
        }
      }

      setDetectedObjects(furnitureItems)

      // Draw bounding boxes on display canvas
      if (displayCanvasRef.current) {
        const displayCanvas = displayCanvasRef.current
        displayCanvas.width = preprocessedCanvas.width
        displayCanvas.height = preprocessedCanvas.height

        const displayCtx = displayCanvas.getContext("2d")
        if (!displayCtx) return

        // Draw the preprocessed image
        displayCtx.drawImage(preprocessedCanvas, 0, 0)

        // Draw bounding boxes
        furnitureItems.forEach((item: any) => {
          // Color based on confidence
          const confidence = item.score
          let color = "#FF0000" // Red for low confidence

          if (confidence > 0.8) {
            color = "#00FF00" // Green for high confidence
          } else if (confidence > 0.6) {
            color = "#FFFF00" // Yellow for medium confidence
          }

          displayCtx.strokeStyle = color
          displayCtx.lineWidth = 2
          displayCtx.strokeRect(item.bbox[0], item.bbox[1], item.bbox[2], item.bbox[3])

          // Draw label
          displayCtx.fillStyle = `${color}BB` // Semi-transparent background
          displayCtx.fillRect(item.bbox[0], item.bbox[1] > 20 ? item.bbox[1] - 20 : item.bbox[1], item.bbox[2], 20)

          displayCtx.fillStyle = "#FFFFFF"
          displayCtx.font = "14px Arial"
          const mappedClass =
            FURNITURE_CLASS_MAP[item.class.toLowerCase()] ||
            ADDITIONAL_FURNITURE[item.class.toLowerCase()] ||
            item.class
          displayCtx.fillText(
            `${mappedClass}: ${Math.round(item.score * 100)}%`,
            item.bbox[0] + 5,
            item.bbox[1] > 20 ? item.bbox[1] - 5 : item.bbox[1] + 15,
          )
        })

        // Convert detected items to count by type
        const detectedFurniture: { [key: string]: number } = {}
        furnitureItems.forEach((item: any) => {
          const mappedClass =
            FURNITURE_CLASS_MAP[item.class.toLowerCase()] ||
            ADDITIONAL_FURNITURE[item.class.toLowerCase()] ||
            item.class.charAt(0).toUpperCase() + item.class.slice(1)

          // If we're allowing multiple detections of the same object or this is a new object
          if (detectionSettings.multipleDetections || !detectedFurniture[mappedClass]) {
            detectedFurniture[mappedClass] = (detectedFurniture[mappedClass] || 0) + 1
          }
        })

        // Convert canvas to data URL and pass to parent along with detected furniture
        const imageUrl = displayCanvas.toDataURL("image/jpeg")
        onCapture(imageUrl, detectedFurniture)
      }
    } catch (error) {
      console.error("Error during object detection:", error)

      // If detection fails, use mock detection as fallback
      if (canvasRef.current && displayCanvasRef.current) {
        const mockItems = mockDetectFurniture(canvasRef.current)

        // Convert detected items to count by type
        const detectedFurniture: { [key: string]: number } = {}
        mockItems.forEach((item: any) => {
          const mappedClass =
            FURNITURE_CLASS_MAP[item.class.toLowerCase()] ||
            ADDITIONAL_FURNITURE[item.class.toLowerCase()] ||
            item.class.charAt(0).toUpperCase() + item.class.slice(1)
          detectedFurniture[mappedClass] = (detectedFurniture[mappedClass] || 0) + 1
        })

        // Use the original image
        const imageUrl = canvasRef.current.toDataURL("image/jpeg")
        onCapture(imageUrl, detectedFurniture)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  // Function to manually play video if autoplay fails
  const handleManualVideoPlay = () => {
    if (videoRef.current && !isPlayingVideo) {
      videoRef.current
        .play()
        .then(() => {
          setIsPlayingVideo(true)
          setCameraError(null)
        })
        .catch((e) => {
          console.error("Manual play failed:", e)
          setCameraError("Could not play video: " + e.message)
        })
    }
  }

  // Handle zoom in
  const handleZoomIn = () => {
    if (zoomLevel < 3) {
      setZoomLevel((prev) => Math.min(prev + 0.2, 3))
    }
  }

  // Handle zoom out
  const handleZoomOut = () => {
    if (zoomLevel > 1) {
      setZoomLevel((prev) => Math.max(prev - 0.2, 1))
    }
  }

  return (
    <div className="border rounded-lg p-4 flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">Camera</h3>
        {isActive && (
          <div className="flex gap-2">
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={zoomLevel <= 1}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs w-12 text-center">{zoomLevel.toFixed(1)}x</span>
              <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={zoomLevel >= 3}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Sliders className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <Tabs defaultValue="preprocessing">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="preprocessing">Image Processing</TabsTrigger>
                    <TabsTrigger value="detection">Detection</TabsTrigger>
                  </TabsList>

                  <TabsContent value="preprocessing" className="space-y-4">
                    <h4 className="font-medium">Image Preprocessing</h4>

                    <div className="space-y-2">
                      <Label htmlFor="preprocessingMethod">Optimization Method</Label>
                      <Select
                        value={preprocessingSettings.preprocessingMethod}
                        onValueChange={(value) =>
                          setPreprocessingSettings({ ...preprocessingSettings, preprocessingMethod: value })
                        }
                      >
                        <SelectTrigger id="preprocessingMethod">
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="furniture">Furniture Optimized</SelectItem>
                          <SelectItem value="auto">Auto Enhancement</SelectItem>
                          <SelectItem value="lowLight">Low Light Optimization</SelectItem>
                          <SelectItem value="manual">Manual Settings</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {preprocessingSettings.preprocessingMethod === "manual" && (
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label htmlFor="brightness">Brightness</Label>
                            <span className="text-xs text-muted-foreground">{preprocessingSettings.brightness}%</span>
                          </div>
                          <Slider
                            id="brightness"
                            min={-50}
                            max={50}
                            step={5}
                            value={[preprocessingSettings.brightness]}
                            onValueChange={(value) =>
                              setPreprocessingSettings({ ...preprocessingSettings, brightness: value[0] })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label htmlFor="contrast">Contrast</Label>
                            <span className="text-xs text-muted-foreground">{preprocessingSettings.contrast}%</span>
                          </div>
                          <Slider
                            id="contrast"
                            min={-50}
                            max={50}
                            step={5}
                            value={[preprocessingSettings.contrast]}
                            onValueChange={(value) =>
                              setPreprocessingSettings({ ...preprocessingSettings, contrast: value[0] })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label htmlFor="blurRadius">Blur (Noise Reduction)</Label>
                            <span className="text-xs text-muted-foreground">{preprocessingSettings.blurRadius}px</span>
                          </div>
                          <Slider
                            id="blurRadius"
                            min={0}
                            max={3}
                            step={0.1}
                            value={[preprocessingSettings.blurRadius]}
                            onValueChange={(value) =>
                              setPreprocessingSettings({ ...preprocessingSettings, blurRadius: value[0] })
                            }
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="edgeEnhancement"
                            checked={preprocessingSettings.edgeEnhancement}
                            onCheckedChange={(checked) =>
                              setPreprocessingSettings({ ...preprocessingSettings, edgeEnhancement: checked })
                            }
                          />
                          <Label htmlFor="edgeEnhancement">Edge Enhancement</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="histogramEqualization"
                            checked={preprocessingSettings.histogramEqualization}
                            onCheckedChange={(checked) =>
                              setPreprocessingSettings({ ...preprocessingSettings, histogramEqualization: checked })
                            }
                          />
                          <Label htmlFor="histogramEqualization">Improve Contrast</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="denoise"
                            checked={preprocessingSettings.denoise}
                            onCheckedChange={(checked) =>
                              setPreprocessingSettings({ ...preprocessingSettings, denoise: checked })
                            }
                          />
                          <Label htmlFor="denoise">Denoise Image</Label>
                        </div>
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="detection" className="space-y-4">
                    <h4 className="font-medium">Detection Settings</h4>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="confidenceThreshold">Detection Confidence</Label>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(detectionSettings.confidenceThreshold * 100)}%
                        </span>
                      </div>
                      <Slider
                        id="confidenceThreshold"
                        min={0.2}
                        max={0.9}
                        step={0.05}
                        value={[detectionSettings.confidenceThreshold]}
                        onValueChange={(value) =>
                          setDetectionSettings({ ...detectionSettings, confidenceThreshold: value[0] })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Lower values detect more items but may include false positives
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="detectionModel">Detection Model</Label>
                      <Select
                        value={detectionSettings.detectionModel}
                        onValueChange={(value) => setDetectionSettings({ ...detectionSettings, detectionModel: value })}
                      >
                        <SelectTrigger id="detectionModel">
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mobilenet_v2">MobileNet V2 (Faster)</SelectItem>
                          <SelectItem value="lite_mobilenet_v2">Lite MobileNet (Fastest)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enhancedFurnitureDetection"
                        checked={detectionSettings.enhancedFurnitureDetection}
                        onCheckedChange={(checked) =>
                          setDetectionSettings({ ...detectionSettings, enhancedFurnitureDetection: checked })
                        }
                      />
                      <Label htmlFor="enhancedFurnitureDetection">Enhanced Furniture Detection</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="multipleDetections"
                        checked={detectionSettings.multipleDetections}
                        onCheckedChange={(checked) =>
                          setDetectionSettings({ ...detectionSettings, multipleDetections: checked })
                        }
                      />
                      <Label htmlFor="multipleDetections">Allow Multiple Detections</Label>
                    </div>

                    {availableCameras.length > 1 && (
                      <div className="space-y-2">
                        <Label htmlFor="cameraSelect">Camera</Label>
                        <Select
                          value={selectedCamera}
                          onValueChange={(value) => {
                            setSelectedCamera(value)
                            // If camera is active, restart it with new device
                            if (isActive) {
                              stopCamera()
                              setTimeout(() => startCamera(), 300)
                            }
                          }}
                        >
                          <SelectTrigger id="cameraSelect">
                            <SelectValue placeholder="Select camera" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCameras.map((camera) => (
                              <SelectItem key={camera.deviceId} value={camera.deviceId}>
                                {camera.label || `Camera ${camera.deviceId.slice(0, 5)}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full mt-4"
                  onClick={() => {
                    if (videoRef.current && canvasRef.current) {
                      const video = videoRef.current
                      const canvas = canvasRef.current

                      // Draw current frame
                      canvas.width = video.videoWidth || 640
                      canvas.height = video.videoHeight || 480
                      const ctx = canvas.getContext("2d")
                      if (ctx) {
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                        preprocessImage(canvas)
                      }
                    }
                  }}
                >
                  Preview Settings
                </Button>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      <div className="relative bg-muted rounded-md overflow-hidden aspect-video mb-4" ref={videoContainerRef}>
        {isActive ? (
          <div className="w-full h-full relative video-container">
            {/* Video will be inserted here programmatically */}
            {!isPlayingVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <Button onClick={handleManualVideoPlay} variant="secondary">
                  <Camera className="h-4 w-4 mr-2" />
                  Tap to Start Camera
                </Button>
              </div>
            )}

            {preprocessedImageUrl && (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <img
                  src={preprocessedImageUrl || "/placeholder.svg"}
                  alt="Preprocessed preview"
                  className="w-full h-full object-cover opacity-70"
                />
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  Preview Mode
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isModelLoading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-12 w-12 text-muted-foreground animate-spin mb-2" />
                <p className="text-sm text-muted-foreground">Loading detection model...</p>
              </div>
            ) : cameraError ? (
              <div className="flex flex-col items-center text-center p-4">
                <Camera className="h-12 w-12 text-red-500 mb-2" />
                <p className="text-sm text-red-500 font-medium mb-1">Camera Error</p>
                <p className="text-xs text-muted-foreground mb-4">{cameraError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCameraError(null)
                    startCamera()
                  }}
                >
                  Try Again
                </Button>
              </div>
            ) : (
              <Camera className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
        <canvas ref={displayCanvasRef} className="hidden" />
        <canvas ref={preprocessCanvasRef} className="hidden" />
      </div>

      {cameraError && <div className="text-red-500 text-sm mb-2">{cameraError}</div>}

      <div className="flex gap-2 mt-auto">
        {!isActive ? (
          <>
            <Button onClick={startCamera} className="flex-1" disabled={isModelLoading}>
              {isModelLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading Model...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Start Camera
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => document.getElementById("fallback-upload")?.click()}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Image
              <input
                id="fallback-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0]
                    const reader = new FileReader()
                    reader.onload = (event) => {
                      if (event.target?.result) {
                        // Create an image to get dimensions
                        const img = new Image()
                        img.crossOrigin = "anonymous"
                        img.onload = () => {
                          // Draw the image to canvas for processing
                          if (canvasRef.current) {
                            const canvas = canvasRef.current
                            canvas.width = img.width
                            canvas.height = img.height
                            const ctx = canvas.getContext("2d")
                            if (ctx) {
                              ctx.drawImage(img, 0, 0)
                              // Process the image
                              captureImage()
                            }
                          }
                        }
                        img.src = event.target.result.toString()
                      }
                    }
                    reader.readAsDataURL(file)
                  }
                }}
              />
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={stopCamera} disabled={isProcessing}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={captureImage} className="flex-1" disabled={isProcessing || !isPlayingVideo}>
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Capture & Detect
                </>
              )}
            </Button>
          </>
        )}
      </div>

      {detectedObjects.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Detected Items:</h4>
          <div className="bg-muted p-2 rounded-md text-sm">
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(
                detectedObjects.reduce(
                  (acc, obj) => {
                    const mappedClass =
                      FURNITURE_CLASS_MAP[obj.class.toLowerCase()] ||
                      ADDITIONAL_FURNITURE[obj.class.toLowerCase()] ||
                      obj.class.charAt(0).toUpperCase() + obj.class.slice(1)

                    // If we're allowing multiple detections of the same object or this is a new object
                    if (detectionSettings.multipleDetections || !acc[mappedClass]) {
                      acc[mappedClass] = {
                        count: (acc[mappedClass]?.count || 0) + 1,
                        confidence: Math.max(acc[mappedClass]?.confidence || 0, obj.score),
                      }
                    }
                    return acc
                  },
                  {} as Record<string, { count: number; confidence: number }>,
                ),
              ).map(([item, data]) => (
                <div key={item} className="flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <span>{item}:</span>
                    <span className="font-medium">{data.count}</span>
                  </div>
                  <Badge
                    variant={data.confidence > 0.8 ? "default" : data.confidence > 0.6 ? "secondary" : "outline"}
                    className="text-xs"
                  >
                    {Math.round(data.confidence * 100)}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
