/**
 * useFPSMonitor Hook
 *
 * React hook for monitoring FPS in components.
 * Integrates with the FPSMonitor service.
 */

import { useEffect, useState } from 'react';
import { fpsMonitor, FPSMetrics } from '../services/fpsMonitor';

export function useFPSMonitor(enabled: boolean = false) {
  const [metrics, setMetrics] = useState<FPSMetrics>({
    currentFPS: 0,
    averageFPS: 0,
    maxFPS: 0,
    minFPS: 0,
    frameCount: 0,
    droppedFrames: 0,
  });

  useEffect(() => {
    if (enabled) {
      fpsMonitor.enable();
      fpsMonitor.onMetrics(setMetrics);
    } else {
      fpsMonitor.disable();
    }

    return () => {
      if (enabled) {
        fpsMonitor.disable();
      }
    };
  }, [enabled]);

  return metrics;
}
