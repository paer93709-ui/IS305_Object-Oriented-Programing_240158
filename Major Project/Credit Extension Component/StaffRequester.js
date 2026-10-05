import { User } from "./User.js";

/**
 * StaffRequester.js
 * A staff member who submits campus service requests. Extends User with
 * a department field.
 */
export class StaffRequester extends User {
  #department;

  constructor(userId, firstName, lastName, email, department) {
    super(userId, firstName, lastName, email, "Staff");
    this.department = department;
  }

  get department() {
    return this.#department;
  }

  set department(value) {
    if (typeof value !== "string" || value.trim() === "")
      throw new Error("Department is required.");
    this.#department = value.trim();
  }

  displayInfo() {
    return super.displayInfo() + `\nDepartment: ${this.#department}`;
  }
}
