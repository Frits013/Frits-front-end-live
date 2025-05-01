
import React, { useEffect, useState } from "react";
import { PartyPopper, Sparkles, Star } from "lucide-react";

interface ConfettiProps {
  active: boolean;
}

const Confetti: React.FC<ConfettiProps> = ({ active }) => {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    rotation: number;
    color: string;
    type: "star" | "sparkle" | "popper";
    opacity: number;
    delay: number;
    duration: number;
  }>>([]);

  useEffect(() => {
    if (active) {
      // Create confetti particles with more variety and quantity
      const newParticles = Array.from({ length: 60 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * -40 - 10, // Start higher above the screen
        size: Math.random() * 20 + 10,
        rotation: Math.random() * 360,
        color: [
          "#9b87f5", // Primary purple
          "#7E69AB", // Secondary purple
          "#D6BCFA", // Light purple
          "#FFDEE2", // Soft pink
          "#FEC6A1", // Soft orange
          "#D3E4FD", // Soft blue
          "#F97316", // Bright orange
          "#33C3F0", // Sky blue
          "#FF5733", // Bright red
          "#FFEC5C", // Bright yellow
          "#4CAF50", // Bright green
        ][Math.floor(Math.random() * 11)],
        type: ["star", "sparkle", "popper"][
          Math.floor(Math.random() * 3)
        ] as "star" | "sparkle" | "popper",
        opacity: Math.random() * 0.5 + 0.5,
        delay: Math.random() * 2,
        duration: Math.random() * 1 + 1.5, // Random duration between 1.5-2.5s
      }));

      setParticles(newParticles);
      
      // Clean up particles after 6 seconds
      const timer = setTimeout(() => {
        setParticles([]);
      }, 6000);
      
      return () => clearTimeout(timer);
    } else {
      setParticles([]);
    }
  }, [active]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[999] overflow-hidden">
      {particles.map((particle) => {
        // Determine which icon to use
        const ParticleIcon = 
          particle.type === "star" ? Star : 
          particle.type === "sparkle" ? Sparkles : 
          PartyPopper;

        return (
          <div
            key={particle.id}
            className="absolute animate-in fade-in slide-in-from-top"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              transform: `rotate(${particle.rotation}deg)`,
              opacity: particle.opacity,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              color: particle.color,
              zIndex: 1000,
            }}
          >
            <ParticleIcon 
              size={particle.size} 
              fill={particle.color} 
              stroke="none"
            />
          </div>
        );
      })}
    </div>
  );
};

export default Confetti;
