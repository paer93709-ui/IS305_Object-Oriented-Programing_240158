import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { rm, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { User } from "../User.js";
import { StudentRequester } from "../StudentRequester.js";
import { ServiceOfficer } from "../ServiceOfficer.js";
import { Technician } from "../Technician.js";
import { ServiceRequest } from "../ServiceRequest.js";
import { ICTSupportRequest } from "../ICTSupportRequest.js";
import { MaintenanceRequest } from "../MaintenanceRequest.js";
import { ServiceRequestManager } from "../ServiceRequestManager.js";
import { UserFactory } from "../UserFactory.js";
import { ServiceRequestFactory } from "../ServiceRequestFactory.js";
import { UserFileRepository } from "../UserFileRepository.js";
import { ServiceRequestFileRepository } from "../ServiceRequestFileRepository.js";
import { RequestHistoryFileRepository } from "../RequestHistoryFileRepository.js";
import { AuditFileRepository } from "../AuditFileRepository.js";


let tempDir;
let repos;

before(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "campus-service-tests-"));
  repos = {
    userRepository: new UserFileRepository(join(tempDir, "users.json")),
    requestRepository: new ServiceRequestFileRepository(join(tempDir, "serviceRequests.json")),
    historyRepository: new RequestHistoryFileRepository(join(tempDir, "requestHistory.json")),
    auditRepository: new AuditFileRepository(join(tempDir, "auditLog.json"))
  };
});

