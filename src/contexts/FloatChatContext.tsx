import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types
export interface FloatProfile {
  depth: number;
  temperature: number;
  salinity: number;
  timestamp: string;
  latitude: number;
  longitude: number;
}

export interface FloatData {
  id: string;
  name: string;
  profiles: FloatProfile[];
  metadata?: {
    deployment_date?: string;
    platform_id?: string;
    wmo_id?: string;
  };
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  floatData?: FloatData;
  fileInfo?: {
    name: string;
    size: number;
    type: string;
  };
}

export interface ChatHistory {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  lastModified: string;
}

export interface FloatChatState {
  isOpen: boolean;
  currentChat: ChatHistory | null;
  chatHistory: ChatHistory[];
  isVisualizationPanelOpen: boolean;
  selectedFloatData: FloatData | null;
  isUploading: boolean;
  error: string | null;
}

// Actions
type FloatChatAction =
  | { type: 'TOGGLE_CHAT' }
  | { type: 'OPEN_CHAT' }
  | { type: 'CLOSE_CHAT' }
  | { type: 'CREATE_NEW_CHAT' }
  | { type: 'LOAD_CHAT'; payload: string }
  | { type: 'ADD_MESSAGE'; payload: Omit<ChatMessage, 'id' | 'timestamp'> }
  | { type: 'TOGGLE_VISUALIZATION_PANEL' }
  | { type: 'OPEN_VISUALIZATION_PANEL'; payload: FloatData }
  | { type: 'CLOSE_VISUALIZATION_PANEL' }
  | { type: 'SET_UPLOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOAD_HISTORY_FROM_STORAGE'; payload: ChatHistory[] };

// Initial state
const initialState: FloatChatState = {
  isOpen: false,
  currentChat: null,
  chatHistory: [],
  isVisualizationPanelOpen: false,
  selectedFloatData: null,
  isUploading: false,
  error: null,
};

// Utility functions
const generateId = () => Math.random().toString(36).substr(2, 9);

const createNewChatHistory = (): ChatHistory => ({
  id: generateId(),
  title: 'New Chat',
  messages: [],
  createdAt: new Date().toISOString(),
  lastModified: new Date().toISOString(),
});

const updateChatTitle = (messages: ChatMessage[]): string => {
  const userMessage = messages.find(m => m.type === 'user');
  if (userMessage) {
    return userMessage.content.slice(0, 50) + (userMessage.content.length > 50 ? '...' : '');
  }
  return 'New Chat';
};

