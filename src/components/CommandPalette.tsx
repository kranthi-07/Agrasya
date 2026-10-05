"use client";

import React, { useState, useEffect, useRef } from "react";
import { useMockData } from "../store/MockDataContext";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Command, CornerDownLeft } from "lucide-react";

export function CommandPalette() {
  const { items, isSearchOpen, setIsSearchOpen, setActiveDetailId, pinToWorkspace, activeWorkspaceId } = useMockData();
  const [query, setQuery] = useState("");
  const [globalItems, setGlobalItems] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global hotkey listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === "Escape" && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  // Focus input & Fetch global items when opened
  useEffect(() => {
    if (isSearchOpen) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 100);
      
      // Fetch all items across all workspaces for global search
      import("../lib/firebase").then(({ db }) => {
        import("firebase/firestore").then(({ collection, getDocs }) => {
          getDocs(collection(db, "cards")).then(snap => {
            const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setGlobalItems(all);
          });
        });
      });
    }
  }, [isSearchOpen]);

  // Filter items globally
  const filteredItems = globalItems.filter((item) => {
    if (!query) return false;
    const searchStr = query.toLowerCase();
    return (
      item.title?.toLowerCase().includes(searchStr) ||
      item.description?.toLowerCase().includes(searchStr) ||
      item.zoneId?.toLowerCase().includes(searchStr)
    );
  });

  const handleSelect = async (item: any) => {
    if (!item.workspaceIds?.includes(activeWorkspaceId)) {
      await pinToWorkspace(item.id);
    }
    setActiveDetailId(item.id);
    setIsSearchOpen(false);
  };

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSearchOpen(false)}
            className="fixed inset-0 bg-agrasya-bg/60 backdrop-blur-md z-[150]"
          />

          {/* Modal / Inline Bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute inset-0 z-[160] flex flex-col pointer-events-auto"
          >
            {/* Input mimicking the topbar */}
            <div className="flex items-center w-full h-full px-4 md:px-6 bg-agrasya-card border border-agrasya-green/50 rounded-full shadow-xl">
              <Search className="text-agrasya-green mr-3 animate-pulse" size={18} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search cards, documents, and financials..."
                className="flex-1 bg-transparent border-none outline-none text-base font-sans text-agrasya-text placeholder:text-agrasya-muted"
              />
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-1 text-[10px] text-agrasya-muted font-sans font-bold bg-agrasya-surface px-2 py-1 rounded">
                  ESC
                </div>
                <button onClick={() => setIsSearchOpen(false)} className="text-agrasya-muted hover:text-agrasya-text bg-agrasya-surface p-1.5 rounded-full transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Results Dropdown */}
            <div className="absolute top-[calc(100%+12px)] left-0 right-0 bg-agrasya-card/90 backdrop-blur-xl border border-agrasya-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
              <div className="max-h-[60vh] overflow-y-auto">
                {query && filteredItems.length === 0 ? (
                  <div className="p-8 text-center text-agrasya-muted font-sans text-sm">
                    No results found for "{query}"
                  </div>
                ) : (
                  <div className="p-2">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        className="flex items-center gap-4 p-3 hover:bg-agrasya-surface rounded-xl cursor-pointer group transition-all hover:pl-4"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold font-serif text-agrasya-text truncate">
                              {item.title}
                            </h4>
                            {!item.workspaceIds?.includes(activeWorkspaceId) && (
                              <span className="text-[10px] uppercase bg-amber-500/10 border border-amber-500/20 text-amber-600 px-2 py-0.5 rounded-full font-sans font-bold tracking-wider">
                                External
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-sans text-agrasya-muted truncate mt-1 opacity-80">
                            {item.zoneId} {item.description ? `· ${item.description.substring(0, 60)}...` : ""}
                          </p>
                        </div>
                        <CornerDownLeft size={14} className="text-agrasya-green opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                      </div>
                    ))}
                    {!query && (
                      <div className="p-10 text-center text-agrasya-muted font-sans flex flex-col items-center gap-3">
                        <Command size={24} className="opacity-20 mb-2" />
                        <span className="text-sm font-medium tracking-wide">Type to start searching your OS</span>
                        <div className="flex gap-2 mt-4 opacity-60">
                          <span className="text-[10px] bg-agrasya-surface px-2 py-1 rounded">Try "revenue"</span>
                          <span className="text-[10px] bg-agrasya-surface px-2 py-1 rounded">Try "marketing"</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
