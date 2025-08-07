import React from 'react';
import { Badge } from './badge';

interface PriorityBadgeProps {
  priority: string;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className = '' }) => {
  const getPriorityVariant = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': 
        return 'bg-red-500 dark:bg-red-600 text-white';
      case 'medium': 
        return 'bg-yellow-500 dark:bg-yellow-600 text-white';
      case 'low': 
        return 'bg-green-500 dark:bg-green-600 text-white';
      case 'critical': 
        return 'bg-red-700 dark:bg-red-800 text-white';
      default: 
        return 'bg-gray-500 dark:bg-gray-600 text-white';
    }
  };

  return (
    <Badge className={`font-medium text-xs px-2 py-1 rounded-full ${getPriorityVariant(priority)} ${className}`}>
      {priority}
    </Badge>
  );
}; 