"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Film, 
  Plus, 
  Search, 
  X, 
  ExternalLink, 
  Play, 
  Trash2, 
  Hash, 
  Sparkles, 
  CheckCircle2, 
  Filter, 
  SlidersHorizontal, 
  LayoutGrid, 
  List, 
  Tag, 
  Share2, 
  Copy, 
  Check, 
  Clock, 
  Bookmark, 
  FolderPlus,
  PlaySquare,
  Compass,
  ArrowUpRight
} from "lucide-react";
import { cn } from "../lib/utils";
import { triggerHaptic } from "../lib/haptics";
import { useMockData } from "../store/MockDataContext";
import { db } from "../lib/firebase";
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs } from "firebase/firestore";

export type ReelPlatform = "youtube" | "instagram" | "tiktok" | "other";

export type ReelItem = {
  id: string;
  workspaceId: string;
  url: string;
  title: string;
  category: string;
  platform: ReelPlatform;
  thumbnailUrl: string;
  embedUrl?: string;
  notes?: string;
  tags: string[];
  createdAt: number;
  addedBy: string;
};

export type ReelCategory = {
  id: string;
  name: string;
  color: string;
  symbol?: string;
};

const DEFAULT_CATEGORIES: ReelCategory[] = [
  { id: "all", name: "All", color: "amber" },
  { id: "farming", name: "Farming Hacks", color: "emerald", symbol: "#" },
  { id: "packaging", name: "Packaging & Design", color: "sky", symbol: "@" },
  { id: "marketing", name: "Marketing & Ads", color: "pink", symbol: "$" },
  { id: "education", name: "Customer Education", color: "purple", symbol: "!" },
  { id: "logistics", name: "Cold Chain & Logistics", color: "teal", symbol: "/" },
];

const INITIAL_REELS: ReelItem[] = [
  {
    id: "reel-1",
    workspaceId: "main-workspace",
    url: "https://www.youtube.com/shorts/50zLg20rJ9M",
    title: "Solar automated drip irrigation valve hack for smallholder plots",
    category: "Farming Hacks",
    platform: "youtube",
    thumbnailUrl: "https://images.unsplash.com/photo-1592417817098-8f3d6eb2250d?auto=format&fit=crop&w=600&q=80",
    embedUrl: "https://www.youtube.com/embed/50zLg20rJ9M",
    notes: "Clever gravity-fed water line with solar timed pulse valve. Cost is under ₹1,200 per acre.",
    tags: ["irrigation", "solar", "drip", "hack", "lowcost"],
    createdAt: Date.now() - 86400000 * 2,
    addedBy: "Field Team"
  },
  {
    id: "reel-2",
    workspaceId: "main-workspace",
    url: "https://www.instagram.com/reel/C8xyz123456",
    title: "Direct-from-farm cold-pressed oil bottle unboxing & tamper-seal design",
    category: "Packaging & Design",
    platform: "instagram",
    thumbnailUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80",
    embedUrl: "https://www.instagram.com/reel/C8xyz123456/embed",
    notes: "Notice how the amber glass bottle uses an embossed sugarcane pulp sleeve instead of plastic bubble wrap.",
    tags: ["unboxing", "glass", "packaging", "sustainable"],
    createdAt: Date.now() - 86400000 * 4,
    addedBy: "Founder"
  },
  {
    id: "reel-3",
    workspaceId: "main-workspace",
    url: "https://www.instagram.com/reel/C7abc987654",
    title: "Viral storytelling ad formula: Showing the farmer at 5:00 AM picking fresh ragi",
    category: "Marketing & Ads",
    platform: "instagram",
    thumbnailUrl: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80",
    embedUrl: "https://www.instagram.com/reel/C7abc987654/embed",
    notes: "Generated 1.4M views with zero ad spend by focusing on transparency and fair wages paid.",
    tags: ["viral", "storytelling", "ragi", "farmers", "organic"],
    createdAt: Date.now() - 86400000 * 6,
    addedBy: "Growth Lead"
  },
  {
    id: "reel-4",
    workspaceId: "main-workspace",
    url: "https://www.youtube.com/shorts/J78H_kls90x",
    title: "Why ancient millets beat refined wheat: 30-second glycemic index breakdown",
    category: "Customer Education",
    platform: "youtube",
    thumbnailUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80",
    embedUrl: "https://www.youtube.com/embed/J78H_kls90x",
    notes: "High impact graphic visual showing sustained energy release vs glucose spike. Great content angle.",
    tags: ["millets", "glycemic", "nutrition", "shorts"],
    createdAt: Date.now() - 86400000 * 8,
    addedBy: "Content Lead"
  },
  {
    id: "reel-5",
    workspaceId: "main-workspace",
    url: "https://www.youtube.com/shorts/32kLmNp891q",
    title: "Refrigerated van temperature IoT probe unboxing & real-time telemetry test",
    category: "Cold Chain & Logistics",
    platform: "youtube",
    thumbnailUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80",
    embedUrl: "https://www.youtube.com/embed/32kLmNp891q",
    notes: "Bluetooth and 4G sensor with 30-day battery life for rural transit vans.",
    tags: ["iot", "coldchain", "telemetry", "logistics"],
    createdAt: Date.now() - 86400000 * 10,
    addedBy: "Logistics Team"
  }
];

