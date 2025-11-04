"use client"

import React from 'react'
import { Building, Package, ArrowDown, Download, X } from 'lucide-react'
import { AssetData } from '@/lib/adminasset'
import { getAssetClassification } from '../../utils/asset-helpers'
import { generatePDF } from '../../utils/pdf-generator'

interface FlowchartModalProps {
  isOpen: boolean
  onClose: () => void
  asset: AssetData | null
}

export const FlowchartModal: React.FC<FlowchartModalProps> = ({ isOpen, onClose, asset }) => {
  if (!isOpen || !asset) return null

  const assetClassification = getAssetClassification(asset)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Asset Classification Flowchart
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {asset.tagId} - {asset.brand} {asset.model}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => await generatePDF(asset)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="Download PDF Report"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {asset.assetType} Asset Flow
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {asset.tagId} - {asset.brand} {asset.model}
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-6">
                <div className="bg-blue-500 text-white rounded-lg p-4 inline-block shadow-lg">
                  <Building className="w-6 h-6 mx-auto mb-2" />
                  <h4 className="text-lg font-bold">{asset.assetType}</h4>
                  <p className="text-sm opacity-90">Main Asset</p>
                </div>
              </div>

              <div className="text-center mb-6">
                <ArrowDown className="w-6 h-6 text-gray-400 mx-auto" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="text-center mb-4">
                    <div className="bg-green-500 text-white rounded-lg p-3 inline-block">
                      <Package className="w-5 h-5 mx-auto mb-1" />
                      <h4 className="font-bold">Movable</h4>
                      <p className="text-xs">{assetClassification.movable.length} items</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {assetClassification.movable.map((item, index) => (
                      <div key={index} className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-green-200 dark:border-green-700">
                        <h5 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
                          {index + 1}. {item.assetName}
                        </h5>
                        <div className="text-xs text-blue-600 dark:text-blue-400 mb-2 font-mono">
                          Tag ID: {item.tagId || 'No Tag ID'}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{item.description}</p>
                        
                        <div className="space-y-1">
                          {item.inventory.consumables.length > 0 && (
                            <div className="text-xs">
                              <span className="font-medium text-orange-600">Consumables:</span>
                              <span className="ml-1 text-gray-600 dark:text-gray-400">
                                {item.inventory.consumables.map(consumable =>
                                  typeof consumable === 'string' ? consumable : consumable.itemName
                                ).join(', ')}
                              </span>
                            </div>
                          )}
                          {item.inventory.spareParts.length > 0 && (
                            <div className="text-xs">
                              <span className="font-medium text-blue-600">Spare Parts:</span>
                              <span className="ml-1 text-gray-600 dark:text-gray-400">
                                {item.inventory.spareParts.map(part =>
                                  typeof part === 'string' ? part : part.itemName
                                ).join(', ')}
                              </span>
                            </div>
                          )}
                          {item.inventory.tools.length > 0 && (
                            <div className="text-xs">
                              <span className="font-medium text-green-600">Tools:</span>
                              <span className="ml-1 text-gray-600 dark:text-gray-400">
                                {item.inventory.tools.map(tool =>
                                  typeof tool === 'string' ? tool : tool.itemName
                                ).join(', ')}
                              </span>
                            </div>
                          )}
                          {item.inventory.operationalSupply.length > 0 && (
                            <div className="text-xs">
                              <span className="font-medium text-purple-600">Operational Supply:</span>
                              <span className="ml-1 text-gray-600 dark:text-gray-400">
                                {item.inventory.operationalSupply.map(supply =>
                                  typeof supply === 'string' ? supply : supply.itemName
                                ).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="text-center mb-4">
                    <div className="bg-blue-500 text-white rounded-lg p-3 inline-block">
                      <Building className="w-5 h-5 mx-auto mb-1" />
                      <h4 className="font-bold">Immovable</h4>
                      <p className="text-xs">{assetClassification.immovable.length} items</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {assetClassification.immovable.map((item, index) => (
                      <div key={index} className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                        <h5 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
                          {index + 1}. {item.assetName}
                        </h5>
                        <div className="text-xs text-blue-600 dark:text-blue-400 mb-2 font-mono">
                          Tag ID: {item.tagId || 'No Tag ID'}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{item.description}</p>
                        
                        <div className="space-y-1">
                          {item.inventory.consumables.length > 0 && (
                            <div className="text-xs">
                              <span className="font-medium text-orange-600">Consumables:</span>
                              <span className="ml-1 text-gray-600 dark:text-gray-400">
                                {item.inventory.consumables.map(consumable =>
                                  typeof consumable === 'string' ? consumable : consumable.itemName
                                ).join(', ')}
                              </span>
                            </div>
                          )}
                          {item.inventory.spareParts.length > 0 && (
                            <div className="text-xs">
                              <span className="font-medium text-blue-600">Spare Parts:</span>
                              <span className="ml-1 text-gray-600 dark:text-gray-400">
                                {item.inventory.spareParts.map(part =>
                                  typeof part === 'string' ? part : part.itemName
                                ).join(', ')}
                              </span>
                            </div>
                          )}
                          {item.inventory.tools.length > 0 && (
                            <div className="text-xs">
                              <span className="font-medium text-green-600">Tools:</span>
                              <span className="ml-1 text-gray-600 dark:text-gray-400">
                                {item.inventory.tools.map(tool =>
                                  typeof tool === 'string' ? tool : tool.itemName
                                ).join(', ')}
                              </span>
                            </div>
                          )}
                          {item.inventory.operationalSupply.length > 0 && (
                            <div className="text-xs">
                              <span className="font-medium text-purple-600">Operational Supply:</span>
                              <span className="ml-1 text-gray-600 dark:text-gray-400">
                                {item.inventory.operationalSupply.map(supply =>
                                  typeof supply === 'string' ? supply : supply.itemName
                                ).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-center mt-6">
                <div className="bg-gray-600 text-white rounded-lg p-4 inline-block">
                  <h3 className="text-lg font-bold">
                    Total: {assetClassification.movable.length + assetClassification.immovable.length} Components
                  </h3>
                  <div className="flex gap-4 text-sm mt-2">
                    <span>🟢 Movable: {assetClassification.movable.length}</span>
                    <span>🔵 Immovable: {assetClassification.immovable.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

