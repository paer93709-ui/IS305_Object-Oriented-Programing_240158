import { ServiceRequest } from "./ServiceRequest.js";

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

  // Overrides ServiceRequest.validate() to also check the specialised
  // fields, on top of everything the base class already validates.
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

  // Override: a High hygiene risk (e.g. biohazard spill) gets a much
  // tighter resolution target regardless of the request's priority.
  getTargetResolutionHours() {
    const baseHours = super.getTargetResolutionHours();
    return this.#hygieneRisk === "High" ? Math.min(baseHours, 2) : baseHours;
  }

  // Override: include the cleaning-specific fields in the summary.
  getRequestSummary() {
    return (
      super.getRequestSummary() +
      `\nCleaning Area: ${this.#cleaningArea}` +
      `\nHygiene Risk: ${this.#hygieneRisk}` +
      `\nService Type: ${this.#serviceType}` +
      `\nPreferred Service Time: ${this.#preferredServiceTime}`
    );
  }
}
