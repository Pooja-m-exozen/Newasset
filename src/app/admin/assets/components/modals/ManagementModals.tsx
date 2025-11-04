"use client"

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X } from 'lucide-react'
import { AssetData, PurchaseOrder, ReplacementRecord, LifecycleStatus, FinancialData } from '@/lib/adminasset'

interface ManagementModalsProps {
  // PO Modal
  showPOModal: boolean
  poData: Partial<PurchaseOrder>
  onPODataChange: (data: Partial<PurchaseOrder>) => void
  onClosePO: () => void
  onSavePO: () => void
  loading: boolean
  
  // Replacement Modal
  showReplacementModal: boolean
  replacementData: Partial<ReplacementRecord>
  onReplacementDataChange: (data: Partial<ReplacementRecord>) => void
  onCloseReplacement: () => void
  onSaveReplacement: () => void
  
  // Lifecycle Modal
  showLifecycleModal: boolean
  lifecycleData: Partial<LifecycleStatus>
  onLifecycleDataChange: (data: Partial<LifecycleStatus>) => void
  onCloseLifecycle: () => void
  onSaveLifecycle: () => void
  
  // Financial Modal
  showFinancialModal: boolean
  financialData: Partial<FinancialData>
  onFinancialDataChange: (data: Partial<FinancialData>) => void
  onCloseFinancial: () => void
  onSaveFinancial: () => void
  
  selectedAsset: AssetData | null
  selectedSubAsset: {
    asset: AssetData
    subAssetIndex: number
    category: 'movable' | 'immovable'
  } | null
}

