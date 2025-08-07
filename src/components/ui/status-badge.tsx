import React from 'react';
import { Badge } from './badge';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': 
        return 'bg-green-500 dark:bg-green-600 text-white';
      case 'inactive': 
        return 'bg-red-500 dark:bg-red-600 text-white';
      case 'maintenance': 
        return 'bg-yellow-500 dark:bg-yellow-600 text-white';
      case 'retired': 
        return 'bg-gray-500 dark:bg-gray-600 text-white';
      case 'intialization': 
        return 'bg-blue-500 dark:bg-blue-600 text-white';
      default: 
        return 'bg-gray-500 dark:bg-gray-600 text-white';
    }
  };

  return (
    <Badge className={`font-medium text-xs px-2 py-1 rounded-full ${getStatusVariant(status)} ${className}`}>
      {status}
    </Badge>
  );
}; 