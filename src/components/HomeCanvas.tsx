"use client";
import React, { useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
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
import { LayoutGrid, Network, GitMerge, FlaskConical, BarChart3, Search, Inbox, Users, Truck } from "lucide-react";
import { cn } from "../lib/utils";

export function HomeCanvas() {
  const { cloneItem, linkItems, setIsSearchOpen, setIsInboxOpen, workspaces, activeWorkspaceId, splitWorkspaceId, copyItemToWorkspace } = useMockData();
  const [activeItem, setActiveItem] = useState<Item | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [viewMode, setViewMode] = useState<"board" | "map" | "intelligence" | "experiments" | "analytics" | "supply_chain" | "team">("board");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 700, tolerance: 5 } })
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

  if (!isMounted) return null;

  return (
    <div className="relative min-h-screen p-4 md:p-8 overflow-x-hidden flex flex-col bg-agrasya-bg">
      <header className="mb-8 md:mb-12 flex flex-col gap-6 shrink-0 relative z-10">
        {/* Tier 1: Brand & Global Actions */}
        <div className="flex justify-between items-center bg-agrasya-bg/80 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-agrasya-border relative z-50">
          <div className="flex items-center gap-6">
            <div className="flex items-start gap-2">
              <div>
                <h1 className="text-2xl font-serif tracking-tight text-agrasya-text leading-none mb-1">
                  Agrasya<span className="text-agrasya-green">.</span>
                </h1>
                <p className="text-[10px] font-sans text-agrasya-muted uppercase tracking-widest font-bold">
                  Founder OS
                </p>
              </div>
              <span className="bg-agrasya-green/10 text-agrasya-green text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border border-agrasya-green/20 mt-0.5">
                v2
              </span>
            </div>
            
            <div className="w-px h-8 bg-agrasya-border"></div>

          <div className="flex items-center gap-2">
            <WorkspaceSwitcher />
          </div>
        </div>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={() => document.documentElement.classList.toggle('dark')}
              className="p-2 rounded-full text-agrasya-muted hover:text-agrasya-text hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title="Toggle Dark Mode"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            </button>
            <button onClick={() => setIsInboxOpen(true)} className="p-2 rounded-full text-agrasya-muted hover:text-agrasya-text hover:bg-black/5 dark:hover:bg-white/10 transition-colors" title="Inbox">
              <Inbox size={20} />
            </button>
            <button onClick={() => setIsSearchOpen(true)} className="flex items-center gap-2 ml-2 px-4 py-2 bg-agrasya-surface rounded-full text-sm font-sans text-agrasya-muted hover:text-agrasya-text border border-agrasya-border hover:border-agrasya-muted transition-colors" title="Search (Cmd+K)">
              <Search size={16} /> <span className="hidden md:inline">Global Search</span> <span className="opacity-50 text-xs font-mono ml-1">⌘K</span>
            </button>
          </div>
        </div>

        {/* Tier 2: App Navigation (The Dock) */}
        <div className="flex justify-center">
          <div className="flex bg-agrasya-card/80 backdrop-blur-xl border border-agrasya-border shadow-lg rounded-full p-1.5 gap-1">
            <button onClick={() => setViewMode("board")} className={cn("px-5 py-2.5 rounded-full text-sm font-semibold font-sans flex items-center gap-2 transition-all", viewMode === "board" ? "bg-agrasya-text text-agrasya-bg shadow-md scale-105" : "text-agrasya-muted hover:text-agrasya-text hover:bg-agrasya-surface")}>
              <LayoutGrid size={16} /> Board
            </button>
            <button onClick={() => setViewMode("map")} className={cn("px-5 py-2.5 rounded-full text-sm font-semibold font-sans flex items-center gap-2 transition-all", viewMode === "map" || viewMode === "intelligence" ? "bg-agrasya-text text-agrasya-bg shadow-md scale-105" : "text-agrasya-muted hover:text-agrasya-text hover:bg-agrasya-surface")}>
              <GitMerge size={16} /> Intelligence Map
            </button>
            <button onClick={() => setViewMode("experiments")} className={cn("px-5 py-2.5 rounded-full text-sm font-semibold font-sans flex items-center gap-2 transition-all", viewMode === "experiments" ? "bg-agrasya-text text-agrasya-bg shadow-md scale-105" : "text-agrasya-muted hover:text-agrasya-text hover:bg-agrasya-surface")}>
              <FlaskConical size={16} /> Experiments
            </button>
            <button onClick={() => setViewMode("supply_chain")} className={cn("px-5 py-2.5 rounded-full text-sm font-semibold font-sans flex items-center gap-2 transition-all", viewMode === "supply_chain" ? "bg-agrasya-text text-agrasya-bg shadow-md scale-105" : "text-agrasya-muted hover:text-agrasya-text hover:bg-agrasya-surface")}>
              <Truck size={16} /> Supply Chain
            </button>
            <button onClick={() => setViewMode("analytics")} className={cn("px-5 py-2.5 rounded-full text-sm font-semibold font-sans flex items-center gap-2 transition-all", viewMode === "analytics" ? "bg-agrasya-text text-agrasya-bg shadow-md scale-105" : "text-agrasya-muted hover:text-agrasya-text hover:bg-agrasya-surface")}>
              <BarChart3 size={16} /> Analytics
            </button>
            <div className="w-px h-6 bg-agrasya-border mx-2 self-center"></div>
            <button onClick={() => setViewMode("team")} className={cn("px-5 py-2.5 rounded-full text-sm font-semibold font-sans flex items-center gap-2 transition-all", viewMode === "team" ? "bg-agrasya-text text-agrasya-bg shadow-md scale-105" : "text-agrasya-muted hover:text-agrasya-text hover:bg-agrasya-surface")}>
              <Users size={16} /> Team
            </button>
          </div>
        </div>
      </header>

      {viewMode === "analytics" ? (
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
      
      {/* Omni Search */}
      <CommandPalette />

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
