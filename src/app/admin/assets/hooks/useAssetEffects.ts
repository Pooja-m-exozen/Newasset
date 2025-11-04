import { useEffect } from 'react'
import { getLocations, Location } from '@/lib/location'

interface User {
  projectName?: string
  name?: string
  projectId?: string
}

interface UseAssetEffectsProps {
  user: User | null
  showAddAssetModal: boolean
  setLocations: (locations: Location[]) => void
  setLoadingLocations: (loading: boolean) => void
  setSelectedLocationId: (id: string) => void
  setSelectedLocationName: (name: string) => void
  searchTerm: string
  selectedMobility: 'all' | 'movable' | 'immovable' | 'inventory' | 'far'
  fetchAssets: () => Promise<void>
}

export const useAssetEffects = ({
  user,
  showAddAssetModal,
  setLocations,
  setLoadingLocations,
  setSelectedLocationId,
  setSelectedLocationName,
  searchTerm,
  selectedMobility,
  fetchAssets
}: UseAssetEffectsProps) => {
  // Fetch locations when modal opens
  useEffect(() => {
    if (showAddAssetModal) {
      const fetchLocationsData = async () => {
        setLoadingLocations(true)
        try {
          const allLocations = await getLocations()
          const userProjectName = user?.projectName?.trim().toLowerCase()
          
          const uniqueIds = new Set<string>()
          const filteredLocations = allLocations.filter((location) => {
            if (!location.parentId) return false
            
            if (userProjectName) {
              const locProjectName = location.projectName?.trim().toLowerCase()
              const locName = location.name?.trim().toLowerCase()
              
              if (locProjectName !== userProjectName && locName !== userProjectName) {
                const parent = allLocations.find(l => l._id === location.parentId)
                if (parent) {
                  const parentProjectName = parent.projectName?.trim().toLowerCase()
                  const parentName = parent.name?.trim().toLowerCase()
                  if (parentProjectName !== userProjectName && parentName !== userProjectName) {
                    return false
                  }
                } else {
                  return false
                }
              }
            }
            
            if (uniqueIds.has(location._id)) {
              return false
            }
            uniqueIds.add(location._id)
            return true
          })
          
          setLocations(filteredLocations)
        } catch (error) {
          console.error('Error fetching locations:', error)
        } finally {
          setLoadingLocations(false)
        }
      }
      fetchLocationsData()
    } else {
      setSelectedLocationId('')
      setSelectedLocationName('')
    }
  }, [showAddAssetModal, user, setLocations, setLoadingLocations, setSelectedLocationId, setSelectedLocationName])

  // Fetch assets on component mount and when filters change
  useEffect(() => {
    fetchAssets()
  }, [selectedMobility, fetchAssets])

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAssets()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, selectedMobility, fetchAssets])
}