export const ManagementModals: React.FC<ManagementModalsProps> = ({
  showPOModal,
  poData,
  onPODataChange,
  onClosePO,
  onSavePO,
  loading,
  showReplacementModal,
  replacementData,
  onReplacementDataChange,
  onCloseReplacement,
  onSaveReplacement,
  showLifecycleModal,
  lifecycleData,
  onLifecycleDataChange,
  onCloseLifecycle,
  onSaveLifecycle,
  showFinancialModal,
  financialData,
  onFinancialDataChange,
  onCloseFinancial,
  onSaveFinancial,
  selectedAsset,
  selectedSubAsset
}) => {
  return (
    <>
      {/* Purchase Order Modal */}
      {showPOModal && selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Link Purchase Order
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedSubAsset 
                    ? `Sub-Asset: ${selectedAsset.tagId} - ${selectedSubAsset.category}`
                    : `Main Asset: ${selectedAsset.tagId}`
                  }
                </p>
              </div>
              <button onClick={onClosePO} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    PO Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={poData.poNumber || ''}
                    onChange={(e) => onPODataChange({ ...poData, poNumber: e.target.value })}
                    placeholder="e.g., PO-2024-001"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    PO Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={poData.poDate || ''}
                    onChange={(e) => onPODataChange({ ...poData, poDate: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Vendor <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={poData.vendor || ''}
                    onChange={(e) => onPODataChange({ ...poData, vendor: e.target.value })}
                    placeholder="e.g., Kirloskar Brothers Ltd"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Vendor Contact
                  </Label>
                  <Input
                    value={poData.vendorContact || ''}
                    onChange={(e) => onPODataChange({ ...poData, vendorContact: e.target.value })}
                    placeholder="e.g., sales@kirloskar.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Purchase Cost
                  </Label>
                  <Input
                    type="number"
                    value={poData.purchaseCost || ''}
                    onChange={(e) => onPODataChange({ ...poData, purchaseCost: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g., 150000"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Currency
                  </Label>
                  <Select value={poData.currency || 'INR'} onValueChange={(value) => onPODataChange({ ...poData, currency: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Payment Terms
                  </Label>
                  <Input
                    value={poData.paymentTerms || ''}
                    onChange={(e) => onPODataChange({ ...poData, paymentTerms: e.target.value })}
                    placeholder="e.g., Net 30"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Delivery Date
                  </Label>
                  <Input
                    type="date"
                    value={poData.deliveryDate || ''}
                    onChange={(e) => onPODataChange({ ...poData, deliveryDate: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Invoice Number
                  </Label>
                  <Input
                    value={poData.invoiceNumber || ''}
                    onChange={(e) => onPODataChange({ ...poData, invoiceNumber: e.target.value })}
                    placeholder="e.g., INV-2024-001"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Invoice Date
                  </Label>
                  <Input
                    type="date"
                    value={poData.invoiceDate || ''}
                    onChange={(e) => onPODataChange({ ...poData, invoiceDate: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Notes
                  </Label>
                  <Input
                    value={poData.notes || ''}
                    onChange={(e) => onPODataChange({ ...poData, notes: e.target.value })}
                    placeholder="Additional notes..."
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-3">
                <Button onClick={onClosePO} variant="outline" className="px-4 py-2">
                  Cancel
                </Button>
                <Button onClick={onSavePO} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                  {loading ? 'Saving...' : 'Link Purchase Order'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Replacement Modal */}
      {showReplacementModal && selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Record Asset Replacement
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedSubAsset 
                    ? `Sub-Asset: ${selectedAsset.tagId} - ${selectedSubAsset.category}`
                    : `Main Asset: ${selectedAsset.tagId}`
                  }
                </p>
              </div>
              <button onClick={onCloseReplacement} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Replaced Asset Tag ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={replacementData.replacedAssetTagId || ''}
                    onChange={(e) => onReplacementDataChange({ ...replacementData, replacedAssetTagId: e.target.value })}
                    placeholder="e.g., OLD-SSWTP001"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Replacement Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={replacementData.replacementDate || ''}
                    onChange={(e) => onReplacementDataChange({ ...replacementData, replacementDate: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Replacement Reason <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={replacementData.replacementReason || ''}
                    onChange={(e) => onReplacementDataChange({ ...replacementData, replacementReason: e.target.value })}
                    placeholder="e.g., Equipment failure - motor burnt out"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Cost of Replacement
                  </Label>
                  <Input
                    type="number"
                    value={replacementData.costOfReplacement || ''}
                    onChange={(e) => onReplacementDataChange({ ...replacementData, costOfReplacement: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g., 75000"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Replaced By
                  </Label>
                  <Input
                    value={replacementData.replacedBy || ''}
                    onChange={(e) => onReplacementDataChange({ ...replacementData, replacedBy: e.target.value })}
                    placeholder="e.g., John Doe"
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Notes
                  </Label>
                  <Input
                    value={replacementData.notes || ''}
                    onChange={(e) => onReplacementDataChange({ ...replacementData, notes: e.target.value })}
                    placeholder="Additional notes..."
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-3">
                <Button onClick={onCloseReplacement} variant="outline" className="px-4 py-2">
                  Cancel
                </Button>
                <Button onClick={onSaveReplacement} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white" disabled={loading}>
                  {loading ? 'Saving...' : 'Record Replacement'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lifecycle Modal */}
      {showLifecycleModal && selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Update Lifecycle Status
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedSubAsset 
                    ? `Sub-Asset: ${selectedAsset.tagId} - ${selectedSubAsset.category}`
                    : `Main Asset: ${selectedAsset.tagId}`
                  }
                </p>
              </div>
              <button onClick={onCloseLifecycle} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={lifecycleData.status || 'operational'} 
                    onValueChange={(value) => onLifecycleDataChange({ ...lifecycleData, status: value as LifecycleStatus['status'] })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="procured">Procured</SelectItem>
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="installed">Installed</SelectItem>
                      <SelectItem value="commissioned">Commissioned</SelectItem>
                      <SelectItem value="operational">Operational</SelectItem>
                      <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                      <SelectItem value="disposed">Disposed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={lifecycleData.date || ''}
                    onChange={(e) => onLifecycleDataChange({ ...lifecycleData, date: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Updated By
                  </Label>
                  <Input
                    value={lifecycleData.updatedBy || ''}
                    onChange={(e) => onLifecycleDataChange({ ...lifecycleData, updatedBy: e.target.value })}
                    placeholder="e.g., John Doe"
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Notes
                  </Label>
                  <Input
                    value={lifecycleData.notes || ''}
                    onChange={(e) => onLifecycleDataChange({ ...lifecycleData, notes: e.target.value })}
                    placeholder="Additional notes..."
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-3">
                <Button onClick={onCloseLifecycle} variant="outline" className="px-4 py-2">
                  Cancel
                </Button>
                <Button onClick={onSaveLifecycle} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white" disabled={loading}>
                  {loading ? 'Saving...' : 'Update Status'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Financial Modal */}
      {showFinancialModal && selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Manage Financial Data
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Main Asset: {selectedAsset.tagId}
                </p>
              </div>
              <button onClick={onCloseFinancial} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Total Cost
                  </Label>
                  <Input
                    type="number"
                    value={financialData.totalCost || ''}
                    onChange={(e) => onFinancialDataChange({ ...financialData, totalCost: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g., 150000"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Depreciation Rate (%)
                  </Label>
                  <Input
                    type="number"
                    value={financialData.depreciationRate || ''}
                    onChange={(e) => onFinancialDataChange({ ...financialData, depreciationRate: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g., 10"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Current Value
                  </Label>
                  <Input
                    type="number"
                    value={financialData.currentValue || ''}
                    onChange={(e) => onFinancialDataChange({ ...financialData, currentValue: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g., 120000"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-3">
                <Button onClick={onCloseFinancial} variant="outline" className="px-4 py-2">
                  Cancel
                </Button>
                <Button onClick={onSaveFinancial} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white" disabled={loading}>
                  {loading ? 'Saving...' : 'Update Financial Data'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

