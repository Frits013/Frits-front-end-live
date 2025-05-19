
import React, { useState, useEffect } from 'react';
import { getRandomShape } from "@/utils/shapes";
import { generatePoints } from "@/utils/points";
import { useTheme } from "next-themes";

interface ChatVisualizerProps {
  isThinking: boolean;
  audioData: number[];
  currentSessionId: string | null;
  previousSessionId?: string | null;
}

export default function ChatVisualizer({ 
  isThinking, 
  audioData,
  currentSessionId,
  previousSessionId
}: ChatVisualizerProps) {
  // Add a state to detect new session creation
  const [newSession, setNewSession] = useState(false);
  
  // Detect when a new session is created
  useEffect(() => {
    if (currentSessionId && currentSessionId !== previousSessionId) {
      setNewSession(true);
      // Reset new session flag after some time
      const timer = setTimeout(() => {
        setNewSession(false);
      }, 10000); // Keep "thinking" animation for 10 seconds or until real data arrives
      return () => clearTimeout(timer);
    }
  }, [currentSessionId, previousSessionId]);

  // Show thinking animation for new sessions or when isThinking is true
  const shouldShowThinking = isThinking || newSession;

  const [points, setPoints] = useState(generatePoints(8, 100, 100));
  const [shape, setShape] = useState(getRandomShape());
  const { theme } = useTheme();

  useEffect(() => {
    if (shouldShowThinking) {
      const intervalId = setInterval(() => {
        setPoints(generatePoints(8, 100, 100));
        setShape(getRandomShape());
      }, 1500);

      return () => clearInterval(intervalId);
    }
  }, [shouldShowThinking]);

  const renderThinkingAnimation = () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative w-48 h-48">
        {points.map((point, index) => {
          const size = Math.random() * 20 + 10;
          const opacity = Math.random() * 0.6 + 0.4;
          const animationDuration = Math.random() * 3 + 2;

          return (
            <span
              key={index}
              style={{
                position: 'absolute',
                top: `${point.y}%`,
                left: `${point.x}%`,
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: theme === 'dark' ? 'white' : 'black',
                opacity: opacity,
                borderRadius: shape === 'circle' ? '50%' : 
                             shape === 'square' ? '0' : 
                             shape === 'triangle' ? '50% 0 50% 50%' : 
                             shape === 'diamond' ? '25%' : '30%',
                animation: `float ${animationDuration}s infinite alternate`,
                animationDelay: `${Math.random()}s`,
              }}
            />
          );
        })}
      </div>
      <style>
        {`
          @keyframes float {
            from {
              transform: translateY(0) rotate(0deg);
            }
            to {
              transform: translateY(-10px) rotate(${Math.random() > 0.5 ? '45' : '-45'}deg);
            }
          }
        `}
      </style>
    </div>
  );
  
  return (
    <div className="relative w-full h-32">
      {shouldShowThinking && renderThinkingAnimation()}
    </div>
  );
}
