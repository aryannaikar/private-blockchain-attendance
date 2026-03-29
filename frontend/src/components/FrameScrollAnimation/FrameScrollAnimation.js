import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useScroll, useTransform, useSpring } from 'framer-motion';
import './FrameScrollAnimation.css';

const FrameScrollAnimation = ({ frameCount = 240, folderPath = '/ezgif-12c9706ee104804b-jpg', scrollTarget }) => {
  const canvasRef = useRef(null);
  const [images, setImages] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [progress, setProgress] = useState(0);

  // Use target scroll for localized scrubbing
  const { scrollYProgress } = useScroll({
    target: scrollTarget,
    offset: ["start start", "end center"]
  });
  
  // Smooth out the scroll value
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Map 0-1 scroll progress to 1-frameCount
  const frameIndex = useTransform(smoothProgress, [0, 1], [1, frameCount]);

  // Preload all images
  useEffect(() => {
    let loadedCount = 0;
    const loadedImages = [];

    const preloadImages = () => {
      for (let i = 1; i <= frameCount; i++) {
        const img = new Image();
        const frameNum = String(i).padStart(3, '0');
        img.src = `${process.env.PUBLIC_URL || ''}${folderPath}/ezgif-frame-${frameNum}.jpg`;
        img.onload = () => {
          loadedCount++;
          if (loadedCount >= 2) { // Show early
            setIsLoaded(true);
          }
          setProgress((loadedCount / frameCount) * 100);
        };
        img.onerror = () => {
          console.error(`Failed to load frame ${frameNum}`);
        };
        loadedImages.push(img);
      }
      setImages(loadedImages);
    };

    preloadImages();
  }, [frameCount, folderPath]);

  // Handle Canvas Drawing
  useEffect(() => {
    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas || !images.length) return;

      const context = canvas.getContext('2d');
      const currentIndex = Math.max(1, Math.min(frameCount, Math.round(frameIndex.get())));
      const img = images[currentIndex - 1];

      if (img && img.complete) {
        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Calculate aspect ratio fit
        const canvasAspect = canvas.width / canvas.height;
        const imgAspect = img.width / img.height;
        let drawWidth, drawHeight, offsetX, offsetY;

        if (canvasAspect > imgAspect) {
          drawWidth = canvas.width;
          drawHeight = canvas.width / imgAspect;
          offsetX = 0;
          offsetY = (canvas.height - drawHeight) / 2;
        } else {
          drawWidth = canvas.height * imgAspect;
          drawHeight = canvas.height;
          offsetX = (canvas.width - drawWidth) / 2;
          offsetY = 0;
        }

        context.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      }
    };

    // Use framer-motion's onChange to trigger render
    const unsubscribe = frameIndex.onChange(() => {
      requestAnimationFrame(render);
    });

    // Initial render
    render();

    return () => unsubscribe();
  }, [images, frameCount, frameIndex]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="frame-animation-container">
      {!isLoaded && (
        <div className="frame-loader">
          <div className="loader-bar" style={{ width: `${progress}%` }} />
          <span>INITIALIZING NEURAL ENGINE... {Math.round(progress)}%</span>
        </div>
      )}
      <canvas 
        ref={canvasRef} 
        className={`frame-canvas ${isLoaded ? 'loaded' : ''}`}
      />
      <div className="canvas-overlay" />
    </div>
  );
};

export default FrameScrollAnimation;
