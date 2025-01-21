import { useEffect, useRef } from "react";
import * as THREE from "three";
import { setupScene, setupLighting } from "./three/SceneSetup";
import { createBrainStructure } from "./three/BrainStructure";

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

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Initialize scene, camera, and renderer with container dimensions
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

    const animate = () => {
      requestAnimationFrame(animate);

      if (brainRef.current) {
        if (isThinking) {
          const time = Date.now() * 0.001;
          brainRef.current.rotation.y += 0.01;
          brainRef.current.rotation.x += Math.sin(time) * 0.005;
        } else {
          const time = Date.now() * 0.001;
          brainRef.current.rotation.y += 0.002;
          brainRef.current.rotation.x = Math.sin(time * 0.5) * 0.1;
          brainRef.current.position.y = Math.sin(time * 0.5) * 0.1;
        }

        // Apply audio-reactive scaling to nodes
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

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current || !containerRef.current) return;
      
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isThinking, audioData]);

  return (
    <div className="flex justify-center w-full">
      <div 
        ref={containerRef}
        className="relative w-full aspect-square max-w-[800px] bg-gradient-to-b from-transparent to-purple-50/20 dark:to-purple-900/20 rounded-full"
      >
        <canvas ref={canvasRef} className="absolute inset-0" />
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