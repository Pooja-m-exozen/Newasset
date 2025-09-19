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
  User,
  Calendar
} from 'lucide-react'
import jsQR from 'jsqr'

interface ScannerModalProps {
  isOpen: boolean
  onCloseAction: () => void
  // After a successful scan, we pass back the full entity (e.g., checklist)
  // so the parent can store it locally without another GET
  onScanResultAction: (result: unknown) => void
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
    description?: string
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
    frequency?: string
    items?: Array<{
      _id: string
      serialNumber: number
      inspectionItem: string
      details: string
      status?: 'pending' | 'completed' | 'failed' | 'not_applicable'
      remarks?: string
    }>
  }>
  mode?: 'assets' | 'checklists'
  // When true, do not create sample checklists and only match within provided lists
  strictChecklistsOnly?: boolean
}

export function ScannerModal({ 
  isOpen, 
  onCloseAction, 
  onScanResultAction, 
  assets = [],
  checklists = [],
  mode = 'assets',
  strictChecklistsOnly = false
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
  
  // Checklist execution state
  const [checklistItems, setChecklistItems] = useState<Record<string, { status: 'pending' | 'completed' | 'failed' | 'not_applicable', remarks: string }>>({})
  // Period/grid ticking state
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [ticks, setTicks] = useState<Record<string, Record<number, boolean>>>({})
  const [month, setMonth] = useState<number>(new Date().getMonth())
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const [cellSize, setCellSize] = useState<number>(28)
  
  // Initialize checklist items when scan result changes
  useEffect(() => {
    if (scanResult?.success && mode === 'checklists' && scanResult.asset?.items) {
      console.log('Initializing checklist items:', scanResult.asset.items)
      const initialItems: Record<string, { status: 'pending' | 'completed' | 'failed' | 'not_applicable', remarks: string }> = {}
      const initialTicks: Record<string, Record<number, boolean>> = {}
      scanResult.asset.items.forEach((item, index) => {
        const itemId = item._id || `item_${index}`
        initialItems[itemId] = { status: 'pending', remarks: '' }
        initialTicks[itemId] = {}
      })
      setChecklistItems(initialItems)
      setTicks(initialTicks)
    }
  }, [scanResult, mode])

  // Helpers to generate day labels based on period
  const getDayLabels = (): string[] => {
    if (period === 'daily') return ['1']
    if (period === 'weekly') return ['1','2','3','4','5','6','7']
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return Array.from({ length: daysInMonth }, (_, i) => String(i + 1))
  }

  const dayLabels = getDayLabels()

  const toggleTick = (itemId: string, dayIndex: number) => {
    setTicks(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [dayIndex]: !prev[itemId]?.[dayIndex] }
    }))
  }

  // Responsive cell size for mobile vs desktop
  useEffect(() => {
    const updateSize = () => {
      const width = typeof window !== 'undefined' ? window.innerWidth : 1024
      setCellSize(width < 640 ? 22 : 28)
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])
  
  // Debug scan result changes
  useEffect(() => {
    if (scanResult) {
      console.log('Scan result changed:', {
        success: scanResult.success,
        mode,
        hasAsset: !!scanResult.asset,
        hasItems: !!scanResult.asset?.items,
        itemsCount: scanResult.asset?.items?.length || 0
      })
    }
  }, [scanResult, mode])
  
  // Handle checklist item status change
  // removed unused handleItemStatusChange
  
  // Handle remarks change
  // removed unused handleRemarksChange
  
  // Get completion statistics
  const getCompletionStats = () => {
    const items = Object.values(checklistItems)
    const total = items.length
    const completed = items.filter(item => item.status === 'completed').length
    const failed = items.filter(item => item.status === 'failed').length
    const notApplicable = items.filter(item => item.status === 'not_applicable').length
    const pending = total - completed - failed - notApplicable
    return { total, completed, failed, notApplicable, pending }
  }
  
  // Handle saving checklist progress
  const handleSaveProgress = () => {
    const stats = getCompletionStats()
    const progressData = {
      checklistId: scanResult?.assetId,
      checklistTitle: scanResult?.asset?.title,
      completedAt: new Date().toISOString(),
      stats,
      items: checklistItems,
      location: scanResult?.asset?.location
    }
    
    console.log('Saving checklist progress:', progressData)
    
    // Here you would typically save to your backend
    // For now, we'll just show a success message
    alert(`Checklist progress saved!\nCompleted: ${stats.completed}/${stats.total} items`)
    
    // Call the scan result handler to close the modal or navigate
    onScanResultAction(scanResult?.assetId || '')
  }
  // Use native BarcodeDetector if available for faster/more reliable scanning
  const barcodeDetectorRef = useRef<null | { detect: (source: CanvasImageSource) => Promise<Array<{ rawValue: string }>> }>(null)
  const lastProcessTimeRef = useRef(0)
  const PROCESS_INTERVAL_MS = 8 // Increased to ~120fps for maximum responsiveness
  const MAX_SCAN_ATTEMPTS = 200 // Reduced attempts since we scan more frequently
  const FAST_SCAN_INTERVAL_MS = 4 // Ultra-fast scanning for first 50 attempts

  // Debug logging for assets
  useEffect(() => {
    console.log('ScannerModal received assets:', assets.length)
    if (assets.length > 0) {
      console.log('Sample asset:', assets[0])
    }
  }, [assets])

  // Test QR detection function
  const testQRDetection = () => {
    console.log('Testing QR detection...')
    console.log('jsQR available:', typeof jsQR)
    console.log('BarcodeDetector available:', typeof window !== 'undefined' && 'BarcodeDetector' in window)
    
    // Test jsQR with a simple canvas
    try {
      const testCanvas = document.createElement('canvas')
      testCanvas.width = 100
      testCanvas.height = 100
      const testCtx = testCanvas.getContext('2d')
      if (testCtx) {
        testCtx.fillStyle = 'white'
        testCtx.fillRect(0, 0, 100, 100)
        const testImageData = testCtx.getImageData(0, 0, 100, 100)
        const testResult = jsQR(testImageData.data, testImageData.width, testImageData.height)
        console.log('jsQR test result:', testResult)
      }
    } catch (error) {
      console.error('jsQR test error:', error)
    }
  }

  useEffect(() => {
    testQRDetection()
  }, [])

  // Scanner functions
  const startScanner = async () => {
    try {
      setIsScanning(true)
      setIsCameraReady(false)
      setScanningError(null)
      setScanAttempts(0)
      
      console.log('Starting camera initialization...')
      
      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser')
      }
      
      // Try camera access with timeout and enhanced settings for better QR scanning
      let stream: MediaStream
      try {
        const cameraPromise = navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
            frameRate: { ideal: 30, min: 15 }
          } 
        })
        
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Camera access timeout')), 10000)
        )
        
        stream = await Promise.race([cameraPromise, timeoutPromise])
      } catch (error) {
        console.warn('Primary camera request failed, trying fallback...', error)
        try {
          // Second fallback with medium quality
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: 'environment',
              width: { ideal: 1280, min: 640 },
              height: { ideal: 720, min: 480 }
            } 
          })
        } catch (secondError) {
          console.warn('Second camera request failed, trying basic fallback...', secondError)
          // Final fallback to basic camera request
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: true 
          })
        }
      }
      
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        try {
          await videoRef.current.play()
          console.log('Video started playing successfully')
          
          // Start scanning immediately for faster response
          setTimeout(() => {
            if (videoRef.current && videoRef.current.readyState >= 2) {
              setIsCameraReady(true)
              console.log('Camera marked as ready')
            } else {
              console.warn('Video not ready after timeout, but continuing...')
              setIsCameraReady(true)
            }
          }, 500) // Reduced from 1000ms to 500ms for faster startup
          
          // Try to enable continuous focus/zoom if supported for better clarity
          try {
            const [track] = stream.getVideoTracks()
            const capabilitiesUnknown = (track.getCapabilities && track.getCapabilities()) as unknown
            if (capabilitiesUnknown && typeof capabilitiesUnknown === 'object') {
              const capabilities = capabilitiesUnknown as Record<string, unknown>
              const advanced: Array<Record<string, unknown>> = []
              
              // Enhanced focus settings for better QR scanning
              if (Object.prototype.hasOwnProperty.call(capabilities, 'focusMode')) {
                const adv: Record<string, unknown> = {}
                adv['focusMode'] = 'continuous'
                advanced.push(adv)
              }
              
              // Enhanced zoom settings for better QR scanning
              if (Object.prototype.hasOwnProperty.call(capabilities, 'zoom')) {
                const caps = capabilitiesUnknown as { zoom?: { max?: number; min?: number } }
                const desired = Math.min((caps.zoom?.max ?? 3), 3) // Increased zoom for better scanning
                const advZoom: Record<string, unknown> = {}
                advZoom['zoom'] = desired
                advanced.push(advZoom)
              }
              
              // Enhanced exposure settings for better contrast
              if (Object.prototype.hasOwnProperty.call(capabilities, 'exposureMode')) {
                const adv: Record<string, unknown> = {}
                adv['exposureMode'] = 'continuous'
                advanced.push(adv)
              }
              
              // Enhanced white balance for better color accuracy
              if (Object.prototype.hasOwnProperty.call(capabilities, 'whiteBalanceMode')) {
                const adv: Record<string, unknown> = {}
                adv['whiteBalanceMode'] = 'continuous'
                advanced.push(adv)
              }
              
              if (advanced.length > 0) {
                await track.applyConstraints({ advanced } as unknown as MediaTrackConstraints)
                console.log('Applied camera enhancements for better QR scanning')
              }
            }
          } catch (e) {
            console.warn('Camera capabilities error:', e)
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
          throw new Error('Unable to start camera stream. Please check camera permissions.')
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
      if (video.readyState >= 2 /* HAVE_CURRENT_DATA */ && video.videoWidth > 0 && video.videoHeight > 0) {
        if (processingFrameRef.current) {
          return
        }
        const now = performance.now()
        // Use faster scanning for first 50 attempts, then normal speed
        const currentInterval = scanAttempts < 50 ? FAST_SCAN_INTERVAL_MS : PROCESS_INTERVAL_MS
        if (now - lastProcessTimeRef.current < currentInterval) {
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
        
        // Debug logging every 100 attempts
        if (scanAttempts % 100 === 0) {
          console.log(`Scanning attempt ${scanAttempts}, video ready: ${video.readyState}, dimensions: ${video.videoWidth}x${video.videoHeight}`)
        }
        
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
        
        const width = video.videoWidth || video.clientWidth
        const height = video.videoHeight || video.clientHeight
        
        if (width && height && width > 0 && height > 0) {
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
            
            // Optimized jsQR scanning with priority-based detection for speed
            const sctx = scaledCanvas.getContext('2d')
            let code = null as ReturnType<typeof jsQR> | null
            
            if (sctx) {
              // Prioritize most common scales first for faster detection
              const scales = scanAttempts < 30 ? [
                { scale: 1.0, name: 'original' },      // Full size - most common
                { scale: 0.8, name: 'large' },         // Large QR codes
                { scale: 0.6, name: 'medium' }         // Medium QR codes
              ] : [
                { scale: 1.0, name: 'original' },      // Full size
                { scale: 0.8, name: 'large' },         // Large QR codes
                { scale: 0.6, name: 'medium' },        // Medium QR codes
                { scale: 0.4, name: 'small' },         // Small QR codes
                { scale: 0.2, name: 'tiny' },          // Very small QR codes
                { scale: 1.2, name: 'upscaled' }       // Upscaled for very small codes
              ]
              
              // Try each scale
              for (const { scale, name } of scales) {
                const targetWidth = Math.floor(width * scale)
                const targetHeight = Math.floor(height * scale)
                
                // Ensure minimum size for detection
                if (targetWidth < 100 || targetHeight < 100) continue
                
                if (scaledCanvas.width !== targetWidth) scaledCanvas.width = targetWidth
                if (scaledCanvas.height !== targetHeight) scaledCanvas.height = targetHeight
                
                // Draw scaled image
                sctx.drawImage(canvas, 0, 0, width, height, 0, 0, targetWidth, targetHeight)
                const scaledImage = sctx.getImageData(0, 0, targetWidth, targetHeight)
                code = jsQR(scaledImage.data, scaledImage.width, scaledImage.height)
                
                if (code && code.data) {
                  console.log(`QR detected via jsQR at ${name} scale:`, code.data)
                  finalizeLiveScan(code.data)
                  return
                }
                
                // If not found at this scale, try different regions for this scale
                // Use fewer regions for faster initial scanning
                const regions = scanAttempts < 50 ? [
                  { x: 0, y: 0, w: 1, h: 1, name: 'full' },
                  { x: 0.1, y: 0.1, w: 0.8, h: 0.8, name: 'center' }
                ] : [
                  { x: 0, y: 0, w: 1, h: 1, name: 'full' },
                  { x: 0.1, y: 0.1, w: 0.8, h: 0.8, name: 'center' },
                  { x: 0.2, y: 0.2, w: 0.6, h: 0.6, name: 'inner' },
                  { x: 0, y: 0, w: 0.5, h: 0.5, name: 'top-left' },
                  { x: 0.5, y: 0, w: 0.5, h: 0.5, name: 'top-right' },
                  { x: 0, y: 0.5, w: 0.5, h: 0.5, name: 'bottom-left' },
                  { x: 0.5, y: 0.5, w: 0.5, h: 0.5, name: 'bottom-right' }
                ]
                
                for (const region of regions) {
                  const cropX = Math.floor(targetWidth * region.x)
                  const cropY = Math.floor(targetHeight * region.y)
                  const cropW = Math.floor(targetWidth * region.w)
                  const cropH = Math.floor(targetHeight * region.h)
                  
                  // Ensure crop dimensions are valid
                  if (cropW < 50 || cropH < 50) continue
                  
                  const cropped = sctx.getImageData(cropX, cropY, cropW, cropH)
                  code = jsQR(cropped.data, cropped.width, cropped.height)
                  
                  if (code && code.data) {
                    console.log(`QR detected via jsQR at ${name} scale, ${region.name} region:`, code.data)
                    finalizeLiveScan(code.data)
                    return
                  }
                }
              }
              
              // Final attempt: try with enhanced contrast and brightness adjustments
              // Skip this for first 30 attempts to prioritize speed
              if (!code && scanAttempts >= 30) {
                const targetWidth = Math.min(800, width)
                const scale = targetWidth / width
                const targetHeight = Math.floor(height * scale)
                
                if (scaledCanvas.width !== targetWidth) scaledCanvas.width = targetWidth
                if (scaledCanvas.height !== targetHeight) scaledCanvas.height = targetHeight
                
                sctx.drawImage(canvas, 0, 0, width, height, 0, 0, targetWidth, targetHeight)
                const imageData = sctx.getImageData(0, 0, targetWidth, targetHeight)
                
                // Apply contrast enhancement
                const enhancedData = new Uint8ClampedArray(imageData.data)
                for (let i = 0; i < enhancedData.length; i += 4) {
                  // Convert to grayscale and enhance contrast
                  const gray = Math.round(0.299 * enhancedData[i] + 0.587 * enhancedData[i + 1] + 0.114 * enhancedData[i + 2])
                  const enhanced = gray > 128 ? 255 : 0
                  enhancedData[i] = enhanced     // R
                  enhancedData[i + 1] = enhanced // G
                  enhancedData[i + 2] = enhanced // B
                  // Alpha stays the same
                }
                
                const enhancedImageData = new ImageData(enhancedData, targetWidth, targetHeight)
                code = jsQR(enhancedImageData.data, enhancedImageData.width, enhancedImageData.height)
                
                if (code && code.data) {
                  console.log('QR detected via jsQR with enhanced contrast:', code.data)
                  finalizeLiveScan(code.data)
                  return
                }
              }
            }
          }
        }
      } else {
        // Fallback: try to scan even if video dimensions are not perfect
        if (video.readyState >= 1 && scanAttempts % 50 === 0) {
          console.log('Video not ready for processing, readyState:', video.readyState, 'dimensions:', video.videoWidth, 'x', video.videoHeight)
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

  // Normalized matching function for QR codes
  const normalize = (val?: string | null) =>
    (val || '').toString().trim().toLowerCase()

  // Extract useful tokens from scanned string (ids from URLs/JSON)
  const extractTokensFromScannedContent = (raw: string): string[] => {
    const tokens: string[] = []
    const input = (raw || '').trim()
    if (!input) return tokens
    tokens.push(input)
    // Try JSON payload
    try {
      const obj = JSON.parse(input)
      if (obj && typeof obj === 'object') {
        const guessKeys = ['_id','id','checklistId','cid','qr','data']
        for (const k of guessKeys) {
          const v = (obj as Record<string, unknown>)[k]
          if (typeof v === 'string') tokens.push(v)
          if (v && typeof v === 'object') {
            const inner = (v as Record<string, unknown>)
            for (const ik of guessKeys) {
              const iv = inner[ik]
              if (typeof iv === 'string') tokens.push(iv)
            }
          }
        }
      }
    } catch {}
    // Try URL parsing
    try {
      const url = new URL(input)
      const lastSeg = url.pathname.split('/').filter(Boolean).pop()
      if (lastSeg) tokens.push(lastSeg)
      const searchKeys = ['id','_id','checklistId','cid','ref']
      for (const k of searchKeys) {
        const v = url.searchParams.get(k)
        if (v) tokens.push(v)
      }
    } catch {}
    // Also include alnum-only token
    const alnum = input.replace(/[^a-z0-9]/gi,'')
    if (alnum && alnum.length >= 6) tokens.push(alnum)
    // Deduplicate
    return Array.from(new Set(tokens.map(t => t.toString())))
  }

  const findMatchingAsset = (scannedQRContent: string) => {
    const scanned = normalize(scannedQRContent)
    
    return assets.find(asset => {
      const candidates = [
        asset._id,
        asset.tagId,
        asset.digitalAssets?.qrCode?.data?.t,
        asset.digitalAssets?.qrCode?.data?.a,
        asset.digitalAssets?.qrCode?.data?.s,
        asset.digitalAssets?.qrCode?.data?.b,
        asset.digitalAssets?.qrCode?.data?.m,
        asset.digitalAssets?.qrCode?.data?.st,
        asset.digitalAssets?.qrCode?.data?.p,
        asset.digitalAssets?.qrCode?.data?.u,
        asset.digitalAssets?.qrCode?.data?.pr,
        asset.digitalAssets?.qrCode?.data?.lm,
        asset.digitalAssets?.qrCode?.data?.nm,
        asset.digitalAssets?.qrCode?.data?.url,
        asset.digitalAssets?.nfcData?.data?.id,
        asset.digitalAssets?.nfcData?.data?.type,
        asset.digitalAssets?.nfcData?.data?.assetType,
        asset.digitalAssets?.nfcData?.data?.brand,
        asset.digitalAssets?.nfcData?.data?.model,
        asset.digitalAssets?.nfcData?.data?.status,
        asset.digitalAssets?.nfcData?.data?.priority,
      ].map(normalize)

      return candidates.some(c => c && (c === scanned || scanned.includes(c) || c.includes(scanned)))
    })
  }

  const findMatchingChecklist = (scannedQRContent: string) => {
    const scanned = normalize(scannedQRContent)
    console.log('Searching for checklist with content:', scanned)
    console.log('Available checklists:', checklists.length)
    const tokenSet = extractTokensFromScannedContent(scannedQRContent)
    const tokens = tokenSet.map(normalize)
    
    const found = checklists.find(checklist => {
      const urlLast = (() => {
        const u = checklist.qrCode?.url
        if (!u) return undefined
        try {
          const parsed = new URL(u.startsWith('http') ? u : `https://domain/${u.replace(/^\//,'')}`)
          return parsed.pathname.split('/').filter(Boolean).pop()
        } catch {
          return undefined
        }
      })()
      // Only match on strong identifiers from QR data or IDs
      const candidates = [
        checklist._id,
        checklist.qrCode?.data,
        checklist.qrCode?.url,
        urlLast,
      ].map(normalize)

      const match = candidates.some(c => c && (c === scanned || scanned.includes(c) || c.includes(scanned) || tokens.some(t => c === t || c.includes(t) || t.includes(c))))
      if (match) {
        console.log('Found matching checklist:', checklist)
      }
      return match
    })
    
    console.log('Checklist search result:', found ? 'Found' : 'Not found')
    return found
  }

  const finalizeLiveScan = (scannedQRContent: string) => {
    try {
      // Show immediate success feedback
      console.log('QR Code detected successfully!', scannedQRContent)
      
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
        const foundChecklist = findMatchingChecklist(scannedQRContent)

        if (foundChecklist) {
          console.log('Found checklist:', foundChecklist)
          console.log('Checklist items:', foundChecklist.items)
          setScanResult({
            success: true,
            assetId: scannedQRContent,
            asset: foundChecklist,
            message: `✅ Checklist found: ${foundChecklist.title}`,
            qrImageData: qrImageData
          })
          // Return the full checklist to parent for local storage
          onScanResultAction(foundChecklist)
        } else if (!strictChecklistsOnly) {
          // QR code found but checklist not in system - create sample checklist
          console.log('QR code found but no matching checklist - creating sample')
          const sampleChecklist = {
            _id: `SAMPLE_${Date.now()}`,
            title: `Scanned Checklist: ${scannedQRContent}`,
            description: `This checklist was scanned from QR code: ${scannedQRContent}`,
            qrCode: {
              data: scannedQRContent,
              url: ''
            },
            location: {
              building: 'Scanned Location',
              floor: 'N/A',
              zone: 'N/A'
            },
            type: 'Scanned',
            status: 'active',
            priority: 'medium',
            frequency: 'daily',
            items: [
              {
                _id: 'sample_1',
                serialNumber: 1,
                inspectionItem: 'Check Diesel Level',
                details: 'Ensure diesel level is at least 1/2 of tank capacity',
                status: 'pending' as const,
                remarks: ''
              },
              {
                _id: 'sample_2',
                serialNumber: 2,
                inspectionItem: 'Check Battery Voltage',
                details: 'Verify battery voltage is between 24V-28V',
                status: 'pending' as const,
                remarks: ''
              },
              {
                _id: 'sample_3',
                serialNumber: 3,
                inspectionItem: 'Check Engine Oil Level',
                details: 'Ensure oil level is between L & H marks',
                status: 'pending' as const,
                remarks: ''
              },
              {
                _id: 'sample_4',
                serialNumber: 4,
                inspectionItem: 'Check Water Temperature',
                details: 'Verify temperature is below 42°C',
                status: 'pending' as const,
                remarks: ''
              },
              {
                _id: 'sample_5',
                serialNumber: 5,
                inspectionItem: 'Inspect for Oil Leakages',
                details: 'Check all hoses and pipes for oil leaks',
                status: 'pending' as const,
                remarks: ''
              }
            ]
          }
          
          setScanResult({
            success: true,
            assetId: scannedQRContent,
            asset: sampleChecklist,
            message: `✅ QR Code scanned: "${scannedQRContent}" - Sample checklist created`,
            qrImageData: qrImageData
          })
        } else {
          setScanResult({
            success: false,
            assetId: scannedQRContent,
            message: '❌ Wrong checklist - not matching any provided checklist',
            qrImageData: qrImageData
          })
          // Inform parent about mismatch so it can update UI
          onScanResultAction({ __type: 'error', reason: 'not_matching', raw: scannedQRContent })
        }
      } else {
        const foundAsset = findMatchingAsset(scannedQRContent)

        if (foundAsset) {
          setScanResult({
            success: true,
            assetId: scannedQRContent,
            asset: foundAsset,
            message: `✅ Asset found: ${foundAsset.tagId}`,
            qrImageData: qrImageData
          })
          onScanResultAction(scannedQRContent)
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
          const foundChecklist = findMatchingChecklist(scannedQRContent)
          
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
            onScanResultAction(foundChecklist)
          } else if (!strictChecklistsOnly) {
            // QR code found but checklist not in system - create sample checklist
            console.log('QR code found but no matching checklist - creating sample')
            const sampleChecklist = {
              _id: `SAMPLE_${Date.now()}`,
              title: `Scanned Checklist: ${scannedQRContent}`,
              description: `This checklist was scanned from QR code: ${scannedQRContent}`,
              qrCode: {
                data: scannedQRContent,
                url: ''
              },
              location: {
                building: 'Scanned Location',
                floor: 'N/A',
                zone: 'N/A'
              },
              type: 'Scanned',
              status: 'active',
              priority: 'medium',
              frequency: 'daily',
              items: [
                {
                  _id: 'sample_1',
                  serialNumber: 1,
                  inspectionItem: 'Check Diesel Level',
                  details: 'Ensure diesel level is at least 1/2 of tank capacity',
                  status: 'pending' as const,
                  remarks: ''
                },
                {
                  _id: 'sample_2',
                  serialNumber: 2,
                  inspectionItem: 'Check Battery Voltage',
                  details: 'Verify battery voltage is between 24V-28V',
                  status: 'pending' as const,
                  remarks: ''
                },
                {
                  _id: 'sample_3',
                  serialNumber: 3,
                  inspectionItem: 'Check Engine Oil Level',
                  details: 'Ensure oil level is between L & H marks',
                  status: 'pending' as const,
                  remarks: ''
                },
                {
                  _id: 'sample_4',
                  serialNumber: 4,
                  inspectionItem: 'Check Water Temperature',
                  details: 'Verify temperature is below 42°C',
                  status: 'pending' as const,
                  remarks: ''
                },
                {
                  _id: 'sample_5',
                  serialNumber: 5,
                  inspectionItem: 'Inspect for Oil Leakages',
                  details: 'Check all hoses and pipes for oil leaks',
                  status: 'pending' as const,
                  remarks: ''
                }
              ]
            }
            
            setScanResult({
              success: true,
              assetId: scannedQRContent,
              asset: sampleChecklist,
              message: `✅ QR Code scanned: "${scannedQRContent}" - Sample checklist created`,
              qrImageData: qrImageData
            })
            onScanResultAction(sampleChecklist)
          } else {
            setScanResult({
              success: false,
              assetId: scannedQRContent,
              message: '❌ Wrong checklist - not matching any provided checklist',
              qrImageData: qrImageData
            })
            // Notify parent so page can clear/reflect mismatch
            onScanResultAction({ __type: 'error', reason: 'not_matching', raw: scannedQRContent })
          }
        } else {
          // Handle asset scanning
          console.log('Searching for asset with content:', scannedQRContent)
          console.log('Available assets:', assets.length)
          
          const foundAsset = findMatchingAsset(scannedQRContent)
          
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
            onScanResultAction(scannedQRContent)
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
    onCloseAction()
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
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
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
          {(!scanResult || scanResult.isProcessing) && (
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
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">High-Quality Camera Scanner</h3>
                  <p className="text-sm text-slate-600">Large viewfinder for better QR code capture and processing</p>
                  <p className="text-xs text-slate-500 mt-1">Works with QR codes of any size - from tiny to large displays</p>
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
                        className="w-full h-96 sm:h-[500px] md:h-[600px] lg:h-[700px] object-cover"
                        autoPlay
                        playsInline
                        muted
                      />
                      {/* Hidden canvas used for decoding frames */}
                      <canvas ref={canvasRef} className="hidden" />
                      <div className="absolute inset-0 border-2 border-green-400 border-dashed rounded-xl m-6 pointer-events-none">
                        <div className="absolute top-3 left-3 w-12 h-12 border-l-4 border-t-4 border-green-400"></div>
                        <div className="absolute top-3 right-3 w-12 h-12 border-r-4 border-t-4 border-green-400"></div>
                        <div className="absolute bottom-3 left-3 w-12 h-12 border-l-4 border-b-4 border-green-400"></div>
                        <div className="absolute bottom-3 right-3 w-12 h-12 border-r-4 border-b-4 border-green-400"></div>
                        {/* Center crosshair for better targeting */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 border-2 border-green-400 rounded-full opacity-50"></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-green-400 rounded-full"></div>
                        {/* Scanning instructions overlay */}
                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm font-medium">
                          Point camera at QR code - works with any size
                        </div>
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-xs">
                          Hold steady for better detection
                        </div>
                      </div>
                      {/* Loading overlay - only show when camera is not ready */}
                      {!isCameraReady && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="text-center text-white">
                            <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-lg font-medium">Starting camera...</p>
                            <p className="text-sm text-gray-300 mt-1">Preparing high-quality scanner</p>
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

                    {/* Enhanced Scanning Progress Feedback */}
                    {isScanning && !scanningError && (
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 mb-4">
                        <div className="flex items-center gap-2 text-blue-700">
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-sm font-medium">
                            {scanAttempts < 30 ? 'Initializing Scanner...' : 
                             scanAttempts < 100 ? 'Scanning for QR Code...' : 
                             scanAttempts < 200 ? 'Looking for QR Code...' : 
                             'Still searching...'}
                          </span>
                        </div>
                        <p className="text-xs text-blue-600 mt-1">
                          {scanAttempts < 10 ? 'Fast scanning mode - ultra-responsive detection' :
                           scanAttempts < 30 ? 'High-speed scanning - point camera at QR code' :
                           scanAttempts < 100 ? 'Standard scanning - works with any size QR code' :
                           scanAttempts < 150 ? 'Enhanced scanning - make sure QR code is clearly visible' :
                           'Comprehensive scanning - try adjusting distance or lighting'}
                        </p>
                        {scanAttempts > 50 && (
                          <div className="mt-2">
                            <div className="w-full bg-blue-200 rounded-full h-1.5">
                              <div 
                                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min((scanAttempts / MAX_SCAN_ATTEMPTS) * 100, 100)}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-blue-500 mt-1 text-center">
                              {Math.round((scanAttempts / MAX_SCAN_ATTEMPTS) * 100)}% complete
                            </p>
                          </div>
                        )}
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
          )}

          {/* Simplified Checklist Execution Interface */}
          {scanResult && mode === 'checklists' && scanResult.success && scanResult.asset ? (
            <div className="mt-4 space-y-4">
              {/* Simple Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckSquare className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">{scanResult.asset.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as 'daily'|'weekly'|'monthly')}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                    aria-label="Select frequency"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <select
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                    aria-label="Select month"
                  >
                    {monthNames.map((m, idx) => (
                      <option key={m} value={idx}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                    aria-label="Select year"
                  >
                    {Array.from({length: 7}, (_,i) => new Date().getFullYear() - 3 + i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <Button variant="outline" size="sm" onClick={() => onScanResultAction('')}>Close</Button>
                </div>
              </div>

              {/* Simple Checklist Table */}
              {scanResult.asset.items && scanResult.asset.items.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left w-10">#</th>
                        <th className="px-3 py-2 text-left w-56">Activity</th>
                        <th className="px-3 py-2 text-left">
                          <div
                            className="grid overflow-x-auto pr-2"
                            style={{ gridTemplateColumns: `repeat(${dayLabels.length}, minmax(${cellSize}px, 1fr))` }}
                          >
                        {dayLabels.map((lbl, idx) => (
                              <div key={idx} className="flex items-center justify-center text-xs font-semibold text-gray-700 border border-gray-300 bg-white/70">
                                {lbl}
                              </div>
                        ))}
                      </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {scanResult.asset.items.map((item, index) => {
                      const itemId = item._id || `item_${index}`
                      return (
                          <tr key={itemId}>
                            <td className="px-3 py-2 align-top">{item.serialNumber || index + 1}</td>
                            <td className="px-3 py-2 align-top">
                            <div className="font-medium text-gray-900">{item.inspectionItem}</div>
                            {item.details && <div className="text-xs text-gray-500">{item.details}</div>}
                            </td>
                            <td className="px-3 py-2">
                              <div
                                className="grid overflow-x-auto pr-2"
                                style={{ gridTemplateColumns: `repeat(${dayLabels.length}, minmax(${cellSize}px, 1fr))` }}
                              >
                              {dayLabels.map((_, dayIdx) => (
                                  <div key={dayIdx} className="flex items-center justify-center border border-gray-300 bg-white" style={{ height: cellSize }}>
                                <input
                                  type="checkbox"
                                  checked={!!ticks[itemId]?.[dayIdx]}
                                  onChange={() => toggleTick(itemId, dayIdx)}
                                      className="w-4 h-4 accent-blue-600 focus:ring-2 focus:ring-blue-400"
                                />
                                  </div>
                              ))}
                            </div>
                            </td>
                          </tr>
                      )
                    })}
                    </tbody>
                  </table>
                </div>
              )}
              {/* Simple Actions */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={() => onScanResultAction('')}>Close</Button>
                <Button size="sm" onClick={handleSaveProgress}>Save ({getCompletionStats().completed}/{getCompletionStats().total})</Button>
              </div>
            </div>
          ) : scanResult && (
            /* Other scan results (assets, errors, etc.) */
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

                        {mode === 'assets' ? (
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
                        ) : (
                          /* Default case for other modes */
                          <div className="text-center py-8">
                            <p className="text-gray-500">No asset details available</p>
                          </div>
                        )}

                        {/* Enhanced Action Buttons for Asset */}
                        <div className="flex flex-col space-y-2 pt-4">
                          {mode === 'assets' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <Button 
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                                onClick={() => onScanResultAction(scanResult.assetId)}
                              >
                                <Calendar className="w-4 h-4 mr-2" />
                                Open Calendar Checklist
                              </Button>
                              <Button 
                                className="w-full bg-green-600 hover:bg-green-700 text-white" 
                                onClick={() => onScanResultAction(scanResult.assetId)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Full Details
                              </Button>
                            </div>
                          ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => onScanResultAction(scanResult.assetId)}>
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
                          )}
                          
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                              onClick={() => copyScannedCode(scanResult.assetId)}
                            >
                              {copied ? 'Copied!' : 'Copy QR Data'}
                            </Button>
                            <Button 
                              variant="outline" 
                              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
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
                              onScanResultAction('')
                            }}
                          >
                            Close Scanner
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
                            onScanResultAction('')
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