'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { X, MapPin, Loader2 } from 'lucide-react';
import { Location } from '../../lib/location';

// Google Maps types
declare global {
  interface Window {
    google: {
      maps: {
        Map: new (element: HTMLElement, options: GoogleMapOptions) => GoogleMap;
        Marker: new (options: GoogleMarkerOptions) => GoogleMarker;
        LatLngBounds: new () => {
          extend: (position: { lat: number; lng: number }) => void;
        };
        Size: new (width: number, height: number) => {
          width: number;
          height: number;
        };
        Point: new (x: number, y: number) => {
          x: number;
          y: number;
        };
        InfoWindow: new (options: GoogleInfoWindowOptions) => {
          open: (map: GoogleMap, marker: GoogleMarker) => void;
        };
        MapTypeId: {
          ROADMAP: string;
        };
      };
    };
  }
}

// Type aliases for cleaner usage
type GoogleMapConstructor = Window['google']['maps']['Map'];
type GoogleMarkerConstructor = Window['google']['maps']['Marker'];
type GoogleLatLngBoundsConstructor = Window['google']['maps']['LatLngBounds'];
type GoogleSizeConstructor = Window['google']['maps']['Size'];
type GooglePointConstructor = Window['google']['maps']['Point'];
type GoogleInfoWindowConstructor = Window['google']['maps']['InfoWindow'];

interface GoogleMap {
  setCenter: (center: { lat: number; lng: number }) => void;
  setZoom: (zoom: number) => void;
  getCenter: () => { lat: () => number; lng: () => number };
  getZoom: () => number;
}

interface GoogleMarker {
  setPosition: (position: { lat: number; lng: number }) => void;
  setMap: (map: GoogleMap | null) => void;
  addListener: (event: string, callback: () => void) => void;
}

interface GoogleMapOptions {
  center: { lat: number; lng: number };
  zoom: number;
  mapTypeId: string;
  styles?: Array<{
    featureType: string;
    elementType: string;
    stylers: Array<{ visibility: string }>;
  }>;
}

interface GoogleMarkerOptions {
  position: { lat: number; lng: number };
  map: GoogleMap;
  title: string;
  icon?: {
    url: string;
    scaledSize: { width: number; height: number };
    anchor: { x: number; y: number };
  };
}

interface GoogleInfoWindowOptions {
  content: string;
}


interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: Location[];
}

