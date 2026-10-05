import { User } from "./User.js";
import { StudentRequester } from "./StudentRequester.js";
import { StaffRequester } from "./StaffRequester.js";
import { ServiceOfficer } from "./ServiceOfficer.js";
import { Technician } from "./Technician.js";
import { ServiceRequest, CATEGORIES, PRIORITIES, STATUSES } from "./ServiceRequest.js";
import { ICTSupportRequest } from "./ICTSupportRequest.js";
import { MaintenanceRequest, HAZARD_LEVELS } from "./MaintenanceRequest.js";
import { CleaningRequest, HYGIENE_RISKS, CLEANING_SERVICE_TYPES } from "./CleaningRequest.js";
import { ServiceRequestManager } from "./ServiceRequestManager.js";

// ---- Input handling ----
// When running in a real terminal, readline works interactively as normal.
// When input is piped/redirected from a file (useful for testing the whole
// workflow at once), Node's readline can drop later prompts due to a timing
// issue with stdin closing. This detects which mode we're in and handles
// both safely.

const isInteractive = Boolean(process.stdin.isTTY);
let ask;
let closeInput;

if (isInteractive) {
  const readline = await import("readline");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  ask = (question) =>
    new Promise((resolve) => rl.question(question, (answer) => resolve(answer.trim())));
  closeInput = () => rl.close();
} else {
  const fs = await import("fs");
  const lines = fs.readFileSync(0, "utf8").split(/\r?\n/);
  let i = 0;
  ask = (question) => {
    const line = i < lines.length ? lines[i++] : "";
    process.stdout.write(question + line + "\n");
    return Promise.resolve(line.trim());
  };
  closeInput = () => {};
}

const manager = new ServiceRequestManager();
let requestIdCounter = 1;
function nextRequestId() {
  return `REQ-${String(requestIdCounter++).padStart(4, "0")}`;
}

function printMenu() {
  console.log(`
============================================
     CAMPUS SERVICE REQUEST SYSTEM
============================================
1.  Register User
2.  Submit Service Request
3.  View Request by ID
4.  View My Requests
5.  View All Requests
6.  Update My Request
7.  Cancel My Request
8.  Search Requests
9.  View Request Summary
--- Service Officer / Technician Workflow ---
10. Review Request (Service Officer)
11. Assign Technician (Service Officer)
12. Begin Work (Technician)
13. Add Progress Note (Technician)
14. Resolve Request (Technician)
15. Close Request (Service Officer)
--- Filter, Sort and History ---
16. Filter Requests
17. Sort Requests
18. View Request History
19. Exit
============================================`);
}

// ---- Menu actions: User management ----

async function registerUser() {
  console.log("\n--- Register User ---");
  const userId = await ask("User ID: ");
  const firstName = await ask("First Name: ");
  const lastName = await ask("Last Name: ");
  const email = await ask("Email Address: ");
  console.log("User Types: Student, Staff, Service Officer, Technician");
  const userType = await ask("User Type: ");

  try {
    let user;
    switch (userType) {
      case "Student": {
        const programme = await ask("Programme: ");
        const yearLevel = await ask("Year Level (1-6): ");
        user = new StudentRequester(userId, firstName, lastName, email, programme, yearLevel);
        break;
      }
      case "Staff": {
        const department = await ask("Department: ");
        user = new StaffRequester(userId, firstName, lastName, email, department);
        break;
      }
      case "Service Officer": {
        const serviceSection = await ask("Service Section: ");
        user = new ServiceOfficer(userId, firstName, lastName, email, serviceSection);
        break;
      }
      case "Technician": {
        const technicalSpeciality = await ask("Technical Speciality: ");
        user = new Technician(userId, firstName, lastName, email, technicalSpeciality);
        break;
      }
      default:
        console.log(`\n[ERROR] Unknown user type "${userType}". Must be Student, Staff, Service Officer or Technician.`);
        return;
    }

    manager.registerUser(user);
    console.log("\n[OK] User registered successfully:");
    console.log(user.displayInfo());
  } catch (err) {
    console.log(`\n[ERROR] Registration failed: ${err.message}`);
  }
}

// ---- Menu actions: submitting specialised requests ----

