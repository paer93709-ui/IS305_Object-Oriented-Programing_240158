import { User } from "./User.js";

export const CATEGORIES = Object.freeze([
  "ICT Support",
  "Facilities Maintenance",
  "Cleaning and Sanitation",
  "General Campus Service"
]);

export const PRIORITIES = Object.freeze(["Low", "Normal", "High", "Urgent"]);

// Credit extension: the full workflow status list. Cancelled is a final
// status reachable only from Submitted (see cancelRequest()).
export const STATUSES = Object.freeze([
  "Submitted",
  "Reviewed",
  "Assigned",
  "In Progress",
  "Resolved",
  "Closed",
  "Cancelled"
]);

// Default target resolution windows used by the base class's
// getTargetResolutionHours(). Specialised subclasses may override this
// method entirely to factor in hazard level, network impact, etc.
const DEFAULT_TARGET_HOURS_BY_PRIORITY = Object.freeze({
  Low: 120,
  Normal: 72,
  High: 24,
  Urgent: 4
});

// Base numeric weight per priority, used by calculatePriorityScore().
const PRIORITY_SCORES = Object.freeze({
  Low: 1,
  Normal: 2,
  High: 3,
  Urgent: 4
});

export class ServiceRequest {
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
  #assignedTechnicianId;
  #history;

  constructor(requestId, requester, title, description, location, category, priority = "Normal") {
    this.requestId = requestId;
    this.requester = requester;
    this.title = title;
    this.description = description;
    this.location = location;
    this.category = category;
    this.priority = priority;
    this.#status = "Submitted";
    this.#dateSubmitted = new Date();
    this.#dateUpdated = new Date();
    this.#assignedTechnicianId = null;
    this.#history = [];

    this.#recordHistory(null, "Submitted", "Submitted", requester ? requester.userId : null, "Request submitted.");
  }

