import { useState } from 'react';
import { Header } from './components/Header';
import { ChatSidebar } from './components/ChatSidebar';
import { ChatInterface } from './components/ChatInterface';
import { VisualizationPanel } from './components/VisualizationPanel';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from './components/ui/resizable';
import { Button } from './components/ui/button';
import { Eye } from 'lucide-react';

export default function App() {
  const [conversations, setConversations] = useState([
    { id: '1', title: 'Understanding the Unconscious Mind', timestamp: new Date('2025-11-03') },
    { id: '2', title: 'Dream Analysis Session', timestamp: new Date('2025-11-02') },
    { id: '3', title: 'Collective Unconscious Discussion', timestamp: new Date('2025-11-01') },
  ]);
  
  const [currentConversation, setCurrentConversation] = useState(conversations[0]);
  const [messages, setMessages] = useState([
    { id: '1', role: 'user', content: 'Can you help me understand Carl Jung\'s theory of archetypes?' },
    { id: '2', role: 'assistant', content: 'Of course! Jung\'s theory of archetypes suggests that there are universal, archaic patterns and images that derive from the collective unconscious. These archetypes represent fundamental human experiences and emotions.' },
  ]);
  
  const [showVisualization, setShowVisualization] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  const handleSendMessage = (content: string) => {
    const newMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content,
    };
    setMessages([...messages, newMessage]);
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: 'This is a simulated response from the psychological AI advisors.',
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen bg-[#0f0f0f] text-white">
      <Header />
      
      <div className="flex flex-1 overflow-hidden relative">
        <ChatSidebar 
          conversations={conversations}
          currentConversation={currentConversation}
          onSelectConversation={setCurrentConversation}
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
          isOpen={showSidebar}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        <div className="flex flex-col flex-1">
          {showVisualization && (
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={33} minSize={10}>
                <ResizablePanelGroup direction="horizontal">
                  {showGraph && (
                    <>
                      <ResizablePanel defaultSize={50} minSize={30}>
                        <VisualizationPanel 
                          type="graph"
                          messages={messages}
                          onToggleGraph={() => setShowGraph(false)}
                          showGraph={showGraph}
                        />
                      </ResizablePanel>
                      <ResizableHandle className="w-1 bg-zinc-800 hover:bg-zinc-700 transition-colors" />
                    </>
                  )}
                  <ResizablePanel defaultSize={showGraph ? 50 : 100} minSize={30}>
                    <VisualizationPanel 
                      type="characters"
                      messages={messages}
                      onToggleVisualization={() => setShowVisualization(!showVisualization)}
                      onToggleGraph={() => setShowGraph(!showGraph)}
                      showGraph={showGraph}
                      focusMode={focusMode}
                      onToggleFocusMode={() => setFocusMode(!focusMode)}
                    />
                  </ResizablePanel>
                </ResizablePanelGroup>
              </ResizablePanel>
              <ResizableHandle className="h-1 bg-zinc-800 hover:bg-zinc-700 transition-colors" />
              <ResizablePanel defaultSize={67} minSize={20}>
                <ChatInterface 
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  showSidebar={showSidebar}
                  onToggleSidebar={() => setShowSidebar(!showSidebar)}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          )}
          
          {!showVisualization && (
            <div className="flex-1 relative">
              <ChatInterface 
                messages={messages}
                onSendMessage={handleSendMessage}
                showSidebar={showSidebar}
                onToggleSidebar={() => setShowSidebar(!showSidebar)}
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowVisualization(true)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 text-zinc-400 hover:text-white bg-black/50 backdrop-blur-sm h-8 w-8 sm:h-10 sm:w-10"
              >
                <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
