



import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react'; // Ensure the correct import path

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Character Background Image with Blinking Effect - Centered and Larger */}

      {/* Enhanced Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Rotating gradient orbs with blue-purple theme */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-[spin_20s_linear_infinite]"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-600/15 to-indigo-600/15 rounded-full blur-3xl animate-[spin_25s_linear_infinite_reverse]"></div>
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-gradient-to-r from-indigo-500/25 to-cyan-500/25 rounded-full blur-3xl animate-[spin_15s_linear_infinite]"></div>
        
        {/* Enhanced floating animation orbs */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-2xl animate-[bounce_3s_ease-in-out_infinite] energy-glow"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-2xl animate-[bounce_4s_ease-in-out_infinite] energy-glow" style={{ animationDelay: '1s' }}></div>
        
        {/* Enhanced pulsating rings */}
        <div className="absolute top-1/3 right-1/3 w-80 h-80 border border-blue-400/20 rounded-full animate-ping"></div>
        <div className="absolute bottom-1/3 left-1/3 w-60 h-60 border border-purple-400/20 rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>
        
        {/* Enhanced moving gradient lines */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent animate-[slide-in-right_4s_ease-in-out_infinite]"></div>
          <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent animate-[slide-in-right_5s_ease-in-out_infinite]" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent animate-[slide-in-right_6s_ease-in-out_infinite]" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent animate-[slide-in-right_7s_ease-in-out_infinite]" style={{ animationDelay: '3s' }}></div>
        </div>
        
        {/* Enhanced diagonal moving lines */}
        <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-blue-400/25 to-transparent animate-[slide-down_8s_ease-in-out_infinite]"></div>
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-purple-400/25 to-transparent animate-[slide-down_9s_ease-in-out_infinite]" style={{ animationDelay: '2s' }}></div>
        
        {/* Enhanced floating particles with increased quantity and faster movement */}
        {Array.from({ length: 120 }, (_, i) => (
          <div
            key={i}
            className={`absolute rounded-full ${
              i % 5 === 0 ? 'w-2 h-2 bg-blue-400/50 floating-particles-fast' : 
              i % 5 === 1 ? 'w-1 h-1 bg-purple-400/50 floating-particles' : 
              i % 5 === 2 ? 'w-3 h-3 bg-cyan-400/40 floating-particles-medium' : 
              i % 5 === 3 ? 'w-1.5 h-1.5 bg-indigo-400/45 floating-particles-fast' :
              'w-2.5 h-2.5 bg-pink-400/35 floating-particles'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          ></div>
        ))}
        
        {/* Enhanced morphing shapes with movement */}
        <div className="absolute top-20 right-20 w-20 h-20 bg-gradient-to-r from-blue-500/15 to-purple-500/15 rounded-full animate-morph energy-glow"></div>
        <div className="absolute bottom-20 left-20 w-16 h-16 bg-gradient-to-r from-purple-500/15 to-cyan-500/15 rounded-lg animate-morph energy-glow" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 rounded-full animate-morph energy-glow" style={{ animationDelay: '3s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-18 h-18 bg-gradient-to-r from-indigo-500/15 to-pink-500/15 rounded-lg animate-morph energy-glow" style={{ animationDelay: '4.5s' }}></div>
        
        {/* Additional energy effects */}
        <div className="absolute top-1/2 left-10 w-4 h-4 bg-blue-400/60 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-1/3 right-10 w-3 h-3 bg-purple-400/60 rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute bottom-1/4 left-1/2 w-5 h-5 bg-cyan-400/60 rounded-full animate-ping" style={{ animationDelay: '2.5s' }}></div>
      </div>
      
      {/* MAIN CONTENT */}
      <div className="w-full max-w-2xl mx-auto space-y-12 relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Logo/Header */}
        <div
          className="flex justify-center items-center text-4xl sm:text-5xl font-extrabold tracking-wide bg-gradient-to-r from-orange-500 via-pink-500 to-blue-500 text-transparent bg-clip-text animate-scale-in"
          style={{ fontFamily: "'Nixmat', sans-serif" }}
        >
          ThryLos
        </div>

        {/* 404 BLOCK — styled like the screenshot */}
        <div className="text-center space-y-8 animate-scale-in">
          {/* 404 Number */}
          <h1
            className="text-5xl sm:text-6xl md:text-7xl font-black text-white"
            style={{ fontFamily: "'Nixmat', sans-serif" }}
          >
            404
          </h1>

          {/* Message */}
            <p
            className="text-xl sm:text-2xl text-gray-200 font-medium px-4 opacity-60"
            >
            You got eliminated before reaching this page
            </p>

          {/* Button */}
          <div className="pt-2">
            <Button
              onClick={() => navigate('/')}
              className="px-8 py-3 text-lg rounded-md border border-blue-500 text-white bg-transparent hover:bg-blue-500 hover:text-white transition-colors duration-300"
            >
              Return to BattleField
            </Button>
          </div>
        </div>

        {/* Footer with animation */}

        <div className="text-center text-gray-400 text-sm animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
            <span className="text-lg text-white font-normal" style={{ fontFamily: 'taberna' }}>
              A
            </span>
            <span
              className="text-lg font-extrabold tracking-wide bg-gradient-to-r from-orange-500 via-pink-500 to-blue-500 text-transparent bg-clip-text"
              style={{ fontFamily: "'Merlin', cursive" }}
            >
              misterutsav
            </span>
            <span className="text-lg text-white font-normal" style={{ fontFamily: 'taberna' }}>
              PRODUCT
            </span>
            <Heart className="h-4 w-4 text-red-500 fill-red-500 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
