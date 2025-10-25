const http = require('http');

// Test if the bot is responding
const postData = JSON.stringify({
  type: 'message',
  text: 'Hello test',
  from: { id: 'test-user', name: 'Test User' },
  conversation: { id: 'test-conversation' },
  timestamp: new Date().toISOString()
});

const options = {
  hostname: 'localhost',
  port: 3978,
  path: '/api/messages',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Testing bot endpoint...');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`);
});

req.write(postData);
req.end();