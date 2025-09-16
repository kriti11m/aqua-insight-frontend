# FloatChat - Oceanographic AI Assistant

A React + Tailwind UI overlay for chatting with oceanographic data. This component provides an interactive interface for uploading, analyzing, and visualizing ocean float data with AI assistance.

## 🌊 Features

- **Chat Interface**: Natural language queries about oceanographic data
- **File Upload**: Support for CSV, JSON, and NetCDF files (with parsing for CSV/JSON)
- **Data Visualization**: Interactive charts showing depth vs temperature/salinity, time series, and map views
- **Chat History**: Persistent conversation history stored in localStorage
- **Ocean Theme**: Deep navy gradient background with aqua accents
- **Accessibility**: Full keyboard navigation and screen reader support
- **Error Handling**: Graceful handling of large files and invalid data

## 🚀 Quick Start

The FloatChat is already integrated into the app. Click the "Try FloatChat" button on the homepage to open the overlay.

### Basic Usage

1. **Start a Conversation**: Click "Try FloatChat" or use the TryFloatChatButton component
2. **Ask Questions**: Type questions like "Show me temperature profiles" or "What's the salinity data?"
3. **Upload Files**: Click the + upload button to add CSV or JSON files
4. **Visualize Data**: Click the "Visualize" button on assistant responses to see charts and maps
5. **Browse History**: Use the left panel to access previous conversations

## 📁 Component Structure

```
src/
├── contexts/
│   ├── FloatChatContext.tsx          # Global state management with useReducer
│   └── __tests__/
│       └── FloatChatContext.test.tsx # Unit tests for context functionality
├── components/
│   ├── FloatChat.tsx                 # Main overlay component
│   ├── ChatInterface.tsx             # Central chat area
│   ├── ChatHistory.tsx               # Left sidebar with conversation history
│   ├── DataVisualizationPanel.tsx    # Right panel with charts and maps
│   ├── TryFloatChatButton.tsx        # Trigger button component
│   └── WaveSVG.tsx                   # Ocean wave decoration
└── utils/
    └── fileUpload.ts                 # File parsing utilities
```

## 🔧 Integration with Real Backend

Currently, the assistant responses are stubbed with example data. To connect to a real backend:

### 1. Update the Chat Interface

Replace the `generateAssistantResponse` function in `ChatInterface.tsx`:

```typescript
// Replace this function:
const generateAssistantResponse = (userMessage: string) => {
  // Current stub implementation
};

// With a real API call:
const generateAssistantResponse = async (userMessage: string) => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: userMessage,
        sessionId: state.currentChat?.id 
      }),
    });
    
    const data = await response.json();
    return {
      content: data.message,
      floatData: data.floatData || null,
    };
  } catch (error) {
    return {
      content: 'Sorry, I encountered an error processing your request.',
      floatData: null,
    };
  }
};
```

### 2. Backend API Requirements

Your backend should provide these endpoints:

#### POST `/api/chat`
```json
{
  "message": "string",
  "sessionId": "string"
}
```

Response:
```json
{
  "message": "string",
  "floatData": {
    "id": "string",
    "name": "string", 
    "profiles": [
      {
        "depth": "number",
        "temperature": "number",
        "salinity": "number",
        "timestamp": "string",
        "latitude": "number",
        "longitude": "number"
      }
    ],
    "metadata": {
      "deployment_date": "string",
      "platform_id": "string",
      "wmo_id": "string"
    }
  }
}
```

#### POST `/api/upload`
For file processing on the server side:
```json
{
  "file": "File",
  "sessionId": "string"
}
```

### 3. Real-time Updates (Optional)

For real-time responses, consider WebSocket integration:

```typescript
// In ChatInterface.tsx
useEffect(() => {
  const ws = new WebSocket('ws://localhost:8080/chat');
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        type: 'assistant',
        content: data.message,
        floatData: data.floatData,
      },
    });
  };
  
  return () => ws.close();
}, [state.currentChat?.id]);
```

### 4. Authentication (Optional)

Add user authentication to persist conversations across devices:

