import { Settings } from 'lucide-react';
import { Button } from './ui/button';
import { motion } from 'motion/react';
import { useState } from 'react';

export function Header() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <header className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-zinc-800 bg-[#0f0f0f]">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
          <span className="text-xs sm:text-sm">ψ</span>
        </div>
        <h1 className="text-lg sm:text-xl">Psyche AI</h1>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3">
        <Button variant="ghost" className="text-zinc-300 hover:text-white text-sm sm:text-base px-3 sm:px-4">
          Login
        </Button>
        <Button className="bg-purple-600 hover:bg-purple-700 text-sm sm:text-base px-3 sm:px-4">
          Register
        </Button>
        <motion.div
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          className="cursor-pointer"
        >
          <motion.div
            animate={{
              rotateY: isHovered ? 360 : 0,
              rotateZ: isHovered ? 15 : 0,
            }}
            transition={{
              duration: 0.6,
              ease: "easeInOut"
            }}
            style={{
              transformStyle: "preserve-3d",
            }}
          >
            <Settings 
              className="w-6 h-6 text-zinc-400 hover:text-white transition-colors" 
              style={{
                filter: isHovered ? 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.6))' : 'none',
              }}
            />
          </motion.div>
        </motion.div>
      </div>
    </header>
  );
}
