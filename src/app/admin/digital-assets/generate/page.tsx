'use client'

import { QRCodeGenerator } from '@/components/ui/qr-code-generator'
import { BarcodeGenerator } from '@/components/ui/barcode-generator'
import { NFCGenerator } from '@/components/ui/nfc-generator'
import { BulkDigitalAssetsGenerator } from '@/components/ui/bulk-digital-assets-generator'
import { AssetsViewer } from '@/components/ui/assets-viewer'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs'
import {
  Card,
  CardContent
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  QrCode,
  Barcode,
  Wifi,
  Package,
  Database,
  Sparkles,
  Users,
  Activity,
  BarChart
} from 'lucide-react'
import { useState } from 'react'

export default function GeneratePage() {
  const [activeTab, setActiveTab] = useState('bulk')

  const tabConfig = [
    {
      value: 'bulk',
      icon: Package,
      title: 'Bulk Generation',
      subtitle: 'Mass asset creation',
      description: 'Generate multiple digital assets simultaneously for efficient workflow',
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20'
    },
    {
      value: 'qr',
      icon: QrCode,
      title: 'QR Codes',
      subtitle: 'Quick response codes',
      description: 'Create QR codes for instant asset identification and tracking',
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/20'
    },
    {
      value: 'barcode',
      icon: Barcode,
      title: 'Barcodes',
      subtitle: 'Linear codes',
      description: 'Generate various barcode formats for industrial applications',
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20'
    },
    {
      value: 'nfc',
      icon: Wifi,
      title: 'NFC Data',
      subtitle: 'Contactless interaction',
      description: 'Create NFC data for seamless asset communication',
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20'
    },
    {
      value: 'viewer',
      icon: Database,
      title: 'Asset Viewer',
      subtitle: 'Browse & manage',
      description: 'Centralized asset management with advanced filtering',
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/20'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Digital Asset Generation</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Create, manage, and track QR codes, barcodes, and NFC data for your assets
                </p>
              </div>
            </div>
          </div>

          {/* Main Content Card */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              {/* Header Section */}
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">Asset Generation Tools</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Choose from multiple asset generation methods and management tools
                </p>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                
                {/* Tab Headers */}
                <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <div className="px-6 py-4">
                    <TabsList className="grid w-full grid-cols-5 h-auto bg-transparent border-0 p-0 rounded-lg gap-2">
                      {tabConfig.map((tab) => (
                        <TabsTrigger 
                          key={tab.value}
                          value={tab.value} 
                          className="flex flex-col items-center justify-center space-y-2 px-4 py-6 text-center text-sm font-medium transition-all duration-200 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                        >
                          <div className={`p-3 rounded-lg ${tab.color} shadow-sm`}>
                            <tab.icon className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <span className="block font-semibold text-gray-900 dark:text-white">{tab.title}</span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{tab.subtitle}</p>
                          </div>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>
                </div>
                
                {/* Tab Contents */}
                <div className="p-6">
                  <TabsContent value="bulk" className="space-y-6 mt-0">
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-blue-500 shadow-sm">
                          <Package className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Bulk Asset Generation</h2>
                          <p className="text-gray-600 dark:text-gray-300">Generate multiple digital assets efficiently with batch processing</p>
                        </div>
                      </div>
                    </div>
                    <BulkDigitalAssetsGenerator />
                  </TabsContent>
                  
                  <TabsContent value="qr" className="space-y-6 mt-0">
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-emerald-500 shadow-sm">
                          <QrCode className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">QR Code Generator</h2>
                          <p className="text-gray-600 dark:text-gray-300">Create high-quality QR codes for instant asset identification</p>
                        </div>
                      </div>
                    </div>
                    <QRCodeGenerator />
                  </TabsContent>
                  
                  <TabsContent value="barcode" className="space-y-6 mt-0">
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-orange-500 shadow-sm">
                          <Barcode className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Barcode Generator</h2>
                          <p className="text-gray-600 dark:text-gray-300">Generate various barcode formats for industrial applications</p>
                        </div>
                      </div>
                    </div>
                    <BarcodeGenerator />
                  </TabsContent>
                  
                  <TabsContent value="nfc" className="space-y-6 mt-0">
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-purple-500 shadow-sm">
                          <Wifi className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">NFC Data Generator</h2>
                          <p className="text-gray-600 dark:text-gray-300">Create NFC data for contactless asset communication</p>
                        </div>
                      </div>
                    </div>
                    <NFCGenerator />
                  </TabsContent>
                  
                  <TabsContent value="viewer" className="space-y-6 mt-0">
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-indigo-500 shadow-sm">
                          <Database className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Asset Viewer</h2>
                          <p className="text-gray-600 dark:text-gray-300">Browse and manage all your digital assets with advanced filtering</p>
                        </div>
                      </div>
                      
                      {/* Feature badges */}
                      <div className="flex flex-wrap gap-2 mt-4">
                        <Badge variant="secondary" className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600">
                          <Users className="h-3 w-3" />
                          Multi-User Access
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600">
                          <Database className="h-3 w-3" />
                          Centralized Storage
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600">
                          <Activity className="h-3 w-3" />
                          Real-time Updates
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600">
                          <BarChart className="h-3 w-3" />
                          Advanced Analytics
                        </Badge>
                      </div>
                    </div>
                    <AssetsViewer />
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
 