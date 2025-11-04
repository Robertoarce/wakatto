import { GraphDBVisualization } from './GraphDBVisualization';
import { ThreeJSCharacters } from './ThreeJSCharacters';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface VisualizationPanelProps {
  type: 'graph' | 'characters';
  messages: Message[];
  onToggleVisualization?: () => void;
  onToggleGraph?: () => void;
  showGraph?: boolean;
  focusMode?: boolean;
  onToggleFocusMode?: () => void;
}

export function VisualizationPanel({ type, messages, onToggleVisualization, onToggleGraph, showGraph, focusMode, onToggleFocusMode }: VisualizationPanelProps) {
  return (
    <div className="h-full bg-[#0a0a0a] relative">
      {type === 'graph' ? (
        <GraphDBVisualization messages={messages} onToggleGraph={onToggleGraph} />
      ) : (
        <ThreeJSCharacters 
          messages={messages} 
          onToggleVisualization={onToggleVisualization}
          onToggleGraph={onToggleGraph}
          showGraph={showGraph}
          focusMode={focusMode}
          onToggleFocusMode={onToggleFocusMode}
        />
      )}
    </div>
  );
}
