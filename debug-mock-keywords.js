/**
 * Debug the mock response keyword detection
 */

const { MockThunaiResponses } = require('./Culture OS/src/app/mockResponses.js');

const mockResponses = new MockThunaiResponses();

const testMessages = [
  "Rajesh is celebrating his birthday today",
  "Kumar got promoted yesterday", 
  "Priya bday is nov 15th",
  "Happy birthday to John",
  "birthday party",
  "promotion celebration"
];

console.log('🔍 DEBUGGING MOCK RESPONSE KEYWORD DETECTION');
console.log('===========================================\n');

testMessages.forEach(message => {
  console.log(`📝 Testing: "${message}"`);
  
  // Test each category manually
  const messageLower = message.toLowerCase();
  
  // Test containsAny function with celebration keywords
  const celebrationKeywords = ['won', 'achieved', 'completed', 'finished', 'success', 'celebrate', 'victory', 'accomplishment', 'milestone', 'birthday', 'bday', 'promotion', 'promoted', 'anniversary', 'congratulations'];
  
  console.log('   Celebration keywords test:');
  const matchingKeywords = [];
  celebrationKeywords.forEach(keyword => {
    const regex = new RegExp('\\b' + keyword + '\\b', 'i');
    if (regex.test(message)) {
      matchingKeywords.push(keyword);
    }
  });
  
  console.log(`   Matching keywords: ${matchingKeywords.join(', ') || 'none'}`);
  
  // Test actual response
  const response = mockResponses.getResponse(message);
  console.log(`   Response: "${response.substring(0, 50)}..."`);
  
  // Check response type
  if (response.includes('absolutely AMAZING') || response.includes('FANTASTIC news') || response.includes('WOW! This calls')) {
    console.log('   Type: CELEBRATION ✅');
  } else if (response.includes('wonderful to meet you')) {
    console.log('   Type: GREETING ❌');
  } else {
    console.log('   Type: OTHER');
  }
  
  console.log('');
});