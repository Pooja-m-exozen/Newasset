"use client"

import { useState, useEffect, useCallback, useRef } from "react"

import ProtectedRoute from "@/components/ProtectedRoute"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { useUserManagement } from "@/contexts/UserManagementContext"
import { User } from "@/lib/manageuser"
import { useToast, ToastContainer } from "@/components/ui/toast"
import { 
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Shield,
  UserPlus,
  RefreshCw,
  X,
  EyeOff,
  Eye as EyeIcon,
  AlertCircle
} from "lucide-react"


export default function AdminManageUsersPage() {
  const { users, roles, fetchUsers, fetchRoles, createRole, createUser, updateRole, updateUserRole, deleteUser } = useUserManagement()
  const { addToast, toasts, removeToast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const hasMounted = useRef(false)
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
  const [sortField, setSortField] = useState<string>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    projectName: ""
  })

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      await Promise.all([fetchUsers(), fetchRoles()])
      addToast({
        type: "success",
        title: "Data Loaded",
        message: "Data loaded successfully",
        duration: 3000
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load data"
      setError(errorMessage)
      addToast({
        type: "error",
        title: "Error Loading Data",
        message: errorMessage,
        duration: 5000
      })
    } finally {
      setIsLoading(false)
    }
  }, [fetchUsers, fetchRoles, addToast])

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true
      loadData()
    }
  }, [loadData])

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
        message: `Role &quot;${newRoleName}&quot; created successfully`,
        duration: 3000
      })
      setNewRoleName("")
      setShowRoleModal(false)
      // Refresh data after successful creation
      Promise.all([fetchUsers(), fetchRoles()])
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
        message: `Role updated to &quot;${editingRole.name}&quot; successfully`,
        duration: 3000
      })
      setEditingRole(null)
      setShowEditRoleModal(false)
      // Refresh data after successful update
      Promise.all([fetchUsers(), fetchRoles()])
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
        message: `Role for &quot;${editingUser.name}&quot; updated to &quot;${editingUser.currentRole}&quot; successfully`,
        duration: 3000
      })
      setEditingUser(null)
      setShowEditUserRoleModal(false)
      // Refresh data after successful update
      Promise.all([fetchUsers(), fetchRoles()])
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
        message: `User &quot;${deletingUser.name}&quot; deleted successfully`,
        duration: 3000
      })
      setDeletingUser(null)
      setShowDeleteUserModal(false)
      // Refresh data after successful deletion
      Promise.all([fetchUsers(), fetchRoles()])
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
        message: `User &quot;${newUserData.name}&quot; created successfully`,
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
      // Refresh data after successful creation
      Promise.all([fetchUsers(), fetchRoles()])
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



  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A"
    
    try {
    const date = new Date(dateString)
      if (isNaN(date.getTime())) return "Invalid date"
      
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours} hours ago`
    if (diffInHours < 48) return "1 day ago"
    return `${Math.floor(diffInHours / 24)} days ago`
    } catch {
      return "Invalid date"
    }
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    // Type-safe field access with fallback
    const getFieldValue = (user: User, field: string): string => {
      switch (field) {
        case 'name':
          return user.name || ""
        case 'email':
          return user.email || ""
        case 'role':
          return user.role || ""
        case 'projectName':
          return user.projectName || ""
        case 'status':
          return user.status || ""
        case 'createdAt':
          return user.createdAt || ""
        default:
          return ""
      }
    }
    
    const aValue = getFieldValue(a, sortField)
    const bValue = getFieldValue(b, sortField)
    
    if (sortDirection === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })

  // Pagination
  const startIndex = 0
  const endIndex = sortedUsers.length
  const paginatedUsers = sortedUsers.slice(startIndex, endIndex)

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase()
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background transition-colors duration-200">
        <div className="flex-1 overflow-auto">

          {/* Main Content */}
          <main className="px-4 pb-1 sm:px-6 sm:pb-2 space-y-4 sm:space-y-6">
            {isLoading && users.length === 0 && roles.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4 text-center">
                                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-white" />
                </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Loading User Management</h2>
                    <p className="text-sm text-muted-foreground">Please wait while we fetch your data...</p>
                  </div>
                </div>
              </div>
            ) : (
              <>

            {/* Simple Search and Actions */}
            <div className="flex items-center justify-between gap-4">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-10 h-10 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => setShowCreateUserModal(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add User</span>
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowRolesModal(true)}
                  className="flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>Roles</span>
                </Button>
              </div>
            </div>

              {/* Users Table */}
              <Card className="border-border">
                <CardContent className="p-0">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="flex items-center gap-3">
                          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                          <span className="text-muted-foreground">Loading users...</span>
                        </div>
                      </div>
                    ) : error ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="flex flex-col items-center gap-3 text-center">
                          <AlertCircle className="w-12 h-12 text-red-500" />
                          <div>
                            <p className="text-lg font-semibold text-foreground">Failed to load data</p>
                            <p className="text-sm text-muted-foreground">{error}</p>
                            <Button 
                              onClick={loadData}
                              className="mt-4"
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Try Again
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                    <div className="overflow-x-auto bg-background">
                      <table className="w-full border-collapse font-sans text-base">
                        <thead>
                          <tr className="bg-blue-50 dark:bg-slate-800 border-b border-border">
                            <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-sm">
                              #
                            </th>
                            <th 
                              className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-sm cursor-pointer hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors"
                              onClick={() => handleSort("name")}
                            >
                              USER ID
                            </th>
                            <th 
                              className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-sm cursor-pointer hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors"
                              onClick={() => handleSort("createdAt")}
                            >
                              DATE
                            </th>
                            <th 
                              className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-sm cursor-pointer hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors"
                              onClick={() => handleSort("projectName")}
                            >
                              PROJECT NAME
                            </th>
                            <th 
                              className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-sm cursor-pointer hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors"
                              onClick={() => handleSort("name")}
                            >
                              CUSTOMER
                            </th>
                            <th 
                              className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-sm cursor-pointer hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors"
                              onClick={() => handleSort("status")}
                            >
                              STATUS
                            </th>
                            <th className="border border-border px-4 py-3 text-center font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-sm">ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedUsers.map((user, index) => (
                            <tr key={user._id} className="hover:bg-muted transition-colors">
                              <td className="border border-border px-4 py-3 text-sm font-medium text-blue-800">
                                <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded-full text-sm font-semibold text-blue-800">
                                  {startIndex + index + 1}
                                </div>
                              </td>
                              <td className="border border-border px-4 py-3">
                                <span className="text-sm font-medium text-primary cursor-pointer hover:underline">
                                  {user.email.split('@')[0].toUpperCase()}
                                </span>
                              </td>
                              <td className="border border-border px-4 py-3 text-sm text-muted-foreground">
                                {user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : 'N/A'}
                              </td>
                              <td className="border border-border px-4 py-3">
                                <span className="text-sm font-medium text-primary cursor-pointer hover:underline">
                                  {user.projectName}
                                </span>
                              </td>
                              <td className="border border-border px-4 py-3 text-sm text-muted-foreground">
                                {user.name}
                              </td>
                              <td className="border border-border px-4 py-3">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200">
                                  Active
                                </span>
                              </td>
                              <td className="border border-border px-4 py-3">
                                <div className="flex items-center gap-2 justify-center">
                                  <button 
                                    className="w-9 h-9 flex items-center justify-center text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors shadow-sm"
                                    onClick={() => openEditUserRoleModal(user)}
                                    title="Edit User"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button 
                                    className="w-9 h-9 flex items-center justify-center text-destructive border border-destructive rounded-lg hover:bg-destructive/10 transition-colors shadow-sm"
                                    onClick={() => openDeleteUserModal(user)}
                                    title="Delete User"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                  <button 
                                    className="w-9 h-9 flex items-center justify-center text-green-600 border border-green-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors shadow-sm"
                                    onClick={() => openViewUserModal(user)}
                                    title="View User"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                            </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                          </div>
                    )}
                </CardContent>
              </Card>

              </>
            )}
            </main>
        </div>

        {/* Create User Modal */}
        {showCreateUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-border">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-foreground">Create New User</h3>
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
                  <Label htmlFor="userName" className="text-sm font-medium text-foreground">Full Name</Label>
                  <Input
                    id="userName"
                    placeholder="Enter full name"
                    value={newUserData.name}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="userEmail" className="text-sm font-medium text-foreground">Email Address</Label>
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
                  <Label htmlFor="userPassword" className="text-sm font-medium text-foreground">Password</Label>
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
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="userRole" className="text-sm font-medium text-foreground">Role</Label>
                  <select
                    id="userRole"
                    value={newUserData.role}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
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
                  <Label htmlFor="userProject" className="text-sm font-medium text-foreground">Project Name</Label>
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
                    className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleCreateUser}
                    disabled={isCreatingUser}
                  >
                    {isCreatingUser ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin text-white" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2 text-white" />
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-purple-600 rounded-lg">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">Create New Role</h3>
                    <p className="text-sm text-muted-foreground">Add a new role with permissions</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowRoleModal(false)
                    setNewRoleName("")
                  }}
                  className="h-8 w-8 p-0 hover:bg-accent"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="roleName" className="text-sm font-medium text-muted-foreground">Role Name</Label>
                  <Input
                    id="roleName"
                    placeholder="Enter role name (e.g., manager, technician)"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    className="flex-1 h-11 bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={handleCreateRole}
                    disabled={isCreatingRole}
                  >
                    {isCreatingRole ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin text-white" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2 text-white" />
                        Create Role
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRoleModal(false)
                      setNewRoleName("")
                    }}
                    disabled={isCreatingRole}
                    className="h-11 px-6"
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-600 rounded-lg">
                    <Edit className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">Edit Role</h3>
                    <p className="text-sm text-muted-foreground">Update role information</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowEditRoleModal(false)
                    setEditingRole(null)
                  }}
                  className="h-8 w-8 p-0 hover:bg-accent"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="editRoleName" className="text-sm font-medium text-muted-foreground">Role Name</Label>
                      <Input
                        id="editRoleName"
                        placeholder="Enter new role name"
                        value={editingRole?.name || ''}
                        onChange={(e) => setEditingRole(prev => prev ? { id: prev.id, name: e.target.value } : null)}
                    className="h-11"
                      />
                    </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    className="flex-1 h-11 bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleEditRole}
                    disabled={isUpdatingRole}
                  >
                    {isUpdatingRole ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin text-white" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Edit className="w-4 h-4 mr-2 text-white" />
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
                    className="h-11 px-6"
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg p-6 w-full max-w-sm shadow-lg border border-border">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-foreground">Edit User Role</h3>
                <button
                  onClick={() => {
                    setShowEditUserRoleModal(false)
                    setEditingUser(null)
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Role</label>
                  <select
                    value={editingUser?.currentRole || ''}
                    onChange={(e) => setEditingUser(prev => prev ? { ...prev, currentRole: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                  >
                    <option value="">Select a role</option>
                    {roles.map((role) => (
                      <option key={role._id} value={role.name}>
                        {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-50"
                    onClick={handleEditUserRole}
                    disabled={isUpdatingUserRole}
                  >
                    {isUpdatingUserRole ? 'Updating...' : 'Update Role'}
                  </button>
                  <button
                    className="px-4 py-2 border border-border rounded-md text-sm hover:bg-muted text-foreground"
                    onClick={() => {
                      setShowEditUserRoleModal(false)
                      setEditingUser(null)
                    }}
                    disabled={isUpdatingUserRole}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete User Confirmation Modal */}
        {showDeleteUserModal && deletingUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-red-600 rounded-lg">
                  <Trash2 className="w-5 h-5 text-white" />
                </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">Confirm Deletion</h3>
                    <p className="text-sm text-muted-foreground">This action cannot be undone</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowDeleteUserModal(false)
                    setDeletingUser(null)
                  }}
                  className="h-8 w-8 p-0 hover:bg-accent"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-6">
                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">
                        Are you sure you want to delete user &quot;{deletingUser?.name || 'Unknown'}&quot;?
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        This action cannot be undone and will permanently remove the user from the system.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteUserModal(false)
                      setDeletingUser(null)
                    }}
                    disabled={isDeletingUser}
                    className="h-11 px-6"
                  >
                    Cancel
                  </Button>
                  <Button
                    className="h-11 px-6 bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleDeleteUser}
                    disabled={isDeletingUser}
                  >
                    {isDeletingUser ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin text-white" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2 text-white" />
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-lg border border-border">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 font-semibold text-lg">
                      {getInitials(viewingUser?.name || 'Unknown')}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">User Details</h3>
                    <p className="text-sm text-muted-foreground">{viewingUser?.name || 'Unknown User'}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowViewUserModal(false)
                    setViewingUser(null)
                  }}
                  className="text-muted-foreground hover:text-foreground p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* User Information Table */}
              <div className="bg-background rounded-lg shadow-sm overflow-hidden border border-border">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-blue-50 dark:bg-slate-800 border-b border-border">
                        <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                          Field
                        </th>
                        <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                          Value
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        <td className="border border-border px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                          Full Name
                        </td>
                        <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                          {viewingUser?.name || 'N/A'}
                        </td>
                      </tr>
                      <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        <td className="border border-border px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                          Email Address
                        </td>
                        <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                          {viewingUser?.email || 'N/A'}
                        </td>
                      </tr>
                      <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        <td className="border border-border px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                          Role
                        </td>
                        <td className="border border-border px-4 py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            {viewingUser?.role || 'N/A'}
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        <td className="border border-border px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                          Project Name
                        </td>
                        <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                          {viewingUser?.projectName || 'N/A'}
                        </td>
                      </tr>
                      <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        <td className="border border-border px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                          Status
                        </td>
                        <td className="border border-border px-4 py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                            {viewingUser?.status || 'N/A'}
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        <td className="border border-border px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                          Created Date
                        </td>
                        <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                          {formatDate(viewingUser?.createdAt)}
                        </td>
                      </tr>
                      <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        <td className="border border-border px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                          Verification Status
                        </td>
                        <td className="border border-border px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            viewingUser?.isVerified 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          }`}>
                            {viewingUser?.isVerified ? 'Verified' : 'Not Verified'}
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        <td className="border border-border px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                          Phone Number
                        </td>
                        <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                          {viewingUser?.contactInfo?.phone || 'N/A'}
                        </td>
                      </tr>
                      <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        <td className="border border-border px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                          Work Schedule
                        </td>
                        <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                          {viewingUser?.workSchedule ? 
                            `${viewingUser.workSchedule.startTime} - ${viewingUser.workSchedule.endTime} (${viewingUser.workSchedule.shift})` 
                            : 'N/A'
                          }
                        </td>
                      </tr>
                      <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        <td className="border border-border px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                          Working Days
                        </td>
                        <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                          {viewingUser?.workSchedule?.workingDays ? 
                            viewingUser.workSchedule.workingDays.join(', ').replace(/\b\w/g, (l: string) => l.toUpperCase())
                            : 'N/A'
                          }
                        </td>
                      </tr>
                      <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        <td className="border border-border px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                          Emergency Contact
                        </td>
                        <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                          {viewingUser?.contactInfo?.emergencyContact ? 
                            `${viewingUser.contactInfo.emergencyContact.name} (${viewingUser.contactInfo.emergencyContact.relationship}) - ${viewingUser.contactInfo.emergencyContact.phone}`
                            : 'N/A'
                          }
                        </td>
                      </tr>
                      <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        <td className="border border-border px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                          Address
                        </td>
                        <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                          {viewingUser?.contactInfo?.address ? 
                            `${viewingUser.contactInfo.address.street}, ${viewingUser.contactInfo.address.city}, ${viewingUser.contactInfo.address.state} ${viewingUser.contactInfo.address.zipCode}, ${viewingUser.contactInfo.address.country}`
                            : 'N/A'
                          }
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  </div>
                            </div>
            </div>
          </div>
        )}

        {/* Roles Management Modal */}
        {showRolesModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg p-6 w-full max-w-lg shadow-lg border border-border">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-foreground">Role Management</h3>
                <button
                  onClick={() => setShowRolesModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Roles: {roles.length}</span>
                  <button
                    onClick={() => {
                      setShowRolesModal(false)
                      setShowRoleModal(true)
                    }}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                  >
                    Add Role
                  </button>
                </div>
                <div className="space-y-2">
                  {roles.map((role) => (
                    <div key={role._id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                            <div>
                        <span className="text-sm font-medium text-foreground">{role.name}</span>
                        <p className="text-xs text-muted-foreground">Created: {formatDate(role.createdAt)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                        <button 
                          className="w-6 h-6 flex items-center justify-center text-primary border border-primary rounded hover:bg-primary/10"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setShowRolesModal(false)
                                openEditRoleModal(role)
                              }}
                            >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button 
                          className="w-6 h-6 flex items-center justify-center text-destructive border border-destructive rounded hover:bg-destructive/10"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                console.log('Delete button clicked for role:', role)
                                // Add delete role functionality here
                              }}
                            >
                          <Trash2 className="w-3 h-3" />
                        </button>
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