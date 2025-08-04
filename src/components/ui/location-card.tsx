import React from 'react';
import { Button } from './button';
import { Badge } from './badge';
import { MapPin, Edit, Trash2, Eye, Clock } from 'lucide-react';
import { Location } from '../../lib/location';

interface LocationCardProps {
  location: Location;
  onView: (location: Location) => void;
  onEdit: (location: Location) => void;
  onDelete: (location: Location) => void;
}

const getTypeColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'building': return 'bg-blue-100 text-blue-800';
    case 'floor': return 'bg-purple-100 text-purple-800';
    case 'room': return 'bg-green-100 text-green-800';
    case 'area': return 'bg-orange-100 text-orange-800';
    case 'zone': return 'bg-pink-100 text-pink-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const LocationCard: React.FC<LocationCardProps> = ({
  location,
  onView,
  onEdit,
  onDelete
}) => {
  return (
    <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-lg">
            <MapPin className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h4 className="font-semibold text-gray-900">{location.name}</h4>
              <Badge className={`${getTypeColor(location.type)} px-2 py-0.5 text-xs`}>
                {location.type}
              </Badge>
            </div>
            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <MapPin className="w-3 h-3" />
                <span>{location.address}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{formatDate(location.createdAt)}</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Coordinates: {location.coordinates.latitude.toFixed(4)}, {location.coordinates.longitude.toFixed(4)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 hover:bg-blue-50"
            onClick={() => onView(location)}
          >
            <Eye className="w-4 h-4 text-blue-600" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 hover:bg-green-50"
            onClick={() => onEdit(location)}
          >
            <Edit className="w-4 h-4 text-green-600" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 hover:bg-red-50"
            onClick={() => onDelete(location)}
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      </div>
    </div>
  );
}; 