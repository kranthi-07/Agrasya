"use client";

import React, { useState, KeyboardEvent, useEffect, useRef } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Item, useMockData } from "../store/MockDataContext";
import { cn } from "../lib/utils";
import { GripVertical, Edit2, Trash2 } from "lucide-react";
import { FinancialSimulator } from "./FinancialSimulator";
import { motion, AnimatePresence } from "framer-motion";

interface EntityItemProps {
  item: Item;
}

export function EntityItem({ item }: EntityItemProps) {
  const { setActiveDetailId, updateItem, deleteItem, activeDetailId } = useMockData();
  const isActive = activeDetailId === item.id;
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editDesc, setEditDesc] = useState(item.description || "");
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { attributes, listeners, setNodeRef: setDraggableRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { type: "EntityItem", item },
    disabled: isEditing || contextMenu !== null
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `droppable-${item.id}`,
    data: { type: "EntityItem", item }
  });

  const setNodeRef = (element: HTMLElement | null) => {
    setDraggableRef(element);
    setDroppableRef(element);
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // Close context menu on outside click
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [contextMenu]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleSave = () => {
    updateItem(item.id, { title: editTitle, description: editDesc });
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSave();
    }
    if (e.key === "Escape") {
      setEditTitle(item.title);
      setEditDesc(item.description || "");
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    deleteItem(item.id);
  };

  const pointerDownPos = useRef<{ x: number, y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isEditing) return;
    
    // Check if it was a drag (moved more than 5px)
    if (pointerDownPos.current) {
      const dx = Math.abs(e.clientX - pointerDownPos.current.x);
      const dy = Math.abs(e.clientY - pointerDownPos.current.y);
      if (dx > 5 || dy > 5) {
        return; // It was a drag, ignore click
      }
    }
    
    setActiveDetailId(item.id);
  };

  const style = { transform: CSS.Translate.toString(transform) };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        onContextMenu={handleContextMenu}
        className={cn(
          "group relative flex flex-col p-3 mb-2 rounded-md border bg-agrasya-card shadow-sm transition-all",
          isDragging ? "opacity-50 z-50 ring-2 ring-agrasya-green border-transparent" : "hover:border-agrasya-earth cursor-pointer",
          isOver && !isDragging && "ring-2 ring-agrasya-green bg-agrasya-green/5",
          isActive ? "border-agrasya-green ring-2 ring-agrasya-green/50 shadow-md bg-green-50/20" : "border-agrasya-border",
          "touch-none" 
        )}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        {...(!isEditing && !contextMenu ? listeners : {})}
        {...(!isEditing && !contextMenu ? attributes : {})}
      >
      <div className="flex items-start gap-2">
        {!isEditing && (
          <button className="mt-0.5 text-agrasya-muted opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
            <GripVertical size={14} />
          </button>
        )}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex flex-col gap-1" onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
              <input
                ref={inputRef}
                type="text"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSave}
                className="w-full text-sm font-medium text-agrasya-text font-sans leading-tight bg-transparent border-b border-agrasya-green focus:outline-none"
              />
              <textarea
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSave}
                placeholder="Description..."
                className="w-full mt-1 text-xs text-agrasya-text whitespace-pre-line font-sans bg-transparent border-b border-transparent focus:border-agrasya-border focus:outline-none resize-none"
                rows={2}
              />
            </div>
          ) : (
            <>
              <h4 className="text-sm font-medium text-agrasya-text font-sans leading-tight">
                {item.title}
              </h4>
              {item.description && (
                <p className="mt-1 text-xs text-agrasya-muted whitespace-pre-line font-sans line-clamp-3">
                  {item.description}
                </p>
              )}
            </>
          )}
          
          {item.metadata?.type === "financial_model" && (
             <div onClick={(e) => e.stopPropagation()} className="cursor-default">
               <FinancialSimulator item={item} />
             </div>
          )}
          
          {item.connections && item.connections.length > 0 && (
             <div className="mt-2 flex gap-1">
               {item.connections.map(c => (
                 <span key={c} className="w-1.5 h-1.5 rounded-full bg-agrasya-green/40" title="Has connections"></span>
               ))}
             </div>
          )}
        </div>
      </div>
    </div>
    
    <AnimatePresence>
      {contextMenu && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.1 }}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          className="fixed z-[9999] bg-agrasya-bg border border-agrasya-border shadow-xl rounded-md w-40 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { setIsEditing(true); setContextMenu(null); }}
            className="w-full text-left px-4 py-2 text-sm text-agrasya-text hover:bg-agrasya-border/30 flex items-center gap-2 transition-colors font-sans"
          >
            <Edit2 size={14} className="text-agrasya-muted" /> Edit Details
          </button>
          <button
            onClick={() => { handleDelete(); setContextMenu(null); }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors font-sans border-t border-agrasya-border/50"
          >
            <Trash2 size={14} className="text-red-400" /> Delete Item
          </button>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
