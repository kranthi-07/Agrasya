"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Upload, 
  Search, 
  Plus, 
  Trash2, 
  Download, 
  Printer, 
  ExternalLink, 
  Filter, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Tag, 
  FolderPlus, 
  X, 
  ChevronRight, 
  Eye, 
  FileCheck, 
  FilePlus2, 
  Layers, 
  Calendar,
  User,
  HardDrive,
  Copy,
  Check,
  Wheat,
  FlaskConical,
  Briefcase,
  SlidersHorizontal,
  LayoutGrid,
  List
} from "lucide-react";
import { cn } from "../lib/utils";
import { triggerHaptic } from "../lib/haptics";
import { useMockData } from "../store/MockDataContext";
import { db } from "../lib/firebase";
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs } from "firebase/firestore";

export type PdfCategory = {
  id: string;
  name: string;
  color: string;
  description?: string;
};

export type PdfDocument = {
  id: string;
  workspaceId: string;
  title: string;
  category: string;
  description?: string;
  fileUrl?: string; // Data URL or external link or generated HTML/PDF
  fileName: string;
  fileSize: string;
  pageCount?: number;
  tags: string[];
  createdAt: number;
  uploadedBy: string;
  isGenerated?: boolean;
  templateType?: "farmer_receipt" | "soil_report" | "executive_memo" | "custom_memo";
  templateData?: any;
};

const DEFAULT_CATEGORIES: PdfCategory[] = [
  { id: "all", name: "All Documents", color: "amber" },
  { id: "farming", name: "Farming & Agronomy", color: "emerald", description: "Soil tests, farm yield records & harvest logs" },
  { id: "legal", name: "Legal & Compliance", color: "sky", description: "FSSAI, NPOP Organic certificates & agreements" },
  { id: "pitch", name: "Pitch & Finance", color: "purple", description: "Investor decks, unit economics & financial models" },
  { id: "supply", name: "Supply & Logistics", color: "orange", description: "Cold-chain logs, transit records & packing slips" },
  { id: "vouchers", name: "Procurement & Bills", color: "teal", description: "Farmer purchase vouchers & mandi receipts" },
];

const INITIAL_DOCUMENTS: PdfDocument[] = [
  {
    id: "doc-1",
    workspaceId: "main-workspace",
    title: "Mandya Sector 4 Soil Nutrient & pH Analysis",
    category: "Farming & Agronomy",
    description: "Official chemical and microbial laboratory report for 12 partner ragi farm plots in Mandya district.",
    fileName: "Mandya_Sector4_Soil_Analysis_2026.pdf",
    fileSize: "1.8 MB",
    pageCount: 6,
    tags: ["soil", "mandya", "nutrients", "ph", "ragi"],
    createdAt: Date.now() - 86400000 * 3,
    uploadedBy: "Agrasya Field Team",
    isGenerated: true,
    templateType: "soil_report",
    templateData: {
      plotId: "PL-MND-04",
      farmerName: "Chennappa Gowda",
      phLevel: "6.8 (Optimal)",
      organicCarbon: "0.88% (High)",
      nitrogen: "280 kg/ha",
      phosphorus: "24 kg/ha",
      potassium: "310 kg/ha",
      recommendation: "Excellent organic microbial density. Approved for seed germination without synthetic inputs.",
      inspector: "Dr. K. Swaminathan (Senior Agronomist)",
      date: "October 28, 2026"
    }
  },
  {
    id: "doc-2",
    workspaceId: "main-workspace",
    title: "FSSAI & NPOP Organic Certification Dossier",
    category: "Legal & Compliance",
    description: "Scope certificate and inspection compliance dossier for certified organic millets and whole ragi flour.",
    fileName: "Agrasya_FSSAI_NPOP_Certification.pdf",
    fileSize: "2.4 MB",
    pageCount: 14,
    tags: ["fssai", "npop", "compliance", "organic", "license"],
    createdAt: Date.now() - 86400000 * 7,
    uploadedBy: "Legal & Regulatory",
    isGenerated: false,
    fileUrl: ""
  },
  {
    id: "doc-3",
    workspaceId: "main-workspace",
    title: "Agrasya Seed Round Investor Pitch Deck",
    category: "Pitch & Finance",
    description: "14-slide executive presentation covering our direct-from-farm cold-chain distribution and unit margin economics.",
    fileName: "Agrasya_Seed_Round_PitchDeck_Q3.pdf",
    fileSize: "4.9 MB",
    pageCount: 14,
    tags: ["pitch", "seed-round", "investor", "valuation", "margins"],
    createdAt: Date.now() - 86400000 * 12,
    uploadedBy: "Founders",
    isGenerated: true,
    templateType: "executive_memo",
    templateData: {
      title: "Agrasya Seed Round Executive Pitch Brief",
      period: "Q3 - Q4 2026",
      summary: "Direct-from-farm organic supply infrastructure connecting certified smallholder farmers with Tier-1 city households within 18 hours of harvest.",
      milestones: [
        "Onboarded 38 certified organic farmers in Karnataka",
        "Achieved 68% gross margin on cold-pressed oils and stone-ground ragi",
        "PWA Founder OS live with zero sync latency for field teams"
      ],
      bottlenecks: "Sub-zero cold chain storage transit capacity at Mysore central hub.",
      priorities: "Deploy 2 temperature-monitored refrigerated transit vans and expand Bangalore retail outlets.",
      author: "Founder & CEO"
    }
  },
  {
    id: "doc-4",
    workspaceId: "main-workspace",
    title: "Farmer Procurement Purchase Voucher - Mandya Lot #108",
    category: "Procurement & Bills",
    description: "Instant purchase order bill generated at farm gate for 450 kg of organic finger millet (ragi).",
    fileName: "Voucher_Chennappa_Gowda_Lot108.pdf",
    fileSize: "620 KB",
    pageCount: 1,
    tags: ["farmer", "receipt", "purchase", "ragi", "millet"],
    createdAt: Date.now() - 86400000 * 1,
    uploadedBy: "Field Procurement",
    isGenerated: true,
    templateType: "farmer_receipt",
    templateData: {
      voucherNo: "AGR-POV-2026-108",
      farmerName: "Chennappa Gowda",
      village: "Shivalli, Mandya",
      phone: "+91 98452 11092",
      crop: "Finger Millet (Organic Ragi Grade A)",
      quantity: 450,
      unit: "kg",
      ratePerUnit: 52,
      paymentMode: "Instant UPI / Bank Transfer",
      referenceNo: "UPI/3890124901",
      date: "October 31, 2026",
      officer: "Ramesh M. (Field Lead)"
    }
  },
  {
    id: "doc-5",
    workspaceId: "main-workspace",
    title: "Cold-Chain IoT Sensor & Temperature Transit Log",
    category: "Supply & Logistics",
    description: "48-hour continuous temperature probe telemetry during refrigerated van transit from Mandya to Bangalore hub.",
    fileName: "Transit_Log_Batch_42_ColdChain.pdf",
    fileSize: "1.2 MB",
    pageCount: 4,
    tags: ["coldchain", "iot", "temperature", "logistics", "transit"],
    createdAt: Date.now() - 86400000 * 5,
    uploadedBy: "Logistics Automation",
    isGenerated: false,
    fileUrl: ""
  }
];

