// Temporary SSL fix for corporate networks
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const app = require("./app/app");

// Start the application
(async () => {
  await app.start(process.env.PORT || process.env.port || 3978);
  console.log(`\nAgent started, app listening to`, process.env.PORT || process.env.port || 3978);
})();
