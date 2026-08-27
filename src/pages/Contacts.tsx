/* Contacts — the directory. Instant local search (deferred so typing never
 * janks), animated filters, 7 sort modes, grid/list layouts with dissolve
 * crossfades and paginated render slices for very large vaults. */
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, SearchX, UserPlus } from "lucide-react";
import { ContactCard, ContactRow, gridContainerVariants, useTiltGate } from "../components/ContactCard";
import { FilterButton, FilterPanel, LayoutToggle, SearchBar, SortMenu } from "../components/Toolbar";
import { EmptyState } from "../components/ui/Primitives";
import { useAppStore } from "../store/appStore";
import { useContactsStore } from "../store/contactsStore";
import { useSettingsStore } from "../store/settingsStore";
import { useUiStore } from "../store/uiStore";
import { applyFilters, countActiveFilters, EMPTY_FILTERS, matchContact, sortContacts } from "../utils/search";
import type { ContactFilters, SortKey } from "../types";

const PAGE = 24;

export function Contacts() {
  const config = useAppStore((s) => s.config)!;
  const contacts = useContactsStore((s) => s.contacts);
  const layout = useSettingsStore((s) => s.settings.layout);
  const setLayout = useSettingsStore((s) => s.setLayout);
  const openForm = useUiStore((s) => s.openForm);
  const tilt = useTiltGate();

  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<ContactFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>("recent");
  const [panelOpen, setPanelOpen] = useState(false);
  const [visible, setVisible] = useState(PAGE);

  const searchRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  /* Typed text drives the input directly; the filter/sort pass runs on a
     deferred value so typing never janks with thousands of contacts. */
  const deferredQuery = useDeferredValue(query);

  const results = useMemo(
    () => sortContacts(applyFilters(contacts.filter((c) => matchContact(c, deferredQuery)), filters), sort),
    [contacts, deferredQuery, filters, sort]
  );

  const shown = useMemo(() => results.slice(0, visible), [results, visible]);
  const activeFilters = countActiveFilters(filters);

  useEffect(() => setVisible(PAGE), [deferredQuery, filters, sort, layout]);

  // "/" focuses search from anywhere on this page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Load more as the sentinel approaches the viewport.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setVisible((v) => Math.min(v + PAGE, results.length));
      },
      { rootMargin: "700px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [results.length]);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display ink-pop text-[28px] font-bold tracking-tight text-ink sm:text-4xl">
            <span className="marker px-2">Contacts</span>
          </h1>
          <p className="ink-pop mt-1.5 text-sm font-extrabold text-muted">
            {results.length === contacts.length
              ? `${contacts.length} ${contacts.length === 1 ? "person" : "people"} in the vault`
              : `${results.length} of ${contacts.length} match`}
          </p>
        </div>
      </header>

      {contacts.length > 0 && (
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {config.features.search && <SearchBar value={query} onChange={setQuery} inputRef={searchRef} />}
            {config.features.filter && (
              <FilterButton activeCount={activeFilters} open={panelOpen} onClick={() => setPanelOpen((v) => !v)} />
            )}
            {config.features.sorting && <SortMenu value={sort} onChange={setSort} />}
            <LayoutToggle value={layout} onChange={setLayout} />
          </div>
          {config.features.filter && <FilterPanel open={panelOpen} filters={filters} onChange={setFilters} />}
        </div>
      )}

      {contacts.length === 0 ? (
        <EmptyState
          icon={<UserPlus size={26} />}
          title="No contacts yet"
          body="Add your first contact to get started. Everything you save is stored privately in this browser."
          action={
            <motion.button
              type="button"
              whileHover={{ rotate: -1.5, scale: 1.03 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => openForm(null)}
              className="btn-comic btn-accent px-6 py-2.5 text-sm uppercase"
            >
              <Plus size={15} />
              Add Contact
            </motion.button>
          }
        />
      ) : results.length === 0 ? (
        <EmptyState
          icon={<SearchX size={26} />}
          title="No matches"
          body={`Nothing in the vault matches ${query ? `“${query}”` : "the current filters"}. Try a different search or reset the filters.`}
          action={
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setFilters(EMPTY_FILTERS);
              }}
              className="btn-comic btn-paper px-6 py-2.5 text-sm"
            >
              Clear search & filters
            </button>
          }
        />
      ) : (
        <AnimatePresence initial={false}>
          <motion.div
            key={layout}
            /* dissolve crossfade between grid and list */
            style={{ transform: "translateZ(0)", willChange: "opacity" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, position: "absolute", top: 0, left: 0, right: 0 }}
            transition={{ opacity: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
          >
            {layout === "grid" ? (
              <motion.div
                variants={gridContainerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
              >
                <AnimatePresence mode="popLayout">
                  {shown.map((c) => (
                    <ContactCard key={c.id} contact={c} tiltEnabled={tilt} />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                variants={gridContainerVariants}
                initial="hidden"
                animate="show"
                className="flex flex-col gap-2.5"
              >
                <AnimatePresence mode="popLayout">
                  {shown.map((c) => (
                    <ContactRow key={c.id} contact={c} />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {shown.length < results.length && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          <p className="ink-pop font-display text-xs font-bold text-faint">
            Showing {shown.length} of {results.length} — scroll for more
          </p>
        </div>
      )}
    </div>
  );
}