"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
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
  X
} from 'lucide-react'

interface Asset {
  _id: string
  tagId: string
  assetType: string
  brand: string
  model: string
  status: string
  priority: string
  location: {
    building: string
    floor: string
    room: string
  }
  assignedTo: {
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
  lastMaintenance?: string
  nextMaintenance?: string
  healthScore?: number
  utilization?: number
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
    room: string
  }
  items: Array<{
    serialNumber: number
    inspectionItem: string
    details: string
    status: string
    remarks?: string
  }>
  progress: number
  dueDate: string
  assignedTo: string[]
  tags: string[]
  createdAt: string
  updatedAt: string
}

// Sample data for better demonstration
const sampleAssets: Asset[] = [
  {
    _id: '1',
    tagId: 'AST-001',
    assetType: 'HVAC System',
    brand: 'Carrier',
    model: '48TC',
    status: 'active',
    priority: 'high',
    location: { building: 'Main Building', floor: '1st Floor', room: 'Server Room' },
    assignedTo: { name: 'John Smith', email: 'john@facilio.com' },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-03-20T14:30:00Z',
    lastMaintenance: '2024-02-15T09:00:00Z',
    nextMaintenance: '2024-04-15T09:00:00Z',
    healthScore: 85,
    utilization: 78
  },
  {
    _id: '2',
    tagId: 'AST-002',
    assetType: 'Generator',
    brand: 'Cummins',
    model: 'C1100D5',
    status: 'maintenance',
    priority: 'high',
    location: { building: 'Main Building', floor: 'Basement', room: 'Generator Room' },
    assignedTo: { name: 'Sarah Johnson', email: 'sarah@facilio.com' },
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-03-18T16:45:00Z',
    lastMaintenance: '2024-03-15T10:00:00Z',
    nextMaintenance: '2024-05-15T10:00:00Z',
    healthScore: 65,
    utilization: 45
  },
  {
    _id: '3',
    tagId: 'AST-003',
    assetType: 'Fire Suppression',
    brand: 'Kidde',
    model: 'FM-200',
    status: 'active',
    priority: 'medium',
    location: { building: 'Main Building', floor: '2nd Floor', room: 'Data Center' },
    assignedTo: { name: 'Mike Davis', email: 'mike@facilio.com' },
    createdAt: '2024-01-20T11:00:00Z',
    updatedAt: '2024-03-19T13:20:00Z',
    lastMaintenance: '2024-02-20T11:00:00Z',
    nextMaintenance: '2024-04-20T11:00:00Z',
    healthScore: 92,
    utilization: 60
  },
  {
    _id: '4',
    tagId: 'AST-004',
    assetType: 'UPS System',
    brand: 'APC',
    model: 'Smart-UPS RT 5000VA',
    status: 'active',
    priority: 'high',
    location: { building: 'Main Building', floor: '1st Floor', room: 'Server Room' },
    assignedTo: { name: 'John Smith', email: 'john@facilio.com' },
    createdAt: '2024-01-25T09:00:00Z',
    updatedAt: '2024-03-21T15:10:00Z',
    lastMaintenance: '2024-02-25T09:00:00Z',
    nextMaintenance: '2024-04-25T09:00:00Z',
    healthScore: 88,
    utilization: 82
  },
  {
    _id: '5',
    tagId: 'AST-005',
    assetType: 'Security Camera',
    brand: 'Hikvision',
    model: 'DS-2CD2T47G1-L',
    status: 'inactive',
    priority: 'low',
    location: { building: 'Main Building', floor: '3rd Floor', room: 'Lobby' },
    assignedTo: { name: 'Lisa Chen', email: 'lisa@facilio.com' },
    createdAt: '2024-01-30T12:00:00Z',
    updatedAt: '2024-03-17T11:30:00Z',
    lastMaintenance: '2024-02-28T12:00:00Z',
    nextMaintenance: '2024-04-28T12:00:00Z',
    healthScore: 45,
    utilization: 0
  },
  {
    _id: '6',
    tagId: 'AST-006',
    assetType: 'Access Control',
    brand: 'HID',
    model: 'iCLASS SE',
    status: 'active',
    priority: 'medium',
    location: { building: 'Main Building', floor: 'Ground Floor', room: 'Main Entrance' },
    assignedTo: { name: 'David Wilson', email: 'david@facilio.com' },
    createdAt: '2024-02-05T10:00:00Z',
    updatedAt: '2024-03-22T14:15:00Z',
    lastMaintenance: '2024-03-05T10:00:00Z',
    nextMaintenance: '2024-05-05T10:00:00Z',
    healthScore: 76,
    utilization: 95
  }
]

