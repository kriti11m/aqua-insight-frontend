import React, { useState, useRef, useEffect } from 'react';
import { Send, Upload, ChartLine, Loader2, AlertCircle, MessageCircle } from 'lucide-react';
import { useFloatChat, EXAMPLE_FLOAT_DATA } from '@/contexts/FloatChatContext';
import { uploadFile } from '@/utils/fileUpload';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ChatInterfaceProps {
  className?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ className = '' }) => {
  const { state, dispatch } = useFloatChat();
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [state.currentChat?.messages]);

  // Create a new chat if none exists
  useEffect(() => {
    if (!state.currentChat && state.isOpen) {
      dispatch({ type: 'CREATE_NEW_CHAT' });
    }
  }, [state.isOpen, state.currentChat, dispatch]);

  const handleSendMessage = async () => {
    if (!input.trim() || !state.currentChat || isProcessing) return;

    const userMessage = input.trim();
    setInput('');
    setIsProcessing(true);

    // Add user message
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        type: 'user',
        content: userMessage,
      },
    });

    // Simulate assistant response with example data
    setTimeout(() => {
      const assistantResponse = generateAssistantResponse(userMessage);
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          type: 'assistant',
          content: assistantResponse.content,
          floatData: assistantResponse.floatData,
        },
      });
      setIsProcessing(false);
    }, 1000 + Math.random() * 2000);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !state.currentChat) return;

    dispatch({ type: 'SET_UPLOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const result = await uploadFile(file);
      
      // Add user message for file upload
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          type: 'user',
          content: `📁 Uploaded file: ${file.name}`,
          fileInfo: result.fileInfo,
        },
      });

      if (result.success && result.data && result.preview) {
        // Add assistant response with parsed data
        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            type: 'assistant',
            content: result.preview,
            floatData: result.data,
          },
        });
      } else {
        // Add error message
        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            type: 'assistant',
            content: `❌ **Upload Error**\n\n${result.error}`,
          },
        });
      }
    } catch (error) {
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          type: 'assistant',
          content: `❌ **Upload Error**\n\nFailed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      });
    } finally {
      dispatch({ type: 'SET_UPLOADING', payload: false });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleVisualize = (floatData: any) => {
    dispatch({ type: 'OPEN_VISUALIZATION_PANEL', payload: floatData });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const generateAssistantResponse = (userMessage: string) => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return {
        content: `Hello! I'm your oceanographic data assistant. I can help you analyze Argo float data, including temperature and salinity profiles. 

How can I assist you today? You can:
- Upload CSV or JSON files with oceanographic data
- Ask questions about temperature and salinity profiles
- Request data visualizations
- Get information about specific ocean regions`,
        floatData: null,
      };
    }
    
    if (lowerMessage.includes('example') || lowerMessage.includes('sample') || lowerMessage.includes('demo')) {
      return {
        content: `Here's a sample Argo float dataset from the Pacific Ocean. This float has collected ${EXAMPLE_FLOAT_DATA.profiles.length} profiles showing the relationship between depth, temperature, and salinity.

**Key observations:**
- Temperature decreases with depth (thermocline effect)
- Salinity varies with depth and water masses
- Data spans depths from surface to 1000m

You can visualize this data using the "Visualize" button below.`,
        floatData: EXAMPLE_FLOAT_DATA,
      };
    }
    
    if (lowerMessage.includes('temperature') || lowerMessage.includes('thermal')) {
      return {
        content: `I'll show you some interesting temperature profile data. Ocean temperature typically decreases with depth due to solar heating at the surface and cooler deep waters.

Here's a dataset that demonstrates typical ocean thermal structure:`,
        floatData: EXAMPLE_FLOAT_DATA,
      };
    }
    
    if (lowerMessage.includes('salinity')) {
      return {
        content: `Salinity is a crucial oceanographic parameter that affects water density and circulation. Here's a profile showing how salinity varies with depth:`,
        floatData: EXAMPLE_FLOAT_DATA,
      };
    }
    
    return {
      content: `I understand you're asking about "${userMessage}". Let me provide you with some relevant oceanographic data that might help answer your question.

Here's a sample dataset that demonstrates typical ocean profile characteristics:`,
      floatData: EXAMPLE_FLOAT_DATA,
    };
  };

  const renderMessage = (message: any, index: number) => {
    const isUser = message.type === 'user';
    const hasFloatData = message.floatData && Object.keys(message.floatData).length > 0;

    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div
          className={`max-w-[80%] rounded-lg px-4 py-3 ${
            isUser
              ? 'bg-slate-700 text-white'
              : 'bg-slate-800/70 text-slate-100 border border-slate-600'
          }`}
        >
          <div className="text-sm whitespace-pre-wrap">
            {message.content.split('\n').map((line: string, lineIndex: number) => {
              // Handle markdown-style formatting
              if (line.startsWith('**') && line.endsWith('**')) {
                return (
                  <div key={lineIndex} className="font-semibold text-[#00d1c1] mb-2">
                    {line.slice(2, -2)}
                  </div>
                );
              }
              if (line.startsWith('- **') && line.includes(':**')) {
                const parts = line.split(':**');
                return (
                  <div key={lineIndex} className="mb-1">
                    <span className="font-medium text-[#00d1c1]">{parts[0].slice(4)}: </span>
                    <span>{parts[1]}</span>
                  </div>
                );
              }
              return (
                <div key={lineIndex} className={line ? 'mb-1' : 'mb-2'}>
                  {line}
                </div>
              );
            })}
          </div>
          
          {message.fileInfo && (
            <div className="mt-2 text-xs text-slate-400 border-t border-slate-600 pt-2">
              📁 {message.fileInfo.name} ({(message.fileInfo.size / 1024).toFixed(1)} KB)
            </div>
          )}

          <div className="text-xs text-slate-500 mt-2">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>

          {/* Visualize button for assistant messages with float data */}
          {!isUser && hasFloatData && (
            <div className="mt-3">
              <Button
                onClick={() => handleVisualize(message.floatData)}
                size="sm"
                className="bg-[#00d1c1] hover:bg-[#00a3a3] text-slate-900 text-xs h-7 px-3"
              >
                <ChartLine className="w-3 h-3 mr-1" />
                Visualize
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!state.currentChat) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center text-slate-400">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No chat selected</p>
          <p className="text-sm">Create a new chat to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        {state.currentChat.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-center">
            <div>
              <ChartLine className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">Welcome to FloatChat</h3>
              <p className="text-sm mb-4">Your AI assistant for oceanographic data analysis</p>
              <div className="text-xs space-y-1">
                <p>• Upload CSV/JSON files with ocean data</p>
                <p>• Ask about temperature and salinity profiles</p>
                <p>• Visualize Argo float measurements</p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {state.currentChat.messages.map(renderMessage)}
            {isProcessing && (
              <div className="flex justify-start mb-4">
                <div className="bg-slate-800/70 text-slate-100 border border-slate-600 rounded-lg px-4 py-3 max-w-[80%]">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#00d1c1]" />
                    <span className="text-sm">Analyzing data...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Error Display */}
      {state.error && (
        <div className="p-4 border-t border-slate-600">
          <Alert variant="destructive" className="bg-red-900/20 border-red-600">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-slate-600 bg-slate-800/50">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about oceanographic data or upload a file..."
              className="min-h-[80px] resize-none bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-[#00d1c1]"
              disabled={isProcessing || state.isUploading}
            />
          </div>
          <div className="flex flex-col space-y-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              size="sm"
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-[#00d1c1] p-2 aspect-square"
              disabled={state.isUploading || isProcessing}
              title="Upload file"
            >
              {state.isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
            </Button>
            <Button
              onClick={handleSendMessage}
              size="sm"
              className="bg-[#00d1c1] hover:bg-[#00a3a3] text-slate-900 p-2 aspect-square"
              disabled={!input.trim() || isProcessing || state.isUploading}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.json,.nc,application/json,text/csv,application/x-netcdf"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </div>
  );
};
