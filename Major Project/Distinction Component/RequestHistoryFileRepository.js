import { readJsonArray, writeJsonArray } from "./jsonFileStore.js";

/**
 * RequestHistoryFileRepository.js
 * All reading/writing of requestHistory.json lives here. Each record is
 * one history entry (previousStatus, newStatus, action, actorId,
 * comment, dateTime), tagged with the requestId it belongs to so a
 * single flat file can hold every request's history.
 */
export class RequestHistoryFileRepository {
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

  async findByRequestId(requestId) {
    const records = await this.loadAll();
    return records.filter((r) => r.requestId === requestId);
  }

  /**
   * Replaces every history entry belonging to one request with a fresh
   * set (used after any workflow action, since ServiceRequest holds its
   * own authoritative in-memory history array - this keeps the file in
   * sync with it rather than trying to append one entry at a time).
   */
  async replaceForRequest(requestId, entries) {
    const records = await this.loadAll();
    const others = records.filter((r) => r.requestId !== requestId);
    const tagged = entries.map((entry) => ({ requestId, ...entry }));
    await this.saveAll([...others, ...tagged]);
  }
}
