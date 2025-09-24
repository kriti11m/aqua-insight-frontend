import React from 'react';
import { X } from 'lucide-react';
import { useFloatChat } from '@/contexts/FloatChatContext';
import { ChatHistory } from '@/components/ChatHistory';
import { ChatInterface } from '@/components/ChatInterface';
import { DataVisualizationPanel } from '@/components/DataVisualizationPanel';
import { WaveSVG } from '@/components/WaveSVG';
import { Button } from '@/components/ui/button';

export const FloatChat: React.FC = () => {
  const { state, dispatch } = useFloatChat();

  if (!state.isOpen) return null;

  const handleClose = () => {
    dispatch({ type: 'CLOSE_CHAT' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Main Chat Overlay */}
      <div className="relative bg-gradient-to-b from-[#071421] to-[#0b2230] border border-slate-600 rounded-lg shadow-2xl w-[90vw] h-[85vh] max-w-7xl flex overflow-hidden">
        {/* Wave decoration at the top */}
        <div className="absolute top-0 left-0 right-0 z-10">
          <WaveSVG />
        </div>

        {/* Header */}
        <div className="absolute top-6 left-0 right-0 z-20 flex items-center justify-between px-6">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-[#00d1c1] rounded-full animate-pulse"></div>
            <h1 className="text-xl font-bold text-white">FloatChat</h1>
            <span className="text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded">
              Oceanographic AI Assistant
            </span>
          </div>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white hover:bg-slate-700/50"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex w-full mt-16">
          {/* Left Panel - Chat History */}
          <ChatHistory className="w-80 flex-shrink-0" />

          {/* Center Panel - Chat Interface */}
          <div className="flex-1 min-w-0">
            <ChatInterface />
          </div>

          {/* Right Panel - Data Visualization (disabled - using Dashboard instead) */}
          {/* 
          {state.selectedFloatData && (
            <DataVisualizationPanel
              floatData={state.selectedFloatData}
              isOpen={state.isVisualizationPanelOpen}
              onClose={() => dispatch({ type: 'CLOSE_VISUALIZATION_PANEL' })}
            />
          )}
          */}
        </div>
      </div>
    </div>
  );
};
