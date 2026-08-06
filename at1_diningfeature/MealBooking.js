/*
  Program: Dining Meal Booking Feature
  Student Name: Raymond Pae
  Student ID: 240158
*/

class MealBooking {
  #studentId;
  #studentName;
  #mealDate;
  #mealType;
  #quantity;
  #dietaryNote;
  #bookingStatus;

  constructor(studentId, studentName, mealDate, mealType, quantity, dietaryNote) {
    this.#studentId = studentId;
    this.#studentName = studentName;
    this.#mealDate = mealDate;
    this.#mealType = mealType;
    this.#quantity = quantity;
    this.#dietaryNote = dietaryNote;
    this.#bookingStatus = "Pending";
  }

  // ===== VALIDATION METHOD =====
  validate() {
    const validMeals = ["Breakfast", "Lunch", "Dinner"];

    if (!this.#studentId) throw new Error("Student ID is required.");
    if (!this.#studentName) throw new Error("Student name is required.");
    if (!this.#mealDate) throw new Error("Meal date is required.");
    if (!validMeals.includes(this.#mealType))
      throw new Error("Invalid meal type. Choose Breakfast, Lunch or Dinner.");
    if (this.#quantity < 1)
      throw new Error("Quantity must be at least 1.");
  }

  // ===== CALCULATE TOTAL =====
  calculateTotal() {
    let price = 0;
    if (this.#mealType === "Breakfast") price = 10;
    else if (this.#mealType === "Lunch") price = 15;
    else if (this.#mealType === "Dinner") price = 20;

    return price * this.#quantity;
  }

  // ===== CONTROL METHODS =====
  confirmBooking() {
    this.#bookingStatus = "Confirmed";
  }

  cancelBooking() {
    this.#bookingStatus = "Cancelled";
  }

  // ===== GETTERS =====
  get studentId() { return this.#studentId; }
  get mealDate() { return this.#mealDate; }
  get mealType() { return this.#mealType; }

  // ===== SUMMARY =====
  getSummary() {
    return `
========================================
          BOOKING RECEIPT
========================================
Student: ${this.#studentName} (${this.#studentId})
Meal: ${this.#mealType} x ${this.#quantity}
Date: ${this.#mealDate}
Dietary note: ${this.#dietaryNote}
Status: ${this.#bookingStatus}
Total cost: K${this.calculateTotal().toFixed(2)}
========================================
`;
  }
}

module.exports = MealBooking;
