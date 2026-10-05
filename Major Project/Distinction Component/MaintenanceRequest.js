import { ServiceRequest, PRIORITY_SCORES, DEFAULT_TARGET_HOURS_BY_PRIORITY } from "./ServiceRequest.js";

export const HAZARD_LEVELS = Object.freeze(["None", "Low", "Medium", "High"]);

/**
 * MaintenanceRequest.js
 * A specialised ServiceRequest for Facilities Maintenance issues:
 * building, room number, hazard level and equipment affected.
 */
export class MaintenanceRequest extends ServiceRequest {
  #building;
  #roomNumber;
  #hazardLevel;
  #equipmentAffected;

  /**
   * @param {object} commonRequestData - { requestId, requester, title, description, location, priority }
   * @param {object} specialisedData - { building, roomNumber, hazardLevel, equipmentAffected }
   */
  constructor(commonRequestData, specialisedData) {
    const { requestId, requester, title, description, location, priority } = commonRequestData;
    super(requestId, requester, title, description, location, "Facilities Maintenance", priority);

    const { building, roomNumber, hazardLevel, equipmentAffected } = specialisedData || {};
    this.building = building;
    this.roomNumber = roomNumber;
    this.hazardLevel = hazardLevel;
    this.equipmentAffected = equipmentAffected;
  }

  get building() { return this.#building; }
  get roomNumber() { return this.#roomNumber; }
  get hazardLevel() { return this.#hazardLevel; }
  get equipmentAffected() { return this.#equipmentAffected; }

  set building(value) {
    if (typeof value !== "string" || value.trim() === "")
      throw new Error("Building is required.");
    this.#building = value.trim();
  }

  set roomNumber(value) {
    if (typeof value !== "string" || value.trim() === "")
      throw new Error("Room number is required.");
    this.#roomNumber = value.trim();
  }

  set hazardLevel(value) {
    if (!HAZARD_LEVELS.includes(value))
      throw new Error(`Hazard level must be one of: ${HAZARD_LEVELS.join(", ")}`);
    this.#hazardLevel = value;
  }

  set equipmentAffected(value) {
    if (typeof value !== "string" || value.trim() === "")
      throw new Error("Equipment affected is required.");
    this.#equipmentAffected = value.trim();
  }

  validate() {
    const errors = super.validate();
    if (!this.#building || this.#building.trim() === "")
      errors.push("Building is required.");
    if (!this.#roomNumber || this.#roomNumber.trim() === "")
      errors.push("Room number is required.");
    if (!HAZARD_LEVELS.includes(this.#hazardLevel))
      errors.push(`Hazard level must be one of: ${HAZARD_LEVELS.join(", ")}`);
    if (!this.#equipmentAffected || this.#equipmentAffected.trim() === "")
      errors.push("Equipment affected is required.");
    return errors;
  }

  // ---- Abstract-method implementations (no super call - see ServiceRequest.js) ----

  calculatePriorityScore() {
    const baseScore = PRIORITY_SCORES[this.priority] ?? 0;
    const hazardBoost = { None: 0, Low: 0, Medium: 1, High: 3 }[this.#hazardLevel] ?? 0;
    return baseScore + hazardBoost;
  }

  getTargetResolutionHours() {
    const baseHours = DEFAULT_TARGET_HOURS_BY_PRIORITY[this.priority] ?? 72;
    if (this.#hazardLevel === "High") return Math.min(baseHours, 2);
    if (this.#hazardLevel === "Medium") return Math.min(baseHours, 12);
    return baseHours;
  }

  getRequestSummary() {
    return `Request ID: ${this.requestId}
Type: Maintenance Request
Title: ${this.title}
Requester: ${this.requester.getFullName()} (${this.requester.userId})
Category: ${this.category}
Priority: ${this.priority}
Status: ${this.status}
Assigned Technician: ${this.assignedTechnicianId ?? "Not yet assigned"}
Location: ${this.location}
Description: ${this.description}
Building: ${this.#building}
Room Number: ${this.#roomNumber}
Hazard Level: ${this.#hazardLevel}
Equipment Affected: ${this.#equipmentAffected}
Target Resolution: ${this.getTargetResolutionHours()} hours
Priority Score: ${this.calculatePriorityScore()}
Submitted: ${this.dateSubmitted.toLocaleString()}
Updated: ${this.dateUpdated.toLocaleString()}`;
  }

  // ---- JSON persistence ----
  toJSON() {
    return {
      ...super.toJSON(),
      building: this.#building,
      roomNumber: this.#roomNumber,
      hazardLevel: this.#hazardLevel,
      equipmentAffected: this.#equipmentAffected
    };
  }
}
