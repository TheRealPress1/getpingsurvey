import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const Ring3D = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const ringRef = useRef<THREE.Mesh | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 3;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(400, 400);
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting for iridescent effect
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight1.position.set(5, 5, 5);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0x6366f1, 0.8);
    directionalLight2.position.set(-5, -3, -2);
    scene.add(directionalLight2);

    const directionalLight3 = new THREE.DirectionalLight(0x8b5cf6, 0.6);
    directionalLight3.position.set(0, -5, 3);
    scene.add(directionalLight3);

    const rimLight = new THREE.DirectionalLight(0x06b6d4, 0.8);
    rimLight.position.set(-3, 0, -5);
    scene.add(rimLight);

    // Create smooth ring geometry with higher resolution
    const ringGeometry = new THREE.TorusGeometry(1.5, 0.3, 64, 128);
    const ringMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x0a0a0a,
      metalness: 0.95,
      roughness: 0.15,
      envMapIntensity: 1.5,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ringRef.current = ring;
    scene.add(ring);

    // Mouse interaction
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let userInteracting = false;

    const onMouseDown = (event: MouseEvent) => {
      isDragging = true;
      userInteracting = true;
      previousMousePosition = { x: event.clientX, y: event.clientY };
    };

    const onMouseMove = (event: MouseEvent) => {
      if (isDragging && ring) {
        const deltaMove = {
          x: event.clientX - previousMousePosition.x,
          y: event.clientY - previousMousePosition.y
        };

        ring.rotation.y += deltaMove.x * 0.01;
        ring.rotation.x += deltaMove.y * 0.01;

        previousMousePosition = { x: event.clientX, y: event.clientY };
      }
    };

    const onMouseUp = () => {
      isDragging = false;
      setTimeout(() => {
        userInteracting = false;
      }, 1000);
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      if (ring && !userInteracting) {
        ring.rotation.y += 0.005;
        ring.rotation.x += 0.002;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="flex items-center justify-center">
      <div 
        ref={mountRef} 
        className="w-[400px] h-[400px] cursor-grab active:cursor-grabbing"
        style={{ userSelect: 'none' }}
      />
    </div>
  );
};

export default Ring3D;