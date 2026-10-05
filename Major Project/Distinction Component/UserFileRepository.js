import { readJsonArray, writeJsonArray } from "./jsonFileStore.js";

/**
 * UserFileRepository.js
 * All reading/writing of users.json lives here. Works with PLAIN data
 * (the result of calling .toJSON() on a User, or a raw parsed record
 * from disk) - never with live User class instances. Turning plain data
 * back into the correct User subclass is UserFactory's job, not this
 * repository's; this class only knows how to get records on and off
 * disk.
 */
export class UserFileRepository {
  #filePath;

  constructor(filePath) {
    this.#filePath = filePath;
  }

  async loadAll() {
    return readJsonArray(this.#filePath);
  }

  async saveAll(records) {
    await writeJsonArray(this.#filePath, records);
  }

  async create(record) {
    const records = await this.loadAll();
    if (records.some((r) => r.userId === record.userId)) {
      throw new Error(`UserFileRepository: a user with ID "${record.userId}" already exists on disk.`);
    }
    records.push(record);
    await this.saveAll(records);
    return record;
  }

  async findById(userId) {
    const records = await this.loadAll();
    return records.find((r) => r.userId === userId) || null;
  }

  async update(userId, changes) {
    const records = await this.loadAll();
    const index = records.findIndex((r) => r.userId === userId);
    if (index === -1) {
      throw new Error(`UserFileRepository: no user with ID "${userId}" found to update.`);
    }
    records[index] = { ...records[index], ...changes };
    await this.saveAll(records);
    return records[index];
  }
}
