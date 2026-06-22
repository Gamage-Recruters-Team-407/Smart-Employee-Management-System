import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Bell, Coffee, Utensils, Moon, X, Volume2, VolumeX, Clock,
  Play, Pause, AlertCircle
} from 'lucide-react';
import audioService from './AudioService';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useEmployeeProfile } from '../../hooks/useEmployeeProfile';
import CountdownPopup from './CountdownPopup';

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
    duration: 15,
    start: { hours: 15, minutes: 0 },
    end: { hours: 16, minutes: 0 },
    color: 'bg-blue-100 border-blue-300 text-blue-800',
    iconColor: 'text-blue-600',
    buttonColor: 'bg-blue-500 hover:bg-blue-600',
  }
];

const BreakNotification = () => {
  const { user: authUser } = useAuth();
  const { employee } = useEmployeeProfile({ enabled: authUser?.role === 'Employee' });

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

  const [showPopup, setShowPopup] = useState(false);

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

  const soundEnabledRef = useRef(true);
  const breakCountdownRef = useRef(null);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    breakCountdownRef.current = breakCountdown;
  }, [breakCountdown]);

  useEffect(() => {
    if (isBreakActive) {
      setShowPopup(true);
    } else {
      setShowPopup(false);
    }
  }, [isBreakActive]);

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
        employeeId: employee?._id || storedUser?.employee?._id || authUser?.employee?._id || storedUser?._id || authUser?._id,
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

    let tickCount = 0;

    countdownTimerRef.current = setInterval(async () => {
      if (!isMountedRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
        return;
      }



      // Decrement locally first
      setBreakCountdown((prev) => {
        if (prev === null) return null;
        const next = prev - 1;
        return next <= 0 ? 0 : next;
      });

      tickCount++;

      // Sync with server every 10 seconds, or on timer end
      if (tickCount % 10 === 0 || breakCountdownRef.current <= 0) {
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

            if (soundEnabledRef.current) {
              audioService.stopTickTock();
              audioService.playBreakEnd();
            }
            tickTockStartedRef.current = false;
            breakEndScheduledRef.current = false;

            showNotificationMessage('🟢 Break ended!', 'info');
            return;
          }

          setBreakCountdown(data.remainingSeconds || 0);

          if (data.remainingSeconds <= 0) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
            setIsBreakActive(false);
            setSelectedBreak(null);
            setActiveBreak(null);

            if (soundEnabledRef.current) {
              audioService.stopTickTock();
              audioService.playBreakEnd();
            }
            tickTockStartedRef.current = false;
            breakEndScheduledRef.current = false;

            showNotificationMessage('🟢 Break ended!', 'info');
          }
        } catch (err) {
          console.error('Failed to sync remaining break time:', err);
        }
      }
    }, 1000);
  }, [showNotificationMessage]);

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

      // Emit socket event for real-time admin view
      if (window.socket) {
        window.socket.emit('break-started', {
          employeeId: employee?.employeeId,
          breakType: breakItem.id,
          breakLabel: breakItem.label,
          remainingSeconds: data.remainingSeconds || breakItem.duration * 60
        });
      }

    } catch (error) {
      console.error('Failed to start break:', error);
      setAudioError(true);
      showNotificationMessage('⚠️ Failed to start break', 'error');
    }
  }, [updateUserStatus, soundEnabled, showNotificationMessage, startCountdown, fetchBreakStatus, employee]);

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

      // Emit socket event for real-time admin view
      if (window.socket) {
        window.socket.emit('break-ended', {
          employeeId: employee?.employeeId
        });
      }

    } catch (error) {
      console.error('Failed to end break:', error);
      showNotificationMessage('⚠️ Failed to end break', 'error');
    }
  }, [updateUserStatus, soundEnabled, showNotificationMessage, fetchBreakStatus, employee]);

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

  // Restrict to Employees only
  if (authUser?.role !== 'Employee') return null;

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
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all w-full ${isActive
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
                    <X size={14} className="animate-pulse" />
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
      {showNotification && !showPopup && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-md p-4 rounded-2xl border shadow-2xl text-white ${notificationType === 'break'
              ? activeBreak?.id === 'breakfast'
                ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-white border-amber-400 shadow-amber-500/20'
                : activeBreak?.id === 'lunch'
                  ? 'bg-gradient-to-r from-orange-600 via-red-500 to-amber-500 text-white border-orange-400 shadow-orange-500/20'
                  : 'bg-gradient-to-r from-indigo-500 via-blue-600 to-sky-500 text-white border-indigo-400 shadow-indigo-500/20'
              : notificationType === 'error'
                ? 'bg-gradient-to-r from-red-650 to-rose-600 border-red-400 shadow-red-500/20'
                : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white border-purple-400 shadow-purple-500/20'
            }`}
          style={{
            animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
          role="alert"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 text-white rounded-full">
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
                      <span className="text-xs font-normal opacity-90">
                        {breakCountdown !== null && (
                          <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full font-mono">
                            <Clock size={12} /> {formatCountdown(breakCountdown)}
                          </span>
                        )}
                      </span>
                    </h4>
                    <p className="text-sm opacity-90 flex items-center gap-2 mt-1">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                      Status: {activeBreak.label} (Offline)
                    </p>
                    {soundEnabled && !audioError && (
                      <p className="text-xs opacity-75 mt-0.5 flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-white" />
                        Tick-tock playing...
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <h4 className="font-bold text-sm">
                      {notificationType === 'error' ? '⚠️ Error' : 'Status Update'}
                    </h4>
                    <p className="text-sm opacity-90 mt-1">{notificationMessage}</p>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={dismissNotification}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ─── COUNTDOWN FULL SCREEN BLUR POPUP ───────────────────────────────── */}
      <CountdownPopup
        isOpen={showPopup}
        breakType={selectedBreak?.id}
        breakLabel={selectedBreak?.label}
        totalSeconds={BREAKS.find(b => b.id === selectedBreak?.id)?.duration * 60 || 900}
        remainingSeconds={breakCountdown}
        onEndBreak={() => handleEndBreak(selectedBreak)}
        onClosePopup={() => setShowPopup(false)}
      />

      {/* ─── PERSISTENT BREAK STATUS BANNER (TOP CENTER) ────────────────────── */}
      {isBreakActive && activeBreak && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-5 py-2.5 rounded-full border shadow-2xl text-white ${activeBreak.id === 'breakfast'
              ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 border-amber-400 shadow-amber-500/20'
              : activeBreak.id === 'lunch'
                ? 'bg-gradient-to-r from-orange-600 via-red-500 to-amber-500 border-orange-400 shadow-orange-500/20'
                : 'bg-gradient-to-r from-indigo-500 via-blue-600 to-sky-500 border-indigo-400 shadow-indigo-500/20'
            }`}
          style={{
            animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
        >
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
          </span>
          <span className="font-semibold text-sm tracking-wide">
            On Break: {activeBreak.label}
          </span>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono font-bold">
            {breakCountdown !== null && formatCountdown(breakCountdown)}
          </span>
        </div>
      )}

      {/* ─── SOUND TOGGLE BUTTON ────────────────────────────────────────────── */}
      <button
        onClick={toggleSound}
        className={`fixed bottom-4 right-4 z-40 p-3 rounded-full shadow-lg transition-colors ${soundEnabled
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
        @keyframes slideDown {
          from {
            transform: translate(-50%, -150%);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
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