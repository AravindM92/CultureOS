/**
 * Test LLM-first with more detailed debugging
 */

const { MockThunaiResponses } = require('./Culture OS/src/app/mockResponses.js');

async function testLLMFirstDetailed() {
  console.log('🧪 DETAILED LLM-FIRST ARCHITECTURE TEST');
  console.log('=======================================\n');
  
  const mockResponses = new MockThunaiResponses();
  const testMessage = "Rajesh is celebrating his birthday today";
  
  console.log(`📝 User Input: "${testMessage}"`);
  
  // Step 1: Get mock response
  const botResponse = mockResponses.getResponse(testMessage);
  console.log(`🤖 Bot Response: "${botResponse}"`);
  
  // Step 2: Test exact trigger logic from app.js
  console.log('\n🔍 Testing trigger conditions:');
  
  const triggers = [
    'create', 'moment', 'birthday', 'promotion', 'anniversary', 
    'celebration', 'Happy birthday', 'Congratulations'
  ];
  
  triggers.forEach(trigger => {
    const matches = botResponse.includes(trigger);
    console.log(`   "${trigger}": ${matches}`);
  });
  
  const triggersDetection = botResponse.includes('create') || botResponse.includes('moment') || 
      botResponse.includes('birthday') || botResponse.includes('promotion') || 
      botResponse.includes('anniversary') || botResponse.includes('celebration') ||
      botResponse.includes('Happy birthday') || botResponse.includes('Congratulations');
  
  console.log(`\n🎯 Overall triggers detection: ${triggersDetection}`);
  
  if (!triggersDetection) {
    console.log('❌ Bot response would not trigger moment detection');
    console.log('\n💡 SOLUTION: The bot response needs to contain celebration keywords');
    console.log('   Current response is generic achievement, not celebration-specific');
    return;
  }
  
  // Step 3: Test celebration type extraction
  console.log('\n🎯 Testing celebration type extraction:');
  const botResponseLower = botResponse.toLowerCase();
  
  const typeChecks = [
    { type: 'birthday', keywords: ['birthday', 'bday'] },
    { type: 'promotion', keywords: ['promotion', 'promoted'] },
    { type: 'work_anniversary', keywords: ['anniversary'] },
    { type: 'achievement', keywords: ['completed', 'finished'] }
  ];
  
  let celebrationType = 'celebration';
  typeChecks.forEach(check => {
    const matches = check.keywords.some(keyword => botResponseLower.includes(keyword));
    console.log(`   ${check.type}: ${matches}`);
    if (matches && celebrationType === 'celebration') {
      celebrationType = check.type;
    }
  });
  
  console.log(`   Final type: ${celebrationType}`);
  
  // Step 4: Test name extraction from bot response
  console.log('\n👤 Testing name extraction from bot response:');
  
  const botWords = botResponse.split(' ');
  let celebrantName = null;
  
  console.log('   Bot words:', botWords.slice(0, 10).join(', ') + '...');
  
  for (let i = 0; i < botWords.length; i++) {
    const word = botWords[i].replace(/[^\w]/g, '');
    
    if (word.length > 2 && word[0].toUpperCase() === word[0] && 
        !['The', 'This', 'That', 'When', 'Where', 'What', 'Who', 'Happy', 'Birthday', 'Is', 'His', 'Her', 'Their', 'Thunai', 'Im', 'And', 'But', 'For', 'With'].includes(word)) {
      
      console.log(`   Checking potential name: "${word}"`);
      
      // Cross-reference with user input
      const userInputLower = testMessage.toLowerCase();
      const wordLower = word.toLowerCase();
      if (userInputLower.includes(wordLower)) {
        celebrantName = word;
        console.log(`   ✅ Found cross-referenced name: ${word}`);
        break;
      } else {
        console.log(`   ❌ "${word}" not found in user input`);
      }
    }
  }
  
  // Step 5: Fallback to user input
  if (!celebrantName) {
    console.log('\n👤 Fallback: Testing name extraction from user input:');
    const userWords = testMessage.split(' ');
    
    for (let i = 0; i < userWords.length; i++) {
      const word = userWords[i].replace(/[^\w]/g, '');
      if (word.length > 2 && word[0].toUpperCase() === word[0] && 
          !['The', 'This', 'That', 'When', 'Where', 'What', 'Who', 'Happy', 'Birthday', 'Is', 'His', 'Her', 'Their'].includes(word)) {
        celebrantName = word;
        console.log(`   ✅ Fallback name: ${word}`);
        break;
      }
    }
  }
  
  console.log(`\n🎯 FINAL RESULTS:`);
  console.log(`   Celebrant: ${celebrantName}`);
  console.log(`   Type: ${celebrationType}`);
  console.log(`   Expected: Rajesh (birthday)`);
  
  const success = celebrantName === 'Rajesh' && celebrationType === 'birthday';
  console.log(`   Success: ${success ? '✅' : '❌'}`);
  
  if (success) {
    console.log('\n🎉 LLM-FIRST ARCHITECTURE IS WORKING!');
    console.log('The Teams Playground should now work correctly.');
  }
}

testLLMFirstDetailed().catch(console.error);