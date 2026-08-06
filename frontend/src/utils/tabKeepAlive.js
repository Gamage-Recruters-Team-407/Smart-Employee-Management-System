/**
 * tabKeepAlive.js
 *
 * Prevents Chrome / Edge / Firefox background tab sleeping and memory discarding.
 *
 * Modern browsers automatically exempt tabs playing audio from memory discarding / sleeping.
 * This utility starts a silent zero-volume Web Audio API node and optional Screen Wake Lock
 * so the system tab stays 100% active in the background indefinitely.
 */

let audioCtx = null;
let wakeLock = null;

export const startTabKeepAlive = () => {
  try {
    // 1. Silent Web Audio Keep-Alive
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        // 0.0001 volume: completely silent to human ear, but flags tab as playing media to browser
        gain.gain.value = 0.0001;

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        console.log("🔊 Background tab Keep-Alive active (Web Audio API)");
      }
    } else if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }

    // 2. Screen Wake Lock (if supported)
    if ("wakeLock" in navigator && !wakeLock) {
      navigator.wakeLock.request("screen").then((lock) => {
        wakeLock = lock;
        console.log("🔒 Screen Wake Lock active");
      }).catch(() => {});
    }
  } catch (err) {
    console.warn("Could not start tab keep-alive:", err);
  }
};

export const stopTabKeepAlive = () => {
  try {
    if (audioCtx) {
      audioCtx.close().catch(() => {});
      audioCtx = null;
    }
    if (wakeLock) {
      wakeLock.release().catch(() => {});
      wakeLock = null;
    }
  } catch (err) {
    console.warn("Could not stop tab keep-alive:", err);
  }
};
