class MomentsManager {
  constructor(storage, groqModel) {
    this.storage = storage;
    this.groqModel = groqModel;
  }

  // Parse admin moments command
  async parseAdminMoment(message, adminId) {
    const momentKeywords = ['[Moments]', '[MOMENTS]', '[moments]'];
    
    // Check if message starts with moments identifier
    if (!momentKeywords.some(keyword => message.trim().startsWith(keyword))) {
      return null;
    }

    // Extract content after the identifier
    let content = message.replace(/^\[Moments\]/i, '').trim();
    
    // Simple regex-based parsing as fallback
    const simpleParseResult = this.parseSimpleMoment(content);
    if (simpleParseResult) {
      return {
        id: this.generateId(),
        adminId,
        originalText: content,
        ...simpleParseResult,
        status: 'pending_sensitivity_check',
        createdAt: new Date().toISOString()
      };
    }

    // Use LLM to extract structured information
    const extractionPrompt = `
Parse this moment information and extract:
1. Celebrant name (who is being celebrated)
2. Event type (birthday, work anniversary, achievement, etc.)
3. Date (when it happens)
4. Description of the moment

Text: "${content}"

Respond in JSON format:
{
  "celebrant_name": "string",
  "event_type": "string", 
  "moment_date": "YYYY-MM-DD",
  "description": "string",
  "confidence": 0.95
}`;

    try {
      const response = await this.groqModel.sendChatCompletion([
        { role: 'system', content: 'You are a data extraction assistant. Always respond with valid JSON.' },
        { role: 'user', content: extractionPrompt }
      ]);

      const parsed = JSON.parse(response.content);
      
      return {
        id: this.generateId(),
        adminId,
        originalText: content,
        ...parsed,
        status: 'pending_sensitivity_check',
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error parsing moment:', error);
      return null;
    }
  }

  // Simple regex-based parsing for common formats
  parseSimpleMoment(content) {
    // Pattern: "Name is celebrating Event on Date"
    const pattern1 = /^(.+?)\s+is\s+celebrating\s+(.+?)\s+on\s+(\d{1,2}\/\d{1,2}\/\d{4})$/i;
    const match1 = content.match(pattern1);
    
    if (match1) {
      const [, name, event, date] = match1;
      return {
        celebrant_name: name.trim(),
        event_type: event.trim(),
        moment_date: this.convertDateFormat(date),
        description: content,
        confidence: 0.9
      };
    }

    // Pattern: "Name - Event - Date"
    const pattern2 = /^(.+?)\s*-\s*(.+?)\s*-\s*(\d{1,2}\/\d{1,2}\/\d{4})$/i;
    const match2 = content.match(pattern2);
    
    if (match2) {
      const [, name, event, date] = match2;
      return {
        celebrant_name: name.trim(),
        event_type: event.trim(),
        moment_date: this.convertDateFormat(date),
        description: content,
        confidence: 0.85
      };
    }

    return null;
  }

  // Convert MM/DD/YYYY to YYYY-MM-DD
  convertDateFormat(dateStr) {
    const [month, day, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Check sensitivity and grammar
  async checkSensitivityAndGrammar(momentData) {
    const checkPrompt = `
Analyze this workplace moment for:
1. Sensitivity issues (inappropriate content, privacy concerns)
2. Grammar and clarity
3. Suggest improvements if needed

Content: "${momentData.description}"
Context: This is about ${momentData.celebrant_name} - ${momentData.event_type}

Respond in JSON:
{
  "is_sensitive": false,
  "sensitivity_issues": [],
  "grammar_score": 0.95,
  "improved_text": "corrected version if needed",
  "recommendations": ["suggestion1", "suggestion2"]
}`;

    try {
      const response = await this.groqModel.sendChatCompletion([
        { role: 'system', content: 'You are a content moderation and grammar assistant.' },
        { role: 'user', content: checkPrompt }
      ]);

      return JSON.parse(response.content);
    } catch (error) {
      console.error('Error checking sensitivity:', error);
      return { is_sensitive: false, grammar_score: 0.8, improved_text: momentData.description };
    }
  }

  // Get admin approval
  async requestAdminApproval(momentData, sensitivityCheck, send) {
    const approvalMessage = `
📝 **Moment Review Required**

**Original:** ${momentData.originalText}

**Extracted Info:**
👤 **Celebrant:** ${momentData.celebrant_name}
🎉 **Event:** ${momentData.event_type}
📅 **Date:** ${momentData.moment_date}
📋 **Description:** ${momentData.description}

${sensitivityCheck.improved_text !== momentData.description ? 
  `✏️ **Suggested Improvement:** ${sensitivityCheck.improved_text}` : ''}

${sensitivityCheck.recommendations?.length > 0 ? 
  `💡 **Recommendations:**\n${sensitivityCheck.recommendations.map(r => `• ${r}`).join('\n')}` : ''}

**Ready to post to Thun.ai Dashboard?**
Reply with:
• **"YES"** to approve and activate
• **"NO"** to cancel
• **"EDIT: [your changes]"** to modify`;

    await send(approvalMessage);
    
    // Store pending moment for approval tracking
    this.storage.set(`pending_moment_${momentData.id}`, {
      ...momentData,
      sensitivityCheck,
      status: 'pending_admin_approval'
    });

    return momentData.id;
  }

  // Process admin approval response
  async processAdminApproval(response, momentId, adminId) {
    const pendingMoment = this.storage.get(`pending_moment_${momentId}`);
    if (!pendingMoment) {
      return { success: false, message: "Moment not found or already processed." };
    }

    const responseText = response.toLowerCase().trim();

    if (responseText === 'yes') {
      // Approve and activate moment
      const activeMoment = {
        ...pendingMoment,
        status: 'active',
        approvedAt: new Date().toISOString(),
        approvedBy: adminId
      };

      // Save to active moments
      const activeMoments = this.storage.get('active_moments') || [];
      activeMoments.push(activeMoment);
      this.storage.set('active_moments', activeMoments);

      // Remove from pending
      this.storage.delete(`pending_moment_${momentId}`);

      return { 
        success: true, 
        message: `✅ Moment approved and saved! Thun.ai will notify the team about ${pendingMoment.celebrant_name}'s ${pendingMoment.event_type}.` 
      };

    } else if (responseText === 'no') {
      // Reject moment
      this.storage.delete(`pending_moment_${momentId}`);
      return { 
        success: true, 
        message: "❌ Moment cancelled and removed." 
      };

    } else if (responseText.startsWith('edit:')) {
      // Admin wants to edit
      const editedContent = response.substring(5).trim();
      pendingMoment.description = editedContent;
      pendingMoment.originalText = editedContent;
      
      // Re-run sensitivity check
      const newSensitivityCheck = await this.checkSensitivityAndGrammar(pendingMoment);
      pendingMoment.sensitivityCheck = newSensitivityCheck;
      
      this.storage.set(`pending_moment_${momentId}`, pendingMoment);
      
      return { 
        success: true, 
        message: `✏️ Moment updated! Please review again and reply YES/NO.\n\n**Updated:** ${editedContent}` 
      };
    }

    return { 
      success: false, 
      message: "Please reply with YES, NO, or EDIT: [your changes]" 
    };
  }

  // Check for moments happening soon (daily check)
  getMomentsForNotification(daysAhead = 1) {
    const activeMoments = this.storage.get('active_moments') || [];
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysAhead);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    return activeMoments.filter(moment => 
      moment.moment_date === targetDateStr && 
      moment.status === 'active' &&
      !moment.notificationSent
    );
  }

  // Generate team notification for upcoming moment
  async generateMomentNotification(moment) {
    const notificationPrompt = `
Create an engaging team notification for this upcoming workplace moment:

Celebrant: ${moment.celebrant_name}
Event: ${moment.event_type}
Date: ${moment.moment_date}
Description: ${moment.description}

Write a friendly, enthusiastic message that:
1. Announces the upcoming celebration
2. Invites team members to share greetings
3. Maintains Thun.ai's cheerful, slightly sarcastic personality
4. Includes emojis and keeps it under 200 words

Don't mention "Thun.ai" in the message itself.`;

    try {
      const response = await this.groqModel.sendChatCompletion([
        { role: 'system', content: 'You are Thun.ai, a friendly workplace culture bot with a cheerful, slightly sarcastic personality.' },
        { role: 'user', content: notificationPrompt }
      ]);

      return response.content;
    } catch (error) {
      console.error('Error generating notification:', error);
      return `🎉 Hey team! ${moment.celebrant_name} has a special ${moment.event_type} coming up on ${moment.moment_date}!\n\n${moment.description}\n\nWant to send them some love? Reply with your message and I'll make sure they get it! 💌`;
    }
  }

  // Helper methods
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Check if user is admin (placeholder - implement based on your auth system)
  isAdmin(userId) {
    const admins = this.storage.get('admin_users') || ['Alex Wilber']; // Default admin for testing
    
    // Direct match
    if (admins.includes(userId)) {
      return true;
    }
    
    // Check if any admin name includes the userId (for partial matches)
    if (admins.some(admin => admin.includes(userId))) {
      return true;
    }
    
    // Check if userId is a test user ID that matches an admin name
    if (userId.startsWith('test-')) {
      const testUserName = userId.replace('test-', '').replace(/-/g, ' ');
      // Check if this test user name matches any admin (case insensitive)
      return admins.some(admin => admin.toLowerCase() === testUserName.toLowerCase());
    }
    
    return false;
  }

  // Add admin user (for setup)
  addAdmin(userId) {
    const admins = this.storage.get('admin_users') || [];
    if (!admins.includes(userId)) {
      admins.push(userId);
      this.storage.set('admin_users', admins);
    }
  }

  // Get team admin names for friendly messages
  getTeamAdmins() {
    const admins = this.storage.get('admin_users') || ['Alex Wilber']; // Default admin for testing
    const adminNames = this.storage.get('admin_names') || ['Alex Wilber']; // Store friendly names
    
    // If we have user IDs but no names, try to map them
    if (admins.length > adminNames.length) {
      // For now, return the first available admin name
      return adminNames.length > 0 ? adminNames : ['Alex Wilber'];
    }
    
    return adminNames;
  }

  // Add admin with friendly name (enhanced method)
  addAdminWithName(userId, displayName) {
    const admins = this.storage.get('admin_users') || [];
    const adminNames = this.storage.get('admin_names') || [];
    
    if (!admins.includes(userId)) {
      admins.push(userId);
      adminNames.push(displayName);
      this.storage.set('admin_users', admins);
      this.storage.set('admin_names', adminNames);
    }
  }
}

module.exports = { MomentsManager };