"use client";
import React, { useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { useMockData, ZoneId, Item } from "../store/MockDataContext";
import { EntityItem } from "./EntityItem";
import { AnimatePresence, motion, LayoutGroup } from "framer-motion";
import { triggerHaptic } from "../lib/haptics";
import { ItemDetailPanel } from "./ItemDetailPanel";
import { IntelligenceMap } from "./IntelligenceMap";
import { ExperimentBoard } from "./ExperimentBoard";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { SupplyChainMapper } from "./SupplyChainMapper";
import { CommandPalette } from "./CommandPalette";
import { InboxSidebar } from "./InboxSidebar";
import { TeamPanel } from "./TeamPanel";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { BoardCanvas } from "./BoardCanvas";
import { FocusReminder } from "./FocusReminder";
import { InstantIdeasCanvas } from "./InstantIdeasCanvas";
import { AgrasyaLogo } from "./AgrasyaLogo";
import { PwaInstallButton } from "./PwaInstallButton";
import { MobileBottomNav } from "./MobileBottomNav";
import { PdfVaultCanvas } from "./PdfVaultCanvas";
import { ReelsCanvas } from "./ReelsCanvas";
import { LayoutGrid, Network, GitMerge, FlaskConical, BarChart3, Search, Inbox, Users, Truck, Lightbulb, FileText, Film } from "lucide-react";
import { cn } from "../lib/utils";

export function HomeCanvas() {
  const { cloneItem, linkItems, isSearchOpen, setIsSearchOpen, setIsInboxOpen, workspaces, activeWorkspaceId, splitWorkspaceId, copyItemToWorkspace } = useMockData();
  const [activeItem, setActiveItem] = useState<Item | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [viewMode, setViewMode] = useState<"ideas" | "board" | "map" | "intelligence" | "experiments" | "analytics" | "supply_chain" | "team" | "vault" | "reels">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem('agrasya_viewMode') as any) || "ideas";
    }
    return "ideas";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem('agrasya_viewMode', viewMode);
    }
  }, [viewMode]);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined" && localStorage.getItem('agrasya_theme') === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('agrasya_theme', isDark ? 'dark' : 'light');
  };

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const item = active.data.current?.item as Item;
    if (item) setActiveItem(item);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.data.current?.item) {
      const sourceItem = active.data.current.item as Item;
      const targetType = over.data.current?.type;
      
      if (targetType === "Zone" && over.data.current?.zoneId) {
        const targetZoneId = over.data.current.zoneId as ZoneId;
        const targetWorkspaceId = over.data.current.targetWorkspaceId as string;
        
        if (targetWorkspaceId && !sourceItem.workspaceIds?.includes(targetWorkspaceId)) {
           // Cross-workspace drop (pins to workspace)
           copyItemToWorkspace(sourceItem.id, targetWorkspaceId, targetZoneId);
           showToast(`PINNED TO WORKSPACE`);
        } else if (sourceItem.zoneId !== targetZoneId) {
          // Same workspace move, but we CLONE instead of move per user request
          cloneItem(sourceItem.id, targetZoneId);
          showToast(`COPIED TO ${targetZoneId}`);
        }
      } else if (targetType === "EntityItem" && over.data.current?.item) {
        const targetItem = over.data.current.item as Item;
        if (sourceItem.id !== targetItem.id) {
          linkItems(sourceItem.id, targetItem.id);
          // Removed link toast per user request
        }
      }
    }
    setActiveItem(null);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const dockRef = React.useRef<HTMLDivElement>(null);

  // Smoothly center the active tab into view when selected
  useEffect(() => {
    if (dockRef.current) {
      const activeBtn = dockRef.current.querySelector(`[data-view="${viewMode}"]`) as HTMLElement;
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [viewMode]);

  if (!isMounted) return null;

  return (
    <div className="relative min-h-screen p-3 sm:p-4 md:p-8 overflow-x-hidden flex flex-col bg-agrasya-bg z-0 pb-28 md:pb-8">
      {/* Glassmorphism Background Orbs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-agrasya-green/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]"></div>
        <div className="absolute top-[30%] left-[60%] w-[30%] h-[30%] rounded-full bg-purple-500/10 blur-[100px]"></div>
      </div>

      <header className="mb-4 md:mb-8 flex flex-col gap-3 sm:gap-4 md:gap-5 shrink-0 relative z-50">
        {/* Tier 1: Brand & Global Actions with increased height, zero congestion, and single logo */}
        <div className="bg-agrasya-card/85 backdrop-blur-2xl rounded-2xl sm:rounded-full px-2.5 sm:px-4 py-2 sm:py-2.5 shadow-xl border border-white/20 dark:border-white/10 relative z-50 w-full min-h-[58px] sm:min-h-[66px] flex items-center transition-all">
          
          {/* Inject the Expanding Search Palette */}
          <CommandPalette />

          <div className={cn("flex justify-between items-center w-full transition-opacity duration-200", isSearchOpen ? "opacity-0 pointer-events-none" : "opacity-100")}>
            {/* Left Section: Single Brand Logo & Workspace Switcher */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="flex items-center gap-2 shrink-0">
                <AgrasyaLogo size={34} variant="badge" glow />
                <div className="hidden lg:flex flex-col justify-center">
                  <h1 className="text-base font-serif tracking-tight text-agrasya-text leading-none mb-0.5">
                    Agrasya<span className="text-agrasya-green">.</span>
                  </h1>
                  <p className="text-[9px] font-sans text-agrasya-muted uppercase tracking-widest font-bold leading-none">
                    Founder OS
                  </p>
                </div>
              </div>
              
              <div className="w-px h-6 bg-agrasya-border mx-0.5 hidden sm:block shrink-0"></div>

              <WorkspaceSwitcher />
            </div>

            {/* Center Section: Fast Access Bar for PDF Vault & Reels */}
            <div className="hidden sm:flex items-center gap-1 sm:gap-1.5 bg-agrasya-surface/85 backdrop-blur-md p-1 rounded-full border border-agrasya-border/70 shadow-inner shrink-0">
              <button
                onClick={() => {
                  triggerHaptic("selection");
                  setViewMode("vault");
                }}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-xs font-sans font-semibold transition-all active:scale-95 select-none",
                  viewMode === "vault"
                    ? "bg-rose-500 text-white shadow-sm font-bold"
                    : "text-agrasya-muted hover:text-agrasya-text hover:bg-agrasya-card/80"
                )}
                title="Fast Access: PDF Document Vault & Studio"
              >
                <FileText size={14} className={viewMode === "vault" ? "text-white" : "text-rose-500"} />
                <span className="hidden md:inline">PDF Vault</span>
                <span className="md:hidden">Vault</span>
              </button>

              <div className="w-px h-3.5 bg-agrasya-border/60" />

              <button
                onClick={() => {
                  triggerHaptic("selection");
                  setViewMode("reels");
                }}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-xs font-sans font-semibold transition-all active:scale-95 select-none",
                  viewMode === "reels"
                    ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm font-bold"
                    : "text-agrasya-muted hover:text-agrasya-text hover:bg-agrasya-card/80"
                )}
                title="Fast Access: Reels & Shorts Knowledge Hub"
              >
                <Film size={14} className={viewMode === "reels" ? "text-white" : "text-pink-500"} />
                <span className="hidden md:inline">Reels & Shorts</span>
                <span className="md:hidden">Reels</span>
              </button>
            </div>
            
            {/* Right Section: Balanced Actions */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <PwaInstallButton />

              <button 
                onClick={() => {
                  triggerHaptic("light");
                  toggleTheme();
                }}
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full text-agrasya-muted hover:text-agrasya-text bg-agrasya-surface/60 hover:bg-agrasya-surface transition-all border border-agrasya-border/40 hover:border-agrasya-border shrink-0 active:scale-95"
                title="Toggle Dark Mode"
              >
                <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </button>
              
              <button 
                onClick={() => {
                  triggerHaptic("light");
                  setIsInboxOpen(true);
                }} 
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full text-agrasya-muted hover:text-agrasya-text bg-agrasya-surface/60 hover:bg-agrasya-surface transition-all border border-agrasya-border/40 hover:border-agrasya-border shrink-0 active:scale-95" 
                title="Inbox"
              >
                <Inbox size={16} className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>
              
              <button 
                onClick={() => {
                  triggerHaptic("light");
                  setIsSearchOpen(true);
                }} 
                className="h-8 sm:h-9 md:h-10 px-2.5 sm:px-3.5 md:px-4 flex items-center justify-center gap-1.5 sm:gap-2 bg-agrasya-text text-agrasya-bg rounded-full hover:scale-105 active:scale-95 transition-transform shadow-md shrink-0" 
                title="Search (Cmd+K)"
              >
                <Search size={15} />
                <span className="hidden sm:inline text-xs sm:text-sm font-sans font-medium tracking-wide">Search</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tier 2: App Navigation (The Dock) - Visible on Desktop/Tablet only */}
        <div className="hidden md:flex justify-center w-full max-w-full mx-auto min-w-0">
          <div className="bg-agrasya-card/75 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-xl rounded-full p-1 sm:p-1.5 w-full md:w-auto flex items-center relative min-w-0 overflow-hidden">
            <LayoutGroup id="dockNavigationGroup">
              {/* The Scrolling Track with Edge Indicators */}
              <div 
                ref={dockRef}
                className="flex justify-start overflow-x-auto hide-scrollbar snap-x snap-mandatory gap-1 w-full scroll-smooth py-1 px-1 sm:px-2 md:px-1"
              >
                {[
                  { id: "ideas", label: "Ideas", icon: Lightbulb, color: "text-amber-400" },
                  { id: "board", label: "Board", icon: LayoutGrid },
                  { id: "map", label: "Intelligence Map", icon: GitMerge },
                  { id: "experiments", label: "Experiments", icon: FlaskConical },
                  { id: "supply_chain", label: "Supply Chain", icon: Truck },
                  { id: "analytics", label: "Analytics", icon: BarChart3 },
                  { id: "team", label: "Team", icon: Users },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = viewMode === tab.id || (tab.id === "map" && viewMode === "intelligence");
                  return (
                    <motion.button
                      key={tab.id}
                      data-view={tab.id}
                      onClick={() => {
                        triggerHaptic("selection");
                        setViewMode(tab.id as any);
                      }}
                      whileTap={{ scale: 0.94 }}
                      className={cn(
                        "group relative whitespace-nowrap px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold font-sans flex items-center gap-1.5 sm:gap-2 transition-colors snap-center shrink-0 z-10 select-none",
                        isActive
                          ? "text-agrasya-bg"
                          : "text-agrasya-muted hover:text-agrasya-text hover:bg-agrasya-surface/50"
                      )}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="activeDockIndicator"
                          className="absolute inset-0 bg-agrasya-text rounded-full shadow-lg -z-10"
                          transition={{
                            type: "spring",
                            stiffness: 420,
                            damping: 32,
                            mass: 0.7
                          }}
                        />
                      )}
                      <Icon 
                        size={15} 
                        className={cn(
                          "relative z-10 transition-colors duration-200", 
                          isActive 
                            ? (tab.color || "text-agrasya-bg") 
                            : (tab.color ? "text-amber-500" : "text-agrasya-muted group-hover:text-agrasya-text")
                        )} 
                      />
                      <span className={cn(
                        "relative z-10 transition-colors duration-200", 
                        isActive 
                          ? "text-agrasya-bg font-bold" 
                          : "text-agrasya-muted group-hover:text-agrasya-text"
                      )}>
                        {tab.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </LayoutGroup>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode === "intelligence" ? "map" : viewMode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="flex-1 flex flex-col w-full"
        >
          {viewMode === "ideas" ? (
            <InstantIdeasCanvas />
          ) : viewMode === "vault" ? (
            <PdfVaultCanvas />
          ) : viewMode === "reels" ? (
            <ReelsCanvas />
          ) : viewMode === "analytics" ? (
            <AnalyticsDashboard />
          ) : viewMode === "supply_chain" ? (
            <SupplyChainMapper />
          ) : viewMode === "team" ? (
            <TeamPanel />
          ) : viewMode === "experiments" ? (
            <ExperimentBoard />
          ) : viewMode === "intelligence" || viewMode === "map" ? (
            <IntelligenceMap />
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToWindowEdges]}
            >
              {splitWorkspaceId ? (
                <div className="flex-1 flex gap-4 w-full h-full overflow-hidden">
                  <div className="flex-1 border-r border-agrasya-border/50 pr-4 overflow-y-auto min-h-0">
                    <div className="mb-4 px-2">
                      <span className="text-[10px] font-sans text-agrasya-muted uppercase tracking-widest font-bold">Left Pane</span>
                      <h3 className="text-xl font-serif text-agrasya-text">{workspaces.find(w => w.id === activeWorkspaceId)?.name}</h3>
                    </div>
                    <BoardCanvas workspaceId={activeWorkspaceId} />
                  </div>
                  <div className="flex-1 pl-4 overflow-y-auto min-h-0">
                    <div className="mb-4 px-2">
                      <span className="text-[10px] font-sans text-agrasya-muted uppercase tracking-widest font-bold">Right Pane</span>
                      <h3 className="text-xl font-serif text-blue-500">{workspaces.find(w => w.id === splitWorkspaceId)?.name}</h3>
                    </div>
                    <BoardCanvas workspaceId={splitWorkspaceId} />
                  </div>
                </div>
              ) : (
                <div className="flex-1 w-full h-full overflow-y-auto min-h-0">
                  <BoardCanvas workspaceId={activeWorkspaceId} />
                </div>
              )}

              <DragOverlay>
                {activeItem ? (
                  <div className="w-[300px] shadow-2xl rotate-2 scale-105 cursor-grabbing transition-transform">
                    <EntityItem item={activeItem} />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Detail Panel Slide-over */}
      <ItemDetailPanel />
      
      {/* Inbox Sidebar */}
      <InboxSidebar />
      
      {/* Mobile Floating Bottom Navigation - Thumb Zone */}
      <MobileBottomNav 
        viewMode={viewMode} 
        onSelectView={(v) => setViewMode(v as any)} 
      />

      {/* Global Toast - Floating above Mobile Bottom Nav */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 bg-agrasya-text text-agrasya-card px-6 py-3 rounded-full shadow-2xl z-[9999] font-sans font-medium text-sm flex items-center gap-2 border border-agrasya-text/20 backdrop-blur-md"
          >
            <div className="w-2 h-2 rounded-full bg-agrasya-green"></div>
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