// Reducer
const floatChatReducer = (state: FloatChatState, action: FloatChatAction): FloatChatState => {
  switch (action.type) {
    case 'TOGGLE_CHAT':
      return { ...state, isOpen: !state.isOpen };
    
    case 'OPEN_CHAT':
      return { ...state, isOpen: true };
    
    case 'CLOSE_CHAT':
      return { 
        ...state, 
        isOpen: false, 
        isVisualizationPanelOpen: false,
        error: null 
      };
    
    case 'CREATE_NEW_CHAT': {
      const newChat = createNewChatHistory();
      return {
        ...state,
        currentChat: newChat,
        isVisualizationPanelOpen: false,
        selectedFloatData: null,
        error: null,
      };
    }
    
    case 'LOAD_CHAT': {
      const chat = state.chatHistory.find(h => h.id === action.payload);
      return {
        ...state,
        currentChat: chat || null,
        isVisualizationPanelOpen: false,
        selectedFloatData: null,
        error: null,
      };
    }
    
    case 'ADD_MESSAGE': {
      if (!state.currentChat) return state;
      
      const newMessage: ChatMessage = {
        ...action.payload,
        id: generateId(),
        timestamp: new Date().toISOString(),
      };
      
      const updatedMessages = [...state.currentChat.messages, newMessage];
      const updatedChat: ChatHistory = {
        ...state.currentChat,
        messages: updatedMessages,
        title: state.currentChat.messages.length === 0 ? updateChatTitle(updatedMessages) : state.currentChat.title,
        lastModified: new Date().toISOString(),
      };
      
      const updatedHistory = state.chatHistory.map(h => 
        h.id === updatedChat.id ? updatedChat : h
      );
      
      if (!updatedHistory.find(h => h.id === updatedChat.id)) {
        updatedHistory.unshift(updatedChat);
      }
      
      // Save to localStorage
      localStorage.setItem('floatChatHistory', JSON.stringify(updatedHistory));
      
      return {
        ...state,
        currentChat: updatedChat,
        chatHistory: updatedHistory,
      };
    }
    
    case 'TOGGLE_VISUALIZATION_PANEL':
      return {
        ...state,
        isVisualizationPanelOpen: !state.isVisualizationPanelOpen,
      };
    
    case 'OPEN_VISUALIZATION_PANEL':
      return {
        ...state,
        isVisualizationPanelOpen: true,
        selectedFloatData: action.payload,
      };
    
    case 'CLOSE_VISUALIZATION_PANEL':
      return {
        ...state,
        isVisualizationPanelOpen: false,
        selectedFloatData: null,
      };
    
    case 'SET_UPLOADING':
      return { ...state, isUploading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'LOAD_HISTORY_FROM_STORAGE':
      return { ...state, chatHistory: action.payload };
    
    default:
      return state;
  }
};

// Context
const FloatChatContext = createContext<{
  state: FloatChatState;
  dispatch: React.Dispatch<FloatChatAction>;
} | null>(null);

// Provider
interface FloatChatProviderProps {
  children: ReactNode;
}

export const FloatChatProvider: React.FC<FloatChatProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(floatChatReducer, initialState);

  // Load chat history from localStorage on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('floatChatHistory');
      if (saved) {
        const history: ChatHistory[] = JSON.parse(saved);
        dispatch({ type: 'LOAD_HISTORY_FROM_STORAGE', payload: history });
      }
    } catch (error) {
      console.error('Failed to load chat history from localStorage:', error);
    }
  }, []);

  return (
    <FloatChatContext.Provider value={{ state, dispatch }}>
      {children}
    </FloatChatContext.Provider>
  );
};

// Hook
export const useFloatChat = () => {
  const context = useContext(FloatChatContext);
  if (!context) {
    throw new Error('useFloatChat must be used within a FloatChatProvider');
  }
  return context;
};

// Example stubbed assistant responses
export const EXAMPLE_FLOAT_DATA: FloatData = {
  id: 'float_001',
  name: 'Argo Float 5905123',
  metadata: {
    deployment_date: '2024-01-15',
    platform_id: 'ARGO_5905123',
    wmo_id: '5905123',
  },
  profiles: [
    {
      depth: 0,
      temperature: 18.5,
      salinity: 35.2,
      timestamp: '2024-09-01T00:00:00Z',
      latitude: 35.1234,
      longitude: -120.5678,
    },
    {
      depth: 10,
      temperature: 18.2,
      salinity: 35.3,
      timestamp: '2024-09-01T00:00:00Z',
      latitude: 35.1234,
      longitude: -120.5678,
    },
    {
      depth: 20,
      temperature: 17.8,
      salinity: 35.4,
      timestamp: '2024-09-01T00:00:00Z',
      latitude: 35.1234,
      longitude: -120.5678,
    },
    {
      depth: 50,
      temperature: 16.5,
      salinity: 35.6,
      timestamp: '2024-09-01T00:00:00Z',
      latitude: 35.1234,
      longitude: -120.5678,
    },
    {
      depth: 100,
      temperature: 14.2,
      salinity: 35.8,
      timestamp: '2024-09-01T00:00:00Z',
      latitude: 35.1234,
      longitude: -120.5678,
    },
    {
      depth: 200,
      temperature: 11.5,
      salinity: 36.1,
      timestamp: '2024-09-01T00:00:00Z',
      latitude: 35.1234,
      longitude: -120.5678,
    },
    {
      depth: 500,
      temperature: 8.2,
      salinity: 36.5,
      timestamp: '2024-09-01T00:00:00Z',
      latitude: 35.1234,
      longitude: -120.5678,
    },
    {
      depth: 1000,
      temperature: 4.8,
      salinity: 36.8,
      timestamp: '2024-09-01T00:00:00Z',
      latitude: 35.1234,
      longitude: -120.5678,
    },
  ],
};
