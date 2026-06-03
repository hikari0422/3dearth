import React, { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import { citiesDataset } from '../services/weatherDataset'
import { latLngToVector3 } from '../utils/geoMath'

interface CameraControllerProps {
  targetPosition: [number, number, number] | null
  flightActive: boolean
  onFlightEnd: () => void
  activeCountryIso: string | null
}

export const CameraController: React.FC<CameraControllerProps> = ({
  targetPosition,
  flightActive,
  onFlightEnd,
  activeCountryIso
}) => {
  const { camera, controls } = useThree()

  // 1. Precalculate 3D spline flight path
  const flightPath = useMemo(() => {
    const targetCities = activeCountryIso
      ? citiesDataset.filter((c) => c.countryIso.toUpperCase() === activeCountryIso.toUpperCase())
      : citiesDataset.filter((_, idx) => idx % 2 === 0) // Sub-sample global cities for smooth path

    if (targetCities.length < 2) return null

    // Map city coordinates to Vector3 at 1.25 radius (low altitude flight)
    const points = targetCities.map((c) => latLngToVector3(c.lat, c.lng, 1.25))
    
    // Add the first point at the end to make it a closed loop spline
    points.push(points[0].clone())

    return new THREE.CatmullRomCurve3(points, true)
  }, [activeCountryIso])

  // EFFECT A: Low Altitude Flight Path Animation
  useEffect(() => {
    if (!controls || !flightActive || !flightPath) {
      if (flightActive) {
        // Safe fallback if path cannot be created
        onFlightEnd()
      }
      return
    }

    const ctrl = controls as any
    ctrl.enabled = false // Lock manual user controls during flight

    const flightProgress = { val: 0 }
    
    // Animate spline progress factor from 0 to 0.999
    const anim = gsap.to(flightProgress, {
      val: 0.995,
      duration: activeCountryIso ? 10 : 20, // Tighter loops locally (10s) vs global (20s)
      ease: 'power1.inOut',
      onUpdate: () => {
        const t = flightProgress.val
        const currentPos = flightPath.getPointAt(t)
        const lookAtPos = flightPath.getPointAt(Math.min(0.999, t + 0.005)) // Point slightly ahead on spline

        camera.position.copy(currentPos)
        camera.lookAt(lookAtPos)
        
        // Sync OrbitControls target to lookahead point to avoid camera jump on release
        ctrl.target.copy(lookAtPos)
        ctrl.update()
      },
      onComplete: () => {
        ctrl.enabled = true
        onFlightEnd()
      }
    })

    return () => {
      anim.kill()
      ctrl.enabled = true
    }
  }, [flightActive, flightPath, camera, controls, onFlightEnd, activeCountryIso])

  // EFFECT B: Standard Focus Target Camera Zoom Transitions (GSAP)
  useEffect(() => {
    // Only animate focus targets if flight mode is inactive
    if (!controls || flightActive) return

    const ctrl = controls as any
    const duration = 1.2
    const ease = 'power2.out'

    // Lock OrbitControls target at earth origin to maintain center pivot
    gsap.to(ctrl.target, {
      x: 0,
      y: 0,
      z: 0,
      duration: duration,
      ease: ease,
      onUpdate: () => {
        ctrl.update()
      }
    })

    if (targetPosition) {
      // Zoom camera closer along selected country's centroid normal vector
      const targetVec = new THREE.Vector3(...targetPosition)
      const dir = targetVec.clone().normalize()
      const desiredCamPos = dir.multiplyScalar(2.1)

      gsap.to(camera.position, {
        x: desiredCamPos.x,
        y: desiredCamPos.y,
        z: desiredCamPos.z,
        duration: duration,
        ease: ease,
        onUpdate: () => {
          ctrl.update()
        }
      })
    } else {
      // Zoom out to global overview distance
      const currentDir = camera.position.clone().normalize()
      const desiredCamPos = currentDir.multiplyScalar(3.5)

      gsap.to(camera.position, {
        x: desiredCamPos.x,
        y: desiredCamPos.y,
        z: desiredCamPos.z,
        duration: duration,
        ease: ease,
        onUpdate: () => {
          ctrl.update()
        }
      })
    }
  }, [targetPosition, camera, controls, flightActive])

  return null
}
