"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  Search, 
  Grid3X3, 
  List, 
  MapPin, 
  Building, 
  Layers, 
  Users, 
  QrCode, 
  Barcode, 
  Smartphone,
  Download,
  Eye,
  Calendar,
  Tag,
  AlertCircle,
  Loader2,
  RefreshCw,
  Smartphone as MobileIcon,
  Monitor as DesktopIcon,
  TrendingUp,
  BarChart3,
  FileText,
  Settings,
  MoreHorizontal,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Camera,
  Upload,
  X,
  Scan,
  Image as ImageIcon
} from 'lucide-react'
import { Label } from '@/components/ui/label'

interface Asset {
  _id: string
  tagId: string
  assetType: string
  subcategory: string
  brand: string
  model: string
  status: string
  priority: string
  location: {
    latitude: string
    longitude: string
    floor: string
    room: string
    building: string
  } | null
  project?: {
    projectId: string
    projectName: string
  } | null
  compliance: {
    certifications: string[]
    expiryDates: string[]
    regulatoryRequirements: string[]
  }
  digitalAssets: {
    qrCode: {
      url: string
      data: {
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
      generatedAt: string
    }
    barcode: {
      url: string
      data: string
      generatedAt: string
    }
    nfcData: {
      url: string
      data: {
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
      generatedAt: string
    }
  }
  assignedTo: {
    _id: string
    name: string
    email: string
  } | string
  createdAt: string
  updatedAt: string
}

interface ApiResponse {
  success: boolean
  assets: Asset[]
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isMobile, setIsMobile] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  
  // Scanner states
  const [showScanner, setShowScanner] = useState(false)
  const [scannedResult, setScannedResult] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const [showMoreOptions, setShowMoreOptions] = useState<string | null>(null)
  const [scannedAsset, setScannedAsset] = useState<Asset | null>(null)
  const [showScannedAssetModal, setShowScannedAssetModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successAsset, setSuccessAsset] = useState<Asset | null>(null)
  const [digitalAssetModal, setDigitalAssetModal] = useState<{
    asset: Asset
    type: 'qrCode' | 'barcode' | 'nfcData'
  } | null>(null)
  
  // Digital asset modal image states
  const [modalQrImgSrc, setModalQrImgSrc] = useState<string | null>(null)
  const [modalBarcodeImgSrc, setModalBarcodeImgSrc] = useState<string | null>(null)
  const [modalQrLoading, setModalQrLoading] = useState(false)
  const [modalBarcodeLoading, setModalBarcodeLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Cleanup camera stream on unmount and blob URLs
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      // Cleanup blob URLs
      if (modalQrImgSrc && modalQrImgSrc.startsWith('blob:')) {
        URL.revokeObjectURL(modalQrImgSrc)
      }
      if (modalBarcodeImgSrc && modalBarcodeImgSrc.startsWith('blob:')) {
        URL.revokeObjectURL(modalBarcodeImgSrc)
      }
    }
  }, [modalQrImgSrc, modalBarcodeImgSrc])

  // Cleanup success modal on unmount
  useEffect(() => {
    return () => {
      if (showSuccessModal) {
        setShowSuccessModal(false)
        setSuccessAsset(null)
      }
    }
  }, [showSuccessModal])

  // Scanner functions
  const startScanner = async () => {
    try {
      setIsScanning(true)
      setScannedResult(null)
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
      // Try to find a real asset from the current list
      const availableAssets = assets.filter(asset => 
        asset.digitalAssets?.qrCode || 
        asset.digitalAssets?.barcode || 
        asset.digitalAssets?.nfcData
      )
      
      if (availableAssets.length > 0) {
        // Pick a random asset for demonstration
        const randomAsset = availableAssets[Math.floor(Math.random() * availableAssets.length)]
        handleScannedResult(randomAsset.tagId)
      } else {
        // Fallback to simulated asset
        const simulatedAssetId = 'SSG746'
        handleScannedResult(simulatedAssetId)
      }
      
      setShowUploadModal(false)
      setUploadedImage(null)
      setUploadPreview(null)
      
    } catch (error) {
      console.error('Error processing image:', error)
      alert('Error processing image. Please try again.')
    }
  }

  // Load digital asset modal images with blob URLs (robust loading)
  const loadModalImages = async (asset: Asset) => {
    // Load QR Code
    if (asset.digitalAssets?.qrCode?.url) {
      setModalQrLoading(true)
      try {
        const qrUrl = `http://192.168.0.5:5021${asset.digitalAssets.qrCode.url}`
        console.log('Loading modal QR Code:', qrUrl)
        const response = await fetch(qrUrl)
        if (!response.ok) throw new Error('QR fetch failed')
        const blob = await response.blob()
        const objectUrl = URL.createObjectURL(blob)
        console.log('Modal QR Code blob URL created:', objectUrl)
        setModalQrImgSrc(objectUrl)
      } catch (error) {
        console.log('Modal QR Code loading failed:', error)
        setModalQrImgSrc(null)
      } finally {
        setModalQrLoading(false)
      }
    }
    
    // Load Barcode
    if (asset.digitalAssets?.barcode?.url) {
      setModalBarcodeLoading(true)
      try {
        const barcodeUrl = `http://192.168.0.5:5021${asset.digitalAssets.barcode.url}`
        console.log('Loading modal Barcode:', barcodeUrl)
        const response = await fetch(barcodeUrl)
        if (!response.ok) throw new Error('Barcode fetch failed')
        const blob = await response.blob()
        const objectUrl = URL.createObjectURL(blob)
        console.log('Modal Barcode blob URL created:', objectUrl)
        setModalBarcodeImgSrc(objectUrl)
      } catch (error) {
        console.log('Modal Barcode loading failed:', error)
        setModalBarcodeImgSrc(null)
      } finally {
        setModalBarcodeLoading(false)
      }
    }
  }

  // Show digital asset modal
  const showDigitalAssetModal = (asset: Asset, type: 'qrCode' | 'barcode' | 'nfcData') => {
    setDigitalAssetModal({ asset, type })
    // Reset previous images
    setModalQrImgSrc(null)
    setModalBarcodeImgSrc(null)
    setModalQrLoading(false)
    setModalBarcodeLoading(false)
    // Load images with robust method
    loadModalImages(asset)
  }

  // Handle scanned QR code result
  const handleScannedResult = (assetId: string) => {
    try {
      // Find the asset in our current assets list
      const foundAsset = assets.find(asset => 
        asset.tagId === assetId || 
        asset.digitalAssets?.qrCode?.data?.t === assetId ||
        asset.digitalAssets?.nfcData?.data?.id === assetId
      )
      
      if (foundAsset) {
        setScannedAsset(foundAsset)
        setShowScannedAssetModal(true)
        setScannedResult(`✅ Asset found: ${foundAsset.tagId}`)
        
        // Show success message in custom modal instead of browser alert
        setTimeout(() => {
          setSuccessAsset(foundAsset)
          setShowSuccessModal(true)
          console.log('🎉 Success modal should now display for asset:', foundAsset.tagId)
        }, 500)
        
        closeScanner()
      } else {
        setScannedResult(`❌ Asset not found: ${assetId}`)
        // Show user-friendly error message
        setTimeout(() => {
          alert(`Asset with ID "${assetId}" not found in current view.\n\nPlease check if the asset exists or refresh the data.`)
        }, 100)
      }
    } catch (error) {
      console.error('Error processing scanned result:', error)
      setScannedResult(`❌ Error: ${error}`)
    }
  }

  const closeScanner = () => {
    stopScanner()
    setShowScanner(false)
    setScannedResult(null)
    setIsCameraReady(false)
  }

  // Download asset information
  const downloadAssetInfo = (asset: Asset) => {
    try {
      // Create asset information text
      const assetInfo = `
Asset Information
=================

Basic Details:
- Tag ID: ${asset.tagId}
- Type: ${asset.assetType}
- Brand: ${asset.brand}
- Model: ${asset.model}
- Status: ${asset.status}
- Priority: ${asset.priority}
- Assigned To: ${typeof asset.assignedTo === 'string' ? asset.assignedTo : asset.assignedTo?.name || 'N/A'}

Location:
- Building: ${asset.location?.building || 'N/A'}
- Floor: ${asset.location?.floor || 'N/A'}
- Room: ${asset.location?.room || 'N/A'}
- Coordinates: ${asset.location?.latitude && asset.location?.longitude ? `${asset.location.latitude}, ${asset.location.longitude}` : 'N/A'}

Project:
- Project Name: ${asset.project?.projectName || 'N/A'}

Digital Assets:
- QR Code: ${asset.digitalAssets?.qrCode?.url ? `http://192.168.0.5:5021${asset.digitalAssets.qrCode.url}` : 'N/A'}
- Barcode: ${asset.digitalAssets?.barcode?.url ? `http://192.168.0.5:5021${asset.digitalAssets.barcode.url}` : 'N/A'}
- NFC Data: ${asset.digitalAssets?.nfcData?.url ? `http://192.168.0.5:5021${asset.digitalAssets.nfcData.url}` : 'N/A'}

Timestamps:
- Created: ${new Date(asset.createdAt).toLocaleString()}
- Updated: ${new Date(asset.updatedAt).toLocaleString()}
      `.trim()

      // Create and download file
      const blob = new Blob([assetInfo], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `asset_${asset.tagId}_info.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading asset info:', error)
      alert('Failed to download asset information')
    }
  }

  // Fetch assets from API
  const fetchAssets = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Get auth token from localStorage
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('Authentication token not found. Please login again.')
      }
      
      const response = await fetch('http://192.168.0.5:5021/api/assets', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (response.status === 401) {
        // Clear invalid token and redirect to login
        localStorage.removeItem('authToken')
        throw new Error('Authentication failed. Please login again.')
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data: ApiResponse = await response.json()
      if (data.success) {
        setAssets(data.assets)
        setFilteredAssets(data.assets)
        setRetryCount(0) // Reset retry count on success
      } else {
        throw new Error('Failed to fetch assets')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Error fetching assets:', err)
      
      // If it's an auth error, redirect to login after a delay
      if (errorMessage.includes('Authentication failed') || errorMessage.includes('token not found')) {
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Check if user is authenticated before fetching assets
    const token = localStorage.getItem('authToken')
    if (token) {
      fetchAssets()
    } else {
      setError('Authentication required. Please login.')
      setIsLoading(false)
    }
  }, [])

  // Filter assets based on search and filters
  useEffect(() => {
    let filtered = assets

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(asset =>
        asset.tagId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.assetType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.location?.building?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.location?.room?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredAssets(filtered)
  }, [assets, searchTerm])

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Get status badge variant and icon
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { variant: 'default', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' }
      case 'inactive':
        return { variant: 'secondary', icon: XCircle, color: 'text-gray-600', bgColor: 'bg-gray-100' }
      case 'maintenance':
        return { variant: 'destructive', icon: AlertTriangle, color: 'text-orange-600', bgColor: 'bg-orange-100' }
      case 'retired':
        return { variant: 'outline', icon: Clock, color: 'text-gray-500', bgColor: 'bg-gray-50' }
      default:
        return { variant: 'secondary', icon: AlertCircle, color: 'text-gray-600', bgColor: 'bg-gray-100' }
    }
  }

  // Get priority badge variant and color
  const getPriorityInfo = (priority: string) => {
    switch (priority) {
      case 'high':
        return { variant: 'destructive' as const, color: 'text-red-600', bgColor: 'bg-red-100' }
      case 'medium':
        return { variant: 'default' as const, color: 'text-blue-600', bgColor: 'bg-blue-100' }
      case 'low':
        return { variant: 'secondary' as const, color: 'text-gray-600', bgColor: 'bg-gray-100' }
      default:
        return { variant: 'secondary' as const, color: 'text-gray-600', bgColor: 'bg-gray-100' }
    }
  }

  // Enhanced Asset Card Component
  const AssetCard = ({ asset }: { asset: Asset }) => {
    const statusInfo = getStatusInfo(asset.status)
    const priorityInfo = getPriorityInfo(asset.priority)
    const StatusIcon = statusInfo.icon
    const [showDetails, setShowDetails] = useState(false)
    const [qrImgSrc, setQrImgSrc] = useState<string | null>(null)
    const [barcodeImgSrc, setBarcodeImgSrc] = useState<string | null>(null)
    const [qrLoading, setQrLoading] = useState(false)
    const [barcodeLoading, setBarcodeLoading] = useState(false)

    // Load images when component mounts
    React.useEffect(() => {
      // Load QR Code
      if (asset.digitalAssets?.qrCode?.url) {
        setQrLoading(true)
        const qrUrl = `http://192.168.0.5:5021${asset.digitalAssets.qrCode.url}`
        setQrImgSrc(qrUrl)
      }
      
      // Load Barcode
      if (asset.digitalAssets?.barcode?.url) {
        setBarcodeLoading(true)
        const barcodeUrl = `http://192.168.0.5:5021${asset.digitalAssets.barcode.url}`
        setBarcodeImgSrc(barcodeUrl)
      }
    }, [asset])

    const handleQrError = async () => {
      try {
        const url = `http://192.168.0.5:5021${asset.digitalAssets.qrCode.url}`
        const res = await fetch(url)
        if (!res.ok) throw new Error('fetch failed')
        const blob = await res.blob()
        const objectUrl = URL.createObjectURL(blob)
        setQrImgSrc(objectUrl)
      } catch {
        setQrImgSrc(null)
      } finally {
        setQrLoading(false)
      }
    }

    const handleBarcodeError = async () => {
      try {
        const url = `http://192.168.0.5:5021${asset.digitalAssets.barcode.url}`
        const res = await fetch(url)
        if (!res.ok) throw new Error('fetch failed')
        const blob = await res.blob()
        const objectUrl = URL.createObjectURL(blob)
        setBarcodeImgSrc(objectUrl)
      } catch {
        setBarcodeImgSrc(null)
      } finally {
        setBarcodeLoading(false)
      }
    }

    return (
      <>
        <Card className="group relative overflow-hidden bg-gradient-to-br from-white via-slate-50 to-blue-50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-slate-200 rounded-lg">
          {/* Status Indicator Bar */}
          <div className={`absolute top-0 left-0 right-0 h-1 ${statusInfo.bgColor}`} />
          
          <CardContent className="p-4">
            {/* Header with Status */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                    <Tag className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                      {asset.tagId}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium uppercase tracking-wide">
                      {asset.assetType}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Status Badge */}
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${statusInfo.bgColor} ${statusInfo.color} shadow-sm`}>
                <StatusIcon className="w-3 h-3" />
                <span className="text-xs font-bold capitalize tracking-wide">{asset.status}</span>
              </div>
            </div>

            {/* Asset Details */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Brand</span>
                <span className="font-semibold text-slate-900">{asset.brand}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Model</span>
                <span className="font-semibold text-slate-900">{asset.model}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Priority</span>
                <Badge variant={priorityInfo.variant} className={`${priorityInfo.color} ${priorityInfo.bgColor} border-0 font-bold px-2 py-0.5 text-xs`}>
                  {asset.priority}
                </Badge>
              </div>
            </div>

            {/* Location Info */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg p-3 mb-3 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <MapPin className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Location</span>
              </div>
              <div className="space-y-1 text-xs text-slate-700">
                {asset.location && (
                  <>
                    <div className="flex items-center gap-2">
                      <Building className="w-3 h-3 text-slate-500" />
                      <span className="font-semibold">{asset.location.building}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Layers className="w-3 h-3 text-slate-500" />
                      <span className="font-semibold">{asset.location.floor} • {asset.location.room}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Digital Assets Summary - Clickable Icons */}
            <div className="flex items-center gap-2 mb-3">
              {asset.digitalAssets?.qrCode && (
                <button 
                  onClick={() => showDigitalAssetModal(asset, 'qrCode')}
                  className="w-6 h-6 bg-blue-100 hover:bg-blue-200 rounded-lg flex items-center justify-center border border-blue-200 cursor-pointer transition-colors duration-200 hover:scale-110"
                  title="Click to view QR Code"
                >
                  <QrCode className="w-3 h-3 text-blue-600" />
                </button>
              )}
              {asset.digitalAssets?.barcode && (
                <button 
                  onClick={() => showDigitalAssetModal(asset, 'barcode')}
                  className="w-6 h-6 bg-green-100 hover:bg-green-200 rounded-lg flex items-center justify-center border border-green-200 cursor-pointer transition-colors duration-200 hover:scale-110"
                  title="Click to view Barcode"
                >
                  <Barcode className="w-3 h-3 text-green-600" />
                </button>
              )}
              {asset.digitalAssets?.nfcData && (
                <button 
                  onClick={() => showDigitalAssetModal(asset, 'nfcData')}
                  className="w-6 h-6 bg-purple-100 hover:bg-purple-200 rounded-lg flex items-center justify-center border border-purple-200 cursor-pointer transition-colors duration-200 hover:scale-110"
                  title="Click to view NFC Data"
                >
                  <Smartphone className="w-3 h-3 text-purple-600" />
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <div className="text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-3 h-3 text-slate-600" />
                  </div>
                  <span className="font-semibold">{formatDate(asset.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowDetails(true)}
                  className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                >
                  <Eye className="w-3 h-3 text-blue-600" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => downloadAssetInfo(asset)}
                  className="h-7 w-7 p-0 hover:bg-green-50 hover:text-green-600 rounded-lg"
                >
                  <Download className="w-3 h-3 text-green-600" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowMoreOptions(asset._id)}
                  className="h-7 w-7 p-0 hover:bg-purple-50 hover:text-purple-600 rounded-lg"
                >
                  <MoreHorizontal className="w-3 h-3 text-purple-600" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Details Modal */}
        {showDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Tag className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{asset.tagId} Details</h3>
                    <p className="text-sm text-slate-600">Complete asset information and digital assets</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(false)}
                  className="h-8 w-8 p-0 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                {/* Basic Info Grid */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wide">Asset Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-500">Type:</span>
                        <span className="font-medium">{asset.assetType}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-500">Brand:</span>
                        <span className="font-medium">{asset.brand}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-500">Model:</span>
                        <span className="font-medium">{asset.model}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-500">Status:</span>
                        <span className="font-medium">{asset.status}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-500">Priority:</span>
                        <span className="font-medium">{asset.priority}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wide">Location Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-500">Building:</span>
                        <span className="font-medium">{asset.location.building}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-500">Floor:</span>
                        <span className="font-medium">{asset.location.floor}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-500">Room:</span>
                        <span className="font-medium">{asset.location.room}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-500">Coordinates:</span>
                        <span className="font-medium text-xs">{asset.location.latitude}, {asset.location.longitude}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Digital Assets Section */}
                <div className="space-y-6">
                  <h4 className="font-semibold text-slate-900 text-lg border-b border-slate-200 pb-2">Digital Assets</h4>
                  
                  {/* QR Code */}
                  {asset.digitalAssets?.qrCode && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                          <QrCode className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h5 className="text-lg font-semibold text-blue-800">QR Code</h5>
                          <p className="text-sm text-blue-600">Scan to access asset information</p>
                        </div>
                      </div>
                      <div className="flex justify-center">
                        <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-lg">
                          {qrImgSrc ? (
                            <div className="relative">
                              <img 
                                src={qrImgSrc}
                                alt="QR Code" 
                                className="w-48 h-48 object-contain rounded-lg"
                                onLoad={() => setQrLoading(false)}
                                onError={handleQrError}
                              />
                              {qrLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                                  <div className="text-sm text-slate-500">Loading...</div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-48 h-48 flex items-center justify-center bg-slate-100 rounded-lg border-2 border-dashed border-slate-300">
                              <div className="text-center">
                                <QrCode className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                                <p className="text-sm text-slate-500">No QR Code</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Barcode */}
                  {asset.digitalAssets?.barcode && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                          <Barcode className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h5 className="text-lg font-semibold text-green-800">Barcode</h5>
                          <p className="text-sm text-green-600">Machine-readable asset identifier</p>
                        </div>
                      </div>
                      <div className="flex justify-center">
                        <div className="bg-white rounded-xl p-4 border border-green-200 shadow-lg">
                          {barcodeImgSrc ? (
                            <div className="relative">
                              <img 
                                src={barcodeImgSrc}
                                alt="Barcode" 
                                className="w-64 h-24 sm:w-80 sm:h-32 object-contain rounded-lg"
                                onLoad={() => setBarcodeLoading(false)}
                                onError={handleBarcodeError}
                              />
                              {barcodeLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                                  <div className="text-sm text-slate-500">Loading...</div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-64 h-24 sm:w-80 sm:h-32 flex items-center justify-center bg-slate-100 rounded-lg border-2 border-dashed border-slate-300">
                              <div className="text-center">
                                <Barcode className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                <p className="text-sm text-slate-500">No Barcode</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NFC Data */}
                  {asset.digitalAssets?.nfcData && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h5 className="text-lg font-semibold text-purple-800">NFC Data</h5>
                          <p className="text-sm text-purple-600">Near-field communication data</p>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-purple-200 shadow-lg">
                        <div className="text-center mb-4">
                          <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Smartphone className="w-8 h-8 text-purple-600" />
                          </div>
                          <p className="text-sm font-medium text-purple-700">NFC Data Available</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                          <div className="text-xs text-purple-600 mb-2 font-medium">Asset ID:</div>
                          <div className="text-lg font-mono text-purple-800 text-center font-bold bg-white rounded px-3 py-2 border border-purple-200">
                            {asset.digitalAssets.nfcData.data?.id || 'NFC Data'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* More Options Modal */}
        {showMoreOptions === asset._id && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">More Options</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMoreOptions(null)}
                  className="h-8 w-8 p-0 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-4 space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowMoreOptions(null)
                    setShowDetails(true)
                  }}
                  className="w-full justify-start h-10 text-slate-700 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Eye className="w-4 h-4 mr-3" />
                  View Details
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowMoreOptions(null)
                    downloadAssetInfo(asset)
                  }}
                  className="w-full justify-start h-10 text-slate-700 hover:bg-green-50 hover:text-green-600"
                >
                  <Download className="w-4 h-4 mr-3" />
                  Download Info
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  // Enhanced Asset List Item Component
  const AssetListItem = ({ asset }: { asset: Asset }) => {
    const statusInfo = getStatusInfo(asset.status)
    const priorityInfo = getPriorityInfo(asset.priority)
    const StatusIcon = statusInfo.icon
    const [showDetails, setShowDetails] = useState(false)
    const [qrImgSrc, setQrImgSrc] = useState<string | null>(null)
    const [barcodeImgSrc, setBarcodeImgSrc] = useState<string | null>(null)
    const [qrLoading, setQrLoading] = useState(false)
    const [barcodeLoading, setBarcodeLoading] = useState(false)

    // Load images when component mounts
    React.useEffect(() => {
      // Load QR Code
      if (asset.digitalAssets?.qrCode?.url) {
        setQrLoading(true)
        const qrUrl = `http://192.168.0.5:5021${asset.digitalAssets.qrCode.url}`
        setQrImgSrc(qrUrl)
      }
      
      // Load Barcode
      if (asset.digitalAssets?.barcode?.url) {
        setBarcodeLoading(true)
        const barcodeUrl = `http://192.168.0.5:5021${asset.digitalAssets.barcode.url}`
        setBarcodeImgSrc(barcodeUrl)
      }
    }, [asset])

    const handleQrError = async () => {
      try {
        const url = `http://192.168.0.5:5021${asset.digitalAssets.qrCode.url}`
        const res = await fetch(url)
        if (!res.ok) throw new Error('fetch failed')
        const blob = await res.blob()
        const objectUrl = URL.createObjectURL(blob)
        setQrImgSrc(objectUrl)
      } catch {
        setQrImgSrc(null)
      } finally {
        setQrLoading(false)
      }
    }

    const handleBarcodeError = async () => {
      try {
        const url = `http://192.168.0.5:5021${asset.digitalAssets.barcode.url}`
        const res = await fetch(url)
        if (!res.ok) throw new Error('fetch failed')
        const blob = await res.blob()
        const objectUrl = URL.createObjectURL(blob)
        setBarcodeImgSrc(objectUrl)
      } catch {
        setBarcodeImgSrc(null)
      } finally {
        setBarcodeLoading(false)
      }
    }

    return (
      <>
        <div className="group relative overflow-hidden border border-slate-200 rounded-lg hover:shadow-lg transition-all duration-300 hover:border-slate-300 bg-gradient-to-r from-white via-slate-50 to-blue-50">
          {/* Status Indicator */}
          <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusInfo.bgColor}`} />
          
          <div className="flex items-center p-4">
            {/* Asset Icon */}
            <div className="flex-shrink-0 mr-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                <Tag className="w-6 h-6 text-white" />
              </div>
            </div>
            
            {/* Asset Info */}
            <div className="flex-1 min-w-0 mr-6">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {asset.tagId}
                </h3>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  <span className="text-xs font-bold capitalize tracking-wide">{asset.status}</span>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-2 font-medium">
                {asset.assetType} • {asset.brand} {asset.model}
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-600">
                {asset.location && (
                  <>
                    <div className="flex items-center gap-1">
                      <Building className="w-3 h-3 text-slate-500" />
                      <span className="font-medium">{asset.location.building}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-slate-500" />
                      <span className="font-medium">{asset.location.floor} • {asset.location.room}</span>
                    </div>
                  </>
                )}
                {asset.project && (
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-500" />
                    <span className="font-medium">{asset.project.projectName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Priority and Actions */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <Badge variant={priorityInfo.variant} className={`${priorityInfo.color} ${priorityInfo.bgColor} border-0 font-bold px-3 py-1 text-xs`}>
                {asset.priority}
              </Badge>
              
              {/* Digital Assets Icons - Clickable */}
              <div className="flex items-center gap-2">
                {asset.digitalAssets?.qrCode && (
                  <button 
                    onClick={() => showDigitalAssetModal(asset, 'qrCode')}
                    className="w-8 h-8 bg-blue-100 hover:bg-blue-200 rounded-lg flex items-center justify-center border border-blue-200 cursor-pointer transition-colors duration-200 hover:scale-110"
                    title="Click to view QR Code"
                  >
                    <QrCode className="w-4 h-4 text-blue-600" />
                  </button>
                )}
                {asset.digitalAssets?.barcode && (
                  <button 
                    onClick={() => showDigitalAssetModal(asset, 'barcode')}
                    className="w-8 h-8 bg-green-100 hover:bg-green-200 rounded-lg flex items-center justify-center border border-green-200 cursor-pointer transition-colors duration-200 hover:scale-110"
                    title="Click to view Barcode"
                  >
                    <Barcode className="w-4 h-4 text-green-600" />
                  </button>
                )}
                {asset.digitalAssets?.nfcData && (
                  <button 
                    onClick={() => showDigitalAssetModal(asset, 'nfcData')}
                    className="w-8 h-8 bg-purple-100 hover:bg-purple-200 rounded-lg flex items-center justify-center border border-purple-200 cursor-pointer transition-colors duration-200 hover:scale-110"
                    title="Click to view NFC Data"
                  >
                    <Smartphone className="w-4 h-4 text-purple-600" />
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowDetails(true)}
                  className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                >
                  <Eye className="w-4 h-4 text-blue-600" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => downloadAssetInfo(asset)}
                  className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600 rounded-lg"
                >
                  <Download className="w-4 h-4 text-green-600" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowMoreOptions(asset._id)}
                  className="h-8 w-8 p-0 hover:bg-purple-50 hover:text-purple-600 rounded-lg"
                >
                  <MoreHorizontal className="w-4 h-4 text-purple-600" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Details Modal - Same as AssetCard */}
        {showDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Tag className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{asset.tagId} Details</h3>
                    <p className="text-sm text-slate-600">Complete asset information and digital assets</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(false)}
                  className="h-8 w-8 p-0 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                {/* Basic Info Grid */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wide">Asset Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-500">Type:</span>
                        <span className="font-medium">{asset.assetType}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-500">Brand:</span>
                        <span className="font-medium">{asset.brand}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-500">Model:</span>
                        <span className="font-medium">{asset.model}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-500">Status:</span>
                        <span className="font-medium">{asset.status}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-500">Priority:</span>
                        <span className="font-medium">{asset.priority}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wide">Location Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-500">Building:</span>
                        <span className="font-medium">{asset.location.building}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-500">Floor:</span>
                        <span className="font-medium">{asset.location.floor}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-500">Room:</span>
                        <span className="font-medium">{asset.location.room}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-500">Coordinates:</span>
                        <span className="font-medium text-xs">{asset.location.latitude}, {asset.location.longitude}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Digital Assets Section */}
                <div className="space-y-6">
                  <h4 className="font-semibold text-slate-900 text-lg border-b border-slate-200 pb-2">Digital Assets</h4>
                  
                  {/* QR Code */}
                  {asset.digitalAssets?.qrCode && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                          <QrCode className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h5 className="text-lg font-semibold text-blue-800">QR Code</h5>
                          <p className="text-sm text-blue-600">Scan to access asset information</p>
                        </div>
                      </div>
                      <div className="flex justify-center">
                        <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-lg">
                          {qrImgSrc ? (
                            <div className="relative">
                              <img 
                                src={qrImgSrc}
                                alt="QR Code" 
                                className="w-48 h-48 object-contain rounded-lg"
                                onLoad={() => setQrLoading(false)}
                                onError={handleQrError}
                              />
                              {qrLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                                  <div className="text-sm text-slate-500">Loading...</div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-48 h-48 flex items-center justify-center bg-slate-100 rounded-lg border-2 border-dashed border-slate-300">
                              <div className="text-center">
                                <QrCode className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                                <p className="text-sm text-slate-500">No QR Code</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Barcode */}
                  {asset.digitalAssets?.barcode && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                          <Barcode className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h5 className="text-lg font-semibold text-green-800">Barcode</h5>
                          <p className="text-sm text-green-600">Machine-readable asset identifier</p>
                        </div>
                      </div>
                      <div className="flex justify-center">
                        <div className="bg-white rounded-xl p-4 border border-green-200 shadow-lg">
                          {barcodeImgSrc ? (
                            <div className="relative">
                              <img 
                                src={barcodeImgSrc}
                                alt="Barcode" 
                                className="w-64 h-24 sm:w-80 sm:h-32 object-contain rounded-lg"
                                onLoad={() => setBarcodeLoading(false)}
                                onError={handleBarcodeError}
                              />
                              {barcodeLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                                  <div className="text-sm text-slate-500">Loading...</div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-64 h-24 sm:w-80 sm:h-32 flex items-center justify-center bg-slate-100 rounded-lg border-2 border-dashed border-slate-300">
                              <div className="text-center">
                                <Barcode className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                <p className="text-sm text-slate-500">No Barcode</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NFC Data */}
                  {asset.digitalAssets?.nfcData && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h5 className="text-lg font-semibold text-purple-800">NFC Data</h5>
                          <p className="text-sm text-purple-600">Near-field communication data</p>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-purple-200 shadow-lg">
                        <div className="text-center mb-4">
                          <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Smartphone className="w-8 h-8 text-purple-600" />
                          </div>
                          <p className="text-sm font-medium text-purple-700">NFC Data Available</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                          <div className="text-xs text-purple-600 mb-2 font-medium">Asset ID:</div>
                          <div className="text-lg font-mono text-purple-800 text-center font-bold bg-white rounded px-3 py-2 border border-purple-200">
                            {asset.digitalAssets.nfcData.data?.id || 'NFC Data'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* More Options Modal - Same as AssetCard */}
        {showMoreOptions === asset._id && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">More Options</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMoreOptions(null)}
                  className="h-8 w-8 p-0 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-4 space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowMoreOptions(null)
                    setShowDetails(true)
                  }}
                  className="w-full justify-start h-10 text-slate-700 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Eye className="w-4 h-4 mr-3" />
                  View Details
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowMoreOptions(null)
                    downloadAssetInfo(asset)
                  }}
                  className="w-full justify-start h-10 text-slate-700 hover:bg-green-50 hover:text-green-600"
                >
                  <Download className="w-4 h-4 mr-3" />
                  Download Info
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 font-sans">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-400 rounded-full animate-spin" style={{ animationDelay: '0.5s' }}></div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">Loading Assets</h3>
              <p className="text-gray-600 font-medium">Fetching your facility assets...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 font-sans">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-6 text-center max-w-md">
            <div className="relative">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-red-500" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
                {error.includes('Authentication') ? 'Authentication Required' : 'Error Loading Assets'}
              </h3>
              <p className="text-gray-600 mb-6 text-lg font-medium">{error}</p>
              <div className="flex gap-3 justify-center">
                {error.includes('Authentication') ? (
                  <Button onClick={() => window.location.href = '/login'} size="lg" className="px-8 font-semibold">
                    <Users className="w-4 h-4 mr-2" />
                    Go to Login
                  </Button>
                ) : (
                  <Button onClick={fetchAssets} variant="outline" size="lg" className="px-8 font-semibold">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-background to-muted">
      <div className="flex-1 overflow-auto">
        {/* Enhanced Header - Mobile Responsive */}
        <header className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 border-b border-border px-3 sm:px-6 py-4 sm:py-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Building className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                  Asset Management
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-1 hidden sm:block">
                  Manage facility assets with advanced scanning capabilities
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
              <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-700 dark:text-green-300 font-medium">Live</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 sm:p-8 space-y-6 sm:space-y-8">
          {isLoading && assets.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Loading Assets</h2>
                  <p className="text-sm text-muted-foreground">Please wait while we fetch your data...</p>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Error Loading Assets</h2>
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <Button 
                    onClick={fetchAssets}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Enhanced Header Section */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-950/20 rounded-full">
                      <Building className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        {filteredAssets.length} Assets
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-950/20 rounded-full">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        {assets.filter(a => a.status === 'active').length} Active
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Manage your facility assets with scanning capabilities
                  </p>
                </div>
                              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={fetchAssets}
                  disabled={isLoading}
                  className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-xs sm:text-sm"
                >
                  <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden md:inline">Refresh</span>
                </Button>
                
                {/* View Mode Toggle - Mobile Responsive */}
                <div className="flex items-center bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-md font-medium p-1.5 sm:p-2"
                  >
                    <Grid3X3 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-md font-medium p-1.5 sm:p-2"
                  >
                    <List className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
                
                <Button 
                  size="sm"
                  onClick={() => setShowScanner(true)}
                  className="flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-xs sm:text-sm px-2 sm:px-3"
                >
                  <Scan className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Scan QR</span>
                  <span className="sm:hidden">Scan</span>
                </Button>
              </div>
              </div>

              {/* Enhanced Search and Filter Container - Mobile Responsive */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    {/* Search Section */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-4">
                      <div className="w-full">
                        <Label className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">Search Assets</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                          <Input
                            placeholder="Search by ID, type, brand..."
                            className="pl-8 sm:pl-10 h-9 sm:h-11 text-xs sm:text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Search Results Info - Mobile Responsive */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Building className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-xs sm:text-sm">
                          {filteredAssets.length} of {assets.length} assets
                          {searchTerm && (
                            <span className="hidden sm:inline"> matching "{searchTerm}"</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs sm:text-sm">Real-time</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Assets Display */}
              {filteredAssets.length === 0 ? (
                <Card className="shadow-lg bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl">
                  <CardContent className="p-12 text-center">
                    <div className="flex flex-col items-center gap-6">
                      <div className="w-20 h-20 bg-gradient-to-r from-slate-100 to-blue-100 rounded-full flex items-center justify-center">
                        <Search className="h-10 w-10 text-slate-400" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-2xl font-bold text-slate-900">
                          No assets found
                        </h3>
                        <p className="text-slate-600 text-base max-w-md">
                          Try adjusting your search or filter criteria
                        </p>
                        <Button 
                          onClick={() => {
                            setSearchTerm('')
                            // setSelectedStatus('all') // Removed filter
                            // setSelectedPriority('all') // Removed filter
                            // setSelectedBuilding('all') // Removed filter
                          }}
                          variant="outline"
                          size="sm"
                          className="border-slate-300 text-slate-700 hover:bg-slate-50 font-medium px-6 py-2 rounded-lg"
                        >
                          Clear All Filters
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className={viewMode === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6'
                  : 'space-y-3 sm:space-y-4'
                }>
                  {filteredAssets.map((asset) => (
                    viewMode === 'grid' 
                      ? <AssetCard key={asset._id} asset={asset} />
                      : <AssetListItem key={asset._id} asset={asset} />
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Digital Asset Modal */}
      {digitalAssetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md sm:max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className={`px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 flex items-center justify-between ${
              digitalAssetModal.type === 'qrCode' ? 'bg-gradient-to-r from-blue-50 to-indigo-50' :
              digitalAssetModal.type === 'barcode' ? 'bg-gradient-to-r from-green-50 to-emerald-50' :
              'bg-gradient-to-r from-purple-50 to-pink-50'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${
                  digitalAssetModal.type === 'qrCode' ? 'bg-gradient-to-br from-blue-500 to-indigo-500' :
                  digitalAssetModal.type === 'barcode' ? 'bg-gradient-to-br from-green-500 to-emerald-500' :
                  'bg-gradient-to-br from-purple-500 to-pink-500'
                }`}>
                  {digitalAssetModal.type === 'qrCode' && <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
                  {digitalAssetModal.type === 'barcode' && <Barcode className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
                  {digitalAssetModal.type === 'nfcData' && <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                    {digitalAssetModal.type === 'qrCode' ? 'QR Code' :
                     digitalAssetModal.type === 'barcode' ? 'Barcode' : 'NFC Data'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600">
                    {digitalAssetModal.asset.tagId} • {digitalAssetModal.asset.assetType}
                  </p>
                </div>
              </div>
                              <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Cleanup blob URLs before closing
                    if (modalQrImgSrc && modalQrImgSrc.startsWith('blob:')) {
                      URL.revokeObjectURL(modalQrImgSrc)
                    }
                    if (modalBarcodeImgSrc && modalBarcodeImgSrc.startsWith('blob:')) {
                      URL.revokeObjectURL(modalBarcodeImgSrc)
                    }
                    setModalQrImgSrc(null)
                    setModalBarcodeImgSrc(null)
                    setDigitalAssetModal(null)
                  }}
                  className="h-8 w-8 p-0 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </Button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Asset Info */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Asset ID:</span>
                    <span className="ml-2 font-medium">{digitalAssetModal.asset.tagId}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Type:</span>
                    <span className="ml-2 font-medium">{digitalAssetModal.asset.assetType}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Brand:</span>
                    <span className="ml-2 font-medium">{digitalAssetModal.asset.brand}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Model:</span>
                    <span className="ml-2 font-medium">{digitalAssetModal.asset.model}</span>
                  </div>
                </div>
              </div>

              {/* Digital Asset Display */}
              {digitalAssetModal.type === 'qrCode' && digitalAssetModal.asset.digitalAssets?.qrCode && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-900 text-lg border-b border-slate-200 pb-2">QR Code</h4>
                  <div className="flex justify-center">
                    <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-lg">
                      {modalQrImgSrc ? (
                        <div className="relative">
                          <img 
                            src={modalQrImgSrc}
                            alt="QR Code" 
                            className="w-48 h-48 sm:w-64 sm:h-64 object-contain rounded-lg"
                            onLoad={() => console.log('Modal QR Code loaded successfully')}
                            onError={() => {
                              console.log('Modal QR Code failed to display')
                              setModalQrImgSrc(null)
                            }}
                          />
                          {modalQrLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                              <div className="text-center">
                                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                <div className="text-sm text-blue-600">Loading QR Code...</div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center bg-slate-100 rounded-lg border-2 border-dashed border-slate-300">
                          <div className="text-center">
                            {modalQrLoading ? (
                              <>
                                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                <p className="text-sm text-blue-600">Loading QR Code...</p>
                              </>
                            ) : (
                              <>
                                <QrCode className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                                <p className="text-sm text-slate-500">QR Code not available</p>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {digitalAssetModal.asset.digitalAssets.qrCode.data && (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <div className="text-xs text-blue-600 mb-2 font-medium">QR Code Information:</div>
                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white rounded px-3 py-2 border border-blue-200">
                            <span className="text-blue-600 font-medium">Asset ID:</span>
                            <span className="ml-2 font-semibold">{digitalAssetModal.asset.digitalAssets.qrCode.data.t || 'N/A'}</span>
                          </div>
                          <div className="bg-white rounded px-3 py-2 border border-blue-200">
                            <span className="text-blue-600 font-medium">Type:</span>
                            <span className="ml-2 font-semibold">{digitalAssetModal.asset.digitalAssets.qrCode.data.a || 'N/A'}</span>
                          </div>
                          <div className="bg-white rounded px-3 py-2 border border-blue-200">
                            <span className="text-blue-600 font-medium">Subcategory:</span>
                            <span className="ml-2 font-semibold">{digitalAssetModal.asset.digitalAssets.qrCode.data.s || 'N/A'}</span>
                          </div>
                          <div className="bg-white rounded px-3 py-2 border border-blue-200">
                            <span className="text-blue-600 font-medium">Brand:</span>
                            <span className="ml-2 font-semibold">{digitalAssetModal.asset.digitalAssets.qrCode.data.b || 'N/A'}</span>
                          </div>
                          <div className="bg-white rounded px-3 py-2 border border-blue-200">
                            <span className="text-blue-600 font-medium">Model:</span>
                            <span className="ml-2 font-semibold">{digitalAssetModal.asset.digitalAssets.qrCode.data.m || 'N/A'}</span>
                          </div>
                          <div className="bg-white rounded px-3 py-2 border border-blue-200">
                            <span className="text-blue-600 font-medium">Status:</span>
                            <span className="ml-2 font-semibold capitalize">{digitalAssetModal.asset.digitalAssets.qrCode.data.st || 'N/A'}</span>
                          </div>
                          <div className="bg-white rounded px-3 py-2 border border-blue-200">
                            <span className="text-blue-600 font-medium">Priority:</span>
                            <span className="ml-2 font-semibold capitalize">{digitalAssetModal.asset.digitalAssets.qrCode.data.p || 'N/A'}</span>
                          </div>
                          <div className="bg-white rounded px-3 py-2 border border-blue-200">
                            <span className="text-blue-600 font-medium">Assigned To:</span>
                            <span className="ml-2 font-semibold">{digitalAssetModal.asset.digitalAssets.qrCode.data.u || 'N/A'}</span>
                          </div>
                        </div>
                        
                        {/* Location Information */}
                        {digitalAssetModal.asset.digitalAssets.qrCode.data.l && (
                          <div className="bg-white rounded px-3 py-2 border border-blue-200">
                            <div className="text-blue-600 font-medium mb-2">Location:</div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-slate-500">Building:</span>
                                <span className="ml-2 font-medium">{digitalAssetModal.asset.digitalAssets.qrCode.data.l.building || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-slate-500">Floor:</span>
                                <span className="ml-2 font-medium">{digitalAssetModal.asset.digitalAssets.qrCode.data.l.floor || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-slate-500">Room:</span>
                                <span className="ml-2 font-medium">{digitalAssetModal.asset.digitalAssets.qrCode.data.l.room || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-slate-500">Coordinates:</span>
                                <span className="ml-2 font-medium">
                                  {digitalAssetModal.asset.digitalAssets.qrCode.data.l.latitude}, {digitalAssetModal.asset.digitalAssets.qrCode.data.l.longitude}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {digitalAssetModal.type === 'barcode' && digitalAssetModal.asset.digitalAssets?.barcode && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-900 text-lg border-b border-slate-200 pb-2">Barcode</h4>
                  <div className="flex justify-center">
                    <div className="bg-white rounded-xl p-4 border border-green-200 shadow-lg">
                      {modalBarcodeImgSrc ? (
                        <div className="relative">
                          <img 
                            src={modalBarcodeImgSrc}
                            alt="Barcode" 
                            className="w-64 h-24 sm:w-80 sm:h-32 object-contain rounded-lg"
                            onLoad={() => console.log('Modal Barcode loaded successfully')}
                            onError={() => {
                              console.log('Modal Barcode failed to display')
                              setModalBarcodeImgSrc(null)
                            }}
                          />
                          {modalBarcodeLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                              <div className="text-center">
                                <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                <div className="text-sm text-green-600">Loading Barcode...</div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-64 h-24 sm:w-80 sm:h-32 flex items-center justify-center bg-slate-100 rounded-lg border-2 border-dashed border-slate-300">
                          <div className="text-center">
                            {modalBarcodeLoading ? (
                              <>
                                <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                <p className="text-sm text-green-600">Loading Barcode...</p>
                              </>
                            ) : (
                              <>
                                <Barcode className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                <p className="text-sm text-slate-500">Barcode not available</p>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {digitalAssetModal.asset.digitalAssets.barcode.data && (
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <div className="text-xs text-green-600 mb-2 font-medium">Barcode Information:</div>
                      <div className="bg-white rounded px-3 py-2 border border-green-200">
                        <div className="text-sm font-semibold text-green-800 text-center">
                          {digitalAssetModal.asset.digitalAssets.barcode.data}
                        </div>
                        <div className="text-xs text-green-600 text-center mt-1">
                          Scan this barcode to access asset information
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {digitalAssetModal.type === 'nfcData' && digitalAssetModal.asset.digitalAssets?.nfcData && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-900 text-lg border-b border-slate-200 pb-2">NFC Data</h4>
                  <div className="bg-white rounded-xl p-4 border border-purple-200 shadow-lg">
                    <div className="text-center mb-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Smartphone className="w-8 h-8 text-purple-600" />
                      </div>
                      <p className="text-sm font-medium text-purple-700">NFC Data Available</p>
                    </div>
                    {digitalAssetModal.asset.digitalAssets.nfcData.data && (
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                        <div className="text-xs text-purple-600 mb-3 font-medium">NFC Information:</div>
                        <div className="space-y-3">
                          {/* Basic Details */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white rounded px-3 py-2 border border-purple-200">
                              <span className="text-purple-600 font-medium text-xs">Type:</span>
                              <span className="ml-2 font-semibold text-sm capitalize">{digitalAssetModal.asset.digitalAssets.nfcData.data.type || 'N/A'}</span>
                            </div>
                            <div className="bg-white rounded px-3 py-2 border border-purple-200">
                              <span className="text-purple-600 font-medium text-xs">ID:</span>
                              <span className="ml-2 font-semibold text-sm">{digitalAssetModal.asset.digitalAssets.nfcData.data.id || 'N/A'}</span>
                            </div>
                            <div className="bg-white rounded px-3 py-2 border border-purple-200">
                              <span className="text-purple-600 font-medium text-xs">Asset Type:</span>
                              <span className="ml-2 font-semibold text-sm">{digitalAssetModal.asset.digitalAssets.nfcData.data.assetType || 'N/A'}</span>
                            </div>
                            <div className="bg-white rounded px-3 py-2 border border-purple-200">
                              <span className="text-purple-600 font-medium text-xs">Subcategory:</span>
                              <span className="ml-2 font-semibold text-sm">{digitalAssetModal.asset.digitalAssets.nfcData.data.subcategory || 'N/A'}</span>
                            </div>
                            <div className="bg-white rounded px-3 py-2 border border-purple-200">
                              <span className="text-purple-600 font-medium text-xs">Brand:</span>
                              <span className="ml-2 font-semibold text-sm">{digitalAssetModal.asset.digitalAssets.nfcData.data.brand || 'N/A'}</span>
                            </div>
                            <div className="bg-white rounded px-3 py-2 border border-purple-200">
                              <span className="text-purple-600 font-medium text-xs">Model:</span>
                              <span className="ml-2 font-semibold text-sm">{digitalAssetModal.asset.digitalAssets.nfcData.data.model || 'N/A'}</span>
                            </div>
                            <div className="bg-white rounded px-3 py-2 border border-purple-200">
                              <span className="text-purple-600 font-medium text-xs">Status:</span>
                              <span className="ml-2 font-semibold text-sm capitalize">{digitalAssetModal.asset.digitalAssets.nfcData.data.status || 'N/A'}</span>
                            </div>
                            <div className="bg-white rounded px-3 py-2 border border-purple-200">
                              <span className="text-purple-600 font-medium text-xs">Priority:</span>
                              <span className="ml-2 font-semibold text-sm capitalize">{digitalAssetModal.asset.digitalAssets.nfcData.data.priority || 'N/A'}</span>
                            </div>
                          </div>
                          
                          {/* Location Information */}
                          {digitalAssetModal.asset.digitalAssets.nfcData.data.location && (
                            <div className="bg-white rounded px-3 py-2 border border-purple-200">
                              <div className="text-purple-600 font-medium text-xs mb-2">Location:</div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-slate-500">Building:</span>
                                  <span className="ml-2 font-medium">{digitalAssetModal.asset.digitalAssets.nfcData.data.location.building || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500">Floor:</span>
                                  <span className="ml-2 font-medium">{digitalAssetModal.asset.digitalAssets.nfcData.data.location.floor || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500">Room:</span>
                                  <span className="ml-2 font-medium">{digitalAssetModal.asset.digitalAssets.nfcData.data.location.room || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500">Coordinates:</span>
                                  <span className="ml-2 font-medium">
                                    {digitalAssetModal.asset.digitalAssets.nfcData.data.location.latitude}, {digitalAssetModal.asset.digitalAssets.nfcData.data.location.longitude}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Additional Info */}
                          <div className="bg-white rounded px-3 py-2 border border-purple-200">
                            <div className="text-purple-600 font-medium text-xs mb-2">Additional Information:</div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-slate-500">Assigned To:</span>
                                <span className="ml-2 font-medium">
                          {digitalAssetModal.asset.digitalAssets.nfcData.data.assignedTo || 'N/A'}
                        </span>
                              </div>
                              <div>
                                <span className="text-purple-600 font-medium">Timestamp:</span>
                                <span className="ml-2 font-medium">
                                  {digitalAssetModal.asset.digitalAssets.nfcData.data.timestamp ? 
                                    new Date(digitalAssetModal.asset.digitalAssets.nfcData.data.timestamp).toLocaleString() : 'N/A'
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200">
                <Button
                  onClick={() => {
                    setDigitalAssetModal(null)
                    setScannedAsset(digitalAssetModal.asset)
                    setShowScannedAssetModal(true)
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Full Asset Details
                </Button>
                <Button
                  variant="outline"
                  onClick={() => downloadAssetInfo(digitalAssetModal.asset)}
                  className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Asset Info
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scanned Asset Details Modal */}
      {showScannedAssetModal && scannedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md sm:max-w-2xl lg:max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">Asset Found!</h3>
                  <p className="text-xs sm:text-sm text-slate-600">Scanned QR code details</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowScannedAssetModal(false)}
                className="h-8 w-8 p-0 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Asset Header */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 sm:p-6 border border-green-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Tag className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl sm:text-2xl font-bold text-green-800 mb-1">{scannedAsset.tagId}</h2>
                    <p className="text-sm sm:text-base text-green-600 font-medium">{scannedAsset.assetType}</p>
                    <p className="text-xs sm:text-sm text-green-600">{scannedAsset.brand} • {scannedAsset.model}</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-full border border-green-300">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-bold text-green-700 capitalize">{scannedAsset.status}</span>
                  </div>
                </div>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wide">Asset Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">Priority:</span>
                      <span className="font-medium text-slate-900 capitalize">{scannedAsset.priority}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">Assigned To:</span>
                      <span className="font-medium text-slate-900">
                        {typeof scannedAsset.assignedTo === 'string' 
                          ? scannedAsset.assignedTo 
                          : scannedAsset.assignedTo?.name || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wide">Location</h4>
                  <div className="space-y-2 text-sm">
                    {scannedAsset.location ? (
                      <>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-slate-500">Building:</span>
                          <span className="font-medium text-slate-900">{scannedAsset.location.building}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-slate-500">Floor:</span>
                          <span className="font-medium text-slate-900">{scannedAsset.location.floor}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-slate-500">Room:</span>
                          <span className="font-medium text-slate-900">{scannedAsset.location.room}</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4 text-slate-500">
                        <span>Location information not available</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200">
                <Button
                  onClick={() => {
                    setShowScannedAssetModal(false)
                    setScannedAsset(prev => prev)
                    setShowScannedAssetModal(false)
                    // Find and show detailed modal for this asset
                    const assetCard = document.querySelector(`[data-asset-id="${scannedAsset._id}"]`)
                    if (assetCard) {
                      // Trigger the view details for this asset
                      console.log('Show detailed view for:', scannedAsset.tagId)
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Full Details
                </Button>
                <Button
                  variant="outline"
                  onClick={() => downloadAssetInfo(scannedAsset)}
                  className="flex-1 border-green-300 text-green-700 hover:bg-green-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Info
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scanner Modal - Mobile Responsive */}
      {showScanner && (
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
                onClick={closeScanner}
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
                          <Button 
                            onClick={() => setShowUploadModal(true)}
                            variant="outline"
                            className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50"
                          >
                            <ImageIcon className="w-4 h-4 mr-2" />
                            Upload Instead
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
                      onClick={() => setScannedResult(null)}
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
      )}

      {/* Beautiful Success Modal for Upload Scanner */}
      {showSuccessModal && successAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-t-2xl px-6 py-4 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">Asset Found! 🎉</h2>
              <p className="text-green-100 font-medium">Scanner successfully identified asset</p>
            </div>

            {/* Asset Details */}
            <div className="p-6 space-y-4">
              {/* Asset ID Badge */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-200">
                  <Tag className="w-4 h-4 text-blue-600" />
                  <span className="text-lg font-bold text-blue-800">{successAsset.tagId}</span>
                </div>
              </div>

              {/* Asset Information Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <div className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">Type</div>
                  <div className="text-sm font-semibold text-slate-900">{successAsset.assetType}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <div className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">Brand</div>
                  <div className="text-sm font-semibold text-slate-900">{successAsset.brand}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <div className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">Model</div>
                  <div className="text-sm font-semibold text-slate-900">{successAsset.model}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <div className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">Status</div>
                  <div className="text-sm font-semibold text-slate-900 capitalize">{successAsset.status}</div>
                </div>
              </div>

              {/* Location Info */}
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-blue-600 uppercase tracking-wide font-medium">Location</span>
                </div>
                {successAsset.location ? (
                  <div className="text-sm text-blue-800">
                    <div className="font-medium">{successAsset.location.building}</div>
                    <div className="text-blue-600">{successAsset.location.floor} • {successAsset.location.room}</div>
                  </div>
                ) : (
                  <div className="text-sm text-blue-800 text-center">
                    <div className="text-blue-600">Location information not available</div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-6 pb-6 space-y-3">
              <Button
                onClick={() => {
                  setShowSuccessModal(false)
                  setSuccessAsset(null)
                  // Show detailed modal
                  setScannedAsset(successAsset)
                  setShowScannedAssetModal(true)
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Full Details
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowSuccessModal(false)
                  setSuccessAsset(null)
                }}
                className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 py-3 rounded-xl font-medium"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
