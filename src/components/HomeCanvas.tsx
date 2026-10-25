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
import { AnimatePresence, motion } from "framer-motion";
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
import { LayoutGrid, Network, GitMerge, FlaskConical, BarChart3, Search, Inbox, Users, Truck, Lightbulb } from "lucide-react";
import { cn } from "../lib/utils";

export function HomeCanvas() {
  const { cloneItem, linkItems, isSearchOpen, setIsSearchOpen, setIsInboxOpen, workspaces, activeWorkspaceId, splitWorkspaceId, copyItemToWorkspace } = useMockData();
  const [activeItem, setActiveItem] = useState<Item | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [viewMode, setViewMode] = useState<"ideas" | "board" | "map" | "intelligence" | "experiments" | "analytics" | "supply_chain" | "team">(() => {
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
  const scrollTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const isAutoScrollingRef = React.useRef(false);

  const handleDockScroll = () => {
    if (!dockRef.current || isAutoScrollingRef.current) return;
    const container = dockRef.current;
    
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      // Check if we are still auto-scrolling
      if (isAutoScrollingRef.current) return;

      const scrollCenter = container.scrollLeft + container.clientWidth / 2;
      const buttons = Array.from(container.querySelectorAll('button[data-view]'));
      
      let closest = null;
      let minDistance = Infinity;

      // Handle edge cases where elements can't reach the center
      const isAtEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 5;
      const isAtStart = container.scrollLeft <= 5;

      if (isAtStart) {
        closest = buttons[0]?.getAttribute('data-view');
      } else if (isAtEnd) {
        closest = buttons[buttons.length - 1]?.getAttribute('data-view');
      } else {
        buttons.forEach((btn) => {
          const btnCenter = (btn as HTMLElement).offsetLeft + btn.clientWidth / 2;
          const distance = Math.abs(btnCenter - scrollCenter);
          if (distance < minDistance && distance < container.clientWidth / 2) {
            minDistance = distance;
            closest = btn.getAttribute('data-view');
          }
        });
      }
      
      if (closest && closest !== viewMode) {
        setViewMode(closest as any);
      }
    }, 150);
  };

  useEffect(() => {
    if (dockRef.current) {
      const activeBtn = dockRef.current.querySelector(`button[data-view="${viewMode}"]`) as HTMLElement;
      if (activeBtn) {
        const container = dockRef.current;
        const scrollTarget = activeBtn.offsetLeft - container.clientWidth / 2 + activeBtn.clientWidth / 2;
        
        if (Math.abs(container.scrollLeft - scrollTarget) > 5) {
          isAutoScrollingRef.current = true;
          container.scrollTo({ left: scrollTarget, behavior: 'smooth' });
          
          // Release the lock after the smooth scroll animation is likely done
          setTimeout(() => {
            isAutoScrollingRef.current = false;
          }, 600);
        }
      }
    }
  }, [viewMode]);

  if (!isMounted) return null;

  return (
    <div className="relative min-h-screen p-3 sm:p-4 md:p-8 overflow-x-hidden flex flex-col bg-agrasya-bg z-0">
      {/* Glassmorphism Background Orbs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-agrasya-green/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]"></div>
        <div className="absolute top-[30%] left-[60%] w-[30%] h-[30%] rounded-full bg-purple-500/10 blur-[100px]"></div>
      </div>

      <header className="mb-4 md:mb-12 flex flex-col gap-3 sm:gap-4 md:gap-6 shrink-0 relative z-50">
        {/* Tier 1: Brand & Global Actions */}
        <div className="bg-agrasya-card/80 backdrop-blur-2xl rounded-full p-1.5 sm:p-2 shadow-lg border border-white/20 dark:border-white/10 relative z-50 w-full min-h-[50px] sm:min-h-[56px] flex items-center">
          
          {/* Inject the Expanding Search Palette */}
          <CommandPalette />

          <div className={cn("flex justify-between items-center w-full transition-opacity duration-200", isSearchOpen ? "opacity-0 pointer-events-none" : "opacity-100")}>
            {/* Left Section: Brand & Workspace */}
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 pl-1 md:pl-2 min-w-0">
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-agrasya-text text-agrasya-bg flex items-center justify-center font-serif font-bold text-base sm:text-lg shadow-inner shrink-0">
                  A<span className="text-agrasya-green">.</span>
                </div>
                <div className="hidden md:flex flex-col justify-center">
                  <h1 className="text-lg font-serif tracking-tight text-agrasya-text leading-none mb-0.5">
                    Agrasya<span className="text-agrasya-green">.</span>
                  </h1>
                  <p className="text-[9px] font-sans text-agrasya-muted uppercase tracking-widest font-bold leading-none">
                    Founder OS
                  </p>
                </div>
              </div>
              
              <div className="w-px h-6 bg-agrasya-border mx-1 hidden sm:block shrink-0"></div>

              <WorkspaceSwitcher />
            </div>
            
            {/* Right Section: Actions */}
            <div className="flex items-center gap-1 md:gap-1.5 pr-1 shrink-0">
              <button 
                onClick={toggleTheme}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-agrasya-muted hover:text-agrasya-text hover:bg-agrasya-surface/80 transition-all border border-transparent hover:border-agrasya-border/50 shrink-0"
                title="Toggle Dark Mode"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              </button>
              
              <button onClick={() => setIsInboxOpen(true)} className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-agrasya-muted hover:text-agrasya-text hover:bg-agrasya-surface/80 transition-all border border-transparent hover:border-agrasya-border/50 shrink-0" title="Inbox">
                <Inbox size={17} className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              
              <button onClick={() => setIsSearchOpen(true)} className="w-9 h-9 sm:w-10 sm:h-10 md:w-auto md:px-5 flex items-center justify-center gap-2 bg-agrasya-text text-agrasya-bg rounded-full hover:scale-105 transition-transform shadow-md shrink-0" title="Search (Cmd+K)">
                <Search size={17} className="w-4 h-4 sm:w-4 sm:h-4" />
                <span className="hidden md:block text-sm font-sans font-medium tracking-wide">Search</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tier 2: App Navigation (The Dock) */}
        <div className="flex justify-center w-full max-w-full mx-auto min-w-0">
          {/* The Capsule Container */}
          <div className="bg-agrasya-card/60 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-xl rounded-[2.5rem] p-1 sm:p-1.5 w-full md:w-auto flex items-center relative min-w-0">
            
            {/* The Scrolling Track */}
            <div 
              ref={dockRef}
              onScroll={handleDockScroll}
              className="flex justify-start overflow-x-auto hide-scrollbar snap-x snap-mandatory gap-1 w-full scroll-smooth py-1 px-1.5 sm:px-2 md:px-1"
            >
              <button data-view="ideas" onClick={() => setViewMode("ideas")} className={cn("whitespace-nowrap px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold font-sans flex items-center gap-1.5 sm:gap-2 transition-all snap-center shrink-0", viewMode === "ideas" ? "bg-agrasya-text text-agrasya-bg shadow-md scale-105" : "text-agrasya-muted hover:text-agrasya-text hover:bg-agrasya-surface/80")}>
                <Lightbulb size={15} className={viewMode === "ideas" ? "text-amber-400" : "text-amber-500"} /> Ideas
              </button>
              <button data-view="board" onClick={() => setViewMode("board")} className={cn("whitespace-nowrap px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold font-sans flex items-center gap-1.5 sm:gap-2 transition-all snap-center shrink-0", viewMode === "board" ? "bg-agrasya-text text-agrasya-bg shadow-md scale-105" : "text-agrasya-muted hover:text-agrasya-text hover:bg-agrasya-surface/80")}>
                <LayoutGrid size={15} /> Board
              </button>
              <button data-view="map" onClick={() => setViewMode("map")} className={cn("whitespace-nowrap px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold font-sans flex items-center gap-1.5 sm:gap-2 transition-all snap-center shrink-0", viewMode === "map" || viewMode === "intelligence" ? "bg-agrasya-text text-agrasya-bg shadow-md scale-105" : "text-agrasya-muted hover:text-agrasya-text hover:bg-agrasya-surface/80")}>
                <GitMerge size={15} /> Intelligence Map
              </button>
              <button data-view="experiments" onClick={() => setViewMode("experiments")} className={cn("whitespace-nowrap px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold font-sans flex items-center gap-1.5 sm:gap-2 transition-all snap-center shrink-0", viewMode === "experiments" ? "bg-agrasya-text text-agrasya-bg shadow-md scale-105" : "text-agrasya-muted hover:text-agrasya-text hover:bg-agrasya-surface/80")}>
                <FlaskConical size={15} /> Experiments
              </button>
              <button data-view="supply_chain" onClick={() => setViewMode("supply_chain")} className={cn("whitespace-nowrap px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold font-sans flex items-center gap-1.5 sm:gap-2 transition-all snap-center shrink-0", viewMode === "supply_chain" ? "bg-agrasya-text text-agrasya-bg shadow-md scale-105" : "text-agrasya-muted hover:text-agrasya-text hover:bg-agrasya-surface/80")}>
                <Truck size={15} /> Supply Chain
              </button>
              <button data-view="analytics" onClick={() => setViewMode("analytics")} className={cn("whitespace-nowrap px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold font-sans flex items-center gap-1.5 sm:gap-2 transition-all snap-center shrink-0", viewMode === "analytics" ? "bg-agrasya-text text-agrasya-bg shadow-md scale-105" : "text-agrasya-muted hover:text-agrasya-text hover:bg-agrasya-surface/80")}>
                <BarChart3 size={15} /> Analytics
              </button>
              <div className="w-px h-6 bg-agrasya-border mx-1.5 sm:mx-2 self-center shrink-0"></div>
              <button data-view="team" onClick={() => setViewMode("team")} className={cn("whitespace-nowrap px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold font-sans flex items-center gap-1.5 sm:gap-2 transition-all snap-center shrink-0", viewMode === "team" ? "bg-agrasya-text text-agrasya-bg shadow-md scale-105" : "text-agrasya-muted hover:text-agrasya-text hover:bg-agrasya-surface/80")}>
                <Users size={15} /> Team
              </button>
            </div>
          </div>
        </div>
      </header>

      {viewMode === "ideas" ? (
        <InstantIdeasCanvas />
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

      {/* Detail Panel Slide-over */}
      <ItemDetailPanel />
      
      {/* Inbox Sidebar */}
      <InboxSidebar />
      
      {/* Global Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-agrasya-text text-agrasya-card px-6 py-3 rounded-full shadow-2xl z-[9999] font-sans font-medium text-sm flex items-center gap-2 border border-agrasya-text/20 backdrop-blur-md"
          >
            <div className="w-2 h-2 rounded-full bg-agrasya-green"></div>
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
