import React from 'react'
import Image from 'next/image'
import { Building, Package, Eye, Archive, MapPin } from 'lucide-react'
import { AssetData } from '@/lib/adminasset'
import { ApiSubAsset } from '../types'
import { getAssetClassification } from '../utils/asset-helpers'

interface AssetTablesProps {
  selectedMobility: 'all' | 'movable' | 'immovable' | 'inventory' | 'far'
  filteredAssets: AssetData[]
  searchTerm: string
  expandedRow: string | null
  expandedClassificationType: 'movable' | 'immovable' | null
  selectedInventoryType: {[key: string]: 'consumables' | 'spareParts' | 'tools' | null}
  onViewSubAssetDetails: (subAsset: ApiSubAsset) => void
  onQRCodeClick: (qrData: { url: string; data: Record<string, unknown>; generatedAt: string }) => void
  onMovableClick: (asset: AssetData) => void
  onImmovableClick: (asset: AssetData) => void
  onViewFlowchart: (asset: AssetData) => void
  onInventoryClick: (assetId: string, classificationIndex: number, inventoryType: 'consumables' | 'spareParts' | 'tools') => void
  onOpenPOModal: (asset: AssetData, subAsset?: { subAssetIndex: number; category: 'movable' | 'immovable' }) => void
  onOpenReplacementModal: (asset: AssetData, subAsset?: { subAssetIndex: number; category: 'movable' | 'immovable' }) => void
  onOpenLifecycleModal: (asset: AssetData, subAsset?: { subAssetIndex: number; category: 'movable' | 'immovable' }) => void
}

