import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createBrainStructure } from './three/BrainStructure';
import { setupScene, setupLighting } from './three/SceneSetup';

interface InterviewBrainVisualizerProps {
  isThinking: boolean;
  currentPhase?: string;
  progress?: number;
  sessionId: string | null;
}

const InterviewBrainVisualizer: React.FC<InterviewBrainVisualizerProps> = ({ 
  isThinking, 
  currentPhase = 'Introduction',
  progress = 0,
  sessionId 
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const brainRef = useRef<THREE.Group | null>(null);
  const nodesRef = useRef<THREE.Mesh[]>([]);
  const animationIdRef = useRef<number | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!mountRef.current || !canvasRef.current) return;

    const container = mountRef.current;
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    if (containerWidth === 0 || containerHeight === 0) return;

    // Initialize scene, camera, and renderer
    const { scene, camera, renderer } = setupScene(canvasRef.current, containerWidth, containerHeight);
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // Setup lighting
    setupLighting(scene);

    // Create brain structure
    const { brainGroup, nodes } = createBrainStructure();
    brainRef.current = brainGroup;
    nodesRef.current = nodes;
    scene.add(brainGroup);

    setIsInitialized(true);

    // Animation loop
    const animate = () => {
      if (!sceneRef.current || !rendererRef.current || !cameraRef.current || !brainRef.current) return;

      // Update brain colors based on current phase
      updateBrainColors(currentPhase, isThinking, progress);

      // Auto-rotate based on phase
      const rotationSpeed = getRotationSpeed(currentPhase, isThinking);
      brainRef.current.rotation.y += rotationSpeed;

      // Add pulsing effect when thinking
      if (isThinking) {
        const pulse = Math.sin(Date.now() * 0.005) * 0.1 + 1;
        brainRef.current.scale.setScalar(pulse);
      } else {
        brainRef.current.scale.setScalar(1);
      }

      rendererRef.current.render(sceneRef.current, cameraRef.current);
      animationIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [sessionId]);

  // Update brain colors based on phase
  const updateBrainColors = (phase: string, thinking: boolean, progress: number) => {
    if (!nodesRef.current.length) return;

    const colors = getPhaseColors(phase, thinking);
    const intensity = thinking ? 0.8 : 0.4;

    nodesRef.current.forEach((node, index) => {
      const material = node.material as THREE.MeshBasicMaterial;
      const t = (index / nodesRef.current.length + Date.now() * 0.001) % 1;
      const color = new THREE.Color().lerpColors(colors.primary, colors.secondary, t);
      material.color = color;
      material.opacity = intensity;
    });
  };

  // Get colors for different phases
  const getPhaseColors = (phase: string, thinking: boolean) => {
    const baseColors = {
      'introduction': { primary: new THREE.Color(0x60A5FA), secondary: new THREE.Color(0x34D399) },
      'core questions': { primary: new THREE.Color(0xA78BFA), secondary: new THREE.Color(0xF472B6) },
      'summary': { primary: new THREE.Color(0x34D399), secondary: new THREE.Color(0x60A5FA) },
      'conclusion': { primary: new THREE.Color(0xFB7185), secondary: new THREE.Color(0xFBBF24) }
    };

    const colors = baseColors[phase.toLowerCase() as keyof typeof baseColors] || baseColors['core questions'];
    
    if (thinking) {
      return {
        primary: colors.primary.clone().multiplyScalar(1.5),
        secondary: colors.secondary.clone().multiplyScalar(1.5)
      };
    }
    
    return colors;
  };

  const getRotationSpeed = (phase: string, thinking: boolean) => {
    const baseSpeed = 0.002;
    const thinkingMultiplier = thinking ? 2 : 1;
    
    switch (phase.toLowerCase()) {
      case 'introduction':
        return baseSpeed * 0.5 * thinkingMultiplier;
      case 'core questions':
        return baseSpeed * 1.5 * thinkingMultiplier;
      case 'summary':
        return baseSpeed * 1.2 * thinkingMultiplier;
      case 'conclusion':
        return baseSpeed * 0.8 * thinkingMultiplier;
      default:
        return baseSpeed * thinkingMultiplier;
    }
  };

  return (
    <div className="relative w-full h-full">
      <div
        ref={mountRef}
        className="w-full h-full"
        style={{ minHeight: '200px' }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full"
        />
      </div>
      
      {/* Phase indicator overlay */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {currentPhase}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {Math.round(progress)}% Complete
          </div>
        </div>
      </div>

      {/* Status overlay */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className={`bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg transition-all duration-300 ${
          isThinking ? 'animate-pulse' : ''
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              isThinking 
                ? 'bg-blue-500 animate-pulse' 
                : 'bg-green-500'
            }`} />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {isThinking ? 'Analyzing...' : 'Ready'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewBrainVisualizer;