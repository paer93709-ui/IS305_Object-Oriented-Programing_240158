import { User } from "./User.js";
import { ServiceRequest, STATUSES, PRIORITIES } from "./ServiceRequest.js";

// Priority order used by sortByPriority(), highest first by default.
const PRIORITY_RANK = Object.freeze({ Urgent: 3, High: 2, Normal: 1, Low: 0 });

export class ServiceRequestManager {
  #users;
  #requests;

  constructor() {
    this.#users = [];
    this.#requests = [];
  }

  // ---- User management ----

  registerUser(user) {
    if (!(user instanceof User))
      throw new Error("registerUser() expects a User instance.");

    const errors = user.validate();
    if (errors.length > 0)
      throw new Error(`Cannot register user:\n- ${errors.join("\n- ")}`);

    if (this.findUserById(user.userId))
      throw new Error(`A user with ID "${user.userId}" is already registered.`);

    this.#users.push(user);
    return user;
  }

  findUserById(userId) {
    if (!userId) return null;
    return this.#users.find((u) => u.userId === userId) || null;
  }

  // ---- Request management (Pass level, kept working as before) ----

  submitRequest(request) {
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

  updateRequest(requestId, userId, changes) {
    const request = this.findRequestById(requestId);
    if (!request)
      throw new Error(`No request found with ID "${requestId}".`);

    if (request.requester.userId !== userId)
      throw new Error("You may only update your own requests.");

    request.updateDetails(changes, userId);
    return request;
  }

  cancelRequest(requestId, userId) {
    const request = this.findRequestById(requestId);
    if (!request)
      throw new Error(`No request found with ID "${requestId}".`);

    if (request.requester.userId !== userId)
      throw new Error("You may only cancel your own requests.");

    request.cancelRequest(userId);
    return request;
  }

  // ---- Credit-level workflow ----
  // Each method here is responsible for the ROLE permission check (is
  // this actor even registered, and are they the right kind of user at
  // all?). The STATUS TRANSITION legality and, for technician actions,
  // the "are you the SPECIFIC technician assigned to THIS request"
  // check are enforced inside ServiceRequest itself, since only a
  // request instance knows its own current status and assignment.

  #requireRegisteredUser(userId, label) {
    const user = this.findUserById(userId);
    if (!user) throw new Error(`No registered ${label} found with ID "${userId}".`);
    return user;
  }

  reviewRequest(requestId, officerId, priority, comment = "") {
    const request = this.findRequestById(requestId);
    if (!request) throw new Error(`No request found with ID "${requestId}".`);

    const officer = this.#requireRegisteredUser(officerId, "user");
    if (officer.userType !== "Service Officer")
      throw new Error("Only a Service Officer may review requests.");

    request.reviewRequest(officerId, priority, comment);
    return request;
  }

  assignTechnician(requestId, officerId, technicianId, comment = "") {
    const request = this.findRequestById(requestId);
    if (!request) throw new Error(`No request found with ID "${requestId}".`);

    const officer = this.#requireRegisteredUser(officerId, "user");
    if (officer.userType !== "Service Officer")
      throw new Error("Only a Service Officer may assign a technician.");

    const technician = this.#requireRegisteredUser(technicianId, "user");
    if (technician.userType !== "Technician")
      throw new Error(`User "${technicianId}" is not a registered Technician.`);

    request.assignTechnician(officerId, technicianId, comment);
    return request;
  }

  beginWork(requestId, technicianId, comment = "") {
    const request = this.findRequestById(requestId);
    if (!request) throw new Error(`No request found with ID "${requestId}".`);

    const technician = this.#requireRegisteredUser(technicianId, "user");
    if (technician.userType !== "Technician")
      throw new Error("Only a Technician may begin work on a request.");

    // The "only the ASSIGNED technician" check happens inside
    // request.beginWork() itself, since only the request knows who it
    // was assigned to.
    request.beginWork(technicianId, comment);
    return request;
  }

  addProgressNote(requestId, technicianId, comment) {
    const request = this.findRequestById(requestId);
    if (!request) throw new Error(`No request found with ID "${requestId}".`);

    const technician = this.#requireRegisteredUser(technicianId, "user");
    if (technician.userType !== "Technician")
      throw new Error("Only a Technician may update work progress.");

    request.addProgressNote(technicianId, comment);
    return request;
  }

  resolveRequest(requestId, technicianId, comment = "") {
    const request = this.findRequestById(requestId);
    if (!request) throw new Error(`No request found with ID "${requestId}".`);

    const technician = this.#requireRegisteredUser(technicianId, "user");
    if (technician.userType !== "Technician")
      throw new Error("Only a Technician may resolve a request.");

    request.resolveRequest(technicianId, comment);
    return request;
  }

  closeRequest(requestId, officerId, comment = "") {
    const request = this.findRequestById(requestId);
    if (!request) throw new Error(`No request found with ID "${requestId}".`);

    const officer = this.#requireRegisteredUser(officerId, "user");
    if (officer.userType !== "Service Officer")
      throw new Error("Only a Service Officer may close a resolved request.");

    request.closeRequest(officerId, comment);
    return request;
  }

  // ---- Search, filter and sort ----

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
    copy.sort((a, b) =>
      ascending
        ? a.dateSubmitted - b.dateSubmitted
        : b.dateSubmitted - a.dateSubmitted
    );
    return copy;
  }

  // Sorts by each request's own calculatePriorityScore() (polymorphic -
  // a MaintenanceRequest with a High hazard level can outrank a request
  // that is merely tagged "Urgent"), rather than the raw priority label.
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

    for (const status of STATUSES) {
      summary[status] = 0;
    }

    for (const request of this.#requests) {
      summary[request.status] = (summary[request.status] || 0) + 1;
    }

    return summary;
  }
}
