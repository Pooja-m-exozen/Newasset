"use client"

import React from 'react'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Search, Package, Building, Archive, MapPin, Plus } from 'lucide-react'

interface SearchFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  selectedMobility: 'all' | 'movable' | 'immovable' | 'inventory' | 'far'
  onMobilityChange: (value: 'all' | 'movable' | 'immovable' | 'inventory' | 'far') => void
  onAddAsset: () => void
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedMobility,
  onMobilityChange,
  onAddAsset
}) => {
  return (
    <div className="mb-4 px-4 py-2">
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search assets by ID, brand, model, or subcategory..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10"
          />
        </div>

        {/* Mobile Layout for Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Mobility Filter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <Label className="text-sm font-medium text-blue-800 dark:text-blue-200 whitespace-nowrap">Mobility:</Label>
            <RadioGroup
              value={selectedMobility}
              onValueChange={(value) => onMobilityChange(value as 'all' | 'movable' | 'immovable' | 'inventory' | 'far')}
              className="flex flex-col sm:flex-row gap-2 sm:gap-4"
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
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="inventory" id="inventory" />
                <Label htmlFor="inventory" className="cursor-pointer flex items-center space-x-1 text-sm">
                  <Archive className="w-4 h-4" />
                  <span>Inventory</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="far" id="far" />
                <Label htmlFor="far" className="cursor-pointer flex items-center space-x-1 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>FAR</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
           
          {/* Add Asset Button */}
          <Button
            onClick={onAddAsset}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Add Asset
          </Button>
        </div>
      </div>
    </div>
  )
}

