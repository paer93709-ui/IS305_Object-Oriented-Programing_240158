'use strict';

const User = require('./User');
const ServiceRequest = require('./ServiceRequest');

/**
 * ServiceRequestManager.js
 * Manages all registered users and submitted service requests using
 * plain JavaScript arrays (no database, per Pass-level requirements).
 *
 * Demonstrates: composition (manager owns/coordinates User and
 * ServiceRequest objects), array searching/filtering/sorting, and
 * exception-based validation/authorisation handling.
 */

class ServiceRequestManager {
  #users;
  #requests;

  constructor() {
    this.#users = [];
    this.#requests = [];
  }

  // ---------- User management ----------

  /**
   * Registers a new user after validating the user's own fields and
   * checking for a duplicate user ID.
   * @param {User} user
   * @returns {User}
   */
  registerUser(user) {
    if (!(user instanceof User)) {
      throw new Error('registerUser() expects a User instance.');
    }

    const errors = user.validate();
    if (errors.length > 0) {
      throw new Error(`Cannot register user:\n- ${errors.join('\n- ')}`);
    }

    if (this.findUserById(user.getUserId())) {
      throw new Error(`A user with ID "${user.getUserId()}" is already registered.`);
    }

    this.#users.push(user);
    return user;
  }

  findUserById(userId) {
    if (!userId) return null;
    return this.#users.find((u) => u.getUserId() === String(userId).trim()) || null;
  }

  getAllUsers() {
    return [...this.#users];
  }

  // ---------- Request management ----------

  /**
   * Submits a new service request after validating its fields, ensuring the
   * request ID is unique, and confirming the requester is a registered user.
   * @param {ServiceRequest} request
   * @returns {ServiceRequest}
   */
  submitRequest(request) {
    if (!(request instanceof ServiceRequest)) {
      throw new Error('submitRequest() expects a ServiceRequest instance.');
    }

    const errors = request.validate();
    if (errors.length > 0) {
      throw new Error(`Cannot submit request:\n- ${errors.join('\n- ')}`);
    }

    if (this.findRequestById(request.getRequestId())) {
      throw new Error(`A request with ID "${request.getRequestId()}" already exists.`);
    }

    const requester = request.getRequester();
    if (!requester || !this.findUserById(requester.getUserId())) {
      throw new Error('Requester must be a registered user before submitting a request.');
    }

    this.#requests.push(request);
    return request;
  }

  findRequestById(requestId) {
    if (!requestId) return null;
    return this.#requests.find((r) => r.getRequestId() === String(requestId).trim()) || null;
  }

  getRequestsByUser(userId) {
    if (!userId) return [];
    return this.#requests.filter((r) => r.getRequester().getUserId() === String(userId).trim());
  }

  getAllRequests() {
    return [...this.#requests];
  }

  /**
   * Updates a request's details, but only if the caller (userId) is the
   * original requester.
   */
  updateRequest(requestId, userId, changes) {
    const request = this.findRequestById(requestId);
    if (!request) {
      throw new Error(`No request found with ID "${requestId}".`);
    }
    if (request.getRequester().getUserId() !== String(userId).trim()) {
      throw new Error('You may only update your own requests.');
    }

    request.updateDetails(changes);
    return request;
  }

  /**
   * Cancels a request, but only if the caller (userId) is the original
   * requester. ServiceRequest itself rejects cancelling an already
   * cancelled request.
   */
  cancelRequest(requestId, userId) {
    const request = this.findRequestById(requestId);
    if (!request) {
      throw new Error(`No request found with ID "${requestId}".`);
    }
    if (request.getRequester().getUserId() !== String(userId).trim()) {
      throw new Error('You may only cancel your own requests.');
    }

    request.cancelRequest();
    return request;
  }

  /**
   * Case-insensitive search across title, description, location, category
   * and request ID.
   */
  searchRequests(searchText) {
    if (!searchText || String(searchText).trim().length === 0) return [];
    const text = String(searchText).trim().toLowerCase();

    return this.#requests.filter((r) =>
      r.getTitle().toLowerCase().includes(text) ||
      r.getDescription().toLowerCase().includes(text) ||
      r.getLocation().toLowerCase().includes(text) ||
      r.getCategory().toLowerCase().includes(text) ||
      r.getRequestId().toLowerCase().includes(text)
    );
  }

  /**
   * Returns a count of requests grouped by status, e.g.
   * { Submitted: 4, Cancelled: 1 }
   */
  getRequestSummaryByStatus() {
    const summary = {};
    for (const status of ServiceRequest.STATUSES) {
      summary[status] = 0;
    }
    for (const request of this.#requests) {
      const status = request.getStatus();
      summary[status] = (summary[status] || 0) + 1;
    }
    return summary;
  }
}

module.exports = ServiceRequestManager;
