import React, { useEffect, useState } from 'react';
import { Play, Pause, Coffee, Utensils, Moon, AlertTriangle, CheckCircle, Volume2 } from 'lucide-react';
import audioService from './AudioService';

const CountdownPopup = ({
  isOpen,
  breakType,
  breakLabel,
  totalSeconds,
  remainingSeconds,
  onEndBreak,
  onClosePopup
}) => {
  const [alarmActive, setAlarmActive] = useState(false);
  const [alarmIntervalId, setAlarmIntervalId] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      // Clear alarm if closed
      if (alarmIntervalId) {
        clearInterval(alarmIntervalId);
        setAlarmIntervalId(null);
      }
      setAlarmActive(false);
      return;
    }

    // Voice countdown logic on last 10 seconds
    if (remainingSeconds <= 10 && remainingSeconds >= 0 && !alarmActive) {
      audioService.playVoiceCountdown(remainingSeconds);
    }

    // When countdown hits 0, close the popup and end break automatically
    if (isOpen && remainingSeconds !== null && remainingSeconds !== undefined && remainingSeconds <= 0) {
      audioService.playBreakEnd();
      onEndBreak();
      onClosePopup();
    }
  }, [remainingSeconds, isOpen, alarmActive]);

  // Clean up alarm interval on unmount
  useEffect(() => {
    return () => {
      if (alarmIntervalId) {
        clearInterval(alarmIntervalId);
      }
    };
  }, [alarmIntervalId]);

  if (!isOpen) return null;

  // Icons based on breakType
  const getIcon = () => {
    const iconSize = 36;
    switch (breakType) {
      case 'breakfast':
        return <Coffee size={iconSize} className="text-amber-500 animate-bounce" />;
      case 'lunch':
        return <Utensils size={iconSize} className="text-orange-500 animate-bounce" />;
      case 'tea':
        return <Moon size={iconSize} className="text-blue-500 animate-bounce" />;
      default:
        return <Coffee size={iconSize} className="text-indigo-500" />;
    }
  };

  // Gradient background ring colors based on break type
  const getThemeColor = () => {
    if (alarmActive) return 'from-red-500 to-rose-600';
    switch (breakType) {
      case 'breakfast':
        return 'from-amber-400 to-yellow-500';
      case 'lunch':
        return 'from-orange-400 to-red-500';
      case 'tea':
        return 'from-blue-400 to-indigo-500';
      default:
        return 'from-indigo-400 to-purple-500';
    }
  };

  // Format seconds to MM:SS
  const formatTime = (secs) => {
    if (secs < 0) return '00:00';
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // SVG Progress Ring calculations
  const radius = 90;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = totalSeconds > 0 
    ? circumference - (Math.max(0, remainingSeconds) / totalSeconds) * circumference 
    : 0;

  // Handle the action button click when break time is up (requires employee click)
  const handleCompleteBreak = () => {
    if (alarmIntervalId) {
      clearInterval(alarmIntervalId);
      setAlarmIntervalId(null);
    }
    setAlarmActive(false);
    onEndBreak(); // End the break and update status in DB
    onClosePopup(); // Close the popup
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with strong blur */}
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md transition-all duration-300"></div>

      {/* Glassmorphism Card */}
      <div className="relative bg-white/90 dark:bg-gray-900/90 border border-gray-200/50 dark:border-gray-800/50 shadow-2xl rounded-3xl max-w-md w-full p-8 text-center backdrop-blur-lg transform scale-100 transition-all duration-300">
        
        {/* Header Indicator */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-inner border border-gray-100 dark:border-gray-700/50">
            {getIcon()}
          </div>
        </div>

        <h3 className="text-2xl font-extrabold text-gray-800 dark:text-white tracking-tight uppercase">
          {alarmActive ? `${breakLabel} Time Over` : `${breakLabel} Break`}
        </h3>
        
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 mb-8">
          {alarmActive 
            ? 'Please click "Back to Work" to stop the alarm and update your status.'
            : 'Enjoy your break! The alarm will ring when time is up.'}
        </p>

        {/* Circular Progress Countdown */}
        <div className="relative flex justify-center items-center my-6">
          <svg className="w-56 h-56 transform -rotate-90">
            {/* Background Circle */}
            <circle
              cx="112"
              cy="112"
              r={radius}
              className="text-gray-100 dark:text-gray-800"
              strokeWidth={strokeWidth}
              stroke="currentColor"
              fill="transparent"
            />
            {/* Active Progress Circle */}
            <circle
              cx="112"
              cy="112"
              r={radius}
              className={`transition-all duration-1000 ease-linear`}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="url(#progressGradient)"
              fill="transparent"
            />
            {/* Gradient definition */}
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" className="text-indigo-500" stopColor="currentColor" />
                <stop offset="100%" className="text-purple-600" stopColor="currentColor" />
              </linearGradient>
            </defs>
          </svg>

          {/* Time display text overlay */}
          <div className="absolute flex flex-col items-center justify-center">
            {alarmActive ? (
              <div className="animate-pulse flex flex-col items-center">
                <Volume2 size={36} className="text-red-500 animate-bounce mb-1" />
                <span className="text-xl font-black text-red-600 uppercase tracking-widest">Ringing</span>
              </div>
            ) : (
              <>
                <span className={`text-4xl font-mono font-black tracking-wider transition-colors duration-300 ${
                  remainingSeconds <= 10 && remainingSeconds > 0 ? 'text-red-500 scale-110 animate-pulse' : 'text-gray-800 dark:text-white'
                }`}>
                  {formatTime(remainingSeconds)}
                </span>
                <span className="text-xs text-gray-400 uppercase tracking-widest mt-1">
                  Remaining
                </span>
              </>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-8 flex flex-col gap-3">
          {alarmActive ? (
            <button
              onClick={handleCompleteBreak}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 text-base"
            >
              <CheckCircle size={20} />
              <span>Back to Work</span>
            </button>
          ) : (
            <button
              onClick={handleCompleteBreak}
              className="w-full py-4 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-650 hover:to-rose-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 text-base"
            >
              <CheckCircle size={20} />
              <span>End Break Early</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CountdownPopup;
