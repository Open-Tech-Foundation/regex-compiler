const re = /^(?<user>[a-zA-Z0-9._%+-]+)@(?<domain>[a-zA-Z0-9.-]+)\.(?<tld>[a-zA-Z]{2,})$/i;

const testCases = [
  { input: "hello@opentf.org", expected: true },
  { input: "user.name+tag@domain.com", expected: true },
  { input: "invalid-email", expected: false },
  { input: "@missing-user.com", expected: false },
  { input: "user@domain..com", expected: false }
];

testCases.forEach(tc => {
  const match = re.test(tc.input);
  console.log(`Input: ${tc.input}, Expected: ${tc.expected}, Match: ${match}, Success: ${match === tc.expected}`);
});
