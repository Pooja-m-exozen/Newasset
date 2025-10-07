"use client"

import React, { useState } from 'react'
import ProtectedRoute from "@/components/ProtectedRoute"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Building, Package, Search, ChevronLeft } from 'lucide-react'

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
    tagId: 'GEN',
    assetType: 'Generator',
    subcategory: 'Diesel Generator',
    mobilityCategory: 'Immovable',
    brand: 'Cummins',
    model: 'C150D5',
    capacity: '150 KVA',
    yearOfInstallation: '2019',
    status: 'Active',
    priority: 'High',
    location: { building: 'Main Building', floor: 'Ground', room: 'Generator Room' }
  },
  {
    _id: '4',
    tagId: 'HVAC',
    assetType: 'HVAC',
    subcategory: 'Air Conditioning',
    mobilityCategory: 'Immovable',
    brand: 'Carrier',
    model: '42QHC018',
    capacity: '1.5 Ton',
    yearOfInstallation: '2020',
    status: 'Active',
    priority: 'Medium',
    location: { building: 'Main Building', floor: '1st', room: 'Reception' }
  },
  {
    _id: '5',
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
    _id: '6',
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
    'Generator': {
      movable: [
        {
          assetName: "Portable Generator",
          description: "Mobile power generation equipment for temporary use.",
          category: "Movable",
          reason: "Designed for portability and can be transported to different sites.",
          inventory: {
            consumables: ["Diesel Fuel", "Engine Oil", "Air Filters", "Coolant"],
            spareParts: ["Engine Block", "Alternator", "Starter Motor", "Fuel Pump"],
            tools: ["Fuel Transfer Pump", "Oil Change Kit", "Multimeter", "Load Bank"],
            operationalSupply: ["Backup Generators", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        },
        {
          assetName: "Generator Control Panel",
          description: "Control systems and monitoring equipment for generator operation.",
          category: "Movable",
          reason: "Can be detached and relocated for maintenance or replacement.",
          inventory: {
            consumables: ["Control Fuses", "Wire Connectors", "Display Screens", "Control Buttons"],
            spareParts: ["Control Board", "Relays", "Sensors", "Display Unit"],
            tools: ["Multimeter", "Screwdriver Set", "Wire Strippers", "Calibration Kit"],
            operationalSupply: ["Backup Control Panels", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        },
        {
          assetName: "Fuel Storage Tanks (Portable)",
          description: "Above-ground fuel storage tanks for generator operation.",
          category: "Movable",
          reason: "Can be moved or replaced easily for different locations.",
          inventory: {
            consumables: ["Diesel Fuel", "Fuel Additives", "Tank Cleaners", "Sealants"],
            spareParts: ["Tank Body", "Fuel Lines", "Valves", "Level Indicators"],
            tools: ["Fuel Transfer Pump", "Tank Cleaning Kit", "Fuel Testing Kit", "Level Gauge"],
            operationalSupply: ["Backup Fuel Tanks", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        },
        {
          assetName: "Generator Maintenance Tools",
          description: "Portable tools and equipment for generator maintenance.",
          category: "Movable",
          reason: "Small, portable tools that can be carried to different work locations.",
          inventory: {
            consumables: ["Cleaning Solvents", "Lubricants", "Rags", "Safety Gloves"],
            spareParts: ["Tool Handles", "Replacement Parts", "Calibration Standards", "Test Equipment"],
            tools: ["Wrench Set", "Socket Set", "Torque Wrench", "Compression Tester"],
            operationalSupply: ["Backup Tools", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        }
      ],
      immovable: [
        {
          assetName: "Diesel Generator (Fixed Installation)",
          description: "Permanently installed diesel generator for backup power.",
          category: "Immovable",
          reason: "Bolted to concrete foundation and connected to permanent electrical infrastructure.",
          inventory: {
            consumables: ["Diesel Fuel", "Engine Oil", "Coolant", "Air Filters"],
            spareParts: ["Engine Assembly", "Alternator", "Exhaust System", "Mounting Brackets"],
            tools: ["Crane", "Lifting Equipment", "Installation Tools", "Testing Equipment"],
            operationalSupply: ["Backup Generators", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        },
        {
          assetName: "Generator Foundation",
          description: "Concrete foundation and structural support for generator.",
          category: "Immovable",
          reason: "Permanently constructed foundation embedded in the ground.",
          inventory: {
            consumables: ["Concrete Mix", "Rebar", "Formwork", "Curing Compounds"],
            spareParts: ["Foundation Blocks", "Anchor Bolts", "Vibration Isolators", "Support Pads"],
            tools: ["Concrete Mixer", "Excavator", "Compactor", "Foundation Testing Kit"],
            operationalSupply: ["Backup Foundations", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        },
        {
          assetName: "Underground Fuel Storage",
          description: "Buried fuel storage tanks for generator operation.",
          category: "Immovable",
          reason: "Permanently installed underground infrastructure.",
          inventory: {
            consumables: ["Diesel Fuel", "Tank Liners", "Leak Detection Fluids", "Corrosion Inhibitors"],
            spareParts: ["Tank Sections", "Piping", "Valves", "Monitoring Systems"],
            tools: ["Excavator", "Tank Installation Kit", "Leak Detection Kit", "Environmental Testing Kit"],
            operationalSupply: ["Backup Fuel Storage", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        },
        {
          assetName: "Generator Building/Enclosure",
          description: "Permanent structure housing the generator equipment.",
          category: "Immovable",
          reason: "Permanent structure fixed to the ground.",
          inventory: {
            consumables: ["Building Materials", "Insulation", "Ventilation Ducts", "Fire Suppression"],
            spareParts: ["Roof Panels", "Walls", "Doors", "Ventilation Fans"],
            tools: ["Construction Equipment", "Lifting Gear", "Installation Tools", "Safety Equipment"],
            operationalSupply: ["Backup Buildings", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        },
        {
          assetName: "Electrical Infrastructure",
          description: "Fixed electrical connections and distribution systems.",
          category: "Immovable",
          reason: "Permanently installed electrical infrastructure embedded in buildings.",
          inventory: {
            consumables: ["Electrical Wire", "Conduit", "Insulation", "Terminal Blocks"],
            spareParts: ["Switchgear", "Transformers", "Distribution Panels", "Cable Trays"],
            tools: ["Wire Pulling Equipment", "Cable Tester", "Insulation Tester", "Electrical Tools"],
            operationalSupply: ["Backup Electrical Systems", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        }
      ]
    },
    'HVAC': {
      movable: [
        {
          assetName: "Portable Air Conditioner",
          description: "Mobile cooling equipment for temporary climate control.",
          category: "Movable",
          reason: "Can be disconnected and moved to different rooms or locations.",
          inventory: {
            consumables: ["Refrigerant", "Air Filters", "Cleaning Solutions", "Drainage Pans"],
            spareParts: ["Compressor", "Evaporator Coil", "Condenser Fan", "Control Board"],
            tools: ["Refrigerant Gauge", "Multimeter", "Cleaning Kit", "Installation Kit"],
            operationalSupply: ["Backup AC Units", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        },
        {
          assetName: "Portable Heater",
          description: "Mobile heating equipment for temporary use.",
          category: "Movable",
          reason: "Can be easily relocated to different areas as needed.",
          inventory: {
            consumables: ["Heating Elements", "Thermostat Batteries", "Safety Switches", "Cleaning Supplies"],
            spareParts: ["Heating Coil", "Fan Motor", "Control Panel", "Power Cord"],
            tools: ["Multimeter", "Thermometer", "Cleaning Kit", "Installation Tools"],
            operationalSupply: ["Backup Heaters", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        },
        {
          assetName: "HVAC Control Panel",
          description: "Control systems and thermostats for HVAC operation.",
          category: "Movable",
          reason: "Can be detached and relocated for maintenance or replacement.",
          inventory: {
            consumables: ["Thermostat Batteries", "Wire Connectors", "Display Screens", "Control Buttons"],
            spareParts: ["Control Board", "Sensors", "Relays", "Display Unit"],
            tools: ["Multimeter", "Screwdriver Set", "Wire Strippers", "Calibration Kit"],
            operationalSupply: ["Backup Control Panels", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        },
        {
          assetName: "Portable Fans",
          description: "Mobile air circulation equipment.",
          category: "Movable",
          reason: "Can be easily moved between different locations.",
          inventory: {
            consumables: ["Fan Blades", "Motor Oil", "Cleaning Solutions", "Power Cords"],
            spareParts: ["Fan Motor", "Blade Assembly", "Control Switch", "Base Unit"],
            tools: ["Multimeter", "Cleaning Kit", "Installation Tools", "Maintenance Kit"],
            operationalSupply: ["Backup Fans", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        }
      ],
      immovable: [
        {
          assetName: "Central HVAC System",
          description: "Central heating, ventilation, and air conditioning system.",
          category: "Immovable",
          reason: "Permanently installed system with ductwork embedded in building structure.",
          inventory: {
            consumables: ["Refrigerant", "Air Filters", "Duct Insulation", "Cleaning Chemicals"],
            spareParts: ["Central Unit", "Ductwork Sections", "Vents", "Control Systems"],
            tools: ["Refrigerant Recovery Unit", "Duct Cleaning Equipment", "Air Balance Kit", "Installation Tools"],
            operationalSupply: ["Backup HVAC Systems", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        },
        {
          assetName: "Air Handling Units",
          description: "Large HVAC equipment permanently installed in mechanical rooms.",
          category: "Immovable",
          reason: "Permanently installed equipment connected to building infrastructure.",
          inventory: {
            consumables: ["Air Filters", "Belt Drives", "Lubricants", "Cleaning Solutions"],
            spareParts: ["Fan Assembly", "Motor", "Coil Sections", "Control Panel"],
            tools: ["Belt Tension Gauge", "Air Flow Meter", "Cleaning Equipment", "Installation Tools"],
            operationalSupply: ["Backup Air Handlers", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        },
        {
          assetName: "Ductwork System",
          description: "Fixed air distribution system throughout the building.",
          category: "Immovable",
          reason: "Permanently installed ductwork embedded in building structure.",
          inventory: {
            consumables: ["Duct Insulation", "Sealants", "Fasteners", "Cleaning Solutions"],
            spareParts: ["Duct Sections", "Fittings", "Dampers", "Grilles"],
            tools: ["Duct Cleaning Equipment", "Sealant Gun", "Installation Tools", "Air Balance Kit"],
            operationalSupply: ["Backup Ductwork", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        },
        {
          assetName: "Chiller Plant",
          description: "Central cooling equipment for large buildings.",
          category: "Immovable",
          reason: "Permanently installed equipment bolted to foundation.",
          inventory: {
            consumables: ["Refrigerant", "Cooling Water", "Chemicals", "Lubricants"],
            spareParts: ["Compressor", "Heat Exchanger", "Pump Assembly", "Control System"],
            tools: ["Refrigerant Recovery Unit", "Water Testing Kit", "Installation Tools", "Maintenance Kit"],
            operationalSupply: ["Backup Chillers", "Emergency Equipment", "Spare Components", "Safety Equipment"]
          }
        },
        {
          assetName: "Boiler System",
          description: "Central heating equipment for building heating.",
          category: "Immovable",
          reason: "Permanently installed equipment connected to building infrastructure.",
          inventory: {
            consumables: ["Fuel Oil", "Water Treatment", "Chemicals", "Lubricants"],
            spareParts: ["Boiler Assembly", "Burner", "Heat Exchanger", "Control Panel"],
            tools: ["Combustion Analyzer", "Water Testing Kit", "Installation Tools", "Safety Equipment"],
            operationalSupply: ["Backup Boilers", "Emergency Equipment", "Spare Components", "Safety Equipment"]
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
  const [selectedClassificationType, setSelectedClassificationType] = useState<'movable' | 'immovable' | null>(null)
  const [currentView, setCurrentView] = useState<'main' | 'classification'>('main')
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)

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
    setSelectedAsset(asset)
    setSelectedClassificationType('movable')
    setCurrentView('classification')
  }

  const handleImmovableClick = (asset: Asset) => {
    setSelectedAsset(asset)
    setSelectedClassificationType('immovable')
    setCurrentView('classification')
  }

  const handleBackToMain = () => {
    setCurrentView('main')
    setSelectedClassificationType(null)
    setSelectedAsset(null)
  }

  const handleRadioChange = (value: string) => {
    setSelectedMobility(value as 'all' | 'movable' | 'immovable')
    // Don't show classification table on radio button selection
    // Only show when clicking action buttons
  }


  const filteredAssets = getFilteredAssets()

  // Show classification view
  if (currentView === 'classification' && selectedClassificationType && selectedAsset) {
    const assetClassification = getAssetClassification(selectedAsset.assetType, selectedAsset.subcategory || '')
    
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background transition-colors duration-200">
          <div className="p-0">
            <div className="max-w-7xl mx-auto">
              {/* Header with Back Button */}
              <div className="mb-6 px-4 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-semibold text-blue-800 dark:text-blue-200">
                      {selectedAsset.tagId} - {selectedAsset.brand} {selectedAsset.model}
                    </h1>
                    <p className="text-muted-foreground">
                      {selectedClassificationType === 'movable' ? 'Movable' : 'Immovable'} Assets Classification for {selectedAsset.assetType} ({selectedAsset.subcategory})
                    </p>
                  </div>
              <Button 
                variant="outline" 
                onClick={handleBackToMain}
                className="flex items-center space-x-2"
              >
                <ChevronLeft className="w-4 h-4" />
                    <span>Back to Assets</span>
              </Button>
            </div>
          </div>

              {/* Classification Table */}
              <div className="bg-background rounded-lg shadow-sm overflow-hidden border border-border">
              <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                  <thead>
                      <tr className="bg-blue-50 dark:bg-slate-800 border-b border-border">
                        <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                          Asset Name / Type
                        </th>
                        <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                          Description
                        </th>
                        <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                          Category
                        </th>
                        <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                          Inventory
                        </th>
                    </tr>
                  </thead>
                  <tbody>
                      {assetClassification[selectedClassificationType].map((asset: AssetClassificationItem, index: number) => (
                        <tr key={index} className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                          <td className="border border-border px-4 py-3">
                          <div className="flex items-center space-x-2">
                              {selectedClassificationType === 'movable' ? (
                                <Package className="w-4 h-4 text-green-600" />
                            ) : (
                                <Building className="w-4 h-4 text-blue-600" />
                            )}
                              <span className="font-medium text-blue-800 dark:text-blue-200">
                                {asset.assetName}
                              </span>
                          </div>
                        </td>
                          <td className="border border-border px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {asset.description}
                        </td>
                          <td className="border border-border px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              asset.category === 'Movable' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200'
                            }`}>
                              {asset.category}
                            </span>
                        </td>
                          <td className="border border-border px-4 py-3">
                            <div className="space-y-3">
                              {/* Consumables */}
                              <div>
                                <div className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-1">Consumables</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {asset.inventory?.consumables?.join(', ')}
                                </div>
                              </div>
                              
                              {/* Spare Parts */}
                              <div>
                                <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Spare Parts</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {asset.inventory?.spareParts?.join(', ')}
                                </div>
                              </div>
                              
                              {/* Tools */}
                              <div>
                                <div className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">Tools</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {asset.inventory?.tools?.join(', ')}
                                </div>
                              </div>
                              
                              {/* Operational Supply */}
                              <div>
                                <div className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">Operational Supply</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {asset.inventory?.operationalSupply?.join(', ')}
                                </div>
                              </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
                </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

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
                  {filteredAssets.map((asset) => (
                      <tr 
                        key={asset._id} 
                        className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
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
                              className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors flex items-center gap-1"
                              title="View Movable Assets"
                            >
                              <Package className="w-3 h-3" />
                              Movable
                            </button>
                            <button 
                              onClick={() => handleImmovableClick(asset)}
                              className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors flex items-center gap-1"
                              title="View Immovable Assets"
                            >
                              <Building className="w-3 h-3" />
                              Immovable
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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

      </div>
    </ProtectedRoute>
  )

}