async function submitRequest() {
  console.log("\n--- Submit Service Request ---");
  const userId = await ask("Your User ID: ");
  const requester = manager.findUserById(userId);

  if (!requester) {
    console.log("\n[ERROR] No user found with that ID. Please register first (Option 1).");
    return;
  }

  const title = await ask("Request Title: ");
  const description = await ask("Description: ");
  const location = await ask("Campus Location: ");
  console.log(`Categories: ${CATEGORIES.join(", ")}`);
  const category = await ask("Category: ");
  console.log(`Priorities: ${PRIORITIES.join(", ")}`);
  const priorityInput = await ask("Priority (press Enter for Normal): ");
  const priority = priorityInput.length > 0 ? priorityInput : "Normal";

  const common = { requestId: nextRequestId(), requester, title, description, location, priority };

  try {
    let request;
    switch (category) {
      case "ICT Support": {
        const deviceType = await ask("Device Type: ");
        const systemName = await ask("System Name: ");
        const faultType = await ask("Fault Type: ");
        const networkImpact = await ask("Network Impact? (Yes/No): ");
        request = new ICTSupportRequest(common, { deviceType, systemName, faultType, networkImpact });
        break;
      }
      case "Facilities Maintenance": {
        const building = await ask("Building: ");
        const roomNumber = await ask("Room Number: ");
        console.log(`Hazard Levels: ${HAZARD_LEVELS.join(", ")}`);
        const hazardLevel = await ask("Hazard Level: ");
        const equipmentAffected = await ask("Equipment Affected: ");
        request = new MaintenanceRequest(common, { building, roomNumber, hazardLevel, equipmentAffected });
        break;
      }
      case "Cleaning and Sanitation": {
        const cleaningArea = await ask("Cleaning Area: ");
        console.log(`Hygiene Risk Levels: ${HYGIENE_RISKS.join(", ")}`);
        const hygieneRisk = await ask("Hygiene Risk: ");
        console.log(`Service Types: ${CLEANING_SERVICE_TYPES.join(", ")}`);
        const serviceType = await ask("Service Type: ");
        const preferredServiceTime = await ask("Preferred Service Time: ");
        request = new CleaningRequest(common, { cleaningArea, hygieneRisk, serviceType, preferredServiceTime });
        break;
      }
      case "General Campus Service": {
        // No specialised subclass for this category at Credit level -
        // it uses the base ServiceRequest class directly.
        request = new ServiceRequest(
          common.requestId, common.requester, common.title,
          common.description, common.location, category, common.priority
        );
        break;
      }
      default:
        console.log(`\n[ERROR] Unknown category "${category}".`);
        return;
    }

    manager.submitRequest(request);
    console.log("\n[OK] Request submitted successfully:");
    console.log(request.getRequestSummary());
  } catch (err) {
    console.log(`\n[ERROR] Submission failed: ${err.message}`);
  }
}

// ---- Menu actions: viewing ----

async function viewRequestById() {
  console.log("\n--- View Request by ID ---");
  const requestId = await ask("Request ID: ");
  const request = manager.findRequestById(requestId);

  if (!request) {
    console.log(`\n[ERROR] No request found with ID "${requestId}".`);
    return;
  }
  console.log("\n" + request.getRequestSummary());
}

function printRequestList(requests) {
  if (requests.length === 0) {
    console.log("\nNo matching requests found.");
    return;
  }
  console.log(`\nFound ${requests.length} request(s):\n`);
  requests.forEach((r) => console.log(r.getRequestSummary() + "\n"));
}

async function viewMyRequests() {
  console.log("\n--- View My Requests ---");
  const userId = await ask("Your User ID: ");

  if (!manager.findUserById(userId)) {
    console.log("\n[ERROR] No user found with that ID.");
    return;
  }

  printRequestList(manager.getRequestsByUser(userId));
}

async function viewAllRequests() {
  console.log("\n--- View All Requests ---");
  printRequestList(manager.getAllRequests());
}

// ---- Menu actions: update / cancel (requester only, Submitted only) ----

async function updateMyRequest() {
  console.log("\n--- Update My Request ---");
  const userId = await ask("Your User ID: ");
  const requestId = await ask("Request ID to update: ");

  console.log("Leave a field blank to keep its current value.");
  const title = await ask("New Title: ");
  const description = await ask("New Description: ");
  const location = await ask("New Campus Location: ");
  console.log(`Categories: ${CATEGORIES.join(", ")}`);
  const category = await ask("New Category: ");
  console.log(`Priorities: ${PRIORITIES.join(", ")}`);
  const priority = await ask("New Priority: ");

  const changes = {};
  if (title) changes.title = title;
  if (description) changes.description = description;
  if (location) changes.location = location;
  if (category) changes.category = category;
  if (priority) changes.priority = priority;

  try {
    const updated = manager.updateRequest(requestId, userId, changes);
    console.log("\n[OK] Request updated successfully:");
    console.log(updated.getRequestSummary());
  } catch (err) {
    console.log(`\n[ERROR] Update failed: ${err.message}`);
  }
}

