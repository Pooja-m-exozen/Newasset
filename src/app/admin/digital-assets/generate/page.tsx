'use client'

import { QRCodeGenerator } from '@/components/ui/qr-code-generator'
import { BarcodeGenerator } from '@/components/ui/barcode-generator'
import { NFCGenerator } from '@/components/ui/nfc-generator'
import { BulkDigitalAssetsGenerator } from '@/components/ui/bulk-digital-assets-generator'
import { AssetsViewer } from '@/components/ui/assets-viewer'
import {
  QrCode,
  Barcode,
  Wifi,
  Database
} from 'lucide-react'
import { useState } from 'react'

export default function GeneratePage() {
  const [activeTab, setActiveTab] = useState('bulk')

  const tabConfig = [
    {
      value: 'bulk',
      icon: Database,
      title: 'Bulk Generation'
    },
    {
      value: 'qr',
      icon: QrCode,
      title: 'QR Codes'
    },
    {
      value: 'barcode',
      icon: Barcode,
      title: 'Barcodes'
    },
    {
      value: 'nfc',
      icon: Wifi,
      title: 'NFC Data'
    },
    {
      value: 'viewer',
      icon: Database,
      title: 'Asset Viewer'
    }
  ]

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      <div className="flex-1 overflow-auto">
        {/* Main Content */}
        <main className="px-4 pb-1 sm:px-6 sm:pb-2 space-y-0">
          {/* Simple Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
            {tabConfig.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
                  activeTab === tab.value
                    ? 'bg-white dark:bg-gray-800 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.title}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            {activeTab === 'bulk' && <BulkDigitalAssetsGenerator />}
            {activeTab === 'qr' && <QRCodeGenerator />}
            {activeTab === 'barcode' && <BarcodeGenerator />}
            {activeTab === 'nfc' && <NFCGenerator />}
            {activeTab === 'viewer' && <AssetsViewer />}
          </div>
        </main>
      </div>
    </div>
  )
}
 