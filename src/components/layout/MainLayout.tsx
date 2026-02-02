
import React from 'react';
import { motion } from 'framer-motion';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const MotionMain = motion.main as any;

  return (
    // Changed h-screen to h-[100dvh] for mobile browser compatibility (address bar issues)
    <div className="relative w-full h-[100dvh] bg-mystic-900 text-slate-200 overflow-hidden selection:bg-mystic-accent selection:text-mystic-900 font-sans">
      
      {/* Background Gradient & Noise Texture */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-mystic-800 via-mystic-900 to-black opacity-80" />
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/stardust.png")` }} />

      {/* Floating Particles - Adjusted sizes for mobile/desktop */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-mystic-accent/5 rounded-full blur-[80px] md:blur-[100px] animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 md:w-64 md:h-64 bg-purple-500/5 rounded-full blur-[60px] md:blur-[80px] animate-pulse-slow pointer-events-none delay-1000" />

      {/* Main Content */}
      <MotionMain 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative z-10 w-full h-full flex flex-col"
      >
        {children}
      </MotionMain>
    </div>
  );
};

export default MainLayout;