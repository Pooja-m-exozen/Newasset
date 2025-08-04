import React from 'react';
import { Badge } from './badge';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'default';
      case 'inactive': return 'destructive';
      case 'maintenance': return 'secondary';
      case 'intialization': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <Badge variant={getStatusVariant(status) as any} className={`font-medium text-xs ${className}`}>
      {status}
    </Badge>
  );
}; 