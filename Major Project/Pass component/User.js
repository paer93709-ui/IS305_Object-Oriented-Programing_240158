'use strict';

/**
 * User.js
 * Represents a requester, service officer, technician or administrator
 * within the Campus Service Request Management System.
 *
 * Demonstrates: private fields, encapsulation, controlled getters/setters,
 * constructor validation and a self-contained validate() method.
 */

class User {
  // Recognised user types for the Pass-level system.
  static VALID_USER_TYPES = [
    'Student',
    'Staff',
    'Service Officer',
    'Technician',
    'Administrator'
  ];

  // Private fields - only accessible from within this class.
  #userId;
  #firstName;
  #lastName;
  #email;
  #userType;

  /**
   * @param {string} userId
   * @param {string} firstName
   * @param {string} lastName
   * @param {string} email
   * @param {string} userType - one of User.VALID_USER_TYPES
   */
  constructor(userId, firstName, lastName, email, userType) {
    this.#userId = userId ? String(userId).trim() : userId;
    this.#firstName = firstName;
    this.#lastName = lastName;
    this.#email = email;
    this.#userType = userType;
  }

  // ---------- Getters ----------
  getUserId() {
    return this.#userId;
  }

  getFirstName() {
    return this.#firstName;
  }

  getLastName() {
    return this.#lastName;
  }

  getEmail() {
    return this.#email;
  }

  getUserType() {
    return this.#userType;
  }

  // ---------- Controlled setters ----------
  // User ID is intentionally immutable after creation (no setUserId) so that
  // it can be safely used as a stable key throughout the system.

  setFirstName(firstName) {
    if (!firstName || String(firstName).trim().length === 0) {
      throw new Error('First name cannot be empty.');
    }
    this.#firstName = String(firstName).trim();
  }

  setLastName(lastName) {
    if (!lastName || String(lastName).trim().length === 0) {
      throw new Error('Last name cannot be empty.');
    }
    this.#lastName = String(lastName).trim();
  }

  setEmail(email) {
    if (!User.isValidEmail(email)) {
      throw new Error('Invalid email address.');
    }
    this.#email = String(email).trim();
  }

  setUserType(userType) {
    if (!User.VALID_USER_TYPES.includes(userType)) {
      throw new Error(
        `Invalid user type. Must be one of: ${User.VALID_USER_TYPES.join(', ')}`
      );
    }
    this.#userType = userType;
  }

  // ---------- Behaviour ----------
  getFullName() {
    return `${this.#firstName} ${this.#lastName}`;
  }

  /**
   * Simple, pragmatic email validation (not a full RFC 5322 implementation,
   * which is intentionally out of scope for this system).
   */
  static isValidEmail(email) {
    if (typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Validates the current state of the user.
   * @returns {string[]} an array of error messages (empty array = valid)
   */
  validate() {
    const errors = [];

    if (!this.#userId || String(this.#userId).trim().length === 0) {
      errors.push('User ID is required.');
    }
    if (!this.#firstName || String(this.#firstName).trim().length === 0) {
      errors.push('First name is required.');
    }
    if (!this.#lastName || String(this.#lastName).trim().length === 0) {
      errors.push('Last name is required.');
    }
    if (!User.isValidEmail(this.#email)) {
      errors.push('A valid email address is required.');
    }
    if (!User.VALID_USER_TYPES.includes(this.#userType)) {
      errors.push(
        `User type must be one of: ${User.VALID_USER_TYPES.join(', ')}`
      );
    }

    return errors;
  }

  displayInfo() {
    return [
      `User ID   : ${this.#userId}`,
      `Name      : ${this.getFullName()}`,
      `Email     : ${this.#email}`,
      `User Type : ${this.#userType}`
    ].join('\n');
  }
}

module.exports = User;
