import React from 'react';
import { Asset, getStatusBadge } from '../../lib/Report';
import { 
  ArrowUpDown,
  Eye,
  Edit,
  Trash2,
  X,
  Package,
  Building,
  Copy,
  Download
} from 'lucide-react';
import { Button } from './button';
import { StatusBadge } from './status-badge';
import NextImage from 'next/image';

interface AssetTableProps {
  assets: Asset[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
  onViewDetails?: (asset: Asset) => void;
  selectedAsset?: Asset | null;
  copyToClipboard?: (text: string) => void;
  downloadFile?: (url: string, filename: string) => void;
}

export const AssetTable: React.FC<AssetTableProps> = ({
  assets,
  onSort,
  onViewDetails,
  selectedAsset,
  copyToClipboard,
  downloadFile
}) => {
  const handleSort = (field: string) => {
    onSort(field);
  };

  // Filter assets: show only selected when one is selected, otherwise show all
  const visibleAssets = selectedAsset 
    ? assets.filter(asset => asset._id === selectedAsset._id)
    : assets;

  return (
    <div className="overflow-x-auto bg-white">
      <table className="w-full border-collapse font-sans text-sm">
        <thead>
          <tr className="bg-white border-b border-blue-200">
            <th className="border border-blue-200 px-3 py-2 text-left font-semibold text-blue-900 bg-blue-50 text-xs">
              #
            </th>
            <th 
              className="border border-blue-200 px-3 py-2 text-left font-semibold text-blue-900 bg-blue-50 text-xs cursor-pointer hover:bg-blue-100 transition-colors"
              onClick={() => handleSort('tagId')}
            >
              <div className="flex items-center gap-1">
                <span>ASSET ID</span>
                <ArrowUpDown className="w-3 h-3" />
              </div>
            </th>
            <th 
              className="border border-blue-200 px-3 py-2 text-left font-semibold text-blue-900 bg-blue-50 text-xs cursor-pointer hover:bg-blue-100 transition-colors"
              onClick={() => handleSort('createdAt')}
            >
              <div className="flex items-center gap-1">
                <span>DATE</span>
                <ArrowUpDown className="w-3 h-3" />
              </div>
            </th>
            <th 
              className="border border-blue-200 px-3 py-2 text-left font-semibold text-blue-900 bg-blue-50 text-xs cursor-pointer hover:bg-blue-100 transition-colors"
              onClick={() => handleSort('assetType')}
            >
              <div className="flex items-center gap-1">
                <span>ASSET TYPE</span>
                <ArrowUpDown className="w-3 h-3" />
              </div>
            </th>
            <th 
              className="border border-blue-200 px-3 py-2 text-left font-semibold text-blue-900 bg-blue-50 text-xs cursor-pointer hover:bg-blue-100 transition-colors"
              onClick={() => handleSort('brand')}
            >
              <div className="flex items-center gap-1">
                <span>BRAND</span>
                <ArrowUpDown className="w-3 h-3" />
              </div>
            </th>
            <th 
              className="border border-blue-200 px-3 py-2 text-left font-semibold text-blue-900 bg-blue-50 text-xs cursor-pointer hover:bg-blue-100 transition-colors"
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center gap-1">
                <span>STATUS</span>
                <ArrowUpDown className="w-3 h-3" />
              </div>
            </th>
            <th className="border border-blue-200 px-3 py-2 text-center font-semibold text-blue-900 bg-blue-50 text-xs">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {visibleAssets.map((asset, index) => {
            const statusBadge = getStatusBadge(asset.status || 'active');
            const isSelected = selectedAsset && selectedAsset._id === asset._id;
            
            return (
              <React.Fragment key={asset._id}>
                <tr className={isSelected ? 'bg-blue-50' : 'hover:bg-gray-50 transition-colors'}>
                  <td className="border border-blue-200 px-3 py-2 text-xs font-medium text-gray-700">
                    {index + 1}
                  </td>
                  <td className="border border-blue-200 px-3 py-2">
                    <span className="text-xs font-medium text-blue-600 cursor-pointer hover:underline">
                      {asset.tagId}
                    </span>
                  </td>
                  <td className="border border-blue-200 px-3 py-2 text-xs text-gray-700">
                    {asset.createdAt ? new Date(asset.createdAt).toISOString().split('T')[0] : 'N/A'}
                  </td>
                  <td className="border border-blue-200 px-3 py-2 text-xs text-gray-700">
                    {asset.assetType || 'N/A'}
                  </td>
                  <td className="border border-blue-200 px-3 py-2 text-xs text-gray-700">
                    {asset.brand || 'N/A'}
                  </td>
                  <td className="border border-blue-200 px-3 py-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusBadge.className}`}>
                      {statusBadge.label}
                    </span>
                  </td>
                  <td className="border border-blue-200 px-3 py-2">
                    <div className="flex items-center gap-1 justify-center">
                      <button 
                        className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                          isSelected
                            ? 'text-white bg-blue-600 border border-blue-600 hover:bg-blue-700'
                            : 'text-blue-600 border border-blue-600 hover:bg-blue-50'
                        }`}
                        onClick={() => onViewDetails?.(asset)}
                        title="View Asset"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        className="w-8 h-8 flex items-center justify-center text-green-600 border border-green-600 rounded hover:bg-green-50 transition-colors"
                        onClick={() => onViewDetails?.(asset)}
                        title="Edit Asset"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        className="w-8 h-8 flex items-center justify-center text-red-600 border border-red-600 rounded hover:bg-red-50 transition-colors"
                        onClick={() => onViewDetails?.(asset)}
                        title="Delete Asset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                
                {/* Expandable Details Row */}
                {isSelected && selectedAsset && (
                  <tr>
                    <td colSpan={7} className="border border-blue-200 p-0 bg-white">
                      <div className="p-4 space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b pb-3">
                          <div className="flex items-center gap-2">
                            <Package className="w-5 h-5 text-blue-500" />
                            <h2 className="text-lg font-semibold text-gray-900">
                              {selectedAsset.tagId}
                            </h2>
                            {selectedAsset.status && (
                              <StatusBadge status={selectedAsset.status} />
                            )}
                          </div>
                          <button
                            onClick={() => onViewDetails?.(selectedAsset)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            title="Close Details"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="text-sm">
                              <span className="text-gray-500">Type:</span>
                              <span className="ml-2 font-medium">{selectedAsset?.assetType || 'N/A'}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-500">Brand:</span>
                              <span className="ml-2 font-medium">{selectedAsset?.brand || 'N/A'}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-500">Model:</span>
                              <span className="ml-2 font-medium">{selectedAsset?.model || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm">
                              <span className="text-gray-500">Status:</span>
                              <span className="ml-2 font-medium">{selectedAsset?.status || 'N/A'}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-500">Priority:</span>
                              <span className="ml-2 font-medium">{selectedAsset?.priority || 'N/A'}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-500">Assigned:</span>
                              <span className="ml-2 font-medium">{selectedAsset?.assignedTo?.name || 'Unassigned'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Location */}
                        <div className="border-t pt-4">
                          <h3 className="text-sm font-medium text-gray-900 mb-2">Location</h3>
                          <div className="text-sm text-gray-600">
                            {selectedAsset?.location?.building || 'N/A'} • {selectedAsset?.location?.floor || 'N/A'} • {selectedAsset?.location?.room || 'N/A'}
                          </div>
                        </div>

                        {/* Sub-Assets Section */}
                        {selectedAsset?.subAssets && (
                          <div className="border-t pt-4">
                            <h3 className="text-sm font-medium text-gray-900 mb-3">Sub-Assets</h3>
                            
                            {/* Movable Sub-Assets */}
                            {selectedAsset.subAssets.movable && selectedAsset.subAssets.movable.length > 0 && (
                              <div className="mb-4">
                                <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-2">
                                  <Package className="w-4 h-4 text-green-600" />
                                  Movable Sub-Assets ({selectedAsset.subAssets.movable.length})
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {selectedAsset.subAssets.movable.map((subAsset, idx) => (
                                    <div key={subAsset._id || idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <Package className="w-4 h-4 text-green-600" />
                                          <span className="text-sm font-medium">{subAsset.assetName}</span>
                                        </div>
                                        <span className="text-xs text-gray-500 font-mono">{subAsset.tagId}</span>
                                      </div>
                                      {subAsset.digitalAssets?.qrCode && copyToClipboard && downloadFile && (
                                        <div className="mt-2 space-y-2">
                                          <div className="flex items-center justify-center">
                                            <NextImage
                                              src={`https://digitalasset.zenapi.co.in${subAsset.digitalAssets?.qrCode?.url || ''}`}
                                              alt={`QR Code for ${subAsset.tagId}`}
                                              width={48}
                                              height={48}
                                              className="w-12 h-12 object-contain border border-gray-200 rounded"
                                            />
                                          </div>
                                          <div className="flex gap-1">
                                            <Button 
                                              variant="outline" 
                                              size="sm" 
                                              onClick={() => {
                                                const url = `https://digitalasset.zenapi.co.in${subAsset.digitalAssets?.qrCode?.url || ''}`
                                                copyToClipboard(url)
                                              }}
                                              className="flex-1 h-7 text-xs bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200"
                                            >
                                              <Copy className="w-3 h-3 mr-1" />
                                              Copy
                                            </Button>
                                            <Button 
                                              variant="outline" 
                                              size="sm" 
                                              onClick={() => {
                                                const url = `https://digitalasset.zenapi.co.in${subAsset.digitalAssets?.qrCode?.url || ''}`
                                                downloadFile(url, `qr_${subAsset.tagId}.png`)
                                              }}
                                              className="flex-1 h-7 text-xs bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
                                            >
                                              <Download className="w-3 h-3 mr-1" />
                                              Download
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Immovable Sub-Assets */}
                            {selectedAsset.subAssets.immovable && selectedAsset.subAssets.immovable.length > 0 && (
                              <div>
                                <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-2">
                                  <Building className="w-4 h-4 text-blue-600" />
                                  Immovable Sub-Assets ({selectedAsset.subAssets.immovable.length})
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {selectedAsset.subAssets.immovable.map((subAsset, idx) => (
                                    <div key={subAsset._id || idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <Building className="w-4 h-4 text-blue-600" />
                                          <span className="text-sm font-medium">{subAsset.assetName}</span>
                                        </div>
                                        <span className="text-xs text-gray-500 font-mono">{subAsset.tagId}</span>
                                      </div>
                                      {subAsset.digitalAssets?.qrCode && copyToClipboard && downloadFile && (
                                        <div className="mt-2 space-y-2">
                                          <div className="flex items-center justify-center">
                                            <NextImage
                                              src={`https://digitalasset.zenapi.co.in${subAsset.digitalAssets?.qrCode?.url || ''}`}
                                              alt={`QR Code for ${subAsset.tagId}`}
                                              width={48}
                                              height={48}
                                              className="w-12 h-12 object-contain border border-gray-200 rounded"
                                            />
                                          </div>
                                          <div className="flex gap-1">
                                            <Button 
                                              variant="outline" 
                                              size="sm" 
                                              onClick={() => {
                                                const url = `https://digitalasset.zenapi.co.in${subAsset.digitalAssets?.qrCode?.url || ''}`
                                                copyToClipboard(url)
                                              }}
                                              className="flex-1 h-7 text-xs bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200"
                                            >
                                              <Copy className="w-3 h-3 mr-1" />
                                              Copy
                                            </Button>
                                            <Button 
                                              variant="outline" 
                                              size="sm" 
                                              onClick={() => {
                                                const url = `https://digitalasset.zenapi.co.in${subAsset.digitalAssets?.qrCode?.url || ''}`
                                                downloadFile(url, `qr_${subAsset.tagId}.png`)
                                              }}
                                              className="flex-1 h-7 text-xs bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
                                            >
                                              <Download className="w-3 h-3 mr-1" />
                                              Download
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Project Info */}
                        <div className="border-t pt-4">
                          <div className="text-sm">
                            <span className="text-gray-500">Project:</span>
                            <span className="ml-2 font-medium">
                              {selectedAsset?.project?.projectName || selectedAsset?.projectName || 'N/A'}
                            </span>
                          </div>
                          <div className="text-sm mt-1">
                            <span className="text-gray-500">Created:</span>
                            <span className="ml-2 font-medium">
                              {selectedAsset?.createdAt ? new Date(selectedAsset.createdAt).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}; 