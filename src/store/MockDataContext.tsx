"use client";

import React, { createContext, useContext, useState, ReactNode, useRef } from "react";

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

export type Workspace = {
  id: string;
  name: string;
  createdAt: number;
};

export type Item = {
  id: string;
  zoneId: ZoneId;
  workspaceIds: string[];
  title: string;
  description?: string;
  connections?: string[];
  metadata?: {
    type?: "financial_model" | "document" | "url" | "image";
    rows?: Array<{ id: string; label: string; value: number }>;
    sellingPrice?: number;
    mapPosition?: { x: number; y: number };
    experimentStage?: "hypothesis" | "active" | "validated" | "failed";
    attachments?: Array<{ id: string; name: string; url?: string; type?: string }>;
    supplyNodes?: Array<{ id: string; type: "supplier" | "processing" | "distribution"; name: string; location: string; leadTime: number }>;
  };
};

type UndoAction = 
  | { type: 'ADD'; id: string }
  | { type: 'DELETE'; item: Item }
  | { type: 'MOVE'; id: string; oldZoneId: ZoneId }
  | { type: 'UPDATE'; id: string; oldData: Partial<Item> }
  | { type: 'CLONE'; id: string }
  | { type: 'LINK'; sourceId: string; targetId: string }
  | { type: 'UNLINK'; sourceId: string; targetId: string };

interface MockDataContextType {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  setActiveWorkspaceId: (id: string) => void;
  splitWorkspaceId: string | null;
  setSplitWorkspaceId: (id: string | null) => void;
  createWorkspace: (name: string) => Promise<void>;
  items: Item[];
  moveItem: (itemId: string, newZoneId: ZoneId) => void;
  cloneItem: (itemId: string, targetZoneId: ZoneId) => Promise<void>;
  addItem: (item: Omit<Item, "id" | "workspaceIds">) => void;
  pinToWorkspace: (itemId: string, workspaceId?: string) => Promise<void>;
  copyItemToWorkspace: (itemId: string, targetWorkspaceId: string, targetZoneId: ZoneId) => Promise<void>;
  updateItem: (itemId: string, updates: Partial<Item>) => void;
  deleteItem: (itemId: string) => void;
  linkItems: (sourceId: string, targetId: string) => void;
  removeConnection: (sourceId: string, targetId: string) => void;
  undo: () => void;
  activeDetailId: string | null;
  setActiveDetailId: (id: string | null) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (isOpen: boolean) => void;
  isInboxOpen: boolean;
  setIsInboxOpen: (isOpen: boolean) => void;
}

const initialItems: Item[] = [
  { id: "idea-1", title: "QR farmer journey", zoneId: "INSTANT IDEAS", connections: ["q-1", "fin-1"], workspaceIds: ["ws-1"] },
  { id: "idea-2", title: "Ragi biscuit concept", zoneId: "INSTANT IDEAS", connections: ["fin-1"], workspaceIds: ["ws-1"] },
  { 
    id: "fin-1", 
    title: "Current simulation", 
    zoneId: "FINANCIAL OPERATIONS",
    workspaceIds: ["ws-1"],
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
    workspaceIds: ["ws-1"],
    metadata: {
      attachments: [{ id: "a1", name: "business_model.pdf", type: "pdf" }]
    }
  },
  { id: "fail-1", title: "Local Delivery Startup X", description: "Failed due to high cold-chain costs.", zoneId: "FAILURE STORIES", workspaceIds: ["ws-1"] },
  { id: "learn-1", title: "Customer trust takes 3 purchases", description: "Data shows trust is established only after 3 consistent quality deliveries.", zoneId: "MY LEARNINGS", workspaceIds: ["ws-1"] },
  { id: "q-1", title: "Can we procure certified organic ragi at our target price?", zoneId: "UNKNOWN QUESTIONS", workspaceIds: ["ws-1"] },
];

import { db } from "../lib/firebase";
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, getDocs, writeBatch } from "firebase/firestore";

export const MockDataContext = createContext<MockDataContextType | undefined>(undefined);

