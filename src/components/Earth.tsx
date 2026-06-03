import React, { useState, useEffect } from 'react'
import * as THREE from 'three'
import type { GeoData } from '../hooks/useGeoData'
import type { CountryMetricsMap } from '../services/dataVisualization'
import { CountryMesh } from './CountryMesh'
import { getChoroplethColor, getDeterministicColor } from '../utils/geoMath'
import { PillarLayer } from './PillarLayer'
import { ParticleTrails } from './ParticleTrails'

interface EarthProps {
  worldData: GeoData | null
  provinceData: GeoData | null
  activeCountryIso: string | null
  viewMode: 'global' | 'province'
  onCountryClick: (name: string, isoCode: string, position: [number, number, number]) => void
  onHoverCountry: (name: string | null) => void

  // Data Visualization Props
  visualizationMode: 'none' | 'population' | 'gdp'
  metricsMap: CountryMetricsMap | null
  minMetricVal: number
  maxMetricVal: number

  // Settings Props
  showGrid: boolean
  showAtmosphere: boolean
  showBorders: boolean
  showTerrain: boolean
  showPillars: boolean
  showTrails: boolean
  currentMonth: number
}

export const Earth: React.FC<EarthProps> = ({
  worldData,
  provinceData,
  activeCountryIso,
  viewMode,
  onCountryClick,
  onHoverCountry,
  visualizationMode,
  metricsMap,
  minMetricVal,
  maxMetricVal,
  showGrid,
  showAtmosphere,
  showBorders,
  showTerrain,
  showPillars,
  showTrails,
  currentMonth
}) => {
  const [bumpMap, setBumpMap] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    const loader = new THREE.TextureLoader()
    loader.load(
      '/earth_bump.jpg',
      (texture) => {
        setBumpMap(texture)
      },
      undefined,
      (err) => {
        console.error('Failed to load earth bump map texture:', err)
      }
    )
  }, [])

  // Helper to dynamically calculate country choropleth color based on current mode
  const getCountryColor = (isoCode: string | undefined, countryName: string): string => {
    if (visualizationMode === 'none' || !isoCode) {
      // Deterministically pre-color all country blocks with beautiful contrasting colors on mount!
      return getDeterministicColor(countryName)
    }

    if (!metricsMap) return '#1e293b' // Dim slate while loading or no map

    const countryMetrics = metricsMap[isoCode.toUpperCase()]
    if (!countryMetrics) return '#1e293b' // Dim slate for "No Data"

    const value = visualizationMode === 'population' ? countryMetrics.population : countryMetrics.gdp
    if (value === null || value <= 0) return '#1e293b' // Dim slate for missing values

    return getChoroplethColor(value, minMetricVal, maxMetricVal)
  }

  return (
    <group>
      {/* 1. Base Ocean Sphere - Midnight glassmorphism surface with 3D tactile displacement */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[1.0, 128, 128]} />
        <meshPhysicalMaterial
          color="#101726"          // Lighter midnight blue with deep glass tone
          roughness={0.25}
          metalness={0.3}
          clearcoat={0.8}
          clearcoatRoughness={0.1}
          transparent
          opacity={0.88}
          displacementMap={bumpMap || undefined}
          displacementScale={showTerrain && bumpMap ? 0.045 : 0.0}
        />
      </mesh>

      {/* 2. Delicate Grid / Graticule Sphere */}
      {showGrid && (
        <mesh>
          <sphereGeometry args={[1.001, 36, 18]} />
          <meshBasicMaterial
            color="#6366f1"
            wireframe
            transparent
            opacity={0.12} // Increased grid line visibility
          />
        </mesh>
      )}

      {/* 3. Subtle Outer Atmospheric Glow (rendered on the backside) */}
      {showAtmosphere && (
        <mesh>
          <sphereGeometry args={[1.03, 32, 32]} />
          <meshBasicMaterial
            color="#a855f7"
            transparent
            opacity={0.06} // Increased atmospheric glow slightly
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {/* 4. Global Countries Layer */}
      {viewMode === 'global' && worldData?.features.map((feature) => {
        const iso = feature.properties.iso_a3
        const name = feature.properties.name || ''
        const dynamicColor = getCountryColor(iso, name)

        return (
          <CountryMesh
            key={`country-${feature.id || feature.properties.name}`}
            feature={feature}
            onHover={onHoverCountry}
            onClick={onCountryClick}
            color={dynamicColor}
            hoverColor="#f43f5e"  // Neon rose
            opacity={0.65}
            hoverOpacity={0.85}
            showBorders={showBorders}
          />
        )
      })}

      {/* 5. Province / Sub-division Layer (Level 2) */}
      {viewMode === 'province' && (
        <>
          {/* Dimmed backdrop of the rest of the world so the globe shell isn't lost */}
          {worldData?.features.map((feature) => {
            const isTarget = feature.properties.iso_a3 === activeCountryIso
            
            if (isTarget) {
              // If detailed subdivision provinces exist, hide the full country block to prevent double rendering
              const hasSubdivisions = provinceData && provinceData.features && provinceData.features.length > 0
              if (hasSubdivisions) {
                return null
              }

              // Otherwise (e.g. while loading, or if the country doesn't support province maps),
              // render the full target country in its prominent highlighted focused state!
              const iso = feature.properties.iso_a3
              const name = feature.properties.name || ''
              const activeColor = getCountryColor(iso, name)

              return (
                <CountryMesh
                  key={`active-focus-country-${feature.id || feature.properties.name}`}
                  feature={feature}
                  onHover={onHoverCountry}
                  onClick={onCountryClick}
                  color={activeColor}
                  hoverColor="#f43f5e"  // Neon rose on hover
                  radius={1.003}        // Render on top active layer
                  opacity={0.7}         // Highly vibrant focused opacity
                  hoverOpacity={0.9}
                  showBorders={showBorders}
                />
              )
            }

            const iso = feature.properties.iso_a3
            const name = feature.properties.name || ''
            // In province mode, base background countries are even dimmer to spotlight the target country,
            // but we can preserve their thematic color with 50% opacity
            const baseColor = getCountryColor(iso, name)

            return (
              <CountryMesh
                key={`dim-country-${feature.id || feature.properties.name}`}
                feature={feature}
                onHover={onHoverCountry}
                onClick={onCountryClick}
                color={baseColor.startsWith('#4f46e5') || baseColor.startsWith('#6366f1') ? '#1e1b4b' : baseColor} // Use theme color or default dark purple
                radius={1.001}        // Draw slightly lower
                opacity={0.18}        // Nicely dimmed background
                hoverOpacity={0.35}
                showBorders={showBorders}
              />
            )
          })}

          {/* Active detailed subdivision meshes */}
          {provinceData?.features.map((feature, idx) => (
            <CountryMesh
              key={`province-${idx}-${feature.properties.name}`}
              feature={feature}
              onHover={onHoverCountry}
              onClick={(name, _code, pos) => onCountryClick(name, activeCountryIso || '', pos)}
              color="#ec4899"       // Vibrant pink for provinces
              hoverColor="#38bdf8"  // Cyber neon blue on hover
              radius={1.003}        // Slightly higher layer
              opacity={0.7}        // Brighter detailed subdivisions
              hoverOpacity={0.9}
              showBorders={showBorders}
            />
          ))}
        </>
      )}

      {/* 6. glowing data energy pillars (Population/Temperature indicator cylinders) */}
      <PillarLayer
        activeCountryIso={activeCountryIso}
        viewMode={viewMode}
        currentMonth={currentMonth}
        showPillars={showPillars}
      />

      {/* 7. Flowing Bezier data flight trails */}
      <ParticleTrails
        activeCountryIso={activeCountryIso}
        viewMode={viewMode}
        showTrails={showTrails}
      />
    </group>
  )
}
