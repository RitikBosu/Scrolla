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
              className="p-10 text-center max-w-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {/* Alarm Icon */}
              <motion.div
                className="flex justify-center mb-8"
                animate={{
                  rotate: [0, -10, 10, -10, 10, 0],
                }}
                transition={{
                  duration: 0.5,
                  repeat: isOpen ? Infinity : 0,
                  repeatDelay: 0.5,
                }}
              >
                <AlarmClockIcon
                  ref={alarmRef}
                  size={64}
                  style={{
                    color: '#F7931A',
                    filter: 'drop-shadow(0 0 16px rgba(247, 147, 26, 0.8))',
                  }}
                />
              </motion.div>

              {/* Title */}
              <motion.h2
                className="text-4xl font-bold mb-3 font-heading uppercase tracking-widest"
                style={{
                  color: '#F7931A',
                  textShadow: '0 0 16px rgba(247, 147, 26, 0.8), 0 2px 8px rgba(0, 0, 0, 0.8)',
                  letterSpacing: '2px',
                }}
                animate={{
                  opacity: [1, 0.8, 1],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                }}
              >
                ⏰ TIME'S UP!
              </motion.h2>

              {/* Journey Name */}
              {journeyName && (
                <p className="mb-3 font-heading text-base font-semibold tracking-wide"
                   style={{
                     color: '#FFD600',
                     textShadow: '0 0 8px rgba(255, 214, 0, 0.6)',
                   }}>
                  {journeyName} Session Complete
                </p>
              )}

              {/* Time Spent */}
              {timeSpent && (
                <p className="mb-6 font-mono text-2xl font-bold tracking-wider"
                   style={{
                     color: '#F7931A',
                     textShadow: '0 0 12px rgba(247, 147, 26, 0.6)',
                   }}>
                  You spent {timeSpent}
                </p>
              )}

              {/* Message */}
              <p className="mb-8 text-sm leading-relaxed"
                 style={{
                   textShadow: '0 2px 4px rgba(0, 0, 0, 0.6)',
                   color: '#e0e0e0',
                 }}>
                Great job staying focused! Time to take a break or reset your intention.
              </p>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <motion.button
                  onClick={onContinue}
                  className="flex-1 px-6 py-3 border-2 bg-transparent font-heading font-bold uppercase text-xs tracking-widest transition-all rounded-full"
                  style={{
                    borderColor: '#F7931A',
                    color: '#F7931A',
                    textShadow: '0 0 8px rgba(247, 147, 26, 0.6)',
                  }}
                  whileHover={{
                    backgroundColor: 'rgba(247, 147, 26, 0.15)',
                    boxShadow: '0 0 16px rgba(247, 147, 26, 0.4)',
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  Continue
                </motion.button>

                <motion.button
                  onClick={onLogout}
                  className="flex-1 px-6 py-3 border-2 bg-transparent font-heading font-bold uppercase text-xs tracking-widest transition-all rounded-full"
                  style={{
                    borderColor: '#FFD600',
                    color: '#FFD600',
                    textShadow: '0 0 8px rgba(255, 214, 0, 0.6)',
                  }}
                  whileHover={{
                    backgroundColor: 'rgba(255, 214, 0, 0.15)',
                    boxShadow: '0 0 16px rgba(255, 214, 0, 0.4)',
                  }}
                  whileTap={{ scale: 0.98 }}
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
