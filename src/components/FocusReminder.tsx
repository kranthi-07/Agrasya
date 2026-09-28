import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { Target, X } from "lucide-react";

type TeamTask = {
  id: string;
  title: string;
  assignedTo: string;
  founderBrief: string;
  focusStatus: "current" | "next" | "completed";
  createdAt: number;
};

export function FocusReminder({ onOpenTeamPanel }: { onOpenTeamPanel: () => void }) {
  const [currentFocus, setCurrentFocus] = useState<TeamTask | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const hasLoadedRef = React.useRef(false);

  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Wait for auth to resolve
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user && user.email) {
        const q = query(
          collection(db, "tasks"), 
          where("assignedTo", "==", user.email),
          where("focusStatus", "==", "current")
        );
        
        const unsubTasks = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const task = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as TeamTask;
            setCurrentFocus(task);
            // Only auto-expand once per session for this specific task
            if (!hasLoadedRef.current) {
              const seenKey = `agrasya_seen_focus_${task.id}`;
              if (!sessionStorage.getItem(seenKey)) {
                setIsExpanded(true);
                sessionStorage.setItem(seenKey, 'true');
              }
            }
          } else {
            setCurrentFocus(null);
          }
          hasLoadedRef.current = true;
        });
        
        return () => unsubTasks();
      }
    });
    return () => unsubAuth();
  }, []);

  if (!currentFocus || !mounted) return null;

  return (
    <>
      {/* The persistent header button */}
      <motion.button
        layoutId="focus-reminder-card"
        onClick={() => setIsExpanded(true)}
        className="flex items-center gap-2 bg-agrasya-text text-agrasya-bg shadow-sm px-4 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95 ml-4 mr-2"
      >
        <Target size={14} className="text-agrasya-green animate-pulse" />
        <span className="max-w-[150px] truncate">{currentFocus.title}</span>
      </motion.button>

      {/* The full screen overlay popup */}
      {createPortal(
        <AnimatePresence>
          {isExpanded && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-agrasya-bg/60 backdrop-blur-md p-4">
              <motion.div
                layoutId="focus-reminder-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-agrasya-card/90 backdrop-blur-xl border border-agrasya-border shadow-2xl rounded-[2rem] p-10 max-w-lg w-full relative overflow-hidden flex flex-col items-center text-center"
              >
                {/* Subtle green glow behind */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-agrasya-green/10 rounded-full blur-[80px] pointer-events-none"></div>
                
                <button onClick={() => setIsExpanded(false)} className="absolute top-6 right-6 text-agrasya-muted hover:text-agrasya-text transition-colors z-20">
                  <X size={20} />
                </button>
                
                <div className="flex items-center gap-2 mb-6 text-agrasya-green relative z-10 bg-agrasya-green/10 px-4 py-1.5 rounded-full border border-agrasya-green/20">
                  <Target size={14} className="animate-pulse" />
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Priority Override</span>
                </div>
                
                <h2 className="text-3xl md:text-4xl font-serif text-agrasya-text leading-tight mb-6 relative z-10">
                  {currentFocus.title}
                </h2>

                <p className="text-sm md:text-base text-agrasya-muted max-w-md mx-auto mb-10 relative z-10 font-sans italic border-l-2 border-agrasya-green/50 pl-4 py-1 text-left">
                  "{currentFocus.founderBrief || "No brief provided."}"
                </p>

                <div className="flex gap-4 w-full relative z-10">
                  <button 
                    onClick={() => setIsExpanded(false)} 
                    className="flex-1 py-4 rounded-xl text-sm font-bold bg-agrasya-text text-agrasya-bg hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-xl"
                  >
                    Accept & Minimize
                  </button>
                  <button 
                    onClick={() => {
                      setIsExpanded(false);
                      onOpenTeamPanel();
                    }} 
                    className="px-6 py-4 rounded-xl text-sm font-bold bg-agrasya-surface/80 backdrop-blur border border-agrasya-border text-agrasya-text hover:bg-agrasya-bg hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Open Board
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
