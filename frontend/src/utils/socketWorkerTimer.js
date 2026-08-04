/**
 * socketWorkerTimer.js
 *
 * A thin wrapper around the `worker-timers` package that provides
 * setInterval / clearInterval backed by a Web Worker thread.
 *
 * Unlike the native browser setInterval, a worker-timer is NOT throttled
 * when the page is hidden or the tab is minimized, making it the correct
 * tool for background Socket.IO health-check loops.
 *
 * Usage:
 *   import { setWorkerInterval, clearWorkerInterval } from './socketWorkerTimer';
 *   const id = setWorkerInterval(callback, 30_000);
 *   clearWorkerInterval(id);
 */

import {
  setInterval as workerSetInterval,
  clearInterval as workerClearInterval,
} from "worker-timers";

/**
 * Schedule `fn` to run every `ms` milliseconds using a Web Worker timer.
 * Returns a timer ID that can be cancelled with clearWorkerInterval.
 *
 * @param {() => void} fn  - The callback to execute on each tick.
 * @param {number}     ms  - Interval in milliseconds.
 * @returns {number}       - Worker-timer ID.
 */
export const setWorkerInterval = (fn, ms) => workerSetInterval(fn, ms);

/**
 * Cancel a previously started worker interval.
 *
 * @param {number} id - The timer ID returned by setWorkerInterval.
 */
export const clearWorkerInterval = (id) => {
  if (id !== null && id !== undefined) {
    workerClearInterval(id);
  }
};
