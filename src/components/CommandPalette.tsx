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
            className="fixed inset-0 bg-agrasya-text/20 backdrop-blur-sm z-[200]"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[201] flex items-start justify-center pt-[15vh] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-2xl bg-agrasya-card rounded-xl shadow-2xl border border-agrasya-border overflow-hidden pointer-events-auto flex flex-col"
            >
              {/* Input */}
              <div className="flex items-center px-4 py-4 border-b border-agrasya-border/50">
                <Search className="text-agrasya-muted mr-3" size={20} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search cards, documents, and financials..."
                  className="flex-1 bg-transparent border-none outline-none text-lg font-sans text-agrasya-text placeholder:text-agrasya-muted/50"
                />
                <div className="flex items-center gap-1 text-xs text-agrasya-muted font-sans bg-agrasya-bg px-2 py-1 rounded">
                  <Command size={12} /> K
                </div>
              </div>

              {/* Results */}
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
                        className="flex items-center gap-4 p-3 hover:bg-agrasya-bg rounded-lg cursor-pointer group transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold font-serif text-agrasya-text truncate">
                              {item.title}
                            </h4>
                            {!item.workspaceIds?.includes(activeWorkspaceId) && (
                              <span className="text-[10px] uppercase bg-amber-500/10 border border-amber-500/20 text-amber-600 px-2 py-0.5 rounded-full font-sans font-bold">
                                External
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-sans text-agrasya-muted truncate mt-0.5">
                            {item.zoneId} {item.description ? `· ${item.description.substring(0, 60)}...` : ""}
                          </p>
                        </div>
                        <CornerDownLeft size={14} className="text-agrasya-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                    {!query && (
                      <div className="p-8 text-center text-agrasya-muted font-sans text-sm flex flex-col items-center gap-2">
                        <Search size={24} className="opacity-20 mb-2" />
                        Type to start searching your OS
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
