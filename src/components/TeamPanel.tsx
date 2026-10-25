"use client";

import React, { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import { collection, onSnapshot, doc, updateDoc, setDoc, deleteDoc } from "firebase/firestore";
import { ShieldAlert, ShieldCheck, Users, Mail, Clock, LogOut, KeyRound, CheckCircle2, ChevronDown, Check, UserMinus } from "lucide-react";
import { useMockData } from "../store/MockDataContext";
import { sendPasswordResetEmail } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";

function RoleDropdown({ 
  currentRole, 
  onRoleChange,
  isOpen,
  onToggle
}: { 
  currentRole: "admin" | "member"; 
  onRoleChange: (r: "admin" | "member") => void;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
}) {
  return (
    <div className="relative">
      <button 
        onClick={(e) => { e.stopPropagation(); onToggle(!isOpen); }}
        className="flex items-center gap-2 text-[11px] font-sans font-bold uppercase tracking-widest bg-agrasya-surface/80 hover:bg-agrasya-surface border border-agrasya-border hover:border-agrasya-green/40 rounded-lg px-3 py-2 text-agrasya-text transition-all shadow-sm"
      >
        Manage Role
        <ChevronDown size={14} className={cn("text-agrasya-muted transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[990]" onClick={(e) => { e.stopPropagation(); onToggle(false); }} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full right-0 mt-2 w-48 bg-agrasya-card/95 backdrop-blur-xl border border-agrasya-border/80 rounded-2xl shadow-2xl z-[999] p-1.5 flex flex-col overflow-hidden"
            >
              <button 
                onClick={(e) => { e.stopPropagation(); onRoleChange("admin"); onToggle(false); }}
                className={cn("flex items-center justify-between px-3 py-2.5 text-xs font-semibold rounded-xl transition-colors", currentRole === "admin" ? "bg-agrasya-green/10 text-agrasya-green" : "text-agrasya-text hover:bg-agrasya-surface")}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className={currentRole === "admin" ? "text-agrasya-green" : "text-agrasya-muted"} />
                  Make Admin
                </div>
                {currentRole === "admin" && <Check size={14} />}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onRoleChange("member"); onToggle(false); }}
                className={cn("flex items-center justify-between px-3 py-2.5 text-xs font-semibold rounded-xl transition-colors mt-1", currentRole === "member" ? "bg-agrasya-green/10 text-agrasya-green" : "text-agrasya-text hover:bg-agrasya-surface")}
              >
                <div className="flex items-center gap-2">
                  <Users size={14} className={currentRole === "member" ? "text-agrasya-green" : "text-agrasya-muted"} />
                  Make Member
                </div>
                {currentRole === "member" && <Check size={14} />}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

type TeamTask = {
  id: string;
  title: string;
  assignedTo: string;
  founderBrief: string;
  focusStatus: "current" | "next" | "completed";
  createdAt: number;
};

type TeamMember = {
  id: string;
  email: string;
  role: "admin" | "member";
  lastLogin: number;
  lastSeen?: number;
};

function formatLastSeen(timestamp?: number): string {
  if (!timestamp) return "Never";
  const now = Date.now();
  const diffMs = now - timestamp;
  if (diffMs < 0) return "Just now";
  
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays === 1) {
    const timeStr = new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return `Yesterday at ${timeStr}`;
  }
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function FocusBoardView({ member, onBack, onSignOut, isAdmin }: { member: TeamMember, onBack: () => void, onSignOut: () => void, isAdmin: boolean }) {
  const { items, activeWorkspaceId, workspaces } = useMockData();
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [showAssign, setShowAssign] = useState(false);
  const [assignStep, setAssignStep] = useState<"pick" | "brief">("pick");
  const [assignTarget, setAssignTarget] = useState<"current" | "next">("next");
  const [pendingAssignItem, setPendingAssignItem] = useState<any | null>(null);
  const [pendingNewTitle, setPendingNewTitle] = useState<string>("");
  const [briefText, setBriefText] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "tasks"), (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamTask));
      setTasks(fetched);
    });
    return () => unsub();
  }, []);

  const activeWorkspaceName = workspaces.find(w => w.id === activeWorkspaceId)?.name || "Current Workspace";

  const assignedTasks = tasks.filter(t => t.assignedTo === member.email);
  const currentFocus = assignedTasks.find(t => t.focusStatus === "current");
  const upNext = assignedTasks.filter(t => t.focusStatus === "next").sort((a, b) => b.createdAt - a.createdAt);
  const completedTasks = assignedTasks.filter(t => t.focusStatus === "completed").sort((a, b) => b.createdAt - a.createdAt);
  
  // They can still pick from the active workspace board items if they want to
  const assignableItems = items.filter(i => i.workspaceIds?.includes(activeWorkspaceId));

  const startBriefStep = (item: any | null, newTitle: string = "") => {
    setPendingAssignItem(item);
    setPendingNewTitle(newTitle);
    setBriefText("");
    setAssignStep("brief");
  };

  const confirmAssignment = () => {
    const finalTarget = assignTarget === "current" ? "current" : (currentFocus ? "next" : "current");

    // If forcing current and there is an existing one, move the old one to the queue
    if (finalTarget === "current" && currentFocus) {
      updateDoc(doc(db, "tasks", currentFocus.id), { focusStatus: "next" });
    }

    if (pendingAssignItem) {
      const newId = `task-${Date.now()}`;
      setDoc(doc(db, "tasks", newId), {
        id: newId,
        title: pendingAssignItem.title,
        assignedTo: member.email,
        founderBrief: briefText.trim(),
        focusStatus: finalTarget,
        createdAt: Date.now()
      });
    } else if (pendingNewTitle) {
      const newId = `task-${Date.now()}`;
      setDoc(doc(db, "tasks", newId), {
        id: newId,
        title: pendingNewTitle,
        assignedTo: member.email,
        founderBrief: briefText.trim(),
        focusStatus: finalTarget,
        createdAt: Date.now()
      });
    }
    setShowAssign(false);
    setAssignStep("pick");
  };

  const cancelAssignment = () => {
    setAssignStep("pick");
    setShowAssign(false);
  };

  const handleRemoveAssignment = (task: TeamTask) => {
    deleteDoc(doc(db, "tasks", task.id));
  };

  const handleMakeCurrent = (task: TeamTask) => {
    if (currentFocus) {
      updateDoc(doc(db, "tasks", currentFocus.id), { focusStatus: "next" });
    }
    updateDoc(doc(db, "tasks", task.id), { focusStatus: "current" });
  };

  const handleMarkDone = (task: TeamTask) => {
    updateDoc(doc(db, "tasks", task.id), { focusStatus: "completed" });
  };

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBrief, setEditBrief] = useState("");

  const startEdit = (task: TeamTask) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditBrief(task.founderBrief || "");
  };

  const saveEdit = (task: TeamTask) => {
    updateDoc(doc(db, "tasks", task.id), { title: editTitle, founderBrief: editBrief });
    setEditingTaskId(null);
  };

  const renderAssignDropdown = () => (
    <div className="bg-agrasya-card border border-agrasya-border rounded-lg p-3 shadow-md flex flex-col gap-3">
      {assignStep === "pick" ? (
        <>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Type new task & press Enter..." 
              className="flex-1 bg-agrasya-surface text-xs text-agrasya-text border border-agrasya-border rounded px-2 py-1.5 focus:outline-none focus:border-agrasya-green"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  startBriefStep(null, e.currentTarget.value.trim());
                }
              }}
            />
          </div>
          <div className="border-t border-agrasya-border/50 pt-2 max-h-60 overflow-y-auto">
            <div className="text-[10px] uppercase font-bold text-agrasya-muted mb-2">Or pick existing card</div>
            {assignableItems.length === 0 ? (
              <div className="text-xs italic text-agrasya-muted">No unassigned cards on the board.</div>
            ) : (
              assignableItems.map(item => (
                <div key={item.id} onClick={() => startBriefStep(item)} className="text-xs p-2 hover:bg-agrasya-surface rounded cursor-pointer transition-colors border-b border-agrasya-border/50 last:border-0 truncate">
                  <span className="font-bold text-agrasya-muted mr-1">[{item.zoneId.split('::')[1] || item.zoneId}]</span>
                  {item.title}
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-3 animate-in fade-in">
          <div>
            <div className="text-[10px] uppercase font-bold text-agrasya-green mb-1">Magic Brief</div>
            <div className="text-xs text-agrasya-text mb-2 font-medium truncate">
              {pendingAssignItem ? pendingAssignItem.title : pendingNewTitle}
            </div>
          </div>
          <textarea 
            value={briefText}
            onChange={(e) => setBriefText(e.target.value)}
            placeholder="Enter context, expectations, or instructions..."
            className="w-full h-24 bg-agrasya-surface text-xs text-agrasya-text border border-agrasya-border rounded p-2 focus:outline-none focus:border-agrasya-green resize-none"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <button onClick={cancelAssignment} className="text-xs text-agrasya-muted hover:text-agrasya-text px-2 py-1">Cancel</button>
            <button onClick={confirmAssignment} className="text-xs bg-agrasya-green text-agrasya-bg font-bold px-3 py-1 rounded">Assign Task</button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 sm:gap-4 mb-6 pb-4 border-b border-agrasya-border/50 flex-wrap sm:flex-nowrap">
        {isAdmin ? (
          <button onClick={onBack} className="text-sm font-sans text-agrasya-muted hover:text-agrasya-text transition-colors shrink-0">
            ← Back to Team
          </button>
        ) : (
          <button onClick={onSignOut} className="text-sm font-sans flex items-center gap-2 text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-md transition-colors border border-red-200 dark:border-red-900/50 shrink-0">
            <LogOut size={14} /> Sign Out
          </button>
        )}
        <div className="w-px h-6 bg-agrasya-border hidden sm:block shrink-0"></div>
        {(() => {
          const lastActive = member.lastSeen || member.lastLogin;
          const isMemberOnline = member.id === auth.currentUser?.uid || (Date.now() - lastActive < 3 * 60 * 1000);
          return (
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-agrasya-surface border border-agrasya-border flex items-center justify-center text-sm font-bold text-agrasya-text shrink-0 shadow-inner">
                {member.email.charAt(0).toUpperCase()}
                {isMemberOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-agrasya-green rounded-full border-2 border-agrasya-card shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-serif text-base sm:text-lg font-bold text-agrasya-text leading-none truncate max-w-[200px] sm:max-w-none">{member.email}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-agrasya-muted">Focus Board ({activeWorkspaceName})</span>
                  <span className="text-[10px] text-agrasya-muted hidden sm:inline">•</span>
                  {isMemberOnline ? (
                    <span className="text-[10px] font-bold text-agrasya-green flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-agrasya-green animate-pulse"></span>
                      Online now
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-agrasya-muted flex items-center gap-1">
                      <Clock size={10} />
                      Last seen {formatLastSeen(lastActive)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 overflow-y-auto md:overflow-hidden hide-scrollbar">
        {/* Current Focus */}
        <div className="flex-1 flex flex-col gap-4 border-b md:border-b-0 md:border-r border-agrasya-border/50 pb-6 md:pb-0 md:pr-6 min-h-[300px]">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-widest text-agrasya-green flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-agrasya-green animate-pulse"></span>
              Current Focus
            </h4>
            {isAdmin && (
              <button 
                onClick={() => {
                  if (showAssign && assignTarget === "current") {
                    setShowAssign(false);
                  } else {
                    setAssignTarget("current");
                    setShowAssign(true);
                    setAssignStep("pick");
                  }
                }}
                className="text-xs bg-agrasya-surface text-agrasya-text border border-agrasya-border font-bold px-3 py-1 rounded hover:bg-agrasya-card transition-colors"
              >
                + Set Focus
              </button>
            )}
          </div>
          
          {showAssign && assignTarget === "current" && isAdmin && (
            <div className="mb-2">
              {renderAssignDropdown()}
            </div>
          )}
          
          <div className="flex-1 bg-agrasya-card border border-agrasya-green/30 rounded-xl p-6 shadow-sm overflow-y-auto relative">
            {currentFocus ? (
              <div className="flex flex-col h-full group">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-[10px] font-bold text-agrasya-muted uppercase tracking-wider">TEAM TASK</div>
                  {isAdmin && editingTaskId !== currentFocus.id && (
                    <button onClick={() => startEdit(currentFocus)} className="text-[10px] text-agrasya-muted hover:text-agrasya-text opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
                  )}
                </div>
                
                {editingTaskId === currentFocus.id ? (
                  <div className="flex flex-col gap-3 mb-4">
                    <input 
                      type="text" 
                      value={editTitle} 
                      onChange={e => setEditTitle(e.target.value)} 
                      className="text-xl font-serif text-agrasya-text bg-agrasya-surface border border-agrasya-border rounded px-2 py-1 focus:outline-none focus:border-agrasya-green"
                    />
                    <textarea 
                      value={editBrief} 
                      onChange={e => setEditBrief(e.target.value)} 
                      className="text-sm text-agrasya-text bg-agrasya-surface border border-agrasya-border rounded px-2 py-2 focus:outline-none focus:border-agrasya-green min-h-[100px] resize-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(currentFocus)} className="text-xs bg-agrasya-green text-agrasya-bg font-bold px-3 py-1.5 rounded">Save</button>
                      <button onClick={() => setEditingTaskId(null)} className="text-xs text-agrasya-muted hover:text-agrasya-text px-2 py-1.5">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h5 className="text-xl font-serif text-agrasya-text mb-4">{currentFocus.title}</h5>
                    <div className="bg-agrasya-surface p-4 rounded-lg border border-agrasya-border mb-4">
                      <div className="text-[10px] font-bold text-agrasya-muted uppercase tracking-wider mb-1">Founder&apos;s Brief</div>
                      <p className="text-sm text-agrasya-text italic whitespace-pre-line">{currentFocus.founderBrief || "No brief provided."}</p>
                    </div>
                  </>
                )}
                
                <div className="mt-auto pt-4 flex justify-between items-center border-t border-agrasya-border/50">
                  <button onClick={() => handleMarkDone(currentFocus)} className="text-xs bg-agrasya-green/10 text-agrasya-green hover:bg-agrasya-green/20 font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                    <ShieldCheck size={14} /> Mark as Done
                  </button>
                  
                  {isAdmin && (
                    <button onClick={() => handleRemoveAssignment(currentFocus)} className="text-xs text-agrasya-muted hover:bg-red-500/10 hover:text-red-500 px-3 py-1.5 rounded transition-colors border border-transparent hover:border-red-500/20">
                      Delete Task
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-agrasya-muted opacity-60">
                <ShieldCheck size={32} className="mb-2" />
                <p className="text-sm">No active focus assigned.</p>
                {isAdmin && <p className="text-xs">Click Set Focus to start.</p>}
              </div>
            )}
          </div>
        </div>

        {/* Up Next Queue */}
        <div className="w-full md:w-80 flex flex-col gap-4 shrink-0 overflow-hidden md:overflow-hidden pb-10 md:pb-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-widest text-agrasya-muted">Up Next ({upNext.length})</h4>
            {isAdmin && (
              <button 
                onClick={() => {
                  if (showAssign && assignTarget === "next") {
                    setShowAssign(false);
                  } else {
                    setAssignTarget("next");
                    setShowAssign(true);
                    setAssignStep("pick");
                  }
                }}
                className="text-xs bg-agrasya-green text-agrasya-bg font-bold px-3 py-1 rounded hover:opacity-90 transition-opacity"
              >
                + Queue Task
              </button>
            )}
          </div>

          {showAssign && assignTarget === "next" && isAdmin && (
            <div className="mb-2">
              {renderAssignDropdown()}
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-3 hide-scrollbar pb-10">
            {upNext.length === 0 && (!showAssign || assignTarget !== "next") && (
              <div className="text-xs text-agrasya-muted italic text-center mt-10">Queue is empty.</div>
            )}
            {upNext.map(task => (
              <div key={task.id} className="bg-agrasya-card border border-agrasya-border p-4 rounded-lg shadow-sm group">
                <div className="flex justify-between items-start mb-1">
                  <div className="text-[9px] font-bold text-agrasya-muted uppercase tracking-wider">TEAM TASK</div>
                  {isAdmin && editingTaskId !== task.id && (
                    <button onClick={() => startEdit(task)} className="text-[9px] text-agrasya-muted hover:text-agrasya-text opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
                  )}
                </div>
                
                {editingTaskId === task.id ? (
                  <div className="flex flex-col gap-2 mb-2">
                    <input 
                      type="text" 
                      value={editTitle} 
                      onChange={e => setEditTitle(e.target.value)} 
                      className="text-sm font-medium text-agrasya-text bg-agrasya-surface border border-agrasya-border rounded px-2 py-1 focus:outline-none focus:border-agrasya-green"
                    />
                    <textarea 
                      value={editBrief} 
                      onChange={e => setEditBrief(e.target.value)} 
                      className="text-[10px] text-agrasya-text bg-agrasya-surface border border-agrasya-border rounded px-2 py-1 focus:outline-none focus:border-agrasya-green min-h-[60px] resize-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(task)} className="text-[10px] bg-agrasya-green text-agrasya-bg font-bold px-2 py-1 rounded">Save</button>
                      <button onClick={() => setEditingTaskId(null)} className="text-[10px] text-agrasya-muted hover:text-agrasya-text px-2 py-1">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h5 className="text-sm font-medium text-agrasya-text mb-2 leading-tight">{task.title}</h5>
                    {task.founderBrief && (
                      <p className="text-[10px] text-agrasya-muted italic line-clamp-2 mb-3 border-l-2 border-agrasya-border pl-2">
                        &quot;{task.founderBrief}&quot;
                      </p>
                    )}
                  </>
                )}
                
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                  {isAdmin && (
                    <button onClick={() => handleMakeCurrent(task)} className="text-[10px] bg-agrasya-green/10 text-agrasya-green hover:bg-agrasya-green/20 px-2 py-1 rounded font-bold transition-colors">
                      Make Current
                    </button>
                  )}
                  <button onClick={() => handleMarkDone(task)} className="text-[10px] bg-agrasya-surface text-agrasya-text border border-agrasya-border hover:bg-agrasya-card px-2 py-1 rounded transition-colors">
                    Mark Done
                  </button>
                  {isAdmin && (
                    <button onClick={() => handleRemoveAssignment(task)} className="text-[10px] text-agrasya-muted hover:text-red-500 bg-agrasya-surface px-2 py-1 rounded transition-colors ml-auto">
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}

            {completedTasks.length > 0 && (
              <div className="mt-8">
                <div className="text-[10px] uppercase font-bold text-agrasya-muted mb-3 flex items-center gap-2">
                  <span className="w-full h-px bg-agrasya-border"></span>
                  <span>Completed</span>
                  <span className="w-full h-px bg-agrasya-border"></span>
                </div>
                <div className="space-y-2 opacity-60">
                  {completedTasks.map(task => (
                    <div key={task.id} className="bg-agrasya-surface border border-agrasya-border p-3 rounded-lg flex items-center justify-between group">
                      <div className="flex items-center gap-2 line-through text-agrasya-muted text-xs truncate flex-1 pr-2">
                        <ShieldCheck size={12} className="text-agrasya-green shrink-0" />
                        <span className="truncate">{task.title}</span>
                      </div>
                      {isAdmin && (
                        <button onClick={() => handleRemoveAssignment(task)} className="text-[10px] text-red-500/50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TeamPanel() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<"admin" | "member" | null>(null);
  const [activeTab, setActiveTab] = useState<"directory" | "profile">("directory");
  const [resetSent, setResetSent] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  
  // Custom Popup State
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TeamMember[];
      
      setMembers(fetched);
      
      const me = fetched.find(m => m.id === auth.currentUser?.uid);
      if (me) {
        setCurrentUserRole(me.role);
        // Force member into Focus Board immediately without needing selectedMember dependency
        if (me.role === "member") {
          setSelectedMember(prev => prev ? prev : me);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleRoleChange = async (userId: string, newRole: "admin" | "member") => {
    if (currentUserRole !== "admin") return;
    await updateDoc(doc(db, "users", userId), { role: newRole });
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove || currentUserRole !== "admin") return;
    setIsRemoving(true);
    setRemoveError(null);
    try {
      await deleteDoc(doc(db, "users", memberToRemove));
      setMemberToRemove(null);
    } catch (error) {
      console.error("Error removing member:", error);
      setRemoveError("Failed to remove member. They might have data associated with them.");
    } finally {
      setIsRemoving(false);
    }
  };

  const handleSignOut = () => {
    auth.signOut();
  };

  const handlePasswordReset = async () => {
    if (auth.currentUser?.email) {
      try {
        await sendPasswordResetEmail(auth, auth.currentUser.email);
        setResetSent(true);
        setTimeout(() => setResetSent(false), 5000);
      } catch (error) {
        console.error("Reset error", error);
      }
    }
  };

  return (
    <div className="flex-1 bg-agrasya-bg border border-agrasya-border rounded-xl shadow-inner p-3.5 sm:p-6 md:p-8 overflow-y-auto">
      
      {selectedMember ? (
        <FocusBoardView 
          member={selectedMember} 
          onBack={() => setSelectedMember(null)} 
          onSignOut={handleSignOut}
          isAdmin={currentUserRole === "admin"} 
        />
      ) : (
        <div className="w-full max-w-5xl mx-auto pb-20">
          <div className="mb-8 border-b border-agrasya-border/50 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative">
            {/* Ambient Glow */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-agrasya-green/10 blur-[50px] rounded-full pointer-events-none -z-10" />

            <div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-agrasya-text flex items-center gap-3 tracking-tight">
                <Users className="text-agrasya-green" size={26} /> Organization
              </h2>
              <p className="text-xs sm:text-sm font-sans text-agrasya-muted mt-1.5 font-medium">Manage team access and your profile</p>
            </div>

            <button 
              onClick={handleSignOut}
              className="flex items-center gap-2 text-sm font-sans font-semibold text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 px-5 py-2.5 rounded-full transition-all border border-red-500/20 hover:border-red-500/40 shadow-sm shrink-0"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>

          {/* Tabs - Pill Segmented Control */}
          <div className="flex bg-agrasya-card/80 backdrop-blur-md p-1.5 rounded-full mb-8 max-w-fit border border-white/5 shadow-inner">
            <button 
              onClick={() => setActiveTab("directory")}
              className={`px-6 py-2.5 rounded-full text-sm font-sans font-semibold transition-all ${activeTab === "directory" ? "bg-agrasya-text text-agrasya-bg shadow-md scale-105" : "text-agrasya-muted hover:text-agrasya-text"}`}
            >
              Team Directory
            </button>
            <button 
              onClick={() => setActiveTab("profile")}
              className={`px-6 py-2.5 rounded-full text-sm font-sans font-semibold transition-all ${activeTab === "profile" ? "bg-agrasya-text text-agrasya-bg shadow-md scale-105" : "text-agrasya-muted hover:text-agrasya-text"}`}
            >
              My Profile
            </button>
          </div>

          {activeTab === "profile" && (
            <div className="bg-agrasya-card/50 backdrop-blur-xl border border-agrasya-border rounded-3xl p-8 max-w-xl shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-agrasya-green/5 blur-[80px] rounded-full pointer-events-none -z-10 group-hover:bg-agrasya-green/10 transition-colors duration-700" />
              
              <h3 className="text-xl font-serif font-bold text-agrasya-text mb-8 flex items-center gap-2">
                <ShieldCheck className="text-agrasya-green" /> Account Security
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-sans font-bold text-agrasya-muted uppercase tracking-wider mb-2">Email Address</label>
                  <div className="text-base font-sans font-medium text-agrasya-text bg-agrasya-surface/50 px-4 py-3 rounded-xl border border-agrasya-border/80 flex items-center gap-3 shadow-inner">
                    <Mail size={16} className="text-agrasya-muted" /> {auth.currentUser?.email}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-sans font-bold text-agrasya-muted uppercase tracking-wider mb-2">Role</label>
                  <div className="text-base font-sans font-medium text-agrasya-text bg-agrasya-surface/50 px-4 py-3 rounded-xl border border-agrasya-border/80 flex items-center gap-3 shadow-inner w-fit">
                    {currentUserRole === "admin" ? <ShieldCheck size={18} className="text-agrasya-green" /> : <Users size={18} className="text-agrasya-muted" />}
                    <span className="capitalize">{currentUserRole}</span>
                  </div>
                </div>
                
                <div className="pt-8 mt-8 border-t border-agrasya-border/50">
                  <button 
                    onClick={handlePasswordReset}
                    disabled={resetSent}
                    className="flex items-center gap-3 text-sm font-sans font-bold bg-agrasya-text text-agrasya-bg px-6 py-3 rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {resetSent ? <CheckCircle2 size={18} className="text-agrasya-bg" /> : <KeyRound size={18} />}
                    {resetSent ? "Reset Email Sent" : "Send Password Reset Email"}
                  </button>
                  <p className="text-xs text-agrasya-muted mt-4 leading-relaxed max-w-sm">
                    A secure authentication link will be sent to your inbox. Follow the instructions to update your credentials securely.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "directory" && (
            <div className="flex flex-col gap-4">
              {currentUserRole === "member" && (
                <div className="mb-4 p-4 sm:p-5 bg-yellow-500/10 border border-yellow-500/20 backdrop-blur-md rounded-2xl flex items-start gap-4 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500/50" />
                  <ShieldAlert className="text-yellow-500 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="text-sm font-bold text-yellow-500 font-sans mb-1 tracking-wide">Restricted View</h4>
                    <p className="text-xs font-sans text-yellow-500/80 leading-relaxed">You are logged in as a Team Member. Administrator emails are obscured for privacy.</p>
                  </div>
                </div>
              )}

              {members.length === 0 ? (
                <div className="p-12 text-center bg-agrasya-card/30 border border-dashed border-agrasya-border rounded-3xl flex flex-col items-center gap-4">
                  <Users size={32} className="text-agrasya-muted/50" />
                  <span className="text-sm font-sans font-medium text-agrasya-muted">No team members found. Invite them by having them sign up!</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {members.map(member => {
                    const isAdminViewing = currentUserRole === "admin";
                    const isSelf = member.id === auth.currentUser?.uid;
                    const displayEmail = (!isAdminViewing && member.role === "admin" && !isSelf) 
                      ? "Administrator (Hidden)" 
                      : member.email;
                    
                    const lastActiveTimestamp = member.lastSeen || member.lastLogin;
                    const isOnline = isSelf || (Date.now() - lastActiveTimestamp < 3 * 60 * 1000);

                    const isDropdownOpen = openDropdownId === member.id;

                    return (
                      <div 
                        key={member.id} 
                        onClick={() => setSelectedMember(member)} 
                        className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-5 bg-agrasya-card/60 backdrop-blur-xl border border-agrasya-border hover:border-agrasya-green/30 rounded-2xl transition-all cursor-pointer group shadow-sm hover:shadow-lg relative ${isDropdownOpen ? 'z-50' : 'z-10'}`}
                      >
                        {/* Glow effect on hover */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-agrasya-green/0 via-agrasya-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none overflow-hidden" />

                        <div className="flex items-center gap-4 z-10 w-full sm:w-auto">
                          {/* Avatar */}
                          <div className="relative w-12 h-12 rounded-full bg-agrasya-surface border border-agrasya-border flex items-center justify-center shrink-0 shadow-inner">
                            <span className="font-serif font-bold text-agrasya-muted text-lg uppercase">
                              {displayEmail.charAt(0)}
                            </span>
                            {isOnline && (
                              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-agrasya-green rounded-full border-2 border-agrasya-card shadow-[0_0_8px_rgba(34,197,94,0.7)]"></span>
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className={`text-sm sm:text-base font-semibold font-sans truncate pr-4 ${displayEmail === "Administrator (Hidden)" ? "italic text-agrasya-muted" : "text-agrasya-text"}`}>
                              {displayEmail}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              {isOnline ? (
                                <span className="text-[11px] sm:text-xs text-agrasya-green flex items-center gap-1.5 font-semibold">
                                  <span className="w-2 h-2 rounded-full bg-agrasya-green animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                                  Online now
                                </span>
                              ) : (
                                <span className="text-[11px] sm:text-xs text-agrasya-muted flex items-center gap-1.5 font-medium">
                                  <Clock size={12} className="shrink-0" />
                                  Last seen {formatLastSeen(lastActiveTimestamp)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Right Side: Role & Actions */}
                        <div className="mt-4 sm:mt-0 ml-0 sm:ml-4 flex items-center justify-between w-full sm:w-auto gap-4 z-10">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm ${
                            member.role === "admin" ? "bg-agrasya-green/10 text-agrasya-green border border-agrasya-green/20" : "bg-agrasya-surface text-agrasya-muted border border-agrasya-border"
                          }`}>
                            {member.role === "admin" ? <ShieldCheck size={12} /> : <Users size={12} />}
                            {member.role}
                          </span>

                          <div className="flex items-center gap-3">
                            {isAdminViewing && !isSelf && (
                              <>
                                <RoleDropdown 
                                  currentRole={member.role} 
                                  onRoleChange={(r) => handleRoleChange(member.id, r)}
                                  isOpen={isDropdownOpen}
                                  onToggle={(open) => setOpenDropdownId(open ? member.id : null)}
                                />
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setMemberToRemove(member.id); }}
                                  className="text-red-500/70 hover:text-red-500 bg-red-500/10 hover:bg-red-500/20 p-2 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
                                  title="Remove Member"
                                >
                                  <UserMinus size={16} />
                                </button>
                              </>
                            )}
                            {isSelf && (
                              <span className="text-[10px] font-bold uppercase tracking-widest text-agrasya-muted bg-agrasya-surface px-2 py-1 rounded-md">You</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Custom Confirmation Modal for Removing Members */}
      <AnimatePresence>
        {memberToRemove && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isRemoving && setMemberToRemove(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            {/* Modal Dialog */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-agrasya-card border border-red-500/30 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-[0_0_40px_rgba(239,68,68,0.15)] flex flex-col overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/0 via-red-500 to-red-500/0 opacity-50" />
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <ShieldAlert size={24} className="text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-bold text-white mb-1">Remove Member</h3>
                  <p className="text-sm font-sans text-white/60 leading-relaxed mb-6">
                    Are you sure you want to remove this team member? They will instantly lose access to the workspace. This action cannot be undone.
                  </p>
                </div>
              </div>

              {removeError && (
                <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-medium">
                  {removeError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 mt-auto">
                <button 
                  disabled={isRemoving}
                  onClick={() => setMemberToRemove(null)}
                  className="px-5 py-2.5 rounded-full text-sm font-semibold text-white/70 hover:text-white hover:bg-white/5 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  disabled={isRemoving}
                  onClick={confirmRemoveMember}
                  className="px-6 py-2.5 rounded-full text-sm font-semibold bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isRemoving ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <UserMinus size={16} />
                  )}
                  {isRemoving ? "Removing..." : "Remove Access"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
