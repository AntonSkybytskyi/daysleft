import Dexie from "dexie";

export class LocalDb extends Dexie {
  constructor() {
    super("daysleft-local");
    this.version(1).stores({});
  }
}

export const localDb = typeof window !== "undefined" ? new LocalDb() : (undefined as unknown as LocalDb);
