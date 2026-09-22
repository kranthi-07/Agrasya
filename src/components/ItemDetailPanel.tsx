"use client";

import React, { useState, useEffect } from "react";
import { useMockData } from "../store/MockDataContext";
import { motion, AnimatePresence } from "framer-motion";
import { X, Paperclip, FileText, Edit3, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";

export function ItemDetailPanel() {
  const { activeDetailId, setActiveDetailId, items, updateItem } = useMockData();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");

  const activeItem = items.find((i) => i.id === activeDetailId);

  useEffect(() => {
    if (activeItem) {
      setEditContent(activeItem.description || "");
      setIsEditing(false); // Reset to view mode when changing items
    }
  }, [activeItem?.id]);

  const handleSave = () => {
    if (activeItem) {
      updateItem(activeItem.id, { description: editContent });
    }
    setIsEditing(false);
  };

  return (
    <AnimatePresence>
      {activeItem && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveDetailId(null)}
            className="fixed inset-0 bg-agrasya-text/10 backdrop-blur-[2px] z-[100]"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-agrasya-bg border-l border-agrasya-border shadow-2xl z-[101] overflow-y-auto flex flex-col"
          >
            <div className="p-6 border-b border-agrasya-border/50 flex justify-between items-start sticky top-0 bg-agrasya-bg/95 backdrop-blur-sm z-10">
              <div className="flex-1">
                <span className="text-xs font-sans text-agrasya-muted uppercase tracking-wider">
                  {activeItem.zoneId}
                </span>
                <h2 className="text-2xl font-serif font-semibold text-agrasya-text mt-1 pr-4">
                  {activeItem.title}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <button
                    onClick={handleSave}
                    className="p-1.5 text-white bg-agrasya-green rounded-md hover:bg-agrasya-green/90 transition-colors flex items-center gap-1 text-xs font-semibold px-3"
                  >
                    <Check size={14} /> Save
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 text-agrasya-muted hover:text-agrasya-text hover:bg-black/5 rounded-md transition-colors"
                    title="Edit Document"
                  >
                    <Edit3 size={16} />
                  </button>
                )}
                <button
                  onClick={() => setActiveDetailId(null)}
                  className="p-2 text-agrasya-muted hover:text-agrasya-text transition-colors rounded-full hover:bg-black/5"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col gap-8">
              <section className="flex-1 flex flex-col">
                <h3 className="text-sm font-sans font-semibold text-agrasya-text mb-3">Strategic Document</h3>
                
                {isEditing ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="flex-1 w-full min-h-[300px] p-4 text-sm font-sans text-agrasya-text bg-white border border-agrasya-border rounded-lg focus:outline-none focus:ring-2 focus:ring-agrasya-green/30 resize-y"
                    placeholder="Write your thesis, ideas, or markdown here..."
                  />
                ) : (
                  <div className="prose prose-sm prose-agrasya max-w-none text-agrasya-text">
                    {activeItem.description ? (
                      <ReactMarkdown>{activeItem.description}</ReactMarkdown>
                    ) : (
                      <div className="text-agrasya-muted italic">No document written yet. Click edit to start.</div>
                    )}
                  </div>
                )}
              </section>

              {/* Attachments Section */}
              {activeItem.metadata?.attachments && activeItem.metadata.attachments.length > 0 && (
                <section className="pt-6 border-t border-agrasya-border/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Paperclip size={16} className="text-agrasya-earth" />
                    <h3 className="text-sm font-sans font-semibold text-agrasya-text">Attachments</h3>
                  </div>
                  <div className="flex flex-col gap-2">
                    {activeItem.metadata.attachments.map((att: any) => (
                      <div key={att.id} className="flex items-center gap-3 p-2 rounded-md border border-agrasya-border bg-white shadow-sm cursor-pointer hover:border-agrasya-earth transition-colors">
                         <div className="p-2 bg-red-50 text-red-600 rounded">
                            <FileText size={16} />
                         </div>
                         <span className="text-sm font-sans font-medium text-agrasya-text truncate">{att.name}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
