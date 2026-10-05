import { ServiceRequest, PRIORITY_SCORES, DEFAULT_TARGET_HOURS_BY_PRIORITY } from "./ServiceRequest.js";

/**
 * ICTSupportRequest.js
 * A specialised ServiceRequest for ICT Support issues: device type,
 * system name, fault type and whether the network is impacted.
 */
export class ICTSupportRequest extends ServiceRequest {
  #deviceType;
  #systemName;
  #faultType;
  #networkImpact;

  /**
   * @param {object} commonRequestData - { requestId, requester, title, description, location, priority }
   * @param {object} specialisedData - { deviceType, systemName, faultType, networkImpact }
   */
  constructor(commonRequestData, specialisedData) {
    const { requestId, requester, title, description, location, priority } = commonRequestData;
    super(requestId, requester, title, description, location, "ICT Support", priority);

    const { deviceType, systemName, faultType, networkImpact } = specialisedData || {};
    this.deviceType = deviceType;
    this.systemName = systemName;
    this.faultType = faultType;
    this.networkImpact = networkImpact;
  }

  get deviceType() { return this.#deviceType; }
  get systemName() { return this.#systemName; }
  get faultType() { return this.#faultType; }
  get networkImpact() { return this.#networkImpact; }

  set deviceType(value) {
    if (typeof value !== "string" || value.trim() === "")
      throw new Error("Device type is required.");
    this.#deviceType = value.trim();
  }

  set systemName(value) {
    if (typeof value !== "string" || value.trim() === "")
      throw new Error("System name is required.");
    this.#systemName = value.trim();
  }

  set faultType(value) {
    if (typeof value !== "string" || value.trim() === "")
      throw new Error("Fault type is required.");
    this.#faultType = value.trim();
  }

  set networkImpact(value) {
    if (typeof value === "boolean") {
      this.#networkImpact = value;
      return;
    }
    if (typeof value === "string" && ["yes", "no"].includes(value.trim().toLowerCase())) {
      this.#networkImpact = value.trim().toLowerCase() === "yes";
      return;
    }
    throw new Error('Network impact must be true/false or "Yes"/"No".');
  }

  validate() {
    const errors = super.validate();
    if (this.category !== "ICT Support")
      errors.push('ICTSupportRequest category must be "ICT Support".');
    if (!this.#deviceType || this.#deviceType.trim() === "")
      errors.push("Device type is required.");
    if (!this.#systemName || this.#systemName.trim() === "")
      errors.push("System name is required.");
    if (!this.#faultType || this.#faultType.trim() === "")
      errors.push("Fault type is required.");
    if (typeof this.#networkImpact !== "boolean")
      errors.push("Network impact must be recorded as true or false.");
    return errors;
  }

  // ---- Abstract-method implementations (no super call - see ServiceRequest.js) ----

  calculatePriorityScore() {
    const baseScore = PRIORITY_SCORES[this.priority] ?? 0;
    return this.#networkImpact ? baseScore + 2 : baseScore;
  }

  getTargetResolutionHours() {
    const baseHours = DEFAULT_TARGET_HOURS_BY_PRIORITY[this.priority] ?? 72;
    return this.#networkImpact ? Math.min(baseHours, 4) : baseHours;
  }

  getRequestSummary() {
    return `Request ID: ${this.requestId}
Type: ICT Support Request
Title: ${this.title}
Requester: ${this.requester.getFullName()} (${this.requester.userId})
Category: ${this.category}
Priority: ${this.priority}
Status: ${this.status}
Assigned Technician: ${this.assignedTechnicianId ?? "Not yet assigned"}
Location: ${this.location}
Description: ${this.description}
Device Type: ${this.#deviceType}
System Name: ${this.#systemName}
Fault Type: ${this.#faultType}
Network Impact: ${this.#networkImpact ? "Yes" : "No"}
Target Resolution: ${this.getTargetResolutionHours()} hours
Priority Score: ${this.calculatePriorityScore()}
Submitted: ${this.dateSubmitted.toLocaleString()}
Updated: ${this.dateUpdated.toLocaleString()}`;
  }

  // ---- JSON persistence ----
  toJSON() {
    return {
      ...super.toJSON(),
      deviceType: this.#deviceType,
      systemName: this.#systemName,
      faultType: this.#faultType,
      networkImpact: this.#networkImpact
    };
  }
}
