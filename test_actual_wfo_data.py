import asyncio
import sys
sys.path.append('.')
from app.services.wfo_availability_service import WFOAvailabilityService

async def test_actual_data():
    try:
        service = WFOAvailabilityService()
        
        print('=== Testing with actual database data ===')
        
        # Test get existing user data (we saw test_user_1 in the database)
        existing = await service.get_by_user_and_week('test_user_1', '2025-11-17')
        print(f'Existing test_user_1 data: {existing}')
        
        # Test get all data for test_user_1
        all_data = await service.get_by_user_id('test_user_1')
        print(f'All test_user_1 data: {len(all_data)} records')
        for record in all_data:
            week = record.get('week_start_date')
            office_days = record.get('office_days_count')
            print(f'  - Week {week}: {office_days} office days')
        
        # Test check data needed for existing user
        result = await service.check_data_needed('test_user_1', '2025-11-17')
        print(f'Data needed check: {result}')
        
        print('✅ WFO service test with actual data completed successfully')
        
    except Exception as e:
        import traceback
        print(f'❌ Service test failed: {e}')
        traceback.print_exc()

asyncio.run(test_actual_data())