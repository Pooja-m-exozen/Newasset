import { useState, useEffect, useCallback, useRef } from 'react'
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
  // Store original tagIds to preserve them across updates
  const originalTagIdsRef = useRef<Map<string, { mainTagId: string; subAssetTagIds: Map<string, string> }>>(new Map())
  // Store previous assets to compare without causing re-renders
  const previousAssetsRef = useRef<AssetData[]>([])

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
        
        // Helper function to find original sub-asset by multiple methods
        const findOriginalSubAsset = (
          updatedSubAsset: { _id?: string; tagId?: string; assetName?: string; brand?: string; model?: string },
          originalSubAssets: Array<{ _id?: string; tagId?: string; assetName?: string; brand?: string; model?: string }> | undefined,
          index: number
        ) => {
          if (!originalSubAssets || originalSubAssets.length === 0) return undefined;
          
          // Method 1: Match by _id (most reliable)
          if (updatedSubAsset._id) {
            const found = originalSubAssets.find(sa => sa._id === updatedSubAsset._id);
            if (found) return found;
          }
          
          // Method 2: Match by tagId (if backend preserved it)
          if (updatedSubAsset.tagId) {
            const found = originalSubAssets.find(sa => sa.tagId === updatedSubAsset.tagId);
            if (found) return found;
          }
          
          // Method 3: Match by assetName + brand + model (fallback)
          if (updatedSubAsset.assetName && updatedSubAsset.brand && updatedSubAsset.model) {
            const found = originalSubAssets.find(sa => 
              sa.assetName === updatedSubAsset.assetName &&
              sa.brand === updatedSubAsset.brand &&
              sa.model === updatedSubAsset.model
            );
            if (found) return found;
          }
          
          // Method 4: Match by index as last resort
          if (index >= 0 && index < originalSubAssets.length) {
            return originalSubAssets[index];
          }
          
          return undefined;
        };

        const transformedAssets = assetsToProcess.map((asset: ApiAsset) => {
          // Get original asset from previous state to preserve tagIds (use ref to avoid dependency issues)
          const originalAsset = previousAssetsRef.current.find(a => a._id === asset._id);
          const originalTagIdData = originalTagIdsRef.current.get(asset._id || '');
          
          // CRITICAL: Always prefer stored tagId over backend value
          // Priority: 1) Stored in ref, 2) From previous state, 3) From backend (only if new asset)
          let preservedMainTagId: string;
          
          if (originalTagIdData?.mainTagId) {
            // We have a stored tagId - ALWAYS use it
            preservedMainTagId = originalTagIdData.mainTagId;
            if (asset.tagId !== preservedMainTagId) {
              console.warn('🛡️ TAG ID PRESERVATION: Backend changed main asset tagId. Preserving stored original:', {
                assetId: asset._id,
                stored: preservedMainTagId,
                backend: asset.tagId,
                preserving: preservedMainTagId
              });
            } else {
              console.log('✅ TAG ID PRESERVED: Main asset tagId unchanged:', preservedMainTagId);
            }
          } else if (originalAsset?.tagId) {
            // Use tagId from previous state
            preservedMainTagId = originalAsset.tagId;
            if (asset.tagId !== preservedMainTagId) {
              console.warn('WARNING: Backend changed main asset tagId. Preserving from previous state:', {
                assetId: asset._id,
                original: preservedMainTagId,
                backend: asset.tagId,
                preserving: preservedMainTagId
              });
            }
            // Store it for future use
            originalTagIdsRef.current.set(asset._id || '', {
              mainTagId: preservedMainTagId,
              subAssetTagIds: new Map()
            });
          } else {
            // New asset - use backend value and store it IMMEDIATELY
            preservedMainTagId = asset.tagId;
            console.log('📝 STORING NEW ASSET TAG ID:', {
              assetId: asset._id,
              tagId: preservedMainTagId
            });
            originalTagIdsRef.current.set(asset._id || '', {
              mainTagId: preservedMainTagId,
              subAssetTagIds: new Map()
            });
          }
          
          // CRITICAL: Ensure tagId is ALWAYS stored, even if it wasn't before
          // This handles the case where asset was loaded but tagId wasn't stored
          if (!originalTagIdsRef.current.has(asset._id || '')) {
            console.warn('⚠️ Asset tagId not stored - storing now:', {
              assetId: asset._id,
              tagId: preservedMainTagId
            });
            originalTagIdsRef.current.set(asset._id || '', {
              mainTagId: preservedMainTagId,
              subAssetTagIds: new Map()
            });
          }
          
          // Process sub-assets and preserve their tagIds
          const processedSubAssets = asset.subAssets ? {
            movable: asset.subAssets.movable.map((subAsset, index) => {
              const originalSubAssets = originalAsset?.subAssets?.movable;
              const originalSubAsset = findOriginalSubAsset(subAsset, originalSubAssets, index);
              
              // CRITICAL: Always prefer stored tagId over backend value
              // Priority: 1) Stored in ref (by _id), 2) Stored in ref (by tagId match), 3) From original sub-asset, 4) From backend (only if new)
              let preservedTagId: string;
              
              // Method 1: Try to get stored tagId by _id
              const storedTagIdById = subAsset._id ? originalTagIdData?.subAssetTagIds.get(subAsset._id) : undefined;
              
              // Method 2: Try to find stored tagId by matching tagId (in case _id changed but tagId is the same)
              let storedTagIdByTagId: string | undefined;
              if (!storedTagIdById && subAsset.tagId && originalTagIdData) {
                // Search through stored tagIds to find a match
                for (const [storedSubAssetId, storedTagId] of originalTagIdData.subAssetTagIds.entries()) {
                  if (storedTagId === subAsset.tagId) {
                    storedTagIdByTagId = storedTagId;
                    // Update the mapping to use the new _id
                    if (subAsset._id && storedSubAssetId !== subAsset._id) {
                      originalTagIdData.subAssetTagIds.delete(storedSubAssetId);
                      originalTagIdData.subAssetTagIds.set(subAsset._id, storedTagId);
                      console.log('🔄 Updated movable sub-asset tagId mapping (old _id to new _id):', {
                        oldId: storedSubAssetId,
                        newId: subAsset._id,
                        tagId: storedTagId
                      });
                    }
                    break;
                  }
                }
              }
              
              if (storedTagIdById) {
                // We have a stored tagId by _id - ALWAYS use it
                preservedTagId = storedTagIdById;
                if (subAsset.tagId !== preservedTagId) {
                  console.warn('🛡️ TAG ID PRESERVATION: Backend changed movable sub-asset tagId. Preserving stored original:', {
                    assetId: asset._id,
                    subAssetId: subAsset._id,
                    subAssetName: subAsset.assetName,
                    stored: preservedTagId,
                    backend: subAsset.tagId,
                    preserving: preservedTagId
                  });
                } else {
                  console.log('✅ TAG ID PRESERVED: Movable sub-asset tagId unchanged:', preservedTagId);
                }
              } else if (storedTagIdByTagId) {
                // We found a stored tagId by matching tagId - use it
                preservedTagId = storedTagIdByTagId;
                if (subAsset.tagId !== preservedTagId) {
                  console.warn('🛡️ TAG ID PRESERVATION: Backend changed movable sub-asset tagId. Preserving stored original (found by tagId match):', {
                    assetId: asset._id,
                    subAssetId: subAsset._id,
                    subAssetName: subAsset.assetName,
                    stored: preservedTagId,
                    backend: subAsset.tagId,
                    preserving: preservedTagId
                  });
                }
                // Ensure it's stored with the current _id
                if (subAsset._id) {
                  const currentData = originalTagIdsRef.current.get(asset._id || '') || {
                    mainTagId: preservedMainTagId,
                    subAssetTagIds: new Map()
                  };
                  currentData.subAssetTagIds.set(subAsset._id, preservedTagId);
                  originalTagIdsRef.current.set(asset._id || '', currentData);
                }
              } else if (originalSubAsset?.tagId) {
                // Use tagId from original sub-asset
                preservedTagId = originalSubAsset.tagId;
                if (subAsset.tagId !== preservedTagId) {
                  console.warn('WARNING: Backend changed movable sub-asset tagId. Preserving from original:', {
                    assetId: asset._id,
                    subAssetId: subAsset._id,
                    subAssetName: subAsset.assetName,
                    original: preservedTagId,
                    backend: subAsset.tagId,
                    preserving: preservedTagId
                  });
                }
                // Store it for future use
                if (subAsset._id) {
                  const currentData = originalTagIdsRef.current.get(asset._id || '') || {
                    mainTagId: preservedMainTagId,
                    subAssetTagIds: new Map()
                  };
                  currentData.subAssetTagIds.set(subAsset._id, preservedTagId);
                  originalTagIdsRef.current.set(asset._id || '', currentData);
                }
              } else {
                // New sub-asset - use backend value and store it IMMEDIATELY
                preservedTagId = subAsset.tagId || '';
                if (subAsset._id && preservedTagId) {
                  console.log('📝 STORING NEW MOVABLE SUB-ASSET TAG ID:', {
                    assetId: asset._id,
                    subAssetId: subAsset._id,
                    tagId: preservedTagId
                  });
                  const currentData = originalTagIdsRef.current.get(asset._id || '') || {
                    mainTagId: preservedMainTagId,
                    subAssetTagIds: new Map()
                  };
                  currentData.subAssetTagIds.set(subAsset._id, preservedTagId);
                  originalTagIdsRef.current.set(asset._id || '', currentData);
                }
              }
              
              // CRITICAL: Ensure sub-asset tagId is ALWAYS stored if it exists
              // This handles the case where sub-asset was loaded but tagId wasn't stored
              if (subAsset._id && preservedTagId && !originalTagIdsRef.current.get(asset._id || '')?.subAssetTagIds.has(subAsset._id)) {
                console.warn('⚠️ Movable sub-asset tagId not stored - storing now:', {
                  assetId: asset._id,
                  subAssetId: subAsset._id,
                  tagId: preservedTagId
                });
                const currentData = originalTagIdsRef.current.get(asset._id || '') || {
                  mainTagId: preservedMainTagId,
                  subAssetTagIds: new Map()
                };
                currentData.subAssetTagIds.set(subAsset._id, preservedTagId);
                originalTagIdsRef.current.set(asset._id || '', currentData);
              }
              
              return {
              id: subAsset._id || subAsset.id,
              _id: subAsset._id,
                tagId: preservedTagId, // Use preserved tagId
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
              };
            }),
            immovable: asset.subAssets.immovable.map((subAsset, index) => {
              const originalSubAssets = originalAsset?.subAssets?.immovable;
              const originalSubAsset = findOriginalSubAsset(subAsset, originalSubAssets, index);
              
              // CRITICAL: Always prefer stored tagId over backend value
              // Priority: 1) Stored in ref (by _id), 2) Stored in ref (by tagId match), 3) From original sub-asset, 4) From backend (only if new)
              let preservedTagId: string;
              
              // Method 1: Try to get stored tagId by _id
              const storedTagIdById = subAsset._id ? originalTagIdData?.subAssetTagIds.get(subAsset._id) : undefined;
              
              // Method 2: Try to find stored tagId by matching tagId (in case _id changed but tagId is the same)
              let storedTagIdByTagId: string | undefined;
              if (!storedTagIdById && subAsset.tagId && originalTagIdData) {
                // Search through stored tagIds to find a match
                for (const [storedSubAssetId, storedTagId] of originalTagIdData.subAssetTagIds.entries()) {
                  if (storedTagId === subAsset.tagId) {
                    storedTagIdByTagId = storedTagId;
                    // Update the mapping to use the new _id
                    if (subAsset._id && storedSubAssetId !== subAsset._id) {
                      originalTagIdData.subAssetTagIds.delete(storedSubAssetId);
                      originalTagIdData.subAssetTagIds.set(subAsset._id, storedTagId);
                      console.log('🔄 Updated immovable sub-asset tagId mapping (old _id to new _id):', {
                        oldId: storedSubAssetId,
                        newId: subAsset._id,
                        tagId: storedTagId
                      });
                    }
                    break;
                  }
                }
              }
              
              if (storedTagIdById) {
                // We have a stored tagId by _id - ALWAYS use it
                preservedTagId = storedTagIdById;
                if (subAsset.tagId !== preservedTagId) {
                  console.warn('🛡️ TAG ID PRESERVATION: Backend changed immovable sub-asset tagId. Preserving stored original:', {
                    assetId: asset._id,
                    subAssetId: subAsset._id,
                    subAssetName: subAsset.assetName,
                    stored: preservedTagId,
                    backend: subAsset.tagId,
                    preserving: preservedTagId
                  });
                } else {
                  console.log('✅ TAG ID PRESERVED: Immovable sub-asset tagId unchanged:', preservedTagId);
                }
              } else if (storedTagIdByTagId) {
                // We found a stored tagId by matching tagId - use it
                preservedTagId = storedTagIdByTagId;
                if (subAsset.tagId !== preservedTagId) {
                  console.warn('🛡️ TAG ID PRESERVATION: Backend changed immovable sub-asset tagId. Preserving stored original (found by tagId match):', {
                    assetId: asset._id,
                    subAssetId: subAsset._id,
                    subAssetName: subAsset.assetName,
                    stored: preservedTagId,
                    backend: subAsset.tagId,
                    preserving: preservedTagId
                  });
                }
                // Ensure it's stored with the current _id
                if (subAsset._id) {
                  const currentData = originalTagIdsRef.current.get(asset._id || '') || {
                    mainTagId: preservedMainTagId,
                    subAssetTagIds: new Map()
                  };
                  currentData.subAssetTagIds.set(subAsset._id, preservedTagId);
                  originalTagIdsRef.current.set(asset._id || '', currentData);
                }
              } else if (originalSubAsset?.tagId) {
                // Use tagId from original sub-asset
                preservedTagId = originalSubAsset.tagId;
                if (subAsset.tagId !== preservedTagId) {
                  console.warn('WARNING: Backend changed immovable sub-asset tagId. Preserving from original:', {
                    assetId: asset._id,
                    subAssetId: subAsset._id,
                    subAssetName: subAsset.assetName,
                    original: preservedTagId,
                    backend: subAsset.tagId,
                    preserving: preservedTagId
                  });
                }
                // Store it for future use
                if (subAsset._id) {
                  const currentData = originalTagIdsRef.current.get(asset._id || '') || {
                    mainTagId: preservedMainTagId,
                    subAssetTagIds: new Map()
                  };
                  currentData.subAssetTagIds.set(subAsset._id, preservedTagId);
                  originalTagIdsRef.current.set(asset._id || '', currentData);
                }
              } else {
                // New sub-asset - use backend value and store it IMMEDIATELY
                preservedTagId = subAsset.tagId || '';
                if (subAsset._id && preservedTagId) {
                  console.log('📝 STORING NEW IMMOVABLE SUB-ASSET TAG ID:', {
                    assetId: asset._id,
                    subAssetId: subAsset._id,
                    tagId: preservedTagId
                  });
                  const currentData = originalTagIdsRef.current.get(asset._id || '') || {
                    mainTagId: preservedMainTagId,
                    subAssetTagIds: new Map()
                  };
                  currentData.subAssetTagIds.set(subAsset._id, preservedTagId);
                  originalTagIdsRef.current.set(asset._id || '', currentData);
                }
              }
              
              // CRITICAL: Ensure sub-asset tagId is ALWAYS stored if it exists
              // This handles the case where sub-asset was loaded but tagId wasn't stored
              if (subAsset._id && preservedTagId && !originalTagIdsRef.current.get(asset._id || '')?.subAssetTagIds.has(subAsset._id)) {
                console.warn('⚠️ Immovable sub-asset tagId not stored - storing now:', {
                  assetId: asset._id,
                  subAssetId: subAsset._id,
                  tagId: preservedTagId
                });
                const currentData = originalTagIdsRef.current.get(asset._id || '') || {
                  mainTagId: preservedMainTagId,
                  subAssetTagIds: new Map()
                };
                currentData.subAssetTagIds.set(subAsset._id, preservedTagId);
                originalTagIdsRef.current.set(asset._id || '', currentData);
              }
              
              return {
              id: subAsset._id || subAsset.id,
              _id: subAsset._id,
                tagId: preservedTagId, // Use preserved tagId
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
              };
            })
          } : undefined;
          
          return {
            ...asset,
            tagId: preservedMainTagId, // Use preserved main tagId
            subAssets: processedSubAssets
          };
        });
        
        // CRITICAL: Store all tagIds in ref BEFORE updating state
        // This ensures tagIds are preserved even if backend changes them
        // IMPORTANT: Only store if we don't already have a stored value (preserve existing stored tagIds)
        transformedAssets.forEach((transformedAsset) => {
          const assetId = transformedAsset._id || '';
          if (assetId) {
            const currentData = originalTagIdsRef.current.get(assetId);
            
            // Store main asset tagId only if we don't have one stored
            if (!currentData) {
              originalTagIdsRef.current.set(assetId, {
                mainTagId: transformedAsset.tagId,
                subAssetTagIds: new Map()
              });
            }
            
            // Store sub-asset tagIds only if we don't already have them stored
            if (transformedAsset.subAssets) {
              const existingData = originalTagIdsRef.current.get(assetId) || {
                mainTagId: transformedAsset.tagId,
                subAssetTagIds: new Map()
              };
              
              transformedAsset.subAssets.movable?.forEach((subAsset) => {
                if (subAsset._id && subAsset.tagId && !existingData.subAssetTagIds.has(subAsset._id)) {
                  existingData.subAssetTagIds.set(subAsset._id, subAsset.tagId);
                }
              });
              
              transformedAsset.subAssets.immovable?.forEach((subAsset) => {
                if (subAsset._id && subAsset.tagId && !existingData.subAssetTagIds.has(subAsset._id)) {
                  existingData.subAssetTagIds.set(subAsset._id, subAsset.tagId);
                }
              });
              
              originalTagIdsRef.current.set(assetId, existingData);
            }
          }
        });
        
        console.log('💾 FINAL TAG ID STORAGE:', {
          totalAssets: transformedAssets.length,
          storedTagIds: Array.from(originalTagIdsRef.current.entries()).map(([id, data]) => ({
            assetId: id,
            mainTagId: data.mainTagId,
            subAssetCount: data.subAssetTagIds.size
          }))
        });
        
        // Update previous assets ref before setting new state
        previousAssetsRef.current = transformedAssets as AssetData[];
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

