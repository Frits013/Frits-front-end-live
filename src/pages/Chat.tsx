import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import * as THREE from "three";
import { useEffect, useRef } from "react";
import { Send } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sphereRef = useRef<THREE.Mesh | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const isThinkingRef = useRef(false);

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current) return;

    // Scene setup with fog for depth
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 5, 15);
    sceneRef.current = scene;

    // Camera setup with adjusted position
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 7;
    cameraRef.current = camera;

    // Enhanced renderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(400, 400); // Increased size
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    rendererRef.current = renderer;

    // Create complex sphere geometry
    const geometry = new THREE.IcosahedronGeometry(2, 4); // Larger and more detailed
    
    // Create complex material with custom shading
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x3b82f6,
      metalness: 0.2,
      roughness: 0.3,
      clearcoat: 1.0,
      clearcoatRoughness: 0.3,
      emissive: 0x072f5f,
      envMapIntensity: 1.2,
      transmission: 0.2,
      opacity: 0.9,
      transparent: true,
      side: THREE.DoubleSide
    });

    const sphere = new THREE.Mesh(geometry, material);
    sphereRef.current = sphere;
    scene.add(sphere);

    // Enhanced lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0x3b82f6, 4);
    pointLight1.position.set(-2, 1, 4);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x3b82f6, 4);
    pointLight2.position.set(2, -1, 4);
    scene.add(pointLight2);

    // Animation loop with enhanced effects
    const animate = () => {
      requestAnimationFrame(animate);

      if (sphereRef.current) {
        if (isThinkingRef.current) {
          // Enhanced thinking animation
          const time = Date.now() * 0.001;
          const pulseScale = 1 + Math.sin(time * 3) * 0.1;
          sphereRef.current.scale.set(pulseScale, pulseScale, pulseScale);
          sphereRef.current.rotation.y += 0.03;
          sphereRef.current.rotation.x += Math.sin(time) * 0.01;
          
          // Dynamic vertex displacement
          const positions = geometry.attributes.position.array;
          for (let i = 0; i < positions.length; i += 3) {
            const time = Date.now() * 0.001;
            positions[i + 1] += Math.sin(time + positions[i]) * 0.002;
          }
          geometry.attributes.position.needsUpdate = true;
        } else {
          // Enhanced idle animation
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

    // Enhanced window resize handler
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(400, 400);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage("");

    // Simulate agent thinking
    isThinkingRef.current = true;

    // Simulate agent response (replace with actual backend call later)
    setTimeout(() => {
      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "This is a placeholder response. Connect your backend to get real responses from Frits.",
        sender: 'agent',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, agentResponse]);
      isThinkingRef.current = false;
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Sphere Container */}
        <div className="flex justify-center">
          <div className="relative w-[400px] h-[400px] bg-gradient-to-b from-transparent to-blue-50/20 dark:to-blue-950/20 rounded-full">
            <canvas ref={canvasRef} className="absolute inset-0" />
          </div>
        </div>

        {/* Chat Container */}
        <Card className="p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-blue-100 dark:border-blue-900 shadow-lg">
          <div className="h-[400px] overflow-y-auto mb-4 space-y-4 p-4 scrollbar-thin scrollbar-thumb-blue-200 dark:scrollbar-thumb-blue-800 scrollbar-track-transparent">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white ml-4'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 mr-4'
                  } transition-all duration-200 hover:shadow-md`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-blue-100 dark:border-blue-900 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Chat;
