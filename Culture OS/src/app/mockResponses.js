/**
 * Smart Mock Responses for Thun.ai when LLM API is blocked
 * Provides contextual responses based on user input keywords
 */

class MockThunaiResponses {
  constructor() {
    this.responses = {
      greetings: [
        "🎉 Hello there! I'm Thun.ai, your friendly துணை (companion)! I'm here to celebrate your wins and spread some workplace joy! What's got you excited today?",
        "Hey! 🌟 So wonderful to meet you! I'm Thun.ai, and I'm absolutely thrilled to be your team's culture champion. What amazing things are happening in your world?",
        "Hi! 😊 Welcome to the positive vibes zone! I'm Thun.ai, your dedicated companion for spreading cheer and celebrating all the awesome moments at work!"
      ],
      celebration: [
        "🎊 That's absolutely AMAZING! I'm so excited to celebrate this win with you! Your hard work and dedication really paid off. The whole team should know about this success! 🌟",
        "🎉 WOW! This calls for a proper celebration! I'm genuinely thrilled for you. Moments like these are what make work truly meaningful. You've made my day brighter! ✨",
        "💫 This is FANTASTIC news! I'm practically bouncing with excitement for you! Your achievement deserves all the recognition. Let's make sure everyone knows how awesome you are!"
      ],
      encouragement: [
        "🌟 I believe in you completely! Every challenge is just another opportunity for you to shine. You've got this, and I'm here cheering you on every step of the way! 💪",
        "✨ Remember, you're capable of incredible things! Even on tough days, you're making a difference. I'm here to remind you how valued and appreciated you are! 🎯",
        "🚀 You're stronger than you know and more talented than you realize! Let's turn today into something amazing together. What's one small win we can celebrate right now?"
      ],
      teamwork: [
        "👥 I absolutely LOVE hearing about great teamwork! There's nothing more beautiful than people coming together to achieve something amazing. Your collaboration makes the workplace so much brighter! 🌈",
        "🤝 This is what true team spirit looks like! When people support each other like this, magic happens. I'm so proud to be part of a community that values connection and collaboration! ✨",
        "🎯 Teams like yours are what make work feel like family! The way you all support each other is truly inspiring. Let's celebrate this incredible team dynamic! 🎉"
      ],
      help: [
        "😊 I'm here to be your workplace companion and culture champion! I love celebrating wins (big and small!), spreading positivity, recognizing achievements, and helping create those special moments that make work joyful. What would you like to celebrate today? 🌟",
        "🎉 As your friendly துணை, I'm all about bringing more humanity and joy to the workplace! I can help celebrate milestones, share encouragement, recognize team efforts, and create those smile-worthy moments. How can I brighten your day? ✨",
        "💫 Think of me as your personal cheer squad and culture catalyst! I'm here to celebrate your journey, acknowledge your efforts, and help create a workplace where everyone feels valued and connected. What's making you proud today? 🚀"
      ],
      achievements: [
        "🏆 Look at you absolutely CRUSHING it! This achievement is a testament to your dedication and talent. I'm so proud of you, and I know this is just the beginning of many more successes! 🌟",
        "⭐ This is the kind of excellence that inspires everyone around you! Your achievement doesn't just reflect your skills - it shows your heart and commitment. Absolutely fantastic! 🎉",
        "🎯 You've just proven that hard work and passion create magic! This accomplishment is going to motivate so many others. You're not just succeeding - you're leading by example! ✨"
      ],
      default: [
        "🌟 I'm here to spread joy and celebrate the amazing things happening in your workplace! Whether it's a big win, a small victory, or just making it through a challenging day - I'm here to cheer you on! What's on your mind? 😊",
        "✨ Every conversation is a chance to create something positive! I love being your துணை (companion) in making work more human and joyful. How can I brighten your day today? 🎉",
        "💫 There's always something worth celebrating, even in the smallest moments! I'm here to help you find those bright spots and share in your journey. What would you like to talk about? 🌈"
      ]
    };
  }

  getResponse(userMessage) {
    const message = userMessage.toLowerCase();
    
    // Check for greetings
    if (this.containsAny(message, ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'greetings'])) {
      return this.getRandomResponse('greetings');
    }
    
    // Check for celebration keywords
    if (this.containsAny(message, ['won', 'achieved', 'completed', 'finished', 'success', 'celebrate', 'victory', 'accomplishment', 'milestone'])) {
      return this.getRandomResponse('celebration');
    }
    
    // Check for encouragement needs
    if (this.containsAny(message, ['difficult', 'hard', 'challenging', 'struggling', 'tired', 'stressed', 'help', 'encourage', 'motivation', 'tough day'])) {
      return this.getRandomResponse('encouragement');
    }
    
    // Check for team-related content
    if (this.containsAny(message, ['team', 'colleagues', 'collaboration', 'together', 'group', 'working with', 'partners'])) {
      return this.getRandomResponse('teamwork');
    }
    
    // Check for help/info requests
    if (this.containsAny(message, ['what', 'who', 'how', 'help', 'info', 'about', 'can you', 'what do you do'])) {
      return this.getRandomResponse('help');
    }
    
    // Check for achievement sharing
    if (this.containsAny(message, ['project', 'goal', 'target', 'delivered', 'launched', 'released', 'proud', 'achievement'])) {
      return this.getRandomResponse('achievements');
    }
    
    // Default positive response
    return this.getRandomResponse('default');
  }
  
  containsAny(text, keywords) {
    return keywords.some(keyword => text.includes(keyword));
  }
  
  getRandomResponse(category) {
    const responses = this.responses[category];
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

module.exports = { MockThunaiResponses };