"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useMockData, Item } from "../store/MockDataContext";
import { motion } from "framer-motion";
import { X, ZoomIn, ZoomOut, GripHorizontal } from "lucide-react";
import { cn } from "../lib/utils";

export function IntelligenceMap() {
  const { items, updateItem, setActiveDetailId, linkItems, removeConnection } = useMockData();
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [linkingFrom, setLinkingFrom] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  const mappedItems = items.filter(item => item.metadata?.mapPosition);
  const unmappedItems = items.filter(item => !item.metadata?.mapPosition);

  const [draggedNode, setDraggedNode] = useState<{ id: string, x: number, y: number } | null>(null);

  // Helper to get actual position (either from Firebase or local drag state)
  const getNodePosition = (item: Item) => {
    if (draggedNode && draggedNode.id === item.id) {
      return { x: draggedNode.x, y: draggedNode.y };
    }
    return item.metadata?.mapPosition || { x: 0, y: 0 };
  };

  // SVG Line Generation
  const drawLines = () => {
    const lines: JSX.Element[] = [];
    
    // Draw established connections
    mappedItems.forEach(item => {
      if (!item.connections) return;
      
      const sourcePos = getNodePosition(item);
      const startX = sourcePos.x + 125;
      const startY = sourcePos.y + 50;
      
      item.connections.forEach(targetId => {
        const target = mappedItems.find(t => t.id === targetId);
        if (target && target.metadata?.mapPosition) {
          const targetPos = getNodePosition(target);
          const endX = targetPos.x + 125;
          const endY = targetPos.y + 50;
          
          const midX = (startX + endX) / 2;
          const d = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
          
          lines.push(
            <g key={`${item.id}-${targetId}`} className="group cursor-pointer pointer-events-auto" onClick={(e) => { e.stopPropagation(); removeConnection(item.id, targetId); }}>
              <path d={d} fill="none" stroke="transparent" strokeWidth={20} />
              <path
                d={d}
                fill="none"
                strokeWidth={2}
                strokeDasharray="4 4"
                className="stroke-agrasya-earth/50 group-hover:stroke-red-500 group-hover:stroke-[3px] transition-all"
              />
            </g>
          );
        }
      });
    });

    // Draw temporary line while linking
    if (linkingFrom) {
      const source = mappedItems.find(i => i.id === linkingFrom);
      if (source && source.metadata?.mapPosition) {
        const sourcePos = getNodePosition(source);
        const startX = sourcePos.x + 125;
        const startY = sourcePos.y + 50;
        
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const endX = (mousePos.x - rect.left - pan.x) / scale;
          const endY = (mousePos.y - rect.top - pan.y) / scale;
          const midX = (startX + endX) / 2;
          const d = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
          
          lines.push(
            <path key="temp-link" d={d} fill="none" stroke="#22c55e" strokeWidth={3} strokeDasharray="6 6" className="opacity-80 animate-pulse" />
          );
        }
      }
    }
    return lines;
  };

  // ... (keeping wheel and pointer handlers the same)
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setScale(s => Math.min(Math.max(0.2, s - e.deltaY * 0.01), 2));
    } else {
      setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.addEventListener('wheel', handleWheel, { passive: false });
      return () => el.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 1 && !e.altKey && (e.target as HTMLElement).closest('.node-element')) return;
    setIsPanning(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    if (isPanning) {
      setPan(p => ({ x: p.x + e.movementX, y: p.y + e.movementY }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsPanning(false);
    
    if (linkingFrom) {
      const targetElement = (e.target as HTMLElement).closest('.node-element');
      if (targetElement) {
        const targetId = targetElement.getAttribute('data-node-id');
        if (targetId && targetId !== linkingFrom) {
          linkItems(linkingFrom, targetId);
        }
      }
      setLinkingFrom(null);
    }
  };

  const handleNodeDrop = (targetId: string) => {
    if (linkingFrom && linkingFrom !== targetId) {
      linkItems(linkingFrom, targetId);
    }
    setLinkingFrom(null);
  };

  const placeOnMap = (item: Item) => {
    const centerViewX = (-pan.x + window.innerWidth / 2) / scale;
    const centerViewY = (-pan.y + window.innerHeight / 2) / scale;
    updateItem(item.id, {
      metadata: { ...item.metadata, mapPosition: { x: centerViewX - 125, y: centerViewY - 50 } }
    });
  };

  const removeFromMap = (item: Item) => {
    const { mapPosition, ...restMeta } = item.metadata || {};
    updateItem(item.id, { metadata: restMeta });
  };

  return (
    <div className="flex-1 flex overflow-hidden border border-agrasya-border rounded-xl bg-agrasya-bg shadow-inner relative">
      
      {/* Sidebar: Unmapped Items */}
      <div className="w-72 bg-agrasya-card border-r border-agrasya-border flex flex-col z-20 shadow-sm relative">
        <div className="p-4 border-b border-agrasya-border/50">
          <h3 className="font-serif font-semibold text-agrasya-text">Data Palette</h3>
          <p className="text-xs text-agrasya-muted font-sans mt-1">Click to drop onto the map.</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {unmappedItems.map(item => (
            <div 
              key={item.id} 
              onClick={() => placeOnMap(item)}
              className="p-3 bg-agrasya-surface border border-agrasya-border/50 rounded-md cursor-pointer hover:border-agrasya-green hover:shadow-md transition-all group"
            >
              <div className="text-[10px] uppercase font-bold text-agrasya-muted mb-1">{item.zoneId}</div>
              <div className="text-sm font-medium text-agrasya-text group-hover:text-agrasya-green transition-colors">{item.title}</div>
            </div>
          ))}
          {unmappedItems.length === 0 && (
            <div className="text-sm text-agrasya-muted italic text-center mt-10">All items mapped.</div>
          )}
        </div>
      </div>

      {/* Infinite Canvas */}
      <div 
        ref={containerRef}
        className={cn("flex-1 relative overflow-hidden select-none", 
          linkingFrom ? "" : (isPanning ? "cursor-grabbing" : "cursor-grab")
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ 
          touchAction: 'none', 
          WebkitUserSelect: 'none',
          cursor: linkingFrom ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cpath d='M16 2 L16 30 M2 16 L30 16' stroke='black' stroke-width='3'/%3E%3C/svg%3E") 16 16, crosshair` : undefined 
        }}
      >
        <div 
          className="absolute origin-top-left will-change-transform"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
        >
          {/* SVG Connection Layer */}
          <svg className="absolute overflow-visible pointer-events-none z-0">
            {drawLines()}
          </svg>

          {/* Nodes */}
          {mappedItems.map(item => {
            const pos = getNodePosition(item);
            return (
            <motion.div
              key={item.id}
              data-node-id={item.id}
              drag={!linkingFrom} 
              dragMomentum={false}
              onDragStart={() => {
                if (!linkingFrom && item.metadata?.mapPosition) {
                  setDraggedNode({ id: item.id, x: item.metadata.mapPosition.x, y: item.metadata.mapPosition.y });
                }
              }}
              onDrag={(e, info) => {
                if (linkingFrom || !draggedNode) return;
                setDraggedNode(prev => prev ? { ...prev, x: prev.x + info.delta.x / scale, y: prev.y + info.delta.y / scale } : null);
              }}
              onDragEnd={() => {
                if (draggedNode) {
                  updateItem(item.id, {
                    metadata: { ...item.metadata, mapPosition: { x: draggedNode.x, y: draggedNode.y } }
                  });
                  setDraggedNode(null);
                }
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
                if (linkingFrom) handleNodeDrop(item.id);
              }}
              className={cn(
                "absolute z-10 w-[250px] bg-agrasya-card border rounded-lg shadow-sm hover:shadow-md transition-shadow group flex flex-col node-element",
                linkingFrom === item.id ? "border-agrasya-green ring-2 ring-agrasya-green/30" : "border-agrasya-border"
              )}
              style={{ x: pos.x, y: pos.y }}
            >
              <div 
                className="flex items-center justify-between p-2 border-b border-agrasya-border/30 bg-agrasya-surface/50 cursor-grab active:cursor-grabbing"
              >
                <div className="flex items-center gap-1.5 text-agrasya-muted pointer-events-none">
                  <GripHorizontal size={14} />
                  <span className="text-[9px] uppercase font-bold tracking-wider">{item.zoneId}</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeFromMap(item); }} 
                  onPointerDown={(e) => e.stopPropagation()}
                  className="p-1 text-agrasya-muted hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors pointer-events-auto"
                >
                  <X size={12} />
                </button>
              </div>
              <div 
                className="p-3 cursor-pointer pointer-events-auto relative" 
                onClick={(e) => { e.stopPropagation(); setActiveDetailId(item.id); }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <h4 className="text-sm font-medium text-agrasya-text leading-tight">{item.title}</h4>
                {item.metadata?.type === "financial_model" && (
                  <div className="mt-2 text-xs font-mono text-agrasya-green bg-agrasya-green/10 px-2 py-1 rounded inline-block">
                    Financial Engine
                  </div>
                )}
                
                {/* Visual Linking Thread Handle */}
                <div 
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setLinkingFrom(item.id);
                  }}
                  className="absolute -right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center opacity-100 cursor-crosshair z-20"
                >
                  <div className="w-3.5 h-3.5 bg-agrasya-green border-2 border-agrasya-card rounded-full shadow-sm hover:scale-125 transition-transform" title="Drag to link to another card" />
                </div>
              </div>
            </motion.div>
            );
          })}
        </div>
      </div>

      {/* Controls Overlay */}
      <div className="absolute bottom-6 right-6 flex flex-col bg-agrasya-card border border-agrasya-border rounded-md shadow-sm z-20">
        <button onClick={() => setScale(s => Math.min(s + 0.1, 2))} className="p-2 text-agrasya-text hover:bg-black/5 border-b border-agrasya-border transition-colors">
          <ZoomIn size={18} />
        </button>
        <button onClick={() => setScale(s => Math.max(s - 0.1, 0.2))} className="p-2 text-agrasya-text hover:bg-black/5 transition-colors">
          <ZoomOut size={18} />
        </button>
      </div>
      
      {/* Help Tip */}
      <div className="absolute top-4 right-4 bg-white/80 backdrop-blur px-3 py-1.5 text-xs text-agrasya-muted rounded-full border border-agrasya-border z-20 pointer-events-none">
        Drag canvas to pan · Scroll to zoom
      </div>

    </div>
  );
}
