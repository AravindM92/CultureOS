/**
 * Test the mock response logic specifically
 */

const { MockThunaiResponses } = require('./Culture OS/src/app/mockResponses.js');

const mockResponses = new MockThunaiResponses();

console.log('🧪 TESTING MOCK RESPONSE LOGIC');
console.log('==============================\n');

const testMessage = "Suresh is celebrating his birthday today";
console.log(`📝 Test message: "${testMessage}"`);
console.log(`📝 Message lowercase: "${testMessage.toLowerCase()}"`);

// Test each condition manually
const message = testMessage.toLowerCase();

console.log('\n🔍 Testing each condition:');

// Greetings
const greetingKeywords = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'greetings'];
const hasGreeting = greetingKeywords.some(keyword => message.includes(keyword));
console.log(`1. Greetings (${greetingKeywords.join(', ')}): ${hasGreeting}`);

// Celebration 
const celebrationKeywords = ['won', 'achieved', 'completed', 'finished', 'success', 'celebrate', 'victory', 'accomplishment', 'milestone', 'birthday', 'bday', 'promotion', 'promoted', 'anniversary', 'congratulations'];
const hasCelebration = celebrationKeywords.some(keyword => message.includes(keyword));
console.log(`2. Celebration (${celebrationKeywords.join(', ')}): ${hasCelebration}`);

// Find which celebration keywords match
const matchingCelebrationKeywords = celebrationKeywords.filter(keyword => message.includes(keyword));
console.log(`   Matching celebration keywords: ${matchingCelebrationKeywords.join(', ')}`);

// Test the actual mock response
console.log('\n🤖 Actual mock response:');
const actualResponse = mockResponses.getResponse(testMessage);
console.log(`Response: "${actualResponse}"`);

// Test multiple messages
console.log('\n📋 Testing various birthday messages:');
const testMessages = [
  "Suresh is celebrating his birthday today",
  "Happy birthday to Suresh!",
  "It's Suresh's birthday",
  "Suresh birthday celebration",
  "birthday party for Suresh"
];

testMessages.forEach(msg => {
  const response = mockResponses.getResponse(msg);
  const isGreeting = response.includes("wonderful to meet you") || response.includes("Hello there");
  const isCelebration = response.includes("absolutely AMAZING") || response.includes("WOW! This calls");
  console.log(`"${msg}" -> ${isGreeting ? 'GREETING' : isCelebration ? 'CELEBRATION' : 'OTHER'}`);
});