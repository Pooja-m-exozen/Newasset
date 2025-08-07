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
  Smartphone,
  Info,
  Search,
  Sparkles,
  TrendingUp,
  Clock,
  Star,
  ArrowLeft,
  Filter,
  MoreHorizontal
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

// API interfaces
interface Role {
  _id: string
  name: string
  createdBy: string
  createdAt: string
  updatedAt: string
  __v: number
  permissions: {
    permissions?: Permissions
    role?: string
    createdBy?: string
    version?: number
    isActive?: boolean
    createdAt?: string
    updatedAt?: string
    __v?: number
  }
}

interface RolesResponse {
  success: boolean
  roles: Role[]
}

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
  role = ''
}: PermissionsUIProps) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [apiPermissions, setApiPermissions] = useState<Permissions | null>(null)
  const [apiLoading, setApiLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedRole, setSelectedRole] = useState(role)
  const [roles, setRoles] = useState<Role[]>([])
  const [rolesLoading, setRolesLoading] = useState(false)
  const [rolesError, setRolesError] = useState<string | null>(null)

  // Fetch roles from API
  const fetchRoles = async () => {
    if (!bearerToken) return

    setRolesLoading(true)
    setRolesError(null)

    try {
      const response = await fetch(`http://192.168.0.5:5021/api/roles`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: RolesResponse = await response.json()
      
      console.log('Roles API Response:', data)
      
      if (data.success) {
        console.log('Available roles:', data.roles)
        setRoles(data.roles)
        
        // Set the first role as default if no role is selected
        if (!selectedRole && data.roles.length > 0) {
          setSelectedRole(data.roles[0].name)
        }
      } else {
        throw new Error('Failed to fetch roles')
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
      setRolesError(error instanceof Error ? error.message : 'Failed to fetch roles')
    } finally {
      setRolesLoading(false)
    }
  }

  // Fetch permissions from API
  const fetchPermissions = async () => {
    if (!bearerToken || !selectedRole) return

    setApiLoading(true)
    setApiError(null)

    try {
      // Try the original working endpoint first
      const url = `http://192.168.0.5:5021/api/admin/permissions/assets/${selectedRole.toLowerCase()}`
      console.log('Fetching permissions from:', url)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response:', errorText)
        
        // Try alternative endpoint with role ID if first one fails
        const roleData = roles.find(role => role.name === selectedRole)
        if (roleData) {
          const roleId = roleData._id
          const alternativeUrl = `http://192.168.0.5:5021/api/roles/${roleId}/permissions`
          console.log('Trying alternative URL:', alternativeUrl)
          
          const altResponse = await fetch(alternativeUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${bearerToken}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (!altResponse.ok) {
            const altErrorText = await altResponse.text()
            console.error('Alternative endpoint also failed:', altErrorText)
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
          }
          
          const altData = await altResponse.json()
          console.log('Alternative endpoint response:', altData)
          
          if (altData.success) {
            console.log('Role permissions from alternative endpoint:', altData.data?.permissions || altData.permissions)
            const permissions = altData.data?.permissions || altData.permissions
            if (permissions) {
              setApiPermissions(permissions)
            } else {
              setDefaultPermissions()
            }
          } else {
            throw new Error('Failed to fetch permissions from both endpoints')
          }
        } else {
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
        }
      } else {
        const data = await response.json()
        console.log('Permissions API Response:', data)
        
        if (data.success) {
          console.log('Role permissions:', data.data?.permissions || data.permissions)
          const permissions = data.data?.permissions || data.permissions
          if (permissions) {
            setApiPermissions(permissions)
          } else {
            setDefaultPermissions()
          }
        } else {
          throw new Error('Failed to fetch permissions')
        }
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
      setApiError(error instanceof Error ? error.message : 'Failed to fetch permissions')
    } finally {
      setApiLoading(false)
    }
  }

  const setDefaultPermissions = () => {
    setApiPermissions({
      assetManagement: {},
      digitalAssets: {},
      maintenance: {},
      compliance: {},
      analytics: {},
      userManagement: {},
      systemAdmin: {},
      admin: {},
      locationManagement: {},
      documentManagement: {},
      financialManagement: {},
      workflowManagement: {},
      mobileFeatures: {}
    })
  }

  // Update permissions via API
  const updatePermissions = async (updatedPermissions: Permissions) => {
    if (!bearerToken || !selectedRole) return

    setIsSaving(true)
    setApiLoading(true)
    setApiError(null)

    try {
      // Find the role ID for the selected role
      const selectedRoleData = roles.find(role => role.name === selectedRole)
      if (!selectedRoleData) {
        throw new Error(`Role "${selectedRole}" not found`)
      }

      // Find the role ID for the selected role
      const roleDataForUpdate = roles.find(role => role.name === selectedRole)
      if (!roleDataForUpdate) {
        throw new Error(`Role "${selectedRole}" not found`)
      }

      const roleId = roleDataForUpdate._id
      console.log('Updating permissions for role:', selectedRole, 'with ID:', roleId)

      const requestBody = {
        permissions: updatedPermissions
      }

      console.log('Making PUT request to:', `http://192.168.0.5:5021/api/roles/${roleId}/permissions`)
      console.log('Request body:', JSON.stringify(requestBody, null, 2))
      
      const response = await fetch(`http://192.168.0.5:5021/api/roles/${roleId}/permissions`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response:', errorText)
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('API Response:', data)
      
      if (data.success) {
        // Update local state with the returned permissions structure
        if (data.data && data.data.permissions) {
          setApiPermissions(data.data.permissions)
        }
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
    if (!isSaving && selectedRole && roles.length > 0) {
      fetchPermissions()
    }
  }, [bearerToken, selectedRole, roles]) // Fetch when bearerToken, selectedRole, or roles change

  useEffect(() => {
    if (bearerToken) {
      fetchRoles()
    }
  }, [bearerToken]) // Fetch roles when bearerToken changes

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

  const handleRoleChange = (newRole: string) => {
    console.log('Role changed from:', selectedRole, 'to:', newRole)
    setSelectedRole(newRole)
    // Clear current permissions when role changes
    setApiPermissions(null)
    setApiError(null)
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
    if (foundCategory?.icon) {
      const IconComponent = foundCategory.icon
      return <IconComponent className="h-4 w-4" />
    }
    return <Settings className="h-4 w-4" />
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

  // Helper function to convert flattened permissions to structured format
  const convertFlattenedToStructured = (flattenedPermissions: { [key: string]: boolean }): Permissions => {
    const structuredPermissions: Permissions = {
      assetManagement: {},
      digitalAssets: {},
      maintenance: {},
      compliance: {},
      analytics: {},
      userManagement: {},
      systemAdmin: {},
      admin: {},
      locationManagement: {},
      documentManagement: {},
      financialManagement: {},
      workflowManagement: {},
      mobileFeatures: {}
    }

    // Map permissions to their respective categories
    const permissionMapping: { [key: string]: keyof Permissions } = {
      view: 'assetManagement',
      create: 'assetManagement',
      edit: 'assetManagement',
      delete: 'assetManagement',
      assign: 'assetManagement',
      bulkOperations: 'assetManagement',
      import: 'assetManagement',
      export: 'assetManagement',
      generate: 'digitalAssets',
      scan: 'digitalAssets',
      bulkGenerate: 'digitalAssets',
      download: 'digitalAssets',
      customize: 'digitalAssets',
      approve: 'maintenance',
      schedule: 'maintenance',
      complete: 'maintenance',
      audit: 'compliance',
      report: 'analytics',
      share: 'documentManagement',
      assignRoles: 'userManagement',
      managePermissions: 'userManagement',
      configure: 'systemAdmin',
      backup: 'systemAdmin',
      restore: 'systemAdmin',
      monitor: 'systemAdmin',
      upload: 'documentManagement',
      offline: 'mobileFeatures',
      sync: 'mobileFeatures',
      location: 'locationManagement',
      camera: 'mobileFeatures',
      notifications: 'mobileFeatures'
    }

    Object.entries(flattenedPermissions).forEach(([permission, value]) => {
      const category = permissionMapping[permission]
      if (category && structuredPermissions[category]) {
        (structuredPermissions[category] as any)[permission] = value
      }
    })

    return structuredPermissions
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

  if (loading || apiLoading || rolesLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="relative mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-ping opacity-20"></div>
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
            Loading Permissions
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            Please wait while we fetch your permission data
          </p>
        </div>
      </div>
    )
  }

  if (error || apiError || rolesError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">Error Loading Permissions</h3>
            <p className="text-red-600 dark:text-red-400 text-xs">{error || apiError || rolesError}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={onClearError || (() => { setApiError(null); setRolesError(null) })}
            variant="outline" 
            size="sm"
            className="border-red-300 dark:border-red-600 hover:border-red-400 dark:hover:border-red-500 text-red-700 dark:text-red-300 text-xs"
          >
            Try Again
          </Button>
          <Button 
            onClick={() => { fetchRoles(); fetchPermissions() }}
            variant="outline" 
            size="sm"
            className="border-red-300 dark:border-red-600 hover:border-red-400 dark:hover:border-red-500 text-red-700 dark:text-red-300 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </div>
      </div>
    )
  }

  if (!apiPermissions || roles.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-500 dark:from-gray-500 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">No Permissions Data Available</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-3 text-xs">Unable to load permission data at this time</p>
          <Button 
            onClick={() => { fetchRoles(); fetchPermissions() }} 
            className="bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Load Permissions
          </Button>
        </div>
      </div>
    )
  }

  const filteredCategories = selectedCategory === 'all' 
    ? Object.entries(apiPermissions)
    : Object.entries(apiPermissions).filter(([key]) => key === selectedCategory)

  return (
    <div className="space-y-4">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-green-800 dark:text-green-200">
                Permissions Updated Successfully!
              </h4>
              <p className="text-green-600 dark:text-green-400 text-xs">
                The permissions for role "{selectedRole}" have been saved.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Permissions Management
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-xs">
                Configure access controls for different roles
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => { fetchRoles(); fetchPermissions() }}
              variant="outline"
              size="sm"
              disabled={apiLoading || rolesLoading}
              className="border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 text-gray-700 dark:text-gray-300 text-xs"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${apiLoading || rolesLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => setShowUpdateModal(true)}
              size="sm"
              className="bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white text-xs"
              disabled={apiLoading || rolesLoading}
            >
              <Save className="h-3 w-3 mr-1" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Role Selection */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            </div>
            <Label htmlFor="role-select" className="text-xs font-medium text-gray-700 dark:text-gray-300">Select Role</Label>
          </div>
          <Select value={selectedRole} onValueChange={handleRoleChange}>
            <SelectTrigger className="w-64 border-gray-300 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500 dark:focus:ring-purple-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              {roles.map(role => (
                <SelectItem key={role._id} value={role.name} className="text-gray-900 dark:text-white hover:bg-purple-50 dark:hover:bg-purple-900/20 text-xs">
                  <div className="flex flex-col">
                    <span className="font-medium">{role.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Created: {new Date(role.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Filter className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            </div>
            <Label htmlFor="category-filter" className="text-xs font-medium text-gray-700 dark:text-gray-300">Filter by Category</Label>
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              {categories.map(category => (
                <SelectItem key={category.value} value={category.value} className="text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs">
                  <div className="flex items-center gap-2">
                    <category.icon className="h-3 w-3" />
                    {category.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Permissions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredCategories.map(([categoryKey, permissions]) => (
          <Card key={categoryKey} className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-3">
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  {getCategoryIcon(categoryKey)}
                </div>
                <span className="text-sm">{categories.find(cat => cat.value === categoryKey)?.label || categoryKey}</span>
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400 text-xs">
                Manage permissions for {categoryKey.replace(/([A-Z])/g, ' $1').toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-2">
                {Object.entries(permissions).map(([permissionKey, enabled]) => (
                  <div key={permissionKey} className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-900 dark:text-white">{getPermissionLabel(permissionKey)}</span>
                        <Badge variant="outline" className={`text-xs ${enabled ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600'}`}>
                          {enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    </div>
                    <Switch
                      checked={enabled as boolean}
                      onChange={(e) => handlePermissionToggle(categoryKey, permissionKey, e.target.checked)}
                      className="ml-3"
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
        <DialogContent className="sm:max-w-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <div className="w-6 h-6 bg-blue-500 dark:bg-blue-600 rounded-lg flex items-center justify-center">
                <Save className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm">Save Permission Changes</span>
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400 text-xs">
              Are you sure you want to save the permission changes? This will update the permissions for the <span className="font-medium text-blue-600 dark:text-blue-400">{selectedRole}</span> role.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowUpdateModal(false)}
              className="border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300 text-xs"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveChanges}
              disabled={apiLoading}
              className="bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white text-xs"
            >
              <Save className="h-3 w-3 mr-1" />
              {apiLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 