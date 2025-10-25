const express = require('express');
const app = express();
const port = 3979; // Different port to avoid conflict

app.use(express.json());

// Log all incoming requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

// Echo endpoint
app.post('/api/messages', (req, res) => {
    console.log('Teams message received!');
    res.status(200).json({ message: 'Message received' });
});

app.listen(port, () => {
    console.log(`Test endpoint listening on port ${port}`);
    console.log('This will help us see if Teams is sending messages');
});