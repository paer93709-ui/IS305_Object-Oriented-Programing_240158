'use strict';

/**
 * tests/passTests.js
 * Demonstrates the six Pass-level test scenarios required by the AT3 brief,
 * using Node's built-in `assert` module. Run with: npm test
 */

const assert = require('assert');
const User = require('../User');
const ServiceRequest = require('../ServiceRequest');
const ServiceRequestManager = require('../ServiceRequestManager');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.log(`[FAIL] ${name}`);
    console.log(`        ${err.message}`);
    failed++;
  }
}

// A fresh manager is used for the whole suite so tests can build on
// previously registered users/requests, similar to a real session.
const manager = new ServiceRequestManager();

test('1. Valid user registration - user is added successfully', () => {
  const user = new User('S001', 'Mary', 'Kapal', 'mary.kapal@dwu.ac.pg', 'Student');
  manager.registerUser(user);
  const found = manager.findUserById('S001');
  assert.strictEqual(found, user);
});

test('2. Duplicate user ID - second user is rejected', () => {
  const duplicate = new User('S001', 'John', 'Doe', 'john.doe@dwu.ac.pg', 'Student');
  assert.throws(() => manager.registerUser(duplicate), /already registered/);
});

test('3. Valid request submission - request is stored with Submitted status', () => {
  const requester = manager.findUserById('S001');
  const request = new ServiceRequest(
    'REQ-0001',
    requester,
    'Broken projector',
    'The projector in LT1 will not power on.',
    'Lecture Theatre 1',
    'ICT Support',
    'High'
  );
  manager.submitRequest(request);
  const found = manager.findRequestById('REQ-0001');
  assert.strictEqual(found.getStatus(), 'Submitted');
});

test('4. Invalid request category - request is rejected clearly', () => {
  const requester = manager.findUserById('S001');
  assert.throws(() => {
    const badRequest = new ServiceRequest(
      'REQ-0002',
      requester,
      'Leaking tap',
      'Tap in the male washroom is leaking.',
      'Block C Washroom',
      'Plumbing', // not a valid category
      'Normal'
    );
    manager.submitRequest(badRequest);
  }, /Category must be one of/);
});

test('5. View requester records - only the selected user\'s requests are shown', () => {
  const secondUser = new User('S002', 'Peter', 'Igo', 'peter.igo@dwu.ac.pg', 'Staff');
  manager.registerUser(secondUser);

  const secondRequest = new ServiceRequest(
    'REQ-0003',
    secondUser,
    'Overflowing bin',
    'Bin outside Block D needs emptying.',
    'Block D',
    'Cleaning and Sanitation',
    'Low'
  );
  manager.submitRequest(secondRequest);

  const s001Requests = manager.getRequestsByUser('S001');
  const s002Requests = manager.getRequestsByUser('S002');

  assert.strictEqual(s001Requests.length, 1);
  assert.strictEqual(s001Requests[0].getRequestId(), 'REQ-0001');
  assert.strictEqual(s002Requests.length, 1);
  assert.strictEqual(s002Requests[0].getRequestId(), 'REQ-0003');
});

test('6. Cancel Submitted request - status changes to Cancelled', () => {
  const cancelled = manager.cancelRequest('REQ-0001', 'S001');
  assert.strictEqual(cancelled.getStatus(), 'Cancelled');
});

console.log(`\n${passed} passed, ${failed} failed, ${passed + failed} total.`);
if (failed > 0) {
  process.exitCode = 1;
}
