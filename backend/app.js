// console.log("Hello Node.js!");
const name = process.argv[2]; // gets first input

if (!name) {
  console.log("Please enter your name!");
} else {
  console.log(`Hello ${name}, welcome to Node.js!`);
}