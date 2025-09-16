import { useState } from "react";
import { MapView } from "@/components/MapView";
import { ChartsPanel } from "@/components/ChartsPanel";
import { DataTable } from "@/components/DataTable";
import { ExportPanel } from "@/components/ExportPanel";
import { TryFloatChatButton } from "@/components/TryFloatChatButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, BarChart3, Map, Database } from "lucide-react";

export interface FloatData {
  id: string;
  lat: number;
  lon: number;
  time: string;
  temperature?: number;
  salinity?: number;
  depth?: number;
}

export interface ChartData {
  depthTemp?: { depth: number[]; temperature: number[] };
  depthSal?: { depth: number[]; salinity: number[] };
  timeSeries?: { time: string[]; temperature: number[]; salinity: number[] };
}

const Dashboard = () => {
  const [selectedFloat, setSelectedFloat] = useState<string | null>(null);
  const [floatData, setFloatData] = useState<FloatData[]>([]);
  const [chartData, setChartData] = useState<ChartData>({});
  const [tableData, setTableData] = useState<FloatData[]>([]);

  const handleFloatSelect = (floatId: string) => {
    setSelectedFloat(floatId);
    // This will be connected to API calls later
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            FloatChat Dashboard
          </h1>
          <p className="text-muted-foreground mb-4">
            Explore ARGO float data with natural language queries and interactive visualizations
          </p>
          
          {/* FloatChat Integration */}
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 p-4 rounded-lg border border-cyan-200 dark:border-cyan-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MessageCircle className="w-8 h-8 text-cyan-600" />
                <div>
                  <h3 className="font-semibold text-foreground">AI-Powered Data Analysis</h3>
                  <p className="text-sm text-muted-foreground">Chat with your oceanographic data using natural language</p>
                </div>
              </div>
              <TryFloatChatButton />
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Map View */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Map className="w-5 h-5" />
                <span>Float Locations</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <MapView
                floats={floatData}
                selectedFloat={selectedFloat}
                onFloatSelect={handleFloatSelect}
              />
            </CardContent>
          </Card>

          {/* Charts Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Data Visualizations</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ChartsPanel
                chartData={chartData}
                selectedFloat={selectedFloat}
              />
            </CardContent>
          </Card>

          {/* Data Table */}
          <Card className="xl:col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>Data Table</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <DataTable
                data={tableData}
                onRowSelect={handleFloatSelect}
                selectedFloat={selectedFloat}
              />
            </CardContent>
          </Card>

          {/* Export Panel */}
          <Card className="lg:col-span-2 xl:col-span-3">
            <ExportPanel
              selectedFloat={selectedFloat}
              data={tableData}
            />
          </Card>
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-cyan-600" />
              <h4 className="font-medium mb-1">1. Open FloatChat</h4>
              <p className="text-sm text-muted-foreground">Click "Try FloatChat" to start an AI conversation</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Database className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h4 className="font-medium mb-1">2. Upload or Query Data</h4>
              <p className="text-sm text-muted-foreground">Ask questions or upload CSV/JSON files</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <h4 className="font-medium mb-1">3. Visualize Results</h4>
              <p className="text-sm text-muted-foreground">Click "Visualize" to see charts and maps</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
