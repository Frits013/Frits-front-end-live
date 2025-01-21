import * as THREE from "three";

export const setupScene = (canvas: HTMLCanvasElement, width: number, height: number) => {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 8, 20);

  const camera = new THREE.PerspectiveCamera(
    75,
    width / height,
    0.1,
    1000
  );
  camera.position.z = 10;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for better performance
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  return { scene, camera, renderer };
};

export const setupLighting = (scene: THREE.Scene) => {
  const ambientLight = new THREE.AmbientLight(0x404040, 2);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  const pointLight1 = new THREE.PointLight(0xD6BCFA, 5);
  pointLight1.position.set(-3, 2, 4);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0xD3E4FD, 5);
  pointLight2.position.set(3, -2, 4);
  scene.add(pointLight2);

  const pointLight3 = new THREE.PointLight(0x33C3F0, 4);
  pointLight3.position.set(0, 3, 4);
  scene.add(pointLight3);
};