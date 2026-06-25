import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/loading.css';

export default function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setVisible(false);
            setTimeout(onComplete, 600);
          }, 300);
          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 80);
    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="loading-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          <div className="loading-bg-orbs">
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />
          </div>

          <motion.div
            className="loading-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="loading-logo">
              <div className="logo-icon">
                <div className="logo-ring" />
                <div className="logo-inner">
                  <span className="logo-letter">C</span>
                </div>
              </div>
              <div className="logo-text-wrap">
                <span className="logo-name">Clix</span>
                <span className="logo-sub">Digital Works</span>
              </div>
            </div>

            <div className="loading-tagline">
              Innovate • Create • Connect • Grow
            </div>

            <div className="loading-bar-wrap">
              <motion.div
                className="loading-bar-fill"
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ ease: 'easeOut' }}
              />
            </div>

            <div className="loading-percent">{Math.min(Math.floor(progress), 100)}%</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