```typescript
// Add to FloatChatContext
interface FloatChatState {
  // ... existing state
  userId: string | null;
  isAuthenticated: boolean;
}

// Update localStorage key to include user ID
localStorage.setItem(`floatChatHistory_${userId}`, JSON.stringify(updatedHistory));
```

## 🎨 Styling Guide

The FloatChat follows a consistent ocean theme:

### Colors
- **Background**: Deep navy gradient `from-[#071421] to-[#0b2230]`
- **Cards**: Slightly lighter navy `bg-slate-800/50` with `border-slate-600`
- **Accent**: Aqua/teal `#00d1c1` for action buttons and highlights
- **Text**: White for primary text, `text-slate-400` for secondary text

### Components
- **Border Radius**: 8px for cards, rounded-full for buttons
- **Drop Shadow**: `shadow-2xl` for the main overlay
- **Animations**: Smooth transitions with 300ms duration

### Customization

To modify the theme, update these CSS custom properties:

```css
:root {
  --float-chat-bg-start: #071421;
  --float-chat-bg-end: #0b2230;
  --float-chat-accent: #00d1c1;
  --float-chat-accent-hover: #00a3a3;
}
```

## 📊 Data Format

### Expected CSV Format
```csv
depth,temperature,salinity,timestamp,latitude,longitude
0,18.5,35.2,2024-01-01T00:00:00Z,35.1234,-120.5678
10,18.2,35.3,2024-01-01T00:00:00Z,35.1234,-120.5678
```

### Expected JSON Format
```json
{
  "id": "float_001",
  "name": "Argo Float 5905123",
  "profiles": [
    {
      "depth": 0,
      "temperature": 18.5,
      "salinity": 35.2,
      "timestamp": "2024-01-01T00:00:00Z",
      "latitude": 35.1234,
      "longitude": -120.5678
    }
  ],
  "metadata": {
    "deployment_date": "2024-01-15",
    "platform_id": "ARGO_5905123",
    "wmo_id": "5905123"
  }
}
```

## 🧪 Testing

Run the included tests:

```bash
# Run basic functionality tests
npm run test

# Or test in browser console
window.floatChatTests.runAllTests()
```

### Test Coverage
- ✅ Chat state management
- ✅ Message persistence to localStorage  
- ✅ File upload validation
- ✅ CSV/JSON parsing logic
- ✅ Visualization panel functionality
- ✅ Error handling

## 🔌 Dependencies

Required packages (already included):
- `papaparse` - CSV parsing
- `react-leaflet` - Map visualization
- `recharts` - Chart components
- `lucide-react` - Icons

## 🚨 Error Handling

The FloatChat includes comprehensive error handling:

- **File Size Limits**: 50MB maximum file size
- **Invalid Formats**: Graceful fallback for unsupported files
- **Network Errors**: Retry mechanisms and user feedback
- **localStorage**: Handles corrupted data gracefully
- **Large Datasets**: Automatic truncation to 1000 profiles

## 🎯 Accessibility

- **Keyboard Navigation**: Full tab navigation support
- **Screen Readers**: Proper ARIA labels and roles
- **Color Contrast**: WCAG 2.1 AA compliant
- **Focus Management**: Clear focus indicators
- **Error Announcements**: Screen reader notifications for errors

## 📱 Responsive Design

- **Mobile**: Optimized for touch interactions
- **Tablet**: Adaptive layout for medium screens  
- **Desktop**: Full overlay experience with side panels

## 🚀 Performance

- **Lazy Loading**: Charts only render when visualization panel opens
- **Data Limits**: Automatic truncation for large datasets
- **Memory Management**: Efficient React rendering with proper keys
- **localStorage**: Debounced writes to prevent excessive I/O

## 🔮 Future Enhancements

Consider these improvements for production:

1. **Real-time Collaboration**: Multiple users in same chat
2. **Data Export**: CSV/JSON export functionality
3. **Advanced Visualizations**: 3D ocean models, animation timelines
4. **Voice Interface**: Speech-to-text for queries
5. **Offline Support**: Service worker for offline functionality
6. **Custom Themes**: User-selectable color schemes
7. **Plugin System**: Extensible visualization types

## 📄 License

This component is part of the Aqua Insight Lab project. Please refer to the main project license for usage terms.
