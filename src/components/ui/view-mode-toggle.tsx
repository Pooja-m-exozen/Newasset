import React from 'react';
import { Button } from './button';
import { Grid3X3, List } from 'lucide-react';

interface ViewModeToggleProps {
  viewMode: 'table' | 'grid';
  onViewModeChange: (mode: 'table' | 'grid') => void;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  viewMode,
  onViewModeChange
}) => {
  return (
    <div className="flex border rounded-md">
      <Button
        variant={viewMode === 'table' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('table')}
        className="rounded-r-none"
      >
        <List className="w-4 h-4" />
      </Button>
      <Button
        variant={viewMode === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('grid')}
        className="rounded-l-none"
      >
        <Grid3X3 className="w-4 h-4" />
      </Button>
    </div>
  );
}; 