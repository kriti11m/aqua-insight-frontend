import React, { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { MapView } from './MapView';

interface FloatMarkerProps {
  position: [number, number, number];
  float: {
    id: string;
    lat: number;
    lon: number;
    temperature?: number;
    salinity?: number;
    depth?: number;
    time: string;
  };
  onHover: (float: any) => void;
  onLeave: () => void;
  onClick: (floatId: string) => void;
}

const FloatMarker: React.FC<FloatMarkerProps> = ({ position, float, onHover, onLeave, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      if (hovered) {
        meshRef.current.scale.setScalar(1.5);
      } else {
        meshRef.current.scale.setScalar(1);
      }
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        onHover(float);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        onLeave();
        document.body.style.cursor = 'auto';
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(float.id);
      }}
    >
      <sphereGeometry args={[0.02, 8, 8]} />
      <meshStandardMaterial
        color={hovered ? '#ff6b6b' : '#00d1c1'}
        emissive={hovered ? '#ff3333' : '#00a3a3'}
        emissiveIntensity={0.3}
      />
    </mesh>
  );
};

interface Earth3DSceneProps {
  floats: Array<{
    id: string;
    lat: number;
    lon: number;
    temperature?: number;
    salinity?: number;
    depth?: number;
    time: string;
  }>;
  onFloatHover: (float: any) => void;
  onFloatLeave: () => void;
  onFloatClick: (floatId: string) => void;
}

const Earth3DScene: React.FC<Earth3DSceneProps> = ({ floats, onFloatHover, onFloatLeave, onFloatClick }) => {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);

  // Convert lat/lon to 3D coordinates on sphere surface
  const latLonToVector3 = (lat: number, lon: number, radius: number = 1) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    
    return [x, y, z] as [number, number, number];
  };

  // Create Earth texture
  const earthTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 512;
    canvas.height = 256;
    
    // Create a simple Earth-like texture
    const gradient = context.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#4a90e2'); // Ocean blue
    gradient.addColorStop(0.3, '#5ba3f5');
    gradient.addColorStop(0.6, '#2d5016'); // Land green
    gradient.addColorStop(0.8, '#8b4513'); // Mountain brown
    gradient.addColorStop(1, '#ffffff'); // Ice white
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 512, 256);
    
    // Add some continents approximation
    context.fillStyle = '#2d5016';
    context.fillRect(100, 80, 120, 60); // North America
    context.fillRect(200, 100, 80, 40); // Europe
    context.fillRect(280, 120, 100, 50); // Asia
    context.fillRect(320, 180, 60, 40); // Australia
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, []);

  // Create cloud texture
  const cloudTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 512;
    canvas.height = 256;
    
    context.fillStyle = 'rgba(255, 255, 255, 0.8)';
    
    // Create cloud-like patterns
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 256;
      const radius = Math.random() * 20 + 10;
      
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, []);

  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.002;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += 0.003;
    }
  });

  return (
    <group>
      {/* Earth */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial map={earthTexture} />
      </mesh>
      
      {/* Clouds */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[1.01, 32, 32]} />
        <meshStandardMaterial
          map={cloudTexture}
          transparent
          opacity={0.4}
        />
      </mesh>
      
      {/* Float markers */}
      {floats.map((float) => {
        const position = latLonToVector3(float.lat, float.lon, 1.05);
        return (
          <FloatMarker
            key={float.id}
            position={position}
            float={float}
            onHover={onFloatHover}
            onLeave={onFloatLeave}
            onClick={onFloatClick}
          />
        );
      })}
    </group>
  );
};

interface HoverableMapProps {
  floats: Array<{
    id: string;
    lat: number;
    lon: number;
    temperature?: number;
    salinity?: number;
    depth?: number;
    time: string;
  }>;
  selectedFloat: string | null;
  onFloatSelect: (floatId: string) => void;
  className?: string;
}

