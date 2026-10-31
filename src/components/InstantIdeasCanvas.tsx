"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useMockData, Item, IdeaCategory, ZoneId } from "../store/MockDataContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lightbulb, 
  Plus, 
  Search, 
  Sparkles, 
  FolderPlus, 
  Trash2, 
  Edit3, 
  ChevronDown, 
  Check, 
  Kanban, 
  LayoutGrid, 
  Clock, 
  X,
  ArrowUpRight
} from "lucide-react";
import { cn } from "../lib/utils";

// Preset Color Palettes for Categories
export const CATEGORY_COLORS = [
  { id: "amber", name: "Amber Gold", bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/30", dot: "bg-amber-500", ring: "ring-amber-500" },
  { id: "sky", name: "Sky Oceanic", bg: "bg-sky-500/10", text: "text-sky-500", border: "border-sky-500/30", dot: "bg-sky-500", ring: "ring-sky-500" },
  { id: "emerald", name: "Emerald Forest", bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/30", dot: "bg-emerald-500", ring: "ring-emerald-500" },
  { id: "purple", name: "Purple Magic", bg: "bg-purple-500/10", text: "text-purple-500", border: "border-purple-500/30", dot: "bg-purple-500", ring: "ring-purple-500" },
  { id: "rose", name: "Rose Flare", bg: "bg-rose-500/10", text: "text-rose-500", border: "border-rose-500/30", dot: "bg-rose-500", ring: "ring-rose-500" },
  { id: "indigo", name: "Indigo Deep", bg: "bg-indigo-500/10", text: "text-indigo-500", border: "border-indigo-500/30", dot: "bg-indigo-500", ring: "ring-indigo-500" },
  { id: "teal", name: "Teal Mint", bg: "bg-teal-500/10", text: "text-teal-500", border: "border-teal-500/30", dot: "bg-teal-500", ring: "ring-teal-500" },
  { id: "orange", name: "Sunset Orange", bg: "bg-orange-500/10", text: "text-orange-500", border: "border-orange-500/30", dot: "bg-orange-500", ring: "ring-orange-500" },
];

export function getColorTheme(colorId?: string) {
  return CATEGORY_COLORS.find(c => c.id === colorId) || CATEGORY_COLORS[0];
}

const BOARD_PROMOTION_ZONES: { id: ZoneId; label: string }[] = [
  { id: "EXPERIMENTS", label: "Experiments (Test & Validate)" },
  { id: "PRODUCTS", label: "Products (Active Offerings)" },
  { id: "FINANCIAL OPERATIONS", label: "Financial Operations" },
  { id: "SUPPLY CHAIN", label: "Supply Chain & Logistics" },
  { id: "UNKNOWN QUESTIONS", label: "Unknown Questions" },
  { id: "SUCCESS STORIES", label: "Success Stories" },
  { id: "FAILURE STORIES", label: "Failure Learnings" },
];

export function InstantIdeasCanvas() {
  const { 
    items, 
    activeWorkspaceId, 
    workspaces, 
    addItem, 
    updateItem, 
    deleteItem, 
    moveItem,
    ideaCategories, 
    addIdeaCategory, 
    updateIdeaCategory, 
    deleteIdeaCategory 
  } = useMockData();

  // View state
  const [viewType, setViewType] = useState<"columns" | "grid">("columns");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Top Brain-dump Fast Capture
  const [quickTitle, setQuickTitle] = useState("");
  const [quickCategoryId, setQuickCategoryId] = useState<string>("");
  const [quickPriority, setQuickPriority] = useState<"low" | "medium" | "high">("medium");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  // In-column Quick Add
  const [columnInput, setColumnInput] = useState<{ [catId: string]: string }>({});

  // Category Modals
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryColor, setCategoryColor] = useState("amber");
  const [categoryDesc, setCategoryDesc] = useState("");

  const [editingCategory, setEditingCategory] = useState<IdeaCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<IdeaCategory | null>(null);
  const [deleteFallbackId, setDeleteFallbackId] = useState<string>("");

  // Idea Modals & Actions
  const [editingIdea, setEditingIdea] = useState<Item | null>(null);
  const [editIdeaTitle, setEditIdeaTitle] = useState("");
  const [editIdeaDesc, setEditIdeaDesc] = useState("");
  const [editIdeaCat, setEditIdeaCat] = useState("");
  const [editIdeaPriority, setEditIdeaPriority] = useState<"low" | "medium" | "high">("medium");

  const [promotingIdea, setPromotingIdea] = useState<Item | null>(null);
  const [targetPromotionZone, setTargetPromotionZone] = useState<ZoneId>("EXPERIMENTS");

  const [deletingIdeaId, setDeletingIdeaId] = useState<string | null>(null);

  // Open Category Move Dropdown by Idea ID
  const [activeIdeaMenuId, setActiveIdeaMenuId] = useState<string | null>(null);

  const activeWorkspaceName = workspaces.find(w => w.id === activeWorkspaceId)?.name || "Current Workspace";

  // Filter ideas strictly for this workspace and zone === "INSTANT IDEAS"
  const workspaceIdeas = useMemo(() => {
    return items.filter(i => 
      i.zoneId === "INSTANT IDEAS" && 
      (i.workspaceIds ? i.workspaceIds.includes(activeWorkspaceId) : true)
    );
  }, [items, activeWorkspaceId]);

  // Set default quick category id once categories are loaded
  useEffect(() => {
    if (ideaCategories.length > 0 && !quickCategoryId) {
      setQuickCategoryId(ideaCategories[0].id);
    }
  }, [ideaCategories, quickCategoryId]);

  // Apply search and filter
  const filteredIdeas = useMemo(() => {
    return workspaceIdeas.filter(idea => {
      const matchesSearch = 
        idea.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (idea.description && idea.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const ideaCat = idea.metadata?.category || ideaCategories[0]?.id || "cat-quick";
      const matchesCategory = selectedCategoryFilter === "all" || ideaCat === selectedCategoryFilter;
      
      const ideaPriority = idea.metadata?.priority || "medium";
      const matchesPriority = priorityFilter === "all" || ideaPriority === priorityFilter;

      return matchesSearch && matchesCategory && matchesPriority;
    });
  }, [workspaceIdeas, searchQuery, selectedCategoryFilter, priorityFilter, ideaCategories]);

  // Handle Quick Add
  const handleCreateQuickIdea = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickTitle.trim()) return;

    const assignedCat = quickCategoryId || ideaCategories[0]?.id || "cat-quick";
    addItem({
      title: quickTitle.trim(),
      zoneId: "INSTANT IDEAS",
      metadata: {
        category: assignedCat,
        priority: quickPriority,
        createdAt: Date.now()
      } as any
    });

    setQuickTitle("");
  };

  // Handle in-column quick add
  const handleColumnAdd = (catId: string) => {
    const text = columnInput[catId]?.trim();
    if (!text) return;

    addItem({
      title: text,
      zoneId: "INSTANT IDEAS",
      metadata: {
        category: catId,
        priority: "medium",
        createdAt: Date.now()
      } as any
    });

    setColumnInput(prev => ({ ...prev, [catId]: "" }));
  };

  // Create Category
  const handleSaveNewCategory = async () => {
    if (!categoryName.trim()) return;
    await addIdeaCategory({
      name: categoryName.trim(),
      color: categoryColor,
      description: categoryDesc.trim() || undefined
    });
    setCategoryName("");
    setCategoryDesc("");
    setCategoryColor("amber");
    setIsCreateCategoryModalOpen(false);
  };

  // Edit Category
  const handleSaveEditCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) return;
    await updateIdeaCategory(editingCategory.id, {
      name: editingCategory.name.trim(),
      color: editingCategory.color,
      description: editingCategory.description
    });
    setEditingCategory(null);
  };

  // Delete Category
  const handleConfirmDeleteCategory = async () => {
    if (!deletingCategory) return;
    await deleteIdeaCategory(deletingCategory.id, deleteFallbackId || undefined);
    setDeletingCategory(null);
    setDeleteFallbackId("");
  };

  // Edit Idea
  const openEditIdea = (idea: Item) => {
    setEditingIdea(idea);
    setEditIdeaTitle(idea.title);
    setEditIdeaDesc(idea.description || "");
    setEditIdeaCat(idea.metadata?.category || ideaCategories[0]?.id || "cat-quick");
    setEditIdeaPriority(idea.metadata?.priority || "medium");
  };

  const handleSaveEditIdea = () => {
    if (!editingIdea || !editIdeaTitle.trim()) return;
    updateItem(editingIdea.id, {
      title: editIdeaTitle.trim(),
      description: editIdeaDesc.trim() || undefined,
      metadata: {
        ...editingIdea.metadata,
        category: editIdeaCat,
        priority: editIdeaPriority
      }
    });
    setEditingIdea(null);
  };

  // Move category of an idea directly
  const handleMoveIdeaCategory = (ideaId: string, newCategoryId: string) => {
    const idea = items.find(i => i.id === ideaId);
    if (!idea) return;
    updateItem(ideaId, {
      metadata: {
        ...idea.metadata,
        category: newCategoryId
      }
    });
    setActiveIdeaMenuId(null);
  };

  // Promote Idea to another OS Zone
  const handleConfirmPromote = async () => {
    if (!promotingIdea) return;
    await moveItem(promotingIdea.id, targetPromotionZone);
    setPromotingIdea(null);
  };

  // Format date
  const formatTime = (ts?: number) => {
    if (!ts) return "";
    return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="flex-1 flex flex-col w-full h-full pb-20 animate-in fade-in duration-300">
      
      {/* Page Header - Sleek, Compact & Proportioned */}
      <div className="mb-3.5 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 bg-agrasya-card/75 backdrop-blur-2xl border border-white/20 dark:border-white/10 p-3 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />

        <div className="flex items-center gap-2.5 sm:gap-4 w-full sm:w-auto">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-inner shrink-0">
            <Lightbulb size={22} className="sm:w-6 sm:h-6 md:w-7 md:h-7 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-2xl md:text-3xl font-serif font-bold text-agrasya-text tracking-tight truncate">
                Instant Ideas
              </h2>
              <span className="text-[9px] sm:text-[10px] font-sans font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30 shadow-sm shrink-0">
                {activeWorkspaceName}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs font-sans text-agrasya-muted mt-0.5 font-medium line-clamp-1 sm:line-clamp-none">
              Capture fast sparks, formulate new concepts, and organize by custom categories.
            </p>
          </div>
        </div>

        {/* View Switcher & Category Action */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-agrasya-border/40">
          <div className="flex bg-agrasya-surface/80 p-0.5 sm:p-1 rounded-full border border-agrasya-border">
            <button
              onClick={() => setViewType("columns")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-sans font-semibold transition-all active:scale-95",
                viewType === "columns" ? "bg-agrasya-text text-agrasya-bg shadow-sm" : "text-agrasya-muted hover:text-agrasya-text"
              )}
            >
              <Kanban size={13} /> Board
            </button>
            <button
              onClick={() => setViewType("grid")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-sans font-semibold transition-all active:scale-95",
                viewType === "grid" ? "bg-agrasya-text text-agrasya-bg shadow-sm" : "text-agrasya-muted hover:text-agrasya-text"
              )}
            >
              <LayoutGrid size={13} /> Matrix
            </button>
          </div>

          <button
            onClick={() => setIsCreateCategoryModalOpen(true)}
            className="flex items-center gap-1.5 bg-agrasya-text text-agrasya-bg px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-sans font-bold hover:scale-105 active:scale-95 transition-all shadow-md shrink-0"
          >
            <FolderPlus size={14} />
            <span className="hidden xs:inline">New Category</span>
            <span className="xs:hidden">Category</span>
          </button>
        </div>
      </div>

      {/* Fast Brain-Dump Bar - Crisp 2-row layout with zero wrapping distortion on mobile */}
      <div className="mb-3.5 sm:mb-6 bg-agrasya-card/85 backdrop-blur-xl border border-agrasya-border rounded-2xl p-2.5 sm:p-3 shadow-lg relative z-30">
        <form onSubmit={handleCreateQuickIdea} className="flex flex-col gap-2">
          {/* Row 1: Sparkle Input */}
          <div className="relative w-full flex items-center">
            <Sparkles size={16} className="absolute left-3 text-amber-500 pointer-events-none" />
            <input
              type="text"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="Drop a rapid idea or startup spark... (Enter to capture)"
              className="w-full pl-9 pr-3 py-2 sm:py-2.5 bg-agrasya-surface/80 border border-agrasya-border/80 rounded-xl text-xs sm:text-sm text-agrasya-text placeholder:text-agrasya-muted/70 focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 transition-all font-sans"
            />
          </div>

          {/* Row 2: Category + Priority + Capture in ONE clean horizontal row */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 w-full">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              {/* Custom Category Selector Dropdown */}
              <div className="relative min-w-0">
                <button
                  type="button"
                  onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  className="flex items-center gap-1.5 text-xs font-sans font-semibold bg-agrasya-surface border border-agrasya-border hover:border-agrasya-muted px-2.5 py-1.5 rounded-xl text-agrasya-text transition-all shadow-sm truncate max-w-[125px] xs:max-w-[150px] sm:max-w-[200px]"
                >
                  {(() => {
                    const current = ideaCategories.find(c => c.id === quickCategoryId) || ideaCategories[0];
                    const colorTheme = getColorTheme(current?.color);
                    return (
                      <span className="flex items-center gap-1.5 truncate">
                        <span className={cn("w-2 h-2 rounded-full shrink-0", colorTheme.dot)} />
                        <span className="truncate">{current?.name || "Category"}</span>
                      </span>
                    );
                  })()}
                  <ChevronDown size={12} className={cn("text-agrasya-muted transition-transform shrink-0", isCategoryDropdownOpen && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {isCategoryDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsCategoryDropdownOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full mt-1.5 w-52 bg-agrasya-card/95 backdrop-blur-2xl border border-agrasya-border rounded-2xl shadow-2xl z-50 p-1.5 flex flex-col gap-1 max-h-60 overflow-y-auto"
                      >
                        <div className="text-[10px] uppercase font-bold text-agrasya-muted px-3 py-1 tracking-wider">
                          Select Category
                        </div>
                        {ideaCategories.map(cat => {
                          const theme = getColorTheme(cat.color);
                          const isSelected = cat.id === quickCategoryId;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setQuickCategoryId(cat.id);
                                setIsCategoryDropdownOpen(false);
                              }}
                              className={cn(
                                "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-sans font-medium transition-colors text-left",
                                isSelected ? "bg-agrasya-surface text-agrasya-text font-bold" : "text-agrasya-text hover:bg-agrasya-surface/80"
                              )}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <span className={cn("w-2 h-2 rounded-full shrink-0", theme.dot)} />
                                <span className="truncate">{cat.name}</span>
                              </div>
                              {isSelected && <Check size={14} className="text-amber-500 shrink-0" />}
                            </button>
                          );
                        })}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Quick Priority Picker */}
              <div className="flex bg-agrasya-surface p-0.5 sm:p-1 rounded-xl border border-agrasya-border shrink-0">
                {(["low", "medium", "high"] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setQuickPriority(p)}
                    className={cn(
                      "px-1.5 sm:px-2.5 py-1 rounded-lg text-[9px] sm:text-[10px] font-sans font-bold uppercase tracking-wider transition-all",
                      quickPriority === p 
                        ? (p === "high" ? "bg-rose-500 text-white shadow-sm" : p === "medium" ? "bg-amber-500 text-white shadow-sm" : "bg-blue-500 text-white shadow-sm")
                        : "text-agrasya-muted hover:text-agrasya-text"
                    )}
                  >
                    <span className="xs:hidden">{p[0]}</span>
                    <span className="hidden xs:inline">{p}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!quickTitle.trim()}
              className="bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:opacity-50 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-sans font-bold transition-all shadow-md flex items-center justify-center gap-1 shrink-0"
            >
              <Plus size={14} />
              <span>Capture</span>
            </button>
          </div>
        </form>
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-3.5 sm:mb-6 flex flex-col md:flex-row gap-2.5 sm:gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-agrasya-muted pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ideas across all categories..."
            className="w-full pl-9 pr-8 py-2 bg-agrasya-surface/60 border border-agrasya-border rounded-xl text-xs text-agrasya-text placeholder:text-agrasya-muted focus:outline-none focus:border-amber-500/50 transition-all font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-agrasya-muted hover:text-agrasya-text"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
          <span className="text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-wider text-agrasya-muted shrink-0">
            Priority:
          </span>
          {(["all", "high", "medium", "low"] as const).map(p => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={cn(
                "px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-sans font-semibold uppercase tracking-wider transition-all shrink-0 active:scale-95",
                priorityFilter === p
                  ? "bg-agrasya-text text-agrasya-bg shadow-sm"
                  : "bg-agrasya-surface text-agrasya-muted hover:text-agrasya-text border border-agrasya-border"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Category Quick Switcher (In Column Mode) */}
      {viewType === "columns" && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-1 hide-scrollbar sm:hidden">
          <button
            onClick={() => setSelectedCategoryFilter("all")}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-sans font-semibold shrink-0 transition-all",
              selectedCategoryFilter === "all"
                ? "bg-agrasya-text text-agrasya-bg shadow-sm"
                : "bg-agrasya-surface text-agrasya-muted border border-agrasya-border"
            )}
          >
            All Columns ({filteredIdeas.length})
          </button>
          {ideaCategories.map(cat => {
            const count = workspaceIdeas.filter(i => (i.metadata?.category || ideaCategories[0]?.id) === cat.id).length;
            const theme = getColorTheme(cat.color);
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === cat.id ? "all" : cat.id)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-sans font-semibold shrink-0 transition-all border",
                  selectedCategoryFilter === cat.id
                    ? "bg-agrasya-text text-agrasya-bg border-agrasya-text shadow-sm"
                    : "bg-agrasya-surface text-agrasya-muted border-agrasya-border"
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", theme.dot)} />
                <span>{cat.name}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Content Area */}
      {viewType === "columns" ? (
        /* Kanban Columns View with Smooth Snap-Center on Mobile */
        <div className="flex-1 flex gap-3 sm:gap-5 overflow-x-auto pb-6 hide-scrollbar snap-x snap-mandatory min-h-[450px] -mx-3 px-3 sm:mx-0 sm:px-0 scroll-px-3 sm:scroll-px-0">
          {ideaCategories
            .filter(category => selectedCategoryFilter === "all" || category.id === selectedCategoryFilter)
            .map(category => {
            const theme = getColorTheme(category.color);
            const columnIdeas = filteredIdeas.filter(i => {
              const catId = i.metadata?.category || ideaCategories[0]?.id || "cat-quick";
              return catId === category.id;
            });

            return (
              <div
                key={category.id}
                className={cn(
                  "shrink-0 flex flex-col bg-agrasya-card/60 backdrop-blur-xl border border-agrasya-border/90 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-sm snap-center transition-all",
                  selectedCategoryFilter === "all" ? "w-[88vw] xs:w-[85vw] sm:w-80 md:w-96" : "w-full sm:w-80 md:w-96"
                )}
              >
                {/* Column Header */}
                <div className="flex items-start justify-between mb-3 pb-3 border-b border-agrasya-border/60">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={cn("w-3 h-3 rounded-full shrink-0 shadow-sm", theme.dot)} />
                    <div className="min-w-0">
                      <h3 className="font-serif text-base font-bold text-agrasya-text truncate">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-[11px] font-sans text-agrasya-muted truncate font-normal mt-0.5">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={cn("text-[10px] font-sans font-bold px-2 py-0.5 rounded-full", theme.bg, theme.text, theme.border)}>
                      {columnIdeas.length}
                    </span>

                    {/* Edit Category Pill */}
                    <button
                      onClick={() => setEditingCategory(category)}
                      className="p-1 rounded-lg text-agrasya-muted hover:text-agrasya-text hover:bg-agrasya-surface transition-colors"
                      title="Edit Category"
                    >
                      <Edit3 size={13} />
                    </button>

                    {/* Delete Category Pill */}
                    {ideaCategories.length > 1 && (
                      <button
                        onClick={() => {
                          setDeletingCategory(category);
                          const remaining = ideaCategories.filter(c => c.id !== category.id);
                          setDeleteFallbackId(remaining[0]?.id || "");
                        }}
                        className="p-1 rounded-lg text-agrasya-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        title="Delete Category"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Quick Add for this category */}
                <div className="mb-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={columnInput[category.id] || ""}
                      onChange={(e) => setColumnInput(prev => ({ ...prev, [category.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleColumnAdd(category.id);
                      }}
                      placeholder="+ Quick idea in this category..."
                      className="w-full px-3 py-2 bg-agrasya-surface/60 border border-dashed border-agrasya-border hover:border-agrasya-muted focus:border-amber-500/60 rounded-xl text-xs text-agrasya-text placeholder:text-agrasya-muted/70 focus:outline-none transition-all font-sans"
                    />
                    {columnInput[category.id]?.trim() && (
                      <button
                        onClick={() => handleColumnAdd(category.id)}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-amber-500 text-white p-1 rounded-lg hover:scale-105 transition-transform"
                      >
                        <Plus size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Ideas List in Column */}
                <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto pr-1 hide-scrollbar min-h-[200px]">
                  {columnIdeas.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 border border-dashed border-agrasya-border/50 rounded-2xl text-center">
                      <Lightbulb size={24} className="text-agrasya-muted/40 mb-2" />
                      <span className="text-xs font-sans text-agrasya-muted/70">No ideas in this category yet.</span>
                    </div>
                  ) : (
                    columnIdeas.map(idea => (
                      <IdeaCard
                        key={idea.id}
                        idea={idea}
                        categories={ideaCategories}
                        onEdit={() => openEditIdea(idea)}
                        onDelete={() => setDeletingIdeaId(idea.id)}
                        onPromote={() => {
                          setPromotingIdea(idea);
                          setTargetPromotionZone("EXPERIMENTS");
                        }}
                        onMoveCategory={(newCatId) => handleMoveIdeaCategory(idea.id, newCatId)}
                        isMenuOpen={activeIdeaMenuId === idea.id}
                        onToggleMenu={(open) => setActiveIdeaMenuId(open ? idea.id : null)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Matrix / Grid View */
        <div className="flex flex-col gap-4">
          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
            <button
              onClick={() => setSelectedCategoryFilter("all")}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-sans font-semibold transition-all shrink-0",
                selectedCategoryFilter === "all"
                  ? "bg-agrasya-text text-agrasya-bg shadow-sm"
                  : "bg-agrasya-surface text-agrasya-muted hover:text-agrasya-text border border-agrasya-border"
              )}
            >
              All Categories ({filteredIdeas.length})
            </button>
            {ideaCategories.map(cat => {
              const theme = getColorTheme(cat.color);
              const count = workspaceIdeas.filter(i => (i.metadata?.category || ideaCategories[0]?.id) === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryFilter(cat.id)}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-sans font-semibold transition-all shrink-0 border",
                    selectedCategoryFilter === cat.id
                      ? "bg-agrasya-text text-agrasya-bg border-agrasya-text shadow-sm"
                      : "bg-agrasya-surface text-agrasya-muted hover:text-agrasya-text border-agrasya-border"
                  )}
                >
                  <span className={cn("w-2 h-2 rounded-full", theme.dot)} />
                  <span>{cat.name}</span>
                  <span className="text-[10px] opacity-70">({count})</span>
                </button>
              );
            })}
          </div>

          {filteredIdeas.length === 0 ? (
            <div className="p-16 text-center bg-agrasya-card/40 border border-dashed border-agrasya-border rounded-3xl flex flex-col items-center gap-3">
              <Lightbulb size={36} className="text-agrasya-muted/40" />
              <h4 className="text-base font-serif font-bold text-agrasya-text">No ideas found</h4>
              <p className="text-xs font-sans text-agrasya-muted max-w-sm">
                Try modifying your search keywords or capture a new idea using the rapid capture bar above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredIdeas.map(idea => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  categories={ideaCategories}
                  onEdit={() => openEditIdea(idea)}
                  onDelete={() => setDeletingIdeaId(idea.id)}
                  onPromote={() => {
                    setPromotingIdea(idea);
                    setTargetPromotionZone("EXPERIMENTS");
                  }}
                  onMoveCategory={(newCatId) => handleMoveIdeaCategory(idea.id, newCatId)}
                  isMenuOpen={activeIdeaMenuId === idea.id}
                  onToggleMenu={(open) => setActiveIdeaMenuId(open ? idea.id : null)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= MODALS & POPUPS ================= */}

      {/* Create Category Modal */}
      <AnimatePresence>
        {isCreateCategoryModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setIsCreateCategoryModalOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-agrasya-card border border-agrasya-border rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-8 z-10 flex flex-col gap-5 sm:gap-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-agrasya-border/50 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                    <FolderPlus size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-bold text-agrasya-text leading-tight">
                      New Category
                    </h3>
                    <p className="text-xs font-sans text-agrasya-muted">
                      Group and categorize ideas in {activeWorkspaceName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateCategoryModalOpen(false)}
                  className="p-1 rounded-full text-agrasya-muted hover:text-agrasya-text hover:bg-agrasya-surface"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-sans font-bold text-agrasya-muted uppercase tracking-wider mb-1.5">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="e.g. Distribution & Retail"
                    className="w-full px-4 py-2.5 bg-agrasya-surface border border-agrasya-border rounded-xl text-sm text-agrasya-text focus:outline-none focus:border-amber-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans font-bold text-agrasya-muted uppercase tracking-wider mb-2">
                    Color Accent Theme
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CATEGORY_COLORS.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCategoryColor(c.id)}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-xl border text-xs font-sans transition-all text-left",
                          categoryColor === c.id
                            ? cn("border-amber-500 ring-2 ring-amber-500/20 bg-agrasya-surface font-bold")
                            : "border-agrasya-border hover:bg-agrasya-surface/60 text-agrasya-text"
                        )}
                      >
                        <span className={cn("w-3 h-3 rounded-full shrink-0", c.dot)} />
                        <span className="truncate text-[11px]">{c.name.split(" ")[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-sans font-bold text-agrasya-muted uppercase tracking-wider mb-1.5">
                    Description (Optional)
                  </label>
                  <textarea
                    value={categoryDesc}
                    onChange={(e) => setCategoryDesc(e.target.value)}
                    placeholder="Briefly define what belongs in this category..."
                    className="w-full px-4 py-2.5 bg-agrasya-surface border border-agrasya-border rounded-xl text-xs text-agrasya-text focus:outline-none focus:border-amber-500 resize-none h-20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-agrasya-border/50">
                <button
                  type="button"
                  onClick={() => setIsCreateCategoryModalOpen(false)}
                  className="px-4 py-2 text-xs font-sans font-semibold text-agrasya-muted hover:text-agrasya-text"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveNewCategory}
                  disabled={!categoryName.trim()}
                  className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-full text-xs font-sans font-bold transition-all shadow-md"
                >
                  Create Category
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Category Modal */}
      <AnimatePresence>
        {editingCategory && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setEditingCategory(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-agrasya-card border border-agrasya-border rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-8 z-10 flex flex-col gap-5 sm:gap-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-agrasya-border/50 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-agrasya-surface border border-agrasya-border flex items-center justify-center text-agrasya-text">
                    <Edit3 size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-bold text-agrasya-text leading-tight">
                      Edit Category
                    </h3>
                    <p className="text-xs font-sans text-agrasya-muted">
                      Update category details & color theme
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingCategory(null)}
                  className="p-1 rounded-full text-agrasya-muted hover:text-agrasya-text hover:bg-agrasya-surface"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-sans font-bold text-agrasya-muted uppercase tracking-wider mb-1.5">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-agrasya-surface border border-agrasya-border rounded-xl text-sm text-agrasya-text focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans font-bold text-agrasya-muted uppercase tracking-wider mb-2">
                    Color Accent Theme
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CATEGORY_COLORS.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setEditingCategory({ ...editingCategory, color: c.id })}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-xl border text-xs font-sans transition-all text-left",
                          editingCategory.color === c.id
                            ? "border-amber-500 ring-2 ring-amber-500/20 bg-agrasya-surface font-bold"
                            : "border-agrasya-border hover:bg-agrasya-surface/60 text-agrasya-text"
                        )}
                      >
                        <span className={cn("w-3 h-3 rounded-full shrink-0", c.dot)} />
                        <span className="truncate text-[11px]">{c.name.split(" ")[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-sans font-bold text-agrasya-muted uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={editingCategory.description || ""}
                    onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                    className="w-full px-4 py-2.5 bg-agrasya-surface border border-agrasya-border rounded-xl text-xs text-agrasya-text focus:outline-none focus:border-amber-500 resize-none h-20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-agrasya-border/50">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 text-xs font-sans font-semibold text-agrasya-muted hover:text-agrasya-text"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditCategory}
                  disabled={!editingCategory.name.trim()}
                  className="bg-agrasya-text text-agrasya-bg px-5 py-2.5 rounded-full text-xs font-sans font-bold transition-all shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Category Confirmation Modal */}
      <AnimatePresence>
        {deletingCategory && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setDeletingCategory(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-agrasya-card border border-agrasya-border rounded-3xl shadow-2xl p-6 sm:p-8 z-10 flex flex-col gap-5"
            >
              <div className="flex items-center gap-3 text-red-500">
                <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-agrasya-text">
                    Delete Category
                  </h3>
                  <p className="text-xs font-sans text-agrasya-muted">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <p className="text-xs font-sans text-agrasya-text/80 leading-relaxed">
                Are you sure you want to remove <span className="font-bold text-agrasya-text">&quot;{deletingCategory.name}&quot;</span>? 
                Existing ideas in this category will be safely moved to another category so you don&apos;t lose them.
              </p>

              <div>
                <label className="block text-xs font-sans font-bold text-agrasya-muted uppercase tracking-wider mb-1.5">
                  Reassign ideas to:
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {ideaCategories
                    .filter(c => c.id !== deletingCategory.id)
                    .map(c => {
                      const theme = getColorTheme(c.color);
                      const isSelected = deleteFallbackId === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setDeleteFallbackId(c.id)}
                          className={cn(
                            "w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-sans font-medium transition-all text-left",
                            isSelected
                              ? "bg-agrasya-surface border-agrasya-green text-agrasya-text font-bold"
                              : "border-agrasya-border hover:bg-agrasya-surface/60 text-agrasya-text"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className={cn("w-2 h-2 rounded-full", theme.dot)} />
                            <span>{c.name}</span>
                          </div>
                          {isSelected && <Check size={14} className="text-agrasya-green" />}
                        </button>
                      );
                    })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-agrasya-border/50">
                <button
                  type="button"
                  onClick={() => setDeletingCategory(null)}
                  className="px-4 py-2 text-xs font-sans font-semibold text-agrasya-muted hover:text-agrasya-text"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteCategory}
                  className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-full text-xs font-sans font-bold transition-all shadow-md"
                >
                  Delete Category
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Idea Modal */}
      <AnimatePresence>
        {editingIdea && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setEditingIdea(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-agrasya-card border border-agrasya-border rounded-3xl shadow-2xl p-6 sm:p-8 z-10 flex flex-col gap-6"
            >
              <div className="flex items-center justify-between border-b border-agrasya-border/50 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                    <Lightbulb size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-bold text-agrasya-text leading-tight">
                      Edit Idea
                    </h3>
                    <p className="text-xs font-sans text-agrasya-muted">
                      Refine the idea title, details & priority
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingIdea(null)}
                  className="p-1 rounded-full text-agrasya-muted hover:text-agrasya-text hover:bg-agrasya-surface"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-sans font-bold text-agrasya-muted uppercase tracking-wider mb-1.5">
                    Idea Title *
                  </label>
                  <input
                    type="text"
                    value={editIdeaTitle}
                    onChange={(e) => setEditIdeaTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-agrasya-surface border border-agrasya-border rounded-xl text-sm text-agrasya-text focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-sans font-bold text-agrasya-muted uppercase tracking-wider mb-1.5">
                      Category
                    </label>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {ideaCategories.map(cat => {
                        const theme = getColorTheme(cat.color);
                        const isSelected = editIdeaCat === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setEditIdeaCat(cat.id)}
                            className={cn(
                              "w-full flex items-center justify-between p-2 rounded-xl border text-xs font-sans transition-all text-left",
                              isSelected
                                ? "bg-agrasya-surface border-amber-500 text-agrasya-text font-bold"
                                : "border-agrasya-border hover:bg-agrasya-surface/60 text-agrasya-muted"
                            )}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className={cn("w-2 h-2 rounded-full shrink-0", theme.dot)} />
                              <span className="truncate">{cat.name}</span>
                            </div>
                            {isSelected && <Check size={12} className="text-amber-500" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-sans font-bold text-agrasya-muted uppercase tracking-wider mb-1.5">
                      Priority Level
                    </label>
                    <div className="flex flex-col gap-1.5">
                      {(["low", "medium", "high"] as const).map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setEditIdeaPriority(p)}
                          className={cn(
                            "flex items-center justify-between p-2 rounded-xl border text-xs font-sans font-semibold capitalize transition-all",
                            editIdeaPriority === p
                              ? (p === "high" ? "bg-rose-500/10 border-rose-500 text-rose-500" : p === "medium" ? "bg-amber-500/10 border-amber-500 text-amber-500" : "bg-blue-500/10 border-blue-500 text-blue-500")
                              : "border-agrasya-border hover:bg-agrasya-surface text-agrasya-muted"
                          )}
                        >
                          <span>{p}</span>
                          {editIdeaPriority === p && <Check size={12} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-sans font-bold text-agrasya-muted uppercase tracking-wider mb-1.5">
                    Detailed Notes / Thoughts
                  </label>
                  <textarea
                    value={editIdeaDesc}
                    onChange={(e) => setEditIdeaDesc(e.target.value)}
                    placeholder="Elaborate on market viability, rationale, or steps to test..."
                    className="w-full px-4 py-2.5 bg-agrasya-surface border border-agrasya-border rounded-xl text-xs text-agrasya-text focus:outline-none focus:border-amber-500 resize-none h-24"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-agrasya-border/50">
                <button
                  type="button"
                  onClick={() => setEditingIdea(null)}
                  className="px-4 py-2 text-xs font-sans font-semibold text-agrasya-muted hover:text-agrasya-text"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditIdea}
                  disabled={!editIdeaTitle.trim()}
                  className="bg-agrasya-text text-agrasya-bg px-5 py-2.5 rounded-full text-xs font-sans font-bold transition-all shadow-md"
                >
                  Save Idea
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Promote to Board Modal */}
      <AnimatePresence>
        {promotingIdea && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setPromotingIdea(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-agrasya-card border border-agrasya-border rounded-3xl shadow-2xl p-6 sm:p-8 z-10 flex flex-col gap-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-agrasya-green/10 border border-agrasya-green/30 flex items-center justify-center text-agrasya-green shrink-0">
                  <ArrowUpRight size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-agrasya-text">
                    Promote to Board
                  </h3>
                  <p className="text-xs font-sans text-agrasya-muted">
                    Elevate idea into an operational zone on your canvas
                  </p>
                </div>
              </div>

              <div className="p-3 bg-agrasya-surface/60 border border-agrasya-border rounded-xl">
                <div className="text-[10px] uppercase font-bold text-agrasya-muted tracking-wider mb-1">Idea:</div>
                <div className="text-sm font-semibold text-agrasya-text">{promotingIdea.title}</div>
              </div>

              <div>
                <label className="block text-xs font-sans font-bold text-agrasya-muted uppercase tracking-wider mb-2">
                  Select Target Board Zone:
                </label>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {BOARD_PROMOTION_ZONES.map(z => {
                    const isSelected = targetPromotionZone === z.id;
                    return (
                      <button
                        key={z.id}
                        type="button"
                        onClick={() => setTargetPromotionZone(z.id)}
                        className={cn(
                          "w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-sans font-medium transition-all text-left",
                          isSelected
                            ? "bg-agrasya-green/10 border-agrasya-green text-agrasya-green font-bold"
                            : "border-agrasya-border hover:bg-agrasya-surface text-agrasya-text"
                        )}
                      >
                        <span>{z.label}</span>
                        {isSelected && <Check size={14} className="text-agrasya-green" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-agrasya-border/50">
                <button
                  type="button"
                  onClick={() => setPromotingIdea(null)}
                  className="px-4 py-2 text-xs font-sans font-semibold text-agrasya-muted hover:text-agrasya-text"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPromote}
                  className="bg-agrasya-green text-agrasya-bg px-5 py-2.5 rounded-full text-xs font-sans font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  Promote Card
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Idea Confirmation Modal */}
      <AnimatePresence>
        {deletingIdeaId && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setDeletingIdeaId(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm bg-agrasya-card border border-agrasya-border rounded-3xl shadow-2xl p-6 z-10 flex flex-col gap-4"
            >
              <div className="flex items-center gap-3 text-red-500">
                <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <Trash2 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-agrasya-text">
                    Delete Idea
                  </h3>
                  <p className="text-xs font-sans text-agrasya-muted">
                    This idea will be permanently removed.
                  </p>
                </div>
              </div>

              <p className="text-xs font-sans text-agrasya-text/80 leading-relaxed">
                Are you sure you want to delete this instant idea from {activeWorkspaceName}?
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-agrasya-border/50">
                <button
                  type="button"
                  onClick={() => setDeletingIdeaId(null)}
                  className="px-4 py-2 text-xs font-sans font-semibold text-agrasya-muted hover:text-agrasya-text"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteItem(deletingIdeaId);
                    setDeletingIdeaId(null);
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-full text-xs font-sans font-bold transition-all shadow-md"
                >
                  Delete Idea
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Individual Idea Card Component
function IdeaCard({
  idea,
  categories,
  onEdit,
  onDelete,
  onPromote,
  onMoveCategory,
  isMenuOpen,
  onToggleMenu,
}: {
  idea: Item;
  categories: IdeaCategory[];
  onEdit: () => void;
  onDelete: () => void;
  onPromote: () => void;
  onMoveCategory: (catId: string) => void;
  isMenuOpen: boolean;
  onToggleMenu: (open: boolean) => void;
}) {
  const currentCategory = categories.find(c => c.id === idea.metadata?.category) || categories[0];
  const theme = getColorTheme(currentCategory?.color);
  const priority = idea.metadata?.priority || "medium";

  return (
    <div className={cn(
      "group relative flex flex-col p-4 rounded-2xl bg-agrasya-card/80 backdrop-blur-md border border-agrasya-border hover:border-amber-500/40 transition-all shadow-sm hover:shadow-md",
      isMenuOpen ? "z-40" : "z-10"
    )}>
      {/* Top Meta: Category Pill & Priority */}
      <div className="flex items-center justify-between mb-2">
        {/* Category Pill with Dropdown */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleMenu(!isMenuOpen);
            }}
            className={cn(
              "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider transition-all border",
              theme.bg, theme.text, theme.border
            )}
            title="Click to move category"
          >
            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", theme.dot)} />
            <span className="truncate max-w-[110px]">{currentCategory?.name || "Idea"}</span>
            <ChevronDown size={11} className={cn("transition-transform opacity-70", isMenuOpen && "rotate-180")} />
          </button>

          {/* Quick Category Move Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => onToggleMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full mt-1.5 w-48 bg-agrasya-card/95 backdrop-blur-2xl border border-agrasya-border rounded-2xl shadow-2xl z-50 p-1.5 flex flex-col gap-1 max-h-52 overflow-y-auto"
                >
                  <div className="text-[9px] uppercase font-bold text-agrasya-muted px-2.5 py-1 tracking-wider">
                    Move to Category
                  </div>
                  {categories.map(c => {
                    const cTheme = getColorTheme(c.color);
                    const isSelected = c.id === currentCategory?.id;
                    return (
                      <button
                        key={c.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveCategory(c.id);
                        }}
                        className={cn(
                          "flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-sans font-medium transition-colors text-left",
                          isSelected ? "bg-agrasya-surface text-agrasya-text font-bold" : "text-agrasya-text hover:bg-agrasya-surface/80"
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className={cn("w-2 h-2 rounded-full shrink-0", cTheme.dot)} />
                          <span className="truncate">{c.name}</span>
                        </div>
                        {isSelected && <Check size={12} className="text-amber-500 shrink-0" />}
                      </button>
                    );
                  })}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Priority Badge */}
        <span className={cn(
          "text-[9px] font-sans font-bold uppercase tracking-widest px-2 py-0.5 rounded-md",
          priority === "high" 
            ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" 
            : priority === "medium" 
            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" 
            : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
        )}>
          {priority}
        </span>
      </div>

      {/* Idea Title */}
      <h4 className="text-sm font-sans font-semibold text-agrasya-text mb-1 leading-snug group-hover:text-amber-500 transition-colors">
        {idea.title}
      </h4>

      {/* Idea Description (if exists) */}
      {idea.description && (
        <p className="text-xs font-sans text-agrasya-muted line-clamp-2 leading-relaxed mb-3">
          {idea.description}
        </p>
      )}

      {/* Action Footer */}
      <div className="mt-2 pt-2 border-t border-agrasya-border/40 flex items-center justify-between">
        <span className="text-[10px] text-agrasya-muted flex items-center gap-1">
          <Clock size={10} />
          {idea.metadata?.createdAt ? new Date(idea.metadata.createdAt).toLocaleDateString([], { month: "short", day: "numeric" }) : "Active"}
        </span>

        <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onPromote}
            className="p-1.5 rounded-lg text-agrasya-muted hover:text-agrasya-green bg-agrasya-surface/80 sm:bg-transparent hover:bg-agrasya-green/10 transition-all border border-agrasya-border/50 sm:border-transparent active:scale-90"
            title="Promote to Canvas Board"
          >
            <ArrowUpRight size={14} />
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-agrasya-muted hover:text-agrasya-text bg-agrasya-surface/80 sm:bg-transparent hover:bg-agrasya-surface transition-all border border-agrasya-border/50 sm:border-transparent active:scale-90"
            title="Edit Idea"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-agrasya-muted hover:text-red-500 bg-agrasya-surface/80 sm:bg-transparent hover:bg-red-500/10 transition-all border border-agrasya-border/50 sm:border-transparent active:scale-90"
            title="Delete Idea"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
