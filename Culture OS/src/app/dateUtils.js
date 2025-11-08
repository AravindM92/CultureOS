/**
 * Date Utility Functions for Moment Detection
 * Handles conversion of relative dates to absolute dates
 */

class DateUtils {
    /**
     * Parse relative date strings to actual dates
     * @param {string} dateString - Input like "next thursday", "this friday", "tomorrow"
     * @param {Date} referenceDate - Base date for calculations (defaults to today)
     * @returns {string} Date in YYYY-MM-DD format
     */
    static parseRelativeDate(dateString, referenceDate = new Date()) {
        const input = dateString.toLowerCase().trim();
        
        // Today is Friday, November 8, 2025
        const today = new Date(referenceDate);
        today.setHours(0, 0, 0, 0); // Reset time to start of day
        
        console.log(`Parsing date: "${input}" from reference: ${today.toDateString()}`);
        
        // Handle exact matches first
        if (input === 'today') {
            return this.formatDate(today);
        }
        
        if (input === 'tomorrow') {
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            return this.formatDate(tomorrow);
        }
        
        // Handle "this [day]" and "next [day]" patterns
        const thisPattern = /^this\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i;
        const nextPattern = /^next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i;
        
        const thisMatch = input.match(thisPattern);
        const nextMatch = input.match(nextPattern);
        
        if (thisMatch || nextMatch) {
            const dayName = (thisMatch || nextMatch)[1];
            const targetDayIndex = this.getDayIndex(dayName);
            const currentDayIndex = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
            
            console.log(`Current day: ${currentDayIndex} (${this.getDayName(currentDayIndex)}), Target day: ${targetDayIndex} (${dayName})`);
            
            let daysToAdd;
            
            if (thisMatch) {
                // "this [day]" = next occurrence within current week (including today if it matches)
                daysToAdd = (targetDayIndex - currentDayIndex + 7) % 7;
                if (daysToAdd === 0 && targetDayIndex !== currentDayIndex) {
                    daysToAdd = 7; // If same day but not today, go to next week
                }
            } else {
                // "next [day]" = next occurrence in following week
                daysToAdd = ((targetDayIndex - currentDayIndex + 7) % 7) + 7;
                if (daysToAdd === 7) {
                    daysToAdd = 7; // If same day, go exactly 7 days ahead
                }
            }
            
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + daysToAdd);
            
            console.log(`Days to add: ${daysToAdd}, Result: ${targetDate.toDateString()}`);
            return this.formatDate(targetDate);
        }
        
        // Try to parse as regular date
        try {
            const parsed = new Date(dateString);
            if (!isNaN(parsed)) {
                return this.formatDate(parsed);
            }
        } catch (error) {
            console.log(`Could not parse "${dateString}" as date`);
        }
        
        // Default to today if nothing matches
        console.log(`Defaulting to today for unparseable date: "${dateString}"`);
        return this.formatDate(today);
    }
    
    /**
     * Get day index (0-6, Sunday = 0)
     */
    static getDayIndex(dayName) {
        const days = {
            'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
            'thursday': 4, 'friday': 5, 'saturday': 6
        };
        return days[dayName.toLowerCase()] || 0;
    }
    
    /**
     * Get day name from index
     */
    static getDayName(dayIndex) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[dayIndex] || 'Unknown';
    }
    
    /**
     * Format date to YYYY-MM-DD
     */
    static formatDate(date) {
        return date.toISOString().split('T')[0];
    }
    
    /**
     * Get human-readable date format
     */
    static formatHumanDate(date) {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric', 
            month: 'long',
            day: 'numeric'
        });
    }
}

module.exports = { DateUtils };