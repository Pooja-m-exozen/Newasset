'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface DigitalAssetsContextType {
  isAuthenticated: boolean
  authToken: string | null
  setAuthToken: (token: string | null) => void
  clearAuthToken: () => void
}

const DigitalAssetsContext = createContext<DigitalAssetsContextType | undefined>(undefined)

export function DigitalAssetsProvider({ children }: { children: ReactNode }) {
  const [authToken, setAuthTokenState] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (token) {
      setAuthTokenState(token)
      setIsAuthenticated(true)
    }
  }, [])

  const setAuthToken = (token: string | null) => {
    if (token) {
      localStorage.setItem('authToken', token)
      setAuthTokenState(token)
      setIsAuthenticated(true)
    } else {
      clearAuthToken()
    }
  }

  const clearAuthToken = () => {
    localStorage.removeItem('authToken')
    setAuthTokenState(null)
    setIsAuthenticated(false)
  }

  const value = {
    isAuthenticated,
    authToken,
    setAuthToken,
    clearAuthToken,
  }

  return React.createElement(DigitalAssetsContext.Provider, { value }, children)
}

export function useDigitalAssets() {
  const context = useContext(DigitalAssetsContext)
  if (context === undefined) {
    throw new Error('useDigitalAssets must be used within a DigitalAssetsProvider')
  }
  return context
} 