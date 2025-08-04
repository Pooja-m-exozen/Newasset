'use client'

import { NFCGenerator } from '@/components/ui/nfc-generator'

export default function GenerateNFCPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">NFC Data Generator</h1>
          <p className="text-muted-foreground mt-2">
            Generate NFC data for your digital assets
          </p>
        </div>
        
        <NFCGenerator />
      </div>
    </div>
  )
} 