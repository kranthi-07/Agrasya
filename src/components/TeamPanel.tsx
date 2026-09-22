"use client";

import React, { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { ShieldAlert, ShieldCheck, Users, Mail, Clock, LogOut, KeyRound, CheckCircle2 } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";

type TeamMember = {
  id: string;
  email: string;
  role: "admin" | "member";
  lastLogin: number;
};

export function TeamPanel() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<"admin" | "member" | null>(null);
  const [activeTab, setActiveTab] = useState<"directory" | "profile">("directory");
  const [resetSent, setResetSent] = useState(false);

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

                  return (
                    <tr key={member.id} className="border-b border-agrasya-border/50 hover:bg-agrasya-surface transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm text-agrasya-text font-medium">
                          <Mail size={14} className="text-agrasya-muted" /> 
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
    </div>
  );
}
