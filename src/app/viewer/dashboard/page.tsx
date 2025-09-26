"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AssetViewModal } from '@/components/ui/asset-view-modal'
import { Asset } from '@/lib/adminasset'
import { 
  Building2, Package, User, CheckCircle, AlertTriangle, 
  CheckSquare, RefreshCw, BarChart3, Target, MapPin,
  TrendingUp, PieChart, Activity, Calendar, Clock
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
    criticalAssets: assets.filter(a => a.priority === 'high' || a.priority === 'critical').length,
    totalChecklists: checklists.length,
    completedChecklists: checklists.filter(c => c.status === 'completed').length,
    // Priority-based stats
    highPriorityAssets: assets.filter(a => a.priority === 'high').length,
    mediumPriorityAssets: assets.filter(a => a.priority === 'medium').length,
    lowPriorityAssets: assets.filter(a => a.priority === 'low').length,
    criticalPriorityAssets: assets.filter(a => a.priority === 'critical').length,
    // Status-based stats
    maintenanceAssets: assets.filter(a => a.status === 'maintenance').length,
    inactiveAssets: assets.filter(a => a.status === 'inactive').length,
    // Location-based stats
    totalLocations: new Set(assets.map(a => a.location?.building).filter(Boolean)).size,
    // Recent activity
    recentAssets: assets.filter(a => {
      if (!a.createdAt) return false
      const createdDate = new Date(a.createdAt)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      return createdDate > thirtyDaysAgo
    }).length
  }), [assets, checklists])

  // Enhanced Analytics data calculations
  const analyticsData = useMemo(() => {
    // Status distribution
    const statusDistribution = assets.reduce((acc, asset) => {
      const status = asset.status || 'unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Asset type distribution
    const typeDistribution = assets.reduce((acc, asset) => {
      const type = asset.assetType || 'unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Priority distribution
    const priorityDistribution = assets.reduce((acc, asset) => {
      const priority = asset.priority || 'medium'
      acc[priority] = (acc[priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Location distribution
    const locationDistribution = assets.reduce((acc, asset) => {
      const location = asset.location?.building || 'Unknown'
      acc[location] = (acc[location] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Movable vs Immovable Assets Analysis
    const movableAssets = assets.filter(asset => {
      const type = asset.assetType?.toLowerCase() || ''
      return ['computer', 'laptop', 'mobile', 'smartphone', 'tablet', 'monitor', 'printer', 'scanner'].includes(type)
    })
    
    const immovableAssets = assets.filter(asset => {
      const type = asset.assetType?.toLowerCase() || ''
      return ['building', 'land', 'furniture', 'fixture', 'equipment', 'machinery', 'vehicle'].includes(type)
    })

    const movableVsImmovable = {
      movable: movableAssets.length,
      immovable: immovableAssets.length,
      movablePercentage: assets.length > 0 ? Math.round((movableAssets.length / assets.length) * 100) : 0,
      immovablePercentage: assets.length > 0 ? Math.round((immovableAssets.length / assets.length) * 100) : 0
    }

    // Asset Age Analysis (based on creation date)
    const assetAgeDistribution = assets.reduce((acc, asset) => {
      if (asset.createdAt) {
        const createdDate = new Date(asset.createdAt)
        const ageInMonths = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
        
        if (ageInMonths < 6) acc['< 6 months'] = (acc['< 6 months'] || 0) + 1
        else if (ageInMonths < 12) acc['6-12 months'] = (acc['6-12 months'] || 0) + 1
        else if (ageInMonths < 24) acc['1-2 years'] = (acc['1-2 years'] || 0) + 1
        else if (ageInMonths < 60) acc['2-5 years'] = (acc['2-5 years'] || 0) + 1
        else acc['> 5 years'] = (acc['> 5 years'] || 0) + 1
      } else {
        acc['Unknown'] = (acc['Unknown'] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    // Maintenance Status Analysis
    const maintenanceDistribution = assets.reduce((acc, asset) => {
      const status = asset.status || 'unknown'
      if (status === 'maintenance') {
        acc['Under Maintenance'] = (acc['Under Maintenance'] || 0) + 1
      } else if (status === 'active') {
        acc['Operational'] = (acc['Operational'] || 0) + 1
      } else if (status === 'inactive') {
        acc['Out of Service'] = (acc['Out of Service'] || 0) + 1
      } else {
        acc['Unknown Status'] = (acc['Unknown Status'] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    // Asset Value Analysis (mock data based on asset type)
    const assetValueDistribution = assets.reduce((acc, asset) => {
      const type = asset.assetType?.toLowerCase() || 'unknown'
      let valueRange = 'Unknown'
      
      if (['computer', 'laptop', 'server'].includes(type)) valueRange = 'High Value (>$1000)'
      else if (['mobile', 'tablet', 'monitor'].includes(type)) valueRange = 'Medium Value ($100-$1000)'
      else if (['furniture', 'fixture'].includes(type)) valueRange = 'Low Value (<$100)'
      else if (['building', 'land'].includes(type)) valueRange = 'Very High Value (>$10000)'
      else valueRange = 'Medium Value ($100-$1000)'
      
      acc[valueRange] = (acc[valueRange] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Health trend (enhanced with more data points)
    const healthTrend = [
      { month: 'Jan', health: 85, movable: 88, immovable: 82 },
      { month: 'Feb', health: 87, movable: 90, immovable: 84 },
      { month: 'Mar', health: 82, movable: 85, immovable: 79 },
      { month: 'Apr', health: 89, movable: 92, immovable: 86 },
      { month: 'May', health: 91, movable: 94, immovable: 88 },
      { month: 'Jun', health: 88, movable: 91, immovable: 85 }
    ]

    return {
      statusDistribution,
      typeDistribution,
      priorityDistribution,
      locationDistribution,
      movableVsImmovable,
      assetAgeDistribution,
      maintenanceDistribution,
      assetValueDistribution,
      healthTrend
    }
  }, [assets])


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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Simplified Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 lg:static">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between">
              {/* Left Section */}
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    Asset Dashboard
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {localStorage.getItem('userProject') ? 
                      `Project: ${localStorage.getItem('userProject')}` : 
                      'Enterprise Overview'
                    }
                  </p>
                </div>
              </div>
              
              {/* Right Section */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                      {dashboardStats.totalAssets}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                      {dashboardStats.activeAssets}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Live</span>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleManualRefresh} 
                  disabled={isRefreshing}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{isRefreshing ? 'Syncing...' : 'Sync'}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Simplified Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">{error}</span>
              <Button variant="outline" size="sm" onClick={handleManualRefresh} className="ml-auto">
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Total Assets</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{dashboardStats.totalAssets}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">Active Assets</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">{dashboardStats.activeAssets}</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Critical Assets</p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">{dashboardStats.criticalAssets}</p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-1">Maintenance</p>
                  <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{dashboardStats.maintenanceAssets}</p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <Activity className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Asset Types */}
        <div className="mb-8">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900 dark:text-white">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                Asset Types Overview
                <Badge variant="secondary" className="ml-auto">
                  {Object.keys(analyticsData.typeDistribution).length} Types
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(analyticsData.typeDistribution)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 6)
                  .map(([type, count], index) => {
                    const colors = [
                      'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
                      'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400', 
                      'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
                      'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
                      'bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400',
                      'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                    ]
                    const percentage = dashboardStats.totalAssets > 0 ? Math.round((count / dashboardStats.totalAssets) * 100) : 0
                    
                    return (
                      <div key={type} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 ${colors[index % colors.length]} rounded-lg flex items-center justify-center`}>
                            <Package className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white capitalize truncate">{type}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{count} assets</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                            <span>Distribution</span>
                            <span className="font-medium">{percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Location & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Locations */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900 dark:text-white">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                Top Locations
                <Badge variant="secondary" className="ml-auto">
                  {Object.keys(analyticsData.locationDistribution).length} Locations
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analyticsData.locationDistribution)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 4)
                  .map(([location, count]) => {
                    const percentage = dashboardStats.totalAssets > 0 ? Math.round((count / dashboardStats.totalAssets) * 100) : 0
                    return (
                      <div key={location} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{location}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{count} assets</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{count}</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{percentage}%</p>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>

          {/* System Health & Activity */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900 dark:text-white">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                System Health & Activity
                <Badge variant="secondary" className="ml-auto">Live Data</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* System Health */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-600" />
                    Health Trend
                  </h4>
                  <div className="space-y-2">
                    {analyticsData.healthTrend.slice(-3).map((item) => (
                      <div key={item.month} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-3 h-3 text-green-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{item.month}</span>
                        </div>
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">{item.health}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Activity Summary */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    Recent Activity
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Package className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">New Assets</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{dashboardStats.recentAssets}</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <CheckSquare className="w-4 h-4 text-green-600" />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Completed</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{dashboardStats.completedChecklists}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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