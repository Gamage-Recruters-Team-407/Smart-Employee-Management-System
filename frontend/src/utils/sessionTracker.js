/**
 * Session & Activity Tracker
 * Monitors user inactivity and triggers auto-logout
 */

class SessionTracker {
  constructor(inactivityTimeout = 15 * 60 * 1000) {
    // 15 minutes default (in milliseconds)
    this.inactivityTimeout = inactivityTimeout;
    this.inactivityTimer = null;
    this.lastActivityTime = Date.now();
    this.isActive = true;
    this.onInactiveCallback = null;
  }

  /**
   * Start tracking user activity
   */
  startTracking() {
    // Listen for mouse movements
    document.addEventListener("mousemove", () => this.resetInactivityTimer());

    // Listen for keyboard input
    document.addEventListener("keydown", () => this.resetInactivityTimer());

    // Listen for clicks
    document.addEventListener("click", () => this.resetInactivityTimer());

    // Listen for page visibility changes (user switches tabs)
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        // Tab is hidden - pause tracking
        this.pauseTracking();
      } else {
        // Tab is visible again - resume tracking
        this.resumeTracking();
      }
    });

    console.log("✅ Session tracking started");
  }

  /**
   * Reset inactivity timer when user is active
   */
  resetInactivityTimer() {
    // Update last activity time to now
    this.lastActivityTime = Date.now();

    // Clear the old timer
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }

    // Set a new timer for inactivity
    this.inactivityTimer = setTimeout(() => {
      this.handleInactivity();
    }, this.inactivityTimeout);
  }

  /**
   * Handle inactivity - trigger logout
   */
  handleInactivity() {
    this.isActive = false;
    console.warn("⚠️ User inactive for too long. Triggering auto logout...");

    // Call the callback function if provided
    if (this.onInactiveCallback) {
      this.onInactiveCallback();
    }
  }

  /**
   * Pause tracking when window is hidden
   */
  pauseTracking() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    console.log("⏸️ Session tracking paused");
  }

  /**
   * Resume tracking when window becomes visible
   */
  resumeTracking() {
    this.resetInactivityTimer();
    console.log("▶️ Session tracking resumed");
  }

  /**
   * Get inactivity duration in minutes
   */
  getInactivityDuration() {
    const durationMs = Date.now() - this.lastActivityTime;
    return (durationMs / (1000 * 60)).toFixed(2);
  }

  /**
   * Set callback function when user becomes inactive
   */
  setOnInactiveCallback(callback) {
    this.onInactiveCallback = callback;
  }

  /**
   * Stop tracking completely
   */
  stopTracking() {
    document.removeEventListener("mousemove", () => this.resetInactivityTimer());
    document.removeEventListener("keydown", () => this.resetInactivityTimer());
    document.removeEventListener("click", () => this.resetInactivityTimer());

    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }

    console.log("❌ Session tracking stopped");
  }

  /**
   * Get current session status
   */
  getStatus() {
    return {
      isActive: this.isActive,
      lastActivityTime: new Date(this.lastActivityTime),
      inactivityDuration: this.getInactivityDuration(),
      timeoutMinutes: this.inactivityTimeout / (1000 * 60),
    };
  }
}

export default SessionTracker;