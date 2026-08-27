/* Contacts store — the runtime directory backed by IndexedDB.
 * Every mutation writes straight to Dexie; no network is ever involved. */
import { create } from "zustand";
import { db } from "../services/db";
import { uid } from "../utils/format";
import { removeImage, pruneOrphanedImages } from "../services/images";
import type { ContactRecord } from "../types";

export type NewContact = Omit<ContactRecord, "id" | "createdAt" | "updatedAt">;

interface ContactsState {
  contacts: ContactRecord[];
  loaded: boolean;
  load: () => Promise<void>;
  add: ( NewContact) => Promise<ContactRecord>;
  update: (id: string, patch: Partial<ContactRecord>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  mergeAll: (contacts: ContactRecord[]) => Promise<void>;
  clearAll: () => Promise<void>;
}

export const useContactsStore = create<ContactsState>()((set, get) => ({
  contacts: [],
  loaded: false,

  load: async () => {
    const contacts = await db.contacts.toArray();
    contacts.sort((a, b) => b.createdAt - a.createdAt);
    set({ contacts, loaded: true });
  },

  add: async (data) => {
    const now = Date.now();
    const record: ContactRecord = { ...data, id: uid(), createdAt: now, updatedAt: now };
    await db.contacts.put(record);
    set({ contacts: [record, ...get().contacts] });
    return record;
  },

  update: async (id, patch) => {
    const existing = get().contacts.find((c) => c.id === id);
    if (!existing) return;
    const next: ContactRecord = { ...existing, ...patch, id, updatedAt: Date.now() };
    await db.contacts.put(next);
    set({ contacts: get().contacts.map((c) => (c.id === id ? next : c)) });
  },

  remove: async (id) => {
    const existing = get().contacts.find((c) => c.id === id);
    await db.contacts.delete(id);
    set({ contacts: get().contacts.filter((c) => c.id !== id) });
    if (existing?.avatarId) {
      await removeImage(existing.avatarId).catch(() => undefined);
    }
  },

  mergeAll: async (contacts) => {
    await db.contacts.bulkPut(contacts);
    await get().load();
  },

  clearAll: async () => {
    await db.contacts.clear();
    set({ contacts: [] });
    await pruneOrphanedImages(new Set()).catch(() => undefined);
  },
}));
