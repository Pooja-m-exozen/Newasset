'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Badge } from './badge'
import { Switch } from './switch'
import { Label } from './label'
import { Input } from './input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './dialog'
import { 
  Shield, 
  Users, 
  Building2, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Save, 
  X, 
  CheckCircle, 
  AlertTriangle,
  Lock,
  Unlock,
  Settings,
  UserCheck,
  UserX,
  Key,
  Database,
  FileText,
  BarChart3,
  Activity,
  Zap,
  RefreshCw,
  Download,
  Upload,
  Camera,
  MapPin,
  Bell,
  CreditCard,
  Workflow,
  Smartphone
} from 'lucide-react'

interface PermissionCategory {
  view?: boolean
  create?: boolean
  edit?: boolean
  delete?: boolean
  assign?: boolean
  bulkOperations?: boolean
  import?: boolean
  export?: boolean
  generate?: boolean
  scan?: boolean
  bulkGenerate?: boolean
  download?: boolean
  customize?: boolean
  approve?: boolean
  schedule?: boolean
  complete?: boolean
  audit?: boolean
  report?: boolean
  share?: boolean
  assignRoles?: boolean
  managePermissions?: boolean
  configure?: boolean
  backup?: boolean
  restore?: boolean
  monitor?: boolean
  upload?: boolean
  offline?: boolean
  sync?: boolean
  location?: boolean
  camera?: boolean
  notifications?: boolean
}

interface Permissions {
  assetManagement: PermissionCategory
  digitalAssets: PermissionCategory
  maintenance: PermissionCategory
  compliance: PermissionCategory
  analytics: PermissionCategory
  userManagement: PermissionCategory
  systemAdmin: PermissionCategory
  admin: PermissionCategory
  locationManagement: PermissionCategory
  documentManagement: PermissionCategory
  financialManagement: PermissionCategory
  workflowManagement: PermissionCategory
  mobileFeatures: PermissionCategory
}

// New API interfaces for POST method
interface PermissionRequest {
  role: string
  permissions: {
    view?: boolean
    create?: boolean
    edit?: boolean
    delete?: boolean
    export?: boolean
    sync?: boolean
    [key: string]: boolean | undefined
  }
}

interface AccessControl {
  timeRestrictions: {
    startTime: string
    endTime: string
    daysOfWeek: string[]
  }
  locationRestrictions: {
    enabled: boolean
    allowedLocations: string[]
  }
  facilityAccess: string
  assetAccess: string
  dataAccess: string
}

interface AdvancedFeatures {
  predictiveAnalytics: boolean
  machineLearning: boolean
  apiAccess: boolean
  thirdPartyIntegrations: boolean
  customWorkflows: boolean
  advancedReporting: boolean
}

interface SecuritySettings {
  deviceRestrictions: {
    web: boolean
    mobile: boolean
    tablet: boolean
  }
  mfaRequired: boolean
  sessionTimeout: number
  maxConcurrentSessions: number
  ipRestrictions: string[]
}

interface PermissionResponse {
  success: boolean
  message: string
  data: {
    accessControl: AccessControl
    advancedFeatures: AdvancedFeatures
    securitySettings: SecuritySettings
    _id: string
    role: string
    __v: number
    createdAt: string
    updatedAt: string
    isActive: boolean
    version: number
  }
}

interface User {
  workSchedule: {
    workingDays: string[]
  }
  permissions: Permissions
  specialization: string[]
  _id: string
  name: string
  email: string
  role: string
  projectName: string
  isVerified: boolean
  verificationToken: string | null
  status: string
  resetPasswordExpires: string
  createdAt: string
  updatedAt: string
  __v: number
  resetPasswordToken: string
  facilities: string[]
  certifications: string[]
  loginHistory: any[]
  activityLog: any[]
}

interface ApiResponse {
  success: boolean
  user: {
    permissions: Permissions
    deviceAccess: {
      web: boolean
      mobile: boolean
      tablet: boolean
    }
    performanceMetrics: {
      tasksCompleted: number
    }
    specialization: string[]
    _id: string
    name: string
    email: string
    role: string
    projectName: string
    isVerified: boolean
    verificationToken: string | null
    status: string
    resetPasswordExpires: string
    createdAt: string
    updatedAt: string
    __v: number
    resetPasswordToken: string
    facilities: string[]
    certifications: string[]
    loginHistory: any[]
    activityLog: any[]
  }
}

interface PermissionsUIProps {
  permissions?: Permissions
  loading?: boolean
  error?: string | null
  onUpdatePermissions?: (permissions: Permissions) => void
  onClearError?: () => void
  bearerToken?: string
  role?: string
}

