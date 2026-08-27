/* ---------------------------------------------------------------------------
 * Data layer — Dexie over IndexedDB.
 * Everything persistent lives here: contacts, image blobs, app settings.
 * config.json is only READ as the default configuration source at startup;
 * the app never writes back to it.
 * ------------------------------------------------------------------------- */
import Dexie, { type Table } from "dexie";
import type { AppSettings, ContactRecord, ImageRecord } from "../types";

class EyecoreLabsDB extends Dexie {
  contacts!: Table<ContactRecord, string>;
  images!: Table<ImageRecord, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super("eyecore-labs-db");
    this.version(1).stores({
      contacts: "id, fullName, relationship, createdAt, updatedAt",
      images: "id, createdAt",
      settings: "id",
    });
  }
}

export const db = new EyecoreLabsDB();
export const SETTINGS_ID = "app";
