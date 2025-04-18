"use client";
import React, { useEffect, useRef, useState } from "react";
import styles from "../app/home.module.css";

interface Blob {
  id: number;
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  baseSize: number;
}

const BlobAura = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [blobs, setBlobs] = useState<Blob[]>([]);
  const [isHoveringClickable, setIsHoveringClickable] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null); // Use null as the initial value
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const initialBlobs: Blob[] = [];
    
    for (let i = 0; i < 12; i++) {
      const baseSize = 200 + Math.random() * 150;
      initialBlobs.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: baseSize,
        baseSize,
        vx: (Math.random() - 0.5) * 8, // FASTER SPEED
        vy: (Math.random() - 0.5) * 8
      });
    }
    setBlobs(initialBlobs);
  }, []);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      setMousePos({ x: clientX, y: clientY });

      const element = document.elementFromPoint(clientX, clientY);
      
      // Ensure that the value passed to setIsHoveringClickable is always a boolean
      setIsHoveringClickable(
        element ? (element.tagName === "A" || element.tagName === "BUTTON" || element.hasAttribute("onClick")) : false
      );

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${clientX}px, ${clientY}px)`; // Corrected line
      }
    };

    window.addEventListener("mousemove", moveCursor);
    return () => window.removeEventListener("mousemove", moveCursor);
  }, []);

  useEffect(() => {
    const animate = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;

      setBlobs(prevBlobs =>
        prevBlobs.map(blob => {
          let { x, y, vx, vy, baseSize, size } = blob;

          x += vx * (deltaTime / 16);
          y += vy * (deltaTime / 16);

          // Bounce off edges and keep inside window
          const radius = size / 2;
          if (x - radius <= 0 || x + radius >= window.innerWidth) {
            vx *= -1;
            x = Math.max(radius, Math.min(window.innerWidth - radius, x));
          }
          if (y - radius <= 0 || y + radius >= window.innerHeight) {
            vy *= -1;
            y = Math.max(radius, Math.min(window.innerHeight - radius, y));
          }

          // Mouse interaction
          const dx = mousePos.x - x;
          const dy = mousePos.y - y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const interactionRadius = 350;

          if (distance < interactionRadius) {
            const force = (interactionRadius - distance) / interactionRadius * 0.7;
            const angle = Math.atan2(dy, dx);
            const multiplier = isHoveringClickable ? -1.2 : 0.8;

            vx += Math.cos(angle) * force * multiplier;
            vy += Math.sin(angle) * force * multiplier;
          }

          // Limit speed
          vx *= 0.995;
          vy *= 0.995;

          const speed = Math.sqrt(vx * vx + vy * vy);
          const maxSpeed = 8;
          if (speed > maxSpeed) {
            vx = (vx / speed) * maxSpeed;
            vy = (vy / speed) * maxSpeed;
          }

          return { ...blob, x, y, vx, vy, size: baseSize };
        })
      );

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [mousePos, isHoveringClickable]);

  const handleClick = (e: React.MouseEvent) => {
    if (isHoveringClickable) return;

    const baseSize = 200 + Math.random() * 150;
    setBlobs(prev => [
      ...prev,
      {
        id: Date.now(),
        x: e.clientX,
        y: e.clientY,
        size: baseSize,
        baseSize,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8
      }
    ]);
  };

  return (
    <div className={styles.container} onClick={handleClick}>
      <div
        ref={cursorRef}
        className={`${styles.cursorCore} ${isHoveringClickable ? styles.cursorActive : ""}`}
      />
      {blobs.map(blob => (
        <div
          key={blob.id}
          className={styles.giantCircle}
          style={{
            left: blob.x,
            top: blob.y,
            width: blob.size,
            height: blob.size,
            transform: `translate(-50%, -50%)`, // Corrected line
            opacity: 0.6
          }}
        />
      ))}
    </div>
  );
};

export default BlobAura;
