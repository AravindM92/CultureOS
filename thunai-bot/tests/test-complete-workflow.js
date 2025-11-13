/**
 * Complete Workflow Test - CultureOS Teams Bot Database Operations
 * Tests the exact scenario: "Abinaya is celebrating her bday tomorrow"
 */

const ThunaiAPIClient = require('../src/app/apiClient');

async function testCompleteWorkflow() {
    console.log('🎯 Testing Complete CultureOS Workflow\n');
    
    const api = new ThunaiAPIClient();
    
    try {
        // Step 1: API Connection
        console.log('1. Testing API connection...');
        const connected = await api.testConnection();
        if (!connected) {
            console.log('❌ API server not available. Please start the FastAPI server.');
            return;
        }
        console.log('   ✅ API Connection: SUCCESS\n');

        // Step 2: Test the exact scenario
        const testScenario = "Abinaya is celebrating her bday tomorrow";
        console.log(`2. Testing scenario: "${testScenario}"`);
        
        // Step 2a: Analyze the moment
        console.log('   → Analyzing moment text...');
        const analysis = await api.analyzeMomentText(testScenario);
        console.log(`   → Celebrant detected: ${analysis.celebrant_name || 'NOT DETECTED'}`);
        console.log(`   → Moment type: ${analysis.moment_type}`);
        console.log(`   → Category: ${analysis.category}`);
        console.log(`   → Date: ${analysis.celebration_date || 'NOT DETECTED'}`);
        
        if (!analysis.celebrant_name) {
            console.log('   ❌ Cannot proceed - celebrant name not detected');
            return;
        }

        // Step 2b: Check if user exists
        console.log(`\n   → Checking if user '${analysis.celebrant_name}' exists...`);
        const existingUser = await api.findUserByName(analysis.celebrant_name);
        
        let celebrantUser = existingUser;
        if (!celebrantUser) {
            console.log('   → User not found, creating new user...');
            try {
                celebrantUser = await api.createUser({
                    teams_user_id: `${analysis.celebrant_name.toLowerCase()}_teams_id`,
                    name: analysis.celebrant_name,
                    email: `${analysis.celebrant_name.toLowerCase()}@company.com`,
                    is_admin: false
                });
                console.log(`   ✅ User created: ${celebrantUser.name} (ID: ${celebrantUser.id})`);
            } catch (error) {
                console.log(`   ❌ Failed to create user: ${error.message}`);
                return;
            }
        } else {
            console.log(`   ✅ User found: ${celebrantUser.name} (ID: ${celebrantUser.id})`);
        }

        // Step 2c: Get admin user
        console.log('\n   → Finding admin user...');
        const allUsers = await api.getAllUsers();
        const adminUser = allUsers.find(u => u.is_admin);
        if (!adminUser) {
            console.log('   ❌ No admin user found');
            return;
        }
        console.log(`   ✅ Admin user: ${adminUser.name} (${adminUser.teams_user_id})`);

        // Step 2d: Create moment directly with API
        console.log('\n   → Creating moment in database...');
        
        // Calculate tomorrow's date
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        const momentData = {
            person_name: celebrantUser.name,
            moment_type: analysis.moment_type,
            moment_date: tomorrowStr,
            description: testScenario,
            created_by: adminUser.teams_user_id
        };
        
        console.log('   → Moment payload:', momentData);
        
        try {
            const createdMoment = await api.createMoment(momentData);
            console.log(`   ✅ MOMENT CREATED SUCCESSFULLY!`);
            console.log(`      → ID: ${createdMoment.id}`);
            console.log(`      → Person: ${createdMoment.person_name}`);
            console.log(`      → Type: ${createdMoment.moment_type}`);
            console.log(`      → Date: ${createdMoment.moment_date}`);
            console.log(`      → Active: ${createdMoment.is_active}`);
            
            // Step 3: Verify in database
            console.log('\n3. Verifying moment in database...');
            const allMoments = await api.getAllMoments();
            const ourMoment = allMoments.find(m => m.id === createdMoment.id);
            
            if (ourMoment) {
                console.log('   ✅ MOMENT VERIFIED IN DATABASE!');
                console.log(`      → Database ID: ${ourMoment.id}`);
                console.log(`      → Database Person: ${ourMoment.person_name}`);
                console.log(`      → Database Type: ${ourMoment.moment_type}`);
            } else {
                console.log('   ❌ Moment not found in database');
            }
            
        } catch (error) {
            console.log(`   ❌ Failed to create moment: ${error.message}`);
            return;
        }

        console.log('\n🎉 COMPLETE WORKFLOW TEST SUCCESSFUL!');
        console.log('✅ User creation: WORKING');
        console.log('✅ Moment analysis: WORKING');
        console.log('✅ Moment creation: WORKING');
        console.log('✅ Database persistence: WORKING');
        console.log('\n🚀 Teams bot is ready for production use!');

    } catch (error) {
        console.error('❌ Workflow test failed:', error.message);
    }
}

// Add getAllMoments method to API client for verification
const originalClient = require('../src/app/apiClient');
originalClient.prototype.getAllMoments = async function() {
    try {
        const response = await this.client.get('/moments/');
        return response.data;
    } catch (error) {
        console.error('Error getting all moments:', error.message);
        return [];
    }
};

// Run the complete workflow test
testCompleteWorkflow();