const sampleChecklists: Checklist[] = [
  {
    _id: '1',
    title: 'Daily HVAC Inspection',
    description: 'Routine inspection of HVAC systems for optimal performance',
    type: 'Daily Maintenance',
    frequency: 'Daily',
    priority: 'high',
    status: 'active',
    location: { building: 'Main Building', floor: '1st Floor', room: 'Server Room' },
    items: [
      { serialNumber: 1, inspectionItem: 'Temperature Check', details: 'Verify temperature readings', status: 'completed' },
      { serialNumber: 2, inspectionItem: 'Filter Inspection', details: 'Check air filter condition', status: 'pending' },
      { serialNumber: 3, inspectionItem: 'Noise Level', details: 'Monitor for unusual sounds', status: 'pending' }
    ],
    progress: 33,
    dueDate: '2024-03-23T17:00:00Z',
    assignedTo: ['John Smith'],
    tags: ['HVAC', 'Daily', 'Critical'],
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-03-22T09:00:00Z'
  },
  {
    _id: '2',
    title: 'Weekly Generator Test',
    description: 'Weekly testing of backup generator systems',
    type: 'Weekly Maintenance',
    frequency: 'Weekly',
    priority: 'high',
    status: 'active',
    location: { building: 'Main Building', floor: 'Basement', room: 'Generator Room' },
    items: [
      { serialNumber: 1, inspectionItem: 'Fuel Level', details: 'Check fuel tank levels', status: 'completed' },
      { serialNumber: 2, inspectionItem: 'Battery Test', details: 'Test battery condition', status: 'completed' },
      { serialNumber: 3, inspectionItem: 'Start Test', details: 'Perform startup sequence', status: 'pending' }
    ],
    progress: 67,
    dueDate: '2024-03-24T16:00:00Z',
    assignedTo: ['Sarah Johnson'],
    tags: ['Generator', 'Weekly', 'Critical'],
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-03-22T10:30:00Z'
  },
  {
    _id: '3',
    title: 'Monthly Fire Safety Check',
    description: 'Monthly inspection of fire suppression systems',
    type: 'Monthly Maintenance',
    frequency: 'Monthly',
    priority: 'medium',
    status: 'active',
    location: { building: 'Main Building', floor: '2nd Floor', room: 'Data Center' },
    items: [
      { serialNumber: 1, inspectionItem: 'Extinguisher Check', details: 'Verify extinguisher pressure', status: 'pending' },
      { serialNumber: 2, inspectionItem: 'Alarm Test', details: 'Test fire alarm system', status: 'pending' },
      { serialNumber: 3, inspectionItem: 'Exit Signs', details: 'Check emergency exit lighting', status: 'pending' }
    ],
    progress: 0,
    dueDate: '2024-03-31T17:00:00Z',
    assignedTo: ['Mike Davis'],
    tags: ['Fire Safety', 'Monthly', 'Compliance'],
    createdAt: '2024-01-20T09:00:00Z',
    updatedAt: '2024-03-22T11:00:00Z'
  },
  {
    _id: '4',
    title: 'Quarterly UPS Maintenance',
    description: 'Quarterly maintenance of UPS systems',
    type: 'Quarterly Maintenance',
    frequency: 'Quarterly',
    priority: 'high',
    status: 'completed',
    location: { building: 'Main Building', floor: '1st Floor', room: 'Server Room' },
    items: [
      { serialNumber: 1, inspectionItem: 'Battery Test', details: 'Load test batteries', status: 'completed' },
      { serialNumber: 2, inspectionItem: 'Fan Check', details: 'Inspect cooling fans', status: 'completed' },
      { serialNumber: 3, inspectionItem: 'Calibration', details: 'Calibrate voltage sensors', status: 'completed' }
    ],
    progress: 100,
    dueDate: '2024-03-15T17:00:00Z',
    assignedTo: ['John Smith'],
    tags: ['UPS', 'Quarterly', 'Critical'],
    createdAt: '2024-01-25T08:00:00Z',
    updatedAt: '2024-03-15T16:00:00Z'
  }
]

