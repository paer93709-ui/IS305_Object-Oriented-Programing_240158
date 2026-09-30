```javascript
/*
  Program: Dining Meal Booking Feature - Lab 2
  Student Name: Raymond Pae
  Student ID: 240158
  Description: Student class for storing student identity
  and connecting Student objects to MealBooking objects.
*/

class Student {
  // Private fields
  #studentId;
  #studentName;
  #bookings;

  constructor(studentId, studentName) {
    this.#studentId = studentId;
    this.#studentName = studentName;
    this.#bookings = [];
  }

  // Getters
  get studentId() {
    return this.#studentId;
  }

  get studentName() {
    return this.#studentName;
  }

  get bookings() {
    return this.#bookings;
  }

  // Setters
  set studentName(name) {
    if (!name || name.trim() === "") {
      throw new Error("Student name cannot be empty.");
    }

    this.#studentName = name.trim();
  }

  // Validate student information
  validate() {
    if (!this.#studentId || this.#studentId.trim() === "") {
      throw new Error("Student ID is required.");
    }

    if (!this.#studentName || this.#studentName.trim() === "") {
      throw new Error("Student name is required.");
    }

    return true;
  }

  // Add a MealBooking object to this student
  addBooking(booking) {
    this.#bookings.push(booking);
  }

  // Display all bookings belonging to this student
  getBookingCount() {
    return this.#bookings.length;
  }

  getSummary() {
    return `
========================================
           STUDENT INFORMATION
========================================
Student Name: ${this.#studentName}
Student ID: ${this.#studentId}
Number of Bookings: ${this.#bookings.length}
========================================
`;
  }
}

module.exports = Student;
```
