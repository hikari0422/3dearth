import React, { useMemo, useState } from 'react'
import * as THREE from 'three'
import type { GeoFeature } from '../hooks/useGeoData'
import { latLngToVector3, calculateCentroid, subdivideAndProjectGeometry } from '../utils/geoMath'

interface CountryMeshProps {
  feature: GeoFeature
  color?: string
  hoverColor?: string
  onHover?: (name: string | null) => void
  onClick?: (name: string, isoCode: string, position: [number, number, number]) => void
  radius?: number
  opacity?: number
  hoverOpacity?: number
  showBorders?: boolean
}

export const CountryMesh: React.FC<CountryMeshProps> = React.memo(({
  feature,
  color = '#8b5cf6', // Indigo/violet tint for countries
  hoverColor = '#d946ef', // Neon magenta highlight
  onHover,
  onClick,
  radius = 1.002, // Slightly above ocean surface
  opacity = 0.65, // Vibrant default opacity
  hoverOpacity = 0.85, // High-contrast hover opacity
  showBorders = true
}) => {
  const [hovered, setHovered] = useState<boolean>(false)

  // 1. Memoize Geometry Conversion to maximize performance
  const geometries = useMemo(() => {
    const { type, coordinates } = feature.geometry
    const meshes: THREE.BufferGeometry[] = []
    const lines: THREE.BufferGeometry[] = []

    const cleanRing = (ring: number[][]): THREE.Vector2[] => {
      const points: THREE.Vector2[] = []
      let prevLng: number | null = null

      for (let i = 0; i < ring.length; i++) {
        let [lng, lat] = ring[i]

        // Continuity correction for antimeridian crossing (Date Line wrapping)
        if (prevLng !== null) {
          while (lng - prevLng > 180) {
            lng -= 360
          }
          while (lng - prevLng < -180) {
            lng += 360
          }
        }

        // Skip consecutive duplicate coordinates to prevent zero-length sub-elements
        if (points.length > 0) {
          const last = points[points.length - 1]
          if (Math.abs(lng - last.x) < 1e-6 && Math.abs(lat - last.y) < 1e-6) {
            continue
          }
        }

        points.push(new THREE.Vector2(lng, lat))
        prevLng = lng
      }

      // GeoJSON coordinates close by repeating the first vertex at the end.
      // In Three.js, standard ear-clipping triangulation (ShapeGeometry) fails
      // if the starting point is repeated at the end, as it creates a degenerate
      // zero-length segment that breaks concave triangle calculations.
      // We safely pop the redundant closing duplicate point, accounting for 360-degree wrap-around:
      if (points.length > 2) {
        const first = points[0]
        const last = points[points.length - 1]
        const diffX = Math.abs(first.x - last.x) % 360
        const isCloseX = diffX < 1e-6 || Math.abs(diffX - 360) < 1e-6
        if (isCloseX && Math.abs(first.y - last.y) < 1e-6) {
          points.pop()
        }
      }

      return points
    }

    const processPolygon = (polygonCoords: number[][][]) => {
      const outerRing = polygonCoords[0]
      if (!outerRing || outerRing.length === 0) return

      const cleanOuter = cleanRing(outerRing)
      if (cleanOuter.length < 3) return // Invalid polygon

      // Create flat 2D shape using clean, non-degenerate vertices
      const shape = new THREE.Shape()
      shape.moveTo(cleanOuter[0].x, cleanOuter[0].y)
      for (let i = 1; i < cleanOuter.length; i++) {
        shape.lineTo(cleanOuter[i].x, cleanOuter[i].y)
      }

      // Process interior rings (holes) using clean coordinates
      for (let h = 1; h < polygonCoords.length; h++) {
        const holeRing = polygonCoords[h]
        const cleanHole = cleanRing(holeRing)
        if (cleanHole.length >= 3) {
          const holePath = new THREE.Path()
          holePath.moveTo(cleanHole[0].x, cleanHole[0].y)
          for (let i = 1; i < cleanHole.length; i++) {
            holePath.lineTo(cleanHole[i].x, cleanHole[i].y)
          }
          shape.holes.push(holePath)
        }
      }

      // Generate flat mesh geometry
      const meshGeom = new THREE.ShapeGeometry(shape)

      // Project flat 2D vertices to 3D Sphere Surface and recursively subdivide them
      const projectedGeom = subdivideAndProjectGeometry(meshGeom, radius, 3.0)
      meshes.push(projectedGeom)

      // Build sharp outline borders using clean points
      const linePoints: THREE.Vector3[] = []
      for (let i = 0; i < cleanOuter.length; i++) {
        const pt = cleanOuter[i]
        const nextPt = cleanOuter[(i + 1) % cleanOuter.length]

        // Interpolate points for long boundary segments to prevent them from sinking
        const dist = pt.distanceTo(nextPt)
        if (dist > 3.0) {
          const numSubdivisions = Math.ceil(dist / 3.0)
          for (let s = 0; s < numSubdivisions; s++) {
            const t = s / numSubdivisions
            const interpolated = new THREE.Vector2().lerpVectors(pt, nextPt, t)
            linePoints.push(latLngToVector3(interpolated.y, interpolated.x, radius + 0.001))
          }
        } else {
          linePoints.push(latLngToVector3(pt.y, pt.x, radius + 0.001))
        }
      }
      const lineGeom = new THREE.BufferGeometry().setFromPoints(linePoints)
      lines.push(lineGeom)
    }

    if (type === 'Polygon') {
      processPolygon(coordinates)
    } else if (type === 'MultiPolygon') {
      coordinates.forEach((polygonCoords) => {
        processPolygon(polygonCoords)
      })
    }

    return { meshes, lines }
  }, [feature, radius])

  // 2. Compute Centroid for Click Focus
  const centroidVector3 = useMemo(() => {
    const { type, coordinates } = feature.geometry
    const [lat, lng] = calculateCentroid(coordinates, type)
    return latLngToVector3(lat, lng, radius)
  }, [feature, radius])

  // Mouse event handlers
  const handlePointerOver = (e: any) => {
    e.stopPropagation()
    setHovered(true)
    if (onHover) onHover(feature.properties.name)
  }

  const handlePointerOut = (e: any) => {
    e.stopPropagation()
    setHovered(false)
    if (onHover) onHover(null)
  }

  const handleClick = (e: any) => {
    e.stopPropagation()
    if (onClick) {
      const name = feature.properties.name
      const iso = feature.properties.iso_a3 || String(feature.id || 'N/A')
      onClick(name, iso, [centroidVector3.x, centroidVector3.y, centroidVector3.z])
    }
  }

  return (
    <group>
      {/* A. Filled Country Meshes for Interaction */}
      {geometries.meshes.map((geom, idx) => (
        <mesh
          key={`mesh-${idx}`}
          geometry={geom}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onClick={handleClick} // Standard R3F onClick filters drag events
        >
          <meshBasicMaterial
            color={hovered ? hoverColor : color}
            transparent
            opacity={hovered ? hoverOpacity : opacity}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* B. Sharp Borders Outline */}
      {showBorders && geometries.lines.map((geom, idx) => (
        <lineLoop key={`line-${idx}`} geometry={geom}>
          <lineBasicMaterial
            color={hovered ? '#ffffff' : '#6366f1'} // Vibrant neon indigo lines
            transparent
            opacity={hovered ? Math.min(1.0, hoverOpacity + 0.1) : Math.min(1.0, opacity + 0.1)} // Vibrant borders
            linewidth={1}
          />
        </lineLoop>
      ))}
    </group>
  )
})

CountryMesh.displayName = 'CountryMesh'
