"use client"

import React, { useState } from 'react'
import ProtectedRoute from "@/components/ProtectedRoute"
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Building, Package, Search, Eye, X, ArrowDown, Download } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: {
      startY?: number
      head?: string[][]
      body?: string[][]
      styles?: Record<string, unknown>
      headStyles?: Record<string, unknown>
      bodyStyles?: Record<string, unknown>
      margin?: { left: number; right: number }
      columnStyles?: Record<string, Record<string, unknown>>
    }) => jsPDF
    lastAutoTable: {
      finalY: number
    }
  }
}

interface AssetInventory {
  consumables: string[]
  spareParts: string[]
  tools: string[]
  operationalSupply: string[]
}

interface AssetClassificationItem {
  assetName: string
  description: string
  category: string
  reason: string
  inventory: AssetInventory
}

interface AssetClassification {
  movable: AssetClassificationItem[]
  immovable: AssetClassificationItem[]
}

interface Asset {
  _id: string
  tagId: string
  assetType: string
  subcategory?: string
  mobilityCategory?: string
  brand: string
  model?: string
  serialNumber?: string
  capacity?: string
  yearOfInstallation?: string
  status?: string
  priority?: string
  location?: {
    building?: string
    floor?: string
    room?: string
  }
}

// Unique sample data - one asset per type
const sampleAssets: Asset[] = [
  {
    _id: '1',
    tagId: 'WTP',
    assetType: 'WTP',
    subcategory: 'Water Treatment Plant',
    mobilityCategory: 'Immovable',
    brand: 'AquaTech',
    model: 'WTP-5000',
    capacity: '5000 LPH',
    yearOfInstallation: '2020',
    status: 'Active',
    priority: 'High',
    location: { building: 'Main Building', floor: 'Ground', room: 'Utility Room' }
  },
  {
    _id: '2',
    tagId: 'COMP',
    assetType: 'Computer',
    subcategory: 'Desktop',
    mobilityCategory: 'Movable',
    brand: 'Dell',
    model: 'OptiPlex 7090',
    serialNumber: 'DL123456',
    yearOfInstallation: '2022',
    status: 'Active',
    priority: 'Low',
    location: { building: 'Main Building', floor: '2nd', room: 'IT Office' }
  },
  {
    _id: '3',
    tagId: 'PRINTER',
    assetType: 'Printer',
    subcategory: 'Laser Printer',
    mobilityCategory: 'Movable',
    brand: 'Canon',
    model: 'LBP6230dn',
    serialNumber: 'CN345678',
    yearOfInstallation: '2022',
    status: 'Active',
    priority: 'Low',
    location: { building: 'Main Building', floor: '2nd', room: 'IT Office' }
  },
  {
    _id: '4',
    tagId: 'UPS',
    assetType: 'UPS',
    subcategory: 'Uninterruptible Power Supply',
    mobilityCategory: 'Movable',
    brand: 'APC',
    model: 'SMX1500HV',
    capacity: '1500VA',
    yearOfInstallation: '2021',
    status: 'Active',
    priority: 'High',
    location: { building: 'Main Building', floor: '2nd', room: 'Server Room' }
  }
]

