// Advanced alarm sounds using Web Audio API
class AlarmSounds {
  constructor() {
    this.audioContext = null;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error);
    }
  }

  // Siren alarm for break start
  playSiren(duration = 3) {
    if (!this.isInitialized) this.init();
    if (!this.audioContext) return;

    try {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      const startTime = this.audioContext.currentTime;
      
      // Frequency modulation for siren effect
      const frequency = 200;
      const modulationFrequency = 2;
      
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(frequency, startTime);
      
      // Add modulation
      const modulator = this.audioContext.createOscillator();
      const modulatorGain = this.audioContext.createGain();
      modulatorGain.gain.setValueAtTime(100, startTime);
      modulator.connect(modulatorGain);
      modulatorGain.connect(oscillator.frequency);
      modulator.frequency.setValueAtTime(modulationFrequency, startTime);
      modulator.start(startTime);
      modulator.stop(startTime + duration);

      // Volume envelope
      gainNode.gain.setValueAtTime(0.1, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0.1, startTime + duration - 0.1);
      gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);

      return { oscillator, modulator, gainNode };
    } catch (error) {
      console.error('Error playing siren:', error);
    }
  }

  // Bell chime for break end
  playChime(count = 3) {
    if (!this.isInitialized) this.init();
    if (!this.audioContext) return;

    try {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const notes = [523, 659, 784]; // C, E, G
      
      for (let i = 0; i < Math.min(count, notes.length); i++) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        const startTime = this.audioContext.currentTime + (i * 0.3);
        oscillator.frequency.setValueAtTime(notes[i], startTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.01, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.3);
      }
    } catch (error) {
      console.error('Error playing chime:', error);
    }
  }

  // Critical alarm for urgent notifications
  playCriticalAlarm() {
    if (!this.isInitialized) this.init();
    if (!this.audioContext) return;

    try {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const beepCount = 5;
      for (let i = 0; i < beepCount; i++) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        const startTime = this.audioContext.currentTime + (i * 0.4);
        oscillator.frequency.setValueAtTime(880, startTime);
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0.01, startTime);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.15);
      }
    } catch (error) {
      console.error('Error playing critical alarm:', error);
    }
  }
}

const alarmSounds = new AlarmSounds();
export default alarmSounds;