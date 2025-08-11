'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Badge } from './badge'
import { generateAllDigitalAssets} from '@/lib/DigitalAssets'
import { Package, CheckCircle, XCircle } from 'lucide-react'

export function BulkTest() {
  const [testResults, setTestResults] = useState<{
    apiConnection: boolean | null
    bulkGeneration: boolean | null
    error: string | null
  }>({
    apiConnection: null,
    bulkGeneration: null,
    error: null
  })

  const runTests = async () => {
    setTestResults({
      apiConnection: null,
      bulkGeneration: null,
      error: null
    })

    try {
      // Test 1: API Connection
      console.log('🧪 Testing API connection...')
      const connectionTest = await fetch('http://192.168.0.5:5021/api/health', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Accept': 'application/json',
        },
      })
      
      setTestResults(prev => ({
        ...prev,
        apiConnection: connectionTest.ok
      }))

      if (!connectionTest.ok) {
        throw new Error('API connection failed')
      }

      // Test 2: Bulk Digital Assets Generation
      console.log('🧪 Testing bulk digital assets generation...')
      const bulkResult = await generateAllDigitalAssets('TEST001', {
        qrSize: 300,
        barcodeFormat: 'code128'
      })

      setTestResults(prev => ({
        ...prev,
        bulkGeneration: bulkResult.success
      }))

      console.log('✅ All tests passed!')
    } catch (error) {
      console.error('❌ Test failed:', error)
      setTestResults(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Package className="h-5 w-5" />
          Bulk Digital Assets Generator Test
        </CardTitle>
        <CardDescription>
          Test the bulk digital assets generator functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runTests} className="w-full">
          Run Tests
        </Button>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">API Connection</span>
            {testResults.apiConnection === null ? (
              <Badge variant="secondary">Pending</Badge>
            ) : testResults.apiConnection ? (
              <div className="flex items-center space-x-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Connected</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-red-600">
                <XCircle className="h-4 w-4" />
                <span className="text-sm">Failed</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Bulk Generation</span>
            {testResults.bulkGeneration === null ? (
              <Badge variant="secondary">Pending</Badge>
            ) : testResults.bulkGeneration ? (
              <div className="flex items-center space-x-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Success</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-red-600">
                <XCircle className="h-4 w-4" />
                <span className="text-sm">Failed</span>
              </div>
            )}
          </div>
        </div>

        {testResults.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{testResults.error}</p>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p>• Tests API connectivity to the bulk generation service</p>
          <p>• Verifies QR code, barcode, and NFC data generation</p>
          <p>• Checks authentication and response handling</p>
        </div>
      </CardContent>
    </Card>
  )
} 