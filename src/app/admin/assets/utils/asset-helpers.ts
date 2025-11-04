import { AssetData } from '@/lib/adminasset'
import { AssetClassification, AssetClassificationItem } from '../types'

/**
 * Get asset classification (movable/immovable) from asset data
 */
export const getAssetClassification = (asset: AssetData): AssetClassification => {
  // Use actual sub-assets from API response and transform them to include reason
  const movableAssets = (asset.subAssets?.movable || []).map(subAsset => {
    return {
      assetName: subAsset.assetName,
      description: subAsset.description || '',
      category: subAsset.category,
      brand: subAsset.brand,
      model: subAsset.model,
      capacity: subAsset.capacity,
      location: subAsset.location,
      inventory: subAsset.inventory,
      tagId: subAsset.tagId, // Include tag ID
      digitalTagType: subAsset.digitalTagType, // Include digital tag type
      digitalAssets: subAsset.digitalAssets as AssetClassificationItem['digitalAssets'], // Include digital assets
      hasDigitalAssets: subAsset.hasDigitalAssets, // Include digital assets flag
      reason: subAsset.category === 'Movable'
        ? 'Portable equipment that can be relocated as needed.'
        : 'Fixed installations that require specialized removal procedures.'
    };
  });
 
  const immovableAssets = (asset.subAssets?.immovable || []).map(subAsset => {
    return {
      assetName: subAsset.assetName,
      description: subAsset.description || '',
      category: subAsset.category,
      brand: subAsset.brand,
      model: subAsset.model,
      capacity: subAsset.capacity,
      location: subAsset.location,
      inventory: subAsset.inventory,
      tagId: subAsset.tagId, // Include tag ID
      digitalTagType: subAsset.digitalTagType, // Include digital tag type
      digitalAssets: subAsset.digitalAssets as AssetClassificationItem['digitalAssets'], // Include digital assets
      hasDigitalAssets: subAsset.hasDigitalAssets, // Include digital assets flag
      reason: subAsset.category === 'Immovable'
        ? 'Permanently installed infrastructure that cannot be moved without demolition.'
        : 'Fixed installations requiring specialized removal procedures.'
    };
  });

  return {
    movable: movableAssets,
    immovable: immovableAssets
  }
}

/**
 * Get filtered assets based on selected mobility filter
 */
export const getFilteredAssets = (
  assets: AssetData[],
  selectedMobility: 'all' | 'movable' | 'immovable' | 'inventory' | 'far'
): AssetData[] => {
  if (selectedMobility === 'movable') {
    // Filter assets that have movable sub-assets
    return assets.filter(asset => 
      asset.subAssets?.movable && asset.subAssets.movable.length > 0
    )
  } else if (selectedMobility === 'immovable') {
    // Filter assets that have immovable sub-assets
    return assets.filter(asset => 
      asset.subAssets?.immovable && asset.subAssets.immovable.length > 0
    )
  } else if (selectedMobility === 'inventory') {
    // For inventory, filter assets that have inventory items (consumables, spare parts, tools)
    return assets.filter(asset => {
      // Check if asset has any inventory items in movable or immovable sub-assets
      const hasMovableInventory = asset.subAssets?.movable?.some(subAsset => 
        subAsset.inventory && (
          subAsset.inventory.consumables?.length > 0 ||
          subAsset.inventory.spareParts?.length > 0 ||
          subAsset.inventory.tools?.length > 0
        )
      )
      const hasImmovableInventory = asset.subAssets?.immovable?.some(subAsset => 
        subAsset.inventory && (
          subAsset.inventory.consumables?.length > 0 ||
          subAsset.inventory.spareParts?.length > 0 ||
          subAsset.inventory.tools?.length > 0
        )
      )
      return hasMovableInventory || hasImmovableInventory
    })
  } else if (selectedMobility === 'all') {
    // For all, return all assets (will show classification table)
    return assets
  } else if (selectedMobility === 'far') {
    // For FAR, return all assets (will show hierarchical view)
    return assets
  } else {
    // For other cases, return all assets
    return assets
  }
}

