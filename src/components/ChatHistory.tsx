import React from 'react';
import { MessageCircle, Clock, ChevronRight } from 'lucide-react';
import { useFloatChat, ChatHistory as ChatHistoryType } from '@/contexts/FloatChatContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatHistoryProps {
  className?: string;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({ className = '' }) => {
  const { state, dispatch } = useFloatChat();

  const handleLoadChat = (chatId: string) => {
    dispatch({ type: 'LOAD_CHAT', payload: chatId });
  };

  const handleCreateNewChat = () => {
    dispatch({ type: 'CREATE_NEW_CHAT' });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getExcerpt = (chat: ChatHistoryType): string => {
    const lastMessage = chat.messages[chat.messages.length - 1];
    if (!lastMessage) return 'No messages yet';
    
    const content = lastMessage.content;
    return content.length > 60 ? content.substring(0, 60) + '...' : content;
  };

  return (
    <div className={`bg-slate-800/50 border-r border-slate-600 ${className}`}>
      <div className="p-3 border-b border-slate-600">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-white flex items-center space-x-2">
            <MessageCircle className="w-4 h-4 text-[#00d1c1]" />
            <span>Chat History</span>
          </h2>
        </div>
        <Button
          onClick={handleCreateNewChat}
          className="w-full bg-[#00d1c1] hover:bg-[#00a3a3] text-slate-900 text-xs h-8"
        >
          + New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {state.chatHistory.length === 0 ? (
            <div className="text-xs text-slate-400 text-center py-8">
              No chat history yet.
              <br />
              Start a new conversation!
            </div>
          ) : (
            state.chatHistory.map((chat) => (
              <div
                key={chat.id}
                className={`group relative cursor-pointer rounded-lg border p-3 transition-all duration-200 hover:bg-slate-700/50 ${
                  state.currentChat?.id === chat.id
                    ? 'bg-slate-700/50 border-[#00d1c1]/50'
                    : 'border-slate-600 hover:border-slate-500'
                }`}
                onClick={() => handleLoadChat(chat.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-medium text-white truncate mb-1">
                      {chat.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-2">
                      {getExcerpt(chat)}
                    </p>
                    <div className="flex items-center space-x-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(chat.lastModified)}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                {chat.messages.length > 0 && (
                  <div className="absolute top-1 right-1">
                    <div className="w-2 h-2 bg-[#00d1c1] rounded-full text-xs flex items-center justify-center">
                      <span className="text-xs text-slate-900 font-bold leading-none">
                        {chat.messages.length}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
