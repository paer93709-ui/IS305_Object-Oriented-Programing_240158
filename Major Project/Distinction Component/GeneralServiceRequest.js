import { ServiceRequest, PRIORITY_SCORES, DEFAULT_TARGET_HOURS_BY_PRIORITY } from "./ServiceRequest.js";

/**
 * GeneralServiceRequest.js
 * A specialised ServiceRequest for the "General Campus Service" category
 * - anything that doesn't fit ICT Support, Facilities Maintenance or
 * Cleaning and Sanitation.
 *
 * Note: at Credit level, "General Campus Service" was submitted as a
 * plain ServiceRequest, since the base class still had working default
 * behaviour. At Distinction level, ServiceRequest.calculatePriorityScore(),
 * getTargetResolutionHours() and getRequestSummary() are abstract-style
 * (they throw) - so every category, including this one, now needs its
 * own concrete subclass. This class exists to fill that gap.
 */
export class GeneralServiceRequest extends ServiceRequest {
  #additionalNotes;

  /**
   * @param {object} commonRequestData - { requestId, requester, title, description, location, priority }
   * @param {object} specialisedData - { additionalNotes? } (optional free-text context)
   */
  constructor(commonRequestData, specialisedData) {
    const { requestId, requester, title, description, location, priority } = commonRequestData;
    super(requestId, requester, title, description, location, "General Campus Service", priority);

    const { additionalNotes } = specialisedData || {};
    this.additionalNotes = additionalNotes ?? "";
  }

  get additionalNotes() { return this.#additionalNotes; }

  set additionalNotes(value) {
    // Optional field - allowed to be an empty string, but must be a string.
    if (typeof value !== "string")
      throw new Error("Additional notes must be text.");
    this.#additionalNotes = value.trim();
  }

  validate() {
    const errors = super.validate();
    if (this.category !== "General Campus Service")
      errors.push('GeneralServiceRequest category must be "General Campus Service".');
    return errors;
  }

  // ---- Abstract-method implementations (no super call - see ServiceRequest.js) ----

  calculatePriorityScore() {
    return PRIORITY_SCORES[this.priority] ?? 0;
  }

  getTargetResolutionHours() {
    return DEFAULT_TARGET_HOURS_BY_PRIORITY[this.priority] ?? 72;
  }

  getRequestSummary() {
    return `Request ID: ${this.requestId}
Type: General Campus Service Request
Title: ${this.title}
Requester: ${this.requester.getFullName()} (${this.requester.userId})
Category: ${this.category}
Priority: ${this.priority}
Status: ${this.status}
Assigned Technician: ${this.assignedTechnicianId ?? "Not yet assigned"}
Location: ${this.location}
Description: ${this.description}
Additional Notes: ${this.#additionalNotes || "None"}
Target Resolution: ${this.getTargetResolutionHours()} hours
Priority Score: ${this.calculatePriorityScore()}
Submitted: ${this.dateSubmitted.toLocaleString()}
Updated: ${this.dateUpdated.toLocaleString()}`;
  }

  // ---- JSON persistence ----
  toJSON() {
    return {
      ...super.toJSON(),
      additionalNotes: this.#additionalNotes
    };
  }
}
