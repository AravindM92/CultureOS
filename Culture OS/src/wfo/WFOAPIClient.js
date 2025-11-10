/**
 * WFO API Client - Interface to WFO Prediction API
 * =================================================
 * 
 * Connects to the isolated WFO Prediction API (port 8001)
 * Follows the LLM-first, zero-coupling architecture
 */

const axios = require('axios');
const config = require('../config');

class WFOAPIClient {
    constructor(baseURL = config.wfo.apiUrl || 'http://localhost:8001') {
        this.baseURL = baseURL;
        
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`🏢 WFO API Client initialized: ${this.baseURL}`);
    }

    /**
     * Check if WFO API is available (same pattern as thunai-api)
     */
    async testConnection() {
        try {
            const response = await this.client.get('/health');
            return response.status === 200;
        } catch (error) {
            console.error('[WFO API] Connection failed:', error.message);
            return false;
        }
    }

    /**
     * Check if WFO data collection is needed for a user
     * This is the PRIMARY trigger endpoint
     */
    async checkWFODataNeeded(userId) {
        try {
            const response = await this.client.get(`/api/v1/availability/check/${userId}`);
            return response.data;
        } catch (error) {
            console.error('[WFO API] Check data needed failed:', error.message);
            throw error;
        }
    }

    /**
     * LLM-powered: Process any WFO response from user
     */
    async processWFOResponse(userId, message, conversationContext = {}) {
        try {
            const payload = {
                user_id: userId,
                message: message,
                context: conversationContext
            };

            const response = await this.client.post('/api/v1/availability/process', payload);
            return response.data;
        } catch (error) {
            console.error('[WFO API] Process WFO response failed:', error.message);
            throw error;
        }
    }

    /**
     * Save WFO schedule data after confirmation
     */
    async saveWFOSchedule(userId, scheduleData, confirmationType = 'manual') {
        try {
            const payload = {
                user_id: userId,
                schedule_data: scheduleData,
                confirmation_type: confirmationType,
                timestamp: new Date().toISOString()
            };

            const response = await this.client.post('/api/v1/availability/save', payload);
            return response.data;
        } catch (error) {
            console.error('[WFO API] Save WFO schedule failed:', error.message);
            throw error;
        }
    }

    /**
     * Get user's current WFO schedule
     */
    async getUserWFOSchedule(userId, weekStart = null) {
        try {
            const params = weekStart ? `?week_start=${weekStart}` : '';
            const response = await this.client.get(`/api/v1/availability/user/${userId}${params}`);
            return response.data;
        } catch (error) {
            console.error('[WFO API] Get user WFO schedule failed:', error.message);
            throw error;
        }
    }

    /**
     * Get team WFO predictions for coordination
     */
    async getTeamWFOPredictions(weekStart = null) {
        try {
            const params = weekStart ? `?week_start=${weekStart}` : '';
            const response = await this.client.get(`/api/v1/predictions/team${params}`);
            return response.data;
        } catch (error) {
            console.error('[WFO API] Get team WFO predictions failed:', error.message);
            throw error;
        }
    }

    /**
     * Log collection attempt for smart stopping logic
     */
    async logCollectionAttempt(userId, attemptType, success = false, stopReason = null) {
        try {
            const payload = {
                user_id: userId,
                attempt_type: attemptType,
                success: success,
                stop_reason: stopReason,
                timestamp: new Date().toISOString()
            };

            const response = await this.client.post('/api/v1/availability/log-attempt', payload);
            return response.data;
        } catch (error) {
            console.error('[WFO API] Log collection attempt failed:', error.message);
            throw error;
        }
    }

    /**
     * Check if user should be asked again (smart stopping logic)
     */
    async shouldAskUser(userId, interactionType = 'daily') {
        try {
            const response = await this.client.get(`/api/v1/availability/should-ask/${userId}?type=${interactionType}`);
            return response.data;
        } catch (error) {
            console.error('[WFO API] Should ask user check failed:', error.message);
            throw error;
        }
    }
}

module.exports = WFOAPIClient;