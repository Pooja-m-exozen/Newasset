export interface ChecklistItem {
  _id: string
  serialNumber: number
  inspectionItem: string
  details: string
  status?: 'pending' | 'completed' | 'failed' | 'not_applicable'
  remarks?: string
  completedAt?: string
  completedBy?: string
}

export interface Location {
  floor: string
  building: string
  zone: string
}

export interface CreatedBy {
  _id: string
  name: string
  email: string
}

export interface Checklist {
  _id: string
  title: string
  description: string
  type: string
  frequency: string
  items: ChecklistItem[]
  location: Location
  createdBy: CreatedBy
  assignedTo: string[]
  status: 'active' | 'completed' | 'archived'
  priority: string
  tags: string[]
  createdAt: string
  updatedAt: string
  qrCode: {
    url: string
    data: string
    generatedAt: string
  }
}
