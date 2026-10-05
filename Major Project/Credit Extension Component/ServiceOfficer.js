import { User } from "./User.js";

/**
 * ServiceOfficer.js
 * Reviews requests, sets priority, assigns technicians and closes
 * resolved requests. Extends User with a service section field.
 */
export class ServiceOfficer extends User {
  #serviceSection;

  constructor(userId, firstName, lastName, email, serviceSection) {
    super(userId, firstName, lastName, email, "Service Officer");
    this.serviceSection = serviceSection;
  }

  get serviceSection() {
    return this.#serviceSection;
  }

  set serviceSection(value) {
    if (typeof value !== "string" || value.trim() === "")
      throw new Error("Service section is required.");
    this.#serviceSection = value.trim();
  }

  displayInfo() {
    return super.displayInfo() + `\nService Section: ${this.#serviceSection}`;
  }
}
