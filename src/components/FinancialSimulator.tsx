"use client";

import React, { useState } from "react";
import { Item, useMockData } from "../store/MockDataContext";
import { cn } from "../lib/utils";
import { Plus, X } from "lucide-react";

interface FinancialSimulatorProps {
  item: Item;
}

export function FinancialSimulator({ item }: FinancialSimulatorProps) {
  const { updateItem } = useMockData();
  
  if (item.metadata?.type !== "financial_model") return null;

  const rows = item.metadata.rows || [];
  const sellingPrice = item.metadata.sellingPrice || 0;

  const totalCost = rows.reduce((acc: number, row: any) => acc + (Number(row.value) || 0), 0);
  const grossProfit = sellingPrice - totalCost;
  const margin = sellingPrice > 0 ? ((grossProfit / sellingPrice) * 100).toFixed(1) : "0.0";

  const updateRow = (id: string, field: "label" | "value", newValue: string | number) => {
    const updatedRows = rows.map((r: any) => r.id === id ? { ...r, [field]: newValue } : r);
    updateItem(item.id, { metadata: { ...item.metadata, rows: updatedRows } });
  };

  const addRow = () => {
    const newRow = { id: `r-${Date.now()}`, label: "New Cost", value: 0 };
    updateItem(item.id, { metadata: { ...item.metadata, rows: [...rows, newRow] } });
  };

  const removeRow = (id: string) => {
    const updatedRows = rows.filter((r: any) => r.id !== id);
    updateItem(item.id, { metadata: { ...item.metadata, rows: updatedRows } });
  };

  const updateSellingPrice = (val: number) => {
    updateItem(item.id, { metadata: { ...item.metadata, sellingPrice: val } });
  };

  return (
    <div className="mt-3 p-3 bg-agrasya-bg rounded border border-agrasya-border/50">
      <div className="space-y-1 mb-3">
        {rows.map((row: any) => (
          <div key={row.id} className="flex items-center justify-between py-1 group/row relative">
            <input
              type="text"
              value={row.label}
              onChange={(e) => updateRow(row.id, "label", e.target.value)}
              className="w-1/2 bg-transparent text-xs text-agrasya-muted font-sans border-b border-transparent group-hover/row:border-agrasya-border focus:outline-none focus:border-agrasya-green transition-colors"
              onPointerDown={(e) => e.stopPropagation()}
            />
            <div className="flex items-center gap-1">
              <span className="text-xs text-agrasya-muted">₹</span>
              <input
                type="number"
                value={row.value}
                onChange={(e) => updateRow(row.id, "value", Number(e.target.value))}
                className="w-12 bg-transparent text-right text-xs font-mono font-medium text-agrasya-text border-b border-transparent group-hover/row:border-agrasya-border focus:outline-none focus:border-agrasya-green transition-colors"
                onPointerDown={(e) => e.stopPropagation()}
              />
              <button 
                onClick={() => removeRow(row.id)}
                className="opacity-0 group-hover/row:opacity-100 text-red-400 hover:text-red-600 transition-opacity absolute -right-2 top-1/2 -translate-y-1/2 bg-agrasya-bg rounded-full"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        ))}
        
        <button 
          onClick={addRow}
          className="flex items-center gap-1 text-[10px] text-agrasya-muted hover:text-agrasya-text mt-2 uppercase tracking-wide"
        >
          <Plus size={10} /> Add Cost
        </button>

        <div className="border-t border-agrasya-border/50 my-2 pt-2 flex items-center justify-between group/row">
           <span className="text-xs text-agrasya-text font-medium font-sans">Selling Price</span>
           <div className="flex items-center gap-1">
              <span className="text-xs text-agrasya-muted">₹</span>
              <input
                type="number"
                value={sellingPrice}
                onChange={(e) => updateSellingPrice(Number(e.target.value))}
                className="w-14 bg-transparent text-right text-xs font-mono font-bold text-agrasya-text border-b border-transparent group-hover/row:border-agrasya-border focus:outline-none focus:border-agrasya-green transition-colors"
                onPointerDown={(e) => e.stopPropagation()}
              />
           </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-agrasya-border/80">
        <div>
          <span className="block text-[10px] uppercase tracking-wider text-agrasya-muted">Gross Profit</span>
          <span className={cn("text-lg font-mono font-semibold", grossProfit >= 0 ? "text-agrasya-green" : "text-red-500")}>
            ₹{grossProfit}
          </span>
        </div>
        <div className="text-right">
          <span className="block text-[10px] uppercase tracking-wider text-agrasya-muted">Margin</span>
          <span className={cn("text-lg font-mono font-semibold", Number(margin) >= 30 ? "text-agrasya-green" : "text-agrasya-text")}>
            {margin}%
          </span>
        </div>
      </div>
    </div>
  );
}
