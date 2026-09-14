/*
  Program: Dining Meal Booking Feature - Lab 2
  Student Name: Raymond Pae
  Student ID: 240158

  Description:
  Main application demonstrating Student and MealBooking
  object integration.
*/

const readline = require("readline");
const Student = require("./Student");
const MealBooking = require("./MealBooking");

// Array for storing MealBooking objects
const bookings = [];

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function for console input
function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Check for duplicate bookings
function isDuplicateBooking(student, mealDate, mealType) {

  return bookings.some((booking) =>

    booking.student.studentId === student.studentId &&
    booking.mealDate === mealDate &&
    booking.mealType === mealType

  );
}

// Display booking history for a student
function displayBookingHistory(student, bookingArray) {

  console.log(`
========================================
          STUDENT INFORMATION
========================================
Student ID: ${student.studentId}
Student Name: ${student.getFullName()}

========================================
            BOOKING HISTORY
========================================`);

  // Find bookings belonging to the student
  const studentBookings = bookingArray.filter((booking) =>
    booking.student.studentId === student.studentId
  );

  // If no bookings exist
  if (studentBookings.length === 0) {
    console.log("No bookings found for this student.");
    console.log("========================================");
    return;
  }

  let combinedCost = 0;

  // Display every booking
  studentBookings.forEach((booking, index) => {

    const cost = booking.calculateTotal();

    combinedCost += cost;

    console.log(`
${index + 1}. ${booking.mealType} - ${booking.mealDate}
   Quantity: ${booking.quantity}
   Dietary Note: ${booking.dietaryNote || "None"}
   Status: ${booking.bookingStatus}
   Cost: K${cost.toFixed(2)}
`);
  });

  // Display totals
  console.log(`Total Bookings: ${studentBookings.length}`);
  console.log(`Combined Cost: K${combinedCost.toFixed(2)}`);

  console.log("========================================");
}

// Create a booking from user input
async function createBooking(student) {

  try {

    console.log(`
========================================
          NEW MEAL BOOKING
========================================`);

    const mealDate = await ask("Meal Date: ");

    const mealType = await ask(
      "Meal Type (Breakfast/Lunch/Dinner): "
    );

    const quantityInput = await ask("Quantity: ");
    const quantity = Number(quantityInput);

    const dietaryNote = await ask("Dietary Note: ");

    // Check duplicate booking
    if (
      isDuplicateBooking(
        student,
        mealDate,
        mealType
      )
    ) {
      throw new Error(
        "Duplicate booking rejected. The same student, meal date and meal type already exist."
      );
    }

    // Create MealBooking connected to Student
    const booking = new MealBooking(
      student,
      mealDate,
      mealType,
      quantity,
      dietaryNote
    );

    // Validate booking
    booking.validate();

    // Store booking in array
    bookings.push(booking);

    console.log(`
========================================
          BOOKING CREATED
========================================`);

    console.log(booking.getSummary());

    return booking;

  } catch (error) {

    console.log(`
========================================
                ERROR
========================================
${error.message}
========================================`);

    return null;
  }
}

// Required tests
function runTests(student, booking) {

  console.log(`
========================================
             REQUIRED TESTS
========================================
`);

  // -------------------------------------
  // TEST 1: VALID STUDENT OBJECT
  // -------------------------------------

  console.log("TEST 1: Valid Student Object");

  try {

    student.validate();

    console.log("PASS: Student information accepted.");
    console.log(`Student ID: ${student.studentId}`);
    console.log(`Student Name: ${student.getFullName()}`);

  } catch (error) {

    console.log("FAIL:", error.message);
  }

  // -------------------------------------
  // TEST 2: INVALID STUDENT INFORMATION
  // -------------------------------------

  console.log("\nTEST 2: Invalid Student Information");

  try {

    const invalidStudent = new Student(
      "",
      "",
      ""
    );

    invalidStudent.validate();

    console.log("FAIL: Invalid student was accepted.");

  } catch (error) {

    console.log("PASS: Invalid student rejected.");
    console.log(`Error: ${error.message}`);
  }

  // -------------------------------------
  // TEST 3: STUDENT AND BOOKING INTEGRATION
  // -------------------------------------

  console.log("\nTEST 3: Student and Booking Integration");

  try {

    if (
      booking &&
      booking.student === student
    ) {

      console.log(
        "PASS: MealBooking is connected to the Student object."
      );

      console.log(booking.getSummary());

    } else {

      console.log(
        "FAIL: MealBooking is not connected correctly."
      );
    }

  } catch (error) {

    console.log("FAIL:", error.message);
  }

  // -------------------------------------
  // TEST 4: UPDATED STUDENT NAME
  // -------------------------------------

  console.log("\nTEST 4: Updated Student Name");

  try {

    student.firstName = "Updated";
    student.lastName = "Student";

    console.log(
      "PASS: Student name was updated."
    );

    console.log(
      "Updated name:",
      student.getFullName()
    );

    console.log(
      "\nExisting booking after student name update:"
    );

    if (booking) {
      console.log(booking.getSummary());
    }

  } catch (error) {

    console.log("FAIL:", error.message);
  }

  // -------------------------------------
  // TEST 5: BOOKING HISTORY
  // -------------------------------------

  console.log("\nTEST 5: Booking History");

  displayBookingHistory(student, bookings);
}

// Main application
async function main() {

  try {

    console.log(`
========================================
       DWU DINING MEAL BOOKING
             LAB 2
========================================`);

    // -------------------------------------
    // COLLECT STUDENT INFORMATION
    // -------------------------------------

    const studentId = await ask("Student ID: ");

    const firstName = await ask("First Name: ");

    const lastName = await ask("Last Name: ");

    // Create ONE Student object
    const student = new Student(
      studentId,
      firstName,
      lastName
    );

    // Validate Student
    student.validate();

    // Display Student information
    console.log(student.displayInfo());

    // -------------------------------------
    // CREATE FIRST BOOKING
    // -------------------------------------

    const firstBooking = await createBooking(student);

    // -------------------------------------
    // OPTIONAL SECOND BOOKING
    // -------------------------------------

    if (firstBooking) {

      const anotherBooking = await ask(
        "Would you like to create another booking? (yes/no): "
      );

      if (anotherBooking.toLowerCase() === "yes") {

        await createBooking(student);
      }
    }

    // -------------------------------------
    // DISPLAY BOOKING HISTORY
    // -------------------------------------

    console.log(`
========================================
        CURRENT BOOKING HISTORY
========================================`);

    displayBookingHistory(
      student,
      bookings
    );

    // -------------------------------------
    // RUN REQUIRED TESTS
    // -------------------------------------

    runTests(
      student,
      firstBooking
    );

  } catch (error) {

    console.log(`
========================================
          APPLICATION ERROR
========================================
${error.message}
========================================`);

  } finally {

    rl.close();
  }
}

// Start program
main();
