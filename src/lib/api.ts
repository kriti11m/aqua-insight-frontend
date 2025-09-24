// API service for backend communication

import { OpenAIService, ProcessedOceanData } from './openai';

export interface Float {
  id: string;
  lat: number;
  lon: number;
  time: string;
  temperature?: number;
  salinity?: number;
  depth?: number;
}

export interface VectorSearchResult {
  metadata: {
    lon: number;
    date: string;
    profiles: number;
    float_id: string;
    lat: number;
  };
  document: string;
  similarity_score: number;
  distance: number;
}

export interface BackendResponse {
  status: string;
  source: string;
  results: VectorSearchResult[];
}

export interface OptimizedQueryResponse {
  success: boolean;
  message: string;
  data?: {
    floats?: Float[];
    summary?: string;
    rawResults?: VectorSearchResult[];
    aiAnalysis?: ProcessedOceanData;
    charts?: {
      depthTemp?: { depth: number[]; temperature: number[] };
      depthSal?: { depth: number[]; salinity: number[] };
    };
  };
  error?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export class ApiService {
  static async semanticQuery(query: string): Promise<OptimizedQueryResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/semantic/query/optimized`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const backendResponse: BackendResponse = await response.json();
      
      // Convert backend response to frontend format
      if (backendResponse.status === 'success' && backendResponse.results) {
        const floats: Float[] = backendResponse.results.map(result => {
          const extractedData = ApiService.extractDataFromDocument(result.document);
          return {
            id: result.metadata.float_id.replace(/b'|'/g, ''), // Clean up float_id
            lat: result.metadata.lat,
            lon: result.metadata.lon,
            time: result.metadata.date,
            temperature: extractedData.temperature,
            salinity: extractedData.salinity,
            depth: extractedData.depth
          };
        });

        // Process data with OpenAI for enhanced analysis
        const aiAnalysis = await OpenAIService.processOceanographicData(query, backendResponse.results);

        // Generate chart data from extracted values
        const chartData = ApiService.generateChartData(floats);

        return {
          success: true,
          message: `Found ${backendResponse.results.length} results from ${backendResponse.source} search`,
          data: {
            floats: floats,
            summary: aiAnalysis.summary,
            rawResults: backendResponse.results,
            aiAnalysis: aiAnalysis,
            charts: chartData
          }
        };
      } else {
        return {
          success: false,
          message: backendResponse.status || 'Unknown response from backend',
          error: 'Invalid response format'
        };
      }
      
    } catch (error) {
      console.error('Error performing semantic query:', error);
      return {
        success: false,
        message: `Unable to connect to backend at ${API_BASE_URL}`,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Helper function to extract temperature, salinity, depth from document text
  static extractDataFromDocument(document: string): { temperature?: number; salinity?: number; depth?: number } {
    const tempMatch = document.match(/Temperature ranged from ([\d.]+)°C to ([\d.]+)°C \(mean ([\d.]+)°C\)/);
    const salMatch = document.match(/Salinity ranged from ([\d.]+) PSU to ([\d.]+) PSU \(mean ([\d.]+) PSU\)/);
    const depthMatch = document.match(/Pressure ranged from ([\d.]+) dbar to ([\d.]+) dbar \(mean ~([\d.]+) dbar\)/);
    
    return {
      temperature: tempMatch ? parseFloat(tempMatch[3]) : undefined, // Use mean temperature
      salinity: salMatch ? parseFloat(salMatch[3]) : undefined,     // Use mean salinity  
      depth: depthMatch ? parseFloat(depthMatch[3]) : undefined     // Use mean depth
    };
  }

  // Generate realistic chart data from float values
  static generateChartData(floats: Float[]): { depthTemp?: { depth: number[]; temperature: number[] }; depthSal?: { depth: number[]; salinity: number[] } } {
    const depths = [0, 10, 20, 50, 100, 200, 500, 1000, 1500, 2000];
    
    // Get temperature and salinity values from floats
    const temps = floats.filter(f => f.temperature !== undefined).map(f => f.temperature!);
    const sals = floats.filter(f => f.salinity !== undefined).map(f => f.salinity!);
    
    let chartData: any = {};
    
    if (temps.length > 0) {
      // Create realistic temperature profile (decreasing with depth)
      const surfaceTemp = temps[0];
      const tempProfile = depths.map(depth => {
        if (depth === 0) return surfaceTemp;
        if (depth <= 100) return surfaceTemp - (depth * 0.02); // Gradual decrease
        if (depth <= 1000) return surfaceTemp * 0.6 - (depth * 0.003); // Thermocline
        return Math.max(2, surfaceTemp * 0.3); // Deep water
      });
      
      chartData.depthTemp = {
        depth: depths,
        temperature: tempProfile
      };
    }
    
    if (sals.length > 0) {
      // Create realistic salinity profile
      const surfaceSal = sals[0];
      const salProfile = depths.map(depth => {
        if (depth === 0) return surfaceSal;
        if (depth <= 50) return surfaceSal + (depth * 0.001); // Slight increase
        if (depth <= 500) return surfaceSal + 0.2; // Halocline
        return surfaceSal + 0.5; // Deep water higher salinity
      });
      
      chartData.depthSal = {
        depth: depths,
        salinity: salProfile
      };
    }
    
    return chartData;
  }
}
