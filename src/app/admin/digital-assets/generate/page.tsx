'use client'

import { QRCodeGenerator } from '@/components/ui/qr-code-generator'
import { BarcodeGenerator } from '@/components/ui/barcode-generator'
import { NFCGenerator } from '@/components/ui/nfc-generator'
import { BulkDigitalAssetsGenerator } from '@/components/ui/bulk-digital-assets-generator'
import { AssetsViewer } from '@/components/ui/assets-viewer'
import { SubAssetQRGenerator } from '@/components/ui/sub-asset-qr-generator'
import { SubAssetBulkGenerator } from '@/components/ui/sub-asset-bulk-generator'
import {
  QrCode,
  Barcode,
  Wifi,
  Database,
  Play,
  Eye,
  X,
  Package,
  Building
} from 'lucide-react'
import { useState } from 'react'

export default function GeneratePage() {
  const [activeGenerator, setActiveGenerator] = useState<string | null>(null)

  const generators = [
    {
      id: 'bulk',
      name: 'Bulk Generation',
      description: 'Generate multiple digital assets at once',
      icon: Database,
      color: 'bg-blue-100 text-blue-800',
      component: BulkDigitalAssetsGenerator,
      status: 'Active',
      lastUsed: '2 hours ago'
    },
    {
      id: 'sub-asset-qr',
      name: 'Sub-Asset QR Codes',
      description: 'Generate QR codes for individual sub-assets',
      icon: Package,
      color: 'bg-green-100 text-green-800',
      component: SubAssetQRGenerator,
      status: 'Active',
      lastUsed: 'Just now'
    },
    {
      id: 'sub-asset-bulk',
      name: 'Sub-Asset Bulk Generation',
      description: 'Generate digital assets for all sub-assets',
      icon: Building,
      color: 'bg-purple-100 text-purple-800',
      component: SubAssetBulkGenerator,
      status: 'Active',
      lastUsed: 'Just now'
    },
    {
      id: 'qr',
      name: 'QR Codes',
      description: 'Create QR codes for asset tracking',
      icon: QrCode,
      color: 'bg-green-100 text-green-800',
      component: QRCodeGenerator,
      status: 'Active',
      lastUsed: '1 day ago'
    },
    {
      id: 'barcode',
      name: 'Barcodes',
      description: 'Generate barcodes for inventory',
      icon: Barcode,
      color: 'bg-orange-100 text-orange-800',
      component: BarcodeGenerator,
      status: 'Active',
      lastUsed: '3 days ago'
    },
    {
      id: 'nfc',
      name: 'NFC Data',
      description: 'Create NFC tags for assets',
      icon: Wifi,
      color: 'bg-purple-100 text-purple-800',
      component: NFCGenerator,
      status: 'Active',
      lastUsed: '1 week ago'
    },
    {
      id: 'viewer',
      name: 'Asset Viewer',
      description: 'View and manage generated assets',
      icon: Eye,
      color: 'bg-blue-100 text-blue-800',
      component: AssetsViewer,
      status: 'Active',
      lastUsed: '5 minutes ago'
    }
  ]

  const handleGeneratorAction = (generatorId: string, action: string) => {
    if (action === 'open') {
      setActiveGenerator(generatorId)
    } else if (action === 'download') {
      // Handle download action
      console.log(`Download assets for ${generatorId}`)
    } else if (action === 'settings') {
      // Handle settings action
      console.log(`Open settings for ${generatorId}`)
    }
  }

  const ActiveComponent = generators.find(g => g.id === activeGenerator)?.component

  return (
    <div className="flex h-screen bg-white transition-colors duration-200">
      <div className="flex-1 overflow-auto">
        <main className="px-4 pb-1 sm:px-6 sm:pb-2 space-y-4 sm:space-y-6">
          {/* Generators Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse font-sans text-base min-w-[800px]">
                <thead>
                  <tr className="bg-blue-50 dark:bg-slate-800 border-b border-border">
                    <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm">
                      #
                    </th>
                    <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm">
                      GENERATOR
                    </th>
                    <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm">
                      DESCRIPTION
                    </th>
                    <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm">
                      STATUS
                    </th>
                    <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm">
                      LAST USED
                    </th>
                    <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                  <tbody>
                    {generators.map((generator, index) => (
                      <tr key={generator.id} className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        <td className="border border-border px-2 sm:px-4 py-2 sm:py-3">
                          <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full text-xs font-semibold text-blue-800">
                            {index + 1}
                          </div>
                        </td>
                        <td className="border border-border px-2 sm:px-4 py-2 sm:py-3">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="p-1 sm:p-2 bg-blue-50 rounded-lg">
                              <generator.icon className="w-3 h-3 sm:w-5 sm:h-5 text-blue-800" />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm font-medium text-blue-800">
                                {generator.name}
                              </div>
                              <div className="text-xs text-blue-600">
                                ID: {generator.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="border border-border px-2 sm:px-4 py-2 sm:py-3">
                          <span className="text-xs sm:text-sm text-blue-800">
                            {generator.description}
                          </span>
                        </td>
                        <td className="border border-border px-2 sm:px-4 py-2 sm:py-3">
                          <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${generator.color}`}>
                            {generator.status}
                          </span>
                        </td>
                        <td className="border border-border px-2 sm:px-4 py-2 sm:py-3">
                          <span className="text-xs sm:text-sm text-blue-800">
                            {generator.lastUsed}
                          </span>
                        </td>
                        <td className="border border-border px-2 sm:px-4 py-2 sm:py-3">
                          <div className="flex items-center gap-1 sm:gap-2 justify-center">
                            <button
                              onClick={() => handleGeneratorAction(generator.id, 'open')}
                              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                                activeGenerator === generator.id
                                  ? 'text-white bg-purple-600 hover:bg-purple-700'
                                  : 'text-purple-700 bg-purple-100 hover:bg-purple-200'
                              }`}
                              title="Open Generator"
                            >
                              <Play className="w-3 h-3" />
                              {activeGenerator === generator.id ? 'Active' : 'Open'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          {/* Generator Content Display */}
          {activeGenerator && ActiveComponent && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-4">
              <div className="border-b border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {generators.find(g => g.id === activeGenerator)?.name}
                  </h2>
                  <button
                    onClick={() => setActiveGenerator(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Close Generator"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <ActiveComponent />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
 