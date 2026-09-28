"use client";

import React, { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { ShieldAlert, ShieldCheck, Users, Mail, Clock, LogOut, KeyRound, CheckCircle2 } from "lucide-react";
import { useMockData } from "../store/MockDataContext";
import { sendPasswordResetEmail } from "firebase/auth";
import { setDoc, deleteDoc } from "firebase/firestore";

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
};

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
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-agrasya-border/50">
        {isAdmin ? (
          <button onClick={onBack} className="text-sm font-sans text-agrasya-muted hover:text-agrasya-text transition-colors">
            ← Back to Team
          </button>
        ) : (
          <button onClick={onSignOut} className="text-sm font-sans flex items-center gap-2 text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-md transition-colors border border-red-200 dark:border-red-900/50">
            <LogOut size={14} /> Sign Out
          </button>
        )}
        <div className="w-px h-6 bg-agrasya-border"></div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-agrasya-surface border border-agrasya-border flex items-center justify-center text-sm font-bold text-agrasya-text">
            {member.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-agrasya-text leading-none">{member.email}</h3>
            <span className="text-[10px] uppercase font-bold tracking-wider text-agrasya-muted">Focus Board ({activeWorkspaceName})</span>
          </div>
        </div>
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden">
        {/* Current Focus */}
        <div className="flex-1 flex flex-col gap-4 border-r border-agrasya-border/50 pr-6">
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
                      <div className="text-[10px] font-bold text-agrasya-muted uppercase tracking-wider mb-1">Founder's Brief</div>
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
        <div className="w-80 flex flex-col gap-4 shrink-0 overflow-hidden">
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
                        "{task.founderBrief}"
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
    <div className="flex-1 bg-agrasya-bg border border-agrasya-border rounded-xl shadow-inner p-8 overflow-y-auto">
      
      {selectedMember ? (
        <FocusBoardView 
          member={selectedMember} 
          onBack={() => setSelectedMember(null)} 
          onSignOut={handleSignOut}
          isAdmin={currentUserRole === "admin"} 
        />
      ) : (
        <>
          <div className="mb-6 border-b border-agrasya-border/50 pb-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-serif font-bold text-agrasya-text flex items-center gap-2">
                <Users className="text-agrasya-green" /> Organization
              </h2>
              <p className="text-sm font-sans text-agrasya-muted mt-1">Manage team access and your profile</p>
            </div>

            <button 
              onClick={handleSignOut}
              className="flex items-center gap-2 text-sm font-sans font-medium text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 px-4 py-2 rounded-md transition-colors border border-red-200 dark:border-red-900/50"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8">
            <button 
              onClick={() => setActiveTab("directory")}
              className={`px-4 py-2 rounded-md text-sm font-sans font-medium transition-colors ${activeTab === "directory" ? "bg-agrasya-text text-agrasya-bg" : "bg-agrasya-surface text-agrasya-muted hover:text-agrasya-text"}`}
            >
              Team Directory
            </button>
            <button 
              onClick={() => setActiveTab("profile")}
              className={`px-4 py-2 rounded-md text-sm font-sans font-medium transition-colors ${activeTab === "profile" ? "bg-agrasya-text text-agrasya-bg" : "bg-agrasya-surface text-agrasya-muted hover:text-agrasya-text"}`}
            >
              My Profile
            </button>
          </div>

      {activeTab === "profile" && (
        <div className="bg-agrasya-card border border-agrasya-border rounded-lg p-6 max-w-xl shadow-sm">
          <h3 className="text-lg font-serif font-bold text-agrasya-text mb-4">Account Security</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-sans font-bold text-agrasya-muted uppercase tracking-wider mb-1">Email Address</label>
              <div className="text-sm font-sans text-agrasya-text bg-agrasya-surface px-3 py-2 rounded border border-agrasya-border">
                {auth.currentUser?.email}
              </div>
            </div>
            <div>
              <label className="block text-xs font-sans font-bold text-agrasya-muted uppercase tracking-wider mb-1">Role</label>
              <div className="text-sm font-sans text-agrasya-text bg-agrasya-surface px-3 py-2 rounded border border-agrasya-border flex items-center gap-2">
                {currentUserRole === "admin" ? <ShieldCheck size={14} className="text-agrasya-green" /> : <Users size={14} className="text-agrasya-muted" />}
                <span className="capitalize">{currentUserRole}</span>
              </div>
            </div>
            <div className="pt-4 border-t border-agrasya-border/50">
              <button 
                onClick={handlePasswordReset}
                disabled={resetSent}
                className="flex items-center gap-2 text-sm font-sans font-medium bg-agrasya-surface border border-agrasya-border px-4 py-2 rounded-md hover:bg-agrasya-text hover:text-agrasya-bg transition-colors"
              >
                {resetSent ? <CheckCircle2 size={16} className="text-agrasya-green" /> : <KeyRound size={16} />}
                {resetSent ? "Reset Email Sent" : "Send Password Reset Email"}
              </button>
              <p className="text-xs text-agrasya-muted mt-2">
                A secure link will be sent to your email to update your password.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "directory" && (
        <>
          {currentUserRole === "member" && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/30 rounded-lg flex items-start gap-3">
              <ShieldAlert className="text-yellow-600 dark:text-yellow-500 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-yellow-800 dark:text-yellow-400 font-sans mb-1">Restricted View</h4>
                <p className="text-xs font-sans text-yellow-700 dark:text-yellow-600">You are logged in as a Team Member. Administrator emails are obscured for privacy.</p>
              </div>
            </div>
          )}

          <div className="bg-agrasya-card border border-agrasya-border rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-left font-sans">
              <thead>
                <tr className="bg-agrasya-surface border-b border-agrasya-border">
                  <th className="p-4 text-xs font-bold text-agrasya-muted uppercase tracking-wider">User Account</th>
                  <th className="p-4 text-xs font-bold text-agrasya-muted uppercase tracking-wider">Last Login</th>
                  <th className="p-4 text-xs font-bold text-agrasya-muted uppercase tracking-wider">Role</th>
                  <th className="p-4 text-xs font-bold text-agrasya-muted uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map(member => {
                  const isAdminViewing = currentUserRole === "admin";
                  const isSelf = member.id === auth.currentUser?.uid;
                  const displayEmail = (!isAdminViewing && member.role === "admin" && !isSelf) 
                    ? "Administrator (Hidden)" 
                    : member.email;
                  
                  // Consider online if logged in within the last 2 hours for demo purposes, or if it's the current user.
                  const isOnline = isSelf || (Date.now() - member.lastLogin < 2 * 60 * 60 * 1000);

                  return (
                    <tr key={member.id} onClick={() => setSelectedMember(member)} className="border-b border-agrasya-border/50 hover:bg-agrasya-surface transition-colors cursor-pointer">
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm text-agrasya-text font-medium relative">
                          <div className="relative">
                            <Mail size={14} className="text-agrasya-muted" />
                            {isOnline && (
                              <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-agrasya-green rounded-full border border-agrasya-card"></span>
                            )}
                          </div>
                          <span className={displayEmail === "Administrator (Hidden)" ? "italic text-agrasya-muted" : ""}>
                            {displayEmail}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-agrasya-muted flex items-center gap-1">
                        <Clock size={12} /> {new Date(member.lastLogin).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          member.role === "admin" ? "bg-agrasya-green/10 text-agrasya-green border border-agrasya-green/20" : "bg-agrasya-surface text-agrasya-muted border border-agrasya-border"
                        }`}>
                          {member.role === "admin" ? <ShieldCheck size={10} /> : <Users size={10} />}
                          {member.role}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {isAdminViewing && !isSelf && (
                          <select 
                            value={member.role}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleRoleChange(member.id, e.target.value as "admin" | "member")}
                            className="text-xs bg-agrasya-surface border border-agrasya-border rounded p-1 text-agrasya-text cursor-pointer focus:outline-none focus:border-agrasya-green"
                          >
                            <option value="admin">Make Admin</option>
                            <option value="member">Make Member</option>
                          </select>
                        )}
                        {isSelf && (
                          <span className="text-xs text-agrasya-muted italic">You</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            
            {members.length === 0 && (
              <div className="p-8 text-center text-sm text-agrasya-muted italic">
                No team members found. Invite them by having them sign up!
              </div>
            )}
          </div>
        </>
      )}
      </>
      )}
    </div>
  );
}
