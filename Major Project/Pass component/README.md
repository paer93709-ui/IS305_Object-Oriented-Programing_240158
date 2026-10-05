# Campus Service Request Management System — Pass Component

**Divine Word University — Faculty of Business and Informatics**
**Department of Information Systems — IS305 Object-Oriented Programming**
**AT3 Major Project — Pass Component (25 marks)**

A Node.js console application that lets students and staff register,
submit, view, update, cancel and search campus service requests (ICT
Support, Facilities Maintenance, Cleaning and Sanitation, General Campus
Service). This is the foundation layer of the full system; Credit
(inheritance/roles) and Distinction (polymorphism, JSON persistence,
reporting, testing) build on top of it without replacing it.

## Requirements

- Node.js v18 or later (v22 tested). No external packages and no database
  are required — the app uses only the Node.js standard library.

## How to Run

```bash
cd campus-service-system
node CampusServiceApp.js
```

or, using the npm script:

```bash
npm start
```

You'll see the main menu:

```
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
============================================
```

Type a number and press Enter to choose an option, then answer the
prompts. Data is held in memory for the duration of the session (JSON
file persistence is a Distinction-level feature, deliberately out of
scope here).

### Notes on input handling

The app detects whether it is running in a real interactive terminal or
receiving piped/redirected input. In an interactive terminal it uses
Node's standard `readline` module and prompts as usual. When input is
piped from a file (e.g. `node CampusServiceApp.js < demo-input.txt`, a
useful way to demo or script the workflow), it reads all of stdin
up-front and serves it back one line per prompt, echoing what was
"typed" so the transcript stays readable. This avoids a known
`readline`/EOF timing issue that can otherwise silently drop input when
an entire session is piped in at once.

## Project Structure

```
campus-service-system/
├── User.js                  # User class (requester/staff account)
├── ServiceRequest.js        # ServiceRequest class
├── ServiceRequestManager.js # Manages users & requests via arrays
├── CampusServiceApp.js      # Console menu / application entry point
├── package.json
├── tests/
│   └── passTests.js         # Automated checks for the 6 required tests
└── README.md
```

## Class Design

### `User`
Private fields: `#userId`, `#firstName`, `#lastName`, `#email`, `#userType`.
- Getters for every field; the ID has no setter (kept immutable once
  created, since it is used as a lookup key throughout the system).
- Controlled setters (`setFirstName`, `setLastName`, `setEmail`,
  `setUserType`) reject empty names, invalid emails, and unsupported
  user types.
- `getFullName()`, `validate()` (returns an array of error strings — an
  empty array means the user is valid), `displayInfo()`.

### `ServiceRequest`
Private fields: `#requestId`, `#requester` (a `User`), `#title`,
`#description`, `#location`, `#category`, `#priority`, `#status`,
`#dateSubmitted`, `#dateUpdated`.
- `status` defaults to `"Submitted"` and is only ever changed through
  `updateDetails()` (no status change) or `cancelRequest()`.
- Controlled setters validate category against `ServiceRequest.CATEGORIES`
  and priority against `ServiceRequest.PRIORITIES`.
- `validate()`, `updateDetails(changes)` (rejects updates to a cancelled
  request), `cancelRequest()` (rejects cancelling an already-cancelled
  request), `getRequestSummary()`.
- Composition: a `ServiceRequest` *has a* `User` as its requester, rather
  than duplicating requester details.

### `ServiceRequestManager`
Holds two private arrays, `#users` and `#requests`, and coordinates all
operations between them:
`registerUser`, `findUserById`, `submitRequest`, `findRequestById`,
`getRequestsByUser`, `getAllRequests`, `updateRequest`, `cancelRequest`,
`searchRequests`, `getRequestSummaryByStatus`.

Authorisation rules (a user may only update/cancel their **own**
requests) and uniqueness rules (no duplicate user IDs or request IDs)
are enforced here, on top of the field-level validation already done by
`User` and `ServiceRequest`.

### `CampusServiceApp`
Pure console/UI layer: prints the menu, collects input, calls the
manager, and prints results or friendly `[ERROR]` messages. It contains
no business logic of its own — that all lives in the three classes
above, so the classes could be reused with a different front end (e.g. a
web UI) without modification.

## Validation Covered

- Missing user ID / first name / last name
- Invalid email address format
- Duplicate user ID
- Duplicate request ID
- Missing request title or description
- Unsupported category
- Unsupported priority value
- Update attempted by a user other than the requester
- Cancellation attempted by a user other than the requester
- Cancellation of a request that is already `Cancelled`

## Running the Automated Tests

```bash
npm test
```

`tests/passTests.js` uses Node's built-in `assert` module to exercise the
six required Pass-level scenarios:

| # | Test | Expected Result |
|---|------|------------------|
| 1 | Valid user registration | User is added successfully |
| 2 | Duplicate user ID | Second registration is rejected |
| 3 | Valid request submission | Request is stored with `Submitted` status |
| 4 | Invalid request category | Request is rejected with a clear error |
| 5 | View requester records | Only the selected user's requests are returned |
| 6 | Cancel a `Submitted` request | Status changes to `Cancelled` |

All six pass when run against the current codebase.

## Manual Demo Walkthrough

1. Choose **1** and register a user, e.g. ID `S001`, name `Mary Kapal`,
   email `mary.kapal@dwu.ac.pg`, type `Student`.
2. Choose **2** and submit a request as `S001` (e.g. category
   `ICT Support`, priority `High`).
3. Choose **4** and view `S001`'s requests — only that user's request(s)
   appear.
4. Choose **6** to update the request's title/priority (leave other
   fields blank to keep them unchanged).
5. Choose **8** and search for a keyword from the title/description.
6. Choose **9** to see the count of requests by status.
7. Choose **7** to cancel the request — its status becomes `Cancelled`.
8. Try cancelling it again, or updating it, to see the appropriate
   `[ERROR]` messages.
9. Choose **10** to exit.

## Design Decisions / Assumptions

- User IDs and request IDs are treated as case-sensitive strings.
  Request IDs are auto-generated by the app (`REQ-0001`, `REQ-0002`, …)
  so users never have to type or duplicate one themselves.
- `validate()` on both `User` and `ServiceRequest` returns an array of
  error messages rather than throwing directly, so the same validation
  logic can be reused by both the manager (which throws a combined error)
  and, in future, by other callers (e.g. a Distinction-level reporting or
  import feature) that may want to collect errors without an exception.
- `ServiceRequest` exposes an internal `_setStatus()` method (not part of
  the Pass-level public API) purely to make the class straightforward to
  extend with additional statuses (`Assigned`, `In Progress`, `Resolved`,
  `Closed`) at the Credit/Distinction stage, without breaking the
  encapsulation of the private `#status` field.

## Author

Prepared for IS305 AT3 — Campus Service Request Management System
(Pass Component).
