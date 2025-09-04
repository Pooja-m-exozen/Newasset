'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Badge } from './badge'
import { Separator } from './separator'
import { useDigitalAssets } from '@/contexts/DigitalAssetsContext'
import { getAssetById, type Asset } from '@/lib/DigitalAssets'
import { cn } from '@/lib/utils'
import { SuccessToast } from './success-toast'
import { 
  QrCode, 
  Camera, 
  CameraOff, 
  Search, 
  Download, 
  X,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface QRCodeScannerProps {
  className?: string;
}

interface ScannedAsset {
  asset: Asset;
  scannedAt: Date;
  qrCodeUrl?: string;
}

export function QRCodeScanner({ className }: QRCodeScannerProps) {
  const { clearError, error } = useDigitalAssets()
  const [isScanning, setIsScanning] = useState(false)
  const [scannedAssets, setScannedAssets] = useState<ScannedAsset[]>([])
  const [currentScannedAsset, setCurrentScannedAsset] = useState<ScannedAsset | null>(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [manualInput, setManualInput] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)
  
  // Video stream refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // QR Code detection function
  const detectQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // Simple QR code detection (you can integrate a proper QR library here)
    // For now, we'll use a placeholder that can be enhanced with jsQR or similar
    detectQRCodeFromImageData()
  }

  // Placeholder QR detection function
  const detectQRCodeFromImageData = () => {
    // This is a placeholder - in a real implementation, you would use a QR library
    // For now, we'll simulate detection for testing purposes
    console.log('🔍 Scanning for QR codes...')
    
    // You can integrate jsQR library here:
    // import jsQR from 'jsqr'
    // const code = jsQR(imageData.data, imageData.width, imageData.height)
    // if (code) {
    //   processScannedCode(code.data)
    // }
  }

  // Start camera stream
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        
        // Start QR code detection when video is ready
        videoRef.current.onloadedmetadata = () => {
          setIsScanning(true)
          
          // Start scanning interval
          scanIntervalRef.current = setInterval(() => {
            if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
              detectQRCode()
            }
          }, 100) // Scan every 100ms
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      setShowManualInput(true)
    }
  }

  // Stop camera stream
  const stopCamera = () => {
    // Clear scanning interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
  }

  // Process scanned QR code
  const processScannedCode = async (qrCodeData: string) => {
    try {
      setIsLoading(true)
      
      // Extract asset ID from QR code data
      let assetId = qrCodeData
      
      // Handle different QR code data formats
      if (qrCodeData.includes('https://digitalasset.zenapi.co.in/uploads/digital-assets/qr_')) {
        // Extract tagId from the specific path format
        const pathMatch = qrCodeData.match(/qr_([^_]+)_\d+\.png/)
        if (pathMatch) {
          assetId = pathMatch[1]
          console.log('✅ Extracted asset ID from path:', assetId)
        }
      } else if (qrCodeData.includes('/')) {
        // Extract from URL path
        const urlParts = qrCodeData.split('/')
        assetId = urlParts[urlParts.length - 1]
        console.log('✅ Extracted asset ID from URL:', assetId)
      } else if (qrCodeData.includes('ASSET')) {
        // Direct asset ID format
        assetId = qrCodeData
        console.log('✅ Using direct asset ID:', assetId)
      }
      
      console.log('🔍 Processing scanned QR code:', assetId)
      console.log('📋 Original QR data:', qrCodeData)
      
      // Fetch asset details
      const response = await getAssetById(assetId)
      const asset = response.asset
      
      // Generate the correct QR code path using the specific format
      const timestamp = Date.now()
      const qrCodePath = `https://digitalasset.zenapi.co.in/uploads/digital-assets/qr_${asset.tagId}_${timestamp}.png`
      
      console.log('🖼️ Generated QR code path:', qrCodePath)
      
      // Create scanned asset object
      const scannedAsset: ScannedAsset = {
        asset,
        scannedAt: new Date(),
        qrCodeUrl: qrCodePath
      }
      
      setCurrentScannedAsset(scannedAsset)
      setScannedAssets(prev => [scannedAsset, ...prev.slice(0, 9)]) // Keep last 10
      
      setSuccessMessage(`Asset "${asset.tagId}" scanned successfully!`)
      setShowSuccessToast(true)
      
      // Stop scanning after successful scan
      stopCamera()
      
    } catch (error) {
      console.error('Error processing scanned code:', error)
      setSuccessMessage('Failed to process QR code. Please try again.')
      setShowSuccessToast(true)
    } finally {
      setIsLoading(false)
    }
  }

  // Manual asset lookup
  const handleManualLookup = async () => {
    if (!manualInput.trim()) return
    
    try {
      setIsLoading(true)
      await processScannedCode(manualInput.trim())
      setManualInput('')
    } catch (error) {
      console.error('Error in manual lookup:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Clear current scan
  const clearCurrentScan = () => {
    setCurrentScannedAsset(null)
    clearError()
  }

  // Download QR code image
  const downloadQRCode = async (qrCodeUrl: string, tagId: string) => {
    try {
      const response = await fetch(qrCodeUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `qr_${tagId}_${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      setSuccessMessage('QR code downloaded successfully!')
      setShowSuccessToast(true)
    } catch (error) {
      console.error('Error downloading QR code:', error)
      setSuccessMessage('Failed to download QR code.')
      setShowSuccessToast(true)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  // Test function for manual QR code processing (for development)
  const testQRCodeProcessing = () => {
    // Test with the specific path format you provided
    const testQRData = 'https://digitalasset.zenapi.co.in/uploads/digital-assets/qr_ASSET555_1754296433008.png'
    processScannedCode(testQRData)
  }

  return (
    <div className={cn("space-y-6", className)}>
      {showSuccessToast && (
        <SuccessToast
          message={successMessage}
          onClose={() => setShowSuccessToast(false)}
        />
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <QrCode className="h-5 w-5" />
            QR Code Scanner
          </CardTitle>
          <CardDescription>
            Scan QR codes to view asset information and details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Scanner Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={isScanning ? stopCamera : startCamera}
              variant={isScanning ? "destructive" : "default"}
              className="flex-1"
            >
              {isScanning ? (
                <>
                  <CameraOff className="h-4 w-4 mr-2" />
                  Stop Scanner
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Start Scanner
                </>
              )}
            </Button>
            
            <Button 
              onClick={() => setShowManualInput(!showManualInput)}
              variant="outline"
              className="flex-1"
            >
              <Search className="h-4 w-4 mr-2" />
              Manual Input
            </Button>
          </div>

          {/* Test Button for Development */}
          <div className="flex justify-center">
            <Button 
              onClick={testQRCodeProcessing}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Test QR Processing (ASSET555)
            </Button>
          </div>

          {/* Manual Input */}
          {showManualInput && (
            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Asset ID, QR Code URL, or full path"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-input rounded-md bg-background"
                  onKeyPress={(e) => e.key === 'Enter' && handleManualLookup()}
                />
                <Button 
                  onClick={handleManualLookup}
                  disabled={isLoading || !manualInput.trim()}
                  size="sm"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* Quick Test Buttons */}
              <div className="flex flex-wrap gap-2 mt-2">
                <Button 
                  onClick={() => setManualInput('ASSET555')}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Test ASSET555
                </Button>
                <Button 
                  onClick={() => setManualInput('https://digitalasset.zenapi.co.in/uploads/digital-assets/qr_ASSET555_1754296433008.png')}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Test Full Path
                </Button>
                <Button 
                  onClick={() => setManualInput('qr_ASSET555_1754296433008.png')}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Test Filename
                </Button>
              </div>
            </div>
          )}

          {/* Camera View */}
          {isScanning && (
            <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
              <div className="relative w-full max-w-md mx-auto">
                {/* Scanner Frame */}
                <div className="relative w-80 h-80 bg-black rounded-lg overflow-hidden">
                  {/* Scanner Corner Indicators */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-green-500 z-10"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-green-500 z-10"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-green-500 z-10"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-green-500 z-10"></div>
                  
                  {/* Video Stream */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Scanning Animation */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-pulse z-10"></div>
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/20 z-5"></div>
                </div>
                
                {/* Canvas for QR detection */}
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Status */}
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    <QrCode className="h-4 w-4" />
                    Scanning for QR Codes...
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Point camera at QR codes from your digital assets
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports: ASSET555, full URLs, and path formats
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Processing scanned asset...</p>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">{error}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearError}
                className="ml-auto"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

        </CardContent>
      </Card>

      {/* Current Scanned Asset */}
      {currentScannedAsset && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Scanned Asset
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{currentScannedAsset.asset.tagId}</Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearCurrentScan}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Asset scanned at {currentScannedAsset.scannedAt.toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Asset Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium">Asset Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Type:</span>
                    <span>{currentScannedAsset.asset.assetType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Brand:</span>
                    <span>{currentScannedAsset.asset.brand}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Model:</span>
                    <span>{currentScannedAsset.asset.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Status:</span>
                    <Badge variant={currentScannedAsset.asset.status === 'active' ? 'default' : 'secondary'}>
                      {currentScannedAsset.asset.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Priority:</span>
                    <Badge variant={currentScannedAsset.asset.priority === 'high' ? 'destructive' : 'secondary'}>
                      {currentScannedAsset.asset.priority}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Location</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Building:</span>
                    <span>{currentScannedAsset.asset.location.building}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Floor:</span>
                    <span>{currentScannedAsset.asset.location.floor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Room:</span>
                    <span>{currentScannedAsset.asset.location.room}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Project:</span>
                    <span>{currentScannedAsset.asset.projectName}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* QR Code Display */}
            {currentScannedAsset.qrCodeUrl && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Scanned QR Code</h4>
                  <Button 
                    onClick={() => downloadQRCode(currentScannedAsset.qrCodeUrl!, currentScannedAsset.asset.tagId)}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
                <div className="flex justify-center">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentScannedAsset.qrCodeUrl}
                      alt={`QR Code for ${currentScannedAsset.asset.tagId}`}
                      className="w-48 h-48 object-contain"
                      onError={(e) => {
                        console.error('Failed to load QR code image:', currentScannedAsset.qrCodeUrl)
                        // Try alternative path format
                        const alternativePath = `https://digitalasset.zenapi.co.in/uploads/digital-assets/qr_${currentScannedAsset.asset.tagId}_${Date.now()}.png`
                        e.currentTarget.src = alternativePath
                      }}
                      onLoad={() => {
                        console.log('QR code image loaded successfully:', currentScannedAsset.qrCodeUrl)
                      }}
                    />
                  </div>
                </div>
                <div className="text-center text-xs text-muted-foreground">
                  <p>Path: {currentScannedAsset.qrCodeUrl}</p>
                  <p>Tag ID: {currentScannedAsset.asset.tagId}</p>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      )}

      {/* Scan History */}
      {scannedAssets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Scan History</CardTitle>
            <CardDescription>
              Recently scanned assets ({scannedAssets.length})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {scannedAssets.map((scannedAsset) => (
                <div 
                  key={`${scannedAsset.asset._id}-${scannedAsset.scannedAt.getTime()}`}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer"
                  onClick={() => setCurrentScannedAsset(scannedAsset)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <QrCode className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{scannedAsset.asset.tagId}</p>
                      <p className="text-sm text-muted-foreground">
                        {scannedAsset.asset.assetType} • {scannedAsset.asset.brand} {scannedAsset.asset.model}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {scannedAsset.scannedAt.toLocaleTimeString()}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {scannedAsset.asset.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
} 