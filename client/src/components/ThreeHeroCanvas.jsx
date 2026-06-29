import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';
import * as THREE from 'three';

// Suppress internal library THREE.Clock deprecation warnings
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('THREE.Clock')) {
      return;
    }
    originalWarn(...args);
  };
}

// Interactive floating component model (procedural phone parts)
function PhonePartsGroup({ mouse }) {
  const groupRef = useRef();

  useFrame((state) => {
    // Parallax effect based on mouse coordinates
    const targetX = (mouse.current[0] * Math.PI) / 8;
    const targetY = (mouse.current[1] * Math.PI) / 8;

    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetX, 0.05);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetY, 0.05);
  });

  return (
    <group ref={groupRef}>
      {/* 1. Phone Main Chassis/Frame */}
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.8}>
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[3, 5.5, 0.15]} />
          <meshPhysicalMaterial 
            color="#1E293B" 
            roughness={0.2} 
            metalness={0.9} 
            clearcoat={1.0}
            clearcoatRoughness={0.1}
          />
        </mesh>
      </Float>

      {/* 2. Glass Screen Layer (slightly separated) */}
      <Float speed={1.8} rotationIntensity={0.4} floatIntensity={0.6}>
        <mesh position={[0, 0, 0.12]}>
          <boxGeometry args={[2.8, 5.3, 0.02]} />
          <meshPhysicalMaterial
            color="#FFC93C" // Luxury Gold tinted glass screen
            transparent
            opacity={0.3}
            roughness={0.1}
            metalness={0.1}
            transmission={0.9}
            ior={1.5}
          />
        </mesh>
      </Float>

      {/* 3. Internal Motherboard Flex Board (separated backwards) */}
      <Float speed={1.2} rotationIntensity={0.6} floatIntensity={1.0}>
        <group position={[0, 0.8, -0.2]}>
          {/* Main PCB board */}
          <mesh>
            <boxGeometry args={[2.4, 2, 0.08]} />
            <meshStandardMaterial color="#064E3B" roughness={0.8} metalness={0.2} />
          </mesh>
          {/* Microprocessor Chip */}
          <mesh position={[0, 0, 0.06]}>
            <boxGeometry args={[0.8, 0.8, 0.05]} />
            <meshStandardMaterial color="#1E293B" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Gold Circuit details */}
          <mesh position={[0.4, 0.3, 0.06]}>
            <boxGeometry args={[0.2, 0.4, 0.05]} />
            <meshStandardMaterial color="#FFC93C" metalness={1.0} roughness={0.1} />
          </mesh>
        </group>
      </Float>

      {/* 4. Replacement Battery Pack (separated downwards/backwards) */}
      <Float speed={1.6} rotationIntensity={0.3} floatIntensity={1.2}>
        <mesh position={[0, -1.2, -0.18]}>
          <boxGeometry args={[2.2, 2.2, 0.1]} />
          <meshStandardMaterial 
            color="#111827" 
            metalness={0.8} 
            roughness={0.4} 
            emissive="#FFC93C" 
            emissiveIntensity={0.1} 
          />
        </mesh>
      </Float>

      {/* 5. Triple Camera Lens Module (separated backwards top) */}
      <Float speed={2.0} rotationIntensity={0.8} floatIntensity={0.7}>
        <group position={[-0.7, 1.8, -0.25]}>
          {/* Lens housing */}
          <mesh>
            <boxGeometry args={[1, 1, 0.1]} />
            <meshPhysicalMaterial color="#334155" roughness={0.2} metalness={0.9} />
          </mesh>
          {/* Top Lens */}
          <mesh position={[0, 0, 0.07]}>
            <cylinderGeometry args={[0.25, 0.25, 0.08, 32]} rotation={[Math.PI / 2, 0, 0]} />
            <meshPhysicalMaterial color="#000000" roughness={0.05} metalness={0.9} transmission={0.9} ior={1.8} />
          </mesh>
        </group>
      </Float>
    </group>
  );
}

export default function ThreeHeroCanvas() {
  const mouse = useRef([0, 0]);

  useEffect(() => {
    const handleMouseMove = (event) => {
      // Normalize mouse positions to [-1, 1]
      mouse.current = [
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1,
      ];
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="w-full h-full relative min-h-[450px] md:min-h-[600px] flex items-center justify-center">
      {/* Background radial gradient mask */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent to-brand-bg pointer-events-none z-10" />
      
      <Canvas
        camera={{ position: [0, 0, 7.5], fov: 45 }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#FFC93C" />
        <directionalLight position={[-10, 10, 5]} intensity={1} color="#FFFFFF" />
        <spotLight position={[0, 5, 10]} angle={0.3} penumbra={1} intensity={1} castShadow />

        <group position={[0, 0.4, 0]}>
          <PhonePartsGroup mouse={mouse} />
        </group>

        {/* Podium Base */}
        <mesh position={[0, -2.4, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[2.2, 2.2, 0.4, 64]} />
          <meshPhysicalMaterial 
            color="#111827" 
            roughness={0.4} 
            metalness={0.8}
            clearcoat={0.5} 
          />
        </mesh>
        
        {/* Glowing Yellow Neon Ring at the base of the podium */}
        <mesh position={[0, -2.59, 0]}>
          <cylinderGeometry args={[2.24, 2.24, 0.05, 64]} />
          <meshBasicMaterial color="#F7B500" toneMapped={false} />
        </mesh>

        {/* Large metallic sphere on the left */}
        <mesh position={[-2.3, -2.0, 0.8]} castShadow>
          <sphereGeometry args={[0.45, 32, 32]} />
          <meshPhysicalMaterial 
            color="#CCCCCC" 
            roughness={0.05} 
            metalness={0.9} 
            clearcoat={1.0} 
          />
        </mesh>

        {/* Small golden sphere on the right */}
        <mesh position={[2.5, -1.8, -0.5]} castShadow>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshPhysicalMaterial 
            color="#F7B500" 
            roughness={0.1} 
            metalness={0.9} 
          />
        </mesh>
        
        {/* Tech Particles */}
        <Stars radius={100} depth={50} count={1200} factor={4} saturation={0.5} fade speed={1.5} />
      </Canvas>
    </div>
  );
}
