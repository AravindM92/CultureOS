/**
 * Direct test of the corrected handleMomentDetection logic
 */

const path = require('path');

// Import the API client
const apiClientPath = path.join(__dirname, 'Culture OS', 'src', 'app', 'apiClient.js');
const ThunaiAPIClient = require(apiClientPath);

// Initialize API client  
const apiClient = new ThunaiAPIClient('http://localhost:8000/api/v1');

// Simulate the handleMomentDetection logic
async function testCorrectedMomentDetection() {
  console.log('🧪 TESTING CORRECTED MOMENT DETECTION LOGIC');
  console.log('==========================================\n');
  
  try {
    // Simulate activity and bot response
    const activity = {
      text: "Sandeep is celebrating his birthday today",
      from: {
        id: "sandeep-teams-id-123",
        name: "Test User"
      }
    };
    
    const botResponse = "🎉 That's wonderful! Happy birthday to Sandeep! I hope he has a fantastic day filled with joy and celebration. Birthdays are such special moments to celebrate another year of life and achievements. 🎂";
    
    console.log('📝 User message:', activity.text);
    console.log('🤖 Bot response:', botResponse);
    
    // Step 1: Check if bot response mentions celebration
    console.log('\n🔍 Step 1: Check if bot mentions celebration');
    const mentionsCelebration = botResponse.includes('create') || botResponse.includes('moment') || 
        botResponse.includes('birthday') || botResponse.includes('promotion') || 
        botResponse.includes('anniversary') || botResponse.includes('celebration');
    console.log('   Mentions celebration:', mentionsCelebration ? 'Yes' : 'No');
    
    if (!mentionsCelebration) {
      console.log('❌ Would exit - no celebration mentioned');
      return;
    }
    
    // Step 2: Extract celebration type
    console.log('\n🎯 Step 2: Extract celebration type');
    const botResponseLower = botResponse.toLowerCase();
    let celebrationType = 'celebration';
    
    if (botResponseLower.includes('birthday') || botResponseLower.includes('bday')) {
      celebrationType = 'birthday';
    } else if (botResponseLower.includes('promotion') || botResponseLower.includes('promoted')) {
      celebrationType = 'promotion';
    } else if (botResponseLower.includes('anniversary')) {
      celebrationType = 'work_anniversary';
    }
    
    console.log('   Celebration type:', celebrationType);
    
    // Step 3: Extract celebrant name from user input
    console.log('\n👤 Step 3: Extract celebrant name');
    let celebrantName = null;
    const userWords = activity.text.split(' ');
    for (let i = 0; i < userWords.length; i++) {
      const word = userWords[i].replace(/[^\w]/g, ''); // Remove punctuation
      // Look for capitalized words that might be names
      if (word.length > 2 && word[0].toUpperCase() === word[0] && 
          !['The', 'This', 'That', 'When', 'Where', 'What', 'Who', 'Happy', 'Birthday', 'Is', 'His', 'Her', 'Their'].includes(word)) {
        celebrantName = word;
        break;
      }
    }
    
    console.log('   Extracted name:', celebrantName);
    
    if (!celebrantName) {
      console.log('❌ Would exit - no celebrant name detected');
      return;
    }
    
    // Step 4: Find or create user
    console.log('\n🔍 Step 4: Find or create user');
    let celebrant = await apiClient.findUserByName(celebrantName);
    console.log('   User found:', celebrant ? `Yes - ${celebrant.name}` : 'No');
    
    if (!celebrant) {
      console.log('   Creating new user...');
      const userData = {
        teams_user_id: activity.from.id || `teams-${celebrantName.toLowerCase()}`,
        name: celebrantName,
        email: `${celebrantName.toLowerCase()}@company.com`,
        is_admin: false
      };
      
      celebrant = await apiClient.createUser(userData);
      console.log('   User created:', celebrant ? `Yes - ${celebrant.name}` : 'Failed');
    }
    
    // Step 5: Create moment with corrected data structure
    if (celebrant) {
      console.log('\n🎉 Step 5: Create moment');
      const momentData = {
        person_name: celebrant.name,  // Correct field name
        moment_type: celebrationType,
        moment_date: new Date().toISOString().split('T')[0], // Today's date
        description: activity.text,
        created_by: activity.from.id || 'admin_teams_id' // Valid teams_user_id
      };
      
      console.log('   Moment data:', momentData);
      const moment = await apiClient.createMoment(momentData);
      console.log('   Moment created:', moment ? `Yes - ID ${moment.id}` : 'Failed');
      
      if (moment) {
        console.log('\n✅ SUCCESS! Complete workflow working');
      } else {
        console.log('\n❌ FAILED at moment creation');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCorrectedMomentDetection().catch(console.error);