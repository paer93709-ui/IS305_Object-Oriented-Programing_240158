import { User } from "./User.js";
import { ServiceRequest, STATUSES, CATEGORIES, PRIORITIES } from "./ServiceRequest.js";
import { UserFactory } from "./UserFactory.js";
import { ServiceRequestFactory } from "./ServiceRequestFactory.js";

const OPEN_STATUSES = Object.freeze(["Submitted", "Reviewed", "Assigned", "In Progress"]);

/**
 * ServiceRequestManager.js
 * Owns the in-memory arrays of users and requests (as before), PLUS the
 * four file repositories. It is the only class in the application that
 * knows both the domain rules AND that persistence exists - repositories
 * only know about files, the domain classes only know about their own
 * fields, and CampusServiceApp only ever talks to this manager. This is
 * what keeps "CampusServiceApp must not directly read or write JSON
 * files" true without CampusServiceApp needing to care how persistence
 * works at all.
 */
export class ServiceRequestManager {
  #users;
  #requests;
  #userRepo;
  #requestRepo;
  #historyRepo;
  #auditRepo;
  #auditCounter;

  /**
   * Repositories are optional. Passing none at all gives you a
   * manager that behaves exactly like the Pass/Credit version - pure
   * in-memory domain logic, nothing touches disk. This is deliberate:
   * it's what lets the automated test suite exercise business rules
   * (validation, workflow, permissions) without any file I/O, and
   * exercise persistence separately using repositories pointed at
   * temporary test files.
   */
  constructor({ userRepository, requestRepository, historyRepository, auditRepository } = {}) {
    this.#users = [];
    this.#requests = [];
    this.#userRepo = userRepository ?? null;
    this.#requestRepo = requestRepository ?? null;
    this.#historyRepo = historyRepository ?? null;
    this.#auditRepo = auditRepository ?? null;
    this.#auditCounter = 1;
  }

  // ---- Distinction: loading persisted data at startup ----

  async loadAll() {
    if (!this.#userRepo || !this.#requestRepo || !this.#historyRepo || !this.#auditRepo) {
      throw new Error("loadAll() requires all four repositories to be provided to the constructor.");
    }

    const userRecords = await this.#userRepo.loadAll();
    this.#users = userRecords.map((record) => UserFactory.createFromData(record));

    const requestRecords = await this.#requestRepo.loadAll();
    const historyRecords = await this.#historyRepo.loadAll();
    this.#requests = requestRecords.map((record) => {
      const entries = historyRecords
        .filter((h) => h.requestId === record.requestId)
        .map(({ requestId, ...rest }) => rest);
      return ServiceRequestFactory.createFromData(record, this.#users, entries);
    });