export function PermissionsUI({
  permissions,
  loading = false,
  error = null,
  onUpdatePermissions,
  onClearError,
  bearerToken,
  role = 'viewer'
}: PermissionsUIProps) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [apiPermissions, setApiPermissions] = useState<Permissions | null>(null)
  const [apiLoading, setApiLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Fetch permissions from API
  const fetchPermissions = async () => {
    if (!bearerToken) return

    setApiLoading(true)
    setApiError(null)

    try {
      const response = await fetch(`http://192.168.0.5:5021/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ApiResponse = await response.json()
      
      console.log('API Response:', data)
      
      if (data.success) {
        console.log('User permissions:', data.user.permissions)
        setApiPermissions(data.user.permissions)
      } else {
        throw new Error('Failed to fetch permissions')
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
      setApiError(error instanceof Error ? error.message : 'Failed to fetch permissions')
    } finally {
      setApiLoading(false)
    }
  }

  // Update permissions via API
  const updatePermissions = async (updatedPermissions: Permissions) => {
    if (!bearerToken) return

    setIsSaving(true)
    setApiLoading(true)
    setApiError(null)

    try {
      // Convert the complex permissions structure to the simplified format expected by the API
      const simplifiedPermissions: { [key: string]: boolean } = {}
      
      // Flatten all permissions from all categories
      Object.entries(updatedPermissions).forEach(([category, permissions]) => {
        Object.entries(permissions).forEach(([permission, enabled]) => {
          if (enabled !== undefined && typeof enabled === 'boolean') {
            simplifiedPermissions[permission] = enabled
          }
        })
      })

      const requestBody: PermissionRequest = {
        role: role,
        permissions: simplifiedPermissions
      }

      console.log('Making POST request to:', `http://192.168.0.5:5021/api/admin/permissions/assets`)
      console.log('Request body:', JSON.stringify(requestBody, null, 2))
      
      const response = await fetch(`http://192.168.0.5:5021/api/admin/permissions/assets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: PermissionResponse = await response.json()
      
      if (data.success) {
        // Don't call onUpdatePermissions to avoid triggering any refetch
        handleSaveSuccess()
        console.log('Permissions updated successfully:', data.message)
      } else {
        throw new Error(data.message || 'Failed to update permissions')
      }
    } catch (error) {
      console.error('Error updating permissions:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update permissions'
      setApiError(errorMessage)
      console.error('API Error Details:', errorMessage)
    } finally {
      setApiLoading(false)
      setIsSaving(false)
    }
  }

  useEffect(() => {
    if (!isSaving) {
      fetchPermissions()
    }
  }, [bearerToken, role]) // Only fetch on initial load or when bearerToken/role changes

  // Handle save success without any refetch
  const handleSaveSuccess = () => {
    setShowUpdateModal(false)
    setShowSuccessMessage(true)
    console.log('Permissions updated successfully - no refetch needed')
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowSuccessMessage(false)
    }, 3000)
  }

  const categories = [
    { value: 'all', label: 'All Categories', icon: Settings },
    { value: 'assetManagement', label: 'Asset Management', icon: Building2 },
    { value: 'digitalAssets', label: 'Digital Assets', icon: FileText },
    { value: 'maintenance', label: 'Maintenance', icon: Activity },
    { value: 'compliance', label: 'Compliance', icon: Shield },
    { value: 'analytics', label: 'Analytics', icon: BarChart3 },
    { value: 'userManagement', label: 'User Management', icon: Users },
    { value: 'systemAdmin', label: 'System Admin', icon: Database },
    { value: 'admin', label: 'Admin', icon: Key },
    { value: 'locationManagement', label: 'Location Management', icon: MapPin },
    { value: 'documentManagement', label: 'Document Management', icon: FileText },
    { value: 'financialManagement', label: 'Financial Management', icon: CreditCard },
    { value: 'workflowManagement', label: 'Workflow Management', icon: Workflow },
    { value: 'mobileFeatures', label: 'Mobile Features', icon: Smartphone }
  ]

  const getCategoryIcon = (category: string) => {
    const foundCategory = categories.find(cat => cat.value === category)
    return foundCategory ? <foundCategory.icon className="h-4 w-4" /> : <Settings className="h-4 w-4" />
  }

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      assetManagement: 'bg-blue-100 text-blue-800 border-blue-200',
      digitalAssets: 'bg-green-100 text-green-800 border-green-200',
      maintenance: 'bg-orange-100 text-orange-800 border-orange-200',
      compliance: 'bg-purple-100 text-purple-800 border-purple-200',
      analytics: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      userManagement: 'bg-pink-100 text-pink-800 border-pink-200',
      systemAdmin: 'bg-red-100 text-red-800 border-red-200',
      admin: 'bg-gray-100 text-gray-800 border-gray-200',
      locationManagement: 'bg-teal-100 text-teal-800 border-teal-200',
      documentManagement: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      financialManagement: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      workflowManagement: 'bg-violet-100 text-violet-800 border-violet-200',
      mobileFeatures: 'bg-amber-100 text-amber-800 border-amber-200'
    }
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const handlePermissionToggle = (category: string, permission: string, enabled: boolean) => {
    if (!apiPermissions) return

    const updatedPermissions = {
      ...apiPermissions,
      [category]: {
        ...apiPermissions[category as keyof Permissions],
        [permission]: enabled
      }
    }

    setApiPermissions(updatedPermissions)
  }

  const handleSaveChanges = () => {
    if (apiPermissions) {
      updatePermissions(apiPermissions)
    }
  }

  const getPermissionLabel = (permission: string) => {
    const labels: { [key: string]: string } = {
      view: 'View',
      create: 'Create',
      edit: 'Edit',
      delete: 'Delete',
      assign: 'Assign',
      bulkOperations: 'Bulk Operations',
      import: 'Import',
      export: 'Export',
      generate: 'Generate',
      scan: 'Scan',
      bulkGenerate: 'Bulk Generate',
      download: 'Download',
      customize: 'Customize',
      approve: 'Approve',
      schedule: 'Schedule',
      complete: 'Complete',
      audit: 'Audit',
      report: 'Report',
      share: 'Share',
      assignRoles: 'Assign Roles',
      managePermissions: 'Manage Permissions',
      configure: 'Configure',
      backup: 'Backup',
      restore: 'Restore',
      monitor: 'Monitor',
      upload: 'Upload',
      offline: 'Offline',
      sync: 'Sync',
      location: 'Location',
      camera: 'Camera',
      notifications: 'Notifications'
    }
    return labels[permission] || permission
  }

  if (loading || apiLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading permissions...</p>
        </div>
      </div>
    )
  }

  if (error || apiError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium">Error loading permissions</span>
        </div>
        <p className="text-red-600 mt-2">{error || apiError}</p>
        <div className="flex gap-2 mt-3">
          <Button 
            onClick={onClearError || (() => setApiError(null))}
            variant="outline" 
            size="sm"
          >
            Try Again
          </Button>
          <Button 
            onClick={fetchPermissions}
            variant="outline" 
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    )
  }

  if (!apiPermissions) {
    return (
      <div className="text-center py-8">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No permissions data available</p>
        <Button onClick={fetchPermissions} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Load Permissions
        </Button>
      </div>
    )
  }

  const filteredCategories = selectedCategory === 'all' 
    ? Object.entries(apiPermissions)
    : Object.entries(apiPermissions).filter(([key]) => key === selectedCategory)

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Permissions updated successfully!</span>
          </div>
          <p className="text-green-600 mt-2">The permissions for role "{role}" have been saved.</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Permissions Management</h2>
          <p className="text-gray-600">Configure access controls for role: <span className="font-medium">{role}</span></p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={fetchPermissions}
            variant="outline"
            size="sm"
            disabled={apiLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${apiLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setShowUpdateModal(true)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
            disabled={apiLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Label htmlFor="category-filter" className="text-sm font-medium">Category:</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.value} value={category.value}>
                  <div className="flex items-center gap-2">
                    <category.icon className="h-4 w-4" />
                    {category.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Permissions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCategories.map(([categoryKey, permissions]) => (
          <Card key={categoryKey} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getCategoryIcon(categoryKey)}
                {categories.find(cat => cat.value === categoryKey)?.label || categoryKey}
              </CardTitle>
              <CardDescription>
                Manage permissions for {categoryKey.replace(/([A-Z])/g, ' $1').toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(permissions).map(([permissionKey, enabled]) => (
                  <div key={permissionKey} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{getPermissionLabel(permissionKey)}</span>
                        <Badge variant="outline" className={`text-xs ${enabled ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    </div>
                    <Switch
                      checked={enabled as boolean}
                      onChange={(e) => handlePermissionToggle(categoryKey, permissionKey, e.target.checked)}
                      className="ml-4"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Update Confirmation Modal */}
      <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="h-5 w-5" />
              Save Permission Changes
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to save the permission changes? This will update the permissions for the {role} role.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveChanges}
              disabled={apiLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {apiLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 