/**
 * Demo Usage Examples for FloatChat
 * 
 * This file demonstrates how to use the FloatChat components
 * and test the functionality.
 */

// Example CSV data for testing uploads
export const SAMPLE_CSV_DATA = `depth,temperature,salinity,timestamp,latitude,longitude
0,18.5,35.2,2024-01-01T00:00:00Z,35.1234,-120.5678
10,18.2,35.3,2024-01-01T01:00:00Z,35.1234,-120.5678
20,17.8,35.4,2024-01-01T02:00:00Z,35.1234,-120.5678
50,16.5,35.6,2024-01-01T03:00:00Z,35.1234,-120.5678
100,14.2,35.8,2024-01-01T04:00:00Z,35.1234,-120.5678
200,11.5,36.1,2024-01-01T05:00:00Z,35.1234,-120.5678
500,8.2,36.5,2024-01-01T06:00:00Z,35.1234,-120.5678
1000,4.8,36.8,2024-01-01T07:00:00Z,35.1234,-120.5678`;

// Example JSON data for testing uploads
export const SAMPLE_JSON_DATA = {
  "id": "demo_float_001",
  "name": "Demo Argo Float",
  "metadata": {
    "deployment_date": "2024-01-01",
    "platform_id": "DEMO_001",
    "wmo_id": "12345"
  },
  "profiles": [
    {
      "depth": 0,
      "temperature": 18.5,
      "salinity": 35.2,
      "timestamp": "2024-01-01T00:00:00Z",
      "latitude": 35.1234,
      "longitude": -120.5678
    },
    {
      "depth": 10,
      "temperature": 18.2,
      "salinity": 35.3,
      "timestamp": "2024-01-01T01:00:00Z",
      "latitude": 35.1234,
      "longitude": -120.5678
    },
    {
      "depth": 20,
      "temperature": 17.8,
      "salinity": 35.4,
      "timestamp": "2024-01-01T02:00:00Z",
      "latitude": 35.1234,
      "longitude": -120.5678
    }
  ]
};

// Test function to create demo files
export const createDemoFiles = () => {
  // Create CSV blob
  const csvBlob = new Blob([SAMPLE_CSV_DATA], { type: 'text/csv' });
  const csvFile = new File([csvBlob], 'demo_float_data.csv', { type: 'text/csv' });
  
  // Create JSON blob
  const jsonBlob = new Blob([JSON.stringify(SAMPLE_JSON_DATA, null, 2)], { type: 'application/json' });
  const jsonFile = new File([jsonBlob], 'demo_float_data.json', { type: 'application/json' });
  
  return { csvFile, jsonFile };
};

// Testing chat functionality
export const testChatFunctionality = () => {
  const queries = [
    "Hello, can you help me with ocean data?",
    "Show me example data",
    "What is the temperature profile?",
    "Tell me about salinity",
    "Show me some sample float data"
  ];
  
  console.log('Test these queries in FloatChat:');
  queries.forEach((query, index) => {
    console.log(`${index + 1}. ${query}`);
  });
};

// Browser console helpers
if (typeof window !== 'undefined') {
  // Add demo functions to window for easy testing
  (window as any).floatChatDemo = {
    createDemoFiles,
    testChatFunctionality,
    sampleCSV: SAMPLE_CSV_DATA,
    sampleJSON: SAMPLE_JSON_DATA,
    
    // Quick test function
    test: () => {
      console.log('🌊 FloatChat Demo Functions Available:');
      console.log('- floatChatDemo.createDemoFiles() - Create demo CSV/JSON files');
      console.log('- floatChatDemo.testChatFunctionality() - Get test queries');
      console.log('- floatChatDemo.sampleCSV - Sample CSV data');
      console.log('- floatChatDemo.sampleJSON - Sample JSON data');
      console.log('\n🧪 Run tests with: floatChatTests.runAllTests()');
    }
  };
  
  // Auto-run on page load
  setTimeout(() => {
    console.log('🌊 FloatChat Demo Loaded! Try: floatChatDemo.test()');
  }, 1000);
}
