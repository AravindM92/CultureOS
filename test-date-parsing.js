// Test the date parsing logic
console.log('🧪 TESTING DATE PARSING LOGIC');
console.log('============================');

const today = new Date();
console.log('Today is:', today.toDateString(), '(Day of week:', today.getDay(), ')');

// Test "this Friday" parsing
function parseThisFriday() {
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday
  const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 7 - dayOfWeek + 5;
  const friday = new Date(today);
  friday.setDate(today.getDate() + daysUntilFriday);
  return friday.toISOString().split('T')[0];
}

// Test "next Wednesday" parsing
function parseNextWednesday() {
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 3 = Wednesday
  const daysUntilWednesday = dayOfWeek <= 3 ? 3 - dayOfWeek + 7 : 7 - dayOfWeek + 3; // Always next week's Wednesday
  const wednesday = new Date(today);
  wednesday.setDate(today.getDate() + daysUntilWednesday);
  return wednesday.toISOString().split('T')[0];
}

// Test "this Wednesday" parsing
function parseThisWednesday() {
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 3 = Wednesday
  const daysUntilWednesday = dayOfWeek <= 3 ? 3 - dayOfWeek : 7 - dayOfWeek + 3;
  const wednesday = new Date(today);
  wednesday.setDate(today.getDate() + daysUntilWednesday);
  return wednesday.toISOString().split('T')[0];
}

const thisFriday = parseThisFriday();
const nextWednesday = parseNextWednesday();
const thisWednesday = parseThisWednesday();

console.log('This Friday will be:', thisFriday);
console.log('Next Wednesday will be:', nextWednesday);
console.log('This Wednesday will be:', thisWednesday);

// Verify dates
const fridayDate = new Date(thisFriday);
const nextWedDate = new Date(nextWednesday);
const thisWedDate = new Date(thisWednesday);

console.log('Verify Friday:', fridayDate.toDateString(), '- Day of week:', fridayDate.getDay(), '(should be 5)');
console.log('Verify Next Wed:', nextWedDate.toDateString(), '- Day of week:', nextWedDate.getDay(), '(should be 3)');
console.log('Verify This Wed:', thisWedDate.toDateString(), '- Day of week:', thisWedDate.getDay(), '(should be 3)');

console.log('\n✅ Date parsing test complete!');