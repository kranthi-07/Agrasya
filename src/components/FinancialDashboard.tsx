"use client";

import React, { useState } from "react";
import { useMockData } from "../store/MockDataContext";
import { TrendingUp, DollarSign, Activity, FileText } from "lucide-react";
import { ReportGenerator } from "./ReportGenerator";

export function FinancialDashboard() {
  const { items } = useMockData();
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Extract financial models
  const financialModels = items.filter(item => item.metadata?.type === "financial_model" && item.metadata.rows);

  // Calculate totals for each model
  const processedData = financialModels.map(model => {
    // FinancialFormModal saves: { sellingPrice: number, rows: [{ label, value }] }
    const revenue = model.metadata?.sellingPrice || 0;
    
    let totalCosts = 0;
    if (model.metadata?.rows) {
      model.metadata.rows.forEach((row: any) => {
        totalCosts += (row.value || row.amount || 0); // fallback for amount if schema was mixed
      });
    }

    const margin = revenue - totalCosts;
    const marginPercent = revenue > 0 ? (margin / revenue) * 100 : 0;

    return {
      id: model.id,
      title: model.title,
      revenue,
      costs: totalCosts,
      margin,
      marginPercent
    };
  });

  // Aggregate stats
  const totalProjectedRevenue = processedData.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalProjectedMargin = processedData.reduce((acc, curr) => acc + curr.margin, 0);
  const averageMarginPercent = totalProjectedRevenue > 0 ? (totalProjectedMargin / totalProjectedRevenue) * 100 : 0;

  // Find max value for chart scaling
  const maxRevenue = Math.max(...processedData.map(d => d.revenue), 1000); // minimum scale

  return (
    <div className="flex-1 overflow-y-auto bg-white border border-agrasya-border rounded-xl shadow-inner p-8 relative">
      
      <div className="mb-8 border-b border-agrasya-border/50 pb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-serif font-bold text-agrasya-text flex items-center gap-2">
            <Activity className="text-agrasya-green" /> Global Analytics
          </h2>
          <p className="text-sm font-sans text-agrasya-muted mt-1">Aggregate view of all active financial models</p>
        </div>
        
        <button 
          onClick={() => setIsReportOpen(true)}
          className="bg-agrasya-text text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-black transition-colors shadow-sm"
        >
          <FileText size={16} /> Generate CEO Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-agrasya-bg border border-agrasya-border p-6 rounded-lg shadow-sm">
          <div className="text-xs font-bold font-sans uppercase tracking-wider text-agrasya-muted flex items-center gap-2 mb-2">
            <DollarSign size={14} /> Total Projected Revenue
          </div>
          <div className="text-3xl font-serif font-bold text-agrasya-text">
            ${totalProjectedRevenue.toLocaleString()}
          </div>
        </div>
        
        <div className="bg-agrasya-bg border border-agrasya-border p-6 rounded-lg shadow-sm">
          <div className="text-xs font-bold font-sans uppercase tracking-wider text-agrasya-muted flex items-center gap-2 mb-2">
            <TrendingUp size={14} /> Aggregate Net Margin
          </div>
          <div className={totalProjectedMargin >= 0 ? "text-3xl font-serif font-bold text-agrasya-green" : "text-3xl font-serif font-bold text-red-600"}>
            ${totalProjectedMargin.toLocaleString()}
          </div>
        </div>

        <div className="bg-agrasya-bg border border-agrasya-border p-6 rounded-lg shadow-sm">
          <div className="text-xs font-bold font-sans uppercase tracking-wider text-agrasya-muted flex items-center gap-2 mb-2">
            <Activity size={14} /> Average Margin %
          </div>
          <div className="text-3xl font-serif font-bold text-agrasya-text">
            {averageMarginPercent.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Custom Bar Chart */}
      <div>
        <h3 className="text-lg font-serif font-bold text-agrasya-text mb-6">Model Comparison: Revenue vs Costs</h3>
        
        {processedData.length === 0 ? (
          <div className="text-center py-12 text-agrasya-muted italic border-2 border-dashed border-agrasya-border rounded-lg">
            No financial models found. Create one in the Board view.
          </div>
        ) : (
          <div className="flex gap-12 items-end h-[350px] border-b border-l border-agrasya-border/50 pl-4 pb-4">
            {processedData.map(data => {
              const revHeight = (data.revenue / maxRevenue) * 300; // max height 300px
              const costHeight = (data.costs / maxRevenue) * 300;

              return (
                <div key={data.id} className="flex flex-col items-center group relative h-full justify-end">
                  
                  {/* Tooltip on hover */}
                  <div className="absolute -top-16 opacity-0 group-hover:opacity-100 transition-opacity bg-agrasya-text text-white p-3 rounded text-xs shadow-lg pointer-events-none whitespace-nowrap z-10">
                    <div className="font-bold mb-1">{data.title}</div>
                    <div className="text-green-300">Rev: ${data.revenue.toLocaleString()}</div>
                    <div className="text-red-300">Cost: ${data.costs.toLocaleString()}</div>
                  </div>

                  <div className="flex gap-2 items-end">
                    {/* Revenue Bar */}
                    <div 
                      className="w-12 bg-agrasya-green rounded-t-sm hover:opacity-80 transition-opacity relative"
                      style={{ height: `${Math.max(revHeight, 2)}px` }}
                    >
                      <div className="absolute -top-6 w-full text-center text-xs font-semibold text-agrasya-text">
                        ${(data.revenue / 1000).toFixed(0)}k
                      </div>
                    </div>
                    {/* Costs Bar */}
                    <div 
                      className="w-12 bg-agrasya-earth/70 rounded-t-sm hover:opacity-80 transition-opacity relative"
                      style={{ height: `${Math.max(costHeight, 2)}px` }}
                    >
                    </div>
                  </div>
                  
                  <div className="mt-4 text-xs font-serif font-semibold text-agrasya-text text-center w-28 truncate">
                    {data.title}
                  </div>
                  <div className={data.margin >= 0 ? "text-[10px] font-sans font-bold text-agrasya-green" : "text-[10px] font-sans font-bold text-red-500"}>
                    {data.marginPercent.toFixed(1)}% Margin
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ReportGenerator isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
    </div>
  );
}
