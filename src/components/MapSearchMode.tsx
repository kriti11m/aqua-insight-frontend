import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Search, X } from 'lucide-react';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapSearchModeProps {
  onSearch: (query: string, coordinates: { lat: number; lon: number; radius: number }) => void;
  onClose: () => void;
  isSearching?: boolean;
}

interface SelectedLocation {
  lat: number;
  lon: number;
}

const RADIUS_OPTIONS = [
  { value: '1', label: '1 km' },
  { value: '5', label: '5 km' },
  { value: '10', label: '10 km' },
  { value: '25', label: '25 km' },
  { value: '50', label: '50 km' },
  { value: '100', label: '100 km' },
];

// Component to handle map click events
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lon: number) => void }) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    },
  });
  return null;
}

export const MapSearchMode: React.FC<MapSearchModeProps> = ({ 
  onSearch, 
  onClose, 
  isSearching = false 
}) => {
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [radius, setRadius] = useState<string>('10');
  const [manualLat, setManualLat] = useState<string>('');
  const [manualLon, setManualLon] = useState<string>('');
  const [queryPreview, setQueryPreview] = useState<string>('');

  // Update query preview when location or radius changes
  useEffect(() => {
    if (selectedLocation) {
      const radiusKm = parseInt(radius);
      const lat = selectedLocation.lat.toFixed(4);
      const lon = selectedLocation.lon.toFixed(4);
      const preview = `Show oceanographic data near latitude ${lat}°, longitude ${lon}° within ${radiusKm} km radius`;
      setQueryPreview(preview);
    } else {
      setQueryPreview('');
    }
  }, [selectedLocation, radius]);

  const handleLocationSelect = (lat: number, lon: number) => {
    setSelectedLocation({ lat, lon });
    setManualLat(lat.toFixed(4));
    setManualLon(lon.toFixed(4));
  };

  const handleManualCoordinates = () => {
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);
    
    if (isNaN(lat) || isNaN(lon)) {
      alert('Please enter valid coordinates');
      return;
    }
    
    if (lat < -90 || lat > 90) {
      alert('Latitude must be between -90 and 90 degrees');
      return;
    }
    
    if (lon < -180 || lon > 180) {
      alert('Longitude must be between -180 and 180 degrees');
      return;
    }
    
    setSelectedLocation({ lat, lon });
  };

  const handleSearch = () => {
    if (!selectedLocation) {
      alert('Please select a location on the map first');
      return;
    }
    
    const radiusKm = parseInt(radius);
    onSearch(queryPreview, {
      lat: selectedLocation.lat,
      lon: selectedLocation.lon,
      radius: radiusKm
    });
  };

  const handleClearSelection = () => {
    setSelectedLocation(null);
    setManualLat('');
    setManualLon('');
    setQueryPreview('');
  };

  return (
    <div className="w-full h-[500px] flex flex-col space-y-3 bg-white border border-gray-200 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Search by Location
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Map Container */}
      <div className="relative flex-1 min-h-0">
        <div className="h-48 w-full rounded-lg overflow-hidden border">
          <MapContainer
            center={[0, 0]}
            zoom={2}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapClickHandler onLocationSelect={handleLocationSelect} />
            
            {selectedLocation && (
              <>
                <Marker position={[selectedLocation.lat, selectedLocation.lon]} />
                <Circle
                  center={[selectedLocation.lat, selectedLocation.lon]}
                  radius={parseInt(radius) * 1000} // Convert km to meters
                  fillColor="blue"
                  fillOpacity={0.1}
                  color="blue"
                  weight={2}
                />
              </>
            )}
          </MapContainer>
          
          {/* Map overlay instructions */}
          {!selectedLocation && (
            <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center pointer-events-none">
              <div className="bg-white px-4 py-2 rounded-lg shadow-lg">
                <p className="text-sm text-gray-700">Click anywhere on the map to select a location</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls - Compact single row */}
      <div className="flex-shrink-0 bg-gray-50 rounded-lg p-3">
        <div className="grid grid-cols-1 gap-2">
          {/* Manual coordinates */}
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-600 w-16">Coords:</span>
            <Input
              type="number"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              placeholder="Lat"
              step="0.0001"
              className="text-xs h-8 w-20"
            />
            <Input
              type="number"
              value={manualLon}
              onChange={(e) => setManualLon(e.target.value)}
              placeholder="Lon"
              step="0.0001"
              className="text-xs h-8 w-20"
            />
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleManualCoordinates}
              className="h-8 px-2 text-xs"
            >
              Set
            </Button>
          </div>
          
          {/* Radius and clear */}
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-600 w-16">Radius:</span>
            <Select value={radius} onValueChange={setRadius}>
              <SelectTrigger className="text-xs h-8 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RADIUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedLocation && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleClearSelection}
                className="h-8 px-2 text-xs"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Search Action - Fixed at bottom */}
      {selectedLocation && (
        <div className="flex-shrink-0 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-center mb-2">
            <p className="font-medium text-blue-800 text-sm">
              📍 {selectedLocation.lat.toFixed(4)}°, {selectedLocation.lon.toFixed(4)}° (±{radius} km)
            </p>
          </div>
          <Button 
            onClick={handleSearch} 
            disabled={!selectedLocation || isSearching}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            <Search className="w-4 h-4 mr-2" />
            {isSearching ? 'Searching...' : 'Search This Location'}
          </Button>
        </div>
      )}

      {/* Help text when no location selected */}
      {!selectedLocation && (
        <div className="flex-shrink-0 text-center text-sm text-gray-500">
          Click anywhere on the map or enter coordinates manually
        </div>
      )}
    </div>
  );
};