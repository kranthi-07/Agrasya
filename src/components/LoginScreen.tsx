"use client";

import React, { useState } from "react";
import { auth } from "../lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  sendPasswordResetEmail 
} from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Globe, CheckCircle2, AlertCircle, KeyRound } from "lucide-react";
import { AgrasyaLogo } from "./AgrasyaLogo";
import { PwaInstallButton } from "./PwaInstallButton";

function formatAuthError(err: any): string {
  const code = err?.code || "";
  const msg = err?.message || "";

  if (code.includes("invalid-credential") || code.includes("user-not-found") || code.includes("wrong-password")) {
    return "Invalid email or password. If you haven't created an account yet, switch to 'Create Account' above.";
  }
  if (code.includes("email-already-in-use")) {
    return "This email is already registered. Please switch to 'Sign In' above.";
  }
  if (code.includes("weak-password")) {
    return "Password is too weak. Please use at least 6 characters.";
  }
  if (code.includes("invalid-email")) {
    return "Please enter a valid email address.";
  }
  if (code.includes("popup-closed-by-user") || code.includes("cancelled-popup-request")) {
    return "Sign-in popup was closed before completing.";
  }
  if (code.includes("popup-blocked")) {
    return "The sign-in popup was blocked by your browser. Please allow popups or sign in with email & password.";
  }
  if (code.includes("unauthorized-domain")) {
    return "This domain or IP is not in your Firebase authorized domains list. Please access via http://localhost:8000.";
  }
  if (code.includes("network-request-failed")) {
    return "Network connection issue. Please check your internet connection.";
  }

  return msg.replace("Firebase: ", "").replace(/\(auth\/[^)]+\)\.?/, "").trim() || "An authentication error occurred. Please try again.";
}

export function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Background non-blocking profile sync
  const syncUserProfile = (user: any) => {
    import("firebase/firestore").then(({ doc, setDoc }) => {
      import("../lib/firebase").then(({ db }) => {
        setDoc(
          doc(db, "users", user.uid),
          {
            email: user.email,
            role: user.email === "vkranthi237@gmail.com" ? "admin" : "member",
            lastLogin: Date.now(),
            lastSeen: Date.now()
          },
          { merge: true }
        ).catch((err) => {
          console.warn("User profile sync error:", err);
        });
      });
    });
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setResetSuccess(null);
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const userCredential = await signInWithPopup(auth, provider);
      syncUserProfile(userCredential.user);
      // onAuthStateChanged in page.tsx will immediately log the user in
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      setError(formatAuthError(err));
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetSuccess(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    setLoading(true);

    try {
      let userCredential;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      }

      syncUserProfile(userCredential.user);
      // onAuthStateChanged in page.tsx will transition to HomeCanvas
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(formatAuthError(err));
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("Please enter your email address in the field below first, then click 'Forgot password?'.");
      return;
    }

    setError(null);
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setResetSuccess(`Password reset email sent to ${cleanEmail}. Check your inbox!`);
    } catch (err: any) {
      setError(formatAuthError(err));
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-agrasya-bg flex flex-col items-center justify-center p-4 relative selection:bg-agrasya-green/20">
      {/* Background Glow */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] rounded-full bg-agrasya-green/10 blur-[130px]"></div>
        <div className="absolute bottom-[20%] right-[20%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[130px]"></div>
      </div>

      {/* Download App pill in top-right */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
        <PwaInstallButton />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-agrasya-card/90 backdrop-blur-2xl border border-agrasya-border rounded-3xl shadow-2xl p-6 sm:p-8"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="mb-3.5">
            <AgrasyaLogo size={56} variant="badge" glow />
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-agrasya-text mb-1">
            Agrasya<span className="text-agrasya-green">.</span>
          </h1>
          <p className="text-[11px] font-sans text-agrasya-muted uppercase tracking-widest font-bold">
            Founder Operating System
          </p>
        </div>

        {/* Mode Toggle: Sign In vs Create Account */}
        <div className="flex bg-agrasya-surface p-1 rounded-2xl border border-agrasya-border mb-6">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(null); setResetSuccess(null); }}
            className={`flex-1 py-2 rounded-xl text-xs font-sans font-bold transition-all ${
              isLogin 
                ? "bg-agrasya-text text-agrasya-bg shadow-sm" 
                : "text-agrasya-muted hover:text-agrasya-text"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(null); setResetSuccess(null); }}
            className={`flex-1 py-2 rounded-xl text-xs font-sans font-bold transition-all ${
              !isLogin 
                ? "bg-agrasya-text text-agrasya-bg shadow-sm" 
                : "text-agrasya-muted hover:text-agrasya-text"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Google One-Click Sign In */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          type="button"
          className="w-full mb-5 bg-agrasya-surface/80 hover:bg-agrasya-surface border border-agrasya-border text-agrasya-text py-2.5 px-4 rounded-xl font-sans font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2.5 shadow-sm hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
        >
          <Globe size={18} className="text-agrasya-green" /> 
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="h-px bg-agrasya-border/70 flex-1"></div>
          <span className="text-[10px] font-sans text-agrasya-muted uppercase tracking-widest font-bold">OR EMAIL</span>
          <div className="h-px bg-agrasya-border/70 flex-1"></div>
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-xs rounded-xl font-sans flex items-start gap-2.5"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Alert */}
        <AnimatePresence>
          {resetSuccess && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-agrasya-green/10 border border-agrasya-green/30 text-agrasya-green text-xs rounded-xl font-sans flex items-start gap-2.5"
            >
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <div className="leading-relaxed">{resetSuccess}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-sans font-bold text-agrasya-muted uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-agrasya-surface/80 border border-agrasya-border rounded-xl focus:outline-none focus:ring-2 focus:ring-agrasya-green/40 focus:border-agrasya-green transition-all text-agrasya-text font-sans text-sm"
              placeholder="founder@agrasya.com"
              autoComplete="email"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-sans font-bold text-agrasya-muted uppercase tracking-wider">
                Password
              </label>
              {isLogin && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetLoading}
                  className="text-[11px] font-sans text-agrasya-green hover:underline flex items-center gap-1 disabled:opacity-50"
                >
                  <KeyRound size={11} />
                  <span>Forgot password?</span>
                </button>
              )}
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-agrasya-surface/80 border border-agrasya-border rounded-xl focus:outline-none focus:ring-2 focus:ring-agrasya-green/40 focus:border-agrasya-green transition-all text-agrasya-text font-sans text-sm"
              placeholder="••••••••"
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-agrasya-text text-agrasya-bg py-3 rounded-full font-sans font-bold text-xs sm:text-sm hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : isLogin ? (
              "Sign In to Agrasya OS"
            ) : (
              "Create Account & Launch OS"
            )}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-agrasya-border/60 pt-4">
          <p className="text-[11px] font-sans text-agrasya-muted">
            {isLogin ? "New team member or founder?" : "Already registered?"}{" "}
            <button 
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(null); setResetSuccess(null); }}
              className="text-agrasya-green font-bold hover:underline ml-1"
            >
              {isLogin ? "Create account here →" : "Sign in here →"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
