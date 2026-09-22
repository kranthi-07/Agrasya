"use client";

import React, { useMemo } from "react";
import { useMockData } from "../store/MockDataContext";
import { X, Printer, TrendingUp, Target, CheckCircle2, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ReportGenerator({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { items } = useMockData();

  // Aggregate Financials
  const financials = useMemo(() => {
    let totalRevenue = 0;
    let totalCosts = 0;
    const models = items.filter(i => i.metadata?.type === "financial_model" && i.metadata.rows);
    
    models.forEach(model => {
      totalRevenue += (model.metadata?.sellingPrice || 0);
      
      if (model.metadata?.rows) {
        model.metadata.rows.forEach((row: any) => {
          totalCosts += (row.value || row.amount || 0);
        });
      }
    });

    return { totalRevenue, totalCosts, margin: totalRevenue - totalCosts };
  }, [items]);

  // Aggregate Experiments
  const experiments = items.filter(i => i.metadata?.experimentStage);
  const activeExperiments = experiments.filter(i => i.metadata?.experimentStage === "active");
  const validatedExperiments = experiments.filter(i => i.metadata?.experimentStage === "validated");

  // Aggregate Success Stories
  const successStories = items.filter(i => i.zoneId === "SUCCESS STORIES");

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-agrasya-text/30 backdrop-blur-sm print:hidden"
          />

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col print:max-h-none print:shadow-none print:rounded-none print:absolute print:inset-0"
          >
            {/* Header (Hidden in Print) */}
            <div className="flex justify-between items-center px-8 py-4 border-b border-agrasya-border bg-agrasya-bg print:hidden">
              <h2 className="text-lg font-serif font-bold text-agrasya-text">Executive Report Preview</h2>
              <div className="flex gap-4">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 bg-agrasya-green text-white px-4 py-2 rounded-md font-sans text-sm font-semibold hover:bg-agrasya-green/90 transition-colors"
                >
                  <Printer size={16} /> Print / Save as PDF
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-agrasya-muted hover:text-agrasya-text transition-colors rounded-full hover:bg-black/5"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="p-8 sm:p-12 overflow-y-auto flex-1 bg-white print:p-0">
              
              <div className="mb-12 border-b-2 border-agrasya-text pb-6">
                <h1 className="text-4xl font-serif font-bold text-agrasya-text tracking-tight mb-2">Agrasya<span className="text-agrasya-green">.</span></h1>
                <h2 className="text-xl font-sans text-agrasya-muted uppercase tracking-widest">Executive Summary Report</h2>
                <div className="mt-4 text-sm font-sans font-medium text-agrasya-text">
                  Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>

              {/* Section 1: Financial Health */}
              <section className="mb-10">
                <h3 className="text-2xl font-serif font-bold text-agrasya-text border-b border-agrasya-border pb-2 mb-6 flex items-center gap-2">
                  <TrendingUp className="text-agrasya-green" /> 1. Financial Projections
                </h3>
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-agrasya-bg p-6 rounded border border-agrasya-border print:border-gray-300">
                    <div className="text-xs uppercase tracking-wider text-agrasya-muted font-bold mb-1">Total Projected Revenue</div>
                    <div className="text-3xl font-serif font-bold text-agrasya-text">${financials.totalRevenue.toLocaleString()}</div>
                  </div>
                  <div className="bg-agrasya-bg p-6 rounded border border-agrasya-border print:border-gray-300">
                    <div className="text-xs uppercase tracking-wider text-agrasya-muted font-bold mb-1">Total Costs (COGS & OPEX)</div>
                    <div className="text-3xl font-serif font-bold text-agrasya-text">${financials.totalCosts.toLocaleString()}</div>
                  </div>
                  <div className="bg-agrasya-bg p-6 rounded border border-agrasya-border print:border-gray-300">
                    <div className="text-xs uppercase tracking-wider text-agrasya-muted font-bold mb-1">Net Margin</div>
                    <div className={financials.margin >= 0 ? "text-3xl font-serif font-bold text-agrasya-green" : "text-3xl font-serif font-bold text-red-600"}>
                      ${financials.margin.toLocaleString()}
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 2: Experiment Pipeline */}
              <section className="mb-10 break-inside-avoid">
                <h3 className="text-2xl font-serif font-bold text-agrasya-text border-b border-agrasya-border pb-2 mb-6 flex items-center gap-2">
                  <Target className="text-blue-500" /> 2. Experiment Pipeline
                </h3>
                
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-lg font-serif font-bold mb-4 text-agrasya-text">Active Experiments ({activeExperiments.length})</h4>
                    {activeExperiments.length === 0 ? (
                      <p className="text-sm text-agrasya-muted italic">No active experiments currently running.</p>
                    ) : (
                      <ul className="space-y-3">
                        {activeExperiments.map(exp => (
                          <li key={exp.id} className="flex items-start gap-2 text-sm font-sans">
                            <ChevronRight size={16} className="text-blue-500 shrink-0 mt-0.5" />
                            <span className="text-agrasya-text font-medium">{exp.title}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-serif font-bold mb-4 text-agrasya-text">Recently Validated ({validatedExperiments.length})</h4>
                    {validatedExperiments.length === 0 ? (
                      <p className="text-sm text-agrasya-muted italic">No experiments validated recently.</p>
                    ) : (
                      <ul className="space-y-3">
                        {validatedExperiments.map(exp => (
                          <li key={exp.id} className="flex items-start gap-2 text-sm font-sans">
                            <CheckCircle2 size={16} className="text-agrasya-green shrink-0 mt-0.5" />
                            <span className="text-agrasya-text font-medium">{exp.title}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </section>

              {/* Section 3: Success Stories */}
              <section className="break-inside-avoid">
                <h3 className="text-2xl font-serif font-bold text-agrasya-text border-b border-agrasya-border pb-2 mb-6 flex items-center gap-2">
                  <CheckCircle2 className="text-agrasya-green" /> 3. Strategic Successes
                </h3>
                {successStories.length === 0 ? (
                  <p className="text-sm text-agrasya-muted italic">No success stories recorded.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {successStories.map(story => (
                      <div key={story.id} className="border border-agrasya-border p-4 rounded bg-agrasya-bg print:border-gray-300">
                        <h4 className="font-serif font-bold text-agrasya-text mb-2">{story.title}</h4>
                        <p className="text-sm text-agrasya-muted font-sans line-clamp-3">
                          {story.description || "No description provided."}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Print Footer */}
              <div className="mt-16 pt-8 border-t border-agrasya-border text-center text-xs text-agrasya-muted font-sans hidden print:block">
                Generated securely by Agrasya Founder OS
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
