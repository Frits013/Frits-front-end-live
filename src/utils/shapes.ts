
// Utility for generating random shapes for visual elements

type Shape = 'circle' | 'square' | 'triangle' | 'diamond' | 'hexagon';

/**
 * Returns a random shape from the available options
 */
export const getRandomShape = (): Shape => {
  const shapes: Shape[] = ['circle', 'square', 'triangle', 'diamond', 'hexagon'];
  const randomIndex = Math.floor(Math.random() * shapes.length);
  return shapes[randomIndex];
};
