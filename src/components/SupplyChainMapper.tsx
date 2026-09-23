"use client";

import React, { useState } from "react";
import { Truck, Factory, Store, MapPin, ArrowDown, Wheat, Box, Check, Edit2 } from "lucide-react";
import { cn } from "../lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type SupplyNode = {
  id: string;
  type: "supplier" | "processing" | "distribution" | "transport";
  name: string;
  location: string;
  leadTime: number;
  cost: number;
  notes: string;
};

// Sortable Item Component
function SortableNode({ node, updateNode, removeNode }: { node: SupplyNode, updateNode: any, removeNode: any }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  const [isEditing, setIsEditing] = useState(false);

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div 
        className={cn(
          "p-6 rounded-2xl border flex items-start gap-6 bg-agrasya-card shadow-sm transition-all", 
          isDragging ? "shadow-2xl border-agrasya-green/50 scale-[1.02]" : "border-agrasya-border hover:border-agrasya-muted/30"
        )}
      >
        {/* Drag Handle */}
        <div 
          {...attributes} 
          {...listeners} 
          className="p-3 bg-agrasya-surface rounded-xl text-agrasya-text cursor-grab active:cursor-grabbing hover:bg-agrasya-border transition-colors mt-1"
        >
          {node.type === "supplier" && <Wheat size={24} />}
          {node.type === "processing" && <Factory size={24} />}
          {node.type === "distribution" && <Store size={24} />}
          {node.type === "transport" && <Truck size={24} />}
        </div>
        
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex justify-between items-start">
            {isEditing ? (
              <input 
                value={node.name} 
                autoFocus
                onChange={e => updateNode(node.id, { name: e.target.value })} 
                className="text-lg font-serif font-bold bg-transparent border-b border-agrasya-border focus:outline-none w-1/2"
              />
            ) : (
              <h4 className="text-lg font-serif font-bold text-agrasya-text">{node.name}</h4>
            )}
            
            <div className="flex gap-2">
              <button onClick={() => setIsEditing(!isEditing)} className="p-1.5 text-agrasya-muted hover:text-agrasya-text hover:bg-agrasya-surface rounded-md">
                {isEditing ? <Check size={16} /> : <Edit2 size={16} />}
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-agrasya-muted mt-2">
            <div className="flex items-center gap-1.5">
              <MapPin size={14} />
              {isEditing ? (
                <input value={node.location} onChange={e => updateNode(node.id, { location: e.target.value })} className="bg-transparent border-b border-agrasya-border w-32 focus:outline-none" />
              ) : node.location}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-medium text-agrasya-text">{node.leadTime}</span> days
              {isEditing && (
                <input type="number" value={node.leadTime} onChange={e => updateNode(node.id, { leadTime: Number(e.target.value) })} className="bg-transparent border-b border-agrasya-border w-16 focus:outline-none ml-2 text-xs" />
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-agrasya-green font-medium">${node.cost}</span>
              {isEditing && (
                <input type="number" value={node.cost} onChange={e => updateNode(node.id, { cost: Number(e.target.value) })} className="bg-transparent border-b border-agrasya-border w-16 focus:outline-none ml-2 text-xs" />
              )}
            </div>
          </div>

          {isEditing ? (
            <textarea 
              value={node.notes}
              onChange={e => updateNode(node.id, { notes: e.target.value })}
              placeholder="Important matter or notes..."
              className="w-full mt-3 p-3 text-sm bg-agrasya-surface rounded-lg border border-agrasya-border focus:outline-none resize-none font-sans"
              rows={2}
            />
          ) : (
            node.notes && (
              <p className="text-sm font-sans text-agrasya-muted bg-agrasya-surface/50 p-3 rounded-lg border border-agrasya-border/50 mt-2">
                {node.notes}
              </p>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export function SupplyChainMapper() {
  const [nodes, setNodes] = useState<SupplyNode[]>([
    { id: "n1", type: "supplier", name: "Organic Ragi Farm", location: "Mandya, Karnataka", leadTime: 3, cost: 500, notes: "Requires strict quality check before dispatch." },
    { id: "n2", type: "transport", name: "Cold Chain Transit", location: "Route A", leadTime: 1, cost: 120, notes: "Maintain temp below 15°C." },
    { id: "n3", type: "processing", name: "Agrasya Facility", location: "Mysore", leadTime: 2, cost: 800, notes: "" },
    { id: "n4", type: "distribution", name: "Retail Hub", location: "Bangalore", leadTime: 1, cost: 50, notes: "" }
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setNodes((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addTemplate = (type: "supplier" | "processing" | "distribution" | "transport") => {
    const defaultNames = { supplier: "New Supplier", processing: "Processing Plant", distribution: "Distribution Center", transport: "Logistics Transit" };
    setNodes([...nodes, { 
      id: `n-${Date.now()}`, 
      type, 
      name: defaultNames[type], 
      location: "TBD", 
      leadTime: 1, 
      cost: 0, 
      notes: "" 
    }]);
  };

  const updateNode = (id: string, updates: Partial<SupplyNode>) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const removeNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="flex-1 flex flex-col gap-8 p-4 md:p-8 max-w-5xl mx-auto w-full">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-serif text-agrasya-text mb-2">Supply Chain Engine</h2>
          <p className="text-sm font-sans text-agrasya-muted">Drag to reorder your logistics flow. Total Lead Time: <span className="font-mono text-agrasya-text">{nodes.reduce((a, b) => a + b.leadTime, 0)} days</span></p>
        </div>
      </div>

      {/* Quick Add Templates */}
      <div className="flex gap-4">
        <button onClick={() => addTemplate("supplier")} className="flex items-center gap-2 px-4 py-2 bg-agrasya-card border border-agrasya-border hover:border-amber-400 rounded-lg text-sm font-medium transition-all group">
          <Wheat size={16} className="text-amber-500 group-hover:scale-110 transition-transform" /> Add Supplier
        </button>
        <button onClick={() => addTemplate("transport")} className="flex items-center gap-2 px-4 py-2 bg-agrasya-card border border-agrasya-border hover:border-blue-400 rounded-lg text-sm font-medium transition-all group">
          <Truck size={16} className="text-blue-500 group-hover:scale-110 transition-transform" /> Add Transport
        </button>
        <button onClick={() => addTemplate("processing")} className="flex items-center gap-2 px-4 py-2 bg-agrasya-card border border-agrasya-border hover:border-emerald-400 rounded-lg text-sm font-medium transition-all group">
          <Factory size={16} className="text-emerald-500 group-hover:scale-110 transition-transform" /> Add Processing
        </button>
        <button onClick={() => addTemplate("distribution")} className="flex items-center gap-2 px-4 py-2 bg-agrasya-card border border-agrasya-border hover:border-purple-400 rounded-lg text-sm font-medium transition-all group">
          <Store size={16} className="text-purple-500 group-hover:scale-110 transition-transform" /> Add Delivery
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={nodes} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col">
            {nodes.map((node, index) => (
              <React.Fragment key={node.id}>
                <SortableNode node={node} updateNode={updateNode} removeNode={removeNode} />
                
                {/* Arrow Connector */}
                {index < nodes.length - 1 && (
                  <div className="flex justify-center my-2 text-agrasya-muted/50">
                    <ArrowDown size={24} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
