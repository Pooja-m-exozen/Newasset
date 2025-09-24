"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AssetViewModal } from '@/components/ui/asset-view-modal'
import { Asset } from '@/lib/adminasset'
import { 
  Building2, Search, Eye, Package, User, CheckCircle, AlertTriangle, 
  CheckSquare, RefreshCw, BarChart3, Target, Download, MapPin
} from 'lucide-react'

interface Checklist {
  _id: string
  title: string
  type: string
  status: string
  priority: string
  location: { building: string; floor: string }
  createdAt: string
}

export default function ViewerDashboard() {
  const { theme } = useTheme()
  const [assets, setAssets] = useState<Asset[]>([])
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [error, setError] = useState<string | null>(null)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [showAssetModal, setShowAssetModal] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch real-time data from API
  const fetchAssets = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('Authentication token not found')
      }

      const response = await fetch('https://digitalasset.zenapi.co.in/api/assets?page=1&limit=1000', {
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
            const assetProjectName = asset.project?.projectName
            return assetProjectName === userProject
          })
          setAssets(projectAssets)
        } else {
          setAssets(allAssets)
        }
      } else {
        throw new Error('Failed to fetch assets')
      }
    } catch (err) {
      console.error('Error fetching assets:', err)
      // Fallback to empty array
      setAssets([])
    }
  }, [])

  const fetchChecklists = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('Authentication token not found')
      }

      const response = await fetch('https://digitalasset.zenapi.co.in/api/checklists', {
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
        const allChecklists = data.data || data.checklists || []
        setChecklists(allChecklists)
      } else {
        throw new Error('Failed to fetch checklists')
      }
    } catch (err) {
      console.error('Error fetching checklists:', err)
      // Fallback to empty array
      setChecklists([])
    }
  }, [])

  const fetchAllData = useCallback(async (showLoading = false) => {
    if (showLoading) setIsRefreshing(true)
    setError(null)
    try {
      await Promise.all([fetchAssets(), fetchChecklists()])
      setLastRefresh(new Date())
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to fetch data. Please try again.')
    } finally {
      setIsRefreshing(false)
      if (showLoading) setIsLoading(false)
    }
  }, [fetchAssets, fetchChecklists])

  // Initial data fetch
  useEffect(() => {
    fetchAllData(true)
  }, [fetchAllData])

  // Manual refresh function - no more auto-refresh
  const handleManualRefresh = () => {
    fetchAllData(true)
  }

  const dashboardStats = useMemo(() => ({
    totalAssets: assets.length,
    activeAssets: assets.filter(a => a.status === 'active').length,
    criticalAssets: assets.filter(a => a.priority === 'high').length,
    totalChecklists: checklists.length,
    completedChecklists: checklists.filter(c => c.status === 'completed').length
  }), [assets, checklists])

  // Filtered assets based on search
  const filteredAssets = useMemo(() => {
    if (!searchTerm) return assets
    return assets.filter(asset => 
      asset.tagId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.assetType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.location?.building?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.assignedTo?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [assets, searchTerm])

  // Handle asset view
  const handleViewAsset = (asset: Asset) => {
    setSelectedAsset(asset)
    setShowAssetModal(true)
  }

  // Handle asset modal close
  const handleCloseAssetModal = () => {
    setShowAssetModal(false)
    setSelectedAsset(null)
  }

  // Handle asset update
  const handleAssetUpdated = (updatedAsset: Asset) => {
    setAssets(prevAssets => 
      prevAssets.map(asset => 
        asset._id === updatedAsset._id ? updatedAsset : asset
      )
    )
    setSelectedAsset(updatedAsset)
  }

  if (isLoading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Loading Dashboard...</h3>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-2`}>Please wait while we load all your assets</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* Main Content */}
      <main className="space-y-8">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
              <AlertTriangle className="h-6 w-6 flex-shrink-0" />
              <span className="font-medium text-lg">{error}</span>
              <Button variant="outline" size="sm" onClick={handleManualRefresh} className="ml-auto border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30">
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                {localStorage.getItem('userProject') ? 
                  `Project: ${localStorage.getItem('userProject')}` : 
                  'Enterprise Overview'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Last Updated</p>
              <p className="font-semibold text-gray-900 dark:text-white">{lastRefresh.toLocaleTimeString()}</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleManualRefresh} 
              disabled={isRefreshing}
              className="border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-md"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'} border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-xl flex items-center justify-center">
                  <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{dashboardStats.totalAssets}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Assets</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">All assets loaded</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'} border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{dashboardStats.activeAssets}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Active Assets</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'} border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900 dark:to-red-800 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{dashboardStats.criticalAssets}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Critical Assets</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'} border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 rounded-xl flex items-center justify-center">
                  <CheckSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{dashboardStats.totalChecklists}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Checklists</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Asset Health Score */}
          <Card className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'} border border-gray-200 dark:border-gray-700 shadow-lg`}>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <Target className="h-6 w-6 mr-3 text-blue-600 dark:text-blue-400" />
                Asset Health Score
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center space-x-8">
                {/* Enhanced Circular Progress */}
                <div className="relative flex-shrink-0">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48" cy="48" r="42"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    <circle
                      cx="48" cy="48" r="42"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 42}`}
                      strokeDashoffset={`${2 * Math.PI * 42 * (1 - (dashboardStats.activeAssets / Math.max(dashboardStats.totalAssets, 1)))}`}
                      className="text-blue-600 dark:text-blue-400 transition-all duration-1000 ease-out"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {dashboardStats.totalAssets > 0 ? Math.round((dashboardStats.activeAssets / dashboardStats.totalAssets) * 100) : 0}%
                    </span>
                  </div>
                </div>
                
                {/* Enhanced Health Metrics */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Health Level:</span>
                    <Badge className={`text-xs px-3 py-1 ${
                      (() => {
                        const healthPercent = dashboardStats.totalAssets > 0 ? (dashboardStats.activeAssets / dashboardStats.totalAssets) * 100 : 0;
                        if (healthPercent >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
                        if (healthPercent >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
                        if (healthPercent >= 40) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
                        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
                      })()
                    }`}>
                      {(() => {
                        const healthPercent = dashboardStats.totalAssets > 0 ? (dashboardStats.activeAssets / dashboardStats.totalAssets) * 100 : 0;
                        if (healthPercent >= 80) return 'Excellent';
                        if (healthPercent >= 60) return 'Good';
                        if (healthPercent >= 40) return 'Fair';
                        return 'Poor';
                      })()}
                    </Badge>
                  </div>
                  
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${dashboardStats.totalAssets > 0 ? (dashboardStats.activeAssets / dashboardStats.totalAssets) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="font-bold text-lg text-green-700 dark:text-green-300">{dashboardStats.activeAssets}</div>
                      <div className="text-sm text-green-600 dark:text-green-400">Healthy</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="font-bold text-lg text-red-700 dark:text-red-300">{dashboardStats.totalAssets - dashboardStats.activeAssets}</div>
                      <div className="text-sm text-red-600 dark:text-red-400">Attention</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Asset Distribution */}
          <Card className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'} border border-gray-200 dark:border-gray-700 shadow-lg`}>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <BarChart3 className="h-6 w-6 mr-3 text-purple-600 dark:text-purple-400" />
                Asset Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-6">
                {/* Enhanced Distribution Bars */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Assets</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div 
                          className="bg-blue-500 h-3 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${dashboardStats.totalAssets > 0 ? (dashboardStats.activeAssets / dashboardStats.totalAssets) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white w-12 text-right">
                        {dashboardStats.activeAssets}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Critical Assets</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div 
                          className="bg-red-500 h-3 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${dashboardStats.totalAssets > 0 ? (dashboardStats.criticalAssets / dashboardStats.totalAssets) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white w-12 text-right">
                        {dashboardStats.criticalAssets}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Inactive Assets</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div 
                          className="bg-gray-500 h-3 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${dashboardStats.totalAssets > 0 ? ((dashboardStats.totalAssets - dashboardStats.activeAssets - dashboardStats.criticalAssets) / dashboardStats.totalAssets) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white w-12 text-right">
                        {dashboardStats.totalAssets - dashboardStats.activeAssets - dashboardStats.criticalAssets}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Summary */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <Package className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Assets</span>
                    </div>
                    <span className="font-bold text-2xl text-gray-900 dark:text-white">{dashboardStats.totalAssets}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Assets Table */}
        <Card className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'} border border-gray-200 dark:border-gray-700 shadow-lg`}>
          <CardHeader className="pb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex items-center space-x-3">
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <Package className="h-6 w-6 mr-3 text-gray-600 dark:text-gray-400" />
                  Asset Inventory ({dashboardStats.totalAssets} Total)
                  {localStorage.getItem('userProject') && (
                    <span className="ml-3 text-sm text-gray-500 dark:text-gray-400 font-normal bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                      {localStorage.getItem('userProject')}
                    </span>
                  )}
                </CardTitle>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search assets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing <span className="font-semibold text-gray-900 dark:text-white">{filteredAssets.length}</span> of <span className="font-semibold text-gray-900 dark:text-white">{assets.length}</span> total assets
                  </div>
                  <Button variant="outline" size="sm" className="border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 transition-all duration-200">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Mobile Asset Cards */}
            <div className="lg:hidden space-y-4">
              {filteredAssets.map((asset) => (
                <div key={asset._id} className={`${theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-gray-50'} border rounded-xl p-5 space-y-4 hover:shadow-md transition-all duration-200`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{asset.tagId}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{asset.assetType}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <Badge 
                        variant={asset.status === 'active' ? 'default' : 'secondary'}
                        className={`text-xs px-3 py-1 ${
                          asset.status === 'active' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}
                      >
                        {asset.status}
                      </Badge>
                      <Badge 
                        variant="outline"
                        className="text-xs px-3 py-1 border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300"
                      >
                        {asset.priority}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center text-gray-700 dark:text-gray-300">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{asset.location?.building || 'N/A'}, {asset.location?.floor || 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{asset.assignedTo?.name || 'Unassigned'}</span>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-sm"
                    onClick={() => handleViewAsset(asset)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              ))}
            </div>

            {/* Desktop Asset Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-4 px-6 font-bold text-gray-700 dark:text-gray-300 text-sm">Asset ID</th>
                    <th className="text-left py-4 px-6 font-bold text-gray-700 dark:text-gray-300 text-sm">Type</th>
                    <th className="text-left py-4 px-6 font-bold text-gray-700 dark:text-gray-300 text-sm">Status</th>
                    <th className="text-left py-4 px-6 font-bold text-gray-700 dark:text-gray-300 text-sm">Priority</th>
                    <th className="text-left py-4 px-6 font-bold text-gray-700 dark:text-gray-300 text-sm">Location</th>
                    <th className="text-left py-4 px-6 font-bold text-gray-700 dark:text-gray-300 text-sm">Assigned To</th>
                    <th className="text-left py-4 px-6 font-bold text-gray-700 dark:text-gray-300 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredAssets.map((asset) => (
                    <tr key={asset._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-lg flex items-center justify-center mr-4">
                            <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="font-bold text-gray-900 dark:text-white">{asset.tagId}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">{asset.assetType}</span>
                      </td>
                      <td className="py-4 px-6">
                        <Badge className={`px-3 py-1 ${
                          asset.status === 'active' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {asset.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant="outline" className="px-3 py-1 border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300">
                          {asset.priority}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center text-gray-700 dark:text-gray-300">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{asset.location?.building || 'N/A'}, {asset.location?.floor || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center text-gray-700 dark:text-gray-300">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{asset.assignedTo?.name || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-sm"
                          onClick={() => handleViewAsset(asset)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredAssets.length === 0 && (
              <div className="text-center py-16">
                <Package className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {searchTerm ? 'No assets found' : 'No assets available'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  {searchTerm 
                    ? `No assets match your search for "${searchTerm}". Try adjusting your search terms.`
                    : localStorage.getItem('userProject') 
                      ? `No assets are currently available for project: ${localStorage.getItem('userProject')}` 
                      : 'No assets are currently available.'
                  }
                </p>
                {searchTerm && (
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchTerm('')} 
                    className="mt-4 border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Asset View Modal */}
      <AssetViewModal
        asset={selectedAsset}
        isOpen={showAssetModal}
        onClose={handleCloseAssetModal}
        onAssetUpdated={handleAssetUpdated}
      />
    </div>
  )
}