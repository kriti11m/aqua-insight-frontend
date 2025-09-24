import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Upload, ChartLine, Loader2, AlertCircle, MessageCircle, Map, Trash2 } from 'lucide-react';
import { useFloatChat, EXAMPLE_FLOAT_DATA } from '@/contexts/FloatChatContext';
import { uploadFile, uploadNetCDFFile } from '@/utils/fileUpload';
import { ApiService } from '@/lib/api';
import { MapSearchMode } from '@/components/MapSearchMode';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ChatInterfaceProps {
  className?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ className = '' }) => {
  const { state, dispatch } = useFloatChat();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMapMode, setIsMapMode] = useState(false);
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

    try {
      // Use semantic search API for real queries
      const response = await ApiService.semanticQuery(userMessage);
      
      let assistantResponse;
      let floatData = null;

      if (response.success && response.data) {
        // Format the response nicely
        assistantResponse = formatSemanticResponse(response, userMessage);
        
        // Convert API response to float data format for visualization
        if (response.data.floats && response.data.floats.length > 0) {
          floatData = {
            id: `query_${Date.now()}`,
            metadata: {
              query: userMessage,
              timestamp: new Date().toISOString(),
              totalFloats: response.data.floats.length,
            },
            profiles: response.data.floats.flatMap((float) => {
              // Get chart data arrays
              const depths = response.data.charts?.depthTemp?.depth || [0, 10, 20, 50, 100, 200, 500, 1000];
              const temperatures = response.data.charts?.depthTemp?.temperature || [];
              const salinities = response.data.charts?.depthSal?.salinity || [];
              
              // Create one profile per depth point
              return depths.map((depth, index) => ({
                depth: depth,
                temperature: temperatures[index] || float.temperature || 15,
                salinity: salinities[index] || float.salinity || 35,
                timestamp: float.time || new Date().toISOString(),
                latitude: float.lat || 35,
                longitude: float.lon || -120,
              }));
            }),
          };
        }
      } else {
        // Handle API errors or failures
        assistantResponse = `⚠️ **Backend Connection Issue**\n\n${response.message}\n\nPlease ensure your backend server is running at http://localhost:8000`;
      }

      // Add assistant response
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          type: 'assistant',
          content: assistantResponse,
          floatData: floatData,
        },
      });
      
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Fallback to example data on error
      const assistantResponse = generateAssistantResponse(userMessage);
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          type: 'assistant',
          content: `⚠️ **Connection Issue**\n\nI'm having trouble connecting to the live data service. Here's some example data that might help:\n\n${assistantResponse.content}`,
          floatData: assistantResponse.floatData,
        },
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMapSearch = async (query: string, coordinates: { lat: number; lon: number; radius: number }) => {
    if (!state.currentChat || isProcessing) return;

    setIsProcessing(true);
    setIsMapMode(false); // Close map mode after search

    // Add user message showing the map search
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        type: 'user',
        content: `🗺️ **Map Search**: ${coordinates.lat.toFixed(4)}°, ${coordinates.lon.toFixed(4)}° (±${coordinates.radius} km)\n\n${query}`,
      },
    });

    try {
      // Use semantic search API with the coordinate-based query
      const response = await ApiService.semanticQuery(query);
      
      let assistantResponse;
      let floatData = null;

      if (response.success && response.data) {
        // Format the response nicely with map context
        assistantResponse = `🗺️ **Location Search Results**\n\n` +
                          `📍 **Search Area**: ${coordinates.lat.toFixed(4)}°, ${coordinates.lon.toFixed(4)}° (±${coordinates.radius} km radius)\n\n` +
                          formatSemanticResponse(response, query);
        
        // Convert API response to float data format for visualization
        if (response.data.floats && response.data.floats.length > 0) {
          floatData = {
            id: `map_search_${Date.now()}`,
            metadata: {
              query: query,
              searchType: 'map_coordinates',
              coordinates: coordinates,
              timestamp: new Date().toISOString(),
              totalFloats: response.data.floats.length,
            },
            profiles: response.data.floats.flatMap((float) => {
              // Get chart data arrays
              const depths = response.data.charts?.depthTemp?.depth || [0, 10, 20, 50, 100, 200, 500, 1000];
              const temperatures = response.data.charts?.depthTemp?.temperature || [];
              const salinities = response.data.charts?.depthSal?.salinity || [];
              
              // Create one profile per depth point
              return depths.map((depth, index) => ({
                depth: depth,
                temperature: temperatures[index] || float.temperature || 15,
                salinity: salinities[index] || float.salinity || 35,
                timestamp: float.time || new Date().toISOString(),
                latitude: float.lat || coordinates.lat,
                longitude: float.lon || coordinates.lon,
              }));
            }),
          };
        }
      } else {
        // Handle API errors or failures
        assistantResponse = `🗺️ **Map Search - No Results**\n\n` +
                          `📍 **Search Area**: ${coordinates.lat.toFixed(4)}°, ${coordinates.lon.toFixed(4)}° (±${coordinates.radius} km radius)\n\n` +
                          `⚠️ No oceanographic data found in this area. Try expanding your search radius or selecting a different location.\n\n` +
                          `${response.message || 'Please ensure your backend server is running.'}`;
      }

      // Add assistant response
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          type: 'assistant',
          content: assistantResponse,
          floatData: floatData,
        },
      });
      
    } catch (error) {
      console.error('Error processing map search:', error);
      
      // Add error message
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          type: 'assistant',
          content: `🗺️ **Map Search Error**\n\n📍 **Search Area**: ${coordinates.lat.toFixed(4)}°, ${coordinates.lon.toFixed(4)}°\n\n⚠️ **Connection Issue**\n\nI'm having trouble connecting to the data service for this location. Please check your connection and try again.`,
        },
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !state.currentChat) return;

    dispatch({ type: 'SET_UPLOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Check if it's a NetCDF file
      const isNetCDF = file.name.toLowerCase().endsWith('.nc') || 
                       file.type === 'application/x-netcdf';

      if (isNetCDF) {
        // Use the new NetCDF upload endpoint
        const result = await uploadNetCDFFile(file);
        
        // Add user message for file upload
        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            type: 'user',
            content: `📁 Uploaded NetCDF file: ${file.name}`,
            fileInfo: result.fileInfo,
          },
        });

        if (result.success && result.response) {
          try {
            // Parse the JSON response from the server
            const uploadData = JSON.parse(result.response);
            
            // Create a query describing the uploaded data for OpenAI processing
            const fileAnalysisQuery = `Analyze this oceanographic NetCDF file data: ${file.name}. 
            The file contains ${uploadData.data_extracted?.measurements?.temperature?.count || 0} temperature measurements 
            ranging from ${uploadData.data_extracted?.measurements?.temperature?.min || 'unknown'}°C to 
            ${uploadData.data_extracted?.measurements?.temperature?.max || 'unknown'}°C. 
            Location: ${uploadData.data_extracted?.location_range?.lat_min || 'unknown'}°, 
            ${uploadData.data_extracted?.location_range?.lon_min || 'unknown'}°. 
            Please provide a scientific analysis of this oceanographic data.`;

            // Process through OpenAI for formatting and analysis
            const response = await ApiService.semanticQuery(fileAnalysisQuery);
            
            let assistantResponse;
            let floatData = null;

            if (response.success && response.data) {
              // Format the response nicely with file data context
              assistantResponse = `📁 **NetCDF File Analysis: ${file.name}**\n\n` + 
                                formatSemanticResponse(response, fileAnalysisQuery);
              
              // Convert upload data to visualization format
              if (uploadData.data_extracted) {
                const extracted = uploadData.data_extracted;
                floatData = {
                  id: `upload_${Date.now()}`,
                  metadata: {
                    query: `NetCDF file upload: ${file.name}`,
                    timestamp: new Date().toISOString(),
                    totalFloats: 1,
                    fileInfo: uploadData.file_info,
                  },
                  profiles: [
                    // Create depth profiles based on the extracted data
                    {
                      depth: 0,
                      temperature: extracted.measurements?.temperature?.max || 15,
                      salinity: 35, // Default as salinity not in this file
                      timestamp: new Date().toISOString(),
                      latitude: extracted.location_range?.lat_min || 0,
                      longitude: extracted.location_range?.lon_min || 0,
                    },
                    {
                      depth: (extracted.measurements?.pressure?.max || 1000) / 2,
                      temperature: extracted.measurements?.temperature?.mean || 10,
                      salinity: 35.1,
                      timestamp: new Date().toISOString(),
                      latitude: extracted.location_range?.lat_min || 0,
                      longitude: extracted.location_range?.lon_min || 0,
                    },
                    {
                      depth: extracted.measurements?.pressure?.max || 1000,
                      temperature: extracted.measurements?.temperature?.min || 5,
                      salinity: 35.2,
                      timestamp: new Date().toISOString(),
                      latitude: extracted.location_range?.lat_min || 0,
                      longitude: extracted.location_range?.lon_min || 0,
                    }
                  ],
                };
              }
            } else {
              // Fallback to basic formatting if OpenAI processing fails
              assistantResponse = `📁 **NetCDF File Uploaded Successfully: ${file.name}**\n\n` +
                                `📊 **File Analysis:**\n` +
                                `• **Temperature Range:** ${uploadData.data_extracted?.measurements?.temperature?.min || 'N/A'}°C to ${uploadData.data_extracted?.measurements?.temperature?.max || 'N/A'}°C\n` +
                                `• **Measurements:** ${uploadData.data_extracted?.measurements?.temperature?.count || 0} temperature readings\n` +
                                `• **Location:** ${uploadData.data_extracted?.location_range?.lat_min || 'N/A'}°, ${uploadData.data_extracted?.location_range?.lon_min || 'N/A'}°\n` +
                                `• **File Size:** ${uploadData.file_info?.size || 0} bytes\n\n` +
                                `🎯 **Ready for Analysis**\n` +
                                `Click the "**Visualize**" button below to explore this data interactively!`;
            }

            // Add assistant response with processed data
            dispatch({
              type: 'ADD_MESSAGE',
              payload: {
                type: 'assistant',
                content: assistantResponse,
                floatData: floatData,
              },
            });
          } catch (parseError) {
            // If JSON parsing fails, show raw response
            dispatch({
              type: 'ADD_MESSAGE',
              payload: {
                type: 'assistant',
                content: `📁 **File Uploaded Successfully: ${file.name}**\n\n${result.response}`,
              },
            });
          }
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
      } else {
        // Use the existing file upload for CSV/JSON files
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
    // Store the data in context for dashboard access
    dispatch({ type: 'OPEN_VISUALIZATION_PANEL', payload: floatData });
    // Navigate to dashboard
    navigate('/dashboard');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    dispatch({ type: 'CLEAR_CHAT_HISTORY' });
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
        {/* Mode Toggle */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setIsMapMode(false)}
              size="sm"
              variant={!isMapMode ? "default" : "outline"}
              className={!isMapMode ? 
                "bg-[#00d1c1] hover:bg-[#00a3a3] text-slate-900" : 
                "border-slate-600 text-slate-300 hover:bg-slate-700"
              }
              disabled={isProcessing}
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              Text
            </Button>
            <Button
              onClick={() => setIsMapMode(true)}
              size="sm"
              variant={isMapMode ? "default" : "outline"}
              className={isMapMode ? 
                "bg-[#00d1c1] hover:bg-[#00a3a3] text-slate-900" : 
                "border-slate-600 text-slate-300 hover:bg-slate-700"
              }
              disabled={isProcessing}
            >
              <Map className="w-4 h-4 mr-1" />
              Map
            </Button>
          </div>
          <span className="text-xs text-slate-400">
            {isMapMode ? "Click on map to search by location" : "Type your question"}
          </span>
        </div>

        {isMapMode ? (
          /* Map Search Mode */
          <MapSearchMode
            onSearch={handleMapSearch}
            onClose={() => setIsMapMode(false)}
            isSearching={isProcessing}
          />
        ) : (
          /* Text Input Mode */
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about oceanographic data or upload a file (.csv, .json, .nc)..."
                className="min-h-[80px] resize-none bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-[#00d1c1]"
                disabled={isProcessing || state.isUploading}
              />
            </div>
            <div className="flex flex-col space-y-2">
              <Button
                onClick={handleClearHistory}
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-red-800/20 hover:border-red-500 hover:text-red-400 p-2 aspect-square"
                disabled={state.isUploading || isProcessing}
                title="Clear chat history"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-[#00d1c1] p-2 aspect-square"
                disabled={state.isUploading || isProcessing}
                title="Upload file (.csv, .json, .nc)"
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
        )}
        
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

// Helper function to format semantic search responses
const formatSemanticResponse = (response: any, query: string): string => {
  let formattedResponse = '';

  // Check if we have AI analysis available
  if (response.data?.aiAnalysis) {
    const aiAnalysis = response.data.aiAnalysis;
    
    // Main AI-generated summary
    formattedResponse += `**🌊 AI-Powered Ocean Data Analysis**\n\n`;
    formattedResponse += `${aiAnalysis.summary}\n\n`;
    
    // Detailed analysis section
    if (aiAnalysis.detailedAnalysis) {
      formattedResponse += `**📊 Detailed Scientific Analysis**\n\n`;
      formattedResponse += `${aiAnalysis.detailedAnalysis}\n\n`;
    }
    
    // Key insights
    if (aiAnalysis.dataInsights && aiAnalysis.dataInsights.length > 0) {
      formattedResponse += `**🔍 Key Data Insights**\n\n`;
      aiAnalysis.dataInsights.forEach((insight, index) => {
        formattedResponse += `${index + 1}. ${insight}\n`;
      });
      formattedResponse += '\n';
    }
    
    // Individual float summaries
    if (aiAnalysis.floatSummaries && aiAnalysis.floatSummaries.length > 0) {
      formattedResponse += `**📍 Individual Float Analysis**\n\n`;
      
      aiAnalysis.floatSummaries.slice(0, 3).forEach((floatSummary, index) => {
        formattedResponse += `🔸 **Float ${floatSummary.floatId}**\n`;
        formattedResponse += `   📍 **Location**: ${floatSummary.location}\n`;
        formattedResponse += `   📅 **Date**: ${floatSummary.dateRange}\n`;
        formattedResponse += `   🔬 **Data Quality**: ${floatSummary.dataQuality}\n`;
        formattedResponse += `   🎯 **Scientific Significance**: ${floatSummary.scientificSignificance}\n`;
        
        if (floatSummary.keyFindings && floatSummary.keyFindings.length > 0) {
          formattedResponse += `   📋 **Key Findings**:\n`;
          floatSummary.keyFindings.forEach(finding => {
            formattedResponse += `      • ${finding}\n`;
          });
        }
        formattedResponse += '\n';
      });
      
      if (aiAnalysis.floatSummaries.length > 3) {
        formattedResponse += `... and ${aiAnalysis.floatSummaries.length - 3} more floats analyzed\n\n`;
      }
    }
    
    // Research recommendations
    if (aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0) {
      formattedResponse += `**🚀 Research Recommendations**\n\n`;
      aiAnalysis.recommendations.forEach((recommendation, index) => {
        formattedResponse += `${index + 1}. ${recommendation}\n`;
      });
      formattedResponse += '\n';
    }
    
    // Visualization call-to-action
    formattedResponse += `**🎯 Ready for Deep Dive Analysis?**\n\n`;
    formattedResponse += `Click the "**Visualize**" button below to explore:\n`;
    formattedResponse += `🗺️ **Interactive Maps** - Float locations and oceanographic regions\n`;
    formattedResponse += `📈 **Scientific Charts** - Temperature, salinity, and depth profiles\n`;
    formattedResponse += `📊 **Data Tables** - Detailed measurements and export options\n`;
    formattedResponse += `🔬 **Comparative Analysis** - Regional and temporal patterns`;
    
  } else {
    // Fallback to basic formatting if no AI analysis
    if (response.data?.summary) {
      formattedResponse += `**🌊 Ocean Data Analysis Results**\n\n${response.data.summary}\n\n`;
    } else if (response.message) {
      formattedResponse += `**🌊 Vector Search Results**\n\n${response.message}\n\n`;
    }

    // Add basic float data details if available
    if (response.data?.floats && response.data.floats.length > 0) {
      const floats = response.data.floats;
      const rawResults = response.data.rawResults || [];
      
      formattedResponse += `**📍 Found ${floats.length} float(s) matching: "${query}"**\n\n`;
      
      // Show details for first few floats
      const displayCount = Math.min(3, floats.length);
      for (let i = 0; i < displayCount; i++) {
        const float = floats[i];
        const rawResult = rawResults[i];
        
        formattedResponse += `🔸 **Float ${float.id}**\n`;
        formattedResponse += `   📍 Location: ${Math.abs(float.lat).toFixed(2)}°${float.lat >= 0 ? 'N' : 'S'}, ${Math.abs(float.lon).toFixed(2)}°${float.lon >= 0 ? 'E' : 'W'}\n`;
        formattedResponse += `   📅 Date: ${float.time ? new Date(float.time).toLocaleDateString() : 'N/A'}\n`;
        
        if (float.temperature !== undefined) {
          formattedResponse += `   🌡️ Mean Temperature: ${float.temperature.toFixed(1)}°C\n`;
        }
        if (float.salinity !== undefined) {
          formattedResponse += `   🧂 Mean Salinity: ${float.salinity.toFixed(2)} PSU\n`;
        }
        if (float.depth !== undefined) {
          formattedResponse += `   📏 Mean Depth: ${float.depth.toFixed(0)} dbar\n`;
        }
        
        if (rawResult?.similarity_score) {
          formattedResponse += `   🎯 Relevance: ${(rawResult.similarity_score * 100).toFixed(1)}%\n`;
        }
        
        formattedResponse += '\n';
      }

      if (floats.length > displayCount) {
        formattedResponse += `... and ${floats.length - displayCount} more floats\n\n`;
      }

      formattedResponse += `🎯 **Want to visualize this data?** Click the "**Visualize**" button below!`;
    }
  }

  return formattedResponse;
};
