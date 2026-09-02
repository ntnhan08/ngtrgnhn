/* Directory toolbar: instant search, animated filter panel, sort menu,
 * grid/list layout toggle. Everything is computed locally. */
import { useEffect, useRef, useState, type ReactNode, type Ref } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpDown,
  Briefcase,
  Check,
  ChevronDown,
  GraduationCap,
  Landmark,
  LayoutGrid,
  List as ListIcon,
  RotateCcw,
  Search,
  Share2,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { cn, RELATIONSHIP_META, RELATIONSHIP_ORDER } from "../utils/format";
import { countActiveFilters, EMPTY_FILTERS, SORT_OPTIONS } from "../utils/search";
import { Segmented } from "./ui/Primitives";
import type { ContactFilters, LayoutMode, RelationshipStatus, SortKey } from "../types";

/* --------------------------------- search --------------------------------- */

export function SearchBar({
  value,
  onChange,
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  inputRef?: Ref<HTMLInputElement>;
}) {
  return (
    <div className="relative min-w-0 flex-1 basis-52">
      <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search people, schools, companies…"
        aria-label="Search contacts"
        className="field pl-10 pr-9"
      />
      <AnimatePresence>
        {value && (
          <motion.button
            type="button"
            aria-label="Clear search"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            onClick={() => onChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-faint transition-colors hover:text-ink"
          >
            <X size={14} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------ filter panel ------------------------------ */

function FilterChip({
  active,
  onClick,
  children,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  tone?: string;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-extrabold transition-colors duration-200",
        active
          ? "border-inkline bg-accent text-onaccent shadow-[2px_2px_0_var(--shadow-soft)]"
          : "border-line-strong bg-raised/70 text-muted hover:border-inkline hover:text-ink"
      )}
    >
      {tone ? (
        <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-onaccent" : tone)} aria-hidden="true" />
      ) : null}
      {children}
    </motion.button>
  );
}

const REL_TONE: Record<RelationshipStatus, string> = {
  single: "bg-zinc-500",
  dating: "bg-rose-500",
  married: "bg-emerald-500",
  complicated: "bg-amber-500",
  unknown: "bg-faint",
};

export function FilterPanel({
  open,
  filters,
  onChange,
}: {
  open: boolean;
  filters: ContactFilters;
  onChange: (filters: ContactFilters) => void;
}) {
  const active = countActiveFilters(filters);

  const toggleRelationship = (r: RelationshipStatus) =>
    onChange({
      ...filters,
      relationships: filters.relationships.includes(r)
        ? filters.relationships.filter((x) => x !== r)
        : [...filters.relationships, r],
    });

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="overflow-hidden"
        >
          <div className="glass-plain mt-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.14em] text-faint">
                Relationship
              </p>
              {active > 0 && (
                <button
                  type="button"
                  onClick={() => onChange(EMPTY_FILTERS)}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold text-muted transition-colors hover:text-danger"
                >
                  <RotateCcw size={11} />
                  Reset ({active})
                </button>
              )}
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {RELATIONSHIP_ORDER.map((r) => (
                <FilterChip
                  key={r}
                  active={filters.relationships.includes(r)}
                  onClick={() => toggleRelationship(r)}
                  tone={REL_TONE[r]}
                >
                  {RELATIONSHIP_META[r].label}
                </FilterChip>
              ))}
            </div>

            <p className="font-display mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-faint">Has</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <FilterChip active={filters.hasEducation} onClick={() => onChange({ ...filters, hasEducation: !filters.hasEducation })}>
                <GraduationCap size={12} /> Education
              </FilterChip>
              <FilterChip active={filters.hasWork} onClick={() => onChange({ ...filters, hasWork: !filters.hasWork })}>
                <Briefcase size={12} /> Work
              </FilterChip>
              <FilterChip active={filters.hasBank} onClick={() => onChange({ ...filters, hasBank: !filters.hasBank })}>
                <Landmark size={12} /> Bank
              </FilterChip>
              <FilterChip active={filters.hasSocial} onClick={() => onChange({ ...filters, hasSocial: !filters.hasSocial })}>
                <Share2 size={12} /> Social networks
              </FilterChip>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* -------------------------------- sort menu ------------------------------- */

export function SortMenu({ value, onChange }: { value: SortKey; onChange: (key: SortKey) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = SORT_OPTIONS.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <motion.button
        type="button"
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Sort contacts"
        className="field flex w-auto items-center gap-2 whitespace-nowrap py-[9px] text-[13px] font-bold"
      >
        <ArrowUpDown size={14} className="text-accent" />
        <span className="hidden sm:inline">{current?.label}</span>
        <ChevronDown size={14} className={cn("text-faint transition-transform duration-200", open && "rotate-180")} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            aria-label="Sort options"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="glass absolute right-0 top-full z-50 mt-2 w-56 p-1.5"
            style={{ boxShadow: "var(--shadow-pop, 0 24px 60px rgba(34,58,43,0.25))" }}
          >
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={opt.value === value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-[8px] px-3 py-2 text-left text-[13px] font-bold transition-colors",
                  opt.value === value ? "bg-accent-soft text-accent-hi" : "text-muted hover:bg-raised hover:text-ink"
                )}
              >
                {opt.label}
                {opt.value === value && <Check size={14} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------ layout toggle ------------------------------ */

export function LayoutToggle({
  value,
  onChange,
}: {
  value: LayoutMode;
  onChange: (layout: LayoutMode) => void;
}) {
  return (
    <Segmented
      label="Layout"
      className="w-auto"
      value={value}
      onChange={onChange}
      options={[
        { value: "grid", label: "", icon: <LayoutGrid size={14} /> },
        { value: "list", label: "", icon: <ListIcon size={14} /> },
      ]}
    />
  );
}

export function FilterButton({
  activeCount,
  onClick,
  open,
}: {
  activeCount: number;
  onClick: () => void;
  open: boolean;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      aria-expanded={open}
      aria-label="Toggle filters"
      className={cn(
        "field relative flex w-auto items-center gap-2 whitespace-nowrap py-[9px] text-[13px] font-bold",
        (open || activeCount > 0) && "border-accent text-accent-hi"
      )}
    >
      <SlidersHorizontal size={14} className={open || activeCount > 0 ? "text-accent" : "text-faint"} />
      <span className="hidden md:inline">Filters</span>
      {activeCount > 0 && (
        <motion.span
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          className="inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-full border-2 border-inkline bg-sun px-1 text-[10px] font-black text-ink"
        >
          {activeCount}
        </motion.span>
      )}
    </motion.button>
  );
}
