/*
  Program: Dining Meal Booking Feature - Lab 3 Distinction
  Student Name: Raymond Pae
  Student ID: 240158

  Description:
  Student class stores student information and connects
  a Student object to a DiningAccount object.
*/

class Student {
  #studentId;
  #firstName;
  #lastName;
  #diningAccount;

  constructor(studentId, firstName, lastName, diningAccount = null) {
    this.#studentId = studentId;
    this.#firstName = firstName;
    this.#lastName = lastName;
    this.#diningAccount = diningAccount;
  }

  get studentId() {
    return this.#studentId;
  }

  get firstName() {
    return this.#firstName;
  }

  get lastName() {
    return this.#lastName;
  }

  get diningAccount() {
    return this.#diningAccount;
  }

  set firstName(name) {
    if (!name || name.trim() === "") {
      throw new Error("First name cannot be empty.");
    }

    this.#firstName = name.trim();
  }

  set lastName(name) {
    if (!name || name.trim() === "") {
      throw new Error("Last name cannot be empty.");
    }

    this.#lastName = name.trim();
  }

  setDiningAccount(account) {
    if (!account || typeof account.payForMeal !== "function") {
      throw new Error("A valid DiningAccount object is required.");
    }

    this.#diningAccount = account;
  }

  getFullName() {
    return `${this.#firstName} ${this.#lastName}`;
  }

  validate() {
    if (!this.#studentId || this.#studentId.trim() === "") {
      throw new Error("Student ID is required.");
    }

    if (!this.#firstName || this.#firstName.trim() === "") {
      throw new Error("First name is required.");
    }

    if (!this.#lastName || this.#lastName.trim() === "") {
      throw new Error("Last name is required.");
    }

    return true;
  }

  displayInfo() {
    return `
========================================
          STUDENT INFORMATION
========================================
Student ID: ${this.#studentId}
Student Name: ${this.getFullName()}
Dining Account: ${
      this.#diningAccount
        ? this.#diningAccount.getAccountNumber()
        : "Not assigned"
    }
========================================
`;
  }
}

module.exports = Student;
