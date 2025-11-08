/**
 * Test Moment Analysis API - Debug name detection
 */

const ThunaiAPIClient = require('../src/app/apiClient');

async function testMomentAnalysis() {
    console.log('🔍 Testing Moment Analysis API\n');
    
    const api = new ThunaiAPIClient();
    
    const testTexts = [
        "Abinaya won an award for excellent performance!",
        "John is celebrating his 5th work anniversary",
        "Sarah is joining our team on December 1st",
        "Mike's last working day is December 20th",
        "Sandeep won an award",
        "Test User achieved a milestone"
    ];

    for (const text of testTexts) {
        console.log(`\nTesting: "${text}"`);
        try {
            const analysis = await api.analyzeMomentText(text);
            if (analysis) {
                console.log(`  ✅ Celebrant: ${analysis.celebrant_name || 'NOT DETECTED'}`);
                console.log(`  ✅ Type: ${analysis.moment_type}`);
                console.log(`  ✅ Category: ${analysis.category}`);
                console.log(`  ✅ Confidence: ${analysis.confidence}`);
                console.log(`  ✅ Date: ${analysis.celebration_date || 'NOT DETECTED'}`);
            } else {
                console.log('  ❌ Analysis failed');
            }
        } catch (error) {
            console.log(`  ❌ Error: ${error.message}`);
        }
    }
}

testMomentAnalysis();