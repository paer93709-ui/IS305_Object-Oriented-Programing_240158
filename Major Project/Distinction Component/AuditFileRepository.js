import { readJsonArray, writeJsonArray } from "./jsonFileStore.js";

/**
 * AuditFileRepository.js
 * All reading/writing of auditLog.json lives here. The audit log is
 * append-only - entries are never edited or removed once written, only
 * added to and read back.
 */
export class AuditFileRepository {
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
    records.push(record);
    await this.saveAll(records);
    return record;
  }

  async findByRequestId(requestId) {
    const records = await this.loadAll();
    return records.filter((r) => r.requestId === requestId);
  }
}
