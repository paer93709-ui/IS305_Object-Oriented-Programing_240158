import { ServiceRequest, CATEGORIES } from "./ServiceRequest.js";

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

    // Constructor chaining: the base ServiceRequest constructor handles
    // requestId, requester, title, description, location and priority.
    // Category is fixed for this subclass, since an ICTSupportRequest
    // is always "ICT Support" by definition.
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
    // Accept a boolean, or the strings "Yes"/"No" typed by a console user.
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

  // Overrides ServiceRequest.validate() to also check the specialised
  // fields, on top of everything the base class already validates.
  validate() {
    const errors = super.validate();
    if (this.category !== CATEGORIES[0]) {
      // Defensive: this subclass should always be "ICT Support".
      errors.push('ICTSupportRequest category must be "ICT Support".');
    }
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

  // Override: a network-impacting fault gets a much tighter resolution
  // target than the base priority-only calculation would give it.
  getTargetResolutionHours() {
    const baseHours = super.getTargetResolutionHours();
    return this.#networkImpact ? Math.min(baseHours, 4) : baseHours;
  }

  // Override: include the ICT-specific fields in the summary.
  getRequestSummary() {
    return (
      super.getRequestSummary() +
      `\nDevice Type: ${this.#deviceType}` +
      `\nSystem Name: ${this.#systemName}` +
      `\nFault Type: ${this.#faultType}` +
      `\nNetwork Impact: ${this.#networkImpact ? "Yes" : "No"}`
    );
  }
}
