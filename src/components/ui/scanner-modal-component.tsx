"use client"

import React, { useState, useRef } from 'react'
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
  Eye
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
    }
    assignedTo?: {
      name: string
      email: string
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
  scannedResult,
  assets = [],
  checklists = [],
  mode = 'assets'
}: ScannerModalProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const [scanResult, setScanResult] = useState<{
    success: boolean
    assetId: string
    asset?: any
    message: string
    isProcessing?: boolean
  } | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Scanner functions
  const startScanner = async () => {
    try {
      setIsScanning(true)
      setIsCameraReady(false)
      
      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser')
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        try {
          await videoRef.current.play()
          // Set camera as ready after video starts playing
          setIsCameraReady(true)
        } catch (playError) {
          console.error('Error playing video:', playError)
          throw new Error('Unable to start camera stream')
        }
      }
    } catch (error) {
      console.error('Error starting scanner:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unable to access camera'
      alert(`Camera Error: ${errorMessage}. Please check permissions and try again.`)
      setIsScanning(false)
      setIsCameraReady(false)
    }
  }

  const stopScanner = () => {
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
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setUploadedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const processUploadedImage = async () => {
    if (!uploadedImage) return
    
    try {
      console.log('Processing uploaded image:', uploadedImage.name)
      
      // Show processing state
      setScanResult({
        success: false,
        assetId: '',
        message: 'Processing image...',
        isProcessing: true
      })
      
      // Actually process the uploaded image to extract QR code data
      const extractedData = await extractQRCodeFromImage(uploadedImage)
      
      if (extractedData && extractedData.success && extractedData.assetId) {
        const scannedQRContent = extractedData.assetId
        
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
            setScanResult({
              success: true,
              assetId: scannedQRContent,
              asset: foundChecklist,
              message: `✅ Checklist found: ${foundChecklist.title}`
            })
            onScanResult(scannedQRContent)
          } else {
            // QR code found but checklist not in system - show info
            setScanResult({
              success: false,
              assetId: scannedQRContent,
              message: `ℹ️ QR Code scanned: "${scannedQRContent}" - Checklist not found in system`
            })
          }
        } else {
          // Handle asset scanning (existing logic)
          const foundAsset = assets.find(asset => 
            asset.tagId === scannedQRContent ||
            asset._id === scannedQRContent ||
            asset.tagId.includes(scannedQRContent) ||
            scannedQRContent.includes(asset.tagId)
          )
          
          if (foundAsset) {
            // Asset found - show success
            setScanResult({
              success: true,
              assetId: scannedQRContent,
              asset: foundAsset,
              message: `✅ Asset found: ${foundAsset.tagId}`
            })
            onScanResult(scannedQRContent)
          } else {
            // QR code found but asset not in system - show info
            setScanResult({
              success: false,
              assetId: scannedQRContent,
              message: `ℹ️ QR Code scanned: "${scannedQRContent}" - Not registered in system`
            })
          }
        }
      } else {
        // Failed to extract QR code from image
        setScanResult({
          success: false,
          assetId: '',
          message: extractedData.error || '❌ No QR code found in the uploaded image. Please ensure the image contains a clear, readable QR code.'
        })
      }
      
      setUploadedImage(null)
      setUploadPreview(null)
      
    } catch (error) {
      console.error('Error processing image:', error)
      setScanResult({
        success: false,
        assetId: '',
        message: '❌ Error processing image. Please try again.'
      })
    }
  }

  // Function to actually extract QR code from image
  const extractQRCodeFromImage = async (imageFile: File): Promise<{ success: boolean; assetId?: string; error?: string }> => {
    return new Promise((resolve) => {
      // Create a canvas to process the image
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
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
              resolve({
                success: true,
                assetId: code.data
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

  const handleClose = () => {
    stopScanner()
    setUploadedImage(null)
    setUploadPreview(null)
    setScanResult(null)
    onClose()
  }

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
                        <img 
                          src={uploadPreview} 
                          alt="Preview" 
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
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Enhanced Scan Result */}
          {scanResult && (
            <div className={`mt-6 rounded-xl border overflow-hidden ${
              scanResult.isProcessing 
                ? 'bg-white border-blue-200 shadow-lg'
                : scanResult.success 
                ? 'bg-white border-green-200 shadow-lg' 
                : 'bg-white border-red-200 shadow-lg'
            }`}>
              {/* Header Section */}
              <div className={`p-4 ${
                scanResult.isProcessing 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                  : scanResult.success 
                  ? 'bg-gradient-to-r from-green-500 to-green-600' 
                  : 'bg-white'
              } ${scanResult.success || scanResult.isProcessing ? 'text-white' : 'text-red-600'} text-center relative`}>
                {scanResult.isProcessing ? (
                  <>
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <h3 className="text-2xl font-bold">Processing Image...</h3>
                    </div>
                    <p className="text-sm opacity-90">Extracting QR code data from uploaded image</p>
                  </>
                ) : scanResult.success ? (
                  <>
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold">
                        {mode === 'checklists' ? 'Checklist Found!' : 'Asset Found!'}
                      </h3>
                      <div className="text-2xl">🎉</div>
                    </div>
                    <p className="text-sm opacity-90">
                      Scanner successfully identified {mode === 'checklists' ? 'checklist' : 'asset'}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                        <X className="w-6 h-6 text-red-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-red-600">Scanner Failed</h3>
                    </div>
                    <p className="text-sm text-red-600">Scanner could not process QR code</p>
                  </>
                )}
              </div>

              {/* Body Section */}
              <div className="p-6">
                {scanResult.isProcessing ? (
                  /* Show Processing State */
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <h4 className="text-lg font-semibold text-blue-800 mb-2">Processing Image</h4>
                    <p className="text-blue-700 mb-3">
                      Analyzing uploaded image for QR code data...
                    </p>
                    <p className="text-sm text-blue-600">
                      This may take a few seconds depending on image quality.
                    </p>
                  </div>
                ) : (
                  <>
                     {/* QR Code Content Badge - Only show for successful scans */}
                     {scanResult.success && (
                       <div className="flex justify-center mb-4">
                         <div className="px-4 py-2 rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center space-x-2">
                           <div className="w-4 h-4">🏷️</div>
                           <span className="font-bold font-mono">
                             {mode === 'checklists' 
                               ? scanResult.asset?.title || scanResult.assetId
                               : scanResult.asset?.tagId || scanResult.assetId
                             }
                           </span>
                         </div>
                       </div>
                     )}

                    {scanResult.success && scanResult.asset ? (
                      /* Show Asset/Checklist Details if Found */
                      <div className="space-y-4">
                        {mode === 'checklists' ? (
                          /* Checklist Details */
                          <div className="space-y-4">
                            {/* Checklist Properties Grid */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-gray-50 rounded-lg p-3">
                                <span className="text-xs font-medium text-gray-500 uppercase">Type</span>
                                <p className="text-sm font-semibold text-gray-900">{scanResult.asset.type}</p>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3">
                                <span className="text-xs font-medium text-gray-500 uppercase">Status</span>
                                <p className="text-sm font-semibold text-gray-900 capitalize">{scanResult.asset.status}</p>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3">
                                <span className="text-xs font-medium text-gray-500 uppercase">Priority</span>
                                <p className="text-sm font-semibold text-gray-900 capitalize">{scanResult.asset.priority}</p>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3">
                                <span className="text-xs font-medium text-gray-500 uppercase">Title</span>
                                <p className="text-sm font-semibold text-gray-900">{scanResult.asset.title}</p>
                              </div>
                            </div>

                            {/* Location Details */}
                            {scanResult.asset.location && (
                              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                <div className="flex items-center space-x-2 mb-2">
                                  <MapPin className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm font-medium text-blue-800 uppercase">Location</span>
                                </div>
                                <div className="text-sm text-blue-900">
                                  <div>{scanResult.asset.location.building}</div>
                                  <div>Floor {scanResult.asset.location.floor} • Zone {scanResult.asset.location.zone}</div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Asset Details (existing logic) */
                          <div className="space-y-4">
                            {/* Asset Properties Grid */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-gray-50 rounded-lg p-3">
                                <span className="text-xs font-medium text-gray-500 uppercase">Type</span>
                                <p className="text-sm font-semibold text-gray-900">{scanResult.asset.assetType}</p>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3">
                                <span className="text-xs font-medium text-gray-500 uppercase">Brand</span>
                                <p className="text-sm font-semibold text-gray-900">{scanResult.asset.brand}</p>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3">
                                <span className="text-xs font-medium text-gray-500 uppercase">Model</span>
                                <p className="text-sm font-semibold text-gray-900">{scanResult.asset.model}</p>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3">
                                <span className="text-xs font-medium text-gray-500 uppercase">Status</span>
                                <p className="text-sm font-semibold text-gray-900 capitalize">{scanResult.asset.status}</p>
                              </div>
                            </div>

                            {/* Location Details */}
                            {scanResult.asset.location && (
                              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                <div className="flex items-center space-x-2 mb-2">
                                  <MapPin className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm font-medium text-blue-800 uppercase">Location</span>
                                </div>
                                <div className="text-sm text-blue-900">
                                  <div>{scanResult.asset.location.building}</div>
                                  <div>{scanResult.asset.location.floor} • {scanResult.asset.location.room}</div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col space-y-2 pt-4">
                          <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                            <Eye className="w-4 h-4 mr-2" />
                            View Full Details
                          </Button>
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
                       /* Show Simple Message */
                       <div className="text-center text-gray-600">
                         <span>QR code not valid</span>
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