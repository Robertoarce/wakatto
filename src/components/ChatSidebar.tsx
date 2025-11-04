import { Plus, MessageSquare, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

interface Conversation {
  id: string;
  title: string;
  timestamp: Date;
}

interface ChatSidebarProps {
  conversations: Conversation[];
  currentConversation: Conversation;
  onSelectConversation: (conversation: Conversation) => void;
  onToggleSidebar: () => void;
  isOpen: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ChatSidebar({ conversations, currentConversation, onSelectConversation, onToggleSidebar, isOpen, isCollapsed = false, onToggleCollapse }: ChatSidebarProps) {
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Burger button when sidebar is closed */}
      {!isOpen && (
        <button
          onClick={onToggleSidebar}
          className="absolute top-3 left-3 sm:top-4 sm:left-4 z-50 p-1.5 sm:p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md transition-colors"
          aria-label="Open sidebar"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      )}

      {/* Sidebar */}
      <div 
        className={`${isCollapsed ? 'w-14 sm:w-16' : 'w-56 sm:w-64'} bg-[#171717] border-r border-zinc-800 flex flex-col absolute left-0 top-0 h-full z-40 transition-all duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
      <div className="p-2 sm:p-4 space-y-2">
        <Button className={`w-full bg-zinc-800 hover:bg-zinc-700 text-white text-xs sm:text-sm ${isCollapsed ? 'justify-center px-1 sm:px-2' : 'gap-2'}`}>
          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
          {!isCollapsed && 'New Conversation'}
        </Button>
        <div className="flex gap-1">
          {onToggleCollapse && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onToggleCollapse}
              className={`${isCollapsed ? 'w-full justify-center px-1 sm:px-2' : 'flex-1'} text-zinc-400 hover:text-white text-xs sm:text-sm ${isCollapsed ? '' : 'gap-2'}`}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" /> : <PanelLeftClose className="w-3 h-3 sm:w-4 sm:h-4" />}
              {!isCollapsed && 'Collapse'}
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onToggleSidebar}
            className={`${isCollapsed ? 'w-full justify-center px-1 sm:px-2' : onToggleCollapse ? 'flex-1' : 'w-full'} text-zinc-400 hover:text-white text-xs sm:text-sm ${isCollapsed ? '' : 'gap-2'}`}
            title={isCollapsed ? 'Hide sidebar' : 'Hide sidebar'}
          >
            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            {!isCollapsed && 'Hide'}
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className={`${isCollapsed ? 'px-0.5 sm:px-1' : 'px-1 sm:px-2'} pb-2 sm:pb-4`}>
          {!isCollapsed && <div className="text-xs text-zinc-500 px-2 sm:px-3 py-1 sm:py-2">Recent</div>}
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelectConversation(conv)}
              title={isCollapsed ? conv.title : undefined}
              className={`w-full text-left ${isCollapsed ? 'px-1 sm:px-2 py-1.5 sm:py-2 justify-center' : 'px-2 sm:px-3 py-2 sm:py-3'} rounded-lg mb-1 transition-colors group ${
                currentConversation.id === conv.id
                  ? 'bg-zinc-800 text-white'
                  : 'hover:bg-zinc-800/50 text-zinc-400'
              }`}
            >
              {isCollapsed ? (
                <div className="flex justify-center">
                  <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                </div>
              ) : (
                <div className="flex items-start gap-1.5 sm:gap-2">
                  <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-xs sm:text-sm">{conv.title}</div>
                    <div className="text-[10px] sm:text-xs text-zinc-600 mt-0.5">{formatDate(conv.timestamp)}</div>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </ScrollArea>
      </div>
    </>
  );
}
