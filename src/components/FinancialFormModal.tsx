"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2 } from "lucide-react";
import { useMockData } from "../store/MockDataContext";

interface FinancialFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FinancialFormModal({ isOpen, onClose }: FinancialFormModalProps) {
  const { addItem } = useMockData();
  const [title, setTitle] = useState("New Financial Model");
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [rows, setRows] = useState([{ id: "r1", label: "Procurement", value: 0 }]);

  const handleSave = () => {
    addItem({
      title,
      zoneId: "FINANCIAL OPERATIONS",
      metadata: {
        type: "financial_model",
        sellingPrice,
        rows
      }
    });
    onClose();
    // Reset state
    setTitle("New Financial Model");
    setSellingPrice(0);
    setRows([{ id: "r1", label: "Procurement", value: 0 }]);
  };

  const addRow = () => {
    setRows([...rows, { id: `r-${Date.now()}`, label: "New Cost", value: 0 }]);
  };

  const updateRow = (id: string, field: "label" | "value", val: any) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: val } : r));
  };

  const removeRow = (id: string) => {
    setRows(rows.filter(r => r.id !== id));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="bg-agrasya-card rounded-lg w-full max-w-md overflow-hidden border border-agrasya-border z-10 shadow-xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-agrasya-border bg-agrasya-surface/50">
              <h2 className="text-lg font-serif font-semibold text-agrasya-text">Create Financial Model</h2>
              <button onClick={onClose} className="text-agrasya-muted hover:text-agrasya-text transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div>
                <label className="block text-xs font-sans font-semibold text-agrasya-text mb-1 uppercase tracking-wider">Model Name</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full p-2 text-sm font-sans bg-agrasya-surface border border-agrasya-border rounded-md focus:outline-none focus:border-agrasya-green transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-semibold text-agrasya-text mb-1 uppercase tracking-wider">Selling Price (₹)</label>
                <input
                  type="number"
                  value={sellingPrice}
                  onChange={e => setSellingPrice(Number(e.target.value))}
                  className="w-full p-2 text-sm font-sans font-mono bg-agrasya-surface border border-agrasya-border rounded-md focus:outline-none focus:border-agrasya-green transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-sans font-semibold text-agrasya-text uppercase tracking-wider">Cost Structure</label>
                  <button onClick={addRow} className="flex items-center gap-1 text-[10px] uppercase font-bold text-agrasya-green hover:text-agrasya-text transition-colors">
                    <Plus size={12} /> Add Cost
                  </button>
                </div>
                
                <div className="space-y-2">
                  {rows.map(row => (
                    <div key={row.id} className="flex items-center gap-2 group">
                      <input
                        type="text"
                        value={row.label}
                        onChange={e => updateRow(row.id, "label", e.target.value)}
                        className="flex-1 p-2 text-sm font-sans bg-agrasya-surface border border-agrasya-border rounded-md focus:outline-none focus:border-agrasya-green transition-colors"
                        placeholder="Cost Label"
                      />
                      <div className="relative w-32 shrink-0">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-agrasya-muted text-sm">₹</span>
                        <input
                          type="number"
                          value={row.value}
                          onChange={e => updateRow(row.id, "value", Number(e.target.value))}
                          className="w-full py-2 pl-7 pr-2 text-sm font-sans font-mono bg-agrasya-surface border border-agrasya-border rounded-md focus:outline-none focus:border-agrasya-green transition-colors"
                        />
                      </div>
                      <button onClick={() => removeRow(row.id)} className="p-2 text-agrasya-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-agrasya-border/50 bg-agrasya-bg flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 text-sm font-sans font-medium text-agrasya-muted hover:text-agrasya-text transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} className="px-6 py-2 text-sm font-sans font-medium bg-agrasya-text text-white rounded-md hover:bg-agrasya-text/90 transition-colors shadow-sm">
                Save Model
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
