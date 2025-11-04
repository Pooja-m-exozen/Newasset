"use client"

import React, { useState } from 'react'
import { Building, Package, X, Activity, Clock, Download } from 'lucide-react'
import { AssetData, ScanHistory } from '@/lib/adminasset'
import { ApiSubAsset } from '../../types'
import { generateHistoryCardPDF } from '../../utils/pdf-generator'

interface SubAssetDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  subAsset: ApiSubAsset | null
  onOpenPOModal: (asset: AssetData, subAsset?: { subAssetIndex: number; category: 'movable' | 'immovable' }) => void
  onOpenReplacementModal: (asset: AssetData, subAsset?: { subAssetIndex: number; category: 'movable' | 'immovable' }) => void
  onOpenLifecycleModal: (asset: AssetData, subAsset?: { subAssetIndex: number; category: 'movable' | 'immovable' }) => void
  onQRCodeClick: (qrData: { url: string; data: Record<string, unknown>; generatedAt: string }) => void
  onInventoryClick: (assetId: string, classificationIndex: number, inventoryType: 'consumables' | 'spareParts' | 'tools') => void
}

export const SubAssetDetailsModal: React.FC<SubAssetDetailsModalProps> = ({
  isOpen,
  onClose,
  subAsset,
  onOpenPOModal,
  onOpenReplacementModal,
  onOpenLifecycleModal,
  onQRCodeClick,
  onInventoryClick
}) => {
  const [expandedInventorySection, setExpandedInventorySection] = useState<'consumables' | 'spareParts' | 'tools' | null>(null)

  if (!isOpen || !subAsset) return null

  const handleClose = () => {
    setExpandedInventorySection(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] sm:max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 p-3 sm:p-4 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="p-1.5 sm:p-2 rounded-lg bg-white dark:bg-gray-700 shadow-sm flex-shrink-0">
                {subAsset.category === 'Movable' ? (
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                ) : (
                  <Building className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                    {subAsset.assetName}
                  </h2>
                  {subAsset.tagId && (
                    <span className="px-2 py-1 rounded text-xs font-mono font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600">
                      #{subAsset.tagId}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    subAsset.category === 'Movable' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                  }`}>
                    {subAsset.category}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Asset Details
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="group p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0 border border-gray-200 dark:border-gray-600"
            >
              <X className="w-5 h-5 text-gray-600 group-hover:text-gray-800 dark:text-gray-400 dark:group-hover:text-gray-200" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-white dark:bg-gray-800 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
          {/* Parent Asset Information */}
          {subAsset.parentAsset && (() => {
            const parentFields = [
              { label: 'Parent Asset ID', value: subAsset.parentAsset.tagId },
              { label: 'Asset Type', value: subAsset.parentAsset.assetType },
              { label: 'Brand', value: subAsset.parentAsset.brand },
              { label: 'Model', value: subAsset.parentAsset.model }
            ].filter(field => {
              if (!field.value) return false;
              const value = String(field.value).toUpperCase().trim();
              return value !== 'NA' && value !== 'N/A' && value !== '';
            });
            
            if (parentFields.length === 0) return null;
            
            return (
              <div className="mb-6">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                      <Building className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Parent Asset Details
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {parentFields.map((field, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1">{field.label}</label>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{field.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Basic Information */}
          <div className="mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Basic Information
                </h3>
              </div>
              {(() => {
                const basicFields = [
                  { label: 'Asset Name', value: subAsset.assetName },
                  { label: 'Tag ID', value: subAsset.tagId },
                  { label: 'Brand', value: subAsset.brand },
                  { label: 'Model', value: subAsset.model },
                  { label: 'Location', value: subAsset.location },
                  { label: 'Category', value: subAsset.category }
                ].filter(field => {
                  if (!field.value) return false;
                  const value = String(field.value).toUpperCase().trim();
                  return value !== 'NA' && value !== 'N/A' && value !== '';
                });
                
                return (
                  <div className="space-y-3">
                    {basicFields.map((field, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1">{field.label}</label>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{field.value}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Quick Actions & Inventory */}
          <div className="mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Quick Actions & Inventory
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* Left Column - Actions */}
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      if (!subAsset.parentAsset) return;
                      const parentAsset = subAsset.parentAsset as AssetData;
                      const category = subAsset.category === 'Movable' ? 'movable' : 'immovable';
                      const subAssetsArray = category === 'movable' ? parentAsset.subAssets?.movable : parentAsset.subAssets?.immovable;
                      const index = subAssetsArray?.findIndex(sa => 
                        sa.assetName === subAsset.assetName &&
                        sa.brand === subAsset.brand &&
                        sa.model === subAsset.model
                      ) ?? -1;
                      if (index >= 0) {
                        onOpenPOModal(parentAsset, { subAssetIndex: index, category });
                      } else {
                        onOpenPOModal(parentAsset);
                      }
                    }}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20"
                    disabled={!subAsset.parentAsset}
                  >
                    <div className="w-4 h-4 border-2 border-blue-600 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Purchase Order
                    </span>
                  </button>
                  
                  <button
                    onClick={() => {
                      if (!subAsset.parentAsset) return;
                      const parentAsset = subAsset.parentAsset as AssetData;
                      const category = subAsset.category === 'Movable' ? 'movable' : 'immovable';
                      const subAssetsArray = category === 'movable' ? parentAsset.subAssets?.movable : parentAsset.subAssets?.immovable;
                      const index = subAssetsArray?.findIndex(sa => 
                        sa.assetName === subAsset.assetName &&
                        sa.brand === subAsset.brand &&
                        sa.model === subAsset.model
                      ) ?? -1;
                      if (index >= 0) {
                        onOpenReplacementModal(parentAsset, { subAssetIndex: index, category });
                      } else {
                        onOpenReplacementModal(parentAsset);
                      }
                    }}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20"
                    disabled={!subAsset.parentAsset}
                  >
                    <div className="w-4 h-4 border-2 border-orange-600 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Replacement
                    </span>
                  </button>
                  
                  <button
                    onClick={() => {
                      if (!subAsset.parentAsset) return;
                      const parentAsset = subAsset.parentAsset as AssetData;
                      const category = subAsset.category === 'Movable' ? 'movable' : 'immovable';
                      const subAssetsArray = category === 'movable' ? parentAsset.subAssets?.movable : parentAsset.subAssets?.immovable;
                      const index = subAssetsArray?.findIndex(sa => 
                        sa.assetName === subAsset.assetName &&
                        sa.brand === subAsset.brand &&
                        sa.model === subAsset.model
                      ) ?? -1;
                      if (index >= 0) {
                        onOpenLifecycleModal(parentAsset, { subAssetIndex: index, category });
                      } else {
                        onOpenLifecycleModal(parentAsset);
                      }
                    }}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
                    disabled={!subAsset.parentAsset}
                  >
                    <div className="w-4 h-4 border-2 border-green-600 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Lifecycle
                    </span>
                  </button>
                  
                  {subAsset.digitalAssets?.qrCode && (
                    <button
                      onClick={() => onQRCodeClick(subAsset.digitalAssets!.qrCode!)}
                      className="w-full text-left px-3 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                    >
                      View QR Code
                    </button>
                  )}
                </div>
                
                {/* Right Column - Inventory Management */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-600 p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700">
                      <Package className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </div>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                      Inventory
                    </h4>
                  </div>
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        setExpandedInventorySection(expandedInventorySection === 'consumables' ? null : 'consumables');
                        if (subAsset.parentAsset?._id) {
                          onInventoryClick(subAsset.parentAsset._id, 0, 'consumables');
                        }
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        expandedInventorySection === 'consumables'
                          ? 'bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-300 dark:border-orange-700'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-orange-200 dark:border-orange-800'
                      }`}
                    >
                      <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                        Consumables
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setExpandedInventorySection(expandedInventorySection === 'spareParts' ? null : 'spareParts');
                        if (subAsset.parentAsset?._id) {
                          onInventoryClick(subAsset.parentAsset._id, 0, 'spareParts');
                        }
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        expandedInventorySection === 'spareParts'
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        Spare Parts
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setExpandedInventorySection(expandedInventorySection === 'tools' ? null : 'tools');
                        if (subAsset.parentAsset?._id) {
                          onInventoryClick(subAsset.parentAsset._id, 0, 'tools');
                        }
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        expandedInventorySection === 'tools'
                          ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-green-200 dark:border-green-800'
                      }`}
                    >
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        Tools
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* History Card Section */}
          <div className="mb-6">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Asset History
                  </h3>
                </div>
                {subAsset.parentAsset && (
                  <button
                    onClick={() => generateHistoryCardPDF(subAsset.parentAsset as AssetData, subAsset)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
                    title="Download History Card"
                  >
                    <Download className="w-4 h-4" />
                    Download History
                  </button>
                )}
              </div>
              {subAsset.parentAsset && (() => {
                const parentAsset = subAsset.parentAsset as any
                const scanHistory: ScanHistory[] = parentAsset.scanHistory || []
                const historyToShow = scanHistory.slice().reverse().slice(0, 10)
                
                if (historyToShow.length === 0) {
                  return (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border-2 border-dashed border-gray-300 dark:border-gray-600">
                      <div className="text-center">
                        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          No scan history available
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          History will appear here once the asset is scanned
                        </p>
                      </div>
                    </div>
                  )
                }
                
                return (
                  <div className="space-y-3">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-600 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-purple-50 dark:bg-purple-900/20">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-purple-800 dark:text-purple-300 border-b border-purple-200 dark:border-purple-700">
                                #
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-purple-800 dark:text-purple-300 border-b border-purple-200 dark:border-purple-700">
                                Date & Time
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-purple-800 dark:text-purple-300 border-b border-purple-200 dark:border-purple-700">
                                Scanned By
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-purple-800 dark:text-purple-300 border-b border-purple-200 dark:border-purple-700">
                                Scan Type
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-purple-800 dark:text-purple-300 border-b border-purple-200 dark:border-purple-700">
                                Location
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-purple-800 dark:text-purple-300 border-b border-purple-200 dark:border-purple-700">
                                Notes
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {historyToShow.map((entry, index) => {
                              const historyEntry = entry as ScanHistory
                              return (
                                <tr key={historyEntry._id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                  <td className="px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                                    {historyToShow.length - index}
                                  </td>
                                  <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        {new Date(historyEntry.scannedAt).toLocaleDateString('en-US', {
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric'
                                        })}
                                      </span>
                                      <span className="text-xs text-gray-500 dark:text-gray-500">
                                        {new Date(historyEntry.scannedAt).toLocaleTimeString('en-US', {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                                    {historyEntry.scannedBy || 'Unknown'}
                                  </td>
                                  <td className="px-3 py-2 text-xs">
                                    <span className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
                                      {historyEntry.scanType || 'N/A'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                                    {historyEntry.location ? (
                                      <div className="flex flex-col">
                                        <span>Lat: {historyEntry.location.latitude}</span>
                                        <span>Lng: {historyEntry.location.longitude}</span>
                                      </div>
                                    ) : (
                                      <span className="text-gray-400">N/A</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                                    {historyEntry.notes ? (
                                      <span className="truncate max-w-[150px] block" title={historyEntry.notes}>
                                        {historyEntry.notes}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                      {scanHistory.length > 10 && (
                        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600 text-center">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Showing last 10 of {scanHistory.length} entries. Download full history card for complete details.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

