import React, { useRef, useEffect, useState } from 'react';
import Globe from 'globe.gl';
import { FloatData } from '@/contexts/FloatChatContext';

interface FloatPoint {
  id: string;
  lat: number;
  lng: number;
  temp?: number;
  salinity?: number;
  depth?: number;
  name?: string;
  platform_id?: string;
  wmo_id?: string;
  deployment_date?: string;
}

interface Earth3DGlobeProps {
  floatData?: FloatData[];
  className?: string;
  selectedFloatId?: string | null;
  onFloatSelect?: (floatId: string) => void;
}

export const Earth3DGlobe: React.FC<Earth3DGlobeProps> = ({ 
  floatData = [], 
  className = '',
  selectedFloatId = null,
  onFloatSelect
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>();
  const [hoveredPoint, setHoveredPoint] = useState<FloatPoint | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [autoRotate, setAutoRotate] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(false);
  const [viewMode, setViewMode] = useState<'points' | 'heatmap'>('points');

  // Convert FloatData to points format for globe.gl
  const convertToGlobePoints = (data: FloatData[]): FloatPoint[] => {
    const points: FloatPoint[] = [];
    
    data.forEach((float) => {
      if (float.profiles && float.profiles.length > 0) {
        // Use the first profile or average location if multiple profiles
        const profile = float.profiles[0];
        if (profile.latitude !== undefined && profile.longitude !== undefined) {
          points.push({
            id: float.id || `float_${Date.now()}`,
            lat: profile.latitude,
            lng: profile.longitude,
            temp: profile.temperature,
            salinity: profile.salinity,
            depth: profile.depth,
            name: float.name || `Float ${float.id}`,
            platform_id: float.metadata?.platform_id,
            wmo_id: float.metadata?.wmo_id,
            deployment_date: float.metadata?.deployment_date,
          });
        }
      }
    });
    
    return points;
  };

  const floatPoints = convertToGlobePoints(floatData);

  // Initialize globe
  useEffect(() => {
    if (!mountRef.current) return;

    // Clear any existing globe
    if (globeRef.current) {
      mountRef.current.innerHTML = '';
    }

    // Create new globe instance
    const globe = new Globe(mountRef.current)
      // Globe appearance
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
      .backgroundColor('rgba(0,0,0,0)')
      .atmosphereColor('#87CEEB')
      .atmosphereAltitude(0.15)
      .showAtmosphere(true)
      .showGlobe(true)
      .showGraticules(showGrid)
      // Camera controls
      .pointOfView({ altitude: 2.5 });
    
    // Set auto rotation
    const controls = globe.controls();
    if (controls) {
      controls.autoRotate = autoRotate;
    }

    globeRef.current = globe;

    // Handle window resize
    const handleResize = () => {
      if (globe && mountRef.current) {
        globe
          .width(mountRef.current.clientWidth)
          .height(mountRef.current.clientHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current) {
        mountRef.current.innerHTML = '';
      }
    };
  }, [showGrid, autoRotate]);

  // Update points data
  useEffect(() => {
    if (!globeRef.current) return;

    if (viewMode === 'points') {
      // Points mode
      globeRef.current
        .pointsData(floatPoints)
        .pointColor(d => '#ff4444')
        .pointAltitude(0.02)
        .pointRadius(1.5)
        .pointLabel(d => {
          return `
            <div style="
              background: rgba(0,0,0,0.9); 
              color: white; 
              padding: 8px 12px; 
              border-radius: 6px; 
              border: 1px solid #00d1c1;
              font-size: 12px;
              max-width: 200px;
            ">
              <div style="color: #00d1c1; font-weight: bold; margin-bottom: 4px;">
                ${d.name || d.id}
              </div>
              <div style="margin-bottom: 2px;">
                <strong>Location:</strong> ${d.lat.toFixed(2)}°, ${d.lng.toFixed(2)}°
              </div>
              ${d.temp ? `<div style="margin-bottom: 2px;"><strong>Temperature:</strong> ${d.temp.toFixed(1)}°C</div>` : ''}
              ${d.salinity ? `<div style="margin-bottom: 2px;"><strong>Salinity:</strong> ${d.salinity.toFixed(2)} PSU</div>` : ''}
              ${d.depth ? `<div style="margin-bottom: 2px;"><strong>Depth:</strong> ${d.depth.toFixed(0)}m</div>` : ''}
              ${d.platform_id ? `<div><strong>Platform:</strong> ${d.platform_id}</div>` : ''}
            </div>
          `;
        })
        // Clear other layers
        .heatmapsData([])
        .labelsData(showLabels ? floatPoints.map(p => ({
          lat: p.lat,
          lng: p.lng,
          text: p.name || p.id,
          color: 'rgba(255,255,255,0.8)',
          size: 0.4
        })) : []);
    } else if (viewMode === 'heatmap') {
      // Heatmap mode
      globeRef.current
        .pointsData([])
        .labelsData([])
        .heatmapsData([{
          points: floatPoints.map(p => [p.lat, p.lng, p.temp || 1]),
          colorFn: (t) => {
            // Temperature-based color scale
            if (t < 0.2) return `rgba(0, 0, 255, ${t * 2})`; // Blue for cold
            if (t < 0.5) return `rgba(0, 255, 255, ${t * 2})`; // Cyan for cool
            if (t < 0.8) return `rgba(255, 255, 0, ${t * 2})`; // Yellow for warm
            return `rgba(255, 0, 0, ${t * 2})`; // Red for hot
          }
        }]);
    }

    // Point interactions
    globeRef.current
      .onPointHover(point => {
        if (point) {
          setHoveredPoint(point);
          // Get mouse position for custom tooltip
          const rect = mountRef.current?.getBoundingClientRect();
          if (rect) {
            // This is approximate - globe.gl handles its own tooltips
            setMousePosition({ x: rect.width / 2, y: rect.height / 2 });
          }
        } else {
          setHoveredPoint(null);
        }
      })
      .onPointClick(point => {
        if (point) {
          // Focus on the clicked point
          globeRef.current.pointOfView(
            { lat: point.lat, lng: point.lng, altitude: 1.5 },
            1000
          );
          // Trigger selection callback if provided
          if (onFloatSelect) {
            onFloatSelect(point.id);
          }
        }
      });

  }, [floatPoints, viewMode, showLabels]);

  const resetView = () => {
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: 0, lng: 0, altitude: 2.5 }, 1000);
    }
  };

  // Focus on selected float
  useEffect(() => {
    if (selectedFloatId && globeRef.current && floatPoints.length > 0) {
      const selectedFloat = floatPoints.find(point => point.id === selectedFloatId);
      if (selectedFloat) {
        // Focus on the selected float with a nice zoom animation
        globeRef.current.pointOfView(
          { lat: selectedFloat.lat, lng: selectedFloat.lng, altitude: 1.5 },
          1500
        );
      }
    }
  }, [selectedFloatId, floatPoints]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Globe Container - Takes most of the space but leaves room for controls */}
      <div className="relative w-full" style={{ height: 'calc(100% - 60px)' }}>
        <div ref={mountRef} className="w-full h-full" />
        
        {/* Float Count Badge */}
        <div className="absolute top-3 left-3 bg-slate-900/90 text-white text-sm px-3 py-2 rounded-lg border border-slate-700 backdrop-blur-sm z-10">
          <div className="flex items-center text-slate-300">
            <span className="text-[#00d1c1]">🛰️</span>
            <span className="ml-2 font-bold">{floatPoints.length} ARGO Floats</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-3 right-3 bg-slate-900/90 text-white text-xs p-2 rounded-lg border border-slate-700 backdrop-blur-sm z-10">
          <div className="text-slate-400 space-y-1 text-right">
            <div>🖱️ Drag to rotate • 🔍 Scroll to zoom</div>
            <div>🎯 Click points to focus • Hover for details</div>
          </div>
        </div>
      </div>

      {/* Fixed Controls Bar at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[60px] bg-slate-900/95 text-white border-t border-slate-700 backdrop-blur-sm">
        <div className="flex items-center justify-between h-full px-4 max-w-full">
          {/* View Mode */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-medium text-slate-400 whitespace-nowrap">View:</span>
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode('points')}
                className={`px-3 py-1 text-xs rounded transition-all whitespace-nowrap ${
                  viewMode === 'points' 
                    ? 'bg-[#00d1c1] text-slate-900 font-medium' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Points
              </button>
              <button
                onClick={() => setViewMode('heatmap')}
                className={`px-3 py-1 text-xs rounded transition-all whitespace-nowrap ${
                  viewMode === 'heatmap' 
                    ? 'bg-[#00d1c1] text-slate-900 font-medium' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Heatmap
              </button>
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center gap-3 min-w-0 flex-1 justify-center">
            <label className="flex items-center gap-1 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={autoRotate}
                onChange={(e) => setAutoRotate(e.target.checked)}
                className="w-3 h-3 accent-[#00d1c1] rounded"
              />
              <span className="text-xs text-slate-300">Auto Rotate</span>
            </label>
            
            <label className="flex items-center gap-1 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="w-3 h-3 accent-[#00d1c1] rounded"
              />
              <span className="text-xs text-slate-300">Show Grid</span>
            </label>

            <label className="flex items-center gap-1 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
                className="w-3 h-3 accent-[#00d1c1] rounded"
              />
              <span className="text-xs text-slate-300">Show Labels</span>
            </label>
          </div>
        
          {/* Reset Button */}
          <div className="min-w-0">
            <button
              onClick={resetView}
              className="px-3 py-1 text-xs bg-[#00d1c1] text-slate-900 rounded hover:bg-[#00a3a3] transition-all font-medium whitespace-nowrap"
            >
              🔄 Reset View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};