"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { ViewModeToggle } from '@/components/ui/view-mode-toggle'

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
  Scan,
  CheckCircle,
  CheckSquare,
  Share2,
  Archive,
  Edit,
  Target,
  MoreHorizontal
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

// Create a compatible type for SuccessModal that maps Checklist to Asset-like structure
type ChecklistAsAsset = {
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
      data: Record<string, unknown> | null
      generatedAt: string
    }
    barcode: {
      url: string
      data: string
      generatedAt: string
    }
    nfcData: {
      url: string
      data: Record<string, unknown> | null
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



// Function to convert Checklist to Asset-like structure for SuccessModal
const convertChecklistToAsset = (checklist: Checklist): ChecklistAsAsset => {
  return {
    _id: checklist._id,
    tagId: checklist._id, // Use ID as tag
    assetType: checklist.type,
    subcategory: 'Checklist',
    brand: 'Facilio',
    model: 'Standard Checklist',
    status: checklist.status,
    priority: checklist.priority,
    location: {
      latitude: '0',
      longitude: '0',
      floor: checklist.location.floor,
      room: checklist.location.zone,
      building: checklist.location.building
    },
    project: null,
    compliance: {
      certifications: [],
      expiryDates: [],
      regulatoryRequirements: []
    },
    digitalAssets: {
      qrCode: {
        url: checklist.qrCode.url,
        data: { checklistData: checklist.qrCode.data },
        generatedAt: checklist.qrCode.generatedAt
      },
      barcode: {
        url: '',
        data: checklist._id,
        generatedAt: checklist.qrCode.generatedAt
      },
      nfcData: {
        url: '',
        data: { checklistId: checklist._id, title: checklist.title },
        generatedAt: checklist.qrCode.generatedAt
      }
    },
    assignedTo: checklist.createdBy,
    createdAt: checklist.createdAt,
    updatedAt: checklist.updatedAt
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
  
  // Modal states
  const [showScanner, setShowScanner] = useState(false)
  const [scannedData, setScannedData] = useState<{
    checklistId: string;
    title: string;
    type: string;
    location: Location | Record<string, unknown>;
    url: string;
  } | null>(null)
  
  // Enhanced modal states
  const [showChecklistViewModal, setShowChecklistViewModal] = useState(false)
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successChecklist, setSuccessChecklist] = useState<Checklist | null>(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [showScannerResponse, setShowScannerResponse] = useState(false)



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
  }, [selectedQRData?.blobUrl])

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
      // First try to find by exact ID match
      let foundChecklist = checklists.find(checklist => 
        checklist._id === checklistId
      )
      
      // If not found by exact ID, try to find by QR code data
      if (!foundChecklist) {
        foundChecklist = checklists.find(checklist => 
          checklist.qrCode?.data?.includes(checklistId) ||
          checklist.qrCode?.data === checklistId
        )
      }
      
      // If still not found, try to find by title or description
      if (!foundChecklist) {
        foundChecklist = checklists.find(checklist => 
          checklist.title.toLowerCase().includes(checklistId.toLowerCase()) ||
          checklist.description.toLowerCase().includes(checklistId.toLowerCase())
        )
      }
      
      if (foundChecklist) {
        setSuccessChecklist(foundChecklist)
        setShowSuccessModal(true)
        setShowScanner(false)
        setToastMessage(`✅ Checklist found: ${foundChecklist.title}`)
        setShowSuccessToast(true)
        
        // Also set scanned data for display
        setScannedData({
          checklistId: foundChecklist._id,
          title: foundChecklist.title,
          type: foundChecklist.type,
          location: foundChecklist.location as Location | Record<string, unknown>,
          url: foundChecklist.qrCode?.url || ''
        })
        
        // Show scanner response
        setShowScannerResponse(true)
      } else {
        // Create a simulated checklist for display
        const simulatedChecklist = {
          _id: `SCANNED_${Date.now()}`,
          title: `Scanned Checklist: ${checklistId}`,
          description: `This checklist was scanned from QR code: ${checklistId}`,
          type: 'Scanned',
          frequency: 'On-demand',
          items: [],
          location: { building: 'Scanned', floor: 'N/A', zone: 'N/A' },
          createdBy: { _id: 'scanner', name: 'QR Scanner', email: 'scanner@facilio.com' },
          assignedTo: [],
          status: 'active' as const,
          priority: 'medium',
          tags: ['scanned', 'qr-code'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          qrCode: {
            url: '',
            data: checklistId,
            generatedAt: new Date().toISOString()
          }
        }
        
        setSuccessChecklist(simulatedChecklist)
        setShowSuccessModal(true)
        setShowScanner(false)
        setToastMessage(`✅ New checklist scanned: ${checklistId}`)
            setShowSuccessToast(true)
            
        // Set scanned data
        setScannedData({
          checklistId: checklistId,
          title: `Scanned: ${checklistId}`,
          type: 'Scanned',
          location: { building: 'Scanned', floor: 'N/A', zone: 'N/A' },
          url: ''
        })
        
        // Show scanner response
        setShowScannerResponse(true)
      }
    } catch (error) {
      console.error('Error processing scanned result:', error)
      setToastMessage(`❌ Error processing scan: ${error}`)
      setShowSuccessToast(true)
    }
  }







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
        <ChecklistViewModal
          isOpen={showChecklistViewModal}
          onClose={() => {
                    setShowChecklistViewModal(false)
                    setSelectedChecklist(null)
                  }}
          checklist={selectedChecklist}
        />
      )}

      <ScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScanResult={handleScannedResult}
        scannedResult={scannedData ? `Found: ${scannedData.title}` : null}
        checklists={checklists}
        mode="checklists"
      />

      <SuccessModal
        isOpen={showSuccessModal}
        asset={successChecklist ? convertChecklistToAsset(successChecklist) : null}
        onClose={() => {
          setShowSuccessModal(false)
          setSuccessChecklist(null)
        }}
        onViewDetails={(assetData: ChecklistAsAsset) => {
          setShowSuccessModal(false)
          setSuccessChecklist(null)
          // Find the original checklist by ID
          const originalChecklist = checklists.find(c => c._id === assetData._id)
          if (originalChecklist) {
            setSelectedChecklist(originalChecklist)
            setShowChecklistViewModal(true)
          }
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


            </div>

            <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-end gap-3">
                <Button onClick={closeQRModal} variant="outline" size="lg" className="h-11 px-6">
                  Close
                </Button>
                  <Button 
                  onClick={() => {
                    closeQRModal()
                    setShowScanner(true)
                  }} 
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

      {/* Scanner Response Modal */}
      {showScannerResponse && scannedData && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border-2 border-green-200 dark:border-green-700">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 px-6 py-4 border-b border-green-200 dark:border-green-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Scan className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Scanner Response
                  </h3>
                </div>
                  <Button 
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowScannerResponse(false)}
                  className="h-10 w-10 p-0 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg"
                >
                  <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Scan Result Header */}
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  QR Code Successfully Scanned!
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Checklist information has been detected and processed
                </p>
            </div>

              {/* Scanned Data Display */}
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800/30">
                  <h5 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    Scanned Information
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Checklist ID</p>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">{scannedData.checklistId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Title</p>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">{scannedData.title}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Type</p>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">{scannedData.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Building</p>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        {typeof scannedData.location === 'object' && 'building' in scannedData.location && scannedData.location.building 
                          ? String(scannedData.location.building)
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={() => {
                      setShowScannerResponse(false)
                      if (successChecklist) {
                        setShowSuccessModal(true)
                      }
                    }}
                    className="flex-1 h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Full Details
                </Button>
                <Button 
                    variant="outline"
                    onClick={() => setShowScannerResponse(false)}
                    className="flex-1 h-11 border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Continue
                </Button>
                </div>
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