export const HoverableMap: React.FC<HoverableMapProps> = ({ 
  floats, 
  selectedFloat, 
  onFloatSelect, 
  className = '' 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredFloat, setHoveredFloat] = useState<any>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showTransition, setShowTransition] = useState(false);

  const handleMouseEnter = () => {
    setShowTransition(true);
    setTimeout(() => setIsHovered(true), 200); // Delay to show smooth transition
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTimeout(() => setShowTransition(false), 300); // Keep transition state for smooth exit
  };

  const handleFloatHover = (float: any) => {
    setHoveredFloat(float);
  };

  const handleFloatLeave = () => {
    setHoveredFloat(null);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  const handleFloatClick = (floatId: string) => {
    onFloatSelect(floatId);
  };

  return (
    <div 
      className={`relative w-full h-full ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      {/* 2D Map - Always present, but fades out when hovering */}
      <div 
        className={`absolute inset-0 transition-opacity duration-300 ${
          isHovered ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ pointerEvents: isHovered ? 'none' : 'auto' }}
      >
        <MapView
          floats={floats}
          selectedFloat={selectedFloat}
          onFloatSelect={onFloatSelect}
        />
      </div>

      {/* Transition overlay for smooth morphing effect */}
      {showTransition && (
        <div 
          className={`absolute inset-0 transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ 
            background: 'linear-gradient(to bottom, #000428, #004e92)',
            pointerEvents: isHovered ? 'auto' : 'none'
          }}
        >
          <Canvas
            camera={{ position: [0, 0, 3], fov: 50 }}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Lighting */}
            <ambientLight intensity={0.3} />
            <directionalLight position={[5, 5, 5]} intensity={1} />
            <pointLight position={[-5, -5, -5]} intensity={0.5} />
            
            {/* Stars background */}
            <Stars
              radius={300}
              depth={60}
              count={5000}
              factor={4}
              saturation={0}
              fade
            />
            
            {/* Earth and floats */}
            <Earth3DScene
              floats={floats}
              onFloatHover={handleFloatHover}
              onFloatLeave={handleFloatLeave}
              onFloatClick={handleFloatClick}
            />
            
            {/* Controls */}
            <OrbitControls
              enableZoom={true}
              enablePan={false}
              enableRotate={true}
              zoomSpeed={0.6}
              rotateSpeed={0.4}
              minDistance={2}
              maxDistance={10}
              autoRotate={false}
            />
          </Canvas>
        </div>
      )}

      {/* Hover instruction when not hovered */}
      {!isHovered && (
        <div className="absolute top-2 right-2 bg-slate-900/80 text-white text-xs px-2 py-1 rounded pointer-events-none">
          🌍 Hover for 3D Globe
        </div>
      )}

      {/* Tooltip for 3D mode */}
      {isHovered && hoveredFloat && (
        <div
          className="absolute z-50 bg-slate-900 text-white p-3 rounded-lg shadow-lg border border-slate-700 pointer-events-none"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 10,
            transform: 'translate(0, -100%)',
          }}
        >
          <div className="text-sm font-semibold text-[#00d1c1] mb-1">
            Float {hoveredFloat.id}
          </div>
          <div className="text-xs space-y-1">
            <div>📍 {hoveredFloat.lat.toFixed(2)}°, {hoveredFloat.lon.toFixed(2)}°</div>
            {hoveredFloat.temperature !== undefined && (
              <div>🌡️ {hoveredFloat.temperature.toFixed(1)}°C</div>
            )}
            {hoveredFloat.salinity !== undefined && (
              <div>🧂 {hoveredFloat.salinity.toFixed(2)} PSU</div>
            )}
            {hoveredFloat.depth !== undefined && (
              <div>📏 {hoveredFloat.depth.toFixed(0)}m depth</div>
            )}
            <div>📅 {hoveredFloat.time}</div>
          </div>
        </div>
      )}
    </div>
  );
};