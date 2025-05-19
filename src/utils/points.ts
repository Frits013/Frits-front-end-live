
// This file provides utility functions for generating points for visualization

type Point = {
  x: number;
  y: number;
  size: number;
  opacity: number;
};

/**
 * Generates an array of random points 
 * @param count Number of points to generate (default: 5)
 * @returns Array of point objects with random properties
 */
export const generatePoints = (count: number = 5): Point[] => {
  const points: Point[] = [];
  
  for (let i = 0; i < count; i++) {
    points.push({
      x: Math.random() * 100, // Random x position (0-100%)
      y: Math.random() * 100, // Random y position (0-100%)
      size: Math.random() * 10 + 5, // Random size between 5 and 15
      opacity: Math.random() * 0.5 + 0.5, // Random opacity between 0.5 and 1
    });
  }
  
  return points;
};
