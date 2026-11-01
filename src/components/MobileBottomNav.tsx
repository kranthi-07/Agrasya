"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { 
  Lightbulb, 
  LayoutGrid, 
  BarChart3, 
  Users, 
  Layers, 
  FlaskConical, 
  Truck, 
  GitMerge, 
  X, 
  ChevronRight,
  Sparkles,
  FileText,
  Film
} from "lucide-react";
import { cn } from "../lib/utils";
import { triggerHaptic } from "../lib/haptics";

export type ViewMode = 
  | "ideas" 
  | "board" 
  | "map" 
  | "intelligence" 
  | "experiments" 
  | "analytics" 
  | "supply_chain" 
  | "team"
  | "vault"
  | "reels";

interface MobileBottomNavProps {
  viewMode: ViewMode;
  onSelectView: (view: ViewMode) => void;
}

const PRIMARY_TABS: { id: ViewMode; label: string; icon: React.ElementType; color?: string }[] = [
  { id: "ideas", label: "Ideas", icon: Lightbulb, color: "text-amber-400" },
  { id: "board", label: "Board", icon: LayoutGrid },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "team", label: "Team", icon: Users },
];

const SECONDARY_TOOLS: { 
  id: ViewMode; 
  label: string; 
  shortLabel: string;
  description: string; 
  icon: React.ElementType; 
  color: string 
}[] = [
  {
    id: "vault",
    label: "PDF Vault & Studio",
    shortLabel: "Vault",
    description: "Categorized PDF archive, instant search & in-build document maker",
    icon: FileText,
    color: "text-rose-500 bg-rose-500/10 border-rose-500/30"
  },
  {
    id: "reels",
    label: "Reels & Shorts Hub",
    shortLabel: "Reels",
    description: "Vertical video sparks, competitor marketing & farm hacks",
    icon: Film,
    color: "text-pink-500 bg-pink-500/10 border-pink-500/30"
  },
  {
    id: "experiments",
    label: "Experiments Engine",
    shortLabel: "Exp",
    description: "Validate hypotheses, track pilot tests & experiments",
    icon: FlaskConical,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30"
  },
  {
    id: "map",
    label: "Intelligence Map",
    shortLabel: "Int",
    description: "Interactive visual map of ideas, entities & connections",
    icon: GitMerge,
    color: "text-purple-500 bg-purple-500/10 border-purple-500/30"
  },
  {
    id: "supply_chain",
    label: "Supply Chain",
    shortLabel: "Supply",
    description: "Cold-chain, partner farms & distribution routes",
    icon: Truck,
    color: "text-sky-500 bg-sky-500/10 border-sky-500/30"
  },
];

