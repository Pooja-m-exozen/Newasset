import { MaintenanceLog } from '@/lib/Report'

/**
 * Fetch maintenance logs for a specific asset by tag ID
 */
export const fetchMaintenanceLogsForAsset = async (assetTagId: string): Promise<MaintenanceLog[]> => {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) return []
    
    const response = await fetch(`https://digitalasset.zenapi.co.in/api/maintenance`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })
    
    if (!response.ok) return []
    
    const data = await response.json()
    const maintenanceLogs = data.data || data.maintenanceLogs || data.logs || data || []
    
    // Filter logs by asset tag ID
    if (Array.isArray(maintenanceLogs)) {
      return maintenanceLogs.filter((log: MaintenanceLog | { asset?: string | { tagId?: string }; assetId?: string }) => {
        // Check if log has asset property (extended type)
        if ('asset' in log) {
          return log.asset === assetTagId || 
                 (typeof log.asset === 'object' && log.asset?.tagId === assetTagId)
        }
        // Check assetId for MaintenanceLog type
        return log.assetId === assetTagId
      })
    }
    
    return []
  } catch (error) {
    console.error('Error fetching maintenance logs:', error)
    return []
  }
}

