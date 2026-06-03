import React, { useMemo } from 'react'
import * as THREE from 'three'
import { citiesDataset } from '../services/weatherDataset'
import { latLngToVector3 } from '../utils/geoMath'

interface PillarLayerProps {
  activeCountryIso: string | null
  viewMode: 'global' | 'province'
  currentMonth: number // 0 to 11
  showPillars: boolean
}

export const PillarLayer: React.FC<PillarLayerProps> = ({
  activeCountryIso,
  viewMode,
  currentMonth,
  showPillars
}) => {
  if (!showPillars) return null

  // Filter cities based on view mode and active country
  const activeCities = useMemo(() => {
    if (viewMode === 'global') {
      return citiesDataset
    }
    // In province mode, only show cities within the selected country
    if (!activeCountryIso) return []
    return citiesDataset.filter(
      (city) => city.countryIso.toUpperCase() === activeCountryIso.toUpperCase()
    )
  }, [activeCountryIso, viewMode])

  // Scale bounds for population mapped to height
  const { minPop, maxPop } = useMemo(() => {
    const populations = citiesDataset.map((c) => c.population)
    return {
      minPop: Math.min(...populations),
      maxPop: Math.max(...populations)
    }
  }, [])

  // Function to compute color based on temperature
  // Cold (-10°C) -> Sky Blue (#38bdf8)
  // Mid (15°C) -> Purple (#a855f7)
  // Hot (40°C) -> Neon Rose (#f43f5e)
  const getTempColorAndT = (temp: number): { color: THREE.Color; t: number } => {
    const clamped = Math.max(-10, Math.min(40, temp))
    const t = (clamped - (-10)) / (40 - (-10)) // 0 to 1 normalization
    
    const color = new THREE.Color()
    if (t < 0.5) {
      const localT = t / 0.5
      color.lerpColors(new THREE.Color('#38bdf8'), new THREE.Color('#a855f7'), localT)
    } else {
      const localT = (t - 0.5) / 0.5
      color.lerpColors(new THREE.Color('#a855f7'), new THREE.Color('#f43f5e'), localT)
    }
    return { color, t }
  }

  // Pre-calculate positions, rotations, heights and colors to optimize rendering
  const pillars = useMemo(() => {
    return activeCities.map((city) => {
      const pos = latLngToVector3(city.lat, city.lng, 1.002)
      const normal = pos.clone().normalize()

      // Calculate height based on population density (D3-like linear mapping)
      // Height bounds: 0.08 to 0.45 unit length
      const heightFraction = (city.population - minPop) / (maxPop - minPop || 1)
      const height = 0.08 + heightFraction * 0.32

      // Position the cylinder center offset along normal vector
      const centerPos = pos.clone().add(normal.clone().multiplyScalar(height / 2))

      // Align local Y-axis [0,1,0] to surface normal
      const quaternion = new THREE.Quaternion()
      quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal)

      // Get weather data for current month
      const currentTemp = city.monthlyTemps[currentMonth] || 15
      const { color, t } = getTempColorAndT(currentTemp)

      return {
        id: city.id,
        name: city.nameZh,
        basePos: pos,
        centerPos,
        quaternion,
        height,
        color,
        opacity: 0.5 + t * 0.45 // Hotter is glowier/more opaque
      }
    })
  }, [activeCities, currentMonth, minPop, maxPop])

  return (
    <group>
      {pillars.map((p) => (
        <group key={`pillar-group-${p.id}`}>
          {/* A. Base Glow Ring lying flat on tangent sphere surface */}
          <mesh position={p.basePos} quaternion={p.quaternion} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0, 0.02, 16]} />
            <meshBasicMaterial
              color={p.color}
              transparent
              opacity={p.opacity * 0.4}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

          {/* B. Glowing 3D Cylinder Energy Pillar */}
          <mesh position={p.centerPos} quaternion={p.quaternion}>
            <cylinderGeometry args={[0.006, 0.006, p.height, 8, 1, true]} />
            <meshBasicMaterial
              color={p.color}
              transparent
              opacity={p.opacity}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* C. Highlight Tip Dot */}
          <mesh position={p.centerPos.clone().add(new THREE.Vector3(0, p.height / 2, 0).applyQuaternion(p.quaternion))}>
            <sphereGeometry args={[0.005, 8, 8]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.9}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}