export function MobileBottomNav({ viewMode, onSelectView }: MobileBottomNavProps) {
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);

  // Check if current view is one of the secondary tools
  const isSecondaryActive = 
    viewMode === "experiments" || 
    viewMode === "supply_chain" || 
    viewMode === "map" || 
    viewMode === "intelligence" ||
    viewMode === "vault" ||
    viewMode === "reels";

  const activeSecondaryTool = SECONDARY_TOOLS.find(
    t => t.id === viewMode || (t.id === "map" && viewMode === "intelligence")
  );

  const handleTabClick = (id: ViewMode) => {
    triggerHaptic("selection");
    onSelectView(id);
    setIsMoreSheetOpen(false);
  };

  const handleMoreClick = () => {
    triggerHaptic("medium");
    setIsMoreSheetOpen(!isMoreSheetOpen);
  };

  return (
    <>
      {/* Floating Bottom Nav Container - Thumb-accessible */}
      <nav 
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden p-2.5 sm:p-3 pointer-events-none pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <div className="pointer-events-auto bg-agrasya-card/85 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-full shadow-2xl p-1.5 flex items-center justify-between max-w-md mx-auto relative overflow-hidden">
          <LayoutGroup id="mobileBottomNavGroup">
            {PRIMARY_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = viewMode === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={cn(
                    "relative flex-1 py-2 flex flex-col items-center justify-center gap-1 rounded-full transition-all z-10 select-none active:scale-95",
                    isActive ? "text-agrasya-bg" : "text-agrasya-muted hover:text-agrasya-text"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeMobileBottomIndicator"
                      className="absolute inset-0 bg-agrasya-text rounded-full shadow-md -z-10"
                      transition={{
                        type: "spring",
                        stiffness: 450,
                        damping: 35,
                        mass: 0.7
                      }}
                    />
                  )}
                  <Icon 
                    size={17} 
                    className={cn(
                      "transition-colors duration-200", 
                      isActive 
                        ? (tab.color || "text-agrasya-bg") 
                        : (tab.color ? "text-amber-500" : "")
                    )} 
                  />
                  <span className={cn(
                    "text-[10px] font-sans font-semibold tracking-tight transition-colors duration-200 leading-none",
                    isActive ? "text-agrasya-bg font-bold" : "text-agrasya-muted"
                  )}>
                    {tab.label}
                  </span>
                </button>
              );
            })}

            {/* 5th Tab: Tools / More (Dynamic when a secondary tool is active) */}
            <button
              onClick={handleMoreClick}
              className={cn(
                "relative flex-1 py-2 flex flex-col items-center justify-center gap-1 rounded-full transition-all z-10 select-none active:scale-95",
                isSecondaryActive ? "text-agrasya-bg" : "text-agrasya-muted hover:text-agrasya-text"
              )}
            >
              {isSecondaryActive && (
                <motion.div
                  layoutId="activeMobileBottomIndicator"
                  className="absolute inset-0 bg-agrasya-text rounded-full shadow-md -z-10"
                  transition={{
                    type: "spring",
                    stiffness: 450,
                    damping: 35,
                    mass: 0.7
                  }}
                />
              )}
              {isSecondaryActive && activeSecondaryTool ? (
                <activeSecondaryTool.icon 
                  size={17} 
                  className="text-agrasya-bg transition-colors duration-200" 
                />
              ) : (
                <Layers 
                  size={17} 
                  className={cn(
                    "transition-colors duration-200",
                    isMoreSheetOpen ? "text-agrasya-text rotate-180 transition-transform" : ""
                  )} 
                />
              )}
              <span className={cn(
                "text-[10px] font-sans font-semibold tracking-tight transition-colors duration-200 leading-none",
                isSecondaryActive ? "text-agrasya-bg font-bold" : "text-agrasya-muted"
              )}>
                {isSecondaryActive && activeSecondaryTool ? activeSecondaryTool.shortLabel : "More"}
              </span>
            </button>
          </LayoutGroup>
        </div>
      </nav>

      {/* Slide-Up Bottom Sheet for Additional Modules */}
      <AnimatePresence>
        {isMoreSheetOpen && (
          <div className="fixed inset-0 z-[100] md:hidden flex flex-col justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreSheetOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Sheet Card */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="relative w-full bg-agrasya-card border-t border-agrasya-border rounded-t-3xl shadow-2xl p-5 z-10 flex flex-col gap-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            >
              {/* Sheet Drag Handle */}
              <div className="w-10 h-1 bg-agrasya-border rounded-full mx-auto mb-1 opacity-70" />

              <div className="flex items-center justify-between pb-3 border-b border-agrasya-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-agrasya-green/10 border border-agrasya-green/30 flex items-center justify-center text-agrasya-green">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-bold text-agrasya-text leading-tight">
                      Agrasya Modules
                    </h3>
                    <p className="text-[11px] font-sans text-agrasya-muted">
                      Specialized startup command cockpits
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsMoreSheetOpen(false)}
                  className="p-1.5 rounded-full text-agrasya-muted hover:text-agrasya-text hover:bg-agrasya-surface"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Secondary Tools List */}
              <div className="flex flex-col gap-2">
                {SECONDARY_TOOLS.map((tool) => {
                  const Icon = tool.icon;
                  const isActive = viewMode === tool.id || (tool.id === "map" && viewMode === "intelligence");

                  return (
                    <button
                      key={tool.id}
                      onClick={() => handleTabClick(tool.id)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-2xl border text-left transition-all active:scale-[0.98]",
                        isActive
                          ? "bg-agrasya-text text-agrasya-bg border-agrasya-text shadow-md font-bold"
                          : "bg-agrasya-surface/80 hover:bg-agrasya-surface border-agrasya-border text-agrasya-text"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "w-10 h-10 rounded-xl border flex items-center justify-center shrink-0",
                          isActive ? "bg-white/10 border-white/20 text-white" : tool.color
                        )}>
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0">
                          <h4 className={cn("text-sm font-sans font-semibold truncate", isActive ? "text-agrasya-bg" : "text-agrasya-text")}>
                            {tool.label}
                          </h4>
                          <p className={cn("text-[11px] font-sans truncate", isActive ? "text-agrasya-bg/70" : "text-agrasya-muted")}>
                            {tool.description}
                          </p>
                        </div>
                      </div>

                      <ChevronRight size={16} className={cn("shrink-0 ml-2", isActive ? "text-agrasya-bg/80" : "text-agrasya-muted")} />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
