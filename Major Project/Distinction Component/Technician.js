import { User } from "./User.js";

/**
 * Technician.js
 * Carries out assigned work: begins, updates and resolves requests.
 * Extends User with a technical speciality field.
 */
export class Technician extends User {
  #technicalSpeciality;

  constructor(userId, firstName, lastName, email, technicalSpeciality) {
    super(userId, firstName, lastName, email, "Technician");
    this.technicalSpeciality = technicalSpeciality;
  }

  get technicalSpeciality() {
    return this.#technicalSpeciality;
  }

  set technicalSpeciality(value) {
    if (typeof value !== "string" || value.trim() === "")
      throw new Error("Technical speciality is required.");
    this.#technicalSpeciality = value.trim();
  }

  displayInfo() {
    return super.displayInfo() + `\nSpeciality : ${this.#technicalSpeciality}`;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      technicalSpeciality: this.#technicalSpeciality
    };
  }
}
