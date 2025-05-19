
// This file provides utility functions for generating random shapes

type Shape = {
  type: 'circle' | 'square' | 'triangle';
  size: number;
  rotation: number;
  color: string;
};

// Array of possible colors for the shapes
const colors = [
  '#9b87f5', // Primary purple
  '#7E69AB', // Secondary purple
  '#D6BCFA', // Light purple
  '#FFDEE2', // Soft pink
  '#FEC6A1', // Soft orange
  '#D3E4FD', // Soft blue
  '#F97316', // Bright orange
];

/**
 * Generates a random shape with random properties
 * @returns A shape object with random properties
 */
export const getRandomShape = (): Shape => {
  const shapeTypes = ['circle', 'square', 'triangle'] as const;
  return {
    type: shapeTypes[Math.floor(Math.random() * shapeTypes.length)],
    size: Math.random() * 30 + 10, // Random size between 10 and 40
    rotation: Math.random() * 360, // Random rotation between 0 and 360 degrees
    color: colors[Math.floor(Math.random() * colors.length)], // Random color from the array
  };
};
