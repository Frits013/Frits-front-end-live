import { useEffect, useRef } from "react";
import * as THREE from "three";

interface ThreeSceneProps {
  isThinking: boolean;
}

const ThreeScene = ({ isThinking }: ThreeSceneProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sphereRef = useRef<THREE.Mesh | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Scene setup with enhanced fog
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 8, 20);
    sceneRef.current = scene;

    // Camera setup with adjusted position
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 10;
    cameraRef.current = camera;

    // Enhanced renderer setup
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

    // Create complex sphere geometry with more detail
    const geometry = new THREE.IcosahedronGeometry(3, 5);
    
    // Create network pattern texture
    const textureSize = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = textureSize;
    canvas.height = textureSize;
    const ctx = canvas.getContext('2d')!;
    
    // Draw network pattern
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, textureSize, textureSize);
    
    ctx.strokeStyle = '#D6BCFA50';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 50; i++) {
      const x1 = Math.random() * textureSize;
      const y1 = Math.random() * textureSize;
      const x2 = x1 + (Math.random() - 0.5) * 200;
      const y2 = y1 + (Math.random() - 0.5) * 200;
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    
    ctx.fillStyle = '#D3E4FD80';
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * textureSize;
      const y = Math.random() * textureSize;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xE5DEFF,
      metalness: 0.2,
      roughness: 0.3,
      clearcoat: 0.8,
      clearcoatRoughness: 0.2,
      transmission: 0.2,
      thickness: 0.5,
      envMapIntensity: 1.5,
      map: texture,
      emissive: 0x8B5CF6,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.9,
    });

    const sphere = new THREE.Mesh(geometry, material);
    sphereRef.current = sphere;
    scene.add(sphere);

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

      if (sphereRef.current) {
        if (isThinking) {
          const time = Date.now() * 0.001;
          const pulseScale = 1 + Math.sin(time * 3) * 0.1;
          sphereRef.current.scale.set(pulseScale, pulseScale, pulseScale);
          sphereRef.current.rotation.y += 0.03;
          sphereRef.current.rotation.x += Math.sin(time) * 0.01;
          
          const positions = geometry.attributes.position.array;
          for (let i = 0; i < positions.length; i += 3) {
            const time = Date.now() * 0.001;
            positions[i + 1] += Math.sin(time + positions[i]) * 0.002;
          }
          geometry.attributes.position.needsUpdate = true;
        } else {
          const time = Date.now() * 0.001;
          sphereRef.current.rotation.y += 0.005;
          sphereRef.current.rotation.x = Math.sin(time * 0.5) * 0.1;
          sphereRef.current.position.y = Math.sin(time * 0.5) * 0.1;
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
  }, [isThinking]);

  return (
    <div className="flex justify-center">
      <div className="relative w-[500px] h-[500px] bg-gradient-to-b from-transparent to-purple-50/20 dark:to-purple-900/20 rounded-full">
        <canvas ref={canvasRef} className="absolute inset-0" />
      </div>
    </div>
  );
};

export default ThreeScene;