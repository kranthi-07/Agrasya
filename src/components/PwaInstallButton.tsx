"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Smartphone, Monitor, CheckCircle, Share, PlusSquare, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AgrasyaLogo } from "./AgrasyaLogo";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

// Store the install prompt at the module level so it's captured even before React hydration
let globalInstallPrompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    globalInstallPrompt = e as BeforeInstallPromptEvent;
  });
}

export function PwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (globalInstallPrompt) {
      setDeferredPrompt(globalInstallPrompt);
    }

    // 1. Register Service Worker for PWA compliance
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] Service Worker registered with scope:", reg.scope);
        })
        .catch((err) => {
          console.warn("[PWA] Service Worker registration failed:", err);
        });
    }

    // 2. Check if already running as standalone app
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes("android-app://");
      setIsStandalone(isStandaloneMode);
    };
    checkStandalone();

    // 3. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    // 4. Capture beforeinstallprompt event (Desktop Chrome/Edge & Android Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
      setInstalledSuccess(true);
      setTimeout(() => setInstalledSuccess(false), 4000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isStandalone) {
      setInstalledSuccess(true);
      setTimeout(() => setInstalledSuccess(false), 3000);
      return;
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setIsStandalone(true);
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.error("Install prompt error:", err);
        setIsModalOpen(true);
      }
    } else {
      // Show instructional modal (for iOS or browsers without deferred prompt)
      setIsModalOpen(true);
    }
  };

  if (isStandalone) {
    return (
      <div
        className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-agrasya-green/10 border border-agrasya-green/20 text-agrasya-green text-xs font-sans font-medium"
        title="Running as installed Agrasya App"
      >
        <CheckCircle size={14} />
        <span>App Installed</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="h-9 sm:h-10 px-3 sm:px-3.5 flex items-center gap-1.5 rounded-full text-xs font-sans font-semibold text-agrasya-text bg-agrasya-surface/90 hover:bg-agrasya-surface border border-agrasya-border hover:border-agrasya-green/40 transition-all shadow-sm shrink-0 group"
        title="Download Agrasya as App on PC or Mobile"
      >
        <Download size={15} className="text-agrasya-green group-hover:scale-110 transition-transform" />
        <span className="hidden sm:inline">Download App</span>
      </button>

      {/* Instructional Modal for iOS or Desktop Manual Install (Rendered in Portal to avoid header backdrop-blur clipping) */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isModalOpen && (
              <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-md"
                  onClick={() => setIsModalOpen(false)}
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="relative w-full max-w-md bg-agrasya-card border border-agrasya-border rounded-3xl shadow-2xl p-6 sm:p-8 z-10 flex flex-col gap-6 my-auto"
                >
                  <div className="flex items-center justify-between border-b border-agrasya-border/50 pb-4">
                    <div className="flex items-center gap-3">
                      <AgrasyaLogo size={42} variant="badge" />
                      <div>
                        <h3 className="text-lg font-serif font-bold text-agrasya-text leading-tight">
                          Install Agrasya OS
                        </h3>
                        <p className="text-xs font-sans text-agrasya-muted">
                          Use as a standalone app on Mobile & PC
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="p-1 rounded-full text-agrasya-muted hover:text-agrasya-text hover:bg-agrasya-surface"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {isIOS ? (
                    /* iOS Safari instructions */
                    <div className="space-y-4">
                      <div className="p-3 bg-agrasya-surface/80 rounded-2xl border border-agrasya-border flex items-start gap-3">
                        <Smartphone className="text-agrasya-green shrink-0 mt-0.5" size={20} />
                        <div className="text-xs font-sans text-agrasya-text">
                          <span className="font-bold">Apple iOS Install:</span> Add Agrasya directly to your home screen for full app mode.
                        </div>
                      </div>

                      <div className="space-y-3 font-sans text-xs text-agrasya-text/90">
                        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-agrasya-surface/50 border border-agrasya-border/60">
                          <div className="w-7 h-7 rounded-lg bg-agrasya-green/10 text-agrasya-green flex items-center justify-center shrink-0">
                            <Share size={15} />
                          </div>
                          <span>1. Tap the <strong>Share</strong> button in Safari's bottom toolbar.</span>
                        </div>

                        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-agrasya-surface/50 border border-agrasya-border/60">
                          <div className="w-7 h-7 rounded-lg bg-agrasya-green/10 text-agrasya-green flex items-center justify-center shrink-0">
                            <PlusSquare size={15} />
                          </div>
                          <span>2. Scroll down and select <strong>&quot;Add to Home Screen&quot;</strong>.</span>
                        </div>

                        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-agrasya-surface/50 border border-agrasya-border/60">
                          <div className="w-7 h-7 rounded-lg bg-agrasya-green/10 text-agrasya-green flex items-center justify-center shrink-0">
                            <CheckCircle size={15} />
                          </div>
                          <span>3. Tap <strong>Add</strong> in the top-right corner to finish.</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Desktop / Android instructions */
                    <div className="space-y-4">
                      {deferredPrompt && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (deferredPrompt) {
                              try {
                                await deferredPrompt.prompt();
                                const choice = await deferredPrompt.userChoice;
                                if (choice.outcome === "accepted") {
                                  setIsStandalone(true);
                                  setDeferredPrompt(null);
                                  setIsModalOpen(false);
                                }
                              } catch (err) {
                                console.error(err);
                              }
                            }
                          }}
                          className="w-full bg-agrasya-green hover:bg-emerald-600 text-agrasya-bg py-3 px-4 rounded-2xl text-xs sm:text-sm font-sans font-bold shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <Download size={18} />
                          <span>1-Click Install Agrasya App</span>
                        </button>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-4 bg-agrasya-surface/80 rounded-2xl border border-agrasya-green/40 ring-2 ring-agrasya-green/20 flex flex-col items-center text-center gap-2">
                          <Monitor className="text-agrasya-green" size={24} />
                          <div className="text-xs font-bold text-agrasya-text">PC / Mac (Chrome & Edge)</div>
                          <p className="text-[11px] text-agrasya-muted leading-relaxed">
                            Look at the top-right of your browser address bar: click the <span className="inline-flex items-center px-2 py-0.5 rounded bg-agrasya-card border border-agrasya-border font-bold text-agrasya-text">🖵↓ Install</span> icon right next to the star bookmark icon!
                          </p>
                        </div>

                        <div className="p-4 bg-agrasya-surface/80 rounded-2xl border border-agrasya-border flex flex-col items-center text-center gap-2">
                          <Smartphone className="text-agrasya-green" size={24} />
                          <div className="text-xs font-bold text-agrasya-text">Android Phone</div>
                          <p className="text-[11px] text-agrasya-muted leading-relaxed">
                            Tap the 3 dots <strong>⋮</strong> menu in Chrome and tap <strong>&quot;Install App&quot;</strong> or <strong>&quot;Add to Home Screen&quot;</strong>.
                          </p>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-agrasya-green/10 border border-agrasya-green/20 text-xs font-sans text-agrasya-green leading-relaxed text-center">
                        Once installed, Agrasya opens in its own window without browser tabs!
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-2 border-t border-agrasya-border/50">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="w-full bg-agrasya-surface hover:bg-agrasya-card text-agrasya-text py-2.5 rounded-full text-xs font-sans font-semibold border border-agrasya-border transition-all"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* Installed Toast Notification */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {installedSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-6 right-6 z-[99999] bg-agrasya-card border border-agrasya-green/40 shadow-2xl rounded-2xl p-4 flex items-center gap-3 backdrop-blur-xl"
              >
                <CheckCircle className="text-agrasya-green" size={20} />
                <div className="text-xs font-sans">
                  <p className="font-bold text-agrasya-text">Agrasya OS Installed</p>
                  <p className="text-agrasya-muted">Launch anytime from your desktop or home screen!</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
