import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Earth } from './Earth'
import type { GeoData } from '../hooks/useGeoData'
import { CameraController } from './CameraController'
import { InfoPopup } from './InfoPopup'
import type { WikipediaInfo } from '../services/wikipedia'
import type { CountryMetricsMap } from '../services/dataVisualization'

interface EarthCanvasProps {
  worldData: GeoData | null
  provinceData: GeoData | null
  activeCountryIso: string | null
  viewMode: 'global' | 'province'
  onCountryClick: (name: string, isoCode: string, position: [number, number, number]) => void
  onHoverCountry: (name: string | null) => void
  targetPosition: [number, number, number] | null
  
  // Popup Props
  popupPosition: [number, number, number] | null
  popupTitle: string
  popupInfo: WikipediaInfo | null
  popupLoading: boolean
  onClosePopup: () => void

  // Data Visualization Props
  visualizationMode: 'none' | 'population' | 'gdp'
  metricsMap: CountryMetricsMap | null
  minMetricVal: number
  maxMetricVal: number

  // Auto-Rotation Prop
  autoRotate: boolean
}

export const EarthCanvas: React.FC<EarthCanvasProps> = ({
  worldData,
  provinceData,
  activeCountryIso,
  viewMode,
  onCountryClick,
  onHoverCountry,
  targetPosition,
  popupPosition,
  popupTitle,
  popupInfo,
  popupLoading,
  onClosePopup,
  visualizationMode,
  metricsMap,
  minMetricVal,
  maxMetricVal,
  autoRotate
}) => {
  return (
    <div className="w-full h-full relative bg-[#020617]">
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 45, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          {/* Ambient Lighting */}
          <ambientLight intensity={0.4} />

          {/* Sun Light */}
          <directionalLight
            position={[5, 3, 5]}
            intensity={1.6}
            castShadow
            shadow-mapSize={[2048, 2048]}
          />

          {/* Rim light for dark side silhouette */}
          <directionalLight
            position={[-5, -3, -5]}
            intensity={0.5}
          />

          {/* Earth mesh group */}
          <Earth
            worldData={worldData}
            provinceData={provinceData}
            activeCountryIso={activeCountryIso}
            viewMode={viewMode}
            onCountryClick={onCountryClick}
            onHoverCountry={onHoverCountry}
            visualizationMode={visualizationMode}
            metricsMap={metricsMap}
            minMetricVal={minMetricVal}
            maxMetricVal={maxMetricVal}
          />

          {/* Wikipedia floating 3D popup */}
          {popupPosition && (
            <InfoPopup
              position={popupPosition}
              title={popupTitle}
              info={popupInfo}
              loading={popupLoading}
              onClose={onClosePopup}
            />
          )}

          {/* Camera Focus and Animation Controller */}
          <CameraController targetPosition={targetPosition} />

          {/* User interaction controls */}
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            enablePan={false}
            minDistance={1.6}
            maxDistance={5.0}
            autoRotate={autoRotate && viewMode === 'global'}
            autoRotateSpeed={0.8}
            makeDefault
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