after(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

// ---- 1. Valid object construction ----
test("valid object construction: a StudentRequester can be built with correct fields", () => {
  const student = new StudentRequester("S001", "Mary", "Kapal", "mary@dwu.ac.pg", "BIT", 2);
  assert.ok(student instanceof User);
  assert.equal(student.userType, "Student");
  assert.equal(student.programme, "BIT");
});

// ---- 2. Invalid constructor values ----
test("invalid constructor values: User rejects an invalid email", () => {
  assert.throws(
    () => new StudentRequester("S002", "Bad", "Email", "not-an-email", "BIT", 1),
    /Invalid email address/
  );
});

test("invalid constructor values: StudentRequester rejects an out-of-range year level", () => {
  assert.throws(
    () => new StudentRequester("S003", "A", "B", "a@dwu.ac.pg", "BIT", 9),
    /Year level must be/
  );
});

// ---- 3. Duplicate identifiers ----
test("duplicate identifiers: registering the same userId twice is rejected", async () => {
  const manager = new ServiceRequestManager(repos);
  await manager.registerUser(new StudentRequester("DUP001", "First", "User", "first@dwu.ac.pg", "BIT", 1));
  await assert.rejects(
    () => manager.registerUser(new StudentRequester("DUP001", "Second", "User", "second@dwu.ac.pg", "BIT", 1)),
    /already registered/
  );
});

// ---- 4. Role permissions ----
test("role permissions: only a Service Officer may review a request", async () => {
  const manager = new ServiceRequestManager(repos);
  const student = new StudentRequester("RP-S1", "Mary", "Kapal", "mary2@dwu.ac.pg", "BIT", 2);
  await manager.registerUser(student);

  const request = new ICTSupportRequest(
    { requestId: "RP-REQ-1", requester: student, title: "No wifi", description: "down", location: "LT1", priority: "High" },
    { deviceType: "AP", systemName: "WiFi", faultType: "Down", networkImpact: true }
  );
  await manager.submitRequest(request);

  await assert.rejects(
    () => manager.reviewRequest("RP-REQ-1", "RP-S1", "Urgent"),
    /Only a Service Officer/
  );
});

test("role permissions: only the assigned Technician may update work progress", async () => {
  const manager = new ServiceRequestManager(repos);
  const student = new StudentRequester("RP-S2", "Mary", "Kapal", "mary3@dwu.ac.pg", "BIT", 2);
  const officer = new ServiceOfficer("RP-O1", "Grace", "Lin", "grace2@dwu.ac.pg", "ICT Helpdesk");
  const tech1 = new Technician("RP-T1", "Sam", "Wari", "sam2@dwu.ac.pg", "Networking");
  const tech2 = new Technician("RP-T2", "Ana", "Bul", "ana2@dwu.ac.pg", "Plumbing");
  await manager.registerUser(student);
  await manager.registerUser(officer);
  await manager.registerUser(tech1);
  await manager.registerUser(tech2);

  const request = new ICTSupportRequest(
    { requestId: "RP-REQ-2", requester: student, title: "No wifi", description: "down", location: "LT1", priority: "High" },
    { deviceType: "AP", systemName: "WiFi", faultType: "Down", networkImpact: true }
  );
  await manager.submitRequest(request);
  await manager.reviewRequest("RP-REQ-2", "RP-O1", "High");
  await manager.assignTechnician("RP-REQ-2", "RP-O1", "RP-T1");
  await manager.beginWork("RP-REQ-2", "RP-T1");

  await assert.rejects(
    () => manager.addProgressNote("RP-REQ-2", "RP-T2", "Trying to sneak in a note"),
    /Only the assigned technician/
  );
});

// ---- 5. Controlled status transitions ----
test("controlled status transitions: cannot assign a technician before the request is Reviewed", async () => {
  const manager = new ServiceRequestManager(repos);
  const student = new StudentRequester("ST-S1", "Mary", "Kapal", "mary4@dwu.ac.pg", "BIT", 2);
  const officer = new ServiceOfficer("ST-O1", "Grace", "Lin", "grace3@dwu.ac.pg", "ICT Helpdesk");
  const tech = new Technician("ST-T1", "Sam", "Wari", "sam3@dwu.ac.pg", "Networking");
  await manager.registerUser(student);
  await manager.registerUser(officer);
  await manager.registerUser(tech);

  const request = new ICTSupportRequest(
    { requestId: "ST-REQ-1", requester: student, title: "No wifi", description: "down", location: "LT1", priority: "High" },
    { deviceType: "AP", systemName: "WiFi", faultType: "Down", networkImpact: true }
  );
  await manager.submitRequest(request);

  await assert.rejects(
    () => manager.assignTechnician("ST-REQ-1", "ST-O1", "ST-T1"),
    /Only a Reviewed request/
  );
});

test("controlled status transitions: Cancelled is final - cannot cancel twice", () => {
  const student = new StudentRequester("ST-S2", "Mary", "Kapal", "mary5@dwu.ac.pg", "BIT", 2);
  const request = new ICTSupportRequest(
    { requestId: "ST-REQ-2", requester: student, title: "No wifi", description: "down", location: "LT1", priority: "High" },
    { deviceType: "AP", systemName: "WiFi", faultType: "Down", networkImpact: true }
  );
  request.cancelRequest("ST-S2");
  assert.throws(() => request.cancelRequest("ST-S2"), /already been cancelled/);
});

// ---- 6. Specialised request behaviour ----
test("specialised request behaviour: ICTSupportRequest validates its own fields", () => {
  const student = new StudentRequester("SB-S1", "Mary", "Kapal", "mary6@dwu.ac.pg", "BIT", 2);
  const request = new ICTSupportRequest(
    { requestId: "SB-REQ-1", requester: student, title: "X", description: "Y", location: "Z", priority: "Low" },
    { deviceType: "AP", systemName: "WiFi", faultType: "Down", networkImpact: true }
  );
  assert.deepEqual(request.validate(), []);
});

test("specialised request behaviour: MaintenanceRequest rejects an invalid hazard level", () => {
  const student = new StudentRequester("SB-S2", "Mary", "Kapal", "mary7@dwu.ac.pg", "BIT", 2);
  assert.throws(
    () => new MaintenanceRequest(
      { requestId: "SB-REQ-2", requester: student, title: "X", description: "Y", location: "Z", priority: "Low" },
      { building: "B", roomNumber: "1", hazardLevel: "Extreme", equipmentAffected: "Thing" }
    ),
    /Hazard level must be one of/
  );
});

// ---- 7. Polymorphic method calls (and the abstract base class) ----
test("polymorphic method calls: calling the base ServiceRequest's abstract methods throws", () => {
  const student = new StudentRequester("PM-S1", "Mary", "Kapal", "mary8@dwu.ac.pg", "BIT", 2);
  const base = new ServiceRequest("PM-REQ-1", student, "Title", "Desc", "Loc", "ICT Support", "Low");
  assert.throws(() => base.getRequestSummary(), /must override this method/);
  assert.throws(() => base.calculatePriorityScore(), /must override this method/);
  assert.throws(() => base.getTargetResolutionHours(), /must override this method/);
});

test("polymorphic method calls: the same method call produces type-specific results across subclasses", () => {
  const student = new StudentRequester("PM-S2", "Mary", "Kapal", "mary9@dwu.ac.pg", "BIT", 2);
  const ict = new ICTSupportRequest(
    { requestId: "PM-REQ-2", requester: student, title: "X", description: "Y", location: "Z", priority: "High" },
    { deviceType: "AP", systemName: "WiFi", faultType: "Down", networkImpact: true }
  );
  const maint = new MaintenanceRequest(
    { requestId: "PM-REQ-3", requester: student, title: "X", description: "Y", location: "Z", priority: "Low" },
    { building: "B", roomNumber: "1", hazardLevel: "High", equipmentAffected: "Socket" }
  );
  // Same method, same call signature, genuinely different results.
  assert.notEqual(ict.getTargetResolutionHours(), undefined);
  assert.notEqual(maint.getTargetResolutionHours(), undefined);
  assert.ok(ict.getRequestSummary().includes("ICT Support Request"));
  assert.ok(maint.getRequestSummary().includes("Maintenance Request"));
});

// ---- 8. Saving JSON data ----
test("saving JSON data: a registered user is written to users.json", async () => {
  const manager = new ServiceRequestManager(repos);
  await manager.registerUser(new StudentRequester("SAVE-S1", "Mary", "Kapal", "save1@dwu.ac.pg", "BIT", 2));
  const onDisk = await repos.userRepository.findById("SAVE-S1");
  assert.ok(onDisk);
  assert.equal(onDisk.firstName, "Mary");
  assert.equal(onDisk.programme, "BIT");
});

// ---- 9. Loading and restoring saved objects ----
test("loading and restoring saved objects: a reloaded request is the correct subclass with working behaviour", async () => {
  const manager1 = new ServiceRequestManager(repos);
  const student = new StudentRequester("LR-S1", "Mary", "Kapal", "loadrestore1@dwu.ac.pg", "BIT", 2);
  await manager1.registerUser(student);
  const request = new ICTSupportRequest(
    { requestId: "LR-REQ-1", requester: student, title: "No wifi", description: "down", location: "LT1", priority: "High" },
    { deviceType: "AP", systemName: "WiFi", faultType: "Down", networkImpact: true }
  );
  await manager1.submitRequest(request);

  // Simulate a restart: brand new manager instance, same repositories.
  const manager2 = new ServiceRequestManager(repos);
  await manager2.loadAll();

  const restored = manager2.findRequestById("LR-REQ-1");
  assert.ok(restored instanceof ICTSupportRequest);
  assert.equal(restored.status, "Submitted");
  assert.equal(restored.calculatePriorityScore(), request.calculatePriorityScore());
});

// ---- 10. Missing or empty data files ----
test("missing or empty data files: loadAll() on a repository pointed at a non-existent file returns an empty array", async () => {
  const freshRepo = new UserFileRepository(join(tempDir, "does-not-exist-yet.json"));
  const records = await freshRepo.loadAll();
  assert.deepEqual(records, []);
});

// ---- 11. Report calculations ----
test("report calculations: getReportByCategory() correctly counts requests per category", async () => {
  const manager = new ServiceRequestManager(repos);
  const student = new StudentRequester("RC-S1", "Mary", "Kapal", "report1@dwu.ac.pg", "BIT", 2);
  await manager.registerUser(student);

  await manager.submitRequest(new ICTSupportRequest(
    { requestId: "RC-REQ-1", requester: student, title: "X", description: "Y", location: "Z", priority: "Low" },
    { deviceType: "AP", systemName: "WiFi", faultType: "Down", networkImpact: false }
  ));
  await manager.submitRequest(new ICTSupportRequest(
    { requestId: "RC-REQ-2", requester: student, title: "X", description: "Y", location: "Z", priority: "Low" },
    { deviceType: "AP", systemName: "WiFi", faultType: "Down", networkImpact: false }
  ));

  const report = manager.getReportByCategory();
  assert.equal(report["ICT Support"], 2);
});

test("report calculations: getOverdueRequestsReport() flags a request whose target resolution time has passed", async () => {
  const manager = new ServiceRequestManager(repos);
  const student = new StudentRequester("OD-S1", "Mary", "Kapal", "overdue1@dwu.ac.pg", "BIT", 2);
  await manager.registerUser(student);

  const request = new ICTSupportRequest(
    { requestId: "OD-REQ-1", requester: student, title: "X", description: "Y", location: "Z", priority: "Urgent" },
    { deviceType: "AP", systemName: "WiFi", faultType: "Down", networkImpact: true } // target = 4 hours
  );
  await manager.submitRequest(request);

  // Backdate the submission well past its 4-hour target without going
  // through the public workflow API (restoreState is exactly the tool
  // meant for this - see ServiceRequest.js).
  request.restoreState({ dateSubmitted: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString() });

  const overdue = manager.getOverdueRequestsReport();
  assert.ok(overdue.some((entry) => entry.request.requestId === "OD-REQ-1"));
});

// ---- 12. File-reading / file-writing errors ----
test("file-reading errors: a corrupt JSON file produces a clear error rather than crashing silently", async () => {
  const { writeFile } = await import("node:fs/promises");
  const corruptPath = join(tempDir, "corrupt.json");
  await writeFile(corruptPath, "{ not valid json", "utf8");

  const corruptRepo = new UserFileRepository(corruptPath);
  await assert.rejects(() => corruptRepo.loadAll(), /File-reading error/);
});

test("file-writing errors: saveAll() rejects a non-array argument with a clear error", async () => {
  const repo = new UserFileRepository(join(tempDir, "write-error-check.json"));
  await assert.rejects(() => repo.saveAll("not an array"), /expects an array/);
});

// ---- Extra: UserFactory / ServiceRequestFactory direct coverage ----
test("UserFactory restores the correct subclass for each role", () => {
  const data = { userId: "UF-1", firstName: "Grace", lastName: "Lin", email: "uf1@dwu.ac.pg", userType: "Service Officer", serviceSection: "ICT Helpdesk" };
  const restored = UserFactory.createFromData(data);
  assert.ok(restored instanceof ServiceOfficer);
  assert.equal(restored.serviceSection, "ICT Helpdesk");
});

test("ServiceRequestFactory throws a clear error when the requester cannot be found", () => {
  assert.throws(
    () => ServiceRequestFactory.createFromData(
      { requestType: "ICTSupportRequest", requestId: "X", requesterId: "GHOST", title: "T", description: "D", location: "L", priority: "Low" },
      [] // no users loaded
    ),
    /was not found among loaded users/
  );
});

