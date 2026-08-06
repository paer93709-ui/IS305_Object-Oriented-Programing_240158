/*
  Main Application File
*/

const readline = require("readline");
const MealBooking = require("../MealBooking");

// Store bookings in array
const bookings = [];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function for input
function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

// ===== MAIN PROGRAM =====
async function main() {
  try {
    console.log("========================================");
    console.log("       DWU DINING MEAL BOOKING");
    console.log("========================================");

    const studentId = await ask("Student ID: ");
    const studentName = await ask("Student Name: ");
    const mealDate = await ask("Meal Date (YYYY-MM-DD): ");
    const mealType = await ask("Meal Type (Breakfast/Lunch/Dinner): ");
    const quantity = parseInt(await ask("Quantity: "));
    const dietaryNote = await ask("Dietary Note: ");

    const booking = new MealBooking(
      studentId,
      studentName,
      mealDate,
      mealType,
      quantity,
      dietaryNote
    );

    // VALIDATION
    booking.validate();

    // DUPLICATE CHECK
    const duplicate = bookings.find(b =>
      b.studentId === studentId &&
      b.mealDate === mealDate &&
      b.mealType === mealType
    );

    if (duplicate) {
      throw new Error("Duplicate booking detected.");
    }

    // STORE BOOKING
    bookings.push(booking);

    console.log("\n========================================");
    console.log("          BOOKING CREATED");
    console.log("========================================");

    console.log(booking.getSummary());

    // OPTIONAL: Confirm booking automatically
    booking.confirmBooking();

  } catch (error) {
    console.log("\nERROR:", error.message);
  } finally {
    rl.close();
  }
}

main();
