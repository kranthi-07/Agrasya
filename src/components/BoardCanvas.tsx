"use client";

import React from "react";
import { ZoneCard } from "./ZoneCard";
import { useMockData, ZoneId } from "../store/MockDataContext";
import { cn } from "../lib/utils";

export function BoardCanvas({ workspaceId }: { workspaceId: string }) {
  const { items } = useMockData();
  
  // Only show items that belong to this specific workspace
  const workspaceItems = items.filter(item => item.workspaceIds?.includes(workspaceId));

  const getItemsForZone = (zoneId: ZoneId) => workspaceItems.filter((item) => item.zoneId === zoneId);

  // We append the workspaceId to the zoneId when rendering the Drop target.
  // This allows the DragEnd handler to know WHICH workspace a card was dropped into.
  const createDropId = (zoneId: ZoneId) => `${workspaceId}::${zoneId}`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 auto-rows-[minmax(250px,auto)] flex-1 w-full h-full p-2 pb-24">
      <ZoneCard
        id={createDropId("INSTANT IDEAS")}
        title="Instant Ideas"
        items={getItemsForZone("INSTANT IDEAS")}
        className="md:col-span-2 xl:col-span-2 xl:row-span-2 bg-amber-50 dark:bg-black/20 border-amber-200 dark:border-white/5 shadow-sm"
      />

      <ZoneCard
        id={createDropId("FINANCIAL OPERATIONS")}
        title="Financial Operations"
        items={getItemsForZone("FINANCIAL OPERATIONS")}
        layout="horizontal"
        className="xl:col-span-2 xl:row-span-2 bg-emerald-50 dark:bg-black/20 border-emerald-200 dark:border-white/5 shadow-sm" 
      />

      <ZoneCard
        id={createDropId("MY LEARNINGS")}
        title="My Learnings"
        items={getItemsForZone("MY LEARNINGS")}
        className="xl:col-span-1 xl:row-span-1 bg-blue-50 dark:bg-black/20 border-blue-200 dark:border-white/5 shadow-sm"
      />

      <ZoneCard
        id={createDropId("UNKNOWN QUESTIONS")}
        title="Unknown Questions"
        items={getItemsForZone("UNKNOWN QUESTIONS")}
        className="xl:col-span-1 xl:row-span-1 bg-purple-50 dark:bg-black/20 border-purple-200 dark:border-white/5 shadow-sm"
      />

      <ZoneCard
        id={createDropId("SUCCESS STORIES")}
        title="Success Stories"
        items={getItemsForZone("SUCCESS STORIES")}
        className="xl:col-span-2 xl:row-span-1 bg-green-50 dark:bg-black/20 border-green-200 dark:border-white/5 shadow-sm"
      />

      <ZoneCard
        id={createDropId("FAILURE STORIES")}
        title="Failure Stories"
        items={getItemsForZone("FAILURE STORIES")}
        className="xl:col-span-2 xl:row-span-1 bg-rose-50 dark:bg-black/20 border-rose-200 dark:border-white/5 shadow-sm"
      />

      <ZoneCard
        id={createDropId("FARMERS")}
        title="Farmers"
        items={getItemsForZone("FARMERS")}
        className="md:col-span-2 xl:col-span-2 xl:row-span-1 bg-orange-50 dark:bg-black/20 border-orange-200 dark:border-white/5 shadow-sm"
      />

      <ZoneCard
        id={createDropId("PRODUCTS")}
        title="Products"
        items={getItemsForZone("PRODUCTS")}
        className="xl:col-span-1 xl:row-span-1 bg-sky-50 dark:bg-black/20 border-sky-200 dark:border-white/5 shadow-sm"
      />
      
      <ZoneCard
        id={createDropId("SUPPLY CHAIN")}
        title="Supply Chain"
        items={getItemsForZone("SUPPLY CHAIN")}
        className="xl:col-span-1 xl:row-span-1 bg-slate-100 dark:bg-black/20 border-slate-300 dark:border-white/5 shadow-sm"
      />

      <ZoneCard
        id={createDropId("EXPERIMENTS")}
        title="Experiments"
        items={getItemsForZone("EXPERIMENTS")}
        className="md:col-span-2 xl:col-span-4 xl:row-span-1 border-dashed border-2 bg-indigo-50 dark:bg-black/20 border-indigo-200 dark:border-white/5 shadow-sm"
      />
    </div>
  );
}