export function MockDataProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>("main-workspace");
  const [splitWorkspaceId, setSplitWorkspaceId] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [activeDetailId, setActiveDetailId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);

  // Sync Workspaces & Migration
  React.useEffect(() => {
    const workspacesCol = collection(db, "workspaces");
    
    // Check for default workspace
    getDocs(workspacesCol).then(snapshot => {
      if (snapshot.empty) {
        const defaultWs: Workspace = { id: "main-workspace", name: "Main Workspace", createdAt: Date.now() };
        setDoc(doc(db, "workspaces", "main-workspace"), defaultWs);
      }
    });

    const unsubscribeWorkspaces = onSnapshot(workspacesCol, (snapshot) => {
      const fetched = snapshot.docs.map(d => d.data() as Workspace);
      // Sort by creation date
      fetched.sort((a, b) => a.createdAt - b.createdAt);
      setWorkspaces(fetched);
    });

    return () => unsubscribeWorkspaces();
  }, []);

  // Sync Items (Filtered by activeWorkspaceId + splitWorkspaceId)
  React.useEffect(() => {
    if (!activeWorkspaceId) return;

    const cardsCol = collection(db, "cards");
    
    // Check and seed initial data if empty
    getDocs(cardsCol).then(snapshot => {
      if (snapshot.empty) {
        const batch = writeBatch(db);
        initialItems.forEach(item => {
          const docRef = doc(cardsCol, item.id);
          batch.set(docRef, { ...item, workspaceIds: ["main-workspace"] });
        });
        batch.commit();
      } else {
        // Migration: convert workspaceId to workspaceIds array
        const batch = writeBatch(db);
        let hasMigrations = false;
        snapshot.docs.forEach(d => {
          const data = d.data();
          if (!data.workspaceIds) {
            const oldId = data.workspaceId;
            batch.update(doc(cardsCol, d.id), { 
              workspaceIds: oldId ? [oldId] : ["main-workspace"] 
            });
            hasMigrations = true;
          }
        });
        if (hasMigrations) batch.commit();
      }
    });

    // Query for workspaces
    import("firebase/firestore").then(({ query, where }) => {
      const targetWorkspaces = [activeWorkspaceId];
      if (splitWorkspaceId) targetWorkspaces.push(splitWorkspaceId);

      const q = query(cardsCol, where("workspaceIds", "array-contains-any", targetWorkspaces));
      const unsubscribeItems = onSnapshot(q, (snapshot) => {
        const fetchedItems = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Item[];
        setItems(fetchedItems);
      });
      
      // Cleanup is tricky with dynamic import, so we bind it to window to clear on unmount if needed,
      // but a cleaner way is just to assign it.
      if ((window as any)._unsubItems) {
        (window as any)._unsubItems();
      }
      (window as any)._unsubItems = unsubscribeItems;
    });

    return () => {
      if ((window as any)._unsubItems) {
        (window as any)._unsubItems();
      }
    };
  }, [activeWorkspaceId, splitWorkspaceId]);

  const undoStack = useRef<UndoAction[]>([]);

  // Global Undo Listener (Ctrl+Z)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        // Prevent default only if not in an input/textarea
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'textarea') {
          e.preventDefault();
          undo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const createWorkspace = async (name: string) => {
    const id = `ws-${Date.now()}`;
    const ws: Workspace = { id, name, createdAt: Date.now() };
    await setDoc(doc(db, "workspaces", id), ws);
    setActiveWorkspaceId(id);
  };

  const moveItem = async (itemId: string, newZoneId: ZoneId) => {
    const existingItem = items.find(i => i.id === itemId);
    if (existingItem) {
      undoStack.current.push({ type: 'MOVE', id: itemId, oldZoneId: existingItem.zoneId });
      setItems(prev => prev.map(item => item.id === itemId ? { ...item, zoneId: newZoneId } : item));
      await updateDoc(doc(db, "cards", itemId), { zoneId: newZoneId });
    }
  };

  const cloneItem = async (itemId: string, targetZoneId: ZoneId) => {
    const existingItem = items.find(i => i.id === itemId);
    if (existingItem) {
      const newId = `card-${Date.now()}`;
      const clone = { ...existingItem, id: newId, zoneId: targetZoneId, connections: [] };
      undoStack.current.push({ type: 'CLONE', id: newId });
      setItems(prev => [...prev, clone]);
      import("firebase/firestore").then(({ setDoc }) => {
        setDoc(doc(db, "cards", newId), clone);
      });
    }
  };

  const addItem = async (newItem: Omit<Item, "id" | "workspaceIds">) => {
    const id = `item-${Date.now()}`;
    undoStack.current.push({ type: 'ADD', id });
    const item = { ...newItem, id, workspaceIds: [activeWorkspaceId], connections: [] };
    setItems(prev => [item, ...prev]);
    await setDoc(doc(db, "cards", id), item);
  };

  const pinToWorkspace = async (itemId: string, targetWorkspaceId?: string) => {
    const wsId = targetWorkspaceId || activeWorkspaceId;
    import("firebase/firestore").then(async ({ getDoc }) => {
      const d = await getDoc(doc(db, "cards", itemId));
      if (d.exists()) {
        const data = d.data();
        const existing = data.workspaceIds || [];
        if (!existing.includes(wsId)) {
          await updateDoc(doc(db, "cards", itemId), { workspaceIds: [...existing, wsId] });
        }
      }
    });
  };

  const copyItemToWorkspace = async (itemId: string, targetWorkspaceId: string, targetZoneId: ZoneId) => {
    import("firebase/firestore").then(async ({ getDoc }) => {
      const d = await getDoc(doc(db, "cards", itemId));
      if (d.exists()) {
        const data = d.data() as Item;
        const existing = data.workspaceIds || [];
        undoStack.current.push({ type: 'MOVE', id: itemId, oldZoneId: data.zoneId }); // approximate undo
        if (!existing.includes(targetWorkspaceId)) {
          // It's a pin AND a move within that new workspace.
          await updateDoc(doc(db, "cards", itemId), { 
            workspaceIds: [...existing, targetWorkspaceId],
            zoneId: targetZoneId 
          });
        } else {
          // Just move
          await updateDoc(doc(db, "cards", itemId), { zoneId: targetZoneId });
        }
      }
    });
  };

  const updateItem = async (itemId: string, updates: Partial<Item>) => {
    const existingItem = items.find(i => i.id === itemId);
    if (existingItem) {
      // Create a diff of old data
      const oldData: Partial<Item> = {};
      Object.keys(updates).forEach(k => {
        const key = k as keyof Item;
        // @ts-expect-error
        oldData[key] = existingItem[key];
      });
      undoStack.current.push({ type: 'UPDATE', id: itemId, oldData });
    }
    // Optimistic
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, ...updates } : item));
    await updateDoc(doc(db, "cards", itemId), updates);
  };

  const linkItems = async (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    undoStack.current.push({ type: 'LINK', sourceId, targetId });
    
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
    undoStack.current.push({ type: 'UNLINK', sourceId, targetId });
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
    const existingItem = items.find(i => i.id === itemId);
    if (existingItem) {
      undoStack.current.push({ type: 'DELETE', item: existingItem });
    }
    // Optimistic
    setItems(prev => prev.filter(item => item.id !== itemId));
    await deleteDoc(doc(db, "cards", itemId));
  };

  function undo() {
    if (undoStack.current.length === 0) return;
    const action = undoStack.current.pop();
    if (!action) return;

    console.log("Undoing action:", action);
    
    import("firebase/firestore").then(async ({ deleteDoc, setDoc, updateDoc, arrayRemove, arrayUnion, writeBatch }) => {
      if (action.type === 'ADD' || action.type === 'CLONE') {
        setItems(prev => prev.filter(item => item.id !== action.id));
        await deleteDoc(doc(db, "cards", action.id));
      } else if (action.type === 'DELETE') {
        setItems(prev => [...prev, action.item]);
        await setDoc(doc(db, "cards", action.item.id), action.item);
      } else if (action.type === 'MOVE') {
        setItems(prev => prev.map(item => item.id === action.id ? { ...item, zoneId: action.oldZoneId } : item));
        await updateDoc(doc(db, "cards", action.id), { zoneId: action.oldZoneId });
      } else if (action.type === 'UPDATE') {
        setItems(prev => prev.map(item => item.id === action.id ? { ...item, ...action.oldData } : item));
        await updateDoc(doc(db, "cards", action.id), action.oldData);
      } else if (action.type === 'LINK') {
        const batch = writeBatch(db);
        batch.update(doc(db, "cards", action.sourceId), { connections: arrayRemove(action.targetId) });
        batch.update(doc(db, "cards", action.targetId), { connections: arrayRemove(action.sourceId) });
        await batch.commit();
      } else if (action.type === 'UNLINK') {
        const batch = writeBatch(db);
        batch.update(doc(db, "cards", action.sourceId), { connections: arrayUnion(action.targetId) });
        batch.update(doc(db, "cards", action.targetId), { connections: arrayUnion(action.sourceId) });
        await batch.commit();
      }
    });
  };

  return (
    <MockDataContext.Provider value={{ workspaces, activeWorkspaceId, setActiveWorkspaceId, splitWorkspaceId, setSplitWorkspaceId, createWorkspace, items, moveItem, cloneItem, addItem, pinToWorkspace, copyItemToWorkspace, updateItem, deleteItem, linkItems, removeConnection, undo, activeDetailId, setActiveDetailId, isSearchOpen, setIsSearchOpen, isInboxOpen, setIsInboxOpen }}>
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
