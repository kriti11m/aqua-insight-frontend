// API service functions for FloatChat backend communication

export interface Float {
  id: string;
  lat: number;
  lon: number;
  time: string;
  temperature?: number;
  salinity?: number;
  depth?: number;
}

export interface FloatProfile {
  id: string;
  data: {
    depth: number[];
    temperature: number[];
    salinity: number[];
    time: string[];
  };
}

export interface QueryResponse {
  answerText: string;
  chartData?: {
    depthTemp?: { depth: number[]; temperature: number[] };
    depthSal?: { depth: number[]; salinity: number[] };
    timeSeries?: { time: string[]; temperature: number[]; salinity: number[] };
  };
  mapData?: Float[];
  tableData?: Float[];
}

// Base API URL - will be configured later
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export class ApiService {
  // GET /floats - Get all floats for map view
  static async getFloats(): Promise<Float[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/floats`);
      if (!response.ok) throw new Error('Failed to fetch floats');
      return await response.json();
    } catch (error) {
      console.error('Error fetching floats:', error);
      // Return mock data for development
      return [
        { id: '2903123', lat: 25.5, lon: -80.2, time: '2023-01-15' },
        { id: '2903124', lat: 30.0, lon: -85.0, time: '2023-01-16' },
        { id: '2903125', lat: 28.3, lon: -82.7, time: '2023-01-17' },
      ];
    }
  }

  // GET /float/{id}/data - Get specific float data
  static async getFloatData(
    id: string,
    start?: string,
    end?: string
  ): Promise<FloatProfile> {
    try {
      const params = new URLSearchParams();
      if (start) params.append('start', start);
      if (end) params.append('end', end);
      
      const response = await fetch(
        `${API_BASE_URL}/float/${id}/data?${params}`
      );
      if (!response.ok) throw new Error('Failed to fetch float data');
      return await response.json();
    } catch (error) {
      console.error('Error fetching float data:', error);
      // Return mock data for development
      return {
        id,
        data: {
          depth: [0, 10, 20, 50, 100, 200, 500, 1000],
          temperature: [25.5, 25.2, 24.8, 22.1, 18.5, 12.3, 8.7, 4.2],
          salinity: [36.1, 36.2, 36.3, 36.4, 36.5, 36.6, 36.7, 36.8],
          time: ['2023-01-15T00:00:00Z', '2023-01-15T01:00:00Z', '2023-01-15T02:00:00Z'],
        },
      };
    }
  }

  // POST /query - Natural language query
  static async queryData(query: string): Promise<QueryResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      if (!response.ok) throw new Error('Failed to query data');
      return await response.json();
    } catch (error) {
      console.error('Error querying data:', error);
      // Return mock response for development
      return {
        answerText: `I found data related to: "${query}". Here are the results based on available ARGO float measurements.`,
        chartData: {
          depthTemp: {
            depth: [0, 10, 20, 50, 100, 200, 500, 1000],
            temperature: [25.5, 25.2, 24.8, 22.1, 18.5, 12.3, 8.7, 4.2],
          },
          depthSal: {
            depth: [0, 10, 20, 50, 100, 200, 500, 1000],
            salinity: [36.1, 36.2, 36.3, 36.4, 36.5, 36.6, 36.7, 36.8],
          },
        },
        mapData: [
          { id: '2903123', lat: 25.5, lon: -80.2, time: '2023-01-15' },
          { id: '2903124', lat: 30.0, lon: -85.0, time: '2023-01-16' },
        ],
        tableData: [
          { id: '2903123', lat: 25.5, lon: -80.2, time: '2023-01-15', temperature: 25.5, salinity: 36.1 },
          { id: '2903124', lat: 30.0, lon: -85.0, time: '2023-01-16', temperature: 24.8, salinity: 36.2 },
        ],
      };
    }
  }

  // GET /export/{id} - Export float data
  static async exportFloatData(
    id: string,
    format: 'csv' | 'netcdf' | 'ascii'
  ): Promise<Blob> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/export/${id}?format=${format}`
      );
      if (!response.ok) throw new Error('Failed to export data');
      return await response.blob();
    } catch (error) {
      console.error('Error exporting data:', error);
      // Return mock blob for development
      const mockData = `Float ID: ${id}\nFormat: ${format}\nExport Date: ${new Date().toISOString()}`;
      return new Blob([mockData], { type: 'text/plain' });
    }
  }

  // GET /stats - Get statistics (for development)
  static async getStats(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/stats`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return await response.json();
    } catch (error) {
      console.error('Error fetching stats:', error);
      return { totalFloats: 3, activeFloats: 2, lastUpdate: new Date().toISOString() };
    }
  }
}
