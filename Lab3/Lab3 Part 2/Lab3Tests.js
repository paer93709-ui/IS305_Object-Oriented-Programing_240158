/*
  Program: Lab 3 Distinction Tests
  Student Name: Raymond Pae
  Student ID: 240158
*/

const Student = require("./Student");
const MealBooking = require("./MealBooking");
const DiningAccount = require("./DiningAccount");
const RewardsDiningAccount = require("./RewardsDiningAccount");
const CreditDiningAccount = require("./CreditDiningAccount");

let passed = 0;
let failed = 0;

function test(testName, testFunction) {
  try {
    testFunction();

    console.log(`PASS: ${testName}`);
    passed++;
  } catch (error) {
    console.log(`FAIL: ${testName}`);
    console.log(`      ${error.message}`);
    failed++;
  }
}

test("DiningAccount can be created", () => {
  const account = new DiningAccount("TEST001", 100);

  if (account.getBalance() !== 100) {
    throw new Error("Incorrect opening balance.");
  }
});

test("Deposit increases account balance", () => {
  const account = new DiningAccount("TEST002", 100);

  account.deposit(50);

  if (account.getBalance() !== 150) {
    throw new Error("Deposit was not added.");
  }
});

test("Meal payment reduces account balance", () => {
  const account = new DiningAccount("TEST003", 100);

  account.payForMeal(40);

  if (account.getBalance() !== 60) {
    throw new Error("Payment was not deducted.");
  }
});

test("Standard account rejects insufficient funds", () => {
  const account = new DiningAccount("TEST004", 20);

  let rejected = false;

  try {
    account.payForMeal(50);
  } catch {
    rejected = true;
  }

  if (!rejected) {
    throw new Error("Insufficient payment was not rejected.");
  }
});

test("RewardsDiningAccount inherits from DiningAccount", () => {
  const account = new RewardsDiningAccount("TEST005", 1000, 2.5);

  if (!(account instanceof DiningAccount)) {
    throw new Error("RewardsDiningAccount does not inherit from DiningAccount.");
  }
});

test("Rewards account calculates reward", () => {
  const account = new RewardsDiningAccount("TEST006", 1000, 2.5);

  const reward = account.calculateReward();

  if (reward !== 25) {
    throw new Error(`Expected K25 reward but got K${reward}.`);
  }
});

test("Reward can be applied", () => {
  const account = new RewardsDiningAccount("TEST007", 1000, 2.5);

  account.applyReward();

  if (account.getBalance() !== 1025) {
    throw new Error("Reward was not applied correctly.");
  }
});

test("CreditDiningAccount inherits from DiningAccount", () => {
  const account = new CreditDiningAccount("TEST008", 100, 500);

  if (!(account instanceof DiningAccount)) {
    throw new Error("CreditDiningAccount does not inherit from DiningAccount.");
  }
});

test("Credit account allows spending within credit limit", () => {
  const account = new CreditDiningAccount("TEST009", 100, 500);

  account.payForMeal(300);

  if (account.getBalance() !== -200) {
    throw new Error(`Expected -K200 but got K${account.getBalance()}.`);
  }
});

test("Credit account rejects spending beyond credit limit", () => {
  const account = new CreditDiningAccount("TEST010", 100, 500);

  let rejected = false;

  try {
    account.payForMeal(601);
  } catch {
    rejected = true;
  }

  if (!rejected) {
    throw new Error("Credit limit was not enforced.");
  }
});

test("Student can connect to dining account", () => {
  const student = new Student("240158", "Raymond", "Pae");
  const account = new DiningAccount("STUDENT001", 100);

  student.setDiningAccount(account);

  if (student.diningAccount !== account) {
    throw new Error("Dining account was not connected.");
  }
});

test("Meal booking can be paid through student account", () => {
  const account = new DiningAccount("STUDENT002", 100);
  const student = new Student("240158", "Raymond", "Pae", account);
  const booking = new MealBooking(student, "30-09-2026", "Dinner", 2, "Vegetarian");

  booking.processPayment();

  if (booking.bookingStatus !== "Confirmed") {
    throw new Error("Successful payment did not confirm booking.");
  }
});

test("Failed booking payment does not confirm booking", () => {
  const account = new DiningAccount("STUDENT003", 10);
  const student = new Student("240158", "Raymond", "Pae", account);
  const booking = new MealBooking(student, "30-09-2026", "Dinner", 2, "None");

  let failed = false;

  try {
    booking.processPayment();
  } catch {
    failed = true;
  }

  if (!failed) {
    throw new Error("Payment should have failed.");
  }

  if (booking.bookingStatus !== "Pending") {
    throw new Error("Failed booking was incorrectly confirmed.");
  }
});

test("Duplicate booking payment is prevented", () => {
  const account = new DiningAccount("STUDENT004", 100);
  const student = new Student("240158", "Raymond", "Pae", account);
  const booking = new MealBooking(student, "30-09-2026", "Lunch", 1, "None");

  booking.processPayment();

  let rejected = false;

  try {
    booking.processPayment();
  } catch {
    rejected = true;
  }

  if (!rejected) {
    throw new Error("Duplicate payment was not prevented.");
  }
});

test("Transaction history is recorded", () => {
  const account = new DiningAccount("TEST015", 100);

  account.deposit(50, "Test deposit");
  account.payForMeal(20, "Test meal");

  const transactions = account.getTransactions();

  if (transactions.length !== 3) {
    throw new Error(`Expected 3 transactions but found ${transactions.length}.`);
  }
});

test("Polymorphism works with account array", () => {
  const accounts = [
    new DiningAccount("POLY001", 100),
    new RewardsDiningAccount("POLY002", 100, 2.5),
    new CreditDiningAccount("POLY003", 100, 500)
  ];

  accounts.forEach(account => {
    if (typeof account.displayAccountSummary !== "function") {
      throw new Error("Polymorphic method is unavailable.");
    }
  });
});

console.log("\n========================================");
console.log("             TEST RESULTS");
console.log("========================================");

console.log(`Tests Passed: ${passed}`);
console.log(`Tests Failed: ${failed}`);
console.log(`Total Tests: ${passed + failed}`);

if (failed === 0) {
  console.log("\nALL TESTS PASSED.");
} else {
  console.log("\nSOME TESTS FAILED.");
}

console.log("========================================");
