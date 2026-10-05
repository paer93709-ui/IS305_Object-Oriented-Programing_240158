import { ServiceRequest, PRIORITY_SCORES, DEFAULT_TARGET_HOURS_BY_PRIORITY } from "./ServiceRequest.js";

export const HYGIENE_RISKS = Object.freeze(["Low", "Medium", "High"]);
export const CLEANING_SERVICE_TYPES = Object.freeze([
  "Routine Cleaning",
  "Spill Cleanup",
  "Deep Cleaning",
  "Waste Removal",
  "Pest Control"
]);

/**
 * CleaningRequest.js
 * A specialised ServiceRequest for Cleaning and Sanitation issues:
 * cleaning area, hygiene risk, service type and preferred service time.
 */
export class CleaningRequest extends ServiceRequest {
  #cleaningArea;
  #hygieneRisk;
  #serviceType;
  #preferredServiceTime;

  /**
   * @param {object} commonRequestData - { requestId, requester, title, description, location, priority }
   * @param {object} specialisedData - { cleaningArea, hygieneRisk, serviceType, preferredServiceTime }
   */
  constructor(commonRequestData, specialisedData) {
    const { requestId, requester, title, description, location, priority } = commonRequestData;
    super(requestId, requester, title, description, location, "Cleaning and Sanitation", priority);

    const { cleaningArea, hygieneRisk, serviceType, preferredServiceTime } = specialisedData || {};
    this.cleaningArea = cleaningArea;
    this.hygieneRisk = hygieneRisk;
    this.serviceType = serviceType;
    this.preferredServiceTime = preferredServiceTime;
  }

  get cleaningArea() { return this.#cleaningArea; }
  get hygieneRisk() { return this.#hygieneRisk; }
  get serviceType() { return this.#serviceType; }
  get preferredServiceTime() { return this.#preferredServiceTime; }

  set cleaningArea(value) {
    if (typeof value !== "string" || value.trim() === "")
      throw new Error("Cleaning area is required.");
    this.#cleaningArea = value.trim();
  }

  set hygieneRisk(value) {
    if (!HYGIENE_RISKS.includes(value))
      throw new Error(`Hygiene risk must be one of: ${HYGIENE_RISKS.join(", ")}`);
    this.#hygieneRisk = value;
  }

  set serviceType(value) {
    if (!CLEANING_SERVICE_TYPES.includes(value))
      throw new Error(`Service type must be one of: ${CLEANING_SERVICE_TYPES.join(", ")}`);
    this.#serviceType = value;
  }

  set preferredServiceTime(value) {
    if (typeof value !== "string" || value.trim() === "")
      throw new Error("Preferred service time is required.");
    this.#preferredServiceTime = value.trim();
  }

  validate() {
    const errors = super.validate();
    if (!this.#cleaningArea || this.#cleaningArea.trim() === "")
      errors.push("Cleaning area is required.");
    if (!HYGIENE_RISKS.includes(this.#hygieneRisk))
      errors.push(`Hygiene risk must be one of: ${HYGIENE_RISKS.join(", ")}`);
    if (!CLEANING_SERVICE_TYPES.includes(this.#serviceType))
      errors.push(`Service type must be one of: ${CLEANING_SERVICE_TYPES.join(", ")}`);
    if (!this.#preferredServiceTime || this.#preferredServiceTime.trim() === "")
      errors.push("Preferred service time is required.");
    return errors;
  }

  // ---- Abstract-method implementations (no super call - see ServiceRequest.js) ----

  calculatePriorityScore() {
    const baseScore = PRIORITY_SCORES[this.priority] ?? 0;
    return this.#hygieneRisk === "High" ? baseScore + 2 : baseScore;
  }

  getTargetResolutionHours() {
    const baseHours = DEFAULT_TARGET_HOURS_BY_PRIORITY[this.priority] ?? 72;
    return this.#hygieneRisk === "High" ? Math.min(baseHours, 2) : baseHours;
  }

  getRequestSummary() {
    return `Request ID: ${this.requestId}
Type: Cleaning Request
Title: ${this.title}
Requester: ${this.requester.getFullName()} (${this.requester.userId})
Category: ${this.category}
Priority: ${this.priority}
Status: ${this.status}
Assigned Technician: ${this.assignedTechnicianId ?? "Not yet assigned"}
Location: ${this.location}
Description: ${this.description}
Cleaning Area: ${this.#cleaningArea}
Hygiene Risk: ${this.#hygieneRisk}
Service Type: ${this.#serviceType}
Preferred Service Time: ${this.#preferredServiceTime}
Target Resolution: ${this.getTargetResolutionHours()} hours
Priority Score: ${this.calculatePriorityScore()}
Submitted: ${this.dateSubmitted.toLocaleString()}
Updated: ${this.dateUpdated.toLocaleString()}`;
  }

  // ---- JSON persistence ----
  toJSON() {
    return {
      ...super.toJSON(),
      cleaningArea: this.#cleaningArea,
      hygieneRisk: this.#hygieneRisk,
      serviceType: this.#serviceType,
      preferredServiceTime: this.#preferredServiceTime
    };
  }
}
