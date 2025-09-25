import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { X, ChartLine, Globe, Thermometer, Droplets } from 'lucide-react';
import { FloatData } from '@/contexts/FloatChatContext';
import { Earth3DGlobe } from '@/components/Earth3DGlobe';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    depth: typeof profile.depth === 'number' ? profile.depth : 0,
    temperature: typeof profile.temperature === 'number' ? profile.temperature : 0,
  })).sort((a, b) => a.depth - b.depth);

  const depthSalinityData = floatData.profiles.map(profile => ({
    depth: typeof profile.depth === 'number' ? profile.depth : 0,
    salinity: typeof profile.salinity === 'number' ? profile.salinity : 0,
  })).sort((a, b) => a.depth - b.depth);

  const timeSeriesData = floatData.profiles.map(profile => ({
    time: new Date(profile.timestamp).getTime(),
    temperature: typeof profile.temperature === 'number' ? profile.temperature : 0,
    salinity: typeof profile.salinity === 'number' ? profile.salinity : 0,
    depth: typeof profile.depth === 'number' ? profile.depth : 0,
  })).sort((a, b) => a.time - b.time);

  // Using 3D Globe instead of 2D map - no need for positioning calculations

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
              <TabsTrigger value="map" className="text-xs">Globe</TabsTrigger>
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
                    <Globe className="w-4 h-4 text-[#00d1c1]" />
                    <span>3D Globe Locations</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-80 rounded-lg overflow-hidden">
                    <Earth3DGlobe
                      floatData={[floatData]}
                      className="w-full h-full"
                    />
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
