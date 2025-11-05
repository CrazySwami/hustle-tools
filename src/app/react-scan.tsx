'use client';

import { useEffect } from 'react';

// Performance data store
interface RenderLog {
  componentName: string;
  renderCount: number;
  renderTime: number;
  timestamp: number;
  fps?: number;
}

const performanceData: RenderLog[] = [];
let lastFrameTime = performance.now();
let frameCount = 0;
let currentFPS = 60;

// Update FPS continuously
if (typeof window !== 'undefined') {
  const updateFPS = () => {
    const now = performance.now();
    const delta = now - lastFrameTime;
    frameCount++;

    if (delta >= 1000) { // Update FPS every second
      currentFPS = Math.round((frameCount * 1000) / delta);
      frameCount = 0;
      lastFrameTime = now;
    }

    requestAnimationFrame(updateFPS);
  };
  requestAnimationFrame(updateFPS);
}

// Expose global functions for console access
declare global {
  interface Window {
    getPerformanceReport: () => void;
    clearPerformanceLogs: () => void;
    getSlowComponents: (threshold?: number) => void;
    exportPerformanceData: () => string;
    analyzeRenderPatterns: () => void;
    toggleReactScanOverlay: () => void;
    reactScanInstance: any;
  }
}

export function ReactScan() {
  useEffect(() => {
    console.log('🔍 React Scan initialization - NODE_ENV:', process.env.NODE_ENV);

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Development mode detected, loading React Scan...');

      import('react-scan').then(({ scan }) => {
        console.log('✅ React Scan module loaded successfully');

        // Initialize React Scan and store instance
        window.reactScanInstance = scan({
          enabled: true,
          log: true,
          showToolbar: true,
          alwaysShowLabels: true,
          includeChildren: true, // Show child component renders
          // Hook into render events
          onRender: (fiber: any, render: any) => {
            const componentName = fiber.type?.name || fiber.type?.displayName || 'Anonymous';
            const renderTime = render.actualDuration || 0;

            performanceData.push({
              componentName,
              renderCount: performanceData.filter(p => p.componentName === componentName).length + 1,
              renderTime,
              timestamp: Date.now(),
              fps: currentFPS,
            });

            // Keep only last 500 renders to avoid memory issues
            if (performanceData.length > 500) {
              performanceData.shift();
            }

            // Warn about slow renders (>16ms = below 60fps)
            if (renderTime > 16) {
              console.warn(`🐌 Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms (FPS: ${currentFPS})`);
            }
          },
        });

        console.log('🎨 React Scan visual overlay should now be active!');
        console.log('💡 Available commands: getPerformanceReport(), getSlowComponents(), analyzeRenderPatterns()');
        console.log('📊 React Scan instance ready:', !!window.reactScanInstance);
      }).catch((error) => {
        console.error('❌ Failed to load React Scan:', error);
      });

      // Global console helpers
      window.getPerformanceReport = () => {
        console.clear();
        console.log('📊 React Performance Report\n');
        console.log(`Current FPS: ${currentFPS}`);
        console.log(`Total renders logged: ${performanceData.length}\n`);

        // Group by component
        const componentStats = performanceData.reduce((acc, log) => {
          if (!acc[log.componentName]) {
            acc[log.componentName] = {
              count: 0,
              totalTime: 0,
              maxTime: 0,
              avgFps: 0,
              fpsReadings: 0,
            };
          }
          acc[log.componentName].count++;
          acc[log.componentName].totalTime += log.renderTime;
          acc[log.componentName].maxTime = Math.max(acc[log.componentName].maxTime, log.renderTime);
          if (log.fps) {
            acc[log.componentName].avgFps += log.fps;
            acc[log.componentName].fpsReadings++;
          }
          return acc;
        }, {} as Record<string, any>);

        // Sort by total time (most expensive first)
        const sorted = Object.entries(componentStats)
          .map(([name, stats]: [string, any]) => ({
            name,
            renders: stats.count,
            totalTime: stats.totalTime.toFixed(2),
            avgTime: (stats.totalTime / stats.count).toFixed(2),
            maxTime: stats.maxTime.toFixed(2),
            avgFps: stats.fpsReadings > 0 ? Math.round(stats.avgFps / stats.fpsReadings) : 'N/A',
          }))
          .sort((a, b) => parseFloat(b.totalTime) - parseFloat(a.totalTime));

        console.table(sorted);
        console.log('\n💡 Tip: Use getSlowComponents() to see only problematic components');
        console.log('💡 Tip: Use exportPerformanceData() to get JSON for AI analysis');
      };

      window.clearPerformanceLogs = () => {
        performanceData.length = 0;
        console.log('✅ Performance logs cleared');
      };

      window.getSlowComponents = (threshold = 16) => {
        console.clear();
        console.log(`🐌 Components with renders > ${threshold}ms\n`);

        const slowRenders = performanceData.filter(log => log.renderTime > threshold);

        if (slowRenders.length === 0) {
          console.log('✅ No slow renders detected!');
          return;
        }

        const grouped = slowRenders.reduce((acc, log) => {
          if (!acc[log.componentName]) {
            acc[log.componentName] = [];
          }
          acc[log.componentName].push({
            time: log.renderTime.toFixed(2) + 'ms',
            fps: log.fps,
            timestamp: new Date(log.timestamp).toLocaleTimeString(),
          });
          return acc;
        }, {} as Record<string, any[]>);

        Object.entries(grouped).forEach(([name, logs]) => {
          console.log(`\n📦 ${name} (${logs.length} slow renders)`);
          console.table(logs.slice(-10)); // Show last 10
        });

        console.log('\n💡 These components are causing performance issues and should be optimized');
      };

      window.exportPerformanceData = () => {
        const report = {
          timestamp: new Date().toISOString(),
          currentFPS,
          totalRenders: performanceData.length,
          logs: performanceData,
          summary: performanceData.reduce((acc, log) => {
            if (!acc[log.componentName]) {
              acc[log.componentName] = {
                renderCount: 0,
                totalTime: 0,
                avgTime: 0,
                maxTime: 0,
                minFps: 120,
                avgFps: 0,
              };
            }
            const stats = acc[log.componentName];
            stats.renderCount++;
            stats.totalTime += log.renderTime;
            stats.maxTime = Math.max(stats.maxTime, log.renderTime);
            if (log.fps) {
              stats.minFps = Math.min(stats.minFps, log.fps);
              stats.avgFps += log.fps;
            }
            return acc;
          }, {} as Record<string, any>),
        };

        // Calculate averages
        Object.values(report.summary).forEach((stats: any) => {
          stats.avgTime = stats.totalTime / stats.renderCount;
          stats.avgFps = stats.avgFps / stats.renderCount;
        });

        const json = JSON.stringify(report, null, 2);
        console.log('📋 Performance data copied to clipboard!');
        console.log('\n' + json);

        // Copy to clipboard
        navigator.clipboard.writeText(json).then(() => {
          console.log('\n✅ You can now paste this into Claude for AI-powered analysis!');
        });

        return json;
      };

      window.analyzeRenderPatterns = () => {
        console.clear();
        console.log('🔍 Analyzing render patterns...\n');

        // Find unnecessary re-renders (same component rendering in quick succession)
        const suspiciousPatterns: Record<string, number> = {};
        for (let i = 1; i < performanceData.length; i++) {
          const current = performanceData[i];
          const previous = performanceData[i - 1];

          if (current.componentName === previous.componentName &&
              current.timestamp - previous.timestamp < 100) { // Within 100ms
            suspiciousPatterns[current.componentName] =
              (suspiciousPatterns[current.componentName] || 0) + 1;
          }
        }

        if (Object.keys(suspiciousPatterns).length > 0) {
          console.log('⚠️  Possible unnecessary re-renders detected:\n');
          Object.entries(suspiciousPatterns)
            .sort(([, a], [, b]) => b - a)
            .forEach(([name, count]) => {
              console.log(`  ${name}: ${count} rapid re-renders`);
            });
          console.log('\n💡 Consider using React.memo(), useMemo(), or useCallback()');
        } else {
          console.log('✅ No obvious render issues detected');
        }

        // FPS drops
        const fpsDrops = performanceData.filter(log => log.fps && log.fps < 45);
        if (fpsDrops.length > 0) {
          console.log('\n📉 FPS drops below 45 detected:');
          const fpsDropComponents = fpsDrops.reduce((acc, log) => {
            acc[log.componentName] = (acc[log.componentName] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          console.table(fpsDropComponents);
        }
      };

      // Toggle overlay function
      window.toggleReactScanOverlay = () => {
        if (window.reactScanInstance) {
          const currentState = window.reactScanInstance.options?.alwaysShowLabels;
          window.reactScanInstance.setOptions({
            alwaysShowLabels: !currentState,
          });
          console.log(`🎨 Visual overlay: ${!currentState ? 'ENABLED' : 'DISABLED'}`);
        } else {
          console.warn('⚠️  React Scan instance not found. Try refreshing the page.');
        }
      };

      // Log available commands
      console.log('🚀 React Scan Performance Monitoring Active!');
      console.log('\nAvailable commands:');
      console.log('  getPerformanceReport()    - View comprehensive performance stats');
      console.log('  getSlowComponents()       - See only slow-rendering components');
      console.log('  analyzeRenderPatterns()   - Detect unnecessary re-renders');
      console.log('  exportPerformanceData()   - Copy JSON data for AI analysis');
      console.log('  clearPerformanceLogs()    - Clear all logs');
      console.log('  toggleReactScanOverlay()  - Toggle purple visual overlay on/off\n');
    } else {
      console.warn('⚠️  React Scan not loaded: NODE_ENV is not "development" (current:', process.env.NODE_ENV, ')');
    }
  }, []);

  return null;
}

