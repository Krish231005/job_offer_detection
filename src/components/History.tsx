/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Table, Search, Calendar, Trash2, Eye, AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";
import { ScanRecord } from "../types";

interface HistoryProps {
  scans: ScanRecord[];
  onSelectScan: (scan: ScanRecord) => void;
  onDeleteScan: (id: string) => void;
}

export default function History({ scans, onSelectScan, onDeleteScan }: HistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredScans = scans.filter((scan) => {
    const searchString = `${scan.company} ${scan.prediction} ${scan.offerText}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  return (
    <div id="history-container" className="border border-slate-800/80 rounded-2xl bg-[#111827]/70 backdrop-blur-md shadow-2xl shadow-black/40 overflow-hidden">
      {/* Search Header */}
      <div id="history-header" className="p-5 border-b border-slate-800/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-indigo-950/15">
        <div className="flex items-center space-x-2.5">
          <Table className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-display font-extrabold text-slate-100 uppercase tracking-wider">
            Verification History Log (SQLite Records)
          </h3>
        </div>
        
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search records by company, tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/50 border border-slate-800/80 focus:border-indigo-500/80 text-slate-100 placeholder-slate-600 text-xs pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all duration-200"
          />
        </div>
      </div>

      {/* Scans Table List */}
      {filteredScans.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-bold uppercase text-[9px] tracking-widest border-b border-slate-800/60">
              <tr>
                <th className="py-4 px-5">Timestamp</th>
                <th className="py-4 px-5">Company / Role</th>
                <th className="py-4 px-5">Salary Offer</th>
                <th className="py-4 px-5">Threat Level</th>
                <th className="py-4 px-5">Decision</th>
                <th className="py-4 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-medium text-slate-300">
              {filteredScans.map((scan) => {
                const isFraud = scan.prediction === "Fraud";
                const isSuspicious = scan.prediction === "Suspicious";

                let statusBadge = (
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Genuine</span>
                  </span>
                );

                if (isFraud) {
                  statusBadge = (
                    <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/30">
                      <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Scam</span>
                    </span>
                  );
                } else if (isSuspicious) {
                  statusBadge = (
                    <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Suspicious</span>
                    </span>
                  );
                }

                return (
                  <tr key={scan.id} className="hover:bg-slate-900/30 transition-colors duration-150">
                    <td className="py-4 px-5 whitespace-nowrap text-slate-500 font-medium font-mono">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-600" />
                        <span>{new Date(scan.timestamp).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 max-w-[200px]">
                      <span className="text-sm font-display font-bold text-slate-200 block truncate">{scan.company || "Unknown Company"}</span>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mt-1 truncate">
                        {scan.offerText.slice(0, 45)}...
                      </span>
                    </td>
                    <td className="py-4 px-5 font-bold text-slate-200">{scan.salary || "Not Specified"}</td>
                    <td className="py-4 px-5 font-bold">
                      <div className="flex items-center space-x-2">
                        <div className="w-12 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full ${isFraud ? "bg-rose-500" : isSuspicious ? "bg-amber-500" : "bg-emerald-500"}`}
                            style={{ width: `${scan.riskScore}%` }}
                          />
                        </div>
                        <span className="text-slate-400 font-mono text-[10px]">{scan.riskScore}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-5">{statusBadge}</td>
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => onSelectScan(scan)}
                          title="Load scorecard"
                          className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/40 hover:border-indigo-500/50 hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-400 cursor-pointer transition-colors duration-150"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteScan(scan.id)}
                          title="Delete record"
                          className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/40 hover:border-rose-500/50 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 cursor-pointer transition-colors duration-150"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center text-xs text-slate-500 font-medium font-mono">
          No job offer scans found matching filters in verification logs.
        </div>
      )}
    </div>
  );
}
