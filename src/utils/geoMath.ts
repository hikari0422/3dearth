import * as THREE from 'three'

/**
 * Converts geographical coordinates (latitude/longitude) to standard 3D Cartesian coordinates.
 * This utilizes the standard spherical coordinate projection, perfectly matching
 * standard Three.js sphere texture mappings and preventing horizontal mirroring.
 *
 * @param lat - Latitude in degrees (-90 to 90)
 * @param lng - Longitude in degrees (-180 to 180)
 * @param radius - The radius of the sphere (default is 1.0)
 * @returns A THREE.Vector3 representing the point in 3D space
 */
export function latLngToVector3(lat: number, lng: number, radius: number = 1.0): THREE.Vector3 {
  const radLat = lat * (Math.PI / 180)
  const radLng = lng * (Math.PI / 180)

  // Standard direct Cartesian projection:
  // - x: East / West axis (lng increases -> moves right towards positive x)
  // - y: North / South axis (lat increases -> moves up towards positive y)
  // - z: Facing axis (Greenwich meridian lng=0, lat=0 faces positive z towards camera)
  const x = radius * Math.cos(radLat) * Math.sin(radLng)
  const y = radius * Math.sin(radLat)
  const z = radius * Math.cos(radLat) * Math.cos(radLng)

  return new THREE.Vector3(x, y, z)
}

/**
 * Computes the 3D centroid of a polygon or multipolygon geojson feature
 *
 * @param coordinates - 2D coordinates array from GeoJSON
 * @param type - Feature geometry type ('Polygon' or 'MultiPolygon')
 * @returns An array containing [lat, lng] of the centroid
 */
export function calculateCentroid(coordinates: any[], type: string): [number, number] {
  let totalLng = 0
  let totalLat = 0
  let pointsCount = 0

  const processPolygon = (polygon: any[][]) => {
    // We inspect the outer ring of the polygon (polygon[0])
    const ring = polygon[0]
    if (!ring) return
    for (let i = 0; i < ring.length - 1; i++) {
      const [lng, lat] = ring[i]
      totalLng += lng
      totalLat += lat
      pointsCount++
    }
  }

  if (type === 'Polygon') {
    processPolygon(coordinates)
  } else if (type === 'MultiPolygon') {
    coordinates.forEach((polygon) => {
      processPolygon(polygon)
    })
  }

  if (pointsCount === 0) return [0, 0]
  return [totalLat / pointsCount, totalLng / pointsCount]
}

/**
 * Computes a beautiful neon choropleth color scale based on logarithmic values.
 * Blends custom RGB values smoothly from Deep Navy (#1e1b4b) -> Purple (#a855f7) -> Neon Orange (#f97316).
 *
 * @param value - The numerical metric (GDP or Population) of the country
 * @param minVal - Minimum non-zero value in the entire dataset for scaling
 * @param maxVal - Maximum value in the entire dataset for scaling
 * @returns Hex color string (e.g. "#8b5cf6")
 */
export function getChoroplethColor(value: number, minVal: number, maxVal: number): string {
  if (value <= 0) return '#1e1b4b' // Neutral dark color for missing/zero data

  // 1. Logarithmic mapping to scale extreme population/GDP discrepancies
  const logMin = Math.log(minVal + 1)
  const logMax = Math.log(maxVal + 1)
  const logVal = Math.log(value + 1)

  // Normalize scale factor t to [0, 1]
  let t = (logVal - logMin) / (logMax - logMin)
  t = Math.max(0, Math.min(1, t)) // Clamp boundary

  // 2. Custom RGB blending gradient:
  // - Low (0.0): Deep Purple-Navy (#1e1b4b = RGB 30, 27, 75)
  // - Mid (0.5): Neon Purple/Violet (#a855f7 = RGB 168, 85, 247)
  // - High (1.0): Cyber Neon Orange (#f97316 = RGB 249, 115, 22)
  let r = 0, g = 0, b = 0

  if (t < 0.5) {
    const localT = t / 0.5
    r = Math.round(30 + (168 - 30) * localT)
    g = Math.round(27 + (85 - 27) * localT)
    b = Math.round(75 + (247 - 75) * localT)
  } else {
    const localT = (t - 0.5) / 0.5
    r = Math.round(168 + (249 - 168) * localT)
    g = Math.round(85 + (115 - 85) * localT)
    b = Math.round(247 + (22 - 247) * localT)
  }

  // Convert to formatted hex color
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

/**
 * Generates a beautiful, highly contrasting, deterministic neon/pastel color from a curated palette
 * based on a hash of the country's name. This allows the globe to be fully pre-colored
 * on mount like a premium political map, instead of rendering as a single monochrome color.
 *
 * @param str - The name of the country
 * @returns Hex color string (e.g. "#6366f1")
 */
export function getDeterministicColor(str: string): string {
  // A curated premium palette of highly harmonious neon/glassmorphism colors
  const palette = [
    '#4f46e5', // Cyber Indigo
    '#0284c7', // Sky Blue
    '#0891b2', // Neon Cyan
    '#0d9488', // Emerald Teal
    '#059669', // Emerald Green
    '#7c3aed', // Purple Violet
    '#db2777', // Rose Pink
    '#c026d3', // Fuchsia Magenta
    '#2563eb', // Royal Blue
    '#4338ca', // Dark Slate Blue
    '#475569'  // Steel Slate Gray
  ]

  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }

  // Map the hash to a deterministic index in our curated palette
  const index = Math.abs(hash) % palette.length
  return palette[index]
}

