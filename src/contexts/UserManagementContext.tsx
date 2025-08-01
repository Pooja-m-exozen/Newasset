"use client"

import { createContext, useContext, useState, ReactNode } from 'react'
import { manageUserService, User as ApiUser, Role, CreateUserData } from '@/lib/manageuser'

interface UserManagementContextType {
  users: ApiUser[]
  roles: Role[]
  isLoading: boolean
  fetchUsers: () => Promise<void>
  fetchRoles: () => Promise<void>
  createUser: (userData: CreateUserData) => Promise<void>
  createRole: (roleData: { name: string }) => Promise<void>
  updateRole: (roleId: string, roleData: { role: string }) => Promise<void>
  updateUserRole: (userId: string, roleData: { role: string }) => Promise<void>
  deleteUser: (userId: string) => Promise<void>
  updateUserInList: (userId: string, userData: Partial<ApiUser>) => void
  deleteUserFromList: (userId: string) => void
  addRoleToList: (role: Role) => void
  deleteRoleFromList: (roleId: string) => void
  addUserToList: (user: ApiUser) => void
  updateRoleInList: (roleId: string, roleData: Partial<Role>) => void
}

const UserManagementContext = createContext<UserManagementContextType | undefined>(undefined)

export function UserManagementProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<ApiUser[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const response = await manageUserService.getUsers()
      if (response.success) {
        setUsers(response.users)
      } else {
        throw new Error('Failed to fetch users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      setIsLoading(true)
      const response = await manageUserService.getRoles()
      if (response.success) {
        setRoles(response.roles)
      } else {
        throw new Error('Failed to fetch roles')
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const createUser = async (userData: CreateUserData) => {
    try {
      const response = await manageUserService.createUser(userData)
      if (response.success && response.user) {
        addUserToList(response.user)
      } else {
        throw new Error('Failed to create user')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  }

  const createRole = async (roleData: { name: string }) => {
    try {
      const response = await manageUserService.createRole(roleData)
      if (response.success) {
        addRoleToList(response.role)
      } else {
        throw new Error('Failed to create role')
      }
    } catch (error) {
      console.error('Error creating role:', error)
      throw error
    }
  }

  const updateRole = async (roleId: string, roleData: { role: string }) => {
    try {
      console.log('Updating role:', roleId, roleData)
      const response = await manageUserService.updateRole(roleId, roleData)
      console.log('Role update response:', response)
      if (response.success && response.role) {
        updateRoleInList(roleId, response.role)
      } else if (response.success) {
        // If API doesn't return the updated role, manually update the local state
        setRoles(prevRoles => 
          prevRoles.map(role => 
            role._id === roleId ? { ...role, name: roleData.role } : role
          )
        )
        // Refresh roles to ensure UI is in sync
        await fetchRoles()
      } else {
        throw new Error('Failed to update role')
      }
    } catch (error) {
      console.error('Error updating role:', error)
      throw error
    }
  }

  const updateUserRole = async (userId: string, roleData: { role: string }) => {
    try {
      console.log('Updating user role:', userId, roleData)
      const response = await manageUserService.updateUserRole(userId, roleData)
      console.log('User role update response:', response)
      if (response.success && response.user) {
        updateUserInList(userId, response.user)
      } else if (response.success) {
        // If API doesn't return the updated user, manually update the local state
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user._id === userId ? { ...user, role: roleData.role } : user
          )
        )
        // Refresh users to ensure UI is in sync
        await fetchUsers()
      } else {
        throw new Error('Failed to update user role')
      }
    } catch (error) {
      console.error('Error updating user role:', error)
      throw error
    }
  }

  const deleteUser = async (userId: string) => {
    try {
      const response = await manageUserService.deleteUser(userId)
      if (response.success) {
        deleteUserFromList(userId)
      } else {
        throw new Error('Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  }

  const updateUserInList = (userId: string, userData: Partial<ApiUser>) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user._id === userId ? { ...user, ...userData } : user
      )
    )
  }

  const deleteUserFromList = (userId: string) => {
    setUsers(prevUsers => prevUsers.filter(user => user._id !== userId))
  }

  const addUserToList = (newUser: ApiUser) => {
    setUsers(prevUsers => [newUser, ...prevUsers])
  }

  const addRoleToList = (role: Role) => {
    setRoles(prevRoles => [...prevRoles, role])
  }

  const deleteRoleFromList = (roleId: string) => {
    setRoles(prevRoles => prevRoles.filter(role => role._id !== roleId))
  }

  const updateRoleInList = (roleId: string, roleData: Partial<Role>) => {
    setRoles(prevRoles => 
      prevRoles.map(role => 
        role._id === roleId ? { ...role, ...roleData } : role
      )
    )
  }

  const value: UserManagementContextType = {
    users,
    roles,
    isLoading,
    fetchUsers,
    fetchRoles,
    createUser,
    createRole,
    updateRole,
    updateUserRole,
    deleteUser,
    updateUserInList,
    deleteUserFromList,
    addRoleToList,
    deleteRoleFromList,
    addUserToList,
    updateRoleInList
  }

  return (
    <UserManagementContext.Provider value={value}>
      {children}
    </UserManagementContext.Provider>
  )
}

export function useUserManagement() {
  const context = useContext(UserManagementContext)
  if (context === undefined) {
    throw new Error('useUserManagement must be used within a UserManagementProvider')
  }
  return context
} 