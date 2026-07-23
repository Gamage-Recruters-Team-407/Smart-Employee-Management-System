// components/common/BreakTimer.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Clock, Coffee, Utensils, Moon, Bell, Play, Pause } from 'lucide-react';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useEmployeeProfile } from '../../hooks/useEmployeeProfile';
import audioService from './AudioService';

// Break configuration
const BREAK_CONFIG = {
  breakfast: {
    label: 'Breakfast',
    icon: Coffee,
    iconColor: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-200',
    buttonColor: 'bg-amber-500 hover:bg-amber-600',
    duration: 15,
    start: { hours: 10, minutes: 0 },
    end: { hours: 11, minutes: 0 }
  },
  lunch: {
    label: 'Lunch',
    icon: Utensils,
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
    buttonColor: 'bg-orange-500 hover:bg-orange-600',
    duration: 60,
    start: { hours: 12, minutes: 30 },
    end: { hours: 14, minutes: 30 }
  },
  tea: {
    label: 'Tea Time',
    icon: Moon,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    buttonColor: 'bg-blue-500 hover:bg-blue-600',
    duration: 15,
    start: { hours: 15, minutes: 0 },
    end: { hours: 16, minutes: 0 }
  }
};

const BreakTimer = () => {
  const { user } = useAuth();
  const { employee } = useEmployeeProfile({ enabled: user?.role === "Employee" });
  
  // ─── STATE ──────────────────────────────────────────────────────────────
  const [availableBreaks, setAvailableBreaks] = useState([]);
  const [currentBreak, setCurrentBreak] = useState(null);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [soundEnabled] = useState(true);
  const [showBreakAlert, setShowBreakAlert] = useState(false);
  const [breakAlertType, setBreakAlertType] = useState(null);
  const [isBreakEnding, setIsBreakEnding] = useState(false);
  
  // ─── REFS ──────────────────────────────────────────────────────────────
  const timerIntervalRef = useRef(null);
  const tickTockStartedRef = useRef(false);
  const breakEndNotifiedRef = useRef(false);
  const breakStartNotifiedRef = useRef(false);
  const isMountedRef = useRef(true);
  const isInitializedRef = useRef(false);
  const fetchBreakStatusRef = useRef(null);
  const hasAutoEndedRef = useRef(false);
  const soundEnabledRef = useRef(true);
  const userRef = useRef(null);
  const startTimerRef = useRef(null);
  const autoEndBreakRef = useRef(null);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // ─── FETCH BREAK STATUS ──────────────────────────────────────────────
  const fetchBreakStatus = async () => {
    if (!isMountedRef.current) return;
    
    try {
      const response = await API.get('/attendance/break/status');
      const data = response.data?.data || response.data || {};
      
      console.log('📡 Break Status Response:', data);
      
      setAvailableBreaks(data.availableBreaks || []);
      
      if (data.isOnBreak && data.currentBreak) {
        const breakConfig = BREAK_CONFIG[data.currentBreak.type];
        const remaining = data.currentBreak.remainingSeconds || 0;
        const total = breakConfig?.duration * 60 || 900;
        
        console.log(`✅ On Break: ${data.currentBreak.label}, Remaining: ${remaining}s`);
        
        setCurrentBreak({
          type: data.currentBreak.type,
          label: data.currentBreak.label,
          remainingSeconds: remaining,
          totalSeconds: total,
          startTime: data.currentBreak.startTime || new Date()
        });
        setIsOnBreak(true);
        setRemainingSeconds(remaining);
        setIsBreakEnding(remaining <= 10);
        breakStartNotifiedRef.current = true;
        breakEndNotifiedRef.current = false;
        hasAutoEndedRef.current = false;
        
        // Start timer immediately if on break
        if (remaining > 0 && !timerIntervalRef.current && startTimerRef.current) {
          startTimerRef.current();
        }
      } else {
        console.log('❌ Not on break');
        setIsOnBreak(false);
        setCurrentBreak(null);
        setRemainingSeconds(0);
        setIsBreakEnding(false);
        breakStartNotifiedRef.current = false;
        breakEndNotifiedRef.current = true;
        hasAutoEndedRef.current = false;
        
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
      }
    } catch (err) {
      console.error('Failed to fetch break status:', err);
      setError('Failed to load break status');
    }
  };

  // Store ref to fetchBreakStatus for use in effects
  useEffect(() => {
    fetchBreakStatusRef.current = fetchBreakStatus;
  }, []);

  // ─── AUTO END BREAK ──────────────────────────────────────────────────
  const autoEndBreak = async () => {
    if (hasAutoEndedRef.current || !isMountedRef.current) return;
    
    hasAutoEndedRef.current = true;
    setIsBreakEnding(true);
    
    try {
      console.log('⏰ Auto ending break...');
      await API.post('/attendance/break/end');
      
      if (soundEnabledRef.current) {
        try {
          audioService.stopTickTock();
          audioService.playBreakEnd();
        } catch (e) {
          console.warn('Sound stop failed:', e);
        }
      }
      
      tickTockStartedRef.current = false;
      breakStartNotifiedRef.current = false;
      breakEndNotifiedRef.current = true;
      
      setBreakAlertType('end');
      setShowBreakAlert(true);
      setTimeout(() => setShowBreakAlert(false), 5000);
      
      setIsOnBreak(false);
      setCurrentBreak(null);
      setRemainingSeconds(0);
      setIsBreakEnding(false);
      
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      
      if (window.socket) {
        window.socket.emit('break-ended', { employeeId: employee?.employeeId });
      }
      
    } catch (err) {
      console.error('Failed to auto end break:', err);
      hasAutoEndedRef.current = false;
    }
  };

  // Store autoEndBreak in ref
  useEffect(() => {
    autoEndBreakRef.current = autoEndBreak;
  }, []);

  // ─── TIMER LOGIC ─────────────────────────────────────────────────────
  const startTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    
    console.log('⏱️ Starting timer interval');
    
    timerIntervalRef.current = setInterval(async () => {
      if (!isMountedRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
        return;
      }
      
      // Use refs to avoid dependency issues
      
      try {
        const response = await API.get('/attendance/break/remaining');
        const data = response.data?.data || response.data || {};
        
        console.log(`⏱️ Timer update: ${data.remainingSeconds || 0}s remaining`);
        
        if (!data.isOnBreak) {
          console.log('⏰ Break ended on server');
          setRemainingSeconds(0);
          setIsOnBreak(false);
          setCurrentBreak(null);
          setIsBreakEnding(false);
          
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          
          if (soundEnabledRef.current && !breakEndNotifiedRef.current) {
            audioService.playBreakEnd();
            audioService.stopTickTock();
            breakEndNotifiedRef.current = true;
          }
          
          setBreakAlertType('end');
          setShowBreakAlert(true);
          setTimeout(() => setShowBreakAlert(false), 5000);
          
          return;
        }
        
        const newRemaining = data.remainingSeconds || 0;
        setRemainingSeconds(newRemaining);
        setIsBreakEnding(newRemaining <= 10);
        
        if (data.breakType && data.breakLabel) {
          setCurrentBreak(prev => ({
            ...prev,
            type: data.breakType,
            label: data.breakLabel,
            remainingSeconds: newRemaining
          }));
        }
        
        if (newRemaining <= 10 && newRemaining > 0 && soundEnabledRef.current && !breakEndNotifiedRef.current) {
          audioService.playSimpleBeep();
        }
        
        if (newRemaining <= 0 && !hasAutoEndedRef.current) {
          console.log('⏰ Break reached 0, auto ending...');
          if (autoEndBreakRef.current) {
            await autoEndBreakRef.current();
          }
        }
        
        if (window.socket) {
          window.socket.emit('break-update', {
            employeeId: employee?.employeeId,
            remainingSeconds: newRemaining
          });
        }
        
      } catch (err) {
        console.error('Failed to update break time:', err);
      }
    }, 1000);
  };

  // Store startTimer in ref
  useEffect(() => {
    startTimerRef.current = startTimer;
  }, []);

  // ─── START BREAK ──────────────────────────────────────────────────────
  const startBreak = async (breakType) => {
    setLoading(true);
    setError(null);
    hasAutoEndedRef.current = false;
    
    try {
      console.log(`▶️ Starting ${breakType} break...`);
      const response = await API.post('/attendance/break/start', { breakType });
      const data = response.data?.data || response.data || {};
      const breakConfig = BREAK_CONFIG[breakType];
      
      if (soundEnabledRef.current) {
        try {
          audioService.playBreakStart();
          audioService.startTickTock();
          tickTockStartedRef.current = true;
        } catch (e) {
          console.warn('Sound play failed:', e);
        }
      }
      
      setBreakAlertType('start');
      setShowBreakAlert(true);
      setTimeout(() => setShowBreakAlert(false), 5000);
      
      const breakLabel = breakConfig?.label || breakType;
      const remaining = data.remainingSeconds || breakConfig?.duration * 60 || 900;
      const total = breakConfig?.duration * 60 || 900;
      
      console.log(`✅ Break started: ${breakLabel}, Remaining: ${remaining}s`);
      
      setIsOnBreak(true);
      setIsBreakEnding(false);
      setCurrentBreak({
        type: breakType,
        label: breakLabel,
        remainingSeconds: remaining,
        totalSeconds: total,
        startTime: new Date()
      });
      setRemainingSeconds(remaining);
      breakStartNotifiedRef.current = true;
      breakEndNotifiedRef.current = false;
      
      if (startTimerRef.current) {
        startTimerRef.current();
      }
      
      if (window.socket) {
        window.socket.emit('break-started', {
          employeeId: employee?.employeeId,
          breakType,
          breakLabel,
          remainingSeconds: remaining
        });
      }
      
    } catch (err) {
      console.error('Failed to start break:', err);
      setError(err.response?.data?.message || 'Failed to start break');
    } finally {
      setLoading(false);
    }
  };

  // ─── END BREAK (Manual) ──────────────────────────────────────────────
  const endBreak = async () => {
    setLoading(true);
    setError(null);
    hasAutoEndedRef.current = true;
    
    try {
      console.log('⏹️ Manually ending break...');
      await API.post('/attendance/break/end');
      
      if (soundEnabledRef.current) {
        try {
          audioService.stopTickTock();
          audioService.playBreakEnd();
        } catch (e) {
          console.warn('Sound stop failed:', e);
        }
      }
      
      tickTockStartedRef.current = false;
      breakStartNotifiedRef.current = false;
      breakEndNotifiedRef.current = true;
      
      setBreakAlertType('end');
      setShowBreakAlert(true);
      setTimeout(() => setShowBreakAlert(false), 5000);
      
      setIsOnBreak(false);
      setCurrentBreak(null);
      setRemainingSeconds(0);
      setIsBreakEnding(false);
      
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      
      if (window.socket) {
        window.socket.emit('break-ended', { employeeId: employee?.employeeId });
      }
      
    } catch (err) {
      console.error('Failed to end break:', err);
      setError(err.response?.data?.message || 'Failed to end break');
      hasAutoEndedRef.current = false;
    } finally {
      setLoading(false);
    }
  };



  // ─── EFFECT: INITIALIZE ──────────────────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;
    
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      const timerId = setTimeout(() => {
        if (isMountedRef.current && fetchBreakStatusRef.current) {
          fetchBreakStatusRef.current();
        }
      }, 0);
      
      return () => clearTimeout(timerId);
    }
  }, []);

  // ─── EFFECT: POLLING INTERVAL ──────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (isMountedRef.current && fetchBreakStatusRef.current) {
        fetchBreakStatusRef.current();
      }
    }, 15000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  // ─── EFFECT: START TIMER IF ON BREAK ────────────────────────────────
  useEffect(() => {
    if (isOnBreak && !timerIntervalRef.current && isInitializedRef.current) {
      console.log('🔄 Starting timer from effect');
      if (startTimerRef.current) {
        startTimerRef.current();
      }
    }
    
    if (!isOnBreak && timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, [isOnBreak]);

  // ─── EFFECT: CLEANUP ──────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (tickTockStartedRef.current) {
        audioService.stopTickTock();
      }
    };
  }, []);

  // ─── FORMAT TIME ─────────────────────────────────────────────────────
  const formatTime = (seconds) => {
    if (seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // ─── GET BREAK ICON ──────────────────────────────────────────────────
  const getBreakIcon = (type) => {
    const config = BREAK_CONFIG[type];
    if (!config) return Coffee;
    return config.icon;
  };

  const getBreakColor = (type) => {
    const config = BREAK_CONFIG[type];
    if (!config) return 'text-gray-600';
    return config.iconColor;
  };

  const getBreakBgColor = (type) => {
    const config = BREAK_CONFIG[type];
    if (!config) return 'bg-gray-50 border-gray-200';
    return config.bgColor;
  };

  const getAvailableBreakConfig = (type) => {
    return BREAK_CONFIG[type] || null;
  };

  const getBreakStatusMessage = () => {
    if (isOnBreak && currentBreak) {
      return `Currently on ${currentBreak.label} break`;
    }
    if (availableBreaks.length > 0) {
      return `${availableBreaks.length} break(s) available`;
    }
    return 'No breaks available at this time';
  };

  return (
    <div className="break-timer-container space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {showBreakAlert && (
        <div className={`p-4 rounded-xl border shadow-lg animate-slide-in ${
          breakAlertType === 'start' 
            ? 'bg-green-50 border-green-300 text-green-800'
            : 'bg-orange-50 border-orange-300 text-orange-800'
        }`}>
          <div className="flex items-center gap-3">
            <Bell size={20} className={breakAlertType === 'start' ? 'text-green-600' : 'text-orange-600'} />
            <div>
              <p className="font-semibold text-sm">
                {breakAlertType === 'start' 
                  ? `✅ ${currentBreak?.label || 'Break'} started!`
                  : `⏰ ${currentBreak?.label || 'Break'} ended!`}
              </p>
              <p className="text-xs opacity-75">
                {breakAlertType === 'start' 
                  ? 'You are now on break. Enjoy your time!'
                  : 'Back to work! You are now online.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {!isOnBreak && availableBreaks.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Take a Break
            </h3>
            <span className="text-xs text-gray-400">
              {new Date().toLocaleTimeString()}
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            {availableBreaks.map((breakItem) => {
              const Icon = getBreakIcon(breakItem.type);
              const config = getAvailableBreakConfig(breakItem.type);
              const remainingMins = Math.floor(breakItem.remainingSeconds / 60);
              const remainingSecs = breakItem.remainingSeconds % 60;
              
              return (
                <button
                  key={breakItem.type}
                  onClick={() => startBreak(breakItem.type)}
                  disabled={loading}
                  className={`flex items-center gap-3 px-5 py-3 rounded-xl font-medium transition-all transform hover:scale-105 active:scale-95 ${getBreakBgColor(breakItem.type)} text-gray-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Icon size={20} className={getBreakColor(breakItem.type)} />
                  <span>{breakItem.label}</span>
                  <span className="text-xs bg-white/60 px-2 py-0.5 rounded-full text-gray-500">
                    {config?.duration}m
                  </span>
                  {remainingMins < 5 && (
                    <span className="text-xs text-amber-600 font-medium animate-pulse">
                      ({remainingMins}m {remainingSecs}s left)
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-4 text-xs text-gray-400 border-t border-gray-100 pt-3">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {getBreakStatusMessage()}
            </span>
          </div>
        </div>
      )}

      {!isOnBreak && availableBreaks.length === 0 && (
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 text-center">
          <Clock size={24} className="text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No breaks currently available</p>
          <p className="text-xs text-gray-400 mt-1">
            Breakfast: 10:00-11:00 | Lunch: 12:30-14:30 | Tea: 15:00-16:00
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Current time: {new Date().toLocaleTimeString()}
          </p>
        </div>
      )}

      {isOnBreak && currentBreak && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 relative overflow-hidden">
          <div className={`absolute inset-0 opacity-10 ${getBreakBgColor(currentBreak.type)}`} />
          
          <div className="absolute inset-0 border-2 border-transparent rounded-2xl animate-border-pulse" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {React.createElement(getBreakIcon(currentBreak.type), {
                  size: 28,
                  className: getBreakColor(currentBreak.type)
                })}
                <div>
                  <h4 className="font-semibold text-gray-800 text-lg">
                    {currentBreak.label} Break
                  </h4>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                      isBreakEnding ? 'bg-red-500 animate-pulse' : 'bg-green-500 animate-pulse'
                    }`} />
                    {isBreakEnding ? '⚠️ Almost done!' : 'Active'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={endBreak}
                  disabled={loading}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  End Break
                </button>
              </div>
            </div>

            <div className="text-center py-6">
              <div className={`text-7xl font-mono font-bold tracking-wider transition-all duration-300 ${
                isBreakEnding 
                  ? 'text-red-600 animate-pulse' 
                  : 'text-gray-900'
              }`}>
                {formatTime(remainingSeconds)}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {isBreakEnding ? '⚠️ Break ending soon!' : '⏱️ Time remaining'}
              </p>
            </div>

            <div className="mt-2 h-3 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  isBreakEnding
                    ? 'bg-gradient-to-r from-red-500 to-red-600 animate-pulse'
                    : remainingSeconds <= 60
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                    : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                }`}
                style={{
                  width: `${(remainingSeconds / currentBreak.totalSeconds) * 100}%`
                }}
              />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
              <div>
                <span className="text-gray-400 block">Started</span>
                <span className="text-gray-700 font-medium">
                  {currentBreak.startTime ? new Date(currentBreak.startTime).toLocaleTimeString() : '—'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Duration</span>
                <span className="text-gray-700 font-medium">
                  {BREAK_CONFIG[currentBreak.type]?.duration || 0}m
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Status</span>
                <span className={`font-medium flex items-center justify-center gap-1 ${
                  isBreakEnding ? 'text-red-600' : 'text-amber-600'
                }`}>
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                    isBreakEnding ? 'bg-red-500 animate-pulse' : 'bg-amber-500 animate-pulse'
                  }`} />
                  {isBreakEnding ? '⚠️ Ending' : 'Active'}
                </span>
              </div>
            </div>

            <div className="mt-3 text-center">
              <span className="text-xs text-gray-400">
                {isBreakEnding 
                  ? '⏰ Break will end automatically in a few seconds!'
                  : 'Enjoy your break!'}
              </span>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
        @keyframes border-pulse {
          0% { border-color: rgba(99, 102, 241, 0); }
          50% { border-color: rgba(99, 102, 241, 0.3); }
          100% { border-color: rgba(99, 102, 241, 0); }
        }
        .animate-border-pulse {
          animation: border-pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse {
          animation: pulse 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default BreakTimer;