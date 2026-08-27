import type { ContactFilters, ContactRecord, SortKey } from "../types";
import { normalizeText, RELATIONSHIP_META, RELATIONSHIP_ORDER } from "./format";

export const EMPTY_FILTERS: ContactFilters = {
  relationships: [],
  hasEducation: false,
  hasWork: false,
  hasBank: false,
  hasSocial: false,
};

function searchableText(c: ContactRecord): string {
  return normalizeText(
    [
      c.fullName,
      c.phone,
      c.email,
      c.education.school,
      c.education.major,
      c.work.company,
      c.work.position,
      RELATIONSHIP_META[c.relationship]?.label ?? c.relationship,
      c.bank.bankName,
      c.notes,
      c.address,
    ].join("\n")
  );
}

/** Multi-token, diacritic-insensitive match across every indexed field. */
export function matchContact(contact: ContactRecord, query: string): boolean {
  const q = normalizeText(query.trim());
  if (!q) return true;
  const hay = searchableText(contact);
  return q.split(/\s+/).every((token) => hay.includes(token));
}

export function hasSocial(c: ContactRecord): boolean {
  return Object.values(c.social).some((s) => s && s.enabled && s.url.trim().length > 0);
}

export function applyFilters(list: ContactRecord[], f: ContactFilters): ContactRecord[] {
  return list.filter((c) => {
    if (f.relationships.length > 0 && !f.relationships.includes(c.relationship)) return false;
    if (f.hasEducation && !c.education.school.trim() && !c.education.major.trim()) return false;
    if (f.hasWork && !c.work.company.trim() && !c.work.position.trim()) return false;
    if (f.hasBank && !c.bank.bankName.trim() && !c.bank.accountNumber.trim()) return false;
    if (f.hasSocial && !hasSocial(c)) return false;
    return true;
  });
}

export function countActiveFilters(f: ContactFilters): number {
  return (
    f.relationships.length +
    (f.hasEducation ? 1 : 0) +
    (f.hasWork ? 1 : 0) +
    (f.hasBank ? 1 : 0) +
    (f.hasSocial ? 1 : 0)
  );
}

/** Empty values sort last (sentinel beyond any real letter). */
const emptyLast = (value: string): string => (value.trim() ? value : "\uffff");

export function sortContacts(list: ContactRecord[], key: SortKey): ContactRecord[] {
  const copy = [...list];
  const collator = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });
  switch (key) {
    case "name-asc":
      return copy.sort((a, b) => collator.compare(a.fullName, b.fullName));
    case "name-desc":
      return copy.sort((a, b) => collator.compare(b.fullName, a.fullName));
    case "recent":
      return copy.sort((a, b) => b.createdAt - a.createdAt);
    case "updated":
      return copy.sort((a, b) => b.updatedAt - a.updatedAt);
    case "school":
      return copy.sort((a, b) =>
        collator.compare(emptyLast(a.education.school), emptyLast(b.education.school))
      );
    case "company":
      return copy.sort((a, b) =>
        collator.compare(emptyLast(a.work.company), emptyLast(b.work.company))
      );
    case "relationship":
      return copy.sort(
        (a, b) =>
          RELATIONSHIP_ORDER.indexOf(a.relationship) - RELATIONSHIP_ORDER.indexOf(b.relationship)
      );
    default:
      return copy;
  }
}

export const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "recent", label: "Recently added" },
  { value: "updated", label: "Recently updated" },
  { value: "name-asc", label: "Name A → Z" },
  { value: "name-desc", label: "Name Z → A" },
  { value: "school", label: "School" },
  { value: "company", label: "Company" },
  { value: "relationship", label: "Relationship" },
];