export function PdfVaultCanvas() {
  const { activeWorkspaceId, workspaces } = useMockData();
  const [documents, setDocuments] = useState<PdfDocument[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`agrasya_pdf_vault_${activeWorkspaceId}`);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return INITIAL_DOCUMENTS;
  });

  const [categories, setCategories] = useState<PdfCategory[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`agrasya_pdf_categories_${activeWorkspaceId}`);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return DEFAULT_CATEGORIES;
  });

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title" | "size">("newest");
  const [viewLayout, setViewLayout] = useState<"grid" | "list">("grid");

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isMakerModalOpen, setIsMakerModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<PdfDocument | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync with Firestore & localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`agrasya_pdf_vault_${activeWorkspaceId}`, JSON.stringify(documents));
    }
  }, [documents, activeWorkspaceId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`agrasya_pdf_categories_${activeWorkspaceId}`, JSON.stringify(categories));
    }
  }, [categories, activeWorkspaceId]);

  // Firestore optional live backup
  useEffect(() => {
    if (!activeWorkspaceId) return;
    const docsCol = collection(db, "pdf_vault");
    getDocs(docsCol).then(snapshot => {
      if (snapshot.empty) {
        // Seed Firestore
        INITIAL_DOCUMENTS.forEach(d => {
          setDoc(doc(db, "pdf_vault", d.id), d).catch(() => {});
        });
      }
    }).catch(() => {});

    const unsubscribe = onSnapshot(docsCol, (snapshot) => {
      if (!snapshot.empty) {
        const fetched = snapshot.docs.map(d => d.data() as PdfDocument);
        if (fetched.length > 0) {
          setDocuments(fetched);
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
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesCategory = selectedCategory === "all" || doc.category.toLowerCase() === selectedCategory.toLowerCase();
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesCategory;

      const matchesSearch = 
        doc.title.toLowerCase().includes(query) ||
        doc.category.toLowerCase().includes(query) ||
        (doc.description && doc.description.toLowerCase().includes(query)) ||
        doc.tags.some(t => t.toLowerCase().includes(query)) ||
        doc.fileName.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    }).sort((a, b) => {
      if (sortBy === "newest") return b.createdAt - a.createdAt;
      if (sortBy === "oldest") return a.createdAt - b.createdAt;
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "size") {
        const sizeA = parseFloat(a.fileSize) * (a.fileSize.includes("MB") ? 1024 : 1);
        const sizeB = parseFloat(b.fileSize) * (b.fileSize.includes("MB") ? 1024 : 1);
        return sizeB - sizeA;
      }
      return 0;
    });
  }, [documents, selectedCategory, searchQuery, sortBy]);

  // Handlers
  const handleDeleteDocument = (docId: string, title: string) => {
    triggerHaptic("heavy");
    if (confirm(`Remove "${title}" from the Document Vault?`)) {
      setDocuments(prev => prev.filter(d => d.id !== docId));
      deleteDoc(doc(db, "pdf_vault", docId)).catch(() => {});
      showToast(`Removed "${title}" from Vault`);
      if (viewingDocument?.id === docId) {
        setViewingDocument(null);
      }
    }
  };

  const handleAddDocument = (newDoc: Omit<PdfDocument, "id" | "createdAt">) => {
    const docItem: PdfDocument = {
      ...newDoc,
      id: `doc-${Date.now()}`,
      createdAt: Date.now(),
    };

    setDocuments(prev => [docItem, ...prev]);
    setDoc(doc(db, "pdf_vault", docItem.id), docItem).catch(() => {});
    showToast(`"${docItem.title}" saved to Vault`);
    triggerHaptic("success");
    setIsUploadModalOpen(false);
  };

  const currentWorkspaceName = workspaces.find(w => w.id === activeWorkspaceId)?.name || "Main Workspace";

  return (
    <div className="flex-1 flex flex-col w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-28 md:pb-12">
      {/* Vault Top Hero & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-agrasya-green px-2.5 py-0.5 bg-agrasya-green/10 border border-agrasya-green/30 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-agrasya-green animate-pulse" />
              {currentWorkspaceName}
            </span>
            <span className="text-xs text-agrasya-muted font-sans font-medium">
              {documents.length} {documents.length === 1 ? "Document" : "Documents"} in Vault
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-agrasya-text tracking-tight flex items-center gap-2">
            <FileText className="text-rose-500" size={26} />
            PDF Document Vault & Studio
          </h1>
          <p className="text-xs sm:text-sm font-sans text-agrasya-muted max-w-2xl mt-1">
            Search, categorize, and preview verified field documents, lab tests, and contracts—or forge new official Agrasya PDFs instantly.
          </p>
        </div>

        {/* Action Buttons: Upload & PDF Maker */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              triggerHaptic("medium");
              setIsUploadModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-agrasya-card border border-agrasya-border hover:bg-agrasya-surface text-agrasya-text font-sans font-semibold text-xs sm:text-sm shadow-sm transition-all"
          >
            <Upload size={16} className="text-agrasya-muted" />
            <span>Upload PDF</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              triggerHaptic("medium");
              setIsMakerModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-agrasya-green text-white hover:bg-agrasya-green/90 font-sans font-bold text-xs sm:text-sm shadow-md transition-all"
          >
            <Sparkles size={16} className="text-amber-200" />
            <span>New PDF Maker</span>
          </motion.button>
        </div>
      </div>

      {/* Category Pills Bar (Horizontal Scrollable) */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2 mb-4 scroll-smooth">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.name || (cat.id === "all" && selectedCategory === "all");
          const count = cat.id === "all" 
            ? documents.length 
            : documents.filter(d => d.category.toLowerCase() === cat.name.toLowerCase()).length;

          return (
            <button
              key={cat.id}
              onClick={() => {
                triggerHaptic("selection");
                setSelectedCategory(cat.id === "all" ? "all" : cat.name);
              }}
              className={cn(
                "whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-sans font-semibold transition-all shrink-0 flex items-center gap-1.5 border active:scale-95",
                isActive
                  ? "bg-agrasya-text text-agrasya-bg border-agrasya-text shadow-sm"
                  : "bg-agrasya-card/80 text-agrasya-muted hover:text-agrasya-text border-agrasya-border hover:bg-agrasya-surface"
              )}
            >
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

      {/* Search, Sort & View Controls */}
      <div className="bg-agrasya-card/70 backdrop-blur-md border border-agrasya-border rounded-2xl p-2.5 sm:p-3 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        {/* Search Bar */}
        <div className="relative w-full sm:max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-agrasya-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by title, tags, or category..."
            className="w-full bg-agrasya-surface/80 border border-agrasya-border rounded-xl pl-9 pr-9 py-2 text-xs sm:text-sm font-sans text-agrasya-text placeholder:text-agrasya-muted focus:outline-none focus:ring-2 focus:ring-agrasya-green/40 transition-all"
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

        {/* Sort & Layout Toggles */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1.5 text-xs text-agrasya-muted font-sans font-medium">
            <SlidersHorizontal size={14} />
            <select
              value={sortBy}
              onChange={(e) => {
                triggerHaptic("selection");
                setSortBy(e.target.value as any);
              }}
              className="bg-agrasya-surface border border-agrasya-border rounded-lg px-2.5 py-1.5 text-xs font-sans text-agrasya-text focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Title (A-Z)</option>
              <option value="size">Largest Size</option>
            </select>
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

      {/* Documents Grid / List */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-agrasya-card/50 border border-dashed border-agrasya-border rounded-3xl p-10 sm:p-16 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-3">
            <FileText size={28} />
          </div>
          <h3 className="text-base sm:text-lg font-serif font-bold text-agrasya-text mb-1">
            No documents found
          </h3>
          <p className="text-xs sm:text-sm font-sans text-agrasya-muted max-w-md mb-5">
            {searchQuery 
              ? `No documents matching "${searchQuery}" in this category.` 
              : "This category does not have any PDF documents yet. Upload a file or generate an official document with the PDF Maker."}
          </p>
          <div className="flex items-center gap-2.5">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="px-4 py-2 rounded-full border border-agrasya-border text-xs font-sans font-semibold text-agrasya-text hover:bg-agrasya-surface"
              >
                Clear Search
              </button>
            )}
            <button
              onClick={() => setIsMakerModalOpen(true)}
              className="px-4 py-2 rounded-full bg-agrasya-green text-white text-xs font-sans font-bold hover:bg-agrasya-green/90 shadow-sm flex items-center gap-1.5"
            >
              <Sparkles size={14} />
              <span>Forge Document</span>
            </button>
          </div>
        </div>
      ) : viewLayout === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredDocuments.map((docItem) => (
              <motion.div
                key={docItem.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onClick={() => {
                  triggerHaptic("light");
                  setViewingDocument(docItem);
                }}
                className="group bg-agrasya-card hover:bg-agrasya-card/90 border border-agrasya-border hover:border-rose-500/40 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden"
              >
                {/* PDF Top Badge */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md">
                          {docItem.category}
                        </span>
                        <div className="text-[11px] font-sans text-agrasya-muted flex items-center gap-1 mt-0.5">
                          <HardDrive size={10} />
                          <span>{docItem.fileSize}</span>
                          {docItem.isGenerated && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-500 font-medium flex items-center gap-0.5">
                                <Sparkles size={10} /> Studio
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDocument(docItem.id, docItem.title);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-agrasya-muted hover:text-red-500 hover:bg-red-500/10 transition-all"
                      title="Delete Document"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <h3 className="text-sm font-serif font-bold text-agrasya-text group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-2 mb-1.5">
                    {docItem.title}
                  </h3>

                  {docItem.description && (
                    <p className="text-xs font-sans text-agrasya-muted line-clamp-2 mb-3 leading-relaxed">
                      {docItem.description}
                    </p>
                  )}
                </div>

                {/* Tags and Footer */}
                <div className="pt-3 border-t border-agrasya-border/60">
                  <div className="flex flex-wrap gap-1 mb-2.5">
                    {docItem.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[10px] font-sans px-2 py-0.5 rounded-md bg-agrasya-surface text-agrasya-muted border border-agrasya-border">
                        #{tag}
                      </span>
                    ))}
                    {docItem.tags.length > 3 && (
                      <span className="text-[10px] font-sans px-1.5 py-0.5 text-agrasya-muted">
                        +{docItem.tags.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-sans text-agrasya-muted">
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {new Date(docItem.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    <span className="text-rose-500 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      <span>View</span>
                      <ChevronRight size={13} />
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* List View */
        <div className="bg-agrasya-card border border-agrasya-border rounded-2xl overflow-hidden divide-y divide-agrasya-border">
          {filteredDocuments.map((docItem) => (
            <div
              key={docItem.id}
              onClick={() => {
                triggerHaptic("light");
                setViewingDocument(docItem);
              }}
              className="p-3 sm:p-4 hover:bg-agrasya-surface/60 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
                  <FileText size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="text-sm font-serif font-bold text-agrasya-text group-hover:text-rose-600 transition-colors truncate">
                      {docItem.title}
                    </h4>
                    <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-rose-600 bg-rose-500/10 px-2 py-0.2 rounded-md shrink-0">
                      {docItem.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-sans text-agrasya-muted">
                    <span>{docItem.fileSize}</span>
                    <span>•</span>
                    <span>{new Date(docItem.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    <span>•</span>
                    <span className="truncate">{docItem.fileName}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewingDocument(docItem);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-agrasya-surface hover:bg-agrasya-text hover:text-agrasya-bg text-xs font-sans font-semibold text-agrasya-text transition-colors flex items-center gap-1"
                >
                  <Eye size={13} />
                  <span className="hidden sm:inline">Open</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteDocument(docItem.id, docItem.title);
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

      {/* Upload PDF Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <UploadPdfModal
            categories={categories}
            onClose={() => setIsUploadModalOpen(false)}
            onAdd={handleAddDocument}
          />
        )}
      </AnimatePresence>

      {/* Built-in PDF Maker Studio Modal */}
      <AnimatePresence>
        {isMakerModalOpen && (
          <PdfMakerStudioModal
            categories={categories}
            workspaceName={currentWorkspaceName}
            onClose={() => setIsMakerModalOpen(false)}
            onSaveToVault={(newDoc) => {
              handleAddDocument(newDoc);
              setIsMakerModalOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Add Category Modal */}
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

      {/* PDF Viewer Slide-over / Modal */}
      <AnimatePresence>
        {viewingDocument && (
          <PdfViewerModal
            document={viewingDocument}
            onClose={() => setViewingDocument(null)}
            onDelete={() => handleDeleteDocument(viewingDocument.id, viewingDocument.title)}
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
// 1. Upload PDF Modal
// -------------------------------------------------------------
function UploadPdfModal({
  categories,
  onClose,
  onAdd
}: {
  categories: PdfCategory[];
  onClose: () => void;
  onAdd: (doc: Omit<PdfDocument, "id" | "createdAt">) => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[1]?.name || "Farming & Agronomy");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string>("");
  const [fileSize, setFileSize] = useState("1.0 MB");
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setFileName(f.name);
      const sizeMb = (f.size / (1024 * 1024)).toFixed(1);
      setFileSize(f.size > 1024 * 1024 ? `${sizeMb} MB` : `${Math.round(f.size / 1024)} KB`);
      if (!title) {
        setTitle(f.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
      }

      // Convert to Base64 Data URL for persistent offline viewing
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setFileUrl(uploadEvent.target?.result as string);
      };
      reader.readAsDataURL(f);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(",")
      .map(t => t.trim().replace(/^#/, ""))
      .filter(Boolean);

    onAdd({
      workspaceId: "main-workspace",
      title: title.trim(),
      category,
      description: description.trim(),
      fileName: fileName || `${title.replace(/\s+/g, "_")}.pdf`,
      fileSize,
      fileUrl,
      tags: tags.length > 0 ? tags : ["document", category.toLowerCase().split(" ")[0]],
      uploadedBy: "Founder Team",
      isGenerated: false
    });
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-4">
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
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
              <Upload size={16} />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-agrasya-text">
                Upload PDF to Vault
              </h2>
              <p className="text-[11px] font-sans text-agrasya-muted">
                Add compliance certificates, soil tests, or field reports
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* File Upload Drop Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-agrasya-border hover:border-rose-500/50 rounded-2xl p-5 text-center cursor-pointer transition-colors bg-agrasya-surface/40 hover:bg-agrasya-surface/70"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center mb-2">
              <FilePlus2 size={20} />
            </div>
            {fileName ? (
              <div>
                <p className="text-xs font-sans font-bold text-agrasya-text truncate max-w-xs mx-auto">
                  {fileName}
                </p>
                <p className="text-[11px] font-sans text-agrasya-muted mt-0.5">
                  {fileSize} • Click to change file
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-sans font-bold text-agrasya-text">
                  Tap or click to browse PDF
                </p>
                <p className="text-[11px] font-sans text-agrasya-muted mt-0.5">
                  Supports .pdf documents up to 25 MB
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-sans font-semibold text-agrasya-text mb-1">
              Document Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Mandya Farm Water Purity Lab Test"
              className="w-full bg-agrasya-surface border border-agrasya-border rounded-xl px-3.5 py-2 text-xs sm:text-sm font-sans text-agrasya-text focus:outline-none focus:ring-2 focus:ring-agrasya-green/40"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-sans font-semibold text-agrasya-text mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-agrasya-surface border border-agrasya-border rounded-xl px-3 py-2 text-xs font-sans text-agrasya-text focus:outline-none"
              >
                {categories.filter(c => c.id !== "all").map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-sans font-semibold text-agrasya-text mb-1">
                Tags (Comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="organic, lab, mandya"
                className="w-full bg-agrasya-surface border border-agrasya-border rounded-xl px-3 py-2 text-xs font-sans text-agrasya-text focus:outline-none"
              >
              </input>
            </div>
          </div>

          <div>
            <label className="block text-xs font-sans font-semibold text-agrasya-text mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key highlights, batch numbers, or testing conclusions..."
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
              disabled={!title.trim()}
              className="px-5 py-2 rounded-xl bg-agrasya-green text-white font-sans font-bold text-xs hover:bg-agrasya-green/90 shadow-sm disabled:opacity-50"
            >
              Save to Vault
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// -------------------------------------------------------------
// 2. Built-in PDF Maker Studio Modal
// -------------------------------------------------------------
function PdfMakerStudioModal({
  categories,
  workspaceName,
  onClose,
  onSaveToVault
}: {
  categories: PdfCategory[];
  workspaceName: string;
  onClose: () => void;
  onSaveToVault: (doc: Omit<PdfDocument, "id" | "createdAt">) => void;
}) {
  const [templateType, setTemplateType] = useState<"farmer_receipt" | "soil_report" | "executive_memo" | "custom_memo">("farmer_receipt");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  // Template 1: Farmer Procurement Receipt
  const [receiptData, setReceiptData] = useState({
    voucherNo: `AGR-POV-${Date.now().toString().slice(-4)}`,
    farmerName: "Chennappa Gowda",
    village: "Shivalli Village, Mandya",
    phone: "+91 98452 11092",
    crop: "Certified Organic Finger Millet (Ragi)",
    quantity: 500,
    unit: "kg",
    ratePerUnit: 54,
    paymentMode: "Instant UPI / Direct Bank Transfer",
    referenceNo: `UPI/${Date.now().toString().slice(-8)}`,
    date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    officer: "Agrasya Field Procurement Lead",
    notes: "Batch sampled for moisture < 11%. Cleared for cold milling."
  });

  // Template 2: Soil Analysis
  const [soilData, setSoilData] = useState({
    plotId: "PL-MND-09",
    farmerName: "Basavaraju K.",
    village: "Maddur, Mandya District",
    date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    phLevel: "6.9 (Neutral / Ideal)",
    organicCarbon: "0.92% (High Organic Content)",
    nitrogen: "295 kg/ha (Optimal)",
    phosphorus: "28 kg/ha (Medium)",
    potassium: "330 kg/ha (High)",
    recommendation: "Rich humus layer observed. Recommended for direct ragi & pulse intercropping without chemical amendments.",
    inspector: "Dr. K. Swaminathan (Lead Agronomist)"
  });

  // Template 3: Executive Memo
  const [memoData, setMemoData] = useState({
    title: "Agrasya Founder Weekly Execution Digest",
    period: `Week ${Math.ceil(new Date().getDate() / 7)} • ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
    summary: "Milestone report tracking cold-chain logistics, partner farm procurement, and unit economics across Bangalore distribution routes.",
    milestone1: "Direct farmer procurement volume exceeded 4,200 kg organic finger millet.",
    milestone2: "Average farm-to-shelf transit time reduced to 16.5 hours with zero cold-chain spoilage.",
    milestone3: "Gross product margin expanded by 4.2% via direct-to-consumer eco-packaging.",
    bottlenecks: "Expansion of refrigerated transit van fleet required to serve Mysore sector.",
    priorities: "Deploy automated moisture sensors across 20 partner silos; launch subscription delivery.",
    author: "Founder & Operations Lead"
  });

  // Calculate totals for Receipt
  const totalPayout = receiptData.quantity * receiptData.ratePerUnit;

  const handlePrint = () => {
    triggerHaptic("medium");
    window.print();
  };

  const handleSaveToVault = () => {
    triggerHaptic("success");
    if (templateType === "farmer_receipt") {
      onSaveToVault({
        workspaceId: "main-workspace",
        title: `Procurement Voucher #${receiptData.voucherNo} - ${receiptData.farmerName}`,
        category: "Procurement & Bills",
        description: `Farm gate purchase order for ${receiptData.quantity} ${receiptData.unit} of ${receiptData.crop}. Total payout: ₹${totalPayout.toLocaleString()}.`,
        fileName: `Voucher_${receiptData.voucherNo}.pdf`,
        fileSize: "480 KB",
        pageCount: 1,
        tags: ["voucher", "procurement", "farmer", "bill", receiptData.crop.toLowerCase().split(" ")[0]],
        uploadedBy: "PDF Studio",
        isGenerated: true,
        templateType: "farmer_receipt",
        templateData: receiptData
      });
    } else if (templateType === "soil_report") {
      onSaveToVault({
        workspaceId: "main-workspace",
        title: `Soil & Quality Test - ${soilData.plotId} (${soilData.farmerName})`,
        category: "Farming & Agronomy",
        description: `Lab analysis verifying ${soilData.phLevel} and ${soilData.organicCarbon} for ${soilData.village}.`,
        fileName: `Soil_Report_${soilData.plotId}.pdf`,
        fileSize: "640 KB",
        pageCount: 1,
        tags: ["soil", "lab", "agronomy", "mandya", "ph"],
        uploadedBy: "PDF Studio",
        isGenerated: true,
        templateType: "soil_report",
        templateData: soilData
      });
    } else {
      onSaveToVault({
        workspaceId: "main-workspace",
        title: memoData.title,
        category: "Pitch & Finance",
        description: memoData.summary,
        fileName: `Executive_Memo_${Date.now().toString().slice(-4)}.pdf`,
        fileSize: "520 KB",
        pageCount: 1,
        tags: ["executive", "digest", "founder", "progress"],
        uploadedBy: "PDF Studio",
        isGenerated: true,
        templateType: "executive_memo",
        templateData: memoData
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[280] flex items-center justify-center p-2 sm:p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-md print:hidden"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        className="relative w-full max-w-6xl h-[92vh] bg-agrasya-card border border-agrasya-border rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10 print:h-auto print:max-h-none print:shadow-none print:border-none print:rounded-none print:bg-white print:fixed print:inset-0"
      >
        {/* Studio Topbar (Hidden in Print) */}
        <div className="px-5 py-3.5 border-b border-agrasya-border flex items-center justify-between bg-agrasya-bg print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-agrasya-green/10 border border-agrasya-green/30 text-agrasya-green flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-serif font-bold text-agrasya-text leading-tight">
                  Agrasya PDF Studio & Maker
                </h2>
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-agrasya-green bg-agrasya-green/10 px-2 py-0.5 rounded-full">
                  In-Build Engine
                </span>
              </div>
              <p className="text-[11px] font-sans text-agrasya-muted">
                Create official Agrasya-branded documents ready for print, download, or instant vault archiving
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile View Toggle [Edit | Preview] */}
            <div className="flex md:hidden bg-agrasya-surface rounded-xl p-0.5 border border-agrasya-border">
              <button
                onClick={() => setActiveTab("edit")}
                className={cn("px-2.5 py-1 text-xs font-sans font-semibold rounded-lg", activeTab === "edit" ? "bg-agrasya-card text-agrasya-text shadow-xs" : "text-agrasya-muted")}
              >
                Edit
              </button>
              <button
                onClick={() => setActiveTab("preview")}
                className={cn("px-2.5 py-1 text-xs font-sans font-semibold rounded-lg", activeTab === "preview" ? "bg-agrasya-card text-agrasya-text shadow-xs" : "text-agrasya-muted")}
              >
                Preview
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-agrasya-surface hover:bg-agrasya-surface/80 border border-agrasya-border text-agrasya-text text-xs font-sans font-semibold transition-colors"
              title="Print Document"
            >
              <Printer size={15} />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>

            <button
              onClick={handleSaveToVault}
              className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-agrasya-green text-white text-xs font-sans font-bold hover:bg-agrasya-green/90 shadow-sm transition-all"
            >
              <CheckCircle2 size={15} />
              <span>Save to Vault</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-agrasya-muted hover:text-agrasya-text hover:bg-agrasya-surface rounded-full transition-colors ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Studio Body: Split View (Editor on Left, Live Rendered Document on Right) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Form & Template Controls (Hidden on mobile if tab is 'preview') */}
          <div className={cn(
            "w-full md:w-5/12 border-r border-agrasya-border overflow-y-auto p-4 sm:p-5 flex flex-col gap-4 bg-agrasya-card/50 print:hidden",
            activeTab === "preview" ? "hidden md:flex" : "flex"
          )}>
            {/* Template Selector */}
            <div>
              <label className="block text-xs font-sans font-bold uppercase tracking-wider text-agrasya-muted mb-2">
                Choose Document Template
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "farmer_receipt", label: "Farmer Bill", icon: Wheat },
                  { id: "soil_report", label: "Soil Analysis", icon: FlaskConical },
                  { id: "executive_memo", label: "Exec Digest", icon: Briefcase },
                ].map((tmpl) => {
                  const Icon = tmpl.icon;
                  const isSelected = templateType === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic("selection");
                        setTemplateType(tmpl.id as any);
                      }}
                      className={cn(
                        "p-2.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-sans font-semibold",
                        isSelected
                          ? "bg-agrasya-text text-agrasya-bg border-agrasya-text shadow-xs"
                          : "bg-agrasya-surface hover:bg-agrasya-surface/80 border-agrasya-border text-agrasya-muted hover:text-agrasya-text"
                      )}
                    >
                      <Icon size={16} />
                      <span className="leading-tight">{tmpl.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <hr className="border-agrasya-border" />

            {/* Template-Specific Form Inputs */}
            {templateType === "farmer_receipt" ? (
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-serif font-bold text-agrasya-text">
                  Procurement Voucher Details
                </h4>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-sans text-agrasya-muted block mb-1">Voucher #</label>
                    <input
                      type="text"
                      value={receiptData.voucherNo}
                      onChange={(e) => setReceiptData({ ...receiptData, voucherNo: e.target.value })}
                      className="w-full bg-agrasya-surface border border-agrasya-border rounded-xl px-2.5 py-1.5 text-xs font-sans text-agrasya-text"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-sans text-agrasya-muted block mb-1">Date</label>
                    <input
                      type="text"
                      value={receiptData.date}
                      onChange={(e) => setReceiptData({ ...receiptData, date: e.target.value })}
                      className="w-full bg-agrasya-surface border border-agrasya-border rounded-xl px-2.5 py-1.5 text-xs font-sans text-agrasya-text"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-sans text-agrasya-muted block mb-1">Farmer Name</label>
                    <input
                      type="text"
                      value={receiptData.farmerName}
                      onChange={(e) => setReceiptData({ ...receiptData, farmerName: e.target.value })}
                      className="w-full bg-agrasya-surface border border-agrasya-border rounded-xl px-2.5 py-1.5 text-xs font-sans text-agrasya-text font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-sans text-agrasya-muted block mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={receiptData.phone}
                      onChange={(e) => setReceiptData({ ...receiptData, phone: e.target.value })}
                      className="w-full bg-agrasya-surface border border-agrasya-border rounded-xl px-2.5 py-1.5 text-xs font-sans text-agrasya-text"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-sans text-agrasya-muted block mb-1">Village & Mandi Hub</label>
                  <input
                    type="text"
                    value={receiptData.village}
                    onChange={(e) => setReceiptData({ ...receiptData, village: e.target.value })}
                    className="w-full bg-agrasya-surface border border-agrasya-border rounded-xl px-2.5 py-1.5 text-xs font-sans text-agrasya-text"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-sans text-agrasya-muted block mb-1">Crop / Variety</label>
                  <input
                    type="text"
                    value={receiptData.crop}
                    onChange={(e) => setReceiptData({ ...receiptData, crop: e.target.value })}
                    className="w-full bg-agrasya-surface border border-agrasya-border rounded-xl px-2.5 py-1.5 text-xs font-sans text-agrasya-text"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-sans text-agrasya-muted block mb-1">Quantity (kg)</label>
                    <input
                      type="number"
                      value={receiptData.quantity}
                      onChange={(e) => setReceiptData({ ...receiptData, quantity: Number(e.target.value) })}
                      className="w-full bg-agrasya-surface border border-agrasya-border rounded-xl px-2.5 py-1.5 text-xs font-sans text-agrasya-text font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-sans text-agrasya-muted block mb-1">Rate per kg (₹)</label>
                    <input
                      type="number"
                      value={receiptData.ratePerUnit}
                      onChange={(e) => setReceiptData({ ...receiptData, ratePerUnit: Number(e.target.value) })}
                      className="w-full bg-agrasya-surface border border-agrasya-border rounded-xl px-2.5 py-1.5 text-xs font-sans text-agrasya-text font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-sans text-agrasya-muted block mb-1">Payment Reference / Mode</label>
                  <input
                    type="text"
                    value={receiptData.referenceNo}
                    onChange={(e) => setReceiptData({ ...receiptData, referenceNo: e.target.value })}
                    className="w-full bg-agrasya-surface border border-agrasya-border rounded-xl px-2.5 py-1.5 text-xs font-sans text-agrasya-text"
                  />
                </div>
              </div>
            ) : templateType === "soil_report" ? (
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-serif font-bold text-agrasya-text">
                  Soil Analysis Laboratory Parameters
                </h4>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-sans text-agrasya-muted block mb-1">Plot / Sample ID</label>
                    <input
                      type="text"
                      value={soilData.plotId}
                      onChange={(e) => setSoilData({ ...soilData, plotId: e.target.value })}
                      className="w-full bg-agrasya-surface border border-agrasya-border rounded-xl px-2.5 py-1.5 text-xs font-sans text-agrasya-text"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-sans text-agrasya-muted block mb-1">Farmer Name</label>
                    <input
                      type="text"
                      value={soilData.farmerName}
                      onChange={(e) => setSoilData({ ...soilData, farmerName: e.target.value })}
                      className="w-full bg-agrasya-surface border border-agrasya-border rounded-xl px-2.5 py-1.5 text-xs font-sans text-agrasya-text"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-sans text-agrasya-muted block mb-1">pH Level</label>
                    <input
                      type="text"
                      value={soilData.phLevel}
                      onChange={(e) => setSoilData({ ...soilData, phLevel: e.target.value })}
                      className="w-full bg-agrasya-surface border border-agrasya-border rounded-xl px-2.5 py-1.5 text-xs font-sans text-agrasya-text"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-sans text-agrasya-muted block mb-1">Organic Carbon %</label>
                    <input
                      type="text"
                      value={soilData.organicCarbon}
                      onChange={(e) => setSoilData({ ...soilData, organicCarbon: e.target.value })}
                      className="w-full bg-agrasya-surface border border-agrasya-border rounded-xl px-2.5 py-1.5 text-xs font-sans text-agrasya-text"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-sans text-agrasya-muted block mb-1">Nitrogen (N)</label>
                    <input
                      type="text"
                      value={soilData.nitrogen}
                      onChange={(e) => setSoilData({ ...soilData, nitrogen: e.target.value })}
                      className="w-full bg-agrasya-surface border border-agrasya-border rounded-lg px-2 py-1.5 text-[11px] font-sans text-agrasya-text"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-sans text-agrasya-muted block mb-1">Phosphorus (P)</label>
                    <input
                      type="text"
                      value={soilData.phosphorus}
                      onChange={(e) => setSoilData({ ...soilData, phosphorus: e.target.value })}
                      className="w-full bg-agrasya-surface border border-agrasya-border rounded-lg px-2 py-1.5 text-[11px] font-sans text-agrasya-text"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-sans text-agrasya-muted block mb-1">Potassium (K)</label>
                    <input
                      type="text"
                      value={soilData.potassium}
                      onChange={(e) => setSoilData({ ...soilData, potassium: e.target.value })}
                      className="w-full bg-agrasya-surface border border-agrasya-border rounded-lg px-2 py-1.5 text-[11px] font-sans text-agrasya-text"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-sans text-agrasya-muted block mb-1">Agronomist Recommendation</label>
                  <textarea
                    rows={3}
                    value={soilData.recommendation}
                    onChange={(e) => setSoilData({ ...soilData, recommendation: e.target.value })}
                    className="w-full bg-agrasya-surface border border-agrasya-border rounded-xl px-2.5 py-2 text-xs font-sans text-agrasya-text resize-none"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-serif font-bold text-agrasya-text">
                  Executive Memo Parameters
                </h4>

                <div>
                  <label className="text-[11px] font-sans text-agrasya-muted block mb-1">Title</label>
                  <input
                    type="text"
                    value={memoData.title}
                    onChange={(e) => setMemoData({ ...memoData, title: e.target.value })}
                    className="w-full bg-agrasya-surface border border-agrasya-border rounded-xl px-2.5 py-1.5 text-xs font-sans text-agrasya-text font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-sans text-agrasya-muted block mb-1">Executive Summary</label>
                  <textarea
                    rows={2}
                    value={memoData.summary}
                    onChange={(e) => setMemoData({ ...memoData, summary: e.target.value })}
                    className="w-full bg-agrasya-surface border border-agrasya-border rounded-xl px-2.5 py-2 text-xs font-sans text-agrasya-text resize-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-sans text-agrasya-muted block mb-1">Milestone Highlights</label>
                  <div className="flex flex-col gap-1.5">
                    <input
                      type="text"
                      value={memoData.milestone1}
                      onChange={(e) => setMemoData({ ...memoData, milestone1: e.target.value })}
                      className="w-full bg-agrasya-surface border border-agrasya-border rounded-xl px-2.5 py-1 text-xs font-sans text-agrasya-text"
                    />
                    <input
                      type="text"
                      value={memoData.milestone2}
                      onChange={(e) => setMemoData({ ...memoData, milestone2: e.target.value })}
                      className="w-full bg-agrasya-surface border border-agrasya-border rounded-xl px-2.5 py-1 text-xs font-sans text-agrasya-text"
                    />
                    <input
                      type="text"
                      value={memoData.milestone3}
                      onChange={(e) => setMemoData({ ...memoData, milestone3: e.target.value })}
                      className="w-full bg-agrasya-surface border border-agrasya-border rounded-xl px-2.5 py-1 text-xs font-sans text-agrasya-text"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-sans text-agrasya-muted block mb-1">Current Bottlenecks & Logistics</label>
                  <input
                    type="text"
                    value={memoData.bottlenecks}
                    onChange={(e) => setMemoData({ ...memoData, bottlenecks: e.target.value })}
                    className="w-full bg-agrasya-surface border border-agrasya-border rounded-xl px-2.5 py-1.5 text-xs font-sans text-agrasya-text"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: High-Resolution Live A4 Document Preview */}
          <div className={cn(
            "flex-1 overflow-y-auto p-4 sm:p-8 bg-zinc-100 dark:bg-zinc-900 flex justify-center items-start print:p-0 print:bg-white",
            activeTab === "edit" ? "hidden md:flex" : "flex"
          )}>
            {/* The A4 Sheet */}
            <div className="w-full max-w-[650px] bg-white text-zinc-900 shadow-2xl rounded-sm p-8 sm:p-12 border border-zinc-200 print:max-w-none print:shadow-none print:border-none print:p-0 print:m-0">
              {/* Agrasya Official Document Header */}
              <div className="border-b-2 border-emerald-700 pb-5 mb-6 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-6 h-6 rounded bg-emerald-800 text-white font-serif font-black text-xs flex items-center justify-center">
                      A
                    </span>
                    <h1 className="text-2xl font-serif font-black tracking-tight text-emerald-900">
                      AGRASYA<span className="text-emerald-600">.</span>
                    </h1>
                  </div>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-sans font-bold">
                    Organic Agritech & Sustainable Food Chain
                  </p>
                  <p className="text-[9px] text-zinc-400 font-sans mt-0.5">
                    Reg Office: Mandya Rural Hub & Bangalore Operations Center • ISO/NPOP Certified
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
                    Official Document
                  </span>
                  <p className="text-[11px] font-sans text-zinc-500 mt-2">
                    Date: {templateType === "farmer_receipt" ? receiptData.date : templateType === "soil_report" ? soilData.date : new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Document Body depending on Template */}
              {templateType === "farmer_receipt" ? (
                <div>
                  <div className="bg-emerald-50/60 border border-emerald-200/80 rounded p-4 mb-6 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-emerald-800">
                        Procurement Purchase Voucher
                      </span>
                      <h2 className="text-lg font-serif font-bold text-zinc-900">
                        {receiptData.voucherNo}
                      </h2>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 block">Total Payout</span>
                      <span className="text-xl font-serif font-black text-emerald-800">
                        ₹{totalPayout.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Beneficiary & Farm Info */}
                  <div className="grid grid-cols-2 gap-4 mb-6 text-xs font-sans">
                    <div className="bg-zinc-50 p-3 rounded border border-zinc-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                        Partner Farmer / Seller
                      </span>
                      <p className="font-bold text-zinc-900 text-sm">{receiptData.farmerName}</p>
                      <p className="text-zinc-600">{receiptData.village}</p>
                      <p className="text-zinc-500">{receiptData.phone}</p>
                    </div>

                    <div className="bg-zinc-50 p-3 rounded border border-zinc-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                        Procurement Logistics
                      </span>
                      <p className="font-semibold text-zinc-800">Direct Farm Gate Purchase</p>
                      <p className="text-zinc-600">Mode: {receiptData.paymentMode}</p>
                      <p className="text-zinc-500">Ref: {receiptData.referenceNo}</p>
                    </div>
                  </div>

                  {/* Line Item Table */}
                  <table className="w-full text-xs font-sans mb-6 border border-zinc-200 rounded overflow-hidden">
                    <thead className="bg-zinc-100 text-zinc-700 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5 text-left">Commodity / Crop</th>
                        <th className="p-2.5 text-center">Net Qty</th>
                        <th className="p-2.5 text-right">Unit Rate (₹/kg)</th>
                        <th className="p-2.5 text-right">Total Payout</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      <tr>
                        <td className="p-3 font-semibold text-zinc-900">
                          {receiptData.crop}
                          <span className="block text-[10px] font-normal text-zinc-500">
                            Grade A Certified Organic Harvest
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold">{receiptData.quantity} kg</td>
                        <td className="p-3 text-right">₹{receiptData.ratePerUnit.toFixed(2)}</td>
                        <td className="p-3 text-right font-black text-emerald-800">₹{totalPayout.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Notes */}
                  <div className="text-[11px] font-sans text-zinc-600 bg-zinc-50 p-3 rounded border border-zinc-200 mb-8">
                    <span className="font-bold text-zinc-800">Quality Note: </span>
                    {receiptData.notes}
                  </div>

                  {/* Signatures */}
                  <div className="grid grid-cols-2 gap-8 pt-8 border-t border-zinc-200 text-xs font-sans">
                    <div className="text-center">
                      <div className="h-10 border-b border-zinc-300 mb-1" />
                      <p className="font-bold text-zinc-800">{receiptData.farmerName}</p>
                      <p className="text-[10px] text-zinc-500">Farmer's Signature / Thumb Impression</p>
                    </div>
                    <div className="text-center">
                      <div className="h-10 border-b border-zinc-300 mb-1 flex items-end justify-center">
                        <span className="text-[11px] font-serif italic text-emerald-800">Verified Agrasya Field Officer</span>
                      </div>
                      <p className="font-bold text-zinc-800">{receiptData.officer}</p>
                      <p className="text-[10px] text-zinc-500">Authorized Agrasya Signatory</p>
                    </div>
                  </div>
                </div>
              ) : templateType === "soil_report" ? (
                <div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded p-4 mb-6">
                    <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-emerald-800">
                      Field Soil Fertility & Nutrient Dossier
                    </span>
                    <h2 className="text-lg font-serif font-bold text-zinc-900">
                      Plot Verification #{soilData.plotId}
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6 text-xs font-sans">
                    <div>
                      <p className="text-zinc-500 text-[10px] uppercase font-bold">Landowner</p>
                      <p className="font-bold text-zinc-900">{soilData.farmerName}</p>
                      <p className="text-zinc-600">{soilData.village}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 text-[10px] uppercase font-bold">Soil Grade</p>
                      <p className="font-bold text-emerald-800">Certified Organic Compliant</p>
                      <p className="text-zinc-600">Sample Depth: 0–30 cm topsoil</p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 text-xs font-sans">
                    <div className="p-3 bg-zinc-50 border border-zinc-200 rounded">
                      <span className="text-[10px] uppercase text-zinc-400 font-bold block">pH Level</span>
                      <span className="text-sm font-bold text-zinc-800">{soilData.phLevel}</span>
                    </div>
                    <div className="p-3 bg-zinc-50 border border-zinc-200 rounded">
                      <span className="text-[10px] uppercase text-zinc-400 font-bold block">Organic Carbon</span>
                      <span className="text-sm font-bold text-emerald-800">{soilData.organicCarbon}</span>
                    </div>
                    <div className="p-3 bg-zinc-50 border border-zinc-200 rounded">
                      <span className="text-[10px] uppercase text-zinc-400 font-bold block">Nitrogen (N)</span>
                      <span className="text-sm font-bold text-zinc-800">{soilData.nitrogen}</span>
                    </div>
                    <div className="p-3 bg-zinc-50 border border-zinc-200 rounded">
                      <span className="text-[10px] uppercase text-zinc-400 font-bold block">Phosphorus (P)</span>
                      <span className="text-sm font-bold text-zinc-800">{soilData.phosphorus}</span>
                    </div>
                    <div className="p-3 bg-zinc-50 border border-zinc-200 rounded">
                      <span className="text-[10px] uppercase text-zinc-400 font-bold block">Potassium (K)</span>
                      <span className="text-sm font-bold text-zinc-800">{soilData.potassium}</span>
                    </div>
                  </div>

                  <div className="bg-zinc-50 p-4 rounded border border-zinc-200 mb-8 text-xs font-sans">
                    <span className="font-bold text-zinc-800 block mb-1">Agronomist Recommendation:</span>
                    <p className="text-zinc-600 leading-relaxed">{soilData.recommendation}</p>
                  </div>

                  <div className="pt-6 border-t border-zinc-200 flex justify-between items-center text-xs font-sans">
                    <div>
                      <p className="font-bold text-zinc-800">{soilData.inspector}</p>
                      <p className="text-[10px] text-zinc-500">Chief Agronomy Auditor</p>
                    </div>
                    <div className="w-20 h-20 border-2 border-dashed border-emerald-600/40 rounded-full flex items-center justify-center text-[9px] font-bold uppercase text-emerald-700 rotate-12">
                      Agrasya QA Passed
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-serif font-bold text-zinc-900 mb-2">
                    {memoData.title}
                  </h2>
                  <p className="text-xs font-sans text-zinc-500 uppercase tracking-wider mb-6">
                    Reporting Horizon: {memoData.period}
                  </p>

                  <div className="mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">
                      1. Executive Overview
                    </h3>
                    <p className="text-xs font-sans text-zinc-700 leading-relaxed bg-zinc-50 p-3 rounded border border-zinc-200">
                      {memoData.summary}
                    </p>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">
                      2. Verified Milestones
                    </h3>
                    <ul className="space-y-2 text-xs font-sans text-zinc-700">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-700 font-bold">•</span>
                        <span>{memoData.milestone1}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-700 font-bold">•</span>
                        <span>{memoData.milestone2}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-700 font-bold">•</span>
                        <span>{memoData.milestone3}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-rose-800 mb-2">
                      3. Operational Bottlenecks & Action Items
                    </h3>
                    <p className="text-xs font-sans text-zinc-700 bg-rose-50/50 p-3 rounded border border-rose-200 leading-relaxed">
                      {memoData.bottlenecks}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-zinc-200 text-xs font-sans text-right">
                    <p className="font-bold text-zinc-800">{memoData.author}</p>
                    <p className="text-[10px] text-zinc-500">Agrasya Core Leadership</p>
                  </div>
                </div>
              )}

              {/* Official Document Footer */}
              <div className="mt-8 pt-4 border-t border-zinc-200 text-center text-[9px] text-zinc-400 font-sans">
                Generated securely on Agrasya Founder OS • Immutable Document Vault
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// -------------------------------------------------------------
// 3. PDF Viewer Modal
// -------------------------------------------------------------
function PdfViewerModal({
  document,
  onClose,
  onDelete
}: {
  document: PdfDocument;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    triggerHaptic("selection");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    triggerHaptic("medium");
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[290] flex items-center justify-center p-2 sm:p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-md print:hidden"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="relative w-full max-w-4xl h-[88vh] bg-agrasya-card border border-agrasya-border rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10 print:h-auto print:max-h-none print:shadow-none print:border-none print:rounded-none print:bg-white print:fixed print:inset-0"
      >
        {/* Viewer Header */}
        <div className="px-5 py-3.5 border-b border-agrasya-border flex items-center justify-between bg-agrasya-bg print:hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
              <FileText size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-serif font-bold text-agrasya-text truncate">
                  {document.title}
                </h3>
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-md shrink-0">
                  {document.category}
                </span>
              </div>
              <p className="text-[11px] font-sans text-agrasya-muted truncate">
                {document.fileName} • {document.fileSize}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl text-agrasya-muted hover:text-agrasya-text hover:bg-agrasya-surface transition-colors"
              title="Print"
            >
              <Printer size={16} />
            </button>

            {document.fileUrl && (
              <a
                href={document.fileUrl}
                download={document.fileName}
                className="p-2 rounded-xl text-agrasya-muted hover:text-agrasya-text hover:bg-agrasya-surface transition-colors"
                title="Download"
              >
                <Download size={16} />
              </a>
            )}

            <button
              onClick={handleCopyLink}
              className="p-2 rounded-xl text-agrasya-muted hover:text-agrasya-text hover:bg-agrasya-surface transition-colors"
              title="Copy Link"
            >
              {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-agrasya-muted hover:text-agrasya-text hover:bg-agrasya-surface ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Viewer Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-zinc-100 dark:bg-zinc-900 flex justify-center items-start">
          {document.fileUrl && document.fileUrl.startsWith("data:application/pdf") ? (
            <iframe
              src={document.fileUrl}
              title={document.title}
              className="w-full h-full min-h-[500px] rounded-xl border border-zinc-300 bg-white"
            />
          ) : (
            /* Render Structured Document Sheet */
            <div className="w-full max-w-[650px] bg-white text-zinc-900 shadow-xl rounded-sm p-8 sm:p-12 border border-zinc-200">
              <div className="border-b-2 border-emerald-700 pb-4 mb-6 flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-serif font-black tracking-tight text-emerald-900">
                    AGRASYA<span className="text-emerald-600">.</span>
                  </h1>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-sans font-bold">
                    Official Document Vault Record
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    Verified
                  </span>
                  <p className="text-[11px] font-sans text-zinc-500 mt-1">
                    {new Date(document.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <h2 className="text-xl font-serif font-bold text-zinc-900 mb-2">
                {document.title}
              </h2>

              <p className="text-xs font-sans text-zinc-600 mb-6 leading-relaxed">
                {document.description || "Official document archived securely in Agrasya Founder OS."}
              </p>

              {/* Document Details Metadata Box */}
              <div className="bg-zinc-50 rounded p-4 border border-zinc-200 mb-6 grid grid-cols-2 gap-4 text-xs font-sans">
                <div>
                  <span className="text-zinc-400 uppercase text-[10px] font-bold block">Category</span>
                  <span className="font-semibold text-zinc-800">{document.category}</span>
                </div>
                <div>
                  <span className="text-zinc-400 uppercase text-[10px] font-bold block">Archive Size</span>
                  <span className="font-semibold text-zinc-800">{document.fileSize}</span>
                </div>
                <div>
                  <span className="text-zinc-400 uppercase text-[10px] font-bold block">File Reference</span>
                  <span className="font-semibold text-zinc-800 truncate block">{document.fileName}</span>
                </div>
                <div>
                  <span className="text-zinc-400 uppercase text-[10px] font-bold block">Archived By</span>
                  <span className="font-semibold text-zinc-800">{document.uploadedBy}</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-8">
                {document.tags.map(t => (
                  <span key={t} className="text-xs font-sans px-2.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-300">
                    #{t}
                  </span>
                ))}
              </div>

              <div className="pt-6 border-t border-zinc-200 text-center text-xs font-sans text-zinc-400">
                Agrasya Digital Proof • Generated & Archived via Founder OS
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// -------------------------------------------------------------
// 4. Add Category Modal
// -------------------------------------------------------------
function AddCategoryModal({
  onClose,
  onAdd
}: {
  onClose: () => void;
  onAdd: (cat: PdfCategory) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAdd({
      id: `cat-${Date.now()}`,
      name: name.trim(),
      color: "emerald",
      description: description.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-[260] flex items-center justify-center p-4">
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
          New Document Category
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
              placeholder="e.g. Export Clearances"
              className="w-full bg-agrasya-surface border border-agrasya-border rounded-xl px-3 py-2 text-xs font-sans text-agrasya-text focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-sans font-semibold text-agrasya-text block mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Customs, phytosanitary certificates..."
              className="w-full bg-agrasya-surface border border-agrasya-border rounded-xl px-3 py-2 text-xs font-sans text-agrasya-text focus:outline-none"
            />
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
              className="px-4 py-1.5 rounded-xl bg-agrasya-green text-white text-xs font-sans font-bold hover:bg-agrasya-green/90 shadow-sm disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
