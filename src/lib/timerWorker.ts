/**
 * Precise Timer Web Worker
 * This worker runs in a separate thread to avoid being throttled by the main thread's power management.
 */

let timerId = null;
let startTime = null;
let totalDuration = 0;
let distractionStartTime = null;
let totalDistractionTime = 0;

self.onmessage = (e) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'START':
      startTime = payload.startTime;
      totalDuration = payload.totalDuration;
      totalDistractionTime = payload.distractionTime || 0;
      distractionStartTime = payload.isDistracted ? Date.now() : null;
      
      if (timerId) clearInterval(timerId);
      
      const tick = () => {
        const now = Date.now();
        const totalElapsed = Math.floor((now - startTime) / 1000);
        let timeLeft = Math.max(0, totalDuration - totalElapsed);
        
        let currentDistractionTotal = totalDistractionTime;
        if (distractionStartTime) {
          const currentDistractionElapsed = Math.floor((now - distractionStartTime) / 1000);
          currentDistractionTotal += Math.max(0, currentDistractionElapsed);
        }

        if (timeLeft <= 0) {
          timeLeft = 0;
          if (timerId) clearInterval(timerId);
          timerId = null;
          self.postMessage({
            type: 'TICK',
            payload: {
              timeLeft: 0,
              distractionTime: currentDistractionTotal,
              totalElapsed: totalDuration,
              timestamp: now
            }
          });
          self.postMessage({ type: 'COMPLETED' });
          return;
        }

        self.postMessage({
          type: 'TICK',
          payload: {
            timeLeft,
            distractionTime: currentDistractionTotal,
            totalElapsed,
            timestamp: now
          }
        });
      };

      // Tick immediately
      tick();
      
      timerId = setInterval(tick, 1000);
      break;

    case 'UPDATE_DISTRACTION':
      const { isDistracted } = payload;
      const now = Date.now();
      
      if (isDistracted) {
        if (!distractionStartTime) {
          distractionStartTime = now;
        }
      } else {
        if (distractionStartTime) {
          const elapsed = Math.floor((now - distractionStartTime) / 1000);
          totalDistractionTime += Math.max(0, elapsed);
          distractionStartTime = null;
        }
      }
      break;

    case 'STOP':
      if (timerId) clearInterval(timerId);
      timerId = null;
      break;
  }
};
