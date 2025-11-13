const app = require("./app/app");

// Start the application
(async () => {
  const config = require('./config');
  await app.start(config.botPort);
  console.log(`\nAgent started, app listening to`, config.botPort);
})();
