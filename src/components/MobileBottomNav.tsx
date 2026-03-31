import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Bell, MessageSquare, Settings, ScanLine } from 'lucide-react';
import { useButtonClickSound } from '@/hooks/useButtonClickSound';
import { useSoundSettings } from '@/hooks/useSoundSettings';

const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { playClickSound } = useButtonClickSound();
  const { settings, triggerHaptic } = useSoundSettings();

  const handleNavigate = (path: string) => {
    if (settings.soundEnabled) playClickSound();
    triggerHaptic();
    navigate(path);
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: Bell, label: 'Alerts', path: '/dashboard/notifications' },
    { icon: ScanLine, label: 'Attendance', path: '/dashboard/attendance', isCenter: true },
    { icon: MessageSquare, label: 'Chat', path: '/dashboard/chat' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ];

  return (
    <motion.nav 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-t border-white/5 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.5)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}
    >
      <div className="relative flex justify-around items-end max-w-lg mx-auto px-4 h-16">
        {navItems.map((item) => {
          const active = isActive(item.path);
          
          if (item.isCenter) {
            return (
              <div key={item.path} className="relative flex flex-col items-center -top-4">
                <button
                  onClick={() => handleNavigate(item.path)}
                  className="group flex flex-col items-center transition-all duration-300"
                >
                  <div className={`
                    w-14 h-14 rounded-full flex items-center justify-center 
                    transition-all duration-300 shadow-xl
                    ${active 
                      ? 'bg-blue-600 shadow-blue-600/40' 
                      : 'bg-zinc-800 shadow-black/50 group-active:scale-90'}
                  `}>
                    <item.icon className={`w-7 h-7 ${active ? 'text-white' : 'text-zinc-400'}`} />
                  </div>
                  <span className={`text-[10px] font-bold mt-2 tracking-wide uppercase transition-colors ${
                    active ? 'text-blue-500' : 'text-zinc-500'
                  }`}>
                    {item.label}
                  </span>
                </button>
              </div>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className="relative flex flex-col items-center justify-center py-3 w-14 transition-all"
            >
              <div className="relative">
                <item.icon 
                  className={`w-5 h-5 transition-all duration-300 ${
                    active ? 'text-blue-500 scale-110' : 'text-zinc-500'
                  }`} 
                />
                
                {/* Active Indicator Dot */}
                {active && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                  />
                )}
              </div>
              
              <span className={`text-[10px] mt-1 font-medium transition-colors duration-300 ${
                active ? 'text-blue-500 font-bold' : 'text-zinc-500'
              }`}>
                {item.label}
              </span>
              
              {/* Subtle active glow background */}
              {active && (
                <div className="absolute inset-0 bg-blue-500/5 blur-xl rounded-full -z-10" />
              )}
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default MobileBottomNav;
