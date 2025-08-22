"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import Image from 'next/image'

// Import extracted components
import ChecklistViewModal from '@/components/ui/checklist-view-modal'
import { ScannerModal } from '@/components/ui/scanner-modal-component'
import { SuccessModal } from '@/components/ui/success-modal-component'
import { SuccessToast } from '@/components/ui/success-toast'
import { ErrorDisplay } from '@/components/ui/error-display'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { FilterBar } from '@/components/ui/filter-bar'
import { ViewModeToggle } from '@/components/ui/view-mode-toggle'
import { MoreDropdown } from '@/components/ui/more-dropdown'

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
  Save,
  Grid3X3,
  List,
  CheckSquare,
  Filter,
  SortAsc,
  FileText,
  Settings,
  Share2,
  Archive,
  Trash2,
  Edit,
  Copy,
  ExternalLink,
  Info,
  AlertTriangle,
  Shield,
  Target,
  TrendingUp,
  Activity,
  BarChart3,
  PieChart,
  Layers,
  Zap,
  Star,
  Bookmark,
  Tag,
  Hash,
  HashIcon,
  CalendarDays,
  Clock3,
  Building,
  MapPinIcon,
  Users,
  UserCheck,
  UserX,
  CheckCircle2,
  XCircle,
  MinusCircle,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  ChevronLeft,
  MoreHorizontal,
  Plus,
  SearchX,
  FilterX,
  RotateCcw,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  FastForward,
  Rewind,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  PhoneOff,
  Mail,
  MessageSquare,
  Bell,
  BellOff,
  Heart,
  HeartOff,
  ThumbsUp,
  ThumbsDown,
  Smile,
  Frown,
  Meh,
  Laugh,
  Angry,
  MehIcon,
  LaughIcon,
  AngryIcon,
  FrownIcon,
  SmileIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  HeartOffIcon,
  HeartIcon,
  BellOffIcon,
  BellIcon,
  MessageSquareIcon,
  MailIcon,
  PhoneOffIcon,
  PhoneIcon,
  VideoOffIcon,
  VideoIcon,
  MicOffIcon,
  MicIcon,
  VolumeXIcon,
  Volume2Icon,
  RewindIcon,
  FastForwardIcon,
  SkipForwardIcon,
  SkipBackIcon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  FilterXIcon,
  SearchXIcon,
  PlusIcon,
  MoreHorizontalIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  PlusCircleIcon,
  MinusCircleIcon,
  XCircleIcon,
  CheckCircle2Icon,
  UserXIcon,
  UserCheckIcon,
  UsersIcon,
  MapPinIcon as MapPinIconAlias,
  BuildingIcon,
  Clock3Icon,
  CalendarDaysIcon,
  HashIcon as HashIconAlias,
  TagIcon,
  BookmarkIcon,
  StarIcon,
  ZapIcon,
  LayersIcon,
  PieChartIcon,
  BarChart3Icon,
  ActivityIcon,
  TrendingUpIcon,
  TargetIcon,
  ShieldIcon,
  AlertTriangleIcon,
  InfoIcon,
  ExternalLinkIcon,
  CopyIcon,
  EditIcon,
  Trash2Icon,
  ArchiveIcon,
  Share2Icon,
  SettingsIcon,
  FileTextIcon,
  SortAscIcon,
  FilterIcon
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
  status: 'active' | 'completed' | 'archived'
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
  const [showTokenInput, setShowTokenInput] = useState(false)
  const [authToken, setAuthToken] = useState('')
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedQRData, setSelectedQRData] = useState<{url: string, data: string, blobUrl?: string} | null>(null)
  const [qrImageLoading, setQrImageLoading] = useState(false)
  const [qrImageError, setQrImageError] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [isMobile, setIsMobile] = useState(false)
  
  // Modal states
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
  
  // Enhanced modal states
  const [showChecklistViewModal, setShowChecklistViewModal] = useState(false)
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successChecklist, setSuccessChecklist] = useState<Checklist | null>(null)
  const [showMoreOptions, setShowMoreOptions] = useState<string | null>(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // Refs for video and canvas
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
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
      
      return matchesSearch
    })
    
    setFilteredChecklists(filtered)
  }, [checklists, searchTerm])

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
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
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

  // Enhanced handlers
  const showChecklistDetails = (checklist: Checklist) => {
    setSelectedChecklist(checklist)
    setShowChecklistViewModal(true)
  }

  const downloadChecklistInfo = (checklist: Checklist) => {
    try {
      const checklistInfo = `
Checklist Information
====================

Basic Details:
- Title: ${checklist.title}
- Description: ${checklist.description}
- Type: ${checklist.type}
- Frequency: ${checklist.frequency}
- Status: ${checklist.status}
- Priority: ${checklist.priority}
- Created By: ${checklist.createdBy.name} (${checklist.createdBy.email})

Location:
- Building: ${checklist.location.building}
- Floor: ${checklist.location.floor}
- Zone: ${checklist.location.zone}

Inspection Items: ${checklist.items.length}
${checklist.items.map((item, index) => `
${index + 1}. ${item.inspectionItem}
   Details: ${item.details}
   Status: ${item.status}
   Remarks: ${item.remarks}
`).join('')}

Tags: ${checklist.tags.join(', ')}

Timestamps:
- Created: ${new Date(checklist.createdAt).toLocaleString()}
- Updated: ${new Date(checklist.updatedAt).toLocaleString()}
      `.trim()

      const blob = new Blob([checklistInfo], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `checklist_${checklist.title.replace(/[^a-zA-Z0-9]/g, '_')}_info.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setToastMessage('Checklist information downloaded successfully!')
      setShowSuccessToast(true)
    } catch (error) {
      console.error('Error downloading checklist info:', error)
      setError('Failed to download checklist information')
    }
  }

  const handleScannedResult = (checklistId: string) => {
    try {
      const foundChecklist = checklists.find(checklist => 
        checklist._id === checklistId || 
        checklist.qrCode?.data?.includes(checklistId)
      )
      
      if (foundChecklist) {
        setSuccessChecklist(foundChecklist)
        setShowSuccessModal(true)
        setShowScanner(false)
        setToastMessage(`✅ Checklist found: ${foundChecklist.title}`)
        setShowSuccessToast(true)
      } else {
        setToastMessage(`❌ Checklist not found: ${checklistId}`)
        setShowSuccessToast(true)
      }
    } catch (error) {
      console.error('Error processing scanned result:', error)
      setToastMessage(`❌ Error: ${error}`)
      setShowSuccessToast(true)
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
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setImageScanError('Please select a valid image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setImageScanError('Image file size must be less than 5MB')
        return
      }
      
      setUploadedImage(file)
      setImageScanError(null)
      setScannedData(null)
      
      // Process the image
      scanImageForQR(file)
      
      // Reset the input
      event.target.value = ''
    }
  }

  const scanImageForQR = async (file: File) => {
    setImageUploadLoading(true)
    setImageScanError(null)
    
    try {
      // Create a preview of the image
      const imageUrl = URL.createObjectURL(file)
      const img = new window.Image()
      
      img.onload = () => {
        // Simulate QR code detection process
        setTimeout(() => {
          try {
            // Simulate finding QR data from the uploaded image
            const simulatedData = {
              checklistId: `CL_${Date.now()}`,
              title: `Checklist from ${file.name}`,
              type: 'Uploaded',
              location: { building: 'Uploaded', floor: 'N/A', zone: 'N/A' },
              url: imageUrl
            }
            
            setScannedData(simulatedData)
            setImageUploadLoading(false)
            
            // Show success message
            setToastMessage(`✅ QR code detected from uploaded image: ${file.name}`)
            setShowSuccessToast(true)
            
          } catch (error) {
            setImageScanError('Failed to process QR code from image')
            setImageUploadLoading(false)
          }
        }, 2000) // Simulate 2 second processing time
      }
      
      img.onerror = () => {
        setImageScanError('Failed to load uploaded image')
        setImageUploadLoading(false)
      }
      
      img.src = imageUrl
      
    } catch (error) {
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
    return <LoadingSpinner text="Loading checklists..." />
  }

  if (error && showTokenInput) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 font-sans">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-6 text-center max-w-md">
            <div className="relative">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="h-10 w-10 text-blue-500" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
                Authentication Required
              </h3>
              <p className="text-gray-600 mb-6 text-lg font-medium">{error}</p>
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
        </div>
      </div>
    )
  }

  if (error) {
    return <ErrorDisplay error={error} onClearError={() => setError(null)} />
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-background to-muted">
      <div className="flex-1 overflow-auto">
        {/* Main Content */}
        <main className="p-4 sm:p-8 space-y-6 sm:space-y-8">
          {/* Enhanced Header - Matching manage users page style */}
          <header className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 border-b border-border px-4 sm:px-6 py-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <CheckSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                    Checklist Management
                  </h1>
                  <p className="text-sm sm:text-base text-muted-foreground mt-1">
                    View and manage facility checklists with QR scanning capabilities
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-700 dark:text-green-300 font-medium">Live</span>
                </div>
              </div>
            </div>
          </header>

          {/* Enhanced Header Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-950/20 rounded-full">
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {filteredChecklists.length} Checklists
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-950/20 rounded-full">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    {checklists.filter(c => c.status === 'active').length} Active
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-purple-50 dark:bg-purple-950/20 rounded-full">
                  <Target className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    {checklists.filter(c => c.priority === 'high').length} High Priority
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Manage your facility checklists with advanced scanning and monitoring capabilities
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh} 
                disabled={refreshing}
                className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              
              <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            </div>
          </div>

          {/* Enhanced Search and Filters */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Search Section */}
                <div className="flex items-end gap-4">
                  <div className="w-full max-w-md">
                    <Label className="text-sm font-medium text-muted-foreground mb-2">Search Checklists</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by title, description, or location..."
                        className="pl-10 h-11 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowScanner(true)}
                      className="flex items-center gap-2 h-11 px-4 bg-green-50 hover:bg-green-100 border-green-200 text-green-700 hover:text-green-800"
                    >
                      <Scan className="w-4 h-4" />
                      <span>Scan QR</span>
                    </Button>
                  </div>
                </div>

                {/* Search Results Info */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" />
                    <span>
                      Showing {filteredChecklists.length} of {checklists.length} checklists
                      {searchTerm && ` matching "${searchTerm}"`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Real-time search</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Checklists Display */}
          {filteredChecklists.length === 0 ? (
            <EmptyState
              title="No checklists found"
              description={
                searchTerm 
                  ? 'Try adjusting your search criteria'
                  : 'No checklists are currently available'
              }
              actionText="Clear Search"
              onAction={() => {
                    setSearchTerm('')
                  }}
            />
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6'
              : 'space-y-3 sm:space-y-4'
            }>
              {filteredChecklists.map((checklist) => (
                <Card key={checklist._id} className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                  {/* Priority Indicator Bar */}
                  <div className={`h-1.5 w-full ${
                    checklist.priority === 'high' ? 'bg-gradient-to-r from-red-500 to-pink-500' :
                    checklist.priority === 'medium' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                    'bg-gradient-to-r from-green-500 to-emerald-500'
                  }`}></div>
                  
                  <CardHeader className="pb-2 sm:pb-3 pt-3 sm:pt-4 px-3 sm:px-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 pr-2 sm:pr-3">
                        <CardTitle className="text-base sm:text-lg font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 transition-colors mb-1">
                          {checklist.title}
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                          {checklist.description}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end space-y-1 ml-2 flex-shrink-0">
                        <Badge className={`${
                          checklist.priority === 'high' ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-300 shadow-sm' :
                          checklist.priority === 'medium' ? 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-300 shadow-sm' :
                          'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300 shadow-sm'
                        } text-xs px-2 py-1 font-semibold border`}>
                          {checklist.priority}
                        </Badge>
                        <Badge className={`${
                          checklist.status === 'active' ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-300 shadow-sm' :
                          checklist.status === 'completed' ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300 shadow-sm' :
                          'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300 shadow-sm'
                        } text-xs px-2 py-1 font-semibold border`}>
                          {checklist.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-2 sm:space-y-3 pb-3 sm:pb-4 px-3 sm:px-6">
                    {/* Location Section */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-3 border border-blue-200 dark:border-blue-800/30 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <MapPin className="h-3 w-3 text-blue-600 flex-shrink-0" />
                        </div>
                        <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">Location</span>
                      </div>
                      <div className="ml-5 space-y-1">
                        <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-400">
                          <Building2 className="h-3 w-3" />
                          <span className="font-medium">{checklist.location.building}</span>
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-500 ml-5">
                          Floor {checklist.location.floor} • Zone {checklist.location.zone}
                        </div>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          <Calendar className="h-3 w-3 text-gray-600 flex-shrink-0" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Type</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{checklist.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          <Clock className="h-3 w-3 text-gray-600 flex-shrink-0" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Frequency</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{checklist.frequency}</p>
                        </div>
                      </div>
                    </div>

                    {/* Inspection Items */}
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl border border-purple-200 dark:border-purple-800/30 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                          <CheckSquare className="h-3 w-3 text-purple-600" />
                        </div>
                        <span className="text-xs font-medium text-purple-800 dark:text-purple-300">
                          {checklist.items.length} inspection items
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs px-2 py-1 border-purple-300 text-purple-700 bg-purple-50 dark:bg-purple-950/20 shadow-sm">
                        {checklist.type}
                      </Badge>
                    </div>

                    {/* Tags */}
                    {checklist.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {checklist.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs px-2 py-1 bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border-gray-300 shadow-sm">
                            {tag}
                          </Badge>
                        ))}
                        {checklist.tags.length > 3 && (
                          <Badge className="text-xs px-2 py-1 bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border-gray-300 shadow-sm">
                            +{checklist.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Creator Info */}
                    <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <User className="h-3 w-3 text-gray-600 flex-shrink-0" />
                      </div>
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        Created by <span className="font-medium">{checklist.createdBy.name}</span>
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 h-8 sm:h-9 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 border-blue-300 text-blue-700 text-xs shadow-sm hover:shadow-md transition-all duration-200"
                        onClick={() => showChecklistDetails(checklist)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">View</span>
                        <span className="sm:hidden">V</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 h-8 sm:h-9 hover:bg-green-50 hover:text-green-600 hover:border-green-300 border-green-300 text-green-700 text-xs shadow-sm hover:shadow-md transition-all duration-200"
                        onClick={() => handleQRClick(checklist)}
                      >
                        <QrCode className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">QR</span>
                        <span className="sm:hidden">Q</span>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline" className="h-8 sm:h-9 px-2 border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm hover:shadow-md transition-all duration-200">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => downloadChecklistInfo(checklist)}>
                            <Download className="h-3 w-3 mr-2" />
                            Download Info
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => showChecklistDetails(checklist)}>
                            <Eye className="h-3 w-3 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => console.log('Edit checklist:', checklist._id)}>
                            <Edit className="h-3 w-3 mr-2" />
                            Edit Checklist
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => console.log('Share checklist:', checklist._id)}>
                            <Share2 className="h-3 w-3 mr-2" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => console.log('Archive checklist:', checklist._id)} className="text-red-600">
                            <Archive className="h-3 w-3 mr-2" />
                            Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Enhanced Modals */}
      {showChecklistViewModal && selectedChecklist && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Checklist Details
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowChecklistViewModal(false)
                    setSelectedChecklist(null)
                  }}
                  className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Title and Status */}
              <div className="space-y-2">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedChecklist.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedChecklist.description}
                </p>
                <div className="flex gap-2">
                  <Badge className={`${
                    selectedChecklist.priority === 'high' ? 'bg-red-100 text-red-800 border-red-200' :
                    selectedChecklist.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                    'bg-green-100 text-green-800 border-green-200'
                  } text-xs px-2 py-1 font-medium border`}>
                    {selectedChecklist.priority}
                  </Badge>
                  <Badge className={`${
                    selectedChecklist.status === 'active' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                    selectedChecklist.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                    'bg-gray-100 text-gray-800 border-gray-200'
                  } text-xs px-2 py-1 font-medium border`}>
                    {selectedChecklist.status}
                  </Badge>
                </div>
              </div>

              {/* Location */}
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-blue-800 dark:text-blue-300">Location</span>
                </div>
                <div className="ml-6 space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">{selectedChecklist.location.building}</span>
                  </div>
                  <div className="ml-6">
                    Floor {selectedChecklist.location.floor} • Zone {selectedChecklist.location.zone}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Type</span>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedChecklist.type}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Frequency</span>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedChecklist.frequency}</p>
                </div>
              </div>

              {/* Inspection Items */}
              <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-3">
                  <CheckSquare className="h-4 w-4 text-purple-600" />
                  <span className="font-semibold text-purple-800 dark:text-purple-300">
                    Inspection Items ({selectedChecklist.items.length})
                  </span>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedChecklist.items.map((item, index) => (
                    <div key={item._id} className="bg-white dark:bg-gray-700 rounded p-2 text-sm">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {index + 1}. {item.inspectionItem}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {item.details}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Creator */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Created by <span className="font-medium">{selectedChecklist.createdBy.name}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-t border-gray-200 dark:border-gray-600">
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleQRClick(selectedChecklist)}
                  className="flex items-center gap-2"
                >
                  <QrCode className="h-4 w-4" />
                  View QR
                </Button>
                <Button 
                  size="sm"
                  onClick={() => {
                    setShowChecklistViewModal(false)
                    setSelectedChecklist(null)
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScanResult={handleScannedResult}
        scannedResult={scannedData ? `Found: ${scannedData.title}` : null}
      />

      {/* Enhanced Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border-2 border-green-200 dark:border-green-700">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 px-6 py-4 border-b border-green-200 dark:border-green-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Scan className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    QR Code Scanner
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowScanner(false)}
                  className="h-10 w-10 p-0 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Camera View */}
              <div className="bg-black rounded-xl overflow-hidden relative">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full opacity-0"
                />
                
                {/* Scanning Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-green-400 rounded-lg relative">
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-green-400"></div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-green-400"></div>
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-green-400"></div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-green-400"></div>
                    
                    {/* Scanning Line */}
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-green-400 animate-pulse"></div>
                  </div>
                </div>

                {/* Camera Controls */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3">
                  <Button
                    onClick={startCamera}
                    disabled={scanningQR}
                    className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Start Camera
                  </Button>
                  <Button
                    onClick={stopCamera}
                    disabled={!scanningQR}
                    variant="outline"
                    className="bg-white/90 hover:bg-white text-gray-700 border-gray-300"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                </div>
              </div>

              {/* Upload Option */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800/30">
                <h4 className="text-lg font-semibold text-purple-800 dark:text-purple-300 mb-3 flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload QR Image
                </h4>
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      id="qr-image-upload"
                    />
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full h-12 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-purple-300 text-purple-700 hover:text-purple-800 shadow-md hover:shadow-lg transition-all duration-200"
                      disabled={imageUploadLoading}
                    >
                      {imageUploadLoading ? (
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-5 w-5 mr-2" />
                      )}
                      {imageUploadLoading ? 'Processing...' : 'Choose Image File'}
                    </Button>
                  </div>
                  {imageUploadLoading && (
                    <div className="text-center text-sm text-purple-600 dark:text-purple-400">
                      Processing uploaded image...
                    </div>
                  )}
                  {imageScanError && (
                    <div className="text-center text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded-lg p-2">
                      {imageScanError}
                    </div>
                  )}
                  {uploadedImage && (
                    <div className="text-center text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 rounded-lg p-2">
                      ✓ Image uploaded: {uploadedImage.name}
                    </div>
                  )}
                </div>
              </div>

              {/* Scan Results */}
              {scannedData && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800/30">
                  <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Scan Result
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Title:</span> {scannedData.title}</p>
                    <p><span className="font-medium">Type:</span> {scannedData.type}</p>
                    <p><span className="font-medium">ID:</span> {scannedData.checklistId}</p>
                  </div>
                  <Button
                    onClick={saveScannedData}
                    disabled={savingScannedData}
                    className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {savingScannedData ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {savingScannedData ? 'Saving...' : 'Save Result'}
                  </Button>
                </div>
              )}

              {/* Error Display */}
              {scannerError && (
                <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 rounded-xl p-4 border border-red-200 dark:border-red-800/30">
                  <h4 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Scanner Error
                  </h4>
                  <p className="text-red-600 text-sm">{scannerError}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-end gap-3">
                <Button onClick={() => setShowScanner(false)} variant="outline" size="lg" className="h-11 px-6">
                  Close Scanner
                </Button>
                <Button 
                  onClick={startCamera}
                  disabled={scanningQR}
                  size="lg" 
                  className="h-11 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Scan className="h-5 w-5 mr-2" />
                  {scanningQR ? 'Scanning...' : 'Start Scanning'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <SuccessModal
        isOpen={showSuccessModal}
        asset={successChecklist as any}
        onClose={() => {
          setShowSuccessModal(false)
          setSuccessChecklist(null)
        }}
        onViewDetails={(checklist) => {
          setShowSuccessModal(false)
          setSuccessChecklist(null)
          setSelectedChecklist(checklist as any)
          setShowChecklistViewModal(true)
        }}
      />

      {/* QR Code Modal */}
      {showQRModal && selectedQRData && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={handleModalBackdropClick}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden border-2 border-blue-200 dark:border-blue-700">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 px-6 py-4 border-b border-blue-200 dark:border-blue-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <QrCode className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    QR Code Scanner
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeQRModal}
                  className="h-10 w-10 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="text-center">
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6 shadow-lg">
                  {qrImageLoading && (
                    <div className="w-64 h-64 mx-auto flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                    </div>
                  )}
                  
                  <Image 
                    src={selectedQRData.blobUrl || (selectedQRData.url.startsWith('http') ? selectedQRData.url : `http://192.168.0.5:5021${selectedQRData.url}`)}
                    alt="QR Code"
                    width={256}
                    height={256}
                    className={`mx-auto object-contain rounded-lg ${
                      qrImageLoading ? 'hidden' : ''
                    }`}
                    style={{ display: qrImageLoading ? 'none' : 'block' }}
                  />
                  
                  {qrImageError && (
                    <div className="w-64 h-64 mx-auto flex flex-col items-center justify-center text-red-500">
                      <QrCode className="h-16 w-16 mb-3 opacity-50" />
                      <p className="text-lg font-medium">QR Code not found</p>
                      <p className="text-sm text-gray-500 mt-1">Please try again</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <Button 
                    onClick={() => {
                      const link = document.createElement('a');
                      const imageUrl = selectedQRData.blobUrl || (selectedQRData.url.startsWith('http') ? selectedQRData.url : `http://192.168.0.5:5021${selectedQRData.url}`);
                      link.href = imageUrl;
                      link.download = 'checklist-qr.png';
                      link.click();
                    }}
                    variant="outline"
                    size="lg"
                    className="w-full h-12 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-300 text-blue-700 hover:text-blue-800 shadow-md hover:shadow-lg transition-all duration-200"
                    disabled={qrImageError}
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download QR Code
                  </Button>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                  <Scan className="h-5 w-5 text-green-600" />
                  Scanner Options
                </h4>
                
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full h-12 justify-start bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-green-300 text-green-700 hover:text-green-800 shadow-md hover:shadow-lg transition-all duration-200"
                    onClick={() => setShowScanner(true)}
                  >
                    <Scan className="h-5 w-5 mr-3" />
                    Open QR Scanner
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full h-12 justify-start bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-purple-300 text-purple-700 hover:text-purple-800 shadow-md hover:shadow-lg transition-all duration-200"
                    onClick={() => {
                      // Simulate camera access
                      navigator.mediaDevices.getUserMedia({ video: true })
                        .then(() => setShowScanner(true))
                        .catch(() => alert('Camera access required for scanning'))
                    }}
                  >
                    <Camera className="h-5 w-5 mr-3" />
                    Use Camera Scanner
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-end gap-3">
                <Button onClick={closeQRModal} variant="outline" size="lg" className="h-11 px-6">
                  Close
                </Button>
                <Button 
                  onClick={() => setShowScanner(true)} 
                  size="lg" 
                  className="h-11 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Scan className="h-5 w-5 mr-2" />
                  Start Scanning
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
      <SuccessToast
        message={toastMessage}
        onClose={() => setShowSuccessToast(false)}
      />
      )}
    </div>
  )
}
