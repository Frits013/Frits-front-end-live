
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
      const newParticles = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        x: Math.random() * 100, // Spread across full width
        y: -10 - Math.random() * 60, // Start higher above the screen
        size: Math.random() * 30 + 10, // Larger size range
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
          "#FF1493", // Deep pink
          "#FFD700", // Gold
        ][Math.floor(Math.random() * 13)],
        type: ["star", "sparkle", "popper"][
          Math.floor(Math.random() * 3)
        ] as "star" | "sparkle" | "popper",
        opacity: Math.random() * 0.5 + 0.5,
        delay: Math.random() * 3, // More varied delays
        duration: Math.random() * 2 + 2, // Longer durations (2-4s)
      }));

      setParticles(newParticles);
      
      // Clean up particles after animation completes
      const timer = setTimeout(() => {
        setParticles([]);
      }, 8000); // Longer cleanup time to ensure all particles complete their animation
      
      return () => clearTimeout(timer);
    } else {
      setParticles([]);
    }
  }, [active]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      <style>
        {`
          @keyframes confetti-fall {
            0% {
              transform: translateY(-100vh) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) rotate(720deg);
              opacity: 0;
            }
          }
          .animate-confetti-fall {
            animation: confetti-fall 6s linear forwards;
          }
        `}
      </style>
      {particles.map((particle) => {
        // Determine which icon to use
        const ParticleIcon = 
          particle.type === "star" ? Star : 
          particle.type === "sparkle" ? Sparkles : 
          PartyPopper;

        return (
          <div
            key={particle.id}
            className="absolute animate-confetti-fall"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              transform: `rotate(${particle.rotation}deg)`,
              opacity: particle.opacity,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              color: particle.color,
              zIndex: 10000,
            }}
          >
            <ParticleIcon 
              size={particle.size} 
              fill={particle.color} 
              stroke="none"
              className="drop-shadow-lg"
            />
          </div>
        );
      })}
    </div>
  );
};

export default Confetti;