export const MapModal: React.FC<MapModalProps> = ({ isOpen, onClose, locations }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<GoogleMap | null>(null);
  const markersRef = useRef<GoogleMarker[]>([]);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Helper function to get Google Maps API
  const getGoogleMapsAPI = () => {
    return window.google;
  };

  const loadGoogleMapsAPI = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (getGoogleMapsAPI() && getGoogleMapsAPI().maps) {
        console.log('Google Maps API already loaded');
        resolve();
        return;
      }

      const script = document.createElement('script');
      const apiKey = 'AIzaSyCqvcEKoqwRG5PBDIVp-MjHyjXKT3s4KY4';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      console.log('Loading script:', script.src);
      
      script.onload = () => {
        console.log('Google Maps API loaded successfully');
        resolve();
      };
      script.onerror = (error) => {
        console.error('Failed to load Google Maps API:', error);
        reject(new Error('Failed to load Google Maps API'));
      };
      
      document.head.appendChild(script);
    });
  }, []);


  const initializeGoogleMap = useCallback(async () => {
    if (!mapRef.current || locations.length === 0) return;

    setMapLoading(true);
    setMapError(null);

    try {
      console.log('Initializing Google Map...');
      console.log('API Key:', process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
      console.log('Locations:', locations);
      
      // Load Google Maps API if not already loaded
      if (!getGoogleMapsAPI() || !getGoogleMapsAPI().maps) {
        console.log('Loading Google Maps API...');
        await loadGoogleMapsAPI();
      }

      // Calculate center point
      const latitudes = locations.map(loc => loc.coordinates.latitude);
      const longitudes = locations.map(loc => loc.coordinates.longitude);
      const centerLat = latitudes.reduce((sum, lat) => sum + lat, 0) / latitudes.length;
      const centerLng = longitudes.reduce((sum, lng) => sum + lng, 0) / longitudes.length;

      // Initialize map
      const map = new (getGoogleMapsAPI().maps.Map as any)(mapRef.current, {
        center: { lat: centerLat, lng: centerLng },
        zoom: 12,
        mapTypeId: getGoogleMapsAPI().maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      mapInstanceRef.current = map;

      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      // Add markers for each location
      const bounds = new (getGoogleMapsAPI().maps.LatLngBounds as GoogleLatLngBoundsConstructor)();
      
      locations.forEach((location) => {
        const position = {
          lat: location.coordinates.latitude,
          lng: location.coordinates.longitude
        };

        // Create custom marker icon
        const markerColor = getTypeColor(location.type);
        console.log(`Creating marker for ${location.type} with color: ${markerColor}`);
        
        const markerIcon = {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="${markerColor}" stroke="white" stroke-width="2"/>
              <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">📍</text>
            </svg>
          `)}`,
          scaledSize: new (getGoogleMapsAPI().maps.Size as GoogleSizeConstructor)(32, 32),
          anchor: new (getGoogleMapsAPI().maps.Point as GooglePointConstructor)(16, 16)
        };

        const marker = new (getGoogleMapsAPI().maps.Marker as GoogleMarkerConstructor)({
          position,
          map,
          title: location.name,
          icon: markerIcon
        });

        // Create info window
        const infoWindow = new (getGoogleMapsAPI().maps.InfoWindow as GoogleInfoWindowConstructor)({
          content: `
            <div style="padding: 8px; max-width: 250px;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1f2937;">${location.name}</h3>
              <div style="margin-bottom: 4px;">
                <span style="background: ${getTypeColor(location.type)}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
                  ${location.type}
                </span>
              </div>
              <p style="margin: 8px 0; font-size: 14px; color: #6b7280; line-height: 1.4;">${location.address}</p>
              <p style="margin: 4px 0; font-size: 12px; color: #9ca3af;">
                📍 ${location.coordinates.latitude.toFixed(4)}, ${location.coordinates.longitude.toFixed(4)}
              </p>
            </div>
          `
        });

        // Add click listener to marker
        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        markersRef.current.push(marker);
        bounds.extend(position);
      });

      // Fit map to show all markers
      if (locations.length > 1) {
        map.fitBounds(bounds);
      }

    } catch (error) {
      console.error('Error initializing Google Map:', error);
      const errorMessage = 'Failed to load map. Please check your internet connection and API key.';
      setMapError(errorMessage);
    } finally {
      setMapLoading(false);
    }
  }, [locations, loadGoogleMapsAPI]);

  useEffect(() => {
    if (isOpen && mapRef.current && locations.length > 0) {
      initializeGoogleMap();
    }

    return () => {
      // Cleanup map when modal closes
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, [isOpen, locations, initializeGoogleMap]);

  const getTypeColor = (type: string) => {
    // Create a hash-based color for any type
    const colors = [
      '#3b82f6', // Blue
      '#f97316', // Orange  
      '#22c55e', // Green
      '#a855f7', // Purple
      '#6b7280', // Gray
      '#ef4444', // Red
      '#f59e0b', // Yellow
      '#10b981', // Emerald
      '#8b5cf6', // Violet
      '#06b6d4'  // Cyan
    ];
    
    // Use type name to generate consistent color
    let hash = 0;
    for (let i = 0; i < type.length; i++) {
      hash = type.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Location Map View
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {locations.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Locations Found</h3>
                <p className="text-muted-foreground">Add some locations to view them on the map.</p>
              </div>
            </div>
          ) : mapError ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <MapPin className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-red-600">Map Error</h3>
                <p className="text-muted-foreground mb-4">{mapError}</p>
                <Button 
                  onClick={() => initializeGoogleMap()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground mb-4">
                Showing {locations.length} location{locations.length !== 1 ? 's' : ''} on Google Maps. Click on markers to view details.
              </div>
              
              {/* Legend */}
              <div className="flex flex-wrap gap-4 p-4 bg-muted rounded-lg">
                <div className="text-sm font-medium">Legend:</div>
                {Array.from(new Set(locations.map(loc => loc.type))).map(type => (
                  <div key={type} className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: getTypeColor(type) }}
                    />
                    <span className="text-sm">{type}</span>
                  </div>
                ))}
              </div>

              {/* Map Container */}
              <div className="relative">
                {mapLoading && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      <span className="text-muted-foreground">Loading Google Maps...</span>
                    </div>
                  </div>
                )}
                <div 
                  ref={mapRef} 
                  className="w-full h-[500px] rounded-lg border border-border"
                  style={{ minHeight: '500px' }}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};