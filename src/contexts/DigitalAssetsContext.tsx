'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { 
  getAssets, 
  getAssetById, 
  searchAssets, 
  getAssetIdFromInput, 
  type Asset, 
  type AssetsResponse, 
  type AssetResponse 
} from '@/lib/DigitalAssets'

interface DigitalAssetsContextType {
  isAuthenticated: boolean
  authToken: string | null
  setAuthToken: (token: string | null) => void
  clearAuthToken: () => void
  
  // Assets state
  assets: Asset[]
  selectedAsset: Asset | null
  loading: boolean
  error: string | null
  
  // Assets actions
  fetchAssets: (search?: string) => Promise<void>
  fetchAssetById: (assetId: string) => Promise<void>
  searchAssetsByTerm: (searchTerm: string) => Promise<void>
  clearSelectedAsset: () => void
  clearError: () => void
  setSelectedAsset: (asset: Asset | null) => void
  
  // Asset mapping
  getAssetIdFromInput: (input: string) => Promise<string>
  
  // API testing
  testAPIConnection: () => Promise<boolean>
  
  // Backward compatibility aliases
  fetchAssetByTagId: (assetId: string) => Promise<void>
  searchAssets: (searchTerm: string) => Promise<void>
  getAssetIdFromTagId: (input: string) => Promise<string>
}

const DigitalAssetsContext = createContext<DigitalAssetsContextType | undefined>(undefined)

export function DigitalAssetsProvider({ children }: { children: ReactNode }) {
  const [authToken, setAuthTokenState] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  // Assets state
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Prevent concurrent API calls
  const [isApiCallInProgress, setIsApiCallInProgress] = useState(false)
  
  // Debounce mechanism to prevent rapid successive calls
  const [lastCallTime, setLastCallTime] = useState(0)
  const DEBOUNCE_DELAY = 1000 // 1 second delay

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (token) {
      setAuthTokenState(token)
      setIsAuthenticated(true)
    }
  }, [])

  // Cleanup function to prevent memory leaks
  useEffect(() => {
    return () => {
      // Reset API call state on unmount
      setIsApiCallInProgress(false)
      setLoading(false)
      setLastCallTime(0)
    }
  }, [])

  const setAuthToken = useCallback((token: string | null) => {
    if (token) {
      localStorage.setItem('authToken', token)
      setAuthTokenState(token)
      setIsAuthenticated(true)
    } else {
      clearAuthToken()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const clearAuthToken = useCallback(() => {
    localStorage.removeItem('authToken')
    setAuthTokenState(null)
    setIsAuthenticated(false)
    // Clear assets data when logging out
    setAssets([])
    setSelectedAsset(null)
    setError(null)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const clearSelectedAsset = useCallback(() => {
    setSelectedAsset(null)
  }, [])

  // Fetch all assets
  const fetchAssets = useCallback(async (search?: string) => {
    // Prevent concurrent API calls
    if (isApiCallInProgress) {
      console.log('⚠️ API call already in progress, skipping...')
      return
    }
    
    // Debounce mechanism
    const now = Date.now()
    if (now - lastCallTime < DEBOUNCE_DELAY) {
      console.log('⚠️ API call debounced, skipping...')
      return
    }
    
    try {
      setIsApiCallInProgress(true)
      setLastCallTime(now)
      setLoading(true)
      setError(null)
      
      const response: AssetsResponse = await getAssets(search)
      setAssets(response.assets)
      
      console.log('✅ Assets fetched successfully:', response.assets.length, 'assets')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch assets'
      setError(errorMessage)
      console.error('❌ Error fetching assets:', err)
    } finally {
      setLoading(false)
      setIsApiCallInProgress(false)
    }
  }, [isApiCallInProgress, lastCallTime])

  // Fetch asset by ID (works with both tagId and _id)
  const fetchAssetById = useCallback(async (assetId: string) => {
    // Prevent concurrent API calls
    if (isApiCallInProgress) {
      console.log('⚠️ API call already in progress, skipping...')
      return
    }
    
    try {
      setIsApiCallInProgress(true)
      setLoading(true)
      setError(null)
      
      console.log('🔄 Starting to fetch asset by ID:', assetId)
      
      const response: AssetResponse = await getAssetById(assetId)
      setSelectedAsset(response.asset)
      
      console.log('✅ Asset fetched successfully:', response.asset.tagId)
    } catch (err) {
      console.error('❌ Error in fetchAssetById:', err)
      
      let errorMessage = 'Failed to fetch asset'
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'string') {
        errorMessage = err
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = String(err.message)
      }
      
      setError(errorMessage)
      console.error('❌ Error fetching asset:', errorMessage)
    } finally {
      setLoading(false)
      setIsApiCallInProgress(false)
    }
  }, [isApiCallInProgress])

  // Search assets by any identifier
  const searchAssetsByTerm = useCallback(async (searchTerm: string) => {
    // Prevent concurrent API calls
    if (isApiCallInProgress) {
      console.log('⚠️ API call already in progress, skipping...')
      return
    }
    
    try {
      setIsApiCallInProgress(true)
      setLoading(true)
      setError(null)
      
      const response: AssetsResponse = await searchAssets(searchTerm)
      setAssets(response.assets)
      
      console.log('✅ Assets search completed:', response.assets.length, 'assets found')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search assets'
      setError(errorMessage)
      console.error('❌ Error searching assets:', err)
    } finally {
      setLoading(false)
      setIsApiCallInProgress(false)
    }
  }, [isApiCallInProgress])

  // Test API connection
  const testAPIConnection = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔍 Testing API connection...')
      await getAssets()
      console.log('✅ API connection test successful')
      return true
    } catch (error) {
      console.error('❌ API connection test failed:', error)
      return false
    }
  }, [])

  const value = {
    isAuthenticated,
    authToken,
    setAuthToken,
    clearAuthToken,
    
    // Assets state
    assets,
    selectedAsset,
    loading,
    error,
    
    // Assets actions
    fetchAssets,
    fetchAssetById,
    searchAssetsByTerm,
    clearSelectedAsset,
    clearError,
    setSelectedAsset,
    
    // Asset mapping
    getAssetIdFromInput,
    
    // API testing
    testAPIConnection,
  }

  // Add backward compatibility aliases
  const valueWithAliases = {
    ...value,
    // Backward compatibility aliases
    fetchAssetByTagId: fetchAssetById,
    searchAssets: searchAssetsByTerm,
    getAssetIdFromTagId: getAssetIdFromInput,
  }

  return React.createElement(DigitalAssetsContext.Provider, { value: valueWithAliases }, children)
}

export function useDigitalAssets() {
  const context = useContext(DigitalAssetsContext)
  if (context === undefined) {
    throw new Error('useDigitalAssets must be used within a DigitalAssetsProvider')
  }
  return context
} 