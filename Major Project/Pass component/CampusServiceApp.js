'use strict';

const fs = require('fs');

const User = require('./User');
const ServiceRequest = require('./ServiceRequest');
const ServiceRequestManager = require('./ServiceRequestManager');

/**
 * CampusServiceApp.js
 * Console entry point that ties User, ServiceRequest and
 * ServiceRequestManager together into a working menu-driven application.
 *
 * Input handling: when running in a real terminal, the standard `readline`
 * module is used to prompt and read answers interactively. When stdin is
 * piped or redirected from a file (e.g. `node CampusServiceApp.js < input.txt`,
 * a common way to test or demonstrate the console workflow), Node's
 * `readline` can race with stdin reaching EOF and silently drop later
 * prompts. To keep the app reliable in both situations, non-interactive
 * input is read synchronously up front and served one line at a time.
 */

const manager = new ServiceRequestManager();

let requestIdCounter = 1;
function nextRequestId() {
  return `REQ-${String(requestIdCounter++).padStart(4, '0')}`;
}

const isInteractive = Boolean(process.stdin.isTTY);

let ask;
let closeInput;

if (isInteractive) {
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  ask = (question) =>
    new Promise((resolve) => rl.question(question, (answer) => resolve(answer.trim())));
  closeInput = () => rl.close();
} else {
  // Read all of stdin synchronously, then hand out one line per ask() call.
  let bufferedLines = [];
  try {
    bufferedLines = fs.readFileSync(0, 'utf8').split(/\r?\n/);
  } catch (err) {
    bufferedLines = [];
  }
  let lineIndex = 0;
  ask = (question) => {
    const line = lineIndex < bufferedLines.length ? bufferedLines[lineIndex++] : '';
    process.stdout.write(question + line + '\n');
    return Promise.resolve(line.trim());
  };
  closeInput = () => {};
}

function printMenu() {
  console.log(`
============================================
     CAMPUS SERVICE REQUEST SYSTEM
============================================
1. Register User
2. Submit Service Request
3. View Request by ID
4. View My Requests
5. View All Requests
6. Update My Request
7. Cancel My Request
8. Search Requests
9. View Request Summary
10. Exit
============================================`);
}

// ---------- Menu actions ----------

async function registerUser() {
  console.log('\n--- Register User ---');
  const userId = await ask('User ID: ');
  const firstName = await ask('First Name: ');
  const lastName = await ask('Last Name: ');
  const email = await ask('Email Address: ');
  console.log(`User Types: ${User.VALID_USER_TYPES.join(', ')}`);
  const userType = await ask('User Type: ');

  try {
    const user = new User(userId, firstName, lastName, email, userType);
    manager.registerUser(user);
    console.log('\n[OK] User registered successfully:');
    console.log(user.displayInfo());
  } catch (err) {
    console.log(`\n[ERROR] Registration failed: ${err.message}`);
  }
}

async function submitRequest() {
  console.log('\n--- Submit Service Request ---');
  const userId = await ask('Your User ID: ');
  const requester = manager.findUserById(userId);

  if (!requester) {
    console.log('\n[ERROR] No user found with that ID. Please register first (Option 1).');
    return;
  }

  const title = await ask('Request Title: ');
  const description = await ask('Description: ');
  const location = await ask('Campus Location: ');
  console.log(`Categories: ${ServiceRequest.CATEGORIES.join(', ')}`);
  const category = await ask('Category: ');
  console.log(`Priorities: ${ServiceRequest.PRIORITIES.join(', ')}`);
  const priorityInput = await ask('Priority (press Enter for Normal): ');
  const priority = priorityInput.length > 0 ? priorityInput : 'Normal';

  try {
    const requestId = nextRequestId();
    const request = new ServiceRequest(
      requestId,
      requester,
      title,
      description,
      location,
      category,
      priority
    );
    manager.submitRequest(request);
    console.log('\n[OK] Request submitted successfully:');
    console.log(request.getRequestSummary());
  } catch (err) {
    console.log(`\n[ERROR] Submission failed: ${err.message}`);
  }
}

async function viewRequestById() {
  console.log('\n--- View Request by ID ---');
  const requestId = await ask('Request ID: ');
  const request = manager.findRequestById(requestId);

  if (!request) {
    console.log(`\n[ERROR] No request found with ID "${requestId}".`);
    return;
  }
  console.log('\n' + request.getRequestSummary());
}

