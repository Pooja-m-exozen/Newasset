"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  // Building2, 
  MapPin, 
  Search, 
  Eye, 
  // Filter,
  Package,
  User,
  // Calendar,
  Download,
  QrCode,
  Globe,
  // Smartphone,
  Monitor,
  Server,
  Database,
  Wifi,
  Shield,
  AlertCircle,
  // CheckCircle,
  // Clock,
  // Map
} from 'lucide-react'

interface Asset {
  _id: string
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
  compliance: {
    certifications: string[]
    expiryDates: string[]
    regulatoryRequirements: string[]
  }
  digitalAssets: {
    qrCode: {
      url: string
      data: {
        t: string // tagId
        a: string // assetType
        s: string // status
        b: string // brand
        m: string // model
        st: string // status
        p: string // priority
        l: {
          latitude: string
          longitude: string
          floor: string
          room: string
          building: string
        }
        u: string // user/assignedTo
        pr: string | null // project
        lm: string | null // lastMaintenance
        nm: string | null // nextMaintenance
        url: string
        ts: number
        c: string
      }
      generatedAt: string
    }
  }
  photos: string[]
  scanHistory: string[]
  createdAt: string
  updatedAt: string
}

export default function ViewerAssets() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([])

  useEffect(() => {
    fetchAssets()
  }, [])

  useEffect(() => {
    // Apply filters
    const filtered = assets.filter(asset => {
      const assetData = asset.digitalAssets.qrCode.data
      const matchesSearch = 
        assetData.t.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assetData.a.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assetData.b.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assetData.m.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.location.building.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.location.room.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || assetData.st === statusFilter
      const matchesPriority = priorityFilter === 'all' || assetData.p === priorityFilter
      const matchesProject = projectFilter === 'all' || asset.project.projectName === projectFilter
      
      return matchesSearch && matchesStatus && matchesPriority && matchesProject
    })
    
    setFilteredAssets(filtered)
  }, [searchTerm, statusFilter, priorityFilter, projectFilter, assets])

  const fetchAssets = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
      if (!token) {
        setError('Authentication required. Please login to view assets.')
        return
      }

      const response = await fetch('http://192.168.0.5:5021/api/assets', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.assets) {
          setAssets(data.assets)
        } else {
          setError('Failed to load assets. Please try again.')
        }
      } else if (response.status === 401) {
        setError('Authentication failed. Please login again.')
        localStorage.removeItem('authToken')
        sessionStorage.removeItem('authToken')
      } else {
        setError('Failed to fetch assets. Please try again.')
      }
    } catch (error) {
      console.error('Error fetching assets:', error)
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-700'
      case 'inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-700'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-700'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-700'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700'
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-700'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-700'
    }
  }

  const getAssetTypeIcon = (assetType: string) => {
    switch (assetType.toLowerCase()) {
      case 'lift':
        return <Package className="h-5 w-5" />
      case 'computer':
      case 'laptop':
        return <Monitor className="h-5 w-5" />
      case 'server':
        return <Server className="h-5 w-5" />
      case 'database':
        return <Database className="h-5 w-5" />
      case 'network':
      case 'wifi':
        return <Wifi className="h-5 w-5" />
      case 'security':
        return <Shield className="h-5 w-5" />
      default:
        return <Package className="h-5 w-5" />
    }
  }

  const exportAssets = () => {
    const csvContent = [
      ['Tag ID', 'Asset Type', 'Brand', 'Model', 'Status', 'Priority', 'Project', 'Building', 'Floor', 'Room', 'Assigned To', 'Created Date'],
      ...filteredAssets.map(asset => {
        const data = asset.digitalAssets.qrCode.data
        return [
          data.t,
          data.a,
          data.b,
          data.m,
          data.st,
          data.p,
          asset.project.projectName,
          asset.location.building,
          asset.location.floor,
          asset.location.room,
          data.u || 'Unassigned',
          new Date(asset.createdAt).toLocaleDateString()
        ]
      })
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `assets_export_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const getUniqueProjects = () => {
    const projects = assets.map(asset => asset.project.projectName)
    return ['all', ...Array.from(new Set(projects))]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-300">Loading assets...</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Please wait while we fetch your project assets</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Assets</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <Button onClick={fetchAssets} className="bg-blue-600 hover:bg-blue-700">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Project Assets
              </h1>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                {assets.length > 0 ? `Managing assets for ${assets[0]?.project.projectName}` : 'No project found'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <Button
                onClick={exportAssets}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mb-8 shadow-lg">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search assets by ID, type, brand, model, or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 text-base border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              
              {/* Status Filter */}
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-12 border-gray-300 dark:border-gray-600">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Priority Filter */}
              <div>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="h-12 border-gray-300 dark:border-gray-600">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Project Filter */}
              <div>
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger className="h-12 border-gray-300 dark:border-gray-600">
                    <SelectValue placeholder="Project" />
                  </SelectTrigger>
                  <SelectContent>
                    {getUniqueProjects().map(project => (
                      <SelectItem key={project} value={project}>
                        {project === 'all' ? 'All Projects' : project}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* View Mode Toggle and Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">{filteredAssets.length}</span> of <span className="font-medium">{assets.length}</span> assets
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-8 px-3"
                  >
                    Grid
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-8 px-3"
                  >
                    List
                  </Button>
                </div>
              </div>
              
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setPriorityFilter('all')
                  setProjectFilter('all')
                }}
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 h-10"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Assets Display */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAssets.map((asset) => {
              const data = asset.digitalAssets.qrCode.data
              return (
                <Card key={asset._id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {getAssetTypeIcon(data.a)}
                          <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                            {data.t}
                          </CardTitle>
                        </div>
                        <CardDescription className="text-gray-600 dark:text-gray-400 font-medium">
                          {data.a}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Badge className={`${getStatusColor(data.st)} text-xs font-medium px-2 py-1`}>
                          {data.st}
                        </Badge>
                        <Badge className={`${getPriorityColor(data.p)} text-xs font-medium px-2 py-1`}>
                          {data.p}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 text-sm">
                        <Package className="h-4 w-4 text-blue-500" />
                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                          {data.b} {data.m}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-3 text-sm">
                        <MapPin className="h-4 w-4 text-green-500" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {asset.location.building} • {asset.location.floor}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-3 text-sm">
                        <User className="h-4 w-4 text-purple-500" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {data.u || 'Unassigned'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-3 text-sm">
                        <Globe className="h-4 w-4 text-orange-500" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {asset.project.projectName}
                        </span>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 h-9"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-green-300 dark:border-green-600 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 h-9"
                        >
                          <QrCode className="h-4 w-4 mr-2" />
                          QR
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAssets.map((asset) => {
              const data = asset.digitalAssets.qrCode.data
              return (
                <Card key={asset._id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          {getAssetTypeIcon(data.a)}
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{data.t}</h3>
                            <p className="text-gray-600 dark:text-gray-400">{data.a}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Package className="h-4 w-4 text-blue-500" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {data.b} {data.m}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-green-500" />
                            <span className="text-gray-600 dark:text-gray-400">
                              {asset.location.building} • {asset.location.floor} • {asset.location.room}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-purple-500" />
                            <span className="text-gray-600 dark:text-gray-400">
                              {data.u || 'Unassigned'}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Globe className="h-4 w-4 text-orange-500" />
                            <span className="text-gray-600 dark:text-gray-400">
                              {asset.project.projectName}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-3 lg:space-y-0 lg:space-x-4">
                        <div className="flex space-x-2">
                          <Badge className={`${getStatusColor(data.st)} text-xs font-medium px-3 py-1`}>
                            {data.st}
                          </Badge>
                          <Badge className={`${getPriorityColor(data.p)} text-xs font-medium px-3 py-1`}>
                            {data.p}
                          </Badge>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-green-300 dark:border-green-600 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                          >
                            <QrCode className="h-4 w-4 mr-2" />
                            QR Code
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Empty State */}
        {filteredAssets.length === 0 && (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="text-center py-16">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                No assets found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || projectFilter !== 'all'
                  ? 'Try adjusting your search terms or filters to find more assets.'
                  : 'No assets are currently available in this project.'}
              </p>
              {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || projectFilter !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                    setPriorityFilter('all')
                    setProjectFilter('all')
                  }}
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                >
                  Clear All Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