  // ---- Getters ----
  get requestId() { return this.#requestId; }
  get requester() { return this.#requester; }
  get title() { return this.#title; }
  get description() { return this.#description; }
  get location() { return this.#location; }
  get category() { return this.#category; }
  get priority() { return this.#priority; }
  get status() { return this.#status; }
  get dateSubmitted() { return this.#dateSubmitted; }
  get dateUpdated() { return this.#dateUpdated; }
  get assignedTechnicianId() { return this.#assignedTechnicianId; }

  // Returns a copy of the history array so callers can't mutate the
  // request's internal record directly (same safety pattern used by
  // ServiceRequestManager.getAllRequests()).
  get history() { return [...this.#history]; }

  // ---- Controlled setters ----
  set requestId(value) {
    if (typeof value !== "string" || value.trim() === "")
      throw new Error("Request ID is required.");
    this.#requestId = value.trim();
  }

  set requester(value) {
    if (!(value instanceof User))
      throw new Error("Requester must be a valid registered User.");
    this.#requester = value;
  }

  set title(value) {
    if (typeof value !== "string" || value.trim() === "")
      throw new Error("Request title is required.");
    this.#title = value.trim();
  }

  set description(value) {
    if (typeof value !== "string" || value.trim() === "")
      throw new Error("Request description is required.");
    this.#description = value.trim();
  }

  set location(value) {
    if (typeof value !== "string" || value.trim() === "")
      throw new Error("Campus location is required.");
    this.#location = value.trim();
  }

  set category(value) {
    if (!CATEGORIES.includes(value))
      throw new Error(`Category must be one of: ${CATEGORIES.join(", ")}`);
    this.#category = value;
  }

  set priority(value) {
    if (!PRIORITIES.includes(value))
      throw new Error(`Priority must be one of: ${PRIORITIES.join(", ")}`);
    this.#priority = value;
  }

  // ---- Private helper ----
  // Not exposed publicly; every status-affecting method below funnels
  // through here so every change is recorded consistently.
  #recordHistory(previousStatus, newStatus, action, actorId, comment = "") {
    this.#history.push({
      previousStatus,
      newStatus,
      action,
      actorId: actorId ?? null,
      comment: comment ?? "",
      dateTime: new Date()
    });
  }

  // ---- Validation ----
  validate() {
    const errors = [];
    if (!this.#requestId || this.#requestId.trim() === "")
      errors.push("Request ID is required.");
    if (!(this.#requester instanceof User))
      errors.push("A valid registered requester is required.");
    if (!this.#title || this.#title.trim() === "")
      errors.push("Request title is required.");
    if (!this.#description || this.#description.trim() === "")
      errors.push("Request description is required.");
    if (!this.#location || this.#location.trim() === "")
      errors.push("Campus location is required.");
    if (!CATEGORIES.includes(this.#category))
      errors.push(`Category must be one of: ${CATEGORIES.join(", ")}`);
    if (!PRIORITIES.includes(this.#priority))
      errors.push(`Priority must be one of: ${PRIORITIES.join(", ")}`);
    return errors;
  }

  // ---- Pass-level behaviour (tightened for the Credit status list) ----

  updateDetails(changes = {}, actorId = null) {
    if (this.#status !== "Submitted")
      throw new Error("Only a Submitted request can be updated.");

    const { title, description, location, category, priority } = changes;
    if (title !== undefined) this.title = title;
    if (description !== undefined) this.description = description;
    if (location !== undefined) this.location = location;
    if (category !== undefined) this.category = category;
    if (priority !== undefined) this.priority = priority;

    this.#dateUpdated = new Date();
    this.#recordHistory(this.#status, this.#status, "Updated Details", actorId, "Requester updated request details.");
  }

  cancelRequest(actorId = null, comment = "") {
    if (this.#status === "Cancelled")
      throw new Error("This request has already been cancelled.");
    if (this.#status !== "Submitted")
      throw new Error("Only a Submitted request can be cancelled.");

    this.#recordHistory(this.#status, "Cancelled", "Cancelled", actorId, comment);
    this.#status = "Cancelled";
    this.#dateUpdated = new Date();
  }

  // ---- Credit-level workflow ----
  // Role permission checks (is this actor even a Service Officer / the
  // right kind of user at all?) are the responsibility of
  // ServiceRequestManager, which has visibility over registered users.
  // These methods enforce the two things only a ServiceRequest instance
  // can know: whether the transition is legal from its CURRENT status,
  // and (for technician actions) whether this actor is the specific
  // technician assigned to THIS request.

  reviewRequest(actorId, priority, comment = "") {
    if (this.#status !== "Submitted")
      throw new Error("Only a Submitted request can be reviewed.");

    if (priority !== undefined) this.priority = priority;

    this.#recordHistory("Submitted", "Reviewed", "Reviewed", actorId, comment);
    this.#status = "Reviewed";
    this.#dateUpdated = new Date();
  }

  assignTechnician(actorId, technicianId, comment = "") {
    if (this.#status !== "Reviewed")
      throw new Error("Only a Reviewed request can have a technician assigned.");
    if (!technicianId || String(technicianId).trim() === "")
      throw new Error("A technician ID is required.");

    this.#assignedTechnicianId = technicianId;
    this.#recordHistory("Reviewed", "Assigned", "Assigned Technician", actorId, comment || `Assigned to technician ${technicianId}.`);
    this.#status = "Assigned";
    this.#dateUpdated = new Date();
  }

  beginWork(actorId, comment = "") {
    if (this.#status !== "Assigned")
      throw new Error("Only an Assigned request can be started.");
    if (actorId !== this.#assignedTechnicianId)
      throw new Error("Only the assigned technician may begin work on this request.");

    this.#recordHistory("Assigned", "In Progress", "Started Work", actorId, comment);
    this.#status = "In Progress";
    this.#dateUpdated = new Date();
  }

  addProgressNote(actorId, comment) {
    if (this.#status !== "In Progress")
      throw new Error("Progress notes can only be added while a request is In Progress.");
    if (actorId !== this.#assignedTechnicianId)
      throw new Error("Only the assigned technician may add progress notes.");
    if (!comment || comment.trim() === "")
      throw new Error("A progress comment is required.");

    this.#recordHistory("In Progress", "In Progress", "Progress Note", actorId, comment);
    this.#dateUpdated = new Date();
  }

  resolveRequest(actorId, comment = "") {
    if (this.#status !== "In Progress")
      throw new Error("Only an In Progress request can be resolved.");
    if (actorId !== this.#assignedTechnicianId)
      throw new Error("Only the assigned technician may resolve this request.");

    this.#recordHistory("In Progress", "Resolved", "Resolved", actorId, comment);
    this.#status = "Resolved";
    this.#dateUpdated = new Date();
  }

  closeRequest(actorId, comment = "") {
    if (this.#status !== "Resolved")
      throw new Error("Only a Resolved request can be closed.");

    this.#recordHistory("Resolved", "Closed", "Closed", actorId, comment);
    this.#status = "Closed";
    this.#dateUpdated = new Date();
  }

  // ---- Polymorphism hooks ----
  // Base implementations here; specialised subclasses override these to
  // factor in their own specialised fields (hazard level, network
  // impact, hygiene risk, etc).

  calculatePriorityScore() {
    return PRIORITY_SCORES[this.#priority] ?? 0;
  }

  getTargetResolutionHours() {
    return DEFAULT_TARGET_HOURS_BY_PRIORITY[this.#priority] ?? 72;
  }

  getRequestSummary() {
    return `Request ID: ${this.requestId}
Title: ${this.title}
Requester: ${this.requester.getFullName()} (${this.requester.userId})
Category: ${this.category}
Priority: ${this.priority}
Status: ${this.status}
Assigned Technician: ${this.assignedTechnicianId ?? "Not yet assigned"}
Location: ${this.location}
Description: ${this.description}
Target Resolution: ${this.getTargetResolutionHours()} hours
Submitted: ${this.dateSubmitted.toLocaleString()}
Updated: ${this.dateUpdated.toLocaleString()}`;
  }
}
