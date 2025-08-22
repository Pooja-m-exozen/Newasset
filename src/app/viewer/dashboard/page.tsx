"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScannerModal } from '@/components/ui/scanner-modal-component'
import { 
  Building2, 
  MapPin, 
  Search, 
  Eye, 
  Calendar,
  Package,
  User,
  CheckCircle,
  AlertCircle,
  Clock,
  CheckSquare,
  TrendingUp,
  Activity,
  RefreshCw,
  BarChart3,
  PieChart,
  Target,
  Zap,
  FileText,
  QrCode,
  Scan,
  Download,
  Share2,
  X,
  AlertTriangle
} from 'lucide-react'

interface Asset {
  _id: string
  tagId: string
  assetType: string
  subcategory: string
  brand: string
  model: string
  serialNumber: string
  capacity: string
  yearOfInstallation: string
  status: string
  priority: string
  digitalTagType: string
  notes: string
  location: {
    latitude: string
    longitude: string
    floor: string
    room: string
    building: string
  }
  project: {
    projectId: string
    projectName: string
  }
  assignedTo: {
    _id: string
    name: string
    email: string
  }
  createdBy: {
    _id: string
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
  compliance: {
    certifications: string[]
    expiryDates: string[]
    regulatoryRequirements: string[]
  }
  digitalAssets: {
    qrCode: {
      url: string
      data: {
        t: string
        a: string
        s: string
        b: string
        m: string
        st: string
        p: string
        l: {
          latitude: string
          longitude: string
          floor: string
          room: string
          building: string
        }
        u: string
        pr: string | null
        lm: string | null
        nm: string | null
        url: string
        ts: number
        c: string
      }
      generatedAt: string
    }
  }
  alerts: string[]
  documents: string[]
  tags: string[]
  customFields: Record<string, unknown>
}

interface Checklist {
  _id: string
  title: string
  description: string
  type: string
  frequency: string
  priority: string
  status: 'active' | 'completed' | 'archived'
  location: {
    building: string
    floor: string
    zone: string
  }
  items: Array<{
    serialNumber: number
    inspectionItem: string
    details: string
    status: string
    remarks: string
    _id: string
  }>
  createdBy: {
    _id: string
    name: string
    email: string
  }
  assignedTo: string[]
  tags: string[]
  createdAt: string
  updatedAt: string
  qrCode: {
    url: string
    data: string
    generatedAt: string
  }
  metadata: {
    version: string
    compliance: string[]
  }
}

interface DashboardStats {
  totalAssets: number
  activeAssets: number
  maintenanceAssets: number
  criticalAssets: number
  totalChecklists: number
  activeChecklists: number
  completedChecklists: number
  pendingChecklists: number
}

export default function ViewerDashboard() {
  const { user } = useAuth()
  const [assets, setAssets] = useState<Asset[]>([])
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([])
  const [filteredChecklists, setFilteredChecklists] = useState<Checklist[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [showScanner, setShowScanner] = useState(false)
  const [scannedResult, setScannedResult] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Fetch assets from API
  const fetchAssets = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('Authentication token not found')
      }

      const response = await fetch('http://192.168.0.5:5021/api/assets', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.status === 401) {
        localStorage.removeItem('authToken')
        throw new Error('Authentication failed. Please login again.')
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        const allAssets = data.assets
        const userProject = localStorage.getItem('userProject')

        // Filter assets by user's project
        if (userProject) {
          const projectAssets = allAssets.filter((asset: Asset) => {
            const assetProjectName = asset.project.projectName
            return assetProjectName === userProject
          })
          setAssets(projectAssets)
          setFilteredAssets(projectAssets)
        } else {
          setAssets(allAssets)
          setFilteredAssets(allAssets)
        }
      } else {
        throw new Error('Failed to fetch assets')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Error fetching assets:', err)
    }
  }, [])

  // Fetch checklists from API
  const fetchChecklists = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('Authentication token not found')
      }

      const response = await fetch('http://192.168.0.5:5021/api/checklists', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.status === 401) {
        localStorage.removeItem('authToken')
        throw new Error('Authentication failed. Please login again.')
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('Checklists API response:', data) // Debug log
      if (data.success) {
        const allChecklists = data.data || data.checklists || []
        console.log('All checklists:', allChecklists) // Debug log
        const userProject = localStorage.getItem('userProject')

        // Filter checklists by user's project
        if (userProject) {
          const projectChecklists = allChecklists.filter(() => {
            // Since checklists don't have projectName, we'll show all for now
            // You can add project filtering logic here when available
            return true
          })
          setChecklists(projectChecklists)
          setFilteredChecklists(projectChecklists)
        } else {
          setChecklists(allChecklists)
          setFilteredChecklists(allChecklists)
        }
        console.log('Final checklists state:', allChecklists.length) // Debug log
      } else {
        throw new Error('Failed to fetch checklists')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Error fetching checklists:', err)
    }
  }, [])

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      await Promise.all([fetchAssets(), fetchChecklists()])
      setLastRefresh(new Date())
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [fetchAssets, fetchChecklists])

  // Initialize data
  useEffect(() => {
    // Fetch data regardless of project name to show checklists
    fetchAllData()
  }, [fetchAllData]) // Now properly includes fetchAllData as dependency

  // Filter assets based on search
  useEffect(() => {
    const filtered = assets.filter(asset =>
      asset.tagId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.assetType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.location.building.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredAssets(filtered)
  }, [searchTerm, assets])

  // Filter checklists based on search
  useEffect(() => {
    const filtered = checklists.filter(checklist =>
      checklist.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      checklist.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      checklist.location.building.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredChecklists(filtered)
  }, [searchTerm, checklists])

  // Calculate dashboard statistics
  const dashboardStats = useMemo((): DashboardStats => {
    const activeAssets = assets.filter(asset => asset.status === 'active').length
    const maintenanceAssets = assets.filter(asset => asset.status === 'maintenance').length
    const criticalAssets = assets.filter(asset => asset.priority === 'high').length
    const activeChecklists = checklists.filter(checklist => checklist.status === 'active').length
    const completedChecklists = checklists.filter(checklist => checklist.status === 'completed').length
    const pendingChecklists = checklists.filter(checklist => checklist.status === 'active').length

    return {
      totalAssets: assets.length,
      activeAssets,
      maintenanceAssets,
      criticalAssets,
      totalChecklists: checklists.length,
      activeChecklists,
      completedChecklists,
      pendingChecklists
    }
  }, [assets, checklists])

  const handleRefresh = () => {
    fetchAllData()
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 dark:bg-red-900/30 dark:text-yellow-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getChecklistStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'archived':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-400 rounded-full animate-spin" style={{ animationDelay: '0.5s' }}></div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">Loading Dashboard</h3>
              <p className="text-gray-600 font-medium">Fetching your project data...</p>
              {user?.projectName && (
                <p className="text-sm text-blue-600 mt-2">Project: {user.projectName}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
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
                {error.includes('Authentication') ? 'Authentication Required' : 'Error Loading Dashboard'}
              </h3>
              <p className="text-gray-600 mb-6 text-lg font-medium">{error}</p>
              <div className="flex gap-3 justify-center">
                {error.includes('Authentication') ? (
                  <Button onClick={() => window.location.href = '/login'} size="lg" className="px-8 font-semibold">
                    Go to Login
                  </Button>
                ) : (
                  <Button onClick={fetchAllData} variant="outline" size="lg" className="px-8 font-semibold">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Enhanced Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="w-full sm:w-auto">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Viewer Dashboard
              </h1>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Welcome back, {user?.name}! Monitor your project assets & checklists in real-time.
                {user?.projectName && (
                  <span className="ml-1 sm:ml-2 text-primary font-medium">• {user.projectName}</span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="border-blue-200 text-blue-700 dark:border-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs sm:text-sm"
              >
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Refresh</span>
                <span className="xs:hidden">Ref</span>
              </Button>
              <Badge variant="outline" className="border-blue-200 text-blue-700 dark:border-blue-700 dark:text-blue-300 text-xs">
                {user?.projectName || 'No Project'}
              </Badge>
              <Badge variant="outline" className="border-green-200 text-green-700 dark:border-green-700 dark:text-green-300 text-xs">
                {user?.role || 'Viewer'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                  <Building2 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                <div className="ml-2 sm:ml-3 lg:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Assets</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats.totalAssets}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {dashboardStats.activeAssets} active
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                <div className="ml-2 sm:ml-3 lg:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Active Assets</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats.activeAssets}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {dashboardStats.totalAssets > 0 ? Math.round((dashboardStats.activeAssets/dashboardStats.totalAssets)*100) : 0}% of total
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-sm border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                <div className="ml-2 sm:ml-3 lg:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Critical Assets</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats.criticalAssets}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">High priority</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-sm border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl">
                  <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                <div className="ml-2 sm:ml-3 lg:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Active Checklists</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats.activeChecklists}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {dashboardStats.completedChecklists} completed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Project Info Banner */}
        {user?.projectName && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-4 sm:mb-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-2 h-2 sm:w-3 sm:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300">
                Currently viewing assets for project: <span className="font-bold">{user.projectName}</span>
              </span>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-sm border-gray-200/50 dark:border-gray-700/50 mb-4 sm:mb-6">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-4">
              <div className="flex-1 w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search assets, checklists, locations, or users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => setSearchTerm('')}
                  size="sm"
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs sm:text-sm flex-1 sm:flex-none"
                >
                  Clear
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowScanner(true)}
                  size="sm"
                  className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-600 dark:text-green-300 dark:hover:bg-green-900/20 text-xs sm:text-sm flex-1 sm:flex-none"
                >
                  <Scan className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Scan QR</span>
                  <span className="xs:hidden">QR</span>
                </Button>
              </div>
            </div>
            {lastRefresh && (
              <p className="text-xs text-gray-500 mt-2">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Tabs for different views */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900/30 text-xs sm:text-sm">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">OV</span>
            </TabsTrigger>
            <TabsTrigger value="assets" className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900/30 text-xs sm:text-sm">
              <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Assets</span>
              <span className="sm:hidden">AS</span>
              <span className="ml-1 text-xs bg-blue-100 dark:bg-blue-900/30 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                {filteredAssets.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="checklists" className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900/30 text-xs sm:text-sm">
              <CheckSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Checklists</span>
              <span className="sm:hidden">CL</span>
              <span className="ml-1 text-xs bg-blue-100 dark:bg-blue-900/30 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                {filteredChecklists.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900/30 text-xs sm:text-sm">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">AN</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-4 sm:mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Quick Actions */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-base sm:text-lg">
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-yellow-500" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3">
                  <Button 
                    className="w-full justify-start text-sm" 
                    variant="outline"
                    onClick={() => setShowScanner(true)}
                    size="sm"
                  >
                    <Scan className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Scan QR Code
                  </Button>
                  <Button className="w-full justify-start text-sm" variant="outline" size="sm">
                    <QrCode className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Generate QR
                  </Button>
                  <Button className="w-full justify-start text-sm" variant="outline" size="sm">
                    <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Export Report
                  </Button>
                  <Button className="w-full justify-start text-sm" variant="outline" size="sm">
                    <Share2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Share Dashboard
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-base sm:text-lg">
                    <Activity className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-500" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3">
                  <div className="flex items-center space-x-3 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                      {dashboardStats.totalAssets} assets available
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                      {dashboardStats.totalChecklists} checklists available
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                      {dashboardStats.criticalAssets} critical assets
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Assets Tab */}
          <TabsContent value="assets" className="mt-4 sm:mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {filteredAssets.map((asset) => (
                <Card key={asset._id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                  <CardHeader className="pb-3 sm:pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors truncate">
                          {asset.tagId}
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm truncate">
                          {asset.assetType}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col space-y-1 sm:space-y-2 ml-2">
                        <Badge className={`${getStatusColor(asset.status)} text-xs`}>
                          {asset.status}
                        </Badge>
                        <Badge className={`${getPriorityColor(asset.priority)} text-xs`}>
                          {asset.priority}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="flex items-center space-x-2 text-xs sm:text-sm">
                      <Package className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-400 truncate">
                        {asset.brand} {asset.model}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-xs sm:text-sm">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-400 truncate">
                        {asset.location.building} • {asset.location.floor} • {asset.location.room}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-xs sm:text-sm">
                      <User className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-400 truncate">
                        {asset.assignedTo?.name || 'Unassigned'}
                      </span>
                    </div>

                    {/* Additional Asset Info */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-2">
                      <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Subcategory</p>
                        <p className="text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-400 truncate">
                          {asset.subcategory}
                        </p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Capacity</p>
                        <p className="text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-400 truncate">
                          {asset.capacity}
                        </p>
                      </div>
                    </div>

                    {/* Digital Assets Info */}
                    {asset.digitalAssets?.qrCode && (
                      <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-2">
                        <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-xs text-gray-500 dark:text-gray-400">QR Code</p>
                          <p className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400">
                            Available
                          </p>
                        </div>
                        <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Type</p>
                          <p className="text-xs sm:text-sm font-bold text-green-600 dark:text-green-400 truncate">
                            {asset.digitalTagType}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2 text-xs sm:text-sm">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Year: {asset.yearOfInstallation || 'N/A'}
                      </span>
                    </div>
                    
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 group-hover:border-blue-500 transition-colors text-xs sm:text-sm"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Checklists Tab */}
          <TabsContent value="checklists" className="mt-4 sm:mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {filteredChecklists.map((checklist) => (
                <Card key={checklist._id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                  <CardHeader className="pb-3 sm:pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors truncate">
                          {checklist.title}
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm truncate">
                          {checklist.type}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col space-y-1 sm:space-y-2 ml-2">
                        <Badge className={`${getChecklistStatusColor(checklist.status)} text-xs`}>
                          {checklist.status}
                        </Badge>
                        <Badge className={`${getPriorityColor(checklist.priority)} text-xs`}>
                          {checklist.priority}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="flex items-center space-x-2 text-xs sm:text-sm">
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-400 truncate">
                        {checklist.description}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-xs sm:text-sm">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-400 truncate">
                        {checklist.location.building} • {checklist.location.floor} • {checklist.location.zone}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-xs sm:text-sm">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Created: {new Date(checklist.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Items Summary */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total Items</p>
                        <p className="text-xs sm:text-sm font-bold text-green-600 dark:text-green-400">
                          {checklist.items.length}
                        </p>
                      </div>
                      <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Type</p>
                        <p className="text-xs sm:text-sm font-bold text-yellow-600 dark:text-yellow-400 truncate">
                          {checklist.type}
                        </p>
                      </div>
                      <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Priority</p>
                        <p className="text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-400 truncate">
                          {checklist.priority}
                        </p>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 group-hover:border-blue-500 transition-colors text-xs sm:text-sm"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        View Checklist
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-4 sm:mt-6">
            <div className="space-y-4 sm:space-y-6">
              {/* Top Row - Key Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                {/* Asset Health Score */}
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="flex items-center text-sm sm:text-lg">
                      <Target className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-500" />
                      Asset Health Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="relative inline-block">
                        <svg className="w-20 h-20 sm:w-24 sm:h-24 transform -rotate-90">
                          <circle
                            cx="40"
                            cy="40"
                            r="30"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="transparent"
                            className="text-gray-200 dark:text-gray-700"
                          />
                          <circle
                            cx="40"
                            cy="40"
                            r="30"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="transparent"
                            strokeDasharray={`${2 * Math.PI * 30}`}
                            strokeDashoffset={`${2 * Math.PI * 30 * (1 - (dashboardStats.activeAssets / Math.max(dashboardStats.totalAssets, 1)))}`}
                            className="text-green-500 transition-all duration-1000 ease-out"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                            {dashboardStats.totalAssets > 0 ? Math.round((dashboardStats.activeAssets / dashboardStats.totalAssets) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {dashboardStats.activeAssets} of {dashboardStats.totalAssets} assets healthy
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Checklist Completion Rate */}
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="flex items-center text-sm sm:text-lg">
                      <PieChart className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-500" />
                      Checklist Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="relative inline-block">
                        <svg className="w-20 h-20 sm:w-24 sm:h-24 transform -rotate-90">
                          <circle
                            cx="40"
                            cy="40"
                            r="30"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="transparent"
                            className="text-gray-200 dark:text-gray-700"
                          />
                          <circle
                            cx="40"
                            cy="40"
                            r="30"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="transparent"
                            strokeDasharray={`${2 * Math.PI * 30}`}
                            strokeDashoffset={`${2 * Math.PI * 30 * (1 - (dashboardStats.completedChecklists / Math.max(dashboardStats.totalChecklists, 1)))}`}
                            className="text-blue-500 transition-all duration-1000 ease-out"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                            {dashboardStats.totalChecklists > 0 ? Math.round((dashboardStats.completedChecklists / dashboardStats.totalChecklists) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {dashboardStats.completedChecklists} of {dashboardStats.totalChecklists} completed
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Critical Assets Alert */}
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 sm:col-span-2 lg:col-span-1">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="flex items-center text-sm sm:text-lg">
                      <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-red-500" />
                      Critical Assets
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl sm:text-4xl font-bold text-red-600 dark:text-red-400 mb-2">
                        {dashboardStats.criticalAssets}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        High priority assets requiring attention
                      </p>
                      {dashboardStats.criticalAssets > 0 && (
                        <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <p className="text-xs text-red-700 dark:text-red-300 font-medium">
                            ⚠️ Immediate action required
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Real Data Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Asset Age Analysis */}
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="flex items-center text-sm sm:text-lg">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-orange-500" />
                      Asset Age Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 sm:space-y-4">
                      {(() => {
                        const currentYear = new Date().getFullYear()
                        const ageGroups = [
                          { label: '0-2 years', min: currentYear - 2, max: currentYear, color: 'bg-green-500' },
                          { label: '3-5 years', min: currentYear - 5, max: currentYear - 3, color: 'bg-yellow-500' },
                          { label: '6-10 years', min: currentYear - 10, max: currentYear - 6, color: 'bg-orange-500' },
                          { label: '10+ years', min: 0, max: currentYear - 11, color: 'bg-red-500' }
                        ]
                        
                        return ageGroups.map((group, index) => {
                          const count = assets.filter(asset => {
                            const year = parseInt(asset.yearOfInstallation)
                            return year >= group.min && year <= group.max
                          }).length
                          const percentage = dashboardStats.totalAssets > 0 ? (count / dashboardStats.totalAssets) * 100 : 0
                          
                          return (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 sm:space-x-3">
                                <div className={`w-3 h-3 sm:w-4 sm:h-4 ${group.color} rounded-full`}></div>
                                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">{group.label}</span>
                              </div>
                              <div className="flex items-center space-x-2 sm:space-x-3">
                                <div className="w-24 sm:w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div 
                                    className={`${group.color} h-2 rounded-full transition-all duration-1000 ease-out`}
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white w-8 sm:w-12 text-right">
                                  {count}
                                </span>
                              </div>
                            </div>
                          )
                        })
                      })()}
                    </div>
                  </CardContent>
                </Card>

                {/* Location Distribution */}
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="flex items-center text-sm sm:text-lg">
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-500" />
                      Location Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 sm:space-y-4">
                      {(() => {
                        const buildingStats = assets.reduce((acc, asset) => {
                          const building = asset.location.building
                          if (!acc[building]) {
                            acc[building] = { count: 0, floors: new Set(), rooms: new Set() }
                          }
                          acc[building].count++
                          acc[building].floors.add(asset.location.floor)
                          acc[building].rooms.add(asset.location.room)
                          return acc
                        }, {} as Record<string, { count: number, floors: Set<string>, rooms: Set<string> }>)
                        
                        return Object.entries(buildingStats)
                          .sort(([,a], [,b]) => b.count - a.count)
                          .slice(0, 5)
                          .map(([building, stats]) => (
                            <div key={building} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">{building}</h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {stats.floors.size} floors • {stats.rooms.size} rooms
                                </p>
                              </div>
                              <div className="text-right ml-2">
                                <div className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">
                                  {stats.count}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-500">
                                  {dashboardStats.totalAssets > 0 ? Math.round((stats.count / dashboardStats.totalAssets) * 100) : 0}%
                                </div>
                              </div>
                            </div>
                          ))
                      })()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Checklist Analytics */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center text-sm sm:text-lg">
                    <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-emerald-500" />
                    Checklist Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                    {/* Checklist Types */}
                    <div>
                      <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Checklist Types</h4>
                      <div className="space-y-2">
                        {(() => {
                          const typeStats = checklists.reduce((acc, checklist) => {
                            acc[checklist.type] = (acc[checklist.type] || 0) + 1
                            return acc
                          }, {} as Record<string, number>)
                          
                          return Object.entries(typeStats)
                            .sort(([,a], [,b]) => b - a)
                            .map(([type, count]) => {
                              const percentage = checklists.length > 0 ? (count / checklists.length) * 100 : 0
                              return (
                                <div key={type} className="flex items-center justify-between">
                                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{type}</span>
                                  <div className="flex items-center space-x-2">
                                    <div className="w-16 sm:w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                      <div 
                                        className="bg-emerald-500 h-2 rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${percentage}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-6 sm:w-8 text-right">
                                      {count}
                                    </span>
                                  </div>
                                </div>
                              )
                            })
                        })()}
                      </div>
                    </div>

                    {/* Checklist Status */}
                    <div>
                      <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Status Breakdown</h4>
                      <div className="space-y-2">
                        {(() => {
                          const statusStats = checklists.reduce((acc, checklist) => {
                            acc[checklist.status] = (acc[checklist.status] || 0) + 1
                            return acc
                          }, {} as Record<string, number>)
                          
                          const statusColors = {
                            active: 'bg-blue-500',
                            completed: 'bg-green-500',
                            archived: 'bg-gray-500'
                          }
                          
                          return Object.entries(statusStats).map(([status, count]) => {
                            const percentage = checklists.length > 0 ? (count / checklists.length) * 100 : 0
                            return (
                              <div key={status} className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <div className={`w-3 h-3 ${statusColors[status as keyof typeof statusColors] || 'bg-gray-500'} rounded-full`}></div>
                                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 capitalize">{status}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-16 sm:w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div 
                                      className={`${statusColors[status as keyof typeof statusColors] || 'bg-gray-500'} h-2 rounded-full transition-all duration-1000 ease-out`}
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-6 sm:w-8 text-right">
                                    {count}
                                  </span>
                                </div>
                              </div>
                            )
                          })
                        })()}
                      </div>
                    </div>

                    {/* Checklist Priority */}
                    <div>
                      <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Priority Distribution</h4>
                      <div className="space-y-2">
                        {(() => {
                          const priorityStats = checklists.reduce((acc, checklist) => {
                            acc[checklist.priority] = (acc[checklist.priority] || 0) + 1
                            return acc
                          }, {} as Record<string, number>)
                          
                          const priorityColors = {
                            high: 'bg-red-500',
                            medium: 'bg-yellow-500',
                            low: 'bg-green-500'
                          }
                          
                          return Object.entries(priorityStats).map(([priority, count]) => {
                            const percentage = checklists.length > 0 ? (count / checklists.length) * 100 : 0
                            return (
                              <div key={priority} className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <div className={`w-3 h-3 ${priorityColors[priority as keyof typeof priorityColors] || 'bg-gray-500'} rounded-full`}></div>
                                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 capitalize">{priority}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-16 sm:w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div 
                                      className={`${priorityColors[priority as keyof typeof priorityColors] || 'bg-gray-500'} h-2 rounded-full transition-all duration-1000 ease-out`}
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-6 sm:w-8 text-right">
                                    {count}
                                  </span>
                                </div>
                              </div>
                            )
                          })
                        })()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Asset Compliance & Maintenance */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center text-sm sm:text-lg">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-purple-500" />
                    Asset Compliance & Maintenance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {/* Compliance Status */}
                    <div>
                      <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Compliance Status</h4>
                      <div className="space-y-3">
                        {(() => {
                          const complianceStats = {
                            withCertifications: assets.filter(a => a.compliance?.certifications && a.compliance.certifications.length > 0).length,
                            withRegulatory: assets.filter(a => a.compliance?.regulatoryRequirements && a.compliance.regulatoryRequirements.length > 0).length,
                            withDocuments: assets.filter(a => a.documents && a.documents.length > 0).length
                          }
                          
                          return [
                            { label: 'With Certifications', count: complianceStats.withCertifications, color: 'bg-green-500' },
                            { label: 'With Regulatory Requirements', count: complianceStats.withRegulatory, color: 'bg-blue-500' },
                            { label: 'With Documents', count: complianceStats.withDocuments, color: 'bg-purple-500' }
                          ].map((item, index) => {
                            const percentage = dashboardStats.totalAssets > 0 ? (item.count / dashboardStats.totalAssets) * 100 : 0
                            return (
                              <div key={index} className="flex items-center justify-between">
                                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                                <div className="flex items-center space-x-2">
                                  <div className="w-20 sm:w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div 
                                      className={`${item.color} h-2 rounded-full transition-all duration-1000 ease-out`}
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-8 sm:w-12 text-right">
                                    {item.count}
                                  </span>
                                </div>
                              </div>
                            )
                          })
                        })()}
                      </div>
                    </div>

                    {/* Maintenance Schedule */}
                    <div>
                      <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Maintenance Schedule</h4>
                      <div className="space-y-3">
                        {(() => {
                          const maintenanceStats = {
                            scheduled: assets.filter(a => a.status === 'maintenance').length,
                            overdue: assets.filter(a => a.status === 'maintenance' && a.priority === 'high').length,
                            upcoming: assets.filter(a => a.status === 'active' && a.priority === 'high').length
                          }
                          
                          return [
                            { label: 'Currently in Maintenance', count: maintenanceStats.scheduled, color: 'bg-yellow-500' },
                            { label: 'High Priority Maintenance', count: maintenanceStats.overdue, color: 'bg-red-500' },
                            { label: 'Upcoming Maintenance', count: maintenanceStats.upcoming, color: 'bg-orange-500' }
                          ].map((item, index) => {
                            const percentage = dashboardStats.totalAssets > 0 ? (item.count / dashboardStats.totalAssets) * 100 : 0
                            return (
                              <div key={index} className="flex items-center justify-between">
                                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                                <div className="flex items-center space-x-2">
                                  <div className="w-20 sm:w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div 
                                      className={`${item.color} h-2 rounded-full transition-all duration-1000 ease-out`}
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-8 sm:w-12 text-right">
                                    {item.count}
                                  </span>
                                </div>
                              </div>
                            )
                          })
                        })()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Scan Success Message */}
        {scannedResult && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-800">Asset Scanned Successfully!</h4>
                  <p className="text-sm text-green-700">
                    QR Code scanned: <span className="font-mono font-medium">{scannedResult}</span>
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setScannedResult(null)}
                className="text-green-600 hover:bg-green-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Empty States */}
        {filteredAssets.length === 0 && activeTab === 'assets' && (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No assets found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm ? 'Try adjusting your search terms.' : 'No assets are currently available for your project.'}
            </p>
          </div>
        )}

        {filteredChecklists.length === 0 && activeTab === 'checklists' && (
          <div className="text-center py-12">
            <CheckSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No checklists found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm ? 'Try adjusting your search terms.' : 'No checklists are currently available for your project.'}
            </p>
          </div>
        )}
      </div>

      {/* Scanner Modal */}
      <ScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScanResult={setScannedResult}
        scannedResult={scannedResult}
        assets={assets}
      />
    </div>
  )
}