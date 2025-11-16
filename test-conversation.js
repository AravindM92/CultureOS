/**
 * Simple test to verify conversation recognition works
 */

// Test the simple pattern matching logic
function testWFOPatternMatching() {
    console.log('Testing WFO Pattern Matching...\n');
    
    const testMessages = [
        'week',
        'monday and wednesday',
        'mon to wed',
        'tuesday-friday',
        'working from home',
        'office monday tuesday'
    ];
    
    testMessages.forEach(message => {
        console.log(`Input: "${message}"`);
        
        const messageLower = message.toLowerCase().trim();
        
        // Test WFO trigger
        if (messageLower === 'week') {
            console.log('  → Triggers WFO conversation');
        } else {
            // Test office day extraction
            const officedays = [];
            const dayPatterns = {
                'monday': ['monday', 'mon'],
                'tuesday': ['tuesday', 'tue', 'tues'],
                'wednesday': ['wednesday', 'wed'],
                'thursday': ['thursday', 'thu', 'thurs'],
                'friday': ['friday', 'fri']
            };
            
            for (const [day, patterns] of Object.entries(dayPatterns)) {
                for (const pattern of patterns) {
                    if (messageLower.includes(pattern)) {
                        officedays.push(day.charAt(0).toUpperCase() + day.slice(1));
                        break;
                    }
                }
            }
            
            if (officedays.length > 0) {
                console.log(`  → Office days: ${officedays.join(', ')}`);
            } else {
                console.log('  → No office days detected');
            }
        }
        console.log('');
    });
}

// Test moment detection pattern
function testMomentDetection() {
    console.log('Testing Moment Detection...\n');
    
    const testMessages = [
        "It's John's birthday today",
        "Sarah got promoted yesterday",
        "Happy anniversary to Mike",
        "Just regular conversation"
    ];
    
    testMessages.forEach(message => {
        console.log(`Input: "${message}"`);
        
        // Simple moment detection patterns
        const momentKeywords = ['birthday', 'promotion', 'promoted', 'anniversary', 'celebration'];
        const hasKeyword = momentKeywords.some(keyword => 
            message.toLowerCase().includes(keyword)
        );
        
        if (hasKeyword) {
            console.log('  → Potential moment detected');
        } else {
            console.log('  → No moment detected');
        }
        console.log('');
    });
}

console.log('=== CultureOS Conversation Recognition Test ===\n');
testWFOPatternMatching();
testMomentDetection();
console.log('Test completed. If patterns work here, the bot should work too.');