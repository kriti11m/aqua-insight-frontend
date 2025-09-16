import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { X, ChartLine, Map, Thermometer, Droplets } from 'lucide-react';
import { FloatData } from '@/contexts/FloatChatContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface DataVisualizationPanelProps {
  floatData: FloatData;
  isOpen: boolean;
  onClose: () => void;
}

export const DataVisualizationPanel: React.FC<DataVisualizationPanelProps> = ({
  floatData,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !floatData) return null;

  // Prepare data for charts
  const depthTempData = floatData.profiles.map(profile => ({
    depth: profile.depth,
    temperature: profile.temperature,
  })).sort((a, b) => a.depth - b.depth);

  const depthSalinityData = floatData.profiles.map(profile => ({
    depth: profile.depth,
    salinity: profile.salinity,
  })).sort((a, b) => a.depth - b.depth);

  const timeSeriesData = floatData.profiles.map(profile => ({
    time: new Date(profile.timestamp).getTime(),
    temperature: profile.temperature,
    salinity: profile.salinity,
    depth: profile.depth,
  })).sort((a, b) => a.time - b.time);

  // Get unique positions for map
  const positions = floatData.profiles.reduce((acc, profile) => {
    const key = `${profile.latitude.toFixed(4)}_${profile.longitude.toFixed(4)}`;
    if (!acc[key]) {
      acc[key] = {
        lat: profile.latitude,
        lng: profile.longitude,
        count: 1,
        avgTemp: profile.temperature,
        avgSalinity: profile.salinity,
      };
    } else {
      acc[key].count++;
      acc[key].avgTemp = (acc[key].avgTemp + profile.temperature) / 2;
      acc[key].avgSalinity = (acc[key].avgSalinity + profile.salinity) / 2;
    }
    return acc;
  }, {} as Record<string, any>);

  const mapPositions = Object.values(positions);
  const centerLat = mapPositions.reduce((sum, pos) => sum + pos.lat, 0) / mapPositions.length;
  const centerLng = mapPositions.reduce((sum, pos) => sum + pos.lng, 0) / mapPositions.length;

  const formatTimeAxis = (tickItem: number) => {
    return new Date(tickItem).toLocaleDateString();
  };

  return (
    <div className={`fixed top-0 right-0 h-full bg-gradient-to-b from-slate-900 to-slate-800 border-l border-slate-600 shadow-2xl transform transition-transform duration-300 ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    } w-96 z-50`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-600">
          <div className="flex items-center space-x-2">
            <ChartLine className="w-5 h-5 text-[#00d1c1]" />
            <h2 className="text-lg font-semibold text-white">Data Visualization</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="text-sm text-slate-300 mb-4">
            <h3 className="font-medium text-white mb-1">{floatData.name}</h3>
            <p>{floatData.profiles.length} profiles</p>
            {floatData.metadata?.platform_id && (
              <p>Platform: {floatData.metadata.platform_id}</p>
            )}
          </div>

          <Tabs defaultValue="depth-temp" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-800">
              <TabsTrigger value="depth-temp" className="text-xs">Profiles</TabsTrigger>
              <TabsTrigger value="map" className="text-xs">Map</TabsTrigger>
            </TabsList>

            <TabsContent value="depth-temp" className="space-y-4">
              {/* Depth vs Temperature */}
              <Card className="bg-slate-800/50 border-slate-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white flex items-center space-x-2">
                    <Thermometer className="w-4 h-4 text-[#00d1c1]" />
                    <span>Depth vs Temperature</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={depthTempData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis 
                        dataKey="temperature" 
                        stroke="#94a3b8"
                        fontSize={10}
                        label={{ value: 'Temperature (°C)', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fontSize: '10px', fill: '#94a3b8' } }}
                      />
                      <YAxis 
                        dataKey="depth" 
                        reversed
                        stroke="#94a3b8"
                        fontSize={10}
                        label={{ value: 'Depth (m)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: '10px', fill: '#94a3b8' } }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid #475569',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}
                        labelStyle={{ color: '#00d1c1' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="temperature" 
                        stroke="#00d1c1" 
                        strokeWidth={2}
                        dot={{ r: 2, fill: '#00d1c1' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Depth vs Salinity */}
              <Card className="bg-slate-800/50 border-slate-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white flex items-center space-x-2">
                    <Droplets className="w-4 h-4 text-[#00d1c1]" />
                    <span>Depth vs Salinity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={depthSalinityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis 
                        dataKey="salinity" 
                        stroke="#94a3b8"
                        fontSize={10}
                        label={{ value: 'Salinity (PSU)', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fontSize: '10px', fill: '#94a3b8' } }}
                      />
                      <YAxis 
                        dataKey="depth" 
                        reversed
                        stroke="#94a3b8"
                        fontSize={10}
                        label={{ value: 'Depth (m)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: '10px', fill: '#94a3b8' } }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid #475569',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}
                        labelStyle={{ color: '#00d1c1' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="salinity" 
                        stroke="#00a3a3" 
                        strokeWidth={2}
                        dot={{ r: 2, fill: '#00a3a3' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Time Series */}
              {timeSeriesData.length > 1 && (
                <Card className="bg-slate-800/50 border-slate-600">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-white">Time Series</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={120}>
                      <LineChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                        <XAxis 
                          dataKey="time" 
                          stroke="#94a3b8"
                          fontSize={8}
                          tickFormatter={formatTimeAxis}
                        />
                        <YAxis stroke="#94a3b8" fontSize={10} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1e293b', 
                            border: '1px solid #475569',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}
                          labelFormatter={(value) => new Date(value).toLocaleString()}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="temperature" 
                          stroke="#00d1c1" 
                          strokeWidth={1}
                          name="Temperature (°C)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="map">
              <Card className="bg-slate-800/50 border-slate-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white flex items-center space-x-2">
                    <Map className="w-4 h-4 text-[#00d1c1]" />
                    <span>Locations</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-80 rounded-lg overflow-hidden">
                    <MapContainer
                      center={[centerLat, centerLng]}
                      zoom={6}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {mapPositions.map((position, index) => (
                        <Marker key={index} position={[position.lat, position.lng]}>
                          <Popup>
                            <div className="text-xs">
                              <p><strong>Location:</strong> {position.lat.toFixed(4)}, {position.lng.toFixed(4)}</p>
                              <p><strong>Profiles:</strong> {position.count}</p>
                              <p><strong>Avg Temp:</strong> {position.avgTemp.toFixed(1)}°C</p>
                              <p><strong>Avg Salinity:</strong> {position.avgSalinity.toFixed(1)} PSU</p>
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
