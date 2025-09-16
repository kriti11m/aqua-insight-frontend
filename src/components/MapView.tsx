import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import { Icon, LatLng } from "leaflet";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Activity, Eye } from "lucide-react";
import { FloatData } from "@/pages/Dashboard";
import { ApiService } from "@/lib/api";
import "leaflet/dist/leaflet.css";

// Fix for default markers in React-Leaflet
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface MapViewProps {
  floats: FloatData[];
  selectedFloat: string | null;
  onFloatSelect: (floatId: string) => void;
}

export const MapView = ({ floats, selectedFloat, onFloatSelect }: MapViewProps) => {
  const [trajectories, setTrajectories] = useState<{ [key: string]: LatLng[] }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Default center (Gulf of Mexico)
  const defaultCenter: [number, number] = [25.0, -80.0];
  const defaultZoom = 6;

  useEffect(() => {
    // Load initial float data if none provided
    if (floats.length === 0) {
      loadInitialFloats();
    }
  }, [floats.length]);

  const loadInitialFloats = async () => {
    setIsLoading(true);
    try {
      await ApiService.getFloats();
      // In a real implementation, this would update the parent component's state
    } catch (error) {
      console.error("Error loading initial floats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrajectory = async (floatId: string) => {
    try {
      const floatData = await ApiService.getFloatData(floatId);
      // In a real implementation, this would be trajectory data with lat/lon points over time
      // For now, we'll create a mock trajectory
      const mockTrajectory = [
        new LatLng(25.0 + Math.random() * 2, -80.0 + Math.random() * 2),
        new LatLng(25.5 + Math.random() * 2, -79.5 + Math.random() * 2),
        new LatLng(26.0 + Math.random() * 2, -79.0 + Math.random() * 2),
      ];
      setTrajectories(prev => ({ ...prev, [floatId]: mockTrajectory }));
    } catch (error) {
      console.error("Error loading trajectory:", error);
    }
  };

  const handleMarkerClick = (float: FloatData) => {
    onFloatSelect(float.id);
    if (!trajectories[float.id]) {
      loadTrajectory(float.id);
    }
  };

  const getMarkerIcon = (floatId: string, isSelected: boolean) => {
    return new Icon({
      iconUrl: markerIcon,
      iconRetinaUrl: markerIcon2x,
      shadowUrl: markerShadow,
      iconSize: isSelected ? [32, 48] : [25, 41],
      iconAnchor: isSelected ? [16, 48] : [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
      className: isSelected ? 'selected-marker' : '',
    });
  };

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Float Locations
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {floats.length} floats
            </Badge>
            {isLoading && (
              <Badge variant="outline" className="text-xs">
                Loading...
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 p-2">
        <div className="h-full rounded-md overflow-hidden border">
          <MapContainer
            center={defaultCenter}
            zoom={defaultZoom}
            style={{ height: "100%", width: "100%" }}
            className="leaflet-container"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Float Markers */}
            {floats.map((float) => (
              <Marker
                key={float.id}
                position={[float.lat, float.lon]}
                icon={getMarkerIcon(float.id, selectedFloat === float.id)}
                eventHandlers={{
                  click: () => handleMarkerClick(float),
                }}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <h3 className="font-semibold text-base mb-2">
                      Float {float.id}
                    </h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Latitude:</span>
                        <span>{float.lat.toFixed(3)}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Longitude:</span>
                        <span>{float.lon.toFixed(3)}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Update:</span>
                        <span>{new Date(float.time).toLocaleDateString()}</span>
                      </div>
                      {float.temperature && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Temperature:</span>
                          <span>{float.temperature.toFixed(1)}°C</span>
                        </div>
                      )}
                      {float.salinity && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Salinity:</span>
                          <span>{float.salinity.toFixed(2)} PSU</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => onFloatSelect(float.id)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        View Profile
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => loadTrajectory(float.id)}
                        className="flex items-center gap-1"
                      >
                        <Activity className="h-3 w-3" />
                        Show Path
                      </Button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Float Trajectories */}
            {Object.entries(trajectories).map(([floatId, path]) => (
              <Polyline
                key={`trajectory-${floatId}`}
                positions={path}
                color={selectedFloat === floatId ? "#ef4444" : "#3b82f6"}
                weight={selectedFloat === floatId ? 3 : 2}
                opacity={0.7}
              />
            ))}
          </MapContainer>
        </div>
      </CardContent>
    </div>
  );
};
