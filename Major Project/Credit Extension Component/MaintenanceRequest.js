import { ServiceRequest } from "./ServiceRequest.js";

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

  // Overrides ServiceRequest.validate() to also check the specialised
  // fields, on top of everything the base class already validates.
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

  // Override: a High hazard level (e.g. exposed wiring, gas leak) gets a
  // much tighter resolution target regardless of the request's priority.
  getTargetResolutionHours() {
    const baseHours = super.getTargetResolutionHours();
    if (this.#hazardLevel === "High") return Math.min(baseHours, 2);
    if (this.#hazardLevel === "Medium") return Math.min(baseHours, 12);
    return baseHours;
  }

  // Override: hazard level also boosts the priority score, so a
  // dangerous but low-priority-tagged request still ranks higher when
  // sorted by score.
  calculatePriorityScore() {
    const baseScore = super.calculatePriorityScore();
    const hazardBoost = { None: 0, Low: 0, Medium: 1, High: 3 }[this.#hazardLevel] ?? 0;
    return baseScore + hazardBoost;
  }

  // Override: include the maintenance-specific fields in the summary.
  getRequestSummary() {
    return (
      super.getRequestSummary() +
      `\nBuilding: ${this.#building}` +
      `\nRoom Number: ${this.#roomNumber}` +
      `\nHazard Level: ${this.#hazardLevel}` +
      `\nEquipment Affected: ${this.#equipmentAffected}`
    );
  }
}
