import React, { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'

interface CameraControllerProps {
  targetPosition: [number, number, number] | null
}

export const CameraController: React.FC<CameraControllerProps> = ({ targetPosition }) => {
  const { camera, controls } = useThree()

  useEffect(() => {
    if (!controls) return

    const ctrl = controls as any
    const duration = 1.2 // Smooth 1.2 second animation transition
    const ease = 'power2.out'

    // Crucial: The OrbitControls target MUST ALWAYS be locked at (0, 0, 0)
    // to keep the Earth perfectly centered in the screen.
    // Shifting the target to the country centroid causes the rotation pivot
    // to shift to the surface of the sphere, causing the globe to wobble and drift.
    // Instead, we keep target at (0,0,0) and only animate camera position!
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
      // 1. FOCUS STATE: Zoom camera closer along the country centroid's vector
      const targetVec = new THREE.Vector3(...targetPosition)
      const dir = targetVec.clone().normalize()
      
      // Position the camera directly in front of the centroid, at distance = 2.1
      const desiredCamPos = dir.clone().multiplyScalar(2.1)

      // GSAP smooth camera position movement
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
      // 2. GLOBAL STATE: Return camera to global overview distance (3.5)
      const currentDir = camera.position.clone().normalize()
      const desiredCamPos = currentDir.multiplyScalar(3.5)

      // GSAP smooth camera zoom out
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
  }, [targetPosition, camera, controls])

  return null
}
