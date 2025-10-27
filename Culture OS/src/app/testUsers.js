/**
 * Teams Playground Multiple Users Configuration
 * Helper to simulate different users in Teams playground
 */

// Test user configurations for playground
const TEST_USERS = {
    admin: {
        teamsId: 'admin_teams_id',
        name: 'Admin User',
        email: 'admin@company.com',
        role: 'admin',
        description: 'Can create moments using [Moments] command'
    },
    alex: {
        teamsId: 'alex_teams_id', 
        name: 'Alex Thompson',
        email: 'alex@company.com',
        role: 'admin',
        description: 'Can create moments using [Moments] command'
    },
    john: {
        teamsId: 'john_teams_id',
        name: 'John Doe', 
        email: 'john@company.com',
        role: 'user',
        description: 'Can send greetings and participate in moments'
    },
    jane: {
        teamsId: 'jane_teams_id',
        name: 'Jane Smith',
        email: 'jane@company.com', 
        role: 'user',
        description: 'Can send greetings and participate in moments'
    },
    sarah: {
        teamsId: 'sarah_teams_id',
        name: 'Sarah Wilson',
        email: 'sarah@company.com',
        role: 'user', 
        description: 'Can send greetings and participate in moments'
    },
    mike: {
        teamsId: 'mike_teams_id',
        name: 'Mike Chen',
        email: 'mike@company.com',
        role: 'user',
        description: 'Can send greetings and participate in moments'
    }
};

// Example usage scenarios for testing
const TEST_SCENARIOS = {
    createMoment: {
        user: 'admin', // or 'alex'
        command: '[Moments] Sarah is celebrating her 2nd work anniversary on November 15, 2025',
        expectedResponse: 'Should I create this moment and notify the team tomorrow? (Yes/No)'
    },
    sendGreeting: {
        user: 'john', // any non-admin user
        command: 'I want to send a greeting for Sarah\'s anniversary',
        expectedResponse: 'What would you like to say to Sarah for her work anniversary?'
    },
    dailyNotification: {
        trigger: 'automated_daily_check',
        expectedResponse: 'Tomorrow is Sarah\'s 2nd work anniversary! Would you like to send her a greeting?'
    }
};

// Helper function to simulate different users in playground
function getTestUserContext(userKey) {
    const user = TEST_USERS[userKey];
    if (!user) {
        throw new Error(`Test user '${userKey}' not found. Available: ${Object.keys(TEST_USERS).join(', ')}`);
    }
    
    return {
        from: {
            id: user.teamsId,
            name: user.name
        },
        isAdmin: user.role === 'admin',
        testScenarios: Object.entries(TEST_SCENARIOS)
            .filter(([_, scenario]) => scenario.user === userKey || !scenario.user)
            .map(([name, scenario]) => ({ name, ...scenario }))
    };
}

module.exports = {
    TEST_USERS,
    TEST_SCENARIOS,
    getTestUserContext
};