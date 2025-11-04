import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Sphere, Line } from '@react-three/drei';
import { X } from 'lucide-react';
import { Button } from './ui/button';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface GraphDBVisualizationProps {
  messages: Message[];
  onToggleGraph?: () => void;
}

function GraphNode({ position, label, color }: { position: [number, number, number]; label: string; color: string }) {
  const meshRef = useRef<any>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group position={position}>
      <Sphere ref={meshRef} args={[0.3, 32, 32]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </Sphere>
      <Text
        position={[0, -0.6, 0]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}

function GraphScene({ messages }: { messages: Message[] }) {
  const nodes = messages.map((msg, idx) => ({
    position: [
      Math.cos((idx / messages.length) * Math.PI * 2) * 3,
      Math.sin(idx * 0.5) * 2,
      Math.sin((idx / messages.length) * Math.PI * 2) * 3,
    ] as [number, number, number],
    label: msg.role === 'user' ? 'User' : 'AI',
    color: msg.role === 'user' ? '#a855f7' : '#3b82f6',
  }));

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#a855f7" />
      
      {nodes.map((node, idx) => (
        <GraphNode key={idx} {...node} />
      ))}
      
      {nodes.map((node, idx) => {
        if (idx < nodes.length - 1) {
          return (
            <Line
              key={`line-${idx}`}
              points={[node.position, nodes[idx + 1].position]}
              color="#444"
              lineWidth={1}
            />
          );
        }
        return null;
      })}
      
      <OrbitControls enableZoom={true} enablePan={true} />
    </>
  );
}

export function GraphDBVisualization({ messages, onToggleGraph }: GraphDBVisualizationProps) {
  return (
    <div className="w-full h-full relative">
      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10 bg-black/50 backdrop-blur-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg flex items-center justify-between gap-2 sm:gap-4 max-w-[calc(100%-1rem)] sm:max-w-none">
        <div>
          <p className="text-xs sm:text-sm text-zinc-300">Conversation Graph Database</p>
          <p className="text-[10px] sm:text-xs text-zinc-500 hidden sm:block">3D visualization of message flow</p>
        </div>
        {onToggleGraph && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleGraph}
            className="h-5 w-5 sm:h-6 sm:w-6 text-zinc-400 hover:text-white flex-shrink-0"
          >
            <X className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        )}
      </div>
      <Canvas camera={{ position: [5, 5, 5], fov: 60 }}>
        <color attach="background" args={['#0a0a0a']} />
        <GraphScene messages={messages} />
      </Canvas>
    </div>
  );
}
