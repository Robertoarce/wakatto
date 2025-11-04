import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Box, Sphere, Cone } from '@react-three/drei';
import { Vector3, MathUtils } from 'three';
import { motion, AnimatePresence } from 'motion/react';
import { EyeOff, Network, Maximize2 } from 'lucide-react';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ThreeJSCharactersProps {
  messages: Message[];
  onToggleVisualization?: () => void;
  onToggleGraph?: () => void;
  showGraph?: boolean;
  focusMode?: boolean;
  onToggleFocusMode?: () => void;
}

interface CharacterProps {
  position: [number, number, number];
  name: string;
  color: string;
  isSpeaking: boolean;
  isSelected: boolean;
  onClick: () => void;
  focusMode: boolean;
}

function Character({ position, name, color, isSpeaking, isSelected, onClick, focusMode }: CharacterProps) {
  const groupRef = useRef<any>(null);
  const bodyRef = useRef<any>(null);
  const spotLightRef = useRef<any>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      // Animate position and scale based on selection
      const targetScale = isSelected ? 1.3 : (focusMode ? 0.8 : 0.9);
      const targetZ = isSelected ? 1.5 : (focusMode ? -1 : 0);
      
      groupRef.current.scale.lerp(
        new Vector3(targetScale, targetScale, targetScale),
        0.1
      );
      
      const currentPos = groupRef.current.position;
      currentPos.z = MathUtils.lerp(currentPos.z, position[2] + targetZ, 0.1);
      
      if (!focusMode) {
        groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      }
    }
    
    if (bodyRef.current && isSpeaking) {
      bodyRef.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.05;
    }
    
    if (spotLightRef.current) {
      spotLightRef.current.intensity = MathUtils.lerp(
        spotLightRef.current.intensity,
        isSelected ? 2 : 0,
        0.1
      );
    }
  });

  return (
    <group 
      ref={groupRef} 
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'default';
      }}
    >
      {/* Spotlight for selected character */}
      <spotLight
        ref={spotLightRef}
        position={[0, 3, 2]}
        angle={0.5}
        penumbra={0.5}
        intensity={0}
        color={color}
        castShadow
      />
      
      {/* Body */}
      <Box ref={bodyRef} args={[0.6, 1, 0.4]} position={[0, 0, 0]} castShadow receiveShadow>
        <meshStandardMaterial 
          color={color} 
          emissive={isSpeaking || isSelected ? color : '#000'} 
          emissiveIntensity={isSelected ? 0.4 : (isSpeaking ? 0.5 : 0)}
          opacity={isSelected || focusMode === false ? 1 : 0.4}
          transparent
        />
      </Box>
      
      {/* Head */}
      <Sphere args={[0.35, 32, 32]} position={[0, 0.8, 0]} castShadow receiveShadow>
        <meshStandardMaterial 
          color={color} 
          emissive={isSpeaking || isSelected ? color : '#000'} 
          emissiveIntensity={isSelected ? 0.3 : (isSpeaking ? 0.3 : 0)}
          opacity={isSelected || focusMode === false ? 1 : 0.4}
          transparent
        />
      </Sphere>
      
      {/* Beard indicator (cone pointing down) for Freud */}
      {name === 'Freud' && (
        <Cone args={[0.15, 0.3, 8]} position={[0, 0.4, 0.3]} rotation={[Math.PI, 0, 0]}>
          <meshStandardMaterial 
            color="#4a4a4a" 
            opacity={isSelected || focusMode === false ? 1 : 0.4}
            transparent
          />
        </Cone>
      )}
      
      {/* Glasses indicator for Jung */}
      {name === 'Jung' && (
        <>
          <Sphere args={[0.12, 16, 16]} position={[-0.15, 0.85, 0.3]}>
            <meshStandardMaterial 
              color="#ffffff" 
              opacity={isSelected || focusMode === false ? 0.3 : 0.15} 
              transparent 
            />
          </Sphere>
          <Sphere args={[0.12, 16, 16]} position={[0.15, 0.85, 0.3]}>
            <meshStandardMaterial 
              color="#ffffff" 
              opacity={isSelected || focusMode === false ? 0.3 : 0.15} 
              transparent 
            />
          </Sphere>
        </>
      )}
      
      {/* Name label */}
      <Text
        position={[0, -0.8, 0]}
        fontSize={0.25}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {name}
      </Text>
      
      {/* Speaking indicator */}
      {isSpeaking && (
        <>
          <Sphere args={[0.1, 16, 16]} position={[-0.5, 1.2, 0]}>
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
          </Sphere>
          <Sphere args={[0.08, 16, 16]} position={[-0.7, 1.3, 0]}>
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
          </Sphere>
          <Sphere args={[0.06, 16, 16]} position={[-0.85, 1.4, 0]}>
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
          </Sphere>
        </>
      )}
    </group>
  );
}

