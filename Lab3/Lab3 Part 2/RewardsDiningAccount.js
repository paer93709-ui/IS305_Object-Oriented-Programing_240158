/*
  Program: Dining Meal Booking Feature - Lab 3 Distinction
  Student Name: Raymond Pae
  Student ID: 240158

  Description:
  RewardsDiningAccount inherits from DiningAccount and provides
  reward credit based on account activity.
*/

const DiningAccount = require("./DiningAccount");

class RewardsDiningAccount extends DiningAccount {
  #rewardRate;

  constructor(accountNumber, openingBalance = 0, rewardRate = 2.5) {
    super(accountNumber, openingBalance);

    if (typeof rewardRate !== "number" || rewardRate < 0) {
      throw new Error("Reward rate cannot be negative.");
    }

    this.#rewardRate = rewardRate;
  }

  getRewardRate() {
    return this.#rewardRate;
  }

  calculateReward() {
    return this.getBalance() * (this.#rewardRate / 100);
  }

  applyReward() {
    const reward = this.calculateReward();

    if (reward <= 0) {
      return 0;
    }

    this._addBalance(
      reward,
      `Reward credit at ${this.#rewardRate}%`
    );

    return reward;
  }

  payForMeal(amount, description = "Rewards meal payment") {
    return super.payForMeal(amount, description);
  }

  getAccountType() {
    return "Rewards Dining Account";
  }

  displayAccountSummary() {
    return `
========================================
        REWARDS DINING ACCOUNT
========================================
Account Type: ${this.getAccountType()}
Account Number: ${this.getAccountNumber()}
Balance: K${this.getBalance().toFixed(2)}
Reward Rate: ${this.#rewardRate}%
Current Reward: K${this.calculateReward().toFixed(2)}
========================================
`;
  }
}

module.exports = RewardsDiningAccount;
