
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
  }>>([]);

  useEffect(() => {
    if (active) {
      // Create confetti particles
      const newParticles = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -20 - (Math.random() * 40),
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
        ][Math.floor(Math.random() * 8)],
        type: ["star", "sparkle", "popper"][
          Math.floor(Math.random() * 3)
        ] as "star" | "sparkle" | "popper",
        opacity: Math.random() * 0.5 + 0.5,
        delay: Math.random() * 1.5,
      }));

      setParticles(newParticles);
    } else {
      setParticles([]);
    }
  }, [active]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map((particle) => {
        // Determine which icon to use
        const ParticleIcon = 
          particle.type === "star" ? Star : 
          particle.type === "sparkle" ? Sparkles : 
          PartyPopper;

        return (
          <div
            key={particle.id}
            className="absolute animate-in fade-in slide-in-from-top duration-[1500ms]"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              transform: `rotate(${particle.rotation}deg)`,
              opacity: particle.opacity,
              animationDelay: `${particle.delay}s`,
              animationDuration: "1.5s",
              color: particle.color,
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