async function cancelMyRequest() {
  console.log("\n--- Cancel My Request ---");
  const userId = await ask("Your User ID: ");
  const requestId = await ask("Request ID to cancel: ");

  try {
    const cancelled = manager.cancelRequest(requestId, userId);
    console.log("\n[OK] Request cancelled successfully:");
    console.log(cancelled.getRequestSummary());
  } catch (err) {
    console.log(`\n[ERROR] Cancellation failed: ${err.message}`);
  }
}

// ---- Menu actions: search ----

async function searchRequests() {
  console.log("\n--- Search Requests ---");
  const text = await ask("Search text (title or request ID): ");
  printRequestList(manager.searchRequests(text));
}

async function viewRequestSummary() {
  console.log("\n--- Request Summary by Status ---");
  const summary = manager.getRequestSummaryByStatus();
  const total = Object.values(summary).reduce((sum, count) => sum + count, 0);

  for (const [status, count] of Object.entries(summary)) {
    console.log(`${status.padEnd(15)}: ${count}`);
  }
  console.log(`${"Total".padEnd(15)}: ${total}`);
}

// ---- Menu actions: Service Officer / Technician workflow ----

async function reviewRequestAction() {
  console.log("\n--- Review Request (Service Officer) ---");
  const officerId = await ask("Your Service Officer ID: ");
  const requestId = await ask("Request ID to review: ");
  console.log(`Priorities: ${PRIORITIES.join(", ")}`);
  const priority = await ask("Confirmed Priority: ");
  const comment = await ask("Review Comment: ");

  try {
    const request = manager.reviewRequest(requestId, officerId, priority, comment);
    console.log("\n[OK] Request reviewed:");
    console.log(request.getRequestSummary());
  } catch (err) {
    console.log(`\n[ERROR] Review failed: ${err.message}`);
  }
}

async function assignTechnicianAction() {
  console.log("\n--- Assign Technician (Service Officer) ---");
  const officerId = await ask("Your Service Officer ID: ");
  const requestId = await ask("Request ID: ");
  const technicianId = await ask("Technician User ID to assign: ");
  const comment = await ask("Assignment Comment: ");

  try {
    const request = manager.assignTechnician(requestId, officerId, technicianId, comment);
    console.log("\n[OK] Technician assigned:");
    console.log(request.getRequestSummary());
  } catch (err) {
    console.log(`\n[ERROR] Assignment failed: ${err.message}`);
  }
}

async function beginWorkAction() {
  console.log("\n--- Begin Work (Technician) ---");
  const technicianId = await ask("Your Technician ID: ");
  const requestId = await ask("Request ID: ");
  const comment = await ask("Comment: ");

  try {
    const request = manager.beginWork(requestId, technicianId, comment);
    console.log("\n[OK] Work started:");
    console.log(request.getRequestSummary());
  } catch (err) {
    console.log(`\n[ERROR] Failed to begin work: ${err.message}`);
  }
}

async function addProgressNoteAction() {
  console.log("\n--- Add Progress Note (Technician) ---");
  const technicianId = await ask("Your Technician ID: ");
  const requestId = await ask("Request ID: ");
  const comment = await ask("Progress Note: ");

  try {
    const request = manager.addProgressNote(requestId, technicianId, comment);
    console.log("\n[OK] Progress note added:");
    console.log(request.getRequestSummary());
  } catch (err) {
    console.log(`\n[ERROR] Failed to add progress note: ${err.message}`);
  }
}

async function resolveRequestAction() {
  console.log("\n--- Resolve Request (Technician) ---");
  const technicianId = await ask("Your Technician ID: ");
  const requestId = await ask("Request ID: ");
  const comment = await ask("Resolution Comment: ");

  try {
    const request = manager.resolveRequest(requestId, technicianId, comment);
    console.log("\n[OK] Request resolved:");
    console.log(request.getRequestSummary());
  } catch (err) {
    console.log(`\n[ERROR] Failed to resolve request: ${err.message}`);
  }
}

