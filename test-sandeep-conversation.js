/**
 * Test the actual bot conversation with Sandeep case
 */

const axios = require('axios');

async function testSandeepConversation() {
  console.log('🧪 TESTING SANDEEP CONVERSATION');
  console.log('===============================\n');
  
  // Test the exact message you would send about Sandeep
  const testMessage = "Sandeep is celebrating his birthday today";
  
  console.log(`📝 Test message: "${testMessage}"`);
  
  // Check database before
  console.log('\n📊 BEFORE - Database state:');
  try {
    const usersResponse = await axios.get('http://localhost:8000/api/v1/users/');
    const users = usersResponse.data;
    const sandeepUser = users.find(u => u.name.toLowerCase().includes('sandeep'));
    console.log(`   Sandeep user: ${sandeepUser ? sandeepUser.name : 'Not found'}`);
    
    const momentsResponse = await axios.get('http://localhost:8000/api/v1/moments/');
    const moments = momentsResponse.data;
    const sandeepMoments = moments.filter(m => m.person_name.toLowerCase().includes('sandeep'));
    console.log(`   Sandeep moments: ${sandeepMoments.length}`);
    
  } catch (error) {
    console.error('Error checking database:', error.message);
  }
  
  // Simulate what the bot should do
  console.log('\n🤖 SIMULATING BOT LOGIC:');
  console.log('1. Bot receives message and processes with LLM');
  console.log('2. LLM responds with celebration acknowledgment');
  console.log('3. handleMomentDetection should be triggered');
  console.log('4. Should extract "Sandeep" and "birthday"');
  console.log('5. Should create user if not exists');
  console.log('6. Should create birthday moment');
  
  // Wait a moment then check database after
  console.log('\n⏳ Please send the message in Teams Playground now...');
  console.log('   Message: "Sandeep is celebrating his birthday today"');
  console.log('   Then press any key to check results...');
  
  return new Promise(resolve => {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', async () => {
      process.stdin.setRawMode(false);
      
      console.log('\n📊 AFTER - Database state:');
      try {
        const usersResponse = await axios.get('http://localhost:8000/api/v1/users/');
        const users = usersResponse.data;
        const sandeepUser = users.find(u => u.name.toLowerCase().includes('sandeep'));
        console.log(`   Sandeep user: ${sandeepUser ? sandeepUser.name + ' (ID: ' + sandeepUser.id + ')' : 'Not found'}`);
        
        const momentsResponse = await axios.get('http://localhost:8000/api/v1/moments/');
        const moments = momentsResponse.data;
        const sandeepMoments = moments.filter(m => m.person_name.toLowerCase().includes('sandeep'));
        console.log(`   Sandeep moments: ${sandeepMoments.length}`);
        sandeepMoments.forEach(moment => {
          console.log(`     - ${moment.moment_type} on ${moment.moment_date}: ${moment.description}`);
        });
        
        if (sandeepUser && sandeepMoments.length > 0) {
          console.log('\n✅ SUCCESS! Bot is working correctly');
        } else if (!sandeepUser) {
          console.log('\n❌ ISSUE: Sandeep user not created');
        } else if (sandeepMoments.length === 0) {
          console.log('\n❌ ISSUE: Sandeep moment not created');
        }
        
      } catch (error) {
        console.error('Error checking database after:', error.message);
      }
      
      resolve();
    });
  });
}

testSandeepConversation().then(() => {
  console.log('\nTest completed!');
  process.exit(0);
}).catch(console.error);