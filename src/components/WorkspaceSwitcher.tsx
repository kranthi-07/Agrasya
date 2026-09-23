"use client";

import React, { useState, useRef, useEffect } from "react";
import { useMockData } from "../store/MockDataContext";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Plus, LayoutTemplate, SplitSquareHorizontal, X } from "lucide-react";
import { cn } from "../lib/utils";

export function WorkspaceSwitcher() {
  const { workspaces, activeWorkspaceId, setActiveWorkspaceId, splitWorkspaceId, setSplitWorkspaceId, createWorkspace } = useMockData();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeWs = workspaces.find(w => w.id === activeWorkspaceId);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (id: string) => {
    setActiveWorkspaceId(id);
    if (splitWorkspaceId === id) {
      setSplitWorkspaceId(null);
    }
    setIsOpen(false);
  };

  const handleSplit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (splitWorkspaceId === id) {
      setSplitWorkspaceId(null);
    } else {
      setSplitWorkspaceId(id);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-agrasya-surface transition-colors border border-transparent hover:border-agrasya-border group"
      >
        <div className="flex flex-col items-start text-left">
          <span className="text-xs font-sans text-agrasya-muted uppercase tracking-widest font-bold">Current Workspace</span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-serif font-medium text-agrasya-text leading-tight">{activeWs?.name || "Select Workspace"}</span>
            <ChevronDown size={16} className={cn("text-agrasya-muted transition-transform", isOpen && "rotate-180")} />
          </div>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute top-full left-0 mt-2 w-80 bg-agrasya-card border border-agrasya-border rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col"
          >
            <div className="p-3 bg-agrasya-surface/50 border-b border-agrasya-border">
              <span className="text-xs font-sans text-agrasya-muted uppercase tracking-widest font-bold ml-2">Switch or Split</span>
            </div>
            
            <div className="flex flex-col p-2 max-h-[50vh] overflow-y-auto">
              {workspaces.map((ws, i) => {
                const isActive = activeWorkspaceId === ws.id;
                const isSplit = splitWorkspaceId === ws.id;
                
                return (
                  <motion.div
                    key={ws.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleSelect(ws.id)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all mb-1",
                      isActive ? "bg-agrasya-green/10 border border-agrasya-green/30" : 
                      isSplit ? "bg-blue-500/10 border border-blue-500/30" :
                      "hover:bg-agrasya-surface border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", isActive ? "bg-agrasya-green/20 text-agrasya-green" : isSplit ? "bg-blue-500/20 text-blue-500" : "bg-agrasya-bg text-agrasya-muted")}>
                        <LayoutTemplate size={16} />
                      </div>
                      <div>
                        <h4 className="text-sm font-sans font-semibold text-agrasya-text">{ws.name}</h4>
                        {isActive && <span className="text-[10px] text-agrasya-green uppercase tracking-wider font-bold">Active</span>}
                        {isSplit && <span className="text-[10px] text-blue-500 uppercase tracking-wider font-bold">Split Screen</span>}
                      </div>
                    </div>
                    
                    {!isActive && (
                      <button 
                        onClick={(e) => handleSplit(ws.id, e)}
                        className={cn("p-2 rounded-lg transition-colors", isSplit ? "bg-blue-500 text-white" : "text-agrasya-muted hover:text-agrasya-text hover:bg-agrasya-bg")}
                        title={isSplit ? "Close Split Screen" : "Open in Split Screen"}
                      >
                        {isSplit ? <X size={14} /> : <SplitSquareHorizontal size={14} />}
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>

            <div className="p-2 border-t border-agrasya-border bg-agrasya-bg/50">
              <button 
                onClick={() => {
                  const name = prompt("Enter new workspace name:");
                  if (name) {
                    createWorkspace(name);
                    setIsOpen(false);
                  }
                }}
                className="w-full flex items-center gap-2 p-3 text-sm font-sans font-medium text-agrasya-text hover:bg-agrasya-surface rounded-xl transition-colors"
              >
                <div className="p-1 rounded-full bg-agrasya-border">
                  <Plus size={14} />
                </div>
                Create New Workspace
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
