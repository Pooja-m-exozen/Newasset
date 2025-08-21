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
  CheckCircle
} from 'lucide-react'

interface ScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onScanResult: (result: string) => void
  scannedResult?: string | null
}

export function ScannerModal({ 
  isOpen, 
  onClose, 
  onScanResult, 
  scannedResult 
}: ScannerModalProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
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
      // Here you would typically send the image to your backend for QR code processing
      // For now, we'll simulate the process
      console.log('Processing uploaded image:', uploadedImage.name)
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simulate result (replace with actual QR code detection)
      const simulatedAssetId = 'SSG746'
      onScanResult(simulatedAssetId)
      
      setUploadedImage(null)
      setUploadPreview(null)
      
    } catch (error) {
      console.error('Error processing image:', error)
      alert('Error processing image. Please try again.')
    }
  }

  const handleClose = () => {
    stopScanner()
    setUploadedImage(null)
    setUploadPreview(null)
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

          {/* Scan Result */}
          {scannedResult && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-green-800">Scan Result</h4>
                  <p className="text-sm text-green-700 font-mono">{scannedResult}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onScanResult('')}
                  className="text-green-600 hover:bg-green-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
