"use client"

import ProtectedRoute from "@/components/ProtectedRoute"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { PredictionsCard } from "@/components/ui/predictions-card"
import { PredictionDetailsModal } from "@/components/ui/prediction-details-modal"
import { InsightsCards } from "@/components/ui/insights-cards"
import { PerformanceChart } from "@/components/ui/performance-chart"
import { useAdminDashboard } from "@/contexts/AdminDashboard"
import { useState } from "react"
import { 
  Users, 
  Building2, 
  MapPin, 
  FileText, 
  TrendingUp,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Calendar,
  DollarSign,
  Target,
  Zap,
  Shield,
  RefreshCw,
  Brain,
  BarChart3,
  Settings,
  Bell
} from "lucide-react"

export default function AdminDashboardPage() {
  const { 
    dashboardData, 
    predictionsData,
    aiInsightsData,
    aiInsightCards,
    isLoading, 
    isPredictionsLoading,
    isAIInsightsLoading,
    error, 
    predictionsError,
    aiInsightsError,
    refreshDashboard, 
    refreshPredictions,
    refreshAIInsights
  } = useAdminDashboard()

  const [selectedPrediction, setSelectedPrediction] = useState<any>(null)
  const [isPredictionModalOpen, setIsPredictionModalOpen] = useState(false)

  // Calculate stats from API data
  const stats = [
    {
      title: "Total Assets",
      value: dashboardData?.data?.assetStats?.totalAssets?.toString() || "0",
      change: "+12%",
      icon: Building2,
      color: "bg-blue-500",
      trend: "up",
      description: "Total registered assets in the system"
    },
    {
      title: "Active Assets",
      value: dashboardData?.data?.assetStats?.activeAssets?.toString() || "0",
      change: "+8%",
      icon: CheckCircle,
      color: "bg-green-500",
      trend: "up",
      description: "Currently operational assets"
    },
    {
      title: "Under Maintenance",
      value: dashboardData?.data?.assetStats?.underMaintenance?.toString() || "0",
      change: "+3%",
      icon: Clock,
      color: "bg-yellow-500",
      trend: "up",
      description: "Assets currently being serviced"
    },
    {
      title: "Critical Assets",
      value: dashboardData?.data?.assetStats?.criticalAssets?.toString() || "0",
      change: "+15%",
      icon: AlertCircle,
      color: "bg-red-500",
      trend: "up",
      description: "Assets requiring immediate attention"
    }
  ]

  const assetStatus = [
    { 
      name: "Active Assets", 
      status: "operational", 
      count: dashboardData?.data?.assetStats?.activeAssets || 0, 
      percentage: dashboardData?.data?.assetStats?.totalAssets ? 
        Math.round((dashboardData.data.assetStats.activeAssets / dashboardData.data.assetStats.totalAssets) * 100) : 0 
    },
    { 
      name: "Under Maintenance", 
      status: "maintenance", 
      count: dashboardData?.data?.assetStats?.underMaintenance || 0, 
      percentage: dashboardData?.data?.assetStats?.totalAssets ? 
        Math.round((dashboardData.data.assetStats.underMaintenance / dashboardData.data.assetStats.totalAssets) * 100) : 0 
    },
    { 
      name: "Inactive Assets", 
      status: "inactive", 
      count: dashboardData?.data?.assetStats?.inactiveAssets || 0, 
      percentage: dashboardData?.data?.assetStats?.totalAssets ? 
        Math.round((dashboardData.data.assetStats.inactiveAssets / dashboardData.data.assetStats.totalAssets) * 100) : 0 
    },
    { 
      name: "Critical Assets", 
      status: "warning", 
      count: dashboardData?.data?.assetStats?.criticalAssets || 0, 
      percentage: dashboardData?.data?.assetStats?.totalAssets ? 
        Math.round((dashboardData.data.assetStats.criticalAssets / dashboardData.data.assetStats.totalAssets) * 100) : 0 
    }
  ]

  const recentActivities = [
    {
      id: 1,
      action: "Asset maintenance scheduled",
      asset: "HVAC Unit #123",
      time: "2 minutes ago",
      status: "pending",
      icon: Clock,
      priority: "medium"
    },
    {
      id: 2,
      action: "User access granted",
      user: "john.doe@company.com",
      time: "5 minutes ago",
      status: "completed",
      icon: CheckCircle,
      priority: "low"
    },
    {
      id: 3,
      action: "System alert resolved",
      alert: "High temperature detected",
      time: "10 minutes ago",
      status: "resolved",
      icon: AlertCircle,
      priority: "high"
    },
    {
      id: 4,
      action: "Report generated",
      report: "Monthly Asset Report",
      time: "15 minutes ago",
      status: "completed",
      icon: FileText,
      priority: "low"
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-500'
      case 'maintenance': return 'bg-yellow-500'
      case 'inactive': return 'bg-gray-500'
      case 'warning': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleViewPredictionDetails = (prediction: any) => {
    setSelectedPrediction(prediction)
    setIsPredictionModalOpen(true)
  }

  const handleExportPrediction = (prediction: any) => {
    // Implement export functionality
    console.log('Exporting prediction:', prediction)
  }

  const handleExportPredictions = () => {
    // Implement bulk export functionality
    console.log('Exporting all predictions')
  }

  const handleRefreshAIInsights = () => {
    refreshAIInsights('performance', '90_days')
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-gray-50">
          <div className="flex-1 overflow-auto">
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner size="lg" />
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-gray-50">
          <div className="flex-1 overflow-auto">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="mb-4">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load dashboard data</h3>
                  <p className="text-gray-600 mb-4">{error}</p>
                </div>
                <Button onClick={refreshDashboard} disabled={isLoading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 overflow-auto">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">Welcome back! Here's what's happening with your facilities.</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshDashboard}
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefreshAIInsights}
                  disabled={isAIInsightsLoading}
                >
                  <Brain className={`w-4 h-4 mr-2 ${isAIInsightsLoading ? 'animate-spin' : ''}`} />
                  Update AI Insights
                </Button>
                <Button variant="outline" size="sm">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Asset
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="p-6 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        <div className="flex items-center mt-2">
                          <TrendingUp className={`w-4 h-4 mr-1 ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`} />
                          <span className={`text-sm ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                            {stat.change} from last month
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">{stat.description}</p>
                      </div>
                      <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center shadow-lg`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Performance Analytics Chart */}
            <PerformanceChart
              aiInsightsData={aiInsightsData}
              isLoading={isAIInsightsLoading}
              error={aiInsightsError}
              onRefresh={handleRefreshAIInsights}
            />

            {/* Asset Status and Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Asset Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                    Asset Status
                  </CardTitle>
                  <CardDescription>Current operational status distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {assetStatus.map((asset, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">{asset.name}</span>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(asset.status)}`}></div>
                            <span className="text-xs text-gray-500">{asset.count} units</span>
                          </div>
                        </div>
                        <Progress value={asset.percentage} className="h-2" />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Percentage</span>
                          <span>{asset.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center">
                          <Activity className="w-5 h-5 mr-2 text-green-600" />
                          Recent Activity
                        </CardTitle>
                        <CardDescription>Latest system activities and updates</CardDescription>
                      </div>
                      <Button variant="outline" size="sm">
                        View All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <activity.icon className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <p className="text-sm font-medium text-gray-900">
                                {activity.action}
                              </p>
                              <Badge className={getPriorityColor(activity.priority)}>
                                {activity.priority}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500">
                              {activity.asset || activity.user || activity.alert || activity.report}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                          </div>
                          <div className={`w-2 h-2 rounded-full ${
                            activity.status === 'completed' ? 'bg-green-500' :
                            activity.status === 'pending' ? 'bg-yellow-500' :
                            'bg-blue-500'
                          }`} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Predictions Analytics */}
            <div className="grid grid-cols-1 gap-6">
              <PredictionsCard
                predictions={predictionsData?.predictions || []}
                isLoading={isPredictionsLoading}
                onViewDetails={handleViewPredictionDetails}
                onExport={handleExportPredictions}
              />
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-orange-600" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-20 flex-col hover:bg-blue-50 transition-colors">
                    <Users className="w-6 h-6 mb-2 text-blue-600" />
                    <span className="text-sm font-medium">Add User</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col hover:bg-green-50 transition-colors">
                    <Building2 className="w-6 h-6 mb-2 text-green-600" />
                    <span className="text-sm font-medium">Add Asset</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col hover:bg-purple-50 transition-colors">
                    <MapPin className="w-6 h-6 mb-2 text-purple-600" />
                    <span className="text-sm font-medium">Add Location</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col hover:bg-orange-50 transition-colors">
                    <FileText className="w-6 h-6 mb-2 text-orange-600" />
                    <span className="text-sm font-medium">Generate Report</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>

        {/* Prediction Details Modal */}
        <PredictionDetailsModal
          prediction={selectedPrediction}
          isOpen={isPredictionModalOpen}
          onClose={() => {
            setIsPredictionModalOpen(false)
            setSelectedPrediction(null)
          }}
          onExport={handleExportPrediction}
        />
      </div>
    </ProtectedRoute>
  )
} 