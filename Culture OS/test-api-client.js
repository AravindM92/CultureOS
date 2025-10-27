/**
 * Test Thunai API Client for Teams Bot Integration
 */

const ThunaiAPIClient = require('./src/app/apiClient');

async function testAPIClient() {
    console.log('🚀 Testing Thunai API Client for Teams Bot Integration\n');
    
    const api = new ThunaiAPIClient();
    
    try {
        // Test 1: Connection
        console.log('1. Testing API connection...');
        const connected = await api.testConnection();
        console.log(`   ${connected ? '✅' : '❌'} API Connection: ${connected ? 'SUCCESS' : 'FAILED'}\n`);
        
        if (!connected) {
            console.log('❌ API is not available. Please start the API server first.');
            return;
        }

        // Test 2: User Management
        console.log('2. Testing user management...');
        const users = await api.getAllUsers();
        console.log(`   ✅ Found ${users.length} users`);
        
        if (users.length > 0) {
            const adminCheck = await api.isAdmin('admin_teams_id');
            console.log(`   ✅ Admin check: ${adminCheck ? 'ADMIN' : 'NOT ADMIN'}`);
        }
        console.log();

        // Test 3: Moment Analysis
        console.log('3. Testing moment analysis...');
        const testTexts = [
            "John is celebrating his 5th work anniversary on November 15th",
            "Sarah is joining our team on December 1st",
            "Mike's last working day is December 20th"
        ];

        for (const text of testTexts) {
            const analysis = await api.analyzeMomentText(text);
            if (analysis) {
                console.log(`   ✅ "${text}"`);
                console.log(`      → ${analysis.category} | ${analysis.moment_type} | ${analysis.celebrant_name || 'No celebrant'}`);
            } else {
                console.log(`   ❌ Failed to analyze: "${text}"`);
            }
        }
        console.log();

        // Test 4: Moment Creation Workflow
        console.log('4. Testing moment creation workflow...');
        const momentResult = await api.processNewMoment('admin_teams_id', 'Test celebration for API integration on December 25th');
        console.log(`   ${momentResult.success ? '✅' : '❌'} Moment creation: ${momentResult.success ? 'SUCCESS' : 'FAILED'}`);
        if (momentResult.success) {
            console.log(`      → Created: ${momentResult.moment.title}`);
        } else {
            console.log(`      → Error: ${momentResult.error}`);
        }
        console.log();

        // Test 5: Notification Workflow
        console.log('5. Testing notification workflow...');
        const notifications = await api.getDailyNotifications();
        console.log(`   ✅ Found ${notifications.length} notifications for today`);
        notifications.forEach(notif => {
            console.log(`      → ${notif.title} (${notif.category})`);
        });
        console.log();

        // Test 6: Greeting Workflow
        console.log('6. Testing greeting workflow...');
        if (users.length >= 2) {
            const greetingResult = await api.addGreeting(1, 'john_teams_id', 'Test greeting from API client! 🎉');
            console.log(`   ${greetingResult ? '✅' : '❌'} Greeting creation: ${greetingResult ? 'SUCCESS' : 'FAILED'}`);
            
            const greetings = await api.getGreetingsForMoment(1);
            console.log(`   ✅ Found ${greetings.length} greetings for moment 1`);
        }
        console.log();

        console.log('🎉 API Client tests completed successfully!');
        console.log('✅ Teams bot is ready to integrate with Thunai API');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run tests
testAPIClient();