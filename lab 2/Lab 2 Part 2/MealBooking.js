/*
  Program: Dining Meal Booking Feature - Lab 2
  Student Name: Raymond Pae
  Student ID: 240158

  Description:
  MealBooking class stores meal information and a reference
  to a Student object.
*/

class MealBooking {
  // Private fields
  #student;
  #mealDate;
  #mealType;
  #quantity;
  #dietaryNote;
  #bookingStatus;

  // Constructor
  constructor(student, mealDate, mealType, quantity, dietaryNote) {

    // Verify that a Student object was provided
    if (!student || typeof student.getFullName !== "function") {
      throw new Error("A valid Student object is required.");
    }

    this.#student = student;
    this.#mealDate = mealDate;
    this.#mealType = mealType;
    this.#quantity = quantity;
    this.#dietaryNote = dietaryNote;
    this.#bookingStatus = "Pending";
  }

  // Getters
  get student() {
    return this.#student;
  }

  get mealDate() {
    return this.#mealDate;
  }

  get mealType() {
    return this.#mealType;
  }

  get quantity() {
    return this.#quantity;
  }

  get dietaryNote() {
    return this.#dietaryNote;
  }

  get bookingStatus() {
    return this.#bookingStatus;
  }

  // Setters
  set mealDate(date) {
    this.#mealDate = date;
  }

  set mealType(type) {
    this.#mealType = type;
  }

  set quantity(qty) {
    this.#quantity = qty;
  }

  set dietaryNote(note) {
    this.#dietaryNote = note;
  }

  // Validate booking information
  validate() {

    const validMealTypes = [
      "Breakfast",
      "Lunch",
      "Dinner"
    ];

    // Check Student object
    if (!this.#student) {
      throw new Error("Student information is required.");
    }

    // Validate Student
    this.#student.validate();

    // Check meal date
    if (!this.#mealDate || this.#mealDate.trim() === "") {
      throw new Error("Meal date is required.");
    }

    // Check meal type
    if (!validMealTypes.includes(this.#mealType)) {
      throw new Error(
        "Invalid meal type. Choose Breakfast, Lunch or Dinner."
      );
    }

    // Check quantity
    if (!Number.isInteger(this.#quantity) || this.#quantity < 1) {
      throw new Error("Quantity must be at least 1.");
    }

    return true;
  }

  // Calculate total cost
  calculateTotal() {

    let price = 0;

    if (this.#mealType === "Breakfast") {
      price = 10;
    }
    else if (this.#mealType === "Lunch") {
      price = 15;
    }
    else if (this.#mealType === "Dinner") {
      price = 20;
    }

    return price * this.#quantity;
  }

  // Confirm booking
  confirmBooking() {

    if (this.#bookingStatus !== "Pending") {
      throw new Error(
        "Only a Pending booking can be confirmed."
      );
    }

    this.#bookingStatus = "Confirmed";
  }

  // Cancel booking
  cancelBooking() {

    if (this.#bookingStatus === "Cancelled") {
      throw new Error("Booking is already cancelled.");
    }

    this.#bookingStatus = "Cancelled";
  }

  // Return booking summary
  getSummary() {

    return `
========================================
             BOOKING RECEIPT
========================================
Student ID: ${this.#student.studentId}
Student Name: ${this.#student.getFullName()}
Meal date: ${this.#mealDate}
Meal type: ${this.#mealType}
Quantity: ${this.#quantity}
Dietary note: ${this.#dietaryNote || "None"}
Booking status: ${this.#bookingStatus}
Total cost: K${this.calculateTotal().toFixed(2)}
========================================
`;
  }
}

module.exports = MealBooking;
