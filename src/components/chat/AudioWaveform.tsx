import { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  audioData?: number[];
  isAnimating: boolean;
}

const AudioWaveform = ({ audioData = [], isAnimating }: AudioWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // If no audio data, show a gentle pulsing line
      if (!audioData.length) {
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        const time = Date.now() / 1000;
        
        for (let x = 0; x < canvas.width; x += 2) {
          const y = (canvas.height / 2) + 
            Math.sin(x * 0.02 + time) * 20 * 
            (isAnimating ? 1 : 0.3);
          ctx.lineTo(x, y);
        }
        
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        // Draw actual audio data
        const barWidth = canvas.width / audioData.length;
        ctx.fillStyle = 'rgba(139, 92, 246, 0.5)';
        
        audioData.forEach((value, i) => {
          const height = value * canvas.height;
          const x = i * barWidth;
          const y = (canvas.height - height) / 2;
          ctx.fillRect(x, y, barWidth - 1, height);
        });
      }
    };

    let animationFrame: number;
    const animate = () => {
      draw();
      animationFrame = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [audioData, isAnimating]);

  return (
    <div className="w-full h-24 mt-4">
      <canvas
        ref={canvasRef}
        width={1000}
        height={100}
        className="w-full h-full"
      />
    </div>
  );
};

export default AudioWaveform;