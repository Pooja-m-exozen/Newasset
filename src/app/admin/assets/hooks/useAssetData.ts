import { useState, useEffect, useCallback } from 'react'
import { AssetData } from '@/lib/adminasset'
import { getAssets, searchAssets, assetApi } from '@/lib/adminasset'
import { ApiAsset, ApiAssetsResponse } from '../types'
import { getFilteredAssets } from '../utils/asset-helpers'

export const useAssetData = (
  user: { projectName?: string } | null,
  searchTerm: string,
  selectedMobility: 'all' | 'movable' | 'immovable' | 'inventory' | 'far'
) => {
  const [assets, setAssets] = useState<AssetData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
     
      let response
      if (searchTerm.trim()) {
        response = await searchAssets(searchTerm)
      } else if (selectedMobility === 'movable' || selectedMobility === 'immovable' || selectedMobility === 'all' || selectedMobility === 'inventory') {
        response = await assetApi.getAssetsWithSubAssets(true, 1, 10000)
      } else {
        response = await getAssets(1, 10000)
      }
     
      if (response.success) {
        const apiResponse = response as ApiAssetsResponse
        
        // Filter assets by user's project
        const userProjectName = user?.projectName?.trim().toLowerCase()
        const assetsToProcess = apiResponse.assets.filter((asset: ApiAsset) => {
          if (!userProjectName) return true
          const assetProjectName = (asset.project?.projectName || '').trim().toLowerCase()
          return assetProjectName === userProjectName
        })
        
        const transformedAssets = assetsToProcess.map((asset: ApiAsset) => ({
          ...asset,
          subAssets: asset.subAssets ? {
            movable: asset.subAssets.movable.map((subAsset) => ({
              id: subAsset._id || subAsset.id,
              _id: subAsset._id,
              tagId: subAsset.tagId,
              assetName: subAsset.assetName,
              description: subAsset.description,
              category: subAsset.category,
              brand: subAsset.brand,
              model: subAsset.model,
              capacity: subAsset.capacity,
              location: subAsset.location,
              digitalTagType: subAsset.digitalTagType,
              digitalAssets: subAsset.digitalAssets,
              hasDigitalAssets: subAsset.hasDigitalAssets,
              inventory: subAsset.inventory
            })),
            immovable: asset.subAssets.immovable.map((subAsset) => ({
              id: subAsset._id || subAsset.id,
              _id: subAsset._id,
              tagId: subAsset.tagId,
              assetName: subAsset.assetName,
              description: subAsset.description,
              category: subAsset.category,
              brand: subAsset.brand,
              model: subAsset.model,
              capacity: subAsset.capacity,
              location: subAsset.location,
              digitalTagType: subAsset.digitalTagType,
              digitalAssets: subAsset.digitalAssets,
              hasDigitalAssets: subAsset.hasDigitalAssets,
              inventory: subAsset.inventory
            }))
          } : undefined
        }))
        setAssets(transformedAssets as AssetData[])
      } else {
        setError(response.message || 'Failed to fetch assets')
      }
    } catch (error) {
      console.error('Error fetching assets:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch assets')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, selectedMobility, user?.projectName])

  useEffect(() => {
    fetchAssets()
  }, [fetchAssets, user?.projectName])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        fetchAssets()
      }
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [searchTerm, fetchAssets])

  useEffect(() => {
    fetchAssets()
  }, [selectedMobility, fetchAssets])

  const filteredAssets = getFilteredAssets(assets, selectedMobility)

  return {
    assets,
    filteredAssets,
    error,
    loading,
    fetchAssets,
    setAssets
  }
}

