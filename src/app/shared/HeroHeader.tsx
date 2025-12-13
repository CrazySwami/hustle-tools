'use client';

import { useEffect, useRef, useState } from 'react';

interface HeroHeaderProps {
  title: string;
  description: React.ReactNode;
  badge?: string;
}

/**
 * HeroHeader Component
 *
 * Animated 3D perspective grid hero section with Hustle Together branding.
 * Features:
 * - Canvas-based 3D grid animation
 * - Hustle red (#BA0C2F) accent highlights
 * - Dark/light mode support
 * - Left-aligned responsive layout
 *
 * Created with Hustle Dev Tools (v3.9.2)
 */
export function HeroHeader({ title, description, badge }: HeroHeaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [isDark, setIsDark] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(
        document.documentElement.classList.contains('dark') ||
          document.documentElement.getAttribute('data-theme') === 'dark'
      );
    };

    checkDarkMode();

    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  // Grid animation
  useEffect(() => {
    const canvas = canvasRef.current;
    const header = headerRef.current;
    if (!canvas || !header) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let offset = 0;

    // Grid configuration
    const speed = 0.2;
    const tileSize = 60;
    const gridWidth = 60;
    const gridDepth = 30;
    const horizonY = -150;
    const fov = 350;
    const camHeight = 200;
    const zNear = 20;

    interface GridCell {
      active: boolean;
      alpha: number;
      color: string;
    }

    let gridRows: GridCell[][] = [];

    const createRow = (): GridCell[] => {
      const cells: GridCell[] = [];
      for (let c = 0; c < gridWidth; c++) {
        cells.push({ active: false, alpha: 0, color: 'rgba(186, 12, 47' });
      }
      return cells;
    };

    // Initialize rows
    for (let r = 0; r < gridDepth + 5; r++) {
      gridRows.push(createRow());
    }

    const resize = () => {
      canvas.width = header.clientWidth;
      canvas.height = header.clientHeight;
    };

    const project = (
      x: number,
      z: number
    ): { x: number; y: number; scale: number } | null => {
      if (z <= 0) return null;
      const scale = fov / z;
      const px = x * scale + canvas.width / 2;
      const py = camHeight * scale + canvas.height / 2 + horizonY;
      return { x: px, y: py, scale };
    };

    const updateGridState = () => {
      const secondaryColor = isDark ? 'rgba(60, 60, 60' : 'rgba(30, 30, 30';

      if (Math.random() > 0.92) {
        const r = Math.floor(Math.random() * (gridRows.length - 5)) + 2;
        const c = Math.floor(Math.random() * gridWidth);
        const cell = gridRows[r][c];
        if (!cell.active) {
          cell.active = true;
          cell.alpha = 1.0;
          cell.color = Math.random() > 0.7 ? secondaryColor : 'rgba(186, 12, 47';
        }
      }

      gridRows.forEach((row) =>
        row.forEach((cell) => {
          if (cell.active) {
            cell.alpha -= 0.005;
            if (cell.alpha <= 0) {
              cell.active = false;
              cell.alpha = 0;
            }
          }
        })
      );
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      offset += speed;

      if (offset >= tileSize) {
        offset -= tileSize;
        gridRows.shift();
        gridRows.push(createRow());
      }

      updateGridState();
      ctx.lineWidth = 1;

      const lineColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

      // Draw rows (back to front)
      for (let r = gridRows.length - 1; r >= 0; r--) {
        const zNearLine = r * tileSize - offset + zNear;
        const zFarLine = (r + 1) * tileSize - offset + zNear;
        if (zNearLine <= 0) continue;

        for (let c = 0; c < gridWidth; c++) {
          const cell = gridRows[r][c];
          if (cell.active && cell.alpha > 0.05) {
            const cOffset = c - gridWidth / 2;
            const xL = cOffset * tileSize;
            const xR = (cOffset + 1) * tileSize;

            const p1 = project(xL, zFarLine);
            const p2 = project(xR, zFarLine);
            const p3 = project(xR, zNearLine);
            const p4 = project(xL, zNearLine);

            if (p1 && p2 && p3 && p4) {
              ctx.fillStyle = `${cell.color}, ${cell.alpha})`;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.lineTo(p3.x, p3.y);
              ctx.lineTo(p4.x, p4.y);
              ctx.fill();
            }
          }
        }

        // Horizontal grid lines
        const xL = (-gridWidth / 2) * tileSize;
        const xR = (gridWidth / 2) * tileSize;
        const pL = project(xL, zFarLine);
        const pR = project(xR, zFarLine);
        if (pL && pR) {
          ctx.strokeStyle = lineColor;
          ctx.beginPath();
          ctx.moveTo(pL.x, pL.y);
          ctx.lineTo(pR.x, pR.y);
          ctx.stroke();
        }
      }

      // Vertical grid lines
      const zMax = gridRows.length * tileSize + zNear;
      for (let c = 0; c <= gridWidth; c++) {
        const cOffset = c - gridWidth / 2;
        const x = cOffset * tileSize;
        const pStart = project(x, zNear);
        const pEnd = project(x, zMax);
        if (pStart && pEnd) {
          ctx.strokeStyle = lineColor;
          ctx.beginPath();
          ctx.moveTo(pStart.x, pStart.y);
          ctx.lineTo(pEnd.x, pEnd.y);
          ctx.stroke();
        }
      }

      // Fog / fade gradient
      const fadeColor = isDark ? '0,0,0' : '255,255,255';
      const g = ctx.createLinearGradient(0, 0, 0, canvas.height / 1.5);
      g.addColorStop(0, `rgba(${fadeColor}, 1)`);
      g.addColorStop(0.3, `rgba(${fadeColor}, 0.8)`);
      g.addColorStop(1, `rgba(${fadeColor}, 0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animationId = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [isDark]);

  return (
    <header
      ref={headerRef}
      className="relative flex h-[300px] w-full flex-col items-center justify-center overflow-hidden border-b-2 border-black text-left dark:border-gray-600"
    >
      {/* Animated Grid Canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-0 opacity-80 dark:opacity-60 dark:blur-[0.5px]"
      />

      {/* Content - Uses same container as main content for alignment */}
      <div className="container relative z-10 mx-auto px-4">
        {badge && (
          <span className="mb-4 inline-block border-2 border-[#BA0C2F] bg-[#BA0C2F]/10 px-3 py-1 text-sm font-bold text-[#BA0C2F]">
            {badge}
          </span>
        )}
        <h1 className="mb-5 text-4xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-100 md:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-gray-600 dark:text-gray-400">
          {description}
        </p>
      </div>
    </header>
  );
}

export default HeroHeader;
