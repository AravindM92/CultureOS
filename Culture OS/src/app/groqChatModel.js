const Groq = require("groq-sdk");

/**
 * Groq Chat Model adapter for Teams AI Library
 * This class implements the interface expected by Teams AI Library's ChatPrompt
 */
class GroqChatModel {
  constructor(options) {
    this.groq = new Groq({
      apiKey: options.apiKey
    });
    this.model = options.model || "llama-3.1-70b-versatile";
    this.temperature = options.temperature || 0.7;
    this.maxTokens = options.maxTokens || 1000;
  }

  /**
   * Send a chat completion request to Groq
   * @param {Array} messages - Array of message objects
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Response object with content
   */
  async sendChatCompletion(messages, options = {}) {
    try {
      const response = await this.groq.chat.completions.create({
        messages: messages,
        model: this.model,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        stream: options.stream || false
      });

      if (options.stream) {
        return response;
      }

      return {
        content: response.choices[0]?.message?.content || "",
        usage: response.usage,
        model: response.model
      };
    } catch (error) {
      console.error("Groq API Error:", error);
      throw new Error(`Groq API call failed: ${error.message}`);
    }
  }

  /**
   * Send a streaming chat completion request to Groq
   * @param {Array} messages - Array of message objects
   * @param {Object} options - Additional options with onChunk callback
   * @returns {Promise<void>}
   */
  async sendStreamingChatCompletion(messages, options = {}) {
    try {
      const stream = await this.groq.chat.completions.create({
        messages: messages,
        model: this.model,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        stream: true
      });

      let fullContent = "";
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullContent += content;
          if (options.onChunk) {
            options.onChunk(content);
          }
        }
      }

      return {
        content: fullContent,
        model: this.model
      };
    } catch (error) {
      console.error("Groq Streaming API Error:", error);
      throw new Error(`Groq streaming API call failed: ${error.message}`);
    }
  }
}

module.exports = { GroqChatModel };