import React from 'react';
import { Asset, getStatusBadge } from '../../lib/Report';
import { 
  ArrowUpDown,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

interface AssetTableProps {
  assets: Asset[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
  onViewDetails?: (asset: Asset) => void;
  selectedAsset?: Asset | null;
}

export const AssetTable: React.FC<AssetTableProps> = ({
  assets,
  onSort,
  onViewDetails,
  selectedAsset
}) => {
  const handleSort = (field: string) => {
    onSort(field);
  };

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
          {assets.map((asset, index) => {
            const statusBadge = getStatusBadge(asset.status || 'active');
            
            return (
              <tr key={asset._id} className="hover:bg-gray-50 transition-colors">
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
                        selectedAsset && selectedAsset._id === asset._id
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}; 