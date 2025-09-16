import React from 'react';
import { MessageCircle, Waves } from 'lucide-react';
import { useFloatChat } from '@/contexts/FloatChatContext';
import { Button } from '@/components/ui/button';

interface TryFloatChatButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
}

export const TryFloatChatButton: React.FC<TryFloatChatButtonProps> = ({
  className = '',
  variant = 'default',
  size = 'default',
}) => {
  const { dispatch } = useFloatChat();

  const handleClick = () => {
    dispatch({ type: 'OPEN_CHAT' });
  };

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      className={`group relative overflow-hidden bg-gradient-to-r from-[#00d1c1] to-[#00a3a3] hover:from-[#00a3a3] hover:to-[#008080] text-slate-900 font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${className}`}
    >
      <div className="flex items-center space-x-2">
        <div className="relative">
          <MessageCircle className="w-5 h-5 transition-transform group-hover:rotate-12" />
          <Waves className="w-3 h-3 absolute -bottom-1 -right-1 text-slate-700 opacity-60" />
        </div>
        <span>Try FloatChat</span>
      </div>
      
      {/* Animated wave effect */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-700 skew-x-12" />
    </Button>
  );
};