/**
 * Subdivides flat 2D triangles whose edges exceed a certain length threshold,
 * then projects the resulting vertices onto a 3D sphere surface.
 * This prevents flat triangles from "sinking" below the curved sphere surface.
 *
 * @param geom2d - The flat 2D BufferGeometry generated by ShapeGeometry
 * @param radius - The radius of the sphere
 * @param maxEdgeLength - Maximum edge length in degrees before bisection (default is 3.0)
 * @returns A new, projected 3D BufferGeometry
 */
export function subdivideAndProjectGeometry(
  geom2d: THREE.BufferGeometry,
  radius: number,
  maxEdgeLength: number = 3.0
): THREE.BufferGeometry {
  const positionAttr = geom2d.getAttribute('position')
  if (!positionAttr) return geom2d

  const indexAttr = geom2d.getIndex()

  interface Triangle2D {
    a: THREE.Vector2
    b: THREE.Vector2
    c: THREE.Vector2
  }
  const initialTriangles: Triangle2D[] = []

  const getVertex2D = (idx: number): THREE.Vector2 => {
    return new THREE.Vector2(positionAttr.getX(idx), positionAttr.getY(idx))
  }

  if (indexAttr) {
    for (let i = 0; i < indexAttr.count; i += 3) {
      const idxA = indexAttr.getX(i)
      const idxB = indexAttr.getX(i + 1)
      const idxC = indexAttr.getX(i + 2)
      initialTriangles.push({
        a: getVertex2D(idxA),
        b: getVertex2D(idxB),
        c: getVertex2D(idxC)
      })
    }
  } else {
    for (let i = 0; i < positionAttr.count; i += 3) {
      initialTriangles.push({
        a: getVertex2D(i),
        b: getVertex2D(i + 1),
        c: getVertex2D(i + 2)
      })
    }
  }

  const subdividedTriangles: Triangle2D[] = []

  const subdivide = (tri: Triangle2D) => {
    const lenAB = tri.a.distanceTo(tri.b)
    const lenBC = tri.b.distanceTo(tri.c)
    const lenCA = tri.c.distanceTo(tri.a)

    const maxLen = Math.max(lenAB, lenBC, lenCA)

    if (maxLen > maxEdgeLength) {
      if (maxLen === lenAB) {
        const mid = new THREE.Vector2().addVectors(tri.a, tri.b).multiplyScalar(0.5)
        subdivide({ a: tri.a, b: mid, c: tri.c })
        subdivide({ a: mid, b: tri.b, c: tri.c })
      } else if (maxLen === lenBC) {
        const mid = new THREE.Vector2().addVectors(tri.b, tri.c).multiplyScalar(0.5)
        subdivide({ a: tri.a, b: tri.b, c: mid })
        subdivide({ a: tri.a, b: mid, c: tri.c })
      } else {
        const mid = new THREE.Vector2().addVectors(tri.c, tri.a).multiplyScalar(0.5)
        subdivide({ a: tri.a, b: tri.b, c: mid })
        subdivide({ a: mid, b: tri.b, c: tri.c })
      }
    } else {
      subdividedTriangles.push(tri)
    }
  }

  for (const tri of initialTriangles) {
    subdivide(tri)
  }

  const vertexCount = subdividedTriangles.length * 3
  const positions = new Float32Array(vertexCount * 3)

  let offset = 0
  for (const tri of subdividedTriangles) {
    const vA = latLngToVector3(tri.a.y, tri.a.x, radius)
    const vB = latLngToVector3(tri.b.y, tri.b.x, radius)
    const vC = latLngToVector3(tri.c.y, tri.c.x, radius)

    positions[offset] = vA.x
    positions[offset + 1] = vA.y
    positions[offset + 2] = vA.z

    positions[offset + 3] = vB.x
    positions[offset + 4] = vB.y
    positions[offset + 5] = vB.z

    positions[offset + 6] = vC.x
    positions[offset + 7] = vC.y
    positions[offset + 8] = vC.z

    offset += 9
  }

  const finalGeom = new THREE.BufferGeometry()
  finalGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  finalGeom.computeVertexNormals()

  geom2d.dispose()

  return finalGeom
}

/**
 * Converts a 3D Cartesian coordinate on the Earth sphere back to geographical coordinates (latitude/longitude).
 *
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param z - Z coordinate
 * @returns An array containing [lat, lng]
 */
export function vector3ToLatLng(x: number, y: number, z: number): [number, number] {
  const radius = Math.sqrt(x * x + y * y + z * z)
  if (radius < 1e-6) return [0, 0]

  // lat = arcsin(y / radius)
  const lat = Math.asin(y / radius) * (180 / Math.PI)

  // lng = arctan2(x, z)
  const lng = Math.atan2(x, z) * (180 / Math.PI)

  return [lat, lng]
}

/**
 * Calculates a list of points along a curved Bezier arc on the sphere between two 3D vectors.
 *
 * @param a - Start Vector3
 * @param b - End Vector3
 * @param elevationFactor - How high the arc rises above the sphere surface (default 0.25)
 * @returns A list of Vector3 points forming the curve
 */
export function getSphereArcPoints(
  a: THREE.Vector3,
  b: THREE.Vector3,
  elevationFactor: number = 0.25
): THREE.Vector3[] {
  const dist = a.distanceTo(b)
  if (dist < 0.05) return [a.clone(), b.clone()]

  // Calculate normalized midpoint and scale it out to create the peak of the arc
  const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5)
  const height = 1.0 + dist * elevationFactor
  const controlPoint = mid.clone().normalize().multiplyScalar(height)

  // Generate Bezier path points
  const curve = new THREE.QuadraticBezierCurve3(a, controlPoint, b)
  return curve.getPoints(24) // 24 points for good rendering performance
}



