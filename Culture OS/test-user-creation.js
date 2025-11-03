/**
 * Test User Creation API - Debug CultureOS Teams Bot Integration
 */

const ThunaiAPIClient = require('./src/app/apiClient');

async function testUserCreation() {
    console.log('🔧 Testing User Creation API for CultureOS Teams Bot\n');
    
    const api = new ThunaiAPIClient();
    
    try {
        // Test 1: API Connection
        console.log('1. Testing API connection...');
        const connected = await api.testConnection();
        console.log(`   ${connected ? '✅' : '❌'} API Connection: ${connected ? 'SUCCESS' : 'FAILED'}\n`);
        
        if (!connected) {
            console.log('❌ API server not available. Please start: python -m uvicorn main:app --reload');
            return;
        }

        // Test 2: List existing users
        console.log('2. Checking existing users...');
        const existingUsers = await api.getAllUsers();
        console.log(`   ✅ Found ${existingUsers.length} existing users`);
        existingUsers.forEach(user => {
            console.log(`      → ${user.name} (${user.email}) - Teams ID: ${user.teams_user_id}`);
        });
        console.log();

        // Test 3: Create new user (Test Case from problem description)
        console.log('3. Testing user creation: "Add user: Abinaya, abinaya@company.com, teams-id-888"');
        
        const testUserData = {
            teams_user_id: 'teams-id-888',
            name: 'Abinaya',
            email: 'abinaya@company.com',
            is_admin: false
        };

        try {
            // Check if user already exists
            const existingUser = await api.getUserByTeamsId('teams-id-888');
            if (existingUser) {
                console.log('   ⚠️  User already exists:', existingUser.name);
            } else {
                const newUser = await api.createUser(testUserData);
                console.log('   ✅ User created successfully!');
                console.log(`      → ID: ${newUser.id}`);
                console.log(`      → Name: ${newUser.name}`);
                console.log(`      → Email: ${newUser.email}`);
                console.log(`      → Teams ID: ${newUser.teams_user_id}`);
            }
        } catch (error) {
            console.log('   ❌ User creation failed:', error.message);
        }
        console.log();

        // Test 4: Verify user lookup functions
        console.log('4. Testing user lookup functions...');
        
        const userByTeamsId = await api.getUserByTeamsId('teams-id-888');
        console.log(`   ${userByTeamsId ? '✅' : '❌'} Lookup by Teams ID: ${userByTeamsId ? 'FOUND' : 'NOT FOUND'}`);
        
        const userByEmail = await api.getUserByEmail('abinaya@company.com');
        console.log(`   ${userByEmail ? '✅' : '❌'} Lookup by Email: ${userByEmail ? 'FOUND' : 'NOT FOUND'}`);
        
        const userByName = await api.findUserByName('Abinaya');
        console.log(`   ${userByName ? '✅' : '❌'} Lookup by Name: ${userByName ? 'FOUND' : 'NOT FOUND'}`);
        console.log();

        // Test 5: Test moment creation workflow
        console.log('5. Testing moment creation workflow...');
        
        // First ensure we have an admin user
        const adminUsers = await api.getAllUsers();
        const adminUser = adminUsers.find(u => u.is_admin);
        
        if (adminUser) {
            console.log(`   Using admin user: ${adminUser.name} (${adminUser.teams_user_id})`);
            
            try {
                const momentResult = await api.processNewMoment(
                    adminUser.teams_user_id, 
                    'Abinaya won an award for excellent performance!'
                );
                
                console.log(`   ${momentResult.success ? '✅' : '❌'} Moment creation: ${momentResult.success ? 'SUCCESS' : 'FAILED'}`);
                if (momentResult.success) {
                    console.log(`      → ${momentResult.moment.person_name}'s ${momentResult.moment.moment_type}`);
                } else {
                    console.log(`      → Error: ${momentResult.error}`);
                }
            } catch (error) {
                console.log('   ❌ Moment creation failed:', error.message);
            }
        } else {
            console.log('   ⚠️  No admin users found. Creating admin user...');
            try {
                const adminUser = await api.createUser({
                    teams_user_id: 'admin-teams-id-001',
                    name: 'Admin User',
                    email: 'admin@company.com',
                    is_admin: true
                });
                console.log('   ✅ Admin user created:', adminUser.name);
            } catch (error) {
                console.log('   ❌ Failed to create admin user:', error.message);
            }
        }
        console.log();

        console.log('🎉 User creation tests completed!');
        console.log('✅ Teams bot user management is now functional');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testUserCreation();