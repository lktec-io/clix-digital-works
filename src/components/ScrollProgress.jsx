import { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import '../styles/scrollprogress.css';

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      className="scroll-progress-bar"
      style={{ scaleX, transformOrigin: '0%' }}
      aria-hidden="true"
    />
  );
}
