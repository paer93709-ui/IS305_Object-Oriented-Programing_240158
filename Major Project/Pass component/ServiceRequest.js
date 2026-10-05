'use strict';

const User = require('./User');

/**
 * ServiceRequest.js
 * Represents a single campus service request submitted by a requester.
 *
 * Demonstrates: private fields, encapsulation, controlled setters,
 * validation, and simple lifecycle behaviour (update / cancel).
 *
 * Note for future extension (Credit/Distinction):
 * `_setStatus()` is exposed as an internal (underscore-prefixed) method so
 * that subclasses such as AssignedServiceRequest can transition status
 * values (e.g. "In Progress", "Resolved") without breaking encapsulation
 * of the #status private field, which only this class can touch directly.
 */

class ServiceRequest {
  static CATEGORIES = [
    'ICT Support',
    'Facilities Maintenance',
    'Cleaning and Sanitation',
    'General Campus Service'
  ];

  static PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'];

  // Pass-level statuses. Credit/Distinction subclasses may introduce
  // additional statuses (Assigned, In Progress, Resolved, Closed).
  static STATUSES = ['Submitted', 'Cancelled'];

  // Private fields
  #requestId;
  #requester;
  #title;
  #description;
  #location;
  #category;
  #priority;
  #status;
  #dateSubmitted;
  #dateUpdated;

  /**
   * @param {string} requestId
   * @param {User} requester
   * @param {string} title
   * @param {string} description
   * @param {string} location - campus location
   * @param {string} category - one of ServiceRequest.CATEGORIES
   * @param {string} [priority='Normal'] - one of ServiceRequest.PRIORITIES
   */
  constructor(requestId, requester, title, description, location, category, priority = 'Normal') {
    this.#requestId = requestId ? String(requestId).trim() : requestId;
    this.#requester = requester;
    this.#title = title;
    this.#description = description;
    this.#location = location;
    this.#category = category;
    this.#priority = priority;
    this.#status = 'Submitted';
    this.#dateSubmitted = new Date();
    this.#dateUpdated = new Date();
  }

  // ---------- Getters ----------
  getRequestId() {
    return this.#requestId;
  }

  getRequester() {
    return this.#requester;
  }

  getTitle() {
    return this.#title;
  }

  getDescription() {
    return this.#description;
  }

  getLocation() {
    return this.#location;
  }

  getCategory() {
    return this.#category;
  }

  getPriority() {
    return this.#priority;
  }

  getStatus() {
    return this.#status;
  }

  getDateSubmitted() {
    return this.#dateSubmitted;
  }

  getDateUpdated() {
    return this.#dateUpdated;
  }

  // ---------- Controlled setters ----------
  setTitle(title) {
    if (!title || String(title).trim().length === 0) {
      throw new Error('Request title cannot be empty.');
    }
    this.#title = String(title).trim();
  }

  setDescription(description) {
    if (!description || String(description).trim().length === 0) {
      throw new Error('Request description cannot be empty.');
    }
    this.#description = String(description).trim();
  }

  setLocation(location) {
    if (!location || String(location).trim().length === 0) {
      throw new Error('Campus location cannot be empty.');
    }
    this.#location = String(location).trim();
  }

  setCategory(category) {
    if (!ServiceRequest.CATEGORIES.includes(category)) {
      throw new Error(
        `Invalid category. Must be one of: ${ServiceRequest.CATEGORIES.join(', ')}`
      );
    }
    this.#category = category;
  }

  setPriority(priority) {
    if (!ServiceRequest.PRIORITIES.includes(priority)) {
      throw new Error(
        `Invalid priority. Must be one of: ${ServiceRequest.PRIORITIES.join(', ')}`
      );
    }
    this.#priority = priority;
  }

  /**
   * Internal helper reserved for this class and future subclasses to change
   * status in a controlled way. Not part of the public Pass-level API.
   */
  _setStatus(status) {
    this.#status = status;
    this.#dateUpdated = new Date();
  }

  // ---------- Behaviour ----------
  validate() {
    const errors = [];

    if (!this.#requestId || String(this.#requestId).trim().length === 0) {
      errors.push('Request ID is required.');
    }
    if (!(this.#requester instanceof User)) {
      errors.push('A valid registered requester is required.');
    }
    if (!this.#title || String(this.#title).trim().length === 0) {
      errors.push('Request title is required.');
    }
    if (!this.#description || String(this.#description).trim().length === 0) {
      errors.push('Request description is required.');
    }
    if (!this.#location || String(this.#location).trim().length === 0) {
      errors.push('Campus location is required.');
    }
    if (!ServiceRequest.CATEGORIES.includes(this.#category)) {
      errors.push(`Category must be one of: ${ServiceRequest.CATEGORIES.join(', ')}`);
    }
    if (!ServiceRequest.PRIORITIES.includes(this.#priority)) {
      errors.push(`Priority must be one of: ${ServiceRequest.PRIORITIES.join(', ')}`);
    }

    return errors;
  }

  /**
   * Applies a partial set of changes to the request.
   * @param {{title?, description?, location?, category?, priority?}} changes
   */
  updateDetails(changes = {}) {
    if (this.#status === 'Cancelled') {
      throw new Error('Cannot update a request that has already been cancelled.');
    }

    const { title, description, location, category, priority } = changes;

    if (title !== undefined) this.setTitle(title);
    if (description !== undefined) this.setDescription(description);
    if (location !== undefined) this.setLocation(location);
    if (category !== undefined) this.setCategory(category);
    if (priority !== undefined) this.setPriority(priority);

    this.#dateUpdated = new Date();
  }

  cancelRequest() {
    if (this.#status === 'Cancelled') {
      throw new Error('This request has already been cancelled.');
    }
    this.#status = 'Cancelled';
    this.#dateUpdated = new Date();
  }

  getRequestSummary() {
    return (
      `[${this.#requestId}] ${this.#title}\n` +
      `  Requester : ${this.#requester.getFullName()} (${this.#requester.getUserId()})\n` +
      `  Category  : ${this.#category}\n` +
      `  Priority  : ${this.#priority}\n` +
      `  Status    : ${this.#status}\n` +
      `  Location  : ${this.#location}\n` +
      `  Submitted : ${this.#dateSubmitted.toLocaleString()}\n` +
      `  Updated   : ${this.#dateUpdated.toLocaleString()}\n` +
      `  Details   : ${this.#description}`
    );
  }
}

module.exports = ServiceRequest;
