'use client'

import { BarcodeGenerator } from '@/components/ui/barcode-generator'

export default function GenerateBarcodePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Barcode Generator</h1>
          <p className="text-muted-foreground mt-2">
            Generate barcodes for your digital assets
          </p>
        </div>
        
        <BarcodeGenerator />
      </div>
    </div>
  )
} 