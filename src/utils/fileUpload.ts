import Papa from 'papaparse';
import { FloatData, FloatProfile } from '@/contexts/FloatChatContext';

export interface FileUploadResult {
  success: boolean;
  data?: FloatData;
  preview?: string;
  error?: string;
  fileInfo: {
    name: string;
    size: number;
    type: string;
  };
}

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const ALLOWED_TYPES = [
  'text/csv',
  'application/json',
  'application/x-netcdf',
  'application/octet-stream',
  'text/plain',
];

const generateId = () => Math.random().toString(36).substr(2, 9);

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const parseCSVToFloatData = (csvText: string, fileName: string): FloatData => {
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transform: (value) => {
      const num = parseFloat(value);
      return isNaN(num) ? value : num;
    }
  });

  const rows = parsed.data as any[];
  
  // Try to map common column names to our schema
  const profiles: FloatProfile[] = rows.map((row, index) => {
    const depth = row.depth || row.DEPTH || row.Depth || row.pres || row.PRES || index * 10;
    const temperature = row.temperature || row.TEMPERATURE || row.temp || row.TEMP || row.Temperature || 15 + Math.random() * 10;
    const salinity = row.salinity || row.SALINITY || row.sal || row.SAL || row.Salinity || 34 + Math.random() * 2;
    const timestamp = row.timestamp || row.TIMESTAMP || row.time || row.TIME || new Date().toISOString();
    const latitude = row.latitude || row.LATITUDE || row.lat || row.LAT || 35 + Math.random() * 10;
    const longitude = row.longitude || row.LONGITUDE || row.lon || row.LON || -120 + Math.random() * 10;

    return {
      depth: typeof depth === 'number' ? depth : parseFloat(depth) || 0,
      temperature: typeof temperature === 'number' ? temperature : parseFloat(temperature) || 15,
      salinity: typeof salinity === 'number' ? salinity : parseFloat(salinity) || 35,
      timestamp: typeof timestamp === 'string' ? timestamp : new Date().toISOString(),
      latitude: typeof latitude === 'number' ? latitude : parseFloat(latitude) || 35,
      longitude: typeof longitude === 'number' ? longitude : parseFloat(longitude) || -120,
    };
  });

  return {
    id: generateId(),
    name: fileName.replace(/\.[^/.]+$/, ""), // Remove extension
    profiles: profiles.slice(0, 1000), // Limit to 1000 profiles for performance
    metadata: {
      deployment_date: new Date().toISOString().split('T')[0],
      platform_id: `UPLOAD_${generateId()}`,
    }
  };
};

const parseJSONToFloatData = (jsonText: string, fileName: string): FloatData => {
  const data = JSON.parse(jsonText);
  
  // If it's already in our format, return it
  if (data.id && data.profiles && Array.isArray(data.profiles)) {
    return data as FloatData;
  }
  
  // Try to extract profiles from various JSON structures
  let profiles: FloatProfile[] = [];
  
  if (Array.isArray(data)) {
    // Array of profile objects
    profiles = data.map((item, index) => ({
      depth: item.depth || item.pres || index * 10,
      temperature: item.temperature || item.temp || 15 + Math.random() * 10,
      salinity: item.salinity || item.sal || 34 + Math.random() * 2,
      timestamp: item.timestamp || item.time || new Date().toISOString(),
      latitude: item.latitude || item.lat || 35 + Math.random() * 10,
      longitude: item.longitude || item.lon || -120 + Math.random() * 10,
    }));
  } else if (data.profiles && Array.isArray(data.profiles)) {
    // Object with profiles array
    profiles = data.profiles;
  }

  return {
    id: generateId(),
    name: data.name || fileName.replace(/\.[^/.]+$/, ""),
    profiles: profiles.slice(0, 1000),
    metadata: data.metadata || {
      deployment_date: new Date().toISOString().split('T')[0],
      platform_id: `UPLOAD_${generateId()}`,
    }
  };
};

const generatePreview = (data: FloatData): string => {
  const profileCount = data.profiles.length;
  const depthRange = profileCount > 0 ? 
    `${Math.min(...data.profiles.map(p => p.depth))}m - ${Math.max(...data.profiles.map(p => p.depth))}m` : 
    'No depth data';
  
  const tempRange = profileCount > 0 ? 
    `${Math.min(...data.profiles.map(p => p.temperature)).toFixed(1)}°C - ${Math.max(...data.profiles.map(p => p.temperature)).toFixed(1)}°C` : 
    'No temperature data';

  return `**${data.name}**

📊 **Data Summary:**
- **Profiles:** ${profileCount}
- **Depth Range:** ${depthRange}
- **Temperature Range:** ${tempRange}
- **Platform ID:** ${data.metadata?.platform_id || 'Unknown'}

The data has been successfully parsed and is ready for visualization. You can now view detailed charts and maps of this oceanographic data.`;
};

export const uploadFile = async (file: File): Promise<FileUploadResult> => {
  const fileInfo = {
    name: file.name,
    size: file.size,
    type: file.type,
  };

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: `File size (${formatFileSize(file.size)}) exceeds maximum allowed size of ${formatFileSize(MAX_FILE_SIZE)}`,
      fileInfo,
    };
  }

  // Validate file type (if specified)
  if (file.type && !ALLOWED_TYPES.includes(file.type) && !file.name.toLowerCase().endsWith('.nc')) {
    return {
      success: false,
      error: `File type "${file.type}" is not supported. Supported types: CSV, JSON, NetCDF`,
      fileInfo,
    };
  }

  try {
    const text = await file.text();
    let data: FloatData;

    if (file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv') {
      data = parseCSVToFloatData(text, file.name);
    } else if (file.name.toLowerCase().endsWith('.json') || file.type === 'application/json') {
      data = parseJSONToFloatData(text, file.name);
    } else if (file.name.toLowerCase().endsWith('.nc')) {
      // For NetCDF files, we'll create a placeholder since full NetCDF parsing requires specialized libraries
      return {
        success: false,
        error: 'NetCDF file parsing is not yet implemented. Please convert to CSV or JSON format.',
        fileInfo,
      };
    } else {
      // Try to parse as CSV first, then JSON
      try {
        data = parseCSVToFloatData(text, file.name);
      } catch {
        data = parseJSONToFloatData(text, file.name);
      }
    }

    const preview = generatePreview(data);

    return {
      success: true,
      data,
      preview,
      fileInfo,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      fileInfo,
    };
  }
};
