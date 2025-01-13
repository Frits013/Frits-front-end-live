import * as THREE from "three";

export const createBrainNode = (x: number, y: number, z: number) => {
  const geometry = new THREE.SphereGeometry(0.2, 16, 16);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xE5DEFF,
    metalness: 0.2,
    roughness: 0.3,
    transmission: 0.2,
    thickness: 0.5,
    emissive: 0x8B5CF6,
    emissiveIntensity: 0.2,
  });
  
  const node = new THREE.Mesh(geometry, material);
  node.position.set(
    x + (Math.random() - 0.5) * 2,
    y + (Math.random() - 0.5) * 2,
    z + (Math.random() - 0.5) * 2
  );
  return node;
};

export const createConnection = (start: THREE.Vector3, end: THREE.Vector3) => {
  const points = [start, end];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: 0xD6BCFA,
    transparent: true,
    opacity: 0.3,
  });
  return new THREE.Line(geometry, material);
};