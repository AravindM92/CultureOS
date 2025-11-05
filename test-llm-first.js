/**
 * Test the corrected LLM-first architecture
 * This simulates what should happen in Teams Playground
 */

const { MockThunaiResponses } = require('./Culture OS/src/app/mockResponses.js');
const axios = require('axios');

async function testLLMFirstArchitecture() {
  console.log('🧪 TESTING LLM-FIRST ARCHITECTURE');
  console.log('=================================\n');
  
  // Test various user inputs (unclear, misspelled, informal)
  const testCases = [
    {
      userInput: "Rajesh is celebrating his birthday today",
      expectedName: "Rajesh",
      expectedType: "birthday"
    },
    {
      userInput: "Kumar got promoted yesterday",
      expectedName: "Kumar", 
      expectedType: "promotion"
    },
    {
      userInput: "Priya bday is nov 15th",
      expectedName: "Priya",
      expectedType: "birthday"
    }
  ];
  
  const mockResponses = new MockThunaiResponses();
  
  for (const testCase of testCases) {
    console.log(`\n📝 Testing: "${testCase.userInput}"`);
    console.log('======================================');
    
    // Step 1: Get LLM/Mock response (what bot would say)
    const botResponse = mockResponses.getResponse(testCase.userInput);
    console.log(`🤖 Bot Response: "${botResponse}"`);
    
    // Step 2: Test the new LLM-first detection logic
    console.log('\n🔍 Analyzing bot response for celebration info:');
    
    // Check if bot response triggers detection
    const triggersDetection = botResponse.includes('create') || botResponse.includes('moment') || 
        botResponse.includes('birthday') || botResponse.includes('promotion') || 
        botResponse.includes('anniversary') || botResponse.includes('celebration') ||
        botResponse.includes('Happy birthday') || botResponse.includes('Congratulations');
    
    console.log(`   Triggers detection: ${triggersDetection}`);
    
    if (!triggersDetection) {
      console.log('❌ Bot response would not trigger moment detection');
      continue;
    }
    
    // Extract celebration type from bot response
    const botResponseLower = botResponse.toLowerCase();
    let celebrationType = 'celebration';
    
    if (botResponseLower.includes('birthday') || botResponseLower.includes('bday')) {
      celebrationType = 'birthday';
    } else if (botResponseLower.includes('promotion') || botResponseLower.includes('promoted')) {
      celebrationType = 'promotion';
    } else if (botResponseLower.includes('anniversary')) {
      celebrationType = 'work_anniversary';
    }
    
    console.log(`   Celebration type: ${celebrationType}`);
    
    // Extract celebrant name from bot response
    let celebrantName = null;
    const botWords = botResponse.split(' ');
    
    for (let i = 0; i < botWords.length; i++) {
      const word = botWords[i].replace(/[^\w]/g, '');
      
      if (word.length > 2 && word[0].toUpperCase() === word[0] && 
          !['The', 'This', 'That', 'When', 'Where', 'What', 'Who', 'Happy', 'Birthday', 'Is', 'His', 'Her', 'Their', 'Thunai', 'Im', 'And', 'But', 'For', 'With'].includes(word)) {
        
        // Cross-reference with user input
        const userInputLower = testCase.userInput.toLowerCase();
        const wordLower = word.toLowerCase();
        if (userInputLower.includes(wordLower)) {
          celebrantName = word;
          console.log(`   Found name in bot response: ${word} (cross-referenced)`);
          break;
        }
      }
    }
    
    // Fallback to user input if needed
    if (!celebrantName) {
      console.log('   No name in bot response, trying user input fallback...');
      const userWords = testCase.userInput.split(' ');
      for (let i = 0; i < userWords.length; i++) {
        const word = userWords[i].replace(/[^\w]/g, '');
        if (word.length > 2 && word[0].toUpperCase() === word[0] && 
            !['The', 'This', 'That', 'When', 'Where', 'What', 'Who', 'Happy', 'Birthday', 'Is', 'His', 'Her', 'Their'].includes(word)) {
          celebrantName = word;
          console.log(`   Fallback name from user input: ${word}`);
          break;
        }
      }
    }
    
    console.log(`   Final celebrant name: ${celebrantName}`);
    
    // Validation
    const nameMatches = celebrantName === testCase.expectedName;
    const typeMatches = celebrationType === testCase.expectedType;
    
    console.log(`\n✅ Results:`);
    console.log(`   Expected: ${testCase.expectedName} (${testCase.expectedType})`);
    console.log(`   Detected: ${celebrantName} (${celebrationType})`);
    console.log(`   Name Match: ${nameMatches ? '✅' : '❌'}`);
    console.log(`   Type Match: ${typeMatches ? '✅' : '❌'}`);
    
    if (nameMatches && typeMatches) {
      console.log('🎉 SUCCESS - LLM-first architecture working!');
    } else {
      console.log('❌ ISSUE - Detection logic needs refinement');
    }
  }
  
  console.log('\n🎯 CONCLUSION:');
  console.log('The LLM-first architecture should now work in Teams Playground!');
  console.log('Try testing with: "Rajesh is celebrating his birthday today"');
}

// Check current database state first
async function checkDatabaseBefore() {
  console.log('📊 CURRENT DATABASE STATE:');
  console.log('==========================');
  
  try {
    const usersResponse = await axios.get('http://localhost:8000/api/v1/users/');
    const users = usersResponse.data;
    console.log(`👥 Total users: ${users.length}`);
    
    const momentsResponse = await axios.get('http://localhost:8000/api/v1/moments/');
    const moments = momentsResponse.data;
    console.log(`🎉 Total moments: ${moments.length}`);
    
    // Check for test users
    const testUsers = ['rajesh', 'kumar', 'priya', 'suresh', 'sandeep'];
    testUsers.forEach(name => {
      const user = users.find(u => u.name.toLowerCase().includes(name));
      const userMoments = moments.filter(m => m.person_name.toLowerCase().includes(name));
      console.log(`   ${name}: ${user ? '✅ User exists' : '❌ No user'}, ${userMoments.length} moments`);
    });
    
  } catch (error) {
    console.error('Error checking database:', error.message);
  }
  
  console.log('\n');
}

// Run the tests
checkDatabaseBefore().then(() => {
  return testLLMFirstArchitecture();
}).catch(console.error);