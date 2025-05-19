
// Utility for generating points for visual elements

interface Point {
  x: number;
  y: number;
}

/**
 * Generates a random set of points within the canvas area
 * @param count Number of points to generate (default: 5)
 * @param maxX Maximum X coordinate (default: 100)
 * @param maxY Maximum Y coordinate (default: 100)
 */
export const generatePoints = (count: number = 5, maxX: number = 100, maxY: number = 100): Point[] => {
  const points: Point[] = [];
  
  for (let i = 0; i < count; i++) {
    points.push({
      x: Math.random() * maxX,
      y: Math.random() * maxY
    });
  }
  
  return points;
};
