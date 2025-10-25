const { ManagedIdentityCredential } = require("@azure/identity");
const { App } = require("@microsoft/teams.apps");
const { ChatPrompt } = require("@microsoft/teams.ai");
const { LocalStorage } = require("@microsoft/teams.common");
const { GroqChatModel } = require("./groqChatModel");
const { MessageActivity } = require('@microsoft/teams.api');
const fs = require('fs');
const path = require('path');
const config = require("../config");

// Create storage for conversation history
const storage = new LocalStorage();

// Load instructions from file on initialization
function loadInstructions() {
  const instructionsFilePath = path.join(__dirname, "instructions.txt");
  return fs.readFileSync(instructionsFilePath, 'utf-8').trim();
}

// Load instructions once at startup
const instructions = loadInstructions();

const createTokenFactory = () => {
  return async (scope, tenantId) => {
    const managedIdentityCredential = new ManagedIdentityCredential({
        clientId: process.env.CLIENT_ID
      });
    const scopes = Array.isArray(scope) ? scope : [scope];
    const tokenResponse = await managedIdentityCredential.getToken(scopes, {
      tenantId: tenantId
    });
   
    return tokenResponse.token;
  };
};

// Configure authentication using TokenCredentials
const tokenCredentials = {
  clientId: process.env.CLIENT_ID || '',
  token: createTokenFactory()
};

const credentialOptions = config.MicrosoftAppType === "UserAssignedMsi" ? { ...tokenCredentials } : undefined;

// Create the app with storage
const app = new App({
  ...credentialOptions,
  storage
});

// Handle incoming messages
app.on('message', async ({ send, stream, activity }) => {
  // DEBUG: Log incoming message details
  console.log(`[${new Date().toISOString()}] Message received:`);
  console.log(`- From: ${activity.from.name} (${activity.from.id})`);
  console.log(`- Conversation: ${activity.conversation.id}`);
  console.log(`- Text: ${activity.text}`);
  console.log(`- Service URL: ${activity.serviceUrl}`);
  console.log(`- Channel ID: ${activity.channelId}`);
  
  //Get conversation history
  const conversationKey = `${activity.conversation.id}/${activity.from.id}`;
  const messages = storage.get(conversationKey) || [];

  // Add the current user message to the conversation history
  messages.push({
    role: 'user',
    content: activity.text
  });

  // Add system instructions if this is the first message
  if (messages.length === 1) {
    messages.unshift({
      role: 'system',
      content: instructions
    });
  }

  try {
    const groqModel = new GroqChatModel({
      apiKey: config.groqApiKey,
      model: config.groqModelName
    });

    if (activity.conversation.isGroup) {
      // If the conversation is a group chat, we need to send the final response
      // back to the group chat
      const response = await groqModel.sendChatCompletion(messages);
      
      // Add assistant response to conversation history
      messages.push({
        role: 'assistant',
        content: response.content
      });
      
      const responseActivity = new MessageActivity(response.content).addAiGenerated().addFeedback();
      await send(responseActivity);
    } else {
      // For 1:1 conversations, use streaming
      let fullResponse = "";
      await groqModel.sendStreamingChatCompletion(messages, {
        onChunk: (chunk) => {
          fullResponse += chunk;
          stream.emit(chunk);
        },
      });
      
      // Add assistant response to conversation history
      messages.push({
        role: 'assistant',
        content: fullResponse
      });
      
      // We wrap the final response with an AI Generated indicator
      stream.emit(new MessageActivity().addAiGenerated().addFeedback());
    }
    
    // Store updated conversation history
    storage.set(conversationKey, messages);
  } catch (error) {
    console.error(error);
    await send("The agent encountered an error or bug.");
    await send("To continue to run this agent, please fix the agent source code.");
  }
});

app.on('message.submit.feedback', async ({ activity }) => {
  //add custom feedback process logic here
  console.log("Your feedback is " + JSON.stringify(activity.value));
});

module.exports = app;