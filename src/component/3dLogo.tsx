import { useRef, Suspense, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Environment } from '@react-three/drei'
import * as THREE from 'three'

// Owl Model Component with GLB loading
function OwlModel({ mouse }: { mouse: { x: number; y: number } }) {
  const groupRef = useRef<THREE.Group>(null)
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const targetRotation = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  
  // Smooth interpolation factor
  const SMOOTH_FACTOR = 0.15
  
  // Load your GLB model from public directory
  const gltf = useGLTF('/Owl.glb')
  
  // Fix model orientation on load
  useEffect(() => {
    if (gltf.scene) {
      gltf.scene.rotation.set(0, Math.PI, 0)
      gltf.scene.scale.set(1.2, 1.2, 1.2)
      gltf.scene.position.set(0, -0.3, 0)
    }
  }, [gltf.scene])
  
  // Update mouse ref on prop change with debouncing
  useEffect(() => {
    mouseRef.current = { ...mouse }
    
    // Calculate target rotation with enhanced response
    const rotationFactor = 0.7
    const rotationLimit = 0.5
    
    targetRotation.current.y = THREE.MathUtils.clamp(
      mouse.x * rotationFactor,
      -rotationLimit,
      rotationLimit
    )
    targetRotation.current.x = THREE.MathUtils.clamp(
      -mouse.y * rotationFactor * 0.6,
      -rotationLimit * 0.8,
      rotationLimit * 0.8
    )
  }, [mouse.x, mouse.y])
  
  useFrame(() => {
    if (groupRef.current) {
      // Smooth interpolation using exponential smoothing
      groupRef.current.rotation.y += (targetRotation.current.y - groupRef.current.rotation.y) * SMOOTH_FACTOR
      groupRef.current.rotation.x += (targetRotation.current.x - groupRef.current.rotation.x) * SMOOTH_FACTOR
      
      // Subtle floating animation with smooth easing
      const time = Date.now() * 0.001
      groupRef.current.position.y = -0.3 + Math.sin(time) * 0.02
      
      // Add slight head nod for natural movement
      groupRef.current.rotation.z = Math.sin(time * 0.5) * 0.02
      
      // Scale animation based on mouse movement intensity
      const moveIntensity = Math.abs(mouse.x) + Math.abs(mouse.y)
      const targetScale = 1.2 + moveIntensity * 0.05
      groupRef.current.scale.x += (targetScale - groupRef.current.scale.x) * 0.05
      groupRef.current.scale.y += (targetScale - groupRef.current.scale.y) * 0.05
      groupRef.current.scale.z += (targetScale - groupRef.current.scale.z) * 0.05
    }
  })

  return (
    <group ref={groupRef}>
      <primitive object={gltf.scene} />
    </group>
  )
}

// Fallback loading component
function LoadingFallback() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01
    }
  })

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[0.8, 0.8, 0.8]} />
      <meshStandardMaterial color="#6366f1" wireframe />
    </mesh>
  )
}

interface InteractiveOwl3DProps {
  mouse: { x: number; y: number }
}

export default function InteractiveOwl3D({ mouse }: InteractiveOwl3DProps) {
  return (
    <Canvas
      style={{ 
        width: '100%',
        height: '320px',
        pointerEvents: 'none',
        background: 'transparent'
      }}
      camera={{ 
        position: [0, 0.2, 3.5],
        fov: 55 
      }}
      shadows
      dpr={[1, 2]} // Enable high DPI rendering for smoothness
    >
      {/* Dark theme lighting - dramatic and focused */}
      <ambientLight intensity={0.6} color="#a78bfa" />
      
      {/* Main key light - purple accent from top right */}
      <directionalLight 
        position={[5, 6, 4]} 
        intensity={1.5} 
        color="#8b5cf6"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-bias={-0.0001}
      />
      
      {/* Fill light - subtle blue from left */}
      <directionalLight 
        position={[-4, 3, 3]} 
        intensity={0.8} 
        color="#6366f1" 
        castShadow
      />
      
      {/* Rim light - violet from behind */}
      <directionalLight 
        position={[0, 3, -4]} 
        intensity={0.7} 
        color="#a855f7" 
      />
      
      {/* Accent point light for glow effect */}
      <pointLight 
        position={[0, 2, 2]} 
        intensity={0.5} 
        color="#c4b5fd" 
        distance={8}
        decay={1.5}
      />
      
      {/* Subtle purple glow around owl */}
      <pointLight 
        position={[0, 1, 1]} 
        intensity={0.3} 
        color="#8b5cf6" 
        distance={6}
        decay={2}
      />
      
      {/* Environment for reflections - dark theme */}
      <Environment 
        preset="night"
        background={false}
        environmentIntensity={0.4}
      />
      
      {/* Subtle fog for depth - dark purple */}
      <fog attach="fog" args={['#0f172a', 4, 12]} />
      
      {/* Main 3D Owl */}
      <Suspense fallback={<LoadingFallback />}>
        <OwlModel mouse={mouse} />
      </Suspense>
      
      {/* Enhanced shadow plane with gradient */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.8, 0]} 
        receiveShadow
      >
        <planeGeometry args={[5, 5]} />
        <meshStandardMaterial 
          transparent 
          opacity={0.15} 
          color="#4c1d95"
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Additional ground plane for better shadows */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.85, 0]} 
        receiveShadow
      >
        <circleGeometry args={[3, 32]} />
        <shadowMaterial 
          transparent 
          opacity={0.2} 
          color="#1e1b4b"
        />
      </mesh>
    </Canvas>
  )
}

// Preload the model
useGLTF.preload('/Owl.glb')