import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Earth } from './Earth'
import type { GeoData } from '../hooks/useGeoData'
import { CameraController } from './CameraController'
import { InfoPopup } from './InfoPopup'
import type { WikipediaInfo } from '../services/wikipedia'
import type { CountryMetricsMap } from '../services/dataVisualization'
import { ErrorBoundary } from './ErrorBoundary'

interface EarthCanvasProps {
  worldData: GeoData | null
  provinceData: GeoData | null
  activeCountryIso: string | null
  viewMode: 'global' | 'province'
  onCountryClick: (name: string, isoCode: string, position: [number, number, number]) => void
  onHoverCountry: (name: string | null) => void
  targetPosition: [number, number, number] | null
  flightActive: boolean
  onFlightEnd: () => void
  
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

  // Settings Props
  showGrid: boolean
  showAtmosphere: boolean
  showBorders: boolean
  showTerrain: boolean
  showPillars: boolean
  showTrails: boolean
  currentMonth: number
}

export const EarthCanvas: React.FC<EarthCanvasProps> = ({
  worldData,
  provinceData,
  activeCountryIso,
  viewMode,
  onCountryClick,
  onHoverCountry,
  targetPosition,
  flightActive,
  onFlightEnd,
  popupPosition,
  popupTitle,
  popupInfo,
  popupLoading,
  onClosePopup,
  visualizationMode,
  metricsMap,
  minMetricVal,
  maxMetricVal,
  autoRotate,
  showGrid,
  showAtmosphere,
  showBorders,
  showTerrain,
  showPillars,
  showTrails,
  currentMonth
}) => {
  return (
    <div className="w-full h-full relative bg-[#020617]">
      <ErrorBoundary>
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
            showGrid={showGrid}
            showAtmosphere={showAtmosphere}
            showBorders={showBorders}
            showTerrain={showTerrain}
            showPillars={showPillars}
            showTrails={showTrails}
            currentMonth={currentMonth}
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
          <CameraController
            targetPosition={targetPosition}
            flightActive={flightActive}
            onFlightEnd={onFlightEnd}
            activeCountryIso={activeCountryIso}
          />

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
     </ErrorBoundary>
    </div>
  )
}
