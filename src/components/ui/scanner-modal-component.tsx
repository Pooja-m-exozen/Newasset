"use client"

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Camera,
  Upload,
  X,
  Scan,
  Image as ImageIcon,
  CheckCircle,
  MapPin,
  Eye,
  CheckSquare,
  User
} from 'lucide-react'
import jsQR from 'jsqr'

interface ScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onScanResult: (result: string) => void
  scannedResult?: string | null
  assets?: Array<{
    _id: string
    tagId: string
    assetType: string
    brand: string
    model: string
    status: string
    priority: string
    location?: {
      building: string
      floor: string
      room: string
    } | null
    assignedTo?: {
      name: string
      email: string
    } | string
    digitalAssets?: {
      qrCode?: {
        data?: {
          t?: string
          a?: string
          s?: string
          b?: string
          m?: string
          st?: string
          p?: string
          l?: {
            latitude: string
            longitude: string
            floor: string
            room: string
            building: string
          }
          u?: string
          pr?: string | null
          lm?: string | null
          nm?: string | null
          url?: string
          ts?: number
          c?: string
        } | null
      }
      nfcData?: {
        data?: {
          type?: string
          id?: string
          assetType?: string
          subcategory?: string
          brand?: string
          model?: string
          status?: string
          priority?: string
          location?: {
            latitude: string
            longitude: string
            floor: string
            room: string
            building: string
          }
          assignedTo?: string
          timestamp?: string
          checksum?: string
          signature?: string
        } | null
      }
    }
  }>
  checklists?: Array<{
    _id: string
    title: string
    qrCode: {
      data: string
      url: string
    }
    location: {
      building: string
      floor: string
      zone: string
    }
    type: string
    status: string
    priority: string
  }>
  mode?: 'assets' | 'checklists'
}

