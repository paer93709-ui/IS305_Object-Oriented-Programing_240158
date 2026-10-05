import { StudentRequester } from "./StudentRequester.js";
import { StaffRequester } from "./StaffRequester.js";
import { ServiceOfficer } from "./ServiceOfficer.js";
import { Technician } from "./Technician.js";

/**
 * UserFactory.js
 * JSON files store plain data, not live class instances. When
 * users.json is loaded, UserFactory.createFromData() rebuilds the
 * CORRECT subclass (StudentRequester, StaffRequester, ServiceOfficer or
 * Technician) from each saved record, using the record's userType field
 * to decide which one.
 *
 * This matters beyond just restoring the extra fields (programme,
 * department, etc.): ServiceRequest's requester setter requires an
 * actual `instanceof User`, and role-permission checks throughout
 * ServiceRequestManager compare `user.userType`. A restored user that
 * was left as a plain object (instead of a real class instance) would
 * fail both of those the moment the program tried to use it.
 */
export class UserFactory {
  static createFromData(savedData) {
    if (!savedData || typeof savedData !== "object") {
      throw new Error("UserFactory.createFromData() requires a saved user record.");
    }

    const { userId, firstName, lastName, email, userType } = savedData;

    switch (userType) {
      case "Student":
        return new StudentRequester(userId, firstName, lastName, email, savedData.programme, savedData.yearLevel);

      case "Staff":
        return new StaffRequester(userId, firstName, lastName, email, savedData.department);

      case "Service Officer":
        return new ServiceOfficer(userId, firstName, lastName, email, savedData.serviceSection);

      case "Technician":
        return new Technician(userId, firstName, lastName, email, savedData.technicalSpeciality);

      default:
        throw new Error(`UserFactory cannot restore unknown userType "${userType}" for user "${userId}".`);
    }
  }
}