async function closeRequestAction() {
  console.log("\n--- Close Request (Service Officer) ---");
  const officerId = await ask("Your Service Officer ID: ");
  const requestId = await ask("Request ID: ");
  const comment = await ask("Closing Comment: ");

  try {
    const request = manager.closeRequest(requestId, officerId, comment);
    console.log("\n[OK] Request closed:");
    console.log(request.getRequestSummary());
  } catch (err) {
    console.log(`\n[ERROR] Failed to close request: ${err.message}`);
  }
}

// ---- Menu actions: filter / sort / history ----

async function filterRequestsAction() {
  console.log("\n--- Filter Requests ---");
  console.log("1. By Category  2. By Status  3. By Priority  4. By Assigned Technician");
  const choice = await ask("Choose a filter (1-4): ");

  switch (choice) {
    case "1": {
      console.log(`Categories: ${CATEGORIES.join(", ")}`);
      const category = await ask("Category: ");
      printRequestList(manager.filterByCategory(category));
      break;
    }
    case "2": {
      console.log(`Statuses: ${STATUSES.join(", ")}`);
      const status = await ask("Status: ");
      printRequestList(manager.filterByStatus(status));
      break;
    }
    case "3": {
      console.log(`Priorities: ${PRIORITIES.join(", ")}`);
      const priority = await ask("Priority: ");
      printRequestList(manager.filterByPriority(priority));
      break;
    }
    case "4": {
      const technicianId = await ask("Technician User ID: ");
      printRequestList(manager.filterByTechnician(technicianId));
      break;
    }
    default:
      console.log("\n[ERROR] Invalid filter option.");
  }
}

async function sortRequestsAction() {
  console.log("\n--- Sort Requests ---");
  console.log("1. By Date Submitted (oldest first)  2. By Priority (highest first)");
  const choice = await ask("Choose a sort (1-2): ");

  if (choice === "1") {
    printRequestList(manager.sortByDateSubmitted(true));
  } else if (choice === "2") {
    printRequestList(manager.sortByPriority(true));
  } else {
    console.log("\n[ERROR] Invalid sort option.");
  }
}

async function viewRequestHistoryAction() {
  console.log("\n--- View Request History ---");
  const requestId = await ask("Request ID: ");
  const request = manager.findRequestById(requestId);

  if (!request) {
    console.log(`\n[ERROR] No request found with ID "${requestId}".`);
    return;
  }

  console.log(`\nHistory for ${requestId}:\n`);
  request.history.forEach((entry, index) => {
    console.log(
      `${index + 1}. [${entry.dateTime.toLocaleString()}] ${entry.action} ` +
      `(${entry.previousStatus ?? "—"} -> ${entry.newStatus}) by ${entry.actorId ?? "unknown"}` +
      (entry.comment ? `\n   Comment: ${entry.comment}` : "")
    );
  });
}

// ---- Main loop ----

async function main() {
  console.log("Welcome to the Divine Word University Campus Service Request Management System.");

  let running = true;
  while (running) {
    printMenu();
    const choice = await ask("Select an option (1-19): ");

    switch (choice) {
      case "1": await registerUser(); break;
      case "2": await submitRequest(); break;
      case "3": await viewRequestById(); break;
      case "4": await viewMyRequests(); break;
      case "5": await viewAllRequests(); break;
      case "6": await updateMyRequest(); break;
      case "7": await cancelMyRequest(); break;
      case "8": await searchRequests(); break;
      case "9": await viewRequestSummary(); break;
      case "10": await reviewRequestAction(); break;
      case "11": await assignTechnicianAction(); break;
      case "12": await beginWorkAction(); break;
      case "13": await addProgressNoteAction(); break;
      case "14": await resolveRequestAction(); break;
      case "15": await closeRequestAction(); break;
      case "16": await filterRequestsAction(); break;
      case "17": await sortRequestsAction(); break;
      case "18": await viewRequestHistoryAction(); break;
      case "19": running = false; break;
      default:
        console.log("\n[ERROR] Invalid option. Please choose a number from 1 to 19.");
    }
  }

  console.log("\nThank you for using the Campus Service Request Management System. Goodbye.");
  closeInput();
}

main().catch((err) => {
  console.error("A fatal error occurred:", err);
  closeInput();
  process.exit(1);
});