// Helper: Parse URL to detect platform and generate embed / thumbnail
export function parseVideoUrl(inputUrl: string): { platform: ReelPlatform; embedUrl: string; thumbnailUrl: string } {
  const url = inputUrl.trim();
  
  // YouTube Shorts or Regular YouTube
  const ytShortMatch = url.match(/(?:shorts\/|v\/|watch\?v=|youtu\.be\/)([\w-]{11})/i);
  if (ytShortMatch && ytShortMatch[1]) {
    const videoId = ytShortMatch[1];
    return {
      platform: "youtube",
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    };
  }

  // Instagram Reel / Post
  const igMatch = url.match(/(?:reel|reels|p)\/([\w-]+)/i);
  if (igMatch && igMatch[1]) {
    const code = igMatch[1];
    return {
      platform: "instagram",
      embedUrl: `https://www.instagram.com/reel/${code}/embed/`,
      thumbnailUrl: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=600&q=80"
    };
  }

  // TikTok
  if (url.includes("tiktok.com")) {
    return {
      platform: "tiktok",
      embedUrl: url,
      thumbnailUrl: "https://images.unsplash.com/photo-1611605698335-8b1569810432?auto=format&fit=crop&w=600&q=80"
    };
  }

  // Fallback
  return {
    platform: "other",
    embedUrl: url,
    thumbnailUrl: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=600&q=80"
  };
}

