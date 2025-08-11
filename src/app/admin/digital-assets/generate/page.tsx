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
    <div className="flex h-screen bg-gradient-to-br from-background to-muted">
      <div className="flex-1 overflow-auto">
        {/* Enhanced Header */}
        <header className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 border-b border-border px-4 sm:px-6 py-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Digital Asset Generation
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  Create, manage, and track QR codes, barcodes, and NFC data for your assets
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-700 dark:text-green-300 font-medium">Live</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 sm:p-8 space-y-6 sm:space-y-8">
          {/* Main Content Area */}
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                
                {/* Tab Headers */}
                <div className="border-b bg-muted/30">
                  <div className="px-6 py-4">
                    <TabsList className="grid w-full grid-cols-5 h-auto bg-transparent border-0 p-0 rounded-lg gap-2">
                      {tabConfig.map((tab) => (
                        <TabsTrigger 
                          key={tab.value}
                          value={tab.value} 
                          className="flex flex-col items-center justify-center space-y-2 px-4 py-6 text-center text-sm font-medium transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm hover:bg-muted/50 rounded-lg border border-transparent hover:border-border"
                        >
                          <div className={`p-3 rounded-lg ${tab.color} shadow-sm`}>
                            <tab.icon className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <span className="block font-semibold">{tab.title}</span>
                            <p className="text-xs text-muted-foreground">{tab.subtitle}</p>
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
                          <h2 className="text-xl font-semibold">Bulk Asset Generation</h2>
                          <p className="text-muted-foreground">Generate multiple digital assets efficiently with batch processing</p>
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
                          <h2 className="text-xl font-semibold">QR Code Generator</h2>
                          <p className="text-muted-foreground">Create high-quality QR codes for instant asset identification</p>
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
                          <h2 className="text-xl font-semibold">Barcode Generator</h2>
                          <p className="text-muted-foreground">Generate various barcode formats for industrial applications</p>
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
                          <h2 className="text-xl font-semibold">NFC Data Generator</h2>
                          <p className="text-muted-foreground">Create NFC data for contactless asset communication</p>
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
                          <h2 className="text-xl font-semibold">Asset Viewer</h2>
                          <p className="text-muted-foreground">Browse and manage all your digital assets with advanced filtering</p>
                        </div>
                      </div>
                      
                      {/* Feature badges */}
                      <div className="flex flex-wrap gap-2 mt-4">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Multi-User Access
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Database className="h-3 w-3" />
                          Centralized Storage
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          Real-time Updates
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
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
        </main>
      </div>
    </div>
  )
}
 