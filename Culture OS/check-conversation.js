// Simple conversation test script
const { App } = require("@microsoft/teams.apps");
const { LocalStorage } = require("@microsoft/teams.common");
const config = require('./src/config');

console.log('=== Testing Recent Conversation ===');

// Simulate the storage system
const storage = new LocalStorage();

// List all storage keys to see conversation history
const allKeys = [];
for (let i = 0; i < 100; i++) {
  const testKey = `conversation_${i}`;
  const data = storage.get(testKey);
  if (data) {
    allKeys.push(testKey);
  }
}

console.log('Found storage keys:', allKeys);

// Try to find recent conversations
const possibleKeys = [
  'conversation_playground',
  'conversation_test',
  'conversation_local'
];

possibleKeys.forEach(key => {
  const data = storage.get(key);
  if (data) {
    console.log(`\n=== ${key} ===`);
    console.log(JSON.stringify(data, null, 2));
  }
});

// Test WFO configuration
console.log('\n=== WFO Configuration ===');
console.log('Testing Mode:', config.wfo.testingMode);
console.log('Weekly Keywords:', config.wfo.testingMode.keywords.weekly);