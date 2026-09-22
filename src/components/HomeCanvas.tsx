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
import { ZoneCard } from "./ZoneCard";
import { EntityItem } from "./EntityItem";
import { AnimatePresence, motion } from "framer-motion";
import { ItemDetailPanel } from "./ItemDetailPanel";
import { IntelligenceMap } from "./IntelligenceMap";
import { ExperimentBoard } from "./ExperimentBoard";
import { FinancialDashboard } from "./FinancialDashboard";
import { CommandPalette } from "./CommandPalette";
import { InboxSidebar } from "./InboxSidebar";
import { TeamPanel } from "./TeamPanel";
import { LayoutGrid, Network, GitMerge, FlaskConical, BarChart3, Search, Inbox, Users } from "lucide-react";
import { cn } from "../lib/utils";

export function HomeCanvas() {
  const { items, moveItem, linkItems, setIsSearchOpen, setIsInboxOpen } = useMockData();
  const [activeItem, setActiveItem] = useState<Item | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [viewMode, setViewMode] = useState<"board" | "map" | "intelligence" | "experiments" | "analytics" | "team">("board");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ... (sensors block)
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
        if (sourceItem.zoneId !== targetZoneId) {
          moveItem(sourceItem.id, targetZoneId);
          showToast(`MOVED TO ${targetZoneId}`);
        }
      } else if (targetType === "EntityItem" && over.data.current?.item) {
        const targetItem = over.data.current.item as Item;
        if (sourceItem.id !== targetItem.id) {
          linkItems(sourceItem.id, targetItem.id);
          showToast(`LINKED TO ${targetItem.title.substring(0, 15)}...`);
        }
      }
    }
    setActiveItem(null);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getItemsForZone = (zoneId: ZoneId) => items.filter((item) => item.zoneId === zoneId);

  if (!isMounted) return null;

  return (
    <div className="relative min-h-screen p-4 md:p-8 overflow-x-hidden flex flex-col bg-agrasya-bg">
      <header className="mb-8 md:mb-12 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-3xl font-serif tracking-tight text-agrasya-text mb-1">
            Agrasya<span className="text-agrasya-green">.</span>
          </h1>
          <p className="text-sm font-sans text-agrasya-muted uppercase tracking-widest font-medium">
            Founder OS
          </p>
        </div>
        
        <div className="flex bg-agrasya-border/30 rounded-lg p-1">
          <button onClick={() => setViewMode("board")} className={cn("px-4 py-2 rounded-md text-sm font-medium font-sans flex items-center gap-2 transition-all", viewMode === "board" ? "bg-white shadow-sm text-agrasya-text" : "text-agrasya-muted hover:text-agrasya-text")}>
            <LayoutGrid size={16} /> Board
          </button>
          <button onClick={() => setViewMode("map")} className={cn("px-4 py-2 rounded-md text-sm font-medium font-sans flex items-center gap-2 transition-all", viewMode === "map" || viewMode === "intelligence" ? "bg-white shadow-sm text-agrasya-green" : "text-agrasya-muted hover:text-agrasya-text")}>
            <GitMerge size={16} /> Intelligence Map
          </button>
          <button onClick={() => setViewMode("experiments")} className={cn("px-4 py-2 rounded-md text-sm font-medium font-sans flex items-center gap-2 transition-all", viewMode === "experiments" ? "bg-white shadow-sm text-agrasya-green" : "text-agrasya-muted hover:text-agrasya-text")}>
            <FlaskConical size={16} /> Experiments
          </button>
          <button onClick={() => setViewMode("analytics")} className={cn("px-4 py-2 rounded-md text-sm font-medium font-sans flex items-center gap-2 transition-all", viewMode === "analytics" ? "bg-white shadow-sm text-agrasya-green" : "text-agrasya-muted hover:text-agrasya-text")}>
            <BarChart3 size={16} /> Analytics
          </button>
          <button onClick={() => setViewMode("team")} className={cn("px-4 py-2 rounded-md text-sm font-medium font-sans flex items-center gap-2 transition-all", viewMode === "team" ? "bg-white shadow-sm text-agrasya-green" : "text-agrasya-muted hover:text-agrasya-text")}>
            <Users size={16} /> Team
          </button>
          
          <div className="w-px h-6 bg-agrasya-border mx-1 self-center"></div>
          
          <button 
            onClick={() => {
              document.documentElement.classList.toggle('dark');
            }}
            className="px-4 py-2 rounded-md text-sm font-medium font-sans flex items-center gap-2 transition-all text-agrasya-muted hover:text-agrasya-text hover:bg-black/5 dark:hover:bg-white/10"
            title="Toggle Dark Mode"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg> Theme
          </button>

          <button onClick={() => setIsInboxOpen(true)} className="px-4 py-2 rounded-md text-sm font-medium font-sans flex items-center gap-2 transition-all text-agrasya-muted hover:text-agrasya-text hover:bg-black/5 dark:hover:bg-white/10" title="Inbox">
            <Inbox size={16} /> Inbox
          </button>
          <button onClick={() => setIsSearchOpen(true)} className="px-4 py-2 rounded-md text-sm font-medium font-sans flex items-center gap-2 transition-all text-agrasya-muted hover:text-agrasya-text hover:bg-black/5 dark:hover:bg-white/10" title="Search (Cmd+K)">
            <Search size={16} /> Search
          </button>
        </div>
      </header>

      {viewMode === "analytics" ? (
        <FinancialDashboard />
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
          {/* Asymmetrical Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 auto-rows-[minmax(250px,auto)] flex-1">
          
          <ZoneCard
            id="INSTANT IDEAS"
            title="Instant Ideas"
            items={getItemsForZone("INSTANT IDEAS")}
            className="md:col-span-2 xl:col-span-2 xl:row-span-2 bg-amber-50 dark:bg-black/20 border-amber-200 dark:border-white/5 shadow-sm"
          />

          <ZoneCard
            id="FINANCIAL OPERATIONS"
            title="Financial Operations"
            items={getItemsForZone("FINANCIAL OPERATIONS")}
            layout="horizontal"
            className="xl:col-span-2 xl:row-span-2 bg-emerald-50 dark:bg-black/20 border-emerald-200 dark:border-white/5 shadow-sm" 
          />

          <ZoneCard
            id="MY LEARNINGS"
            title="My Learnings"
            items={getItemsForZone("MY LEARNINGS")}
            className="xl:col-span-1 xl:row-span-1 bg-blue-50 dark:bg-black/20 border-blue-200 dark:border-white/5 shadow-sm"
          />

          <ZoneCard
            id="UNKNOWN QUESTIONS"
            title="Unknown Questions"
            items={getItemsForZone("UNKNOWN QUESTIONS")}
            className="xl:col-span-1 xl:row-span-1 bg-purple-50 dark:bg-black/20 border-purple-200 dark:border-white/5 shadow-sm"
          />

          <ZoneCard
            id="SUCCESS STORIES"
            title="Success Stories"
            items={getItemsForZone("SUCCESS STORIES")}
            className="xl:col-span-2 xl:row-span-1 bg-green-50 dark:bg-black/20 border-green-200 dark:border-white/5 shadow-sm"
          />

          <ZoneCard
            id="FAILURE STORIES"
            title="Failure Stories"
            items={getItemsForZone("FAILURE STORIES")}
            className="xl:col-span-2 xl:row-span-1 bg-rose-50 dark:bg-black/20 border-rose-200 dark:border-white/5 shadow-sm"
          />

          <ZoneCard
            id="FARMERS"
            title="Farmers"
            items={getItemsForZone("FARMERS")}
            className="md:col-span-2 xl:col-span-2 xl:row-span-1 bg-orange-50 dark:bg-black/20 border-orange-200 dark:border-white/5 shadow-sm"
          />

          <ZoneCard
            id="PRODUCTS"
            title="Products"
            items={getItemsForZone("PRODUCTS")}
            className="xl:col-span-1 xl:row-span-1 bg-sky-50 dark:bg-black/20 border-sky-200 dark:border-white/5 shadow-sm"
          />
          
          <ZoneCard
            id="SUPPLY CHAIN"
            title="Supply Chain"
            items={getItemsForZone("SUPPLY CHAIN")}
            className="xl:col-span-1 xl:row-span-1 bg-slate-100 dark:bg-black/20 border-slate-300 dark:border-white/5 shadow-sm"
          />

          <ZoneCard
            id="EXPERIMENTS"
            title="Experiments"
            items={getItemsForZone("EXPERIMENTS")}
            className="md:col-span-2 xl:col-span-4 xl:row-span-1 border-dashed border-2 bg-indigo-50 dark:bg-black/20 border-indigo-200 dark:border-white/5 shadow-sm"
          />

        </div>

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
