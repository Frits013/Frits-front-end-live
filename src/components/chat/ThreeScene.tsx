import { useEffect, useRef } from "react";
import * as THREE from "three";

interface ThreeSceneProps {
  isThinking: boolean;
  audioData?: number[];
}

const ThreeScene = ({ isThinking, audioData }: ThreeSceneProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const brainRef = useRef<THREE.Group | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const nodesRef = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 8, 20);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 10;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(500, 500);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    // Create brain group
    const brainGroup = new THREE.Group();
    brainRef.current = brainGroup;

    // Create neural network nodes
    const createNode = (x: number, y: number, z: number) => {
      const geometry = new THREE.SphereGeometry(0.2, 16, 16);
      const material = new THREE.MeshPhysicalMaterial({
        color: 0xE5DEFF,
        metalness: 0.2,
        roughness: 0.3,
        transmission: 0.2,
        thickness: 0.5,
        emissive: 0x8B5CF6,
        emissiveIntensity: 0.2,
      });
      const node = new THREE.Mesh(geometry, material);
      node.position.set(
        x + (Math.random() - 0.5) * 2,
        y + (Math.random() - 0.5) * 2,
        z + (Math.random() - 0.5) * 2
      );
      return node;
    };

    // Create neural connections
    const createConnection = (start: THREE.Vector3, end: THREE.Vector3) => {
      const points = [];
      points.push(start);
      points.push(end);

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0xD6BCFA,
        transparent: true,
        opacity: 0.3,
      });
      return new THREE.Line(geometry, material);
    };

    // Generate brain structure
    const nodes: THREE.Mesh[] = [];
    for (let i = 0; i < 100; i++) {
      const radius = 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      const node = createNode(x, y, z);
      nodes.push(node);
      brainGroup.add(node);
    }
    nodesRef.current = nodes;

    // Create connections between nearby nodes
    nodes.forEach((node, i) => {
      nodes.slice(i + 1).forEach(otherNode => {
        const distance = node.position.distanceTo(otherNode.position);
        if (distance < 2) {
          const connection = createConnection(node.position, otherNode.position);
          brainGroup.add(connection);
        }
      });
    });

    scene.add(brainGroup);

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0xD6BCFA, 5);
    pointLight1.position.set(-3, 2, 4);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xD3E4FD, 5);
    pointLight2.position.set(3, -2, 4);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0x33C3F0, 4);
    pointLight3.position.set(0, 3, 4);
    scene.add(pointLight3);

    const animate = () => {
      requestAnimationFrame(animate);

      if (brainRef.current) {
        if (isThinking) {
          const time = Date.now() * 0.001;
          brainRef.current.rotation.y += 0.01; // Reduced from 0.03
          brainRef.current.rotation.x += Math.sin(time) * 0.005; // Reduced from 0.01
        } else {
          const time = Date.now() * 0.001;
          brainRef.current.rotation.y += 0.002; // Reduced from 0.005
          brainRef.current.rotation.x = Math.sin(time * 0.5) * 0.1;
          brainRef.current.position.y = Math.sin(time * 0.5) * 0.1;
        }

        // Apply audio-reactive scaling to nodes
        if (audioData && audioData.length > 0) {
          nodesRef.current.forEach((node, i) => {
            const audioIndex = i % audioData.length;
            const scale = 1 + audioData[audioIndex] * 2; // Scale based on audio amplitude
            node.scale.set(scale, scale, scale);
            
            // Update emissive intensity based on audio
            const material = node.material as THREE.MeshPhysicalMaterial;
            material.emissiveIntensity = 0.2 + audioData[audioIndex] * 2;
          });
        } else {
          // Default pulsing when no audio
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
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(500, 500);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isThinking, audioData]);

  return (
    <div className="flex justify-center">
      <div className="relative w-[500px] h-[500px] bg-gradient-to-b from-transparent to-purple-50/20 dark:to-purple-900/20 rounded-full">
        <canvas ref={canvasRef} className="absolute inset-0" />
      </div>
    </div>
  );
};

export default ThreeScene;
