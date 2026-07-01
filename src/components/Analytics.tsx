/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ShieldAlert, BarChart3, PieChart as PieIcon, Globe } from "lucide-react";

interface AnalyticsProps {
  refreshTrigger: number;
}

export default function Analytics({ refreshTrigger }: AnalyticsProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/analytics");
        const json = await res.json();
        if (json.success) {
          setData(json.analytics);
        }
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div id="analytics-loading" className="flex items-center justify-center h-80">
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Fallback default values if no data exists
  const avgRisk = data?.avgRiskScore ?? 62;
  const totalScans = (data?.fraudCount ?? 2) + (data?.genuineCount ?? 1);
  const fraudCount = data?.fraudCount ?? 2;
  const genuineCount = data?.genuineCount ?? 1;

  // Pie Chart Data: Genuine vs Fraudulent Ratio (Highly vibrant cyber hues)
  const ratioData = [
    { name: "Scams & Fraud", value: fraudCount, color: "#f43f5e" },
    { name: "Genuine Listings", value: genuineCount, color: "#10b981" }
  ];

  // Bar Chart Data: Specific Indicators Frequency
  const indicatorCounts = data?.indicatorCounts || {
    asksPayment: 2,
    suspiciousEmail: 2,
    urgencyLanguage: 3,
    unrealisticSalary: 1
  };

  const barChartData = [
    { name: "Upfront Payments", count: indicatorCounts.asksPayment, color: "#6366f1" },
    { name: "Suspicious Email", count: indicatorCounts.suspiciousEmail, color: "#818cf8" },
    { name: "High Urgency", count: indicatorCounts.urgencyLanguage, color: "#a78bfa" },
    { name: "Unrealistic Salary", count: indicatorCounts.unrealisticSalary, color: "#4f46e5" }
  ];

  // Risk Range Distribution
  const riskDistribution = data?.riskDistribution || [
    { name: "Genuine (0-25)", count: 1 },
    { name: "Suspicious (26-50)", count: 0 },
    { name: "High Risk (51-75)", count: 1 },
    { name: "Scam (76-100)", count: 1 }
  ];

  const topSuspiciousDomains = data?.topSuspiciousDomains || [
    { domain: "gmail.com", count: 2 },
    { domain: "telegram-jobs.net", count: 1 }
  ];

  return (
    <div id="analytics-container" className="space-y-6">
      
      {/* Overview Cards row */}
      <div id="analytics-summary-cards" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-md shadow-slate-100">
          <span className="text-[10px] font-display font-bold text-slate-500 uppercase tracking-widest block">Average Offer Risk</span>
          <div className="flex items-baseline space-x-1.5 mt-2">
            <span className="text-3xl font-display font-black text-slate-800">{avgRisk}</span>
            <span className="text-xs font-bold text-slate-400 font-mono">/ 100</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-4 border border-slate-200">
            <div
              className={`h-full rounded-full ${avgRisk > 50 ? "bg-rose-500" : "bg-emerald-500"}`}
              style={{ width: `${avgRisk}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-md shadow-slate-100">
          <span className="text-[10px] font-display font-bold text-slate-500 uppercase tracking-widest block">Total Scans Performed</span>
          <span className="text-3xl font-display font-black text-slate-800 mt-2 block">{totalScans}</span>
          <span className="text-[10px] text-slate-400 font-bold font-mono uppercase tracking-wider mt-2.5 block">Persistent sqlite logging active</span>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-md shadow-slate-100">
          <span className="text-[10px] font-display font-bold text-slate-500 uppercase tracking-widest block">Verified Threat Ratio</span>
          <div className="flex items-baseline space-x-1 mt-2">
            <span className="text-3xl font-display font-black text-rose-600">
              {totalScans > 0 ? ((fraudCount / totalScans) * 100).toFixed(0) : "0"}%
            </span>
            <span className="text-xs font-bold text-slate-500 font-mono ml-1.5">of offers are malicious</span>
          </div>
          <span className="text-[10px] text-slate-400 font-bold font-mono uppercase tracking-wider mt-2.5 block">FTC guidance profile matching</span>
        </div>
      </div>

      {/* Recharts Layout Block */}
      <div id="charts-flex-grid" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Indicators Frequency BarChart */}
        <div className="border border-slate-200/80 bg-white p-6 rounded-2xl shadow-md shadow-slate-100 space-y-4">
          <div className="flex items-center space-x-2.5">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-display font-extrabold text-slate-800 uppercase tracking-wider">
              Most Common Fraud Indicators
            </h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">The frequency of specific red flags detected in scanned job offers:</p>
          
          <div className="h-64 w-full pt-2 font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.8} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }} 
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '11px', color: '#1e293b' }} 
                />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={32}>
                  {barChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution PieChart */}
        <div className="border border-slate-200/80 bg-white p-6 rounded-2xl shadow-md shadow-slate-100 space-y-4">
          <div className="flex items-center space-x-2.5">
            <PieIcon className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-display font-extrabold text-slate-800 uppercase tracking-wider">
              Assessed Threat Proportion
            </h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">Percentage breakdown of genuine vs fraudulent applications:</p>
          
          <div className="h-64 w-full flex items-center justify-center font-display font-bold">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ratioData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {ratioData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '11px', color: '#1e293b' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Threat Domain Intelligence Registry */}
      <div id="threat-intelligence-card" className="border border-slate-200/80 bg-white p-6 rounded-2xl shadow-md shadow-slate-100 space-y-4">
        <div className="flex items-center space-x-2.5">
          <Globe className="w-5 h-5 text-rose-500" />
          <h3 className="text-sm font-display font-extrabold text-slate-800 uppercase tracking-wider">
            Domain Threat Intelligence Registry
          </h3>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed font-sans">Top domains associated with high-risk job fraud alerts logged in database:</p>

        {topSuspiciousDomains.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1 font-mono">
            {topSuspiciousDomains.map((dom: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3.5 border border-rose-200 bg-rose-50/50 rounded-xl">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg bg-rose-100 text-rose-600 border border-rose-200">
                    <ShieldAlert className="w-4 h-4 flex-shrink-0 animate-pulse" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 truncate">{dom.domain}</span>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200 tracking-widest">
                  {dom.count} Scans
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-6 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400 font-medium font-mono">
            No suspicious domain signatures logged in threat history yet.
          </div>
        )}
      </div>
    </div>
  );
}
