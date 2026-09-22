"use client";

import React, { useMemo } from "react";
import { useMockData } from "../store/MockDataContext";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckSquare, Square, Inbox } from "lucide-react";

export function InboxSidebar() {
  const { items, updateItem, isInboxOpen, setIsInboxOpen, setActiveDetailId } = useMockData();

  // Extract tasks from all descriptions
  const tasks = useMemo(() => {
    const extractedTasks: { itemId: string; itemTitle: string; line: string; text: string; isDone: boolean; zoneId: string }[] = [];
    
    items.forEach((item) => {
      if (!item.description) return;
      
      const lines = item.description.split('\n');
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('- [x] ') || trimmed.startsWith('- [X] ')) {
          extractedTasks.push({
            itemId: item.id,
            itemTitle: item.title,
            zoneId: item.zoneId,
            line: line, // Keep original line for exact replacement
            text: trimmed.substring(6).trim(), // Remove "- [ ] "
            isDone: trimmed.startsWith('- [x] ') || trimmed.startsWith('- [X] ')
          });
        }
      });
    });

    return extractedTasks;
  }, [items]);

  const openTasks = tasks.filter(t => !t.isDone);
  const completedTasks = tasks.filter(t => t.isDone);

  const toggleTask = (task: typeof tasks[0]) => {
    const item = items.find(i => i.id === task.itemId);
    if (!item || !item.description) return;

    // Determine what to replace
    const isCurrentlyDone = task.isDone;
    const replacementText = isCurrentlyDone ? "- [ ] " : "- [x] ";
    
    // Replace just that specific line in the description
    // This is a bit naive if there are duplicate identical lines, but works for most cases
    const updatedLine = task.line.replace(/- \[[ xX]\] /, replacementText);
    const newDescription = item.description.replace(task.line, updatedLine);
    
    updateItem(item.id, { description: newDescription });
  };

  const handleJumpToCard = (itemId: string) => {
    setActiveDetailId(itemId);
  };

  return (
    <AnimatePresence>
      {isInboxOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsInboxOpen(false)}
            className="fixed inset-0 bg-agrasya-text/10 backdrop-blur-[2px] z-[90]"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-full max-w-[340px] bg-agrasya-card border-r border-agrasya-border shadow-2xl z-[91] overflow-y-auto flex flex-col"
          >
            <div className="p-6 border-b border-agrasya-border/50 flex justify-between items-center sticky top-0 bg-agrasya-card/95 backdrop-blur-sm z-10">
              <div className="flex items-center gap-2 text-agrasya-text">
                <Inbox size={20} />
                <h2 className="text-xl font-serif font-bold">Inbox</h2>
                <span className="ml-2 text-xs font-sans font-bold bg-agrasya-green/10 text-agrasya-green px-2 py-0.5 rounded-full">
                  {openTasks.length}
                </span>
              </div>
              <button
                onClick={() => setIsInboxOpen(false)}
                className="p-2 -mr-2 text-agrasya-muted hover:text-agrasya-text transition-colors rounded-full hover:bg-black/5"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex-1 flex flex-col gap-6">
              
              {/* Open Tasks */}
              <div>
                <h3 className="text-xs font-sans font-bold text-agrasya-muted uppercase tracking-wider mb-4">Action Items</h3>
                {openTasks.length === 0 ? (
                  <div className="text-sm italic text-agrasya-muted border-2 border-dashed border-agrasya-border p-4 rounded-lg text-center">
                    No open tasks found! Add `- [ ] task` to any document.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {openTasks.map((task, i) => (
                      <div key={`${task.itemId}-${i}`} className="bg-agrasya-bg border border-agrasya-border p-3 rounded-lg flex items-start gap-3 group">
                        <button 
                          onClick={() => toggleTask(task)}
                          className="mt-0.5 text-agrasya-muted hover:text-agrasya-green transition-colors"
                        >
                          <Square size={16} />
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-sans text-agrasya-text leading-tight mb-1">{task.text}</p>
                          <div 
                            onClick={() => handleJumpToCard(task.itemId)}
                            className="text-[10px] uppercase tracking-wider font-bold text-agrasya-muted hover:text-agrasya-green cursor-pointer truncate"
                          >
                            FROM: {task.itemTitle}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Completed Tasks */}
              {completedTasks.length > 0 && (
                <div className="mt-4 pt-6 border-t border-agrasya-border/50">
                  <h3 className="text-xs font-sans font-bold text-agrasya-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                    Completed <CheckSquare size={12} />
                  </h3>
                  <div className="flex flex-col gap-2">
                    {completedTasks.map((task, i) => (
                      <div key={`done-${task.itemId}-${i}`} className="flex items-start gap-3 opacity-50 group hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => toggleTask(task)}
                          className="mt-0.5 text-agrasya-green"
                        >
                          <CheckSquare size={14} />
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-sans text-agrasya-text line-through truncate">{task.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
