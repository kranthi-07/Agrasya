"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type ZoneId = 
  | "INSTANT IDEAS"
  | "AGRASYA BLOCKCHAIN"
  | "SUCCESS STORIES"
  | "FAILURE STORIES"
  | "UNKNOWN QUESTIONS"
  | "FARMERS"
  | "FINANCIAL OPERATIONS"
  | "PRODUCTS"
  | "SUPPLY CHAIN"
  | "CERTIFICATION"
  | "E-COMMERCE OPERATIONS"
  | "EXPERIMENTS"
  | "DECISIONS"
  | "TEAM / RESEARCH"
  | "MY LEARNINGS";

export type Item = {
  id: string;
  zoneId: ZoneId;
  title: string;
  description?: string;
  connections?: string[];
  metadata?: {
    type?: "financial_model" | "document" | "url" | "image";
    rows?: Array<{ id: string; name: string; type: "revenue" | "cogs" | "opex"; amount: number }>;
    mapPosition?: { x: number; y: number };
    experimentStage?: "hypothesis" | "active" | "validated" | "failed";
    attachments?: Array<{ id: string; name: string; url: string }>;
  };
};

interface MockDataContextType {
  items: Item[];
  moveItem: (itemId: string, newZoneId: ZoneId) => void;
  addItem: (item: Omit<Item, "id">) => void;
  updateItem: (itemId: string, updates: Partial<Item>) => void;
  deleteItem: (itemId: string) => void;
  linkItems: (sourceId: string, targetId: string) => void;
  removeConnection: (sourceId: string, targetId: string) => void;
  activeDetailId: string | null;
  setActiveDetailId: (id: string | null) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (isOpen: boolean) => void;
  isInboxOpen: boolean;
  setIsInboxOpen: (isOpen: boolean) => void;
}

const initialItems: Item[] = [
  { id: "idea-1", title: "QR farmer journey", zoneId: "INSTANT IDEAS", connections: ["q-1", "fin-1"] },
  { id: "idea-2", title: "Ragi biscuit concept", zoneId: "INSTANT IDEAS", connections: ["fin-1"] },
  { 
    id: "fin-1", 
    title: "Current simulation", 
    zoneId: "FINANCIAL OPERATIONS",
    metadata: { 
      type: "financial_model",
      rows: [
        { id: "r1", label: "Procurement", value: 45 },
        { id: "r2", label: "Processing", value: 20 },
        { id: "r3", label: "Packaging", value: 15 }
      ],
      sellingPrice: 149
    },
    connections: ["idea-2"]
  },
  { 
    id: "success-1", 
    title: "Organic Mandya Case Study", 
    zoneId: "SUCCESS STORIES",
    metadata: {
      attachments: [{ id: "a1", name: "business_model.pdf", type: "pdf" }]
    }
  },
  { id: "fail-1", title: "Local Delivery Startup X", description: "Failed due to high cold-chain costs.", zoneId: "FAILURE STORIES" },
  { id: "learn-1", title: "Customer trust takes 3 purchases", description: "Data shows trust is established only after 3 consistent quality deliveries.", zoneId: "MY LEARNINGS" },
  { id: "q-1", title: "Can we procure certified organic ragi at our target price?", zoneId: "UNKNOWN QUESTIONS" },
];

import { db } from "../lib/firebase";
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, getDocs, writeBatch } from "firebase/firestore";

export const MockDataContext = createContext<MockDataContextType | undefined>(undefined);

export function MockDataProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const [activeDetailId, setActiveDetailId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);

  // Sync with Firestore
  React.useEffect(() => {
    const cardsCol = collection(db, "cards");
    
    // Check and seed initial data if empty
    getDocs(cardsCol).then(snapshot => {
      if (snapshot.empty) {
        const batch = writeBatch(db);
        initialItems.forEach(item => {
          const docRef = doc(cardsCol, item.id);
          batch.set(docRef, item);
        });
        batch.commit();
      }
    });

    const unsubscribe = onSnapshot(cardsCol, (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Item[];
      setItems(fetchedItems);
    });

    return () => unsubscribe();
  }, []);

  const moveItem = async (itemId: string, newZoneId: ZoneId) => {
    // Optimistic UI update
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, zoneId: newZoneId } : item));
    await updateDoc(doc(db, "cards", itemId), { zoneId: newZoneId });
  };

  const addItem = async (newItem: Omit<Item, "id">) => {
    const id = `item-${Date.now()}`;
    const item = { ...newItem, id, connections: [] };
    // Optimistic
    setItems(prev => [item, ...prev]);
    await setDoc(doc(db, "cards", id), item);
  };

  const updateItem = async (itemId: string, updates: Partial<Item>) => {
    // Optimistic
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, ...updates } : item));
    await updateDoc(doc(db, "cards", itemId), updates);
  };

  const linkItems = async (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    
    const sourceItem = items.find(i => i.id === sourceId);
    const targetItem = items.find(i => i.id === targetId);
    if (!sourceItem || !targetItem) return;

    const newSourceConns = Array.from(new Set([...(sourceItem.connections || []), targetId]));
    const newTargetConns = Array.from(new Set([...(targetItem.connections || []), sourceId]));

    // Optimistic
    setItems(prev => prev.map(item => {
      if (item.id === sourceId) return { ...item, connections: newSourceConns };
      if (item.id === targetId) return { ...item, connections: newTargetConns };
      return item;
    }));

    const batch = writeBatch(db);
    batch.update(doc(db, "cards", sourceId), { connections: newSourceConns });
    batch.update(doc(db, "cards", targetId), { connections: newTargetConns });
    await batch.commit();
  };

  const removeConnection = async (sourceId: string, targetId: string) => {
    const sourceItem = items.find(i => i.id === sourceId);
    const targetItem = items.find(i => i.id === targetId);
    if (!sourceItem || !targetItem) return;

    const newSourceConns = (sourceItem.connections || []).filter(id => id !== targetId);
    const newTargetConns = (targetItem.connections || []).filter(id => id !== sourceId);

    // Optimistic
    setItems(prev => prev.map(item => {
      if (item.id === sourceId) return { ...item, connections: newSourceConns };
      if (item.id === targetId) return { ...item, connections: newTargetConns };
      return item;
    }));

    const batch = writeBatch(db);
    batch.update(doc(db, "cards", sourceId), { connections: newSourceConns });
    batch.update(doc(db, "cards", targetId), { connections: newTargetConns });
    await batch.commit();
  };

  const deleteItem = async (itemId: string) => {
    // Optimistic
    setItems(prev => prev.filter(item => item.id !== itemId));
    await deleteDoc(doc(db, "cards", itemId));
  };

  return (
    <MockDataContext.Provider value={{ items, moveItem, addItem, updateItem, deleteItem, linkItems, removeConnection, activeDetailId, setActiveDetailId, isSearchOpen, setIsSearchOpen, isInboxOpen, setIsInboxOpen }}>
      {children}
    </MockDataContext.Provider>
  );
}

export function useMockData() {
  const context = useContext(MockDataContext);
  if (context === undefined) {
    throw new Error("useMockData must be used within a MockDataProvider");
  }
  return context;
}
