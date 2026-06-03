import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { citiesDataset, mockConnections } from '../services/weatherDataset'
import { latLngToVector3 } from '../utils/geoMath'

interface ParticleTrailsProps {
  activeCountryIso: string | null
  viewMode: 'global' | 'province'
  showTrails: boolean
}

// Sub-component representing a single active flowing data line
const FlowingTrail: React.FC<{
  pFrom: THREE.Vector3
  pTo: THREE.Vector3
  color: string
}> = ({ pFrom, pTo, color }) => {
  // 1. Calculate control point for standard quadratic Bezier arc
  const { pControl, pathPoints } = useMemo(() => {
    const dist = pFrom.distanceTo(pTo)
    const mid = new THREE.Vector3().addVectors(pFrom, pTo).multiplyScalar(0.5)
    // Control point height increases with path distance
    const height = 1.0 + dist * 0.22
    const control = mid.clone().normalize().multiplyScalar(height)

    // Generate static visual arc line points
    const curve = new THREE.QuadraticBezierCurve3(pFrom, control, pTo)
    const points = curve.getPoints(24)

    return {
      pControl: control,
      pathPoints: points
    }
  }, [pFrom, pTo])

  // Create geometry for the static connector line
  const lineGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(pathPoints)
  }, [pathPoints])

  // Evaluate position on the Bezier curve at factor t [0, 1]
  const getBezierPoint = (t: number): THREE.Vector3 => {
    const u = 1 - t
    const tt = t * t
    const uu = u * u

    return new THREE.Vector3(
      uu * pFrom.x + 2 * u * t * pControl.x + tt * pTo.x,
      uu * pFrom.y + 2 * u * t * pControl.y + tt * pTo.y,
      uu * pFrom.z + 2 * u * t * pControl.z + tt * pTo.z
    )
  }

  // Ref handles for the animated flowing particles
  const p1Ref = useRef<THREE.Mesh>(null)
  const p2Ref = useRef<THREE.Mesh>(null)

  const speed = 0.4 // Flow speed coefficient

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime()
    
    // Cycle particle positions along the path [0, 1]
    const t1 = (elapsed * speed) % 1.0
    const t2 = (elapsed * speed + 0.5) % 1.0 // Offset by 50% phase for fluid flow

    if (p1Ref.current) {
      p1Ref.current.position.copy(getBezierPoint(t1))
    }
    if (p2Ref.current) {
      p2Ref.current.position.copy(getBezierPoint(t2))
    }
  })

  return (
    <group>
      {/* Visual background arc path */}
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={0.2}
          linewidth={1}
          depthWrite={false}
        />
      </lineSegments>

      {/* Particle 1 */}
      <mesh ref={p1Ref}>
        <sphereGeometry args={[0.005, 8, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.85}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Particle 2 */}
      <mesh ref={p2Ref}>
        <sphereGeometry args={[0.004, 8, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.7}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

export const ParticleTrails: React.FC<ParticleTrailsProps> = ({
  activeCountryIso,
  viewMode,
  showTrails
}) => {
  if (!showTrails) return null

  // Filter connections depending on selected view and country
  const activeConnections = useMemo(() => {
    // Lookup table for rapid city matching
    const cityMap = new Map(citiesDataset.map((c) => [c.id, c]))

    const matched = mockConnections.map((conn) => {
      const fromCity = cityMap.get(conn.fromCityId)
      const toCity = cityMap.get(conn.toCityId)
      return { fromCity, toCity }
    }).filter((c) => c.fromCity && c.toCity) as { fromCity: any; toCity: any }[]

    if (viewMode === 'global') {
      return matched
    }

    // In province focus mode, only show internal domestic city routes
    if (!activeCountryIso) return []
    return matched.filter(
      (conn) =>
        conn.fromCity.countryIso.toUpperCase() === activeCountryIso.toUpperCase() &&
        conn.toCity.countryIso.toUpperCase() === activeCountryIso.toUpperCase()
    )
  }, [activeCountryIso, viewMode])

  // Determine path colors based on connection source (e.g. pink for Taiwan, purple/cyan globally)
  const getConnectionColor = (fromIso: string): string => {
    const iso = fromIso.toUpperCase()
    if (iso === 'TWN') return '#ec4899' // Hot Pink
    if (iso === 'USA') return '#38bdf8' // Sky Blue
    if (iso === 'JPN') return '#38bdf8' // Cyan
    return '#a855f7' // Purple Default
  }

  const trails = useMemo(() => {
    return activeConnections.map((conn, index) => {
      const pFrom = latLngToVector3(conn.fromCity.lat, conn.fromCity.lng, 1.002)
      const pTo = latLngToVector3(conn.toCity.lat, conn.toCity.lng, 1.002)
      const color = getConnectionColor(conn.fromCity.countryIso)

      return {
        key: `trail-${index}-${conn.fromCity.id}-${conn.toCity.id}`,
        pFrom,
        pTo,
        color
      }
    })
  }, [activeConnections])

  return (
    <group>
      {trails.map((t) => (
        <FlowingTrail
          key={t.key}
          pFrom={t.pFrom}
          pTo={t.pTo}
          color={t.color}
        />
      ))}
    </group>
  )
}
