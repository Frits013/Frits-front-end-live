import React, { useState, useEffect } from "react";

const funnyMessages = [
  "Preparing your consultation room...",
  "Warming up the consultation engine...",
  "Gathering medical wisdom from the archives...",
  "Calibrating diagnostic algorithms...",
  "Connecting to the health universe...",
  "Loading your personal health advisor...",
  "Preparing evidence-based recommendations...",
  "Initializing medical consultation protocols...",
  "Setting up your virtual examination room...",
  "Activating health assessment systems..."
];

interface SessionCreationLoaderProps {
  isVisible: boolean;
}

const SessionCreationLoader = ({ isVisible }: SessionCreationLoaderProps) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % funnyMessages.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-6 p-8">
        {/* Loading Spinner */}
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
          <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-primary/30" style={{ animationDirection: 'reverse', animationDuration: '3s' }}></div>
        </div>
        
        {/* Dynamic Message */}
        <div className="text-center max-w-sm">
          <p className="text-lg font-medium text-foreground animate-fade-in">
            {funnyMessages[currentMessageIndex]}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            This will only take a moment...
          </p>
        </div>
      </div>
    </div>
  );
};

export default SessionCreationLoader;