'use client'

import { QRCodeGenerator } from '@/components/ui/qr-code-generator'

export default function GenerateQRCodePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">QR Code Generator</h1>
          <p className="text-muted-foreground mt-2">
            Generate QR codes for your digital assets
          </p>
        </div>
        
        <QRCodeGenerator />
      </div>
    </div>
  )
}
