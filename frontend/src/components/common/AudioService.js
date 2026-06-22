// components/common/AudioService.js

class AudioService {
  constructor() {
    this.audioContext = null;
    this.isInitialized = false;
    this.tickInterval = null;
    this.isTicking = false;
    this.useFallback = false;
  }

  // Initialize AudioContext - MUST be called after user interaction
  init() {
    if (this.isInitialized && this.audioContext) {
      // If already initialized but suspended, try to resume
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }
      return;
    }
    
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Resume if suspended (needed for Chrome autoplay policy)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          console.log('✅ AudioContext resumed');
          this.isInitialized = true;
        }).catch(err => {
          console.warn('⚠️ AudioContext resume failed:', err);
          this.useFallback = true;
        });
      } else {
        this.isInitialized = true;
        console.log('✅ AudioContext initialized');
      }
    } catch (error) {
      console.warn('⚠️ AudioContext not supported:', error);
      this.useFallback = true;
    }
  }

  // Play sound
  playSound(frequency, duration = 0.2, volume = 0.3, type = 'sine') {
    if (this.useFallback) {
      this.playFallbackSound(frequency, duration);
      return;
    }

    if (!this.isInitialized) {
      this.init();
      if (!this.isInitialized) {
        this.playFallbackSound(frequency, duration);
        return;
      }
    }

    try {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0.01, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
      
      return true;
    } catch (error) {
      console.warn('⚠️ Sound play failed:', error);
      this.playFallbackSound(frequency, duration);
      return false;
    }
  }

  // Fallback sound
  playFallbackSound(frequency, duration = 0.2) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
      
      setTimeout(() => ctx.close(), duration * 1000 + 100);
    } catch {
      // Silent fail - no audio
    }
  }

  // Play break start
  playBreakStart() {
    console.log('🔊 Play Break Start');
    this.init();
    
    const notes = [523, 659, 784];
    notes.forEach((freq, index) => {
      setTimeout(() => {
        this.playSound(freq, 0.3, 0.4);
      }, index * 300);
    });

    setTimeout(() => {
      this.playSound(880, 0.2, 0.3, 'square');
    }, 1000);
    setTimeout(() => {
      this.playSound(880, 0.2, 0.3, 'square');
    }, 1300);
  }

  // Play break end
  playBreakEnd() {
    console.log('🔊 Play Break End');
    this.init();
    
    const notes = [784, 659, 523];
    notes.forEach((freq, index) => {
      setTimeout(() => {
        this.playSound(freq, 0.25, 0.3);
      }, index * 250);
    });

    setTimeout(() => {
      this.playSound(660, 0.15, 0.25, 'square');
    }, 900);
    setTimeout(() => {
      this.playSound(660, 0.15, 0.25, 'square');
    }, 1200);
  }

  // Start tick-tock
  startTickTock() {
    if (this.isTicking) return;
    
    console.log('🔊 Start Tick-Tock');
    this.init();
    this.isTicking = true;
    let count = 0;

    this.tickInterval = setInterval(() => {
      if (!this.isTicking) {
        this.stopTickTock();
        return;
      }

      const freq = count % 2 === 0 ? 800 : 600;
      this.playSound(freq, 0.06, 0.05);
      count++;
    }, 500);
  }

  // Stop tick-tock
  stopTickTock() {
    console.log('🔇 Stop Tick-Tock');
    this.isTicking = false;
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  // Play notification
  playNotificationSound(type = 'break') {
    switch (type) {
      case 'break-start':
        this.playBreakStart();
        break;
      case 'break-end':
        this.playBreakEnd();
        break;
      case 'working-hours':
        this.playWorkingHoursStart();
        break;
      case 'attendance':
        this.playAttendanceSound();
        break;
      case 'late':
        this.playLateSound();
        break;
      default:
        this.playSound(600, 0.15, 0.2);
    }
  }

  playWorkingHoursStart() {
    console.log('🔊 Working Hours Start');
    this.init();
    const notes = [440, 554, 659];
    notes.forEach((freq, index) => {
      setTimeout(() => {
        this.playSound(freq, 0.2, 0.2);
      }, index * 200);
    });
  }

  playAttendanceSound() {
    console.log('🔊 Attendance');
    this.init();
    this.playSound(880, 0.1, 0.3);
    setTimeout(() => {
      this.playSound(880, 0.1, 0.3);
    }, 200);
  }

  playLateSound() {
    console.log('🔊 Late');
    this.init();
    const notes = [330, 277, 220];
    notes.forEach((freq, index) => {
      setTimeout(() => {
        this.playSound(freq, 0.3, 0.3);
      }, index * 300);
    });
  }

  playSimpleBeep() {
    console.log('🔊 Beep');
    this.init();
    this.playSound(600, 0.2, 0.3);
  }

  playVoiceCountdown(seconds) {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      let text = '';
      if (seconds === 10) text = 'ten';
      else if (seconds === 9) text = 'nine';
      else if (seconds === 8) text = 'eight';
      else if (seconds === 7) text = 'seven';
      else if (seconds === 6) text = 'six';
      else if (seconds === 5) text = 'five';
      else if (seconds === 4) text = 'four';
      else if (seconds === 3) text = 'three';
      else if (seconds === 2) text = 'two';
      else if (seconds === 1) text = 'one';
      else if (seconds === 0) text = 'Break time is over!';

      if (text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.1;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    }
  }

  isAudioAvailable() {
    return this.isInitialized || !this.useFallback;
  }
}

const audioService = new AudioService();

// Auto-init on user interaction
if (typeof window !== 'undefined') {
  const initOnInteraction = () => {
    audioService.init();
    document.removeEventListener('click', initOnInteraction);
    document.removeEventListener('keydown', initOnInteraction);
    document.removeEventListener('touchstart', initOnInteraction);
  };

  document.addEventListener('click', initOnInteraction);
  document.addEventListener('keydown', initOnInteraction);
  document.addEventListener('touchstart', initOnInteraction);
}

export { audioService };
export default audioService;