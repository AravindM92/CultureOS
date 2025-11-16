// Verify WFO data in database
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function verifyWFOData() {
    console.log("Verifying WFO data in database...");
    
    const dbPath = path.join(__dirname, '../../database/thunai_culture.db');
    
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('❌ Database connection error:', err.message);
                reject(err);
                return;
            }
            console.log('✅ Connected to database');
        });
        
        // Query WFO data for test users
        const query = `
            SELECT * FROM wfo_availability 
            WHERE user_id LIKE 'test_user%' 
            ORDER BY created_at DESC 
            LIMIT 10
        `;
        
        db.all(query, [], (err, rows) => {
            if (err) {
                console.error('❌ Query error:', err.message);
                reject(err);
                return;
            }
            
            console.log('\n📊 WFO Data in Database:');
            console.log('='.repeat(80));
            
            if (rows.length === 0) {
                console.log('❌ No WFO data found for test users');
            } else {
                rows.forEach((row, index) => {
                    console.log(`\n${index + 1}. User: ${row.user_id}`);
                    console.log(`   Week: ${row.week_start_date}`);
                    console.log(`   Mon: ${row.monday_status}, Tue: ${row.tuesday_status}, Wed: ${row.wednesday_status}`);
                    console.log(`   Thu: ${row.thursday_status}, Fri: ${row.friday_status}`);
                    console.log(`   Office Days: ${row.office_days_count}/5`);
                    console.log(`   Compliant: ${row.is_compliant ? 'Yes' : 'No'}`);
                    console.log(`   Created: ${row.created_at}`);
                });
            }
            
            console.log('\n✅ Database verification complete');
            
            db.close((err) => {
                if (err) {
                    console.error('❌ Database close error:', err.message);
                } else {
                    console.log('✅ Database connection closed');
                }
                resolve(rows);
            });
        });
    });
}

verifyWFOData().catch(console.error);