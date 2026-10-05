import { readJsonArray, writeJsonArray } from "./jsonFileStore.js";

/**
 * ServiceRequestFileRepository.js
 * All reading/writing of serviceRequests.json lives here. Works with
 * PLAIN data (the result of calling .toJSON() on a ServiceRequest
 * subclass) - never with live class instances. Turning plain data back
 * into the correct specialised subclass is ServiceRequestFactory's job.
 */
export class ServiceRequestFileRepository {
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
    if (records.some((r) => r.requestId === record.requestId)) {
      throw new Error(`ServiceRequestFileRepository: a request with ID "${record.requestId}" already exists on disk.`);
    }
    records.push(record);
    await this.saveAll(records);
    return record;
  }

  async findById(requestId) {
    const records = await this.loadAll();
    return records.find((r) => r.requestId === requestId) || null;
  }

  async findByRequester(userId) {
    const records = await this.loadAll();
    return records.filter((r) => r.requesterId === userId);
  }

  async findByTechnician(technicianId) {
    const records = await this.loadAll();
    return records.filter((r) => r.assignedTechnicianId === technicianId);
  }

  async update(requestId, changes) {
    const records = await this.loadAll();
    const index = records.findIndex((r) => r.requestId === requestId);
    if (index === -1) {
      throw new Error(`ServiceRequestFileRepository: no request with ID "${requestId}" found to update.`);
    }
    records[index] = { ...records[index], ...changes };
    await this.saveAll(records);
    return records[index];
  }
}
