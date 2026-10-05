export const USER_TYPES = Object.freeze([
  "Student",
  "Staff",
  "Service Officer",
  "Technician",
  "Administrator"
]);

export class User {
  #userId;
  #firstName;
  #lastName;
  #email;
  #userType;

  constructor(userId, firstName, lastName, email, userType) {
    this.userId = userId;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.userType = userType;
  }

  get userId() { return this.#userId; }
  get firstName() { return this.#firstName; }
  get lastName() { return this.#lastName; }
  get email() { return this.#email; }
  get userType() { return this.#userType; }

  set userId(value) {
    if (typeof value !== "string" || value.trim() === "")
      throw new Error("User ID is required.");
    this.#userId = value.trim();
  }

  set firstName(value) {
    if (typeof value !== "string" || value.trim() === "")
      throw new Error("First name is required.");
    this.#firstName = value.trim();
  }

  set email(value) {
    if (typeof value !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
      throw new Error("Invalid email address.");
    this.#email = value.trim();
  }

  set lastName(value) {
    if (typeof value !== "string" || value.trim() === "")
      throw new Error("Last name is required.");
    this.#lastName = value.trim();
  }

  set userType(value) {
    if (!USER_TYPES.includes(value))
      throw new Error(`User type must be one of: ${USER_TYPES.join(", ")}`);
    this.#userType = value;
  }

  getFullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  validate() {
    const errors = [];
    if (!this.#userId) errors.push("User ID is required.");
    if (!this.#firstName) errors.push("First name is required.");
    if (!this.#lastName) errors.push("Last name is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.#email ?? "")) errors.push("Invalid email address.");
    if (!USER_TYPES.includes(this.#userType)) errors.push(`User type must be one of: ${USER_TYPES.join(", ")}`);
    return errors;
  }

  displayInfo() {
    return `User ID: ${this.userId}\nName: ${this.getFullName()}\nEmail: ${this.email}\nType: ${this.userType}`;
  }

  // ---- Distinction: JSON persistence ----
  // Produces the plain, serialisable snapshot written to users.json.
  // Subclasses override this (calling super.toJSON() first) to add
  // their own specialised fields. userType is what UserFactory uses to
  // decide which subclass to rebuild when the file is reloaded.
  toJSON() {
    return {
      userId: this.#userId,
      firstName: this.#firstName,
      lastName: this.#lastName,
      email: this.#email,
      userType: this.#userType
    };
  }
}
