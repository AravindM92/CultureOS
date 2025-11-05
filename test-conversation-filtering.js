const { MockThunaiResponses } = require('./Culture OS/src/app/mockResponses');
const mockResponses = new MockThunaiResponses();

console.log('🧪 TESTING CONVERSATION FILTERING');
console.log('=================================');

// Test casual conversations that should NOT trigger moment detection
const casualTests = [
  "tell me a joke",
  "how are you?", 
  "what's the weather?",
  "help me with my work"
];

console.log('\n🚫 TESTING CASUAL CONVERSATIONS (should NOT trigger moments):');
console.log('------------------------------------------------------------');

casualTests.forEach(input => {
  const mockResponse = mockResponses.getResponse(input);
  console.log(`\n📝 Input: "${input}"`);
  console.log(`🤖 Mock Response: "${mockResponse}"`);
  
  // Check if this would trigger celebration detection
  const celebrationIndicators = [
    'birthday', 'bday', 'born',
    'promotion', 'promoted', 'new role',
    'anniversary', 'years with', 'years at',
    'achievement', 'accomplished', 'completed project',
    'Happy birthday', 'Congratulations on',
    'create moment', 'create a moment', 'moment for'
  ];
  
  const hasCelebrationIndicator = celebrationIndicators.some(indicator => 
    mockResponse.toLowerCase().includes(indicator.toLowerCase())
  );
  
  if (hasCelebrationIndicator) {
    console.log(`❌ PROBLEM: This would trigger moment detection!`);
  } else {
    console.log(`✅ GOOD: This will NOT trigger moment detection`);
  }
});

// Test celebration conversations that SHOULD trigger moment detection
const celebrationTests = [
  "Arun is celebrating his birthday today",
  "Kumar got promoted",
  "Priya's bday is tomorrow"
];

console.log('\n\n✅ TESTING CELEBRATION CONVERSATIONS (should trigger moments):');
console.log('--------------------------------------------------------------');

celebrationTests.forEach(input => {
  const mockResponse = mockResponses.getResponse(input);
  console.log(`\n📝 Input: "${input}"`);
  console.log(`🤖 Mock Response: "${mockResponse}"`);
  
  const celebrationIndicators = [
    'birthday', 'bday', 'born',
    'promotion', 'promoted', 'new role',
    'anniversary', 'years with', 'years at',
    'achievement', 'accomplished', 'completed project',
    'Happy birthday', 'Congratulations on',
    'create moment', 'create a moment', 'moment for'
  ];
  
  const hasCelebrationIndicator = celebrationIndicators.some(indicator => 
    mockResponse.toLowerCase().includes(indicator.toLowerCase())
  );
  
  if (hasCelebrationIndicator) {
    console.log(`✅ GOOD: This will trigger moment detection`);
  } else {
    console.log(`❌ PROBLEM: This will NOT trigger moment detection!`);
  }
});

console.log('\n🎯 FILTERING TEST COMPLETE');