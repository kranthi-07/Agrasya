"use client";

import React, { useState } from "react";
import { auth } from "../lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { motion } from "framer-motion";
import { ShieldCheck, Loader2, Globe } from "lucide-react";

export function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const { user } = userCredential;
      const { doc, setDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: user.email === "vkranthi237@gmail.com" ? "admin" : "member",
        lastLogin: Date.now()
      }, { merge: true });
    } catch (err: any) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let userCredential;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      }
      
      const { user } = userCredential;
      const { doc, setDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: user.email === "vkranthi237@gmail.com" ? "admin" : "member",
        lastLogin: Date.now()
      }, { merge: true });

    } catch (err: any) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-agrasya-bg flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-agrasya-card border border-agrasya-border rounded-xl shadow-2xl p-8"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-agrasya-surface rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="text-agrasya-green" size={24} />
          </div>
          <h1 className="text-3xl font-serif tracking-tight text-agrasya-text mb-1">
            Agrasya<span className="text-agrasya-green">.</span>
          </h1>
          <p className="text-sm font-sans text-agrasya-muted uppercase tracking-widest font-medium">
            Founder OS Access
          </p>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          type="button"
          className="w-full mb-6 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-md font-sans font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Globe size={18} className="text-blue-500" /> 
          Sign in with Google
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="h-px bg-agrasya-border flex-1"></div>
          <span className="text-xs font-sans text-agrasya-muted uppercase">OR EMAIL</span>
          <div className="h-px bg-agrasya-border flex-1"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-md font-sans">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-xs font-sans font-bold text-agrasya-muted uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-agrasya-bg border border-agrasya-border rounded-md focus:outline-none focus:ring-2 focus:ring-agrasya-green/50 focus:border-agrasya-green transition-all text-agrasya-text font-sans"
              placeholder="you@gmail.com"
            />
          </div>

          <div>
            <label className="block text-xs font-sans font-bold text-agrasya-muted uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-agrasya-bg border border-agrasya-border rounded-md focus:outline-none focus:ring-2 focus:ring-agrasya-green/50 focus:border-agrasya-green transition-all text-agrasya-text font-sans"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-agrasya-text text-white py-2.5 rounded-md font-sans font-semibold hover:bg-black transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (isLogin ? "Authenticate" : "Create Master Account")}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-agrasya-border pt-6">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            className="text-xs font-sans text-agrasya-muted hover:text-agrasya-green transition-colors"
          >
            {isLogin ? "First time here? Create an account →" : "Already have an account? Sign in →"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
