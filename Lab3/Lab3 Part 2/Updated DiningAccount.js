/*
  Program: Dining Meal Booking Feature - Lab 3 Distinction
  Student Name: Raymond Pae
  Student ID: 240158

  Description:
  Base DiningAccount class.
*/

class DiningAccount {
  #accountNumber;
  #balance;
  #transactions;

  constructor(accountNumber, openingBalance = 0) {
    if (!accountNumber || accountNumber.toString().trim() === "") {
      throw new Error("Account number is required.");
    }

    if (typeof openingBalance !== "number" || openingBalance < 0) {
      throw new Error("Opening balance cannot be negative.");
    }

    this.#accountNumber = accountNumber.toString().trim();
    this.#balance = openingBalance;
    this.#transactions = [];

    if (openingBalance > 0) {
      this.#recordTransaction(
        "Deposit",
        openingBalance,
        "Opening balance"
      );
    }
  }

  getAccountNumber() {
    return this.#accountNumber;
  }

  getBalance() {
    return this.#balance;
  }

  deposit(amount, description = "Deposit") {
    if (typeof amount !== "number" || amount <= 0) {
      throw new Error("Deposit amount must be greater than zero.");
    }

    if (!description || description.trim() === "") {
      description = "Deposit";
    }

    this.#balance += amount;

    this.#recordTransaction(
      "Deposit",
      amount,
      description
    );

    return true;
  }

  payForMeal(amount, description = "Meal payment") {
    if (typeof amount !== "number" || amount <= 0) {
      throw new Error("Payment amount must be greater than zero.");
    }

    if (amount > this.#balance) {
      throw new Error(
        `Insufficient funds. Available balance: K${this.#balance.toFixed(2)}`
      );
    }

    this.#balance -= amount;

    this.#recordTransaction(
      "Meal Payment",
      -amount,
      description
    );

    return true;
  }

  _processCreditPayment(amount, description = "Credit meal payment") {
    if (typeof amount !== "number" || amount <= 0) {
      throw new Error("Credit payment must be greater than zero.");
    }

    this.#balance -= amount;

    this.#recordTransaction(
      "Credit Meal Payment",
      -amount,
      description
    );

    return true;
  }

  _addBalance(amount, description = "Account adjustment") {
    if (typeof amount !== "number" || amount <= 0) {
      throw new Error("Amount must be greater than zero.");
    }

    this.#balance += amount;

    this.#recordTransaction(
      "Credit",
      amount,
      description
    );
  }

  getTransactions() {
    return this.#transactions.map(transaction => ({
      ...transaction
    }));
  }

  #recordTransaction(type, amount, description) {
    this.#transactions.push({
      date: new Date().toLocaleString(),
      type: type,
      amount: amount,
      description: description,
      balanceAfter: this.#balance
    });
  }

  getAccountType() {
    return "Standard Dining Account";
  }

  displayAccountSummary() {
    return `
========================================
          DINING ACCOUNT
========================================
Account Type: ${this.getAccountType()}
Account Number: ${this.#accountNumber}
Balance: K${this.#balance.toFixed(2)}
========================================
`;
  }

  displayTransactions() {
    let output = `
========================================
        TRANSACTION HISTORY
========================================
Account Number: ${this.#accountNumber}
`;

    if (this.#transactions.length === 0) {
      output += "No transactions found.\n";
    } else {
      this.#transactions.forEach((transaction, index) => {
        const sign = transaction.amount >= 0 ? "+" : "";

        output += `
${index + 1}. ${transaction.type}
   Date: ${transaction.date}
   Description: ${transaction.description}
   Amount: ${sign}K${transaction.amount.toFixed(2)}
   Balance: K${transaction.balanceAfter.toFixed(2)}
`;
      });
    }

    output += `
========================================
`;

    return output;
  }
}

module.exports = DiningAccount;