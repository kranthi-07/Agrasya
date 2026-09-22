"use client";

import React, { useRef, useState, KeyboardEvent } from "react";
import { useDroppable } from "@dnd-kit/core";
import { ZoneId, Item, useMockData } from "../store/MockDataContext";
import { EntityItem } from "./EntityItem";
import { CoverFlowCarousel } from "./CoverFlowCarousel";
import { FinancialFormModal } from "./FinancialFormModal";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, BarChart2 } from "lucide-react";

interface ZoneCardProps {
  id: ZoneId;
  title: string;
  items: Item[];
  className?: string;
  layout?: "vertical" | "horizontal";
}

export function ZoneCard({ id, title, items, className, layout = "vertical" }: ZoneCardProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
    data: {
      type: "Zone",
      zoneId: id,
    },
  });

  const { addItem, activeDetailId } = useMockData();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  // Check if this zone contains the currently active item
  const hasActiveItem = activeDetailId && items.some(item => item.id === activeDetailId);

  const handleMouseEnter = () => {
    hoverTimeout.current = setTimeout(() => {
      setIsPreviewOpen(true);
    }, 2000);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setIsPreviewOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      addItem({
        title: inputValue.trim(),
        zoneId: id,
      });
      setInputValue("");
    }
  };

  const isFinancial = id === "FINANCIAL OPERATIONS";
  const isHorizontal = layout === "horizontal";

  return (
    <>
    <motion.div
      ref={setNodeRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      layout
      className={cn(
        "relative flex flex-col rounded-xl border border-agrasya-border p-4 shadow-sm transition-all duration-300",
        !className?.includes('bg-') && "bg-agrasya-bg",
        isOver && "bg-agrasya-earth/10 border-agrasya-earth",
        isPreviewOpen && "ring-2 ring-agrasya-green/30 shadow-md",
        hasActiveItem && "ring-2 ring-agrasya-green shadow-xl bg-white",
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-serif font-semibold tracking-tight text-agrasya-text uppercase">
          {title}
        </h3>
        <span className="text-xs text-agrasya-muted font-sans font-medium bg-agrasya-border/50 px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>

      <div 
        className={cn(
          "flex-1 overflow-y-auto pr-1 flex gap-2",
          isHorizontal && !isFinancial ? "flex-row overflow-x-auto snap-x snap-mandatory pb-2 hide-scrollbar" : "flex-col",
          isFinancial && "overflow-visible" 
        )}
      >
        {isFinancial && items.length > 0 ? (
           <CoverFlowCarousel items={items} />
        ) : (
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className={cn(isHorizontal && !isFinancial && "min-w-[85%] snap-center md:min-w-[300px]")}
              >
                <EntityItem item={item} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        
        {items.length === 0 && (
          <div className="h-full w-full min-h-[60px] flex items-center justify-center border-2 border-dashed border-agrasya-border/50 rounded-md shrink-0">
            <span className="text-xs text-agrasya-muted italic font-sans">Empty</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-agrasya-border/50 relative shrink-0">
        {isFinancial ? (
           <button
             onClick={() => setIsModalOpen(true)}
             className="w-full py-2 flex items-center justify-center gap-2 text-sm font-sans font-medium text-agrasya-green hover:bg-agrasya-green/10 rounded-md transition-colors"
           >
             <BarChart2 size={16} /> Create Financial Model
           </button>
        ) : (
          <div className="relative flex items-center">
            <button 
              onClick={() => {
                if (inputValue.trim()) {
                  addItem({ title: inputValue.trim(), zoneId: id });
                  setInputValue("");
                }
              }}
              className="absolute left-2 text-agrasya-muted hover:text-agrasya-green transition-colors p-1"
            >
               <Plus size={14} />
            </button>
            <input
              type="text"
              placeholder="Quick capture..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent border-none text-sm font-sans text-agrasya-text placeholder:text-agrasya-muted/70 pl-8 pr-4 py-2 focus:outline-none focus:ring-0 transition-colors"
            />
          </div>
        )}
      </div>

      {/* Hover Preview Overlay */}
      <AnimatePresence>
        {isPreviewOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-4 right-4 bg-agrasya-text text-agrasya-card text-xs px-3 py-1.5 rounded shadow-lg z-10 pointer-events-none"
          >
            Opening section...
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    
    <FinancialFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
