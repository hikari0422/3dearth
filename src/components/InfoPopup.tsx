import React, { useRef, useState, useMemo } from 'react'
import { Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { WikipediaInfo } from '../services/wikipedia'

interface InfoPopupProps {
  position: [number, number, number]
  title: string
  info: WikipediaInfo | null
  loading: boolean
  onClose: () => void
}

export const InfoPopup: React.FC<InfoPopupProps> = ({
  position,
  title,
  info,
  loading,
  onClose
}) => {
  const { camera } = useThree()
  const [visible, setVisible] = useState<boolean>(true)
  const popupRef = useRef<HTMLDivElement>(null)

  // 1. Calculate Holographic Pin points
  // points[0] = anchor on Earth surface
  // points[1] = top tip where the panel floats above the country
  const points = useMemo(() => [
    new THREE.Vector3(position[0], position[1], position[2]),
    new THREE.Vector3(position[0], position[1], position[2]).multiplyScalar(1.22)
  ], [position])

  const lineGeom = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points])

  // Occlusion Culling: Hide popup when it rotates to the back of the Earth
  useFrame(() => {
    // Position vector of popup surface anchor
    const pVec = new THREE.Vector3(...position).normalize()

    // Camera position vector normalized
    const camVec = camera.position.clone().normalize()

    // Dot product determines the angle between popup normal and camera direction
    const dot = pVec.dot(camVec)

    // A dot product threshold of 0.05 hides the card exactly as it rotates past the visible horizon
    const isVisible = dot > 0.05

    if (isVisible !== visible) {
      setVisible(isVisible)
    }
  })

  if (!visible) return null

  // Auto detect language based on title text characters
  const isChinese = title.match(/[\u4e00-\u9fa5]/)

  return (
    <group>
      {/* A. Base Anchor Dot on Earth surface */}
      <mesh position={points[0]}>
        <sphereGeometry args={[0.012, 16, 16]} />
        <meshBasicMaterial color="#ec4899" depthTest={true} />
      </mesh>

      {/* B. Glowing Holographic Pointer Line */}
      <lineSegments geometry={lineGeom}>
        <lineBasicMaterial color="#ec4899" transparent opacity={0.65} linewidth={1} depthTest={true} />
      </lineSegments>

      {/* C. Top Connector Dot */}
      <mesh position={points[1]}>
        <sphereGeometry args={[0.007, 16, 16]} />
        <meshBasicMaterial color="#38bdf8" depthTest={true} />
      </mesh>

      {/* D. HTML Information Signpost Panel */}
      <Html
        position={points[1]}
        center
        style={{
          transition: 'opacity 0.25s ease-in-out',
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? 'auto' : 'none'
        }}
      >
        <div
          ref={popupRef}
          style={{
            transform: 'translate(0, -55%)', // Align card bottom perfectly with the pin top
          }}
          className="w-60 sm:w-64 bg-slate-950/85 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl p-3.5 text-slate-100 flex flex-col gap-2.5 font-sans select-none pointer-events-auto"
          onWheel={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-bold text-base bg-gradient-to-r from-purple-400 to-pink-300 bg-clip-text text-transparent truncate w-11/12">
              {info ? info.title : title}
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              className="text-slate-500 hover:text-slate-200 transition-colors text-xs font-semibold px-1.5 py-0.5 rounded bg-slate-900/60 border border-slate-800/60 cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Content Box */}
          {loading ? (
            <div className="py-8 flex flex-col justify-center items-center gap-3">
              {/* Spinning Loader */}
              <div className="w-8 h-8 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
              <span className="text-xs text-slate-400 font-medium tracking-wide">
                {isChinese ? '正在獲取維基百科...' : 'Fetching Wikipedia...'}
              </span>
            </div>
          ) : info ? (
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
              {info.thumbnailUrl && (
                <img
                  src={info.thumbnailUrl}
                  alt={info.title}
                  className="w-full h-36 object-cover rounded-xl border border-slate-800/80 shadow-md mb-1.5 pointer-events-none"
                />
              )}
              <p className="text-xs leading-relaxed text-slate-300 font-normal">
                {info.extract}
              </p>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic">
              {isChinese ? '目前沒有相關資訊。' : 'No information available.'}
            </div>
          )}
        </div>
      </Html>
    </group>
  )
}
