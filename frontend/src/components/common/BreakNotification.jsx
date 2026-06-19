import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Bell, Coffee, Utensils, Moon, X, Volume2, VolumeX, Clock, 
  Play, Pause, AlertCircle 
} from 'lucide-react';
import audioService from './AudioService';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// ─── BREAK SCHEDULE ──────────────────────────────────────────────────────────
const BREAKS = [
  { 
    id: 'breakfast', 
    label: 'Breakfast', 
    icon: Coffee,
    duration: 15,
    start: { hours: 10, minutes: 0 },
    end: { hours: 11, minutes: 0 },
    color: 'bg-amber-100 border-amber-300 text-amber-800',
    iconColor: 'text-amber-600',
    buttonColor: 'bg-amber-500 hover:bg-amber-600',
  },
  { 
    id: 'lunch', 
    label: 'Lunch', 
    icon: Utensils,
    duration: 60,
    start: { hours: 12, minutes: 30 },
    end: { hours: 14, minutes: 30 },
    color: 'bg-orange-100 border-orange-300 text-orange-800',
    iconColor: 'text-orange-600',
    buttonColor: 'bg-orange-500 hover:bg-orange-600',
  },
  { 
    id: 'tea', 
    label: 'Tea Time', 
    icon: Moon,
    duration: 30,
    start: { hours: 15, minutes: 0 },
    end: { hours: 16, minutes: 0 },
    color: 'bg-blue-100 border-blue-300 text-blue-800',
    iconColor: 'text-blue-600',
    buttonColor: 'bg-blue-500 hover:bg-blue-600',
  }
];

