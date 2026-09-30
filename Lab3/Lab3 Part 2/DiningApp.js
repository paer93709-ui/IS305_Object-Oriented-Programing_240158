/*
  Program: Dining Meal Booking Feature - Lab 3 Distinction
  Student Name: Raymond Pae
  Student ID: 240158

  Main application demonstrating:
  - Encapsulation
  - Inheritance
  - Constructor chaining
  - Method overriding
  - Polymorphism
  - Simulated overloading
  - Object composition
  - Transaction processing
  - Exception handling
  - Meal booking integration
*/

const readline = require("readline");

const Student = require("./Student");
const MealBooking = require("./MealBooking");
const DiningAccount = require("./DiningAccount");
const RewardsDiningAccount = require("./RewardsDiningAccount");
const CreditDiningAccount = require("./CreditDiningAccount");

const bookings = [];
const accounts = [];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer.trim());
    });
  });
}

function createBooking(student) {
  return {
    student
  };
}

function isDuplicateBooking(student, mealDate, mealType) {
  return bookings.some(booking =>
    booking.student.studentId === student.studentId &&
    booking.mealDate === mealDate &&
    booking.mealType === mealType
  );
}

function demonstratePolymorphism() {
  console.log("\n\n========================================");
  console.log("       POLYMORPHISM DEMONSTRATION");
  console.log("========================================");

  const standardAccount = new DiningAccount("STD001", 1000);
  const rewardsAccount = new RewardsDiningAccount("RWD001", 1500, 2.5);
  const creditAccount = new CreditDiningAccount("CRD001", 100, 500);

  const accountList = [
    standardAccount,
    rewardsAccount,
    creditAccount
  ];

  accountList.forEach(account => {
    console.log(account.displayAccountSummary());
  });

  console.log("The same displayAccountSummary() call works with different account types.");
  console.log("This demonstrates runtime polymorphism.");

  return accountList;
}

function demonstrateTransactions() {
  console.log("\n\n========================================");
  console.log("        ACCOUNT TRANSACTIONS");
  console.log("========================================");

  const standard = new DiningAccount("DEMO001", 1000);

  console.log("Opening balance:");
  console.log(`K${standard.getBalance().toFixed(2)}`);

  standard.deposit(500);
  standard.deposit(200, "Additional student deposit");
  standard.payForMeal(100, "Lunch payment");

  console.log(standard.displayAccountSummary());
  console.log(standard.displayTransactions());
}

function demonstrateRewards() {
  console.log("\n\n========================================");
  console.log("        REWARDS ACCOUNT DEMO");
  console.log("========================================");

  const rewards = new RewardsDiningAccount("REWARD001", 1500, 2.5);

  rewards.deposit(500, "Student account top-up");

  console.log(`Balance before reward: K${rewards.getBalance().toFixed(2)}`);

  const reward = rewards.applyReward();

  console.log(`Reward applied: K${reward.toFixed(2)}`);
  console.log(rewards.displayAccountSummary());
  console.log(rewards.displayTransactions());
}

function demonstrateCreditAccount() {
  console.log("\n\n========================================");
  console.log("        CREDIT ACCOUNT DEMO");
  console.log("========================================");

  const credit = new CreditDiningAccount("CREDIT001", 100, 500);

  console.log(`Starting balance: K${credit.getBalance().toFixed(2)}`);

  try {
    credit.payForMeal(300, "Large dining payment");
    console.log("Credit payment successful.");
    console.log(`New balance: K${credit.getBalance().toFixed(2)}`);
  } catch (error) {
    console.log(`Payment failed: ${error.message}`);
  }

  try {
    credit.payForMeal(400, "Payment beyond credit limit");
  } catch (error) {
    console.log(`Expected rejection: ${error.message}`);
  }

  console.log(credit.displayAccountSummary());
  console.log(credit.displayTransactions());
}

function demonstrateBookingPayment() {
  console.log("\n\n========================================");
  console.log("     MEAL BOOKING PAYMENT DEMO");
  console.log("========================================");

  const account = new DiningAccount("STU001", 100);
  const student = new Student("240158", "Raymond", "Pae");

  student.setDiningAccount(account);

  console.log(student.displayInfo());

  const booking = new MealBooking(
    student,
    "30-09-2026",
    "Dinner",
    2,
    "Vegetarian"
  );

  bookings.push(booking);

  console.log(`Booking total: K${booking.calculateTotal().toFixed(2)}`);

  try {
    booking.processPayment();
    console.log("Payment successful.");
    console.log("Booking has been confirmed.");
  } catch (error) {
    console.log(error.message);
  }

  console.log(booking.getSummary());
  console.log(account.displayAccountSummary());
  console.log(account.displayTransactions());
}

function demonstrateFailedPayment() {
  console.log("\n\n========================================");
  console.log("       FAILED PAYMENT DEMONSTRATION");
  console.log("========================================");

  const account = new DiningAccount("STU002", 10);
  const student = new Student("240159", "Test", "Student");

  student.setDiningAccount(account);

  const booking = new MealBooking(
    student,
    "30-09-2026",
    "Dinner",
    2,
    "None"
  );

  try {
    booking.processPayment();
  } catch (error) {
    console.log(error.message);
  }

  console.log(booking.getSummary());
  console.log(`Final account balance: K${account.getBalance().toFixed(2)}`);
}

function demonstrateDuplicatePayment() {
  console.log("\n\n========================================");
  console.log("      DUPLICATE PAYMENT TEST");
  console.log("========================================");

  const account = new DiningAccount("STU003", 100);
  const student = new Student("240160", "Duplicate", "Test");

  student.setDiningAccount(account);

  const booking = new MealBooking(
    student,
    "30-09-2026",
    "Lunch",
    1,
    "None"
  );

  try {
    booking.processPayment();
    console.log("First payment successful.");
  } catch (error) {
    console.log(error.message);
  }

  try {
    booking.processPayment();
    console.log("ERROR: Duplicate payment was allowed.");
  } catch (error) {
    console.log(`Second payment correctly rejected: ${error.message}`);
  }

  console.log(booking.getSummary());
  console.log(`Account balance: K${account.getBalance().toFixed(2)}`);
}

async function main() {
  console.log("\n");
  console.log("========================================");
  console.log("      DWU DINING SERVICES SYSTEM");
  console.log("       LAB 3 DISTINCTION EXTENSION");
  console.log("========================================");

  console.log(`
Student Name: Raymond Pae
Student ID: 240158
Course: IS305
`);

  try {
    demonstrateTransactions();
    demonstrateRewards();
    demonstrateCreditAccount();
    demonstratePolymorphism();
    demonstrateBookingPayment();
    demonstrateFailedPayment();
    demonstrateDuplicatePayment();

    console.log("\n\n========================================");
    console.log("          DEMONSTRATIONS COMPLETE");
    console.log("========================================");

    console.log(`
The application demonstrated:

1. Student and DiningAccount composition
2. DiningAccount inheritance
3. Constructor chaining using super()
4. Method overriding
5. Runtime polymorphism
6. Simulated method overloading
7. Standard account payments
8. Rewards account functionality
9. Credit account functionality
10. Meal booking payment integration
11. Successful payment and confirmation
12. Failed payment handling
13. Duplicate payment prevention
14. Transaction history
15. Validation and exception handling
`);

  } catch (error) {
    console.log(`Application error: ${error.message}`);
  } finally {
    rl.close();
  }
}

main();