// Dynamic Asset Classification based on Asset Type and Subcategory
const getAssetClassification = (assetType: string, subcategory: string): AssetClassification => {
  const classificationMap: { [key: string]: AssetClassification } = {
    'WTP': {
      movable: [
        {
          assetName: "Water Pumps (inside WTP)",
          description: "Pump equipment for intake, discharge, and circulation within the treatment plant.",
          category: "Movable",
          reason: "Can be detached and relocated independently for maintenance or replacement.",
          inventory: {
            consumables: ["Pump Oil", "Seal Rings", "Gaskets", "Lubricants"],
            spareParts: ["Impeller", "Motor", "Bearings", "Shaft"],
            tools: ["Multimeter", "Wrench Set", "Pressure Gauge", "Flow Meter"],
            operationalSupply: ["Backup Pumps", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        },
        {
          assetName: "Control Panel / Electrical Equipment",
          description: "Control systems and electrical panels for plant operation.",
          category: "Movable",
          reason: "Detachable equipment that can be relocated or replaced without affecting the main structure.",
          inventory: {
            consumables: ["Fuses", "Wire Connectors", "Terminal Blocks", "Cable Ties"],
            spareParts: ["Control Board", "Relays", "Switches", "Indicators"],
            tools: ["Screwdriver Set", "Wire Strippers", "Multimeter", "Crimping Tool"],
            operationalSupply: ["Backup Control Panels", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        },
        {
          assetName: "Filtration Systems",
          description: "Modular filtration units and membrane systems.",
          category: "Movable",
          reason: "Can be detached and relocated independently for maintenance or upgrades.",
          inventory: {
            consumables: ["Filter Cartridges", "Membrane Elements", "O-Rings", "Cleaning Chemicals"],
            spareParts: ["Filter Housing", "Pressure Vessels", "Valves", "Connectors"],
            tools: ["Pressure Tester", "Flow Meter", "Cleaning Kit", "Wrench Set"],
            operationalSupply: ["Backup Filters", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        },
        {
          assetName: "Chemical Dosing Equipment",
          description: "Portable chemical injection and dosing systems.",
          category: "Movable",
          reason: "Can be moved or replaced easily for different chemical treatments.",
          inventory: {
            consumables: ["Chemical Solutions", "Dosing Pumps", "Tubing", "Calibration Solutions"],
            spareParts: ["Dosing Pump Head", "Valves", "Sensors", "Control Module"],
            tools: ["Calibration Kit", "pH Meter", "Flow Controller", "Safety Equipment"],
            operationalSupply: ["Backup Dosing Equipment", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        },
        {
          assetName: "Portable Water Treatment Unit",
          description: "Modular or skid-mounted treatment plant built in containers.",
          category: "Movable",
          reason: "Can be transported by truck or trailer to another site; not permanently fixed.",
          inventory: {
            consumables: ["Treatment Chemicals", "Filter Media", "Disinfectants", "Test Kits"],
            spareParts: ["Skid Frame", "Container Module", "Piping", "Electrical Connections"],
            tools: ["Lifting Equipment", "Transport Tools", "Installation Kit", "Testing Equipment"],
            operationalSupply: ["Backup Treatment Units", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        }
      ],
      immovable: [
        {
          assetName: "Water Treatment Plant (WTP) Structure",
          description: "Main facility structure for purifying and treating water supply.",
          category: "Immovable",
          reason: "Permanently installed facility with underground infrastructure and foundation.",
          inventory: {
            consumables: ["Concrete Sealants", "Waterproofing Materials", "Structural Adhesives", "Maintenance Coatings"],
            spareParts: ["Structural Beams", "Foundation Blocks", "Support Columns", "Reinforcement Bars"],
            tools: ["Concrete Mixer", "Crane", "Excavator", "Structural Testing Kit"],
            operationalSupply: ["Backup Structures", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        },
        {
          assetName: "Storage Tanks (Underground/RCC)",
          description: "Large concrete or buried tanks for water storage.",
          category: "Immovable",
          reason: "Permanently constructed structures embedded in the ground.",
          inventory: {
            consumables: ["Tank Liners", "Waterproofing Sealants", "Cleaning Chemicals", "Disinfectants"],
            spareParts: ["Tank Covers", "Access Hatches", "Overflow Pipes", "Drainage Systems"],
            tools: ["Tank Inspection Kit", "Cleaning Equipment", "Water Testing Kit", "Maintenance Ladder"],
            operationalSupply: ["Backup Tanks", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        },
        {
          assetName: "Civil Works & Foundations",
          description: "Concrete foundations, structural supports, and civil infrastructure.",
          category: "Immovable",
          reason: "Permanently fixed to the ground and cannot be moved without demolition.",
          inventory: {
            consumables: ["Concrete Mix", "Rebar", "Formwork Materials", "Curing Compounds"],
            spareParts: ["Foundation Blocks", "Support Piers", "Retaining Walls", "Drainage Channels"],
            tools: ["Concrete Mixer", "Excavator", "Compactor", "Surveying Equipment"],
            operationalSupply: ["Backup Foundations", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        },
        {
          assetName: "Permanent Pipework",
          description: "Fixed underground or embedded piping systems.",
          category: "Immovable",
          reason: "Permanently installed infrastructure embedded in the ground.",
          inventory: {
            consumables: ["Pipe Joints", "Sealants", "Insulation Materials", "Protective Coatings"],
            spareParts: ["Pipe Sections", "Valves", "Fittings", "Support Brackets"],
            tools: ["Pipe Wrench", "Pipe Cutter", "Pressure Tester", "Leak Detector"],
            operationalSupply: ["Backup Piping", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        },
        {
          assetName: "Building Structures",
          description: "Control rooms, pump houses, and treatment buildings.",
          category: "Immovable",
          reason: "Permanent structures fixed to the ground.",
          inventory: {
            consumables: ["Building Materials", "Insulation", "Weatherproofing", "Maintenance Supplies"],
            spareParts: ["Roof Panels", "Windows", "Doors", "Structural Components"],
            tools: ["Construction Equipment", "Lifting Gear", "Safety Equipment", "Building Inspection Kit"],
            operationalSupply: ["Backup Buildings", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        }
      ]
    },
    'Computer': {
      movable: [
        {
          assetName: "Desktop Computer",
          description: "Personal computer system including CPU, monitor, keyboard, and mouse.",
          category: "Movable",
          reason: "Can be easily relocated and disconnected from power/network connections.",
          inventory: {
            consumables: ["Keyboard", "Mouse", "Cables", "Cleaning Supplies"],
            spareParts: ["CPU", "RAM", "Hard Drive", "Power Supply"],
            tools: ["Screwdriver Set", "Anti-static Wristband", "Cable Tester", "Cleaning Kit"],
            operationalSupply: ["Backup Computers", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        },
        {
          assetName: "Laptop Computer",
          description: "Portable computer system with integrated display and input devices.",
          category: "Movable",
          reason: "Designed for portability and can be moved between locations easily.",
          inventory: {
            consumables: ["Battery", "Charger", "Cleaning Cloth", "Screen Protector"],
            spareParts: ["Keyboard", "Screen", "Motherboard", "Hard Drive"],
            tools: ["Screwdriver Set", "Anti-static Mat", "Cleaning Kit", "Diagnostic Software"],
            operationalSupply: ["Backup Laptops", "Emergency Equipment", "Spare Batteries", "Safety Equipment"]
          }
        },
        {
          assetName: "Computer Mouse",
          description: "Pointing device for computer input and navigation.",
          category: "Movable",
          reason: "Small, portable device that can be easily disconnected and relocated.",
          inventory: {
            consumables: ["Mouse Pad", "Cleaning Cloth", "USB Cable", "Batteries"],
            spareParts: ["Mouse Body", "Scroll Wheel", "Buttons", "Sensor"],
            tools: ["Cleaning Kit", "Multimeter", "Replacement Kit", "Testing Equipment"],
            operationalSupply: ["Backup Mice", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        },
        {
          assetName: "Computer Keyboard",
          description: "Input device for typing and computer control.",
          category: "Movable",
          reason: "Portable device that can be disconnected and moved to different workstations.",
          inventory: {
            consumables: ["Key Caps", "Cleaning Solution", "USB Cable", "Wrist Rest"],
            spareParts: ["Keyboard Body", "Key Switches", "Circuit Board", "Cable"],
            tools: ["Key Puller", "Cleaning Kit", "Multimeter", "Replacement Kit"],
            operationalSupply: ["Backup Keyboards", "Emergency Equipment", "Spare Keys", "Safety Equipment"]
          }
        },
        {
          assetName: "Monitor/Display",
          description: "Visual display unit for computer output.",
          category: "Movable",
          reason: "Can be disconnected from power and data cables and relocated.",
          inventory: {
            consumables: ["Cleaning Cloth", "Screen Protector", "Cables", "Mounting Hardware"],
            spareParts: ["Display Panel", "Power Supply", "Control Board", "Stand"],
            tools: ["Screwdriver Set", "Cleaning Kit", "Multimeter", "Installation Kit"],
            operationalSupply: ["Backup Monitors", "Emergency Displays", "Spare Panels", "Safety Equipment"]
          }
        }
      ],
      immovable: [
        {
          assetName: "Server Room Infrastructure",
          description: "Permanent infrastructure for housing computer servers.",
          category: "Immovable",
          reason: "Permanent structure with fixed electrical and cooling infrastructure.",
          inventory: {
            consumables: ["Rack Hardware", "Cable Management", "Cooling Fans", "Power Strips"],
            spareParts: ["Server Racks", "UPS Systems", "Cooling Units", "Fire Suppression"],
            tools: ["Rack Installation Kit", "Cable Tester", "Cooling Test Kit", "Safety Equipment"],
            operationalSupply: ["Backup Server Rooms", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        },
        {
          assetName: "Data Center Building",
          description: "Permanent facility housing computer and network equipment.",
          category: "Immovable",
          reason: "Permanent structure built specifically for IT infrastructure.",
          inventory: {
            consumables: ["Building Materials", "Insulation", "Fire Suppression", "Security Systems"],
            spareParts: ["Structural Components", "HVAC Systems", "Electrical Panels", "Access Control"],
            tools: ["Construction Equipment", "Installation Tools", "Testing Equipment", "Safety Gear"],
            operationalSupply: ["Backup Data Centers", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        },
        {
          assetName: "Fixed Network Infrastructure",
          description: "Permanently installed network cabling and equipment.",
          category: "Immovable",
          reason: "Permanently installed communication infrastructure embedded in buildings.",
          inventory: {
            consumables: ["Network Cables", "Connectors", "Patch Panels", "Cable Management"],
            spareParts: ["Switches", "Routers", "Firewalls", "Rack Equipment"],
            tools: ["Cable Tester", "Network Analyzer", "Installation Tools", "Crimping Kit"],
            operationalSupply: ["Backup Network Infrastructure", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        }
      ]
    },
    'UPS': {
      movable: [
        {
          assetName: "Portable UPS",
          description: "Small battery backup system for individual equipment.",
          category: "Movable",
          reason: "Can be disconnected and relocated to protect different equipment.",
          inventory: {
            consumables: ["Batteries", "Power Cables", "Cleaning Supplies", "Fuses"],
            spareParts: ["Battery Module", "Control Board", "Display Panel", "Power Supply"],
            tools: ["Multimeter", "Battery Tester", "Cleaning Kit", "Installation Tools"],
            operationalSupply: ["Backup UPS Units", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        },
        {
          assetName: "UPS Battery Modules",
          description: "Replaceable battery modules for UPS systems.",
          category: "Movable",
          reason: "Can be replaced and relocated for maintenance.",
          inventory: {
            consumables: ["Battery Cells", "Terminal Connectors", "Cleaning Solution", "Protective Covers"],
            spareParts: ["Battery Pack", "Control Circuit", "Monitoring Board", "Connector Assembly"],
            tools: ["Battery Tester", "Multimeter", "Installation Kit", "Safety Equipment"],
            operationalSupply: ["Backup Battery Modules", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        }
      ],
      immovable: [
        {
          assetName: "Central UPS System",
          description: "Large uninterruptible power supply system for building backup.",
          category: "Immovable",
          reason: "Permanently installed system bolted to foundation and connected to building electrical infrastructure.",
          inventory: {
            consumables: ["Battery Banks", "Cooling Fans", "Power Cables", "Monitoring Sensors"],
            spareParts: ["UPS Unit", "Battery Racks", "Control Panel", "Distribution Board"],
            tools: ["Load Bank", "Battery Tester", "Installation Tools", "Maintenance Kit"],
            operationalSupply: ["Backup UPS Systems", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        },
        {
          assetName: "UPS Room Infrastructure",
          description: "Permanent infrastructure for housing UPS equipment.",
          category: "Immovable",
          reason: "Permanent structure with fixed electrical and cooling infrastructure.",
          inventory: {
            consumables: ["Rack Hardware", "Cable Management", "Cooling Systems", "Fire Suppression"],
            spareParts: ["Equipment Racks", "HVAC Units", "Electrical Panels", "Monitoring Systems"],
            tools: ["Rack Installation Kit", "Cooling Test Kit", "Installation Tools", "Safety Equipment"],
            operationalSupply: ["Backup UPS Rooms", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        }
      ]
    },
    'Printer': {
      movable: [
        {
          assetName: "Desktop Printer",
          description: "Small printer for individual workstations.",
          category: "Movable",
          reason: "Can be disconnected from power and network connections and relocated.",
          inventory: {
            consumables: ["Toner Cartridges", "Paper", "Cleaning Kits", "USB Cables"],
            spareParts: ["Print Head", "Paper Tray", "Control Panel", "Power Supply"],
            tools: ["Cleaning Kit", "Multimeter", "Installation Tools", "Maintenance Kit"],
            operationalSupply: ["Backup Printers", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        },
        {
          assetName: "Portable Printer",
          description: "Mobile printing equipment for temporary use.",
          category: "Movable",
          reason: "Designed for portability and can be moved between locations.",
          inventory: {
            consumables: ["Ink Cartridges", "Paper Rolls", "Cleaning Supplies", "Batteries"],
            spareParts: ["Print Mechanism", "Paper Feed", "Control Board", "Carrying Case"],
            tools: ["Cleaning Kit", "Installation Tools", "Maintenance Kit", "Testing Equipment"],
            operationalSupply: ["Backup Portable Printers", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        }
      ],
      immovable: [
        {
          assetName: "Large Format Printer",
          description: "Industrial printer permanently installed in production facility.",
          category: "Immovable",
          reason: "Permanently installed equipment bolted to floor and connected to building infrastructure.",
          inventory: {
            consumables: ["Ink Cartridges", "Paper Rolls", "Cleaning Solutions", "Maintenance Kits"],
            spareParts: ["Print Head Assembly", "Paper Feed System", "Control Panel", "Power Distribution"],
            tools: ["Installation Equipment", "Cleaning Kit", "Calibration Tools", "Maintenance Kit"],
            operationalSupply: ["Backup Large Format Printers", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        },
        {
          assetName: "Print Room Infrastructure",
          description: "Permanent infrastructure for housing printing equipment.",
          category: "Immovable",
          reason: "Permanent structure with fixed electrical and ventilation infrastructure.",
          inventory: {
            consumables: ["Building Materials", "Ventilation Ducts", "Electrical Cables", "Fire Suppression"],
            spareParts: ["Equipment Racks", "HVAC Systems", "Electrical Panels", "Safety Systems"],
            tools: ["Installation Equipment", "Ventilation Test Kit", "Electrical Tools", "Safety Equipment"],
            operationalSupply: ["Backup Print Rooms", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        }
      ]
    }
  }

  return classificationMap[assetType] || {
    movable: [
      {
        assetName: `${assetType} Components`,
        description: `Movable components and accessories for ${subcategory || assetType}.`,
        category: "Movable",
        reason: "Portable components that can be relocated or replaced.",
        inventory: {
          consumables: [`${assetType} Supplies`, "Cleaning Materials", "Lubricants", "Maintenance Items"],
          spareParts: [`${assetType} Parts`, "Replacement Components", "Accessories", "Modules"],
          tools: ["Maintenance Kit", "Installation Tools", "Testing Equipment", "Safety Gear"],
          operationalSupply: [`Backup ${assetType}`, "Emergency Equipment", "Spare Components", "Safety Equipment"]
        }
      }
    ],
    immovable: [
      {
        assetName: `${assetType} Infrastructure`,
        description: `Permanent infrastructure and fixed installations for ${subcategory || assetType}.`,
        category: "Immovable",
        reason: "Permanently installed infrastructure that cannot be moved without demolition.",
        inventory: {
          consumables: ["Building Materials", "Structural Components", "Foundation Materials", "Installation Supplies"],
          spareParts: ["Structural Elements", "Foundation Blocks", "Support Systems", "Infrastructure Components"],
          tools: ["Construction Equipment", "Installation Tools", "Testing Equipment", "Safety Equipment"],
          operationalSupply: [`Backup ${assetType} Infrastructure`, "Emergency Equipment", "Spare Components", "Safety Equipment"]
        }
      }
    ]
  }
}

export default function AdminAssetsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMobility, setSelectedMobility] = useState<'all' | 'movable' | 'immovable'>('all')

  // Asset classification states
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [expandedClassificationType, setExpandedClassificationType] = useState<'movable' | 'immovable' | null>(null)
  const [selectedInventoryType, setSelectedInventoryType] = useState<{[key: string]: 'consumables' | 'spareParts' | 'tools' | null}>({})
  
  // Modal states
  const [showFlowchartModal, setShowFlowchartModal] = useState(false)
  const [selectedAssetForFlowchart, setSelectedAssetForFlowchart] = useState<Asset | null>(null)

  const getFilteredAssets = () => {
    let filtered = sampleAssets

    // Filter by mobility category
    if (selectedMobility !== 'all') {
      filtered = filtered.filter(asset => 
        asset.mobilityCategory?.toLowerCase() === selectedMobility.toLowerCase()
      )
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(asset => 
        asset.tagId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.assetType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.subcategory?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered
  }


  const handleMovableClick = (asset: Asset) => {
    if (expandedRow === asset._id && expandedClassificationType === 'movable') {
      // If already expanded with movable, close it
      setExpandedRow(null)
      setExpandedClassificationType(null)
      // Clear inventory selections for this asset
      const newInventoryState = { ...selectedInventoryType }
      Object.keys(newInventoryState).forEach(key => {
        if (key.startsWith(asset._id)) {
          delete newInventoryState[key]
        }
      })
      setSelectedInventoryType(newInventoryState)
    } else {
      // Expand with movable classification
      setExpandedRow(asset._id)
      setExpandedClassificationType('movable')
      // Clear inventory selections for this asset
      const newInventoryState = { ...selectedInventoryType }
      Object.keys(newInventoryState).forEach(key => {
        if (key.startsWith(asset._id)) {
          delete newInventoryState[key]
        }
      })
      setSelectedInventoryType(newInventoryState)
    }
  }

  const handleImmovableClick = (asset: Asset) => {
    if (expandedRow === asset._id && expandedClassificationType === 'immovable') {
      // If already expanded with immovable, close it
      setExpandedRow(null)
      setExpandedClassificationType(null)
      // Clear inventory selections for this asset
      const newInventoryState = { ...selectedInventoryType }
      Object.keys(newInventoryState).forEach(key => {
        if (key.startsWith(asset._id)) {
          delete newInventoryState[key]
        }
      })
      setSelectedInventoryType(newInventoryState)
    } else {
      // Expand with immovable classification
      setExpandedRow(asset._id)
      setExpandedClassificationType('immovable')
      // Clear inventory selections for this asset
      const newInventoryState = { ...selectedInventoryType }
      Object.keys(newInventoryState).forEach(key => {
        if (key.startsWith(asset._id)) {
          delete newInventoryState[key]
        }
      })
      setSelectedInventoryType(newInventoryState)
    }
  }

  const handleInventoryClick = (assetId: string, classificationIndex: number, inventoryType: 'consumables' | 'spareParts' | 'tools') => {
    const key = `${assetId}-${classificationIndex}`
    const currentSelection = selectedInventoryType[key]
    
    setSelectedInventoryType(prev => ({
      ...prev,
      [key]: currentSelection === inventoryType ? null : inventoryType
    }))
  }

  const handleRadioChange = (value: string) => {
    setSelectedMobility(value as 'all' | 'movable' | 'immovable')
    // Don't show classification table on radio button selection
    // Only show when clicking action buttons
  }

  const handleViewFlowchart = (asset: Asset) => {
    setSelectedAssetForFlowchart(asset)
    setShowFlowchartModal(true)
  }

  const handleCloseFlowchartModal = () => {
    setShowFlowchartModal(false)
    setSelectedAssetForFlowchart(null)
  }

  const generatePDF = (asset: Asset) => {
    const doc = new jsPDF()
    const assetClassification = getAssetClassification(asset.assetType, asset.subcategory || '')
    
    // Helper function to check if we need a new page
    const checkPageBreak = (currentY: number, neededSpace: number = 20) => {
      const pageHeight = doc.internal.pageSize.height
      const margin = 20
      if (currentY + neededSpace > pageHeight - margin) {
        doc.addPage()
        return margin
      }
      return currentY
    }
    
    let yPosition = 20
    
    // Simple header
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Asset Classification Report', 14, yPosition)
    yPosition += 10
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`${asset.tagId} - ${asset.brand} ${asset.model}`, 14, yPosition)
    yPosition += 7
    doc.text(`${asset.assetType} (${asset.subcategory})`, 14, yPosition)
    yPosition += 7
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, yPosition)
    yPosition += 20
    
    // Asset Overview Table
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    yPosition = checkPageBreak(yPosition, 15)
    doc.text('Asset Overview', 14, yPosition)
    yPosition += 10
    
    const overviewData = [
      ['Asset ID', asset.tagId],
      ['Asset Type', asset.assetType],
      ['Subcategory', asset.subcategory || 'N/A'],
      ['Brand', asset.brand],
      ['Model', asset.model || 'N/A'],
      ['Capacity', asset.capacity || 'N/A'],
      ['Status', asset.status || 'Active'],
      ['Priority', asset.priority || 'Medium'],
      ['Location', asset.location ? `${asset.location.building}, ${asset.location.floor}, ${asset.location.room}` : 'Not Set']
    ]
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Property', 'Value']],
      body: overviewData,
      styles: { 
        fontSize: 9,
        cellPadding: 3,
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      headStyles: { 
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold', lineColor: [0, 0, 0], lineWidth: 0.1 },
        1: { cellWidth: 140, lineColor: [0, 0, 0], lineWidth: 0.1 }
      },
    })
    
    yPosition = doc.lastAutoTable.finalY + 20
    
    // Movable Assets Table
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    yPosition = checkPageBreak(yPosition, 15)
    doc.text(`Movable Assets (${assetClassification.movable.length} components)`, 14, yPosition)
    yPosition += 10
    
    const movableTableData = assetClassification.movable.map((item, index) => [
      index + 1,
      item.assetName,
      item.inventory.consumables.join(', '),
      item.inventory.spareParts.join(', '),
      item.inventory.tools.join(', ')
    ])
    
    autoTable(doc, {
      startY: yPosition,
      head: [['#', 'Component Name', 'Consumables', 'Spare Parts', 'Tools']],
      body: movableTableData,
      styles: { 
        fontSize: 8,
        cellPadding: 3,
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      headStyles: { 
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 10, lineColor: [0, 0, 0], lineWidth: 0.1 },
        1: { cellWidth: 40, lineColor: [0, 0, 0], lineWidth: 0.1 },
        2: { cellWidth: 50, lineColor: [0, 0, 0], lineWidth: 0.1 },
        3: { cellWidth: 50, lineColor: [0, 0, 0], lineWidth: 0.1 },
        4: { cellWidth: 50, lineColor: [0, 0, 0], lineWidth: 0.1 }
      },
    })
    
    yPosition = doc.lastAutoTable.finalY + 20
    
    // Immovable Assets Table
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    yPosition = checkPageBreak(yPosition, 15)
    doc.text(`Immovable Assets (${assetClassification.immovable.length} components)`, 14, yPosition)
    yPosition += 10
    
    const immovableTableData = assetClassification.immovable.map((item, index) => [
      index + 1,
      item.assetName,
      item.inventory.consumables.join(', '),
      item.inventory.spareParts.join(', '),
      item.inventory.tools.join(', ')
    ])
    
    autoTable(doc, {
      startY: yPosition,
      head: [['#', 'Component Name', 'Consumables', 'Spare Parts', 'Tools']],
      body: immovableTableData,
      styles: { 
        fontSize: 8,
        cellPadding: 3,
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      headStyles: { 
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 10, lineColor: [0, 0, 0], lineWidth: 0.1 },
        1: { cellWidth: 40, lineColor: [0, 0, 0], lineWidth: 0.1 },
        2: { cellWidth: 50, lineColor: [0, 0, 0], lineWidth: 0.1 },
        3: { cellWidth: 50, lineColor: [0, 0, 0], lineWidth: 0.1 },
        4: { cellWidth: 50, lineColor: [0, 0, 0], lineWidth: 0.1 }
      },
    })
    
    yPosition = doc.lastAutoTable.finalY + 20
    
    // Summary Table
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    yPosition = checkPageBreak(yPosition, 20)
    doc.text('Summary', 14, yPosition)
    yPosition += 10
    
    const summaryData = [
      ['Total Movable Components', assetClassification.movable.length.toString()],
      ['Total Immovable Components', assetClassification.immovable.length.toString()],
      ['Total Components', (assetClassification.movable.length + assetClassification.immovable.length).toString()],
      ['Report Generated', new Date().toLocaleString()]
    ]
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: summaryData,
      styles: { 
        fontSize: 10,
        cellPadding: 4,
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      headStyles: { 
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 80, fontStyle: 'bold', lineColor: [0, 0, 0], lineWidth: 0.1 },
        1: { cellWidth: 110, lineColor: [0, 0, 0], lineWidth: 0.1 }
      },
    })
    
    // Footer on last page
    const pageHeight = doc.internal.pageSize.height
    doc.setFontSize(8)
    doc.text('Generated by EXOZEN Asset Management System', 14, pageHeight - 10)
    
    // Save the PDF
    doc.save(`${asset.tagId}_${asset.assetType}_Classification_Report.pdf`)
  }


  const filteredAssets = getFilteredAssets()


  // Show main assets view
  return (
    <ProtectedRoute>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0px); }
        }
      `}</style>
      <div className="min-h-screen bg-background transition-colors duration-200">
        <div className="p-0">
          <div className="max-w-7xl mx-auto">

            {/* Search and Filters */}
            <div className="mb-4 px-4 py-2 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              {/* Search Input */}
              <div className="flex-1 max-w-md">
            <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                    placeholder="Search assets by ID, brand, model, or subcategory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10"
              />
          </div>
        </div>

          {/* Mobility Filter */}
              <div className="flex items-center gap-4">
                <Label className="text-sm font-medium text-blue-800 dark:text-blue-200">Mobility:</Label>
                <RadioGroup 
                  value={selectedMobility} 
                  onValueChange={handleRadioChange}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="all" />
                    <Label htmlFor="all" className="cursor-pointer text-sm">All</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="movable" id="movable" />
                    <Label htmlFor="movable" className="cursor-pointer flex items-center space-x-1 text-sm">
                      <Package className="w-4 h-4" />
                      <span>Movable</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="immovable" id="immovable" />
                    <Label htmlFor="immovable" className="cursor-pointer flex items-center space-x-1 text-sm">
                      <Building className="w-4 h-4" />
                      <span>Immovable</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              </div>


        {/* Assets Table */}
            <div className="bg-background rounded-lg shadow-sm overflow-hidden border border-border">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse font-sans text-base min-w-[800px]">
                <thead>
                    <tr className="bg-blue-50 dark:bg-slate-800 border-b border-border">
                      <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm">
                        ASSET ID
                      </th>
                      <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm">
                        TYPE & SUBCATEGORY
                      </th>
                      <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm">
                        BRAND & MODEL
                      </th>
                      <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm">
                        CAPACITY
                      </th>
                      <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm">
                        STATUS
                      </th>
                      <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm">
                        PRIORITY
                      </th>
                      <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm">
                        LOCATION
                      </th>
                      <th className="border border-border px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-xs sm:text-sm">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((asset) => {
                    const isExpanded = expandedRow === asset._id
                    const assetClassification = isExpanded ? getAssetClassification(asset.assetType, asset.subcategory || '') : null
                    
                    return (
                      <React.Fragment key={asset._id}>
                        {/* Main Asset Row */}
                        <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                          <td className="border border-border px-2 sm:px-4 py-2 sm:py-3">
                            <span className="text-xs sm:text-sm font-medium text-blue-800 dark:text-blue-200">
                              {asset.tagId}
                            </span>
                          </td>
                          <td className="border border-border px-2 sm:px-4 py-2 sm:py-3">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="p-1 sm:p-2 bg-blue-50 rounded-lg">
                                {asset.mobilityCategory === 'Movable' ? (
                                  <Package className="w-3 h-3 sm:w-5 sm:h-5 text-blue-800" />
                                ) : (
                                  <Building className="w-3 h-3 sm:w-5 sm:h-5 text-blue-800" />
                                )}
                              </div>
                              <div>
                                <div className="text-xs sm:text-sm font-medium text-blue-800">
                                  {asset.assetType}
                                </div>
                                <div className="text-xs text-blue-600">
                                  {asset.subcategory || 'No subcategory'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="border border-border px-2 sm:px-4 py-2 sm:py-3">
                            <div>
                              <div className="text-xs sm:text-sm font-medium text-blue-800">
                                {asset.brand}
                              </div>
                              <div className="text-xs text-blue-600">
                                {asset.model || 'No model'}
                              </div>
                            </div>
                          </td>
                          <td className="border border-border px-2 sm:px-4 py-2 sm:py-3">
                            <span className="text-xs sm:text-sm text-blue-800">
                              {asset.capacity || 'N/A'}
                            </span>
                          </td>
                          <td className="border border-border px-2 sm:px-4 py-2 sm:py-3">
                            <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200">
                              {asset.status || 'Active'}
                            </span>
                          </td>
                          <td className="border border-border px-2 sm:px-4 py-2 sm:py-3">
                            <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200">
                              {asset.priority || 'Medium'}
                            </span>
                          </td>
                          <td className="border border-border px-2 sm:px-4 py-2 sm:py-3">
                            <div className="text-xs sm:text-sm text-blue-800">
                              {asset.location?.building && asset.location?.floor && asset.location?.room 
                                ? `${asset.location.building}, ${asset.location.floor}, ${asset.location.room}`
                                : 'Location not set'
                              }
                            </div>
                          </td>
                          <td className="border border-border px-2 sm:px-4 py-2 sm:py-3">
                            <div className="flex items-center gap-1 sm:gap-2 justify-center">
                              <button 
                                onClick={() => handleMovableClick(asset)}
                                className={`px-2 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                                  isExpanded && expandedClassificationType === 'movable'
                                    ? 'text-white bg-green-600 hover:bg-green-700'
                                    : 'text-green-700 bg-green-100 hover:bg-green-200'
                                }`}
                                title="View Movable Assets"
                              >
                                <Package className="w-3 h-3" />
                                Movable
                              </button>
                              <button 
                                onClick={() => handleImmovableClick(asset)}
                                className={`px-2 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                                  isExpanded && expandedClassificationType === 'immovable'
                                    ? 'text-white bg-blue-600 hover:bg-blue-700'
                                    : 'text-blue-700 bg-blue-100 hover:bg-blue-200'
                                }`}
                                title="View Immovable Assets"
                              >
                                <Building className="w-3 h-3" />
                                Immovable
                              </button>
                              <button 
                                onClick={() => handleViewFlowchart(asset)}
                                className="px-2 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 text-purple-700 bg-purple-100 hover:bg-purple-200"
                                title="View Asset Classification Flowchart"
                              >
                                <Eye className="w-3 h-3" />
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Expanded Classification Row */}
                        {isExpanded && assetClassification && (
                          <tr>
                            <td colSpan={8} className="border border-border p-0 bg-gray-50 dark:bg-gray-800">
                              <div className="p-4">
                                <div className="mb-3">
                                  <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-1">
                                    {asset.tagId} - {asset.brand} {asset.model}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {expandedClassificationType === 'movable' ? 'Movable' : 'Immovable'} Assets Classification for {asset.assetType} ({asset.subcategory})
                                  </p>
                                </div>
                                
                                <div className="overflow-x-auto">
                                  <table className="w-full border-collapse">
                                    <thead>
                                      <tr className="bg-blue-50 dark:bg-slate-800 border-b border-border">
                                        <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                                          Asset Name / Type
                                        </th>
                                        <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                                          Brand
                                        </th>
                                        <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                                          Model
                                        </th>
                                        <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                                          Capacity
                                        </th>
                                        <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                                          Location
                                        </th>
                                        <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                                          Actions
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {assetClassification[expandedClassificationType!].map((classificationAsset: AssetClassificationItem, index: number) => {
                                        // Mock data for each classification asset
                                        const mockData = {
                                          brand: ['AquaTech', 'Dell', 'Canon', 'APC', 'Siemens', 'Honeywell'][index % 6],
                                          model: ['AT-5000', 'OptiPlex 7090', 'LBP6230dn', 'SMX1500HV', 'S7-1200', 'T6 Pro'][index % 6],
                                          capacity: ['5000 LPH', '16GB RAM', 'A4 Laser', '1500VA', '24V DC', '10A'][index % 6],
                                          location: ['Utility Room', 'IT Office', 'Print Room', 'Server Room', 'Control Room', 'Main Floor'][index % 6]
                                        }
                                        
                                        return (
                                          <React.Fragment key={index}>
                                            <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                              <td className="border border-border px-4 py-3">
                                                <div className="flex items-center space-x-2">
                                                  {expandedClassificationType === 'movable' ? (
                                                    <Package className="w-4 h-4 text-green-600" />
                                                  ) : (
                                                    <Building className="w-4 h-4 text-blue-600" />
                                                  )}
                                                  <span className="font-medium text-blue-800 dark:text-blue-200">
                                                    {classificationAsset.assetName}
                                                  </span>
                                                </div>
                                              </td>
                                              <td className="border border-border px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                {mockData.brand}
                                              </td>
                                              <td className="border border-border px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                {mockData.model}
                                              </td>
                                              <td className="border border-border px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                {mockData.capacity}
                                              </td>
                                              <td className="border border-border px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                {mockData.location}
                                              </td>
                                              <td className="border border-border px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                  <button 
                                                    onClick={() => handleInventoryClick(asset._id, index, 'consumables')}
                                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                                      selectedInventoryType[`${asset._id}-${index}`] === 'consumables'
                                                        ? 'text-white bg-orange-600 hover:bg-orange-700'
                                                        : 'text-orange-700 bg-orange-100 hover:bg-orange-200'
                                                    }`}
                                                  >
                                                    Consumables
                                                  </button>
                                                  <button 
                                                    onClick={() => handleInventoryClick(asset._id, index, 'spareParts')}
                                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                                      selectedInventoryType[`${asset._id}-${index}`] === 'spareParts'
                                                        ? 'text-white bg-blue-600 hover:bg-blue-700'
                                                        : 'text-blue-700 bg-blue-100 hover:bg-blue-200'
                                                    }`}
                                                  >
                                                    Spare Parts
                                                  </button>
                                                  <button 
                                                    onClick={() => handleInventoryClick(asset._id, index, 'tools')}
                                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                                      selectedInventoryType[`${asset._id}-${index}`] === 'tools'
                                                        ? 'text-white bg-green-600 hover:bg-green-700'
                                                        : 'text-green-700 bg-green-100 hover:bg-green-200'
                                                    }`}
                                                  >
                                                    Tools
                                                  </button>
                                                </div>
                                              </td>
                                            </tr>
                                            
                                            {/* Inventory Details Row */}
                                            {selectedInventoryType[`${asset._id}-${index}`] && (
                                              <tr>
                                                <td colSpan={6} className="border border-border p-0 bg-gray-50 dark:bg-gray-800">
                                                  <div className="p-4">
                                                    <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">
                                                      {selectedInventoryType[`${asset._id}-${index}`] === 'consumables' ? 'Consumables' : 
                                                       selectedInventoryType[`${asset._id}-${index}`] === 'spareParts' ? 'Spare Parts' : 'Tools'} - {classificationAsset.assetName}
                                                    </h4>
                                                    <div className="overflow-x-auto">
                                                      <table className="w-full border-collapse">
                                                        <thead>
                                                          <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                                            <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 text-sm">
                                                              Item Name
                                                            </th>
                                                            <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 text-sm">
                                                              Quantity
                                                            </th>
                                                            <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 text-sm">
                                                              Status
                                                            </th>
                                                            <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 text-sm">
                                                              Last Updated
                                                            </th>
                                                          </tr>
                                                        </thead>
                                                        <tbody>
                                                          {classificationAsset.inventory?.[selectedInventoryType[`${asset._id}-${index}`]!]?.map((item, itemIndex) => (
                                                            <tr key={itemIndex} className="hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                                                              <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                                                                {item}
                                                              </td>
                                                              <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                                                                {Math.floor(Math.random() * 50) + 1}
                                                              </td>
                                                              <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm">
                                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                                  Math.random() > 0.5 
                                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                                                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200'
                                                                }`}>
                                                                  {Math.random() > 0.5 ? 'Available' : 'Low Stock'}
                                                                </span>
                                                              </td>
                                                              <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                                                                {new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                                                              </td>
                                                            </tr>
                                                          ))}
                                                        </tbody>
                                                      </table>
                                                    </div>
                                                  </div>
                                                </td>
                                              </tr>
                                            )}
                                          </React.Fragment>
                                        )
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
              
            {filteredAssets.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No assets found matching your criteria.
              </div>
            )}
            </div>

          </div>
        </div>

        {/* Flowchart Modal */}
        {showFlowchartModal && selectedAssetForFlowchart && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Asset Classification Flowchart
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedAssetForFlowchart.tagId} - {selectedAssetForFlowchart.brand} {selectedAssetForFlowchart.model}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => generatePDF(selectedAssetForFlowchart)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    title="Download PDF Report"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                  <button
                    onClick={handleCloseFlowchartModal}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {(() => {
                  const assetClassification = getAssetClassification(selectedAssetForFlowchart.assetType, selectedAssetForFlowchart.subcategory || '')
                  
                  return (
                    <div className="space-y-8">
                      {/* Asset Classification Flowchart */}
                      <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          {selectedAssetForFlowchart.assetType} Classification
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Complete breakdown with actual inventory data
                        </p>
                      </div>

                      {/* Asset Type with Two Branches */}
                      <div className="text-center mb-8">
                        <div className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-4 inline-block mb-6">
                          <h4 className="font-semibold text-gray-900 dark:text-white">Asset Type</h4>
                          <p className="text-blue-600 font-medium">{selectedAssetForFlowchart.assetType}</p>
                        </div>
                        
                        {/* Two Branches Side by Side with Component Classifications */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                          {/* Movable Branch with Components */}
                          <div>
                            <div className="text-center mb-4">
                              <div className="flex items-center justify-center gap-2 mb-2">
                                <Package className="w-5 h-5 text-green-600" />
                                <h4 className="font-semibold text-gray-900 dark:text-white">Movable Assets</h4>
                              </div>
                              <p className="text-sm text-gray-600">{assetClassification.movable.length} components</p>
                            </div>
                            
                            {/* Movable Component Headers */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 mb-4">
                              {assetClassification.movable.map((item, index) => (
                                <div key={index} className="text-center">
                                  <div className="flex items-center justify-center gap-1 mb-1">
                                    <ArrowDown className="w-3 h-3 text-gray-500" />
                                    <h6 className="font-medium text-gray-900 dark:text-white text-xs">{item.assetName}</h6>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {/* Movable Component Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
                              {assetClassification.movable.map((item, index) => (
                                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                                  {/* Consumables */}
                                  <div className="mb-2">
                                    <div className="flex items-center gap-1 mb-1">
                                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Consumables:</span>
                                    </div>
                                    <div className="ml-3 text-xs text-gray-600 dark:text-gray-400">
                                      {item.inventory.consumables.join(', ')}
                                    </div>
                                  </div>
                                  
                                  {/* Spare Parts */}
                                  <div className="mb-2">
                                    <div className="flex items-center gap-1 mb-1">
                                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Spare Parts:</span>
                                    </div>
                                    <div className="ml-3 text-xs text-gray-600 dark:text-gray-400">
                                      {item.inventory.spareParts.join(', ')}
                                    </div>
                                  </div>
                                  
                                  {/* Tools */}
                                  <div>
                                    <div className="flex items-center gap-1 mb-1">
                                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Tools:</span>
                                    </div>
                                    <div className="ml-3 text-xs text-gray-600 dark:text-gray-400">
                                      {item.inventory.tools.join(', ')}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Immovable Branch with Components */}
                          <div>
                            <div className="text-center mb-4">
                              <div className="flex items-center justify-center gap-2 mb-2">
                                <Building className="w-5 h-5 text-blue-600" />
                                <h4 className="font-semibold text-gray-900 dark:text-white">Immovable Assets</h4>
                              </div>
                              <p className="text-sm text-gray-600">{assetClassification.immovable.length} components</p>
                            </div>
                            
                            {/* Immovable Component Headers */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 mb-4">
                              {assetClassification.immovable.map((item, index) => (
                                <div key={index} className="text-center">
                                  <div className="flex items-center justify-center gap-1 mb-1">
                                    <ArrowDown className="w-3 h-3 text-gray-500" />
                                    <h6 className="font-medium text-gray-900 dark:text-white text-xs">{item.assetName}</h6>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {/* Immovable Component Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
                              {assetClassification.immovable.map((item, index) => (
                                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                                  {/* Consumables */}
                                  <div className="mb-2">
                                    <div className="flex items-center gap-1 mb-1">
                                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Consumables:</span>
                                    </div>
                                    <div className="ml-3 text-xs text-gray-600 dark:text-gray-400">
                                      {item.inventory.consumables.join(', ')}
                                    </div>
                                  </div>
                                  
                                  {/* Spare Parts */}
                                  <div className="mb-2">
                                    <div className="flex items-center gap-1 mb-1">
                                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Spare Parts:</span>
                                    </div>
                                    <div className="ml-3 text-xs text-gray-600 dark:text-gray-400">
                                      {item.inventory.spareParts.join(', ')}
                                    </div>
                                  </div>
                                  
                                  {/* Tools */}
                                  <div>
                                    <div className="flex items-center gap-1 mb-1">
                                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Tools:</span>
                                    </div>
                                    <div className="ml-3 text-xs text-gray-600 dark:text-gray-400">
                                      {item.inventory.tools.join(', ')}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="text-center">
                        <div className="bg-blue-600 rounded-lg p-4 inline-block">
                          <h3 className="text-lg font-bold text-white">
                            Total Components: {assetClassification.movable.length + assetClassification.immovable.length}
                          </h3>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleCloseFlowchartModal}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </ProtectedRoute>
  )

}

