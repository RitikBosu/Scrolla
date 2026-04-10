import { motion, AnimatePresence } from 'framer-motion';
import { AlarmClockIcon } from './AlarmClockIcon';
import { useRef, useEffect } from 'react';

const TimeUpModal = ({ isOpen, journeyName, onContinue, onLogout, timeSpent }) => {
  const alarmRef = useRef(null);

  useEffect(() => {
    if (isOpen && alarmRef.current) {
      // Auto-start alarm animation
      alarmRef.current.startAnimation?.();
      
      // Play alarm sound
      const audio = new Audio('data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==');
      audio.play().catch(() => {});
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-auto">
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onContinue}
          />

          {/* Modal */}
          <motion.div
            className="relative bg-gradient-to-b from-[#0f1115] to-[#030304] border-4 rounded-3xl"
            style={{
              borderColor: '#F7931A',
              boxShadow: '0 0 40px rgba(247, 147, 26, 0.4), inset 0 0 30px rgba(247, 147, 26, 0.1)',
            }}
            initial={{ scale: 0, opacity: 0, y: -50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 50 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 25,
            }}
          >
            <motion.div
              className="p-8 text-center max-w-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {/* Alarm Icon */}
              <motion.div
                className="flex justify-center mb-6"
                animate={{
                  y: [0, -4, 0],
                }}
                transition={{
                  duration: 0.3,
                  repeat: isOpen ? Infinity : 0,
                  repeatDelay: 1,
                }}
              >
                <AlarmClockIcon
                  ref={alarmRef}
                  size={56}
                  style={{
                    color: '#F7931A',
                  }}
                />
              </motion.div>

              {/* Title */}
              <h2 className="text-3xl font-bold mb-4"
                style={{ color: '#F7931A' }}>
                Session Complete
              </h2>

              {/* Journey Name */}
              {journeyName && (
                <p className="mb-4 text-sm font-medium"
                   style={{ color: '#9ca3af' }}>
                  {journeyName}
                </p>
              )}

              {/* Time Spent */}
              {timeSpent && (
                <div className="mb-6 p-3 rounded-lg"
                     style={{ backgroundColor: 'rgba(247, 147, 26, 0.08)', borderLeft: '3px solid #F7931A' }}>
                  <p className="font-mono text-lg font-semibold"
                     style={{ color: '#F7931A' }}>
                    {timeSpent}
                  </p>
                </div>
              )}

              {/* Message */}
              <p className="mb-8 text-sm leading-relaxed"
                 style={{ color: '#d1d5db' }}>
                Great job staying focused. Take a break and hydrate.
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <motion.button
                  onClick={onContinue}
                  className="flex-1 px-4 py-2.5 border rounded-lg font-semibold text-sm transition-all"
                  style={{
                    borderColor: '#F7931A',
                    color: '#F7931A',
                    backgroundColor: 'transparent',
                  }}
                  whileHover={{
                    backgroundColor: 'rgba(247, 147, 26, 0.1)',
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  Continue
                </motion.button>

                <motion.button
                  onClick={onLogout}
                  className="flex-1 px-4 py-2.5 border rounded-lg font-semibold text-sm transition-all"
                  style={{
                    borderColor: '#9ca3af',
                    color: '#e5e7eb',
                    backgroundColor: 'transparent',
                  }}
                  whileHover={{
                    backgroundColor: 'rgba(229, 231, 235, 0.1)',
                    borderColor: '#e5e7eb',
                    color: '#f3f4f6',
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  Logout
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export { TimeUpModal };