const BreakNotification = () => {
  const { user: authUser } = useAuth();
  
  // ─── STATE VARIABLES ──────────────────────────────────────────────────────
  const [activeBreak, setActiveBreak] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isBreakActive, setIsBreakActive] = useState(false);
  const [breakCountdown, setBreakCountdown] = useState(null);
  const [audioError, setAudioError] = useState(false);
  const [selectedBreak, setSelectedBreak] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('info');
  const [availableBreaks, setAvailableBreaks] = useState([]);
  
  // ─── REFS ──────────────────────────────────────────────────────────────────
  const tickTockStartedRef = useRef(false);
  const breakStartNotifiedRef = useRef(false);
  const breakEndNotifiedRef = useRef(false);
  const countdownTimerRef = useRef(null);
  const notificationTimerRef = useRef(null);
  const breakEndScheduledRef = useRef(false);
  const isMountedRef = useRef(true);
  const isInitializedRef = useRef(false);
  const fetchBreakStatusRef = useRef(null);

  // ─── BREAK MAP ─────────────────────────────────────────────────────────────
  const breakMap = useMemo(() => {
    const map = {};
    BREAKS.forEach(b => { map[b.id] = b; });
    return map;
  }, []);

  const getBreakLabel = useCallback((breakType) => {
    return breakMap[breakType]?.label || breakType || 'Break';
  }, [breakMap]);

  // ─── GET STORED USER ────────────────────────────────────────────────────
  const getStoredUser = useCallback(() => {
    try {
      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (userStr && userStr !== 'undefined') {
        return JSON.parse(userStr);
      }
    } catch (e) {
      console.warn('Could not parse user data:', e);
    }
    return null;
  }, []);

  // ─── FETCH BREAK STATUS ──────────────────────────────────────────────────
  const fetchBreakStatus = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      const response = await API.get('/attendance/break/status');
      const data = response.data?.data || response.data || {};
      
      setAvailableBreaks(data.availableBreaks || []);
      
      if (data.isOnBreak && data.currentBreak) {
        setSelectedBreak({
          id: data.currentBreak.type,
          label: data.currentBreak.label,
          duration: BREAKS.find(b => b.id === data.currentBreak.type)?.duration || 0
        });
        setIsBreakActive(true);
        setBreakCountdown(data.currentBreak.remainingSeconds || 0);
        setActiveBreak(BREAKS.find(b => b.id === data.currentBreak.type) || null);
        breakStartNotifiedRef.current = true;
        breakEndNotifiedRef.current = false;
      } else {
        setIsBreakActive(false);
        setSelectedBreak(null);
        setActiveBreak(null);
        setBreakCountdown(null);
        breakStartNotifiedRef.current = false;
        breakEndNotifiedRef.current = true;
      }
    } catch (err) {
      console.error('Failed to fetch break status:', err);
    }
  }, []);

  // Store ref to fetchBreakStatus for use in effects
  useEffect(() => {
    fetchBreakStatusRef.current = fetchBreakStatus;
  }, [fetchBreakStatus]);

  // ─── SHOW NOTIFICATION ──────────────────────────────────────────────────
  const showNotificationMessage = useCallback((message, type = 'info') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
    }
    
    notificationTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setShowNotification(false);
      }
    }, 5000);
  }, []);

  // ─── UPDATE USER STATUS ──────────────────────────────────────────────────
  const updateUserStatus = useCallback(async (status, breakType = null) => {
    try {
      setIsUpdatingStatus(true);
      
      const storedUser = getStoredUser();

      const payload = {
        employeeId: storedUser?._id || authUser?._id,
        email: storedUser?.email || authUser?.email,
        status: status,
        breakType: breakType,
        timestamp: new Date().toISOString(),
      };

      const response = await API.post('/attendance/update-status', payload);
      
      const label = getBreakLabel(breakType);
      const message = status === 'Online' 
        ? '🟢 Back Online!' 
        : breakType 
          ? `🔴 ${label} - Offline`
          : '🔴 Offline';
      
      showNotificationMessage(message, 'info');
      
      // Refresh break status
      await fetchBreakStatus();
      
      console.log(`✅ Status updated to: ${status}${breakType ? ` (${breakType})` : ''}`);
      return response.data;
    } catch (error) {
      console.error('Failed to update status:', error);
      showNotificationMessage('⚠️ Status updated locally (API error)', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  }, [authUser, getStoredUser, getBreakLabel, showNotificationMessage, fetchBreakStatus]);

  // ─── START COUNTDOWN TIMER ──────────────────────────────────────────────
  const startCountdown = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    
    countdownTimerRef.current = setInterval(async () => {
      if (!isMountedRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
        return;
      }
      
      try {
        const response = await API.get('/attendance/break/remaining');
        const data = response.data?.data || response.data || {};
        
        if (!data.isOnBreak) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
          setBreakCountdown(0);
          setIsBreakActive(false);
          setSelectedBreak(null);
          setActiveBreak(null);
          
          if (soundEnabled) {
            audioService.stopTickTock();
            audioService.playBreakEnd();
          }
          tickTockStartedRef.current = false;
          breakEndScheduledRef.current = false;
          
          showNotificationMessage('🟢 Break ended!', 'info');
          return;
        }
        
        setBreakCountdown(data.remainingSeconds || 0);
        
        if (data.remainingSeconds <= 10 && data.remainingSeconds > 0 && soundEnabled) {
          audioService.playSimpleBeep();
        }
        
        if (data.remainingSeconds <= 0) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
          setIsBreakActive(false);
          setSelectedBreak(null);
          setActiveBreak(null);
          
          if (soundEnabled) {
            audioService.stopTickTock();
            audioService.playBreakEnd();
          }
          tickTockStartedRef.current = false;
          breakEndScheduledRef.current = false;
          
          showNotificationMessage('🟢 Break ended!', 'info');
        }
      } catch (err) {
        console.error('Failed to update break time:', err);
      }
    }, 1000);
  }, [soundEnabled, showNotificationMessage]);

  // ─── HANDLE START BREAK ──────────────────────────────────────────────────
  const handleStartBreak = useCallback(async (breakItem) => {
    try {
      await updateUserStatus('Offline', breakItem.id);
      await fetchBreakStatus();
      
      setSelectedBreak(breakItem);
      setIsBreakActive(true);
      setActiveBreak(breakItem);
      breakStartNotifiedRef.current = true;
      breakEndNotifiedRef.current = false;
      breakEndScheduledRef.current = false;

      const response = await API.get('/attendance/break/remaining');
      const data = response.data?.data || response.data || {};
      setBreakCountdown(data.remainingSeconds || 0);

      if (soundEnabled) {
        try {
          audioService.playNotificationSound('break-start');
          audioService.startTickTock();
          tickTockStartedRef.current = true;
        } catch (error) {
          console.warn('Sound play failed:', error);
          setAudioError(true);
        }
      }

      showNotificationMessage(`🔴 ${breakItem.label} started!`, 'break');
      startCountdown();

    } catch (error) {
      console.error('Failed to start break:', error);
      setAudioError(true);
      showNotificationMessage('⚠️ Failed to start break', 'error');
    }
  }, [updateUserStatus, soundEnabled, showNotificationMessage, startCountdown, fetchBreakStatus]);

  // ─── HANDLE END BREAK ────────────────────────────────────────────────────
  const handleEndBreak = useCallback(async (breakItem) => {
    try {
      await updateUserStatus('Online', null);
      
      setIsBreakActive(false);
      setActiveBreak(null);
      setSelectedBreak(null);
      breakStartNotifiedRef.current = false;
      breakEndNotifiedRef.current = true;
      breakEndScheduledRef.current = false;
      setBreakCountdown(null);

      try {
        audioService.stopTickTock();
        tickTockStartedRef.current = false;
      } catch (error) {
        console.warn('Tick-tock stop failed:', error);
      }

      if (soundEnabled) {
        try {
          audioService.playNotificationSound('break-end');
        } catch (error) {
          console.warn('Sound play failed:', error);
        }
      }

      showNotificationMessage(`🟢 ${breakItem?.label || 'Break'} ended!`, 'info');
      await fetchBreakStatus();

    } catch (error) {
      console.error('Failed to end break:', error);
      showNotificationMessage('⚠️ Failed to end break', 'error');
    }
  }, [updateUserStatus, soundEnabled, showNotificationMessage, fetchBreakStatus]);

  // ─── HANDLE BREAK SELECTION ──────────────────────────────────────────────
  const handleBreakSelect = useCallback(async (breakItem) => {
    if (isUpdatingStatus) return;

    if (selectedBreak?.id === breakItem.id && isBreakActive) {
      await handleEndBreak(breakItem);
      return;
    }

    if (isBreakActive && selectedBreak) {
      await handleEndBreak(selectedBreak);
    }

    await handleStartBreak(breakItem);
  }, [isUpdatingStatus, selectedBreak, isBreakActive, handleEndBreak, handleStartBreak]);

  // ─── FORMAT COUNTDOWN ──────────────────────────────────────────────────
  const formatCountdown = useCallback((seconds) => {
    if (seconds === null || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, []);

  // ─── GET ICON ──────────────────────────────────────────────────────────
  const getIcon = useCallback((breakId) => {
    const breakItem = BREAKS.find(b => b.id === breakId);
    const Icon = breakItem?.icon || Bell;
    return <Icon size={16} />;
  }, []);

  // ─── TOGGLE SOUND ──────────────────────────────────────────────────────
  const toggleSound = useCallback(() => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    
    if (newState) {
      try {
        audioService.init();
        setTimeout(() => {
          try {
            audioService.playSimpleBeep();
          } catch (e) {
            console.warn('Sound test failed:', e);
          }
        }, 100);
      } catch (error) {
        console.warn('Sound init failed:', error);
        setAudioError(true);
      }
      
      if (isBreakActive) {
        try {
          audioService.startTickTock();
          tickTockStartedRef.current = true;
        } catch (e) {
          console.warn('Tick-tock restart failed:', e);
        }
      }
    } else {
      try {
        audioService.stopTickTock();
        tickTockStartedRef.current = false;
      } catch (e) {
        console.warn('Tick-tock stop failed:', e);
      }
    }
  }, [soundEnabled, isBreakActive]);

  // ─── DISMISS NOTIFICATION ──────────────────────────────────────────────
  const dismissNotification = useCallback(() => {
    setShowNotification(false);
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
      notificationTimerRef.current = null;
    }
  }, []);

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
    }, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  // ─── EFFECT: START COUNTDOWN WHEN BREAK BECOMES ACTIVE ──────────────
  useEffect(() => {
    if (isBreakActive && !countdownTimerRef.current && isInitializedRef.current) {
      startCountdown();
    }
    
    if (!isBreakActive && countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, [isBreakActive, startCountdown]);

  // ─── EFFECT: CLEANUP ──────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
        notificationTimerRef.current = null;
      }
      try {
        audioService.stopTickTock();
      } catch {
        // Ignore
      }
    };
  }, []);

  return (
    <>
      {/* ─── BREAK SELECTOR BUTTONS ────────────────────────────────────────── */}
      <div className="fixed bottom-4 left-4 z-40 flex flex-col gap-2">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-2">
          <p className="text-xs font-semibold text-gray-500 px-2 pb-1">Break</p>
          {availableBreaks.length === 0 ? (
            <p className="text-xs text-gray-400 px-2 py-1">No breaks available</p>
          ) : (
            availableBreaks.map((breakItem) => {
              const fullBreak = BREAKS.find(b => b.id === breakItem.type);
              const isActive = selectedBreak?.id === breakItem.type && isBreakActive;
              
              return (
                <button
                  key={breakItem.type}
                  onClick={() => handleBreakSelect(fullBreak || { id: breakItem.type, label: breakItem.label })}
                  disabled={isUpdatingStatus}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all w-full ${
                    isActive 
                      ? `${fullBreak?.buttonColor || 'bg-indigo-500'} text-white` 
                      : 'hover:bg-gray-100 text-gray-700'
                  } ${isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {getIcon(breakItem.type)}
                  <span className="flex-1 text-left">
                    {breakItem.label}
                    <span className="text-xs opacity-75 ml-1">
                      ({Math.floor(breakItem.remainingSeconds / 60)}m)
                    </span>
                  </span>
                  {isActive ? (
                    <Pause size={14} className="animate-pulse" />
                  ) : (
                    <Play size={14} />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ─── FLOATING NOTIFICATION ──────────────────────────────────────────── */}
      {showNotification && (
        <div 
          className={`fixed top-20 right-4 z-50 max-w-sm p-4 rounded-xl border shadow-lg ${
            notificationType === 'break' 
              ? activeBreak?.color || 'bg-amber-100 border-amber-300 text-amber-800'
              : notificationType === 'error'
                ? 'bg-red-100 border-red-300 text-red-800'
                : 'bg-indigo-100 border-indigo-300 text-indigo-800'
          }`}
          style={{
            animation: 'slideIn 0.3s ease-out'
          }}
          role="alert"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/50 rounded-full">
                {activeBreak && notificationType === 'break' ? (
                  getIcon(activeBreak.id)
                ) : notificationType === 'error' ? (
                  <AlertCircle size={20} />
                ) : (
                  <Bell size={20} />
                )}
              </div>
              <div>
                {activeBreak && notificationType === 'break' ? (
                  <>
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      {activeBreak.label} Time 
                      <span className="text-xs font-normal opacity-75">
                        {breakCountdown !== null && (
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {formatCountdown(breakCountdown)}
                          </span>
                        )}
                      </span>
                    </h4>
                    <p className="text-sm opacity-90 flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                      Status: {activeBreak.label}
                    </p>
                    {soundEnabled && !audioError && (
                      <p className="text-xs opacity-50 mt-0.5 flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
                        Tick-tock playing...
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <h4 className="font-bold text-sm">
                      {notificationType === 'error' ? '⚠️ Error' : 'Status Update'}
                    </h4>
                    <p className="text-sm opacity-90">{notificationMessage}</p>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={dismissNotification}
              className="p-1 hover:bg-white/30 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ─── BREAK STATUS INDICATOR ─────────────────────────────────────────── */}
      {isBreakActive && activeBreak && (
        <div className="fixed bottom-24 left-4 z-40 bg-red-500 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <span className="inline-block w-2 h-2 rounded-full bg-white" />
          {activeBreak.label}
          <span className="text-xs opacity-75 ml-1">
            {breakCountdown !== null && formatCountdown(breakCountdown)}
          </span>
        </div>
      )}

      {/* ─── SOUND TOGGLE BUTTON ────────────────────────────────────────────── */}
      <button
        onClick={toggleSound}
        className={`fixed bottom-4 right-4 z-40 p-3 rounded-full shadow-lg transition-colors ${
          soundEnabled 
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
            : 'bg-gray-600 hover:bg-gray-700 text-white'
        }`}
        title={soundEnabled ? 'Sound On' : 'Sound Off'}
      >
        {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
      </button>

      {/* ─── TICK-TOCK VISUAL INDICATOR ─────────────────────────────────────── */}
      {isBreakActive && soundEnabled && !audioError && (
        <div className="fixed bottom-28 left-4 z-40 text-gray-400 text-xs flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
          Tick-tock
        </div>
      )}

      {/* ─── AUDIO ERROR INDICATOR ──────────────────────────────────────────── */}
      {audioError && (
        <div className="fixed bottom-32 left-4 z-40 text-red-500 text-xs flex items-center gap-1 bg-red-50 px-2 py-1 rounded-lg border border-red-200">
          <AlertCircle size={12} />
          Click anywhere to enable audio
        </div>
      )}

      {/* ─── CSS ANIMATIONS USING STYLE TAG ──────────────────────────────────── */}
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
        .animate-pulse {
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );
};

export default BreakNotification;