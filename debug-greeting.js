/**
 * Debug which greeting keyword is matching
 */

const testMessage = "Suresh is celebrating his birthday today";
const message = testMessage.toLowerCase();
const greetingKeywords = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'greetings'];

console.log(`Testing message: "${message}"`);
console.log('\nChecking each greeting keyword:');

greetingKeywords.forEach(keyword => {
  const matches = message.includes(keyword);
  console.log(`"${keyword}" -> ${matches}`);
  if (matches) {
    console.log(`  *** MATCH FOUND: "${keyword}" in "${message}" ***`);
  }
});