export const AssetTables: React.FC<AssetTablesProps> = ({
  selectedMobility,
  filteredAssets,
  searchTerm,
  expandedRow,
  expandedClassificationType,
  selectedInventoryType,
  onViewSubAssetDetails,
  onQRCodeClick,
  onMovableClick,
  onImmovableClick,
  onViewFlowchart,
  onInventoryClick,
  onOpenPOModal,
  onOpenReplacementModal,
  onOpenLifecycleModal
}) => {
  // Assets Classification Table
  if (selectedMobility === 'inventory' || selectedMobility === 'all' || selectedMobility === 'movable' || selectedMobility === 'immovable') {
    const allSubAssets = filteredAssets.flatMap((asset) => {
      const subAssets = []
      
      if (selectedMobility === 'movable' || selectedMobility === 'all' || selectedMobility === 'inventory') {
        const movableSubAssets = (asset.subAssets?.movable || []).map(subAsset => ({
          ...subAsset,
          parentAsset: asset,
          category: 'Movable'
        }))
        subAssets.push(...movableSubAssets)
      }
      
      if (selectedMobility === 'immovable' || selectedMobility === 'all' || selectedMobility === 'inventory') {
        const immovableSubAssets = (asset.subAssets?.immovable || []).map(subAsset => ({
          ...subAsset,
          parentAsset: asset,
          category: 'Immovable'
        }))
        subAssets.push(...immovableSubAssets)
      }
      
      return subAssets
    })
    
    const searchTermLower = searchTerm.toLowerCase().trim()
    const filteredSubAssets = allSubAssets.filter(subAsset => {
      if (!searchTermLower) return true
      
      const assetName = (subAsset.assetName || '').toLowerCase()
      const brand = (subAsset.brand || '').toLowerCase()
      const model = (subAsset.model || '').toLowerCase()
      const location = (subAsset.location || '').toLowerCase()
      const tagId = (subAsset.tagId || '').toLowerCase()
      const category = (subAsset.category || '').toLowerCase()
      
      return assetName.includes(searchTermLower) ||
             brand.includes(searchTermLower) ||
             model.includes(searchTermLower) ||
             location.includes(searchTermLower) ||
             tagId.includes(searchTermLower) ||
             category.includes(searchTermLower)
    })
    
    return (
      <div className="mt-6 bg-background rounded-lg shadow-lg overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-blue-50 dark:bg-slate-800 border-b border-border">
                <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                  SI Number
                </th>
                <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                  Tag ID
                </th>
                <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                  Asset Name / Type
                </th>
                <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                  Parent Asset
                </th>
                <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                  Parent Asset Tag ID
                </th>
                <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                  Location
                </th>
                <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                  QR Code
                </th>
                <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                  Details
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSubAssets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="border border-border px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="w-8 h-8 text-gray-400" />
                      <p>{searchTerm ? 'No matching sub-assets found' : 'No sub-assets found'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSubAssets.map((subAsset, index) => (
                  <tr key={`${subAsset.parentAsset._id}-${index}`} className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                    <td className="border border-border px-4 py-3">
                      <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                        {index + 1}
                      </span>
                    </td>
                    <td className="border border-border px-4 py-3">
                      <span className="text-sm font-mono text-blue-700 dark:text-blue-300">
                        {subAsset.tagId || 'N/A'}
                      </span>
                    </td>
                    <td className="border border-border px-4 py-3">
                      <div className="flex items-center space-x-2">
                        {subAsset.category === 'Movable' ? (
                          <Package className="w-4 h-4 text-green-600" />
                        ) : (
                          <Building className="w-4 h-4 text-blue-600" />
                        )}
                        <span className="font-medium text-blue-800 dark:text-blue-200">
                          {subAsset.assetName}
                        </span>
                      </div>
                    </td>
                    <td className="border border-border px-4 py-3">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {subAsset.parentAsset?.assetType || 'N/A'}
                      </span>
                    </td>
                    <td className="border border-border px-4 py-3">
                      <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                        {subAsset.parentAsset?.tagId || 'N/A'}
                      </span>
                    </td>
                    <td className="border border-border px-4 py-3">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {subAsset.location}
                      </div>
                    </td>
                    <td className="border border-border px-4 py-3">
                      {subAsset.digitalAssets?.qrCode ? (
                        <button
                          onClick={() => onQRCodeClick(subAsset.digitalAssets!.qrCode!)}
                          className="flex items-center justify-center p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors cursor-pointer group"
                          title="Click to view QR Code"
                        >
                          <Image
                            src={subAsset.digitalAssets.qrCode.url.startsWith('http') ? subAsset.digitalAssets.qrCode.url : `https://digitalasset.zenapi.co.in${subAsset.digitalAssets.qrCode.url}`}
                            alt="QR Code"
                            width={50}
                            height={50}
                            className="border border-gray-200 dark:border-gray-600 rounded-md shadow-sm group-hover:shadow-md transition-shadow"
                            style={{ objectFit: 'contain' }}
                            onError={(e) => {
                              console.error('QR Code image failed to load:', subAsset.digitalAssets?.qrCode?.url)
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        </button>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="border border-border px-4 py-3">
                      <button
                        onClick={() => onViewSubAssetDetails(subAsset as ApiSubAsset)}
                        className="group relative px-4 py-2.5 text-sm font-medium rounded-lg bg-purple-50 dark:bg-purple-900/10 border-2 border-purple-300 dark:border-purple-600 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                      >
                        <Eye className="w-4 h-4 relative z-10" />
                        <span className="relative z-10">View Details</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // FAR Table View
  if (selectedMobility === 'far') {
    const searchTermLower = searchTerm.toLowerCase().trim()
    const farFilteredAssets = searchTermLower 
      ? filteredAssets.filter(asset => {
          const tagId = (asset.tagId || '').toLowerCase()
          const assetType = (asset.assetType || '').toLowerCase()
          const subcategory = (asset.subcategory || '').toLowerCase()
          const brand = (asset.brand || '').toLowerCase()
          const model = (asset.model || '').toLowerCase()
          
          return tagId.includes(searchTermLower) ||
                 assetType.includes(searchTermLower) ||
                 subcategory.includes(searchTermLower) ||
                 brand.includes(searchTermLower) ||
                 model.includes(searchTermLower)
        })
      : filteredAssets
    
    return (
      <div className="mt-6 bg-background rounded-lg shadow-lg overflow-hidden border border-border">
        <div className="p-4 border-b border-border bg-blue-50 dark:bg-slate-800">
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            FAR - Fixed Asset Register
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-sans text-base table-fixed min-w-[1200px] xl:min-w-[1400px]" style={{width: '100%', tableLayout: 'fixed'}}>
            <thead>
              <tr className="bg-blue-50 dark:bg-slate-800 border-b border-border">
                <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm" style={{width: '10%'}}>
                  ASSET ID
                </th>
                <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm" style={{width: '18%'}}>
                  TYPE & SUBCATEGORY
                </th>
                <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm" style={{width: '12%'}}>
                  BRAND & MODEL
                </th>
                <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm" style={{width: '8%'}}>
                  CAPACITY
                </th>
                <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm" style={{width: '8%'}}>
                  STATUS
                </th>
                <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm" style={{width: '20%'}}>
                  LOCATION
                </th>
                <th className="border border-border px-2 py-3 text-center font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm" style={{width: '12%'}}>
                  <div className="flex flex-col items-center gap-1">
                    <span>PURCHASE DETAILS</span>
                    <div className="text-xs font-normal text-blue-600 dark:text-blue-300">
                      PO, Replace, Lifecycle
                    </div>
                  </div>
                </th>
                <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm" style={{width: '12%'}}>
                  <div className="flex flex-col items-center gap-1">
                    <span>ACTIONS</span>
                    <div className="text-xs font-normal text-blue-600 dark:text-blue-300">
                      Classification & View
                    </div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {farFilteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="border border-border px-4 py-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="w-8 h-8 text-gray-400" />
                      <p>{searchTerm ? 'No matching assets found' : 'No assets found'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                farFilteredAssets.map((asset) => {
                  const isExpanded = expandedRow === asset._id
                  const assetClassification = isExpanded ? getAssetClassification(asset) : null
                 
                  return (
                    <React.Fragment key={asset._id}>
                      <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        <td className="border border-border px-2 sm:px-4 py-2 sm:py-3" style={{width: '10%'}}>
                          <span className="text-xs sm:text-sm font-medium text-blue-800 dark:text-blue-200">
                            {asset.tagId}
                          </span>
                        </td>
                        <td className="border border-border px-2 sm:px-4 py-2 sm:py-3" style={{width: '18%'}}>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="p-1 sm:p-2 bg-blue-50 rounded-lg">
                              {asset.mobilityCategory === 'Movable' ? (
                                <Package className="w-3 h-3 sm:w-5 sm:h-5 text-blue-800" />
                              ) : (
                                <Building className="w-3 h-3 sm:w-5 sm:h-5 text-blue-800" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs sm:text-sm font-medium text-blue-800 truncate">
                                {asset.assetType}
                              </div>
                              <div className="text-xs text-blue-600 truncate">
                                {asset.subcategory || 'No subcategory'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="border border-border px-2 sm:px-4 py-2 sm:py-3" style={{width: '12%'}}>
                          <div className="text-xs sm:text-sm text-blue-800 break-words leading-tight">
                            <div className="font-medium">{asset.brand || 'N/A'}</div>
                            <div className="text-blue-600">{asset.model || 'No model'}</div>
                          </div>
                        </td>
                        <td className="border border-border px-2 sm:px-4 py-2 sm:py-3" style={{width: '8%'}}>
                          <span className="text-xs sm:text-sm text-blue-800">
                            {asset.capacity || 'N/A'}
                          </span>
                        </td>
                        <td className="border border-border px-2 sm:px-4 py-2 sm:py-3" style={{width: '8%'}}>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            asset.status === 'Active' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                              : asset.status === 'Inactive'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                          }`}>
                            {asset.status || 'Active'}
                          </span>
                        </td>
                        <td className="border border-border px-2 sm:px-4 py-2 sm:py-3" style={{width: '20%'}}>
                          <div className="text-xs sm:text-sm text-blue-800 break-words leading-tight">
                            {asset.location?.building && asset.location?.floor && asset.location?.room
                              ? `${asset.location.building}, ${asset.location.floor}, ${asset.location.room}`
                              : 'Location not set'
                            }
                          </div>
                        </td>
                        <td className="border border-border px-2 py-3" style={{width: '12%'}}>
                          <div className="flex flex-col items-center gap-1">
                            <button
                              onClick={() => onOpenPOModal(asset)}
                              className="px-1.5 py-1 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:shadow-sm whitespace-nowrap w-full justify-center"
                              title="Link Purchase Order"
                            >
                              <span>PO</span>
                            </button>
                            <button
                              onClick={() => onOpenReplacementModal(asset)}
                              className="px-1.5 py-1 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1 text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 hover:shadow-sm whitespace-nowrap w-full justify-center"
                              title="Record Replacement"
                            >
                              <span>Replace</span>
                            </button>
                            <button
                              onClick={() => onOpenLifecycleModal(asset)}
                              className="px-1.5 py-1 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1 text-green-600 bg-green-50 hover:bg-green-100 border border-green-200 hover:shadow-sm whitespace-nowrap w-full justify-center"
                              title="Update Lifecycle Status"
                            >
                              <span>Lifecycle</span>
                            </button>
                          </div>
                        </td>
                        <td className="border border-border px-2 py-3" style={{width: '12%'}}>
                          <div className="flex flex-col items-center gap-1">
                            <button
                              onClick={() => onMovableClick(asset)}
                              className={`px-1.5 py-1 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1 ${
                                isExpanded && expandedClassificationType === 'movable'
                                  ? 'text-white bg-green-600 hover:bg-green-700 shadow-md transform scale-105'
                                  : 'text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 hover:shadow-sm'
                              } whitespace-nowrap w-full justify-center`}
                              title="View Movable Assets"
                            >
                              <Package className="w-3 h-3" />
                              Movable
                            </button>
                            <button
                              onClick={() => onImmovableClick(asset)}
                              className={`px-1.5 py-1 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1 ${
                                isExpanded && expandedClassificationType === 'immovable'
                                  ? 'text-white bg-blue-600 hover:bg-blue-700 shadow-md transform scale-105'
                                  : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:shadow-sm'
                              } whitespace-nowrap w-full justify-center`}
                              title="View Immovable Assets"
                            >
                              <Building className="w-3 h-3" />
                              Immovable
                            </button>
                            <button
                              onClick={() => onViewFlowchart(asset)}
                              className="px-1.5 py-1 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1 text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 hover:shadow-sm whitespace-nowrap w-full justify-center"
                              title="View Asset Classification Flowchart"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {isExpanded && assetClassification && (
                        <tr>
                          <td colSpan={8} className="border border-border p-0 bg-gray-50 dark:bg-gray-800">
                            <div className="p-4">
                              <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">
                                {expandedClassificationType === 'movable' ? 'Movable' : 'Immovable'} Assets Classification
                              </h4>
                              <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                  <thead>
                                    <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                      <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                                        Asset Name
                                      </th>
                                      <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                                        Tag ID
                                      </th>
                                      <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                                        Brand
                                      </th>
                                      <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                                        Model
                                      </th>
                                      <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                                        Capacity
                                      </th>
                                      <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                                        Location
                                      </th>
                                      <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                                        Actions
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(expandedClassificationType === 'movable' ? assetClassification.movable : assetClassification.immovable).map((classificationAsset, index) => (
                                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">
                                          <div className="flex items-center gap-2">
                                            {expandedClassificationType === 'movable' ? (
                                              <Package className="w-4 h-4 text-green-600" />
                                            ) : (
                                              <Building className="w-4 h-4 text-blue-600" />
                                            )}
                                            <span className="font-medium text-blue-800 dark:text-blue-200">
                                              {classificationAsset.assetName}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">
                                          <span className="text-xs font-mono bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                                            {classificationAsset.tagId || 'No Tag ID'}
                                          </span>
                                        </td>
                                        <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                                          {classificationAsset.brand || 'N/A'}
                                        </td>
                                        <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                                          {classificationAsset.model || 'N/A'}
                                        </td>
                                        <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                                          {classificationAsset.capacity || 'N/A'}
                                        </td>
                                        <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                                          {classificationAsset.location || 'N/A'}
                                        </td>
                                        <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">
                                          <div className="flex gap-1">
                                            <button
                                              onClick={() => asset._id && onInventoryClick(asset._id, index, 'consumables')}
                                              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                                                selectedInventoryType[`${asset._id}-${index}`] === 'consumables'
                                                  ? 'text-white bg-orange-600 hover:bg-orange-700 shadow-sm'
                                                  : 'text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200'
                                              } whitespace-nowrap`}
                                              title="View Consumables"
                                            >
                                              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                              Consumables
                                            </button>
                                            <button
                                              onClick={() => asset._id && onInventoryClick(asset._id, index, 'spareParts')}
                                              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                                                selectedInventoryType[`${asset._id}-${index}`] === 'spareParts'
                                                  ? 'text-white bg-blue-600 hover:bg-blue-700 shadow-sm'
                                                  : 'text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200'
                                              } whitespace-nowrap`}
                                              title="View Spare Parts"
                                            >
                                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                              Spare Parts
                                            </button>
                                            <button
                                              onClick={() => asset._id && onInventoryClick(asset._id, index, 'tools')}
                                              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                                                selectedInventoryType[`${asset._id}-${index}`] === 'tools'
                                                  ? 'text-white bg-green-600 hover:bg-green-700 shadow-sm'
                                                  : 'text-green-600 bg-green-50 hover:bg-green-100 border border-green-200'
                                              } whitespace-nowrap`}
                                              title="View Tools"
                                            >
                                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                              Tools
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return null
}

