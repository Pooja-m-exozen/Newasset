"use client"

import { useState, useEffect } from "react"

import ProtectedRoute from "@/components/ProtectedRoute"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/AuthContext"
import { useUserManagement } from "@/contexts/UserManagementContext"
import { useToast, ToastContainer } from "@/components/ui/toast"
import { User } from "@/lib/manageuser"
import { 
  Users, 
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Mail,
  Shield,
  UserCheck,
  UserPlus,
  RefreshCw,
  X,
  EyeOff,
  Eye as EyeIcon,
  Download,
  Upload,
  Settings,
  Calendar,
  ChevronDown,
  Star,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react"


export default function AdminManageUsersPage() {
  const { users, roles, fetchUsers, fetchRoles, createRole, createUser, updateRole, updateUserRole, deleteUser } = useUserManagement()
  const { addToast, toasts, removeToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showRolesModal, setShowRolesModal] = useState(false)
  const [showCreateUserModal, setShowCreateUserModal] = useState(false)
  const [showEditRoleModal, setShowEditRoleModal] = useState(false)
  const [showEditUserRoleModal, setShowEditUserRoleModal] = useState(false)
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false)
  const [showViewUserModal, setShowViewUserModal] = useState(false)
  const [newRoleName, setNewRoleName] = useState("")
  const [isCreatingRole, setIsCreatingRole] = useState(false)
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [isUpdatingRole, setIsUpdatingRole] = useState(false)
  const [isUpdatingUserRole, setIsUpdatingUserRole] = useState(false)
  const [isDeletingUser, setIsDeletingUser] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [editingRole, setEditingRole] = useState<{ id: string; name: string } | null>(null)
  const [editingUser, setEditingUser] = useState<{ id: string; name: string; currentRole: string } | null>(null)
  const [deletingUser, setDeletingUser] = useState<{ id: string; name: string } | null>(null)
  const [viewingUser, setViewingUser] = useState<User | null>(null)
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    projectName: ""
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([fetchUsers(), fetchRoles()])
      addToast({
        type: "success",
        title: "Data Loaded",
        message: `Successfully loaded ${users.length} users and ${roles.length} roles`,
        duration: 3000
      })
    } catch (error) {
      addToast({
        type: "error",
        title: "Error Loading Data",
        message: error instanceof Error ? error.message : "Failed to load data",
        duration: 5000
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      addToast({
        type: "error",
        title: "Validation Error",
        message: "Role name is required",
        duration: 3000
      })
      return
    }

    setIsCreatingRole(true)
    try {
      await createRole({ name: newRoleName.trim() })
      addToast({
        type: "success",
        title: "Role Created",
        message: `Role "${newRoleName}" created successfully`,
        duration: 3000
      })
      setNewRoleName("")
      setShowRoleModal(false)
    } catch (error) {
      addToast({
        type: "error",
        title: "Error Creating Role",
        message: error instanceof Error ? error.message : "Failed to create role",
        duration: 5000
      })
    } finally {
      setIsCreatingRole(false)
    }
  }

  const handleEditRole = async () => {
    console.log('Handling edit role:', editingRole)
    if (!editingRole || !editingRole.name.trim()) {
      addToast({
        type: "error",
        title: "Validation Error",
        message: "Role name is required",
        duration: 3000
      })
      return
    }

    setIsUpdatingRole(true)
    try {
      console.log('Calling updateRole with:', editingRole.id, { role: editingRole.name.trim() })
      await updateRole(editingRole.id, { role: editingRole.name.trim() })
      addToast({
        type: "success",
        title: "Role Updated",
        message: `Role updated to "${editingRole.name}" successfully`,
        duration: 3000
      })
      setEditingRole(null)
      setShowEditRoleModal(false)
    } catch (error) {
      console.error('Error updating role:', error)
      addToast({
        type: "error",
        title: "Error Updating Role",
        message: error instanceof Error ? error.message : "Failed to update role",
        duration: 5000
      })
    } finally {
      setIsUpdatingRole(false)
    }
  }

  const openEditRoleModal = (role: { _id: string; name: string }) => {
    console.log('Opening edit modal for role:', role)
    setEditingRole({ id: role._id, name: role.name })
    setShowEditRoleModal(true)
  }

  const openEditUserRoleModal = (user: { _id: string; name: string; role: string }) => {
    console.log('Opening edit user role modal for user:', user)
    setEditingUser({ id: user._id, name: user.name, currentRole: user.role })
    setShowEditUserRoleModal(true)
  }

  const handleEditUserRole = async () => {
    console.log('Handling edit user role:', editingUser)
    if (!editingUser || !editingUser.currentRole.trim()) {
      addToast({
        type: "error",
        title: "Validation Error",
        message: "Role is required",
        duration: 3000
      })
      return
    }

    setIsUpdatingUserRole(true)
    try {
      console.log('Calling updateUserRole with:', editingUser.id, { role: editingUser.currentRole.trim() })
      await updateUserRole(editingUser.id, { role: editingUser.currentRole.trim() })
      addToast({
        type: "success",
        title: "User Role Updated",
        message: `Role for "${editingUser.name}" updated to "${editingUser.currentRole}" successfully`,
        duration: 3000
      })
      setEditingUser(null)
      setShowEditUserRoleModal(false)
    } catch (error) {
      console.error('Error updating user role:', error)
      addToast({
        type: "error",
        title: "Error Updating User Role",
        message: error instanceof Error ? error.message : "Failed to update user role",
        duration: 5000
      })
    } finally {
      setIsUpdatingUserRole(false)
    }
  }

  const openDeleteUserModal = (user: { _id: string; name: string }) => {
    console.log('Opening delete user modal for user:', user)
    setDeletingUser({ id: user._id, name: user.name })
    setShowDeleteUserModal(true)
  }

  const openViewUserModal = (user: User) => {
    console.log('Opening view user modal for user:', user)
    setViewingUser(user)
    setShowViewUserModal(true)
  }

  const handleDeleteUser = async () => {
    console.log('Handling delete user:', deletingUser)
    if (!deletingUser) {
      addToast({
        type: "error",
        title: "Error",
        message: "No user selected for deletion",
        duration: 3000
      })
      return
    }

    setIsDeletingUser(true)
    try {
      console.log('Calling deleteUser with:', deletingUser.id)
      await deleteUser(deletingUser.id)
      addToast({
        type: "success",
        title: "User Deleted",
        message: `User "${deletingUser.name}" deleted successfully`,
        duration: 3000
      })
      setDeletingUser(null)
      setShowDeleteUserModal(false)
    } catch (error) {
      console.error('Error deleting user:', error)
      addToast({
        type: "error",
        title: "Error Deleting User",
        message: error instanceof Error ? error.message : "Failed to delete user",
        duration: 5000
      })
    } finally {
      setIsDeletingUser(false)
    }
  }

  const handleCreateUser = async () => {
    if (!newUserData.name.trim() || !newUserData.email.trim() || !newUserData.password.trim() || !newUserData.role || !newUserData.projectName.trim()) {
      addToast({
        type: "error",
        title: "Validation Error",
        message: "All fields are required",
        duration: 3000
      })
      return
    }

    if (newUserData.password.length < 6) {
      addToast({
        type: "error",
        title: "Validation Error",
        message: "Password must be at least 6 characters",
        duration: 3000
      })
      return
    }

    setIsCreatingUser(true)
    try {
      await createUser({
        name: newUserData.name.trim(),
        email: newUserData.email.trim(),
        password: newUserData.password,
        role: newUserData.role,
        projectName: newUserData.projectName.trim()
      })
      addToast({
        type: "success",
        title: "User Created",
        message: `User "${newUserData.name}" created successfully`,
        duration: 3000
      })
      setNewUserData({
        name: "",
        email: "",
        password: "",
        role: "",
        projectName: ""
      })
      setShowCreateUserModal(false)
    } catch (error) {
      addToast({
        type: "error",
        title: "Error Creating User",
        message: error instanceof Error ? error.message : "Failed to create user",
        duration: 5000
      })
    } finally {
      setIsCreatingUser(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'bg-purple-100 text-purple-800'
      case 'manager': return 'bg-blue-100 text-blue-800'
      case 'technician': return 'bg-green-100 text-green-800'
      case 'viewer': return 'bg-gray-100 text-gray-800'
      case 'user': return 'bg-blue-100 text-blue-800'
      case 'engineer': return 'bg-orange-100 text-orange-800'
      case 'supervisor': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours} hours ago`
    if (diffInHours < 48) return "1 day ago"
    return `${Math.floor(diffInHours / 24)} days ago`
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase()
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
    
        
        <div className="flex-1 flex flex-col">
          
        
        <div className="flex-1 overflow-auto">
            <main className="p-6 space-y-6">
              {/* Header Section */}
            <div className="flex items-center justify-between">
              <div>
                  <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                  <p className="text-gray-600 mt-1">Manage users, roles, and permissions</p>
              </div>
                <div className="flex items-center space-x-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={loadData}
                    disabled={isLoading}
                    className="flex items-center space-x-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                </Button>
                  <Button 
                    size="sm"
                    onClick={() => setShowCreateUserModal(true)}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add User</span>
                </Button>
              </div>
            </div>

            {/* Search and Filters */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                  <div className="flex-1 w-full lg:w-auto">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search users by name, email, role, or project..."
                        className="pl-10 h-10 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Filter className="w-4 h-4" />
                      <span>Filter</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowRolesModal(true)}
                      className="flex items-center space-x-2"
                    >
                      <Shield className="w-4 h-4" />
                      <span>Roles ({roles.length})</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Date</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Users List */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                      <h3 className="text-lg font-semibold text-gray-900">Users</h3>
                      <p className="text-sm text-gray-600">Showing {filteredUsers.length} of {users.length} users</p>
                  </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                    </div>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-100">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex items-center space-x-3">
                        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                        <span className="text-gray-600">Loading users...</span>
                      </div>
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <div key={user._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-lg">
                              {getInitials(user.name)}
                            </div>
                            <div className="flex-1">
                            <div className="flex items-center space-x-3">
                                <h4 className="font-semibold text-gray-900">{user.name}</h4>
                                {user.isVerified && (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                )}
                                <Badge className={`${getStatusColor(user.status)} px-2 py-0.5 text-xs`}>
                                  {user.status}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <Mail className="w-3 h-3" />
                                  <span>{user.email}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Shield className="w-3 h-3" />
                                  <Badge className={`${getRoleColor(user.role)} px-2 py-0.5 text-xs`}>
                                    {user.role}
                                  </Badge>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatDate(user.createdAt)}</span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{user.projectName}</p>
                            </div>
                          </div>
                            <div className="flex items-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 hover:bg-blue-50"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                console.log('View user button clicked for user:', user)
                                openViewUserModal(user)
                              }}
                            >
                              <Eye className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 hover:bg-green-50"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                console.log('Edit user role button clicked for user:', user)
                                openEditUserRoleModal(user)
                              }}
                            >
                              <Edit className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 hover:bg-red-50"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                console.log('Delete user button clicked for user:', user)
                                openDeleteUserModal(user)
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                            </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {filteredUsers.length} of {users.length} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">Previous</Button>
                      <Button variant="outline" size="sm" className="bg-blue-600 text-white hover:bg-blue-700">1</Button>
                    <Button variant="outline" size="sm">2</Button>
                    <Button variant="outline" size="sm">3</Button>
                    <Button variant="outline" size="sm">Next</Button>
                    </div>
                  </div>
                </div>
              </div>

            {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowRoleModal(true)}
                  className="bg-white p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-200 text-left group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                      <Shield className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Create New Role</h4>
                      <p className="text-sm text-gray-600">Add a new role with permissions</p>
                    </div>
                  </div>
                </button>

                <button 
                  onClick={() => setShowRolesModal(true)}
                  className="bg-white p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 text-left group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                      <Settings className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Manage Roles</h4>
                      <p className="text-sm text-gray-600">Edit existing roles and permissions</p>
                    </div>
                  </div>
                </button>
              </div>
            </main>
          </div>
        </div>

        {/* Create User Modal */}
        {showCreateUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Create New User</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateUserModal(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="userName" className="text-sm font-medium text-gray-700">Full Name</Label>
                  <Input
                    id="userName"
                    placeholder="Enter full name"
                    value={newUserData.name}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="userEmail" className="text-sm font-medium text-gray-700">Email Address</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    placeholder="Enter email address"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1 h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="userPassword" className="text-sm font-medium text-gray-700">Password</Label>
                  <div className="relative mt-1">
                    <Input
                      id="userPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password (min 6 characters)"
                      value={newUserData.password}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                      className="h-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="userRole" className="text-sm font-medium text-gray-700">Role</Label>
                  <select
                    id="userRole"
                    value={newUserData.role}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a role</option>
                    {roles.map((role) => (
                      <option key={role._id} value={role.name}>
                        {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="userProject" className="text-sm font-medium text-gray-700">Project Name</Label>
                  <Input
                    id="userProject"
                    placeholder="Enter project name"
                    value={newUserData.projectName}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, projectName: e.target.value }))}
                    className="mt-1 h-10"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <Button
                    className="flex-1 h-10"
                    onClick={handleCreateUser}
                    disabled={isCreatingUser}
                  >
                    {isCreatingUser ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Create User
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateUserModal(false)}
                    disabled={isCreatingUser}
                    className="h-10"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Role Modal */}
        {showRoleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Create New Role</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRoleModal(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="roleName" className="text-sm font-medium text-gray-700">Role Name</Label>
                  <Input
                    id="roleName"
                    placeholder="Enter role name (e.g., manager, technician)"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="mt-1 h-10"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <Button
                    className="flex-1 h-10"
                    onClick={handleCreateRole}
                    disabled={isCreatingRole}
                  >
                    {isCreatingRole ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                    <Plus className="w-4 h-4 mr-2" />
                        Create Role
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowRoleModal(false)}
                    disabled={isCreatingRole}
                    className="h-10"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Role Modal */}
        {showEditRoleModal && editingRole && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Edit Role</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowEditRoleModal(false)
                    setEditingRole(null)
                  }}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editRoleName" className="text-sm font-medium text-gray-700">Role Name</Label>
                                      <Input
                      id="editRoleName"
                      placeholder="Enter new role name"
                      value={editingRole.name}
                      onChange={(e) => setEditingRole(prev => prev ? { id: prev.id, name: e.target.value } : null)}
                      className="mt-1 h-10"
                    />
                </div>
                <div className="flex space-x-3 pt-4">
                  <Button
                    className="flex-1 h-10"
                    onClick={handleEditRole}
                    disabled={isUpdatingRole}
                  >
                    {isUpdatingRole ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Edit className="w-4 h-4 mr-2" />
                        Update Role
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditRoleModal(false)
                      setEditingRole(null)
                    }}
                    disabled={isUpdatingRole}
                    className="h-10"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Role Modal */}
        {showEditUserRoleModal && editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Edit User Role</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowEditUserRoleModal(false)
                    setEditingUser(null)
                  }}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editUserRole" className="text-sm font-medium text-gray-700">Role</Label>
                  <select
                    id="editUserRole"
                    value={editingUser.currentRole}
                    onChange={(e) => setEditingUser(prev => prev ? { ...prev, currentRole: e.target.value } : null)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a role</option>
                    {roles.map((role) => (
                      <option key={role._id} value={role.name}>
                        {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex space-x-3 pt-4">
                  <Button
                    className="flex-1 h-10"
                    onClick={handleEditUserRole}
                    disabled={isUpdatingUserRole}
                  >
                    {isUpdatingUserRole ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Edit className="w-4 h-4 mr-2" />
                        Update Role
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditUserRoleModal(false)
                      setEditingUser(null)
                    }}
                    disabled={isUpdatingUserRole}
                    className="h-10"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete User Confirmation Modal */}
        {showDeleteUserModal && deletingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Confirm Deletion</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowDeleteUserModal(false)
                    setDeletingUser(null)
                  }}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-gray-700">
                  Are you sure you want to delete user "{deletingUser.name}"? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteUserModal(false)
                      setDeletingUser(null)
                    }}
                    disabled={isDeletingUser}
                    className="h-10"
                  >
                    Cancel
                  </Button>
                  <Button
                    className="h-10"
                    onClick={handleDeleteUser}
                    disabled={isDeletingUser}
                  >
                    {isDeletingUser ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete User
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View User Modal */}
        {showViewUserModal && viewingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">User Details</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowViewUserModal(false)
                    setViewingUser(null)
                  }}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-6">
                {/* User Header */}
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-2xl">
                    {getInitials(viewingUser.name)}
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">{viewingUser.name}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      {viewingUser.isVerified && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      <Badge className={`${getStatusColor(viewingUser.status)} px-2 py-0.5 text-xs`}>
                        {viewingUser.status}
                      </Badge>
                      <Badge className={`${getRoleColor(viewingUser.role)} px-2 py-0.5 text-xs`}>
                        {viewingUser.role}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* User Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Email Address</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{viewingUser.email}</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Role</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Shield className="w-4 h-4 text-gray-400" />
                        <Badge className={`${getRoleColor(viewingUser.role)} px-2 py-0.5 text-xs`}>
                          {viewingUser.role}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">Project</Label>
                      <div className="mt-1">
                        <span className="text-gray-900">{viewingUser.projectName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Account Status</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={`${getStatusColor(viewingUser.status)} px-2 py-0.5 text-xs`}>
                          {viewingUser.status}
                        </Badge>
                        {viewingUser.isVerified && (
                          <div className="flex items-center space-x-1 text-green-600">
                            <CheckCircle className="w-3 h-3" />
                            <span className="text-xs">Verified</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">Created</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{formatDate(viewingUser.createdAt)}</span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">Last Updated</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{formatDate(viewingUser.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>



                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowViewUserModal(false)
                      setViewingUser(null)
                    }}
                    className="h-10"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setShowViewUserModal(false)
                      setViewingUser(null)
                      openEditUserRoleModal(viewingUser)
                    }}
                    className="h-10"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Role
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Roles Management Modal */}
        {showRolesModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Role Management</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRolesModal(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">Total Roles: {roles.length}</p>
                  <Button
                    size="sm"
                    onClick={() => {
                      setShowRolesModal(false)
                      setShowRoleModal(true)
                    }}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Role</span>
                  </Button>
                </div>
                <div className="space-y-2">
                  {roles.map((role) => (
                    <div
                      key={role._id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <Badge className={`${getRoleColor(role.name)} px-3 py-1 text-sm font-medium`}>
                          {role.name}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          Created: {formatDate(role.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 hover:bg-green-50" 
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            console.log('Edit button clicked for role:', role)
                            openEditRoleModal(role)
                          }}
                        >
                          <Edit className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-50">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
        </div>
        )}

        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    </ProtectedRoute>
  )
} 