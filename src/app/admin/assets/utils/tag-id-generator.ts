/**
 * Tag ID Generation Utilities
 */

/**
 * Generate asset ID based on location type and asset type code
 */
export const generateAssetId = (
  user: { projectName?: string; name?: string } | null,
  locationType: string,
  assetTypeCode: string
): string => {
  if (!user?.projectName || !locationType || !assetTypeCode) return ''
  
  // Extract city code from project address (assuming Bangalore for now)
  const cityCode = 'BLR' // Can be made dynamic based on project address
  
  // Extract project abbreviation (first 4 characters)
  const projectAbbr = user.projectName.substring(0, 4).toUpperCase()
  
  // Extract user name abbreviation (first 2 characters)
  const userAbbr = user.name ? user.name.substring(0, 2).toUpperCase() : 'US'
  
  // Location type abbreviation - handle spaces and take meaningful parts
  const locationWords = locationType.trim().split(' ')
  const locationAbbr = locationWords.length > 1 
    ? locationWords.map(word => word.charAt(0)).join('').toUpperCase()
    : locationType.substring(0, 2).toUpperCase()
  
  // Asset type code - handle spaces and take meaningful parts
  const assetWords = assetTypeCode.trim().split(' ')
  const assetAbbr = assetWords.length > 1 
    ? assetWords.map(word => word.charAt(0)).join('').toUpperCase()
    : assetTypeCode.substring(0, 2).toUpperCase()
  
  return `${cityCode}/${projectAbbr}/${userAbbr}/${locationAbbr}/${assetAbbr}`
}

/**
 * Generate sub-asset tag ID
 */
export const generateSubAssetTagId = (
  mainAssetId: string,
  subAssetName: string,
  category: 'Movable' | 'Immovable',
  index: number
): string => {
  if (!mainAssetId || !subAssetName) return ''
  
  // Generate abbreviation from sub-asset name
  const subAssetWords = subAssetName.trim().split(' ')
  const subAssetAbbr = subAssetWords.length > 1 
    ? subAssetWords.map(word => word.charAt(0)).join('').toUpperCase()
    : subAssetName.substring(0, 2).toUpperCase()
  
  // Generate sequential number (01, 02, 03, etc.)
  const sequentialNumber = String(index + 1).padStart(2, '0')
  
  return `${mainAssetId}-${subAssetAbbr}${sequentialNumber}`
}

/**
 * Generate inventory item tag ID
 */
export const generateInventoryItemTagId = (
  mainAssetId: string,
  inventoryType: string,
  itemName: string,
  itemIndex: number
): string => {
  if (!mainAssetId) return ''
  
  // Generate abbreviation from inventory type
  const typeWords = inventoryType.trim().split(/(?=[A-Z])/)
  const typeAbbr = typeWords.length > 1 
    ? typeWords.map(word => word.charAt(0)).join('').toUpperCase().substring(0, 3)
    : inventoryType.substring(0, 3).toUpperCase()
  
  // Generate abbreviation from item name if available
  let itemNameAbbr = ''
  if (itemName && itemName.trim()) {
    const nameWords = itemName.trim().split(' ')
    if (nameWords.length > 1) {
      itemNameAbbr = nameWords.map(word => word.charAt(0)).join('').toUpperCase().substring(0, 4)
    } else {
      itemNameAbbr = itemName.trim().substring(0, 4).toUpperCase()
    }
  } else {
    // Fallback to sequential number if no name provided
    itemNameAbbr = String(itemIndex + 1).padStart(3, '0')
  }
  
  return `${mainAssetId}-INV-${typeAbbr}-${itemNameAbbr}`
}