    const auditRecords = await this.#auditRepo.loadAll();
    this.#auditCounter = auditRecords.length + 1;
  }

  // ---- Distinction: internal persistence helpers ----
  // Private - nothing outside this class ever calls these directly.
  // Every public mutating method below calls the relevant one of these
  // AFTER its domain-level change has already succeeded, so an
  // incomplete or invalid record can never reach disk: validation runs
  // first (as it always has), persistence only happens on success.

  async #persistUsers() {
    if (this.#userRepo) await this.#userRepo.saveAll(this.#users.map((u) => u.toJSON()));
  }

  async #persistRequests() {
    if (this.#requestRepo) await this.#requestRepo.saveAll(this.#requests.map((r) => r.toJSON()));
  }

  async #persistHistoryFor(request) {
    if (this.#historyRepo) await this.#historyRepo.replaceForRequest(request.requestId, request.history);
  }

  async #recordAudit(actorId, action, requestId, description, result = "Success") {
    if (!this.#auditRepo) return;
    const auditId = `AUD-${String(this.#auditCounter++).padStart(4, "0")}`;
    await this.#auditRepo.create({
      auditId,
      actorId: actorId ?? null,
      action,
      requestId: requestId ?? null,
      description,
      dateTime: new Date().toISOString(),
      result
    });
  }

  // ---- User management ----

  async registerUser(user) {
    if (!(user instanceof User))
      throw new Error("registerUser() expects a User instance.");

    const errors = user.validate();
    if (errors.length > 0)
      throw new Error(`Cannot register user:\n- ${errors.join("\n- ")}`);

    if (this.findUserById(user.userId))
      throw new Error(`A user with ID "${user.userId}" is already registered.`);

    this.#users.push(user);
    await this.#persistUsers();
    await this.#recordAudit(user.userId, "User Registered", null, `Registered ${user.userType} "${user.getFullName()}".`);
    return user;
  }

  findUserById(userId) {
    if (!userId) return null;
    return this.#users.find((u) => u.userId === userId) || null;
  }

  // ---- Request management (Pass/Credit level, now persisted) ----

  async submitRequest(request) {
    if (!(request instanceof ServiceRequest))
      throw new Error("submitRequest() expects a ServiceRequest instance.");

    const errors = request.validate();
    if (errors.length > 0)
      throw new Error(`Cannot submit request:\n- ${errors.join("\n- ")}`);

    if (this.findRequestById(request.requestId))
      throw new Error(`A request with ID "${request.requestId}" already exists.`);

    if (!this.findUserById(request.requester.userId))
      throw new Error("Requester must be a registered user before submitting a request.");

    this.#requests.push(request);
    await this.#persistRequests();
    await this.#persistHistoryFor(request);
    await this.#recordAudit(
      request.requester.userId,
      "Request Created",
      request.requestId,
      `Submitted a ${request.constructor.name} titled "${request.title}".`
    );
    return request;
  }

  findRequestById(requestId) {
    if (!requestId) return null;
    return this.#requests.find((r) => r.requestId === requestId) || null;
  }

  getRequestsByUser(userId) {
    if (!userId) return [];
    return this.#requests.filter((r) => r.requester.userId === userId);
  }

  getAllRequests() {
    return [...this.#requests];
  }

  async updateRequest(requestId, userId, changes) {
    const request = this.findRequestById(requestId);
    if (!request)
      throw new Error(`No request found with ID "${requestId}".`);

    if (request.requester.userId !== userId)
      throw new Error("You may only update your own requests.");

    request.updateDetails(changes, userId);
    await this.#persistRequests();
    await this.#persistHistoryFor(request);
    await this.#recordAudit(userId, "Request Updated", requestId, "Requester updated request details.");
    return request;
  }

  async cancelRequest(requestId, userId) {
    const request = this.findRequestById(requestId);
    if (!request)
      throw new Error(`No request found with ID "${requestId}".`);

    if (request.requester.userId !== userId)
      throw new Error("You may only cancel your own requests.");

    request.cancelRequest(userId);
    await this.#persistRequests();
    await this.#persistHistoryFor(request);
    await this.#recordAudit(userId, "Request Cancelled", requestId, "Requester cancelled the request.");
    return request;
  }

  // ---- Credit-level workflow (now persisted + audited) ----

  #requireRegisteredUser(userId, label) {
    const user = this.findUserById(userId);
    if (!user) throw new Error(`No registered ${label} found with ID "${userId}".`);
    return user;
  }

  async reviewRequest(requestId, officerId, priority, comment = "") {
    const request = this.findRequestById(requestId);
    if (!request) throw new Error(`No request found with ID "${requestId}".`);

    const officer = this.#requireRegisteredUser(officerId, "user");
    if (officer.userType !== "Service Officer")
      throw new Error("Only a Service Officer may review requests.");

    const previousPriority = request.priority;
    request.reviewRequest(officerId, priority, comment);
    await this.#persistRequests();
    await this.#persistHistoryFor(request);
    await this.#recordAudit(officerId, "Request Reviewed", requestId, comment || "Request reviewed.");
    if (priority !== undefined && priority !== previousPriority) {
      await this.#recordAudit(officerId, "Priority Changed", requestId, `Priority changed from "${previousPriority}" to "${priority}".`);
    }
    return request;
  }

  async assignTechnician(requestId, officerId, technicianId, comment = "") {
    const request = this.findRequestById(requestId);
    if (!request) throw new Error(`No request found with ID "${requestId}".`);

    const officer = this.#requireRegisteredUser(officerId, "user");
    if (officer.userType !== "Service Officer")
      throw new Error("Only a Service Officer may assign a technician.");

    const technician = this.#requireRegisteredUser(technicianId, "user");
    if (technician.userType !== "Technician")
      throw new Error(`User "${technicianId}" is not a registered Technician.`);

    request.assignTechnician(officerId, technicianId, comment);
    await this.#persistRequests();
    await this.#persistHistoryFor(request);
    await this.#recordAudit(officerId, "Technician Assigned", requestId, `Assigned technician "${technicianId}".`);
    return request;
  }

  async beginWork(requestId, technicianId, comment = "") {
    const request = this.findRequestById(requestId);
    if (!request) throw new Error(`No request found with ID "${requestId}".`);

    const technician = this.#requireRegisteredUser(technicianId, "user");
    if (technician.userType !== "Technician")
      throw new Error("Only a Technician may begin work on a request.");

    request.beginWork(technicianId, comment);
    await this.#persistRequests();
    await this.#persistHistoryFor(request);
    await this.#recordAudit(technicianId, "Status Changed", requestId, "Status changed to In Progress.");
    return request;
  }

  async addProgressNote(requestId, technicianId, comment) {
    const request = this.findRequestById(requestId);
    if (!request) throw new Error(`No request found with ID "${requestId}".`);

    const technician = this.#requireRegisteredUser(technicianId, "user");
    if (technician.userType !== "Technician")
      throw new Error("Only a Technician may update work progress.");

    request.addProgressNote(technicianId, comment);
    await this.#persistRequests();
    await this.#persistHistoryFor(request);
    await this.#recordAudit(technicianId, "Progress Update", requestId, comment);
    return request;
  }

  async resolveRequest(requestId, technicianId, comment = "") {
    const request = this.findRequestById(requestId);
    if (!request) throw new Error(`No request found with ID "${requestId}".`);

    const technician = this.#requireRegisteredUser(technicianId, "user");
    if (technician.userType !== "Technician")
      throw new Error("Only a Technician may resolve a request.");

    request.resolveRequest(technicianId, comment);
    await this.#persistRequests();
    await this.#persistHistoryFor(request);
    await this.#recordAudit(technicianId, "Request Resolved", requestId, comment || "Request resolved.");
    return request;
  }

  async closeRequest(requestId, officerId, comment = "") {
    const request = this.findRequestById(requestId);
    if (!request) throw new Error(`No request found with ID "${requestId}".`);

    const officer = this.#requireRegisteredUser(officerId, "user");
    if (officer.userType !== "Service Officer")
      throw new Error("Only a Service Officer may close a resolved request.");

    request.closeRequest(officerId, comment);
    await this.#persistRequests();
    await this.#persistHistoryFor(request);
    await this.#recordAudit(officerId, "Request Closed", requestId, comment || "Request closed.");
    return request;
  }

  // ---- Search, filter and sort (unchanged from Credit level) ----

  searchRequests(searchText) {
    if (!searchText || searchText.trim() === "") return [];
    const text = searchText.trim().toLowerCase();
    return this.#requests.filter((r) =>
      r.title.toLowerCase().includes(text) ||
      r.description.toLowerCase().includes(text) ||
      r.location.toLowerCase().includes(text) ||
      r.category.toLowerCase().includes(text) ||
      r.requestId.toLowerCase().includes(text)
    );
  }

  filterByCategory(category) {
    return this.#requests.filter((r) => r.category === category);
  }

  filterByStatus(status) {
    return this.#requests.filter((r) => r.status === status);
  }

  filterByPriority(priority) {
    return this.#requests.filter((r) => r.priority === priority);
  }

  filterByTechnician(technicianId) {
    if (!technicianId) return [];
    return this.#requests.filter((r) => r.assignedTechnicianId === technicianId);
  }

  sortByDateSubmitted(ascending = true) {
    const copy = [...this.#requests];
    copy.sort((a, b) => ascending ? a.dateSubmitted - b.dateSubmitted : b.dateSubmitted - a.dateSubmitted);
    return copy;
  }

  sortByPriority(descending = true) {
    const copy = [...this.#requests];
    copy.sort((a, b) =>
      descending
        ? b.calculatePriorityScore() - a.calculatePriorityScore()
        : a.calculatePriorityScore() - b.calculatePriorityScore()
    );
    return copy;
  }

  getRequestSummaryByStatus() {
    const summary = {};
    for (const status of STATUSES) summary[status] = 0;
    for (const request of this.#requests) summary[request.status] = (summary[request.status] || 0) + 1;
    return summary;
  }

  // ---- Distinction: management reports ----
  // All read-only, computed from the in-memory #requests array using
  // filter()/map()/reduce()/sort() - no persistence involved, since a
  // report is a VIEW of existing data, not new data of its own.

  getReportByStatus() {
    return this.getRequestSummaryByStatus();
  }

  getReportByCategory() {
    return CATEGORIES.reduce((summary, category) => {
      summary[category] = this.#requests.filter((r) => r.category === category).length;
      return summary;
    }, {});
  }

  getReportByPriority() {
    return PRIORITIES.reduce((summary, priority) => {
      summary[priority] = this.#requests.filter((r) => r.priority === priority).length;
      return summary;
    }, {});
  }

  getUrgentRequestsReport() {
    return this.#requests
      .filter((r) => r.priority === "Urgent" && OPEN_STATUSES.includes(r.status))
      .sort((a, b) => a.dateSubmitted - b.dateSubmitted);
  }

  getOverdueRequestsReport() {
    const now = Date.now();
    return this.#requests
      .filter((r) => OPEN_STATUSES.includes(r.status))
      .map((r) => {
        const elapsedHours = (now - r.dateSubmitted.getTime()) / (1000 * 60 * 60);
        const targetHours = r.getTargetResolutionHours();
        return { request: r, elapsedHours, targetHours, hoursOverdue: elapsedHours - targetHours };
      })
      .filter((entry) => entry.hoursOverdue > 0)
      .sort((a, b) => b.hoursOverdue - a.hoursOverdue);
  }

  getRequestsByTechnicianReport() {
    return this.#requests
      .filter((r) => r.assignedTechnicianId)
      .reduce((groups, r) => {
        const key = r.assignedTechnicianId;
        if (!groups[key]) groups[key] = [];
        groups[key].push(r);
        return groups;
      }, {});
  }

  getCompletedRequestsByTechnicianReport() {
    return this.#requests
      .filter((r) => r.assignedTechnicianId && (r.status === "Resolved" || r.status === "Closed"))
      .reduce((groups, r) => {
        const key = r.assignedTechnicianId;
        if (!groups[key]) groups[key] = [];
        groups[key].push(r);
        return groups;
      }, {});
  }

  getAverageResolutionTimeReport() {
    const completed = this.#requests.filter((r) => r.status === "Resolved" || r.status === "Closed");
    if (completed.length === 0) return { completedCount: 0, averageHours: null };

    const totalHours = completed.reduce(
      (sum, r) => sum + (r.dateUpdated.getTime() - r.dateSubmitted.getTime()) / (1000 * 60 * 60),
      0
    );
    return { completedCount: completed.length, averageHours: totalHours / completed.length };
  }

  getRequestVolumeByLocationReport() {
    return this.#requests.reduce((summary, r) => {
      summary[r.location] = (summary[r.location] || 0) + 1;
      return summary;
    }, {});
  }
}