export function ScannerModal({ 
  isOpen, 
  onClose, 
  onScanResult, 
  assets = [],
  checklists = [],
  mode = 'assets'
}: ScannerModalProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const [scanningError, setScanningError] = useState<string | null>(null)
  const [scanAttempts, setScanAttempts] = useState(0)
  const [scanResult, setScanResult] = useState<{
    success: boolean
    assetId: string
    asset?: {
      _id: string
      tagId?: string
      title?: string
      assetType?: string
      brand?: string
      model?: string
      status?: string
      priority?: string
      type?: string
      location?: {
        building: string
        floor: string
        room?: string
        zone?: string
      } | null
      assignedTo?: {
        name: string
        email: string
      } | string
      items?: Array<{
        _id: string
        serialNumber: number
        inspectionItem: string
        details: string
        status?: string
        remarks?: string
      }>
    }
    message: string
    isProcessing?: boolean
    qrImageData?: string
  } | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const scaledCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationIdRef = useRef<number | null>(null)
  const [copied, setCopied] = useState(false)
  const processingFrameRef = useRef(false)
  // Use native BarcodeDetector if available for faster/more reliable scanning
  const barcodeDetectorRef = useRef<null | { detect: (source: CanvasImageSource) => Promise<Array<{ rawValue: string }>> }>(null)
  const lastProcessTimeRef = useRef(0)
  const PROCESS_INTERVAL_MS = 16 // Reduced to ~60fps for maximum responsiveness
  const MAX_SCAN_ATTEMPTS = 300 // Increased attempts since we scan more frequently

  // Debug logging for assets
  useEffect(() => {
    console.log('ScannerModal received assets:', assets.length)
    if (assets.length > 0) {
      console.log('Sample asset:', assets[0])
    }
  }, [assets])

  // Scanner functions
  const startScanner = async () => {
    try {
      setIsScanning(true)
      setIsCameraReady(false)
      setScanningError(null)
      setScanAttempts(0)
      
      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser')
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
          frameRate: { ideal: 30, min: 15 }
        } 
      })
      
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        try {
          await videoRef.current.play()
          // Set camera as ready after video starts playing
          setIsCameraReady(true)
          // Try to enable continuous focus/zoom if supported for better clarity
          try {
            const [track] = stream.getVideoTracks()
            const capabilitiesUnknown = (track.getCapabilities && track.getCapabilities()) as unknown
            if (capabilitiesUnknown && typeof capabilitiesUnknown === 'object') {
              const capabilities = capabilitiesUnknown as Record<string, unknown>
              const advanced: Array<Record<string, unknown>> = []
              if (Object.prototype.hasOwnProperty.call(capabilities, 'focusMode')) {
                const adv: Record<string, unknown> = {}
                adv['focusMode'] = 'continuous'
                advanced.push(adv)
              }
              if (Object.prototype.hasOwnProperty.call(capabilities, 'zoom')) {
                const caps = capabilitiesUnknown as { zoom?: { max?: number; min?: number } }
                const desired = Math.min((caps.zoom?.max ?? 2), 2)
                const advZoom: Record<string, unknown> = {}
                advZoom['zoom'] = desired
                advanced.push(advZoom)
              }
              if (advanced.length > 0) {
                await track.applyConstraints({ advanced } as unknown as MediaTrackConstraints)
              }
            }
          } catch (e) {
            // Ignore capability errors silently
          }
          // Initialize BarcodeDetector if supported
          try {
            if (typeof window !== 'undefined') {
              const maybeDetector = (window as unknown as { BarcodeDetector?: new (opts: { formats: string[] }) => { detect: (source: CanvasImageSource) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector
              if (maybeDetector) {
                barcodeDetectorRef.current = new maybeDetector({ formats: ['qr_code'] })
              } else {
                barcodeDetectorRef.current = null
              }
            }
          } catch {
            barcodeDetectorRef.current = null
          }
          // Kick off live scan loop
          if (animationIdRef.current) {
            cancelAnimationFrame(animationIdRef.current)
            animationIdRef.current = null
          }
          animationIdRef.current = requestAnimationFrame(scanVideoFrame)
        } catch (playError) {
          console.error('Error playing video:', playError)
          throw new Error('Unable to start camera stream')
        }
      }
    } catch (error) {
      console.error('Error starting scanner:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unable to access camera'
      setScanningError(`Camera Error: ${errorMessage}. Please check permissions and try again.`)
      setIsScanning(false)
      setIsCameraReady(false)
    }
  }

  const stopScanner = () => {
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current)
      animationIdRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop()
        console.log('Camera track stopped:', track.label)
      })
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
    setIsCameraReady(false)
    setScanningError(null)
    setScanAttempts(0)
  }

  // Live scan loop using requestAnimationFrame
  const scanVideoFrame = async () => {
    try {
      if (!isScanning || !videoRef.current) {
        return
      }

      const video = videoRef.current
      // Ensure we have enough data to process
      if (video.readyState >= 2 /* HAVE_CURRENT_DATA */) {
        if (processingFrameRef.current) {
          return
        }
        const now = performance.now()
        if (now - lastProcessTimeRef.current < PROCESS_INTERVAL_MS) {
          return
        }
        lastProcessTimeRef.current = now
        processingFrameRef.current = true
        
        // Increment scan attempts for timeout detection
        setScanAttempts(prev => {
          const newAttempts = prev + 1
          // Auto-stop if too many attempts without success
          if (newAttempts > MAX_SCAN_ATTEMPTS) {
            setScanningError('No QR code detected. Please ensure the QR code is clearly visible and try again.')
            stopScanner()
            return newAttempts
          }
          return newAttempts
        })
        // Prepare canvas
        let canvas = canvasRef.current
        if (!canvas) {
          canvas = document.createElement('canvas')
          canvasRef.current = canvas
        }
        let scaledCanvas = scaledCanvasRef.current
        if (!scaledCanvas) {
          scaledCanvas = document.createElement('canvas')
          scaledCanvasRef.current = scaledCanvas
        }
        const width = video.videoWidth
        const height = video.videoHeight
        if (width && height) {
          if (canvas.width !== width) canvas.width = width
          if (canvas.height !== height) canvas.height = height
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(video, 0, 0, width, height)
            // Prefer native BarcodeDetector when available (fastest method)
            const detector = barcodeDetectorRef.current
            if (detector) {
              try {
                const results = await detector.detect(video)
                if (results && results.length > 0 && results[0].rawValue) {
                  console.log('QR detected via BarcodeDetector:', results[0].rawValue)
                  finalizeLiveScan(results[0].rawValue)
                  return
                }
              } catch (error) {
                console.warn('BarcodeDetector error:', error)
                // Ignore detector errors; fallback to jsQR
              }
            }
            // Optimized jsQR scanning with multiple attempts for better detection
            const targetWidth = Math.min(640, width) // Reduced from 720 for faster processing
            const scale = targetWidth / width
            const targetHeight = Math.floor(height * scale)
            if (scaledCanvas.width !== targetWidth) scaledCanvas.width = targetWidth
            if (scaledCanvas.height !== targetHeight) scaledCanvas.height = targetHeight
            const sctx = scaledCanvas.getContext('2d')
            let code = null as ReturnType<typeof jsQR> | null
            
            if (sctx) {
              // First attempt: full scaled image
              sctx.drawImage(canvas, 0, 0, width, height, 0, 0, targetWidth, targetHeight)
              const scaledImage = sctx.getImageData(0, 0, targetWidth, targetHeight)
              code = jsQR(scaledImage.data, scaledImage.width, scaledImage.height)
              
              // Second attempt: center crop for better signal
              if (!code) {
                const cropW = Math.floor(targetWidth * 0.8)
                const cropH = Math.floor(targetHeight * 0.8)
                const cropX = Math.floor((targetWidth - cropW) / 2)
                const cropY = Math.floor((targetHeight - cropH) / 2)
                const cropped = sctx.getImageData(cropX, cropY, cropW, cropH)
                code = jsQR(cropped.data, cropped.width, cropped.height)
              }
              
              // Third attempt: smaller crop for very small QR codes
              if (!code) {
                const cropW = Math.floor(targetWidth * 0.6)
                const cropH = Math.floor(targetHeight * 0.6)
                const cropX = Math.floor((targetWidth - cropW) / 2)
                const cropY = Math.floor((targetHeight - cropH) / 2)
                const cropped = sctx.getImageData(cropX, cropY, cropW, cropH)
                code = jsQR(cropped.data, cropped.width, cropped.height)
              }
              
              // Fourth attempt: quarter sections for edge cases
              if (!code) {
                const quarterW = Math.floor(targetWidth / 2)
                const quarterH = Math.floor(targetHeight / 2)
                const sections = [
                  { x: 0, y: 0 },
                  { x: quarterW, y: 0 },
                  { x: 0, y: quarterH },
                  { x: quarterW, y: quarterH }
                ]
                
                for (const section of sections) {
                  const sectionImage = sctx.getImageData(section.x, section.y, quarterW, quarterH)
                  code = jsQR(sectionImage.data, sectionImage.width, sectionImage.height)
                  if (code) break
                }
              }
            }
            if (code && code.data) {
              console.log('QR detected via jsQR:', code.data)
              finalizeLiveScan(code.data)
              return
            }
          }
        }
      }
    } catch (err) {
      console.error('Live scan error:', err)
      setScanningError('Scanner error occurred. Please try again.')
    } finally {
      processingFrameRef.current = false
      animationIdRef.current = requestAnimationFrame(scanVideoFrame)
    }
  }

  const finalizeLiveScan = (scannedQRContent: string) => {
    try {
      // Capture the current video frame as QR code image
      let qrImageData: string | undefined = undefined
      if (videoRef.current && canvasRef.current) {
        try {
          const canvas = canvasRef.current
          const video = videoRef.current
          const ctx = canvas.getContext('2d')
          
          if (ctx) {
            // Draw current video frame to canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            // Convert to data URL for QR code image
            qrImageData = canvas.toDataURL('image/png')
          }
        } catch (error) {
          console.warn('Could not capture QR code image:', error)
        }
      }

      if (mode === 'checklists') {
        const foundChecklist = checklists.find(checklist => 
          checklist._id === scannedQRContent ||
          checklist.qrCode?.data === scannedQRContent ||
          checklist.qrCode?.data?.includes(scannedQRContent) ||
          scannedQRContent.includes(checklist.qrCode?.data || '')
        )

        if (foundChecklist) {
          setScanResult({
            success: true,
            assetId: scannedQRContent,
            asset: foundChecklist,
            message: `✅ Checklist found: ${foundChecklist.title}`,
            qrImageData: qrImageData
          })
          onScanResult(scannedQRContent)
        } else {
          setScanResult({
            success: false,
            assetId: scannedQRContent,
            message: `ℹ️ QR Code scanned: "${scannedQRContent}" - Checklist not found in system`,
            qrImageData: qrImageData
          })
        }
      } else {
        const foundAsset = assets.find(asset => {
          const matches = [
            asset.tagId === scannedQRContent,
            asset._id === scannedQRContent,
            asset.digitalAssets?.qrCode?.data?.t === scannedQRContent,
            asset.digitalAssets?.qrCode?.data?.a === scannedQRContent,
            asset.digitalAssets?.nfcData?.data?.id === scannedQRContent,
            asset.tagId.includes(scannedQRContent),
            scannedQRContent.includes(asset.tagId)
          ]
          return matches.some(Boolean)
        })

        if (foundAsset) {
          setScanResult({
            success: true,
            assetId: scannedQRContent,
            asset: foundAsset,
            message: `✅ Asset found: ${foundAsset.tagId}`,
            qrImageData: qrImageData
          })
          onScanResult(scannedQRContent)
        } else {
          setScanResult({
            success: false,
            assetId: scannedQRContent,
            message: `ℹ️ QR Code scanned: "${scannedQRContent}" - Asset not registered in system`,
            qrImageData: qrImageData
          })
        }
      }
    } finally {
      stopScanner()
    }
  }

  const copyScannedCode = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  const scanAnother = () => {
    setScanResult(null)
    startScanner()
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      // Force complete state reset for new image
      setScanResult(null)
      setUploadedImage(null)
      setUploadPreview(null)
      
      // Small delay to ensure state is cleared before setting new values
      setTimeout(() => {
      setUploadedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      }, 10)
    }
  }

  const processUploadedImage = async () => {
    if (!uploadedImage) return
    
    try {
      console.log('Processing uploaded image:', uploadedImage.name)
      
      // Force complete state reset before processing
      setScanResult(null)
      
      // Small delay to ensure state is cleared
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // Show processing state
      setScanResult({
        success: false,
        assetId: '',
        message: 'Processing image...',
        isProcessing: true,
        qrImageData: undefined
      })
      
      // Actually process the uploaded image to extract QR code data
      const extractedData = await extractQRCodeFromImage(uploadedImage)
      
      if (extractedData && extractedData.success && extractedData.assetId) {
        const scannedQRContent = extractedData.assetId
        const qrImageData = extractedData.qrImageData
        
        console.log('QR Code extracted successfully:', scannedQRContent)
        
        if (mode === 'checklists') {
          // Handle checklist scanning
          const foundChecklist = checklists.find(checklist => 
            checklist._id === scannedQRContent ||
            checklist.qrCode?.data === scannedQRContent ||
            checklist.qrCode?.data?.includes(scannedQRContent) ||
            scannedQRContent.includes(checklist.qrCode?.data || '')
          )
          
          if (foundChecklist) {
            // Checklist found - show success
            console.log('Checklist found:', foundChecklist)
            setScanResult({
              success: true,
              assetId: scannedQRContent,
              asset: foundChecklist,
              message: `✅ Checklist found: ${foundChecklist.title}`,
              qrImageData: qrImageData
            })
            onScanResult(scannedQRContent)
          } else {
            // QR code found but checklist not in system - show info
            console.log('QR code found but no matching checklist')
            setScanResult({
              success: false,
              assetId: scannedQRContent,
              message: `ℹ️ QR Code scanned successfully: "${scannedQRContent}" - Checklist not found in system`,
              qrImageData: qrImageData
            })
          }
        } else {
          // Handle asset scanning
          console.log('Searching for asset with content:', scannedQRContent)
          console.log('Available assets:', assets.length)
          
          const foundAsset = assets.find(asset => {
            const matches = [
              asset.tagId === scannedQRContent,
              asset._id === scannedQRContent,
              asset.digitalAssets?.qrCode?.data?.t === scannedQRContent,
              asset.digitalAssets?.qrCode?.data?.a === scannedQRContent,
              asset.digitalAssets?.nfcData?.data?.id === scannedQRContent,
              asset.tagId.includes(scannedQRContent),
            scannedQRContent.includes(asset.tagId)
            ]
            
            console.log('Asset', asset.tagId, 'matches:', matches)
            return matches.some(match => match)
          })
          
          if (foundAsset) {
            // Asset found - show success
            console.log('Asset found:', foundAsset)
            setScanResult({
              success: true,
              assetId: scannedQRContent,
              asset: foundAsset,
              message: `✅ Asset found: ${foundAsset.tagId}`,
              qrImageData: qrImageData
            })
            onScanResult(scannedQRContent)
          } else {
            // QR code found but asset not in system - show info
            console.log('QR code found but no matching asset')
            setScanResult({
              success: false,
              assetId: scannedQRContent,
              message: `ℹ️ QR Code scanned successfully: "${scannedQRContent}" - Asset not registered in system`,
              qrImageData: qrImageData
            })
          }
        }
      } else {
        // Failed to extract QR code from image
        console.log('Failed to extract QR code:', extractedData?.error)
        setScanResult({
          success: false,
          assetId: '',
          message: extractedData?.error || '❌ No QR code found in the uploaded image. Please ensure the image contains a clear, readable QR code.',
          qrImageData: undefined
        })
      }
      
      // Clear upload state after processing
      setUploadedImage(null)
      setUploadPreview(null)
      
    } catch (error) {
      console.error('Error processing image:', error)
      setScanResult({
        success: false,
        assetId: '',
        message: '❌ Error processing image. Please try again.',
        qrImageData: undefined
      })
    }
  }

  // Enhanced function to actually extract QR code from image with better error handling
  const extractQRCodeFromImage = async (imageFile: File): Promise<{ success: boolean; assetId?: string; error?: string; qrImageData?: string }> => {
    return new Promise((resolve) => {
      // Create a canvas to process the image
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = document.createElement('img') as HTMLImageElement
      
      img.onload = () => {
        try {
          // Set canvas size to match image
          canvas.width = img.width
          canvas.height = img.height
          
          // Draw image on canvas
          ctx?.drawImage(img, 0, 0)
          
          // Get image data for processing
          const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height)
          
          if (imageData) {
            console.log('Processing image:', img.width, 'x', img.height, 'pixels')
            
            // Use jsQR to decode the QR code
            const code = jsQR(imageData.data, imageData.width, imageData.height)
            
            if (code) {
              console.log('QR code found:', code.data)
              // Convert canvas to data URL for potential download
              const qrImageData = canvas.toDataURL('image/png')
              resolve({
                success: true,
                assetId: code.data,
                qrImageData: qrImageData
              })
            } else {
              console.log('No QR code detected in image')
              resolve({
                success: false,
                error: 'No QR code detected in the uploaded image. Please ensure the image contains a clear, readable QR code.'
              })
            }
          } else {
            resolve({
              success: false,
              error: 'Failed to process image data'
            })
          }
        } catch (error) {
          console.error('Error processing image:', error)
          resolve({
            success: false,
            error: 'Error processing image data'
          })
        }
      }
      
      img.onerror = () => {
        resolve({
          success: false,
          error: 'Failed to load image'
        })
      }
      
      // Load the image from the file
      img.src = URL.createObjectURL(imageFile)
    })
  }

  // Function to download QR code image
  const downloadQRCode = (imageData: string, filename: string = 'qr-code') => {
    try {
      const link = document.createElement('a')
      link.href = imageData
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading QR code:', error)
      alert('Failed to download QR code image')
    }
  }

  // Function to save QR code to device
  const saveQRCodeToDevice = async (imageData: string, filename: string = 'qr-code') => {
    try {
      // Convert data URL to blob
      const response = await fetch(imageData)
      const blob = await response.blob()
      
      // Create object URL
      const objectUrl = URL.createObjectURL(blob)
      
      // Create download link
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up
      URL.revokeObjectURL(objectUrl)
    } catch (error) {
      console.error('Error saving QR code:', error)
      alert('Failed to save QR code image')
    }
  }

  // Complete reset function to clear all cached data
  const resetScannerState = () => {
    setScanResult(null)
    setUploadedImage(null)
    setUploadPreview(null)
    setIsScanning(false)
    setIsCameraReady(false)
    setScanningError(null)
    setScanAttempts(0)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const handleClose = () => {
    resetScannerState()
    onClose()
  }

  // Clear results when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      resetScannerState()
    } else {
      // Ensure clean state when modal opens
      resetScannerState()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm sm:max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <Scan className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">QR Code Scanner</h2>
              <p className="text-sm text-slate-600">Scan QR codes or upload from gallery</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-10 w-10 p-0 hover:bg-slate-100 rounded-xl"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <Tabs defaultValue="scanner" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="scanner" className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Live Scanner
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Gallery Upload
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scanner" className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Camera Scanner</h3>
                  <p className="text-sm text-slate-600">Point your camera at a QR code to scan</p>
                </div>
                
                {!isScanning ? (
                  <div className="flex justify-center">
                    <Button 
                      onClick={startScanner}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-xl font-semibold"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      Start Camera
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative bg-black rounded-xl overflow-hidden">
                      <video
                        ref={videoRef}
                        className="w-full h-64 object-cover"
                        autoPlay
                        playsInline
                        muted
                      />
                      {/* Hidden canvas used for decoding frames */}
                      <canvas ref={canvasRef} className="hidden" />
                      <div className="absolute inset-0 border-2 border-green-400 border-dashed rounded-xl m-4 pointer-events-none">
                        <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-green-400"></div>
                        <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-green-400"></div>
                        <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-green-400"></div>
                        <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-green-400"></div>
                      </div>
                      {/* Loading overlay - only show when camera is not ready */}
                      {!isCameraReady && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="text-center text-white">
                            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <p className="text-sm">Starting camera...</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Scanning Status and Error Messages */}
                    {scanningError && (
                      <div className="bg-red-50 rounded-lg p-3 border border-red-200 mb-4">
                        <div className="flex items-center gap-2 text-red-700">
                          <X className="w-4 h-4" />
                          <span className="text-sm font-medium">Scanner Error</span>
                        </div>
                        <p className="text-xs text-red-600 mt-1">{scanningError}</p>
                      </div>
                    )}

                    {/* Scanning Progress Feedback */}
                    {isScanning && !scanningError && scanAttempts > 30 && (
                      <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200 mb-4">
                        <div className="flex items-center gap-2 text-yellow-700">
                          <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-sm font-medium">Looking for QR Code...</span>
                        </div>
                        <p className="text-xs text-yellow-600 mt-1">
                          Make sure the QR code is clearly visible and well-lit
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button 
                        onClick={stopScanner}
                        variant="outline"
                        className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        Stop Camera
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Upload from Gallery</h3>
                  <p className="text-sm text-slate-600">Select an image containing a QR code</p>
                  <div className="mt-2 p-2 bg-blue-50 rounded-lg text-xs text-blue-700">
                    <p><strong>Note:</strong> The scanner will analyze the actual image content</p>
                    <p>to extract QR code data, not the filename.</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label 
                      htmlFor="image-upload"
                      className="cursor-pointer block"
                    >
                      <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-600 font-medium">Click to select image</p>
                      <p className="text-sm text-slate-500">or drag and drop</p>
                    </label>
                  </div>
                  
                  {uploadPreview && (
                    <div className="space-y-3">
                      <div className="bg-white rounded-xl p-3 border border-slate-200">
                        <Image 
                          src={uploadPreview} 
                          alt="Preview" 
                          width={400}
                          height={128}
                          className="w-full h-32 object-contain rounded-lg"
                        />
                      </div>
                      <Button 
                        onClick={processUploadedImage}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl font-semibold"
                      >
                        <Scan className="w-4 h-4 mr-2" />
                        Process Image
                      </Button>
                    </div>
                  )}

                  {/* Upload Status Indicators */}
                  {uploadedImage && (
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <div className="flex items-center gap-2 text-green-700">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">Image Ready for Processing</span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        File: {uploadedImage.name} ({(uploadedImage.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    </div>
                  )}

                  {/* Processing Status */}
                  {scanResult?.isProcessing && (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center gap-2 text-blue-700">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-medium">Processing Image...</span>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        Extracting QR code data from uploaded image
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Simplified Scan Result */}
          {scanResult && (
            <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm">
              {/* Simple Header Section */}
              <div className={`p-4 border-b border-gray-200 ${
              scanResult.isProcessing 
                  ? 'bg-blue-50'
                : scanResult.success 
                  ? 'bg-green-50' 
                  : scanResult.assetId 
                  ? 'bg-yellow-50'  // QR found but no match
                  : 'bg-red-50'     // No QR found
              }`}>
                {scanResult.isProcessing ? (
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-3 mb-2">
                      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <h3 className="text-lg font-semibold text-blue-800">Processing Image...</h3>
                      </div>
                    <p className="text-sm text-blue-600">Extracting QR code data from uploaded image</p>
                    </div>
                ) : scanResult.success ? (
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-3 mb-2">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <h3 className="text-lg font-semibold text-green-800">
                        {mode === 'checklists' ? 'Checklist Found!' : 'Asset Found!'}
                      </h3>
                    </div>
                    <p className="text-sm text-green-600">
                      Scanner successfully identified {mode === 'checklists' ? 'checklist' : 'asset'}
                    </p>
                  </div>
                ) : scanResult.assetId ? (
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-3 mb-2">
                      <div className="w-6 h-6 text-yellow-600">ℹ️</div>
                      <h3 className="text-lg font-semibold text-yellow-800">QR Code Found</h3>
                    </div>
                    <p className="text-sm text-yellow-600">QR code scanned successfully but no matching {mode === 'checklists' ? 'checklist' : 'asset'} found</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-3 mb-2">
                        <X className="w-6 h-6 text-red-600" />
                      <h3 className="text-lg font-semibold text-red-800">No QR Code Detected</h3>
                      </div>
                    <p className="text-sm text-red-600">Scanner could not find QR code in the image</p>
                    </div>
                )}
              </div>

              {/* Simple Body Section */}
              <div className="p-4">
                {scanResult.isProcessing ? (
                  /* Simple Processing State */
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <h4 className="text-base font-medium text-gray-800">Processing Image</h4>
                    <p className="text-sm text-gray-600">
                      Analyzing uploaded image for QR code data...
                    </p>
                  </div>
                ) : (
                  <>
                     {/* Simple QR Code Content Badge */}
                     {scanResult.success && (
                       <div className="flex justify-center mb-4">
                         <div className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md border border-gray-300">
                           <span className="font-medium">
                             {mode === 'checklists' 
                               ? scanResult.asset?.title || scanResult.assetId
                               : scanResult.asset?.tagId || scanResult.assetId
                             }
                           </span>
                         </div>
                       </div>
                     )}

                    {scanResult.success && scanResult.asset ? (
                      /* Simple Asset/Checklist Details */
                      <div className="space-y-4">
                        {/* Enhanced QR Code Image Display for Success Case */}
                        {scanResult.qrImageData && (
                          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                            <div className="text-center mb-4">
                              <h5 className="text-sm font-medium text-gray-700 mb-2">Scanned QR Code Image</h5>
                              <div className="relative inline-block group">
                                <Image 
                                  src={scanResult.qrImageData}
                                  alt="Scanned QR Code" 
                                  width={96}
                                  height={96}
                                  className="w-24 h-24 border-2 border-gray-200 rounded-lg shadow-sm"
                                />
                              </div>
                            </div>
                            
                            {/* Download Options */}
                            <div className="flex flex-col sm:flex-row gap-2 justify-center">
                              <Button
                                onClick={() => downloadQRCode(scanResult.qrImageData!, 'scanned-qr')}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2 border-green-300 text-green-700 hover:bg-green-50"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Download QR
                              </Button>
                              <Button
                                onClick={() => saveQRCodeToDevice(scanResult.qrImageData!, 'scanned-qr')}
                                size="sm"
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                </svg>
                                Save to Device
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Scanned Data Display for Success Case */}
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                          <div className="text-center mb-3">
                            <h5 className="text-sm font-semibold text-green-800 mb-2">📱 Scanned QR Code Data</h5>
                            <div className="bg-white rounded-lg p-3 border border-green-300">
                              <span className="font-mono text-sm text-green-900 break-all">
                                {scanResult.assetId}
                              </span>
                            </div>
                          </div>
                        </div>

                        {mode === 'checklists' ? (
                          /* Simple Checklist Details */
                          <div className="space-y-4">
                            {/* Checklist Properties Grid */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-gray-50 rounded-md p-3">
                                <span className="text-xs text-gray-500 uppercase">Type</span>
                                <p className="text-sm font-medium text-gray-900">{scanResult.asset.type}</p>
                              </div>
                              <div className="bg-gray-50 rounded-md p-3">
                                <span className="text-xs text-gray-500 uppercase">Status</span>
                                <p className="text-sm font-medium text-gray-900 capitalize">{scanResult.asset.status}</p>
                              </div>
                              <div className="bg-gray-50 rounded-md p-3">
                                <span className="text-xs text-gray-500 uppercase">Priority</span>
                                <p className="text-sm font-medium text-gray-900 capitalize">{scanResult.asset.priority}</p>
                              </div>
                              <div className="bg-gray-50 rounded-md p-3">
                                <span className="text-xs text-gray-500 uppercase">Title</span>
                                <p className="text-sm font-medium text-gray-900">{scanResult.asset.title}</p>
                              </div>
                            </div>

                            {/* Simple Location Details */}
                            {scanResult.asset.location && (
                              <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                                <div className="flex items-center space-x-2 mb-2">
                                  <MapPin className="w-4 h-4 text-gray-600" />
                                  <span className="text-sm font-medium text-gray-700 uppercase">Location</span>
                                </div>
                                <div className="text-sm text-gray-900">
                                  <div>{scanResult.asset.location.building}</div>
                                  <div>Floor {scanResult.asset.location.floor} • Zone {scanResult.asset.location.zone}</div>
                                </div>
                              </div>
                            )}

                            {/* Simple Inspection Items Count */}
                            {scanResult.asset.items && (
                              <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                                <div className="flex items-center space-x-2 mb-2">
                                  <CheckSquare className="w-4 h-4 text-gray-600" />
                                  <span className="text-sm font-medium text-gray-700 uppercase">Inspection Items</span>
                                </div>
                                <div className="text-sm text-gray-900">
                                  <span className="font-medium">{scanResult.asset.items.length}</span> items to inspect
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Simple Asset Details */
                          <div className="space-y-4">
                            {/* Asset Properties Grid */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-gray-50 rounded-md p-3">
                                <span className="text-xs text-gray-500 uppercase">Type</span>
                                <p className="text-sm font-medium text-gray-900">{scanResult.asset.assetType}</p>
                              </div>
                              <div className="bg-gray-50 rounded-md p-3">
                                <span className="text-xs text-gray-500 uppercase">Brand</span>
                                <p className="text-sm font-medium text-gray-900">{scanResult.asset.brand}</p>
                              </div>
                              <div className="bg-gray-50 rounded-md p-3">
                                <span className="text-xs text-gray-500 uppercase">Model</span>
                                <p className="text-sm font-medium text-gray-900">{scanResult.asset.model}</p>
                              </div>
                              <div className="bg-gray-50 rounded-md p-3">
                                <span className="text-xs text-gray-500 uppercase">Status</span>
                                <p className="text-sm font-medium text-gray-900 capitalize">{scanResult.asset.status}</p>
                              </div>
                            </div>

                            {/* Simple Location Details */}
                            {scanResult.asset.location && (
                              <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                                <div className="flex items-center space-x-2 mb-2">
                                  <MapPin className="w-4 h-4 text-gray-600" />
                                  <span className="text-sm font-medium text-gray-700 uppercase">Location</span>
                                </div>
                                <div className="text-sm text-gray-900">
                                  <div>{scanResult.asset.location.building}</div>
                                  <div>{scanResult.asset.location.floor} • {scanResult.asset.location.room}</div>
                                </div>
                              </div>
                            )}

                            {/* Simple Assigned To */}
                            {scanResult.asset.assignedTo && (
                              <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                                <div className="flex items-center space-x-2 mb-2">
                                  <User className="w-4 h-4 text-gray-600" />
                                  <span className="text-sm font-medium text-gray-700 uppercase">Assigned To</span>
                                </div>
                                <div className="text-sm text-gray-900">
                                  {typeof scanResult.asset.assignedTo === 'string' 
                                    ? scanResult.asset.assignedTo 
                                    : scanResult.asset.assignedTo.name}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Simple Action Buttons */}
                        <div className="flex flex-col space-y-2 pt-4">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => onScanResult(scanResult.assetId)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                            <Button 
                              variant="outline" 
                              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                              onClick={() => copyScannedCode(scanResult.assetId)}
                            >
                              {copied ? 'Copied!' : 'Copy Code'}
                            </Button>
                            <Button 
                              variant="outline" 
                              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                              onClick={scanAnother}
                            >
                              Scan Another
                            </Button>
                          </div>
                          <Button 
                            variant="outline" 
                            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                            onClick={() => {
                              setScanResult(null)
                              onScanResult('')
                            }}
                          >
                            Close
                          </Button>
                        </div>
                      </div>
                                         ) : (
                      /* Simple Error Message or No Data Message */
                      <div className="text-center space-y-4">
                        {scanResult.assetId ? (
                          /* QR code found but no matching asset/checklist - Enhanced JSON Display */
                          <div className="space-y-4">
                            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                              <div className="w-6 h-6 text-yellow-600">ℹ️</div>
                            </div>
                            <h4 className="text-base font-medium text-gray-800">QR Code Found</h4>
                            
                            {/* Enhanced QR Code Image Display */}
                            {scanResult.qrImageData && (
                              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                                <div className="text-center mb-4">
                                  <h5 className="text-sm font-medium text-gray-700 mb-2">Scanned QR Code Image</h5>
                                  <div className="relative inline-block group">
                                    <Image 
                                      src={scanResult.qrImageData}
                                      alt="Scanned QR Code" 
                                      width={96}
                                      height={96}
                                      className="w-24 h-24 border-2 border-gray-200 rounded-lg shadow-sm"
                                    />
                                  </div>
                                </div>
                                
                                {/* Download Options */}
                                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                  <Button
                                    onClick={() => downloadQRCode(scanResult.qrImageData!, 'scanned-qr')}
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Download QR
                                  </Button>
                                  <Button
                                    onClick={() => saveQRCodeToDevice(scanResult.qrImageData!, 'scanned-qr')}
                                    size="sm"
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                    </svg>
                                    Save to Device
                                  </Button>
                                </div>
                              </div>
                            )}
                            
                            {/* Enhanced Scanned Data Display */}
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                              <div className="text-center mb-3">
                                <h5 className="text-sm font-semibold text-blue-800 mb-2">📱 Scanned QR Code Data</h5>
                                <div className="bg-white rounded-lg p-3 border border-blue-300">
                                  <span className="font-mono text-sm text-blue-900 break-all">
                                    {scanResult.assetId}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-600">
                              {mode === 'checklists' 
                                ? 'This QR code contains checklist data but is not registered in the system.'
                                : 'This QR code contains asset data but is not registered in the system.'
                              }
                            </p>
                          </div>
                        ) : (
                          /* No QR code found in image */
                          <div className="space-y-3">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                              <X className="w-6 h-6 text-red-600" />
                            </div>
                            <h4 className="text-base font-medium text-gray-800">No QR Code Detected</h4>
                            <p className="text-sm text-gray-600">
                              {scanResult.message}
                            </p>
                            <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                              <p className="text-xs text-gray-700 mb-2 font-medium">
                                Tips for better results:
                              </p>
                              <ul className="text-xs text-gray-600 space-y-1 text-left">
                                <li>• Ensure the image contains a clear, readable QR code</li>
                                <li>• Check that the QR code is not blurry or damaged</li>
                                <li>• Make sure the QR code is fully visible in the image</li>
                                <li>• Try uploading a different image with better quality</li>
                                <li>• For downloaded assets, ensure the QR code image is clear and complete</li>
                              </ul>
                            </div>
                          </div>
                        )}
                        
                        <Button 
                          variant="outline" 
                          className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                          onClick={() => {
                            setScanResult(null)
                            onScanResult('')
                          }}
                        >
                          Try Another Image
                        </Button>
                       </div>
                      )}
                       </>
                   )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}