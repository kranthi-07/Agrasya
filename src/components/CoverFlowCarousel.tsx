"use client";

import React, { useState, useEffect } from "react";
import { Item } from "../store/MockDataContext";
import { EntityItem } from "./EntityItem";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";

interface CoverFlowCarouselProps {
  items: Item[];
}

export function CoverFlowCarousel({ items }: CoverFlowCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (activeIndex >= items.length) {
      setActiveIndex(Math.max(0, items.length - 1));
    }
  }, [items.length, activeIndex]);

  if (items.length === 0) return null;

  return (
    <div className="relative w-full h-[450px] flex items-center justify-center overflow-hidden py-4 perspective-[1200px]">
      <AnimatePresence>
        {items.map((item, index) => {
          const isActive = index === activeIndex;
          const offset = index - activeIndex;
          
          // Spread them out further to prevent overlap looking messy, scale down sides more
          const x = offset * 280; 
          const scale = isActive ? 1 : 0.8;
          const zIndex = 50 - Math.abs(offset);
          const opacity = Math.abs(offset) > 2 ? 0 : isActive ? 1 : 0.4;
          const rotateY = offset === 0 ? 0 : offset > 0 ? -25 : 25; 

          return (
            <motion.div
              key={item.id}
              initial={false}
              animate={{
                x,
                scale,
                zIndex,
                opacity,
                rotateY,
              }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 25,
              }}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 w-[340px] will-change-transform origin-center cursor-pointer transition-shadow",
                !isActive && "pointer-events-auto hover:brightness-110", 
                isActive && "shadow-2xl ring-1 ring-agrasya-border/50 rounded-xl"
              )}
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className={cn("w-full bg-agrasya-bg rounded-xl overflow-hidden", isActive ? "pointer-events-auto" : "pointer-events-none select-none")}>
                 <EntityItem item={item} />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
