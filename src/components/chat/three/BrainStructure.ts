import * as THREE from "three";
import { createBrainNode, createConnection } from "./BrainNode";

export const createBrainStructure = () => {
  const brainGroup = new THREE.Group();
  const nodes: THREE.Mesh[] = [];

  // Generate brain structure
  for (let i = 0; i < 100; i++) {
    const radius = 3;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    
    const node = createBrainNode(x, y, z);
    nodes.push(node);
    brainGroup.add(node);
  }

  // Create connections between nearby nodes
  nodes.forEach((node, i) => {
    nodes.slice(i + 1).forEach(otherNode => {
      const distance = node.position.distanceTo(otherNode.position);
      if (distance < 2) {
        const connection = createConnection(node.position, otherNode.position);
        brainGroup.add(connection);
      }
    });
  });

  return { brainGroup, nodes };
};