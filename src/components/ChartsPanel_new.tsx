import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingDown, Thermometer, Droplets, Clock, Download } from "lucide-react";
import { ChartData } from "@/pages/Dashboard";

interface ChartsPanelProps {
  chartData: ChartData;
  selectedFloat: string | null;
}

export const ChartsPanel = ({ chartData, selectedFloat }: ChartsPanelProps) => {
  const [activeTab, setActiveTab] = useState("depth-temp");

  // Depth vs Temperature Chart
  const renderDepthTempChart = () => {
    if (!chartData.depthTemp) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <Thermometer className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No temperature profile data available</p>
            <p className="text-sm">Select a float or run a query to view data</p>
          </div>
        </div>
      );
    }

    const data = chartData.depthTemp.depth.map((depth, index) => ({
      depth: -depth, // Invert for oceanographic convention
      temperature: chartData.depthTemp!.temperature[index],
    }));

    return (
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="temperature" 
            label={{ value: 'Temperature (°C)', position: 'insideBottom', offset: -5 }}
            stroke="#e5e7eb"
          />
          <YAxis 
            dataKey="depth"
            label={{ value: 'Depth (m)', angle: -90, position: 'insideLeft' }}
            stroke="#e5e7eb"
          />
          <Tooltip 
            labelFormatter={(value) => `Temperature: ${value}°C`}
            formatter={(value, name) => [`${value}m`, 'Depth']}
            contentStyle={{ 
              backgroundColor: 'rgba(0,0,0,0.8)', 
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px'
            }}
          />
          <Scatter 
            dataKey="temperature" 
            fill="#60a5fa" 
            name={`Float ${selectedFloat || "Profile"}`}
          />
        </ScatterChart>
      </ResponsiveContainer>
    );
  };

  // Depth vs Salinity Chart
  const renderDepthSalinityChart = () => {
    if (!chartData.depthSal) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <Droplets className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No salinity profile data available</p>
            <p className="text-sm">Select a float or run a query to view data</p>
          </div>
        </div>
      );
    }

    const data = chartData.depthSal.depth.map((depth, index) => ({
      depth: -depth, // Invert depth
      salinity: chartData.depthSal!.salinity[index],
    }));

    return (
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="salinity" 
            label={{ value: 'Salinity (PSU)', position: 'insideBottom', offset: -5 }}
            stroke="#e5e7eb"
          />
          <YAxis 
            dataKey="depth"
            label={{ value: 'Depth (m)', angle: -90, position: 'insideLeft' }}
            stroke="#e5e7eb"
          />
          <Tooltip 
            labelFormatter={(value) => `Salinity: ${value} PSU`}
            formatter={(value, name) => [`${value}m`, 'Depth']}
            contentStyle={{ 
              backgroundColor: 'rgba(0,0,0,0.8)', 
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px'
            }}
          />
          <Scatter 
            dataKey="salinity" 
            fill="#10b981" 
            name={`Float ${selectedFloat || "Profile"}`}
          />
        </ScatterChart>
      </ResponsiveContainer>
    );
  };

  // Time Series Chart
  const renderTimeSeriesChart = () => {
    if (!chartData.timeSeries) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No time series data available</p>
            <p className="text-sm">Select a float or run a query to view data</p>
          </div>
        </div>
      );
    }

    const data = chartData.timeSeries.time.map((time, index) => ({
      time: new Date(time).toLocaleDateString(),
      temperature: chartData.timeSeries!.temperature[index],
      salinity: chartData.timeSeries!.salinity[index],
    }));

    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="time" 
            stroke="#e5e7eb"
            label={{ value: 'Time', position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
            yAxisId="temp"
            stroke="#ef4444"
            label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }}
          />
          <YAxis 
            yAxisId="sal"
            orientation="right"
            stroke="#10b981"
            label={{ value: 'Salinity (PSU)', angle: 90, position: 'insideRight' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(0,0,0,0.8)', 
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Line 
            yAxisId="temp"
            type="monotone" 
            dataKey="temperature" 
            stroke="#ef4444" 
            strokeWidth={2}
            name="Temperature (°C)"
            dot={{ fill: "#dc2626", strokeWidth: 2, r: 4 }}
          />
          <Line 
            yAxisId="sal"
            type="monotone" 
            dataKey="salinity" 
            stroke="#10b981" 
            strokeWidth={2}
            name="Salinity (PSU)"
            dot={{ fill: "#059669", strokeWidth: 2, r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const handleExportChart = () => {
    // In a real implementation, this would trigger chart export
    console.log("Exporting chart:", activeTab);
  };

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Data Visualization
          </div>
          <div className="flex items-center gap-2">
            {selectedFloat && (
              <Badge variant="secondary" className="text-xs">
                Float {selectedFloat}
              </Badge>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportChart}
              className="flex items-center gap-1"
            >
              <Download className="h-3 w-3" />
              Export
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="depth-temp" className="flex items-center gap-2">
              <Thermometer className="h-4 w-4" />
              <span className="hidden sm:inline">Depth vs Temp</span>
              <span className="sm:hidden">Temp</span>
            </TabsTrigger>
            <TabsTrigger value="depth-salinity" className="flex items-center gap-2">
              <Droplets className="h-4 w-4" />
              <span className="hidden sm:inline">Depth vs Salinity</span>
              <span className="sm:hidden">Salinity</span>
            </TabsTrigger>
            <TabsTrigger value="time-series" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Time Series</span>
              <span className="sm:hidden">Time</span>
            </TabsTrigger>
          </TabsList>

          <div className="h-[calc(100%-60px)]">
            <TabsContent value="depth-temp" className="h-full m-0">
              {renderDepthTempChart()}
            </TabsContent>

            <TabsContent value="depth-salinity" className="h-full m-0">
              {renderDepthSalinityChart()}
            </TabsContent>

            <TabsContent value="time-series" className="h-full m-0">
              {renderTimeSeriesChart()}
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </div>
  );
};
