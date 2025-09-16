import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  FileText,
  Database,
  Code,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { FloatData } from "@/pages/Dashboard";
import { ApiService } from "@/lib/api";

interface ExportPanelProps {
  selectedFloat: string | null;
  data: FloatData[];
}

type ExportFormat = "csv" | "netcdf" | "ascii";
type ExportStatus = "idle" | "loading" | "success" | "error";

export const ExportPanel = ({ selectedFloat, data }: ExportPanelProps) => {
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [exportStatus, setExportStatus] = useState<ExportStatus>("idle");
  const [exportProgress, setExportProgress] = useState(0);
  const [lastExport, setLastExport] = useState<string | null>(null);

  const formatOptions = [
    {
      value: "csv",
      label: "CSV",
      description: "Comma-separated values",
      icon: <FileText className="h-4 w-4" />,
      size: "Small",
    },
    {
      value: "netcdf",
      label: "NetCDF",
      description: "Network Common Data Form",
      icon: <Database className="h-4 w-4" />,
      size: "Large",
    },
    {
      value: "ascii",
      label: "ASCII",
      description: "Plain text format",
      icon: <Code className="h-4 w-4" />,
      size: "Medium",
    },
  ];

  const getFormatInfo = (format: ExportFormat) => {
    return formatOptions.find(option => option.value === format);
  };

  const simulateProgress = () => {
    setExportProgress(0);
    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
    return interval;
  };

  const handleExport = async () => {
    if (!selectedFloat) {
      setExportStatus("error");
      return;
    }

    setExportStatus("loading");
    const progressInterval = simulateProgress();

    try {
      const blob = await ApiService.exportFloatData(selectedFloat, exportFormat);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `float_${selectedFloat}_data.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      clearInterval(progressInterval);
      setExportProgress(100);
      setExportStatus("success");
      setLastExport(new Date().toLocaleString());
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setExportStatus("idle");
        setExportProgress(0);
      }, 3000);

    } catch (error) {
      console.error("Export failed:", error);
      clearInterval(progressInterval);
      setExportStatus("error");
      setTimeout(() => {
        setExportStatus("idle");
        setExportProgress(0);
      }, 3000);
    }
  };

  const handleExportAll = async () => {
    if (data.length === 0) {
      setExportStatus("error");
      return;
    }

    setExportStatus("loading");
    const progressInterval = simulateProgress();

    try {
      // In a real implementation, this would call a bulk export API
      const exportData = data.map(float => ({
        id: float.id,
        latitude: float.lat,
        longitude: float.lon,
        time: float.time,
        temperature: float.temperature || "N/A",
        salinity: float.salinity || "N/A",
        depth: float.depth || "N/A",
      }));

      let content = "";
      if (exportFormat === "csv") {
        const headers = Object.keys(exportData[0]).join(",");
        const rows = exportData.map(row => Object.values(row).join(","));
        content = [headers, ...rows].join("\n");
      } else {
        content = JSON.stringify(exportData, null, 2);
      }

      const blob = new Blob([content], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `all_floats_data.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      clearInterval(progressInterval);
      setExportProgress(100);
      setExportStatus("success");
      setLastExport(new Date().toLocaleString());
      
      setTimeout(() => {
        setExportStatus("idle");
        setExportProgress(0);
      }, 3000);

    } catch (error) {
      console.error("Bulk export failed:", error);
      clearInterval(progressInterval);
      setExportStatus("error");
      setTimeout(() => {
        setExportStatus("idle");
        setExportProgress(0);
      }, 3000);
    }
  };

  const getStatusIcon = () => {
    switch (exportStatus) {
      case "loading":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Download className="h-4 w-4" />;
    }
  };

  const getStatusText = () => {
    switch (exportStatus) {
      case "loading":
        return "Exporting...";
      case "success":
        return "Export Complete";
      case "error":
        return "Export Failed";
      default:
        return "Export Data";
    }
  };

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Data
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 space-y-6">
        {/* Format Selection */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Export Format</h4>
          <Select value={exportFormat} onValueChange={(value: ExportFormat) => setExportFormat(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              {formatOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    {option.icon}
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {option.description}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Format Info */}
          {exportFormat && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">File Size:</span>
                <Badge variant="secondary" className="text-xs">
                  {getFormatInfo(exportFormat)?.size}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {getFormatInfo(exportFormat)?.description}
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Export Options */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Export Options</h4>
          
          {/* Selected Float Export */}
          <div className="space-y-2">
            <Button
              onClick={handleExport}
              disabled={!selectedFloat || exportStatus === "loading"}
              className="w-full justify-start"
              variant={selectedFloat ? "default" : "secondary"}
            >
              {getStatusIcon()}
              <span className="ml-2">
                {selectedFloat 
                  ? `Export Float ${selectedFloat}` 
                  : "Select a float to export"
                }
              </span>
            </Button>
            
            {selectedFloat && (
              <p className="text-xs text-muted-foreground px-2">
                Export complete profile data for the selected float
              </p>
            )}
          </div>

          {/* Bulk Export */}
          <div className="space-y-2">
            <Button
              onClick={handleExportAll}
              disabled={data.length === 0 || exportStatus === "loading"}
              className="w-full justify-start"
              variant="outline"
            >
              {getStatusIcon()}
              <span className="ml-2">
                Export All Data ({data.length} floats)
              </span>
            </Button>
            
            <p className="text-xs text-muted-foreground px-2">
              Export summary data for all floats in current view
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {exportStatus === "loading" && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(exportProgress)}%</span>
            </div>
            <Progress value={exportProgress} className="w-full" />
          </div>
        )}

        {/* Status Messages */}
        {exportStatus !== "idle" && (
          <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
            exportStatus === "success" 
              ? "bg-green-500/10 text-green-500 border border-green-500/20"
              : exportStatus === "error"
              ? "bg-red-500/10 text-red-500 border border-red-500/20"
              : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
          }`}>
            {getStatusIcon()}
            <span>{getStatusText()}</span>
          </div>
        )}

        {/* Last Export Info */}
        {lastExport && exportStatus === "idle" && (
          <div className="text-xs text-muted-foreground">
            Last export: {lastExport}
          </div>
        )}

        <Separator />

        {/* Export Statistics */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Data Summary</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-muted/30 rounded">
              <div className="font-medium">Total Floats</div>
              <div className="text-muted-foreground">{data.length}</div>
            </div>
            <div className="p-2 bg-muted/30 rounded">
              <div className="font-medium">Selected</div>
              <div className="text-muted-foreground">
                {selectedFloat ? "1" : "None"}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </div>
  );
};
