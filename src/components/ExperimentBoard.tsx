"use client";

import React, { useState } from "react";
import { useMockData, Item } from "../store/MockDataContext";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from "@dnd-kit/core";
import { EntityItem } from "./EntityItem";
import { cn } from "../lib/utils";
import { Beaker, Target, CheckCircle2, XCircle } from "lucide-react";

type Stage = "hypothesis" | "active" | "validated" | "failed";

const STAGES: { id: Stage; title: string; icon: React.ReactNode; color: string }[] = [
  { id: "hypothesis", title: "Hypothesis", icon: <Target size={18} />, color: "border-blue-200 bg-blue-50/30" },
  { id: "active", title: "Active", icon: <Beaker size={18} />, color: "border-yellow-200 bg-yellow-50/30" },
  { id: "validated", title: "Validated", icon: <CheckCircle2 size={18} />, color: "border-green-200 bg-green-50/30" },
  { id: "failed", title: "Failed", icon: <XCircle size={18} />, color: "border-red-200 bg-red-50/30" },
];

function Column({ stage, items }: { stage: typeof STAGES[0], items: Item[] }) {
  const { addItem } = useMockData();
  const [inputValue, setInputValue] = useState("");
  
  const { setNodeRef, isOver } = useDroppable({
    id: `stage-${stage.id}`,
    data: { type: "Stage", stageId: stage.id },
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      addItem({
        title: inputValue.trim(),
        zoneId: "EXPERIMENTS",
        metadata: {
          experimentStage: stage.id
        }
      });
      setInputValue("");
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col flex-1 min-w-[280px] rounded-xl border-2 transition-colors p-4",
        stage.color,
        isOver ? "border-agrasya-green ring-2 ring-agrasya-green/20" : "border-transparent border-agrasya-border/50"
      )}
    >
      <div className="flex items-center gap-2 mb-2 text-agrasya-text font-serif font-semibold border-b border-agrasya-border/50 pb-2">
        <span className="opacity-70">{stage.icon}</span>
        {stage.title}
        <span className="ml-auto text-xs font-sans font-normal text-agrasya-muted bg-white px-2 py-0.5 rounded-full border border-agrasya-border">
          {items.length}
        </span>
      </div>

      <input
        type="text"
        placeholder={`+ Add ${stage.title}...`}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full mb-3 bg-white/50 border border-agrasya-border/50 text-sm font-sans text-agrasya-text placeholder:text-agrasya-muted/70 px-3 py-1.5 rounded-md focus:outline-none focus:border-agrasya-green focus:bg-white transition-colors"
      />
      
      <div className="flex flex-col gap-3 flex-1 overflow-y-auto hide-scrollbar min-h-[200px]">
        {items.map(item => (
          <EntityItem key={item.id} item={item} />
        ))}
        {items.length === 0 && (
          <div className="text-sm italic text-agrasya-muted text-center mt-6">Drop ideas here</div>
        )}
      </div>
    </div>
  );
}

export function ExperimentBoard() {
  const { items, updateItem } = useMockData();
  const [activeItem, setActiveItem] = useState<Item | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = (e: DragStartEvent) => {
    setActiveItem(e.active.data.current?.item as Item);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = e;
    if (!over) return;

    if (over.data.current?.type === "Stage") {
      const stageId = over.data.current.stageId as Stage;
      updateItem(active.id as string, {
        metadata: {
          ...active.data.current?.item?.metadata,
          experimentStage: stageId
        }
      });
    }
  };

  const backlogItems = items.filter(i => 
    !i.metadata?.experimentStage && 
    (i.zoneId === "INSTANT IDEAS" || i.zoneId === "UNKNOWN QUESTIONS")
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex-1 flex gap-6 overflow-hidden bg-white border border-agrasya-border rounded-xl shadow-inner p-6">
        
        {/* Sidebar Backlog */}
        <div className="w-64 flex flex-col border-r border-agrasya-border/50 pr-6 shrink-0">
          <h3 className="font-serif font-semibold text-agrasya-text mb-1">Backlog</h3>
          <p className="text-xs text-agrasya-muted font-sans mb-4">Drag ideas into the experiment pipeline.</p>
          
          <div className="flex flex-col gap-3 flex-1 overflow-y-auto hide-scrollbar pb-10">
            {backlogItems.map(item => (
              <EntityItem key={item.id} item={item} />
            ))}
            {backlogItems.length === 0 && (
              <div className="text-xs text-agrasya-muted text-center mt-10 italic">
                No ideas in backlog. Add some in the Board view.
              </div>
            )}
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
          {STAGES.map(stage => (
            <Column 
              key={stage.id} 
              stage={stage} 
              items={items.filter(i => i.metadata?.experimentStage === stage.id)} 
            />
          ))}
        </div>

        <DragOverlay>
          {activeItem ? (
            <div className="w-[280px] rotate-3 scale-105 shadow-xl cursor-grabbing">
              <EntityItem item={activeItem} />
            </div>
          ) : null}
        </DragOverlay>
        
      </div>
    </DndContext>
  );
}
