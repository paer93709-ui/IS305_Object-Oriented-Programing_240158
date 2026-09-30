/*
  Program: Dining Meal Booking Feature - Lab 3 Distinction
  Student Name: Raymond Pae
  Student ID: 240158

  Description:
  MealBooking stores meal information and a reference to
  a Student object. The student's DiningAccount is used
  to process meal payments.
*/

class MealBooking {
  #student;
  #mealDate;
  #mealType;
  #quantity;
  #dietaryNote;
  #bookingStatus;
  #paymentProcessed;

  constructor(
    student,
    mealDate,
    mealType,
    quantity,
    dietaryNote
  ) {
    if (!student || typeof student.getFullName !== "function") {
      throw new Error("A valid Student object is required.");
    }

    this.#student = student;
    this.#mealDate = mealDate;
    this.#mealType = mealType;
    this.#quantity = quantity;
    this.#dietaryNote = dietaryNote || "";
    this.#bookingStatus = "Pending";
    this.#paymentProcessed = false;
  }

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

  get paymentProcessed() {
    return this.#paymentProcessed;
  }

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

  validate() {
    const validMealTypes = [
      "Breakfast",
      "Lunch",
      "Dinner"
    ];

    if (!this.#student) {
      throw new Error("Student information is required.");
    }

    this.#student.validate();

    if (!this.#mealDate || this.#mealDate.trim() === "") {
      throw new Error("Meal date is required.");
    }

    if (!validMealTypes.includes(this.#mealType)) {
      throw new Error(
        "Invalid meal type. Choose Breakfast, Lunch or Dinner."
      );
    }

    if (
      !Number.isInteger(this.#quantity) ||
      this.#quantity < 1
    ) {
      throw new Error("Quantity must be at least 1.");
    }

    return true;
  }

  getMealPrice() {
    if (this.#mealType === "Breakfast") {
      return 10;
    }

    if (this.#mealType === "Lunch") {
      return 15;
    }

    if (this.#mealType === "Dinner") {
      return 20;
    }

    return 0;
  }

  calculateTotal() {
    return this.getMealPrice() * this.#quantity;
  }

  processPayment() {
    this.validate();

    if (this.#paymentProcessed) {
      throw new Error(
        "Duplicate payment prevented. This booking has already been paid."
      );
    }

    const account = this.#student.diningAccount;

    if (!account) {
      throw new Error(
        "No dining account is assigned to this student."
      );
    }

    const total = this.calculateTotal();

    try {
      account.payForMeal(
        total,
        `${this.#mealType} booking - ${this.#mealDate}`
      );

      this.#paymentProcessed = true;
      this.#bookingStatus = "Confirmed";

      return true;
    } catch (error) {
      this.#bookingStatus = "Pending";
      this.#paymentProcessed = false;

      throw new Error(
        `Payment failed. Booking remains Pending. ${error.message}`
      );
    }
  }

  confirmBooking() {
    if (this.#paymentProcessed) {
      this.#bookingStatus = "Confirmed";
      return;
    }

    throw new Error(
      "Booking cannot be confirmed before successful payment."
    );
  }

  cancelBooking() {
    if (this.#bookingStatus === "Cancelled") {
      throw new Error("Booking is already cancelled.");
    }

    if (this.#paymentProcessed) {
      throw new Error(
        "A paid booking cannot be cancelled without a refund process."
      );
    }

    this.#bookingStatus = "Cancelled";
  }

  getSummary() {
    return `
========================================
             BOOKING RECEIPT
========================================
Student ID: ${this.#student.studentId}
Student Name: ${this.#student.getFullName()}
Meal Date: ${this.#mealDate}
Meal Type: ${this.#mealType}
Quantity: ${this.#quantity}
Meal Price: K${this.getMealPrice().toFixed(2)}
Dietary Note: ${this.#dietaryNote || "None"}
Booking Status: ${this.#bookingStatus}
Payment Processed: ${this.#paymentProcessed ? "Yes" : "No"}
Total Cost: K${this.calculateTotal().toFixed(2)}
========================================
`;
  }
}

module.exports = MealBooking;