function CharactersScene({ 
  currentSpeaker, 
  selectedCharacter, 
  onSelectCharacter,
  focusMode 
}: { 
  currentSpeaker: string; 
  selectedCharacter: string | null;
  onSelectCharacter: (name: string) => void;
  focusMode: boolean;
}) {
  const characters = focusMode 
    ? [
        { name: 'Adler', position: [-5.5, 2.2, 0] as [number, number, number], color: '#ef4444' },
        { name: 'Jung', position: [-5.5, 0, 0] as [number, number, number], color: '#3b82f6' },
        { name: 'Freud', position: [-5.5, -2.2, 0] as [number, number, number], color: '#a855f7' },
      ]
    : [
        { name: 'Adler', position: [-2.5, 0, 0] as [number, number, number], color: '#ef4444' },
        { name: 'Jung', position: [0, 0, 0] as [number, number, number], color: '#3b82f6' },
        { name: 'Freud', position: [2.5, 0, 0] as [number, number, number], color: '#a855f7' },
      ];

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[5, 5, 5]} intensity={1} />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color="#a855f7" />
      <spotLight position={[0, 5, 0]} intensity={0.8} angle={0.6} penumbra={1} />
      
      {characters.map((char) => (
        <Character
          key={char.name}
          {...char}
          isSpeaking={currentSpeaker === char.name}
          isSelected={selectedCharacter === char.name}
          onClick={() => onSelectCharacter(char.name)}
          focusMode={focusMode}
        />
      ))}
      
      <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
    </>
  );
}

const conversations = [
  { speaker: 'Adler', text: 'The fundamental human drive is the striving for superiority and overcoming feelings of inferiority.' },
  { speaker: 'Jung', text: 'But we must also consider the collective unconscious and the archetypes that unite all humanity.' },
  { speaker: 'Freud', text: 'Gentlemen, let us not forget the primacy of unconscious drives, particularly the libido.' },
  { speaker: 'Adler', text: 'Sigmund, you reduce everything to sexuality. What about social interest and community feeling?' },
  { speaker: 'Jung', text: 'I agree with Alfred. The spiritual dimension cannot be ignored in understanding the psyche.' },
];

