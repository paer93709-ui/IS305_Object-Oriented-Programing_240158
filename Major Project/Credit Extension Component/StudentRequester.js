import { User } from "./User.js";

/**
 * StudentRequester.js
 * A student who submits campus service requests. Extends User with
 * programme and year-level information.
 */
export class StudentRequester extends User {
  #programme;
  #yearLevel;

  constructor(userId, firstName, lastName, email, programme, yearLevel) {
    // Constructor chaining: the base User fields and their validation are
    // handled entirely by super(), keeping that logic in one place.
    super(userId, firstName, lastName, email, "Student");
    this.programme = programme;
    this.yearLevel = yearLevel;
  }

  get programme() {
    return this.#programme;
  }

  set programme(value) {
    if (typeof value !== "string" || value.trim() === "")
      throw new Error("Programme is required.");
    this.#programme = value.trim();
  }

  get yearLevel() {
    return this.#yearLevel;
  }

  set yearLevel(value) {
    const num = Number(value);
    if (!Number.isInteger(num) || num < 1 || num > 6)
      throw new Error("Year level must be a whole number between 1 and 6.");
    this.#yearLevel = num;
  }

  // Overrides User.displayInfo() to include the specialised fields.
  displayInfo() {
    return (
      super.displayInfo() +
      `\nProgramme : ${this.#programme}` +
      `\nYear Level: ${this.#yearLevel}`
    );
  }
}
