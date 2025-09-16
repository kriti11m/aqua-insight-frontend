import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Database,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MapPin,
  Eye,
} from "lucide-react";
import { FloatData } from "@/pages/Dashboard";

interface DataTableProps {
  data: FloatData[];
  onRowSelect: (floatId: string) => void;
  selectedFloat: string | null;
}

type SortField = keyof FloatData;
type SortDirection = "asc" | "desc" | null;

export const DataTable = ({ data, onRowSelect, selectedFloat }: DataTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [filterBy, setFilterBy] = useState<string>("all");

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((item) =>
        Object.values(item).some((value) =>
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply category filter
    if (filterBy !== "all") {
      switch (filterBy) {
        case "recent":
          filtered = filtered.filter((item) => {
            const itemDate = new Date(item.time);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return itemDate >= weekAgo;
          });
          break;
        case "warm":
          filtered = filtered.filter((item) => (item.temperature || 0) > 20);
          break;
        case "cold":
          filtered = filtered.filter((item) => (item.temperature || 0) <= 20);
          break;
        case "high-salinity":
          filtered = filtered.filter((item) => (item.salinity || 0) > 36);
          break;
      }
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        if (aValue === undefined || bValue === undefined) return 0;

        let comparison = 0;
        if (typeof aValue === "string" && typeof bValue === "string") {
          comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === "number" && typeof bValue === "number") {
          comparison = aValue - bValue;
        }

        return sortDirection === "desc" ? -comparison : comparison;
      });
    }

    return filtered;
  }, [data, searchTerm, sortField, sortDirection, filterBy]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="h-4 w-4 text-blue-500" />;
    }
    if (sortDirection === "desc") {
      return <ArrowDown className="h-4 w-4 text-blue-500" />;
    }
    return <ArrowUpDown className="h-4 w-4 opacity-50" />;
  };

  const formatValue = (value: any, field: string) => {
    if (value === undefined || value === null) return "—";
    
    switch (field) {
      case "lat":
      case "lon":
        return typeof value === "number" ? value.toFixed(3) + "°" : value;
      case "temperature":
        return typeof value === "number" ? value.toFixed(1) + "°C" : value;
      case "salinity":
        return typeof value === "number" ? value.toFixed(2) + " PSU" : value;
      case "depth":
        return typeof value === "number" ? value.toFixed(0) + " m" : value;
      case "time":
        return new Date(value).toLocaleDateString();
      default:
        return value;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Table
          </div>
          <Badge variant="secondary" className="text-xs">
            {filteredAndSortedData.length} of {data.length} records
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search floats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Floats</SelectItem>
              <SelectItem value="recent">Recent (Last 7 days)</SelectItem>
              <SelectItem value="warm">Warm Water (&gt;20°C)</SelectItem>
              <SelectItem value="cold">Cold Water (≤20°C)</SelectItem>
              <SelectItem value="high-salinity">High Salinity (&gt;36 PSU)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Data Table */}
        <div className="flex-1 border rounded-md">
          <ScrollArea className="h-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("id")}
                      className="h-8 px-2 flex items-center gap-1"
                    >
                      Float ID
                      {getSortIcon("id")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("lat")}
                      className="h-8 px-2 flex items-center gap-1"
                    >
                      Latitude
                      {getSortIcon("lat")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("lon")}
                      className="h-8 px-2 flex items-center gap-1"
                    >
                      Longitude
                      {getSortIcon("lon")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("time")}
                      className="h-8 px-2 flex items-center gap-1"
                    >
                      Last Update
                      {getSortIcon("time")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("temperature")}
                      className="h-8 px-2 flex items-center gap-1"
                    >
                      Temperature
                      {getSortIcon("temperature")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("salinity")}
                      className="h-8 px-2 flex items-center gap-1"
                    >
                      Salinity
                      {getSortIcon("salinity")}
                    </Button>
                  </TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Database className="h-8 w-8 opacity-50" />
                        <p>No data available</p>
                        <p className="text-sm">Run a query to load float data</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedData.map((row) => (
                    <TableRow
                      key={row.id}
                      className={`cursor-pointer hover:bg-muted/50 ${
                        selectedFloat === row.id ? "bg-accent/20 border-accent/50" : ""
                      }`}
                      onClick={() => onRowSelect(row.id)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {selectedFloat === row.id && (
                            <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                          )}
                          {row.id}
                        </div>
                      </TableCell>
                      <TableCell>{formatValue(row.lat, "lat")}</TableCell>
                      <TableCell>{formatValue(row.lon, "lon")}</TableCell>
                      <TableCell>{formatValue(row.time, "time")}</TableCell>
                      <TableCell>
                        <span className={row.temperature && row.temperature > 20 ? "text-red-400" : "text-blue-400"}>
                          {formatValue(row.temperature, "temperature")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={row.salinity && row.salinity > 36 ? "text-orange-400" : "text-green-400"}>
                          {formatValue(row.salinity, "salinity")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRowSelect(row.id);
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Focus on map location
                              onRowSelect(row.id);
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <MapPin className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </CardContent>
    </div>
  );
};
