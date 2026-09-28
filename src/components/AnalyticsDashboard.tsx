"use client";

import React from "react";
import { useMockData } from "../store/MockDataContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Activity, Network, FlaskConical } from "lucide-react";

export function AnalyticsDashboard() {
  const { items, activeWorkspaceId } = useMockData();
  const workspaceItems = items.filter(i => i.workspaceIds?.includes(activeWorkspaceId));

  // 1. Connection Density
  const totalItems = workspaceItems.length;
  const totalConnections = workspaceItems.reduce((acc, item) => acc + (item.connections?.length || 0), 0) / 2; // bidirectional

  // 2. Experiment Pipeline
  const experiments = workspaceItems.filter(i => i.metadata?.experimentStage);
  const expCounts = { hypothesis: 0, active: 0, validated: 0, failed: 0 };
  experiments.forEach(e => {
    if (e.metadata?.experimentStage) {
      expCounts[e.metadata.experimentStage]++;
    }
  });
  
  const expData = [
    { name: "Hypothesis", value: expCounts.hypothesis, color: "#6C757D" },
    { name: "Active", value: expCounts.active, color: "#F59E0B" },
    { name: "Validated", value: expCounts.validated, color: "#10B981" },
    { name: "Failed", value: expCounts.failed, color: "#EF4444" },
  ];

  // 3. Zone Distribution
  const zoneCounts: Record<string, number> = {};
  workspaceItems.forEach(item => {
    const pureZone = item.zoneId.includes('::') ? item.zoneId.split('::')[1] : item.zoneId;
    zoneCounts[pureZone] = (zoneCounts[pureZone] || 0) + 1;
  });
  const zoneData = Object.entries(zoneCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // top 5

  return (
    <div className="flex-1 flex flex-col gap-6 p-2 md:p-6">
      <h2 className="text-2xl font-serif text-agrasya-text mb-4">Workspace Analytics</h2>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-agrasya-card border border-agrasya-border rounded-xl p-6 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-agrasya-muted">
            <Activity size={18} />
            <span className="text-sm font-medium uppercase tracking-wider">Total Nodes</span>
          </div>
          <span className="text-4xl font-sans font-light text-agrasya-text">{totalItems}</span>
        </div>
        
        <div className="bg-agrasya-card border border-agrasya-border rounded-xl p-6 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-agrasya-muted">
            <Network size={18} />
            <span className="text-sm font-medium uppercase tracking-wider">Connections</span>
          </div>
          <span className="text-4xl font-sans font-light text-agrasya-text">{totalConnections}</span>
        </div>

        <div className="bg-agrasya-card border border-agrasya-border rounded-xl p-6 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-agrasya-muted">
            <FlaskConical size={18} />
            <span className="text-sm font-medium uppercase tracking-wider">Experiments</span>
          </div>
          <span className="text-4xl font-sans font-light text-agrasya-text">{experiments.length}</span>
        </div>

        <div className="bg-agrasya-card border border-agrasya-border rounded-xl p-6 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-agrasya-muted">
            <TrendingUp size={18} />
            <span className="text-sm font-medium uppercase tracking-wider">Validated</span>
          </div>
          <span className="text-4xl font-sans font-light text-agrasya-green">{expCounts.validated}</span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        
        {/* Pipeline Pie */}
        <div className="bg-agrasya-card border border-agrasya-border rounded-xl p-6 shadow-sm h-80 flex flex-col">
          <h3 className="text-lg font-serif text-agrasya-text mb-4">Experiment Pipeline</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={experiments.length > 0 ? expData : [{ name: "No Data", value: 1, color: "var(--color-agrasya-surface)" }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(experiments.length > 0 ? expData : [{ name: "No Data", value: 1, color: "var(--color-agrasya-surface)" }]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                {experiments.length > 0 && (
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-agrasya-card)', borderColor: 'var(--color-agrasya-border)', color: 'var(--color-agrasya-text)' }}
                    itemStyle={{ color: 'var(--color-agrasya-text)' }}
                  />
                )}
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {expData.map(d => (
              <div key={d.name} className="flex items-center gap-1 text-xs text-agrasya-muted">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>

        {/* Zone Distribution Bar */}
        <div className="bg-agrasya-card border border-agrasya-border rounded-xl p-6 shadow-sm h-80 flex flex-col">
          <h3 className="text-lg font-serif text-agrasya-text mb-4">Top Zones by Volume</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zoneData} layout="vertical" margin={{ top: 0, right: 20, left: 40, bottom: 0 }}>
                <XAxis type="number" hide domain={[0, 'dataMax + 2']} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-agrasya-muted)', fontSize: 10, width: 80 }} width={90} />
                <Tooltip 
                  cursor={{ fill: 'var(--color-agrasya-surface)' }}
                  contentStyle={{ backgroundColor: 'var(--color-agrasya-card)', borderColor: 'var(--color-agrasya-border)', color: 'var(--color-agrasya-text)' }}
                />
                <Bar dataKey="value" fill="var(--color-agrasya-green)" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