async function viewMyRequests() {
  console.log('\n--- View My Requests ---');
  const userId = await ask('Your User ID: ');

  if (!manager.findUserById(userId)) {
    console.log('\n[ERROR] No user found with that ID.');
    return;
  }

  const requests = manager.getRequestsByUser(userId);
  if (requests.length === 0) {
    console.log('\nYou have no requests on file.');
    return;
  }

  console.log(`\nFound ${requests.length} request(s):\n`);
  requests.forEach((r) => console.log(r.getRequestSummary() + '\n'));
}

async function viewAllRequests() {
  console.log('\n--- View All Requests ---');
  const requests = manager.getAllRequests();

  if (requests.length === 0) {
    console.log('\nNo requests have been submitted yet.');
    return;
  }

  console.log(`\nTotal requests: ${requests.length}\n`);
  requests.forEach((r) => console.log(r.getRequestSummary() + '\n'));
}

async function updateMyRequest() {
  console.log('\n--- Update My Request ---');
  const userId = await ask('Your User ID: ');
  const requestId = await ask('Request ID to update: ');

  console.log('Leave a field blank to keep its current value.');
  const title = await ask('New Title: ');
  const description = await ask('New Description: ');
  const location = await ask('New Campus Location: ');
  console.log(`Categories: ${ServiceRequest.CATEGORIES.join(', ')}`);
  const category = await ask('New Category: ');
  console.log(`Priorities: ${ServiceRequest.PRIORITIES.join(', ')}`);
  const priority = await ask('New Priority: ');

  const changes = {};
  if (title) changes.title = title;
  if (description) changes.description = description;
  if (location) changes.location = location;
  if (category) changes.category = category;
  if (priority) changes.priority = priority;

  try {
    const updated = manager.updateRequest(requestId, userId, changes);
    console.log('\n[OK] Request updated successfully:');
    console.log(updated.getRequestSummary());
  } catch (err) {
    console.log(`\n[ERROR] Update failed: ${err.message}`);
  }
}

async function cancelMyRequest() {
  console.log('\n--- Cancel My Request ---');
  const userId = await ask('Your User ID: ');
  const requestId = await ask('Request ID to cancel: ');

  try {
    const cancelled = manager.cancelRequest(requestId, userId);
    console.log('\n[OK] Request cancelled successfully:');
    console.log(cancelled.getRequestSummary());
  } catch (err) {
    console.log(`\n[ERROR] Cancellation failed: ${err.message}`);
  }
}

async function searchRequests() {
  console.log('\n--- Search Requests ---');
  const text = await ask('Search text (title, description, location, category or ID): ');
  const results = manager.searchRequests(text);

  if (results.length === 0) {
    console.log('\nNo matching requests found.');
    return;
  }

  console.log(`\nFound ${results.length} matching request(s):\n`);
  results.forEach((r) => console.log(r.getRequestSummary() + '\n'));
}

async function viewRequestSummary() {
  console.log('\n--- Request Summary by Status ---');
  const summary = manager.getRequestSummaryByStatus();
  const total = Object.values(summary).reduce((sum, count) => sum + count, 0);

  Object.entries(summary).forEach(([status, count]) => {
    console.log(`${status.padEnd(15)}: ${count}`);
  });
  console.log(`${'Total'.padEnd(15)}: ${total}`);
}

// ---------- Main loop ----------

async function main() {
  console.log('Welcome to the Divine Word University Campus Service Request Management System.');

  let running = true;
  while (running) {
    printMenu();
    const choice = await ask('Select an option (1-10): ');

    switch (choice) {
      case '1':
        await registerUser();
        break;
      case '2':
        await submitRequest();
        break;
      case '3':
        await viewRequestById();
        break;
      case '4':
        await viewMyRequests();
        break;
      case '5':
        await viewAllRequests();
        break;
      case '6':
        await updateMyRequest();
        break;
      case '7':
        await cancelMyRequest();
        break;
      case '8':
        await searchRequests();
        break;
      case '9':
        await viewRequestSummary();
        break;
      case '10':
        running = false;
        break;
      default:
        console.log('\n[ERROR] Invalid option. Please choose a number from 1 to 10.');
    }
  }

  console.log('\nThank you for using the Campus Service Request Management System. Goodbye.');
  closeInput();
}

main().catch((err) => {
  console.error('A fatal error occurred:', err);
  closeInput();
  process.exit(1);
});
