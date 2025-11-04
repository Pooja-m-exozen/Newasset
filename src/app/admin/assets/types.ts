import { AssetData, InventoryItem, PurchaseOrder, Asset } from '@/lib/adminasset'

// API Response interfaces
export interface ApiSubAsset {
  _id?: string
  id?: string
  tagId?: string  // Sub-asset tag ID
  assetName: string
  description?: string  // Made optional to match actual data
  category: string  // Made flexible to accept any string
  brand: string
  model: string
  capacity: string
  location: string
  parentAsset?: AssetData  // Added parentAsset property
  digitalTagType?: string  // Digital tag type
  digitalAssets?: {
    qrCode?: {
      url: string
      data: Record<string, unknown>
      generatedAt: string
    }
    barcode?: {
      url: string
      data: {
        t: string
        a: string
        s: string
        b: string
        m: string
        st: string
        p: string
        l: Record<string, unknown>
        u: string
        pr: string
        lm: string | null
        nm: string | null
        url: string
        ts: number
        c: string
      }
      generatedAt: string
    }
    nfcData?: {
      url: string
      data: Record<string, unknown>
      generatedAt: string
    }
  }
  hasDigitalAssets?: boolean  // Digital assets flag
  purchaseOrder?: PurchaseOrder  // Added purchaseOrder property
  inventory: {
    consumables: InventoryItem[]
    spareParts: InventoryItem[]
    tools: InventoryItem[]
    operationalSupply: InventoryItem[]
  }
}

// @ts-expect-error - Complex type compatibility issue between ApiSubAsset and SubAsset interfaces
export interface ApiAsset extends Asset {
  subAssets?: {
    movable: ApiSubAsset[]
    immovable: ApiSubAsset[]
  }
}

export interface ApiAssetsResponse {
  success: boolean
  assets: ApiAsset[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  message?: string
}

// Updated interface to include all sub-asset properties
export interface AssetClassificationItem {
  assetName: string
  description: string
  category: 'Movable' | 'Immovable'
  brand: string
  model: string
  capacity: string
  location: string
  reason: string
  tagId?: string  // NEW: Sub-asset tag ID
  digitalTagType?: string  // NEW: Digital tag type
  digitalAssets?: {
    qrCode?: {
      url: string
      data: Record<string, unknown>
      generatedAt: string
    }
    barcode?: {
      url: string
      data: {
        t: string
        a: string
        s: string
        b: string
        m: string
        st: string
        p: string
        l: Record<string, unknown>
        u: string
        pr: string
        lm: string | null
        nm: string | null
        url: string
        ts: number
        c: string
      }
      generatedAt: string
    }
    nfcData?: {
      url: string
      data: Record<string, unknown>
      generatedAt: string
    }
  }
  hasDigitalAssets?: boolean  // NEW: Quick check flag
  inventory: {
    consumables: InventoryItem[]
    spareParts: InventoryItem[]
    tools: InventoryItem[]
    operationalSupply: InventoryItem[]
  }
}

export interface AssetClassification {
  movable: AssetClassificationItem[]
  immovable: AssetClassificationItem[]
}