export default function ViewerDashboard() {
  const { user } = useAuth()
  const [assets] = useState<Asset[]>(sampleAssets)
  const [checklists] = useState<Checklist[]>(sampleChecklists)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>(sampleAssets)
  const [filteredChecklists, setFilteredChecklists] = useState<Checklist[]>(sampleChecklists)
  const [activeTab, setActiveTab] = useState('overview')
  const [showScanner, setShowScanner] = useState(false)
  const [scannedResult, setScannedResult] = useState<string | null>(null)

  useEffect(() => {
    // Filter assets based on search term
    const filtered = assets.filter(asset =>
      asset.tagId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.assetType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.location.building.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredAssets(filtered)
  }, [searchTerm, assets])

  useEffect(() => {
    // Filter checklists based on search term
    const filtered = checklists.filter(checklist =>
      checklist.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      checklist.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      checklist.location.building.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredChecklists(filtered)
  }, [searchTerm, checklists])

  const handleRefresh = () => {
    // In real app, this would refetch data
    console.log('Refreshing dashboard data...')
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
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

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getUtilizationColor = (util: number) => {
    if (util >= 80) return 'text-blue-600 dark:text-blue-400'
    if (util >= 50) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-green-600 dark:text-green-400'
  }



  const activeAssets = assets.filter(asset => asset.status === 'active').length
  const maintenanceAssets = assets.filter(asset => asset.status === 'maintenance').length
  const activeChecklists = checklists.filter(checklist => checklist.status === 'active').length
  const completedChecklists = checklists.filter(checklist => checklist.status === 'completed').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Enhanced Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Viewer Dashboard
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Welcome back, {user?.name}! Monitor and track assets & checklists in real-time.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="border-blue-200 text-blue-700 dark:border-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Badge variant="outline" className="border-blue-200 text-blue-700 dark:border-blue-700 dark:text-blue-300">
                {user?.projectName}
              </Badge>
              <Badge variant="outline" className="border-green-200 text-green-700 dark:border-green-700 dark:text-green-300">
                {user?.role}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Assets</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{assets.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">+2 this month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Assets</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeAssets}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">{((activeAssets/assets.length)*100).toFixed(0)}% of total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Maintenance</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{maintenanceAssets}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">Requires attention</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl">
                  <CheckSquare className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Checklists</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeChecklists}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">{completedChecklists} completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search assets, checklists, locations, or users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setSearchTerm('')}
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different views */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900/30">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="assets" className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900/30">
              <Package className="h-4 w-4 mr-2" />
              Assets ({filteredAssets.length})
            </TabsTrigger>
            <TabsTrigger value="checklists" className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900/30">
              <CheckSquare className="h-4 w-4 mr-2" />
              Checklists ({filteredChecklists.length})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900/30">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Actions */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setShowScanner(true)}
                  >
                    <Scan className="h-4 w-4 mr-2" />
                    Scan QR Code
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <QrCode className="h-4 w-4 mr-2" />
                    Generate QR
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Dashboard
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-blue-500" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-3 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">HVAC maintenance completed</span>
                  </div>
                  <div className="flex items-center space-x-3 p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">New asset registered</span>
                  </div>
                  <div className="flex items-center space-x-3 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Checklist due today</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Assets Tab */}
          <TabsContent value="assets" className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map((asset) => (
                <Card key={asset._id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300 hover:scale-105 group">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {asset.tagId}
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      {asset.assetType}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Badge className={getStatusColor(asset.status)}>
                      {asset.status}
                    </Badge>
                    <Badge className={getPriorityColor(asset.priority)}>
                      {asset.priority}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
                  <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 text-sm">
                  <Package className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {asset.brand} {asset.model}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {asset.location.building} • {asset.location.floor} • {asset.location.room}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {asset.assignedTo?.name || 'Unassigned'}
                  </span>
                </div>

                    {/* Health Score and Utilization */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Health</p>
                        <p className={`text-lg font-bold ${getHealthScoreColor(asset.healthScore || 0)}`}>
                          {asset.healthScore || 0}%
                        </p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Utilization</p>
                        <p className={`text-lg font-bold ${getUtilizationColor(asset.utilization || 0)}`}>
                          {asset.utilization || 0}%
                        </p>
                      </div>
                    </div>
                
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                        Next: {asset.nextMaintenance ? new Date(asset.nextMaintenance).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                
                <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                  <Button
                    variant="outline"
                    size="sm"
                        className="w-full border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 group-hover:border-blue-500 transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
          </TabsContent>

          {/* Checklists Tab */}
          <TabsContent value="checklists" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredChecklists.map((checklist) => (
                <Card key={checklist._id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                          {checklist.title}
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400">
                          {checklist.type}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Badge className={getChecklistStatusColor(checklist.status)}>
                          {checklist.status}
                        </Badge>
                        <Badge className={getPriorityColor(checklist.priority)}>
                          {checklist.priority}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2 text-sm">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {checklist.description}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {checklist.location.building} • {checklist.location.floor} • {checklist.location.room}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Due: {new Date(checklist.dueDate).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Progress</span>
                        <span className="text-gray-900 dark:text-white font-medium">{checklist.progress}%</span>
                      </div>
                      <Progress value={checklist.progress} className="h-2" />
                    </div>

                    {/* Items Summary */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
                        <p className="text-sm font-bold text-green-600 dark:text-green-400">
                          {checklist.items.filter(item => item.status === 'completed').length}
                        </p>
                      </div>
                      <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
                        <p className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                          {checklist.items.filter(item => item.status === 'pending').length}
                        </p>
                      </div>
                      <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                        <p className="text-sm font-bold text-gray-600 dark:text-gray-400">
                          {checklist.items.length}
                        </p>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 group-hover:border-blue-500 transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Checklist
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Asset Health Overview */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2 text-green-500" />
                    Asset Health Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Excellent (80-100%)</span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {assets.filter(a => (a.healthScore || 0) >= 80).length} assets
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Good (60-79%)</span>
                    <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                      {assets.filter(a => (a.healthScore || 0) >= 60 && (a.healthScore || 0) < 80).length} assets
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Poor (&lt;60%)</span>
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      {assets.filter(a => (a.healthScore || 0) < 60).length} assets
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Checklist Completion Rate */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="h-5 w-5 mr-2 text-blue-500" />
                    Checklist Completion Rate
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {checklists.length > 0 ? Math.round((completedChecklists / checklists.length) * 100) : 0}%
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {completedChecklists} of {checklists.length} completed
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <div className="w-24 h-24 rounded-full border-8 border-blue-200 dark:border-blue-800 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-blue-500"></div>
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
              {searchTerm ? 'Try adjusting your search terms.' : 'No assets are currently available.'}
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
              {searchTerm ? 'Try adjusting your search terms.' : 'No checklists are currently available.'}
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
