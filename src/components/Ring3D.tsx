import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const Ring3D = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const ringRef = useRef<THREE.Mesh | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  
  // State for gold transition
  const [isGold, setIsGold] = useState(false);
  const transitionProgressRef = useRef(0);
  const isTransitioningRef = useRef(false);
  
  // Colors for transition
  const blackColorRef = useRef(new THREE.Color(0x064e3b));
  const goldColorRef = useRef(new THREE.Color(0xD4AF37));

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

    // Lighting for green iridescent effect
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0x10b981, 1.5);
    directionalLight1.position.set(5, 5, 5);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0x34d399, 1.2);
    directionalLight2.position.set(-5, -3, -2);
    scene.add(directionalLight2);

    const directionalLight3 = new THREE.DirectionalLight(0x6ee7b7, 0.8);
    directionalLight3.position.set(0, -5, 3);
    scene.add(directionalLight3);

    const rimLight = new THREE.DirectionalLight(0x059669, 1.0);
    rimLight.position.set(-3, 0, -5);
    scene.add(rimLight);

    // Create thinner ring geometry with angular edges (fewer tubular segments = more corners)
    const ringGeometry = new THREE.TorusGeometry(1.5, 0.15, 16, 128);
    const ringMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x064e3b,
      metalness: 0.95,
      roughness: 0.1,
      envMapIntensity: 2.0,
      emissive: 0x000000,
      emissiveIntensity: 0,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ringRef.current = ring;
    scene.add(ring);
    
    // Click handler for gold transition
    const onRingClick = () => {
      if (isTransitioningRef.current) return;
      
      isTransitioningRef.current = true;
      transitionProgressRef.current = 0;
      
      // Pulse scale animation
      if (ring) {
        ring.scale.setScalar(1.05);
        setTimeout(() => {
          if (ring) ring.scale.setScalar(1.0);
        }, 150);
      }
    };
    
    renderer.domElement.addEventListener('click', onRingClick);

    // Mouse and touch interaction
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

    // Touch events for mobile
    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        isDragging = true;
        userInteracting = true;
        previousMousePosition = { 
          x: event.touches[0].clientX, 
          y: event.touches[0].clientY 
        };
      }
    };

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 1 && isDragging && ring) {
        event.preventDefault();
        const deltaMove = {
          x: event.touches[0].clientX - previousMousePosition.x,
          y: event.touches[0].clientY - previousMousePosition.y
        };

        ring.rotation.y += deltaMove.x * 0.01;
        ring.rotation.x += deltaMove.y * 0.01;

        previousMousePosition = { 
          x: event.touches[0].clientX, 
          y: event.touches[0].clientY 
        };
      }
    };

    const onTouchEnd = () => {
      isDragging = false;
      setTimeout(() => {
        userInteracting = false;
      }, 1000);
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false });
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchend', onTouchEnd);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      if (ring && !userInteracting) {
        ring.rotation.y += 0.005;
        ring.rotation.x += 0.002;
      }
      
      // Handle gold transition animation
      if (isTransitioningRef.current && ring) {
        transitionProgressRef.current += 0.01;
        const progress = Math.min(transitionProgressRef.current, 1);
        
        // Determine direction based on current state
        const effectiveProgress = isGold ? 1 - progress : progress;
        
        // Interpolate color
        const material = ring.material as THREE.MeshStandardMaterial;
        material.color.lerpColors(
          blackColorRef.current,
          goldColorRef.current,
          effectiveProgress
        );
        
        // Make it EXTRA shiny when gold
        material.metalness = 0.95 + (effectiveProgress * 0.05); // Up to 1.0
        material.roughness = 0.1 - (effectiveProgress * 0.05); // Down to 0.05
        material.envMapIntensity = 2.0 + (effectiveProgress * 1.0); // Up to 3.0
        
        // Add emissive glow for gold
        material.emissive.setHex(0x332200);
        material.emissiveIntensity = effectiveProgress * 0.3;
        
        // Interpolate lights
        const goldIntensity = effectiveProgress;
        directionalLight1.color.lerpColors(
          new THREE.Color(0x10b981),
          new THREE.Color(0xFFD700),
          goldIntensity
        );
        directionalLight1.intensity = 1.5 + (goldIntensity * 0.5);
        
        directionalLight2.color.lerpColors(
          new THREE.Color(0x34d399),
          new THREE.Color(0xFFC125),
          goldIntensity
        );
        directionalLight2.intensity = 1.2 + (goldIntensity * 0.6);
        
        directionalLight3.color.lerpColors(
          new THREE.Color(0x6ee7b7),
          new THREE.Color(0xDAA520),
          goldIntensity
        );
        directionalLight3.intensity = 0.8 + (goldIntensity * 0.7);
        
        rimLight.color.lerpColors(
          new THREE.Color(0x059669),
          new THREE.Color(0xFFE4B5),
          goldIntensity
        );
        rimLight.intensity = 1.0 + (goldIntensity * 0.5);
        
        ambientLight.intensity = 0.3 + (goldIntensity * 0.2);
        
        // Check if animation is complete
        if (progress >= 1) {
          isTransitioningRef.current = false;
          setIsGold(!isGold);
          transitionProgressRef.current = 0;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('touchstart', onTouchStart);
      renderer.domElement.removeEventListener('click', onRingClick);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchend', onTouchEnd);
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isGold]);

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