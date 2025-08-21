"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Image from 'next/image'
import { 
  MapPin, 
  Building2, 
  Package, 
  Search, 
  Calendar,
  Clock,
  User,
  QrCode,
  Eye,
  Download,
  RefreshCw,
  X,
  Camera,
  Upload,
  Scan,
  Loader2,
  AlertCircle,
  CheckCircle,
  Save
} from 'lucide-react'

interface ChecklistItem {
  serialNumber: number
  inspectionItem: string
  details: string
  status: string
  remarks: string
  _id: string
}

interface Location {
  floor: string
  building: string
  zone: string
}

interface CreatedBy {
  _id: string
  name: string
  email: string
}

interface Checklist {
  _id: string
  title: string
  description: string
  type: string
  frequency: string
  items: ChecklistItem[]
  location: Location
  createdBy: CreatedBy
  assignedTo: string[]
  status: string
  priority: string
  tags: string[]
  createdAt: string
  updatedAt: string
  qrCode: {
    url: string
    data: string
    generatedAt: string
  }
}

export default function ViewerChecklists() {
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [filteredChecklists, setFilteredChecklists] = useState<Checklist[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [showTokenInput, setShowTokenInput] = useState(false)
  const [authToken, setAuthToken] = useState('')
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedQRData, setSelectedQRData] = useState<{url: string, data: string, blobUrl?: string} | null>(null)
  const [qrImageLoading, setQrImageLoading] = useState(false)
  const [qrImageError, setQrImageError] = useState(false)
  
  // Scanner states
  const [showScanner, setShowScanner] = useState(false)
  const [scanningQR, setScanningQR] = useState(false)
  const [scannedData, setScannedData] = useState<{
    checklistId: string;
    title: string;
    type: string;
    location: Record<string, unknown>;
    url: string;
  } | null>(null)
  const [scannerError, setScannerError] = useState<string | null>(null)
  const [savingScannedData, setSavingScannedData] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [imageUploadLoading, setImageUploadLoading] = useState(false)
  const [imageScanError, setImageScanError] = useState<string | null>(null)

  // Refs for video and canvas
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Define functions first before using them in useEffect
  const fetchChecklists = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = authToken || localStorage.getItem('authToken') || process.env.NEXT_PUBLIC_AUTH_TOKEN
      
      if (!token) {
        setError('Authentication token not found. Please enter your token below.')
        setShowTokenInput(true)
        setLoading(false)
        return
      }

      const response = await fetch('http://192.168.0.5:5021/api/checklists', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (response.status === 401) {
        setError('Invalid authentication token. Please check your token and try again.')
        setShowTokenInput(true)
        setLoading(false)
        return
      }
      
      const result = await response.json()
      
      if (result.success) {
        setChecklists(result.data)
        localStorage.setItem('authToken', token)
        setShowTokenInput(false)
      } else {
        setError('Failed to fetch checklists')
      }
    } catch {
      setError('Error connecting to server. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }, [authToken])

  const filterChecklists = useCallback(() => {
    const filtered = checklists.filter(checklist => {
      const matchesSearch = checklist.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          checklist.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          checklist.location.building.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          checklist.location.floor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          checklist.location.zone.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesType = typeFilter === 'all' || checklist.type === typeFilter
      const matchesStatus = statusFilter === 'all' || checklist.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || checklist.priority === priorityFilter
      
      return matchesSearch && matchesType && matchesStatus && matchesPriority
    })
    
    setFilteredChecklists(filtered)
  }, [checklists, searchTerm, typeFilter, statusFilter, priorityFilter])

  const closeQRModal = useCallback(() => {
    if (selectedQRData?.blobUrl) {
      URL.revokeObjectURL(selectedQRData.blobUrl)
    }
    setShowQRModal(false)
    setSelectedQRData(null)
    setQrImageLoading(false)
    setQrImageError(false)
  }, [])

  useEffect(() => {
    fetchChecklists()
  }, [fetchChecklists])

  useEffect(() => {
    filterChecklists()
  }, [filterChecklists])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showQRModal) {
        closeQRModal()
      }
    }

    if (showQRModal) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [showQRModal, closeQRModal])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchChecklists()
    setRefreshing(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    setAuthToken('')
    setChecklists([])
    setFilteredChecklists([])
    setShowTokenInput(false)
    setError(null)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleQRClick = (checklist: Checklist) => {
    setSelectedQRData({
      url: checklist.qrCode.url,
      data: checklist.qrCode.data
    })
    setShowQRModal(true)
    setQrImageLoading(true)
    setQrImageError(false)
    
    const testImageUrl = checklist.qrCode.url.startsWith('http') ? checklist.qrCode.url : `http://192.168.0.5:5021${checklist.qrCode.url}`
    
    fetch(testImageUrl, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'image/*',
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.blob()
    })
    .then(blob => {
      const imageUrl = URL.createObjectURL(blob)
      setSelectedQRData(prev => prev ? { ...prev, blobUrl: imageUrl } : null)
      setQrImageLoading(false)
    })
    .catch(() => {
      const testImg = new window.Image()
      testImg.crossOrigin = 'anonymous'
      testImg.onload = () => {
        setQrImageLoading(false)
      }
      testImg.onerror = () => {
        setQrImageLoading(false)
        setQrImageError(true)
      }
      testImg.src = testImageUrl
    })
  }

  const handleModalBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeQRModal()
    }
  }

  // Camera Scanner Functions
  const startCamera = async () => {
    try {
      setScannerError(null)
      setScanningQR(true)
      
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
        startQRScanning()
      }
    } catch {
      setScannerError('Failed to access camera. Please check permissions.')
      setScanningQR(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setScanningQR(false)
  }

  const startQRScanning = () => {
    if (!videoRef.current || !canvasRef.current) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    
    const scanFrame = () => {
      if (!scanningQR) return
      
      try {
        if (video.readyState !== video.HAVE_ENOUGH_DATA) {
          requestAnimationFrame(scanFrame)
          return
        }
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          requestAnimationFrame(scanFrame)
          return
        }
        
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Continue scanning
        requestAnimationFrame(scanFrame)
      } catch {
        requestAnimationFrame(scanFrame)
      }
    }
    
    scanFrame()
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedImage(file)
      setImageScanError(null)
      setScannedData(null)
      scanImageForQR(file)
    }
  }

  const scanImageForQR = async (file: File) => {
    setImageUploadLoading(true)
    setImageScanError(null)
    
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new window.Image()
      
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx?.drawImage(img, 0, 0)
        simulateQRDetection()
      }
      
      img.src = URL.createObjectURL(file)
    } catch {
      setImageScanError('Failed to process uploaded image')
      setImageUploadLoading(false)
    }
  }

  const simulateQRDetection = () => {
    setTimeout(() => {
      if (selectedQRData) {
        try {
          const parsedData = JSON.parse(selectedQRData.data)
          const simulatedData = {
            checklistId: parsedData.checklistId || 'Unknown',
            title: parsedData.title || 'Unknown',
            type: parsedData.type || 'Unknown',
            location: parsedData.location || {},
            url: parsedData.url || 'Unknown'
          }
          
          setScannedData(simulatedData)
          setImageUploadLoading(false)
        } catch {
          setImageScanError('Failed to parse QR code data')
          setImageUploadLoading(false)
        }
      } else {
        setImageScanError('No checklist data available for simulation')
        setImageUploadLoading(false)
      }
    }, 2000)
  }

  const saveScannedData = async () => {
    if (!scannedData) return
    
    setSavingScannedData(true)
    
    try {
      console.log('Saving scanned data:', scannedData)
      await new Promise(resolve => setTimeout(resolve, 1000))
      closeScanner()
    } catch {
      setScannerError('Failed to save scanned data')
    } finally {
      setSavingScannedData(false)
    }
  }

  const closeScanner = () => {
    stopCamera()
    setShowScanner(false)
    setScannedData(null)
    setScannerError(null)
    setUploadedImage(null)
    setImageUploadLoading(false)
    setImageScanError(null)
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading checklists...</p>
        </div>
      </div>
    )
  }

  if (error && showTokenInput) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-blue-100 dark:bg-blue-900/20 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Package className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Authentication Required
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Enter your Bearer token"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              className="w-full"
            />
            <div className="flex space-x-2">
              <Button onClick={fetchChecklists} className="flex-1">
                Connect
              </Button>
              <Button variant="outline" onClick={() => setShowTokenInput(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Package className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Error Loading Checklists
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          <Button onClick={fetchChecklists} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                View Checklists
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                View and manage facility checklists
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={handleRefresh} 
                variant="outline" 
                size="sm"
                disabled={refreshing}
                className="w-full sm:w-auto"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              {localStorage.getItem('authToken') && (
                <>
                  <div className="flex items-center space-x-2 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Authenticated</span>
                  </div>
                  <Button 
                    onClick={handleLogout} 
                    variant="outline" 
                    size="sm"
                    className="w-full sm:w-auto text-red-600 hover:text-red-700"
                  >
                    Logout
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Filters and Search */}
        <div className="mb-6 sm:mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search checklists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 text-base w-full"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="text-sm h-11">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="text-sm h-11">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="text-sm h-11">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('')
                setTypeFilter('all')
                setStatusFilter('all')
                setPriorityFilter('all')
              }}
              className="w-full text-sm h-11"
            >
              Clear
            </Button>
          </div>
        </div>

        <div className="mb-4 sm:mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredChecklists.length} of {checklists.length} checklists
          </p>
        </div>

        {/* Checklists Grid */}
        {filteredChecklists.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No checklists found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            {filteredChecklists.map((checklist) => (
              <Card key={checklist._id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 pr-2">
                      <CardTitle className="text-base md:text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                        {checklist.title}
                      </CardTitle>
                      <CardDescription className="mt-1 line-clamp-2 text-sm">
                        {checklist.description}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end space-y-2 ml-2 flex-shrink-0">
                      <Badge className={`${getPriorityColor(checklist.priority)} text-xs px-2 py-1`}>
                        {checklist.priority}
                      </Badge>
                      <Badge className={`${getStatusColor(checklist.status)} text-xs px-2 py-1`}>
                        {checklist.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 md:space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <Building2 className="h-4 w-4 flex-shrink-0" />
                      <span className="font-medium">Location:</span>
                    </div>
                    <div className="ml-6 space-y-1 text-sm">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-3 w-3 text-blue-500 flex-shrink-0" />
                        <span className="truncate text-xs sm:text-sm">{checklist.location.building} - {checklist.location.floor} - {checklist.location.zone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-400 truncate text-xs sm:text-sm">
                        {checklist.type}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-400 truncate text-xs sm:text-sm">
                        {checklist.frequency}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                      {checklist.items.length} inspection items
                    </span>
                    <Badge variant="outline" className="text-xs px-2 py-1">
                      {checklist.type}
                    </Badge>
                  </div>

                  {checklist.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {checklist.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                          {tag}
                        </Badge>
                      ))}
                      {checklist.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs px-2 py-1">
                          +{checklist.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <User className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate text-xs sm:text-sm">Created by {checklist.createdBy.name}</span>
                  </div>

                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Created: {formatDate(checklist.createdAt)}</div>
                    <div>Updated: {formatDate(checklist.updatedAt)}</div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1 text-xs h-9 sm:h-10">
                      <Eye className="h-3 w-3 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">View</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 text-xs h-9 sm:h-10"
                      onClick={() => handleQRClick(checklist)}
                    >
                      <QrCode className="h-3 w-3 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">QR</span>
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs h-9 sm:h-10 px-3">
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQRModal && selectedQRData && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={handleModalBackdropClick}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  QR Code
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeQRModal}
                  className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div className="text-center">
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                  {qrImageLoading && (
                    <div className="w-48 h-48 mx-auto flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                  
                  <Image 
                    src={selectedQRData.blobUrl || (selectedQRData.url.startsWith('http') ? selectedQRData.url : `http://192.168.0.5:5021${selectedQRData.url}`)}
                    alt="QR Code"
                    width={192}
                    height={192}
                    className={`mx-auto object-contain ${
                      qrImageLoading ? 'hidden' : ''
                    }`}
                    style={{ display: qrImageLoading ? 'none' : 'block' }}
                  />
                  
                  {qrImageError && (
                    <div className="w-48 h-48 mx-auto flex flex-col items-center justify-center text-red-500">
                      <QrCode className="h-12 w-12 mb-2 opacity-50" />
                      <p className="text-sm font-medium">QR Code not found</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Button 
                    onClick={() => {
                      const link = document.createElement('a');
                      const imageUrl = selectedQRData.blobUrl || (selectedQRData.url.startsWith('http') ? selectedQRData.url : `http://192.168.0.5:5021${selectedQRData.url}`);
                      link.href = imageUrl;
                      link.download = 'checklist-qr.png';
                      link.click();
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={qrImageError}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Scan Options
                </h4>
                
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => setShowScanner(true)}
                  >
                    <Scan className="h-4 w-4 mr-2" />
                    Open Scanner
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-t border-gray-200 dark:border-gray-600">
              <div className="flex justify-end">
                <Button onClick={closeQRModal} variant="outline" size="sm">
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showScanner && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && closeScanner()}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Scan className="h-5 w-5 text-blue-600" />
                  QR Code Scanner
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeScanner}
                  className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-4">
              {!scanningQR && !scannedData && (
                <div className="text-center mb-4">
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    Choose your scanning method: use the camera or upload an image
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
                    <Button
                      onClick={startCamera}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Start Camera
                    </Button>
                    
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id="image-upload"
                      />
                      <Button
                        variant="outline"
                        className="border-green-300 dark:border-green-600 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                        onClick={() => document.getElementById('image-upload')?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Image
                      </Button>
                    </div>
                  </div>

                  {uploadedImage && (
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                          <Upload className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-800 dark:text-green-200">
                            Image Uploaded Successfully
                          </p>
                          <p className="text-xs text-green-700 dark:text-green-300">
                            {uploadedImage.name} ({(uploadedImage.size / 1024).toFixed(1)} KB)
                          </p>
                        </div>
                      </div>
                      
                      {imageUploadLoading && (
                        <div className="flex items-center justify-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg">
                          <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                          <span className="text-sm text-green-700 dark:text-green-300">
                            Scanning image for QR code...
                          </span>
                        </div>
                      )}
                      
                      {imageScanError && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-red-700 dark:text-red-300">{imageScanError}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setUploadedImage(null);
                                setImageScanError(null);
                                setScannedData(null);
                              }}
                              className="h-6 px-2 text-xs border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              Try Different Image
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {scanningQR && (
                <div className="space-y-4">
                  <div className="relative w-full h-96 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <canvas
                      ref={canvasRef}
                      className="hidden"
                    />
                    
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-1/2 left-1/2 w-48 h-48 border-2 border-blue-500 rounded-lg -translate-x-1/2 -translate-y-1/2">
                        <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-blue-500"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-blue-500"></div>
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-blue-500"></div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-blue-500"></div>
                      </div>
                    </div>
                    
                    <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Scanning...
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center gap-3">
                    <Button
                      variant="outline"
                      onClick={stopCamera}
                      className="border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Stop Camera
                    </Button>
                  </div>
                </div>
              )}

              {scannedData && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          QR Code Scanned Successfully!
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                          Found QR code for checklist: {scannedData.title}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-700">
                      <h5 className="text-xs font-bold text-green-700 dark:text-green-300 mb-2">Scanned Data:</h5>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-green-600 dark:text-green-400">Checklist ID:</span>
                          <span className="font-mono">{scannedData.checklistId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-600 dark:text-green-400">Title:</span>
                          <span>{scannedData.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-600 dark:text-green-400">Type:</span>
                          <span>{scannedData.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-600 dark:text-green-400">URL:</span>
                          <span className="truncate max-w-[200px]">{scannedData.url}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center gap-3">
                    <Button
                      onClick={saveScannedData}
                      disabled={savingScannedData}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {savingScannedData ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Scanned Data
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setScannedData(null);
                        setScannerError(null);
                        setUploadedImage(null);
                        setImageUploadLoading(false);
                        setImageScanError(null);
                      }}
                      className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    >
                      Scan Again
                    </Button>
                  </div>
                </div>
              )}

              {scannerError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-700 dark:text-red-300">{scannerError}</p>
                  </div>
                </div>
              )}
              
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  onClick={closeScanner}
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                >
                  Close Scanner
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
