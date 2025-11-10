const WFOHandler = require('./src/wfo/WFOHandler');
const { GroqChatModel } = require('./src/app/groqChatModel');
const config = require('./src/config');

console.log('=== WFO Handler Debug Test ===');
console.log('WFO Config:', JSON.stringify(config.wfo.testingMode, null, 2));

try {
  const groqModel = new GroqChatModel({
    apiKey: config.groqApiKey,
    model: config.groqModelName
  });

  console.log('GroqModel created successfully');
  
  const wfoHandler = new WFOHandler(groqModel);
  console.log('WFOHandler created successfully');
  
  // Test various keywords
  const testCases = ['Week', 'week', 'WEEK', 'weekly', 'Daily', 'tell me a joke'];
  
  testCases.forEach(testCase => {
    const result = wfoHandler.canHandle(testCase, { userId: 'test123' });
    console.log(`canHandle("${testCase}")`, result);
  });
  
} catch (error) {
  console.error('Error creating WFO handler:', error.message);
  console.error(error.stack);
}