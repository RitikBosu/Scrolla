import { useEffect, useState, useCallback } from 'react';

export const useSessionTimer = (initialSeconds = 0, onTimeUp = null, startTime = null) => {
  const [timeRemaining, setTimeRemaining] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);

  // When initialSeconds changes and is greater than 0, auto-start
  useEffect(() => {
    if (initialSeconds > 0 && startTime) {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, initialSeconds - elapsedSeconds);
      setTimeRemaining(remaining);
      setIsActive(remaining > 0);
      if (remaining <= 0) onTimeUp?.();
    } else if (initialSeconds > 0) {
      setTimeRemaining(initialSeconds);
      setIsActive(true);
    } else {
      setTimeRemaining(0);
      setIsActive(false);
    }
  }, [initialSeconds, startTime]); // Added startTime to dependencies

  useEffect(() => {
    let interval;

    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          let newTime;
          if (startTime) {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            newTime = Math.max(0, initialSeconds - elapsed);
          } else {
            newTime = prev - 1;
          }

          if (newTime <= 0) {
            setIsActive(false);
            onTimeUp?.();
            return 0;
          }
          return newTime;
        });
      }, 1000);
    } else if (timeRemaining === 0 && isActive) {
      setIsActive(false);
      onTimeUp?.();
    }

    return () => clearInterval(interval);
  }, [isActive, timeRemaining, onTimeUp, startTime, initialSeconds]);

  const startTimer = useCallback((seconds = initialSeconds) => {
    setTimeRemaining(seconds);
    setIsActive(true);
  }, [initialSeconds]);

  const stopTimer = useCallback(() => {
    setIsActive(false);
    setTimeRemaining(0);
  }, []);

  const pauseTimer = useCallback(() => {
    setIsActive(false);
  }, []);

  const resumeTimer = useCallback(() => {
    setIsActive(true);
  }, []);

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    timeRemaining,
    isActive,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    formatTime,
  };
};
