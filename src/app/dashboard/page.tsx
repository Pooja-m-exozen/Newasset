"use client"

import Sidebar from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Users, 
  Building2, 
  MapPin, 
  FileText, 
  BarChart3, 
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
  Eye,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  Target,
  Zap,
  Shield,
  Wifi,
  Battery,
  Thermometer,
  Gauge
} from "lucide-react"

export default function DashboardPage() {
  const stats = [
    {
      title: "Total Users",
      value: "1,234",
      change: "+12%",
      icon: Users,
      color: "bg-blue-500",
      trend: "up"
    },
    {
      title: "Active Assets",
      value: "856",
      change: "+8%",
      icon: Building2,
      color: "bg-green-500",
      trend: "up"
    },
    {
      title: "Locations",
      value: "45",
      change: "+3%",
      icon: MapPin,
      color: "bg-purple-500",
      trend: "up"
    },
    {
      title: "Reports Generated",
      value: "2,341",
      change: "+15%",
      icon: FileText,
      color: "bg-orange-500",
      trend: "up"
    }
  ]

  const assetStatus = [
    { name: "HVAC Systems", status: "operational", count: 45, percentage: 85 },
    { name: "Electrical", status: "operational", count: 32, percentage: 92 },
    { name: "Plumbing", status: "maintenance", count: 18, percentage: 65 },
    { name: "Security", status: "operational", count: 28, percentage: 88 },
    { name: "Fire Safety", status: "warning", count: 12, percentage: 45 }
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

  const performanceData = [
    { month: "Jan", efficiency: 85, maintenance: 12, alerts: 3 },
    { month: "Feb", efficiency: 88, maintenance: 8, alerts: 2 },
    { month: "Mar", efficiency: 92, maintenance: 15, alerts: 1 },
    { month: "Apr", efficiency: 89, maintenance: 10, alerts: 4 },
    { month: "May", efficiency: 94, maintenance: 6, alerts: 1 },
    { month: "Jun", efficiency: 91, maintenance: 9, alerts: 2 }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-500'
      case 'maintenance': return 'bg-yellow-500'
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

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back! Here's what's happening with your facilities.</p>
            </div>
            <div className="flex items-center space-x-4">
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
                    </div>
                    <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center shadow-lg`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Performance Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* System Performance Chart */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>System Performance</CardTitle>
                      <CardDescription>Real-time monitoring of key metrics</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Performance Chart */}
                    <div className="h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Efficiency Trend</h3>
                        <Badge variant="secondary">Live</Badge>
                      </div>
                      <div className="flex items-end justify-between h-40">
                        {performanceData.map((data, index) => (
                          <div key={index} className="flex flex-col items-center">
                            <div className="w-8 bg-blue-500 rounded-t-sm" style={{ height: `${data.efficiency}%` }}></div>
                            <span className="text-xs text-gray-600 mt-2">{data.month}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">94%</div>
                        <div className="text-sm text-green-600">Efficiency</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">12</div>
                        <div className="text-sm text-blue-600">Active Alerts</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">$45K</div>
                        <div className="text-sm text-purple-600">Cost Saved</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Asset Status */}
            <Card>
              <CardHeader>
                <CardTitle>Asset Status</CardTitle>
                <CardDescription>Current operational status</CardDescription>
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
                        <span>Operational</span>
                        <span>{asset.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity and Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent Activity</CardTitle>
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

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20 flex-col hover:bg-blue-50">
                    <Users className="w-6 h-6 mb-2 text-blue-600" />
                    <span className="text-sm font-medium">Add User</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col hover:bg-green-50">
                    <Building2 className="w-6 h-6 mb-2 text-green-600" />
                    <span className="text-sm font-medium">Add Asset</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col hover:bg-purple-50">
                    <MapPin className="w-6 h-6 mb-2 text-purple-600" />
                    <span className="text-sm font-medium">Add Location</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col hover:bg-orange-50">
                    <FileText className="w-6 h-6 mb-2 text-orange-600" />
                    <span className="text-sm font-medium">Generate Report</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Asset Monitoring */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Asset Monitoring</CardTitle>
                  <CardDescription>Real-time asset performance and health</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Thermometer className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Temperature</p>
                      <p className="text-lg font-bold text-blue-600">24°C</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <Battery className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Power</p>
                      <p className="text-lg font-bold text-green-600">98%</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Wifi className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Connectivity</p>
                      <p className="text-lg font-bold text-purple-600">Online</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                      <Gauge className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Performance</p>
                      <p className="text-lg font-bold text-orange-600">94%</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
} 