export function ReelsCanvas() {
  const { activeWorkspaceId, workspaces } = useMockData();
  
  const [reels, setReels] = useState<ReelItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`agrasya_reels_${activeWorkspaceId}`);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return INITIAL_REELS;
  });

  const [categories, setCategories] = useState<ReelCategory[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`agrasya_reel_categories_${activeWorkspaceId}`);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return DEFAULT_CATEGORIES;
  });

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title">("newest");
  const [viewLayout, setViewLayout] = useState<"grid" | "list">("grid");

  // Modals & Active Playing
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [activePlayingReel, setActivePlayingReel] = useState<ReelItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`agrasya_reels_${activeWorkspaceId}`, JSON.stringify(reels));
    }
  }, [reels, activeWorkspaceId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`agrasya_reel_categories_${activeWorkspaceId}`, JSON.stringify(categories));
    }
  }, [categories, activeWorkspaceId]);

  // Firestore optional live backup
  useEffect(() => {
    if (!activeWorkspaceId) return;
    const reelsCol = collection(db, "reels");
    getDocs(reelsCol).then(snapshot => {
      if (snapshot.empty) {
        INITIAL_REELS.forEach(r => {
          setDoc(doc(db, "reels", r.id), r).catch(() => {});
        });
      }
    }).catch(() => {});

    const unsubscribe = onSnapshot(reelsCol, (snapshot) => {
      if (!snapshot.empty) {
        const fetched = snapshot.docs.map(d => d.data() as ReelItem);
        if (fetched.length > 0) {
          setReels(fetched);
        }
      }
    }, () => {});

    return () => unsubscribe();
  }, [activeWorkspaceId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter & Sort
  const filteredReels = useMemo(() => {
    return reels.filter(reel => {
      const matchesCategory = selectedCategory === "All" || reel.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesPlatform = platformFilter === "all" || reel.platform === platformFilter;
      const query = searchQuery.toLowerCase().trim();

      if (!query) return matchesCategory && matchesPlatform;

      const matchesSearch = 
        reel.title.toLowerCase().includes(query) ||
        reel.category.toLowerCase().includes(query) ||
        (reel.notes && reel.notes.toLowerCase().includes(query)) ||
        reel.tags.some(t => t.toLowerCase().includes(query));

      return matchesCategory && matchesPlatform && matchesSearch;
    }).sort((a, b) => {
      if (sortBy === "newest") return b.createdAt - a.createdAt;
      if (sortBy === "oldest") return a.createdAt - b.createdAt;
      if (sortBy === "title") return a.title.localeCompare(b.title);
      return 0;
    });
  }, [reels, selectedCategory, platformFilter, searchQuery, sortBy]);

  const handleDeleteReel = (reelId: string, title: string) => {
    triggerHaptic("heavy");
    if (confirm(`Remove "${title}" from Reels Hub?`)) {
      setReels(prev => prev.filter(r => r.id !== reelId));
      deleteDoc(doc(db, "reels", reelId)).catch(() => {});
      showToast(`Removed from Reels Hub`);
      if (activePlayingReel?.id === reelId) {
        setActivePlayingReel(null);
      }
    }
  };

  const handleAddReel = (newReel: Omit<ReelItem, "id" | "createdAt">) => {
    const reelItem: ReelItem = {
      ...newReel,
      id: `reel-${Date.now()}`,
      createdAt: Date.now(),
    };

    setReels(prev => [reelItem, ...prev]);
    setDoc(doc(db, "reels", reelItem.id), reelItem).catch(() => {});
    showToast(`Saved to "${reelItem.category}" category!`);
    triggerHaptic("success");
    setIsAddModalOpen(false);
  };

  const currentWorkspaceName = workspaces.find(w => w.id === activeWorkspaceId)?.name || "Main Workspace";

  return (
    <div className="flex-1 flex flex-col w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-28 md:pb-12">
      {/* Top Hero & Action Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400 px-2.5 py-0.5 bg-pink-500/10 border border-pink-500/30 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
              {currentWorkspaceName}
            </span>
            <span className="text-xs text-agrasya-muted font-sans font-medium">
              {reels.length} {reels.length === 1 ? "Video Spark" : "Video Sparks"} Saved
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-agrasya-text tracking-tight flex items-center gap-2">
            <Film className="text-pink-500" size={26} />
            Reels & Shorts Knowledge Hub
          </h1>
          <p className="text-xs sm:text-sm font-sans text-agrasya-muted max-w-2xl mt-1">
            Store, auto-categorize, and instantly replay viral farming hacks, competitor packaging unboxings, and marketing inspirations.
          </p>
        </div>

        {/* Add Reel Button */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              triggerHaptic("medium");
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white font-sans font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all"
          >
            <Plus size={16} />
            <span>Save Reel / Short</span>
          </motion.button>
        </div>
      </div>

      {/* Category Pills (Horizontal Scrollable with Symbol Indicator) */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2 mb-4 scroll-smooth">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.name;
          const count = cat.name === "All" 
            ? reels.length 
            : reels.filter(r => r.category.toLowerCase() === cat.name.toLowerCase()).length;

          return (
            <button
              key={cat.id}
              onClick={() => {
                triggerHaptic("selection");
                setSelectedCategory(cat.name);
              }}
              className={cn(
                "whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-sans font-semibold transition-all shrink-0 flex items-center gap-1.5 border active:scale-95",
                isActive
                  ? "bg-agrasya-text text-agrasya-bg border-agrasya-text shadow-sm font-bold"
                  : "bg-agrasya-card/80 text-agrasya-muted hover:text-agrasya-text border-agrasya-border hover:bg-agrasya-surface"
              )}
            >
              {cat.symbol && <span className="opacity-70">{cat.symbol}</span>}
              <span>{cat.name}</span>
              <span className={cn(
                "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                isActive ? "bg-agrasya-bg/20 text-agrasya-bg" : "bg-black/5 dark:bg-white/10 text-agrasya-muted"
              )}>
                {count}
              </span>
            </button>
          );
        })}

        <button
          onClick={() => {
            triggerHaptic("selection");
            setIsCategoryModalOpen(true);
          }}
          className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-sans font-medium text-agrasya-muted hover:text-agrasya-text border border-dashed border-agrasya-border hover:border-agrasya-text/40 transition-colors shrink-0 flex items-center gap-1"
        >
          <Plus size={13} />
          <span>Category</span>
        </button>
      </div>

      {/* Search, Platform Filter & Layout Controls */}
      <div className="bg-agrasya-card/70 backdrop-blur-md border border-agrasya-border rounded-2xl p-2.5 sm:p-3 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        {/* Search Bar */}
        <div className="relative w-full sm:max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-agrasya-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, notes, or tags (e.g. #packaging)..."
            className="w-full bg-agrasya-surface/80 border border-agrasya-border rounded-xl pl-9 pr-9 py-2 text-xs sm:text-sm font-sans text-agrasya-text placeholder:text-agrasya-muted focus:outline-none focus:ring-2 focus:ring-pink-500/40 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-agrasya-muted hover:text-agrasya-text p-0.5 rounded-full"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Platform & Layout Toggles */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Platform Pills */}
          <div className="flex items-center bg-agrasya-surface border border-agrasya-border rounded-lg p-0.5 text-xs font-sans">
            {[
              { id: "all", label: "All" },
              { id: "youtube", label: "Shorts" },
              { id: "instagram", label: "Reels" }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => {
                  triggerHaptic("selection");
                  setPlatformFilter(p.id);
                }}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-colors font-medium",
                  platformFilter === p.id ? "bg-agrasya-card text-agrasya-text font-bold shadow-xs" : "text-agrasya-muted hover:text-agrasya-text"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-agrasya-surface border border-agrasya-border rounded-lg p-0.5">
            <button
              onClick={() => {
                triggerHaptic("selection");
                setViewLayout("grid");
              }}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewLayout === "grid" ? "bg-agrasya-card text-agrasya-text shadow-xs" : "text-agrasya-muted hover:text-agrasya-text"
              )}
              title="Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => {
                triggerHaptic("selection");
                setViewLayout("list");
              }}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewLayout === "list" ? "bg-agrasya-card text-agrasya-text shadow-xs" : "text-agrasya-muted hover:text-agrasya-text"
              )}
              title="List View"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Reels Content */}
      {filteredReels.length === 0 ? (
        <div className="bg-agrasya-card/50 border border-dashed border-agrasya-border rounded-3xl p-10 sm:p-16 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-500 flex items-center justify-center mb-3">
            <Film size={28} />
          </div>
          <h3 className="text-base sm:text-lg font-serif font-bold text-agrasya-text mb-1">
            No video sparks found
          </h3>
          <p className="text-xs sm:text-sm font-sans text-agrasya-muted max-w-md mb-5">
            {searchQuery 
              ? `No videos matching "${searchQuery}".` 
              : "No reels or shorts saved in this category yet. Save a link with a category symbol (e.g. #farming or @packaging) to auto-arrange."}
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-full bg-pink-500 text-white text-xs font-sans font-bold hover:bg-pink-600 shadow-sm flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Save First Reel</span>
          </button>
        </div>
      ) : viewLayout === "grid" ? (
        /* Vertical 9:16 Video Card Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          <AnimatePresence>
            {filteredReels.map((reel) => (
              <motion.div
                key={reel.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onClick={() => {
                  triggerHaptic("light");
                  setActivePlayingReel(reel);
                }}
                className="group relative bg-black rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all aspect-[9/16] cursor-pointer flex flex-col justify-between border border-white/10"
              >
                {/* Background Video Poster Thumbnail */}
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url(${reel.thumbnailUrl})` }}
                />

                {/* Dark Gradient Overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/60 pointer-events-none" />

                {/* Top Badge: Platform & Category */}
                <div className="relative z-10 p-2.5 sm:p-3 flex items-start justify-between gap-1.5">
                  <span className={cn(
                    "text-[10px] font-sans font-bold uppercase tracking-wider px-2 py-0.5 rounded-full backdrop-blur-md border text-white",
                    reel.platform === "youtube" ? "bg-red-600/80 border-red-400/40" :
                    reel.platform === "instagram" ? "bg-pink-600/80 border-pink-400/40" : "bg-black/60 border-white/20"
                  )}>
                    {reel.platform === "youtube" ? "Shorts" : reel.platform === "instagram" ? "Reels" : "Video"}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteReel(reel.id, reel.title);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-full bg-black/60 text-white/70 hover:text-red-400 transition-all backdrop-blur-md"
                    title="Remove Video"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Center Big Play Button (Spring pop on hover) */}
                <div className="relative z-10 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/25 group-hover:bg-pink-500 border border-white/40 text-white flex items-center justify-center backdrop-blur-md transition-all group-hover:scale-110 shadow-lg">
                    <Play size={20} className="fill-white translate-x-0.5" />
                  </div>
                </div>

                {/* Bottom Information */}
                <div className="relative z-10 p-2.5 sm:p-3 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-sans font-bold text-amber-300 bg-black/50 px-2 py-0.2 rounded-md backdrop-blur-sm border border-amber-300/30 truncate">
                      {reel.category}
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-serif font-bold text-white line-clamp-2 leading-snug drop-shadow-sm group-hover:text-pink-200 transition-colors">
                    {reel.title}
                  </h3>

                  {reel.notes && (
                    <p className="text-[11px] font-sans text-white/80 line-clamp-1">
                      {reel.notes}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-white/15 text-[10px] font-sans text-white/70">
                    <span>{reel.addedBy}</span>
                    <span className="flex items-center gap-0.5 text-pink-300 font-semibold group-hover:translate-x-0.5 transition-transform">
                      <span>Watch</span>
                      <ArrowUpRight size={12} />
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* Compact List View */
        <div className="bg-agrasya-card border border-agrasya-border rounded-2xl overflow-hidden divide-y divide-agrasya-border">
          {filteredReels.map((reel) => (
            <div
              key={reel.id}
              onClick={() => {
                triggerHaptic("light");
                setActivePlayingReel(reel);
              }}
              className="p-3 sm:p-4 hover:bg-agrasya-surface/60 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div 
                  className="w-12 h-16 rounded-xl bg-cover bg-center shrink-0 border border-agrasya-border relative flex items-center justify-center overflow-hidden"
                  style={{ backgroundImage: `url(${reel.thumbnailUrl})` }}
                >
                  <div className="absolute inset-0 bg-black/40" />
                  <Play size={16} className="text-white fill-white relative z-10" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={cn(
                      "text-[9px] font-sans font-bold uppercase tracking-wider px-2 py-0.2 rounded-md text-white shrink-0",
                      reel.platform === "youtube" ? "bg-red-600" : "bg-pink-600"
                    )}>
                      {reel.platform === "youtube" ? "Shorts" : "Reel"}
                    </span>
                    <h4 className="text-xs sm:text-sm font-serif font-bold text-agrasya-text group-hover:text-pink-600 transition-colors truncate">
                      {reel.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-sans text-agrasya-muted">
                    <span className="font-semibold text-agrasya-text">{reel.category}</span>
                    <span>•</span>
                    <span className="truncate">{reel.notes || "No notes"}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePlayingReel(reel);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-agrasya-surface hover:bg-agrasya-text hover:text-agrasya-bg text-xs font-sans font-semibold text-agrasya-text transition-colors flex items-center gap-1"
                >
                  <Play size={12} className="fill-current" />
                  <span>Play</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteReel(reel.id, reel.title);
                  }}
                  className="p-1.5 rounded-lg text-agrasya-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Reel Modal with Smart Auto-Arrange Symbol Parser */}
      <AnimatePresence>
        {isAddModalOpen && (
          <AddReelModal
            categories={categories}
            onClose={() => setIsAddModalOpen(false)}
            onAdd={handleAddReel}
          />
        )}
      </AnimatePresence>

      {/* Category Management Modal */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <AddCategoryModal
            onClose={() => setIsCategoryModalOpen(false)}
            onAdd={(cat) => {
              setCategories(prev => [...prev, cat]);
              setIsCategoryModalOpen(false);
              showToast(`Category "${cat.name}" added`);
            }}
          />
        )}
      </AnimatePresence>

      {/* Vertical 9:16 In-App Video Player Modal */}
      <AnimatePresence>
        {activePlayingReel && (
          <VideoPlayerModal
            reel={activePlayingReel}
            onClose={() => setActivePlayingReel(null)}
            onDelete={() => handleDeleteReel(activePlayingReel.id, activePlayingReel.title)}
          />
        )}
      </AnimatePresence>

      {/* Global Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 bg-agrasya-text text-agrasya-bg px-5 py-2.5 rounded-full shadow-2xl z-[300] font-sans font-medium text-xs sm:text-sm flex items-center gap-2 border border-white/20 backdrop-blur-md"
          >
            <CheckCircle2 size={16} className="text-agrasya-green" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// -------------------------------------------------------------
// 1. Add Reel Modal with Auto-Arranging Symbol Parser
// -------------------------------------------------------------
function AddReelModal({
  categories,
  onClose,
  onAdd
}: {
  categories: ReelCategory[];
  onClose: () => void;
  onAdd: (reel: Omit<ReelItem, "id" | "createdAt">) => void;
}) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [notes, setNotes] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  // Live parsed values
  const parsedVideo = useMemo(() => parseVideoUrl(url), [url]);

  // Smart symbol auto-category detector:
  // User enters title or category with any symbol like #farming, @packaging, /logistics, !education
  const detectedCategory = useMemo(() => {
    // 1. Check if user typed a category input
    const inputToCheck = categoryInput.trim() || title;
    
    // Look for symbol followed by word: #category, @category, /category, !category, $category
    const symbolMatch = inputToCheck.match(/([#@/!$])([a-zA-Z0-9_\-\s]+)/);
    if (symbolMatch && symbolMatch[2]) {
      const rawCat = symbolMatch[2].trim();
      // Match against existing categories (case-insensitive)
      const existing = categories.find(c => c.name.toLowerCase().includes(rawCat.toLowerCase()));
      if (existing && existing.name !== "All") {
        return existing.name;
      }
      // Or capitalize first letter of user's custom category
      return rawCat.charAt(0).toUpperCase() + rawCat.slice(1);
    }

    // 2. Direct string match
    if (categoryInput.trim()) {
      const existing = categories.find(c => c.name.toLowerCase() === categoryInput.trim().toLowerCase());
      if (existing) return existing.name;
      return categoryInput.trim();
    }

    // Default if no symbol or category entered:
    return "All";
  }, [categoryInput, title, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !title.trim()) return;

    // Clean title from trailing category symbols if user typed it inside title
    const cleanTitle = title.replace(/[#@/!$][a-zA-Z0-9_\-]+/g, "").trim() || title;

    const tags = tagsInput
      .split(",")
      .map(t => t.trim().replace(/^#/, ""))
      .filter(Boolean);

    onAdd({
      workspaceId: "main-workspace",
      url: url.trim(),
      title: cleanTitle,
      category: detectedCategory,
      platform: parsedVideo.platform,
      thumbnailUrl: parsedVideo.thumbnailUrl,
      embedUrl: parsedVideo.embedUrl,
      notes: notes.trim(),
      tags: tags.length > 0 ? tags : [parsedVideo.platform, detectedCategory.toLowerCase().split(" ")[0]],
      addedBy: "Founder Team"
    });
  };

  return (
    <div className="fixed inset-0 z-[280] flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-lg bg-agrasya-card border border-agrasya-border rounded-3xl shadow-2xl p-5 sm:p-6 z-10 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-agrasya-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-500 flex items-center justify-center">
              <Film size={16} />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-agrasya-text">
                Save Reel or Short
              </h2>
              <p className="text-[11px] font-sans text-agrasya-muted">
                Paste link • Enter title with symbol (e.g. #packaging) to auto-arrange
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-agrasya-muted hover:text-agrasya-text hover:bg-agrasya-surface"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* URL Input with Live Preview Badge */}
          <div>
            <label className="block text-xs font-sans font-semibold text-agrasya-text mb-1">
              Video Link (YouTube Shorts / Instagram Reel / TikTok) *
            </label>
            <input
              type="url"
              required
              autoFocus
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/shorts/... or https://instagram.com/reel/..."
              className="w-full bg-agrasya-surface border border-agrasya-border rounded-xl px-3.5 py-2 text-xs sm:text-sm font-sans text-agrasya-text focus:outline-none focus:ring-2 focus:ring-pink-500/40"
            />
            {url && (
              <div className="mt-1.5 flex items-center gap-2 text-[11px] font-sans text-agrasya-muted">
                <span className="font-bold uppercase text-pink-600 bg-pink-500/10 px-2 py-0.2 rounded">
                  {parsedVideo.platform}
                </span>
                <span>Thumbnail automatically resolved</span>
              </div>
            )}
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-xs font-sans font-semibold text-agrasya-text mb-1">
              Video Title / Summary *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Solar drip irrigation hack #farming"
              className="w-full bg-agrasya-surface border border-agrasya-border rounded-xl px-3.5 py-2 text-xs sm:text-sm font-sans text-agrasya-text focus:outline-none focus:ring-2 focus:ring-pink-500/40"
            />
          </div>

          {/* Category Input & Symbol Smart Trigger */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-sans font-semibold text-agrasya-text">
                Category Name (Type with any symbol e.g. #, @, /, !)
              </label>
              <span className="text-[10px] font-sans text-agrasya-muted">
                If omitted, moves to <span className="font-bold text-agrasya-text">All</span>
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                placeholder="e.g. #farming or @packaging or /logistics"
                className="w-full bg-agrasya-surface border border-agrasya-border rounded-xl pl-3.5 pr-28 py-2 text-xs sm:text-sm font-sans text-agrasya-text focus:outline-none focus:ring-2 focus:ring-pink-500/40"
              />

              {/* Dynamic Auto-Arranging Pill Badge */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <span className={cn(
                  "text-[10px] font-sans font-bold px-2 py-0.5 rounded-full flex items-center gap-1",
                  detectedCategory === "All" 
                    ? "bg-agrasya-card text-agrasya-muted border border-agrasya-border" 
                    : "bg-pink-500/15 text-pink-600 dark:text-pink-400 border border-pink-500/30"
                )}>
                  <span>→ {detectedCategory}</span>
                </span>
              </div>
            </div>

            {/* Quick Pick Existing Categories */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {categories.filter(c => c.name !== "All").map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic("selection");
                    setCategoryInput(`${c.symbol || "#"}${c.name}`);
                  }}
                  className="text-[10px] font-sans px-2 py-0.5 rounded-md bg-agrasya-surface hover:bg-agrasya-surface/80 border border-agrasya-border text-agrasya-muted hover:text-agrasya-text transition-colors"
                >
                  {c.symbol}{c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Notes / Learnings */}
          <div>
            <label className="block text-xs font-sans font-semibold text-agrasya-text mb-1">
              Key Insights / Execution Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What makes this inspiring? Supplier contact, costs, camera angle..."
              className="w-full bg-agrasya-surface border border-agrasya-border rounded-xl px-3 py-2 text-xs font-sans text-agrasya-text focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-agrasya-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-sans font-medium text-agrasya-muted hover:text-agrasya-text"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!url.trim() || !title.trim()}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-sans font-bold text-xs hover:opacity-95 shadow-sm disabled:opacity-50"
            >
              Auto-Arrange & Save
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// -------------------------------------------------------------
// 2. In-App Vertical Video Player Modal (9:16 Theater)
// -------------------------------------------------------------
function VideoPlayerModal({
  reel,
  onClose,
  onDelete
}: {
  reel: ReelItem;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(reel.url);
    setCopied(true);
    triggerHaptic("selection");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[290] flex items-center justify-center p-2 sm:p-4">
      {/* Darkened Theater Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-4xl max-h-[92vh] bg-agrasya-card border border-agrasya-border rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden z-10"
      >
        {/* Left Side: 9:16 Vertical Player Frame */}
        <div className="w-full md:w-[420px] bg-black aspect-[9/16] max-h-[65vh] md:max-h-[92vh] flex items-center justify-center relative overflow-hidden shrink-0">
          {reel.embedUrl ? (
            <iframe
              src={reel.embedUrl}
              title={reel.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-none"
            />
          ) : (
            <div className="p-6 text-center text-white">
              <p className="text-sm mb-4">Click below to open on {reel.platform}</p>
              <a
                href={reel.url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-pink-500 rounded-full text-xs font-bold inline-flex items-center gap-1.5"
              >
                <span>Open in App</span>
                <ExternalLink size={14} />
              </a>
            </div>
          )}
        </div>

        {/* Right Side: Details & Action Sidebar */}
        <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between overflow-y-auto bg-agrasya-card">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-agrasya-border mb-4">
              <span className={cn(
                "text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full text-white",
                reel.platform === "youtube" ? "bg-red-600" : "bg-pink-600"
              )}>
                {reel.platform === "youtube" ? "YouTube Shorts" : "Instagram Reel"}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg text-agrasya-muted hover:text-agrasya-text hover:bg-agrasya-surface"
                  title="Copy Video URL"
                >
                  {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                </button>
                <a
                  href={reel.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg text-agrasya-muted hover:text-agrasya-text hover:bg-agrasya-surface"
                  title="Open in New Tab"
                >
                  <ExternalLink size={16} />
                </a>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-agrasya-muted hover:text-agrasya-text hover:bg-agrasya-surface"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <span className="text-[11px] font-sans font-bold text-pink-600 dark:text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-md mb-2 inline-block">
              {reel.category}
            </span>

            <h2 className="text-lg sm:text-xl font-serif font-bold text-agrasya-text mb-3 leading-snug">
              {reel.title}
            </h2>

            {reel.notes && (
              <div className="bg-agrasya-surface p-3.5 rounded-2xl border border-agrasya-border mb-4">
                <span className="text-[10px] font-sans font-bold uppercase text-agrasya-muted block mb-1">
                  Founder Execution Note:
                </span>
                <p className="text-xs font-sans text-agrasya-text leading-relaxed">
                  {reel.notes}
                </p>
              </div>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mb-4">
              {reel.tags.map(t => (
                <span key={t} className="text-[10px] font-sans px-2 py-0.5 rounded-md bg-agrasya-surface text-agrasya-muted border border-agrasya-border">
                  #{t}
                </span>
              ))}
            </div>
          </div>

          {/* Footer & Delete */}
          <div className="pt-4 border-t border-agrasya-border flex items-center justify-between text-xs font-sans text-agrasya-muted">
            <span>Added {new Date(reel.createdAt).toLocaleDateString()}</span>
            <button
              onClick={onDelete}
              className="text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 text-xs"
            >
              <Trash2 size={13} />
              <span>Delete from Hub</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// -------------------------------------------------------------
// 3. Add Category Modal
// -------------------------------------------------------------
function AddCategoryModal({
  onClose,
  onAdd
}: {
  onClose: () => void;
  onAdd: (cat: ReelCategory) => void;
}) {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("#");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAdd({
      id: `cat-${Date.now()}`,
      name: name.trim(),
      color: "pink",
      symbol: symbol.trim() || "#"
    });
  };

  return (
    <div className="fixed inset-0 z-[280] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-sm bg-agrasya-card border border-agrasya-border rounded-3xl p-5 shadow-2xl z-10 flex flex-col gap-3"
      >
        <h3 className="text-base font-serif font-bold text-agrasya-text">
          New Reels Category
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-sans font-semibold text-agrasya-text block mb-1">
              Category Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Storage Hacks"
              className="w-full bg-agrasya-surface border border-agrasya-border rounded-xl px-3 py-2 text-xs font-sans text-agrasya-text focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-sans font-semibold text-agrasya-text block mb-1">
              Symbol Prefix
            </label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full bg-agrasya-surface border border-agrasya-border rounded-xl px-3 py-2 text-xs font-sans text-agrasya-text focus:outline-none"
            >
              <option value="#"># (Hashtag)</option>
              <option value="@">@ (At sign)</option>
              <option value="/">/ (Slash)</option>
              <option value="!">! (Exclamation)</option>
              <option value="$">$ (Dollar)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-sans text-agrasya-muted hover:text-agrasya-text"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-1.5 rounded-xl bg-pink-500 text-white text-xs font-sans font-bold hover:bg-pink-600 shadow-sm disabled:opacity-50"
            >
              Create Category
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
