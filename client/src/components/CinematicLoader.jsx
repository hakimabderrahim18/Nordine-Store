import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';

const CinematicLoader = ({ onComplete }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // GSAP Text Splitting and Glow Animation
    const chars = document.querySelectorAll('.loader-char');
    gsap.fromTo(chars, 
      { opacity: 0, y: 30, filter: 'blur(10px)' },
      { 
        opacity: 1, 
        y: 0, 
        filter: 'blur(0px)',
        duration: 1.2, 
        stagger: 0.08,
        ease: 'power4.out',
        onComplete: () => {
          // Glow pulse
          gsap.to('.loader-title', {
            textShadow: '0 0 20px rgba(255, 201, 60, 0.8), 0 0 40px rgba(255, 201, 60, 0.4)',
            duration: 0.8,
            yoyo: true,
            repeat: 3,
            ease: 'sine.inOut',
            onComplete: () => {
              // Fade out loader
              setVisible(false);
              setTimeout(() => {
                if (onComplete) onComplete();
              }, 600);
            }
          });
        }
      }
    );

    // Progress bar animation
    gsap.to('.loader-progress', {
      width: '100%',
      duration: 2.2,
      ease: 'power1.inOut'
    });
  }, [onComplete]);

  const titleText = "NOUNOU TELECOM";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center loader-bg overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: '-100vh', transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } }}
        >
          {/* Glowing particle circles */}
          <div className="absolute w-[600px] h-[600px] rounded-full bg-brand-primary/5 blur-[150px] animate-pulse pointer-events-none" />
          <div className="absolute w-[300px] h-[300px] rounded-full bg-brand-accent/5 blur-[100px] animate-pulse pointer-events-none" style={{ animationDelay: '1.5s' }} />

          <div className="relative flex flex-col items-center select-none">
            {/* Minimalist Tech Logo Icon */}
            <motion.div 
              className="mb-8"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            >
              <img src="/01.svg" alt="Nounou Telecom Logo" className="w-16 h-16 object-contain" />
            </motion.div>

            {/* Split text */}
            <h1 className="loader-title text-xl sm:text-3xl md:text-5xl font-black tracking-[0.2em] sm:tracking-[0.4em] text-slate-800 flex flex-wrap justify-center mb-6">
              {titleText.split("").map((char, index) => (
                <span key={index} className="loader-char inline-block">
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}
            </h1>

            <p className="text-slate-500 text-[9px] sm:text-xs tracking-[0.15em] sm:tracking-[0.3em] uppercase mb-12 opacity-80 text-center px-4">
              Matériel de Haute Technologie
            </p>

            {/* Premium Progress Bar */}
            <div className="w-48 sm:w-64 h-[2px] bg-gray-200 rounded-full overflow-hidden relative">
              <div className="loader-progress absolute left-0 top-0 bottom-0 w-0 bg-gradient-to-r from-brand-accent to-brand-primary" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CinematicLoader;
