'use client'

import { QRCodeGenerator } from '@/components/ui/qr-code-generator'
import { BarcodeGenerator } from '@/components/ui/barcode-generator'
import { NFCGenerator } from '@/components/ui/nfc-generator'
import { BulkDigitalAssetsGenerator } from '@/components/ui/bulk-digital-assets-generator'
import { AssetsViewer } from '@/components/ui/assets-viewer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/ui/page-header'
import { QrCode, Barcode, Wifi, Package, Database, Sparkles, Zap, TrendingUp, Users, Shield, Activity, BarChart3, Settings, ArrowRight, CheckCircle, Clock, Star, Download } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function GeneratePage() {
  const [activeTab, setActiveTab] = useState('bulk')
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState({
    totalAssets: 1247,
    generatedToday: 23,
    activeUsers: 8,
    successRate: 98.5
  })

  // Simulate loading animation
  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

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
      <div className="container mx-auto py-6 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Page Header */}
          <PageHeader
            title="Digital Asset Generation"
            description="Generate, manage, and track QR codes, barcodes, and NFC data for your assets"
            icon={<Sparkles className="h-6 w-6" />}
          />



          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">System Performance</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-600">Operational</span>
                </div>
              </div>
              <Progress value={95} className="h-2" />
            </CardContent>
          </Card>

          {/* Main Content */}
          <Card>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                
                {/* Tab Headers */}
                <div className="border-b bg-muted/50">
                  <TabsList className="grid w-full grid-cols-5 h-auto bg-transparent border-0 p-0 rounded-none">
                    {tabConfig.map((tab) => (
                      <TabsTrigger 
                        key={tab.value}
                        value={tab.value} 
                        className="flex flex-col items-center space-y-2 p-6 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-none border-r border-border transition-all duration-200 hover:bg-muted/50"
                      >
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${tab.color} shadow-sm`}>
                          <tab.icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="text-center">
                          <span className="font-medium text-sm">{tab.title}</span>
                          <p className="text-xs text-muted-foreground mt-1">{tab.subtitle}</p>
                        </div>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
                
                {/* Content Sections */}
                <div className="p-6">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <p className="text-muted-foreground">Loading advanced features...</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <TabsContent value="bulk" className="mt-0 space-y-6">
                        <div className="mb-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
                              <Package className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h2 className="text-2xl font-semibold">Bulk Asset Generation</h2>
                              <p className="text-muted-foreground mt-2">
                                Generate all digital assets (QR codes, barcodes, and NFC data) for your assets in one place.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Zap className="h-4 w-4" />
                              High Performance
                            </span>
                            <span className="flex items-center gap-1">
                              <Shield className="h-4 w-4" />
                              Secure Generation
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4" />
                              Batch Processing
                            </span>
                          </div>
                        </div>
                        <BulkDigitalAssetsGenerator />
                      </TabsContent>
                      
                      <TabsContent value="qr" className="mt-0 space-y-6">
                        <div className="mb-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600">
                              <QrCode className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h2 className="text-2xl font-semibold">QR Code Generator</h2>
                              <p className="text-muted-foreground mt-2">
                                Create QR codes for quick asset identification and tracking with advanced customization options.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4" />
                              High Quality
                            </span>
                            <span className="flex items-center gap-1">
                              <Settings className="h-4 w-4" />
                              Customizable
                            </span>
                            <span className="flex items-center gap-1">
                              <Download className="h-4 w-4" />
                              Instant Download
                            </span>
                          </div>
                        </div>
                        <QRCodeGenerator />
                      </TabsContent>
                      
                      <TabsContent value="barcode" className="mt-0 space-y-6">
                        <div className="mb-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-600">
                              <Barcode className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h2 className="text-2xl font-semibold">Barcode Generator</h2>
                              <p className="text-muted-foreground mt-2">
                                Generate various barcode formats for industrial and commercial use with professional standards.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <BarChart3 className="h-4 w-4" />
                              Multiple Formats
                            </span>
                            <span className="flex items-center gap-1">
                              <Activity className="h-4 w-4" />
                              Industry Standard
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="h-4 w-4" />
                              High Resolution
                            </span>
                          </div>
                        </div>
                        <BarcodeGenerator />
                      </TabsContent>
                      
                      <TabsContent value="nfc" className="mt-0 space-y-6">
                        <div className="mb-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600">
                              <Wifi className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h2 className="text-2xl font-semibold">NFC Data Generator</h2>
                              <p className="text-muted-foreground mt-2">
                                Create NFC data for contactless asset identification and interaction with advanced protocols.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Wifi className="h-4 w-4" />
                              Contactless
                            </span>
                            <span className="flex items-center gap-1">
                              <Shield className="h-4 w-4" />
                              Secure Protocol
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Fast Response
                            </span>
                          </div>
                        </div>
                        <NFCGenerator />
                      </TabsContent>
                      
                      <TabsContent value="viewer" className="mt-0 space-y-6">
                        <div className="mb-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-600">
                              <Database className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h2 className="text-2xl font-semibold">Asset Viewer</h2>
                              <p className="text-muted-foreground mt-2">
                                Browse and manage all your digital assets in one centralized location with advanced filtering.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                        <AssetsViewer />
                      </TabsContent>
                    </>
                  )}
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
 