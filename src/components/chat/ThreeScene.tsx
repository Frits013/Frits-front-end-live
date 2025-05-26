
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { setupScene, setupLighting } from "./three/SceneSetup";
import { createBrainStructure } from "./three/BrainStructure";
import ChatHeader from "./ChatHeader";
import { useAuthOperations } from "@/hooks/use-auth-operations";

interface ThreeSceneProps {
  isThinking: boolean;
  audioData?: number[];
}

const ThreeScene = ({ isThinking, audioData }: ThreeSceneProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const brainRef = useRef<THREE.Group | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const nodesRef = useRef<THREE.Mesh[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const { handleSignOut } = useAuthOperations();

  // Initial setup
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const initializeScene = () => {
      const container = containerRef.current;
      if (!container) return;

      // Get actual container dimensions
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      if (containerWidth === 0 || containerHeight === 0) {
        // If container has no size yet, try again in the next frame
        requestAnimationFrame(initializeScene);
        return;
      }
      
      console.log("Initializing scene with dimensions:", containerWidth, containerHeight);

      // Initialize scene, camera, and renderer with container dimensions
      const { scene, camera, renderer } = setupScene(canvasRef.current!, containerWidth, containerHeight);
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
    };

    // Run initialization
    initializeScene();

    // Setup ResizeObserver to handle container resizing from the resizable panels
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (!cameraRef.current || !rendererRef.current) continue;
        
        const width = entry.contentRect.width;
        const height = entry.contentRect.height;
        
        if (width === 0 || height === 0) continue;
        
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(width, height);
      }
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
      resizeObserverRef.current = resizeObserver;
    }

    // Cleanup function
    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, []);

  // Animation loop
  useEffect(() => {
    if (!isInitialized) return;
    
    const animate = () => {
      if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;
      
      requestAnimationFrame(animate);

      if (brainRef.current) {
        if (isThinking) {
          // Only rotate on Y axis with slower rotation
          brainRef.current.rotation.y += 0.005;
        }

        // Apply audio-reactive scaling to nodes or default pulsing animation
        if (audioData && audioData.length > 0) {
          nodesRef.current.forEach((node, i) => {
            const audioIndex = i % audioData.length;
            const scale = 1 + audioData[audioIndex] * 2;
            node.scale.set(scale, scale, scale);
            
            const material = node.material as THREE.MeshPhysicalMaterial;
            material.emissiveIntensity = 0.2 + audioData[audioIndex] * 2;
          });
        } else {
          const time = Date.now() * 0.001;
          nodesRef.current.forEach((node, i) => {
            const pulseScale = 1 + Math.sin(time * 3 + i * 0.1) * 0.1;
            node.scale.set(pulseScale, pulseScale, pulseScale);
          });
        }
      }

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    animate();
  }, [isInitialized, isThinking, audioData]);

  // Handle window resize events separately from ResizeObserver
  useEffect(() => {
    if (!isInitialized) return;
    
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = containerRect.width;
      const newHeight = containerRect.height;
      
      if (newWidth === 0 || newHeight === 0) return;
      
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, [isInitialized]);

  return (
    <div className="relative w-full h-full">
      <div 
        ref={containerRef}
        className="w-full h-full bg-gradient-to-b from-transparent to-purple-50/20 dark:to-purple-900/20 rounded-full relative"
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        
        {/* Profile button positioned to align with send button */}
        <div className="absolute top-4 right-4 z-50">
          <ChatHeader onSignOut={handleSignOut} isInCanvas={true} />
        </div>
        
        {isThinking && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/80 dark:bg-black/80 backdrop-blur-sm px-4 py-2 rounded-full">
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400 animate-pulse">
                Thinking...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreeScene;
