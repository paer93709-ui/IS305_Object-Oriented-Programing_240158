/*
  Program: Dining Meal Booking Feature - Lab 3 Distinction
  Student Name: Raymond Pae
  Student ID: 240158

  Description:
  CreditDiningAccount inherits from DiningAccount.
  It allows the balance to become negative up to an
  approved credit limit.
*/

const DiningAccount = require("./DiningAccount");

class CreditDiningAccount extends DiningAccount {
  #creditLimit;

  constructor(accountNumber, openingBalance = 0, creditLimit = 500) {
    super(accountNumber, openingBalance);

    if (typeof creditLimit !== "number" || creditLimit < 0) {
      throw new Error("Credit limit cannot be negative.");
    }

    this.#creditLimit = creditLimit;
  }

  getCreditLimit() {
    return this.#creditLimit;
  }

  payForMeal(amount, description = "Credit meal payment") {
    if (typeof amount !== "number" || amount <= 0) {
      throw new Error("Payment amount must be greater than zero.");
    }

    const maximumPayment = this.getBalance() + this.#creditLimit;

    if (amount > maximumPayment) {
      throw new Error(
        `Credit limit exceeded. Maximum available spending is K${maximumPayment.toFixed(2)}.`
      );
    }

    const currentBalance = this.getBalance();

    if (amount <= currentBalance) {
      return super.payForMeal(amount, description);
    }

    const creditUsed = amount - currentBalance;

    if (currentBalance > 0) {
      super.payForMeal(
        currentBalance,
        `${description} - account balance portion`
      );
    }

    this._processCreditPayment(creditUsed, description);

    return true;
  }

  getAccountType() {
    return "Credit Dining Account";
  }

  displayAccountSummary() {
    const availableCredit = this.getBalance() + this.#creditLimit;

    return `
========================================
         CREDIT DINING ACCOUNT
========================================
Account Type: ${this.getAccountType()}
Account Number: ${this.getAccountNumber()}
Balance: K${this.getBalance().toFixed(2)}
Credit Limit: K${this.#creditLimit.toFixed(2)}
Available Spending: K${availableCredit.toFixed(2)}
========================================
`;
  }
}

module.exports = CreditDiningAccount;
``