export function ThreeJSCharacters({ 
  messages, 
  onToggleVisualization, 
  onToggleGraph, 
  showGraph,
  focusMode = false,
  onToggleFocusMode
}: ThreeJSCharactersProps) {
  const [currentConversation, setCurrentConversation] = useState(0);
  const [currentSpeaker, setCurrentSpeaker] = useState('Jung');
  const [isHovered, setIsHovered] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [buttonsUsed, setButtonsUsed] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentConversation((prev) => {
        const next = (prev + 1) % conversations.length;
        setCurrentSpeaker(conversations[next].speaker);
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="w-full h-full relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence>
        {(isHovered || buttonsUsed) && onToggleVisualization && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10"
          >
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setButtonsUsed(true);
                onToggleVisualization();
              }}
              className="gap-1 sm:gap-2 text-zinc-400 hover:text-white bg-black/50 backdrop-blur-sm text-xs sm:text-sm px-2 sm:px-3"
            >
              <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Hide Visualization</span>
              <span className="sm:hidden">Hide</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Exit Focus Mode button - bottom right */}
      {onToggleFocusMode && focusMode && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 z-10"
          >
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setButtonsUsed(true);
                onToggleFocusMode();
              }}
              className="gap-1 sm:gap-2 text-zinc-400 hover:text-white bg-black/50 backdrop-blur-sm text-xs sm:text-sm px-2 sm:px-3"
            >
              <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Exit Focus</span>
              <span className="sm:hidden">Exit</span>
            </Button>
          </motion.div>
        </AnimatePresence>
      )}
      
      {/* Focus Mode button - show when not in focus mode on hover */}
      {onToggleFocusMode && !focusMode && (isHovered || buttonsUsed) && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 z-10"
          >
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setButtonsUsed(true);
                onToggleFocusMode();
              }}
              className="gap-1 sm:gap-2 text-zinc-400 hover:text-white bg-black/50 backdrop-blur-sm text-xs sm:text-sm px-2 sm:px-3"
            >
              <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Focus Mode</span>
              <span className="sm:hidden">Focus</span>
            </Button>
          </motion.div>
        </AnimatePresence>
      )}
      
      {/* Graph toggle button - bottom left */}
      {onToggleGraph && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={onToggleGraph}
                className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 z-10 text-zinc-400 hover:text-white bg-black/50 backdrop-blur-sm h-8 w-8 sm:h-10 sm:w-10"
              >
                <Network className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="text-xs sm:text-sm">{showGraph ? 'Hide Relations' : 'Show Relations'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {/* Character dialogue in focus mode */}
      {focusMode && (
        <div className="absolute left-[15%] sm:left-[20%] top-0 bottom-0 flex flex-col justify-center z-10 space-y-4 sm:space-y-8 w-[75%] sm:w-[70%] px-4 sm:px-8">
          {['Adler', 'Jung', 'Freud'].map((name, index) => {
            const charConversations = conversations.filter(c => c.speaker === name);
            const isActive = currentSpeaker === name;
            const isSelected = selectedCharacter === name;
            
            return (
              <motion.div
                key={name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ 
                  opacity: 1, 
                  x: 0,
                  scale: isSelected ? 1.02 : 1
                }}
                className={`backdrop-blur-sm px-3 py-2 sm:px-5 sm:py-3 rounded-lg border-l-2 sm:border-l-4 transition-all ${
                  isSelected
                    ? 'border-yellow-400 bg-black/95 shadow-lg shadow-yellow-400/20'
                    : isActive 
                      ? 'border-purple-500 bg-black/90' 
                      : 'border-zinc-700 bg-black/70'
                }`}
              >
                <p className={`text-[10px] sm:text-xs mb-1 sm:mb-1.5 ${
                  isSelected ? 'text-yellow-400' : 'text-purple-400'
                }`}>{name}</p>
                <p className={`text-xs sm:text-sm leading-relaxed ${
                  isSelected ? 'text-white' : 'text-zinc-200'
                }`}>
                  {conversations[currentConversation].speaker === name 
                    ? conversations[currentConversation].text
                    : charConversations[0]?.text || '...'}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}
      
      {/* Normal mode dialogue */}
      {!focusMode && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentConversation}
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              scale: selectedCharacter === conversations[currentConversation].speaker ? 1.05 : 1
            }}
            exit={{ opacity: 0, y: -20 }}
            className={`absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-10 backdrop-blur-sm px-3 py-2 sm:px-4 sm:py-3 rounded-lg max-w-md w-[calc(100%-1rem)] sm:w-[90%] transition-all ${
              selectedCharacter === conversations[currentConversation].speaker
                ? 'bg-black/95 border border-yellow-400 shadow-lg shadow-yellow-400/20'
                : 'bg-black/70 border border-transparent'
            }`}
          >
            <p className={`text-[10px] sm:text-xs mb-0.5 sm:mb-1 ${
              selectedCharacter === conversations[currentConversation].speaker ? 'text-yellow-400' : 'text-purple-400'
            }`}>{conversations[currentConversation].speaker}</p>
            <p className={`text-xs sm:text-sm leading-relaxed ${
              selectedCharacter === conversations[currentConversation].speaker ? 'text-white' : 'text-zinc-200'
            }`}>{conversations[currentConversation].text}</p>
          </motion.div>
        </AnimatePresence>
      )}
      
      <Canvas camera={{ position: focusMode ? [-5.5, 0, 8] : [0, 2, 8], fov: 50 }}>
        <color attach="background" args={['#0a0a0a']} />
        <CharactersScene 
          currentSpeaker={currentSpeaker} 
          selectedCharacter={selectedCharacter}
          onSelectCharacter={setSelectedCharacter}
          focusMode={focusMode}
        />
      </Canvas>
    </div>
  );
}
