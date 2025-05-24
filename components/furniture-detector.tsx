"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Camera, RefreshCw, Loader2, Sliders, Upload, ZoomIn, ZoomOut, AlertTriangle } from "lucide-react"
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
  onCapture: (imageUrl: string, detectedItems: { [key: string]: number }) => void;
  imageToProcess?: string | null; // New prop for external image
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
  laptop: "Laptop",
  microwave: "Microwave",
  oven: "Oven",
  refrigerator: "Refrigerator",
  book: "Book", 
  clock: "Clock",
  vase: "Vase",
  "potted plant": "Potted Plant",
  bottle: "Bottle",
  cup: "Cup",
  bowl: "Bowl",
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
  const [processingUploadedImage, setProcessingUploadedImage] = useState(false); // New state
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
  const [modelError, setModelError] = useState<string | null>(null)
  const [tfLoaded, setTfLoaded] = useState(false)
  const [mockDetection, setMockDetection] = useState(false)
  const [uploadedImageForDisplay, setUploadedImageForDisplay] = useState<string | null>(null);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false)
  const [videoElementCreated, setVideoElementCreated] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>("")

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null) // Used for processing both camera and uploaded images
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
        console.log("Available video devices:", videoDevices);

        // Set default camera (prefer back camera if available)
        if (videoDevices.length > 0) {
          // Try to find a back camera
          const backCamera = videoDevices.find(
            (device) => device.label.toLowerCase().includes("back") || device.label.toLowerCase().includes("rear"),
          )

          if (backCamera) {
            setSelectedCamera(backCamera.deviceId)
            console.log("Selected camera ID:", backCamera.deviceId);
          } else {
            setSelectedCamera(videoDevices[0].deviceId)
            console.log("Selected camera ID:", videoDevices[0].deviceId);
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
      let tfAvailable = false;
      let cocoSsdAvailable = false;

      if (window.tf) {
        tfAvailable = true;
      } else {
        console.warn("TensorFlow.js (window.tf) not found. AI detection will not work.");
      }

      if (window.cocoSsd) {
        cocoSsdAvailable = true;
      } else {
        console.warn("COCO-SSD (window.cocoSsd) not found. AI detection will not work.");
      }

      if (tfAvailable && cocoSsdAvailable) {
        setTfLoaded(true);
        return true;
      }
      return false;
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
        setModelError(null); // Clear any previous error
      } catch (error) {
        console.error("Error loading model:", error)
        const errorMessage = "AI model failed to load. Using mock detections. Please check your internet connection or try refreshing."
        console.error(errorMessage);
        setModelError(errorMessage);
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
    console.log("Attempting to start camera...");
    if (processingUploadedImage) {
      console.log("Camera start requested while processing uploaded image. Ignoring.");
      return;
    }
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
        console.log("Selected camera for getUserMedia:", selectedCamera);
        constraints.video = {
          ...constraints.video,
          deviceId: { exact: selectedCamera },
        }
      }

      console.log("Calling getUserMedia with constraints:", constraints);
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log("Successfully got media stream:", mediaStream);

      // Store the stream first
      setStream(mediaStream)

      // Set the stream to the video element
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      } else {
        console.warn("videoRef.current is null when trying to set srcObject. Stopping camera.");
        mediaStream.getTracks().forEach(track => track.stop());
        setCameraError("Could not attach video stream. Please try again.");
        setIsActive(false);
        return;
      }


      // Reset the playing state
      setIsPlayingVideo(false)

      // Make sure the video element is in the DOM
      if (videoContainerRef.current && videoRef.current) {
        const videoContainer = videoContainerRef.current.querySelector(".video-container")
        if (videoContainer && !videoContainer.contains(videoRef.current)) {
          const wrapper = document.createElement("div")
          wrapper.className = "absolute inset-0"
          wrapper.appendChild(videoRef.current)
          videoContainer.appendChild(wrapper)
        }
      }

      // Add event listeners to handle video loading
      if (videoRef.current) {
        videoRef.current.onloadedmetadata = () => {
          // Only try to play if the video element is still in the document
          if (videoRef.current) {
            setIsPlayingVideo(true)
            console.log("Attempting to play video...");
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
                  console.error("Full video play error:", e);
                  console.error("Error playing video:", e.message, e.name)
                  if (e.name === "AbortError") {
                    setCameraError("Video playback was aborted. Please try again.")
                  } else if (e.name === "NotAllowedError") {
                    setCameraError("Autoplay is disabled in your browser. Please enable it or click the video to play.")
                  } else {
                    setCameraError(`Error playing video: ${e.message || e.name || "Unknown playback error"}`)
                  }
                  setIsPlayingVideo(false)
                })
            }
          } else {
            console.warn("onloadedmetadata: videoRef.current is null. Cannot play video.");
          }
        }

        videoRef.current.onerror = (e) => {
          if (videoRef.current) { // Re-check ref
            console.error("Video element error:", e)
            setCameraError("Error accessing camera stream. The video element reported an error.")
            setIsPlayingVideo(false)
          } else {
            console.warn("onerror: videoRef.current is null.");
          }
        }
      }


      setIsActive(true)
      setCameraError(null)
    } catch (error: any) {
      console.error("Detailed camera error object:", error);
      console.error("Error accessing camera:", error.name, error.message)

      // Provide specific error messages based on the error
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setCameraError("Camera access denied. Please allow camera access in your browser settings.")
      } else if (error instanceof DOMException && error.name === "NotFoundError") {
        setCameraError("No camera found on your device. Please ensure it's connected.")
      } else if (error instanceof DOMException && error.name === "NotReadableError") {
        setCameraError("Camera is already in use by another application or a hardware error occurred.")
      } else if (error.message) {
        setCameraError(`Camera error: ${error.name ? `${error.name}: ` : ""}${error.message}`)
      }
      else {
        setCameraError("Could not start camera. Please ensure it's connected and not in use by another app.")
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
      // It's also good practice to remove event listeners if they were added directly
      // and might cause issues if the video element is reused or if this cleanup logic
      // is called multiple times. However, in this specific setup, they are re-assigned
      // in startCamera, so direct removal might not be strictly necessary here unless
      // we want to be absolutely thorough.
      // videoRef.current.onloadedmetadata = null;
      // videoRef.current.onerror = null;
    }

    // Reset other states
    setDetectedObjects([])
    setPreprocessedImageUrl(null)
    setUploadedImageForDisplay(null);
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
        const imageArea = canvas.width * canvas.height // Ensure canvas is defined, might need to pass it or check canvasRef

        let furnitureType = "Potential Furniture"; // Simplified classification

        // Example of how you might still use some heuristics if desired, but keep it generic
        // if (area > imageArea * 0.2) { // Very large object
        //   furnitureType = "Large Unidentified Object";
        // }

        filteredPredictions.push({
          ...item,
          class: furnitureType, // No .toLowerCase() needed if it's a fixed string like "Potential Furniture"
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

  // New function to process an image from a data URL
  const processImageSource = async (imageSrc: string) => {
    console.log("[FurnitureDetector] processImageSource started for:", imageSrc);
    if (!canvasRef.current || !displayCanvasRef.current) {
      console.error("[FurnitureDetector] Canvas refs not available for image processing.");
      return;
    }
    if (modelError) {
      console.warn("[FurnitureDetector] Model error, using mock detections for uploaded image.");
    }
    if (!model && !mockDetection) {
        console.warn("[FurnitureDetector] Model not loaded and mock detection is off. Cannot process image yet.");
        // Optionally: set an error message to inform the user
        // setCameraError("Model is still loading, please try again shortly.");
        return;
    }

    setIsProcessing(true);
    setProcessingUploadedImage(true);
    setUploadedImageForDisplay(imageSrc); // Show the uploaded image
    setCameraError(null); // Clear previous errors
    stopCamera(); // Ensure camera is off

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageSrc;

      img.onload = async () => {
        console.log("[FurnitureDetector] Image loaded into HTMLImageElement:", img.width, "x", img.height);
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setIsProcessing(false);
          setProcessingUploadedImage(false);
          setCameraError("Failed to get canvas context for uploaded image.");
          return;
        }
        ctx.drawImage(img, 0, 0);

        const preprocessedCanvas = preprocessImage(canvas);
        let furnitureItems = [];

        if (mockDetection || !model) {
          furnitureItems = mockDetectFurniture(preprocessedCanvas);
          console.log("[FurnitureDetector] Raw mock predictions (same as enhanced for mock):", furnitureItems);
        } else {
          const predictions = await model.detect(preprocessedCanvas);
          console.log("[FurnitureDetector] Raw predictions:", predictions);
          if (detectionSettings.enhancedFurnitureDetection) {
            furnitureItems = enhanceFurnitureDetection(predictions);
          } else {
            furnitureItems = predictions.filter((pred: any) => pred.score >= detectionSettings.confidenceThreshold);
          }
          console.log("[FurnitureDetector] Enhanced predictions:", furnitureItems);
        }
        setDetectedObjects(furnitureItems);

        const displayCanvas = displayCanvasRef.current;
        if (!displayCanvas) {
            setIsProcessing(false);
            setProcessingUploadedImage(false);
            setCameraError("Display canvas not available.");
            return;
        }
        displayCanvas.width = preprocessedCanvas.width;
        displayCanvas.height = preprocessedCanvas.height;
        const displayCtx = displayCanvas.getContext("2d");
        if (!displayCtx) {
            setIsProcessing(false);
            setProcessingUploadedImage(false);
            setCameraError("Failed to get display canvas context.");
            return;
        }

        displayCtx.drawImage(preprocessedCanvas, 0, 0);
        furnitureItems.forEach((item: any) => {
          const confidence = item.score;
          let color = "#FF0000";
          if (confidence > 0.8) color = "#00FF00";
          else if (confidence > 0.6) color = "#FFFF00";
          displayCtx.strokeStyle = color;
          displayCtx.lineWidth = 2;
          displayCtx.strokeRect(item.bbox[0], item.bbox[1], item.bbox[2], item.bbox[3]);
          displayCtx.fillStyle = `${color}BB`;
          displayCtx.fillRect(item.bbox[0], item.bbox[1] > 20 ? item.bbox[1] - 20 : item.bbox[1], item.bbox[2], 20);
          displayCtx.fillStyle = "#FFFFFF";
          displayCtx.font = "14px Arial";
          const mappedClass = FURNITURE_CLASS_MAP[item.class.toLowerCase()] || ADDITIONAL_FURNITURE[item.class.toLowerCase()] || item.class;
          displayCtx.fillText(`${mappedClass}: ${Math.round(item.score * 100)}%`, item.bbox[0] + 5, item.bbox[1] > 20 ? item.bbox[1] - 5 : item.bbox[1] + 15);
        });

        const finalImageUrl = displayCanvas.toDataURL("image/jpeg");
        const detectedFurniture: { [key: string]: number } = {};
        furnitureItems.forEach((item: any) => {
          const mappedClass = FURNITURE_CLASS_MAP[item.class.toLowerCase()] || ADDITIONAL_FURNITURE[item.class.toLowerCase()] || item.class.charAt(0).toUpperCase() + item.class.slice(1);
          if (detectionSettings.multipleDetections || !detectedFurniture[mappedClass]) {
            detectedFurniture[mappedClass] = (detectedFurniture[mappedClass] || 0) + 1;
          }
        });
        console.log("[FurnitureDetector] Calling onCapture with detected items:", detectedFurniture, "and imageURL length:", finalImageUrl.length);
        onCapture(finalImageUrl, detectedFurniture);
        setIsProcessing(false);
        // Keep processingUploadedImage true so the UI shows the result of the upload
        // It will be reset if the user starts camera or uploads another image.
      };

      img.onerror = (e) => {
        console.error("[FurnitureDetector] Error loading image into HTMLImageElement:", e);
        setCameraError("Failed to load the provided image. Please try a different image.");
        setIsProcessing(false);
        setProcessingUploadedImage(false);
        setUploadedImageForDisplay(null);
      };
    } catch (error) {
      console.error("[FurnitureDetector] Error processing uploaded image:", error);
      setCameraError("An unexpected error occurred while processing the image.");
      setIsProcessing(false);
      setProcessingUploadedImage(false);
      setUploadedImageForDisplay(null);
    }
  };
  
  // useEffect to handle imageToProcess prop
  useEffect(() => {
    if (imageToProcess) {
      console.log("[FurnitureDetector] imageToProcess prop changed:", imageToProcess);
      console.log("[FurnitureDetector] Model status: isModelLoading=", isModelLoading, "model=", !!model, "mockDetection=", mockDetection, "modelError=", modelError);
      // If model is loading, wait.
      // This effect will re-run when isModelLoading changes or model becomes available.
      if (isModelLoading) {
        console.log("[FurnitureDetector] imageToProcess received, but model is loading. Waiting...");
        return; 
      }
      if (model || mockDetection) { // Only process if the model is loaded or mock detection is on
        console.log("[FurnitureDetector] Calling processImageSource for:", imageToProcess);
        processImageSource(imageToProcess);
      } else if (modelError) {
        console.warn("[FurnitureDetector] imageToProcess received, but there's a model error. Processing with mock if available.");
        console.log("[FurnitureDetector] Calling processImageSource for (with model error):", imageToProcess);
        processImageSource(imageToProcess); // Will use mock due to modelError
      } else {
        console.log("[FurnitureDetector] imageToProcess received, but model not ready and no model error. Will wait for model.");
        // Optional: show a message to the user that model is loading
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageToProcess, model, isModelLoading, mockDetection, modelError]); // Add model, isModelLoading, mockDetection, modelError to deps


  const captureImage = async () => {
    if (!canvasRef.current) return

    setIsProcessing(true)
    setProcessingUploadedImage(false); // Ensure this is false if capturing from camera
    setUploadedImageForDisplay(null);


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
        if (!ctx) {
            setIsProcessing(false);
            return;
        }

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
      } else {
        // This case should ideally not be hit if captureImage is only for camera.
        // If it can be hit with an already loaded canvas (e.g. from a previous upload),
        // ensure canvas has content. For now, assume it's camera path.
        console.warn("captureImage called without active video stream. Canvas might be empty or stale.");
        setIsProcessing(false);
        return;
      }
      
      const preprocessedCanvas = preprocessImage(canvas)
      let furnitureItems = []

      if (mockDetection || !model) {
        furnitureItems = mockDetectFurniture(preprocessedCanvas)
        console.log("[FurnitureDetector] Raw mock predictions (captureImage - same as enhanced for mock):", furnitureItems);
      } else {
        const predictions = await model.detect(preprocessedCanvas)
        console.log("[FurnitureDetector] Raw predictions (captureImage):", predictions);
        if (detectionSettings.enhancedFurnitureDetection) {
          furnitureItems = enhanceFurnitureDetection(predictions)
        } else {
          furnitureItems = predictions.filter((pred: any) => pred.score >= detectionSettings.confidenceThreshold)
        }
        console.log("[FurnitureDetector] Enhanced predictions (captureImage):", furnitureItems);
      }
      setDetectedObjects(furnitureItems)

      if (displayCanvasRef.current) {
        const displayCanvas = displayCanvasRef.current
        displayCanvas.width = preprocessedCanvas.width
        displayCanvas.height = preprocessedCanvas.height
        const displayCtx = displayCanvas.getContext("2d")
        if (!displayCtx) {
            setIsProcessing(false);
            return;
        }
        displayCtx.drawImage(preprocessedCanvas, 0, 0)
        furnitureItems.forEach((item: any) => {
          const confidence = item.score;
          let color = "#FF0000";
          if (confidence > 0.8) color = "#00FF00";
          else if (confidence > 0.6) color = "#FFFF00";
          displayCtx.strokeStyle = color;
          displayCtx.lineWidth = 2;
          displayCtx.strokeRect(item.bbox[0], item.bbox[1], item.bbox[2], item.bbox[3]);
          displayCtx.fillStyle = `${color}BB`;
          displayCtx.fillRect(item.bbox[0], item.bbox[1] > 20 ? item.bbox[1] - 20 : item.bbox[1], item.bbox[2], 20);
          displayCtx.fillStyle = "#FFFFFF";
          displayCtx.font = "14px Arial";
          const mappedClass = FURNITURE_CLASS_MAP[item.class.toLowerCase()] || ADDITIONAL_FURNITURE[item.class.toLowerCase()] || item.class;
          displayCtx.fillText(`${mappedClass}: ${Math.round(item.score * 100)}%`, item.bbox[0] + 5, item.bbox[1] > 20 ? item.bbox[1] - 5 : item.bbox[1] + 15);
        });

        const imageUrl = displayCanvas.toDataURL("image/jpeg");
        const detectedFurniture: { [key: string]: number } = {};
        furnitureItems.forEach((item: any) => {
          const mappedClass = FURNITURE_CLASS_MAP[item.class.toLowerCase()] || ADDITIONAL_FURNITURE[item.class.toLowerCase()] || item.class.charAt(0).toUpperCase() + item.class.slice(1);
          if (detectionSettings.multipleDetections || !detectedFurniture[mappedClass]) {
            detectedFurniture[mappedClass] = (detectedFurniture[mappedClass] || 0) + 1;
          }
        });
        console.log("[FurnitureDetector] Calling onCapture (captureImage) with detected items:", detectedFurniture, "and imageURL length:", imageUrl.length);
        onCapture(imageUrl, detectedFurniture);
      }
    } catch (error) {
      console.error("[FurnitureDetector] Error during object detection (captureImage):", error)
      if (canvasRef.current && displayCanvasRef.current) {
        const mockItems = mockDetectFurniture(canvasRef.current)
        const detectedFurniture: { [key: string]: number } = {}
        mockItems.forEach((item: any) => {
          const mappedClass = FURNITURE_CLASS_MAP[item.class.toLowerCase()] || ADDITIONAL_FURNITURE[item.class.toLowerCase()] || item.class.charAt(0).toUpperCase() + item.class.slice(1);
          detectedFurniture[mappedClass] = (detectedFurniture[mappedClass] || 0) + 1;
        });
        const imageUrl = canvasRef.current.toDataURL("image/jpeg");
        onCapture(imageUrl, detectedFurniture);
      }
    } finally {
      setIsProcessing(false)
    }
  }

  // Function to manually play video if autoplay fails
  const handleManualVideoPlay = () => {
    if (videoRef.current && !isPlayingVideo && !processingUploadedImage) { // Don't allow manual play if processing upload
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
        {modelError && !isModelLoading && !processingUploadedImage && (
          <div className="absolute inset-0 flex items-center justify-center z-30 p-4">
            <div className="text-red-500 text-sm p-3 bg-red-100 border border-red-500 rounded-md shadow-lg w-full max-w-md text-center">
              <AlertTriangle className="h-5 w-5 inline-block mr-2" />
              <strong>AI Model Error:</strong> {modelError}
            </div>
          </div>
        )}
        {processingUploadedImage ? (
            <div className="w-full h-full flex items-center justify-center">
                {uploadedImageForDisplay ? (
                    <img src={uploadedImageForDisplay} alt="Processing" className="max-w-full max-h-full object-contain" />
                ) : (
                    <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
                )}
                 {isProcessing && ( // Show "Processing..." text only when actively processing
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                        <p className="text-white text-lg font-semibold">Processing uploaded image...</p>
                    </div>
                )}
            </div>
        ) : isActive ? (
          <div className="w-full h-full relative video-container">
            {/* Video will be inserted here programmatically */}
            {!isPlayingVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <Button onClick={handleManualVideoPlay} variant="secondary" disabled={processingUploadedImage}>
                  <Camera className="h-4 w-4 mr-2" />
                  Tap to Start Camera
                </Button>
              </div>
            )}

            {preprocessedImageUrl && !processingUploadedImage && ( // Don't show preprocessed preview if processing uploaded image
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
          // Fallback view when camera is not active and not processing an upload
          <div className="w-full h-full flex items-center justify-center">
            {isModelLoading && !modelError && (
              <div className="flex flex-col items-center">
                <Loader2 className="h-12 w-12 text-muted-foreground animate-spin mb-2" />
                <p className="text-sm text-muted-foreground">Loading detection model...</p>
              </div>
            )}
            {!isModelLoading && modelError && ( 
               <div className="flex flex-col items-center text-center p-4">
                 <AlertTriangle className="h-12 w-12 text-red-500 mb-2" />
                 <p className="text-sm text-red-500 font-medium mb-1">AI Model Error</p>
                 <p className="text-xs text-muted-foreground">{modelError}</p>
               </div>
            )}
            {!isModelLoading && !modelError && cameraError && ( 
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
                  disabled={processingUploadedImage}
                >
                  Try Again
                </Button>
              </div>
            )}
             {!isModelLoading && !modelError && !cameraError && ( // Default placeholder
              <Camera className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" /> 
        <canvas ref={displayCanvasRef} className="hidden" />
        <canvas ref={preprocessCanvasRef} className="hidden" />
      </div>

    {/* Display Camera Error - only if not processing uploaded image and no model error */}
    {cameraError && !modelError && !processingUploadedImage && (
        <div className="text-red-500 text-sm mb-2 p-2 bg-red-100 border border-red-500 rounded flex items-center">
            <AlertTriangle className="h-4 w-4 inline-block mr-2" />
            {cameraError}
        </div>
    )}
    
    {/* Display Model Error if not already shown prominently in the video area - only if not processing uploaded image */}
    {modelError && (isActive || !cameraError) && !processingUploadedImage && (
        <div className="text-red-500 text-sm mb-2 p-2 bg-red-100 border border-red-500 rounded flex items-center">
            <AlertTriangle className="h-4 w-4 inline-block mr-2" />
            <strong>AI Model Error:</strong> {modelError}
        </div>
    )}


      <div className="flex gap-2 mt-auto">
      {!isActive && !processingUploadedImage ? ( // Show camera/upload buttons only if camera not active AND not processing upload
          <>
          <Button onClick={startCamera} className="flex-1" disabled={isModelLoading || !!modelError || processingUploadedImage}>
            {isModelLoading && !modelError ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading Model...
                </>
            ) : modelError ? (
                 <>
                   <AlertTriangle className="h-4 w-4 mr-2" />
                   Model Error
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
              onClick={() => {
                if (processingUploadedImage) return; // Prevent click during processing
                document.getElementById("fallback-upload")?.click()
              }}
              className="flex-1"
              disabled={!!modelError || processingUploadedImage || isModelLoading}
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
                    const file = e.target.files[0];
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      if (event.target?.result) {
                        // Instead of calling captureImage directly, call processImageSource
                        processImageSource(event.target.result.toString());
                      }
                    };
                    reader.readAsDataURL(file);
                    // Clear the input value to allow selecting the same file again
                    if (e.target) e.target.value = ""; 
                  }
                }}
              />
            </Button>
          </>
        ) : ( // This is the case where camera is active OR processing uploaded image
          <>
            <Button variant="outline" onClick={() => {
                if (processingUploadedImage) {
                    setProcessingUploadedImage(false); // Allow resetting from processed image view
                    setUploadedImageForDisplay(null);
                    setDetectedObjects([]); // Clear old detections
                } else {
                    stopCamera();
                }
            }} 
            disabled={isProcessing && !processingUploadedImage} // Disable if camera processing, but not if showing uploaded result
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset 
            </Button>
            <Button 
                onClick={captureImage} 
                className="flex-1" 
                disabled={isProcessing || !isPlayingVideo || processingUploadedImage} // Disable if processing anything or video not playing or showing uploaded image
            >
              {isProcessing && !processingUploadedImage ? ( // Show "Processing..." only for camera captures
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
                    const className = obj.class.toLowerCase(); // Ensure class name is lowercased for map lookup
                    const mappedClass =
                      FURNITURE_CLASS_MAP[className] ||
                      ADDITIONAL_FURNITURE[className] ||
                      obj.class.charAt(0).toUpperCase() + obj.class.slice(1); // Fallback to original class name

                    // If we're allowing multiple detections of the same object or this is a new object
                    if (detectionSettings.multipleDetections || !acc[mappedClass]) {
                      acc[mappedClass] = {
                        count: (acc[mappedClass]?.count || 0) + 1,
                        confidence: Math.max(acc[mappedClass]?.confidence || 0, obj.score),
                      };
                    }
                    return acc;
                  },
                  {} as Record<string, { count: number; confidence: number }>,
                ),
              ).map(([item, data]) => (
                <div key={item} className="flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <span>{item}:</span> {/* Item name already correctly mapped */}
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
