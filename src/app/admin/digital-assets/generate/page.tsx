'use client'

import { QRCodeGenerator } from '@/components/ui/qr-code-generator'
import { BarcodeGenerator } from '@/components/ui/barcode-generator'
import { NFCGenerator } from '@/components/ui/nfc-generator'
import { BulkDigitalAssetsGenerator } from '@/components/ui/bulk-digital-assets-generator'
import { AssetsViewer } from '@/components/ui/assets-viewer'
import { QRCodeScanner } from '@/components/ui/qr-code-scanner'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/ui/page-header'
import {
  QrCode,
  Barcode,
  Wifi,
  Package,
  Database,
  Sparkles,
  Zap,
  TrendingUp,
  Users,
  Shield,
  Activity,
  BarChart3,
  Settings,
  ArrowRight,
  CheckCircle,
  Clock,
  Star,
  Download,
  Scan
} from 'lucide-react'
import { useState } from 'react'

export default function GeneratePage() {
  const [activeTab, setActiveTab] = useState('bulk')
  const [stats, setStats] = useState({
    totalAssets: 1247,
    generatedToday: 23,
    activeUsers: 8,
    successRate: 98.5
  })

  const tabConfig = [
    {
      value: 'bulk',
      icon: Package,
      title: 'Bulk Generation',
      subtitle: 'Generate everything at once',
      description: 'Create all digital assets for multiple assets simultaneously',
      color: 'from-blue-500 to-purple-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20'
    },
    {
      value: 'qr',
      icon: QrCode,
      title: 'QR Codes',
      subtitle: 'Quick response codes',
      description: 'Generate QR codes for instant asset identification',
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20'
    },
    {
      value: 'barcode',
      icon: Barcode,
      title: 'Barcodes',
      subtitle: 'Linear codes',
      description: 'Create various barcode formats for industrial use',
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20'
    },
    {
      value: 'nfc',
      icon: Wifi,
      title: 'NFC Data',
      subtitle: 'Near field communication',
      description: 'Generate NFC data for contactless interaction',
      color: 'from-purple-500 to-pink-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20'
    },
    {
      value: 'viewer',
      icon: Database,
      title: 'Asset Viewer',
      subtitle: 'Browse and manage',
      description: 'View and manage all your digital assets',
      color: 'from-indigo-500 to-blue-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/20'
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Page Header */}
          <PageHeader
            title="Digital Asset Generation"
            description="Generate, manage, and track QR codes, barcodes, and NFC data for your assets"
            icon={<Sparkles className="h-6 w-6 text-primary" />}
          />

      

          {/* Main Content */}
          <Card>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                {/* Tab Headers */}
                <div className="border-b bg-muted/40">
                  <TabsList className="grid w-full grid-cols-6 h-auto bg-transparent border-0 p-0 rounded-none gap-2">
                    {tabConfig.map((tab) => (
                      <TabsTrigger 
                        key={tab.value}
                        value={tab.value} 
                        className="flex flex-col items-center justify-center space-y-2 px-4 py-6 text-center text-sm font-medium transition-all duration-300 ease-in-out data-[state=active]:bg-background data-[state=active]:shadow-md hover:bg-muted/30 border-r border-border"
                      >
                        <div className={`p-3 rounded-xl bg-gradient-to-r ${tab.color} shadow-md`}>
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
                
                {/* Tab Contents */}
                <div className="p-6">
                  <TabsContent value="bulk" className="space-y-6">
                        <BulkDigitalAssetsGenerator />
                      </TabsContent>
                      
                  <TabsContent value="qr" className="space-y-6">
                        <QRCodeGenerator />
                      </TabsContent>
                      
                  <TabsContent value="barcode" className="space-y-6">
                        <BarcodeGenerator />
                      </TabsContent>
                      
                  <TabsContent value="nfc" className="space-y-6">
                        <NFCGenerator />
                      </TabsContent>
                      
                  <TabsContent value="viewer" className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-600 shadow">
                              <Database className="h-6 w-6 text-white" />
                            </div>
                            <div>
                        <h2 className="text-xl font-semibold">Asset Viewer</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                                Browse and manage all your digital assets in one centralized location with advanced filtering.
                              </p>
                        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              Multi-User
                            </span>
                            <span className="flex items-center gap-1">
                              <Database className="h-4 w-4" />
                              Centralized
                            </span>
                            <span className="flex items-center gap-1">
                              <Activity className="h-4 w-4" />
                              Real-time
                            </span>
                        </div>
                          </div>
                        </div>
                        <AssetsViewer />
                      </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>

          {/* Footer Status */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  System Online
                </span>
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {stats.activeUsers} Active Users
                </span>
                <span className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  {stats.generatedToday} Generated Today
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
 